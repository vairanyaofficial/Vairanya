"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Clock,
  Package,
  Search,
  RefreshCw,
  Truck,
  FileText,
  Eye,
} from "lucide-react";
import { getAdminSession } from "@/lib/admin-auth";
import { useToast } from "@/components/ToastProvider";
import type { Order } from "@/lib/orders-types";

export default function WorkerDashboardPage() {
  const [assignedOrders, setAssignedOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const session = getAdminSession();
  const { showToast } = useToast();

  useEffect(() => {
    loadAssignedOrders();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadAssignedOrders();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadAssignedOrders = async () => {
    try {
      setIsLoading(true);
      const sessionData = getAdminSession();
      if (!sessionData) return;

      const response = await fetch(
        `/api/admin/orders?assigned_to=${sessionData.username}`,
        {
          headers: { 
            "x-admin-username": sessionData.username,
            "x-admin-role": sessionData.role,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setAssignedOrders(data.orders || []);
      }
    } catch (err) {
      showToast("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
      case "confirmed":
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300";
      case "processing":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300";
      case "packed":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300";
      case "shipped":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300";
      case "delivered":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
      case "cancelled":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-4 w-4" />;
      case "shipped":
        return <Truck className="h-4 w-4" />;
      case "packed":
      case "processing":
        return <Package className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Filter orders
  const filteredOrders = assignedOrders.filter((order) => {
    // Filter by status
    if (statusFilter !== "all" && order.status !== statusFilter) {
      return false;
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        order.order_number.toLowerCase().includes(term) ||
        order.customer.name.toLowerCase().includes(term) ||
        order.customer.email.toLowerCase().includes(term) ||
        order.customer.phone.includes(term)
      );
    }

    return true;
  });

  // Calculate stats
  const stats = {
    total: assignedOrders.length,
    pending: assignedOrders.filter((o) => o.status === "pending" || o.status === "confirmed").length,
    processing: assignedOrders.filter((o) => o.status === "processing").length,
    packed: assignedOrders.filter((o) => o.status === "packed").length,
    shipped: assignedOrders.filter((o) => o.status === "shipped").length,
    delivered: assignedOrders.filter((o) => o.status === "delivered").length,
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Loading your orders...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl mb-2 text-gray-900 dark:text-white">
          Welcome, {session?.name || session?.username || "Worker"}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your assigned orders</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm border dark:border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Orders</p>
              <p className="text-2xl font-bold text-[#2E2E2E] dark:text-white">{stats.total}</p>
            </div>
            <div className="bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20 rounded-full p-3">
              <FileText className="h-6 w-6 text-[#D4AF37]" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm border dark:border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending</p>
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.pending}</p>
            </div>
            <div className="bg-gray-100 dark:bg-[#1a1a1a] rounded-full p-3">
              <Clock className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm border dark:border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Processing</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">{stats.processing}</p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-full p-3">
              <Package className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm border dark:border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Completed</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-500">{stats.delivered}</p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-3">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-4 border dark:border-white/10 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by order number, customer name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="packed">Packed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
          <Button onClick={loadAssignedOrders} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm border dark:border-white/10 overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              {assignedOrders.length === 0
                ? "No orders assigned to you yet"
                : "No orders match your filters"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-[#0a0a0a] border-b dark:border-white/10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Order Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {order.order_number}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {order.customer.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {order.customer.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {order.items.length} item(s)
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        ₹{order.total.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 w-fit ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/worker/orders/${order.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Showing {filteredOrders.length} of {assignedOrders.length} orders
      </div>
    </div>
  );
}
