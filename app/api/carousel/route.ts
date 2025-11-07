import { NextRequest, NextResponse } from "next/server";
import { getCarouselSlides } from "@/lib/carousel-firestore";

// GET - Get all active carousel slides (public endpoint)
export async function GET(request: NextRequest) {
  try {
    const activeOnly = request.nextUrl.searchParams.get("all") !== "true";
    const slides = await getCarouselSlides(activeOnly);
    return NextResponse.json({ success: true, slides }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch carousel slides" },
      { status: 500 }
    );
  }
}

