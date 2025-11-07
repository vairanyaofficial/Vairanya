// scripts/add-worker.ts
// Run this script to add a worker to the system
// Usage: npx tsx scripts/add-worker.ts

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Worker details - UPDATE THESE
const WORKER_UID = "XA6zxFhsnHg6A3P9eZxGIwLOLn43";
const WORKER_NAME = "Worker Name"; // UPDATE THIS
const WORKER_EMAIL = "worker@example.com"; // UPDATE THIS (optional)
const WORKER_ROLE = "worker"; // "worker", "admin", or "superadmin"

async function addWorker() {
  try {
    // Initialize Firebase Admin
    let app;
    if (getApps().length === 0) {
      // Try to use environment variable for service account
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      if (serviceAccountJson) {
        const serviceAccount = JSON.parse(serviceAccountJson);
        app = initializeApp({
          credential: cert(serviceAccount),
        });
      } else {
        // Use default credentials
        app = initializeApp();
      }
    } else {
      app = getApps()[0];
    }

    const db = getFirestore(app);

    // Check if worker already exists
    const existingDoc = await db.collection("admins").doc(WORKER_UID).get();
    if (existingDoc.exists) {
      const data = existingDoc.data();
      console.log("✅ Worker already exists:");
      console.log(`   UID: ${WORKER_UID}`);
      console.log(`   Name: ${data?.name || "N/A"}`);
      console.log(`   Email: ${data?.email || "N/A"}`);
      console.log(`   Role: ${data?.role || "N/A"}`);
      return;
    }

    // Add worker
    await db.collection("admins").doc(WORKER_UID).set({
      name: WORKER_NAME,
      email: WORKER_EMAIL || "",
      role: WORKER_ROLE,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log("✅ Worker added successfully!");
    console.log(`   UID: ${WORKER_UID}`);
    console.log(`   Name: ${WORKER_NAME}`);
    console.log(`   Email: ${WORKER_EMAIL || "N/A"}`);
    console.log(`   Role: ${WORKER_ROLE}`);
  } catch (error: any) {
    console.error("❌ Error adding worker:", error.message);
    process.exit(1);
  }
}

addWorker();

