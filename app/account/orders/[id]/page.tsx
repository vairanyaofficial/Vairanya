"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, Truck, CheckCircle, Clock, MapPin, XCircle, AlertCircle, Loader2, Save } from "lucide-react";
import type { Order } from "@/lib/orders-types";
import { useToast } from "@/components/ToastProvider";

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const { showToast } = useToast();

  const fetchAddresses = async () => {
    if (!user) return;
    try {
      const response = await fetch("/api/addresses");
      const data = await response.json();
      if (data.success && data.addresses) {
        setAddresses(data.addresses || []);
      }
    } catch (error) {
      // Silently fail - addresses are optional for this page
    }
  };

  const fetchOrder = async () => {
    if (!user) return;
    
    try {
      const orderId = params.id as string;
      const response = await fetch(`/api/orders/${orderId}`);
      const data = await response.json();
      
      if (data.success && data.order) {
        // Verify order belongs to user
        if (data.order.user_id !== (user.id || user.uid)) {
          router.push("/account");
          return;
        }
        setOrder(data.order);
      } else {
        router.push("/account");
      }
    } catch (error) {
      router.push("/account");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push("/login?callbackUrl=/account");
      return;
    }

    fetchOrder();
    fetchAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router, params.id]);

  const handleCancelOrder = async () => {
    if (!order || !user) return;

    try {
      setIsCancelling(true);
      
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "cancel" }),
      });

      const data = await response.json();

      if (data.success) {
        showToast(data.message || "Order cancelled successfully");
        setShowCancelDialog(false);
        // Reload order to get updated status
        await fetchOrder();
      } else {
        showToast(data.error || "Failed to cancel order");
      }
    } catch (error) {
      showToast("Failed to cancel order. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };

  const canCancelOrder = () => {
    if (!order) return false;
    const cancellableStatuses = ["pending", "confirmed", "processing", "packing"];
    return cancellableStatuses.includes(order.status);
  };

  const saveAddressFromOrder = async (event?: React.MouseEvent<HTMLButtonElement>) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!order || !user) return;

    // Prevent multiple clicks
    if (isSavingAddress) {
      return;
    }

    // Check if address already exists
    const addressExists = addresses.some((addr) => {
      return (
        addr.address_line1.toLowerCase().trim() === order.shipping_address.address_line1.toLowerCase().trim() &&
        addr.city.toLowerCase().trim() === order.shipping_address.city.toLowerCase().trim() &&
        addr.state.toLowerCase().trim() === order.shipping_address.state.toLowerCase().trim() &&
        addr.pincode.trim() === order.shipping_address.pincode.trim() &&
        addr.name.toLowerCase().trim() === order.shipping_address.name.toLowerCase().trim()
      );
    });

    if (addressExists) {
      showToast("This address is already saved");
      return;
    }

    try {
      setIsSavingAddress(true);

      const addressData = {
        name: order.shipping_address.name,
        address_line1: order.shipping_address.address_line1,
        address_line2: order.shipping_address.address_line2 || "",
        city: order.shipping_address.city,
        state: order.shipping_address.state,
        pincode: order.shipping_address.pincode,
        country: order.shipping_address.country,
        phone: order.customer.phone || "",
        is_default: false,
      };

      const response = await fetch("/api/addresses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(addressData),
      });

      const data = await response.json();
      if (data.success) {
        await fetchAddresses(); // Refresh addresses list
        showToast("Address saved successfully!");
      } else {
        showToast(data.error || "Failed to save address");
      }
    } catch (error) {
      showToast("Failed to save address");
    } finally {
      setIsSavingAddress(false);
    }
  };

  const getRefundStatusColor = (status: string) => {
    switch (status) {
      case "started":
        return "bg-yellow-100 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-300";
      case "processing":
        return "bg-blue-100 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300";
      case "completed":
        return "bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-300";
      case "failed":
        return "bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-300";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200";
    }
  };

  const getRefundStatusText = (status: string) => {
    switch (status) {
      case "started":
        return "Refund Started";
      case "processing":
        return "Refund Processing";
      case "completed":
        return "Refund Completed";
      case "failed":
        return "Refund Failed";
      default:
        return "Refund Status";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200";
      case "confirmed":
        return "bg-blue-100 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300";
      case "processing":
        return "bg-yellow-100 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-300";
      case "packing":
        return "bg-purple-100 dark:bg-purple-950/30 text-purple-800 dark:text-purple-300";
      case "packed":
        return "bg-indigo-100 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-300";
      case "shipped":
        return "bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-300";
      case "delivered":
        return "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300";
      case "cancelled":
        return "bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-300";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200";
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
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading || !order) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] dark:bg-black">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <p className="text-gray-600 dark:text-gray-400">Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-black">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Account
        </Link>

        <div className="glass-card rounded-lg border border-gray-200/50 dark:border-white/10 p-6 mb-6 backdrop-blur-md">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-serif text-2xl mb-2 text-gray-900 dark:text-white">Order {order.order_number}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Placed on {new Date(order.created_at).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <span
              className={`px-3 py-1 text-sm rounded-full flex items-center gap-2 ${getStatusColor(
                order.status
              )}`}
            >
              {getStatusIcon(order.status)}
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Next Steps
            </h3>
            <div className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
              {order.status === "pending" && (
                <>
                  <p>• Your order is being reviewed and will be confirmed shortly</p>
                  <p>• You'll receive an email confirmation once your order is confirmed</p>
                  <p>• Payment will be processed upon confirmation</p>
                </>
              )}
              {order.status === "confirmed" && (
                <>
                  <p>• Your order has been confirmed and is being prepared</p>
                  <p>• We'll start processing your order within 24 hours</p>
                  <p>• You'll receive updates as your order progresses</p>
                </>
              )}
              {order.status === "processing" && (
                <>
                  <p>• Your order is currently being processed</p>
                  <p>• Our team is preparing your items with care</p>
                  <p>• You'll be notified when it moves to packing</p>
                </>
              )}
              {order.status === "packing" && (
                <>
                  <p>• Your order is being packed and prepared for shipment</p>
                  <p>• Quality checks are being performed</p>
                  <p>• You'll receive tracking information once shipped</p>
                </>
              )}
              {order.status === "packed" && (
                <>
                  <p>• Your order has been packed and is ready for shipment</p>
                  <p>• It will be handed over to the courier soon</p>
                  <p>• Tracking details will be shared via email</p>
                </>
              )}
              {order.status === "shipped" && (
                <>
                  <p>• Your order is on its way!</p>
                  <p>• Track your shipment using the tracking number above</p>
                  <p>• Expected delivery: 3-5 business days</p>
                </>
              )}
              {order.status === "delivered" && (
                <>
                  <p>• Your order has been delivered successfully</p>
                  <p>• We hope you love your purchase!</p>
                  <p>• Share your feedback or contact us if you need any assistance</p>
                </>
              )}
              {order.status === "cancelled" && (
                <>
                  <p>• Your order has been cancelled</p>
                  {order.refund_status && (
                    <p>• Refund status is shown above</p>
                  )}
                  <p>• If you have any questions, please contact our support team</p>
                </>
              )}
            </div>
          </div>

          {/* Cancel Order Button */}
          {canCancelOrder() && (
            <div className="mb-6">
              <Button
                onClick={() => setShowCancelDialog(true)}
                variant="outline"
                className="border-red-500 dark:border-red-500/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Order
              </Button>
            </div>
          )}

          {/* Refund Status */}
          {order.status === "cancelled" && order.refund_status && (
            <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800/50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-300">Refund Status</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-yellow-800 dark:text-yellow-300">Status:</span>
                  <span className={`px-3 py-1 text-xs rounded-full ${getRefundStatusColor(order.refund_status)}`}>
                    {getRefundStatusText(order.refund_status)}
                  </span>
                </div>
                
                {/* Refund Progress Steps */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                      order.refund_status === "started" || order.refund_status === "processing" || order.refund_status === "completed"
                        ? "bg-green-500 text-white"
                        : "bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                    }`}>
                      {order.refund_status === "started" || order.refund_status === "processing" || order.refund_status === "completed" ? "✓" : "1"}
                    </div>
                    <span className={`text-sm ${order.refund_status === "started" || order.refund_status === "processing" || order.refund_status === "completed" ? "text-green-700 dark:text-green-400 font-medium" : "text-gray-600 dark:text-gray-400"}`}>
                      Refund Started
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                      order.refund_status === "processing" || order.refund_status === "completed"
                        ? "bg-green-500 text-white"
                        : order.refund_status === "started"
                        ? "bg-yellow-500 text-white"
                        : "bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                    }`}>
                      {order.refund_status === "processing" || order.refund_status === "completed" ? "✓" : order.refund_status === "started" ? "2" : "2"}
                    </div>
                    <span className={`text-sm ${order.refund_status === "processing" || order.refund_status === "completed" ? "text-green-700 dark:text-green-400 font-medium" : order.refund_status === "started" ? "text-yellow-700 dark:text-yellow-400 font-medium" : "text-gray-600 dark:text-gray-400"}`}>
                      Refund Processing
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                      order.refund_status === "completed"
                        ? "bg-green-500 text-white"
                        : order.refund_status === "processing"
                        ? "bg-yellow-500 text-white"
                        : "bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                    }`}>
                      {order.refund_status === "completed" ? "✓" : order.refund_status === "processing" ? "3" : "3"}
                    </div>
                    <span className={`text-sm ${order.refund_status === "completed" ? "text-green-700 dark:text-green-400 font-medium" : order.refund_status === "processing" ? "text-yellow-700 dark:text-yellow-400 font-medium" : "text-gray-600 dark:text-gray-400"}`}>
                      Refund Completed
                    </span>
                  </div>
                </div>

                {order.refund_status === "completed" && (
                  <p className="text-xs text-green-700 dark:text-green-400 mt-3 font-medium">
                    ✓ Your refund has been processed and will be credited to your account within 5-7 business days.
                  </p>
                )}
                {order.refund_status === "processing" && (
                  <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-3">
                    Your refund is being processed. This may take 3-5 business days.
                  </p>
                )}
                {order.refund_status === "started" && (
                  <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-3">
                    Your refund request has been initiated. Processing will begin shortly.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Tracking Info */}
          {order.tracking_number && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-blue-900 dark:text-blue-300">Tracking Information</h3>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
                Tracking Number: <span className="font-mono font-semibold">{order.tracking_number}</span>
              </p>
              <a
                href={`https://www.shiprocket.in/shipment-tracking/${order.tracking_number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 underline"
              >
                Track Your Shipment
                <Truck className="h-4 w-4" />
              </a>
              {order.status === "shipped" && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  Your order has been shipped and is on its way!
                </p>
              )}
            </div>
          )}

          {/* Order Items */}
          <div className="mb-6">
            <h2 className="font-semibold mb-4 text-gray-900 dark:text-white">Order Items</h2>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex gap-4 border-b border-gray-200 dark:border-white/10 pb-3">
                  <div className="h-20 w-20 flex-shrink-0 bg-gray-100 dark:bg-[#1a1a1a] rounded overflow-hidden">
                    {item.image && (
                      <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">{item.title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">SKU: {item.sku}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">₹{item.price * item.quantity}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">₹{item.price} each</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => saveAddressFromOrder(e)}
                  disabled={isSavingAddress}
                  className="border-2 border-[#D4AF37] hover:bg-[#D4AF37] hover:text-white rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white"
                >
                  <Save className="h-4 w-4 mr-1" />
                  {isSavingAddress ? "Saving..." : "Save Address"}
                </Button>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p className="font-medium text-gray-900 dark:text-white">{order.shipping_address.name}</p>
                <p>{order.shipping_address.address_line1}</p>
                {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
                <p>
                  {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.pincode}
                </p>
                <p>{order.shipping_address.country}</p>
                {order.customer.phone && <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Phone: {order.customer.phone}</p>}
              </div>
            </div>

            <div>
              <h2 className="font-semibold mb-4 text-gray-900 dark:text-white">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="text-gray-900 dark:text-white">₹{order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                  <span className="text-gray-900 dark:text-white">{order.shipping === 0 ? "Free" : `₹${order.shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 dark:border-white/10 pt-2 font-semibold">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-gray-900 dark:text-white">₹{order.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 mt-2">
                  <span>Payment Method</span>
                  <span className="uppercase">{order.payment_method}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500">
                  <span>Payment Status</span>
                  <span className="capitalize">{order.payment_status}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Confirmation Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-lg border border-gray-200/50 dark:border-white/10 p-6 max-w-md w-full backdrop-blur-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 dark:bg-red-950/30 rounded-full p-2">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-serif text-xl text-gray-900 dark:text-white">Cancel Order?</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to cancel order <strong className="text-gray-900 dark:text-white">{order?.order_number}</strong>? 
              {order?.payment_status === "paid" && order?.payment_method !== "cod" && (
                <span className="block mt-2 text-sm">
                  A refund will be initiated if payment was made.
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowCancelDialog(false)}
                variant="outline"
                className="flex-1 border-gray-300 dark:border-white/20 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                disabled={isCancelling}
              >
                No, Keep Order
              </Button>
              <Button
                onClick={handleCancelOrder}
                disabled={isCancelling}
                className="flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white disabled:opacity-50"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Yes, Cancel Order
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

