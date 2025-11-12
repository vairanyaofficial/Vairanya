// Carousel MongoDB service - server-side only
// This file maintains backward compatibility by re-exporting MongoDB functions
import "server-only";
import * as carouselMongo from "./carousel-mongodb";
import type { CarouselSlide } from "./carousel-types";

// Re-export all MongoDB functions
export async function getCarouselSlides(activeOnly: boolean = true): Promise<CarouselSlide[]> {
  return carouselMongo.getCarouselSlides(activeOnly);
}

export async function getCarouselSlideById(id: string): Promise<CarouselSlide | null> {
  return carouselMongo.getCarouselSlideById(id);
}

export async function createCarouselSlide(
  slide: Omit<CarouselSlide, "id" | "created_at" | "updated_at">
): Promise<CarouselSlide> {
  return carouselMongo.createCarouselSlide(slide);
}

export async function updateCarouselSlide(
  id: string,
  updates: Partial<Omit<CarouselSlide, "id" | "created_at">>
): Promise<CarouselSlide> {
  return carouselMongo.updateCarouselSlide(id, updates);
}

export async function deleteCarouselSlide(id: string): Promise<void> {
  return carouselMongo.deleteCarouselSlide(id);
}

export async function reorderCarouselSlides(ids: string[]): Promise<void> {
  // Convert string array to object array with order
  const slidesWithOrder = ids.map((id, index) => ({
    id,
    order: index + 1,
  }));
  return carouselMongo.reorderCarouselSlides(slidesWithOrder);
}
