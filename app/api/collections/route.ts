// app/api/collections/route.ts - Public API for fetching collections
import { NextRequest, NextResponse } from "next/server";
import { getFeaturedCollections, getAllCollections } from "@/lib/collections-firestore";

// GET - Get collections (public endpoint)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get("featured"); // ?featured=true to get only featured collections

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

