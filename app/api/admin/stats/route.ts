import { NextRequest, NextResponse } from "next/server";
import { getAllOrders } from "@/lib/orders-firestore";
import { requireAdmin } from "@/lib/admin-auth-server";
import type { DashboardStats } from "@/lib/orders-types";

// Simple in-memory cache for stats (30 second TTL)
let statsCache: { data: DashboardStats; timestamp: number } | null = null;
const CACHE_TTL = 30 * 1000; // 30 seconds

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
    // Check cache first
    const now = Date.now();
    if (statsCache && (now - statsCache.timestamp) < CACHE_TTL) {
      const response = NextResponse.json({ success: true, stats: statsCache.data });
      response.headers.set('Cache-Control', 'private, s-maxage=30, stale-while-revalidate=60');
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    // Load orders
    const orders = await getAllOrders();

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
      pending_tasks: 0,
      in_progress_tasks: 0,
      completed_tasks_today: 0,
      worker_stats: [],
    };

    // Update cache
    statsCache = {
      data: stats,
      timestamp: Date.now(),
    };

    const response = NextResponse.json({ success: true, stats });
    
    // Add cache headers for better performance (cache for 30 seconds)
    response.headers.set('Cache-Control', 'private, s-maxage=30, stale-while-revalidate=60');
    response.headers.set('X-Cache', 'MISS');
    
    return response;
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

