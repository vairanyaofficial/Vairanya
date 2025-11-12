// Reviews MongoDB service - server-side only
// This file maintains backward compatibility by re-exporting MongoDB functions
import "server-only";
import * as reviewsMongo from "./reviews-mongodb";
import type { Review } from "./reviews-types";

// Re-export all MongoDB functions
export async function getAllReviews(): Promise<Review[]> {
  return reviewsMongo.getAllReviews();
}

export async function getFeaturedReviews(limit: number = 10): Promise<Review[]> {
  return reviewsMongo.getFeaturedReviews(limit);
}

export async function createReview(review: Omit<Review, "id" | "created_at" | "updated_at">): Promise<Review> {
  const reviewId = await reviewsMongo.createReview(review);
  // createReview returns the ID, so we need to construct the Review object
  // Since we just created it, we know the data
  return {
    id: reviewId,
    customer_name: review.customer_name,
    customer_email: review.customer_email,
    rating: review.rating,
    review_text: review.review_text,
    is_featured: false,
    created_at: new Date().toISOString(),
    updated_at: undefined,
  };
}

export async function toggleFeaturedReview(reviewId: string, isFeatured: boolean): Promise<void> {
  return reviewsMongo.toggleFeaturedReview(reviewId, isFeatured);
}

export async function deleteReview(reviewId: string): Promise<void> {
  return reviewsMongo.deleteReview(reviewId);
}
