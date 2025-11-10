// app/api/firebase/test/route.ts
// Comprehensive Firebase Admin SDK connection test endpoint
// This endpoint helps diagnose Firebase connection issues

import { NextResponse } from "next/server";
import { adminFirestore, adminAuth, ensureFirebaseInitialized, getFirebaseDiagnostics } from "@/lib/firebaseAdmin.server";
import { logger } from "@/lib/logger";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const testResults: any = {
    timestamp: new Date().toISOString(),
    overall: {
      status: "unknown",
      success: false,
    },
    initialization: {
      attempted: false,
      success: false,
      error: null,
      diagnostics: null,
    },
    firestore: {
      available: false,
      connection: {
        tested: false,
        success: false,
        responseTime: null,
        error: null,
      },
      collections: {
        tested: false,
        success: false,
        collections: [],
        error: null,
      },
    },
    auth: {
      available: false,
      tested: false,
      success: false,
      error: null,
    },
    environment: {
      hasServiceAccountJson: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
      hasGoogleAppCreds: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
      nodeEnv: process.env.NODE_ENV,
      vercel: !!process.env.VERCEL,
      serviceAccountJsonValid: false,
      serviceAccountJsonError: null,
    },
  };

  try {
    // Step 1: Get diagnostics
    const diagnostics = getFirebaseDiagnostics();
    testResults.initialization.diagnostics = diagnostics;
    testResults.environment.serviceAccountJsonValid = diagnostics.serviceAccountParsed;
    testResults.environment.serviceAccountJsonError = diagnostics.serviceAccountParseError;

    // Step 2: Test initialization
    testResults.initialization.attempted = true;
    const initStartTime = Date.now();
    
    try {
      const initResult = await ensureFirebaseInitialized();
      const initTime = Date.now() - initStartTime;
      
      testResults.initialization.success = initResult.success;
      testResults.initialization.responseTime = initTime;
      
      if (!initResult.success) {
        testResults.initialization.error = (initResult as { success: false; error: string }).error || "Initialization failed";
        testResults.overall.status = "failed";
        testResults.overall.success = false;
        
        return NextResponse.json({
          success: false,
          message: "Firebase initialization failed",
          results: testResults,
        }, { status: 503 });
      }
    } catch (initError: any) {
      testResults.initialization.error = initError?.message || "Initialization exception";
      testResults.overall.status = "failed";
      testResults.overall.success = false;
      
      return NextResponse.json({
        success: false,
        message: "Firebase initialization exception",
        results: testResults,
      }, { status: 503 });
    }

    // Step 3: Test Firestore availability
    testResults.firestore.available = !!adminFirestore;
    testResults.auth.available = !!adminAuth;

    if (!adminFirestore) {
      testResults.overall.status = "failed";
      testResults.overall.success = false;
      testResults.firestore.connection.error = "Firestore instance is null";
      
      return NextResponse.json({
        success: false,
        message: "Firestore not available",
        results: testResults,
      }, { status: 503 });
    }

    // Step 4: Test Firestore connection with timeout
    testResults.firestore.connection.tested = true;
    const connectionStartTime = Date.now();
    
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Firestore connection timeout (10s)")), 10000)
      );
      
      // Try to list collections (this requires a read operation)
      const testQueryPromise = adminFirestore.collection("_test").limit(1).get();
      await Promise.race([testQueryPromise, timeoutPromise]);
      
      const connectionTime = Date.now() - connectionStartTime;
      testResults.firestore.connection.success = true;
      testResults.firestore.connection.responseTime = connectionTime;
    } catch (connError: any) {
      testResults.firestore.connection.success = false;
      testResults.firestore.connection.error = connError?.message || "Connection test failed";
      testResults.firestore.connection.responseTime = Date.now() - connectionStartTime;
      
      // Don't fail completely - might be permission issue with _test collection
      logger.warn("Firestore connection test failed (might be expected)", {
        error: connError?.message,
        code: connError?.code,
      });
    }

    // Step 5: Test reading from actual collections
    testResults.firestore.collections.tested = true;
    const collectionsToTest = ["products", "orders", "admins", "categories"];
    const collectionResults: any[] = [];
    
    for (const collectionName of collectionsToTest) {
      const collectionTest: any = {
        name: collectionName,
        tested: false,
        success: false,
        documentCount: null,
        error: null,
        responseTime: null,
      };
      
      const collectionStartTime = Date.now();
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Collection ${collectionName} query timeout (5s)`)), 5000)
        );
        
        const queryPromise = adminFirestore.collection(collectionName).limit(1).get();
        const snapshot = await Promise.race([queryPromise, timeoutPromise]) as any;
        
        collectionTest.tested = true;
        collectionTest.success = true;
        collectionTest.responseTime = Date.now() - collectionStartTime;
        
        // Try to get count (might be slow for large collections, so we limit)
        try {
          const countSnapshot = await adminFirestore.collection(collectionName).count().get();
          collectionTest.documentCount = countSnapshot.data().count;
        } catch {
          // Count might not be available, that's okay
          collectionTest.documentCount = "unknown";
        }
      } catch (collError: any) {
        collectionTest.tested = true;
        collectionTest.success = false;
        collectionTest.error = collError?.message || "Collection test failed";
        collectionTest.responseTime = Date.now() - collectionStartTime;
        
        logger.warn(`Collection ${collectionName} test failed`, {
          error: collError?.message,
          code: collError?.code,
        });
      }
      
      collectionResults.push(collectionTest);
    }
    
    testResults.firestore.collections.collections = collectionResults;
    testResults.firestore.collections.success = collectionResults.some((c: any) => c.success);

    // Step 6: Test Auth (if available)
    if (adminAuth) {
      testResults.auth.tested = true;
      try {
        // Auth doesn't have a simple ping, so we just verify it's available
        testResults.auth.success = true;
      } catch (authError: any) {
        testResults.auth.success = false;
        testResults.auth.error = authError?.message || "Auth test failed";
      }
    }

    // Determine overall status
    if (testResults.initialization.success && testResults.firestore.available && testResults.firestore.connection.success) {
      testResults.overall.status = "success";
      testResults.overall.success = true;
    } else if (testResults.initialization.success && testResults.firestore.available) {
      testResults.overall.status = "partial";
      testResults.overall.success = false;
    } else {
      testResults.overall.status = "failed";
      testResults.overall.success = false;
    }

    const statusCode = testResults.overall.success ? 200 : 
                      testResults.initialization.success ? 503 : 503;

    return NextResponse.json({
      success: testResults.overall.success,
      message: testResults.overall.success ? "Firebase connection successful" : "Firebase connection issues detected",
      results: testResults,
    }, { status: statusCode });

  } catch (error: any) {
    logger.error("Error in Firebase test endpoint", error);
    
    testResults.overall.status = "error";
    testResults.overall.success = false;
    testResults.overall.error = error?.message || "Unknown error";
    
    return NextResponse.json({
      success: false,
      message: "Firebase test endpoint error",
      error: error?.message,
      results: testResults,
    }, { status: 500 });
  }
}

