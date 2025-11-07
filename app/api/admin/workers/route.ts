// app/api/admin/workers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin.server";
import { FieldValue } from "firebase-admin/firestore";

// GET - Fetch all workers/admins
export async function GET(req: NextRequest) {
  try {
    if (!adminFirestore) {
      return NextResponse.json({ error: "Firestore not initialized" }, { status: 500 });
    }

    // Check if user is superuser (only superusers can view workers)
    const username = req.headers.get("x-admin-username");
    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is superuser by checking their admin doc
    const currentUserDoc = await adminFirestore.collection("admins").doc(username).get();
    if (!currentUserDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentUserData = currentUserDoc.data();
    const currentRole = currentUserData?.role || "worker";
    // Only superadmin can view/manage workers (not regular admin)
    const isSuperAdmin = currentRole === "superadmin";

    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Only superadmins can view workers" }, { status: 403 });
    }

    // Fetch all admins/workers
    const adminsSnapshot = await adminFirestore.collection("admins").get();
    const workers = adminsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        uid: doc.id,
        name: data.name || "",
        email: data.email || "",
        role: data.role || "worker",
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      };
    });

    return NextResponse.json({
      success: true,
      workers,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch workers", message: String(err?.message || err) },
      { status: 500 }
    );
  }
}

// POST - Add new worker/admin
export async function POST(req: NextRequest) {
  try {
    if (!adminFirestore) {
      return NextResponse.json({ error: "Firestore not initialized" }, { status: 500 });
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
      return NextResponse.json({ error: "Worker already exists with this UID" }, { status: 409 });
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

