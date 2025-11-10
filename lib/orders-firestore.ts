// Orders MongoDB service - server-side only
// This file maintains backward compatibility by re-exporting MongoDB functions
import "server-only";
import * as ordersMongo from "./orders-mongodb";
import type { Order, Task } from "./orders-types";

// Re-export all MongoDB functions
export async function getAllOrders(): Promise<Order[]> {
  return ordersMongo.getAllOrders();
}

export async function getOrdersByUserId(userId: string): Promise<Order[]> {
  return ordersMongo.getOrdersByUserId(userId);
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  return ordersMongo.getOrderById(orderId);
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  return ordersMongo.getOrderByNumber(orderNumber);
}

export async function createOrder(
  order: Omit<Order, "id" | "order_number" | "created_at" | "updated_at">
): Promise<Order> {
  return ordersMongo.createOrder(order);
}

export async function updateOrder(orderId: string, updates: Partial<Order>): Promise<Order> {
  return ordersMongo.updateOrder(orderId, updates);
}

export async function getOrdersByStatus(status: string): Promise<Order[]> {
  return ordersMongo.getOrdersByStatus(status);
}

// Tasks functions
export async function getAllTasks(): Promise<Task[]> {
  return ordersMongo.getAllTasks();
}

export async function getTaskById(taskId: string): Promise<Task | null> {
  return ordersMongo.getTaskById(taskId);
}

export async function getTasksByWorker(workerUsername: string): Promise<Task[]> {
  return ordersMongo.getTasksByWorker(workerUsername);
}

export async function getTasksByOrder(orderId: string): Promise<Task[]> {
  return ordersMongo.getTasksByOrder(orderId);
}

export async function createTask(
  task: Omit<Task, "id" | "created_at" | "updated_at">
): Promise<Task> {
  return ordersMongo.createTask(task);
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
  return ordersMongo.updateTask(taskId, updates);
}

export async function deleteTask(taskId: string): Promise<void> {
  return ordersMongo.deleteTask(taskId);
}
