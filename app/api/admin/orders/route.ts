import { NextRequest, NextResponse } from "next/server";
import { getAllOrders, createOrder, getOrdersByStatus } from "@/lib/orders-mongodb";
import { requireAdmin } from "@/lib/admin-auth-server";
import type { Order } from "@/lib/orders-types";
import { initializeMongoDB } from "@/lib/mongodb.server";
import { getOrdersCache, setOrdersCache, clearOrdersCache, isCacheValid } from "@/lib/orders-cache";

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
    const skipCache = searchParams.get("skipCache") === "true"; // Allow bypassing cache if needed

    // Check cache first - we can use cache for all queries since we filter in memory
    // Only skip cache if explicitly requested
    if (!skipCache && isCacheValid()) {
      const cachedData = getOrdersCache();
      if (cachedData) {
        let cachedOrders = [...cachedData.data];
        
        // Apply filters to cached data
        if (statusParam) {
          const statuses = statusParam.split(",");
          cachedOrders = cachedOrders.filter((o) => statuses.includes(o.status));
        }
        
        // Filter by assigned worker
        if (assignedTo) {
          cachedOrders = cachedOrders.filter((o) => o.assigned_to === assignedTo);
        }
        
        if (limit) {
          cachedOrders = cachedOrders.slice(0, limit);
        }
        
        // Sort by created_at desc
        cachedOrders.sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA;
        });
        
        const response = NextResponse.json({ success: true, orders: cachedOrders });
        response.headers.set('Cache-Control', 'private, s-maxage=30, stale-while-revalidate=60');
        response.headers.set('X-Cache', 'HIT');
        return response;
      }
      // If cache was cleared or invalid, fall through to fetch from DB
    }

    // Get all orders from MongoDB
    let orders: Order[] = await getAllOrders();
    
    // Update cache
    setOrdersCache(orders);

    // Filter by status (can be comma-separated)
    if (statusParam) {
      const statuses = statusParam.split(",");
      orders = orders.filter((o) => statuses.includes(o.status));
    }

    // Filter by assigned worker
    if (assignedTo) {
      orders = orders.filter((o) => o.assigned_to === assignedTo);
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

    const response = NextResponse.json({ success: true, orders });
    response.headers.set('Cache-Control', 'private, s-maxage=30, stale-while-revalidate=60');
    response.headers.set('X-Cache', 'MISS');
    return response;
  } catch (error: any) {
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
    
    // Invalidate orders cache since new order was created
    clearOrdersCache();
    
    return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
