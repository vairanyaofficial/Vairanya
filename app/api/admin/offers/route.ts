// app/api/admin/offers/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getAllOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  getOfferById,
} from "@/lib/offers-mongodb";
import { requireAdmin } from "@/lib/admin-auth-server";
import type { Offer } from "@/lib/offers-types";
import { initializeMongoDB } from "@/lib/mongodb.server";

// GET - Fetch all offers
export async function GET(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 503 }
      );
    }
    const offers = await getAllOffers();
    
    return NextResponse.json({
      success: true,
      offers,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch offers",
        message: String(error?.message || error),
      },
      { status: 500 }
    );
  }
}

// POST - Create new offer
export async function POST(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const {
      title,
      description,
      code,
      discount_type,
      discount_value,
      min_order_amount,
      max_discount,
      valid_from,
      valid_until,
      is_active,
      customer_email,
      customer_emails,
      customer_id,
      customer_ids,
      usage_limit,
      one_time_per_user,
    } = body;

    if (!title || !discount_type || discount_value === undefined) {
      return NextResponse.json(
        { success: false, error: "Title, discount type, and discount value are required" },
        { status: 400 }
      );
    }

    // Convert date strings to ISO strings
    let validFromISO = valid_from;
    if (valid_from && !valid_from.includes("T")) {
      // If it's a date string like "2024-01-01", convert to ISO
      validFromISO = new Date(valid_from + "T00:00:00").toISOString();
    } else if (!valid_from) {
      validFromISO = new Date().toISOString();
    }

    let validUntilISO = valid_until;
    if (valid_until && !valid_until.includes("T")) {
      // If it's a date string like "2024-01-01", convert to ISO
      validUntilISO = new Date(valid_until + "T23:59:59").toISOString();
    } else if (!valid_until) {
      validUntilISO = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Default 30 days
    }

    // Build offer data object, only including defined values
    const offerData: any = {
      title,
      description: description || "",
      discount_type,
      discount_value: Number(discount_value),
      valid_from: validFromISO,
      valid_until: validUntilISO,
      is_active: is_active !== undefined ? is_active : true,
    };

    // Add code if provided
    if (code && code.trim() !== "") {
      offerData.code = code.trim().toUpperCase();
    }

    // Only add optional fields if they have actual values (not empty strings or undefined)
    if (min_order_amount && min_order_amount !== "" && !isNaN(Number(min_order_amount))) {
      offerData.min_order_amount = Number(min_order_amount);
    }
    if (max_discount && max_discount !== "" && !isNaN(Number(max_discount))) {
      offerData.max_discount = Number(max_discount);
    }
    if (customer_email && customer_email !== "") {
      offerData.customer_email = customer_email;
    }
    if (customer_emails && Array.isArray(customer_emails) && customer_emails.length > 0) {
      offerData.customer_emails = customer_emails.filter((e: string) => e && e.trim() !== "");
    }
    if (customer_id && customer_id !== "") {
      offerData.customer_id = customer_id;
    }
    if (customer_ids && Array.isArray(customer_ids) && customer_ids.length > 0) {
      offerData.customer_ids = customer_ids.filter((id: string) => id && id.trim() !== "");
    }
    if (usage_limit && usage_limit !== "" && !isNaN(Number(usage_limit))) {
      offerData.usage_limit = Number(usage_limit);
    }
    if (one_time_per_user !== undefined) {
      offerData.one_time_per_user = Boolean(one_time_per_user);
    }
    if (auth.uid || auth.name) {
      offerData.created_by = auth.uid || auth.name;
    }

    const offer = await createOffer(offerData);

    return NextResponse.json({
      success: true,
      offer,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create offer",
        message: String(error?.message || error),
      },
      { status: 500 }
    );
  }
}

// PUT - Update offer
export async function PUT(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Offer ID is required" },
        { status: 400 }
      );
    }

    const offer = await updateOffer(id, updates);

    return NextResponse.json({
      success: true,
      offer,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update offer",
        message: String(error?.message || error),
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete offer
export async function DELETE(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Offer ID is required" },
        { status: 400 }
      );
    }

    await deleteOffer(id);

    return NextResponse.json({
      success: true,
      message: "Offer deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete offer",
        message: String(error?.message || error),
      },
      { status: 500 }
    );
  }
}

