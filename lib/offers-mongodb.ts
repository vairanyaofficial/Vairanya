// lib/offers-mongodb.ts
// MongoDB implementation for offers - server-side only
import "server-only";
import { getMongoDB } from "@/lib/mongodb.server";
import type { Offer } from "./offers-types";

const OFFERS_COLLECTION = "Offer";
const OFFER_USAGES_COLLECTION = "OfferUsage";

// Convert MongoDB document to Offer
function docToOffer(doc: any): Offer {
  return {
    id: doc._id?.toString() || doc.id,
    code: doc.code || undefined,
    title: doc.title || "",
    description: doc.description || "",
    discount_type: doc.discount_type || "percentage",
    discount_value: doc.discount_value || 0,
    min_order_amount: doc.min_order_amount || undefined,
    max_discount: doc.max_discount || undefined,
    valid_from: doc.valid_from || new Date().toISOString(),
    valid_until: doc.valid_until || new Date().toISOString(),
    is_active: doc.is_active !== undefined ? doc.is_active : true,
    customer_email: doc.customer_email || undefined,
    customer_emails: doc.customer_emails || undefined,
    customer_id: doc.customer_id || undefined,
    customer_ids: doc.customer_ids || undefined,
    usage_limit: doc.usage_limit || undefined,
    used_count: doc.used_count || 0,
    one_time_per_user: doc.one_time_per_user !== undefined ? doc.one_time_per_user : false,
    created_at: doc.created_at || new Date().toISOString(),
    updated_at: doc.updated_at || new Date().toISOString(),
    created_by: doc.created_by || undefined,
  };
}

// Get all offers
export async function getAllOffers(): Promise<Offer[]> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const collection = db.collection(OFFERS_COLLECTION);
    const docs = await collection.find({}).sort({ created_at: -1 }).toArray();
    return docs.map(docToOffer);
  } catch (error) {
    console.error("Error fetching offers:", error);
    return [];
  }
}

// Get active offers (for public display)
export async function getActiveOffers(
  customerEmail?: string,
  customerId?: string
): Promise<Offer[]> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const now = new Date();
    const allOffers = await getAllOffers();

    // Filter offers and check user usage for one_time_per_user offers
    const filteredOffers = await Promise.all(
      allOffers.map(async (offer) => {
        // Check if offer is active
        if (!offer.is_active) {
          return null;
        }

        // Check validity dates
        try {
          const validFrom = new Date(offer.valid_from);
          const validUntil = new Date(offer.valid_until);

          if (now < validFrom || now > validUntil) {
            return null;
          }
        } catch (dateError) {
          console.error("Error parsing offer dates:", dateError, offer);
          return null;
        }

        // Check usage limit
        if (offer.usage_limit && offer.used_count >= offer.usage_limit) {
          return null;
        }

        // Check if user has already used this offer (one_time_per_user)
        if (offer.one_time_per_user && (customerEmail || customerId)) {
          const hasUsed = await hasUserUsedOffer(offer.id, customerEmail, customerId);
          if (hasUsed) {
            return null;
          }
        }

        // Check if offer is for specific customer
        if (offer.customer_email || offer.customer_emails || offer.customer_id || offer.customer_ids) {
          if (customerEmail) {
            if (offer.customer_email === customerEmail) return offer;
            if (offer.customer_emails && offer.customer_emails.includes(customerEmail)) return offer;
          }
          if (customerId) {
            if (offer.customer_id === customerId) return offer;
            if (offer.customer_ids && offer.customer_ids.includes(customerId)) return offer;
          }
          return null;
        }

        // Offer is for all customers
        return offer;
      })
    );

    return filteredOffers.filter((offer): offer is Offer => offer !== null);
  } catch (error) {
    console.error("Error fetching active offers:", error);
    return [];
  }
}

// Get offer by code
export async function getOfferByCode(code: string): Promise<Offer | null> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const normalizedCode = code.trim().toUpperCase();
    const collection = db.collection(OFFERS_COLLECTION);
    const doc = await collection.findOne({ code: normalizedCode });

    if (!doc) return null;
    return docToOffer(doc);
  } catch (error) {
    return null;
  }
}

// Get offer by ID
export async function getOfferById(offerId: string): Promise<Offer | null> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const collection = db.collection(OFFERS_COLLECTION);
    const doc = await collection.findOne({ _id: offerId as any });
    if (!doc) return null;
    return docToOffer(doc);
  } catch (error) {
    return null;
  }
}

