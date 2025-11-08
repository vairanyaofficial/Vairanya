import { NextResponse } from "next/server";
import { getAllProducts } from "@/lib/products-firestore";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    // Fetch products from Firestore
    const products = await getAllProducts();
    logger.info(`Fetched ${products.length} products from Firestore`);
    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    logger.error("Error fetching products in API route", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message ?? "Unknown error",
        products: [] // Return empty array on error
      },
      { status: 500 }
    );
  }
}
