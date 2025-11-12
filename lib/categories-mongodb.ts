// lib/categories-mongodb.ts
// MongoDB implementation for categories - server-side only
import "server-only";
import { getMongoDB } from "@/lib/mongodb.server";

const CATEGORIES_COLLECTION = "Category";

// Get all categories
export async function getAllCategories(): Promise<string[]> {
  // Don't initialize here - trust that connection is initialized at API route level
  const db = getMongoDB();
  if (!db) {
    // Return default categories if MongoDB is not available
    console.warn("MongoDB not available, returning default categories");
    return ["rings", "earrings", "pendants", "bracelets", "necklaces"];
  }

  try {
    const collection = db.collection(CATEGORIES_COLLECTION);
    const categories = await collection.find({}).toArray();

    if (categories.length === 0) {
      // Initialize with default categories
      const defaultCategories = ["rings", "earrings", "pendants", "bracelets", "necklaces"];
      const docs = defaultCategories.map((name) => ({
        name,
        created_at: new Date().toISOString(),
      }));

      await collection.insertMany(docs);
      return defaultCategories;
    }

    return categories.map((doc: any) => doc.name || doc._id).sort();
  } catch (error) {
    console.error("Error getting categories from MongoDB:", error);
    // Fallback to default categories
    return ["rings", "earrings", "pendants", "bracelets", "necklaces"];
  }
}

// Add new category
export async function addCategory(categoryName: string): Promise<string[]> {
  // Don't initialize here - trust that connection is initialized at API route level
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available. Please initialize connection first.");
  }

  try {
    const normalizedName = categoryName.trim().toLowerCase();
    if (!normalizedName) {
      throw new Error("Category name cannot be empty");
    }

    const collection = db.collection(CATEGORIES_COLLECTION);

    // Check if category already exists
    const existing = await collection.findOne({ name: normalizedName });
    if (existing) {
      throw new Error("Category already exists");
    }

    // Add category
    await collection.insertOne({
      name: normalizedName,
      created_at: new Date().toISOString(),
    });

    // Return all categories
    return getAllCategories();
  } catch (error: any) {
    throw new Error(error.message || "Failed to add category");
  }
}

// Delete category
export async function deleteCategory(categoryName: string): Promise<string[]> {
  // Don't initialize here - trust that connection is initialized at API route level
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available. Please initialize connection first.");
  }

  try {
    const normalizedName = categoryName.trim().toLowerCase();
    const collection = db.collection(CATEGORIES_COLLECTION);
    
    // Check if category exists
    const existing = await collection.findOne({ name: normalizedName });
    if (!existing) {
      throw new Error("Category not found");
    }
    
    await collection.deleteOne({ name: normalizedName });
    
    // Return all remaining categories
    return getAllCategories();
  } catch (error: any) {
    throw new Error(error.message || "Failed to delete category");
  }
}

// Update/rename category
export async function updateCategory(oldName: string, newName: string): Promise<string[]> {
  // Don't initialize here - trust that connection is initialized at API route level
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available. Please initialize connection first.");
  }

  try {
    const normalizedOldName = oldName.trim().toLowerCase();
    const normalizedNewName = newName.trim().toLowerCase();
    
    if (!normalizedOldName || !normalizedNewName) {
      throw new Error("Category name cannot be empty");
    }
    
    if (normalizedOldName === normalizedNewName) {
      // No change, just return all categories
      return getAllCategories();
    }
    
    const collection = db.collection(CATEGORIES_COLLECTION);
    
    // Check if old category exists
    const oldCategory = await collection.findOne({ name: normalizedOldName });
    if (!oldCategory) {
      throw new Error("Category not found");
    }
    
    // Check if new name already exists
    const existingNewCategory = await collection.findOne({ name: normalizedNewName });
    if (existingNewCategory) {
      throw new Error("Category with that name already exists");
    }
    
    // Update category name
    await collection.updateOne(
      { name: normalizedOldName },
      { 
        $set: { 
          name: normalizedNewName,
          updated_at: new Date().toISOString(),
        } 
      }
    );
    
    // Return all categories
    return getAllCategories();
  } catch (error: any) {
    throw new Error(error.message || "Failed to update category");
  }
}

