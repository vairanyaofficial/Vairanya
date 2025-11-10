// Server-only product helper functions
// This file should only be imported in server components or API routes

import "server-only";
import type { Product, Category } from "./products-types";
import { initializeMongoDB } from "./mongodb.server";

// Re-export MongoDB functions
export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  try {
    // Initialize MongoDB connection
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      console.error("MongoDB not available for getProductBySlug:", mongoInit.error);
      return undefined;
    }

    const { getProductBySlug: getProduct } = await import("./products-mongodb");
    const product = await getProduct(slug);
    return product || undefined;
  } catch (error) {
    console.error("Error in getProductBySlug:", error);
    return undefined;
  }
}

export async function getProductById(id: string): Promise<Product | undefined> {
  try {
    // Initialize MongoDB connection
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      console.error("MongoDB not available for getProductById:", mongoInit.error);
      return undefined;
    }

    const { getProductById: getProduct } = await import("./products-mongodb");
    const product = await getProduct(id);
    return product || undefined;
  } catch (error) {
    console.error("Error in getProductById:", error);
    return undefined;
  }
}

export async function getProductsByCategory(category: Category): Promise<Product[]> {
  try {
    // Initialize MongoDB connection
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      console.error("MongoDB not available for getProductsByCategory:", mongoInit.error);
      return [];
    }

    const { getAllProducts } = await import("./products-mongodb");
    
    // Get all products and filter by category
    const allProducts = await getAllProducts();
    return allProducts.filter((p) => p.category === category);
  } catch (error) {
    console.error("Error in getProductsByCategory:", error);
    return [];
  }
}

export async function getNewProducts(): Promise<Product[]> {
  try {
    // Initialize MongoDB connection
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      console.error("MongoDB not available for getNewProducts:", mongoInit.error);
      return [];
    }

    const { getAllProducts } = await import("./products-mongodb");
    const allProducts = await getAllProducts();
    return allProducts.filter((p) => p.is_new);
  } catch (error) {
    console.error("Error in getNewProducts:", error);
    return [];
  }
}

export async function getAllProducts(): Promise<Product[]> {
  try {
    // Initialize MongoDB connection
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      console.error("MongoDB not available for getAllProducts:", mongoInit.error);
      return [];
    }

    const { getAllProducts: getProducts } = await import("./products-mongodb");
    return await getProducts();
  } catch (error) {
    console.error("Error in getAllProducts:", error);
    return [];
  }
}

