// app/api/products/debug/route.ts
// Debug endpoint for products API - helps diagnose production issues
import { NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin.server";
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
      debugInfo.firestore.error = "Firestore not initialized";
    }

    // Check service account JSON validity
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      try {
        JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        debugInfo.environment.serviceAccountJsonValid = true;
      } catch (parseError) {
        debugInfo.environment.serviceAccountJsonError = "Invalid JSON format";
      }
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

