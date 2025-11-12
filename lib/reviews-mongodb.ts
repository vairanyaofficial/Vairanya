// lib/reviews-mongodb.ts
// MongoDB implementation for reviews - server-side only
import "server-only";
import { getMongoDB } from "@/lib/mongodb.server";
import type { Review } from "./reviews-types";

// Try both collection names for compatibility
const REVIEWS_COLLECTION = "Review"; // Primary collection name
const REVIEWS_COLLECTION_ALT = "reviews"; // Alternative collection name

// Convert MongoDB document to Review
function docToReview(doc: any): Review {
  return {
    id: doc._id?.toString() || doc.id,
    product_id: doc.product_id || undefined,
    customer_name: doc.customer_name || "",
    customer_email: doc.customer_email || undefined,
    user_id: doc.user_id || undefined,
    rating: doc.rating || 5,
    review_text: doc.review_text || "",
    images: doc.images || undefined,
    is_featured: doc.is_featured || false,
    created_at: doc.created_at || new Date().toISOString(),
    updated_at: doc.updated_at || undefined,
  };
}

// Get all reviews
export async function getAllReviews(): Promise<Review[]> {
  // Don't initialize here - trust that connection is initialized at API route level
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available. Please initialize connection first.");
  }

  try {
    // Try primary collection name first
    let collection = db.collection(REVIEWS_COLLECTION);
    let docs: any[] = [];
    
    try {
      docs = await collection.find({}).sort({ created_at: -1 }).toArray();
      console.log(`[Reviews] Found ${docs.length} reviews in "${REVIEWS_COLLECTION}" collection`);
    } catch (error: any) {
      // Try alternative collection name
      console.log(`[Reviews] Error with "${REVIEWS_COLLECTION}", trying "${REVIEWS_COLLECTION_ALT}"...`);
      try {
        collection = db.collection(REVIEWS_COLLECTION_ALT);
        docs = await collection.find({}).sort({ created_at: -1 }).toArray();
        console.log(`[Reviews] Found ${docs.length} reviews in "${REVIEWS_COLLECTION_ALT}" collection`);
      } catch (altError: any) {
        console.error(`[Reviews] Both collections failed:`, altError?.message);
        return [];
      }
    }
    
    const reviews = docs.map(docToReview);
    // Sort in memory to ensure correct order
    reviews.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA; // Descending order
    });
    
    return reviews;
  } catch (error: any) {
    console.error("Error fetching reviews:", error);
    return [];
  }
}

// Get featured reviews
export async function getFeaturedReviews(limit: number = 10): Promise<Review[]> {
  // Don't initialize here - trust that connection is initialized at API route level
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available. Please initialize connection first.");
  }

  try {
    // Try primary collection name first
    let collection = db.collection(REVIEWS_COLLECTION);
    let docs: any[] = [];
    
    // Query for featured reviews
    try {
      docs = await collection
        .find({ is_featured: true })
        .sort({ created_at: -1 })
        .limit(limit)
        .toArray();
      console.log(`[Reviews] Found ${docs.length} featured reviews in "${REVIEWS_COLLECTION}" collection`);
    } catch (error: any) {
      // If primary collection fails, try alternative name
      console.log(`[Reviews] Error with "${REVIEWS_COLLECTION}", trying "${REVIEWS_COLLECTION_ALT}"...`);
      try {
        collection = db.collection(REVIEWS_COLLECTION_ALT);
        docs = await collection
          .find({ is_featured: true })
          .sort({ created_at: -1 })
          .limit(limit)
          .toArray();
        console.log(`[Reviews] Found ${docs.length} featured reviews in "${REVIEWS_COLLECTION_ALT}" collection`);
      } catch (altError: any) {
        console.error(`[Reviews] Both collections failed. Primary error:`, error?.message);
        console.error(`[Reviews] Alternative error:`, altError?.message);
        // Try to get any reviews as fallback
        try {
          docs = await collection
            .find({})
            .sort({ created_at: -1 })
            .limit(limit)
            .toArray();
          console.log(`[Reviews] Fallback: Found ${docs.length} total reviews`);
        } catch (fallbackError) {
          console.error(`[Reviews] Fallback also failed:`, fallbackError);
          return [];
        }
      }
    }
    
    // If no featured reviews found, try to get any reviews (fallback)
    if (docs.length === 0) {
      console.log(`[Reviews] No featured reviews found, getting any reviews as fallback...`);
      try {
        docs = await collection
          .find({})
          .sort({ created_at: -1 })
          .limit(limit)
          .toArray();
        console.log(`[Reviews] Found ${docs.length} total reviews in MongoDB`);
      } catch (allError: any) {
        console.error(`[Reviews] Error fetching all reviews:`, allError?.message);
        return [];
      }
    }
    
    // Convert and sort in memory to ensure correct order
    const reviews = docs.map(docToReview);
    reviews.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA; // Descending order (newest first)
    });
    
    console.log(`[Reviews] Returning ${reviews.length} reviews`);
    return reviews;
  } catch (error: any) {
    console.error("[Reviews] Error fetching featured reviews from MongoDB:", error);
    console.error("[Reviews] Error details:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    return [];
  }
}

