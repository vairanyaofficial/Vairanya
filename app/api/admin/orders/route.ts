import { NextRequest, NextResponse } from "next/server";
import { getAllOrders, createOrder, getOrdersByStatus } from "@/lib/orders-firestore";
import { requireAdmin } from "@/lib/admin-auth-server";
import { adminFirestore } from "@/lib/firebaseAdmin.server";
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
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    // Optimize: If we only need a few orders and have filters, use direct query
    // Otherwise fallback to getAllOrders (which is cached)
    let orders: Order[];
    
    // For worker dashboard or limited requests, use optimized query
    if (assignedTo && adminFirestore && limit) {
      try {
        let query: FirebaseFirestore.Query = adminFirestore
          .collection("orders")
          .where("assigned_to", "==", assignedTo)
          .orderBy("created_at", "desc")
          .limit(limit || 100);
        
        const snapshot = await query.get();
        orders = snapshot.docs.map((doc: any) => {
          const data = doc.data();
          return {
            id: doc.id,
            order_number: data.order_number || doc.id,
            items: data.items || [],
            total: data.total || 0,
            subtotal: data.subtotal || 0,
            shipping: data.shipping || 0,
            discount: data.discount || undefined,
            offer_id: data.offer_id || undefined,
            customer: data.customer || {},
            shipping_address: data.shipping_address || {},
            payment_method: data.payment_method || "razorpay",
            payment_status: data.payment_status || "pending",
            status: data.status || "pending",
            razorpay_order_id: data.razorpay_order_id || null,
            razorpay_payment_id: data.razorpay_payment_id || null,
            tracking_number: data.tracking_number || null,
            assigned_to: data.assigned_to || null,
            notes: data.notes || null,
            refund_status: data.refund_status || null,
            razorpay_refund_id: data.razorpay_refund_id || null,
            refund_notes: data.refund_notes || null,
            created_at: data.created_at 
              ? (typeof data.created_at === 'string' ? data.created_at : data.created_at.toDate?.()?.toISOString() || new Date().toISOString())
              : (data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()),
            updated_at: data.updated_at 
              ? (typeof data.updated_at === 'string' ? data.updated_at : data.updated_at.toDate?.()?.toISOString() || new Date().toISOString())
              : (data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()),
            user_id: data.user_id || null,
          };
        });
      } catch (error) {
        // Fallback to getAllOrders if query fails
        orders = await getAllOrders();
        if (assignedTo) {
          orders = orders.filter((o) => o.assigned_to === assignedTo);
        }
      }
    } else {
      // Use getAllOrders for admin dashboard (may be cached)
      orders = await getAllOrders();
    }

    // Filter by status (can be comma-separated)
    if (statusParam) {
      const statuses = statusParam.split(",");
      orders = orders.filter((o) => statuses.includes(o.status));
    }

    // Filter by assigned worker (if not already filtered)
    if (assignedTo && !(assignedTo && adminFirestore && limit)) {
      orders = orders.filter((o) => o.assigned_to === assignedTo);
    }

    // Apply limit if not already applied in query
    if (limit && !(assignedTo && adminFirestore && limit)) {
      orders = orders.slice(0, limit);
    }

    // Already sorted by created_at desc in getAllOrders or query

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

