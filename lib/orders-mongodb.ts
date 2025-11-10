// lib/orders-mongodb.ts
// MongoDB implementation for orders - server-side only
import "server-only";
import { getMongoDB } from "@/lib/mongodb.server";
import { ObjectId } from "mongodb";
import type { Order, Task } from "./orders-types";

const ORDERS_COLLECTION = "Order";  // Match MongoDB collection name (capitalized)
const TASKS_COLLECTION = "Task";     // Match MongoDB collection name (capitalized)

// Helper function to remove undefined values from an object
function removeUndefinedValues(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedValues);
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (value !== undefined) {
          cleaned[key] = removeUndefinedValues(value);
        }
      }
    }
    return cleaned;
  }
  
  return obj;
}

// Convert MongoDB document to Order
function docToOrder(doc: any): Order {
  const data = doc;
  return {
    id: doc._id?.toString() || doc.id,
    order_number: data.order_number || doc._id?.toString() || doc.id,
    items: data.items || [],
    total: data.total || 0,
    subtotal: data.subtotal || 0,
    shipping: data.shipping || 0,
    discount: data.discount || undefined,
    offer_id: data.offer_id || undefined,
    customer: data.customer || {},
    shipping_address: data.shipping_address || {},
    payment_method: data.payment_method || "razorpay",
    payment_status: data.payment_status || "pending",
    status: data.status || "pending",
    razorpay_order_id: data.razorpay_order_id || null,
    razorpay_payment_id: data.razorpay_payment_id || null,
    tracking_number: data.tracking_number || null,
    assigned_to: data.assigned_to || null,
    notes: data.notes || null,
    refund_status: data.refund_status || null,
    razorpay_refund_id: data.razorpay_refund_id || null,
    refund_notes: data.refund_notes || null,
    created_at: data.created_at 
      ? (typeof data.created_at === 'string' ? data.created_at : new Date(data.created_at).toISOString())
      : new Date().toISOString(),
    updated_at: data.updated_at 
      ? (typeof data.updated_at === 'string' ? data.updated_at : new Date(data.updated_at).toISOString())
      : new Date().toISOString(),
    user_id: data.user_id || null,
  };
}

// Get all orders (admin only)
export async function getAllOrders(): Promise<Order[]> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const collection = db.collection(ORDERS_COLLECTION);
    const orders = await collection
      .find({})
      .sort({ created_at: -1 })
      .toArray();
    
    console.log(`[Orders] Found ${orders.length} total orders in MongoDB`);
    const convertedOrders = orders.map(docToOrder);
    
    // Log first order's ID format for debugging
    if (convertedOrders.length > 0) {
      console.log(`[Orders] First order ID: ${convertedOrders[0].id}, order_number: ${convertedOrders[0].order_number}`);
    }
    
    return convertedOrders;
  } catch (error: any) {
    console.error("[Orders] Error getting all orders from MongoDB:", error);
    console.error("[Orders] Error details:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    throw error;
  }
}

// Get orders by user ID
export async function getOrdersByUserId(userId: string): Promise<Order[]> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const collection = db.collection(ORDERS_COLLECTION);
    const orders = await collection
      .find({ user_id: userId })
      .sort({ created_at: -1 })
      .toArray();
    
    return orders.map(docToOrder);
  } catch (error) {
    return [];
  }
}

// Get order by ID
export async function getOrderById(orderId: string): Promise<Order | null> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const collection = db.collection(ORDERS_COLLECTION);
    
    // Build query - try multiple formats
    let query: any;
    
    // First, try to parse as ObjectId
    try {
      const objectId = new ObjectId(orderId);
      query = { _id: objectId };
    } catch {
      // If not a valid ObjectId, try multiple query formats
      query = { 
        $or: [
          { _id: orderId },
          { id: orderId },
          { order_number: orderId }
        ]
      };
    }
    
    const order = await collection.findOne(query);
    
    if (!order) {
      console.log(`[Orders] Order not found with ID: ${orderId}`);
      // Try searching by order_number as fallback
      if (query.$or) {
        const orderByNumber = await collection.findOne({ order_number: orderId });
        if (orderByNumber) {
          console.log(`[Orders] Found order by order_number: ${orderId}`);
          return docToOrder(orderByNumber);
        }
      }
      return null;
    }
    
    console.log(`[Orders] Found order with ID: ${orderId}, MongoDB _id: ${order._id}`);
    return docToOrder(order);
  } catch (error: any) {
    console.error(`[Orders] Error getting order by ID (${orderId}):`, error);
    return null;
  }
}

// Get order by order number
export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const collection = db.collection(ORDERS_COLLECTION);
    const order = await collection.findOne({ order_number: orderNumber });
    
    if (!order) return null;
    return docToOrder(order);
  } catch (error) {
    return null;
  }
}

