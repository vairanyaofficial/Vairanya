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

export async function getReviewsByProductId(productId: string): Promise<Review[]> {
  return reviewsMongo.getReviewsByProductId(productId);
}

export async function createReview(review: Omit<Review, "id" | "created_at" | "updated_at">): Promise<Review> {
  const reviewId = await reviewsMongo.createReview(review);
  // createReview returns the ID, so we need to construct the Review object
  // Since we just created it, we know the data
  return {
    id: reviewId,
    product_id: review.product_id,
    customer_name: review.customer_name,
    customer_email: review.customer_email,
    user_id: review.user_id,
    rating: review.rating,
    review_text: review.review_text,
    images: review.images,
    is_featured: false,
    created_at: new Date().toISOString(),
    updated_at: undefined,
  };
}

export async function deleteReviewsByProductId(productId: string): Promise<number> {
  return reviewsMongo.deleteReviewsByProductId(productId);
}

export async function toggleFeaturedReview(reviewId: string, isFeatured: boolean): Promise<void> {
  return reviewsMongo.toggleFeaturedReview(reviewId, isFeatured);
}

export async function deleteReview(reviewId: string): Promise<void> {
  return reviewsMongo.deleteReview(reviewId);
}
