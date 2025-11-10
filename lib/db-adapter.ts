// lib/db-adapter.ts
// Database abstraction layer that tries Firebase first, then falls back to MongoDB
import "server-only";

type DatabaseOperation<T> = () => Promise<T>;

/**
 * Execute a database operation with Firebase fallback to MongoDB
 * Tries Firebase first, if it fails, tries MongoDB
 */
export async function executeWithFallback<T>(
  firebaseOperation: DatabaseOperation<T>,
  mongoOperation: DatabaseOperation<T>,
  operationName: string = "database operation"
): Promise<T> {
  // Try Firebase first
  try {
    const { ensureFirebaseInitialized, adminFirestore } = await import("@/lib/firebaseAdmin.server");
    const initResult = await ensureFirebaseInitialized();
    
    if (initResult.success && adminFirestore) {
      try {
        return await firebaseOperation();
      } catch (firebaseError: any) {
        // If Firebase operation fails, log and try MongoDB
        console.warn(`⚠️ Firebase ${operationName} failed, trying MongoDB fallback:`, firebaseError?.message || firebaseError);
        
        // Try MongoDB
        const { initializeMongoDB, isMongoDBAvailable } = await import("@/lib/mongodb.server");
        const mongoInit = await initializeMongoDB();
        
        if (mongoInit.success && isMongoDBAvailable()) {
          try {
            const result = await mongoOperation();
            console.log(`✅ MongoDB fallback succeeded for ${operationName}`);
            return result;
          } catch (mongoError: any) {
            console.error(`❌ MongoDB fallback also failed for ${operationName}:`, mongoError?.message || mongoError);
            throw new Error(`Both Firebase and MongoDB failed. Firebase: ${firebaseError?.message || "unknown"}, MongoDB: ${mongoError?.message || "unknown"}`);
          }
        } else {
          // MongoDB not available, throw Firebase error
          throw firebaseError;
        }
      }
    } else {
      // Firebase not initialized, try MongoDB directly
      console.log(`ℹ️ Firebase not available, using MongoDB for ${operationName}`);
      const { initializeMongoDB, isMongoDBAvailable } = await import("@/lib/mongodb.server");
      const mongoInit = await initializeMongoDB();
      
      if (mongoInit.success && isMongoDBAvailable()) {
        try {
          return await mongoOperation();
        } catch (mongoError: any) {
          throw new Error(`MongoDB operation failed: ${mongoError?.message || "unknown"}`);
        }
      } else {
        throw new Error(`Database unavailable. Firebase: ${initResult.success ? "available" : (initResult as { success: false; error: string }).error}, MongoDB: ${mongoInit.success ? "available" : mongoInit.error || "not configured"}`);
      }
    }
  } catch (error: any) {
    // If error is already a database unavailable error, try MongoDB
    if (error.message && error.message.includes("Database unavailable")) {
      const { initializeMongoDB, isMongoDBAvailable } = await import("@/lib/mongodb.server");
      const mongoInit = await initializeMongoDB();
      
      if (mongoInit.success && isMongoDBAvailable()) {
        try {
          return await mongoOperation();
        } catch (mongoError: any) {
          throw new Error(`MongoDB fallback failed: ${mongoError?.message || "unknown"}`);
        }
      }
    }
    throw error;
  }
}

/**
 * Check which database is available
 */
export async function getAvailableDatabase(): Promise<"firebase" | "mongodb" | "none"> {
  try {
    const { ensureFirebaseInitialized, adminFirestore } = await import("@/lib/firebaseAdmin.server");
    const initResult = await ensureFirebaseInitialized();
    
    if (initResult.success && adminFirestore) {
      return "firebase";
    }
  } catch {
    // Firebase not available
  }
  
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

