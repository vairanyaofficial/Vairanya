// app/api/admin/customers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAllCustomers, getCustomerByEmail } from "@/lib/customers-firestore";
import { requireAdmin } from "@/lib/admin-auth-server";

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
    const customers = await getAllCustomers();
    
    return NextResponse.json({
      success: true,
      customers,
    });
  } catch (error: any) {
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

