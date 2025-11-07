"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  Truck,
  DollarSign,
  Activity,
  AlertCircle,
  Tag,
  ImageIcon,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { canCreateProduct, getAdminSession, isAdminAuthenticated } from "@/lib/admin-auth";
import { useAuth } from "@/components/AuthProvider";
import type { DashboardStats, Order } from "@/lib/orders-types";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, adminInfo } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(getAdminSession());
  const [hasRedirected, setHasRedirected] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected) return;
    
    // Check session storage directly - this is the source of truth
    const sessionData = getAdminSession();
    const isAdminAuth = isAdminAuthenticated();
    
    // Debug: Log session for troubleshooting
    console.log("Admin page auth check:", {
      isAdminAuth,
      hasSession: !!sessionData,
      role: sessionData?.role,
      username: sessionData?.username,
      adminInfo: !!adminInfo,
      user: !!user,
      userEmail: user?.email,
      sessionStorage: typeof window !== "undefined" ? sessionStorage.getItem("admin_session") : null,
      localStorage: typeof window !== "undefined" ? localStorage.getItem("va_admin_session_local") : null
    });
    
    // FIRST PRIORITY: If admin session exists, check role
    if (isAdminAuth && sessionData) {
      // STRICT: Workers cannot access admin dashboard - redirect immediately
      if (sessionData.role === "worker") {
        setHasRedirected(true);
        setAuthChecked(true);
        window.location.href = "/worker/dashboard";
        return;
      }
      
      // Allow both superuser and admin to access admin dashboard
      if (sessionData.role === "superuser" || sessionData.role === "admin") {
        // Update session state
        setSession(sessionData);
        setAuthChecked(true);
        // Load dashboard data
        loadDashboardData();
        return;
      }
      
      // If role is not superuser or admin, redirect to worker dashboard or home
      setHasRedirected(true);
      setAuthChecked(true);
      window.location.href = "/worker/dashboard";
      return;
    }
    
    // SECOND: If no admin session but user is logged in as customer
    // Only redirect if we're CERTAIN they're a customer (not an admin)
    if (user && !isAdminAuth && !adminInfo) {
      setAuthChecked(true);
      setIsLoading(false);
      // Wait a moment to ensure session isn't being set
      const checkTimer = setTimeout(() => {
        const retrySession = getAdminSession();
        if (!retrySession) {
          // Definitely a customer, redirect to home
          setHasRedirected(true);
          window.location.href = "/";
        }
      }, 300);
      return () => clearTimeout(checkTimer);
    }
    
    // THIRD: If no one is logged in, redirect to login page
    if (!isAdminAuth && !user) {
      setAuthChecked(true);
      setIsLoading(false);
      setHasRedirected(true);
      window.location.href = "/admin/login";
      return;
    }
    
    // If we get here, mark auth as checked but keep loading until we know what to do
    setAuthChecked(true);
  }, [router, user, adminInfo, hasRedirected]);

  // Auto-refresh dashboard when page comes into focus
  useEffect(() => {
    const handleFocus = () => {
      if (authChecked && !isLoading) {
        loadDashboardData();
      }
    };
    
    // Refresh every minute
    const interval = setInterval(() => {
      if (authChecked && !isLoading) {
        loadDashboardData();
      }
    }, 60000);
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [authChecked, isLoading]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const sessionData = getAdminSession();
      if (!sessionData) {
        return;
      }

      // Load stats
      const statsRes = await fetch("/api/admin/stats", {
        headers: { "x-admin-username": sessionData.username },
      });

      const statsData = await statsRes.json();

      if (statsData.success && statsData.stats) {
        setStats(statsData.stats);
      }

      // Load recent orders
      const ordersRes = await fetch("/api/admin/orders?status=confirmed,processing,packing", {
        headers: { "x-admin-username": sessionData.username },
      });
      const ordersData = await ordersRes.json();
      if (ordersData.success) {
        setRecentOrders(ordersData.orders.slice(0, 5));
      }

      // Load unread messages count
      const messagesRes = await fetch("/api/admin/messages?count=true", {
        headers: { "x-admin-username": sessionData.username },
      });
      const messagesData = await messagesRes.json();
      if (messagesData.success) {
        setUnreadMessagesCount(messagesData.count || 0);
      }
    } catch (err) {
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "packing":
        return "bg-purple-100 text-purple-800";
      case "packed":
        return "bg-indigo-100 text-indigo-800";
      case "shipped":
        return "bg-green-100 text-green-800";
      case "delivered":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {session?.name}</p>
        </div>
        {canCreateProduct() && (
          <Button asChild className="bg-[#D4AF37] hover:bg-[#C19B2E]">
            <Link href="/admin/products/new">
              <Package className="h-4 w-4 mr-2" />
              Add Product
            </Link>
          </Button>
        )}
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700">Total Orders</h3>
              <ShoppingBag className="h-8 w-8 text-[#D4AF37]" />
            </div>
            <p className="text-3xl font-bold">{stats.total_orders}</p>
            <p className="text-sm text-gray-500 mt-2">
              {stats.today_orders} today
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700">Total Revenue</h3>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-3xl font-bold">
              ₹{stats.total_revenue ? stats.total_revenue.toLocaleString() : "0"}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              ₹{stats.today_revenue ? stats.today_revenue.toLocaleString() : "0"} today
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700">Pending Tasks</h3>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-3xl font-bold">{stats.pending_tasks}</p>
            <p className="text-sm text-gray-500 mt-2">
              {stats.in_progress_tasks} in progress
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700">Completed Today</h3>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-3xl font-bold">{stats.completed_tasks_today}</p>
            <p className="text-sm text-gray-500 mt-2">Tasks completed</p>
          </div>
        </div>
      )}

      {/* Order Status Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Link
            href="/admin/orders?status=pending"
            className="bg-white rounded-lg shadow-sm p-4 border hover:border-[#D4AF37] transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Pending</span>
            </div>
            <p className="text-2xl font-bold">{stats.pending_orders}</p>
          </Link>

          <Link
            href="/admin/orders?status=processing"
            className="bg-white rounded-lg shadow-sm p-4 border hover:border-[#D4AF37] transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-5 w-5 text-yellow-600" />
              <span className="text-sm font-medium text-gray-700">Processing</span>
            </div>
            <p className="text-2xl font-bold">{stats.processing_orders}</p>
          </Link>

          <Link
            href="/admin/orders?status=packing"
            className="bg-white rounded-lg shadow-sm p-4 border hover:border-[#D4AF37] transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">Packing</span>
            </div>
            <p className="text-2xl font-bold">{stats.packed_orders}</p>
          </Link>

          <Link
            href="/admin/orders?status=shipped"
            className="bg-white rounded-lg shadow-sm p-4 border hover:border-[#D4AF37] transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Shipped</span>
            </div>
            <p className="text-2xl font-bold">{stats.shipped_orders}</p>
          </Link>

          <Link
            href="/admin/orders?status=delivered"
            className="bg-white rounded-lg shadow-sm p-4 border hover:border-[#D4AF37] transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Delivered</span>
            </div>
            <p className="text-2xl font-bold">{stats.delivered_orders}</p>
          </Link>
        </div>
      )}

      {/* Worker Stats (Super User Only) */}
      {session?.role === "superuser" && stats && stats.worker_stats.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 border mb-8">
          <h2 className="font-serif text-xl mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Worker Performance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.worker_stats.map((worker) => (
              <div
                key={worker.username}
                className="border rounded-lg p-4 hover:border-[#D4AF37] transition-colors"
              >
                <h3 className="font-semibold mb-3">{worker.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending:</span>
                    <span className="font-medium">{worker.pending_tasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">In Progress:</span>
                    <span className="font-medium">{worker.in_progress_tasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed:</span>
                    <span className="font-medium text-green-600">
                      {worker.completed_tasks}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-sm p-6 border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl">Recent Orders</h2>
          <Button asChild variant="outline">
            <Link href="/admin/orders">View All</Link>
          </Button>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No recent orders</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Order Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">
                      {order.order_number}
                    </td>
                    <td className="px-4 py-3 text-sm">{order.customer.name}</td>
                    <td className="px-4 py-3 text-sm font-medium">
                      ₹{order.total.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/orders/${order.id}`}>View</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className={`grid grid-cols-1 md:grid-cols-3 ${session?.role === "superuser" ? "lg:grid-cols-4" : ""} gap-6 mt-8`}>
        <Link
          href="/admin/orders"
          className="p-6 border rounded-lg hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-colors"
        >
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Order Management
          </h3>
          <p className="text-sm text-gray-600">
            View and manage all orders
          </p>
        </Link>
        <Link
          href="/admin/tasks"
          className="p-6 border rounded-lg hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-colors"
        >
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Task Management
          </h3>
          <p className="text-sm text-gray-600">
            Assign and track tasks
          </p>
        </Link>
        <Link
          href="/admin/products"
          className="p-6 border rounded-lg hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-colors"
        >
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Package className="h-5 w-5" />
            Products
          </h3>
          <p className="text-sm text-gray-600">
            Manage products and inventory
          </p>
        </Link>
        {session?.role === "superuser" && (
          <>
            <Link
              href="/admin/customers"
              className="p-6 border rounded-lg hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-colors"
            >
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customers
              </h3>
              <p className="text-sm text-gray-600">
                View customer details and history
              </p>
            </Link>
            <Link
              href="/admin/offers"
              className="p-6 border rounded-lg hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-colors"
            >
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Offers
              </h3>
              <p className="text-sm text-gray-600">
                Create and manage promotional offers
              </p>
            </Link>
            <Link
              href="/admin/categories"
              className="p-6 border rounded-lg hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-colors"
            >
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Categories
              </h3>
              <p className="text-sm text-gray-600">
                Manage product categories
              </p>
            </Link>
            <Link
              href="/admin/workers"
              className="p-6 border rounded-lg hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-colors"
            >
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Workers
              </h3>
              <p className="text-sm text-gray-600">
                Manage workers and roles
              </p>
            </Link>
            <Link
              href="/admin/carousel"
              className="p-6 border rounded-lg hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-colors"
            >
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Carousel
              </h3>
              <p className="text-sm text-gray-600">
                Manage homepage carousel slides
              </p>
            </Link>
            <Link
              href="/admin/messages"
              className="p-6 border rounded-lg hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-colors relative"
            >
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Messages
                {unreadMessagesCount > 0 && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-semibold">
                    {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-600">
                View and manage contact messages
              </p>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
