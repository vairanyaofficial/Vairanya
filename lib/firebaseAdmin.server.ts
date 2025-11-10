// lib/firebaseAdmin.server.ts
import "server-only";

/**
 * Firebase Admin initializer for Next.js (server-only).
 * Supports:
 *  - FIREBASE_SERVICE_ACCOUNT_JSON (raw JSON or base64-encoded JSON, possibly quoted)
 *  - GOOGLE_APPLICATION_CREDENTIALS (file path / ADC)
 *
 * Usage:
 *  - Call ensureFirebaseInitialized() in API routes / server actions before using admin objects.
 */

type InitResult = { success: true } | { success: false; error: string };

let adminApp: any = null;
let adminAuth: any = null;
let adminFirestore: any = null;
let initializationPromise: Promise<InitResult> | null = null;
let initializationError: Error | null = null;

// Common duplicate-app checks
function isDuplicateAppError(err: any): boolean {
  if (!err) return false;
  const msg = String(err.message || "").toLowerCase();
  const code = String(err.code || "").toLowerCase();
  return (
    code.includes("already-exists") ||
    code.includes("duplicate-app") ||
    msg.includes("already exists") ||
    msg.includes("duplicate app")
  );
}

// Decode base64 safely (Node Buffer preferred)
function safeBase64Decode(s: string): string | null {
  try {
    const cleaned = s.replace(/\s/g, "");
    if (typeof Buffer !== "undefined") {
      return Buffer.from(cleaned, "base64").toString("utf8");
    } else if (typeof atob !== "undefined") {
      return decodeURIComponent(escape(atob(cleaned)));
    } else {
      return null;
    }
  } catch {
    return null;
  }
}

// Normalize private_key newlines (handles "\\n" escaping)
function normalizeServiceAccount(sa: any) {
  if (!sa || typeof sa !== "object") return sa;
  if (typeof sa.private_key === "string") {
    sa.private_key = sa.private_key.replace(/\\n/g, "\n");
  }
  return sa;
}

// Try to parse service account from various env formats
function parseServiceAccountJson(jsonString: string): { success: boolean; parsed?: any; error?: string; strategy?: string } {
  if (!jsonString || !jsonString.trim()) {
    return { success: false, error: "Empty string" };
  }

  let cleaned = jsonString.trim();

  // Remove BOM
  if (cleaned.charCodeAt(0) === 0xfeff) cleaned = cleaned.slice(1);

  // If looks base64, try decode
  const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
  const compact = cleaned.replace(/\s/g, "");
  if (compact.length > 20 && base64Regex.test(compact)) {
    const decoded = safeBase64Decode(compact);
    if (decoded) {
      try {
        const parsed = JSON.parse(decoded);
        if (parsed && parsed.type === "service_account") {
          return { success: true, parsed: normalizeServiceAccount(parsed), strategy: "base64" };
        }
      } catch {
        // ignore
      }
    }
  }

  // Remove wrapping quotes if present
  const tryValues: Array<{ name: string; value: string }> = [{ name: "original", value: cleaned }];

  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    tryValues.push({ name: "unquoted", value: cleaned.slice(1, -1) });
  }

  // Try each
  let lastErr: any = null;
  for (const t of tryValues) {
    const v = t.value.trim();
    if (!v.startsWith("{")) continue;
    try {
      const parsed = JSON.parse(v);
      if (parsed && parsed.type === "service_account" && parsed.project_id && parsed.client_email && parsed.private_key) {
        return { success: true, parsed: normalizeServiceAccount(parsed), strategy: t.name };
      } else {
        return { success: false, parsed, error: "JSON parsed but missing required service account fields", strategy: t.name };
      }
    } catch (err) {
      lastErr = err;
      continue;
    }
  }

  return { success: false, error: `Failed to parse service account JSON. Last error: ${lastErr?.message || "unknown"}` };
}

