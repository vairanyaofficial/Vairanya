// scripts/add-first-admin.ts
// Script to add the first admin user to MongoDB
// This bypasses authentication since there are no admins yet
// Usage: npx tsx scripts/add-first-admin.ts

import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";
import * as readline from "readline";

// Load environment variables
dotenv.config({ path: ".env" });

interface AdminUser {
  email: string;
  name: string;
  role: "superadmin" | "admin" | "worker";
  uid?: string;
  createdAt: Date;
  updatedAt: Date;
}

async function addFirstAdmin() {
  // Get MongoDB connection string
  const mongodbUri =
    process.env.MONGODB_URI ||
    process.env.MONGODB_CONNECTION_STRING ||
    process.env.DATABASE_URI ||
    process.env.DATABASE_URL;

  if (!mongodbUri) {
    console.error("❌ MongoDB URI not found in environment variables");
    console.error("Please set MONGODB_URI, MONGODB_CONNECTION_STRING, DATABASE_URI, or DATABASE_URL");
    process.exit(1);
  }

  // Get admin details from environment or command line
  const adminEmail = process.env.FIRST_ADMIN_EMAIL || process.argv[2];
  const adminName = process.env.FIRST_ADMIN_NAME || process.argv[3] || "Super Admin";
  const adminRole = (process.env.FIRST_ADMIN_ROLE || process.argv[4] || "superadmin") as "superadmin" | "admin" | "worker";
  const adminUid = process.env.FIRST_ADMIN_UID || process.argv[5];

  if (!adminEmail) {
    console.error("❌ Admin email is required");
    console.error("\nUsage:");
    console.error("  npx tsx scripts/add-first-admin.ts <email> [name] [role] [uid]");
    console.error("\nOr set environment variables:");
    console.error("  FIRST_ADMIN_EMAIL=your-email@example.com");
    console.error("  FIRST_ADMIN_NAME=Your Name (optional)");
    console.error("  FIRST_ADMIN_ROLE=superadmin (optional, default: superadmin)");
    console.error("  FIRST_ADMIN_UID=your-uid (optional)");
    console.error("\nExample:");
    console.error("  npx tsx scripts/add-first-admin.ts admin@example.com \"Admin Name\" superadmin");
    process.exit(1);
  }

  // Validate role
  const validRoles = ["superadmin", "admin", "worker"];
  if (!validRoles.includes(adminRole)) {
    console.error(`❌ Invalid role: ${adminRole}`);
    console.error(`Valid roles: ${validRoles.join(", ")}`);
    process.exit(1);
  }

  console.log("🔄 Connecting to MongoDB...");
  const maskedUri = mongodbUri.replace(/:[^:@]+@/, ":****@");
  console.log(`   URI: ${maskedUri}`);

  let client: MongoClient | null = null;

  try {
    // Extract database name from URI or use default
    let dbName = process.env.MONGODB_DATABASE;
    
    if (!dbName) {
      // Parse URI to extract database name
      // Format: mongodb+srv://user:pass@host/dbname?options
      // Or: mongodb+srv://user:pass@host.net/?options (no db name)
      try {
        // Use the same logic as mongodb.server.ts
        // Split by /, take last part, then split by ? to remove query params
        // But make sure we're not getting the hostname (which contains dots)
        const uriParts = mongodbUri.split("/");
        
        // Check if URI has a database name (should have at least 4 parts: protocol, empty, host, dbname)
        if (uriParts.length >= 4) {
          // Database name should be after the host (index 3 or later)
          const dbPart = uriParts[uriParts.length - 1];
          if (dbPart && !dbPart.startsWith("?")) {
            // Remove query parameters
            dbName = dbPart.split("?")[0].trim();
            // Check if it's actually a database name (not hostname with dots)
            if (dbName.includes(".") || dbName.includes("@")) {
              // This looks like a hostname, not a database name
              dbName = "";
            }
          }
        }
        
        // If no valid database name found, use default
        if (!dbName || dbName === "" || dbName.includes(".")) {
          dbName = "vairanya";
        }
      } catch (err) {
        // If parsing fails, use default
        console.warn("⚠️  Could not parse database name from URI, using default: vairanya");
        dbName = "vairanya";
      }
    }
    
    // Use default if still empty or just whitespace
    if (!dbName || dbName.trim() === "") {
      dbName = "vairanya";
    }

    // Clean the database name (remove any invalid characters)
    const cleanDbName = dbName.trim();
    
    console.log(`   Database: ${cleanDbName}`);

    // Validate database name (MongoDB restrictions)
    if (!cleanDbName) {
      console.error("❌ Database name cannot be empty");
      console.error("Please set MONGODB_DATABASE environment variable with a valid database name");
      process.exit(1);
    }
    
    if (cleanDbName.includes(".") || cleanDbName.includes(" ") || cleanDbName.includes("/") || cleanDbName.includes("\\")) {
      console.error(`❌ Invalid database name: "${cleanDbName}"`);
      console.error("Database names cannot contain: . (dot), spaces, /, or \\");
      console.error("Please set MONGODB_DATABASE environment variable with a valid database name");
      console.error(`   Example: MONGODB_DATABASE=vairanya`);
      process.exit(1);
    }

    // Connect to MongoDB
    client = new MongoClient(mongodbUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
    });

    await client.connect();
    console.log("✅ Connected to MongoDB");
    console.log(`   Database: ${cleanDbName}`);

    const db = client.db(cleanDbName);
    const adminCollection = db.collection("Admin");

    // Check if admin already exists (case-insensitive)
    const normalizedEmail = adminEmail.toLowerCase().trim();
    const existingAdmin = await adminCollection.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") },
    });
    if (existingAdmin) {
      console.log(`⚠️  Admin with email ${adminEmail} already exists`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log(`   Name: ${existingAdmin.name}`);
      console.log(`   UID: ${existingAdmin.uid || "Not set"}`);
      
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await new Promise<string>((resolve) => {
        rl.question("Do you want to update this admin? (y/n): ", resolve);
      });
      rl.close();

      if (answer.toLowerCase() !== "y" && answer.toLowerCase() !== "yes") {
        console.log("❌ Cancelled");
        process.exit(0);
      }

      // Update existing admin (normalize email)
      const now = new Date();
      await adminCollection.updateOne(
        { email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") } },
        {
          $set: {
            email: normalizedEmail, // Update to normalized email
            name: adminName,
            role: adminRole,
            updatedAt: now,
            ...(adminUid && { uid: adminUid }),
          },
        }
      );

      console.log("✅ Admin updated successfully");
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Name: ${adminName}`);
      console.log(`   Role: ${adminRole}`);
      if (adminUid) {
        console.log(`   UID: ${adminUid}`);
      }
    } else {
      // Create new admin (normalize email to lowercase)
      const now = new Date();
      const normalizedEmail = adminEmail.toLowerCase().trim();
      const adminDoc: AdminUser = {
        email: normalizedEmail,
        name: adminName,
        role: adminRole,
        createdAt: now,
        updatedAt: now,
        ...(adminUid && { uid: adminUid }),
      };

      await adminCollection.insertOne(adminDoc);

      console.log("✅ Admin added successfully");
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Name: ${adminName}`);
      console.log(`   Role: ${adminRole}`);
      if (adminUid) {
        console.log(`   UID: ${adminUid}`);
      }
    }

    // List all admins
    console.log("\n📋 All admins in database:");
    const allAdmins = await adminCollection.find({}).toArray();
    allAdmins.forEach((admin, index) => {
      console.log(`   ${index + 1}. ${admin.email} (${admin.role}) - ${admin.name}`);
    });

    console.log("\n✅ Done! You can now login at /admin/login");
    console.log(`   Use email: ${adminEmail}`);
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log("\n🔌 MongoDB connection closed");
    }
  }
}

// Run the script
addFirstAdmin().catch((error) => {
  console.error("❌ Unhandled error:", error);
  process.exit(1);
});

