// Categories MongoDB service - server-side only
// This file maintains backward compatibility by re-exporting MongoDB functions
import "server-only";
import * as categoriesMongo from "./categories-mongodb";

// Re-export all MongoDB functions
export async function getAllCategories(): Promise<string[]> {
  return categoriesMongo.getAllCategories();
}

export async function addCategory(categoryName: string): Promise<string[]> {
  return categoriesMongo.addCategory(categoryName);
}

export async function deleteCategory(categoryName: string): Promise<string[]> {
  return categoriesMongo.deleteCategory(categoryName);
}

export async function updateCategory(oldName: string, newName: string): Promise<string[]> {
  return categoriesMongo.updateCategory(oldName, newName);
}
