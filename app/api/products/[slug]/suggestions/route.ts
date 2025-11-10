import { NextRequest, NextResponse } from "next/server";
import { 
  getProductBySlug, 
  getProductsByCategory, 
  getProductsByMetalFinish,
} from "@/lib/products-mongodb";
import { 
  getCollectionsByProductId, 
  getFeaturedCollectionsExcluding 
} from "@/lib/collections-mongodb";
import { initializeMongoDB } from "@/lib/mongodb.server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Initialize MongoDB connection
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 503 }
      );
    }

    const { slug } = await params;
    const product = await getProductBySlug(slug);

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // Fetch suggestions in parallel using optimized queries
    const [
      relatedProducts,
      sameMetalFinishProducts,
      productCollections,
      suggestedCollections,
    ] = await Promise.all([
      getProductsByCategory(product.category, 8, product.product_id),
      getProductsByMetalFinish(product.metal_finish, 8, product.product_id),
      getCollectionsByProductId(product.product_id),
      getFeaturedCollectionsExcluding(product.product_id, 4),
    ]);

    // Fetch one product per category for category browsing images
    // This is much more efficient than fetching all products
    const categoryImages: Record<string, string> = {};
    const categories = ['rings', 'earrings', 'pendants', 'bracelets', 'necklaces']
      .filter(cat => cat !== product.category);
    
    // Fetch one product per category in parallel
    const categoryPromises = categories.map(async (category) => {
      const products = await getProductsByCategory(category, 1);
      if (products.length > 0 && products[0].images.length > 0) {
        categoryImages[category] = products[0].images[0];
      }
    });
    await Promise.all(categoryPromises);

    // Other categories to suggest
    const otherCategories = categories;

    return NextResponse.json({
      success: true,
      data: {
        relatedProducts,
        sameMetalFinishProducts,
        productCollections,
        suggestedCollections,
        otherCategories,
        categoryImages, // Only image URLs needed for category browsing
      },
    });
  } catch (error: any) {
    console.error("Error fetching product suggestions:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}

