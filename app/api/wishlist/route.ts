import { NextRequest, NextResponse } from "next/server";
import { adminAuth, ensureFirebaseInitialized } from "@/lib/firebaseAdmin.server";
import { initializeMongoDB } from "@/lib/mongodb.server";
import {
  getWishlistByUserId,
  addToWishlist,
  removeFromWishlist,
} from "@/lib/wishlist-mongodb";

// Helper to verify Firebase token and get user ID
async function getUserIdFromToken(request: NextRequest): Promise<string | null> {
  try {
    // Ensure Firebase is initialized before using adminAuth
    const initResult = await ensureFirebaseInitialized();
    if (!initResult.success || !adminAuth) {
      return null;
    }
    
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;
    
    const token = authHeader.substring(7);
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

// GET - Fetch all wishlist items for the authenticated user
export async function GET(request: NextRequest) {
  try {
    // Initialize MongoDB
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      console.error("[Wishlist API] MongoDB initialization failed:", mongoInit.error);
      return NextResponse.json(
        { 
          success: false, 
          error: "Database unavailable",
          message: mongoInit.error || "MongoDB connection failed. The cluster may be paused or unavailable."
        },
        { status: 503 }
      );
    }
    
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const wishlistItems = await getWishlistByUserId(userId);

    return NextResponse.json({ success: true, items: wishlistItems || [] });
  } catch (error: any) {
    console.error("[Wishlist API] Error fetching wishlist:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Failed to fetch wishlist",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// POST - Add item to wishlist
export async function POST(request: NextRequest) {
  try {
    // Initialize MongoDB
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      console.error("[Wishlist API] MongoDB initialization failed for POST:", mongoInit.error);
      return NextResponse.json(
        { 
          success: false, 
          error: "Database unavailable",
          message: mongoInit.error || "MongoDB connection failed. The cluster may be paused or unavailable."
        },
        { status: 503 }
      );
    }
    
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { product_id } = body;

    if (!product_id) {
      return NextResponse.json(
        { success: false, error: "Product ID is required" },
        { status: 400 }
      );
    }

    const wishlistItem = await addToWishlist(userId, product_id);

    return NextResponse.json({
      success: true,
      item: wishlistItem,
    });
  } catch (error: any) {
    console.error("[Wishlist API] Error adding to wishlist:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Failed to add to wishlist",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE - Remove item from wishlist
export async function DELETE(request: NextRequest) {
  try {
    // Initialize MongoDB
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      console.error("[Wishlist API] MongoDB initialization failed for DELETE:", mongoInit.error);
      return NextResponse.json(
        { 
          success: false, 
          error: "Database unavailable",
          message: mongoInit.error || "MongoDB connection failed. The cluster may be paused or unavailable."
        },
        { status: 503 }
      );
    }
    
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const product_id = searchParams.get("product_id");

    if (!product_id) {
      return NextResponse.json(
        { success: false, error: "Product ID is required" },
        { status: 400 }
      );
    }

    await removeFromWishlist(userId, product_id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Wishlist API] Error removing from wishlist:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Failed to remove from wishlist",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

