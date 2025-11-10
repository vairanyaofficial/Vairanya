import { NextRequest, NextResponse } from "next/server";
import { getOrderById, updateOrder } from "@/lib/orders-mongodb";
import { adminAuth, ensureFirebaseInitialized } from "@/lib/firebaseAdmin.server";
import { initializeMongoDB } from "@/lib/mongodb.server";

// Helper to verify Firebase token and get user ID
async function getUserIdFromToken(request: NextRequest): Promise<string | null> {
  try {
    // Ensure Firebase is initialized before using adminAuth
    const initResult = await ensureFirebaseInitialized();
    if (!initResult.success || !adminAuth) {
      return null;
    }
    
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;
    
    const token = authHeader.substring(7);
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Initialize MongoDB connection
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 503 }
      );
    }

    const { id } = await params;
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch order" },
      { status: 500 }
    );
  }
}

// PUT - Cancel order (customer only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Initialize MongoDB connection
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 503 }
      );
    }

    // Ensure Firebase is initialized for authentication
    const initResult = await ensureFirebaseInitialized();
    if (!initResult.success) {
      return NextResponse.json(
        { success: false, error: "Service unavailable" },
        { status: 500 }
      );
    }
    
    const { id } = await params;
    const userId = await getUserIdFromToken(request);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Verify order belongs to user
    if (order.user_id !== userId) {
      return NextResponse.json(
        { success: false, error: "You can only cancel your own orders" },
        { status: 403 }
      );
    }

    // Check if order can be cancelled
    const cancellableStatuses = ["pending", "confirmed", "processing", "packing"];
    if (!cancellableStatuses.includes(order.status)) {
      return NextResponse.json(
        { success: false, error: `Order cannot be cancelled. Current status: ${order.status}` },
        { status: 400 }
      );
    }

    // Check if already cancelled
    if (order.status === "cancelled") {
      return NextResponse.json(
        { success: false, error: "Order is already cancelled" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const action = body.action || "cancel";

    if (action === "cancel") {
      // Update order status to cancelled
      const updates: any = {
        status: "cancelled",
      };

      // If payment was made online, initiate refund process
      if (order.payment_status === "paid" && order.payment_method !== "cod") {
        updates.refund_status = "started";
        // Keep payment_status as "paid" - it will be updated to "refunded" when refund is completed by admin
      }

      const updatedOrder = await updateOrder(id, updates);

      return NextResponse.json({
        success: true,
        order: updatedOrder,
        message: order.payment_status === "paid" && order.payment_method !== "cod"
          ? "Order cancelled. Refund process has been initiated."
          : "Order cancelled successfully."
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to cancel order" },
      { status: 500 }
    );
  }
}

