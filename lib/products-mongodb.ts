// lib/products-mongodb.ts
// MongoDB implementation for products - server-side only
import "server-only";
import { getMongoDB } from "@/lib/mongodb.server";
import { ObjectId } from "mongodb";
import type { Product } from "./products-types";

const PRODUCTS_COLLECTION = "Product";  // Match MongoDB collection name (capitalized)

// Convert MongoDB document to Product
function docToProduct(doc: any): Product {
  const docData = doc;
  const docId = doc._id?.toString() || doc.product_id;
  
  // Filter and validate images - remove empty/invalid URLs
  let images: string[] = [];
  if (Array.isArray(docData.images)) {
    images = docData.images.filter((img: any) => {
      if (!img || typeof img !== 'string') return false;
      const trimmed = img.trim();
      return trimmed !== '' && 
             trimmed !== 'undefined' && 
             trimmed !== 'null' &&
             trimmed.toLowerCase() !== 'none';
    });
  } else if (docData.imageUrl && typeof docData.imageUrl === 'string') {
    const trimmed = docData.imageUrl.trim();
    if (trimmed !== '' && trimmed !== 'undefined' && trimmed !== 'null') {
      images = [docData.imageUrl];
    }
  }
  
  return {
    product_id: docId,
    sku: docData.sku || "",
    title: docData.title || "",
    category: docData.category || "rings",
    price: docData.price || 0,
    cost_price: docData.cost_price || null,
    stock_qty: docData.stock_qty || 0,
    weight: docData.weight || null,
    metal_finish: docData.metal_finish || "gold",
    images: images,
    description: docData.description || "",
    short_description: docData.short_description || "",
    tags: Array.isArray(docData.tags) ? docData.tags : [],
    dimensions: docData.dimensions || null,
    shipping_class: docData.shipping_class || "",
    slug: docData.slug || "",
    is_new: docData.is_new || false,
    mrp: docData.mrp || null,
    size_options: Array.isArray(docData.size_options) ? docData.size_options : [],
  };
}

// Get all products
export async function getAllProducts(): Promise<Product[]> {
  // Note: MongoDB should be initialized before calling this function
  // If not initialized, getMongoDB() will return null
  const db = getMongoDB();
  if (!db) {
    console.error("[Products MongoDB] Database not available in getAllProducts - MongoDB may not be initialized");
    // Return empty array instead of throwing - allows graceful degradation
    console.warn("[Products MongoDB] Returning empty array - MongoDB connection may need to be initialized");
    return [];
  }

  try {
    const collection = db.collection(PRODUCTS_COLLECTION);
    console.log(`[Products MongoDB] Fetching products from "${PRODUCTS_COLLECTION}" collection...`);
    
    let products: any[] = [];
    
    // Try sorting by createdAt first, if that fails try other fields or no sort
    try {
      products = await collection
        .find({})
        .sort({ createdAt: -1 })
        .toArray();
      console.log(`[Products MongoDB] Successfully sorted by createdAt`);
    } catch (sortError: any) {
      // If sorting by createdAt fails, try without sort or with _id
      console.log(`[Products MongoDB] Sort by createdAt failed, trying alternative sorting...`);
      try {
        products = await collection
          .find({})
          .sort({ _id: -1 })
          .toArray();
        console.log(`[Products MongoDB] Successfully sorted by _id`);
      } catch (altSortError: any) {
        // If that also fails, just get products without sort
        console.log(`[Products MongoDB] Sort failed, fetching without sort...`);
        products = await collection.find({}).toArray();
        console.log(`[Products MongoDB] Fetched without sort`);
      }
    }
    
    console.log(`[Products MongoDB] Found ${products.length} products in MongoDB`);
    const convertedProducts = products.map(docToProduct);
    
    // Sort in memory to ensure correct order (newest first by product_id)
    // This handles cases where createdAt might not exist
    convertedProducts.sort((a, b) => {
      // Sort by product_id in reverse (newer IDs should come first)
      // For products with va-XX format, extract number and compare
      const aMatch = a.product_id.match(/va-(\d+)/);
      const bMatch = b.product_id.match(/va-(\d+)/);
      
      if (aMatch && bMatch) {
        return parseInt(bMatch[1], 10) - parseInt(aMatch[1], 10);
      }
      
      // Fallback to string comparison
      return b.product_id.localeCompare(a.product_id);
    });
    
    // Log first product for debugging
    if (convertedProducts.length > 0) {
      console.log(`[Products MongoDB] First product: ${convertedProducts[0].title} (ID: ${convertedProducts[0].product_id})`);
    } else {
      console.warn(`[Products MongoDB] No products found in "${PRODUCTS_COLLECTION}" collection`);
    }
    
    return convertedProducts;
  } catch (error: any) {
    console.error("[Products MongoDB] Error fetching products from MongoDB:", error);
    console.error("[Products MongoDB] Error details:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      code: error?.code
    });
    // Return empty array instead of throwing - allows page to load even if products can't be fetched
    // The API route will handle the error appropriately
    console.warn("[Products MongoDB] Returning empty array due to error");
    return [];
  }
}

