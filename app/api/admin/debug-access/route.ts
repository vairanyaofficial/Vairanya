// app/api/admin/debug-access/route.ts
// Comprehensive debug endpoint to help diagnose admin access issues
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminFirestore, ensureFirebaseInitialized, getFirebaseDiagnostics } from "@/lib/firebaseAdmin.server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { idToken } = body;

    const debug: any = {
      timestamp: new Date().toISOString(),
      firebase: {},
      authentication: {},
      adminCheck: {},
      recommendations: [],
    };

    // 1. Check Firebase initialization
    const initResult = await ensureFirebaseInitialized();
    const diagnostics = getFirebaseDiagnostics();
    
    debug.firebase = {
      initialized: initResult.success,
      error: initResult.success ? null : (initResult as { success: false; error: string }).error,
      diagnostics: diagnostics,
      hasAdminAuth: !!adminAuth,
      hasAdminFirestore: !!adminFirestore,
    };

    if (!initResult.success) {
      debug.recommendations.push("Firebase Admin SDK is not initialized. Check FIREBASE_SERVICE_ACCOUNT_JSON_B64 or FIREBASE_SERVICE_ACCOUNT_JSON environment variable.");
      return NextResponse.json({ success: false, debug }, { status: 500 });
    }

    // 2. Check authentication token
    if (!idToken) {
      debug.recommendations.push("No idToken provided. Sign in with Google first to get an idToken.");
      return NextResponse.json({ success: false, debug }, { status: 400 });
    }

    let decoded: any = null;
    try {
      decoded = await adminAuth.verifyIdToken(idToken);
      debug.authentication = {
        verified: true,
        uid: decoded.uid,
        email: decoded.email || null,
        name: decoded.name || null,
      };
    } catch (err: any) {
      debug.authentication = {
        verified: false,
        error: err?.message || String(err),
        code: err?.code || null,
      };
      debug.recommendations.push(`Token verification failed: ${err?.message}. Try signing in again.`);
      return NextResponse.json({ success: false, debug }, { status: 401 });
    }

    // 3. Check if user exists in admins collection
    const uid = decoded.uid;
    try {
      const adminDoc = await adminFirestore.collection("admins").doc(uid).get();
      
      debug.adminCheck = {
        uid: uid,
        existsInAdminsCollection: adminDoc.exists,
        adminData: adminDoc.exists ? adminDoc.data() : null,
      };

      if (!adminDoc.exists) {
        debug.recommendations.push(`User with UID "${uid}" is not in the admins collection.`);
        debug.recommendations.push(`To add yourself as admin:`);
        debug.recommendations.push(`1. Update scripts/add-worker.ts with your UID: ${uid}`);
        debug.recommendations.push(`2. Set WORKER_ROLE to "superadmin"`);
        debug.recommendations.push(`3. Run: npx tsx scripts/add-worker.ts`);
        debug.recommendations.push(`Or manually add a document in Firestore:`);
        debug.recommendations.push(`- Collection: "admins"`);
        debug.recommendations.push(`- Document ID: "${uid}"`);
        debug.recommendations.push(`- Fields: { name: "Your Name", email: "${decoded.email || ''}", role: "superadmin" }`);
        
        return NextResponse.json({ 
          success: false, 
          debug,
          message: "User is not registered as admin. See recommendations in debug object."
        }, { status: 403 });
      }

      const adminData = adminDoc.data();
      debug.adminCheck.role = adminData?.role || null;
      debug.adminCheck.mappedRole = adminData?.role === "superadmin" ? "superuser" : (adminData?.role || "worker");

      debug.recommendations.push("✅ User is registered as admin!");
      debug.recommendations.push(`Role: ${adminData?.role || "worker"}`);
      debug.recommendations.push(`You should be able to sign in to the admin dashboard.`);

      return NextResponse.json({ 
        success: true, 
        debug,
        user: {
          uid: uid,
          email: decoded.email,
          name: adminData?.name || decoded.name,
          role: adminData?.role === "superadmin" ? "superuser" : (adminData?.role || "worker"),
        }
      });
    } catch (err: any) {
      debug.adminCheck.error = err?.message || String(err);
      debug.recommendations.push(`Error checking admin collection: ${err?.message}`);
      return NextResponse.json({ success: false, debug }, { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json({ 
      success: false, 
      error: err?.message || String(err),
      debug: { error: String(err) }
    }, { status: 500 });
  }
}

