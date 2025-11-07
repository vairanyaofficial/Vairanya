import { NextRequest, NextResponse } from "next/server";
import { getOrderById, updateOrder } from "@/lib/orders-firestore";
import { requireAdmin, requireSuperUser } from "@/lib/admin-auth-server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT - Update refund status (superuser only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const auth = requireSuperUser(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Only superusers can manage refunds" },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { refund_status, refund_id, notes } = body;

    if (!refund_status) {
      return NextResponse.json(
        { success: false, error: "refund_status is required" },
        { status: 400 }
      );
    }

    const validStatuses = ["started", "processing", "completed", "failed"];
    if (!validStatuses.includes(refund_status)) {
      return NextResponse.json(
        { success: false, error: `Invalid refund_status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    // Get the order first
    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Only allow refund management for cancelled orders with online payments
    if (order.status !== "cancelled") {
      return NextResponse.json(
        { success: false, error: "Refund can only be managed for cancelled orders" },
        { status: 400 }
      );
    }

    if (order.payment_method === "cod") {
      return NextResponse.json(
        { success: false, error: "Refund is not applicable for Cash on Delivery orders" },
        { status: 400 }
      );
    }

    if (order.payment_status !== "paid" && order.payment_status !== "refunded") {
      return NextResponse.json(
        { success: false, error: "Order must have been paid to process refund" },
        { status: 400 }
      );
    }

    // Prepare updates
    const updates: any = {
      refund_status,
    };

    // If refund is completed, update payment_status
    if (refund_status === "completed") {
      updates.payment_status = "refunded";
    }

    // Add refund_id if provided
    if (refund_id) {
      updates.razorpay_refund_id = refund_id;
    }

    // Add notes if provided
    if (notes) {
      updates.refund_notes = notes;
    }

    const updatedOrder = await updateOrder(id, updates);

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: `Refund status updated to ${refund_status}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update refund status" },
      { status: 500 }
    );
  }
}

// GET - Get refund details (admin only)
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
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      refund: {
        refund_status: order.refund_status || null,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        razorpay_payment_id: order.razorpay_payment_id,
        razorpay_order_id: order.razorpay_order_id,
        total: order.total,
        can_refund: order.status === "cancelled" && order.payment_method !== "cod" && order.payment_status === "paid",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get refund details" },
      { status: 500 }
    );
  }
}

