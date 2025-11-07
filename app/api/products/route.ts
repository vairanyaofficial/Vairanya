import { NextResponse } from "next/server";
import { getAllProducts } from "@/lib/products-firestore";

export async function GET() {
  try {
    // Fetch products from Firestore
    const products = await getAllProducts();
    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