// Get product by ID
export async function getProductById(productId: string): Promise<Product | null> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const collection = db.collection(PRODUCTS_COLLECTION);
    
    // Try to convert productId to ObjectId if it's a valid ObjectId string
    let objectIdFilter: any = { product_id: productId };
    try {
      // If productId is a valid ObjectId string, also search by _id
      if (ObjectId.isValid(productId)) {
        objectIdFilter = {
          $or: [
            { _id: new ObjectId(productId) },
            { product_id: productId }
          ]
        };
      }
    } catch {
      // If ObjectId conversion fails, just use the product_id field
    }
    
    const product = await collection.findOne(objectIdFilter);
    
    if (!product) return null;
    return docToProduct(product);
  } catch (error) {
    return null;
  }
}

// Get product by slug
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const collection = db.collection(PRODUCTS_COLLECTION);
    const product = await collection.findOne({ slug });
    
    if (!product) return null;
    return docToProduct(product);
  } catch (error) {
    return null;
  }
}

// Create new product
export async function createProduct(product: Product): Promise<Product> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    // Check if slug already exists
    const existing = await getProductBySlug(product.slug);
    if (existing) {
      throw new Error("Product with this slug already exists");
    }

    // Generate product_id if not provided
    let productId = product.product_id;
    if (!productId) {
      const allProducts = await getAllProducts();
      const existingIds = allProducts.map((p) => {
        const match = p.product_id.match(/va-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      });
      const nextId = Math.max(0, ...existingIds) + 1;
      productId = `va-${String(nextId).padStart(2, "0")}`;
    }

    // Generate SKU if not provided
    let sku = product.sku;
    if (!sku) {
      const allProducts = await getAllProducts();
      const categoryPrefix = product.category.substring(0, 3).toUpperCase();
      const existingSKUs = allProducts
        .filter((p) => p.category === product.category)
        .map((p) => {
          const match = p.sku.match(new RegExp(`${categoryPrefix}-(\\d+)`));
          return match ? parseInt(match[1], 10) : 0;
        });
      const nextNum = Math.max(0, ...existingSKUs) + 1;
      sku = `VA-${categoryPrefix}-${String(nextNum).padStart(3, "0")}`;
    }

    const productData = {
      ...product,
      product_id: productId,
      sku: sku,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const collection = db.collection(PRODUCTS_COLLECTION);
    // Let MongoDB auto-generate _id, use product_id as the identifier
    await collection.insertOne(productData);

    return { ...product, product_id: productId, sku };
  } catch (error: any) {
    throw new Error(error.message || "Failed to create product");
  }
}

