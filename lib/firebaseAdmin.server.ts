// lib/firebaseAdmin.server.ts
import "server-only";

/**
 * Robust firebase-admin initializer for Next.js server environment.
 * - Uses modular imports to avoid some bundler surprises.
 * - Defensive: if firebase-admin is not installed or credentials invalid, logs clear errors.
 * - Supports on-demand initialization for better reliability.
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
let initializationAttempted = false;
let initializationError: Error | null = null;
let initializationPromise: Promise<{ success: boolean; error?: string }> | null = null;

// Helper function to check if error is about duplicate app
function isDuplicateAppError(err: any): boolean {
  if (!err) return false;
  const message = String(err.message || '').toLowerCase();
  const code = String(err.code || '');
  return (
    code === 'app/duplicate-app' ||
    code === 'app/default-already-exists' ||
    message.includes('already exists') ||
    message.includes('duplicate app')
  );
}

// Initialize Firebase Admin SDK
async function initializeFirebaseAdmin(): Promise<{ success: boolean; error?: string }> {
  // If already initialized, return success
  if (adminApp && adminAuth && adminFirestore) {
    return { success: true };
  }

  // If initialization is in progress, wait for it
  if (initializationPromise) {
    return await initializationPromise;
  }

  // If we've already attempted and failed, return the error
  if (initializationAttempted && initializationError) {
    return { success: false, error: initializationError.message };
  }

  // Start initialization and store the promise
  initializationPromise = (async () => {
    try {
      return await doInitializeFirebaseAdmin();
    } finally {
      initializationPromise = null;
    }
  })();

  return await initializationPromise;
}

// Actual initialization logic
async function doInitializeFirebaseAdmin(): Promise<{ success: boolean; error?: string }> {

  try {
    // Use dynamic import for better compatibility with Vercel serverless
    // This ensures the module is properly loaded in production
    const firebaseAdminApp = await import("firebase-admin/app");
    const firebaseAdminAuth = await import("firebase-admin/auth");
    const firebaseAdminFirestore = await import("firebase-admin/firestore");
    
    const { initializeApp, cert, getApp } = firebaseAdminApp;
    const { getAuth } = firebaseAdminAuth;
    const { getFirestore } = firebaseAdminFirestore;

    // Try to get existing app first (most common case in Next.js)
    try {
      adminApp = getApp();
    } catch (err: any) {
      // App doesn't exist yet, we'll initialize it below
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
      // Prefer JSON in env, but fall back to file if JSON is invalid
      const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      let useJsonEnv = false;
      let parsed: any = null;
      
      if (svcJson && svcJson.trim()) {
        try {
          // Clean and validate JSON first
          let cleanedJson = svcJson.trim();
          
          // Skip if it's just a comment or empty
          if (cleanedJson.startsWith('#') || cleanedJson === '' || cleanedJson === '{}') {
            console.log("ℹ️  FIREBASE_SERVICE_ACCOUNT_JSON is commented out or empty, using file-based approach");
            useJsonEnv = false;
          } else {
            // Remove BOM if present
            if (cleanedJson.charCodeAt(0) === 0xFEFF) {
              cleanedJson = cleanedJson.slice(1);
            }
            
            // Remove leading/trailing quotes if double-quoted string
            if ((cleanedJson.startsWith('"') && cleanedJson.endsWith('"')) || 
                (cleanedJson.startsWith("'") && cleanedJson.endsWith("'"))) {
              cleanedJson = cleanedJson.slice(1, -1);
              // Unescape any escaped quotes
              cleanedJson = cleanedJson.replace(/\\"/g, '"').replace(/\\'/g, "'");
            }
            
            // Check if it looks like multiline JSON (contains newlines that aren't escaped)
            // Also check if it starts with { but seems malformed (likely multiline in .env)
            const hasUnescapedNewlines = cleanedJson.includes('\n') || cleanedJson.includes('\r');
            const looksLikeMultiline = hasUnescapedNewlines && !cleanedJson.match(/\\n/g);
            
            if (looksLikeMultiline || (cleanedJson.startsWith('{') && cleanedJson.length > 10 && !cleanedJson.includes('"type"'))) {
              console.warn("⚠️  FIREBASE_SERVICE_ACCOUNT_JSON appears to be multiline or malformed. This is invalid for environment variables.");
              if (process.env.VERCEL) {
                console.error("   ❌ In Vercel, FIREBASE_SERVICE_ACCOUNT_JSON must be valid JSON on a single line.");
                console.error("   Solution: Fix the JSON format in Vercel environment variables.");
                useJsonEnv = false;
              } else {
                console.warn("   Falling back to file-based approach using GOOGLE_APPLICATION_CREDENTIALS");
                console.warn("   Tip: Remove FIREBASE_SERVICE_ACCOUNT_JSON from .env to use file-based credentials");
                useJsonEnv = false;
              }
            } else {
              // Try to parse the cleaned JSON
              try {
                parsed = JSON.parse(cleanedJson);
                // Double-check it's actually valid service account JSON
                if (parsed.type === 'service_account' && parsed.project_id && parsed.private_key && parsed.client_email) {
                  useJsonEnv = true;
                  console.log("✅ FIREBASE_SERVICE_ACCOUNT_JSON is valid, using it for initialization");
                } else {
                  console.warn("⚠️  FIREBASE_SERVICE_ACCOUNT_JSON doesn't look like a valid service account JSON");
                  if (process.env.VERCEL) {
                    console.error("   ❌ In Vercel, FIREBASE_SERVICE_ACCOUNT_JSON must be valid service account JSON.");
                    console.error("   Solution: Verify the JSON in Vercel environment variables.");
                  } else {
                    console.warn("   Falling back to file-based approach using GOOGLE_APPLICATION_CREDENTIALS");
                  }
                  useJsonEnv = false;
                }
              } catch (parseErr: any) {
                // JSON is invalid - log warning but don't fail, fall back to file
                const preview = cleanedJson.substring(0, 50).replace(/private_key["\s:]+"[^"]*/gi, 'private_key:"[REDACTED]"');
                console.warn("⚠️  Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", parseErr?.message);
                console.warn("   JSON starts with:", preview);
                if (process.env.VERCEL) {
                  console.error("   ❌ In Vercel, FIREBASE_SERVICE_ACCOUNT_JSON must be valid JSON on a single line.");
                  console.error("   💡 Solution: Fix the JSON format in Vercel environment variables.");
                } else {
                  console.warn("   This usually means the JSON is multiline in your .env file, which is invalid.");
                  console.warn("   Falling back to file-based approach using GOOGLE_APPLICATION_CREDENTIALS");
                  console.warn("   💡 Solution: Remove or comment out FIREBASE_SERVICE_ACCOUNT_JSON from .env");
                }
                useJsonEnv = false;
              }
            }
          }
        } catch (err: any) {
          console.warn("⚠️  Error processing FIREBASE_SERVICE_ACCOUNT_JSON:", err?.message);
          console.warn("   Falling back to file-based approach using GOOGLE_APPLICATION_CREDENTIALS");
          useJsonEnv = false;
        }
      }
      
      if (useJsonEnv && parsed) {
        try {

          // Validate required fields
          if (!parsed.project_id || !parsed.private_key || !parsed.client_email) {
            console.warn("⚠️  FIREBASE_SERVICE_ACCOUNT_JSON is missing required fields (project_id, private_key, client_email)");
            console.warn("   Falling back to file-based approach using GOOGLE_APPLICATION_CREDENTIALS");
            useJsonEnv = false;
          } else {
            try {
              adminApp = initializeApp({
                credential: cert(parsed),
              });
              console.log("✅ Firebase Admin initialized with FIREBASE_SERVICE_ACCOUNT_JSON");
            } catch (initErr: any) {
              // If initialization fails due to duplicate app, try to get existing
              if (isDuplicateAppError(initErr)) {
                try {
                  adminApp = getApp();
                } catch (getErr: any) {
                  try {
                    adminApp = getApp('[DEFAULT]');
                  } catch {
                    console.warn("⚠️  Firebase app initialization conflict, falling back to file-based approach");
                    useJsonEnv = false;
                  }
                }
              } else {
                console.warn("⚠️  Failed to initialize Firebase app with FIREBASE_SERVICE_ACCOUNT_JSON:", initErr?.message);
                console.warn("   Falling back to file-based approach using GOOGLE_APPLICATION_CREDENTIALS");
                useJsonEnv = false;
              }
            }
          }
        } catch (err: any) {
          console.warn("⚠️  Unexpected error during Firebase initialization:", err?.message);
          console.warn("   Falling back to file-based approach using GOOGLE_APPLICATION_CREDENTIALS");
          useJsonEnv = false;
        }
      }
      
      // If JSON env var wasn't used (or failed), try file-based approach ONLY in non-Vercel environments
      if (!useJsonEnv) {
        // In Vercel, we MUST use FIREBASE_SERVICE_ACCOUNT_JSON - file-based approach won't work
        if (process.env.VERCEL) {
          const errorMsg = "FIREBASE_SERVICE_ACCOUNT_JSON is required in Vercel. Please set it in Vercel environment variables.";
          console.error("❌", errorMsg);
          console.error("   Vercel serverless functions cannot access local files.");
          console.error("   Solution: Set FIREBASE_SERVICE_ACCOUNT_JSON in Vercel Dashboard → Settings → Environment Variables");
          initializationError = new Error(errorMsg);
          initializationAttempted = true;
          return { success: false, error: errorMsg };
        }

        // No JSON in env, try default initialization (only in non-Vercel environments)
        try {
          // This will pick GOOGLE_APPLICATION_CREDENTIALS or ADC
          // But only if we're not in Vercel
          adminApp = initializeApp();
          console.log("✅ Firebase Admin initialized with default credentials");
        } catch (err: any) {
          // If initialization fails due to duplicate app, try to get existing
          if (isDuplicateAppError(err)) {
            try {
              adminApp = getApp();
            } catch (getErr: any) {
              try {
                adminApp = getApp('[DEFAULT]');
              } catch {
                const errorMsg = `Firebase app initialization conflict: ${err?.message}`;
                console.error("❌", errorMsg);
                initializationError = new Error(errorMsg);
                initializationAttempted = true;
                return { success: false, error: errorMsg };
              }
            }
          } else {
            // Re-throw non-duplicate errors only in non-build contexts
            const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';
            if (!isBuildTime) {
              // Check if we're in development and can use file-based credentials
              const isDevelopment = process.env.NODE_ENV === 'development';
              const hasGoogleCreds = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
              
              // In development, try to use local service account file if it exists
              // NEVER use file-based approach in Vercel
              if (isDevelopment && !hasGoogleCreds && !process.env.VERCEL) {
                try {
                  const fs = await import('fs');
                  const path = await import('path');
                  const serviceAccountPath = path.join(process.cwd(), 'secrets', 'serviceAccountKey.json');
                  
                  if (fs.existsSync(serviceAccountPath)) {
                    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
                    adminApp = initializeApp({
                      credential: cert(serviceAccount),
                    });
                    console.log("✅ Firebase Admin initialized with local service account file");
                  } else {
                    // File doesn't exist - throw error to show helpful message
                    throw new Error(`Service account file not found at ${serviceAccountPath}`);
                  }
                } catch (fileErr: any) {
                  // If file-based approach fails, provide helpful error message
                  const errorMsg = isDevelopment 
                    ? `Firestore not initialized. For localhost: Ensure secrets/serviceAccountKey.json exists or set GOOGLE_APPLICATION_CREDENTIALS. For production: Set FIREBASE_SERVICE_ACCOUNT_JSON in Vercel. Error: ${fileErr?.message}`
                    : `Failed to initialize Firebase app with default credentials: ${err?.message}`;
                  console.error("❌", errorMsg);
                  initializationError = new Error(errorMsg);
                  initializationAttempted = true;
                  return { success: false, error: errorMsg };
                }
              } else {
                const errorMsg = `Failed to initialize Firebase app. ${process.env.VERCEL ? 'FIREBASE_SERVICE_ACCOUNT_JSON is required in Vercel.' : 'Please set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS.'} Error: ${err?.message}`;
                console.error("❌", errorMsg);
                initializationError = new Error(errorMsg);
                initializationAttempted = true;
                return { success: false, error: errorMsg };
              }
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
        if (adminFirestore) {
          console.log("✅ Firebase Firestore initialized successfully");
        }
      } catch (err: any) {
        console.error("❌ Failed to initialize Firebase Admin Firestore:", err?.message);
        console.error("   Error details:", err);
        adminFirestore = null;
      }
    } else {
      const errorMsg = "Firebase Admin app not initialized";
      console.error("❌", errorMsg);
      initializationError = new Error(errorMsg);
      initializationAttempted = true;
      return { success: false, error: errorMsg };
    }

    // Check if initialization was successful
    if (!adminAuth || !adminFirestore) {
      const errorMsg = "Firebase Admin SDK partially initialized (Auth or Firestore failed)";
      console.error("❌", errorMsg);
      console.error("   Auth initialized:", !!adminAuth);
      console.error("   Firestore initialized:", !!adminFirestore);
      initializationError = new Error(errorMsg);
      initializationAttempted = true;
      return { success: false, error: errorMsg };
    }

    initializationAttempted = true;
    return { success: true };
  } catch (err: any) {
    // if require('firebase-admin/...') fails, show clear message
    let errorMsg: string;
    if (err && err.code === "MODULE_NOT_FOUND") {
      errorMsg = "Firebase Admin SDK not found. Please run: npm install firebase-admin";
      console.error("❌", errorMsg);
      console.error("   This error occurs when firebase-admin is not installed or not available in the production environment.");
      console.error("   Debugging info:");
      console.error("   - Node version:", process.version);
      console.error("   - Platform:", process.platform);
      console.error("   - NODE_ENV:", process.env.NODE_ENV);
      console.error("   - VERCEL:", process.env.VERCEL ? "true" : "false");
      
      // Check if package.json has firebase-admin
      try {
        const packageJson = require('../package.json');
        if (packageJson.dependencies && packageJson.dependencies['firebase-admin']) {
          console.error("   - firebase-admin is listed in package.json dependencies");
          console.error("   - Version:", packageJson.dependencies['firebase-admin']);
          console.error("   💡 Solution: Make sure to run 'npm install' in production before deploying");
          console.error("   💡 If using Vercel, ensure package.json is committed and dependencies are installed");
        } else {
          console.error("   - firebase-admin is NOT in package.json dependencies");
          console.error("   💡 Solution: Run 'npm install firebase-admin --save' and commit package.json");
        }
      } catch (pkgErr) {
        console.error("   - Could not read package.json");
      }
    } else {
      errorMsg = `Firebase Admin initialization error: ${err?.message || 'Unknown error'}`;
      console.error("❌", errorMsg);
      console.error("   Error code:", err?.code);
      console.error("   Error name:", err?.name);
      console.error("   Full error:", err);
    }
    initializationError = new Error(errorMsg);
    initializationAttempted = true;
    return { success: false, error: errorMsg };
  }
}

