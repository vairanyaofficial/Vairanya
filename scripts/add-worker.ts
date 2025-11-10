// scripts/add-worker.ts
// Run this script to add a worker/admin to the system
// Usage: npx tsx scripts/add-worker.ts

// IMPORTANT: Get your Firebase UID first!
// 1. Sign in to your app with Google
// 2. Open browser console and run: firebase.auth().currentUser.uid
// 3. Copy the UID and paste it below

// Worker/Admin details - UPDATE THESE
const WORKER_UID: string = "YOUR_FIREBASE_UID_HERE"; // ⚠️ UPDATE THIS - Get from Firebase Auth
const WORKER_NAME: string = "Your Name"; // UPDATE THIS
const WORKER_EMAIL: string = "your-email@example.com"; // UPDATE THIS (optional)
const WORKER_ROLE: string = "superadmin"; // "worker", "admin", or "superadmin" (use "superadmin" for first admin)

async function addWorker() {
  try {
    // Check if UID is still placeholder
    if (WORKER_UID === "YOUR_FIREBASE_UID_HERE" || !WORKER_UID || WORKER_UID.trim() === "") {
      console.error("❌ Error: Please update WORKER_UID in the script!");
      console.log("\n📋 How to get your Firebase UID:");
      console.log("   1. Sign in to your app with Google");
      console.log("   2. Open browser console (F12)");
      console.log("   3. Run: firebase.auth().currentUser.uid");
      console.log("   4. Copy the UID and update WORKER_UID in this script");
      console.log("   5. Run the script again: npx tsx scripts/add-worker.ts");
      process.exit(1);
    }

    // Use the shared Firebase Admin initialization
    const { ensureFirebaseInitialized } = await import("../lib/firebaseAdmin.server");
    const { adminFirestore } = await import("../lib/firebaseAdmin.server");
    const { FieldValue } = await import("firebase-admin/firestore");

    // Ensure Firebase is initialized
    const initResult = await ensureFirebaseInitialized();
    if (!initResult.success || !adminFirestore) {
      const errorMsg = initResult.success ? "Unknown error" : (initResult as { success: false; error: string }).error;
      console.error("❌ Firebase Admin initialization failed:", errorMsg);
      console.log("\n💡 Make sure FIREBASE_SERVICE_ACCOUNT_JSON_B64 or FIREBASE_SERVICE_ACCOUNT_JSON is set in .env.local");
      process.exit(1);
    }

    const db = adminFirestore;

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

    // Add worker/admin
    await db.collection("admins").doc(WORKER_UID).set({
      name: WORKER_NAME,
      email: WORKER_EMAIL || "",
      role: WORKER_ROLE,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log("✅ Admin/Worker added successfully!");
    console.log(`   UID: ${WORKER_UID}`);
    console.log(`   Name: ${WORKER_NAME}`);
    console.log(`   Email: ${WORKER_EMAIL || "N/A"}`);
    console.log(`   Role: ${WORKER_ROLE}`);
    console.log("\n🎉 You can now sign in to the admin dashboard!");
    console.log("   Go to: http://localhost:3000/admin/login");
  } catch (error: any) {
    console.error("❌ Error adding admin/worker:", error.message);
    console.error("   Full error:", error);
    process.exit(1);
  }
}

addWorker();

