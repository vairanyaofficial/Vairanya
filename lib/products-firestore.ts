// Products MongoDB service - server-side only
// This file maintains backward compatibility by re-exporting MongoDB functions
import "server-only";
import * as productsMongo from "./products-mongodb";
import type { Product } from "./products-types";

// Re-export all MongoDB functions
export async function getAllProducts(): Promise<Product[]> {
  return productsMongo.getAllProducts();
}

export async function getProductById(productId: string): Promise<Product | null> {
  return productsMongo.getProductById(productId);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return productsMongo.getProductBySlug(slug);
}

export async function createProduct(product: Product): Promise<Product> {
  return productsMongo.createProduct(product);
}

export async function updateProduct(
  productId: string,
  updates: Partial<Product>
): Promise<Product> {
  return productsMongo.updateProduct(productId, updates);
}

export async function deleteProduct(productId: string): Promise<void> {
  return productsMongo.deleteProduct(productId);
}

export async function generateProductId(): Promise<string> {
  return productsMongo.generateProductId();
}

export async function generateSKU(category: string): Promise<string> {
  return productsMongo.generateSKU(category);
}

export async function getProductsByCategory(category: string, limit: number = 8, excludeProductId?: string): Promise<Product[]> {
  return productsMongo.getProductsByCategory(category, limit, excludeProductId);
}

export async function getProductsByMetalFinish(metalFinish: string, limit: number = 8, excludeProductId?: string): Promise<Product[]> {
  return productsMongo.getProductsByMetalFinish(metalFinish, limit, excludeProductId);
}
