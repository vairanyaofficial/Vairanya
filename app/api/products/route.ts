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
    
    logger.error("Error fetching products in API route", {
      message: errorMessage,
      stack: errorStack,
      name: error?.name,
      code: error?.code,
    });
    
    // Log to console for production debugging
    console.error("[API /api/products] Error:", {
      message: errorMessage,
      stack: errorStack,
      name: error?.name,
      code: error?.code,
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        products: [], // Return empty array on error
        total: 0,
        hasMore: false
      },
      { status: 500 }
    );
  }
}
