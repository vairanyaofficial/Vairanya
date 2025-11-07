import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createOrder } from "@/lib/orders-firestore";
import { updateProduct } from "@/lib/products-firestore";
import { incrementOfferUsage } from "@/lib/offers-firestore";
import type { Order } from "@/lib/orders-types";

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "test_secret";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData,
    } = body;

    // Verify payment signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generated_signature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(text)
      .digest("hex");

    const isSignatureValid = generated_signature === razorpay_signature;

    if (!isSignatureValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment verification failed: Invalid signature",
        },
        { status: 400 }
      );
    }

    if (!orderData) {
      return NextResponse.json(
        {
          success: false,
          error: "Order data is required",
        },
        { status: 400 }
      );
    }

    // Create order items
    const orderItems = orderData.items.map((item: any) => ({
      product_id: item.product_id,
      sku: item.sku,
      title: item.title,
      quantity: item.quantity,
      price: item.price,
      image: item.images?.[0],
    }));

    // Get user ID from orderData if available
    const userId = orderData.user_id || null;
    const offerId = orderData.offer_id || undefined;
    const discount = orderData.discount || 0;

    // Create order
    const order: Omit<Order, "id" | "order_number" | "created_at" | "updated_at"> = {
      items: orderItems,
      total: orderData.total,
      subtotal: orderData.subtotal,
      shipping: orderData.shipping,
      discount: discount,
      offer_id: offerId,
      customer: orderData.customer,
      shipping_address: orderData.shipping_address,
      payment_method: orderData.payment_method || "razorpay",
      payment_status: "paid",
      status: "confirmed",
      razorpay_order_id: razorpay_order_id,
      razorpay_payment_id: razorpay_payment_id,
      user_id: userId, // Link order to user
    };

    const savedOrder = await createOrder(order);

    // Increment offer usage if offer was applied
    if (offerId) {
      try {
        await incrementOfferUsage(offerId);
      } catch (offerError) {
        // Continue even if offer usage increment fails
        console.error("Failed to increment offer usage:", offerError);
      }
    }

    // Update inventory
    try {
      for (const item of orderItems) {
        const { getProductById } = await import("@/lib/products-firestore");
        const product = await getProductById(item.product_id);
        if (product) {
          await updateProduct(item.product_id, {
            stock_qty: Math.max(0, product.stock_qty - item.quantity),
          });
        }
      }
    } catch (inventoryError) {
      // Continue even if inventory update fails
    }

    return NextResponse.json({
      success: true,
      order_id: savedOrder.id,
      order_number: savedOrder.order_number,
      payment_id: razorpay_payment_id,
      message: "Payment verified and order created successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Payment verification failed",
      },
      { status: 500 }
    );
  }
}

