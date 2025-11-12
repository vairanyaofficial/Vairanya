"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { getAdminSession } from "@/lib/admin-auth";
import { Package, ShoppingBag, Users, MessageSquare, TrendingUp, AlertCircle } from "lucide-react";

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalCustomers: number;
}

interface Order {
  _id: string;
  order_id: string;
  customer_email: string;
  customer_name: string;
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
  }>;
  total_amount?: number;
  total?: number; // Alternative field name from API
  status: string;
  payment_status: string;
  created_at: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, adminInfo } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<ReturnType<typeof getAdminSession>>(null);

  // Get session from storage - AdminLayout handles all auth checks and redirects
  useEffect(() => {
    const currentSession = getAdminSession();
    if (currentSession) {
      setSession(currentSession);
    }
  }, []);

  // Load dashboard data once session is available
  useEffect(() => {
    if (session && (session.role === "superuser" || session.role === "admin")) {
      loadDashboardData();
    }
  }, [session]);

  const loadDashboardData = async () => {
    try {
      const session = getAdminSession();
      if (!session) {
        setIsLoading(false);
        return;
      }

      // Prepare headers for authenticated requests
      const headers = {
        "x-admin-username": session.username,
        "x-admin-role": session.role,
      };

      // Fetch stats, orders, and messages in parallel
      // Note: messages endpoint requires superuser, so it may return 401 for regular admins
      const [statsRes, ordersRes, messagesRes] = await Promise.allSettled([
        fetch("/api/admin/stats", { headers }),
        fetch("/api/admin/orders?limit=5&sort=desc", { headers }),
        fetch("/api/admin/messages?count=true", { headers }),
      ]);

      // Process stats
      if (statsRes.status === 'fulfilled') {
        try {
          const statsData = await statsRes.value.json();
          if (statsData.success && statsData.stats) {
            setStats(statsData.stats);
          }
        } catch (err) {
          // Failed to parse stats response
        }
      }

      // Process orders
      if (ordersRes.status === 'fulfilled') {
        try {
          const ordersData = await ordersRes.value.json();
          if (ordersData.success) {
            setRecentOrders(ordersData.orders.slice(0, 5));
          }
        } catch (err) {
          // Failed to parse orders response
        }
      }

      // Process messages (non-critical, can fail silently)
      // Messages endpoint requires superuser, so regular admins will get 401 - that's OK
      if (messagesRes.status === 'fulfilled') {
        try {
          const messagesResponse = messagesRes.value;
          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json();
            if (messagesData.success) {
              setUnreadMessagesCount(messagesData.count || 0);
            } else {
              setUnreadMessagesCount(0);
            }
          } else {
            // 401 for non-superusers is expected, just set count to 0
            setUnreadMessagesCount(0);
          }
        } catch (err) {
          setUnreadMessagesCount(0); // Default to 0 if messages fail
        }
      } else {
        setUnreadMessagesCount(0); // Default to 0 if messages fail
      }
    } catch (err) {
      // Don't block dashboard loading even if all requests fail
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300";
      case "processing":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300";
      case "packing":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300";
      case "shipped":
        return "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300";
      case "delivered":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
      case "cancelled":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300";
    }
  };

  if (isLoading && !stats) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
          </div>
        </div>
        
        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-6 border dark:border-white/10">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-4"></div>
              <div className="h-8 w-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-2"></div>
              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Orders Skeleton */}
        <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-6 border dark:border-white/10">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-900 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back, {session?.name || adminInfo?.name || "Admin"}!
          </p>
        </div>
        <Link href="/admin/products/new">
          <button className="bg-[#D4AF37] hover:bg-[#C19B2E] text-white px-6 py-3 rounded-lg font-medium transition-colors">
            Add Product
          </button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-6 border dark:border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</h3>
            <ShoppingBag className="h-5 w-5 text-[#D4AF37]" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats?.totalOrders || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">All time orders</p>
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-6 border dark:border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Orders</h3>
            <AlertCircle className="h-5 w-5 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats?.pendingOrders || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Requires attention</p>
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-6 border dark:border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</h3>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            ₹{stats?.totalRevenue?.toLocaleString() || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">All time revenue</p>
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-6 border dark:border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Customers</h3>
            <Users className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats?.totalCustomers || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Registered customers</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link
          href="/admin/orders?status=pending"
          className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-4 border dark:border-white/10 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pending Orders</span>
            <span className="text-2xl font-bold text-yellow-600">{stats?.pendingOrders || 0}</span>
          </div>
        </Link>

        <Link
          href="/admin/orders?status=processing"
          className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-4 border dark:border-white/10 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Processing</span>
            <Package className="h-5 w-5 text-blue-500" />
          </div>
        </Link>

        <Link
          href="/admin/orders?status=packing"
          className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-4 border dark:border-white/10 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Packing</span>
            <Package className="h-5 w-5 text-purple-500" />
          </div>
        </Link>

        <Link
          href="/admin/orders?status=shipped"
          className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-4 border dark:border-white/10 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Shipped</span>
            <Package className="h-5 w-5 text-indigo-500" />
          </div>
        </Link>

        <Link
          href="/admin/orders?status=delivered"
          className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-4 border dark:border-white/10 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Delivered</span>
            <Package className="h-5 w-5 text-green-500" />
          </div>
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-6 border dark:border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white">Recent Orders</h2>
          <Link href="/admin/orders">View All</Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No orders yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-white/10">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Order ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order._id} className="border-b dark:border-white/10 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="py-3 px-4">
                      <Link href={`/admin/orders/${order._id}`} className="text-[#D4AF37] hover:underline">
                        {order.order_id}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                      {order.customer_name || order.customer_email}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                      ₹{Number(order.total || order.total_amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          href="/admin/orders"
          className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-6 border dark:border-white/10 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4">
            <ShoppingBag className="h-8 w-8 text-[#D4AF37]" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Orders</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage all orders</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/products"
          className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-6 border dark:border-white/10 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4">
            <Package className="h-8 w-8 text-[#D4AF37]" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Products</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage products</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/customers"
          className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-6 border dark:border-white/10 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4">
            <Users className="h-8 w-8 text-[#D4AF37]" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Customers</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">View all customers</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/offers"
          className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-6 border dark:border-white/10 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4">
            <TrendingUp className="h-8 w-8 text-[#D4AF37]" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Offers</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage offers & discounts</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/categories"
          className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-6 border dark:border-white/10 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4">
            <Package className="h-8 w-8 text-[#D4AF37]" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Categories</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage categories</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/workers"
          className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-6 border dark:border-white/10 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4">
            <Users className="h-8 w-8 text-[#D4AF37]" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Workers</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage workers</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/carousel"
          className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-6 border dark:border-white/10 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4">
            <Package className="h-8 w-8 text-[#D4AF37]" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Carousel</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage carousel slides</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/messages"
          className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-6 border dark:border-white/10 hover:shadow-md transition-shadow relative"
        >
          <div className="flex items-center gap-4">
            <MessageSquare className="h-8 w-8 text-[#D4AF37]" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Messages</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">View customer messages</p>
            </div>
          </div>
          {unreadMessagesCount > 0 && (
            <span className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
              {unreadMessagesCount}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}
