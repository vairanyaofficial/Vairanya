// app/api/collections/route.ts - Public API for fetching collections
import { NextRequest, NextResponse } from "next/server";
import { getFeaturedCollections, getAllCollections } from "@/lib/collections-mongodb";
import { initializeMongoDB } from "@/lib/mongodb.server";

// Mark route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Simple in-memory cache for collections (60 second TTL)
let collectionsCache: { featured: any[]; all: any[]; timestamp: number } | null = null;
const CACHE_TTL = 60 * 1000; // 60 seconds

// GET - Get collections (public endpoint)
export async function GET(request: NextRequest) {
  try {
    // Initialize MongoDB
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      return NextResponse.json(
        { success: true, collections: [] },
        { status: 200 }
      );
    }

    const featured = request.nextUrl.searchParams.get("featured"); // ?featured=true to get only featured collections

    // Check cache first
    const now = Date.now();
    if (collectionsCache && (now - collectionsCache.timestamp) < CACHE_TTL) {
      const collections = featured === "true" ? collectionsCache.featured : collectionsCache.all;
      const response = NextResponse.json({
        success: true,
        collections,
      });
      response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    let collections;
    if (featured === "true") {
      collections = await getFeaturedCollections();
    } else {
      collections = await getAllCollections();
    }
    
    // Update cache
    if (featured === "true") {
      collectionsCache = { 
        featured: collections, 
        all: collectionsCache?.all || [], 
        timestamp: now 
      };
    } else {
      collectionsCache = { 
        featured: collectionsCache?.featured || [], 
        all: collections, 
        timestamp: now 
      };
    }
    
    const response = NextResponse.json({
      success: true,
      collections,
    });
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    return response;
  } catch (error: any) {
    console.error("Error in collections API:", error);
    // Return success with empty array instead of error to prevent frontend issues
    return NextResponse.json(
      {
        success: true,
        collections: [], // Return empty array on error
      },
      { status: 200 }
    );
  }
}