// Get reviews by product ID
export async function getReviewsByProductId(productId: string): Promise<Review[]> {
  // Don't initialize here - trust that connection is initialized at API route level
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available. Please initialize connection first.");
  }

  try {
    let collection = db.collection(REVIEWS_COLLECTION);
    let docs: any[] = [];
    
    try {
      docs = await collection
        .find({ product_id: productId })
        .sort({ created_at: -1 })
        .toArray();
      console.log(`[Reviews] Found ${docs.length} reviews for product ${productId} in "${REVIEWS_COLLECTION}" collection`);
    } catch (error: any) {
      console.log(`[Reviews] Error with "${REVIEWS_COLLECTION}", trying "${REVIEWS_COLLECTION_ALT}"...`);
      try {
        collection = db.collection(REVIEWS_COLLECTION_ALT);
        docs = await collection
          .find({ product_id: productId })
          .sort({ created_at: -1 })
          .toArray();
        console.log(`[Reviews] Found ${docs.length} reviews for product ${productId} in "${REVIEWS_COLLECTION_ALT}" collection`);
      } catch (altError: any) {
        console.error(`[Reviews] Both collections failed:`, altError?.message);
        return [];
      }
    }
    
    const reviews = docs.map(docToReview);
    reviews.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA; // Descending order
    });
    
    return reviews;
  } catch (error: any) {
    console.error("Error fetching reviews by product ID:", error);
    return [];
  }
}

// Create a new review
export async function createReview(
  review: Omit<Review, "id" | "created_at" | "updated_at">
): Promise<string> {
  // Don't initialize here - trust that connection is initialized at API route level
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available. Please initialize connection first.");
  }

  try {
    const reviewData = {
      product_id: review.product_id || null,
      customer_name: review.customer_name,
      customer_email: review.customer_email || null,
      user_id: review.user_id || null,
      rating: review.rating,
      review_text: review.review_text,
      images: review.images || null,
      is_featured: false,
      created_at: new Date().toISOString(),
    };

    // Use primary collection name for creating reviews
    const collection = db.collection(REVIEWS_COLLECTION);
    const result = await collection.insertOne(reviewData);
    console.log(`[Reviews] Created review with ID: ${result.insertedId}`);
    return result.insertedId.toString();
  } catch (error: any) {
    console.error("[Reviews] Error creating review:", error);
    throw new Error(error.message || "Failed to create review");
  }
}

// Toggle featured status
export async function toggleFeaturedReview(reviewId: string, isFeatured: boolean): Promise<void> {
  // Don't initialize here - trust that connection is initialized at API route level
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available. Please initialize connection first.");
  }

  try {
    const collection = db.collection(REVIEWS_COLLECTION);
    
    // Try to parse as ObjectId first
    let query: any;
    try {
      const { ObjectId } = await import("mongodb");
      const objectId = new ObjectId(reviewId);
      query = { _id: objectId };
    } catch {
      // If not a valid ObjectId, try string match
      query = { 
        $or: [
          { _id: reviewId },
          { id: reviewId }
        ]
      };
    }
    
    const result = await collection.updateOne(
      query,
      {
        $set: {
          is_featured: isFeatured,
          updated_at: new Date().toISOString(),
        },
      }
    );
    
    if (result.matchedCount === 0) {
      throw new Error("Review not found");
    }
  } catch (error: any) {
    console.error("Error toggling featured review:", error);
    throw new Error(error.message || "Failed to update review");
  }
}

// Delete a review
export async function deleteReview(reviewId: string): Promise<void> {
  // Don't initialize here - trust that connection is initialized at API route level
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available. Please initialize connection first.");
  }

  try {
    const collection = db.collection(REVIEWS_COLLECTION);
    
    // Try to parse as ObjectId first
    let query: any;
    try {
      const { ObjectId } = await import("mongodb");
      const objectId = new ObjectId(reviewId);
      query = { _id: objectId };
    } catch {
      // If not a valid ObjectId, try string match
      query = { 
        $or: [
          { _id: reviewId },
          { id: reviewId }
        ]
      };
    }
    
    const result = await collection.deleteOne(query);
    
    if (result.deletedCount === 0) {
      throw new Error("Review not found");
    }
  } catch (error: any) {
    console.error("Error deleting review:", error);
    throw new Error(error.message || "Failed to delete review");
  }
}

// Delete all reviews for a product
export async function deleteReviewsByProductId(productId: string): Promise<number> {
  // Don't initialize here - trust that connection is initialized at API route level
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available. Please initialize connection first.");
  }

  try {
    let collection = db.collection(REVIEWS_COLLECTION);
    let deletedCount = 0;
    
    try {
      // Delete all reviews with matching product_id
      const result = await collection.deleteMany({ product_id: productId });
      deletedCount = result.deletedCount || 0;
      console.log(`[Reviews] Deleted ${deletedCount} reviews for product ${productId} from "${REVIEWS_COLLECTION}" collection`);
    } catch (error: any) {
      // Try alternative collection name
      console.log(`[Reviews] Error with "${REVIEWS_COLLECTION}", trying "${REVIEWS_COLLECTION_ALT}"...`);
      try {
        collection = db.collection(REVIEWS_COLLECTION_ALT);
        const result = await collection.deleteMany({ product_id: productId });
        deletedCount = result.deletedCount || 0;
        console.log(`[Reviews] Deleted ${deletedCount} reviews for product ${productId} from "${REVIEWS_COLLECTION_ALT}" collection`);
      } catch (altError: any) {
        console.error(`[Reviews] Both collections failed:`, altError?.message);
        throw new Error(altError.message || "Failed to delete reviews");
      }
    }
    
    return deletedCount;
  } catch (error: any) {
    console.error("Error deleting reviews by product ID:", error);
    throw new Error(error.message || "Failed to delete reviews");
  }
}

