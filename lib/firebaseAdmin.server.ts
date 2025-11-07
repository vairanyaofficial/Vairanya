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

  // If already initialized, reuse
  if (apps && apps.length > 0) {
    adminApp = getApp();
  } else {
    // Prefer JSON in env
    const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (svcJson) {
      try {
        const parsed = JSON.parse(svcJson);
        adminApp = initializeApp({
          credential: cert(parsed),
        });
      } catch (err) {
      }
    }

    if (!adminApp) {
      try {
        // This will pick GOOGLE_APPLICATION_CREDENTIALS or ADC
        adminApp = initializeApp();
      } catch (err) {
        throw err;
      }
    }
  }

  // get auth + firestore instances
  try {
    adminAuth = getAuth(adminApp);
    console.log("✅ Firebase Admin Auth initialized successfully");
  } catch (err: any) {
    console.error("❌ Failed to initialize Firebase Admin Auth:", err?.message);
    adminAuth = null;
  }

  try {
    adminFirestore = getFirestore(adminApp);
    console.log("✅ Firebase Admin Firestore initialized successfully");
  } catch (err: any) {
    console.error("❌ Failed to initialize Firebase Admin Firestore:", err?.message);
    adminFirestore = null;
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
        console.log("✓ FIREBASE_SERVICE_ACCOUNT_JSON exists and is valid JSON");
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
