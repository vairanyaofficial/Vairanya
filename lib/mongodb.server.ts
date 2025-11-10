// lib/mongodb.server.ts
// Only import server-only in Next.js runtime, not in standalone scripts
if (typeof process !== 'undefined' && process.env.NEXT_RUNTIME !== 'nodejs') {
  try {
    require('server-only');
  } catch {
    // Ignore if server-only is not available (e.g., in test scripts)
  }
}
import { MongoClient, Db } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;
let connectionPromise: Promise<MongoClient> | null = null;

/**
 * Get MongoDB connection string from environment variables
 */
function getMongoUri(): string | null {
  // Try MONGODB_URI first (standard)
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }
  
  // Try MONGODB_CONNECTION_STRING (alternative)
  if (process.env.MONGODB_CONNECTION_STRING) {
    return process.env.MONGODB_CONNECTION_STRING;
  }
  
  // Try constructing from individual parts
  const host = process.env.MONGODB_HOST;
  const port = process.env.MONGODB_PORT;
  const database = process.env.MONGODB_DATABASE;
  const username = process.env.MONGODB_USERNAME;
  const password = process.env.MONGODB_PASSWORD;
  
  if (host && database) {
    // Use mongodb+srv:// for MongoDB Atlas clusters (hostname contains .mongodb.net)
    // Use mongodb:// for regular MongoDB instances
    const isAtlasCluster = host.includes('.mongodb.net');
    const protocol = isAtlasCluster ? "mongodb+srv://" : "mongodb://";
    
    let uri = protocol;
    if (username && password) {
      uri += `${encodeURIComponent(username)}:${encodeURIComponent(password)}@`;
    }
    uri += host;
    // Don't add port for mongodb+srv:// (it's not supported)
    if (port && !isAtlasCluster) {
      uri += `:${port}`;
    }
    uri += `/${database}`;
    
    // Add options if provided
    const options = process.env.MONGODB_OPTIONS;
    if (options) {
      uri += `?${options}`;
    } else if (isAtlasCluster) {
      // Add default options for Atlas if none provided
      uri += `?retryWrites=true&w=majority`;
    }
    
    return uri;
  }
  
  return null;
}

// Track if MongoDB is disabled
let isMongoDBDisabled = false;

// Cache failed connection attempts to avoid repeated retries
let lastFailureTime: number | null = null;
let lastFailureHostname: string | null = null;
const FAILURE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes - don't retry for 5 minutes after failure

/**
 * Initialize MongoDB connection
 */
