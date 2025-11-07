// lib/admin-auth-server.ts
import "server-only";
import { NextRequest } from "next/server";

export type UserRole = "superuser" | "admin" | "worker";

export interface ServerAuthResult {
  authenticated: boolean;
  role?: UserRole;
  uid?: string;
  name?: string;
}

// Verify server auth from request (header-based only)
export function verifyServerAuth(request: NextRequest | Request): ServerAuthResult {
  // adapt to both NextRequest and standard Request
  const req = request as Request;
  
  // Try header-based (Firebase auth)
  const adminUsername = req.headers.get("x-admin-username");
  const adminRole = req.headers.get("x-admin-role") as UserRole | null;
  if (adminUsername) {
    const role = adminRole || "superuser";
    return { authenticated: true, role, uid: adminUsername };
  }

  return { authenticated: false };
}

// require generic admin (worker or superuser)
export function requireAdmin(request: NextRequest | Request): ServerAuthResult {
  const s = verifyServerAuth(request);
  if (!s.authenticated) return { authenticated: false };
  return s;
}

// require only superuser (superadmin)
export function requireSuperUser(request: NextRequest | Request): ServerAuthResult {
  const s = verifyServerAuth(request);
  if (!s.authenticated || s.role !== "superuser") return { authenticated: false };
  return s;
}

// require admin or superuser (for general admin operations)
export function requireAdminOrSuperUser(request: NextRequest | Request): ServerAuthResult {
  const s = verifyServerAuth(request);
  if (!s.authenticated) return { authenticated: false };
  if (s.role === "superuser" || s.role === "admin") return s;
  return { authenticated: false };
}
