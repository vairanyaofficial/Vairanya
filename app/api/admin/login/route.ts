// app/api/admin/login/route.ts
import { NextResponse } from "next/server";
import { adminAuth, adminFirestore } from "@/lib/firebaseAdmin.server";
import { logger } from "@/lib/logger";
import { rateLimiters } from "@/lib/rate-limit";

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

    // Check if Firebase Admin is properly initialized
    if (!adminAuth) {
      logger.error("Firebase Admin Auth not initialized");
      return NextResponse.json({ 
        error: "Server configuration error", 
        message: "Authentication service is not properly configured. Please contact support." 
      }, { status: 500 });
    }
    if (!adminFirestore) {
      return NextResponse.json({ 
        error: "Server configuration error", 
        message: "Database service is not properly configured. Please contact support." 
      }, { status: 500 });
    }

    const body = await req.json().catch((e) => ({ __parseError: String(e) }));
    if (!body || !body.idToken) return NextResponse.json({ error: "Missing idToken", body }, { status: 400 });

    // verify idToken
    let decoded: any;
    try {
      decoded = await adminAuth.verifyIdToken(body.idToken);
    } catch (err: any) {
      // Log detailed error for debugging (remove sensitive info in production)
      const errorMessage = err?.message || String(err);
      logger.error("Admin login verifyIdToken error", err, {
        errorCode: err?.code,
        hasToken: !!body.idToken,
        tokenLength: body.idToken?.length,
      });
      
      // Provide more helpful error messages
      let userMessage = "Authentication failed";
      if (errorMessage.includes("auth/id-token-expired")) {
        userMessage = "Your session has expired. Please sign in again.";
      } else if (errorMessage.includes("auth/argument-error")) {
        userMessage = "Invalid authentication token. Please try signing in again.";
      } else if (errorMessage.includes("auth/id-token-revoked")) {
        userMessage = "Your session was revoked. Please sign in again.";
      }
      
      return NextResponse.json({ 
        error: "verifyIdToken failed", 
        message: userMessage,
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined
      }, { status: 401 });
    }

    const uid = decoded?.uid;
    if (!uid) return NextResponse.json({ error: "Token missing uid", decoded }, { status: 401 });

    // read admin doc from Firestore
    let adminDocSnap;
    try {
      adminDocSnap = await adminFirestore.collection("admins").doc(uid).get();
    } catch (err: any) {
      return NextResponse.json({ error: "Firestore read failed", message: String(err?.message || err) }, { status: 500 });
    }

    // SECURITY: User must be manually added by superadmin - no auto-creation
    if (!adminDocSnap.exists) {
      // Only log as security warning if this is an actual login attempt (not just a check)
      // Check if this is a customer login check (has X-Check-Only header)
      const isCheckOnly = req.headers.get("X-Check-Only") === "true";
      
      if (!isCheckOnly) {
        // Log failed login attempt for security monitoring (without sensitive data)
        logger.warn("Unauthorized admin login attempt", {
          uid: uid.substring(0, 8) + "...",
          email: decoded.email || "N/A",
        });
      }
      
      return NextResponse.json({ 
        error: "Access denied. Your account is not registered as an admin. Please contact a superadmin to grant you access." 
      }, { status: 403 });
    }

    const adminData = adminDocSnap.data();
    if (!adminData) {
      return NextResponse.json({ error: "Admin data not found" }, { status: 403 });
    }

    // Map Firestore role to system role
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
      username: uid, // Use UID as username
      role: role,
      name: decoded.name || adminData.name || decoded.email?.split("@")[0] || "Admin",
    };

    return NextResponse.json({
      ok: true,
      user: user,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Unexpected server error", message: String(err?.message || err) }, { status: 500 });
  }
}
