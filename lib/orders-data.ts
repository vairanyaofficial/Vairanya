// Order data persistence layer
import "server-only";
import fs from "fs/promises";
import path from "path";
import type { Order, Task } from "./orders-types";

const ORDERS_FILE = path.join(process.cwd(), "data", "orders.json");
const TASKS_FILE = path.join(process.cwd(), "data", "tasks.json");

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.dirname(ORDERS_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Load orders from file
export async function loadOrders(): Promise<Order[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(ORDERS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save orders to file
export async function saveOrders(orders: Order[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

// Create new order
export async function createOrder(order: Omit<Order, "id" | "order_number" | "created_at" | "updated_at">): Promise<Order> {
  const orders = await loadOrders();
  
  // Generate order number
  const today = new Date();
  const year = today.getFullYear();
  const orderCount = orders.filter(o => o.order_number.startsWith(`ORD-${year}`)).length;
  const orderNumber = `ORD-${year}-${String(orderCount + 1).padStart(4, "0")}`;
  
  const newOrder: Order = {
    ...order,
    id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    order_number: orderNumber,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  orders.push(newOrder);
  await saveOrders(orders);
  return newOrder;
}

// Update order
export async function updateOrder(orderId: string, updates: Partial<Order>): Promise<Order> {
  const orders = await loadOrders();
  const index = orders.findIndex(o => o.id === orderId);
  
  if (index === -1) {
    throw new Error("Order not found");
  }
  
  orders[index] = {
    ...orders[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  
  await saveOrders(orders);
  return orders[index];
}

// Get order by ID
export async function getOrderById(orderId: string): Promise<Order | null> {
  const orders = await loadOrders();
  return orders.find(o => o.id === orderId) || null;
}

// Get order by order number
export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  const orders = await loadOrders();
  return orders.find(o => o.order_number === orderNumber) || null;
}

// Load tasks from file
export async function loadTasks(): Promise<Task[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(TASKS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save tasks to file
export async function saveTasks(tasks: Task[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(TASKS_FILE, JSON.stringify(tasks, null, 2));
}

// Create new task
export async function createTask(task: Omit<Task, "id" | "created_at" | "updated_at">): Promise<Task> {
  const tasks = await loadTasks();
  
  const newTask: Task = {
    ...task,
    id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  tasks.push(newTask);
  await saveTasks(tasks);
  return newTask;
}

// Update task
export async function updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
  const tasks = await loadTasks();
  const index = tasks.findIndex(t => t.id === taskId);
  
  if (index === -1) {
    throw new Error("Task not found");
  }
  
  const completedAt = updates.status === "completed" && tasks[index].status !== "completed"
    ? new Date().toISOString()
    : tasks[index].completed_at;
  
  tasks[index] = {
    ...tasks[index],
    ...updates,
    updated_at: new Date().toISOString(),
    completed_at: completedAt,
  };
  
  await saveTasks(tasks);
  return tasks[index];
}

// Get task by ID
export async function getTaskById(taskId: string): Promise<Task | null> {
  const tasks = await loadTasks();
  return tasks.find(t => t.id === taskId) || null;
}

// Get tasks by worker
export async function getTasksByWorker(workerUsername: string): Promise<Task[]> {
  const tasks = await loadTasks();
  return tasks.filter(t => t.assigned_to === workerUsername);
}

// Get tasks by order
export async function getTasksByOrder(orderId: string): Promise<Task[]> {
  const tasks = await loadTasks();
  return tasks.filter(t => t.order_id === orderId);
}

