// Script to fix existing orders with null orderNumber values
// Run with: npx tsx scripts/fix-null-order-numbers.ts

import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_CONNECTION_STRING;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI or MONGODB_CONNECTION_STRING not found in environment variables");
  process.exit(1);
}

async function fixNullOrderNumbers() {
  // TypeScript assertion: MONGODB_URI is guaranteed to be string after the check above
  const client = new MongoClient(MONGODB_URI as string);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db();
    const collection = db.collection("Order");

    // Find all orders with null orderNumber or order_number
    const ordersWithNull = await collection.find({
      $or: [
        { orderNumber: null },
        { orderNumber: { $exists: false } },
        { order_number: null },
        { order_number: { $exists: false } },
      ],
    }).toArray();

    console.log(`📦 Found ${ordersWithNull.length} orders with null order numbers`);

    if (ordersWithNull.length === 0) {
      console.log("✅ No orders need fixing!");
      return;
    }

    let fixed = 0;
    for (const order of ordersWithNull) {
      const today = new Date();
      const year = today.getFullYear();
      const timestamp = order._id.getTimestamp().getTime() || Date.now();
      const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const orderNumber = `ORD-${year}-${String(timestamp).slice(-6)}-${randomSuffix}`;

      // Check if this order number already exists
      const existing = await collection.findOne({
        $or: [
          { order_number: orderNumber },
          { orderNumber: orderNumber },
        ],
      });

      if (existing && existing._id.toString() !== order._id.toString()) {
        // If duplicate, use _id as fallback
        const fallbackNumber = `ORD-${year}-${order._id.toString().slice(-6)}-${randomSuffix}`;
        await collection.updateOne(
          { _id: order._id },
          {
            $set: {
              order_number: fallbackNumber,
              orderNumber: fallbackNumber,
            },
          }
        );
        console.log(`✅ Fixed order ${order._id}: ${fallbackNumber}`);
      } else {
        await collection.updateOne(
          { _id: order._id },
          {
            $set: {
              order_number: orderNumber,
              orderNumber: orderNumber,
            },
          }
        );
        console.log(`✅ Fixed order ${order._id}: ${orderNumber}`);
      }
      fixed++;
    }

    console.log(`\n✅ Successfully fixed ${fixed} orders!`);
  } catch (error) {
    console.error("❌ Error fixing orders:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("✅ Disconnected from MongoDB");
  }
}

fixNullOrderNumbers();

