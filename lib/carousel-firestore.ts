// Carousel Firestore service - server-side only
import "server-only";
import { adminFirestore, ensureFirebaseInitialized } from "@/lib/firebaseAdmin.server";
import type { CarouselSlide } from "./carousel-types";

const CAROUSEL_COLLECTION = "carousel_slides";

// Helper function to ensure Firestore is initialized
async function ensureInitialized(): Promise<void> {
  const initResult = await ensureFirebaseInitialized();
  if (!initResult.success || !adminFirestore) {
    throw new Error("Database unavailable");
  }
}

// Convert Firestore document to CarouselSlide
function docToCarouselSlide(doc: any): CarouselSlide {
  const data = doc.data();
  const docId = doc.id || data.id;

  return {
    id: docId,
    image_url: data.image_url || "",
    title: data.title || "",
    subtitle: data.subtitle || "",
    link_url: data.link_url || "",
    link_text: data.link_text || "",
    order: data.order || 0,
    is_active: data.is_active !== undefined ? data.is_active : true,
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.updated_at || new Date().toISOString(),
  };
}

// Get all carousel slides (active only for public, all for admin)
export async function getCarouselSlides(activeOnly: boolean = true): Promise<CarouselSlide[]> {
  await ensureInitialized();

  try {
    let query = adminFirestore.collection(CAROUSEL_COLLECTION);

    if (activeOnly) {
      query = query.where("is_active", "==", true);
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
      return [];
    }

    const slides = snapshot.docs.map(docToCarouselSlide);
    // Sort by order in memory to avoid needing a Firestore index
    return slides.sort((a: CarouselSlide, b: CarouselSlide) => (a.order || 0) - (b.order || 0));
  } catch (error) {
    console.error("Error fetching carousel slides:", error);
    return [];
  }
}

// Get single carousel slide by ID
export async function getCarouselSlideById(id: string): Promise<CarouselSlide | null> {
  await ensureInitialized();

  try {
    const doc = await adminFirestore.collection(CAROUSEL_COLLECTION).doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return docToCarouselSlide(doc);
  } catch (error) {
    console.error("Error fetching carousel slide:", error);
    return null;
  }
}

// Create new carousel slide
export async function createCarouselSlide(slide: Omit<CarouselSlide, "id" | "created_at" | "updated_at">): Promise<CarouselSlide> {
  await ensureInitialized();

  const now = new Date().toISOString();
  const slideData = {
    ...slide,
    created_at: now,
    updated_at: now,
  };

  const docRef = await adminFirestore.collection(CAROUSEL_COLLECTION).add(slideData);
  const doc = await docRef.get();
  return docToCarouselSlide(doc);
}

// Update carousel slide
export async function updateCarouselSlide(id: string, updates: Partial<CarouselSlide>): Promise<CarouselSlide> {
  await ensureInitialized();

  const updateData = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  // Remove fields that shouldn't be updated
  delete (updateData as any).id;
  delete (updateData as any).created_at;

  await adminFirestore.collection(CAROUSEL_COLLECTION).doc(id).update(updateData);
  const doc = await adminFirestore.collection(CAROUSEL_COLLECTION).doc(id).get();
  return docToCarouselSlide(doc);
}

// Delete carousel slide
export async function deleteCarouselSlide(id: string): Promise<void> {
  await ensureInitialized();

  await adminFirestore.collection(CAROUSEL_COLLECTION).doc(id).delete();
}

// Reorder carousel slides
export async function reorderCarouselSlides(slideOrders: { id: string; order: number }[]): Promise<void> {
  await ensureInitialized();

  const batch = adminFirestore.batch();

  for (const { id, order } of slideOrders) {
    const ref = adminFirestore.collection(CAROUSEL_COLLECTION).doc(id);
    batch.update(ref, { order, updated_at: new Date().toISOString() });
  }

  await batch.commit();
}

