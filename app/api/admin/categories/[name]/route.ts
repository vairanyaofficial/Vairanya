import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin.server";
import { requireAdminOrSuperUser } from "@/lib/admin-auth-server";

const CATEGORIES_COLLECTION = "categories";

// DELETE - Delete category (admin and superuser)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const auth = requireAdminOrSuperUser(request);
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name } = await params;
    const normalizedName = decodeURIComponent(name).trim().toLowerCase();

    if (!normalizedName) {
      return NextResponse.json(
        { success: false, error: "Category name is required" },
        { status: 400 }
      );
    }

    if (!adminFirestore) {
      return NextResponse.json(
        { success: false, error: "Firestore not initialized" },
        { status: 500 }
      );
    }

    // Check if category exists
    const doc = await adminFirestore.collection(CATEGORIES_COLLECTION).doc(normalizedName).get();
    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );
    }

    // Delete category
    await adminFirestore.collection(CATEGORIES_COLLECTION).doc(normalizedName).delete();

    // Get all remaining categories
    const snapshot = await adminFirestore.collection(CATEGORIES_COLLECTION).get();
    const categories = snapshot.docs.map((doc) => doc.id).sort();

    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete category" },
      { status: 500 }
    );
  }
}

// PUT - Update category name (admin and superuser)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const auth = requireAdminOrSuperUser(request);
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name } = await params;
    const oldName = decodeURIComponent(name).trim().toLowerCase();
    const body = await request.json();
    const newName = (body?.name || "").toString().trim().toLowerCase();

    if (!oldName || !newName) {
      return NextResponse.json(
        { success: false, error: "Category name is required" },
        { status: 400 }
      );
    }

    if (oldName === newName) {
      // No change, just return current categories
      const snapshot = await adminFirestore.collection(CATEGORIES_COLLECTION).get();
      const categories = snapshot.docs.map((doc) => doc.id).sort();
      return NextResponse.json({ success: true, categories });
    }

    if (!adminFirestore) {
      return NextResponse.json(
        { success: false, error: "Firestore not initialized" },
        { status: 500 }
      );
    }

    // Check if old category exists
    const oldDoc = await adminFirestore.collection(CATEGORIES_COLLECTION).doc(oldName).get();
    if (!oldDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );
    }

    // Check if new name already exists
    const newDoc = await adminFirestore.collection(CATEGORIES_COLLECTION).doc(newName).get();
    if (newDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Category with that name already exists" },
        { status: 400 }
      );
    }

    // Get old category data
    const oldData = oldDoc.data();

    // Create new document with new name
    await adminFirestore.collection(CATEGORIES_COLLECTION).doc(newName).set({
      name: newName,
      createdAt: oldData?.createdAt || new Date(),
      updatedAt: new Date(),
    });

    // Delete old document
    await adminFirestore.collection(CATEGORIES_COLLECTION).doc(oldName).delete();

    // Get all categories
    const snapshot = await adminFirestore.collection(CATEGORIES_COLLECTION).get();
    const categories = snapshot.docs.map((doc) => doc.id).sort();

    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update category" },
      { status: 500 }
    );
  }
}

