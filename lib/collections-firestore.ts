// Collections Firestore service - server-side only
import "server-only";
import { adminFirestore, ensureFirebaseInitialized } from "@/lib/firebaseAdmin.server";
import type { Collection } from "./collections-types";

const COLLECTIONS_COLLECTION = "collections";

// Helper function to ensure Firestore is initialized
async function ensureInitialized(): Promise<void> {
  const initResult = ensureFirebaseInitialized();
  if (!initResult.success || !adminFirestore) {
    throw new Error(initResult.error || "Firestore not initialized");
  }
}

// Convert Firestore document to Collection
function docToCollection(doc: any): Collection {
  const data = doc.data();
  const docData = data || doc;
  const docId = doc.id || docData.id;
  
  return {
    id: docId,
    name: docData.name || "",
    description: docData.description || "",
    short_description: docData.short_description || "",
    image: docData.image || "",
    product_ids: Array.isArray(docData.product_ids) ? docData.product_ids : [],
    is_featured: docData.is_featured || false,
    is_active: docData.is_active !== false, // Default to true
    slug: docData.slug || "",
    display_order: docData.display_order || 0,
    createdAt: docData.createdAt?.toDate?.() || docData.createdAt || new Date(),
    updatedAt: docData.updatedAt?.toDate?.() || docData.updatedAt || new Date(),
  };
}

// Get all collections
export async function getAllCollections(): Promise<Collection[]> {
  await ensureInitialized();

  try {
    const snapshot = await adminFirestore
      .collection(COLLECTIONS_COLLECTION)
      .get();

    const collections = snapshot.docs.map(docToCollection);
    // Sort by display_order then by createdAt
    return collections.sort((a: Collection, b: Collection) => {
      if (a.display_order !== b.display_order) {
        return (a.display_order || 0) - (b.display_order || 0);
      }
      return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0);
    });
  } catch (error) {
    return [];
  }
}

// Get featured collections (for homepage)
export async function getFeaturedCollections(): Promise<Collection[]> {
  await ensureInitialized();

  try {
    const snapshot = await adminFirestore
      .collection(COLLECTIONS_COLLECTION)
      .where("is_featured", "==", true)
      .where("is_active", "==", true)
      .get();

    const collections = snapshot.docs.map(docToCollection);
    // Sort by display_order then by createdAt
    return collections.sort((a: Collection, b: Collection) => {
      if (a.display_order !== b.display_order) {
        return (a.display_order || 0) - (b.display_order || 0);
      }
      return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0);
    });
  } catch (error) {
    return [];
  }
}

// Get collection by ID
export async function getCollectionById(collectionId: string): Promise<Collection | null> {
  await ensureInitialized();

  try {
    const doc = await adminFirestore.collection(COLLECTIONS_COLLECTION).doc(collectionId).get();
    if (!doc.exists) return null;
    return docToCollection(doc);
  } catch (error) {
    return null;
  }
}

// Get collection by slug
export async function getCollectionBySlug(slug: string): Promise<Collection | null> {
  await ensureInitialized();

  try {
    const snapshot = await adminFirestore
      .collection(COLLECTIONS_COLLECTION)
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return docToCollection(snapshot.docs[0]);
  } catch (error) {
    return null;
  }
}

