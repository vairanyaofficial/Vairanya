// app/api/admin/workers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAllAdmins, getAdminByUid, getAdminByEmail } from "@/lib/admins-mongodb";
import { initializeMongoDB } from "@/lib/mongodb.server";
import { requireAdmin } from "@/lib/admin-auth-server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - Fetch all workers/admins
export async function GET(req: NextRequest) {
  try {
    // Initialize MongoDB connection
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 503 }
      );
    }

    // Check authentication
    const auth = requireAdmin(req);
    if (!auth.authenticated || !auth.uid) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const username = auth.uid; // uid is the username in this context
    if (!username) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is superuser by checking their admin doc
    const currentUser = await getAdminByUid(username);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const currentRole = currentUser.role || "worker";
    // Only superadmin can view/manage workers (not regular admin)
    const isSuperAdmin = currentRole === "superadmin";

    if (!isSuperAdmin) {
      return NextResponse.json({ success: false, error: "Only superadmins can view workers" }, { status: 403 });
    }

    // Fetch all admins/workers from MongoDB
    const admins = await getAllAdmins();

    // Map to expected format
    const workers = admins.map((admin) => ({
      uid: admin.uid,
      name: admin.name || "",
      email: admin.email || "",
      role: admin.role || "worker",
      createdAt: admin.createdAt ? admin.createdAt.toISOString() : null,
    }));

    return NextResponse.json({
      success: true,
      workers,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch workers", message: String(err?.message || err) },
      { status: 500 }
    );
  }
}

// POST - Add new worker/admin
export async function POST(req: NextRequest) {
  try {
    // Initialize MongoDB connection
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      return NextResponse.json({ success: false, error: "Database unavailable" }, { status: 500 });
    }

    // Check authentication
    const auth = requireAdmin(req);
    if (!auth.authenticated || !auth.uid) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const username = auth.uid; // uid is the username in this context
    if (!username) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is superuser
    const currentUser = await getAdminByUid(username);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const currentRole = currentUser.role || "worker";
    // Only superadmin can add workers (not regular admin)
    const isSuperAdmin = currentRole === "superadmin";

    if (!isSuperAdmin) {
      return NextResponse.json({ success: false, error: "Only superadmins can add workers" }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, role } = body;

    if (!email || !name || !role) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: email, name, role" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["superadmin", "admin", "worker"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: `Invalid role. Must be one of: ${validRoles.join(", ")}` },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if worker already exists by email
    const existingAdmin = await getAdminByEmail(normalizedEmail);
    if (existingAdmin) {
      return NextResponse.json({ success: false, error: "Worker already exists with this email" }, { status: 409 });
    }

    // Use email as uid (for backward compatibility, uid field still exists but equals email)
    const { upsertAdmin } = await import("@/lib/admins-mongodb");
    const newWorker = await upsertAdmin({
      uid: normalizedEmail, // Use email as uid
      name,
      email: normalizedEmail,
      role: role as "superadmin" | "admin" | "worker",
    });

    return NextResponse.json({
      success: true,
      message: "Worker added successfully",
      worker: {
        uid: newWorker.uid,
        name: newWorker.name,
        email: newWorker.email,
        role: newWorker.role,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to add worker", message: String(err?.message || err) },
      { status: 500 }
    );
  }
}

