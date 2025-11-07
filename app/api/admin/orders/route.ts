import { NextRequest, NextResponse } from "next/server";
import { getAllOrders, createOrder, getOrdersByStatus } from "@/lib/orders-firestore";
import { requireAdmin } from "@/lib/admin-auth-server";
import type { Order } from "@/lib/orders-types";

// GET - List all orders
export async function GET(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const assignedTo = searchParams.get("assigned_to");

    // Fetch all orders from Firestore
    let orders = await getAllOrders();

    // Filter by status (can be comma-separated)
    if (statusParam) {
      const statuses = statusParam.split(",");
      orders = orders.filter((o) => statuses.includes(o.status));
    }

    // Filter by assigned worker
    if (assignedTo) {
      orders = orders.filter((o) => o.assigned_to === assignedTo);
    }

    // Already sorted by created_at desc in getAllOrders

    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new order (for manual orders)
export async function POST(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.authenticated || auth.role !== "superuser") {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Only superusers can create orders" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const order: Omit<Order, "id" | "order_number" | "created_at" | "updated_at"> = body;

    // Validate required fields
    if (!order.items || !order.customer || !order.shipping_address) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newOrder = await createOrder(order);
    return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

