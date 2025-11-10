import { NextRequest, NextResponse } from "next/server";
import { getFeaturedReviews } from "@/lib/reviews-firestore";

// Simple in-memory cache for reviews (60 second TTL)
let reviewsCache: { data: any[]; timestamp: number } | null = null;
const CACHE_TTL = 60 * 1000; // 60 seconds

export async function GET(request: NextRequest) {
  try {
    // Check cache first
    const now = Date.now();
    if (reviewsCache && (now - reviewsCache.timestamp) < CACHE_TTL) {
      const response = NextResponse.json({ success: true, reviews: reviewsCache.data });
      response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    const reviews = await getFeaturedReviews();
    
    // Update cache
    reviewsCache = { data: reviews, timestamp: now };
    
    const response = NextResponse.json({ success: true, reviews });
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    return response;
  } catch (error: any) {
    console.error("Error fetching featured reviews:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch featured reviews" },
      { status: 500 }
    );
  }
}

