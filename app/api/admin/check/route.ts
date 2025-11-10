// app/api/admin/check/route.ts
// Lightweight endpoint to check if a user is an admin/worker
// Returns 200 with status, never 403, to avoid console errors for regular customers
import { NextResponse } from "next/server";
import { adminAuth, ensureFirebaseInitialized } from "@/lib/firebaseAdmin.server";
import { initializeMongoDB } from "@/lib/mongodb.server";
import { getAdminByUid } from "@/lib/admins-mongodb";

export async function POST(req: Request) {
  try {
    // Ensure Firebase is initialized (for token verification)
    // If initialization fails, return false (not admin) instead of error to allow login flow
    try {
      const initResult = await ensureFirebaseInitialized();
      if (!initResult.success || !adminAuth) {
        console.warn("Firebase not initialized in admin/check, returning isAdmin: false");
        return NextResponse.json({ 
          isAdmin: false
        }, { status: 200 }); // Return 200 to avoid blocking login
      }
    } catch (initError) {
      console.error("Firebase initialization error in admin/check:", initError);
      return NextResponse.json({ 
        isAdmin: false
      }, { status: 200 }); // Return 200 to avoid blocking login
    }

    // Initialize MongoDB (fail silently if not available)
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      console.warn("MongoDB not initialized in admin/check, returning isAdmin: false");
      return NextResponse.json({ 
        isAdmin: false
      }, { status: 200 });
    }

    const body = await req.json().catch(() => ({}));
    if (!body?.idToken) {
      return NextResponse.json({ 
        isAdmin: false,
        error: "Missing idToken" 
      }, { status: 400 });
    }

    // Verify idToken
    let decoded: any;
    try {
      decoded = await adminAuth.verifyIdToken(body.idToken);
    } catch (err) {
      // Invalid token - not an admin
      return NextResponse.json({ 
        isAdmin: false 
      }, { status: 200 }); // Return 200 to avoid console errors
    }

    const uid = decoded?.uid;
    if (!uid) {
      return NextResponse.json({ 
        isAdmin: false 
      }, { status: 200 });
    }

    // Check if user exists in MongoDB admins collection
    try {
      const adminData = await getAdminByUid(uid);
      
      if (!adminData) {
        // User is not an admin - return success with isAdmin: false
        return NextResponse.json({ 
          isAdmin: false 
        }, { status: 200 });
      }

      // Map MongoDB role to system role (same mapping as /api/admin/login)
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

      // User is an admin/worker
      return NextResponse.json({
        isAdmin: true,
        user: {
          username: uid,
          role: role,
          name: decoded.name || adminData.name || decoded.email?.split("@")[0] || "Admin",
        },
      }, { status: 200 });
    } catch (err) {
      // Database error - assume not admin
      console.error("Error checking admin in MongoDB:", err);
      return NextResponse.json({ 
        isAdmin: false 
      }, { status: 200 });
    }
  } catch (err: any) {
    // Any error - assume not admin
    return NextResponse.json({ 
      isAdmin: false 
    }, { status: 200 });
  }
}

