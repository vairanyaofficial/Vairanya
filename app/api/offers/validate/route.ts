// app/api/offers/validate/route.ts - Validate and apply offer
import { NextRequest, NextResponse } from "next/server";
import { getOfferById, getOfferByCode, hasUserUsedOffer } from "@/lib/offers-mongodb";
import { initializeMongoDB } from "@/lib/mongodb.server";

// POST - Validate offer and calculate discount
export async function POST(request: NextRequest) {
  try {
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { offer_id, offer_code, subtotal, customer_email, customer_id } = body;

    // Accept either offer_id or offer_code
    if (!offer_id && !offer_code) {
      return NextResponse.json(
        { success: false, error: "Offer ID or code is required" },
        { status: 400 }
      );
    }

    if (subtotal === undefined || subtotal === null) {
      return NextResponse.json(
        { success: false, error: "Subtotal is required" },
        { status: 400 }
      );
    }

    // Get the offer by ID or code
    let offer = null;
    if (offer_id) {
      offer = await getOfferById(offer_id);
    } else if (offer_code) {
      offer = await getOfferByCode(offer_code);
    }

    if (!offer) {
      return NextResponse.json(
        { success: false, error: "Offer not found" },
        { status: 404 }
      );
    }

    // Check if offer is active
    if (!offer.is_active) {
      return NextResponse.json(
        { success: false, error: "This offer is not active" },
        { status: 400 }
      );
    }

    // Check validity dates
    const now = new Date();
    const validFrom = new Date(offer.valid_from);
    const validUntil = new Date(offer.valid_until);

    if (now < validFrom || now > validUntil) {
      return NextResponse.json(
        { success: false, error: "This offer has expired or is not yet valid" },
        { status: 400 }
      );
    }

    // Check usage limit
    if (offer.usage_limit && offer.used_count >= offer.usage_limit) {
      return NextResponse.json(
        { success: false, error: "This offer has reached its usage limit" },
        { status: 400 }
      );
    }

    // Check if user has already used this offer (one_time_per_user)
    if (offer.one_time_per_user) {
      const hasUsed = await hasUserUsedOffer(offer.id, customer_email, customer_id);
      if (hasUsed) {
        return NextResponse.json(
          { success: false, error: "You have already used this offer" },
          { status: 400 }
        );
      }
    }

    // Check if offer is for specific customer
    if (offer.customer_email || offer.customer_emails || offer.customer_id || offer.customer_ids) {
      let isEligible = false;
      
      if (customer_email) {
        if (offer.customer_email === customer_email) isEligible = true;
        if (offer.customer_emails && offer.customer_emails.includes(customer_email)) isEligible = true;
      }
      
      if (customer_id) {
        if (offer.customer_id === customer_id) isEligible = true;
        if (offer.customer_ids && offer.customer_ids.includes(customer_id)) isEligible = true;
      }
      
      if (!isEligible) {
        return NextResponse.json(
          { success: false, error: "This offer is not available for your account" },
          { status: 403 }
        );
      }
    }

    // Check minimum order amount
    if (offer.min_order_amount && subtotal < offer.min_order_amount) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Minimum order amount of ₹${offer.min_order_amount} required`,
          min_order_amount: offer.min_order_amount
        },
        { status: 400 }
      );
    }

    // Calculate discount
    let discount = 0;
    if (offer.discount_type === "percentage") {
      discount = (subtotal * offer.discount_value) / 100;
      // Apply max discount limit if set
      if (offer.max_discount && discount > offer.max_discount) {
        discount = offer.max_discount;
      }
    } else {
      // Fixed discount
      discount = offer.discount_value;
      // Don't allow discount to exceed subtotal
      if (discount > subtotal) {
        discount = subtotal;
      }
    }

    return NextResponse.json({
      success: true,
      offer: {
        id: offer.id,
        title: offer.title,
        description: offer.description,
        discount_type: offer.discount_type,
        discount_value: offer.discount_value,
      },
      discount: Math.round(discount * 100) / 100, // Round to 2 decimal places
    });
  } catch (error: any) {
    console.error("Error validating offer:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to validate offer",
        message: String(error?.message || error),
      },
      { status: 500 }
    );
  }
}

