import { NextRequest, NextResponse } from "next/server";
import { deleteCategory, updateCategory, getAllCategories } from "@/lib/categories-mongodb";
import { requireAdminOrSuperUser } from "@/lib/admin-auth-server";
import { initializeMongoDB } from "@/lib/mongodb.server";

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
    // Initialize MongoDB connection
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 503 }
      );
    }

    const { name } = await params;
    const normalizedName = decodeURIComponent(name).trim().toLowerCase();

    if (!normalizedName) {
      return NextResponse.json(
        { success: false, error: "Category name is required" },
        { status: 400 }
      );
    }

    // Delete category and get all remaining categories
    const categories = await deleteCategory(normalizedName);

    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    if (error.message?.includes("not found")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }
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
    // Initialize MongoDB connection
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 503 }
      );
    }

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

    // Update category and get all categories
    const categories = await updateCategory(oldName, newName);

    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    if (error.message?.includes("not found")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }
    if (error.message?.includes("already exists")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update category" },
      { status: 500 }
    );
  }
}

