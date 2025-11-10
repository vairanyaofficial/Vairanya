// Customers Firestore service - server-side only
import "server-only";
import { adminFirestore } from "@/lib/firebaseAdmin.server";
import { getAllOrders } from "./orders-firestore";
import type { Customer } from "./offers-types";

const CUSTOMERS_COLLECTION = "customers";

// Get all unique customers from orders and customers collection
export async function getAllCustomers(): Promise<Customer[]> {
  if (!adminFirestore) {
    throw new Error("Database unavailable");
  }

  try {
    // Get customers from customers collection
    const customersSnapshot = await adminFirestore.collection(CUSTOMERS_COLLECTION).get();
    const customersFromCollection = new Map<string, Customer>();
    
    customersSnapshot.docs.forEach((doc: any) => {
      const data = doc.data();
      customersFromCollection.set(data.email, {
        email: data.email,
        name: data.name || "",
        phone: data.phone || undefined,
        total_orders: 0,
        total_spent: 0,
        user_id: data.user_id || undefined,
        last_order_date: undefined,
      });
    });

    // Get orders to calculate stats
    const orders = await getAllOrders();
    
    // Merge order data with customers collection data
    orders.forEach(order => {
      const email = order.customer?.email || "";
      if (!email) return;
      
      if (!customersFromCollection.has(email)) {
        customersFromCollection.set(email, {
          email: email,
          name: order.customer?.name || "",
          phone: order.customer?.phone || undefined,
          total_orders: 0,
          total_spent: 0,
          user_id: order.user_id || undefined,
        });
      }
      
      const customer = customersFromCollection.get(email)!;
      customer.total_orders += 1;
      customer.total_spent += order.total || 0;
      
      // Update last order date
      const orderDate = new Date(order.created_at);
      if (!customer.last_order_date || orderDate > new Date(customer.last_order_date)) {
        customer.last_order_date = order.created_at;
      }
      
      // Update user_id if available from order
      if (order.user_id && !customer.user_id) {
        customer.user_id = order.user_id;
      }
    });
    
    // Convert map to array and sort by total spent (descending)
    return Array.from(customersFromCollection.values()).sort((a, b) => b.total_spent - a.total_spent);
  } catch (error) {
    return [];
  }
}

// Get customer by email
export async function getCustomerByEmail(email: string): Promise<Customer | null> {
  if (!adminFirestore) {
    throw new Error("Database unavailable");
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
  if (!adminFirestore) {
    throw new Error("Database unavailable");
  }

  try {
    const customers = await getAllCustomers();
    return customers.find(c => c.user_id === userId) || null;
  } catch (error) {
    return null;
  }
}

