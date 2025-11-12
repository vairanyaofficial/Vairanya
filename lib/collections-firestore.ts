// Collections MongoDB service - server-side only
// This file maintains backward compatibility by re-exporting MongoDB functions
import "server-only";
import * as collectionsMongo from "./collections-mongodb";
import type { Collection } from "./collections-types";

// Re-export all MongoDB functions
export async function getAllCollections(): Promise<Collection[]> {
  return collectionsMongo.getAllCollections();
}

export async function getFeaturedCollections(): Promise<Collection[]> {
  return collectionsMongo.getFeaturedCollections();
}

export async function getCollectionById(collectionId: string): Promise<Collection | null> {
  return collectionsMongo.getCollectionById(collectionId);
}

export async function getCollectionBySlug(slug: string): Promise<Collection | null> {
  return collectionsMongo.getCollectionBySlug(slug);
}

export async function createCollection(
  collection: Omit<Collection, "id" | "createdAt" | "updatedAt">
): Promise<Collection> {
  return collectionsMongo.createCollection(collection);
}

export async function updateCollection(
  collectionId: string,
  updates: Partial<Omit<Collection, "id" | "createdAt">>
): Promise<Collection> {
  return collectionsMongo.updateCollection(collectionId, updates);
}

export async function deleteCollection(collectionId: string): Promise<void> {
  return collectionsMongo.deleteCollection(collectionId);
}

export async function generateCollectionId(): Promise<string> {
  return collectionsMongo.generateCollectionId();
}

export async function getCollectionsByProductId(productId: string): Promise<Collection[]> {
  return collectionsMongo.getCollectionsByProductId(productId);
}

export async function getFeaturedCollectionsExcluding(
  productId: string,
  limit: number = 4
): Promise<Collection[]> {
  return collectionsMongo.getFeaturedCollectionsExcluding(productId, limit);
}
