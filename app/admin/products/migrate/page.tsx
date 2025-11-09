"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getAdminSession } from "@/lib/admin-auth";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle, XCircle, Loader2 } from "lucide-react";

/**
 * Admin page to migrate product images to ImageKit.io
 * This page allows admins to migrate existing product images
 * from various sources (imgBB, Pixabay, etc.) to ImageKit.io
 */
export default function MigrateImagesPage() {
  const { adminInfo } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});

  useEffect(() => {
    if (adminInfo?.role) {
      loadProducts();
    }
  }, [adminInfo]);

  const loadProducts = async () => {
    try {
      const session = getAdminSession();
      if (!session) return;

      const response = await fetch("/api/admin/products", {
        headers: {
          "x-admin-username": session.username,
          "x-admin-role": session.role || "admin",
        },
      });

      const data = await response.json();
      if (data.success && data.products) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error("Failed to load products:", error);
    }
  };

  const needsMigration = (product: any): boolean => {
    if (!product.images || product.images.length === 0) return false;
    return product.images.some(
      (img: string) =>
        !img.includes("imagekit.io") &&
        !img.startsWith("/images/") &&
        img.startsWith("http")
    );
  };

  const migrateProductImages = async (product: any) => {
    if (!needsMigration(product)) {
      alert("This product doesn't need migration (all images are already in ImageKit)");
      return;
    }

    setMigrating(product.product_id);
    try {
      const session = getAdminSession();
      if (!session) {
        throw new Error("Admin session required");
      }

      const response = await fetch("/api/admin/migrate-images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-username": session.username,
          "x-admin-role": session.role || "admin",
        },
        body: JSON.stringify({
          productId: product.product_id,
          imageUrls: product.images,
          folder: "/vairanya/products",
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Update product with migrated URLs
        const updateResponse = await fetch(`/api/admin/products/${product.product_id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-admin-username": session.username,
            "x-admin-role": session.role || "admin",
          },
          body: JSON.stringify({
            images: data.migratedUrls,
          }),
        });

        const updateData = await updateResponse.json();
        if (updateData.success) {
          setResults({
            ...results,
            [product.product_id]: {
              success: true,
              message: data.message,
              migratedUrls: data.migratedUrls,
            },
          });
          // Reload products to show updated images
          loadProducts();
        } else {
          throw new Error(updateData.error || "Failed to update product");
        }
      } else {
        throw new Error(data.error || "Migration failed");
      }
    } catch (error: any) {
      setResults({
        ...results,
        [product.product_id]: {
          success: false,
          error: error.message,
        },
      });
    } finally {
      setMigrating(null);
    }
  };

  const migrateAll = async () => {
    const productsToMigrate = products.filter(needsMigration);
    if (productsToMigrate.length === 0) {
      alert("No products need migration!");
      return;
    }

    if (
      !confirm(
        `Migrate images for ${productsToMigrate.length} product(s)? This may take a while.`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      for (const product of productsToMigrate) {
        await migrateProductImages(product);
        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      alert("Migration complete! Check results below.");
    } catch (error: any) {
      alert(`Migration error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const productsNeedingMigration = products.filter(needsMigration);

  return (
    <div className="min-h-screen bg-white dark:bg-black p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Migrate Images to ImageKit.io</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Migrate existing product images from imgBB, Pixabay, and other sources to ImageKit.io
          </p>
        </div>

        {productsNeedingMigration.length > 0 && (
          <div className="mb-6">
            <Button
              onClick={migrateAll}
              disabled={loading}
              className="bg-[#D4AF37] hover:bg-[#C19B2E] text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Migrating...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Migrate All ({productsNeedingMigration.length} products)
                </>
              )}
            </Button>
          </div>
        )}

        <div className="space-y-4">
          {products.length === 0 ? (
            <p>Loading products...</p>
          ) : productsNeedingMigration.length === 0 ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 inline mr-2" />
              <span className="text-green-800 dark:text-green-200">
                All products are already using ImageKit.io! No migration needed.
              </span>
            </div>
          ) : (
            productsNeedingMigration.map((product) => (
              <div
                key={product.product_id}
                className="border border-gray-200 dark:border-gray-800 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{product.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {product.images?.length || 0} image(s)
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {product.images?.map((img: string, idx: number) => (
                        <span
                          key={idx}
                          className={`text-xs px-2 py-1 rounded ${
                            img.includes("imagekit.io")
                              ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                              : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200"
                          }`}
                        >
                          {img.includes("imagekit.io")
                            ? "ImageKit"
                            : img.includes("ibb.co")
                            ? "imgBB"
                            : img.includes("pixabay")
                            ? "Pixabay"
                            : "Other"}
                        </span>
                      ))}
                    </div>
                    {results[product.product_id] && (
                      <div
                        className={`mt-2 text-sm ${
                          results[product.product_id].success
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {results[product.product_id].success ? (
                          <CheckCircle className="h-4 w-4 inline mr-1" />
                        ) : (
                          <XCircle className="h-4 w-4 inline mr-1" />
                        )}
                        {results[product.product_id].message ||
                          results[product.product_id].error}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => migrateProductImages(product)}
                    disabled={migrating === product.product_id}
                    variant="outline"
                    size="sm"
                  >
                    {migrating === product.product_id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Migrating...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Migrate
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