// Create new order
export async function createOrder(
  order: Omit<Order, "id" | "order_number" | "created_at" | "updated_at">
): Promise<Order> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    // Generate order number
    const today = new Date();
    const year = today.getFullYear();
    const timestamp = Date.now();
    const orderNumber = `ORD-${year}-${String(timestamp).slice(-6)}`;

    const orderData = {
      ...order,
      order_number: orderNumber,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const cleanedOrderData = removeUndefinedValues(orderData);
    
    const collection = db.collection(ORDERS_COLLECTION);
    console.log(`📦 Saving order to MongoDB collection: ${ORDERS_COLLECTION}`);
    console.log(`📦 Order data:`, JSON.stringify(cleanedOrderData, null, 2).substring(0, 500));
    
    const result = await collection.insertOne(cleanedOrderData);
    console.log(`✅ Order saved successfully with ID: ${result.insertedId}`);
    
    const created = await collection.findOne({ _id: result.insertedId });
    if (!created) {
      throw new Error("Failed to retrieve created order");
    }
    
    console.log(`✅ Order retrieved from MongoDB: ${created.order_number || created._id}`);
    
    // Sync customer data to customers collection
    try {
      const { upsertCustomer } = await import("./customers-mongodb");
      if (order.customer?.email && order.customer?.name) {
        await upsertCustomer(
          order.customer.email,
          order.customer.name,
          order.customer.phone,
          order.user_id || undefined
        );
      }
    } catch (customerSyncError: any) {
      // Don't fail order creation if customer sync fails
      console.warn(`[Orders] Failed to sync customer data:`, customerSyncError?.message);
    }
    
    return docToOrder(created);
  } catch (error: any) {
    console.error("Error in createOrder (MongoDB):", error);
    throw new Error(error.message || "Failed to create order");
  }
}

// Update order
export async function updateOrder(orderId: string, updates: Partial<Order>): Promise<Order> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const collection = db.collection(ORDERS_COLLECTION);
    
    // Build query - try multiple formats
    let query: any;
    
    // First, try to parse as ObjectId
    try {
      const objectId = new ObjectId(orderId);
      query = { _id: objectId };
    } catch {
      // If not a valid ObjectId, try multiple query formats
      query = { 
        $or: [
          { _id: orderId },
          { id: orderId },
          { order_number: orderId }
        ]
      };
    }
    
    // First find the order to verify it exists
    const order = await collection.findOne(query);

    if (!order) {
      // Try by order_number as fallback
      const orderByNumber = await collection.findOne({ order_number: orderId });
      if (orderByNumber) {
        query = { _id: orderByNumber._id };
      } else {
        throw new Error(`Order not found with ID: ${orderId}`);
      }
    } else {
      // Use the actual _id from the found document
      query = { _id: order._id };
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    Object.keys(updates).forEach((key) => {
      if (key !== "assigned_to" && key !== "id" && key !== "order_number" && key !== "created_at") {
        updateData[key] = (updates as any)[key];
      }
    });

    if (updates.assigned_to !== undefined) {
      if (updates.assigned_to === "" || updates.assigned_to === null) {
        updateData.assigned_to = null;
      } else {
        updateData.assigned_to = String(updates.assigned_to).trim();
      }
    }

    const result = await collection.updateOne(
      query,
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      throw new Error(`Order not found with ID: ${orderId}`);
    }

    const updated = await collection.findOne(query);
    
    if (!updated) {
      throw new Error("Failed to retrieve updated order");
    }
    
    console.log(`[Orders] Updated order with ID: ${orderId}`);
    return docToOrder(updated);
  } catch (error: any) {
    console.error(`[Orders] Error updating order (${orderId}):`, error);
    throw new Error(error.message || "Failed to update order");
  }
}

// Get orders by status
export async function getOrdersByStatus(status: string): Promise<Order[]> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const collection = db.collection(ORDERS_COLLECTION);
    const orders = await collection
      .find({ status })
      .sort({ created_at: -1 })
      .toArray();
    
    return orders.map(docToOrder);
  } catch (error) {
    return [];
  }
}

// ============ TASKS FUNCTIONS ============

// Convert MongoDB document to Task
function docToTask(doc: any): Task {
  const data = doc;
  return {
    id: doc._id?.toString() || doc.id,
    order_id: data.order_id || "",
    order_number: data.order_number || "",
    type: data.type || "packing",
    status: data.status || "pending",
    assigned_to: data.assigned_to || "",
    assigned_by: data.assigned_by || "",
    priority: data.priority || "medium",
    created_at: data.created_at 
      ? (typeof data.created_at === 'string' ? data.created_at : new Date(data.created_at).toISOString())
      : new Date().toISOString(),
    updated_at: data.updated_at 
      ? (typeof data.updated_at === 'string' ? data.updated_at : new Date(data.updated_at).toISOString())
      : new Date().toISOString(),
    completed_at: data.completed_at 
      ? (typeof data.completed_at === 'string' ? data.completed_at : new Date(data.completed_at).toISOString())
      : undefined,
    notes: data.notes || undefined,
  };
}

