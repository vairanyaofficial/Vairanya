// app/api/admin/login/route.ts
import { NextResponse } from "next/server";
import { adminAuth, adminFirestore } from "@/lib/firebaseAdmin.server";

export async function POST(req: Request) {
  try {
    // Check if Firebase Admin is properly initialized
    if (!adminAuth) {
      console.error("[Admin Login] Firebase Admin Auth not initialized");
      return NextResponse.json({ 
        error: "Server configuration error", 
        message: "Authentication service is not properly configured. Please contact support." 
      }, { status: 500 });
    }
    if (!adminFirestore) {
      console.error("[Admin Login] Firebase Admin Firestore not initialized");
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
      console.error("[Admin Login] verifyIdToken error:", {
        errorCode: err?.code,
        errorMessage: errorMessage,
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
      // Log failed login attempt for security monitoring (without sensitive data)
      console.warn(`[SECURITY] Unauthorized login attempt - UID: ${uid.substring(0, 8)}..., Email: ${decoded.email || 'N/A'}`);
      
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
