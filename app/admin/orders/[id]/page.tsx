"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  User,
  MapPin,
  Phone,
  Mail,
  Edit,
  UserPlus,
  RefreshCw,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { getAdminSession, isSuperUser } from "@/lib/admin-auth";
import type { Order } from "@/lib/orders-types";
import OrderWorkflowProgress from "@/components/OrderWorkflowProgress";
import { useToast } from "@/components/ToastProvider";

interface Worker {
  uid: string;
  name: string;
  email: string;
  role: string;
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoadingWorkers, setIsLoadingWorkers] = useState(false);
  const [workersError, setWorkersError] = useState<string>("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState("");
  const [refundStatus, setRefundStatus] = useState<"started" | "processing" | "completed" | "failed">("started");
  const [refundId, setRefundId] = useState("");
  const [refundNotes, setRefundNotes] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [courierCompany, setCourierCompany] = useState("");
  const [isUpdatingTracking, setIsUpdatingTracking] = useState(false);
  const session = getAdminSession();
  const { showError, showSuccess, showWarning } = useToast();

  const loadOrderDataRef = React.useRef(false);
  
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout | null = null;
    let focusTimeout: NodeJS.Timeout | null = null;
    
    // Initial load
    loadOrderData(true); // Show loading on initial load
    if (isSuperUser()) {
      loadWorkers();
    }
    
    // Function to start polling interval
    const startInterval = () => {
      if (refreshInterval) clearInterval(refreshInterval);
      // Auto-refresh every 60 seconds (reduced from 3 seconds to minimize server load)
      refreshInterval = setInterval(() => {
        if (document.visibilityState === 'visible' && !loadOrderDataRef.current) {
          loadOrderData(false); // Silent refresh - no loading indicator
        }
      }, 60000); // 60 seconds - significantly reduced server load
    };
    
    // Refresh when page comes into focus (debounced)
    const handleFocus = () => {
      if (focusTimeout) clearTimeout(focusTimeout);
      focusTimeout = setTimeout(() => {
        if (!loadOrderDataRef.current) {
          loadOrderData(true); // Show loading when manually refreshing
        }
      }, 1000); // Debounce focus events
    };
    
    // Refresh when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (!loadOrderDataRef.current) {
          loadOrderData(true); // Show loading when tab becomes visible
        }
        if (!refreshInterval) {
          startInterval();
        }
      } else {
        // Page is hidden, stop polling
        if (refreshInterval) {
          clearInterval(refreshInterval);
          refreshInterval = null;
        }
      }
    };
    
    // Start interval
    startInterval();
    
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
      if (focusTimeout) clearTimeout(focusTimeout);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [orderId]);

  // Load workers when modal opens (if not already loaded)
  useEffect(() => {
    if (showAssignModal && isSuperUser() && workers.length === 0 && !isLoadingWorkers) {
      loadWorkers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAssignModal]);

  const loadOrderData = async (showLoading = false) => {
    // Prevent multiple simultaneous requests
    if (loadOrderDataRef.current) {
      return;
    }
    
    try {
      loadOrderDataRef.current = true;
      if (showLoading) {
        setIsLoading(true);
      }
      
      const sessionData = getAdminSession();
      if (!sessionData) return;

      // Load order
      const orderRes = await fetch(`/api/admin/orders/${orderId}`, {
        headers: { "x-admin-username": sessionData.username },
      });
      const orderData = await orderRes.json();
      if (orderData.success) {
        setOrder(orderData.order);
        setTrackingId(orderData.order.tracking_number || "");
        setCourierCompany(orderData.order.courier_company || "");
      } else {
        if (orderData.error === "Order not found") {
          showError(`Order not found: ${orderId}`);
        } else {
          showError(`Failed to load order: ${orderData.error || "Unknown error"}`);
        }
      }
    } catch (err: any) {
      showError(`Failed to load order: ${err.message || "Network error"}`);
    } finally {
      loadOrderDataRef.current = false;
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  const loadWorkers = async () => {
    try {
      setIsLoadingWorkers(true);
      setWorkersError(""); // Clear previous errors
      const sessionData = getAdminSession();
      if (!sessionData) {
        setWorkersError("Not authenticated");
        setWorkers([]);
        return;
      }

      const res = await fetch("/api/admin/workers", {
        headers: { "x-admin-username": sessionData.username },
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.error || data.message || `Failed to load workers (${res.status})`;
        setWorkersError(errorMsg);
        setWorkers([]);
        return;
      }

      if (data.success && data.workers) {
        const workerList = data.workers.filter(
          (w: Worker) => w.role === "worker"
        );
        setWorkers(workerList);
        setWorkersError(""); // Clear error on success
      } else {
        const errorMsg = data.error || data.message || "Failed to load workers";
        setWorkersError(errorMsg);
        setWorkers([]);
      }
    } catch (err: any) {
      const errorMsg = err?.message || "Failed to load workers: Network error";
      setWorkersError(errorMsg);
      setWorkers([]);
    } finally {
      setIsLoadingWorkers(false);
    }
  };

  const updateOrderStatus = async (newStatus: Order["status"]) => {
    if (!order) return;

    try {
      setIsUpdating(true);
      const sessionData = getAdminSession();
      if (!sessionData) {
        showError("Session expired. Please login again.");
        return;
      }

      // Check if worker is trying to update order not assigned to them
      if (sessionData.role === "worker" && order.assigned_to !== sessionData.username) {
        showWarning("You can only update orders assigned to you");
        return;
      }

      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-username": sessionData.username,
          "x-admin-role": sessionData.role || "superuser",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      if (data.success) {
        setOrder(data.order);
        showSuccess(`Order status updated to ${newStatus} successfully!`);
        // Reload order data to refresh UI
        await loadOrderData();
      } else {
        showError(data.error || "Failed to update order status");
      }
    } catch (err) {
      showError("Failed to update order status. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const updateTrackingId = async () => {
    if (!order) return;

    try {
      setIsUpdatingTracking(true);
      const sessionData = getAdminSession();
      if (!sessionData) {
        showError("Session expired. Please login again.");
        return;
      }

      // Check if worker is trying to update order not assigned to them
      if (sessionData.role === "worker" && order.assigned_to !== sessionData.username) {
        showWarning("You can only update orders assigned to you");
        return;
      }

      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-username": sessionData.username,
          "x-admin-role": sessionData.role || "superuser",
        },
        body: JSON.stringify({ 
          tracking_number: trackingId.trim() || null,
          courier_company: courierCompany.trim() || null,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      if (data.success) {
        setOrder(data.order);
        setTrackingId(data.order.tracking_number || "");
        setCourierCompany(data.order.courier_company || "");
        showSuccess("Tracking information updated successfully!");
        await loadOrderData();
      } else {
        showError(data.error || "Failed to update tracking ID");
      }
    } catch (err: any) {
      showError(err?.message || "Failed to update tracking ID");
    } finally {
      setIsUpdatingTracking(false);
    }
  };

  const assignToWorker = async () => {
    if (!order) {
      showError("Order not found");
      return;
    }

    if (!selectedWorker || selectedWorker.trim() === "") {
      showWarning("Please select a worker");
      return;
    }

    if (!orderId || orderId.trim() === "") {
      showError("Order ID is missing");
      return;
    }

    const sessionData = getAdminSession();
    if (!sessionData) {
      showError("Session expired. Please login again.");
      return;
    }

    try {
      setIsUpdating(true);

      const requestBody = {
        assigned_to: selectedWorker.trim(),
      };

      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-username": sessionData.username,
          "x-admin-role": sessionData.role || "superuser",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || data.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMsg);
      }

      if (data.success && data.order) {
        setOrder(data.order);
        setShowAssignModal(false);
        setSelectedWorker("");
        
        await loadOrderData();
        
        showSuccess(`Order assigned successfully to ${workers.find(w => w.uid === selectedWorker)?.name || selectedWorker}!`);
      } else {
        const errorMsg = data.error || data.message || "Failed to assign order";
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      const errorMessage = err.message || err.toString() || "Unknown error occurred";
      showError(`Failed to assign order: ${errorMessage}`);
    } finally {
      setIsUpdating(false);
    }
  };


  const updateRefundStatus = async () => {
    if (!order) return;

    try {
      setIsUpdating(true);
      const sessionData = getAdminSession();
      if (!sessionData) return;

      const response = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-username": sessionData.username,
        },
        body: JSON.stringify({
          refund_status: refundStatus,
          refund_id: refundId || undefined,
          notes: refundNotes || undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await loadOrderData();
        setShowRefundModal(false);
        setRefundId("");
        setRefundNotes("");
        showSuccess(`Refund status updated to ${refundStatus}`);
      } else {
        showError(data.error || "Failed to update refund status");
      }
    } catch (err) {
      showError("Failed to update refund status");
    } finally {
      setIsUpdating(false);
    }
  };

  const getRefundStatusColor = (status?: string) => {
    switch (status) {
      case "started":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300";
      case "processing":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300";
      case "completed":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
      case "failed":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300";
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

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Loading order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 mb-4">Order not found</p>
        <Button asChild variant="outline">
          <Link href="/admin/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }

  const nextStatus: Record<string, Order["status"]> = {
    pending: "confirmed",
    confirmed: "processing",
    processing: "packed",
    packed: "shipped",
    shipped: "delivered",
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Button asChild variant="outline">
          <Link href="/admin/orders">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="font-serif text-3xl text-gray-900 dark:text-white">Order {order.order_number}</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Placed on {new Date(order.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-3 lg:p-6 border dark:border-white/10">
            <h2 className="font-serif text-lg lg:text-xl mb-3 lg:mb-4 text-gray-900 dark:text-white">Order Items</h2>
            {/* Mobile: 2 columns grid, Desktop: List view */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 lg:gap-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex flex-col lg:flex-row lg:items-center gap-1.5 lg:gap-4 p-2 lg:p-0 lg:pb-4 border border-gray-200 dark:border-white/10 lg:border-0 lg:border-b rounded-md lg:rounded-none lg:last:border-0 bg-gray-50 dark:bg-white/5 lg:bg-transparent">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full aspect-square lg:w-16 lg:h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs lg:text-base text-gray-900 dark:text-white line-clamp-2 lg:whitespace-normal">{item.title}</p>
                    <p className="text-[10px] lg:text-sm text-gray-500 dark:text-gray-400 truncate">SKU: {item.sku}</p>
                    <p className="text-[10px] lg:text-sm text-gray-500 dark:text-gray-400">
                      {item.quantity} × ₹{item.price}
                    </p>
                  </div>
                  <p className="font-semibold text-xs lg:text-base text-gray-900 dark:text-white lg:whitespace-nowrap mt-auto lg:mt-0">
                    ₹{(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 lg:mt-6 pt-4 lg:pt-6 border-t dark:border-white/10 space-y-1.5 lg:space-y-2">
              <div className="flex justify-between text-xs lg:text-sm">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="text-gray-900 dark:text-white">₹{order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs lg:text-sm">
                <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                <span className="text-gray-900 dark:text-white">{order.shipping === 0 ? "Free" : `₹${order.shipping}`}</span>
              </div>
              <div className="flex justify-between text-base lg:text-lg font-semibold pt-2 border-t dark:border-white/10">
                <span className="text-gray-900 dark:text-white">Total</span>
                <span className="text-gray-900 dark:text-white">₹{order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Order Progress */}
          <OrderWorkflowProgress orderStatus={order.status} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Status */}
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-6 border dark:border-white/10">
            <h2 className="font-serif text-xl mb-4 text-gray-900 dark:text-white">Order Status</h2>
            <div className="mb-4">
              <span
                className={`px-3 py-2 text-sm rounded-full inline-block ${getStatusColor(
                  order.status
                )}`}
              >
                {order.status}
              </span>
            </div>
            <div className="space-y-2">
              {nextStatus[order.status] && (
                <Button
                  onClick={() => {
                    // Prevent moving to shipped if tracking ID is missing when status is packed
                    if (order.status === "packed" && nextStatus[order.status] === "shipped") {
                      if (!order.tracking_number || order.tracking_number.trim() === "") {
                        showWarning("Please enter tracking ID before marking as shipped");
                        return;
                      }
                    }
                    updateOrderStatus(nextStatus[order.status]!);
                  }}
                  disabled={isUpdating || (order.status === "packed" && (!order.tracking_number || order.tracking_number.trim() === ""))}
                  className="w-full bg-[#D4AF37] hover:bg-[#C19B2E]"
                >
                  {isUpdating ? (
                    <>
                      <Package className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : order.status === "pending" ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm Order
                    </>
                  ) : order.status === "confirmed" ? (
                    <>
                      <Package className="h-4 w-4 mr-2" />
                      Start Processing
                    </>
                  ) : order.status === "processing" ? (
                    <>
                      <Package className="h-4 w-4 mr-2" />
                      Mark as Packed
                    </>
                  ) : order.status === "packed" ? (
                    <>
                      <Truck className="h-4 w-4 mr-2" />
                      Mark as Shipped
                    </>
                  ) : order.status === "shipped" ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Delivered
                    </>
                  ) : (
                    `Move to ${nextStatus[order.status]}`
                  )}
                </Button>
              )}
            </div>

            {/* Next Steps */}
            <div className="mt-4 pt-4 border-t dark:border-white/10">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-[#D4AF37]" />
                Next Steps
              </h3>
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                {order.status === "pending" && (
                  <>
                    <p>• Review order details and verify payment status</p>
                    <p>• Confirm the order to proceed with fulfillment</p>
                    <p>• Assign order to a worker if needed</p>
                  </>
                )}
                {order.status === "confirmed" && (
                  <>
                    {!order.assigned_to && (
                      <p className="text-amber-600 dark:text-amber-400 font-medium">• ⚠️ Assign order to a worker first</p>
                    )}
                    <p>• Start processing the order</p>
                    <p>• Worker will handle order fulfillment</p>
                  </>
                )}
                {order.status === "processing" && (
                  <>
                    <p>• Worker is processing and packing order items</p>
                    <p>• Verify order items are correct</p>
                    <p>• Mark as packed when ready for shipping</p>
                  </>
                )}
                {order.status === "packed" && (
                  <>
                    {!order.tracking_number && (
                      <p className="text-amber-600 dark:text-amber-400 font-medium">• ⚠️ Enter tracking ID before marking as shipped</p>
                    )}
                    <p>• Prepare shipping label and tracking information</p>
                    <p>• Coordinate with courier for pickup</p>
                    <p>• Update status to "Shipped" after dispatch</p>
                  </>
                )}
                {order.status === "shipped" && (
                  <>
                    <p>• Monitor shipment tracking</p>
                    <p>• Follow up on delivery status</p>
                    <p>• Mark as "Delivered" upon confirmation</p>
                  </>
                )}
                {order.status === "delivered" && (
                  <>
                    <p>• Order has been successfully delivered</p>
                    <p>• Follow up with customer for feedback</p>
                    <p>• Order fulfillment complete</p>
                  </>
                )}
                {order.status === "cancelled" && (
                  <>
                    <p>• Process refund if payment was received</p>
                    <p>• Update refund status accordingly</p>
                    <p>• Archive order details</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Assignment */}
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-6 border dark:border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl text-gray-900 dark:text-white">Assignment</h2>
              {isSuperUser() && (
                <Button
                  onClick={async () => {
                    setShowAssignModal(true);
                    await loadWorkers();
                  }}
                  variant="outline"
                  size="sm"
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Assign
                </Button>
              )}
            </div>
            <div className="text-sm">
              <p className="text-gray-600 dark:text-gray-400 mb-1">Assigned To:</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {order.assigned_to
                  ? workers.find((w) => w.uid === order.assigned_to)?.name ||
                    order.assigned_to
                  : "Unassigned"}
              </p>
            </div>
          </div>

          {/* Tracking ID */}
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-6 border dark:border-white/10">
            <h2 className="font-serif text-xl mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
              <Truck className="h-5 w-5" />
              Tracking ID
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tracking Number
                  {order.status === "packed" && !order.tracking_number && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                <input
                  type="text"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  placeholder="Enter tracking number"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Courier Company
                </label>
                <input
                  type="text"
                  value={courierCompany}
                  onChange={(e) => setCourierCompany(e.target.value)}
                  placeholder="Enter courier company name (e.g., BlueDart, FedEx, etc.)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                />
              </div>
              {order.tracking_number && (
                <div className="text-sm">
                  <p className="text-gray-600 dark:text-gray-400 mb-1">Current Tracking:</p>
                  <p className="font-mono font-medium text-gray-900 dark:text-white break-all">
                    {order.tracking_number}
                  </p>
                  {order.courier_company && (
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      Courier: <span className="font-medium text-gray-900 dark:text-white">{order.courier_company}</span>
                    </p>
                  )}
                </div>
              )}
              <Button
                onClick={updateTrackingId}
                disabled={isUpdatingTracking}
                className="w-full bg-[#D4AF37] hover:bg-[#C19B2E] text-white"
                size="sm"
              >
                {isUpdatingTracking ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Truck className="h-4 w-4 mr-2" />
                    {order.tracking_number ? "Update Tracking ID" : "Add Tracking ID"}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-6 border dark:border-white/10">
            <h2 className="font-serif text-xl mb-4 text-gray-900 dark:text-white">Customer</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{order.customer.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-900 dark:text-white">{order.customer.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-900 dark:text-white">{order.customer.phone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-6 border dark:border-white/10">
            <h2 className="font-serif text-xl mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
              <MapPin className="h-5 w-5" />
              Shipping Address
            </h2>
            <div className="text-sm space-y-1 text-gray-900 dark:text-white">
              <p className="font-medium">{order.shipping_address.name}</p>
              <p>{order.shipping_address.address_line1}</p>
              {order.shipping_address.address_line2 && (
                <p>{order.shipping_address.address_line2}</p>
              )}
              <p>
                {order.shipping_address.city}, {order.shipping_address.state}{" "}
                {order.shipping_address.pincode}
              </p>
              <p>{order.shipping_address.country}</p>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-6 border dark:border-white/10">
            <h2 className="font-serif text-xl mb-4 text-gray-900 dark:text-white">Payment</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Method:</span>
                <span className="font-medium capitalize text-gray-900 dark:text-white">{order.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    order.payment_status === "paid"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                      : order.payment_status === "refunded"
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                      : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                  }`}
                >
                  {order.payment_status}
                </span>
              </div>
              {order.razorpay_payment_id && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Payment ID: {order.razorpay_payment_id}
                </div>
              )}
            </div>
          </div>

          {/* Refund Management - Only for superusers, cancelled orders with online payment */}
          {isSuperUser() && order.status === "cancelled" && order.payment_method !== "cod" && order.payment_status === "paid" && (
            <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-6 border dark:border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-xl flex items-center gap-2 text-gray-900 dark:text-white">
                  <RefreshCw className="h-5 w-5" />
                  Refund Management
                </h2>
                {order.refund_status && (
                  <span className={`px-3 py-1 text-xs rounded-full font-medium ${getRefundStatusColor(order.refund_status)}`}>
                    {order.refund_status.toUpperCase()}
                  </span>
                )}
              </div>
              
              {order.refund_status ? (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Refund Status:</span>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getRefundStatusColor(order.refund_status)}`}>
                      {order.refund_status}
                    </span>
                  </div>
                  {order.razorpay_refund_id && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Refund ID: {order.razorpay_refund_id}
                    </div>
                  )}
                  {order.refund_notes && (
                    <div className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-white/5 p-2 rounded">
                      Notes: {order.refund_notes}
                    </div>
                  )}
                  <Button
                    onClick={() => {
                      setRefundStatus(order.refund_status || "started");
                      setRefundId(order.razorpay_refund_id || "");
                      setRefundNotes(order.refund_notes || "");
                      setShowRefundModal(true);
                    }}
                    variant="outline"
                    className="w-full border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Update Refund Status
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This order was cancelled and requires a refund. Click below to start the refund process.
                  </p>
                  <Button
                    onClick={() => {
                      setRefundStatus("started");
                      setShowRefundModal(true);
                    }}
                    className="w-full bg-[#D4AF37] hover:bg-[#C19B2E]"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Start Refund Process
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Refund Management Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg p-6 max-w-md w-full mx-4 border dark:border-white/10">
            <h3 className="font-serif text-xl mb-4 text-gray-900 dark:text-white">Manage Refund</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Refund Status</label>
                <select
                  value={refundStatus}
                  onChange={(e) => setRefundStatus(e.target.value as any)}
                  className="w-full px-4 py-2 border dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white"
                >
                  <option value="started">Started</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Refund ID (Optional)</label>
                <input
                  type="text"
                  value={refundId}
                  onChange={(e) => setRefundId(e.target.value)}
                  placeholder="Razorpay refund ID"
                  className="w-full px-4 py-2 border dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Notes (Optional)</label>
                <textarea
                  value={refundNotes}
                  onChange={(e) => setRefundNotes(e.target.value)}
                  placeholder="Add any notes about the refund..."
                  rows={3}
                  className="w-full px-4 py-2 border dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                onClick={updateRefundStatus}
                disabled={isUpdating}
                className="flex-1 bg-[#D4AF37] hover:bg-[#C19B2E]"
              >
                {isUpdating ? "Updating..." : "Update Refund"}
              </Button>
              <Button
                onClick={() => {
                  setShowRefundModal(false);
                  setRefundId("");
                  setRefundNotes("");
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg p-6 max-w-md w-full mx-4 border dark:border-white/10">
            <h3 className="font-serif text-xl mb-4 text-gray-900 dark:text-white">Assign Order to Worker</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Select Worker</label>
              
              {isLoadingWorkers ? (
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 py-2">
                  Loading workers...
                </div>
              ) : workersError ? (
                <div className="text-sm text-red-600 dark:text-red-400 mb-2 py-2 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">
                  {workersError}
                </div>
              ) : workers.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 py-2">
                  No workers available. Please add workers from the Workers page.
                </div>
              ) : null}
              
              <select
                value={selectedWorker}
                onChange={(e) => {
                  setSelectedWorker(e.target.value);
                }}
                className="w-full px-4 py-2 border dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white"
                disabled={isLoadingWorkers || workers.length === 0}
              >
                <option value="">Select a worker</option>
                {workers.map((worker) => (
                  <option key={worker.uid} value={worker.uid}>
                    {worker.name} {worker.email ? `(${worker.email})` : `(${worker.uid.substring(0, 8)}...)`}
                  </option>
                ))}
              </select>
              
              {workers.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {workers.length} worker{workers.length !== 1 ? 's' : ''} available
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                onClick={assignToWorker}
                disabled={!selectedWorker || isUpdating}
                className="flex-1 bg-[#D4AF37] hover:bg-[#C19B2E]"
              >
                Assign
              </Button>
              <Button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedWorker("");
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

