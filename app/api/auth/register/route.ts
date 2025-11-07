import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { syncCustomerToFirestore } from "@/lib/customer-sync";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = (body.name || "").toString().trim();
    const email = (body.email || "").toString().toLowerCase().trim();
    const password = (body.password || "").toString();
    const phone = (body.phone || "").toString();

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ success: false, error: "Email already in use" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, phone, passwordHash },
    });

    // Sync customer to Firestore
    try {
      await syncCustomerToFirestore(email, name, phone || undefined, user.id);
    } catch (syncError) {
      // Log but don't fail registration if sync fails
      console.error("Failed to sync customer to Firestore:", syncError);
    }

    return NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email } }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Registration failed" }, { status: 500 });
  }
}