export async function initializeMongoDB(): Promise<{ success: boolean; error?: string }> {
  // Check if MongoDB is explicitly disabled
  if (process.env.MONGODB_DISABLED === "true" || process.env.MONGODB_DISABLED === "1") {
    isMongoDBDisabled = true;
    return { success: false, error: "MongoDB is disabled via MONGODB_DISABLED environment variable" };
  }
  
  // If already connected, return success
  if (client && db) {
    return { success: true };
  }
  
  // If connection is in progress, wait for it (with timeout)
  if (connectionPromise) {
    try {
      await Promise.race([
        connectionPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Connection timeout")), 5000)
        )
      ]);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || "MongoDB connection failed" };
    }
  }
  
  // Start new connection
  const uri = getMongoUri();
  if (!uri) {
    return { success: false, error: "MongoDB connection string not found. Set MONGODB_URI or MONGODB_CONNECTION_STRING environment variable." };
  }
  
  // Extract hostname for failure caching
  const hostnameMatch = uri.match(/@([^:/]+)/);
  const hostname = hostnameMatch ? hostnameMatch[1] : "unknown";
  
  // Check if we recently failed to connect to this hostname
  if (lastFailureTime && lastFailureHostname === hostname) {
    const timeSinceFailure = Date.now() - lastFailureTime;
    if (timeSinceFailure < FAILURE_CACHE_DURATION) {
      const remainingMinutes = Math.ceil((FAILURE_CACHE_DURATION - timeSinceFailure) / 60000);
      return { 
        success: false, 
        error: `MongoDB connection failed recently. Will retry in ${remainingMinutes} minute(s). To disable MongoDB, set MONGODB_DISABLED=true` 
      };
    }
  }
  
  connectionPromise = (async () => {
    try {
      console.log(`🔄 Attempting MongoDB connection to ${hostname}...`);
      
      // Determine if this is an Atlas connection (mongodb+srv://)
      const isAtlasConnection = uri.startsWith('mongodb+srv://');
      
      // Build connection options
      const connectionOptions: any = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000, // Increased to 10s for better reliability
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000, // Increased to 10s for better reliability
      };
      
      // For MongoDB Atlas (mongodb+srv://), TLS is required
      // Explicitly configure TLS for better compatibility
      if (isAtlasConnection) {
        connectionOptions.tls = true;
        // Allow invalid certificates only in development (not recommended for production)
        // For production, use proper certificate validation
        if (process.env.NODE_ENV === 'development' && process.env.MONGODB_TLS_ALLOW_INVALID_CERTS === 'true') {
          connectionOptions.tlsAllowInvalidCertificates = true;
        }
      }
      
      const mongoClient = new MongoClient(uri, connectionOptions);
      
      await mongoClient.connect();
      client = mongoClient;
      
      // Get database name from URI or use default
      const dbName = process.env.MONGODB_DATABASE || uri.split("/").pop()?.split("?")[0] || "vairanya";
      db = mongoClient.db(dbName);
      
      console.log(`✅ MongoDB connected successfully to ${hostname} (database: ${dbName})`);
      
      // Clear failure cache on successful connection
      lastFailureTime = null;
      lastFailureHostname = null;
      
      return mongoClient;
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      
      // Cache the failure to avoid repeated retries
      lastFailureTime = Date.now();
      lastFailureHostname = hostname;
      
      // Provide more helpful error messages (only log once per hostname to avoid spam)
      if (errorMessage.includes("ENOTFOUND") || errorMessage.includes("getaddrinfo")) {
        console.error(`❌ MongoDB DNS resolution failed for hostname: ${hostname}`);
        console.error(`   This usually means:`);
        console.error(`   1. The hostname is incorrect or the cluster was deleted`);
        console.error(`   2. Network/DNS issues (check internet connection)`);
        console.error(`   3. The MongoDB Atlas cluster is paused or doesn't exist`);
        console.error(`   Please verify your MONGODB_URI environment variable.`);
        console.error(`   To disable MongoDB entirely, set MONGODB_DISABLED=true`);
        console.error(`   Connection attempts will be cached for 5 minutes to avoid repeated failures.`);
      } else if (errorMessage.includes("authentication failed") || errorMessage.includes("bad auth")) {
        console.error(`❌ MongoDB authentication failed for hostname: ${hostname}`);
        console.error(`   Check your MongoDB username and password.`);
      } else if (errorMessage.includes("timeout")) {
        console.error(`❌ MongoDB connection timeout for hostname: ${hostname}`);
        console.error(`   The server may be unreachable or the network is slow.`);
        console.error(`   To disable MongoDB entirely, set MONGODB_DISABLED=true`);
        console.error(`   Connection attempts will be cached for 5 minutes to avoid repeated failures.`);
      } else if (errorMessage.includes("SSL") || errorMessage.includes("TLS") || errorMessage.includes("alert") || errorMessage.includes("tlsv1")) {
        console.error(`❌ MongoDB SSL/TLS connection error for hostname: ${hostname}`);
        console.error(`   This usually means:`);
        console.error(`   1. The MongoDB Atlas cluster is paused or shut down`);
        console.error(`   2. The cluster needs to be resumed from MongoDB Atlas dashboard`);
        console.error(`   3. SSL certificate issues or network interruption`);
        console.error(`   Error details: ${errorMessage}`);
        console.error(`   Please check your MongoDB Atlas cluster status and resume it if paused.`);
        console.error(`   To disable MongoDB entirely, set MONGODB_DISABLED=true`);
        console.error(`   Connection attempts will be cached for 5 minutes to avoid repeated failures.`);
      } else {
        console.error(`❌ MongoDB connection failed:`, errorMessage);
        console.error(`   Full error:`, error);
      }
      
      client = null;
      db = null;
      connectionPromise = null;
      throw error;
    }
  })();
  
  try {
    await connectionPromise;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "MongoDB connection failed" };
  }
}

/**
 * Get MongoDB database instance
 */
export function getMongoDB(): Db | null {
  return db;
}

/**
 * Check if MongoDB is available
 */
export function isMongoDBAvailable(): boolean {
  if (isMongoDBDisabled) {
    return false;
  }
  return db !== null && client !== null;
}

/**
 * Close MongoDB connection
 */
export async function closeMongoDB(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    connectionPromise = null;
    console.log("MongoDB connection closed");
  }
}

/**
 * Get MongoDB diagnostics
 */
export function getMongoDBDiagnostics() {
  const uri = getMongoUri();
  let hostname = null;
  let maskedUri = null;
  
  if (uri) {
    // Extract hostname
    const hostnameMatch = uri.match(/@([^:/]+)/);
    hostname = hostnameMatch ? hostnameMatch[1] : null;
    
    // Mask password in URI for logging
    maskedUri = uri.replace(/:([^:@]+)@/, ":****@");
  }
  
  // Check which method is being used
  const usingUri = !!process.env.MONGODB_URI;
  const usingConnectionString = !!process.env.MONGODB_CONNECTION_STRING;
  const usingIndividualParts = !!(process.env.MONGODB_HOST && process.env.MONGODB_DATABASE);
  
  return {
    available: isMongoDBAvailable(),
    disabled: isMongoDBDisabled || process.env.MONGODB_DISABLED === "true" || process.env.MONGODB_DISABLED === "1",
    hasConnectionString: !!uri,
    // Which method is configured
    usingUri,
    usingConnectionString,
    usingIndividualParts,
    // Individual parts (masked for security)
    hasHost: !!process.env.MONGODB_HOST,
    host: process.env.MONGODB_HOST || null,
    hasPort: !!process.env.MONGODB_PORT,
    port: process.env.MONGODB_PORT || null,
    hasDatabase: !!process.env.MONGODB_DATABASE,
    database: db?.databaseName || process.env.MONGODB_DATABASE || null,
    hasUsername: !!process.env.MONGODB_USERNAME,
    hasPassword: !!process.env.MONGODB_PASSWORD,
    // Full connection string info
    hostname: hostname,
    maskedUri: maskedUri,
  };
}

