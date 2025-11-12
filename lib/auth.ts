// lib/auth.ts
// Server-side auth utility for NextAuth v5
import { authOptions } from "@/lib/auth.config";
import NextAuth from "next-auth";

// Create handler instance for auth function
const handler = NextAuth(authOptions);

// Export auth function for server-side usage
export const auth = handler.auth;

