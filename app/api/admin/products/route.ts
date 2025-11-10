import { NextRequest, NextResponse } from "next/server";
import {
  getAllProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
} from "@/lib/products-mongodb";
import type { Product } from "@/lib/products-types";
import { requireSuperUser, requireAdmin } from "@/lib/admin-auth-server";
import { initializeMongoDB } from "@/lib/mongodb.server";

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
    // Initialize MongoDB connection
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      console.error("[Admin Products API] MongoDB initialization failed:", mongoInit.error);
      return NextResponse.json(
        { 
          success: false, 
          error: "Database unavailable",
          message: mongoInit.error || "MongoDB connection failed"
        },
        { status: 503 }
      );
    }

    console.log("[Admin Products API] Fetching all products from MongoDB...");
    // Fetch products from MongoDB
    const products = await getAllProducts();
    console.log(`[Admin Products API] Retrieved ${products.length} products from MongoDB`);
    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    console.error("[Admin Products API] Error fetching products:", error);
    console.error("[Admin Products API] Error details:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Failed to fetch products",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
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
    // Initialize MongoDB connection
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      console.error("[Admin Products API] MongoDB initialization failed for POST:", mongoInit.error);
      return NextResponse.json(
        { 
          success: false, 
          error: "Database unavailable",
          message: mongoInit.error || "MongoDB connection failed"
        },
        { status: 503 }
      );
    }

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

    console.log(`[Admin Products API] Creating new product: ${product.title}`);
    // Save to MongoDB
    const newProduct = await createProduct(product);
    console.log(`[Admin Products API] Product created successfully: ${newProduct.product_id}`);
    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (error: any) {
    console.error("[Admin Products API] Error creating product:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Failed to create product",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 400 }
    );
  }
}

