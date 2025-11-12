// lib/auth-helpers.ts
import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

/**
 * Get user ID from NextAuth session
 * Returns id, uid, or email (in that priority order)
 */
export async function getUserIdFromSession(request?: NextRequest | Request): Promise<string | null> {
  try {
    const session = await auth();
    if (!session?.user) {
      return null;
    }
    // Try id first, then uid, then email
    const userId = (session.user as any).id || (session.user as any).uid || session.user.email;
    return userId || null;
  } catch {
    return null;
  }
}

/**
 * Get user email from NextAuth session
 */
export async function getUserEmailFromSession(request?: NextRequest | Request): Promise<string | null> {
  try {
    const session = await auth();
    return session?.user?.email || null;
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(request?: NextRequest | Request): Promise<boolean> {
  try {
    const session = await auth();
    return !!session?.user;
  } catch {
    return false;
  }
}

