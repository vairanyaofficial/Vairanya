"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Search,
  Filter,
  Eye,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { getAdminSession } from "@/lib/admin-auth";
import type { Order } from "@/lib/orders-types";
import { useToast } from "@/components/ToastProvider";

interface Worker {
  uid: string;
  name: string;
  email: string;
  role: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { showError } = useToast();

  useEffect(() => {
    loadOrders();
    loadWorkers();
    
    // Auto-refresh every 30 seconds to see worker updates
    const interval = setInterval(() => {
      loadOrders();
    }, 30000);
    
    // Refresh when page comes into focus
    const handleFocus = () => {
      loadOrders();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const loadWorkers = async () => {
    try {
      const session = getAdminSession();
      if (!session) return;

      const response = await fetch("/api/admin/workers", {
        headers: {
          "x-admin-username": session.username,
        },
      });
      const data = await response.json();
      if (data.success) {
        setWorkers(data.workers || []);
      }
    } catch (err) {
      console.error("Error loading workers:", err);
    }
  };

  const getWorkerName = (uid: string | null | undefined): string => {
    if (!uid) return "Unassigned";
    const worker = workers.find((w) => w.uid === uid);
    return worker?.name || uid;
  };

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const session = getAdminSession();
      if (!session) return;

      const response = await fetch("/api/admin/orders", {
        headers: {
          "x-admin-username": session.username,
          "x-admin-role": session.role,
        },
      });
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (err) {
    } finally {
      setIsLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((o) => o.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.order_number.toLowerCase().includes(term) ||
          o.customer.name.toLowerCase().includes(term) ||
          o.customer.email.toLowerCase().includes(term) ||
          o.customer.phone.includes(term)
      );
    }

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
    try {
      const session = getAdminSession();
      if (!session) return;

      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-username": session.username,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (data.success) {
        loadOrders();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(data.order);
        }
      }
    } catch (err) {
      showError("Failed to update order status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300";
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
      case "cancelled":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "packing":
      case "packed":
        return <Package className="h-4 w-4" />;
      case "shipped":
        return <Truck className="h-4 w-4" />;
      case "delivered":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <RefreshCw className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-4 sm:mb-6">
        <h1 className="font-serif text-xl sm:text-2xl md:text-3xl text-gray-900 dark:text-white">Orders</h1>
        <Button onClick={loadOrders} variant="outline" size="sm" className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2">
          <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-3 sm:p-4 border dark:border-white/10 mb-4 sm:mb-6">
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-sm border dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 text-sm border dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="packing">Packing</option>
              <option value="packed">Packed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm border dark:border-white/10 overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 dark:bg-[#0a0a0a] border-b dark:border-white/10">
                <tr>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Order #
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Customer
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase hidden sm:table-cell">
                    Items
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Amount
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase hidden md:table-cell">
                    Assigned
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase hidden lg:table-cell">
                    Date
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-4">
                      <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{order.order_number}</div>
                      <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 sm:hidden mt-0.5">{order.items.length} item(s)</div>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-4">
                      <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate max-w-[120px] sm:max-w-none">{order.customer.name}</div>
                      <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px] sm:max-w-none">{order.customer.email}</div>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-4 hidden sm:table-cell">
                      <div className="text-xs sm:text-sm text-gray-900 dark:text-white">{order.items.length} item(s)</div>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-4">
                      <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">₹{order.total.toLocaleString()}</div>
                      <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                        {order.payment_status === "paid" ? "Paid" : order.payment_status === "refunded" ? "Refunded" : order.payment_status}
                      </div>
                      {order.status === "cancelled" && order.refund_status && (
                        <div className={`text-[9px] sm:text-xs mt-1 px-1.5 sm:px-2 py-0.5 rounded-full inline-block ${
                          order.refund_status === "completed" ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300" :
                          order.refund_status === "processing" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300" :
                          order.refund_status === "failed" ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300" :
                          "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                        }`}>
                          Refund: {order.refund_status}
                        </div>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-4">
                      <span
                        className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-xs rounded-full flex items-center gap-1 w-fit ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusIcon(order.status)}
                        <span className="hidden xs:inline">{order.status}</span>
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-4 hidden md:table-cell">
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate max-w-[100px]">
                        {getWorkerName(order.assigned_to)}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-4 hidden lg:table-cell">
                      <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-4 text-right">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5"
                      >
                        <Link href={`/admin/orders/${order.id}`}>
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                          <span className="hidden sm:inline">View</span>
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

      <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
        Showing {filteredOrders.length} of {orders.length} orders
      </div>
    </div>
  );
}