// Create new offer
export async function createOffer(
  offer: Omit<Offer, "id" | "created_at" | "updated_at" | "used_count">
): Promise<Offer> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
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
    if (offer.one_time_per_user !== undefined) {
      offerData.one_time_per_user = offer.one_time_per_user;
    }
    if (offer.created_by) {
      offerData.created_by = offer.created_by;
    }

    const collection = db.collection(OFFERS_COLLECTION);
    const result = await collection.insertOne(offerData);
    const created = await collection.findOne({ _id: result.insertedId });

    if (!created) {
      throw new Error("Failed to create offer");
    }

    return docToOffer(created);
  } catch (error: any) {
    throw new Error(error.message || "Failed to create offer");
  }
}

// Update offer
export async function updateOffer(offerId: string, updates: Partial<Offer>): Promise<Offer> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const collection = db.collection(OFFERS_COLLECTION);
    const doc = await collection.findOne({ _id: offerId as any });

    if (!doc) {
      throw new Error("Offer not found");
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Copy all updates except timestamps and id, and filter out undefined values
    Object.keys(updates).forEach((key) => {
      if (key !== "id" && key !== "created_at" && key !== "updated_at") {
        const value = (updates as any)[key];
        if (value !== undefined) {
          updateData[key] = value;
        }
      }
    });

    await collection.updateOne({ _id: offerId as any }, { $set: updateData });

    const updated = await collection.findOne({ _id: offerId as any });
    if (!updated) {
      throw new Error("Failed to retrieve updated offer");
    }

    return docToOffer(updated);
  } catch (error: any) {
    throw new Error(error.message || "Failed to update offer");
  }
}

// Delete offer
export async function deleteOffer(offerId: string): Promise<void> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const collection = db.collection(OFFERS_COLLECTION);
    const result = await collection.deleteOne({ _id: offerId as any });

    if (result.deletedCount === 0) {
      throw new Error("Offer not found");
    }
  } catch (error: any) {
    throw new Error(error.message || "Failed to delete offer");
  }
}

// Check if user has already used an offer
export async function hasUserUsedOffer(
  offerId: string,
  customerEmail?: string,
  customerId?: string
): Promise<boolean> {
  const db = getMongoDB();
  if (!db) {
    return false;
  }

  try {
    const collection = db.collection(OFFER_USAGES_COLLECTION);
    let query: any = { offer_id: offerId };

    // Check by customer_id first (more reliable)
    if (customerId) {
      query.customer_id = customerId;
      const doc = await collection.findOne(query);
      if (doc) return true;
    }

    // Check by customer_email as fallback
    if (customerEmail) {
      query = { offer_id: offerId, customer_email: customerEmail };
      const doc = await collection.findOne(query);
      if (doc) return true;
    }

    return false;
  } catch (error) {
    console.error("Error checking offer usage:", error);
    return false;
  }
}

// Record offer usage by user
export async function recordOfferUsage(
  offerId: string,
  customerEmail?: string,
  customerId?: string
): Promise<void> {
  const db = getMongoDB();
  if (!db) {
    return;
  }

  try {
    const usageData: any = {
      offer_id: offerId,
      used_at: new Date().toISOString(),
    };

    if (customerId) {
      usageData.customer_id = customerId;
    }
    if (customerEmail) {
      usageData.customer_email = customerEmail;
    }

    const collection = db.collection(OFFER_USAGES_COLLECTION);
    await collection.insertOne(usageData);
  } catch (error) {
    console.error("Error recording offer usage:", error);
  }
}

// Increment offer usage count
export async function incrementOfferUsage(
  offerId: string,
  customerEmail?: string,
  customerId?: string
): Promise<void> {
  const db = getMongoDB();
  if (!db) {
    return;
  }

  try {
    const collection = db.collection(OFFERS_COLLECTION);
    const doc = await collection.findOne({ _id: offerId as any });

    if (!doc) {
      return;
    }

    const currentCount = doc.used_count || 0;

    // Update offer usage count
    await collection.updateOne(
      { _id: offerId as any },
      {
        $set: {
          used_count: currentCount + 1,
          updated_at: new Date().toISOString(),
        },
      }
    );

    // If one_time_per_user is enabled, record user usage
    if (doc.one_time_per_user && (customerEmail || customerId)) {
      await recordOfferUsage(offerId, customerEmail, customerId);
    }
  } catch (error) {
    console.error("Error incrementing offer usage:", error);
  }
}

