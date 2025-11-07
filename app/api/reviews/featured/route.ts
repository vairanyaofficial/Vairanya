import { NextRequest, NextResponse } from "next/server";
import { getFeaturedReviews } from "@/lib/reviews-firestore";

export async function GET(request: NextRequest) {
  try {
    const reviews = await getFeaturedReviews();
    return NextResponse.json({ success: true, reviews });
  } catch (error: any) {
    console.error("Error fetching featured reviews:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch featured reviews" },
      { status: 500 }
    );
  }
}

