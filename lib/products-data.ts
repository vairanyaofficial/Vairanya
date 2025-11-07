// Product data persistence layer
// For MVP, we'll use a JSON file approach
// In production, replace with database (PostgreSQL, MongoDB, etc.)
// This file is server-only and cannot be imported in client components

import "server-only";
import fs from "fs/promises";
import path from "path";
import type { Product } from "./products-types";

const DATA_FILE = path.join(process.cwd(), "data", "products.json");

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.dirname(DATA_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Load products from file or return defaults
export async function loadProducts(): Promise<Product[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, initialize with default products
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      // Dynamically import default products to avoid bundling issues
      const { products: defaultProducts } = await import("./products");
      await saveProducts(defaultProducts);
      return defaultProducts;
    }
    throw error;
  }
}

// Save products to file
export async function saveProducts(products: Product[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(DATA_FILE, JSON.stringify(products, null, 2), "utf-8");
}

// Get product by ID
export async function getProductById(productId: string): Promise<Product | null> {
  const products = await loadProducts();
  return products.find((p) => p.product_id === productId) || null;
}

// Get product by slug
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const products = await loadProducts();
  return products.find((p) => p.slug === slug) || null;
}

// Create new product
export async function createProduct(product: Product): Promise<Product> {
  const products = await loadProducts();
  
  // Check if product_id or slug already exists
  if (products.some((p) => p.product_id === product.product_id)) {
    throw new Error("Product ID already exists");
  }
  if (products.some((p) => p.slug === product.slug)) {
    throw new Error("Product slug already exists");
  }
  
  products.push(product);
  await saveProducts(products);
  return product;
}

// Update product
export async function updateProduct(
  productId: string,
  updates: Partial<Product>
): Promise<Product> {
  const products = await loadProducts();
  const index = products.findIndex((p) => p.product_id === productId);
  
  if (index === -1) {
    throw new Error("Product not found");
  }
  
  // Check if slug is being updated and conflicts with another product
  if (updates.slug && products.some((p, i) => i !== index && p.slug === updates.slug)) {
    throw new Error("Product slug already exists");
  }
  
  products[index] = { ...products[index], ...updates };
  await saveProducts(products);
  return products[index];
}

// Delete product
export async function deleteProduct(productId: string): Promise<void> {
  const products = await loadProducts();
  const filtered = products.filter((p) => p.product_id !== productId);
  
  if (filtered.length === products.length) {
    throw new Error("Product not found");
  }
  
  await saveProducts(filtered);
}

// Generate unique product ID
export async function generateProductId(): Promise<string> {
  const products = await loadProducts();
  const existingIds = products.map((p) => {
    const match = p.product_id.match(/va-(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  });
  const nextId = Math.max(0, ...existingIds) + 1;
  return `va-${String(nextId).padStart(2, "0")}`;
}

// Generate unique SKU
export async function generateSKU(category: string): Promise<string> {
  const products = await loadProducts();
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