// Create new collection
export async function createCollection(collection: Omit<Collection, "id" | "createdAt" | "updatedAt">): Promise<Collection> {
  await ensureInitialized();

  try {
    // Check if slug already exists
    const existing = await getCollectionBySlug(collection.slug);
    if (existing) {
      throw new Error("Collection with this slug already exists");
    }

    // Generate ID
    const allCollections = await getAllCollections();
    const existingIds = allCollections.map((c) => {
      const match = c.id.match(/coll-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    const nextId = Math.max(0, ...existingIds) + 1;
    const collectionId = `coll-${String(nextId).padStart(3, "0")}`;

    // Set display_order if not provided
    let displayOrder = collection.display_order;
    if (displayOrder === undefined) {
      // If featured, count existing featured collections; otherwise count all
      if (collection.is_featured) {
        const allCollections = await getAllCollections();
        const featuredCount = allCollections.filter(c => c.is_featured).length;
        displayOrder = featuredCount;
      } else {
        displayOrder = 0;
      }
    }

    const collectionData = {
      ...collection,
      id: collectionId,
      display_order: displayOrder,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await adminFirestore.collection(COLLECTIONS_COLLECTION).doc(collectionId).set(collectionData);

    const createdCollection: Collection = {
      ...collection,
      id: collectionId,
      display_order: displayOrder,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return createdCollection;
  } catch (error: any) {
    throw new Error(error.message || "Failed to create collection");
  }
}

// Update collection
export async function updateCollection(
  collectionId: string,
  updates: Partial<Omit<Collection, "id" | "createdAt">>
): Promise<Collection> {
  await ensureInitialized();

  try {
    const collectionRef = adminFirestore.collection(COLLECTIONS_COLLECTION).doc(collectionId);
    const doc = await collectionRef.get();

    if (!doc.exists) {
      throw new Error("Collection not found");
    }

    // Check if slug is being updated and conflicts with another collection
    if (updates.slug) {
      const existing = await getCollectionBySlug(updates.slug);
      if (existing && existing.id !== collectionId) {
        throw new Error("Collection slug already exists");
      }
    }

    await collectionRef.update({
      ...updates,
      updatedAt: new Date(),
    });

    const updated = await collectionRef.get();
    return docToCollection(updated);
  } catch (error: any) {
    throw new Error(error.message || "Failed to update collection");
  }
}

// Delete collection
export async function deleteCollection(collectionId: string): Promise<void> {
  await ensureInitialized();

  try {
    const collectionRef = adminFirestore.collection(COLLECTIONS_COLLECTION).doc(collectionId);
    const doc = await collectionRef.get();

    if (!doc.exists) {
      throw new Error("Collection not found");
    }

    await collectionRef.delete();
  } catch (error: any) {
    throw new Error(error.message || "Failed to delete collection");
  }
}

// Generate unique collection ID
export async function generateCollectionId(): Promise<string> {
  const collections = await getAllCollections();
  const existingIds = collections.map((c) => {
    const match = c.id.match(/coll-(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  });
  const nextId = Math.max(0, ...existingIds) + 1;
  return `coll-${String(nextId).padStart(3, "0")}`;
}

// Get collections containing a specific product ID
export async function getCollectionsByProductId(productId: string): Promise<Collection[]> {
  await ensureInitialized();

  try {
    // Firestore doesn't support array-contains queries efficiently for large arrays
    // So we fetch active collections and filter in memory, but limit the fetch
    const snapshot = await adminFirestore
      .collection(COLLECTIONS_COLLECTION)
      .where("is_active", "==", true)
      .get();

    const collections = snapshot.docs
      .map(docToCollection)
      .filter((c: Collection) => c.product_ids.includes(productId))
      .sort((a: Collection, b: Collection) => {
        if (a.display_order !== b.display_order) {
          return (a.display_order || 0) - (b.display_order || 0);
        }
        return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0);
      });

    return collections;
  } catch (error) {
    return [];
  }
}

// Get featured collections (excluding those containing a product)
export async function getFeaturedCollectionsExcluding(productId: string, limit: number = 4): Promise<Collection[]> {
  await ensureInitialized();

  try {
    const snapshot = await adminFirestore
      .collection(COLLECTIONS_COLLECTION)
      .where("is_featured", "==", true)
      .where("is_active", "==", true)
      .get();

    const collections = snapshot.docs
      .map(docToCollection)
      .filter((c: Collection) => !c.product_ids.includes(productId))
      .sort((a: Collection, b: Collection) => {
        if (a.display_order !== b.display_order) {
          return (a.display_order || 0) - (b.display_order || 0);
        }
        return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0);
      })
      .slice(0, limit);

    return collections;
  } catch (error) {
    return [];
  }
}

