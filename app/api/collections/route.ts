// app/api/collections/route.ts - Public API for fetching collections
import { NextRequest, NextResponse } from "next/server";
import { getFeaturedCollections, getAllCollections } from "@/lib/collections-firestore";

// Mark route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Get collections (public endpoint)
export async function GET(request: NextRequest) {
  try {
    const featured = request.nextUrl.searchParams.get("featured"); // ?featured=true to get only featured collections

    let collections;
    if (featured === "true") {
      collections = await getFeaturedCollections();
    } else {
      collections = await getAllCollections();
    }
    
    return NextResponse.json({
      success: true,
      collections,
    });
  } catch (error: any) {
    console.error("Error in collections API:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch collections",
        message: String(error?.message || error),
      },
      { status: 500 }
    );
  }
}

