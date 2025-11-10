// app/api/admin/customers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAllCustomers, getCustomerByEmail } from "@/lib/customers-mongodb";
import { requireAdmin } from "@/lib/admin-auth-server";
import { initializeMongoDB } from "@/lib/mongodb.server";

// GET - Fetch all customers
export async function GET(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // Initialize MongoDB connection
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      console.error("[Admin Customers API] MongoDB initialization failed:", mongoInit.error);
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 503 }
      );
    }

    console.log("[Admin Customers API] Fetching all customers...");
    const customers = await getAllCustomers();
    console.log(`[Admin Customers API] Retrieved ${customers.length} customers`);
    
    return NextResponse.json({
      success: true,
      customers,
    });
  } catch (error: any) {
    console.error("[Admin Customers API] Error fetching customers:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch customers",
        message: String(error?.message || error),
      },
      { status: 500 }
    );
  }
}

