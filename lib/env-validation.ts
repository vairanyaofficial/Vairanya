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

  // MongoDB (backup database)
  MONGODB_URI?: string;
  MONGODB_CONNECTION_STRING?: string;
  MONGODB_HOST?: string;
  MONGODB_PORT?: string;
  MONGODB_DATABASE?: string;
  MONGODB_USERNAME?: string;
  MONGODB_PASSWORD?: string;

  // Razorpay
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  NEXT_PUBLIC_RAZORPAY_KEY_ID?: string;

  // ImageKit.io
  IMAGEKIT_PRIVATE_KEY?: string;
  NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY?: string;
  NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT?: string;

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
    // Firebase Admin - at least one method must be set
    const hasJson = !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const hasJsonB64 = !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON_B64;
    const hasGoogleCreds = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const hasIndividualCreds = !!(
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    );
    
    if (!hasJson && !hasJsonB64 && !hasGoogleCreds && !hasIndividualCreds) {
      missing.push("FIREBASE_SERVICE_ACCOUNT_JSON_B64 (recommended), FIREBASE_SERVICE_ACCOUNT_JSON, individual credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY), or GOOGLE_APPLICATION_CREDENTIALS");
    }
    
    // Validate individual credentials if partially set
    if (process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_PRIVATE_KEY) {
      if (!process.env.FIREBASE_PROJECT_ID) {
        warnings.push("FIREBASE_PROJECT_ID is missing (required for individual credentials)");
      }
      if (!process.env.FIREBASE_CLIENT_EMAIL) {
        warnings.push("FIREBASE_CLIENT_EMAIL is missing (required for individual credentials)");
      }
      if (!process.env.FIREBASE_PRIVATE_KEY) {
        warnings.push("FIREBASE_PRIVATE_KEY is missing (required for individual credentials)");
      }
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

    // ImageKit.io - required for image uploads
    if (!process.env.IMAGEKIT_PRIVATE_KEY) {
      warnings.push("IMAGEKIT_PRIVATE_KEY (image uploads will not work)");
    }
    if (!process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY) {
      warnings.push("NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY (image uploads will not work)");
    }
    if (!process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT) {
      warnings.push("NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT (image uploads will not work)");
    }

    // NextAuth - recommended
    if (!process.env.NEXTAUTH_SECRET) {
      warnings.push("NEXTAUTH_SECRET (authentication may be insecure)");
    }
    if (!process.env.NEXTAUTH_URL) {
      warnings.push("NEXTAUTH_URL (authentication may not work correctly)");
    }

    // MongoDB - recommended for backup/fallback
    const hasMongoUri = !!process.env.MONGODB_URI;
    const hasMongoConnectionString = !!process.env.MONGODB_CONNECTION_STRING;
    const hasMongoParts = !!(
      process.env.MONGODB_HOST && 
      process.env.MONGODB_DATABASE
    );
    
    if (!hasMongoUri && !hasMongoConnectionString && !hasMongoParts) {
      warnings.push("MONGODB_URI or MONGODB_CONNECTION_STRING (recommended for database fallback if Firebase fails)");
    }
  }

  // Validate Firebase Service Account JSON format if present
  const svcJsonB64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_B64;
  const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  
  if (svcJsonB64) {
    try {
      // Try to decode base64 and parse JSON
      const decoded = Buffer.from(svcJsonB64.replace(/\s/g, ''), 'base64').toString('utf8');
      JSON.parse(decoded);
    } catch {
      warnings.push("FIREBASE_SERVICE_ACCOUNT_JSON_B64 is not valid base64-encoded JSON");
    }
  }
  
  if (svcJson) {
    try {
      JSON.parse(svcJson);
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
