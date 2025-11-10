// app/api/admin/add-worker/route.ts
// Utility endpoint to add a worker to the system
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore, ensureFirebaseInitialized } from "@/lib/firebaseAdmin.server";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    // Ensure Firebase is initialized before using adminFirestore
    const initResult = await ensureFirebaseInitialized();
    if (!initResult.success || !adminFirestore) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
    }

    // Check if user is superuser (for security)
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
    // Only superadmin can add workers (not regular admin)
    const isSuperAdmin = currentRole === "superadmin";

    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Only superadmins can add workers" }, { status: 403 });
    }

    const body = await req.json();
    const { uid, name, email, role } = body;

    if (!uid || !name || !role) {
      return NextResponse.json(
        { error: "Missing required fields: uid, name, role" },
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
    const existingDoc = await adminFirestore.collection("admins").doc(uid).get();
    if (existingDoc.exists) {
      const existingData = existingDoc.data();
      return NextResponse.json({
        success: true,
        message: "Worker already exists",
        worker: {
          uid,
          name: existingData?.name || name,
          email: existingData?.email || email || "",
          role: existingData?.role || role,
        },
      });
    }

    // Add worker to Firestore
    await adminFirestore.collection("admins").doc(uid).set({
      name,
      email: email || "",
      role,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: "Worker added successfully",
      worker: {
        uid,
        name,
        email: email || "",
        role,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to add worker", message: String(err?.message || err) },
      { status: 500 }
    );
  }
}

