// lib/redirect-lock.ts
// Utility to prevent redirect loops between admin and login pages

const REDIRECT_LOCK_KEY = "admin_redirect_lock";
const REDIRECT_LOCK_TIMEOUT = 3000; // 3 seconds

export interface RedirectLock {
  timestamp: number;
  from: string;
  to: string;
}

/**
 * Set a redirect lock to prevent loops
 * Returns true if lock was set, false if lock already exists
 */
export function setRedirectLock(from: string, to: string): boolean {
  if (typeof window === "undefined") return false;
  
  try {
    const existing = getRedirectLock();
    if (existing) {
      // If lock is recent (within timeout), don't allow new redirect
      const age = Date.now() - existing.timestamp;
      if (age < REDIRECT_LOCK_TIMEOUT) {
        return false;
      }
      // Lock expired, clear it
      clearRedirectLock();
    }
    
    const lock: RedirectLock = {
      timestamp: Date.now(),
      from,
      to,
    };
    
    sessionStorage.setItem(REDIRECT_LOCK_KEY, JSON.stringify(lock));
    return true;
  } catch {
    return false;
  }
}

/**
 * Get current redirect lock
 */
export function getRedirectLock(): RedirectLock | null {
  if (typeof window === "undefined") return null;
  
  try {
    const lockStr = sessionStorage.getItem(REDIRECT_LOCK_KEY);
    if (!lockStr) return null;
    
    const lock = JSON.parse(lockStr) as RedirectLock;
    
    // Check if lock is expired
    const age = Date.now() - lock.timestamp;
    if (age >= REDIRECT_LOCK_TIMEOUT) {
      clearRedirectLock();
      return null;
    }
    
    return lock;
  } catch {
    return null;
  }
}

/**
 * Clear redirect lock
 */
export function clearRedirectLock(): void {
  if (typeof window === "undefined") return;
  
  try {
    sessionStorage.removeItem(REDIRECT_LOCK_KEY);
  } catch {
    // Ignore errors
  }
}

/**
 * Check if a redirect should be allowed
 * Returns true if redirect is allowed, false if it should be blocked
 */
export function shouldAllowRedirect(from: string, to: string): boolean {
  const lock = getRedirectLock();
  if (!lock) return true;
  
  // Block if trying to redirect back to where we came from (loop detection)
  if (lock.from === to && lock.to === from) {
    return false;
  }
  
  // Block if trying to redirect to the same place we're redirecting to
  if (lock.to === to) {
    return false;
  }
  
  return true;
}

