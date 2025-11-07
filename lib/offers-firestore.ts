// Offers Firestore service - server-side only
import "server-only";
import { adminFirestore } from "@/lib/firebaseAdmin.server";
import type { Offer } from "./offers-types";

const OFFERS_COLLECTION = "offers";

// Convert Firestore document to Offer
function docToOffer(doc: any): Offer {
  const data = doc.data();
  return {
    id: doc.id,
    code: data.code || undefined,
    title: data.title || "",
    description: data.description || "",
    discount_type: data.discount_type || "percentage",
    discount_value: data.discount_value || 0,
    min_order_amount: data.min_order_amount || undefined,
    max_discount: data.max_discount || undefined,
    valid_from: data.valid_from 
      ? (typeof data.valid_from === 'string' ? data.valid_from : data.valid_from.toDate?.()?.toISOString() || new Date().toISOString())
      : new Date().toISOString(),
    valid_until: data.valid_until 
      ? (typeof data.valid_until === 'string' ? data.valid_until : data.valid_until.toDate?.()?.toISOString() || new Date().toISOString())
      : new Date().toISOString(),
    is_active: data.is_active !== undefined ? data.is_active : true,
    customer_email: data.customer_email || undefined,
    customer_emails: data.customer_emails || undefined,
    customer_id: data.customer_id || undefined,
    customer_ids: data.customer_ids || undefined,
    usage_limit: data.usage_limit || undefined,
    used_count: data.used_count || 0,
    created_at: data.created_at 
      ? (typeof data.created_at === 'string' ? data.created_at : data.created_at.toDate?.()?.toISOString() || new Date().toISOString())
      : (data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()),
    updated_at: data.updated_at 
      ? (typeof data.updated_at === 'string' ? data.updated_at : data.updated_at.toDate?.()?.toISOString() || new Date().toISOString())
      : (data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()),
    created_by: data.created_by || undefined,
  };
}

// Get all offers
export async function getAllOffers(): Promise<Offer[]> {
  if (!adminFirestore) {
    throw new Error("Firestore not initialized");
  }

  try {
    // Try with orderBy first, but fallback to unordered if index doesn't exist
    let snapshot;
    try {
      snapshot = await adminFirestore
        .collection(OFFERS_COLLECTION)
        .orderBy("created_at", "desc")
        .get();
    } catch (orderByError: any) {
      // If orderBy fails (likely due to missing index), get without ordering
      // and sort in memory
      snapshot = await adminFirestore
        .collection(OFFERS_COLLECTION)
        .get();
      
      const offers = snapshot.docs.map(docToOffer);
      // Sort by created_at descending
      return offers.sort((a: Offer, b: Offer) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      });
    }

    return snapshot.docs.map(docToOffer);
  } catch (error) {
    console.error("Error fetching offers:", error);
    return [];
  }
}

// Get active offers (for public display)
export async function getActiveOffers(customerEmail?: string, customerId?: string): Promise<Offer[]> {
  if (!adminFirestore) {
    throw new Error("Firestore not initialized");
  }

  try {
    const now = new Date();
    const nowISO = now.toISOString();
    const allOffers = await getAllOffers();
    
    return allOffers.filter(offer => {
      // Check if offer is active
      if (!offer.is_active) {
        return false;
      }
      
      // Check validity dates - convert to Date objects for proper comparison
      try {
        const validFrom = new Date(offer.valid_from);
        const validUntil = new Date(offer.valid_until);
        
        // Check if current date is within validity range
        if (now < validFrom || now > validUntil) {
          return false;
        }
      } catch (dateError) {
        console.error("Error parsing offer dates:", dateError, offer);
        return false;
      }
      
      // Check usage limit
      if (offer.usage_limit && offer.used_count >= offer.usage_limit) {
        return false;
      }
      
      // Check if offer is for specific customer
      if (offer.customer_email || offer.customer_emails || offer.customer_id || offer.customer_ids) {
        // If offer is for a specific customer, check if it matches
        if (customerEmail) {
          if (offer.customer_email === customerEmail) return true;
          if (offer.customer_emails && offer.customer_emails.includes(customerEmail)) return true;
        }
        if (customerId) {
          if (offer.customer_id === customerId) return true;
          if (offer.customer_ids && offer.customer_ids.includes(customerId)) return true;
        }
        // Offer is for specific customer(s) but doesn't match current customer
        return false;
      }
      
      // Offer is for all customers
      return true;
    });
  } catch (error) {
    console.error("Error fetching active offers:", error);
    return [];
  }
}

