// app/api/health/route.ts
// Health check endpoint for monitoring and load balancers

import { NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin.server";

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
    };
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
    if (adminFirestore) {
      const dbStartTime = Date.now();
      // Simple read operation to check connectivity
      await adminFirestore.collection("_health").limit(1).get();
      health.services.responseTime = Date.now() - dbStartTime;
      health.services.database = "ok";
    } else {
      health.services.database = "error";
      health.status = "degraded";
    }
  } catch (error) {
    health.services.database = "error";
    health.status = "unhealthy";
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
