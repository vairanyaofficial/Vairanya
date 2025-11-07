// app/api/admin/me/route.ts
import { NextResponse } from "next/server";
import { verifyServerAuth } from "@/lib/admin-auth-server";

export async function GET(req: Request) {
  try {
    const s = verifyServerAuth(req);
    if (!s.authenticated) return NextResponse.json({ authenticated: false }, { status: 401 });
    return NextResponse.json({ authenticated: true, user: { uid: s.uid, role: s.role, name: s.name } });
  } catch (err: any) {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
