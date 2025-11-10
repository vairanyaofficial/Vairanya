// app/api/admin/debug/route.ts
import { NextResponse } from "next/server";
import { adminAuth, adminFirestore, ensureFirebaseInitialized, getFirebaseDiagnostics } from "@/lib/firebaseAdmin.server";

export async function GET() {
  try {
    // Ensure Firebase is initialized
    const initResult = await ensureFirebaseInitialized();
    const diagnostics = getFirebaseDiagnostics();
    
    return NextResponse.json({
      ok: true,
      initialized: initResult.success,
      initializationError: initResult.success ? null : (initResult as { success: false; error: string }).error,
      adminAuth: !!adminAuth,
      adminFirestore: !!adminFirestore,
      diagnostics: diagnostics,
      env: {
        hasGoogleCredPath: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
        hasServiceJson: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
        hasServiceJsonB64: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON_B64,
        hasAdminSecret: !!process.env.ADMIN_SESSION_SECRET,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
