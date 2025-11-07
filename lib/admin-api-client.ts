// Client-side helper for making authenticated admin API requests
import { getAdminSession } from "./admin-auth";

export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const session = getAdminSession();
  
  if (!session) {
    throw new Error("Not authenticated");
  }

  const headers = new Headers(options.headers);
  headers.set("x-admin-username", session.username);
  headers.set("x-admin-role", session.role); // Include role for server-side verification
  
  return fetch(url, {
    ...options,
    headers,
  });
}

