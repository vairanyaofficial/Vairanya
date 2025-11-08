"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import ProductForm from "@/components/ProductForm";
import type { Product } from "@/lib/products-types";
import { getAdminSession } from "@/lib/admin-auth";
import { useToast } from "@/components/ToastProvider";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    const session = getAdminSession();
    if (!session) {
      showError("Not authenticated");
      router.push("/login?mode=admin");
      return;
    }

    fetch(`/api/admin/products/${productId}`, {
      headers: {
        "x-admin-username": session.username,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProduct(data.product);
        } else {
          showError("Product not found");
          router.push("/admin/products");
        }
      })
      .catch(() => {
        showError("Failed to load product");
        router.push("/admin/products");
      })
      .finally(() => setIsLoading(false));
  }, [productId, router, showError]);

  const handleSubmit = async (updatedProduct: Partial<Product>) => {
    setIsSaving(true);
    try {
      const session = getAdminSession();
      if (!session) {
        showError("Not authenticated");
        setIsSaving(false);
        return;
      }

      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-username": session.username,
        },
        body: JSON.stringify(updatedProduct),
      });

      const data = await response.json();
      if (data.success) {
        showSuccess("Product updated successfully");
        // Refresh router cache and navigate
        router.refresh();
        router.push("/admin/products");
      } else {
        showError(data.error || "Failed to update product");
        setIsSaving(false);
      }
    } catch (error) {
      showError("Failed to update product");
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div>
      <h1 className="font-serif text-3xl mb-8">Edit Product</h1>
      <ProductForm product={product} onSubmit={handleSubmit} isSaving={isSaving} />
    </div>
  );
}

