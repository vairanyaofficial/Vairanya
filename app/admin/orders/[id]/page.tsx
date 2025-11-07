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
import type { Order, Task } from "@/lib/orders-types";
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoadingWorkers, setIsLoadingWorkers] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState("");
  const [refundStatus, setRefundStatus] = useState<"started" | "processing" | "completed" | "failed">("started");
  const [refundId, setRefundId] = useState("");
  const [refundNotes, setRefundNotes] = useState("");
  const session = getAdminSession();
  const { showError, showSuccess, showWarning } = useToast();

  useEffect(() => {
    // Initial load
    loadOrderData(true); // Show loading on initial load
    if (isSuperUser()) {
      loadWorkers();
    }
    
    // Auto-refresh every 3 seconds for real-time updates
    const refreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadOrderData(false); // Silent refresh - no loading indicator
      }
    }, 3000); // 3 seconds
    
    // Refresh when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadOrderData(true); // Show loading when tab becomes visible
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(refreshInterval);
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
    try {
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
      }

      // Load tasks
      const tasksRes = await fetch(`/api/admin/tasks?order_id=${orderId}`, {
        headers: { "x-admin-username": sessionData.username },
      });
      const tasksData = await tasksRes.json();
      if (tasksData.success) {
        setTasks(tasksData.tasks);
      }
    } catch (err) {
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  const loadWorkers = async () => {
    try {
      setIsLoadingWorkers(true);
      const sessionData = getAdminSession();
      if (!sessionData) {
        return;
      }

      const res = await fetch("/api/admin/workers", {
        headers: { "x-admin-username": sessionData.username },
      });

      const data = await res.json();

      if (data.success && data.workers) {
        const workerList = data.workers.filter(
          (w: Worker) => w.role === "worker"
        );
        setWorkers(workerList);
      } else {
        setWorkers([]);
      }
    } catch (err) {
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

  const createPackingTask = async () => {
    if (!order || !session) return;

    try {
      setIsUpdating(true);
      const sessionData = getAdminSession();
      if (!sessionData) return;

      const response = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-username": sessionData.username,
        },
        body: JSON.stringify({
          order_id: order.id,
          order_number: order.order_number,
          type: "packing",
          assigned_to: order.assigned_to || selectedWorker,
          priority: "high",
          status: "pending",
        }),
      });

      const data = await response.json();
      if (data.success) {
        loadOrderData();
        showSuccess("Packing task created successfully");
      }
    } catch (err) {
      showError("Failed to create packing task");
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
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-800";
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
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Order not found</p>
        <Button asChild variant="outline">
          <Link href="/admin/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }

  const nextStatus: Record<string, Order["status"]> = {
    pending: "confirmed",
    confirmed: "processing",
    processing: "packing",
    packing: "packed",
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
          <h1 className="font-serif text-3xl">Order {order.order_number}</h1>
          <p className="text-gray-600 text-sm">
            Placed on {new Date(order.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <h2 className="font-serif text-xl mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center gap-4 pb-4 border-b last:border-0">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                    <p className="text-sm text-gray-500">
                      Quantity: {item.quantity} × ₹{item.price}
                    </p>
                  </div>
                  <p className="font-semibold">
                    ₹{(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>₹{order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span>{order.shipping === 0 ? "Free" : `₹${order.shipping}`}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                <span>Total</span>
                <span>₹{order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Workflow Progress */}
          <OrderWorkflowProgress tasks={tasks} orderStatus={order.status} />

          {/* Tasks Details */}
          {tasks.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 border">
              <h2 className="font-serif text-xl mb-4">Task Details</h2>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <p className="font-medium capitalize">{task.type.replace("_", " ")}</p>
                      <p className="text-sm text-gray-500">
                        Assigned to: {workers.find((w) => w.uid === task.assigned_to)?.name || task.assigned_to} | Status: {task.status}
                      </p>
                      {task.completed_at && (
                        <p className="text-xs text-gray-400 mt-1">
                          Completed: {new Date(task.completed_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}
                    >
                      {task.status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Status */}
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <h2 className="font-serif text-xl mb-4">Order Status</h2>
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
                  onClick={() => updateOrderStatus(nextStatus[order.status]!)}
                  disabled={isUpdating}
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
                      Move to Packing
                    </>
                  ) : order.status === "packing" ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
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
              {/* Show create first task button if no tasks exist and order is assigned */}
              {tasks.length === 0 && order.status === "confirmed" && isSuperUser() && order.assigned_to && (
                <Button
                  onClick={createPackingTask}
                  disabled={isUpdating}
                  variant="outline"
                  className="w-full border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Start Workflow - Create Packing Task
                </Button>
              )}
              {tasks.length === 0 && order.status === "confirmed" && isSuperUser() && !order.assigned_to && (
                <p className="text-xs text-gray-500 text-center">
                  Assign order to a worker first to start workflow
                </p>
              )}
            </div>

            {/* Next Steps */}
            <div className="mt-4 pt-4 border-t">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-[#D4AF37]" />
                Next Steps
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
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
                      <p className="text-amber-600 font-medium">• ⚠️ Assign order to a worker first</p>
                    )}
                    <p>• Create workflow tasks for assigned worker</p>
                    <p>• Monitor order progress through the workflow</p>
                  </>
                )}
                {order.status === "processing" && (
                  <>
                    <p>• Ensure worker is processing order items</p>
                    <p>• Verify quality checks are being performed</p>
                    <p>• Move to packing when processing is complete</p>
                  </>
                )}
                {order.status === "packing" && (
                  <>
                    <p>• Monitor packing progress</p>
                    <p>• Ensure proper packaging standards are met</p>
                    <p>• Update status when packing is complete</p>
                  </>
                )}
                {order.status === "packed" && (
                  <>
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
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl">Assignment</h2>
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
              <p className="text-gray-600 mb-1">Assigned To:</p>
              <p className="font-medium">
                {order.assigned_to
                  ? workers.find((w) => w.uid === order.assigned_to)?.name ||
                    order.assigned_to
                  : "Unassigned"}
              </p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <h2 className="font-serif text-xl mb-4">Customer</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium">{order.customer.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm">{order.customer.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm">{order.customer.phone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <h2 className="font-serif text-xl mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Shipping Address
            </h2>
            <div className="text-sm space-y-1">
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
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <h2 className="font-serif text-xl mb-4">Payment</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Method:</span>
                <span className="font-medium capitalize">{order.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    order.payment_status === "paid"
                      ? "bg-green-100 text-green-800"
                      : order.payment_status === "refunded"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {order.payment_status}
                </span>
              </div>
              {order.razorpay_payment_id && (
                <div className="text-xs text-gray-500 mt-2">
                  Payment ID: {order.razorpay_payment_id}
                </div>
              )}
            </div>
          </div>

          {/* Refund Management - Only for superusers, cancelled orders with online payment */}
          {isSuperUser() && order.status === "cancelled" && order.payment_method !== "cod" && order.payment_status === "paid" && (
            <div className="bg-white rounded-lg shadow-sm p-6 border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-xl flex items-center gap-2">
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
                    <span className="text-gray-600">Refund Status:</span>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getRefundStatusColor(order.refund_status)}`}>
                      {order.refund_status}
                    </span>
                  </div>
                  {order.razorpay_refund_id && (
                    <div className="text-xs text-gray-500">
                      Refund ID: {order.razorpay_refund_id}
                    </div>
                  )}
                  {order.refund_notes && (
                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
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
                  <p className="text-sm text-gray-600">
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
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="font-serif text-xl mb-4">Manage Refund</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Refund Status</label>
                <select
                  value={refundStatus}
                  onChange={(e) => setRefundStatus(e.target.value as any)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                >
                  <option value="started">Started</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Refund ID (Optional)</label>
                <input
                  type="text"
                  value={refundId}
                  onChange={(e) => setRefundId(e.target.value)}
                  placeholder="Razorpay refund ID"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
                <textarea
                  value={refundNotes}
                  onChange={(e) => setRefundNotes(e.target.value)}
                  placeholder="Add any notes about the refund..."
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
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
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="font-serif text-xl mb-4">Assign Order to Worker</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select Worker</label>
              
              {isLoadingWorkers ? (
                <div className="text-sm text-gray-500 mb-2 py-2">
                  Loading workers...
                </div>
              ) : workers.length === 0 ? (
                <div className="text-sm text-gray-500 mb-2 py-2">
                  No workers available. Please add workers from the Workers page.
                </div>
              ) : null}
              
              <select
                value={selectedWorker}
                onChange={(e) => {
                  setSelectedWorker(e.target.value);
                }}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
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
                <p className="text-xs text-gray-500 mt-2">
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

