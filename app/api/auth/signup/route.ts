import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { syncCustomerToFirestore } from "@/lib/customer-sync";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();
    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ success: false, error: "Email already registered" }, { status: 409 });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { name, email, passwordHash } });
    
    // Sync customer to Firestore
    try {
      await syncCustomerToFirestore(email, name, undefined, user.id);
    } catch (syncError) {
      // Log but don't fail registration if sync fails
      console.error("Failed to sync customer to Firestore:", syncError);
    }
    
    return NextResponse.json({ success: true, user: { id: user.id, name, email } }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || "Signup failed" }, { status: 500 });
  }
}