// Get all tasks
export async function getAllTasks(): Promise<Task[]> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const collection = db.collection(TASKS_COLLECTION);
    const tasks = await collection
      .find({})
      .sort({ created_at: -1 })
      .toArray();
    
    return tasks.map(docToTask);
  } catch (error) {
    return [];
  }
}

// Get task by ID
export async function getTaskById(taskId: string): Promise<Task | null> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const collection = db.collection(TASKS_COLLECTION);
    
    // Try to convert taskId to ObjectId if it's a valid ObjectId string
    let objectIdFilter: any = { id: taskId };
    try {
      // If taskId is a valid ObjectId string, also search by _id
      if (ObjectId.isValid(taskId)) {
        objectIdFilter = {
          $or: [
            { _id: new ObjectId(taskId) },
            { id: taskId }
          ]
        };
      }
    } catch {
      // If ObjectId conversion fails, just use the id field
    }
    
    const task = await collection.findOne(objectIdFilter);
    
    if (!task) return null;
    return docToTask(task);
  } catch (error) {
    return null;
  }
}

// Get tasks by worker
export async function getTasksByWorker(workerUsername: string): Promise<Task[]> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const collection = db.collection(TASKS_COLLECTION);
    const tasks = await collection
      .find({ assigned_to: workerUsername })
      .sort({ created_at: -1 })
      .toArray();
    
    return tasks.map(docToTask);
  } catch (error) {
    return [];
  }
}

// Get tasks by order
export async function getTasksByOrder(orderId: string): Promise<Task[]> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const collection = db.collection(TASKS_COLLECTION);
    const tasks = await collection
      .find({ order_id: orderId })
      .sort({ created_at: -1 })
      .toArray();
    
    return tasks.map(docToTask);
  } catch (error) {
    return [];
  }
}

// Create new task
export async function createTask(
  task: Omit<Task, "id" | "created_at" | "updated_at">
): Promise<Task> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const taskData = {
      ...task,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const collection = db.collection(TASKS_COLLECTION);
    const result = await collection.insertOne(taskData);
    const created = await collection.findOne({ _id: result.insertedId });
    
    if (!created) {
      throw new Error("Failed to retrieve created task");
    }
    
    return docToTask(created);
  } catch (error: any) {
    throw new Error(error.message || "Failed to create task");
  }
}

// Update task
export async function updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const collection = db.collection(TASKS_COLLECTION);
    
    // Try to convert taskId to ObjectId if it's a valid ObjectId string
    let objectIdFilter: any = { id: taskId };
    try {
      // If taskId is a valid ObjectId string, also search by _id
      if (ObjectId.isValid(taskId)) {
        objectIdFilter = {
          $or: [
            { _id: new ObjectId(taskId) },
            { id: taskId }
          ]
        };
      }
    } catch {
      // If ObjectId conversion fails, just use the id field
    }
    
    const task = await collection.findOne(objectIdFilter);

    if (!task) {
      throw new Error("Task not found");
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    Object.keys(updates).forEach((key) => {
      if (key !== "id" && key !== "created_at" && key !== "updated_at") {
        updateData[key] = (updates as any)[key];
      }
    });

    if (updates.status === "completed" && task.status !== "completed") {
      updateData.completed_at = new Date().toISOString();
    } else if (updates.completed_at !== undefined) {
      updateData.completed_at = updates.completed_at;
    }

    await collection.updateOne(
      objectIdFilter,
      { $set: updateData }
    );

    const updated = await collection.findOne(objectIdFilter);
    
    if (!updated) {
      throw new Error("Failed to retrieve updated task");
    }
    
    return docToTask(updated);
  } catch (error: any) {
    throw new Error(error.message || "Failed to update task");
  }
}

// Delete task
export async function deleteTask(taskId: string): Promise<void> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const collection = db.collection(TASKS_COLLECTION);
    
    // Try to convert taskId to ObjectId if it's a valid ObjectId string
    let objectIdFilter: any = { id: taskId };
    try {
      // If taskId is a valid ObjectId string, also search by _id
      if (ObjectId.isValid(taskId)) {
        objectIdFilter = {
          $or: [
            { _id: new ObjectId(taskId) },
            { id: taskId }
          ]
        };
      }
    } catch {
      // If ObjectId conversion fails, just use the id field
    }
    
    const task = await collection.findOne(objectIdFilter);

    if (!task) {
      throw new Error("Task not found");
    }

    await collection.deleteOne(objectIdFilter);
  } catch (error: any) {
    throw new Error(error.message || "Failed to delete task");
  }
}

