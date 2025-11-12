// lib/admin-api-client.ts
// Utility functions for making authenticated admin API requests

import { getAdminSession } from "./admin-auth";

export interface AdminHeaders {
  "x-admin-username": string;
  "x-admin-role": string;
}

/**
 * Get admin authentication headers for API requests
 * Returns null if no admin session exists
 */
export function getAdminHeaders(): AdminHeaders | null {
  const session = getAdminSession();
  if (!session) {
    return null;
  }
  
  return {
    "x-admin-username": session.username,
    "x-admin-role": session.role,
  };
}

/**
 * Make an authenticated admin API request
 * Automatically includes admin headers
 */
export async function adminFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = getAdminHeaders();
  if (!headers) {
    throw new Error("No admin session found");
  }
  
  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });
}

