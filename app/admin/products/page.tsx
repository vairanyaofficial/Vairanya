"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Eye, Package, CheckSquare, Square } from "lucide-react";
import type { Product } from "@/lib/products-types";
import {
  canCreateProduct,
  canDeleteProduct,
  canEditProduct,
  getAdminSession,
} from "@/lib/admin-auth";
import { useToast } from "@/components/ToastProvider";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const { showError, showSuccess } = useToast();

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const session = getAdminSession();
      if (!session) {
        setError("Not authenticated");
        return;
      }

      const response = await fetch("/api/admin/products", {
        headers: {
          "x-admin-username": session.username,
          "x-admin-role": session.role,
        },
      });
      const data = await response.json();
      if (data.success) {
        setProducts(data.products || []);
        setError(""); // Clear any previous errors
      } else {
        const errorMsg = data.error || data.message || "Failed to load products";
        setError(errorMsg);
        
        // If database unavailable, show helpful message
        if (errorMsg.includes("Database unavailable") || errorMsg.includes("MongoDB")) {
          setError("Database connection unavailable. Please check your MongoDB connection.");
        }
      }
    } catch (err: any) {
      setError(`Failed to load products: ${err.message || "Network error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    
    // Refresh when page comes into focus (user navigates back)
    const handleFocus = () => {
      loadProducts();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Handle single product selection
  const handleSelectProduct = (productId: string) => {
    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map((p) => p.product_id)));
    }
  };

  // Handle single product delete
  const handleDelete = async (productId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      const session = getAdminSession();
      if (!session) {
        showError("Not authenticated");
        return;
      }

      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
        headers: {
          "x-admin-username": session.username,
          "x-admin-role": session.role,
        },
      });
      const data = await response.json();
      if (data.success) {
        setSelectedProducts((prev) => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
        loadProducts();
        showSuccess("Product deleted successfully");
      } else {
        showError(data.error || "Failed to delete product");
      }
    } catch (err) {
      showError("Failed to delete product");
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) {
      showError("Please select at least one product to delete");
      return;
    }

    const productTitles = products
      .filter((p) => selectedProducts.has(p.product_id))
      .map((p) => p.title)
      .join(", ");

    if (!confirm(`Are you sure you want to delete ${selectedProducts.size} product(s)?\n\n${productTitles}`)) {
      return;
    }

    try {
      setIsDeleting(true);
      const session = getAdminSession();
      if (!session) {
        showError("Not authenticated");
        return;
      }

      // Delete products one by one
      const deletePromises = Array.from(selectedProducts).map(async (productId) => {
        const response = await fetch(`/api/admin/products/${productId}`, {
          method: "DELETE",
          headers: {
            "x-admin-username": session.username,
            "x-admin-role": session.role,
          },
        });
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || `Failed to delete product ${productId}`);
        }
        return productId;
      });

      await Promise.all(deletePromises);
      
      const deletedCount = selectedProducts.size;
      setSelectedProducts(new Set());
      loadProducts();
      showSuccess(`${deletedCount} product(s) deleted successfully`);
    } catch (err: any) {
      showError(err.message || "Failed to delete products");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="px-2 sm:px-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6">
          <h1 className="font-serif text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-900 dark:text-white">Products</h1>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {selectedProducts.size > 0 && canDeleteProduct() && (
              <Button
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white text-sm sm:text-base md:text-lg px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 flex-1 sm:flex-none"
              >
                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 mr-1.5 sm:mr-2 md:mr-2.5" />
                <span className="hidden xs:inline">Delete ({selectedProducts.size})</span>
                <span className="xs:hidden">Del ({selectedProducts.size})</span>
              </Button>
            )}
            {canCreateProduct() && (
              <Button asChild className="bg-[#D4AF37] hover:bg-[#C19B2E] text-sm sm:text-base md:text-lg px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 flex-1 sm:flex-none">
                <Link href="/admin/products/new">
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 mr-1.5 sm:mr-2 md:mr-2.5" />
                  <span className="hidden sm:inline">Add Product</span>
                  <span className="sm:hidden">Add</span>
                </Link>
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-3 rounded mb-3 sm:mb-4 md:mb-6 text-xs sm:text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-6 sm:p-8 md:p-12 text-center border dark:border-white/10">
            <p className="text-xs sm:text-sm md:text-base text-gray-500 dark:text-gray-400">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-6 sm:p-8 md:p-12 text-center border dark:border-white/10">
            <Package className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-gray-300 dark:text-gray-700 mx-auto mb-2 sm:mb-3 md:mb-4" />
            <p className="text-xs sm:text-sm md:text-base text-gray-500 dark:text-gray-400 mb-2 sm:mb-3 md:mb-4">No products found</p>
            {canCreateProduct() && (
              <Button asChild className="bg-[#D4AF37] hover:bg-[#C19B2E] text-xs sm:text-sm">
                <Link href="/admin/products/new">Add Your First Product</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm border dark:border-white/10 overflow-hidden">
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-[#0a0a0a] border-b dark:border-white/10">
                  <tr>
                    {canDeleteProduct() && (
                      <th className="pl-3 sm:pl-4 md:pl-4 pr-2 sm:pr-3 md:pr-3 py-2 sm:py-2.5 md:py-3 text-left text-xs sm:text-sm md:text-base font-medium text-gray-500 dark:text-gray-400 uppercase w-8 sm:w-10 md:w-12">
                        <button
                          onClick={handleSelectAll}
                          className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 border border-gray-300 dark:border-white/20 rounded hover:border-[#D4AF37] dark:hover:border-[#D4AF37] transition-colors bg-white dark:bg-[#0a0a0a]"
                          title={selectedProducts.size === products.length ? "Deselect all" : "Select all"}
                        >
                          {selectedProducts.size === products.length && products.length > 0 ? (
                            <CheckSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-[#D4AF37]" />
                          ) : (
                            <Square className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-gray-400 dark:text-gray-500" />
                          )}
                        </button>
                      </th>
                    )}
                    <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-left text-xs sm:text-sm md:text-base font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Product
                    </th>
                    <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-left text-xs sm:text-sm md:text-base font-medium text-gray-500 dark:text-gray-400 uppercase hidden lg:table-cell">
                      Category
                    </th>
                    <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-left text-xs sm:text-sm md:text-base font-medium text-gray-500 dark:text-gray-400 uppercase hidden lg:table-cell">
                      Price
                    </th>
                    <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-left text-xs sm:text-sm md:text-base font-medium text-gray-500 dark:text-gray-400 uppercase hidden md:table-cell">
                      Stock
                    </th>
                    <th className="px-2 sm:px-3 md:px-4 pr-3 sm:pr-4 md:pr-4 py-2 sm:py-2.5 md:py-3 text-right text-xs sm:text-sm md:text-base font-medium text-gray-500 dark:text-gray-400 uppercase w-20 sm:w-24 md:w-28">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#0a0a0a] divide-y divide-gray-200 dark:divide-white/10">
                  {products.map((product) => (
                    <tr 
                      key={product.product_id} 
                      className={`hover:bg-gray-50 dark:hover:bg-white/5 ${selectedProducts.has(product.product_id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                    >
                      {canDeleteProduct() && (
                        <td className="pl-3 sm:pl-4 md:pl-4 pr-2 sm:pr-3 md:pr-3 py-2 sm:py-2.5 md:py-3 whitespace-nowrap">
                          <button
                            onClick={() => handleSelectProduct(product.product_id)}
                            className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 border border-gray-300 dark:border-white/20 rounded hover:border-[#D4AF37] dark:hover:border-[#D4AF37] transition-colors bg-white dark:bg-[#0a0a0a]"
                            title={selectedProducts.has(product.product_id) ? "Deselect" : "Select"}
                          >
                            {selectedProducts.has(product.product_id) ? (
                              <CheckSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-[#D4AF37]" />
                            ) : (
                              <Square className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-gray-400 dark:text-gray-500" />
                            )}
                          </button>
                        </td>
                      )}
                      <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3">
                        <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3">
                          <div className="flex-shrink-0 h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 lg:h-20 lg:w-20 bg-gray-100 dark:bg-[#1a1a1a] rounded overflow-hidden">
                            {product.images && product.images.length > 0 ? (
                              <img
                                src={product.images[0]}
                                alt={product.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <Package className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-10 lg:w-10 text-gray-400 dark:text-gray-600" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs sm:text-sm md:text-base lg:text-lg font-medium text-gray-900 dark:text-white truncate leading-tight">
                              {product.title}
                            </div>
                            <div className="text-[10px] sm:text-xs md:text-sm lg:text-base text-gray-500 dark:text-gray-400 truncate leading-tight mt-0.5">{product.sku}</div>
                            <div className="text-[10px] sm:text-xs md:text-sm lg:text-base text-gray-500 dark:text-gray-400 capitalize lg:hidden mt-1 leading-tight">{product.category}</div>
                            <div className="text-[10px] sm:text-xs md:text-sm lg:text-base lg:hidden mt-1 flex items-center gap-2 leading-tight">
                              <span className={`${product.stock_qty > 0 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}>
                                {product.stock_qty}
                              </span>
                              <span className="text-gray-900 dark:text-white font-medium">
                                ₹{product.price}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 hidden lg:table-cell">
                        <span className="text-sm sm:text-base md:text-lg text-gray-900 dark:text-white capitalize">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 hidden lg:table-cell">
                        <span className="text-sm sm:text-base md:text-lg font-medium text-gray-900 dark:text-white">
                          ₹{product.price}
                        </span>
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 hidden md:table-cell">
                        <span
                          className={`text-sm sm:text-base md:text-lg ${
                            product.stock_qty > 0 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"
                          }`}
                        >
                          {product.stock_qty}
                        </span>
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 pr-3 sm:pr-4 md:pr-4 py-2 sm:py-2.5 md:py-3 text-right">
                        <div className="flex items-center justify-end gap-1 sm:gap-1.5 md:gap-2">
                          <Link
                            href={`/products/${product.slug}`}
                            target="_blank"
                            className="text-gray-600 dark:text-gray-400 hover:text-[#D4AF37] dark:hover:text-[#D4AF37] p-1 sm:p-1.5 md:p-2 rounded hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                            title="View"
                          >
                            <Eye className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                          </Link>
                          {canEditProduct() && (
                            <Link
                              href={`/admin/products/${product.product_id}/edit`}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1 sm:p-1.5 md:p-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                            </Link>
                          )}
                          {canDeleteProduct() && (
                            <button
                              onClick={() =>
                                handleDelete(product.product_id, product.title)
                              }
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1 sm:p-1.5 md:p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
  );
}

