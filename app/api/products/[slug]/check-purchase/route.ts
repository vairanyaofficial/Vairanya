import { NextRequest, NextResponse } from "next/server";
import { getOrdersByUserId } from "@/lib/orders-mongodb";
import { getProductBySlug } from "@/lib/products-mongodb";
import { initializeMongoDB } from "@/lib/mongodb.server";
import { getUserIdFromSession } from "@/lib/auth-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 503 }
      );
    }

    // Get user ID from session
    const userId = await getUserIdFromSession(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, hasPurchased: false, error: "Please login to check purchase status" },
        { status: 401 }
      );
    }

    const { slug } = await params;
    
    // Get product by slug to get product_id
    const product = await getProductBySlug(slug);
    if (!product) {
      return NextResponse.json(
        { success: false, hasPurchased: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const productId = product.product_id;

    // Get all orders for this user
    const orders = await getOrdersByUserId(userId);

    // Check if any order contains this product
    // Only allow reviews for delivered orders
    let hasPurchased = false;
    for (const order of orders) {
      // Only check orders that are paid and delivered
      if (order.payment_status === "paid" && order.status === "delivered") {
        const hasProduct = order.items.some(item => item.product_id === productId);
        if (hasProduct) {
          hasPurchased = true;
          break;
        }
      }
    }

    return NextResponse.json({
      success: true,
      hasPurchased,
    });
  } catch (error: any) {
    console.error("Error checking purchase status:", error);
    return NextResponse.json(
      { success: false, hasPurchased: false, error: error.message || "Failed to check purchase status" },
      { status: 500 }
    );
  }
}

