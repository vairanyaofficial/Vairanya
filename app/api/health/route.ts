// app/api/health/route.ts
// Health check endpoint for monitoring and load balancers

import { NextResponse } from "next/server";
import { adminFirestore, ensureFirebaseInitialized, getFirebaseDiagnostics } from "@/lib/firebaseAdmin.server";
import { initializeMongoDB, getMongoDB, getMongoDBDiagnostics, isMongoDBAvailable } from "@/lib/mongodb.server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const startTime = Date.now();
  const health: {
    status: "healthy" | "degraded" | "unhealthy";
    timestamp: string;
    uptime: number;
    services: {
      firebase: "ok" | "error" | "unavailable";
      mongodb: "ok" | "error" | "unavailable";
      responseTime: number;
      error?: string;
    };
    diagnostics?: {
      firebase?: any;
      mongodb?: any;
    };
    version?: string;
  } = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      firebase: "unavailable",
      mongodb: "unavailable",
      responseTime: 0,
    },
  };

  let hasAnyDatabase = false;

  // Check Firebase connectivity
  try {
    const initResult = await ensureFirebaseInitialized();
    
    if (initResult.success && adminFirestore) {
      const dbStartTime = Date.now();
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Firebase connection timeout")), 5000)
        );
        
        const queryPromise = adminFirestore.collection("_health").limit(1).get();
        await Promise.race([queryPromise, timeoutPromise]);
        
        health.services.firebase = "ok";
        hasAnyDatabase = true;
        health.services.responseTime = Date.now() - dbStartTime;
      } catch (dbError: any) {
        health.services.firebase = "error";
        if (!health.services.error) {
          health.services.error = `Firebase: ${dbError?.message || "Database query failed"}`;
        }
      }
    } else {
      health.services.firebase = "unavailable";
    }
  } catch (error: any) {
    health.services.firebase = "error";
    if (!health.services.error) {
      health.services.error = `Firebase: ${error?.message || "Unknown error"}`;
    }
  }

  // Check MongoDB connectivity
  try {
    const mongoInit = await initializeMongoDB();
    
    if (mongoInit.success && isMongoDBAvailable()) {
      const db = getMongoDB();
      if (db) {
        const dbStartTime = Date.now();
        try {
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("MongoDB connection timeout")), 5000)
          );
          
          // Test connection with a simple listCollections operation
          const pingPromise = db.listCollections().limit(1).toArray();
          await Promise.race([pingPromise, timeoutPromise]);
          
          health.services.mongodb = "ok";
          hasAnyDatabase = true;
          if (health.services.responseTime === 0) {
            health.services.responseTime = Date.now() - dbStartTime;
          }
        } catch (dbError: any) {
          health.services.mongodb = "error";
          if (!health.services.error) {
            health.services.error = `MongoDB: ${dbError?.message || "Database query failed"}`;
          }
        }
      } else {
        health.services.mongodb = "unavailable";
      }
    } else {
      health.services.mongodb = "unavailable";
    }
  } catch (error: any) {
    health.services.mongodb = "error";
    if (!health.services.error) {
      health.services.error = `MongoDB: ${error?.message || "Unknown error"}`;
    }
  }

  // Set overall status
  if (!hasAnyDatabase) {
    health.status = "unhealthy";
  } else if (health.services.firebase === "error" || health.services.mongodb === "error") {
    health.status = "degraded";
  }

  // Add diagnostics
  health.diagnostics = {
    firebase: getFirebaseDiagnostics(),
    mongodb: getMongoDBDiagnostics(),
  };

  const totalResponseTime = Date.now() - startTime;
  if (health.services.responseTime === 0) {
    health.services.responseTime = totalResponseTime;
  }

  // Add version info if available
  if (process.env.NEXT_PUBLIC_APP_VERSION) {
    health.version = process.env.NEXT_PUBLIC_APP_VERSION;
  }

  const statusCode = health.status === "healthy" ? 200 : health.status === "degraded" ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}
