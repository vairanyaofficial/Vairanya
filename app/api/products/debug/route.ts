// app/api/products/debug/route.ts
// Debug endpoint for products API - helps diagnose production issues
import { NextResponse } from "next/server";
import { adminFirestore, ensureFirebaseInitialized, getFirebaseDiagnostics } from "@/lib/firebaseAdmin.server";
import { logger } from "@/lib/logger";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    firestore: {
      initialized: false,
      error: null,
    },
    environment: {
      hasServiceAccountJson: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
      hasGoogleAppCreds: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
      nodeEnv: process.env.NODE_ENV,
      serviceAccountJsonValid: false,
    },
    products: {
      count: 0,
      error: null,
      sample: null,
    },
  };

  try {
    // Get detailed diagnostics
    const diagnostics = getFirebaseDiagnostics();
    debugInfo.diagnostics = diagnostics;
    debugInfo.firestore.initialized = diagnostics.initialized;
    debugInfo.environment.serviceAccountJsonValid = diagnostics.serviceAccountJsonValid;
    if (diagnostics.serviceAccountJsonError) {
      debugInfo.environment.serviceAccountJsonError = diagnostics.serviceAccountJsonError;
    }
    if (diagnostics.initializationError) {
      debugInfo.firestore.error = diagnostics.initializationError;
    }

    // Try to ensure initialization
    const initResult = ensureFirebaseInitialized();
    if (!initResult.success) {
      debugInfo.firestore.error = initResult.error || "Firestore initialization failed";
    }

    // Check Firestore initialization
    if (adminFirestore) {
      debugInfo.firestore.initialized = true;
      
      // Try to fetch products
      try {
        const snapshot = await adminFirestore.collection("products").limit(5).get();
        debugInfo.products.count = snapshot.size;
        
        if (snapshot.size > 0) {
          debugInfo.products.sample = snapshot.docs[0].data();
        }
      } catch (productsError: any) {
        debugInfo.products.error = {
          message: productsError?.message,
          code: productsError?.code,
          stack: process.env.NODE_ENV === "development" ? productsError?.stack : undefined,
        };
      }
    } else {
      debugInfo.firestore.error = debugInfo.firestore.error || "Firestore not initialized";
    }

    return NextResponse.json({
      success: true,
      debug: debugInfo,
    });
  } catch (error: any) {
    logger.error("Error in products debug endpoint", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unknown error",
        debug: debugInfo,
      },
      { status: 500 }
    );
  }
}