// Get offer by code
export async function getOfferByCode(code: string): Promise<Offer | null> {
  if (!adminFirestore) {
    throw new Error("Firestore not initialized");
  }

  try {
    const normalizedCode = code.trim().toUpperCase();
    const snapshot = await adminFirestore
      .collection(OFFERS_COLLECTION)
      .where("code", "==", normalizedCode)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return docToOffer(snapshot.docs[0]);
  } catch (error) {
    return null;
  }
}

// Get offer by ID
export async function getOfferById(offerId: string): Promise<Offer | null> {
  if (!adminFirestore) {
    throw new Error("Firestore not initialized");
  }

  try {
    const doc = await adminFirestore.collection(OFFERS_COLLECTION).doc(offerId).get();
    if (!doc.exists) return null;
    return docToOffer(doc);
  } catch (error) {
    return null;
  }
}

// Create new offer
export async function createOffer(
  offer: Omit<Offer, "id" | "created_at" | "updated_at" | "used_count">
): Promise<Offer> {
  if (!adminFirestore) {
    throw new Error("Firestore not initialized");
  }

  try {
    // Remove undefined values from offer data (Firestore doesn't accept undefined)
    const offerData: any = {
      title: offer.title,
      description: offer.description || "",
      discount_type: offer.discount_type,
      discount_value: offer.discount_value,
      valid_from: offer.valid_from,
      valid_until: offer.valid_until,
      is_active: offer.is_active !== undefined ? offer.is_active : true,
      used_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Only add optional fields if they have values
    if (offer.min_order_amount !== undefined && offer.min_order_amount !== null) {
      offerData.min_order_amount = offer.min_order_amount;
    }
    if (offer.max_discount !== undefined && offer.max_discount !== null) {
      offerData.max_discount = offer.max_discount;
    }
    if (offer.code && offer.code.trim() !== "") {
      offerData.code = offer.code.trim().toUpperCase();
    }
    if (offer.customer_email) {
      offerData.customer_email = offer.customer_email;
    }
    if (offer.customer_emails && Array.isArray(offer.customer_emails) && offer.customer_emails.length > 0) {
      offerData.customer_emails = offer.customer_emails;
    }
    if (offer.customer_id) {
      offerData.customer_id = offer.customer_id;
    }
    if (offer.customer_ids && Array.isArray(offer.customer_ids) && offer.customer_ids.length > 0) {
      offerData.customer_ids = offer.customer_ids;
    }
    if (offer.usage_limit !== undefined && offer.usage_limit !== null) {
      offerData.usage_limit = offer.usage_limit;
    }
    if (offer.created_by) {
      offerData.created_by = offer.created_by;
    }

    const docRef = await adminFirestore.collection(OFFERS_COLLECTION).add(offerData);
    const doc = await docRef.get();
    return docToOffer(doc);
  } catch (error: any) {
    throw new Error(error.message || "Failed to create offer");
  }
}

// Update offer
export async function updateOffer(offerId: string, updates: Partial<Offer>): Promise<Offer> {
  if (!adminFirestore) {
    throw new Error("Firestore not initialized");
  }

  try {
    const offerRef = adminFirestore.collection(OFFERS_COLLECTION).doc(offerId);
    const doc = await offerRef.get();

    if (!doc.exists) {
      throw new Error("Offer not found");
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Copy all updates except timestamps and id, and filter out undefined values
    Object.keys(updates).forEach((key) => {
      if (key !== "id" && key !== "created_at" && key !== "updated_at") {
        const value = (updates as any)[key];
        // Only add the field if it's not undefined
        if (value !== undefined) {
          updateData[key] = value;
        }
      }
    });

    await offerRef.update(updateData);

    const updated = await offerRef.get();
    return docToOffer(updated);
  } catch (error: any) {
    throw new Error(error.message || "Failed to update offer");
  }
}

// Delete offer
export async function deleteOffer(offerId: string): Promise<void> {
  if (!adminFirestore) {
    throw new Error("Firestore not initialized");
  }

  try {
    const offerRef = adminFirestore.collection(OFFERS_COLLECTION).doc(offerId);
    const doc = await offerRef.get();

    if (!doc.exists) {
      throw new Error("Offer not found");
    }

    await offerRef.delete();
  } catch (error: any) {
    throw new Error(error.message || "Failed to delete offer");
  }
}

// Increment offer usage count
export async function incrementOfferUsage(offerId: string): Promise<void> {
  if (!adminFirestore) {
    throw new Error("Firestore not initialized");
  }

  try {
    const offerRef = adminFirestore.collection(OFFERS_COLLECTION).doc(offerId);
    const doc = await offerRef.get();

    if (!doc.exists) {
      return;
    }

    const currentCount = doc.data()?.used_count || 0;
    await offerRef.update({
      used_count: currentCount + 1,
      updated_at: new Date().toISOString(),
    });
  } catch (error: any) {
    // Silently fail - don't block order creation
  }
}

