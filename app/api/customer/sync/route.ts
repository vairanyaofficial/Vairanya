// app/api/customer/sync/route.ts - Sync customer data to MongoDB
import { NextRequest, NextResponse } from "next/server";
import { syncCustomerToFirestore } from "@/lib/customer-sync";
import { initializeMongoDB } from "@/lib/mongodb.server";

export async function POST(request: NextRequest) {
  try {
    // Initialize MongoDB connection
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      // Don't fail the request - customer sync is non-blocking
      console.warn("[Customer Sync API] MongoDB not available, skipping sync");
      return NextResponse.json({
        success: true,
        message: "Customer sync skipped (database unavailable)",
      });
    }

    const body = await request.json();
    const { email, name, phone, userId, photoURL } = body;

    if (!email || !name) {
      return NextResponse.json(
        { success: false, error: "Email and name are required" },
        { status: 400 }
      );
    }

    console.log(`[Customer Sync API] Syncing customer: ${email}`);
    await syncCustomerToFirestore(email, name, phone, userId, photoURL);
    console.log(`[Customer Sync API] Customer synced successfully: ${email}`);

    return NextResponse.json({
      success: true,
      message: "Customer synced successfully",
    });
  } catch (error: any) {
    // Don't fail the request - customer sync should not block login/registration
    console.error("[Customer Sync API] Error syncing customer:", error);
    return NextResponse.json(
      {
        success: true, // Return success even on error to not block login
        message: "Customer sync attempted (may have failed)",
        error: String(error?.message || error),
      },
      { status: 200 } // Return 200 instead of 500 to not block login
    );
  }
}

