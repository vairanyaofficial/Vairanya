// Customer sync service - syncs user data to customers collection
import "server-only";
import { adminFirestore } from "@/lib/firebaseAdmin.server";

const CUSTOMERS_COLLECTION = "customers";

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

// Sync customer data to Firestore (create or update)
export async function syncCustomerToFirestore(
  email: string,
  name: string,
  phone?: string,
  userId?: string,
  photoURL?: string
): Promise<void> {
  if (!adminFirestore) {
    return;
  }

  try {
    const now = new Date().toISOString();
    
    // Use email as document ID for easy lookup
    const customerRef = adminFirestore.collection(CUSTOMERS_COLLECTION).doc(email);
    const customerDoc = await customerRef.get();

    if (customerDoc.exists) {
      // Update existing customer
      const updateData: any = {
        name,
        updated_at: now,
        last_login: now,
      };
      
      if (phone && phone.trim() !== "") {
        updateData.phone = phone;
      }
      if (userId && userId.trim() !== "") {
        updateData.user_id = userId;
      }
      if (photoURL && photoURL.trim() !== "") {
        updateData.photoURL = photoURL.trim();
      }
      
      await customerRef.update(updateData);
    } else {
      // Create new customer document
      const customerData: CustomerData = {
        email: email.toLowerCase().trim(),
        name: name.trim(),
        phone: phone && phone.trim() !== "" ? phone.trim() : undefined,
        user_id: userId && userId.trim() !== "" ? userId.trim() : undefined,
        photoURL: photoURL && photoURL.trim() !== "" ? photoURL.trim() : undefined,
        created_at: now,
        updated_at: now,
        last_login: now,
      };
      
      // Remove undefined values before saving
      const cleanData: any = {
        email: customerData.email,
        name: customerData.name,
        created_at: customerData.created_at,
        updated_at: customerData.updated_at,
        last_login: customerData.last_login,
      };
      
      if (customerData.phone) {
        cleanData.phone = customerData.phone;
      }
      if (customerData.user_id) {
        cleanData.user_id = customerData.user_id;
      }
      if (customerData.photoURL) {
        cleanData.photoURL = customerData.photoURL;
      }
      
      await customerRef.set(cleanData);
    }
  } catch (error: any) {
    // Don't throw - allow registration/login to continue even if sync fails
    // Just log the error
  }
}

// Get customer from Firestore
export async function getCustomerFromFirestore(email: string): Promise<CustomerData | null> {
  if (!adminFirestore) {
    throw new Error("Database unavailable");
  }

  try {
    const customerDoc = await adminFirestore.collection(CUSTOMERS_COLLECTION).doc(email).get();
    if (!customerDoc.exists) {
      return null;
    }
    return customerDoc.data() as CustomerData;
  } catch (error) {
    return null;
  }
}

