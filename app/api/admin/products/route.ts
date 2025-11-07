import { NextRequest, NextResponse } from "next/server";
import {
  getAllProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
} from "@/lib/products-firestore";
import type { Product } from "@/lib/products-types";
import { requireSuperUser, requireAdmin } from "@/lib/admin-auth-server";

// GET - List all products
export async function GET(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // Fetch products from Firestore
    const products = await getAllProducts();
    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new product (superuser only)
export async function POST(request: NextRequest) {
  const auth = requireSuperUser(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Only superusers can create products" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const product: Product = body;

    // Validate required fields
    if (!product.title || !product.category || !product.price || !product.slug) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: title, category, price, and slug are required" },
        { status: 400 }
      );
    }

    // Ensure defaults
    product.stock_qty = product.stock_qty || 0;
    product.images = product.images || [];
    product.tags = product.tags || [];
    product.description = product.description || "";
    product.metal_finish = product.metal_finish || "gold";

    // Save to Firestore
    const newProduct = await createProduct(product);
    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

