// app/admin/products/new/page.tsx
import React from "react";
import ProductForm from "@/components/ProductForm";
import { getAllCategories } from "@/lib/categories-firestore";
import Link from "next/link";

export default async function NewProductPage() {
  // server-side: load categories from Firestore
  const categories = await getAllCategories();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl">Add New Product</h1>
          <p className="text-gray-600 text-sm">Add product details and categories</p>
        </div>
        <div className="space-x-2">
          <Link href="/admin" className="text-sm text-gray-600 hover:text-[#D4AF37]">
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Pass initialCategories to the client ProductForm */}
      <ProductForm initialCategories={categories} />
    </div>
  );
}
