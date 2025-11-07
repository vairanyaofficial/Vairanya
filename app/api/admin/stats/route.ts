import { NextRequest, NextResponse } from "next/server";
import { getAllOrders, getAllTasks } from "@/lib/orders-firestore";
import { requireAdmin } from "@/lib/admin-auth-server";
import type { DashboardStats, Task } from "@/lib/orders-types";
import { adminFirestore } from "@/lib/firebaseAdmin.server";

// GET - Get dashboard statistics
export async function GET(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    
    // Load orders from Firestore
    const orders = await getAllOrders();
    
    // Load tasks from Firestore
    let tasks: Task[] = [];
    try {
      tasks = await getAllTasks();
    } catch (taskError: any) {
      tasks = [];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter today's orders
    const todayOrders = orders.filter(
      (o) => new Date(o.created_at) >= today
    );

    // Calculate revenue:
    // - For Razorpay/paid orders: count if payment_status === "paid"
    // - For COD orders: count only if status === "delivered"
    const revenueOrders = orders.filter((o) => {
      const orderTotal = Number(o.total) || 0;
      if (orderTotal <= 0) return false;
      
      // For COD orders, only count if delivered
      if (o.payment_method === "cod") {
        return o.status === "delivered";
      }
      
      // For other payment methods (razorpay, upi), count if paid
      return o.payment_status === "paid";
    });
    
    const todayRevenueOrders = todayOrders.filter((o) => {
      const orderTotal = Number(o.total) || 0;
      if (orderTotal <= 0) return false;
      
      // For COD orders, only count if delivered
      if (o.payment_method === "cod") {
        return o.status === "delivered";
      }
      
      // For other payment methods, count if paid
      return o.payment_status === "paid";
    });
    
    // Calculate stats
    const stats: DashboardStats = {
      total_orders: orders.length,
      pending_orders: orders.filter((o) => o.status === "pending").length,
      processing_orders: orders.filter((o) => o.status === "processing").length,
      packed_orders: orders.filter((o) => o.status === "packed").length,
      shipped_orders: orders.filter((o) => o.status === "shipped").length,
      delivered_orders: orders.filter((o) => o.status === "delivered").length,
      // Revenue: 
      // - Razorpay/UPI orders: count if payment_status === "paid"
      // - COD orders: count only if status === "delivered"
      total_revenue: revenueOrders.reduce((sum, o) => {
        const orderTotal = Number(o.total) || 0;
        return sum + orderTotal;
      }, 0),
      today_revenue: todayRevenueOrders.reduce((sum, o) => {
        const orderTotal = Number(o.total) || 0;
        return sum + orderTotal;
      }, 0),
      today_orders: todayOrders.length,
      pending_tasks: tasks.filter((t) => t.status === "pending").length,
      in_progress_tasks: tasks.filter((t) => t.status === "in_progress").length,
      completed_tasks_today: tasks.filter(
        (t) =>
          t.status === "completed" &&
          t.completed_at &&
          new Date(t.completed_at) >= today
      ).length,
      worker_stats: await (async () => {
        try {
          // Fetch workers from Firestore
          let firestoreWorkers: Array<{ uid: string; name: string; role: string }> = [];
          if (adminFirestore) {
            const workersSnapshot = await adminFirestore.collection("admins").get();
            firestoreWorkers = workersSnapshot.docs
              .map((doc) => {
                const data = doc.data();
                return {
                  uid: doc.id,
                  name: data.name || "",
                  role: data.role || "worker",
                };
              })
              .filter((w) => w.role === "worker");
          }
          
          // If no Firestore workers, fallback to empty array
          if (firestoreWorkers.length === 0) {
            return [];
          }

          return firestoreWorkers.map((worker) => {
            // Match tasks by worker UID (assigned_to field contains worker UID)
            const workerTasks = tasks.filter((t) => t.assigned_to === worker.uid);
            return {
              username: worker.uid,
              name: worker.name,
              pending_tasks: workerTasks.filter((t) => t.status === "pending").length,
              in_progress_tasks: workerTasks.filter(
                (t) => t.status === "in_progress"
              ).length,
              completed_tasks: workerTasks.filter(
                (t) => t.status === "completed"
              ).length,
            };
          });
        } catch (workerError: any) {
          return [];
        }
      })(),
    };

    return NextResponse.json({ success: true, stats });
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Failed to fetch dashboard stats",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

