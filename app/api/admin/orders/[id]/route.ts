import { NextRequest, NextResponse } from "next/server";
import { getOrderById, updateOrder, getTasksByOrder } from "@/lib/orders-mongodb";
import { requireAdmin } from "@/lib/admin-auth-server";
import { initializeMongoDB } from "@/lib/mongodb.server";
import { clearOrdersCache } from "@/lib/orders-cache";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get single order
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
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 503 }
      );
    }

    const { id } = await params;
    
    // Try to get order by ID
    let order = await getOrderById(id);
    
    // If not found by ID, try by order_number
    if (!order) {
      const { getOrderByNumber } = await import("@/lib/orders-mongodb");
      order = await getOrderByNumber(id);
    }
    
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Workers can only view orders assigned to them or orders with tasks assigned to them
    if (auth.role === "worker") {
      // Get username from header or auth.uid (for header-based auth, uid is username)
      const workerUsername = request.headers.get("x-admin-username") || auth.uid;
      
      // Check if order is assigned to this worker
      if (order.assigned_to !== workerUsername) {
        // Check if worker has any tasks for this order
        const tasks = await getTasksByOrder(id);
        const hasTask = tasks.some(task => task.assigned_to === workerUsername);
        
        if (!hasTask) {
          return NextResponse.json(
            { success: false, error: "You don't have access to this order" },
            { status: 403 }
          );
        }
      }
    }

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update order
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
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 503 }
      );
    }

    const { id } = await params;
    
    if (!id || id.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Order ID is required" },
        { status: 400 }
      );
    }

    let updates;
    try {
      updates = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Validate that we have updates
    if (!updates || typeof updates !== "object" || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "No updates provided" },
        { status: 400 }
      );
    }

    // Validate assigned_to if provided
    if (updates.assigned_to !== undefined) {
      // Allow null to unassign
      if (updates.assigned_to === null) {
        // Keep as null
      } else if (typeof updates.assigned_to === "string") {
        // Trim and convert empty string to null
        const trimmed = updates.assigned_to.trim();
        updates.assigned_to = trimmed === "" ? null : trimmed;
      } else {
        return NextResponse.json(
          { success: false, error: "assigned_to must be a string or null" },
          { status: 400 }
        );
      }
    }

    // Get the order first to check permissions - try both ID and order_number
    let order = await getOrderById(id);
    if (!order) {
      const { getOrderByNumber } = await import("@/lib/orders-mongodb");
      order = await getOrderByNumber(id);
    }
    
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Workers can only update orders assigned to them
    if (auth.role === "worker") {
      // Get username from header or auth.uid (for header-based auth, uid is username)
      const workerUsername = request.headers.get("x-admin-username") || auth.uid;
      
      // Workers can update status if order is assigned to them
      if (updates.status && order.assigned_to !== workerUsername) {
        return NextResponse.json(
          { success: false, error: "You can only update orders assigned to you" },
          { status: 403 }
        );
      }
      // Workers cannot update assigned_to field
      if (updates.assigned_to !== undefined) {
        return NextResponse.json(
          { success: false, error: "Workers cannot assign orders" },
          { status: 403 }
        );
      }
    }

    // If order is being cancelled and payment was made online, initiate refund process
    if (updates.status === "cancelled" && order.status !== "cancelled") {
      if (order.payment_status === "paid" && order.payment_method !== "cod") {
        updates.refund_status = "started";
        // Don't change payment_status here - it will be updated when refund completes
      }
    }

    // Use the order's actual ID (MongoDB _id) for updating
    const orderIdToUpdate = order.id;
    const updatedOrder = await updateOrder(orderIdToUpdate, updates);
    
    if (!updatedOrder) {
      return NextResponse.json(
        { success: false, error: "Failed to update order - no order returned" },
        { status: 500 }
      );
    }
    
    // Invalidate orders cache since order was updated
    clearOrdersCache();
    
    return NextResponse.json({ 
      success: true, 
      order: updatedOrder,
      message: "Order updated successfully"
    });
  } catch (error: any) {
    const { id } = await params;
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Failed to update order",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

