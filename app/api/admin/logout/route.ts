// app/api/admin/logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.headers.append("Set-Cookie", `va_admin_session=; Path=/; HttpOnly; Max-Age=0`);
  return res;
}