// Core initialization
async function doInitializeFirebaseAdmin(): Promise<InitResult> {
  try {
    const firebaseAdminApp = await import("firebase-admin/app");
    const firebaseAdminAuth = await import("firebase-admin/auth");

    if (!firebaseAdminApp) throw new Error("Missing firebase-admin/app");
    const { initializeApp, cert, getApp } = firebaseAdminApp;
    const { getAuth } = firebaseAdminAuth;

    // If app already exists, reuse
    try {
      adminApp = getApp();
    } catch {
      adminApp = null;
    }

    // If not initialized, try various strategies
    if (!adminApp) {
      // Priority: FIREBASE_SERVICE_ACCOUNT_JSON_B64 (explicit base64) > FIREBASE_SERVICE_ACCOUNT_JSON (auto-detect) > Individual credentials > GOOGLE_APPLICATION_CREDENTIALS
      const svcEnvB64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_B64;
      const svcEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      const googleCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      
      // Individual credential fallback (for Vercel when JSON is too large)
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;

      let initialized = false;
      let usedVar = "";

      // Strategy A1: FIREBASE_SERVICE_ACCOUNT_JSON_B64 (explicit base64 - highest priority)
      if (svcEnvB64 && svcEnvB64.trim() && !svcEnvB64.trim().startsWith("#")) {
        const parsed = parseServiceAccountJson(svcEnvB64);
        if (parsed.success && parsed.parsed) {
          try {
            adminApp = initializeApp({ credential: cert(parsed.parsed) });
            initialized = true;
            usedVar = "FIREBASE_SERVICE_ACCOUNT_JSON_B64";
            console.log(`✅ Firebase Admin initialized from ${usedVar} (${parsed.strategy || "base64"})`);
          } catch (err: any) {
            if (isDuplicateAppError(err)) {
              try { adminApp = getApp(); initialized = true; usedVar = "FIREBASE_SERVICE_ACCOUNT_JSON_B64"; } catch {}
            } else {
              console.warn(`⚠️ Failed to initialize with ${usedVar}:`, err?.message || err);
            }
          }
        } else {
          console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT_JSON_B64 parse failed:", parsed.error);
        }
      }

      // Strategy A2: FIREBASE_SERVICE_ACCOUNT_JSON (supports base64 / raw / quoted - auto-detect)
      if (!initialized && svcEnv && svcEnv.trim() && !svcEnv.trim().startsWith("#")) {
        const parsed = parseServiceAccountJson(svcEnv);
        if (parsed.success && parsed.parsed) {
          try {
            adminApp = initializeApp({ credential: cert(parsed.parsed) });
            initialized = true;
            usedVar = "FIREBASE_SERVICE_ACCOUNT_JSON";
            console.log(`✅ Firebase Admin initialized from ${usedVar} (${parsed.strategy || "auto-detect"})`);
          } catch (err: any) {
            if (isDuplicateAppError(err)) {
              try { adminApp = getApp(); initialized = true; usedVar = "FIREBASE_SERVICE_ACCOUNT_JSON"; } catch {}
            } else {
              console.warn(`⚠️ Failed to initialize with ${usedVar}:`, err?.message || err);
            }
          }
        } else {
          console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT_JSON parse failed:", parsed.error);
        }
      }

      // Strategy A3: Individual credentials (fallback for Vercel when JSON env var is too large)
      if (!initialized && projectId && clientEmail && privateKey) {
        try {
          // Create service account object with required fields
          // Firebase Admin cert() accepts an object with at minimum: projectId, clientEmail, privateKey
          const serviceAccount: {
            projectId: string;
            clientEmail: string;
            privateKey: string;
            [key: string]: any;
          } = {
            projectId: projectId.trim(),
            clientEmail: clientEmail.trim(),
            privateKey: privateKey.replace(/\\n/g, "\n").trim(),
          };
          
          // Add optional fields if provided
          if (process.env.FIREBASE_PRIVATE_KEY_ID) {
            serviceAccount.privateKeyId = process.env.FIREBASE_PRIVATE_KEY_ID;
          }
          if (process.env.FIREBASE_CLIENT_ID) {
            serviceAccount.clientId = process.env.FIREBASE_CLIENT_ID;
          }
          
          adminApp = initializeApp({ credential: cert(serviceAccount) });
          initialized = true;
          usedVar = "Individual Firebase credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)";
          console.log(`✅ Firebase Admin initialized from individual credentials (Vercel-friendly)`);
        } catch (err: any) {
          if (isDuplicateAppError(err)) {
            try { adminApp = getApp(); initialized = true; usedVar = "Individual Firebase credentials"; } catch {}
          } else {
            console.warn(`⚠️ Failed to initialize with individual credentials:`, err?.message || err);
          }
        }
      }

      // Strategy B: GOOGLE_APPLICATION_CREDENTIALS / ADC
      if (!initialized && googleCreds) {
        try {
          // In development, if a local file exists we can try to read/parse it
          if (process.env.NODE_ENV === "development" && !process.env.VERCEL) {
            const fs = await import("fs");
            const path = await import("path");
            const credsPath = path.resolve(process.cwd(), googleCreds.replace(/^["']|["']$/g, ""));
            if (fs.existsSync(credsPath)) {
              try {
                const content = fs.readFileSync(credsPath, "utf8");
                const parsed = parseServiceAccountJson(content);
                if (parsed.success && parsed.parsed) {
                  adminApp = initializeApp({ credential: cert(parsed.parsed) });
                  initialized = true;
                  console.log("✅ Firebase Admin initialized from GOOGLE_APPLICATION_CREDENTIALS file (dev)");
                }
              } catch (fileErr: any) {
                console.warn("⚠️ Failed to read credentials file:", fileErr?.message || fileErr);
              }
            }
          }

          // Try ADC (no explicit credential) — SDK will pick up GOOGLE_APPLICATION_CREDENTIALS if set in env in prod
          if (!initialized) {
            try {
              adminApp = initializeApp();
              initialized = true;
              console.log("✅ Firebase Admin initialized with Application Default Credentials (ADC)");
            } catch (adcErr: any) {
              if (isDuplicateAppError(adcErr)) {
                try { adminApp = getApp(); initialized = true; } catch {}
              } else {
                console.warn("⚠️ ADC init failed:", adcErr?.message || adcErr);
              }
            }
          }
        } catch (adcOuter: any) {
          console.warn("⚠️ Error handling GOOGLE_APPLICATION_CREDENTIALS path:", adcOuter?.message || adcOuter);
        }
      }

      // Fallback: try ADC without GOOGLE_APPLICATION_CREDENTIALS (less likely to work)
      if (!adminApp) {
        try {
          adminApp = initializeApp();
          console.log("✅ Firebase Admin initialized (fallback ADC)");
        } catch (err: any) {
          if (isDuplicateAppError(err)) {
            try { adminApp = getApp(); } catch {}
          }
        }
      }

      if (!adminApp) {
        const suggestions: string[] = [];
        if (!svcEnvB64 && !svcEnv && !projectId) {
          suggestions.push("Set FIREBASE_SERVICE_ACCOUNT_JSON_B64 (recommended for Vercel)");
          suggestions.push("OR set FIREBASE_SERVICE_ACCOUNT_JSON");
          suggestions.push("OR set individual credentials: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY");
        } else if (svcEnvB64 || svcEnv) {
          suggestions.push("Check if JSON is valid and complete (Vercel may truncate large env vars)");
          suggestions.push("Try using FIREBASE_SERVICE_ACCOUNT_JSON_B64 (base64-encoded) instead");
          suggestions.push("OR use individual credentials: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY");
        } else if (projectId && !clientEmail) {
          suggestions.push("Set FIREBASE_CLIENT_EMAIL");
          suggestions.push("Set FIREBASE_PRIVATE_KEY");
        } else if (projectId && clientEmail && !privateKey) {
          suggestions.push("Set FIREBASE_PRIVATE_KEY");
        }
        
        const message = `Firebase Admin initialization failed. ${suggestions.length > 0 ? suggestions.join(". ") : "Check environment variables."}`;
        initializationError = new Error(message);
        
        // Enhanced logging for Vercel
        if (process.env.VERCEL) {
          console.error("❌ Firebase Admin initialization failed on Vercel");
          console.error("Available env vars:", {
            hasB64: !!svcEnvB64,
            hasJson: !!svcEnv,
            hasProjectId: !!projectId,
            hasClientEmail: !!clientEmail,
            hasPrivateKey: !!privateKey,
            jsonLength: svcEnv?.length || svcEnvB64?.length || 0,
          });
        }
        
        return { success: false, error: message };
      }
    }

    // Get Auth service
    try { adminAuth = getAuth(adminApp); } catch (e: any) { adminAuth = null; console.warn("Auth init failed", e?.message || String(e)); }

    if (!adminAuth) {
      const msg = "Firebase Admin Auth initialization failed";
      initializationError = new Error(msg);
      return { success: false, error: msg };
    }

    // Get Firestore service (still needed for some features like wishlist, carousel, offers, etc.)
    try {
      const firebaseAdminFirestore = await import("firebase-admin/firestore");
      const { getFirestore } = firebaseAdminFirestore;
      adminFirestore = getFirestore(adminApp);
    } catch (e: any) {
      adminFirestore = null;
      console.warn("Firestore init failed (some features may not work):", e?.message || String(e));
    }

    return { success: true };
  } catch (err: any) {
    const msg = err?.message ? `Firebase Admin init error: ${err.message}` : "Unknown Firebase Admin init error";
    initializationError = new Error(msg);
    console.error("❌", msg);
    return { success: false, error: msg };
  }
}

export async function initializeFirebaseAdmin(): Promise<InitResult> {
  if (adminApp && adminAuth) return { success: true };
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    try {
      const res = await doInitializeFirebaseAdmin();
      if (!res.success) {
        // keep the initializationError for diagnostics
      }
      return res;
    } finally {
      // allow subsequent attempts if desired (but keep initializationError)
      initializationPromise = null;
    }
  })();

  return initializationPromise;
}

export async function ensureFirebaseInitialized(): Promise<InitResult> {
  return initializeFirebaseAdmin();
}

export function getFirebaseDiagnostics() {
  const svcB64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_B64;
  const svc = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const googleCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS || null;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  
  // Determine which variable is being used (priority: B64 > regular > individual)
  const activeVar = svcB64 ? "FIREBASE_SERVICE_ACCOUNT_JSON_B64" : (svc ? "FIREBASE_SERVICE_ACCOUNT_JSON" : (projectId && clientEmail && privateKey ? "Individual credentials" : null));
  const activeValue = svcB64 || svc || null;
  const parsedCheck = activeValue ? parseServiceAccountJson(activeValue) : { success: false };

  return {
    initialized: !!(adminApp && adminAuth),
    hasApp: !!adminApp,
    hasAuth: !!adminAuth,
    authMethod: activeVar || (googleCreds ? "GOOGLE_APPLICATION_CREDENTIALS" : "none"),
    hasServiceAccountJson: !!svc,
    hasServiceAccountJsonB64: !!svcB64,
    envHasServiceAccountVar: !!activeValue,
    serviceAccountParsed: parsedCheck.success || false,
    serviceAccountParseError: parsedCheck.success ? null : parsedCheck.error || null,
    serviceAccountParseStrategy: parsedCheck.strategy || null,
    hasGoogleApplicationCredentials: !!googleCreds,
    // Individual credentials check
    hasIndividualCredentials: !!(projectId && clientEmail && privateKey),
    hasProjectId: !!projectId,
    hasClientEmail: !!clientEmail,
    hasPrivateKey: !!privateKey,
    privateKeyLength: privateKey?.length || 0,
    // Environment info
    nodeEnv: process.env.NODE_ENV,
    isVercel: !!process.env.VERCEL,
    jsonLength: svc?.length || svcB64?.length || 0,
    initializationError: initializationError?.message || null,
    // Recommendations
    recommendations: (() => {
      const recs: string[] = [];
      if (!adminApp) {
        if (!svcB64 && !svc && !projectId) {
          recs.push("Set FIREBASE_SERVICE_ACCOUNT_JSON_B64 (base64-encoded, recommended for Vercel)");
          recs.push("OR set individual credentials: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY");
        } else if (svcB64 || svc) {
          if (!parsedCheck.success) {
            recs.push("JSON parsing failed - check if complete and valid");
            recs.push("Vercel may truncate large env vars - try FIREBASE_SERVICE_ACCOUNT_JSON_B64 or individual credentials");
          }
        } else if (projectId && (!clientEmail || !privateKey)) {
          recs.push("Set missing individual credentials: FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY");
        }
      }
      return recs;
    })(),
  };
}

export { adminApp as firebaseAdmin, adminAuth, adminFirestore };
