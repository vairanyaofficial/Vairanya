// app/api/admin/get-my-uid/route.ts
// Helper endpoint to get the current user's Firebase UID
// This helps users find their UID to add themselves as admin
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, ensureFirebaseInitialized } from "@/lib/firebaseAdmin.server";

export async function GET(request: NextRequest) {
  try {
    // Ensure Firebase is initialized
    const initResult = await ensureFirebaseInitialized();
    if (!initResult.success || !adminAuth) {
      return NextResponse.json(
        { success: false, error: "Auth service unavailable" },
        { status: 500 }
      );
    }

    // Get token from Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Missing authorization token",
          instructions: "Sign in with Google first, then call this endpoint with your Firebase ID token"
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    try {
      // Verify token and get user info
      const decoded = await adminAuth.verifyIdToken(token);
      
      return NextResponse.json({
        success: true,
        uid: decoded.uid,
        email: decoded.email || null,
        name: decoded.name || null,
        instructions: {
          step1: "Copy your UID above",
          step2: "Open scripts/add-worker.ts",
          step3: "Update WORKER_UID with your UID",
          step4: "Update WORKER_NAME and WORKER_EMAIL",
          step5: "Set WORKER_ROLE to 'superadmin' (for first admin)",
          step6: "Run: npx tsx scripts/add-worker.ts",
        }
      });
    } catch (err: any) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid token",
          message: err?.message || "Token verification failed"
        },
        { status: 401 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: "Server error",
        message: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}

