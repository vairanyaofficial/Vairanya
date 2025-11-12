// lib/auth.config.ts
import type { NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { initializeMongoDB } from "@/lib/mongodb.server";
import { getMongoDB } from "@/lib/mongodb.server";
import bcrypt from "bcryptjs";

// Check if Google OAuth is configured
const hasGoogleOAuth = 
  process.env.GOOGLE_CLIENT_ID && 
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CLIENT_ID.trim() !== "" &&
  process.env.GOOGLE_CLIENT_SECRET.trim() !== "";

export const authOptions: NextAuthConfig = {
  providers: [
    // Only include Google provider if credentials are configured
    ...(hasGoogleOAuth ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        authorization: {
          params: {
            prompt: "select_account",
          },
        },
      }),
    ] : []),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const mongoInit = await initializeMongoDB();
        if (!mongoInit.success) {
          return null;
        }

        const db = getMongoDB();
        if (!db) {
          return null;
        }

        // Check customers collection for email/password
        const customer = await db.collection("customers").findOne({
          email: credentials.email,
        });

        if (customer && customer.password) {
          const isValid = await bcrypt.compare(
            credentials.password,
            customer.password
          );
          if (isValid) {
            return {
              id: customer._id?.toString() || customer.email,
              email: customer.email,
              name: customer.name || customer.email.split("@")[0],
              image: customer.photoURL,
            };
          }
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Sync user to MongoDB on sign-in
      if (user.email) {
        try {
          const mongoInit = await initializeMongoDB();
          if (!mongoInit.success) {
            return true; // Allow sign-in even if sync fails
          }

          const db = getMongoDB();
          if (!db) {
            return true;
          }

          // Sync customer to MongoDB
          await db.collection("customers").updateOne(
            { email: user.email },
            {
              $set: {
                email: user.email,
                name: user.name || user.email.split("@")[0],
                photoURL: user.image,
                updatedAt: new Date(),
              },
              $setOnInsert: {
                createdAt: new Date(),
              },
            },
            { upsert: true }
          );
        } catch (error) {
          // Log error but don't block sign-in
        }
      }
      return true;
    },
    async jwt({ token, user, account, profile }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;

        // Check if user is admin
        if (user.email) {
          try {
            const mongoInit = await initializeMongoDB();
            if (mongoInit.success) {
              const db = getMongoDB();
              if (db) {
                // Find admin by email (case-insensitive)
                const userEmail = user.email?.toLowerCase().trim();
                const admin = await db.collection("Admin").findOne({
                  email: { $regex: new RegExp(`^${userEmail}$`, "i") },
                });

                if (admin) {
                  token.role = admin.role === "superadmin" ? "superuser" : admin.role;
                  token.adminName = admin.name;
                  token.uid = admin.uid || user.id;
                }
              }
            }
          } catch (error) {
            // Ignore errors
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string | undefined;
        session.user.adminName = token.adminName as string | undefined;
        session.user.uid = token.uid as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

