import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { initializeMongoDB } from "@/lib/mongodb.server";
import { getMongoDB } from "@/lib/mongodb.server";

export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ isAdmin: false });
    }

    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      return NextResponse.json({ isAdmin: false });
    }

    const db = getMongoDB();
    if (!db) {
      return NextResponse.json({ isAdmin: false });
    }

    // Find admin by email (case-insensitive)
    const userEmail = session.user.email?.toLowerCase().trim();
    const admin = await db.collection("Admin").findOne({
      email: { $regex: new RegExp(`^${userEmail}$`, "i") },
    });

    if (!admin) {
      return NextResponse.json({ isAdmin: false });
    }

    // Map role
    let role = admin.role;
    if (role === "superadmin") {
      role = "superuser";
    }

    return NextResponse.json({
      isAdmin: true,
      user: {
        id: session.user.id,
        uid: admin.uid || session.user.id,
        email: session.user.email,
        name: admin.name || session.user.name,
        role: role,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ isAdmin: false });
  }
}

