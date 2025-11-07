// app/api/admin/debug/route.ts
import { NextResponse } from "next/server";
import { adminAuth, adminFirestore } from "@/lib/firebaseAdmin.server";

export async function GET() {
  try {
    return NextResponse.json({
      ok: true,
      adminAuth: !!adminAuth,
      adminFirestore: !!adminFirestore,
      env: {
        hasGoogleCredPath: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
        hasServiceJson: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
        hasAdminSecret: !!process.env.ADMIN_SESSION_SECRET,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
