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
  User,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  Loader2,
  Printer,
  FileText,
} from "lucide-react";
import { getAdminSession } from "@/lib/admin-auth";
import { useToast } from "@/components/ToastProvider";
import type { Order } from "@/lib/orders-types";
import OrderWorkflowProgress from "@/components/OrderWorkflowProgress";

export default function WorkerOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoadingRef, setIsLoadingRef] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    // Check session inside useEffect to prevent re-renders
    const session = getAdminSession();
    if (!session) {
      setIsLoading(false);
      // Use setTimeout to prevent redirect loop
      setTimeout(() => {
        router.replace("/worker/dashboard");
      }, 100);
      return;
    }
    
    // Load when orderId changes and we're not already loading
    if (orderId) {
      loadOrderData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]); // Only depend on orderId

  const loadOrderData = async () => {
    if (isLoadingRef) {
      return;
    }
    
    try {
      setIsLoadingRef(true);
      setIsLoading(true);
      const sessionData = getAdminSession();
      if (!sessionData) {
        setIsLoading(false);
        setIsLoadingRef(false);
        showToast("Session expired. Please login again.");
        // Use setTimeout to prevent redirect loop
        setTimeout(() => {
          router.replace("/worker/dashboard");
        }, 100);
        return;
      }

      // Load order
      const orderRes = await fetch(`/api/admin/orders/${orderId}`, {
        headers: { 
          "x-admin-username": sessionData.username,
          "x-admin-role": sessionData.role,
        },
      });
      const orderData = await orderRes.json();
      
      if (!orderData.success) {
        setIsLoading(false);
        setIsLoadingRef(false);
        showToast(orderData.error || "Failed to load order");
        // Use setTimeout to prevent redirect loop
        setTimeout(() => {
          router.replace("/worker/dashboard");
        }, 100);
        return;
      }

      const order = orderData.order;
      
      // Check if worker has access to this order
      if (sessionData.role === "worker") {
        if (order.assigned_to !== sessionData.username) {
          setIsLoading(false);
          setIsLoadingRef(false);
          showToast("You don't have access to this order");
          setTimeout(() => {
            router.replace("/worker/dashboard");
          }, 100);
          return;
        }
      }

      setOrder(order);
      
    } catch (err) {
      showToast("Failed to load order");
      // Use setTimeout to prevent redirect loop
      setTimeout(() => {
        router.replace("/worker/dashboard");
      }, 100);
    } finally {
      setIsLoading(false);
      setIsLoadingRef(false);
    }
  };


  const updateOrderStatus = async (newStatus: Order["status"]) => {
    if (!order) {
      return;
    }

    try {
      setIsUpdating(true);
      const sessionData = getAdminSession();
      if (!sessionData) {
        showToast("Session expired. Please login again.");
        return;
      }

      if (sessionData.role === "worker" && order.assigned_to !== sessionData.username) {
        showToast("You can only update orders assigned to you");
        return;
      }

      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-username": sessionData.username,
          "x-admin-role": sessionData.role,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        showToast(`Order status updated to ${newStatus} successfully! ✅`);
        await loadOrderData();
      } else {
        showToast(data.error || "Failed to update order status");
      }
    } catch (err) {
      showToast("Failed to update order status. Please try again.");
    } finally {
      setIsUpdating(false);
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
      case "in_progress":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300";
      case "completed":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300";
    }
  };

  const printAddressAndInvoice = () => {
    if (!order) return;
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const address = order.shipping_address;
    const customer = order.customer;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Address & Invoice - ${order.order_number}</title>
          <style>
            @media print {
              @page { margin: 0.5cm; }
              body { margin: 0; }
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              border-bottom: 2px solid #D4AF37;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              color: #2E2E2E;
              font-size: 24px;
            }
            .section {
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            .section h2 {
              color: #D4AF37;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
              margin-bottom: 15px;
              font-size: 18px;
            }
            .address-box {
              border: 2px solid #2E2E2E;
              padding: 15px;
              background: #f9f9f9;
              line-height: 1.8;
            }
            .invoice-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            .invoice-table th,
            .invoice-table td {
              padding: 10px;
              text-align: left;
              border-bottom: 1px solid #ddd;
            }
            .invoice-table th {
              background: #f5f5f5;
              font-weight: bold;
            }
            .total-row {
              font-weight: bold;
              font-size: 16px;
              background: #f9f9f9;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
            }
            .info-label {
              font-weight: bold;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Order ${order.order_number}</h1>
            <p>Date: ${new Date(order.created_at).toLocaleString()}</p>
          </div>

          <div class="section">
            <h2>Shipping Address</h2>
            <div class="address-box">
              <strong>${address.name}</strong><br>
              ${address.address_line1}<br>
              ${address.address_line2 ? address.address_line2 + '<br>' : ''}
              ${address.city}, ${address.state} - ${address.pincode}<br>
              ${address.country}
            </div>
          </div>

          <div class="section">
            <h2>Customer Information</h2>
            <div class="info-row">
              <span class="info-label">Name:</span>
              <span>${customer.name}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span>${customer.email}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Phone:</span>
              <span>${customer.phone}</span>
            </div>
          </div>

          <div class="section">
            <h2>Invoice</h2>
            <table class="invoice-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>SKU</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td>${item.title}</td>
                    <td>${item.sku}</td>
                    <td>${item.quantity}</td>
                    <td>₹${item.price.toLocaleString()}</td>
                    <td>₹${(item.price * item.quantity).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4" style="text-align: right;"><strong>Subtotal:</strong></td>
                  <td><strong>₹${order.subtotal.toLocaleString()}</strong></td>
                </tr>
                <tr>
                  <td colspan="4" style="text-align: right;"><strong>Shipping:</strong></td>
                  <td><strong>${order.shipping === 0 ? 'Free' : '₹' + order.shipping.toLocaleString()}</strong></td>
                </tr>
                <tr class="total-row">
                  <td colspan="4" style="text-align: right;"><strong>Total:</strong></td>
                  <td><strong>₹${order.total.toLocaleString()}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div class="section">
            <div class="info-row">
              <span class="info-label">Payment Method:</span>
              <span>${order.payment_method}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Payment Status:</span>
              <span>${order.payment_status}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Order Status:</span>
              <span>${order.status}</span>
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const printBillDetails = () => {
    if (!order) return;
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const customer = order.customer;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bill Details - ${order.order_number}</title>
          <style>
            @media print {
              @page { margin: 1cm; }
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #D4AF37;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              margin: 0;
              color: #2E2E2E;
              font-size: 28px;
            }
            .header p {
              margin: 5px 0;
              color: #666;
            }
            .billing-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin-bottom: 30px;
            }
            .info-box h3 {
              color: #D4AF37;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
              margin-bottom: 10px;
            }
            .info-box p {
              margin: 5px 0;
              line-height: 1.6;
            }
            .invoice-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .invoice-table th,
            .invoice-table td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #ddd;
            }
            .invoice-table th {
              background: #2E2E2E;
              color: white;
              font-weight: bold;
            }
            .invoice-table tbody tr:hover {
              background: #f9f9f9;
            }
            .total-section {
              margin-top: 20px;
              text-align: right;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #ddd;
            }
            .total-row.final {
              font-weight: bold;
              font-size: 18px;
              border-top: 2px solid #D4AF37;
              border-bottom: 2px solid #D4AF37;
              padding: 15px 0;
              margin-top: 10px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>INVOICE</h1>
            <p>Order Number: ${order.order_number}</p>
            <p>Date: ${new Date(order.created_at).toLocaleString()}</p>
          </div>

          <div class="billing-info">
            <div class="info-box">
              <h3>Bill To:</h3>
              <p><strong>${customer.name}</strong></p>
              <p>${customer.email}</p>
              <p>${customer.phone}</p>
            </div>
            <div class="info-box">
              <h3>Ship To:</h3>
              <p><strong>${order.shipping_address.name}</strong></p>
              <p>${order.shipping_address.address_line1}</p>
              ${order.shipping_address.address_line2 ? `<p>${order.shipping_address.address_line2}</p>` : ''}
              <p>${order.shipping_address.city}, ${order.shipping_address.state} - ${order.shipping_address.pincode}</p>
              <p>${order.shipping_address.country}</p>
            </div>
          </div>

          <table class="invoice-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>SKU</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${item.title}</td>
                  <td>${item.sku}</td>
                  <td>${item.quantity}</td>
                  <td>₹${item.price.toLocaleString()}</td>
                  <td>₹${(item.price * item.quantity).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>₹${order.subtotal.toLocaleString()}</span>
            </div>
            <div class="total-row">
              <span>Shipping:</span>
              <span>${order.shipping === 0 ? 'Free' : '₹' + order.shipping.toLocaleString()}</span>
            </div>
            <div class="total-row final">
              <span>Total Amount:</span>
              <span>₹${order.total.toLocaleString()}</span>
            </div>
          </div>

          <div style="margin-top: 30px; padding: 15px; background: #f9f9f9; border-radius: 5px;">
            <p><strong>Payment Method:</strong> ${order.payment_method}</p>
            <p><strong>Payment Status:</strong> ${order.payment_status}</p>
            <p><strong>Order Status:</strong> ${order.status}</p>
          </div>

          <div class="footer">
            <p>Thank you for your order!</p>
            <p>This is a computer-generated invoice.</p>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const printShippingLabel = () => {
    if (!order) return;
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const address = order.shipping_address;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Shipping Label - ${order.order_number}</title>
          <style>
            @media print {
              @page { 
                margin: 0.5cm;
                size: A4;
              }
              body { margin: 0; }
            }
            body {
              font-family: Arial, sans-serif;
              padding: 0;
              margin: 0;
            }
            .label-container {
              width: 100%;
              max-width: 400px;
              margin: 20px auto;
              border: 3px solid #2E2E2E;
              padding: 25px;
              box-sizing: border-box;
              background: white;
            }
            .label-header {
              border-bottom: 2px solid #D4AF37;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            .label-header h1 {
              margin: 0;
              font-size: 20px;
              color: #2E2E2E;
            }
            .label-header p {
              margin: 5px 0 0 0;
              font-size: 14px;
              color: #666;
            }
            .address-section {
              line-height: 2;
              font-size: 16px;
            }
            .address-section strong {
              font-size: 18px;
              color: #2E2E2E;
              display: block;
              margin-bottom: 8px;
            }
            .order-info {
              margin-top: 20px;
              padding-top: 15px;
              border-top: 1px solid #ddd;
              font-size: 14px;
            }
            .order-info p {
              margin: 5px 0;
            }
            .barcode-area {
              margin-top: 20px;
              padding: 10px;
              border: 1px dashed #999;
              text-align: center;
              font-family: monospace;
              font-size: 24px;
              letter-spacing: 3px;
            }
            @media print {
              .label-container {
                margin: 0;
                page-break-after: always;
              }
            }
          </style>
        </head>
        <body>
          <div class="label-container">
            <div class="label-header">
              <h1>SHIPPING LABEL</h1>
              <p>Order #${order.order_number}</p>
            </div>
            
            <div class="address-section">
              <strong>${address.name}</strong>
              ${address.address_line1}<br>
              ${address.address_line2 ? address.address_line2 + '<br>' : ''}
              ${address.city}, ${address.state} - ${address.pincode}<br>
              ${address.country}
            </div>

            <div class="order-info">
              <p><strong>Order Number:</strong> ${order.order_number}</p>
              <p><strong>Items:</strong> ${order.items.length} item(s)</p>
              <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
            </div>

            <div class="barcode-area">
              ${order.order_number}
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
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
          <Link href="/worker/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Button asChild variant="outline">
          <Link href="/worker/dashboard">
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
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-6 border dark:border-white/10">
            <h2 className="font-serif text-xl mb-4 text-gray-900 dark:text-white">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center gap-4 pb-4 border-b dark:border-white/10 last:border-0">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-16 h-16 object-cover rounded border dark:border-white/10"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{item.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">SKU: {item.sku}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Quantity: {item.quantity} × ₹{item.price}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    ₹{(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t dark:border-white/10 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="text-gray-900 dark:text-white">₹{order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                <span className="text-gray-900 dark:text-white">{order.shipping === 0 ? "Free" : `₹${order.shipping}`}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold pt-2 border-t dark:border-white/10">
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
            
            {/* Status Update Buttons for Workers */}
            {(() => {
              const sessionData = getAdminSession();
              const canUpdate = sessionData?.role === "worker" && order.assigned_to === sessionData.username;
              
              if (!canUpdate) return null;
              
              // Simplified status flow
              const statusFlow: Record<Order["status"], Order["status"] | null> = {
                "pending": "confirmed",
                "confirmed": "processing",
                "processing": "packed",
                "packing": "packed",
                "packed": "shipped",
                "shipped": "delivered",
                "delivered": null,
                "cancelled": null,
              };
              
              const nextStatus = statusFlow[order.status];
              
              if (!nextStatus) return null;
              
              const getButtonText = (status: Order["status"]) => {
                switch (status) {
                  case "confirmed":
                    return "Confirm Order";
                  case "processing":
                    return "Start Processing";
                  case "packed":
                    return "Mark as Packed";
                  case "shipped":
                    return "Mark as Shipped";
                  case "delivered":
                    return "Mark as Delivered";
                  default:
                    return `Move to ${status.charAt(0).toUpperCase() + status.slice(1)}`;
                }
              };
              
              return (
                <div className="mt-4 pt-4 border-t dark:border-white/10">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Update Status:</p>
                  <Button
                    onClick={() => updateOrderStatus(nextStatus)}
                    disabled={isUpdating}
                    className="w-full bg-[#D4AF37] hover:bg-[#C19B2E] text-white disabled:opacity-50"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        {getButtonText(nextStatus)}
                      </>
                    )}
                  </Button>
                </div>
              );
            })()}

            {/* Next Steps */}
            <div className="mt-4 pt-4 border-t dark:border-white/10">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-[#D4AF37]" />
                Next Steps
              </h3>
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                {order.status === "pending" && (
                  <>
                    <p>• Review the order details and confirm the order</p>
                    <p>• Verify payment status before confirming</p>
                    <p>• Click "Confirm Order" button above to proceed</p>
                  </>
                )}
                {order.status === "confirmed" && (
                  <>
                    <p>• Start processing the order items</p>
                    <p>• Verify all items are available and in good condition</p>
                    <p>• Click "Start Processing" when ready to begin</p>
                  </>
                )}
                {order.status === "processing" && (
                  <>
                    <p>• Process and pack all order items</p>
                    <p>• Ensure quality checks are performed</p>
                    <p>• Mark as packed when ready for shipping</p>
                  </>
                )}
                {order.status === "packed" && (
                  <>
                    <p>• Prepare shipment label and tracking information</p>
                    <p>• Hand over to courier partner</p>
                    <p>• Update status to "Shipped" after dispatch</p>
                  </>
                )}
                {order.status === "shipped" && (
                  <>
                    <p>• Monitor shipment tracking</p>
                    <p>• Ensure customer receives the order</p>
                    <p>• Mark as "Delivered" upon successful delivery</p>
                  </>
                )}
                {order.status === "delivered" && (
                  <>
                    <p>• Order has been successfully delivered</p>
                    <p>• No further action required</p>
                    <p>• Order is complete</p>
                  </>
                )}
                {order.status === "cancelled" && (
                  <>
                    <p>• Order has been cancelled</p>
                    <p>• Process refund if payment was received</p>
                    <p>• Update refund status as needed</p>
                  </>
                )}
              </div>
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
                      : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                  }`}
                >
                  {order.payment_status}
                </span>
              </div>
            </div>
          </div>

          {/* Print Options */}
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-6 border dark:border-white/10">
            <h2 className="font-serif text-xl mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
              <Printer className="h-5 w-5" />
              Print Options
            </h2>
            <div className="space-y-3">
              <Button
                onClick={printAddressAndInvoice}
                className="w-full bg-[#D4AF37] hover:bg-[#C19B2E] text-white"
                variant="default"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Address & Invoice
              </Button>
              <Button
                onClick={printBillDetails}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                variant="default"
              >
                <FileText className="h-4 w-4 mr-2" />
                Print Bill Details
              </Button>
              <Button
                onClick={printShippingLabel}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                variant="default"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Print Shipping Label
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              Shipping label is designed to be stuck on the box
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

