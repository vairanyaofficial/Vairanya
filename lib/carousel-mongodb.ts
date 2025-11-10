// lib/carousel-mongodb.ts
// MongoDB implementation for carousel - server-side only
import "server-only";
import { getMongoDB } from "@/lib/mongodb.server";
import { ObjectId } from "mongodb";
import type { CarouselSlide } from "./carousel-types";

const CAROUSEL_COLLECTION = "Carousel";

// Convert MongoDB document to CarouselSlide
function docToCarouselSlide(doc: any): CarouselSlide {
  return {
    id: doc._id?.toString() || doc.id,
    image_url: doc.image_url || "",
    title: doc.title || "",
    subtitle: doc.subtitle || "",
    link_url: doc.link_url || "",
    link_text: doc.link_text || "",
    order: doc.order || 0,
    is_active: doc.is_active !== undefined ? doc.is_active : true,
    created_at: doc.created_at || new Date().toISOString(),
    updated_at: doc.updated_at || new Date().toISOString(),
  };
}

// Get all carousel slides (active only for public, all for admin)
export async function getCarouselSlides(activeOnly: boolean = true): Promise<CarouselSlide[]> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const collection = db.collection(CAROUSEL_COLLECTION);
    let query: any = {};

    if (activeOnly) {
      query.is_active = true;
    }

    const slides = await collection
      .find(query)
      .sort({ order: 1, created_at: -1 })
      .toArray();

    return slides.map(docToCarouselSlide);
  } catch (error) {
    console.error("Error fetching carousel slides:", error);
    return [];
  }
}

// Get single carousel slide by ID
export async function getCarouselSlideById(id: string): Promise<CarouselSlide | null> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const collection = db.collection(CAROUSEL_COLLECTION);
    let query: any;
    
    // Try to parse as ObjectId first
    try {
      const objectId = new ObjectId(id);
      query = { _id: objectId };
    } catch {
      // If not a valid ObjectId, try string match
      query = { 
        $or: [
          { _id: id },
          { id: id }
        ]
      };
    }
    
    const doc = await collection.findOne(query);

    if (!doc) {
      return null;
    }

    return docToCarouselSlide(doc);
  } catch (error) {
    console.error("Error fetching carousel slide:", error);
    return null;
  }
}

// Create new carousel slide
export async function createCarouselSlide(
  slide: Omit<CarouselSlide, "id" | "created_at" | "updated_at">
): Promise<CarouselSlide> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const now = new Date().toISOString();
    const slideData = {
      ...slide,
      created_at: now,
      updated_at: now,
    };

    const collection = db.collection(CAROUSEL_COLLECTION);
    const result = await collection.insertOne(slideData);
    const created = await collection.findOne({ _id: result.insertedId });

    if (!created) {
      throw new Error("Failed to create carousel slide");
    }

    return docToCarouselSlide(created);
  } catch (error: any) {
    throw new Error(error.message || "Failed to create carousel slide");
  }
}

// Update carousel slide
export async function updateCarouselSlide(
  id: string,
  updates: Partial<CarouselSlide>
): Promise<CarouselSlide> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    delete updateData.id;
    delete updateData.created_at;

    const collection = db.collection(CAROUSEL_COLLECTION);
    
    // Build query to find document by _id
    let query: any;
    try {
      const objectId = new ObjectId(id);
      query = { _id: objectId };
    } catch {
      // If not a valid ObjectId, try string match
      query = { 
        $or: [
          { _id: id },
          { id: id }
        ]
      };
    }
    
    const result = await collection.updateOne(query, { $set: updateData });
    
    if (result.matchedCount === 0) {
      throw new Error("Carousel slide not found");
    }

    const updated = await collection.findOne(query);
    if (!updated) {
      throw new Error("Failed to retrieve updated slide");
    }

    return docToCarouselSlide(updated);
  } catch (error: any) {
    console.error("Error updating carousel slide:", error);
    throw new Error(error.message || "Failed to update carousel slide");
  }
}

// Delete carousel slide
export async function deleteCarouselSlide(id: string): Promise<void> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const collection = db.collection(CAROUSEL_COLLECTION);
    
    // Build query to find document by _id
    let query: any;
    try {
      const objectId = new ObjectId(id);
      query = { _id: objectId };
    } catch {
      // If not a valid ObjectId, try string match
      query = { 
        $or: [
          { _id: id },
          { id: id }
        ]
      };
    }
    
    const result = await collection.deleteOne(query);
    
    if (result.deletedCount === 0) {
      throw new Error("Carousel slide not found");
    }
  } catch (error: any) {
    console.error("Error deleting carousel slide:", error);
    throw new Error(error.message || "Failed to delete carousel slide");
  }
}

// Reorder carousel slides
export async function reorderCarouselSlides(
  slideOrders: { id: string; order: number }[]
): Promise<void> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const collection = db.collection(CAROUSEL_COLLECTION);
    const bulkOps = slideOrders.map(({ id, order }) => {
      // Build query to find document by _id
      let query: any;
      try {
        const objectId = new ObjectId(id);
        query = { _id: objectId };
      } catch {
        // If not a valid ObjectId, try string match
        query = { 
          $or: [
            { _id: id },
            { id: id }
          ]
        };
      }
      
      return {
        updateOne: {
          filter: query,
          update: { $set: { order, updated_at: new Date().toISOString() } },
        },
      };
    });

    await collection.bulkWrite(bulkOps);
  } catch (error: any) {
    console.error("Error reordering carousel slides:", error);
    throw new Error(error.message || "Failed to reorder carousel slides");
  }
}

