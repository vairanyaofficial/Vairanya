// Customer sync service - syncs user data to customers collection
import "server-only";
import { getMongoDB } from "@/lib/mongodb.server";
import { initializeMongoDB } from "@/lib/mongodb.server";

// Use the same collection names as customers-mongodb.ts for consistency
const CUSTOMERS_COLLECTION = "customers"; // Primary collection
const CUSTOMERS_COLLECTION_ALT = "User"; // Alternative collection (for backward compatibility)

export interface CustomerData {
  email: string;
  name: string;
  phone?: string;
  user_id?: string; // Firebase user ID
  photoURL?: string; // User profile photo URL
  created_at: string;
  updated_at: string;
  last_login?: string; // Track last login time
}

// Sync customer data to MongoDB (create or update)
export async function syncCustomerToFirestore(
  email: string,
  name: string,
  phone?: string,
  userId?: string,
  photoURL?: string
): Promise<void> {
  // Initialize MongoDB connection
  const mongoInit = await initializeMongoDB();
  if (!mongoInit.success) {
    console.warn("[Customer Sync] MongoDB not available, skipping customer sync");
    return;
  }

  const db = getMongoDB();
  if (!db) {
    console.warn("[Customer Sync] MongoDB database not available, skipping customer sync");
    return;
  }

  try {
    const now = new Date().toISOString();
    const normalizedEmail = email.toLowerCase().trim();
    
    // Try to save to primary collection first (customers)
    const primaryCollection = db.collection(CUSTOMERS_COLLECTION);
    let existing: any = null;
    
    try {
      existing = await primaryCollection.findOne({ email: normalizedEmail });
    } catch (error: any) {
      console.log(`[Customer Sync] Primary collection "${CUSTOMERS_COLLECTION}" not accessible, trying alternative...`);
    }
    
    // If not found in primary, check alternative collection
    if (!existing) {
      try {
        const altCollection = db.collection(CUSTOMERS_COLLECTION_ALT);
        existing = await altCollection.findOne({ email: normalizedEmail });
        if (existing) {
          console.log(`[Customer Sync] Found existing customer in "${CUSTOMERS_COLLECTION_ALT}" collection`);
        }
      } catch (error: any) {
        // Continue with primary collection
      }
    }

    if (existing) {
      // Update existing customer in the collection where it was found
      const updateData: any = {
        name: name.trim(),
        updated_at: now,
        last_login: now,
      };
      
      if (phone && phone.trim() !== "") {
        updateData.phone = phone.trim();
      }
      if (userId && userId.trim() !== "") {
        updateData.user_id = userId.trim();
      }
      if (photoURL && photoURL.trim() !== "") {
        updateData.photoURL = photoURL.trim();
      }
      
      // Update in primary collection
      try {
        await primaryCollection.updateOne(
          { email: normalizedEmail },
          { $set: updateData },
          { upsert: true } // Create if doesn't exist
        );
        console.log(`[Customer Sync] Updated customer in "${CUSTOMERS_COLLECTION}": ${normalizedEmail}`);
      } catch (error: any) {
        console.warn(`[Customer Sync] Failed to update in primary collection:`, error?.message);
      }
    } else {
      // Create new customer document in primary collection
      const customerData: any = {
        email: normalizedEmail,
        name: name.trim(),
        created_at: now,
        updated_at: now,
        last_login: now,
      };
      
      if (phone && phone.trim() !== "") {
        customerData.phone = phone.trim();
      }
      if (userId && userId.trim() !== "") {
        customerData.user_id = userId.trim();
      }
      if (photoURL && photoURL.trim() !== "") {
        customerData.photoURL = photoURL.trim();
      }
      
      try {
        await primaryCollection.insertOne(customerData);
        console.log(`[Customer Sync] Created new customer in "${CUSTOMERS_COLLECTION}": ${normalizedEmail}`);
      } catch (error: any) {
        // If insert fails (e.g., duplicate key), try update
        if (error?.code === 11000) {
          await primaryCollection.updateOne(
            { email: normalizedEmail },
            { $set: customerData }
          );
          console.log(`[Customer Sync] Updated existing customer (duplicate key): ${normalizedEmail}`);
        } else {
          throw error;
        }
      }
    }
  } catch (error: any) {
    // Don't throw - allow registration/login to continue even if sync fails
    // Just log the error
    console.error(`[Customer Sync] Error syncing customer to MongoDB (${email}):`, error);
  }
}

// Get customer from MongoDB
export async function getCustomerFromFirestore(email: string): Promise<CustomerData | null> {
  // Initialize MongoDB connection
  const mongoInit = await initializeMongoDB();
  if (!mongoInit.success) {
    return null;
  }

  const db = getMongoDB();
  if (!db) {
    return null;
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Try primary collection first
    const primaryCollection = db.collection(CUSTOMERS_COLLECTION);
    let customer = await primaryCollection.findOne({ email: normalizedEmail });
    
    if (!customer) {
      // Try alternative collection
      try {
        const altCollection = db.collection(CUSTOMERS_COLLECTION_ALT);
        customer = await altCollection.findOne({ email: normalizedEmail });
      } catch (error: any) {
        // Collection might not exist
      }
    }
    
    if (!customer) {
      return null;
    }
    
    return customer as CustomerData;
  } catch (error: any) {
    console.error("[Customer Sync] Error getting customer from MongoDB:", error);
    return null;
  }
}

