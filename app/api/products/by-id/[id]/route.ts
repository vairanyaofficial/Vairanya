import { NextRequest, NextResponse } from "next/server";
import { getProductById } from "@/lib/products-mongodb";
import { initializeMongoDB } from "@/lib/mongodb.server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 503 }
      );
    }

    const { id } = await params;
    const product = await getProductById(id);

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // Return only necessary fields (id, slug) for review form
    return NextResponse.json({
      success: true,
      product: {
        product_id: product.product_id,
        slug: product.slug,
      },
    });
  } catch (error: any) {
    console.error("Error fetching product by ID:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch product" },
      { status: 500 }
    );
  }
}

