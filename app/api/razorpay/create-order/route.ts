import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

// Razorpay credentials - Key ID is public, Key Secret must be kept secure
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_1DP5mmOlF5G5ag";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "test_secret";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, items, customer, shipping_address } = body;

    // Validate amount (minimum ₹1 = 100 paise)
    if (!amount || amount < 100) {
      return NextResponse.json(
        { success: false, error: "Invalid amount. Minimum order value is ₹1" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!customer || !customer.name || !customer.email) {
      return NextResponse.json(
        { success: false, error: "Customer information is required" },
        { status: 400 }
      );
    }

    // Check if Razorpay keys are configured
    const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.error("Razorpay keys not configured");
      return NextResponse.json(
        { 
          success: false, 
          error: "Payment gateway not configured. Please contact support." 
        },
        { status: 500 }
      );
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });

    // Create Razorpay order (amount in paise for INR)
    const order = await razorpay.orders.create({
      amount: amount, // Amount in paise (smallest currency unit for INR)
      currency: "INR", // Indian Rupees
      receipt: `receipt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      notes: {
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone || "",
        items_count: items.length.toString(),
        shipping_city: shipping_address?.city || "",
        shipping_state: shipping_address?.state || "",
      },
    });

    return NextResponse.json({
      success: true,
      order: order,
    });
  } catch (error: any) {
    // Enhanced error logging
    console.error("Razorpay order creation error:", {
      message: error.message,
      description: error.description,
      field: error.field,
      source: error.source,
      step: error.step,
      reason: error.reason,
      metadata: error.metadata,
      statusCode: error.statusCode,
    });

    // Return more detailed error message
    const errorMessage = error.description || error.message || "Failed to create order";
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? {
          message: error.message,
          description: error.description,
          field: error.field,
        } : undefined,
      },
      { status: error.statusCode || 500 }
    );
  }
}

