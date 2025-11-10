import { NextRequest, NextResponse } from "next/server";
import { createOrder } from "@/lib/orders-firestore";
import { updateProduct } from "@/lib/products-firestore";
import { incrementOfferUsage } from "@/lib/offers-firestore";
import { logger } from "@/lib/logger";
import { rateLimiters } from "@/lib/rate-limit";
import type { Order } from "@/lib/orders-types";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for order creation
    const rateLimitResult = rateLimiters.standard(request);
    if (!rateLimitResult.allowed) {
      logger.warn("Order creation rate limit exceeded", {
        ip: request.headers.get("x-forwarded-for"),
      });
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
            "X-RateLimit-Limit": "100",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(rateLimitResult.resetTime).toISOString(),
          },
        }
      );
    }

    const body = await request.json();
    const {
      items,
      total,
      subtotal,
      shipping,
      discount,
      offer_id,
      customer,
      shipping_address,
      payment_method,
      payment_status,
      status,
      user_id,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Order items are required" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!customer || !customer.name || !customer.email || !customer.phone) {
      return NextResponse.json(
        { success: false, error: "Customer information is required" },
        { status: 400 }
      );
    }

    if (!shipping_address || !shipping_address.address_line1 || !shipping_address.city || !shipping_address.state || !shipping_address.pincode) {
      return NextResponse.json(
        { success: false, error: "Shipping address is required" },
        { status: 400 }
      );
    }

    // Create order items - ensure no undefined values
    const orderItems = items.map((item: any) => {
      const orderItem: any = {
        product_id: item.product_id,
        sku: item.sku || item.product_id,
        title: item.title,
        quantity: item.quantity,
        price: item.price,
      };
      
      // Only include image if it exists
      const imageUrl = item.images?.[0] || item.image;
      if (imageUrl) {
        orderItem.image = imageUrl;
      }
      
      return orderItem;
    });

    // Clean shipping_address - remove undefined address_line2 if empty
    const cleanedShippingAddress: any = {
      name: shipping_address.name,
      address_line1: shipping_address.address_line1,
      city: shipping_address.city,
      state: shipping_address.state,
      pincode: shipping_address.pincode,
      country: shipping_address.country || "India",
    };
    
    // Only include address_line2 if it has a value
    if (shipping_address.address_line2 && shipping_address.address_line2.trim()) {
      cleanedShippingAddress.address_line2 = shipping_address.address_line2.trim();
    }

    // Create order - only include optional fields if they have values
    const order: Omit<Order, "id" | "order_number" | "created_at" | "updated_at"> = {
      items: orderItems,
      total: total || 0,
      subtotal: subtotal || 0,
      shipping: shipping || 0,
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
      shipping_address: cleanedShippingAddress,
      payment_method: payment_method || "cod",
      payment_status: payment_status || "pending",
      status: status || "pending",
    };

    // Only include user_id if it has a value
    if (user_id) {
      (order as any).user_id = user_id;
    }

    // Only include optional fields if they have values (not undefined)
    if (discount !== undefined && discount !== null && discount > 0) {
      (order as any).discount = discount;
    }
    
    if (offer_id !== undefined && offer_id !== null && offer_id !== "") {
      (order as any).offer_id = offer_id;
    }

    const savedOrder = await createOrder(order);

    // Increment offer usage if offer was applied
    if (offer_id) {
      try {
        await incrementOfferUsage(offer_id, customer.email, user_id || undefined);
      } catch (offerError) {
        // Continue even if offer usage increment fails
        logger.error("Failed to increment offer usage", offerError as Error);
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
      message: "Order created successfully",
    });
  } catch (error: any) {
    logger.error("Error creating order", error);
    
    // Check if it's a Firebase/Firestore initialization error
    if (error.message && error.message.includes("Database unavailable")) {
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error. Please contact support.",
          details: "Firebase Admin not initialized",
        },
        { status: 500 }
      );
    }

    // Check if it's a permission error
    if (error.code === 7 || error.code === "PERMISSION_DENIED" || error.message?.includes("403")) {
      return NextResponse.json(
        {
          success: false,
          error: "Permission denied. Please check Firebase configuration.",
          details: error.message,
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create order",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

