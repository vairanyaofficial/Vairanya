// Shared cache for orders API
// This cache is used to reduce database load by caching orders for 30 seconds

import type { Order } from "./orders-types";

let ordersCache: { data: Order[]; timestamp: number } | null = null;
export const CACHE_TTL = 30 * 1000; // 30 seconds

export function getOrdersCache(): { data: Order[]; timestamp: number } | null {
  return ordersCache;
}

export function setOrdersCache(orders: Order[]): void {
  ordersCache = {
    data: orders,
    timestamp: Date.now(),
  };
}

export function clearOrdersCache(): void {
  ordersCache = null;
}

export function isCacheValid(): boolean {
  if (!ordersCache) return false;
  const now = Date.now();
  return (now - ordersCache.timestamp) < CACHE_TTL;
}

