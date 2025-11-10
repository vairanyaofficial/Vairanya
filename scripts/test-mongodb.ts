// scripts/test-mongodb.ts
// MongoDB connection test script
// Run this to verify your MongoDB configuration

// Load environment variables from .env file
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env file
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local') });

// Set environment to bypass server-only check
process.env.NEXT_RUNTIME = 'nodejs';

import { initializeMongoDB, getMongoDB, getMongoDBDiagnostics, closeMongoDB, isMongoDBAvailable } from "../lib/mongodb.server";

async function testMongoDBConnection() {
  console.log("🔍 Testing MongoDB Connection...\n");
  
  // Display diagnostics
  const diagnostics = getMongoDBDiagnostics();
  console.log("📊 Configuration Diagnostics:");
  console.log("  - MongoDB available:", diagnostics.available);
  console.log("  - MongoDB disabled:", diagnostics.disabled);
  console.log("  - Has connection string:", diagnostics.hasConnectionString);
  console.log();
  
  console.log("📝 Configuration Method:");
  if (diagnostics.usingUri) {
    console.log("  ✓ Using MONGODB_URI (full connection string)");
  } else if (diagnostics.usingConnectionString) {
    console.log("  ✓ Using MONGODB_CONNECTION_STRING");
  } else if (diagnostics.usingIndividualParts) {
    console.log("  ✓ Using individual parts (MONGODB_HOST, MONGODB_DATABASE, etc.)");
  } else {
    console.log("  ✗ No MongoDB configuration found!");
  }
  console.log();
  
  if (diagnostics.usingIndividualParts) {
    console.log("🔧 Individual Parts Configuration:");
    console.log("  - MONGODB_HOST:", diagnostics.host || "NOT SET");
    console.log("  - MONGODB_PORT:", diagnostics.port || "NOT SET (using default)");
    console.log("  - MONGODB_DATABASE:", diagnostics.database || "NOT SET");
    console.log("  - MONGODB_USERNAME:", diagnostics.hasUsername ? "SET" : "NOT SET");
    console.log("  - MONGODB_PASSWORD:", diagnostics.hasPassword ? "SET" : "NOT SET");
    console.log();
  }
  
  if (diagnostics.hostname) {
    console.log("🌐 Connection Details:");
    console.log("  - Hostname:", diagnostics.hostname);
    console.log("  - Database:", diagnostics.database || "not set");
    if (diagnostics.maskedUri) {
      console.log("  - Connection string (masked):", diagnostics.maskedUri);
    }
    console.log();
  }
  
  if (!diagnostics.hasConnectionString && !diagnostics.disabled) {
    console.log("❌ No MongoDB configuration found!");
    console.log();
    console.log("Please set one of the following in your .env.local file:");
    console.log();
    console.log("Option 1: Full connection string (recommended)");
    console.log("  MONGODB_URI=mongodb+srv://username:password@cluster.xxxxx.mongodb.net/database");
    console.log();
    console.log("Option 2: Individual parts");
    console.log("  MONGODB_HOST=cluster.xxxxx.mongodb.net");
    console.log("  MONGODB_DATABASE=your-database-name");
    console.log("  MONGODB_USERNAME=your-username");
    console.log("  MONGODB_PASSWORD=your-password");
    console.log();
    console.log("Option 3: Disable MongoDB");
    console.log("  MONGODB_DISABLED=true");
    console.log();
    process.exit(1);
  }
  
  console.log();

  // Check if connection string is configured
  if (!diagnostics.hasConnectionString) {
    console.error("❌ MongoDB connection string not found!");
    console.error("\nPlease set one of the following environment variables:");
    console.error("  - MONGODB_URI (recommended)");
    console.error("  - MONGODB_CONNECTION_STRING");
    console.error("  - MONGODB_HOST + MONGODB_DATABASE (and optionally MONGODB_USERNAME, MONGODB_PASSWORD)");
    console.error("\nSee docs/MONGODB_SETUP.md for setup instructions.");
    process.exit(1);
  }

  // Try to initialize connection
  console.log("🔄 Initializing MongoDB connection...");
  const initResult = await initializeMongoDB();

  if (!initResult.success) {
    console.error("❌ MongoDB initialization failed!");
    console.error("Error:", initResult.error);
    console.error("\nTroubleshooting tips:");
    console.error("  1. Check if your MongoDB server is running");
    console.error("  2. Verify your connection string is correct");
    console.error("  3. Check if your IP is whitelisted (for MongoDB Atlas)");
    console.error("  4. Verify your username and password are correct");
    console.error("\nSee docs/MONGODB_SETUP.md for troubleshooting guide.");
    process.exit(1);
  }

  console.log("✅ MongoDB connection initialized successfully!");

  // Check if database is available
  if (!isMongoDBAvailable()) {
    console.error("❌ MongoDB database instance not available!");
    process.exit(1);
  }

  const db = getMongoDB();
  if (!db) {
    console.error("❌ Could not get database instance!");
    process.exit(1);
  }

  console.log(`✅ Connected to database: ${db.databaseName}`);

  // Test basic operations
  try {
    console.log("\n🧪 Testing basic operations...");
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log(`✅ Found ${collections.length} collection(s):`);
    collections.forEach((col) => {
      console.log(`   - ${col.name}`);
    });

    // Test a simple operation (list collections - this also verifies connectivity)
    console.log("✅ Connection test successful - database is accessible");

    // Test write operation (insert a test document)
    const testCollection = db.collection("_connection_test");
    const testDoc = {
      test: true,
      timestamp: new Date(),
      message: "MongoDB connection test",
    };
    
    const insertResult = await testCollection.insertOne(testDoc);
    console.log("✅ Write test successful - inserted document ID:", insertResult.insertedId);

    // Test read operation
    const readDoc = await testCollection.findOne({ _id: insertResult.insertedId });
    if (readDoc) {
      console.log("✅ Read test successful - retrieved document");
    }

    // Clean up test document
    await testCollection.deleteOne({ _id: insertResult.insertedId });
    console.log("✅ Cleanup successful - test document removed");

    console.log("\n🎉 All MongoDB tests passed!");
    console.log("\nYour MongoDB connection is working correctly.");
    console.log("You can now use MongoDB in your application.");

  } catch (error: any) {
    console.error("❌ Error during MongoDB operations:");
    console.error("Error:", error.message);
    console.error("\nThis might indicate:");
    console.error("  1. Database permissions issue");
    console.error("  2. Network connectivity problem");
    console.error("  3. MongoDB server configuration issue");
    process.exit(1);
  } finally {
    // Close connection
    await closeMongoDB();
    console.log("\n🔌 MongoDB connection closed.");
  }
}

// Run the test
testMongoDBConnection().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});

