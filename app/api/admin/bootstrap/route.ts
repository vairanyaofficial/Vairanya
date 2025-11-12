// app/api/admin/bootstrap/route.ts
// Bootstrap endpoint to add the first admin user
// This endpoint is only accessible when there are no admins in the database
// Usage: POST /api/admin/bootstrap with { email, name, role? }

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

    // Check if any admins exist
    const adminCount = await db.collection("Admin").countDocuments();
    
    // Only allow bootstrap if no admins exist (for security)
    if (adminCount > 0) {
      return NextResponse.json(
        { error: "Bootstrap is only available when no admins exist. Please use the admin panel to add new admins." },
        { status: 403 }
      );
    }

    // Get user session (user must be authenticated via NextAuth)
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized. Please sign in first." }, { status: 401 });
    }

    const body = await req.json();
    const { email, name, role, uid } = body;

    // Validate required fields
    if (!email || !name) {
      return NextResponse.json(
        { error: "Missing required fields: email, name" },
        { status: 400 }
      );
    }

    // Use authenticated user's email if not provided
    const adminEmail = email || session.user.email;
    const adminName = name || session.user.name || session.user.email?.split("@")[0] || "Admin";
    const adminRole = role || "superadmin";
    const adminUid = uid || session.user.id || session.user.email;

    // Validate role
    const validRoles = ["superadmin", "admin", "worker"];
    if (!validRoles.includes(adminRole)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(", ")}` },
        { status: 400 }
      );
    }

    // Check if admin already exists (should not happen if count is 0, but double-check)
    const existingAdmin = await db.collection("Admin").findOne({ email: adminEmail });
    if (existingAdmin) {
      return NextResponse.json(
        { error: "Admin with this email already exists" },
        { status: 409 }
      );
    }

    // Create first admin
    const now = new Date();
    await db.collection("Admin").insertOne({
      email: adminEmail,
      name: adminName,
      role: adminRole,
      uid: adminUid,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      message: "First admin created successfully",
      admin: {
        email: adminEmail,
        name: adminName,
        role: adminRole,
        uid: adminUid,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to bootstrap admin" },
      { status: 500 }
    );
  }
}

// GET - Check if bootstrap is available (no admins exist)
export async function GET(req: NextRequest) {
  try {
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      return NextResponse.json({ available: false, error: "Database unavailable" }, { status: 500 });
    }

    const db = getMongoDB();
    if (!db) {
      return NextResponse.json({ available: false, error: "Database unavailable" }, { status: 500 });
    }

    const adminCount = await db.collection("Admin").countDocuments();
    const available = adminCount === 0;

    return NextResponse.json({
      available,
      adminCount,
      message: available
        ? "Bootstrap is available. No admins exist in the database."
        : "Bootstrap is not available. Admins already exist.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { available: false, error: error.message || "Failed to check bootstrap status" },
      { status: 500 }
    );
  }
}

