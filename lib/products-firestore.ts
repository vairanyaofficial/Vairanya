// Products Firestore service - server-side only
import "server-only";
import { adminFirestore } from "@/lib/firebaseAdmin.server";
import type { Product } from "./products-types";

const PRODUCTS_COLLECTION = "products";

// Convert Firestore document to Product
function docToProduct(doc: any): Product {
  const data = doc.data();
  // Handle both Firestore document format and direct data
  const docData = data || doc;
  const docId = doc.id || docData.product_id;
  
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
    images: Array.isArray(docData.images) ? docData.images : (docData.imageUrl ? [docData.imageUrl] : []),
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
  if (!adminFirestore) {
    throw new Error("Firestore not initialized");
  }

  try {
    const snapshot = await adminFirestore
      .collection(PRODUCTS_COLLECTION)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map(docToProduct);
  } catch (error) {
    return [];
  }
}

// Get product by ID
export async function getProductById(productId: string): Promise<Product | null> {
  if (!adminFirestore) {
    throw new Error("Firestore not initialized");
  }

  try {
    const doc = await adminFirestore.collection(PRODUCTS_COLLECTION).doc(productId).get();
    if (!doc.exists) return null;
    return docToProduct(doc);
  } catch (error) {
    return null;
  }
}

// Get product by slug
export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!adminFirestore) {
    throw new Error("Firestore not initialized");
  }

  try {
    const snapshot = await adminFirestore
      .collection(PRODUCTS_COLLECTION)
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return docToProduct(snapshot.docs[0]);
  } catch (error) {
    return null;
  }
}

// Create new product
export async function createProduct(product: Product): Promise<Product> {
  if (!adminFirestore) {
    throw new Error("Firestore not initialized");
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
      // Generate unique ID
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

    await adminFirestore.collection(PRODUCTS_COLLECTION).doc(productId).set(productData);

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
  if (!adminFirestore) {
    throw new Error("Firestore not initialized");
  }

  try {
    const productRef = adminFirestore.collection(PRODUCTS_COLLECTION).doc(productId);
    const doc = await productRef.get();

    if (!doc.exists) {
      throw new Error("Product not found");
    }

    // Check if slug is being updated and conflicts with another product
    if (updates.slug) {
      const existing = await getProductBySlug(updates.slug);
      if (existing && existing.product_id !== productId) {
        throw new Error("Product slug already exists");
      }
    }

    await productRef.update({
      ...updates,
      updatedAt: new Date(),
    });

    const updated = await productRef.get();
    return docToProduct(updated);
  } catch (error: any) {
    throw new Error(error.message || "Failed to update product");
  }
}

// Delete product
export async function deleteProduct(productId: string): Promise<void> {
  if (!adminFirestore) {
    throw new Error("Firestore not initialized");
  }

  try {
    const productRef = adminFirestore.collection(PRODUCTS_COLLECTION).doc(productId);
    const doc = await productRef.get();

    if (!doc.exists) {
      throw new Error("Product not found");
    }

    await productRef.delete();
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

// Get products by category (optimized query)
export async function getProductsByCategory(category: string, limit: number = 8, excludeProductId?: string): Promise<Product[]> {
  if (!adminFirestore) {
    throw new Error("Firestore not initialized");
  }

  try {
    let query = adminFirestore
      .collection(PRODUCTS_COLLECTION)
      .where("category", "==", category)
      .limit(limit + (excludeProductId ? 1 : 0));

    const snapshot = await query.get();
    let products = snapshot.docs.map(docToProduct);
    
    // Exclude the current product if specified
    if (excludeProductId) {
      products = products.filter(p => p.product_id !== excludeProductId);
    }
    
    return products.slice(0, limit);
  } catch (error) {
    return [];
  }
}

// Get products by metal finish (optimized query)
export async function getProductsByMetalFinish(metalFinish: string, limit: number = 8, excludeProductId?: string): Promise<Product[]> {
  if (!adminFirestore) {
    throw new Error("Firestore not initialized");
  }

  try {
    let query = adminFirestore
      .collection(PRODUCTS_COLLECTION)
      .where("metal_finish", "==", metalFinish)
      .limit(limit + (excludeProductId ? 1 : 0));

    const snapshot = await query.get();
    let products = snapshot.docs.map(docToProduct);
    
    // Exclude the current product if specified
    if (excludeProductId) {
      products = products.filter(p => p.product_id !== excludeProductId);
    }
    
    return products.slice(0, limit);
  } catch (error) {
    return [];
  }
}

