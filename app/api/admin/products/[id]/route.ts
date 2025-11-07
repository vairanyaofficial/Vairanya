import { NextRequest, NextResponse } from "next/server";
import {
  getProductById,
  updateProduct,
  deleteProduct,
} from "@/lib/products-firestore";
import type { Product } from "@/lib/products-types";
import { requireAdmin, requireSuperUser } from "@/lib/admin-auth-server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get single product
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = requireAdmin(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const product = await getProductById(id);

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update product (admin and workers can edit)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const auth = requireAdmin(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const updates: Partial<Product> = await request.json();

    const updatedProduct = await updateProduct(id, updates);
    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

// DELETE - Delete product (superuser only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = requireSuperUser(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Only superusers can delete products" },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    await deleteProduct(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