// Ensure initialization function - can be called on-demand
export async function ensureFirebaseInitialized(): Promise<{ success: boolean; error?: string }> {
  if (adminApp && adminAuth && adminFirestore) {
    return { success: true };
  }
  return await initializeFirebaseAdmin();
}

// Try to initialize on module load (fire-and-forget)
initializeFirebaseAdmin().catch((err: any) => {
  console.error("❌ Error during module load initialization:", err?.message);
});

// Detailed diagnostics function
export function getFirebaseDiagnostics() {
  const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  let jsonValid = false;
  let jsonError = null;
  
  if (svcJson) {
    try {
      const parsed = JSON.parse(svcJson);
      jsonValid = !!(parsed.project_id && parsed.private_key && parsed.client_email);
      if (!jsonValid) {
        jsonError = "JSON is valid but missing required fields (project_id, private_key, client_email)";
      }
    } catch (parseErr: any) {
      jsonError = `Invalid JSON: ${parseErr?.message}`;
    }
  }

  return {
    initialized: !!(adminApp && adminAuth && adminFirestore),
    hasApp: !!adminApp,
    hasAuth: !!adminAuth,
    hasFirestore: !!adminFirestore,
    hasServiceAccountJson: !!svcJson,
    serviceAccountJsonValid: jsonValid,
    serviceAccountJsonError: jsonError,
    hasGoogleAppCreds: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
    nodeEnv: process.env.NODE_ENV,
    initializationError: initializationError?.message || null,
  };
}

export { adminApp as firebaseAdmin, adminAuth, adminFirestore };
