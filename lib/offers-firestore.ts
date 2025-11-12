// Offers MongoDB service - server-side only
// This file maintains backward compatibility by re-exporting MongoDB functions
import "server-only";
import * as offersMongo from "./offers-mongodb";
import type { Offer } from "./offers-types";

// Re-export all MongoDB functions
export async function getAllOffers(): Promise<Offer[]> {
  return offersMongo.getAllOffers();
}

export async function getActiveOffers(
  customerEmail?: string,
  customerId?: string
): Promise<Offer[]> {
  return offersMongo.getActiveOffers(customerEmail, customerId);
}

export async function getOfferByCode(code: string): Promise<Offer | null> {
  return offersMongo.getOfferByCode(code);
}

export async function getOfferById(offerId: string): Promise<Offer | null> {
  return offersMongo.getOfferById(offerId);
}

export async function createOffer(offer: Omit<Offer, "id" | "created_at" | "updated_at">): Promise<Offer> {
  return offersMongo.createOffer(offer);
}

export async function updateOffer(offerId: string, updates: Partial<Offer>): Promise<Offer> {
  return offersMongo.updateOffer(offerId, updates);
}

export async function deleteOffer(offerId: string): Promise<void> {
  return offersMongo.deleteOffer(offerId);
}

export async function hasUserUsedOffer(
  offerId: string,
  customerEmail?: string,
  customerId?: string
): Promise<boolean> {
  return offersMongo.hasUserUsedOffer(offerId, customerEmail, customerId);
}

export async function recordOfferUsage(
  offerId: string,
  customerEmail?: string,
  customerId?: string
): Promise<void> {
  return offersMongo.recordOfferUsage(offerId, customerEmail, customerId);
}

export async function incrementOfferUsage(
  offerId: string,
  customerEmail?: string,
  customerId?: string
): Promise<void> {
  return offersMongo.incrementOfferUsage(offerId, customerEmail, customerId);
}
