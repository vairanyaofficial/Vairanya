import { NextRequest, NextResponse } from "next/server";
import { getOrdersByUserId } from "@/lib/orders-mongodb";
import { initializeMongoDB, getMongoDB } from "@/lib/mongodb.server";
import { getUserIdFromSession } from "@/lib/auth-helpers";

// Mark route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Initialize MongoDB connection
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 503 }
      );
    }

    // Get user ID from session (secure way)
    const userId = await getUserIdFromSession(request);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please login to view your orders." },
        { status: 401 }
      );
    }

    // Fetch orders for the authenticated user
    let orders = await getOrdersByUserId(userId);
    
    // If no orders found, try alternative user identifiers
    if (orders.length === 0) {
      const { auth } = await import("@/lib/auth");
      const session = await auth();
      if (session?.user) {
        // Try uid if different from userId
        const uid = (session.user as any).uid;
        if (uid && uid !== userId) {
          orders = await getOrdersByUserId(uid);
        }
        
        // If still no orders, try by email (for older orders that might have email as user_id)
        if (orders.length === 0 && session.user.email && session.user.email !== userId) {
          const db = getMongoDB();
          if (db) {
            try {
              const collection = db.collection("Order");
              const emailOrders = await collection
                .find({ 
                  $or: [
                    { user_id: session.user.email },
                    { "customer.email": session.user.email }
                  ]
                })
                .sort({ created_at: -1 })
                .toArray();
              
              if (emailOrders.length > 0) {
                // Convert documents to Order format (same logic as docToOrder in orders-mongodb)
                const convertedOrders = emailOrders.map((doc: any) => {
                  return {
                    id: doc._id?.toString() || doc.id,
                    order_number: doc.order_number || doc._id?.toString() || doc.id,
                    items: doc.items || [],
                    total: doc.total || 0,
                    subtotal: doc.subtotal || 0,
                    shipping: doc.shipping || 0,
                    discount: doc.discount || undefined,
                    offer_id: doc.offer_id || undefined,
                    customer: doc.customer || {},
                    shipping_address: doc.shipping_address || {},
                    payment_method: doc.payment_method || "razorpay",
                    payment_status: doc.payment_status || "pending",
                    status: doc.status || "pending",
                    razorpay_order_id: doc.razorpay_order_id || null,
                    razorpay_payment_id: doc.razorpay_payment_id || null,
                    tracking_number: doc.tracking_number || null,
                    assigned_to: doc.assigned_to || null,
                    notes: doc.notes || null,
                    refund_status: doc.refund_status || null,
                    razorpay_refund_id: doc.razorpay_refund_id || null,
                    refund_notes: doc.refund_notes || null,
                    created_at: doc.created_at 
                      ? (typeof doc.created_at === 'string' ? doc.created_at : new Date(doc.created_at).toISOString())
                      : new Date().toISOString(),
                    updated_at: doc.updated_at 
                      ? (typeof doc.updated_at === 'string' ? doc.updated_at : new Date(doc.updated_at).toISOString())
                      : new Date().toISOString(),
                    user_id: doc.user_id || null,
                  };
                });
                orders = convertedOrders;
              }
            } catch (error) {
              console.error("Error fetching orders by email:", error);
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

