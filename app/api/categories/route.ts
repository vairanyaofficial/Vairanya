// app/api/categories/route.ts
import { NextResponse } from "next/server";
import { getAllCategories, addCategory } from "@/lib/categories-firestore";

export async function GET() {
  try {
    const categories = await getAllCategories();
    return NextResponse.json({ success: true, categories });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to load categories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name } = body;
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Invalid category name" }, { status: 400 });
    }
    const updated = await addCategory(name);
    return NextResponse.json({ success: true, categories: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to add category" }, { status: 500 });
  }
}
