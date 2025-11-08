// lib/rate-limit.ts
// Simple in-memory rate limiter for API routes
// For production, consider using Redis or a dedicated rate limiting service

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};
const CLEANUP_INTERVAL = 60000; // 1 minute

// Clean up expired entries periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    Object.keys(store).forEach((key) => {
      if (store[key].resetTime < now) {
        delete store[key];
      }
    });
  }, CLEANUP_INTERVAL);
}

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum number of requests per window
  keyGenerator?: (request: Request) => string; // Custom key generator
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * Simple rate limiter for API routes
 * @param request - The incoming request
 * @param options - Rate limit options
 * @returns Rate limit result
 */
export function rateLimit(
  request: Request,
  options: RateLimitOptions
): RateLimitResult {
  const { windowMs, maxRequests, keyGenerator } = options;

  // Generate key (default: IP address)
  const key = keyGenerator
    ? keyGenerator(request)
    : request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

  const now = Date.now();
  const entry = store[key];

  // Initialize or check if reset time has passed
  if (!entry || entry.resetTime < now) {
    store[key] = {
      count: 1,
      resetTime: now + windowMs,
    };
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
    };
  }

  // Check if limit exceeded
  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment counter
  entry.count++;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Rate limit middleware for Next.js API routes
 */
export function createRateLimit(options: RateLimitOptions) {
  return (request: Request): RateLimitResult => {
    return rateLimit(request, options);
  };
}

/**
 * Common rate limiters
 */
export const rateLimiters = {
  // Strict: 10 requests per minute
  strict: createRateLimit({
    windowMs: 60 * 1000,
    maxRequests: 10,
  }),
  // Standard: 100 requests per minute
  standard: createRateLimit({
    windowMs: 60 * 1000,
    maxRequests: 100,
  }),
  // Relaxed: 1000 requests per hour
  relaxed: createRateLimit({
    windowMs: 60 * 60 * 1000,
    maxRequests: 1000,
  }),
};
