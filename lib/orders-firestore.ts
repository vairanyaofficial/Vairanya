// Orders Firestore service - server-side only
import "server-only";
import { adminFirestore, ensureFirebaseInitialized } from "@/lib/firebaseAdmin.server";
import type { Order, Task } from "./orders-types";

const ORDERS_COLLECTION = "orders";
const TASKS_COLLECTION = "tasks";

// Helper function to ensure Firestore is initialized
async function ensureInitialized(): Promise<void> {
  const initResult = await ensureFirebaseInitialized();
  if (!initResult.success || !adminFirestore) {
    throw new Error(initResult.error || "Firestore not initialized");
  }
}

// Helper function to remove undefined values from an object
// Firestore doesn't accept undefined values
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
        // Only include the property if it's not undefined
        if (value !== undefined) {
          cleaned[key] = removeUndefinedValues(value);
        }
      }
    }
    return cleaned;
  }
  
  return obj;
}

// Convert Firestore document to Order
function docToOrder(doc: any): Order {
  const data = doc.data();
  return {
    id: doc.id,
    order_number: data.order_number || doc.id,
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
      ? (typeof data.created_at === 'string' ? data.created_at : data.created_at.toDate?.()?.toISOString() || new Date().toISOString())
      : (data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()),
    updated_at: data.updated_at 
      ? (typeof data.updated_at === 'string' ? data.updated_at : data.updated_at.toDate?.()?.toISOString() || new Date().toISOString())
      : (data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()),
    user_id: data.user_id || null, // Firebase user UID
  };
}

// Get all orders (admin only)
export async function getAllOrders(): Promise<Order[]> {
  await ensureInitialized();

  try {
    const snapshot = await adminFirestore
      .collection(ORDERS_COLLECTION)
      .orderBy("created_at", "desc")
      .get();

    return snapshot.docs.map(docToOrder);
  } catch (error: any) {
    console.error("Error getting all orders:", error);
    // Re-throw the error instead of silently returning empty array
    // This helps identify permission issues
    if (error.code === 7 || error.code === "PERMISSION_DENIED") {
      throw new Error("Permission denied. Please check Firebase Admin configuration and Firestore security rules.");
    }
    throw error;
  }
}

// Get orders by user ID
export async function getOrdersByUserId(userId: string): Promise<Order[]> {
  await ensureInitialized();

  try {
    const snapshot = await adminFirestore
      .collection(ORDERS_COLLECTION)
      .where("user_id", "==", userId)
      .get();

    const orders = snapshot.docs.map(docToOrder);
    
    // Sort by created_at in descending order (newest first)
    return orders.sort((a: Order, b: Order) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    return [];
  }
}

// Get order by ID
export async function getOrderById(orderId: string): Promise<Order | null> {
  await ensureInitialized();

  try {
    const doc = await adminFirestore.collection(ORDERS_COLLECTION).doc(orderId).get();
    if (!doc.exists) return null;
    return docToOrder(doc);
  } catch (error) {
    return null;
  }
}

// Get order by order number
export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  await ensureInitialized();

  try {
    const snapshot = await adminFirestore
      .collection(ORDERS_COLLECTION)
      .where("order_number", "==", orderNumber)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return docToOrder(snapshot.docs[0]);
  } catch (error) {
    return null;
  }
}

// Create new order
export async function createOrder(
  order: Omit<Order, "id" | "order_number" | "created_at" | "updated_at">
): Promise<Order> {
  await ensureInitialized();

  try {
    // Generate order number - use timestamp for guaranteed uniqueness
    // Format: ORD-YYYY-TTTTTT where TTTTTT is last 6 digits of timestamp
    const today = new Date();
    const year = today.getFullYear();
    const timestamp = Date.now();
    
    // Create unique order number using timestamp (last 6 digits ensures uniqueness)
    const orderNumber = `ORD-${year}-${String(timestamp).slice(-6)}`;

    const orderData = {
      ...order,
      order_number: orderNumber,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Remove undefined values before sending to Firestore
    const cleanedOrderData = removeUndefinedValues(orderData);

    const docRef = await adminFirestore.collection(ORDERS_COLLECTION).add(cleanedOrderData);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      throw new Error("Failed to retrieve created order");
    }
    
    return docToOrder(doc);
  } catch (error: any) {
    console.error("Error in createOrder:", error);
    // Provide more detailed error message
    if (error.code === 7 || error.code === "PERMISSION_DENIED") {
      throw new Error("Permission denied. Please check Firebase Admin configuration and Firestore security rules.");
    }
    if (error.message && error.message.includes("Firestore not initialized")) {
      throw new Error("Firestore not initialized. Please check Firebase Admin setup.");
    }
    throw new Error(error.message || "Failed to create order");
  }
}

