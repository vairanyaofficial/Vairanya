// lib/firebaseAdmin.server.ts
import "server-only";

/**
 * Robust firebase-admin initializer for Next.js server environment.
 * - Uses modular imports to avoid some bundler surprises.
 * - Defensive: if firebase-admin is not installed or credentials invalid, logs clear errors.
 *
 * Requirements:
 *   npm install firebase-admin
 *
 * Environment (one of these must be valid):
 *   - FIREBASE_SERVICE_ACCOUNT_JSON  (full JSON string) OR
 *   - GOOGLE_APPLICATION_CREDENTIALS (path to JSON file) OR
 *   - default ADC (GCP env)
 */

let adminApp: any = null;
let adminAuth: any = null;
let adminFirestore: any = null;

try {
  // try dynamic import so we can catch MODULE_NOT_FOUND
  // modular imports are more resilient with bundlers
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { initializeApp, cert, getApp, apps } = require("firebase-admin/app");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getAuth } = require("firebase-admin/auth");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getFirestore } = require("firebase-admin/firestore");

  // Helper function to check if error is about duplicate app
  const isDuplicateAppError = (err: any): boolean => {
    if (!err) return false;
    const message = String(err.message || '').toLowerCase();
    const code = String(err.code || '');
    return (
      code === 'app/duplicate-app' ||
      code === 'app/default-already-exists' ||
      message.includes('already exists') ||
      message.includes('duplicate app')
    );
  };

  // Try to get existing app first (most common case in Next.js)
  try {
    adminApp = getApp();
  } catch (err: any) {
    // App doesn't exist yet, we'll initialize it below
    // Only log if it's not a "no app" error
    if (err?.code !== 'app/no-app') {
      // Try with explicit name
      try {
        adminApp = getApp('[DEFAULT]');
      } catch {
        // App doesn't exist, will initialize below
      }
    }
  }

  // Only initialize if we don't have an app yet
  if (!adminApp) {
    // Prefer JSON in env
    const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (svcJson) {
      try {
        const parsed = JSON.parse(svcJson);
        adminApp = initializeApp({
          credential: cert(parsed),
        });
      } catch (err: any) {
        // If initialization fails due to duplicate app, try to get existing
        if (isDuplicateAppError(err)) {
          try {
            adminApp = getApp();
          } catch (getErr: any) {
            // If getApp also fails, try default name
            try {
              adminApp = getApp('[DEFAULT]');
            } catch {
              // If all else fails, log warning but continue
              console.warn("⚠️ Firebase app initialization conflict. Some features may not work.");
              console.warn("   This can happen during build time. The app should work at runtime.");
            }
          }
        } else {
          // Re-throw non-duplicate errors
          throw err;
        }
      }
    } else {
      // No JSON in env, try default initialization
      try {
        // This will pick GOOGLE_APPLICATION_CREDENTIALS or ADC
        adminApp = initializeApp();
      } catch (err: any) {
        // If initialization fails due to duplicate app, try to get existing
        if (isDuplicateAppError(err)) {
          try {
            adminApp = getApp();
          } catch (getErr: any) {
            try {
              adminApp = getApp('[DEFAULT]');
            } catch {
              console.warn("⚠️ Firebase app initialization conflict. Some features may not work.");
              console.warn("   This can happen during build time. The app should work at runtime.");
            }
          }
        } else {
          // Re-throw non-duplicate errors only in non-build contexts
          // During build, Next.js might load modules multiple times
          const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';
          if (!isBuildTime) {
            throw err;
          } else {
            console.warn("⚠️ Firebase initialization error during build (this is usually safe):", err?.message);
          }
        }
      }
    }
  }

  // get auth + firestore instances (only if adminApp exists)
  if (adminApp) {
    try {
      adminAuth = getAuth(adminApp);
    } catch (err: any) {
      console.error("❌ Failed to initialize Firebase Admin Auth:", err?.message);
      adminAuth = null;
    }

    try {
      adminFirestore = getFirestore(adminApp);
    } catch (err: any) {
      console.error("❌ Failed to initialize Firebase Admin Firestore:", err?.message);
      adminFirestore = null;
    }
  } else {
    console.warn("⚠️ Firebase Admin app not initialized. Admin features will not work.");
    console.warn("   This may be normal during build time in some environments.");
  }

  // Detailed initialization check
  if (!adminAuth || !adminFirestore) {
    console.error("⚠️ Firebase Admin SDK initialization failed!");
    console.error("Please verify the following:");
    console.error("1. FIREBASE_SERVICE_ACCOUNT_JSON environment variable is set (recommended for Vercel)");
    console.error("   - This should be the full JSON string of your service account key");
    console.error("   - Get it from: Firebase Console > Project Settings > Service Accounts");
    console.error("2. OR GOOGLE_APPLICATION_CREDENTIALS points to a valid service account file");
    console.error("3. Firebase Admin SDK is installed: npm install firebase-admin");
    console.error("4. Service account has proper permissions (Firebase Admin SDK Admin Service Agent)");
    
    // Check if we have the env var but it might be malformed
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      try {
        JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      } catch (parseErr) {
        console.error("✗ FIREBASE_SERVICE_ACCOUNT_JSON exists but is NOT valid JSON!");
        console.error("  Please check that the entire JSON is properly escaped in Vercel environment variables");
      }
    } else {
      console.error("✗ FIREBASE_SERVICE_ACCOUNT_JSON is not set");
    }
  }
} catch (err: any) {
  // if require('firebase-admin/...') fails, show clear message
  if (err && err.code === "MODULE_NOT_FOUND") {
    console.error("Firebase Admin SDK not found. Please run: npm install firebase-admin");
  } else {
    console.error("Firebase Admin initialization error:", err?.message);
  }
  // Don't throw here - let it fail gracefully so the app can still start
  // Individual functions will check for adminFirestore and throw appropriate errors
}

export { adminApp as firebaseAdmin, adminAuth, adminFirestore };
