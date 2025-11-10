import { NextRequest, NextResponse } from "next/server";
import { adminFirestore, adminAuth, ensureFirebaseInitialized } from "@/lib/firebaseAdmin.server";

const WISHLIST_COLLECTION = "wishlist";

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
    // Ensure Firebase is initialized
    const initResult = await ensureFirebaseInitialized();
    if (!initResult.success || !adminFirestore) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 500 }
      );
    }
    
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const snapshot = await adminFirestore
      .collection(WISHLIST_COLLECTION)
      .where("user_id", "==", userId)
      .get();

    const wishlistItems = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort by created_at descending (newest first)
    wishlistItems.sort((a: any, b: any) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({ success: true, items: wishlistItems });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch wishlist" },
      { status: 500 }
    );
  }
}

// POST - Add item to wishlist
export async function POST(request: NextRequest) {
  try {
    // Ensure Firebase is initialized
    const initResult = await ensureFirebaseInitialized();
    if (!initResult.success || !adminFirestore) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 500 }
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

    // Check if item already exists in wishlist
    const existing = await adminFirestore
      .collection(WISHLIST_COLLECTION)
      .where("user_id", "==", userId)
      .where("product_id", "==", product_id)
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json(
        { success: false, error: "Product already in wishlist" },
        { status: 400 }
      );
    }

    const wishlistItem = {
      user_id: userId,
      product_id,
      created_at: new Date().toISOString(),
    };

    const docRef = await adminFirestore
      .collection(WISHLIST_COLLECTION)
      .add(wishlistItem);

    return NextResponse.json({
      success: true,
      item: { id: docRef.id, ...wishlistItem },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add to wishlist" },
      { status: 500 }
    );
  }
}

// DELETE - Remove item from wishlist
export async function DELETE(request: NextRequest) {
  try {
    // Ensure Firebase is initialized
    const initResult = await ensureFirebaseInitialized();
    if (!initResult.success || !adminFirestore) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 500 }
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

    if (!adminFirestore) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 500 }
      );
    }

    // Find and delete the wishlist item
    const snapshot = await adminFirestore
      .collection(WISHLIST_COLLECTION)
      .where("user_id", "==", userId)
      .where("product_id", "==", product_id)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        { success: false, error: "Item not found in wishlist" },
        { status: 404 }
      );
    }

    await snapshot.docs[0].ref.delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to remove from wishlist" },
      { status: 500 }
    );
  }
}

