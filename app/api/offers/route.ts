// app/api/offers/route.ts - Public API for fetching active offers
import { NextRequest, NextResponse } from "next/server";
import { getActiveOffers } from "@/lib/offers-firestore";

// Mark route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Get active offers (public endpoint)
export async function GET(request: NextRequest) {
  try {
    const customerEmail = request.nextUrl.searchParams.get("customer_email") || undefined;
    const customerId = request.nextUrl.searchParams.get("customer_id") || undefined;

    const offers = await getActiveOffers(customerEmail, customerId);
    
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