// Update product
export async function updateProduct(
  productId: string,
  updates: Partial<Product>
): Promise<Product> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const collection = db.collection(PRODUCTS_COLLECTION);
    
    // Try to convert productId to ObjectId if it's a valid ObjectId string
    let objectIdFilter: any = { product_id: productId };
    try {
      // If productId is a valid ObjectId string, also search by _id
      if (ObjectId.isValid(productId)) {
        objectIdFilter = {
          $or: [
            { _id: new ObjectId(productId) },
            { product_id: productId }
          ]
        };
      }
    } catch {
      // If ObjectId conversion fails, just use the product_id field
    }
    
    const product = await collection.findOne(objectIdFilter);

    if (!product) {
      throw new Error("Product not found");
    }

    // Check if slug is being updated and conflicts with another product
    if (updates.slug) {
      const existing = await getProductBySlug(updates.slug);
      if (existing && existing.product_id !== productId) {
        throw new Error("Product slug already exists");
      }
    }

    await collection.updateOne(
      objectIdFilter,
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      }
    );

    const updated = await collection.findOne(objectIdFilter);
    
    if (!updated) {
      throw new Error("Failed to retrieve updated product");
    }
    
    return docToProduct(updated);
  } catch (error: any) {
    throw new Error(error.message || "Failed to update product");
  }
}

// Delete product
export async function deleteProduct(productId: string): Promise<void> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const collection = db.collection(PRODUCTS_COLLECTION);
    
    // Try to convert productId to ObjectId if it's a valid ObjectId string
    let objectIdFilter: any = { product_id: productId };
    try {
      // If productId is a valid ObjectId string, also search by _id
      if (ObjectId.isValid(productId)) {
        objectIdFilter = {
          $or: [
            { _id: new ObjectId(productId) },
            { product_id: productId }
          ]
        };
      }
    } catch {
      // If ObjectId conversion fails, just use the product_id field
    }
    
    const product = await collection.findOne(objectIdFilter);

    if (!product) {
      throw new Error("Product not found");
    }

    // Get product data before deletion to delete images
    const productSlug = product.slug;
    const productImages = product.images || [];

    // Delete images from ImageKit before deleting the product
    if (productSlug) {
      try {
        const { deleteProductImages } = await import("@/lib/imagekit-server");
        await deleteProductImages(productSlug, productImages);
      } catch (imageError: any) {
        // Silently fail - continue with product deletion even if image deletion fails
      }
    }

    // Delete the product from MongoDB
    await collection.deleteOne(objectIdFilter);
  } catch (error: any) {
    throw new Error(error.message || "Failed to delete product");
  }
}

// Generate unique product ID
export async function generateProductId(): Promise<string> {
  const products = await getAllProducts();
  const existingIds = products.map((p) => {
    const match = p.product_id.match(/va-(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  });
  const nextId = Math.max(0, ...existingIds) + 1;
  return `va-${String(nextId).padStart(2, "0")}`;
}

// Generate unique SKU
export async function generateSKU(category: string): Promise<string> {
  const products = await getAllProducts();
  const categoryPrefix = category.substring(0, 3).toUpperCase();
  const existingSKUs = products
    .filter((p) => p.category === category)
    .map((p) => {
      const match = p.sku.match(new RegExp(`${categoryPrefix}-(\\d+)`));
      return match ? parseInt(match[1], 10) : 0;
    });
  const nextNum = Math.max(0, ...existingSKUs) + 1;
  return `VA-${categoryPrefix}-${String(nextNum).padStart(3, "0")}`;
}

// Get products by category
export async function getProductsByCategory(category: string, limit: number = 8, excludeProductId?: string): Promise<Product[]> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const collection = db.collection(PRODUCTS_COLLECTION);
    const query: any = { category };
    
    if (excludeProductId) {
      query.$and = [
        { $or: [
          { _id: { $ne: excludeProductId } },
          { product_id: { $ne: excludeProductId } }
        ]}
      ];
    }
    
    const products = await collection
      .find(query)
      .limit(limit)
      .toArray();
    
    return products.map(docToProduct);
  } catch (error) {
    return [];
  }
}

// Get products by metal finish
export async function getProductsByMetalFinish(metalFinish: string, limit: number = 8, excludeProductId?: string): Promise<Product[]> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const collection = db.collection(PRODUCTS_COLLECTION);
    const query: any = { metal_finish: metalFinish };
    
    if (excludeProductId) {
      query.$and = [
        { $or: [
          { _id: { $ne: excludeProductId } },
          { product_id: { $ne: excludeProductId } }
        ]}
      ];
    }
    
    const products = await collection
      .find(query)
      .limit(limit)
      .toArray();
    
    return products.map(docToProduct);
  } catch (error) {
    return [];
  }
}

