"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package,
  ShoppingBag,
  CheckCircle,
  Truck,
  DollarSign,
  AlertCircle,
  Activity,
  Tag,
  ImageIcon,
  Mail,
  Users,
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
      window.location.href = "/login?mode=admin";
      return;
    }
    
    // If we get here, mark auth as checked but keep loading until we know what to do
    setAuthChecked(true);
  }, [router, user, adminInfo, hasRedirected]);

  // Load dashboard data once auth is checked
  useEffect(() => {
    if (authChecked && session && (session.role === "superuser" || session.role === "admin")) {
      loadDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, session?.role]);

  // Auto-refresh dashboard when page comes into focus (disabled for performance)
  // Uncomment if needed, but consider increasing interval for production
  // useEffect(() => {
  //   const handleFocus = () => {
  //     if (authChecked && !isLoading) {
  //       loadDashboardData();
  //     }
  //   };
    
  //   // Refresh every 2 minutes (increased from 1 minute for better performance)
  //   const interval = setInterval(() => {
  //     if (authChecked && !isLoading) {
  //       loadDashboardData();
  //     }
  //   }, 120000); // 2 minutes
    
  //   window.addEventListener('focus', handleFocus);
    
  //   return () => {
  //     clearInterval(interval);
  //     window.removeEventListener('focus', handleFocus);
  //   };
  // }, [authChecked, isLoading]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const sessionData = getAdminSession();
      if (!sessionData) {
        return;
      }

      // Load all data in parallel for faster loading
      const [statsRes, ordersRes, messagesRes] = await Promise.all([
        fetch("/api/admin/stats", {
          headers: { "x-admin-username": sessionData.username },
        }),
        fetch("/api/admin/orders?status=confirmed,processing,packing&limit=5", {
          headers: { "x-admin-username": sessionData.username },
        }),
        fetch("/api/admin/messages?count=true", {
          headers: { "x-admin-username": sessionData.username },
        }),
      ]);

      // Process responses
      const [statsData, ordersData, messagesData] = await Promise.all([
        statsRes.json(),
        ordersRes.json(),
        messagesRes.json(),
      ]);

      if (statsData.success && statsData.stats) {
        setStats(statsData.stats);
      }

      if (ordersData.success) {
        setRecentOrders(ordersData.orders.slice(0, 5));
      }

      if (messagesData.success) {
        setUnreadMessagesCount(messagesData.count || 0);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
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
      case "packed":
        return "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300";
      case "shipped":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
      case "delivered":
        return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300";
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
    <div className="px-2 sm:px-4 md:px-6 py-3 md:py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl md:text-3xl mb-1 sm:mb-2 text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Welcome back, {session?.name}</p>
        </div>
        {canCreateProduct() && (
          <Button asChild className="bg-[#D4AF37] hover:bg-[#C19B2E] text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2">
            <Link href="/admin/products/new">
              <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Add Product</span>
              <span className="sm:hidden">Add</span>
            </Link>
          </Button>
        )}
      </div>

      {/* Stats Grid - Mobile Optimized */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-3 sm:p-4 md:p-6 border dark:border-white/10">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h3 className="font-semibold text-[10px] sm:text-xs md:text-sm text-gray-700 dark:text-gray-300">Total Orders</h3>
              <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-[#D4AF37]" />
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{stats.total_orders}</p>
            <p className="text-[9px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1 sm:mt-2">
              {stats.today_orders} today
            </p>
          </div>

          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-3 sm:p-4 md:p-6 border dark:border-white/10">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h3 className="font-semibold text-[10px] sm:text-xs md:text-sm text-gray-700 dark:text-gray-300">Total Revenue</h3>
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-green-600 dark:text-green-500" />
            </div>
            <p className="text-lg sm:text-xl md:text-3xl font-bold text-gray-900 dark:text-white">
              ₹{stats.total_revenue ? stats.total_revenue.toLocaleString() : "0"}
            </p>
            <p className="text-[9px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1 sm:mt-2">
              ₹{stats.today_revenue ? stats.today_revenue.toLocaleString() : "0"} today
            </p>
          </div>
        </div>
      )}

      {/* Order Status Cards - Mobile Optimized */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
          <Link
            href="/admin/orders?status=pending"
            className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-2 sm:p-3 md:p-4 border dark:border-white/10 hover:border-[#D4AF37] dark:hover:border-[#D4AF37] transition-colors"
          >
            <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
              <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-gray-500 dark:text-gray-400" />
              <span className="text-[9px] sm:text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">Pending</span>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{stats.pending_orders}</p>
          </Link>

          <Link
            href="/admin/orders?status=processing"
            className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-2 sm:p-3 md:p-4 border dark:border-white/10 hover:border-[#D4AF37] dark:hover:border-[#D4AF37] transition-colors"
          >
            <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
              <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-yellow-600 dark:text-yellow-500" />
              <span className="text-[9px] sm:text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">Processing</span>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{stats.processing_orders}</p>
          </Link>

          <Link
            href="/admin/orders?status=packing"
            className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-2 sm:p-3 md:p-4 border dark:border-white/10 hover:border-[#D4AF37] dark:hover:border-[#D4AF37] transition-colors"
          >
            <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
              <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-purple-600 dark:text-purple-500" />
              <span className="text-[9px] sm:text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">Packing</span>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{stats.packed_orders}</p>
          </Link>

          <Link
            href="/admin/orders?status=shipped"
            className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-2 sm:p-3 md:p-4 border dark:border-white/10 hover:border-[#D4AF37] dark:hover:border-[#D4AF37] transition-colors"
          >
            <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
              <Truck className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-500" />
              <span className="text-[9px] sm:text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">Shipped</span>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{stats.shipped_orders}</p>
          </Link>

          <Link
            href="/admin/orders?status=delivered"
            className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-2 sm:p-3 md:p-4 border dark:border-white/10 hover:border-[#D4AF37] dark:hover:border-[#D4AF37] transition-colors"
          >
            <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
              <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-green-600 dark:text-green-500" />
              <span className="text-[9px] sm:text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">Delivered</span>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{stats.delivered_orders}</p>
          </Link>
        </div>
      )}


      {/* Recent Orders - Mobile Optimized */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-3 sm:p-4 md:p-6 border dark:border-white/10 mb-4 sm:mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
          <h2 className="font-serif text-base sm:text-lg md:text-xl text-gray-900 dark:text-white">Recent Orders</h2>
          <Button asChild variant="outline" size="sm" className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2">
            <Link href="/admin/orders">View All</Link>
          </Button>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-6 sm:py-8 text-sm">No recent orders</p>
        ) : (
          <div className="overflow-x-auto -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50 dark:bg-[#0a0a0a] border-b dark:border-white/10">
                <tr>
                  <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-[9px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Order #
                  </th>
                  <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-[9px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Customer
                  </th>
                  <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-[9px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Amount
                  </th>
                  <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-[9px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-[9px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase hidden sm:table-cell">
                    Date
                  </th>
                  <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-right text-[9px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-[10px] sm:text-xs md:text-sm font-medium text-gray-900 dark:text-white">
                      {order.order_number}
                    </td>
                    <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-[10px] sm:text-xs md:text-sm text-gray-900 dark:text-white">{order.customer.name}</td>
                    <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-[10px] sm:text-xs md:text-sm font-medium text-gray-900 dark:text-white">
                      ₹{order.total.toLocaleString()}
                    </td>
                    <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3">
                      <span
                        className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-xs rounded-full ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-[10px] sm:text-xs md:text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-right">
                      <Button asChild variant="outline" size="sm" className="text-[9px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5">
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

      {/* Quick Links - Mobile Optimized */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${session?.role === "superuser" ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-3 sm:gap-4 md:gap-6`}>
        <Link
          href="/admin/orders"
          className="p-3 sm:p-4 md:p-6 border dark:border-white/10 rounded-lg hover:border-[#D4AF37] dark:hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 dark:hover:bg-[#D4AF37]/10 transition-colors bg-white dark:bg-[#0a0a0a]"
        >
          <h3 className="font-semibold mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base text-gray-900 dark:text-white">
            <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" />
            Order Management
          </h3>
          <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400">
            View and manage all orders
          </p>
        </Link>
        <Link
          href="/admin/products"
          className="p-3 sm:p-4 md:p-6 border dark:border-white/10 rounded-lg hover:border-[#D4AF37] dark:hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 dark:hover:bg-[#D4AF37]/10 transition-colors bg-white dark:bg-[#0a0a0a]"
        >
          <h3 className="font-semibold mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base text-gray-900 dark:text-white">
            <Package className="h-4 w-4 sm:h-5 sm:w-5" />
            Products
          </h3>
          <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400">
            Manage products and inventory
          </p>
        </Link>
        {session?.role === "superuser" && (
          <>
            <Link
              href="/admin/customers"
              className="p-3 sm:p-4 md:p-6 border dark:border-white/10 rounded-lg hover:border-[#D4AF37] dark:hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 dark:hover:bg-[#D4AF37]/10 transition-colors bg-white dark:bg-[#0a0a0a]"
            >
              <h3 className="font-semibold mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base text-gray-900 dark:text-white">
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                Customers
              </h3>
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400">
                View customer details and history
              </p>
            </Link>
            <Link
              href="/admin/offers"
              className="p-3 sm:p-4 md:p-6 border dark:border-white/10 rounded-lg hover:border-[#D4AF37] dark:hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 dark:hover:bg-[#D4AF37]/10 transition-colors bg-white dark:bg-[#0a0a0a]"
            >
              <h3 className="font-semibold mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base text-gray-900 dark:text-white">
                <Tag className="h-4 w-4 sm:h-5 sm:w-5" />
                Offers
              </h3>
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400">
                Create and manage promotional offers
              </p>
            </Link>
            <Link
              href="/admin/categories"
              className="p-3 sm:p-4 md:p-6 border dark:border-white/10 rounded-lg hover:border-[#D4AF37] dark:hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 dark:hover:bg-[#D4AF37]/10 transition-colors bg-white dark:bg-[#0a0a0a]"
            >
              <h3 className="font-semibold mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base text-gray-900 dark:text-white">
                <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                Categories
              </h3>
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400">
                Manage product categories
              </p>
            </Link>
            <Link
              href="/admin/workers"
              className="p-3 sm:p-4 md:p-6 border dark:border-white/10 rounded-lg hover:border-[#D4AF37] dark:hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 dark:hover:bg-[#D4AF37]/10 transition-colors bg-white dark:bg-[#0a0a0a]"
            >
              <h3 className="font-semibold mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base text-gray-900 dark:text-white">
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                Workers
              </h3>
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400">
                Manage workers and roles
              </p>
            </Link>
            <Link
              href="/admin/carousel"
              className="p-3 sm:p-4 md:p-6 border dark:border-white/10 rounded-lg hover:border-[#D4AF37] dark:hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 dark:hover:bg-[#D4AF37]/10 transition-colors bg-white dark:bg-[#0a0a0a]"
            >
              <h3 className="font-semibold mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base text-gray-900 dark:text-white">
                <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                Carousel
              </h3>
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400">
                Manage homepage carousel slides
              </p>
            </Link>
            <Link
              href="/admin/messages"
              className="p-3 sm:p-4 md:p-6 border dark:border-white/10 rounded-lg hover:border-[#D4AF37] dark:hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 dark:hover:bg-[#D4AF37]/10 transition-colors bg-white dark:bg-[#0a0a0a] relative"
            >
              <h3 className="font-semibold mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base text-gray-900 dark:text-white">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                Messages
                {unreadMessagesCount > 0 && (
                  <span className="ml-auto flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-red-500 text-[8px] sm:text-[10px] text-white font-semibold">
                    {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
                  </span>
                )}
              </h3>
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400">
                View and manage contact messages
              </p>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