// Update order
export async function updateOrder(orderId: string, updates: Partial<Order>): Promise<Order> {
  await ensureInitialized();

  try {
    const orderRef = adminFirestore.collection(ORDERS_COLLECTION).doc(orderId);
    const doc = await orderRef.get();

    if (!doc.exists) {
      throw new Error("Order not found");
    }

    // Prepare update data - ensure assigned_to is included if provided
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Copy all updates except assigned_to (we'll handle it separately)
    Object.keys(updates).forEach((key) => {
      if (key !== "assigned_to") {
        updateData[key] = (updates as any)[key];
      }
    });

    // Explicitly handle assigned_to field - convert empty string to null, preserve null
    if (updates.assigned_to !== undefined) {
      if (updates.assigned_to === "" || updates.assigned_to === null) {
        updateData.assigned_to = null;
      } else {
        updateData.assigned_to = String(updates.assigned_to).trim();
      }
    }

    await orderRef.update(updateData);

    const updated = await orderRef.get();
    const updatedOrder = docToOrder(updated);
    
    return updatedOrder;
  } catch (error: any) {
    throw new Error(error.message || "Failed to update order");
  }
}

// Get orders by status
export async function getOrdersByStatus(status: string): Promise<Order[]> {
  await ensureInitialized();

  try {
    const snapshot = await adminFirestore
      .collection(ORDERS_COLLECTION)
      .where("status", "==", status)
      .orderBy("created_at", "desc")
      .get();

    return snapshot.docs.map(docToOrder);
  } catch (error) {
    return [];
  }
}

// ============ TASKS FUNCTIONS ============

// Convert Firestore document to Task
function docToTask(doc: any): Task {
  const data = doc.data();
  return {
    id: doc.id,
    order_id: data.order_id || "",
    order_number: data.order_number || "",
    type: data.type || "packing",
    status: data.status || "pending",
    assigned_to: data.assigned_to || "",
    assigned_by: data.assigned_by || "",
    priority: data.priority || "medium",
    created_at: data.created_at 
      ? (typeof data.created_at === 'string' ? data.created_at : data.created_at.toDate?.()?.toISOString() || new Date().toISOString())
      : (data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()),
    updated_at: data.updated_at 
      ? (typeof data.updated_at === 'string' ? data.updated_at : data.updated_at.toDate?.()?.toISOString() || new Date().toISOString())
      : (data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()),
    completed_at: data.completed_at 
      ? (typeof data.completed_at === 'string' ? data.completed_at : data.completed_at.toDate?.()?.toISOString() || undefined)
      : (data.completedAt?.toDate?.()?.toISOString() || undefined),
    notes: data.notes || undefined,
  };
}

// Get all tasks
export async function getAllTasks(): Promise<Task[]> {
  await ensureInitialized();

  try {
    const snapshot = await adminFirestore
      .collection(TASKS_COLLECTION)
      .orderBy("created_at", "desc")
      .get();

    return snapshot.docs.map(docToTask);
  } catch (error) {
    return [];
  }
}

// Get task by ID
export async function getTaskById(taskId: string): Promise<Task | null> {
  await ensureInitialized();

  try {
    const doc = await adminFirestore.collection(TASKS_COLLECTION).doc(taskId).get();
    if (!doc.exists) return null;
    return docToTask(doc);
  } catch (error) {
    return null;
  }
}

// Get tasks by worker
export async function getTasksByWorker(workerUsername: string): Promise<Task[]> {
  await ensureInitialized();

  try {
    const snapshot = await adminFirestore
      .collection(TASKS_COLLECTION)
      .where("assigned_to", "==", workerUsername)
      .get();

    const tasks = snapshot.docs.map(docToTask);
    
    // Sort by created_at in descending order (newest first)
    return tasks.sort((a: Task, b: Task) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    return [];
  }
}

// Get tasks by order
export async function getTasksByOrder(orderId: string): Promise<Task[]> {
  await ensureInitialized();

  try {
    const snapshot = await adminFirestore
      .collection(TASKS_COLLECTION)
      .where("order_id", "==", orderId)
      .get();

    const tasks = snapshot.docs.map(docToTask);
    
    // Sort by created_at in descending order (newest first)
    return tasks.sort((a: Task, b: Task) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    return [];
  }
}

// Create new task
export async function createTask(
  task: Omit<Task, "id" | "created_at" | "updated_at">
): Promise<Task> {
  await ensureInitialized();

  try {
    const taskData = {
      ...task,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const docRef = await adminFirestore.collection(TASKS_COLLECTION).add(taskData);
    const doc = await docRef.get();
    return docToTask(doc);
  } catch (error: any) {
    throw new Error(error.message || "Failed to create task");
  }
}

// Update task
export async function updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
  await ensureInitialized();

  try {
    const taskRef = adminFirestore.collection(TASKS_COLLECTION).doc(taskId);
    const doc = await taskRef.get();

    if (!doc.exists) {
      throw new Error("Task not found");
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Copy all updates except timestamps
    Object.keys(updates).forEach((key) => {
      if (key !== "id" && key !== "created_at" && key !== "updated_at") {
        updateData[key] = (updates as any)[key];
      }
    });

    // Handle completed_at separately
    if (updates.status === "completed" && doc.data()?.status !== "completed") {
      updateData.completed_at = new Date().toISOString();
    } else if (updates.status !== "completed" && updates.completed_at === undefined) {
      // Don't update completed_at if status is not completed
    } else if (updates.completed_at !== undefined) {
      updateData.completed_at = updates.completed_at;
    }

    await taskRef.update(updateData);

    const updated = await taskRef.get();
    return docToTask(updated);
  } catch (error: any) {
    throw new Error(error.message || "Failed to update task");
  }
}

// Delete task
export async function deleteTask(taskId: string): Promise<void> {
  await ensureInitialized();

  try {
    const taskRef = adminFirestore.collection(TASKS_COLLECTION).doc(taskId);
    const doc = await taskRef.get();

    if (!doc.exists) {
      throw new Error("Task not found");
    }

    await taskRef.delete();
  } catch (error: any) {
    throw new Error(error.message || "Failed to delete task");
  }
}

