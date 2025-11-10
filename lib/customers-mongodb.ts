// lib/customers-mongodb.ts
// MongoDB implementation for customers - server-side only
import "server-only";
import { getMongoDB } from "@/lib/mongodb.server";
import { getAllOrders } from "./orders-mongodb";
import type { Customer } from "./offers-types";

// Try multiple collection names for compatibility
const CUSTOMERS_COLLECTION = "customers"; // Primary collection name
const CUSTOMERS_COLLECTION_ALT = "User"; // Alternative collection name (used by customer-sync)
const CUSTOMERS_COLLECTION_ALT2 = "users"; // Another alternative

// Get all unique customers from orders and customers collection
export async function getAllCustomers(): Promise<Customer[]> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const customersMap = new Map<string, Customer>();
    
    // Try all collections and combine results (some might have customers, some might not)
    const collectionNames = [CUSTOMERS_COLLECTION, CUSTOMERS_COLLECTION_ALT, CUSTOMERS_COLLECTION_ALT2];
    const allCustomers: any[] = [];
    
    for (const collectionName of collectionNames) {
      try {
        const collection = db.collection(collectionName);
        // MongoDB collections return empty array if collection doesn't exist, so this is safe
        const docs = await collection.find({}).limit(10000).toArray(); // Limit to prevent huge queries
        if (docs.length > 0) {
          console.log(`[Customers] Found ${docs.length} customers in "${collectionName}" collection`);
          allCustomers.push(...docs);
        }
      } catch (error: any) {
        // Collection might not exist or there's an error - that's OK, continue
        console.log(`[Customers] Could not read from "${collectionName}" collection:`, error?.message);
      }
    }
    
    const customersFromCollection = allCustomers;
    if (allCustomers.length > 0) {
      console.log(`[Customers] Total customers from all collections: ${allCustomers.length}`);
    } else {
      console.log(`[Customers] No customers found in any collection (${collectionNames.join(", ")})`);
    }
    
    // Process customers from collection(s)
    customersFromCollection.forEach((doc: any) => {
      const data = doc;
      const email = data.email?.toLowerCase().trim();
      if (!email) return; // Skip documents without email
      
      // Don't overwrite if already exists (to avoid duplicates)
      if (!customersMap.has(email)) {
        customersMap.set(email, {
          email: email,
          name: data.name || "",
          phone: data.phone || undefined,
          total_orders: 0,
          total_spent: 0,
          user_id: data.user_id || undefined,
          last_order_date: undefined,
        });
      } else {
        // Merge data if customer already exists
        const existing = customersMap.get(email)!;
        if (!existing.name && data.name) existing.name = data.name;
        if (!existing.phone && data.phone) existing.phone = data.phone;
        if (!existing.user_id && data.user_id) existing.user_id = data.user_id;
      }
    });
    
    console.log(`[Customers] Processed ${customersMap.size} unique customers from collection(s)`);

    // Get orders to calculate stats and add customers from orders
    let orders: any[] = [];
    try {
      orders = await getAllOrders();
      console.log(`[Customers] Found ${orders.length} orders to process`);
    } catch (orderError: any) {
      console.warn(`[Customers] Error fetching orders:`, orderError?.message);
      // Continue even if orders can't be fetched - at least show customers from collection
    }
    
    // Merge order data with customers collection data
    if (orders.length > 0) {
      orders.forEach(order => {
        const email = (order.customer?.email || "").toLowerCase().trim();
        if (!email) return;
        
        if (!customersMap.has(email)) {
          customersMap.set(email, {
            email: email,
            name: order.customer?.name || "",
            phone: order.customer?.phone || undefined,
            total_orders: 0,
            total_spent: 0,
            user_id: order.user_id || undefined,
            last_order_date: undefined,
          });
        }
        
        const customer = customersMap.get(email)!;
        customer.total_orders += 1;
        customer.total_spent += order.total || 0;
        
        // Update last order date
        const orderDate = new Date(order.created_at);
        if (!customer.last_order_date || orderDate > new Date(customer.last_order_date)) {
          customer.last_order_date = order.created_at;
        }
        
        // Update name if available from order and customer collection doesn't have it
        if (order.customer?.name && (!customer.name || customer.name.trim() === "")) {
          customer.name = order.customer.name;
        }
        
        // Update phone if available from order and customer collection doesn't have it
        if (order.customer?.phone && !customer.phone) {
          customer.phone = order.customer.phone;
        }
        
        // Update user_id if available from order
        if (order.user_id && !customer.user_id) {
          customer.user_id = order.user_id;
        }
      });
    }
    
    console.log(`[Customers] Total unique customers after merging with orders: ${customersMap.size}`);
    
    // Convert map to array and sort by total spent (descending)
    const customersArray = Array.from(customersMap.values()).sort((a, b) => b.total_spent - a.total_spent);
    console.log(`[Customers] Returning ${customersArray.length} customers sorted by total spent`);
    
    // If no customers found at all, log a warning
    if (customersArray.length === 0) {
      console.warn("[Customers] No customers found in any collection or orders. This might indicate:");
      console.warn("  - No orders have been created yet");
      console.warn("  - No users have been registered");
      console.warn("  - Collections might be empty or have different names");
    }
    
    return customersArray;
  } catch (error: any) {
    console.error("[Customers] Error getting all customers:", error);
    console.error("[Customers] Error details:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    return [];
  }
}

