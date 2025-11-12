import { NextRequest, NextResponse } from "next/server";
import {
  getProductById,
  updateProduct,
  deleteProduct,
} from "@/lib/products-mongodb";
import { deleteReviewsByProductId } from "@/lib/reviews-mongodb";
import type { Product } from "@/lib/products-types";
import { requireAdmin, requireSuperUser } from "@/lib/admin-auth-server";
import { initializeMongoDB } from "@/lib/mongodb.server";

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
    // Initialize MongoDB connection
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      console.error("[Admin Products API] MongoDB initialization failed for GET:", mongoInit.error);
      return NextResponse.json(
        { 
          success: false, 
          error: "Database unavailable",
          message: mongoInit.error || "MongoDB connection failed"
        },
        { status: 503 }
      );
    }

    const { id } = await params;
    console.log(`[Admin Products API] Fetching product with ID: ${id}`);
    const product = await getProductById(id);

    if (!product) {
      console.error(`[Admin Products API] Product not found with ID: ${id}`);
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    console.log(`[Admin Products API] Found product: ${product.title} (ID: ${product.product_id})`);
    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error("[Admin Products API] Error fetching product:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Failed to fetch product",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
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
    // Initialize MongoDB connection
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      console.error("[Admin Products API] MongoDB initialization failed for PUT:", mongoInit.error);
      return NextResponse.json(
        { 
          success: false, 
          error: "Database unavailable",
          message: mongoInit.error || "MongoDB connection failed"
        },
        { status: 503 }
      );
    }

    const { id } = await params;
    console.log(`[Admin Products API] Updating product with ID: ${id}`);
    const updates: Partial<Product> = await request.json();

    const updatedProduct = await updateProduct(id, updates);
    console.log(`[Admin Products API] Product updated successfully: ${id}`);
    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error: any) {
    console.error("[Admin Products API] Error updating product:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Failed to update product",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
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
    // Initialize MongoDB connection
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      console.error("[Admin Products API] MongoDB initialization failed for DELETE:", mongoInit.error);
      return NextResponse.json(
        { 
          success: false, 
          error: "Database unavailable",
          message: mongoInit.error || "MongoDB connection failed"
        },
        { status: 503 }
      );
    }

    const { id } = await params;
    console.log(`[Admin Products API] Deleting product with ID: ${id}`);
    
    // Get product first to get product_id for deleting reviews
    const product = await getProductById(id);
    if (product && product.product_id) {
      // Delete all reviews associated with this product
      try {
        const deletedReviewsCount = await deleteReviewsByProductId(product.product_id);
        console.log(`[Admin Products API] Deleted ${deletedReviewsCount} reviews for product ${product.product_id}`);
      } catch (reviewError: any) {
        // Log error but continue with product deletion
        console.error(`[Admin Products API] Error deleting reviews for product ${product.product_id}:`, reviewError);
      }
    }
    
    // Delete the product
    await deleteProduct(id);
    console.log(`[Admin Products API] Product deleted successfully: ${id}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Admin Products API] Error deleting product:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Failed to delete product",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 400 }
    );
  }
}

