// app/api/admin/workers/[uid]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminByUid, getAdminByEmail, updateAdmin, updateAdminByEmail, deleteAdmin, deleteAdminByEmail } from "@/lib/admins-mongodb";
import { initializeMongoDB } from "@/lib/mongodb.server";
import { requireAdmin } from "@/lib/admin-auth-server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ uid: string }>; // uid param is now email
}

// PATCH - Update worker role
export async function PATCH(
  req: NextRequest,
  { params }: RouteParams
) {
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
    // Only superadmin can update workers (not regular admin)
    const isSuperAdmin = currentRole === "superadmin";

    if (!isSuperAdmin) {
      return NextResponse.json({ success: false, error: "Only superadmins can update workers" }, { status: 403 });
    }

    const { uid } = await params; // uid param is actually email now
    const email = decodeURIComponent(uid);
    
    if (!email || email.trim() === "") {
      return NextResponse.json({ success: false, error: "Worker email is required" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: "Invalid email format" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json({ success: false, error: "Invalid JSON in request body" }, { status: 400 });
    }

    const { role, name } = body;
    
    // Check if worker exists by email
    const existingWorker = await getAdminByEmail(normalizedEmail);
    if (!existingWorker) {
      return NextResponse.json({ success: false, error: "Worker not found" }, { status: 404 });
    }

    // Prevent self-demotion (superuser can't demote themselves)
    // Check both email and uid for backward compatibility
    if ((normalizedEmail === username || existingWorker.uid === username) && role && role !== "superadmin" && role !== "admin") {
      return NextResponse.json(
        { success: false, error: "You cannot demote yourself" },
        { status: 400 }
      );
    }

    // Validate role if provided
    if (role !== undefined && role !== null && role !== "") {
      const validRoles = ["superadmin", "admin", "worker"];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { success: false, error: `Invalid role. Must be one of: ${validRoles.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};

    // Always include role if provided (even if it's the same)
    if (role !== undefined && role !== null && role !== "") {
      updateData.role = role as "superadmin" | "admin" | "worker";
    }
    if (name !== undefined && name !== null && name.trim() !== "") {
      updateData.name = name.trim();
    }

    // Validate that at least one field is being updated
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one field (name or role) must be provided" },
        { status: 400 }
      );
    }

    // Update worker in MongoDB by email
    const updatedWorker = await updateAdminByEmail(normalizedEmail, updateData);

    if (!updatedWorker) {
      return NextResponse.json(
        { success: false, error: "Failed to update worker" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Worker updated successfully",
      worker: {
        uid: updatedWorker.uid,
        name: updatedWorker.name || "",
        email: updatedWorker.email || "",
        role: updatedWorker.role || "worker",
      },
    });
  } catch (err: any) {
    let uid = "unknown";
    try {
      const resolvedParams = await params;
      uid = resolvedParams.uid;
    } catch {
      // If params can't be resolved, use unknown
    }
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to update worker", 
        message: String(err?.message || err),
        details: process.env.NODE_ENV === "development" ? err.stack : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE - Remove worker
export async function DELETE(
  req: NextRequest,
  { params }: RouteParams
) {
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
    // Only superadmin can delete workers (not regular admin)
    const isSuperAdmin = currentRole === "superadmin";

    if (!isSuperAdmin) {
      return NextResponse.json({ success: false, error: "Only superadmins can delete workers" }, { status: 403 });
    }

    const { uid } = await params; // uid param is actually email now
    const email = decodeURIComponent(uid);
    
    if (!email || email.trim() === "") {
      return NextResponse.json({ success: false, error: "Worker email is required" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: "Invalid email format" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if worker exists by email
    const existingWorker = await getAdminByEmail(normalizedEmail);
    if (!existingWorker) {
      return NextResponse.json({ success: false, error: "Worker not found" }, { status: 404 });
    }

    // Prevent self-deletion (check both email and uid for backward compatibility)
    if (normalizedEmail === username || existingWorker.uid === username) {
      return NextResponse.json(
        { success: false, error: "You cannot delete yourself" },
        { status: 400 }
      );
    }

    // Delete worker from MongoDB by email
    const deleted = await deleteAdminByEmail(normalizedEmail);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Failed to delete worker" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Worker deleted successfully",
    });
  } catch (err: any) {
    let uid = "unknown";
    try {
      const resolvedParams = await params;
      uid = resolvedParams.uid;
    } catch {
      // If params can't be resolved, use unknown
    }
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to delete worker", 
        message: String(err?.message || err),
        details: process.env.NODE_ENV === "development" ? err.stack : undefined
      },
      { status: 500 }
    );
  }
}

