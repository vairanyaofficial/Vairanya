import { NextRequest, NextResponse } from "next/server";
import { getAllOrders, createOrder, getOrdersByStatus } from "@/lib/orders-mongodb";
import { requireAdmin } from "@/lib/admin-auth-server";
import type { Order } from "@/lib/orders-types";
import { initializeMongoDB } from "@/lib/mongodb.server";

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
    // Initialize MongoDB connection
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const assignedTo = searchParams.get("assigned_to");
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    // Get all orders from MongoDB
    let orders: Order[] = await getAllOrders();
    
    console.log(`[Admin Orders API] Retrieved ${orders.length} orders from MongoDB`);

    // Filter by status (can be comma-separated)
    if (statusParam) {
      const statuses = statusParam.split(",");
      orders = orders.filter((o) => statuses.includes(o.status));
      console.log(`[Admin Orders API] Filtered by status (${statusParam}): ${orders.length} orders`);
    }

    // Filter by assigned worker
    if (assignedTo) {
      orders = orders.filter((o) => o.assigned_to === assignedTo);
      console.log(`[Admin Orders API] Filtered by assigned_to (${assignedTo}): ${orders.length} orders`);
    }

    // Apply limit
    if (limit) {
      orders = orders.slice(0, limit);
    }

    // Sort by created_at desc (already sorted in getAllOrders, but ensure it)
    orders.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });

    console.log(`[Admin Orders API] Returning ${orders.length} orders`);
    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    console.error("[Admin Orders API] Error fetching orders:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch orders" },
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
    // Initialize MongoDB connection
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 503 }
      );
    }

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
