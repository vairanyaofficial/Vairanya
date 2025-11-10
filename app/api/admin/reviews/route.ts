import { NextRequest, NextResponse } from "next/server";
import { toggleFeaturedReview, deleteReview } from "@/lib/reviews-mongodb";
import { requireAdmin } from "@/lib/admin-auth-server";
import { initializeMongoDB } from "@/lib/mongodb.server";

export async function PUT(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 503 }
      );
    }
    const body = await request.json();
    const { review_id, is_featured } = body;

    if (!review_id || typeof is_featured !== "boolean") {
      return NextResponse.json(
        { success: false, error: "review_id and is_featured are required" },
        { status: 400 }
      );
    }

    await toggleFeaturedReview(review_id, is_featured);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating review:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update review" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const review_id = searchParams.get("review_id");

    if (!review_id) {
      return NextResponse.json(
        { success: false, error: "review_id is required" },
        { status: 400 }
      );
    }

    await deleteReview(review_id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete review" },
      { status: 500 }
    );
  }
}

