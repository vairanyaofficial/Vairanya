import { NextRequest, NextResponse } from "next/server";
import { getAllProducts } from "@/lib/products-firestore";
import { logger } from "@/lib/logger";

// Force dynamic rendering since we use searchParams
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const getAll = searchParams.get("all") === "true"; // For initial max price calculation

    logger.info(`[API /api/products] Request - limit: ${limit}, offset: ${offset}, getAll: ${getAll}`);

    // Ensure Firestore initialization before attempting to fetch
    const { adminFirestore, ensureFirebaseInitialized, getFirebaseDiagnostics } = await import("@/lib/firebaseAdmin.server");
    
    // Try to ensure initialization
    const initResult = await ensureFirebaseInitialized();
    if (!initResult.success || !adminFirestore) {
      const diagnostics = getFirebaseDiagnostics();
      const errorMsg = initResult.error || "Firestore not initialized. Please check FIREBASE_SERVICE_ACCOUNT_JSON environment variable in Vercel.";
      logger.error("[API /api/products] " + errorMsg);
      console.error("[API /api/products] Firestore initialization check failed");
      console.error("[API /api/products] Diagnostics:", diagnostics);
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorMsg,
          errorCode: "FIRESTORE_NOT_INITIALIZED",
          products: [],
          total: 0,
          hasMore: false,
          debug: diagnostics
        },
        { status: 503 } // Service Unavailable
      );
    }

    // Fetch products from Firestore
    const allProducts = await getAllProducts();
    
    logger.info(`[API /api/products] Fetched ${allProducts.length} total products from Firestore`);
    
    // If requesting all products (for max price calculation), return all
    if (getAll) {
      logger.info(`[API /api/products] Returning all ${allProducts.length} products`);
      return NextResponse.json({ 
        success: true, 
        products: allProducts, 
        total: allProducts.length 
      });
    }

    // Paginate products
    const paginatedProducts = allProducts.slice(offset, offset + limit);
    const hasMore = offset + limit < allProducts.length;
    
    logger.info(`[API /api/products] Returning ${paginatedProducts.length} products (offset: ${offset}, limit: ${limit}, total: ${allProducts.length}, hasMore: ${hasMore})`);
    
    return NextResponse.json({ 
      success: true, 
      products: paginatedProducts,
      total: allProducts.length,
      hasMore,
      offset,
      limit
    });
  } catch (error: any) {
    // Enhanced error logging for production debugging
    const errorMessage = error?.message || "Unknown error";
    const errorStack = error?.stack || "No stack trace";
    const errorCode = error?.code || error?.name || "UNKNOWN_ERROR";
    
    logger.error("Error fetching products in API route", {
      message: errorMessage,
      stack: errorStack,
      name: error?.name,
      code: error?.code,
    });
    
    // Log to console for production debugging (Vercel logs)
    console.error("[API /api/products] Error:", {
      message: errorMessage,
      code: errorCode,
      name: error?.name,
      stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
    });
    
    // Check if it's a Firestore initialization error
    const isFirestoreError = errorMessage.includes("Firestore not initialized") || 
                             errorMessage.includes("Firebase") ||
                             errorCode.includes("FIRESTORE");
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        errorCode: isFirestoreError ? "FIRESTORE_ERROR" : errorCode,
        products: [], // Return empty array on error
        total: 0,
        hasMore: false,
        debug: {
          firestoreError: isFirestoreError,
          hasServiceAccountJson: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
          hasGoogleAppCreds: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
        }
      },
      { status: isFirestoreError ? 503 : 500 }
    );
  }
}
