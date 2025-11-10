import { NextRequest, NextResponse } from "next/server";
import { addCategory, getAllCategories } from "@/lib/categories-mongodb";
import { requireAdminOrSuperUser } from "@/lib/admin-auth-server";
import { initializeMongoDB } from "@/lib/mongodb.server";

// GET - Admin fetch categories (same as public but auth-protected)
export async function GET(request: NextRequest) {
  const auth = requireAdminOrSuperUser(request);
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 503 }
      );
    }
    const categories = await getAllCategories();
    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load categories" },
      { status: 500 }
    );
  }
}

// POST - Add new category (admin and superuser)
export async function POST(request: NextRequest) {
  const auth = requireAdminOrSuperUser(request);
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const name = (body?.name || "").toString();
    if (!name.trim()) {
      return NextResponse.json(
        { success: false, error: "Category name is required" },
        { status: 400 }
      );
    }
    const categories = await addCategory(name);
    return NextResponse.json({ success: true, categories }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add category" },
      { status: 500 }
    );
  }
}


