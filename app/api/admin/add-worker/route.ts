// app/api/admin/add-worker/route.ts
// Utility endpoint to add a worker to the system
import { NextRequest, NextResponse } from "next/server";
import { initializeMongoDB, getMongoDB } from "@/lib/mongodb.server";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // Initialize MongoDB
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
    }

    const db = getMongoDB();
    if (!db) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
    }

    // Check if user is superuser (for security)
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check current user's role
    const currentAdmin = await db.collection("Admin").findOne({ email: session.user.email });
    if (!currentAdmin) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentRole = currentAdmin.role || "worker";
    // Only superadmin can add workers (not regular admin)
    const isSuperAdmin = currentRole === "superadmin";
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "Only superadmin can add workers" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { uid, name, email, role } = body;

    if (!uid || !name || !email || !role) {
      return NextResponse.json(
        { error: "Missing required fields: uid, name, email, role" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["superadmin", "admin", "worker"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(", ")}` },
        { status: 400 }
      );
    }

    // Check if worker already exists
    const existing = await db.collection("Admin").findOne({ uid });
    if (existing) {
      return NextResponse.json(
        { error: "Worker already exists", existing },
        { status: 409 }
      );
    }

    // Add worker to MongoDB
    const now = new Date();
    await db.collection("Admin").insertOne({
      uid,
      name,
      email,
      role,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      message: "Worker added successfully",
      worker: { uid, name, email, role },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to add worker" },
      { status: 500 }
    );
  }
}
