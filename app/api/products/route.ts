import { NextRequest, NextResponse } from "next/server";
import { getAllProducts } from "@/lib/products-firestore";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const getAll = searchParams.get("all") === "true"; // For initial max price calculation

    // Fetch products from Firestore
    const allProducts = await getAllProducts();
    
    // If requesting all products (for max price calculation), return all
    if (getAll) {
      logger.info(`Fetched all ${allProducts.length} products from Firestore`);
      return NextResponse.json({ success: true, products: allProducts, total: allProducts.length });
    }

    // Paginate products
    const paginatedProducts = allProducts.slice(offset, offset + limit);
    const hasMore = offset + limit < allProducts.length;
    
    logger.info(`Fetched ${paginatedProducts.length} products (offset: ${offset}, limit: ${limit}) from Firestore`);
    return NextResponse.json({ 
      success: true, 
      products: paginatedProducts,
      total: allProducts.length,
      hasMore,
      offset,
      limit
    });
  } catch (error: any) {
    logger.error("Error fetching products in API route", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message ?? "Unknown error",
        products: [], // Return empty array on error
        total: 0,
        hasMore: false
      },
      { status: 500 }
    );
  }
}
