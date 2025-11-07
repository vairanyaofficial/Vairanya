// app/api/offers/route.ts - Public API for fetching active offers
import { NextRequest, NextResponse } from "next/server";
import { getActiveOffers } from "@/lib/offers-firestore";

// GET - Get active offers (public endpoint)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerEmail = searchParams.get("customer_email") || undefined;
    const customerId = searchParams.get("customer_id") || undefined;

    const offers = await getActiveOffers(customerEmail, customerId);
    
    // Log for debugging (remove in production if needed)
    console.log(`Fetched ${offers.length} active offers for customer:`, { customerEmail, customerId });
    
    return NextResponse.json({
      success: true,
      offers,
    });
  } catch (error: any) {
    console.error("Error in offers API:", error);
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

