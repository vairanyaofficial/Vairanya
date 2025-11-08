// lib/env-validation.ts
// Environment variables validation for production

interface EnvConfig {
  // Firebase
  FIREBASE_SERVICE_ACCOUNT_JSON?: string;
  GOOGLE_APPLICATION_CREDENTIALS?: string;
  NEXT_PUBLIC_FIREBASE_API_KEY?: string;
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?: string;
  NEXT_PUBLIC_FIREBASE_PROJECT_ID?: string;
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?: string;
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?: string;
  NEXT_PUBLIC_FIREBASE_APP_ID?: string;

  // Razorpay
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  NEXT_PUBLIC_RAZORPAY_KEY_ID?: string;

  // NextAuth
  NEXTAUTH_SECRET?: string;
  NEXTAUTH_URL?: string;

  // Node Environment
  NODE_ENV?: string;
}

interface ValidationResult {
  isValid: boolean;
  missing: string[];
  warnings: string[];
}

/**
 * Validates required environment variables for production
 */
export function validateEnv(): ValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];
  const isProduction = process.env.NODE_ENV === "production";

  // Required for production
  if (isProduction) {
    // Firebase Admin - at least one must be set
    if (
      !process.env.FIREBASE_SERVICE_ACCOUNT_JSON &&
      !process.env.GOOGLE_APPLICATION_CREDENTIALS
    ) {
      missing.push("FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS");
    }

    // Firebase Client (public vars)
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      missing.push("NEXT_PUBLIC_FIREBASE_API_KEY");
    }
    if (!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) {
      missing.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
    }
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      missing.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
    }

    // Razorpay - required for payments
    if (!process.env.RAZORPAY_KEY_ID && !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
      warnings.push("RAZORPAY_KEY_ID (payment gateway may not work)");
    }
    if (!process.env.RAZORPAY_KEY_SECRET) {
      warnings.push("RAZORPAY_KEY_SECRET (payment gateway will not work)");
    }

    // NextAuth - recommended
    if (!process.env.NEXTAUTH_SECRET) {
      warnings.push("NEXTAUTH_SECRET (authentication may be insecure)");
    }
    if (!process.env.NEXTAUTH_URL) {
      warnings.push("NEXTAUTH_URL (authentication may not work correctly)");
    }
  }

  // Validate Firebase Service Account JSON format if present
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } catch {
      warnings.push("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON");
    }
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Gets environment variable with fallback
 */
export function getEnv(key: keyof EnvConfig, fallback?: string): string | undefined {
  return process.env[key] || fallback;
}

/**
 * Requires environment variable (throws if not set)
 */
export function requireEnv(key: keyof EnvConfig): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}
