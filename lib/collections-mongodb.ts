// lib/collections-mongodb.ts
// MongoDB implementation for collections - server-side only
import "server-only";
import { getMongoDB } from "@/lib/mongodb.server";
import type { Collection } from "./collections-types";

const COLLECTIONS_COLLECTION = "Collection";

// Convert MongoDB document to Collection
function docToCollection(doc: any): Collection {
  return {
    id: doc.id || doc._id?.toString(),
    name: doc.name || "",
    description: doc.description || "",
    short_description: doc.short_description || "",
    image: doc.image || "",
    product_ids: Array.isArray(doc.product_ids) ? doc.product_ids : [],
    is_featured: doc.is_featured || false,
    is_active: doc.is_active !== false,
    slug: doc.slug || "",
    display_order: doc.display_order || 0,
    createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
  };
}

// Get all collections
export async function getAllCollections(): Promise<Collection[]> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const collection = db.collection(COLLECTIONS_COLLECTION);
    const docs = await collection.find({}).sort({ display_order: 1, createdAt: -1 }).toArray();
    return docs.map(docToCollection);
  } catch (error) {
    console.error("Error fetching collections:", error);
    return [];
  }
}

// Get featured collections
export async function getFeaturedCollections(): Promise<Collection[]> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const collection = db.collection(COLLECTIONS_COLLECTION);
    const docs = await collection
      .find({ is_featured: true, is_active: true })
      .sort({ display_order: 1, createdAt: -1 })
      .toArray();
    return docs.map(docToCollection);
  } catch (error) {
    console.error("Error fetching featured collections:", error);
    return [];
  }
}

// Get collection by ID
export async function getCollectionById(collectionId: string): Promise<Collection | null> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const collection = db.collection(COLLECTIONS_COLLECTION);
    const doc = await collection.findOne({ id: collectionId });
    if (!doc) return null;
    return docToCollection(doc);
  } catch (error) {
    return null;
  }
}

// Get collection by slug
export async function getCollectionBySlug(slug: string): Promise<Collection | null> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const collection = db.collection(COLLECTIONS_COLLECTION);
    const doc = await collection.findOne({ slug });
    if (!doc) return null;
    return docToCollection(doc);
  } catch (error) {
    return null;
  }
}

// Create new collection
export async function createCollection(
  collection: Omit<Collection, "id" | "createdAt" | "updatedAt">
): Promise<Collection> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

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
      if (collection.is_featured) {
        const featuredCount = allCollections.filter((c) => c.is_featured).length;
        displayOrder = featuredCount;
      } else {
        displayOrder = 0;
      }
    }

    const now = new Date();
    const collectionData = {
      ...collection,
      id: collectionId,
      display_order: displayOrder,
      createdAt: now,
      updatedAt: now,
    };

    const mongoCollection = db.collection(COLLECTIONS_COLLECTION);
    await mongoCollection.insertOne(collectionData);

    return {
      ...collection,
      id: collectionId,
      display_order: displayOrder,
      createdAt: now,
      updatedAt: now,
    };
  } catch (error: any) {
    throw new Error(error.message || "Failed to create collection");
  }
}

// Update collection
export async function updateCollection(
  collectionId: string,
  updates: Partial<Omit<Collection, "id" | "createdAt">>
): Promise<Collection> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const collection = db.collection(COLLECTIONS_COLLECTION);
    
    // First check if collection exists
    const existing = await collection.findOne({ id: collectionId });
    if (!existing) {
      throw new Error("Collection not found");
    }

    // Check if slug is being updated and conflicts
    if (updates.slug) {
      const slugConflict = await getCollectionBySlug(updates.slug);
      if (slugConflict && slugConflict.id !== collectionId) {
        throw new Error("Collection slug already exists");
      }
    }

    const updateData: any = {
      ...updates,
      updatedAt: new Date(),
    };

    await collection.updateOne({ id: collectionId }, { $set: updateData });

    const updated = await collection.findOne({ id: collectionId });
    if (!updated) {
      throw new Error("Collection not found");
    }

    return docToCollection(updated);
  } catch (error: any) {
    throw new Error(error.message || "Failed to update collection");
  }
}

// Delete collection
export async function deleteCollection(collectionId: string): Promise<void> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const collection = db.collection(COLLECTIONS_COLLECTION);
    const result = await collection.deleteOne({ id: collectionId });
    if (result.deletedCount === 0) {
      throw new Error("Collection not found");
    }
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
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const collection = db.collection(COLLECTIONS_COLLECTION);
    const docs = await collection
      .find({ is_active: true, product_ids: productId })
      .sort({ display_order: 1, createdAt: -1 })
      .toArray();
    return docs.map(docToCollection);
  } catch (error) {
    return [];
  }
}

// Get featured collections excluding those containing a product
export async function getFeaturedCollectionsExcluding(
  productId: string,
  limit: number = 4
): Promise<Collection[]> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const collection = db.collection(COLLECTIONS_COLLECTION);
    const docs = await collection
      .find({ is_featured: true, is_active: true, product_ids: { $ne: productId } })
      .sort({ display_order: 1, createdAt: -1 })
      .limit(limit)
      .toArray();
    return docs.map(docToCollection);
  } catch (error) {
    return [];
  }
}

