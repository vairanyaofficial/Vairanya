import { NextRequest, NextResponse } from "next/server";
import { getAllProducts } from "@/lib/products-mongodb";
import { logger } from "@/lib/logger";
import { initializeMongoDB } from "@/lib/mongodb.server";

// Force dynamic rendering since we use searchParams
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Simple in-memory cache for products (60 second TTL)
let productsCache: { data: any[]; timestamp: number } | null = null;
const CACHE_TTL = 60 * 1000; // 60 seconds

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const getAll = searchParams.get("all") === "true"; // For initial max price calculation

    logger.info(`[API /api/products] Request - limit: ${limit}, offset: ${offset}, getAll: ${getAll}`);

    // Initialize MongoDB connection
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      // Log the error for debugging
      logger.error("MongoDB initialization failed in products route", {
        mongoInit,
      });
      
      // In development, return error details; in production, return empty array
      if (process.env.NODE_ENV === "development") {
        return NextResponse.json(
          { 
            success: false,
            error: "Database unavailable",
            message: mongoInit.error || "MongoDB not initialized",
            products: [],
            total: 0,
            hasMore: false,
          },
          { status: 503 }
        );
      }
      
      // Return empty products silently in production (for graceful degradation)
      const response = NextResponse.json(
        { 
          success: true, 
          products: [],
          total: 0,
          hasMore: false,
        },
        { status: 200 }
      );
      response.headers.set('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');
      return response;
    }

    // Check cache first (only for non-paginated requests)
    const now = Date.now();
    if (getAll && productsCache && (now - productsCache.timestamp) < CACHE_TTL) {
      const allProducts = productsCache.data;
      const response = NextResponse.json({ 
        success: true, 
        products: allProducts, 
        total: allProducts.length 
      });
      response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    // Fetch products from MongoDB
    const allProducts = await getAllProducts();
    
    // Update cache for getAll requests
    if (getAll) {
      productsCache = { data: allProducts, timestamp: now };
    }
    
    logger.info(`[API /api/products] Fetched ${allProducts.length} total products from MongoDB`);
    
    // If requesting all products (for max price calculation), return all
    if (getAll) {
      logger.info(`[API /api/products] Returning all ${allProducts.length} products`);
      const response = NextResponse.json({ 
        success: true, 
        products: allProducts, 
        total: allProducts.length 
      });
      response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
      return response;
    }

    // Paginate products
    const paginatedProducts = allProducts.slice(offset, offset + limit);
    const hasMore = offset + limit < allProducts.length;
    
    logger.info(`[API /api/products] Returning ${paginatedProducts.length} products (offset: ${offset}, limit: ${limit}, total: ${allProducts.length}, hasMore: ${hasMore})`);
    
    const response = NextResponse.json({ 
      success: true, 
      products: paginatedProducts,
      total: allProducts.length,
      hasMore,
      offset,
      limit
    });
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    return response;
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
    
    // In development, return error details; in production, return empty array gracefully
    if (process.env.NODE_ENV === "development") {
      const { getMongoDBDiagnostics } = await import("@/lib/mongodb.server");
      return NextResponse.json(
        { 
          success: false,
          error: errorMessage,
          code: errorCode,
          diagnostics: getMongoDBDiagnostics(),
          products: [],
          total: 0,
          hasMore: false,
        },
        { status: 500 }
      );
    }
    
    // Return empty products silently in production (for graceful degradation)
    return NextResponse.json(
      { 
        success: true,
        products: [],
        total: 0,
        hasMore: false,
      },
      { status: 200 }
    );
  }
}