// Get customer by email
export async function getCustomerByEmail(email: string): Promise<Customer | null> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const customers = await getAllCustomers();
    return customers.find(c => c.email === email) || null;
  } catch (error) {
    return null;
  }
}

// Get customer by user ID
export async function getCustomerByUserId(userId: string): Promise<Customer | null> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const customers = await getAllCustomers();
    return customers.find(c => c.user_id === userId) || null;
  } catch (error) {
    return null;
  }
}

// Upsert customer data (create or update) - called when orders are created
export async function upsertCustomer(
  email: string,
  name: string,
  phone?: string,
  userId?: string
): Promise<void> {
  const db = getMongoDB();
  if (!db) {
    // Don't throw - allow order creation to continue even if customer sync fails
    console.warn("[Customers] MongoDB not available for customer sync");
    return;
  }

  try {
    const now = new Date().toISOString();
    const normalizedEmail = email.toLowerCase().trim();
    
    // Try to find customer in any of the collections
    const collectionNames = [CUSTOMERS_COLLECTION, CUSTOMERS_COLLECTION_ALT, CUSTOMERS_COLLECTION_ALT2];
    let existing: any = null;
    let targetCollection = CUSTOMERS_COLLECTION; // Default to primary collection
    
    for (const collectionName of collectionNames) {
      try {
        const collection = db.collection(collectionName);
        existing = await collection.findOne({ email: normalizedEmail });
        if (existing) {
          targetCollection = collectionName;
          console.log(`[Customers] Found existing customer in "${collectionName}" collection`);
          break;
        }
      } catch (error: any) {
        // Continue to next collection
      }
    }
    
    const collection = db.collection(targetCollection);

    if (existing) {
      // Update existing customer in the collection where it was found
      const updateData: any = {
        updated_at: now,
      };
      
      if (name && name.trim() !== "") {
        updateData.name = name.trim();
      }
      if (phone && phone.trim() !== "") {
        updateData.phone = phone.trim();
      }
      if (userId && userId.trim() !== "") {
        updateData.user_id = userId.trim();
      }
      
      await collection.updateOne(
        { email: normalizedEmail },
        { $set: updateData }
      );
      console.log(`[Customers] Updated customer in "${targetCollection}": ${normalizedEmail}`);
    } else {
      // Create new customer document in primary collection
      const primaryCollection = db.collection(CUSTOMERS_COLLECTION);
      const customerData: any = {
        email: normalizedEmail,
        name: name.trim() || "",
        created_at: now,
        updated_at: now,
      };
      
      if (phone && phone.trim() !== "") {
        customerData.phone = phone.trim();
      }
      if (userId && userId.trim() !== "") {
        customerData.user_id = userId.trim();
      }
      
      await primaryCollection.insertOne(customerData);
      console.log(`[Customers] Created new customer in "${CUSTOMERS_COLLECTION}": ${normalizedEmail}`);
    }
  } catch (error: any) {
    // Don't throw - allow order creation to continue even if customer sync fails
    console.error(`[Customers] Error upserting customer (${email}):`, error);
  }
}

