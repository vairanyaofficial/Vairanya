import { NextRequest, NextResponse } from "next/server";
import { createReview, getAllReviews } from "@/lib/reviews-firestore";

export async function GET(request: NextRequest) {
  try {
    const reviews = await getAllReviews();
    return NextResponse.json({ success: true, reviews });
  } catch (error: any) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_name, customer_email, rating, review_text } = body;

    // Validation
    if (!customer_name || !review_text) {
      return NextResponse.json(
        { success: false, error: "Name and review text are required" },
        { status: 400 }
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    if (review_text.length < 10) {
      return NextResponse.json(
        { success: false, error: "Review must be at least 10 characters long" },
        { status: 400 }
      );
    }

    const reviewId = await createReview({
      customer_name: customer_name.trim(),
      customer_email: customer_email?.trim() || undefined,
      rating: parseInt(rating),
      review_text: review_text.trim(),
      is_featured: false,
    });

    return NextResponse.json(
      { success: true, review_id: reviewId },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create review" },
      { status: 500 }
    );
  }
}

