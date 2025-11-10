// app/api/admin/workers/[uid]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore, ensureFirebaseInitialized } from "@/lib/firebaseAdmin.server";
import { FieldValue } from "firebase-admin/firestore";

interface RouteParams {
  params: Promise<{ uid: string }>;
}

// PATCH - Update worker role
export async function PATCH(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    // Ensure Firebase is initialized before using adminFirestore
    const initResult = await ensureFirebaseInitialized();
    if (!initResult.success || !adminFirestore) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
    }

    // Check if user is superuser
    const username = req.headers.get("x-admin-username");
    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserDoc = await adminFirestore.collection("admins").doc(username).get();
    if (!currentUserDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentUserData = currentUserDoc.data();
    const currentRole = currentUserData?.role || "worker";
    // Only superadmin can update workers (not regular admin)
    const isSuperAdmin = currentRole === "superadmin";

    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Only superadmins can update workers" }, { status: 403 });
    }

    const { uid } = await params;
    
    if (!uid || uid.trim() === "") {
      return NextResponse.json({ error: "Worker UID is required" }, { status: 400 });
    }

    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const { role, name, email } = body;
    
    // Check if worker exists
    const workerDoc = await adminFirestore.collection("admins").doc(uid).get();
    if (!workerDoc.exists) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    // Prevent self-demotion (superuser can't demote themselves)
    if (uid === username && role && role !== "superadmin" && role !== "admin") {
      return NextResponse.json(
        { error: "You cannot demote yourself" },
        { status: 400 }
      );
    }

    // Validate role if provided
    if (role !== undefined && role !== null && role !== "") {
      const validRoles = ["superadmin", "admin", "worker"];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: `Invalid role. Must be one of: ${validRoles.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Always include role if provided (even if it's the same)
    if (role !== undefined && role !== null && role !== "") {
      updateData.role = role;
    }
    if (name !== undefined && name !== null && name.trim() !== "") {
      updateData.name = name.trim();
    }
    if (email !== undefined && email !== null) {
      updateData.email = email.trim() === "" ? "" : email.trim();
    }

    // Validate that at least one field is being updated
    if (Object.keys(updateData).length === 1) {
      return NextResponse.json(
        { error: "At least one field (name, email, or role) must be provided" },
        { status: 400 }
      );
    }

    await adminFirestore.collection("admins").doc(uid).update(updateData);

    const updatedDoc = await adminFirestore.collection("admins").doc(uid).get();
    const updatedData = updatedDoc.data();

    if (!updatedData) {
      return NextResponse.json(
        { error: "Failed to retrieve updated worker data" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Worker updated successfully",
      worker: {
        uid,
        name: updatedData.name || "",
        email: updatedData.email || "",
        role: updatedData.role || "worker",
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
    // Ensure Firebase is initialized before using adminFirestore
    const initResult = await ensureFirebaseInitialized();
    if (!initResult.success || !adminFirestore) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
    }

    // Check if user is superuser
    const username = req.headers.get("x-admin-username");
    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserDoc = await adminFirestore.collection("admins").doc(username).get();
    if (!currentUserDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentUserData = currentUserDoc.data();
    const currentRole = currentUserData?.role || "worker";
    // Only superadmin can delete workers (not regular admin)
    const isSuperAdmin = currentRole === "superadmin";

    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Only superadmins can delete workers" }, { status: 403 });
    }

    const { uid } = await params;
    
    if (!uid || uid.trim() === "") {
      return NextResponse.json({ error: "Worker UID is required" }, { status: 400 });
    }

    // Prevent self-deletion
    if (uid === username) {
      return NextResponse.json(
        { error: "You cannot delete yourself" },
        { status: 400 }
      );
    }

    // Check if worker exists
    const workerDoc = await adminFirestore.collection("admins").doc(uid).get();
    if (!workerDoc.exists) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    // Delete worker
    await adminFirestore.collection("admins").doc(uid).delete();

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
        error: "Failed to delete worker", 
        message: String(err?.message || err),
        details: process.env.NODE_ENV === "development" ? err.stack : undefined
      },
      { status: 500 }
    );
  }
}

