// app/api/customer/sync/route.ts - Sync customer data to Firestore
import { NextRequest, NextResponse } from "next/server";
import { syncCustomerToFirestore } from "@/lib/customer-sync";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, phone, userId } = body;

    if (!email || !name) {
      return NextResponse.json(
        { success: false, error: "Email and name are required" },
        { status: 400 }
      );
    }

    await syncCustomerToFirestore(email, name, phone, userId);

    return NextResponse.json({
      success: true,
      message: "Customer synced successfully",
    });
  } catch (error: any) {
    console.error("Error syncing customer:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to sync customer",
        message: String(error?.message || error),
      },
      { status: 500 }
    );
  }
}

