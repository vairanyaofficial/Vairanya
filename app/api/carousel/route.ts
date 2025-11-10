import { NextRequest, NextResponse } from "next/server";
import { getCarouselSlides } from "@/lib/carousel-mongodb";
import { initializeMongoDB } from "@/lib/mongodb.server";

// Mark route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Simple in-memory cache for carousel (60 second TTL)
let carouselCache: { active: any[]; all: any[]; timestamp: number } | null = null;
const CACHE_TTL = 60 * 1000; // 60 seconds

// GET - Get all active carousel slides (public endpoint)
export async function GET(request: NextRequest) {
  try {
    // Initialize MongoDB
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      return NextResponse.json(
        { success: true, slides: [] },
        { status: 200 }
      );
    }

    const activeOnly = request.nextUrl.searchParams.get("all") !== "true";
    
    // Check cache first
    const now = Date.now();
    if (carouselCache && (now - carouselCache.timestamp) < CACHE_TTL) {
      const slides = activeOnly ? carouselCache.active : carouselCache.all;
      const response = NextResponse.json({ success: true, slides }, { status: 200 });
      response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
      response.headers.set('X-Cache', 'HIT');
      return response;
    }
    
    const slides = await getCarouselSlides(activeOnly);
    
    // Update cache
    if (activeOnly) {
      carouselCache = { 
        active: slides, 
        all: carouselCache?.all || [], 
        timestamp: now 
      };
    } else {
      carouselCache = { 
        active: carouselCache?.active || [], 
        all: slides, 
        timestamp: now 
      };
    }
    
    const response = NextResponse.json({ success: true, slides }, { status: 200 });
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    return response;
  } catch (error: any) {
    console.error("Error in carousel API:", error);
    // Return success with empty array to prevent homepage breakage
    return NextResponse.json(
      { success: true, slides: [] },
      { status: 200 }
    );
  }
}

