// app/api/admin/login/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { initializeMongoDB } from "@/lib/mongodb.server";
import { getMongoDB } from "@/lib/mongodb.server";
import { logger } from "@/lib/logger";
import { rateLimiters } from "@/lib/rate-limit";

// Mark route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    // Rate limiting for admin login
    const rateLimitResult = rateLimiters.strict(req);
    if (!rateLimitResult.allowed) {
      logger.warn("Admin login rate limit exceeded", { ip: req.headers.get("x-forwarded-for") });
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(rateLimitResult.resetTime).toISOString(),
          },
        }
      );
    }

    // Get NextAuth session
    const session = await auth();
    
    // Log session status for debugging (only in development)
    if (process.env.NODE_ENV === "development") {
      logger.info("Admin login attempt", {
        hasSession: !!session,
        hasUser: !!session?.user,
        hasEmail: !!session?.user?.email,
        email: session?.user?.email || "none",
        userId: session?.user?.id || "none",
      });
    }
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        error: "Not authenticated", 
        message: "Please sign in with Google first. Make sure you complete the Google OAuth flow." 
      }, { status: 401 });
    }

    // Initialize MongoDB for admin role checking
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      logger.error("MongoDB initialization failed in admin/login", { error: mongoInit.error });
      return NextResponse.json({ 
        error: "Database unavailable", 
        message: "Admin database is temporarily unavailable. Please try again later." 
      }, { status: 503 });
    }

    const db = getMongoDB();
    if (!db) {
      return NextResponse.json({ 
        error: "Database unavailable", 
        message: "Admin database is temporarily unavailable. Please try again later." 
      }, { status: 503 });
    }

    // Find admin by email (case-insensitive)
    // MongoDB doesn't support case-insensitive queries by default, so we'll search with regex
    const userEmail = session.user.email?.toLowerCase().trim();
    const adminData = await db.collection("Admin").findOne({
      email: { $regex: new RegExp(`^${userEmail}$`, "i") },
    });
    
    // Log for debugging (only in development)
    if (process.env.NODE_ENV === "development") {
      logger.info("Admin login check", {
        userEmail: session.user.email,
        normalizedEmail: userEmail,
        adminFound: !!adminData,
        adminEmail: adminData?.email,
      });
    }

    // SECURITY: User must be manually added by superadmin - no auto-creation
    if (!adminData) {
      logger.warn("Unauthorized admin login attempt", {
        email: session.user.email,
      });
      
      return NextResponse.json({ 
        error: "Access denied. Your account is not registered as an organizer (worker, admin, or superadmin). Please contact a superadmin to add your account to the system." 
      }, { status: 403 });
    }

    // Map MongoDB role to system role
    // superadmin -> superuser (full access)
    // admin -> admin (limited access, no workers management)
    // worker -> worker (very limited access)
    let role: string = adminData.role || "worker";
    if (role === "superadmin") {
      role = "superuser";
    } else if (role === "admin") {
      role = "admin"; // Keep as admin (not superuser)
    }
    // worker stays as worker

    // Return user object for client
    const user = {
      username: adminData.uid || session.user.id || session.user.email,
      role: role, // Mapped role: "superuser", "admin", or "worker"
      name: adminData.name || session.user.name || session.user.email?.split("@")[0] || "Admin",
    };

    // Log for debugging (only in development)
    if (process.env.NODE_ENV === "development") {
      logger.info("Admin login successful", {
        email: session.user.email,
        mongoRole: adminData.role,
        mappedRole: role,
      });
    }

    return NextResponse.json({
      ok: true,
      user: user,
      // Include original MongoDB role in response for debugging (only in development)
      ...(process.env.NODE_ENV === "development" && {
        debug: {
          mongoRole: adminData.role,
          mappedRole: role,
        },
      }),
    });
  } catch (err: any) {
    logger.error("Admin login error", { error: err?.message || String(err) });
    return NextResponse.json({ error: "Unexpected server error", message: String(err?.message || err) }, { status: 500 });
  }
}
