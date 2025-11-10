// app/api/admin/check/route.ts
// Lightweight endpoint to check if a user is an admin/worker
// Returns 200 with status, never 403, to avoid console errors for regular customers
import { NextResponse } from "next/server";
import { adminAuth, adminFirestore, ensureFirebaseInitialized } from "@/lib/firebaseAdmin.server";

export async function POST(req: Request) {
  try {
    // Ensure Firebase is initialized before using adminAuth/adminFirestore
    // If initialization fails, return false (not admin) instead of error to allow login flow
    try {
      const initResult = await ensureFirebaseInitialized();
      if (!initResult.success || !adminAuth || !adminFirestore) {
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

    // Check if user exists in admins collection
    try {
      const adminDocSnap = await adminFirestore.collection("admins").doc(uid).get();
      
      if (!adminDocSnap.exists) {
        // User is not an admin - return success with isAdmin: false
        return NextResponse.json({ 
          isAdmin: false 
        }, { status: 200 });
      }

      const adminData = adminDocSnap.data();
      if (!adminData) {
        return NextResponse.json({ 
          isAdmin: false 
        }, { status: 200 });
      }

      // Map Firestore role to system role (same mapping as /api/admin/login)
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

