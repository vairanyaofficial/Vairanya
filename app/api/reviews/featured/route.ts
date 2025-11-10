import { NextRequest, NextResponse } from "next/server";
import { getFeaturedReviews } from "@/lib/reviews-mongodb";
import { initializeMongoDB } from "@/lib/mongodb.server";

// Simple in-memory cache for reviews (60 second TTL)
let reviewsCache: { data: any[]; timestamp: number } | null = null;
const CACHE_TTL = 60 * 1000; // 60 seconds

export async function GET(request: NextRequest) {
  try {
    // Initialize MongoDB
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      console.error("[Reviews API] MongoDB initialization failed:", mongoInit.error);
      return NextResponse.json(
        { success: true, reviews: [] },
        { status: 200 }
      );
    }

    // Check cache first
    const now = Date.now();
    if (reviewsCache && (now - reviewsCache.timestamp) < CACHE_TTL) {
      const response = NextResponse.json({ success: true, reviews: reviewsCache.data });
      response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    console.log("[Reviews API] Fetching featured reviews from MongoDB...");
    const reviews = await getFeaturedReviews(10);
    console.log(`[Reviews API] Retrieved ${reviews.length} featured reviews`);
    
    // Update cache
    reviewsCache = { data: reviews, timestamp: now };
    
    const response = NextResponse.json({ success: true, reviews });
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    return response;
  } catch (error: any) {
    console.error("[Reviews API] Error fetching featured reviews:", error);
    console.error("[Reviews API] Error details:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    // Return success with empty array to prevent homepage breakage
    return NextResponse.json(
      { success: true, reviews: [] },
      { status: 200 }
    );
  }
}

