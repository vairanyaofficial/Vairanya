// Server-only product helper functions
// This file should only be imported in server components or API routes

import "server-only";
import type { Product, Category } from "./products-types";

// Re-export Firestore functions
export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  try {
    const { getProductBySlug: getProduct } = await import("./products-firestore");
    return (await getProduct(slug)) || undefined;
  } catch (error) {
    return undefined;
  }
}

export async function getProductById(id: string): Promise<Product | undefined> {
  try {
    const { getProductById: getProduct } = await import("./products-firestore");
    return (await getProduct(id)) || undefined;
  } catch (error) {
    return undefined;
  }
}

export async function getProductsByCategory(category: Category): Promise<Product[]> {
  try {
    const { getAllProducts } = await import("./products-firestore");
    const allProducts = await getAllProducts();
    return allProducts.filter((p) => p.category === category);
  } catch (error) {
    return [];
  }
}

export async function getNewProducts(): Promise<Product[]> {
  try {
    const { getAllProducts } = await import("./products-firestore");
    const allProducts = await getAllProducts();
    return allProducts.filter((p) => p.is_new);
  } catch (error) {
    return [];
  }
}

export async function getAllProducts(): Promise<Product[]> {
  try {
    const { getAllProducts } = await import("./products-firestore");
    return await getAllProducts();
  } catch (error) {
    return [];
  }
}

