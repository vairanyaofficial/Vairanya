// Categories Firestore service - server-side only
import "server-only";
import { adminFirestore, ensureFirebaseInitialized } from "@/lib/firebaseAdmin.server";

const CATEGORIES_COLLECTION = "categories";

// Get all categories
export async function getAllCategories(): Promise<string[]> {
  // Ensure Firebase is initialized
  const initResult = await ensureFirebaseInitialized();
  if (!initResult.success || !adminFirestore) {
    throw new Error("Database unavailable");
  }

  try {
    const snapshot = await adminFirestore.collection(CATEGORIES_COLLECTION).get();
    
    if (snapshot.empty) {
      // Initialize with default categories
      const defaultCategories = ["rings", "earrings", "pendants", "bracelets", "necklaces"];
      await Promise.all(
        defaultCategories.map((cat) =>
          adminFirestore.collection(CATEGORIES_COLLECTION).doc(cat).set({ name: cat })
        )
      );
      return defaultCategories;
    }

    return snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => doc.id).sort();
  } catch (error) {
    // Fallback to default categories
    return ["rings", "earrings", "pendants", "bracelets", "necklaces"];
  }
}

// Add new category
export async function addCategory(categoryName: string): Promise<string[]> {
  // Ensure Firebase is initialized
  const initResult = await ensureFirebaseInitialized();
  if (!initResult.success || !adminFirestore) {
    throw new Error("Database unavailable");
  }

  try {
    const normalizedName = categoryName.trim().toLowerCase();
    if (!normalizedName) {
      throw new Error("Category name cannot be empty");
    }

    // Check if category already exists
    const doc = await adminFirestore.collection(CATEGORIES_COLLECTION).doc(normalizedName).get();
    if (doc.exists) {
      throw new Error("Category already exists");
    }

    // Add category
    await adminFirestore.collection(CATEGORIES_COLLECTION).doc(normalizedName).set({
      name: normalizedName,
      createdAt: new Date(),
    });

    // Return all categories
    return getAllCategories();
  } catch (error: any) {
    throw new Error(error.message || "Failed to add category");
  }
}

