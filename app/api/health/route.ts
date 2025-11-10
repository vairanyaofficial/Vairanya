// app/api/health/route.ts
// Health check endpoint for monitoring and load balancers

import { NextResponse } from "next/server";
import { adminFirestore, ensureFirebaseInitialized, getFirebaseDiagnostics } from "@/lib/firebaseAdmin.server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const startTime = Date.now();
  const health: {
    status: "healthy" | "degraded" | "unhealthy";
    timestamp: string;
    uptime: number;
    services: {
      database: "ok" | "error";
      responseTime: number;
      error?: string;
    };
    diagnostics?: any;
    version?: string;
  } = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: "ok",
      responseTime: 0,
    },
  };

  // Check database connectivity
  try {
    // First ensure Firebase is initialized
    const initResult = await ensureFirebaseInitialized();
    
    if (!initResult.success) {
      health.services.database = "error";
      health.services.error = (initResult as { success: false; error: string }).error || "Initialization failed";
      health.status = "unhealthy";
      health.diagnostics = getFirebaseDiagnostics();
    } else if (!adminFirestore) {
      health.services.database = "error";
      health.services.error = "Firestore instance not available";
      health.status = "unhealthy";
      health.diagnostics = getFirebaseDiagnostics();
    } else {
      // Try a simple read operation to check connectivity
      const dbStartTime = Date.now();
      try {
        // Use a timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Database connection timeout")), 5000)
        );
        
        const queryPromise = adminFirestore.collection("_health").limit(1).get();
        await Promise.race([queryPromise, timeoutPromise]);
        
        health.services.responseTime = Date.now() - dbStartTime;
        health.services.database = "ok";
      } catch (dbError: any) {
        health.services.database = "error";
        health.services.error = dbError?.message || "Database query failed";
        health.status = "unhealthy";
      }
    }
  } catch (error: any) {
    health.services.database = "error";
    health.services.error = error?.message || "Unknown error";
    health.status = "unhealthy";
    health.diagnostics = getFirebaseDiagnostics();
  }

  const totalResponseTime = Date.now() - startTime;
  health.services.responseTime = totalResponseTime;

  // Add version info if available
  if (process.env.NEXT_PUBLIC_APP_VERSION) {
    health.version = process.env.NEXT_PUBLIC_APP_VERSION;
  }

  const statusCode = health.status === "healthy" ? 200 : health.status === "degraded" ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}
