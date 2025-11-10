// Reviews Firestore service - server-side only
import "server-only";
import { adminFirestore, ensureFirebaseInitialized } from "@/lib/firebaseAdmin.server";
import type { Review } from "./reviews-types";

const REVIEWS_COLLECTION = "reviews";

// Helper function to ensure Firestore is initialized
async function ensureInitialized(): Promise<void> {
  const initResult = await ensureFirebaseInitialized();
  if (!initResult.success || !adminFirestore) {
    throw new Error(initResult.error || "Firestore not initialized");
  }
}

// Get FieldValue for serverTimestamp
let FieldValue: any = null;
try {
  const firestoreModule = require("firebase-admin/firestore");
  FieldValue = firestoreModule.FieldValue;
} catch (err) {
  // Fallback to regular timestamp if FieldValue not available
}

// Convert Firestore document to Review
function docToReview(doc: any): Review {
  const data = doc.data();
  return {
    id: doc.id,
    customer_name: data.customer_name || "",
    customer_email: data.customer_email || undefined,
    rating: data.rating || 5,
    review_text: data.review_text || "",
    is_featured: data.is_featured || false,
    created_at: data.created_at 
      ? (typeof data.created_at === 'string' ? data.created_at : data.created_at.toDate?.()?.toISOString() || new Date().toISOString())
      : (data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()),
    updated_at: data.updated_at 
      ? (typeof data.updated_at === 'string' ? data.updated_at : data.updated_at.toDate?.()?.toISOString() || undefined)
      : (data.updatedAt?.toDate?.()?.toISOString() || undefined),
  };
}

// Get all reviews
export async function getAllReviews(): Promise<Review[]> {
  await ensureInitialized();

  try {
    const snapshot = await adminFirestore
      .collection(REVIEWS_COLLECTION)
      .orderBy("created_at", "desc")
      .get();

    return snapshot.docs.map(docToReview);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    throw error;
  }
}

// Get featured reviews
export async function getFeaturedReviews(): Promise<Review[]> {
  await ensureInitialized();

  try {
    // Fetch all featured reviews without orderBy to avoid index requirement
    const snapshot = await adminFirestore
      .collection(REVIEWS_COLLECTION)
      .where("is_featured", "==", true)
      .get();

    // Sort in memory by created_at descending
    const reviews = snapshot.docs.map(docToReview);
    return reviews.sort((a: Review, b: Review) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA; // Descending order
    });
  } catch (error) {
    console.error("Error fetching featured reviews:", error);
    throw error;
  }
}

// Create a new review
export async function createReview(review: Omit<Review, "id" | "created_at" | "updated_at">): Promise<string> {
  await ensureInitialized();

  try {
    const reviewData = {
      customer_name: review.customer_name,
      customer_email: review.customer_email || null,
      rating: review.rating,
      review_text: review.review_text,
      is_featured: false,
      created_at: FieldValue ? FieldValue.serverTimestamp() : new Date().toISOString(),
    };

    const docRef = await adminFirestore.collection(REVIEWS_COLLECTION).add(reviewData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating review:", error);
    throw error;
  }
}

// Toggle featured status
export async function toggleFeaturedReview(reviewId: string, isFeatured: boolean): Promise<void> {
  await ensureInitialized();

  try {
    await adminFirestore
      .collection(REVIEWS_COLLECTION)
      .doc(reviewId)
      .update({
        is_featured: isFeatured,
        updated_at: FieldValue ? FieldValue.serverTimestamp() : new Date().toISOString(),
      });
  } catch (error) {
    console.error("Error updating review:", error);
    throw error;
  }
}

// Delete a review
export async function deleteReview(reviewId: string): Promise<void> {
  await ensureInitialized();

  try {
    await adminFirestore.collection(REVIEWS_COLLECTION).doc(reviewId).delete();
  } catch (error) {
    console.error("Error deleting review:", error);
    throw error;
  }
}

