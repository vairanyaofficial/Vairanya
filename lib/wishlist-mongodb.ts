// lib/wishlist-mongodb.ts
// MongoDB implementation for wishlist - server-side only
import "server-only";
import { getMongoDB } from "@/lib/mongodb.server";

const WISHLIST_COLLECTION = "Wishlist";

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

// Get wishlist items for a user
export async function getWishlistByUserId(userId: string): Promise<WishlistItem[]> {
  const db = getMongoDB();
  if (!db) {
    console.error("[Wishlist MongoDB] Database not available in getWishlistByUserId");
    // Return empty array instead of throwing - allows graceful degradation
    return [];
  }

  try {
    const collection = db.collection(WISHLIST_COLLECTION);
    const items = await collection
      .find({ user_id: userId })
      .sort({ created_at: -1 })
      .toArray();

    return items.map((doc: any) => ({
      id: doc._id?.toString() || doc.id,
      user_id: doc.user_id,
      product_id: doc.product_id,
      created_at: doc.created_at || new Date().toISOString(),
    }));
  } catch (error: any) {
    console.error("[Wishlist MongoDB] Error getting wishlist from MongoDB:", error);
    console.error("[Wishlist MongoDB] Error details:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    // Return empty array instead of throwing - allows graceful degradation
    return [];
  }
}

// Add item to wishlist
export async function addToWishlist(userId: string, productId: string): Promise<WishlistItem> {
  const db = getMongoDB();
  if (!db) {
    console.error("[Wishlist MongoDB] Database not available in addToWishlist");
    throw new Error("MongoDB not available");
  }

  try {
    const collection = db.collection(WISHLIST_COLLECTION);

    // Check if item already exists
    const existing = await collection.findOne({
      user_id: userId,
      product_id: productId,
    });

    if (existing) {
      throw new Error("Product already in wishlist");
    }

    const wishlistItem = {
      user_id: userId,
      product_id: productId,
      created_at: new Date().toISOString(),
    };

    const result = await collection.insertOne(wishlistItem);
    const created = await collection.findOne({ _id: result.insertedId });

    if (!created) {
      throw new Error("Failed to create wishlist item");
    }

    return {
      id: created._id.toString(),
      user_id: created.user_id,
      product_id: created.product_id,
      created_at: created.created_at,
    };
  } catch (error: any) {
    throw new Error(error.message || "Failed to add to wishlist");
  }
}

// Remove item from wishlist
export async function removeFromWishlist(userId: string, productId: string): Promise<void> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const collection = db.collection(WISHLIST_COLLECTION);
    const result = await collection.deleteOne({
      user_id: userId,
      product_id: productId,
    });

    if (result.deletedCount === 0) {
      throw new Error("Item not found in wishlist");
    }
  } catch (error: any) {
    throw new Error(error.message || "Failed to remove from wishlist");
  }
}

// Check if product is in wishlist
export async function isInWishlist(userId: string, productId: string): Promise<boolean> {
  const db = getMongoDB();
  if (!db) {
    return false;
  }

  try {
    const collection = db.collection(WISHLIST_COLLECTION);
    const item = await collection.findOne({
      user_id: userId,
      product_id: productId,
    });
    return !!item;
  } catch (error) {
    return false;
  }
}

