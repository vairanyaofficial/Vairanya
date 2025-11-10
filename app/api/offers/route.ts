// app/api/offers/route.ts - Public API for fetching active offers
import { NextRequest, NextResponse } from "next/server";
import { getActiveOffers } from "@/lib/offers-mongodb";
import { initializeMongoDB } from "@/lib/mongodb.server";

// Mark route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Simple in-memory cache for offers (30 second TTL)
let offersCache: { data: any[]; timestamp: number } | null = null;
const CACHE_TTL = 30 * 1000; // 30 seconds

// GET - Get active offers (public endpoint)
export async function GET(request: NextRequest) {
  try {
    // Initialize MongoDB
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      return NextResponse.json(
        { success: true, offers: [] },
        { status: 200 }
      );
    }

    const customerEmail = request.nextUrl.searchParams.get("customer_email") || undefined;
    const customerId = request.nextUrl.searchParams.get("customer_id") || undefined;

    // Only cache if no customer-specific params
    const now = Date.now();
    if (!customerEmail && !customerId && offersCache && (now - offersCache.timestamp) < CACHE_TTL) {
      const response = NextResponse.json({
        success: true,
        offers: offersCache.data,
      });
      response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    const offers = await getActiveOffers(customerEmail, customerId);
    
    // Update cache only for non-customer-specific requests
    if (!customerEmail && !customerId) {
      offersCache = { data: offers, timestamp: now };
    }
    
    const response = NextResponse.json({
      success: true,
      offers,
    });
    response.headers.set('Cache-Control', customerEmail || customerId ? 'private, no-cache' : 'public, s-maxage=30, stale-while-revalidate=60');
    return response;
  } catch (error: any) {
    console.error("Error in offers API:", error);
    // Return success with empty array to prevent homepage breakage
    return NextResponse.json(
      {
        success: true,
        offers: [],
      },
      { status: 200 }
    );
  }
}

