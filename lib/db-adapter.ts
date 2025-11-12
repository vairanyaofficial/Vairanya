// lib/db-adapter.ts
// Database abstraction layer - MongoDB only (Firebase removed)
import "server-only";

/**
 * Check which database is available
 * Now only checks MongoDB since Firebase has been removed
 */
export async function getAvailableDatabase(): Promise<"mongodb" | "none"> {
  try {
    const { initializeMongoDB, isMongoDBAvailable } = await import("@/lib/mongodb.server");
    const mongoInit = await initializeMongoDB();
    
    if (mongoInit.success && isMongoDBAvailable()) {
      return "mongodb";
    }
  } catch {
    // MongoDB not available
  }
  
  return "none";
}
