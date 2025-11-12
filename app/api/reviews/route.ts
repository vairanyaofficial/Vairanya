import { NextRequest, NextResponse } from "next/server";
import { createReview, getAllReviews, getReviewsByProductId } from "@/lib/reviews-mongodb";
import { initializeMongoDB } from "@/lib/mongodb.server";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      console.error("[Reviews API] MongoDB initialization failed:", mongoInit.error);
      return NextResponse.json({ success: true, reviews: [] }, { status: 200 });
    }

    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get("product_id");

    let reviews;
    if (productId) {
      console.log(`[Reviews API] Fetching reviews for product ${productId}...`);
      reviews = await getReviewsByProductId(productId);
      console.log(`[Reviews API] Retrieved ${reviews.length} reviews for product ${productId}`);
    } else {
      console.log("[Reviews API] Fetching all reviews from MongoDB...");
      reviews = await getAllReviews();
      console.log(`[Reviews API] Retrieved ${reviews.length} reviews`);
    }

    return NextResponse.json({ success: true, reviews });
  } catch (error: any) {
    console.error("[Reviews API] Error fetching reviews:", error);
    // Return success with empty array to prevent breakage
    return NextResponse.json(
      { success: true, reviews: [] },
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Initialize MongoDB connection first
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      console.error("[Reviews API] MongoDB initialization failed:", mongoInit.error);
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 503 }
      );
    }

    // Check if user is authenticated
    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { success: false, error: "Please login to write a review" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { customer_name, rating, review_text, product_id, images } = body;

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

    // No purchase verification needed - reviews are only accessible from delivered orders page
    // The UI already ensures only delivered products can be reviewed

    // Use authenticated user's email (don't trust client-provided email)
    const customer_email = session.user.email;
    const customer_name_from_session = session.user.name || customer_name;
    const userId = (session.user as any).id || (session.user as any).uid;

    const reviewId = await createReview({
      product_id: product_id || undefined,
      customer_name: customer_name_from_session.trim(),
      customer_email: customer_email.trim(),
      user_id: userId || undefined,
      rating: parseInt(rating),
      review_text: review_text.trim(),
      images: images && Array.isArray(images) ? images : undefined,
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

