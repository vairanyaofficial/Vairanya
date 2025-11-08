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
        setProducts(data.products);
      } else {
        setError(data.error || "Failed to load products");
      }
    } catch (err) {
      setError("Failed to load products");
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
    <div>
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-3xl">Products</h1>
          <div className="flex items-center gap-3">
            {selectedProducts.size > 0 && canDeleteProduct() && (
              <Button
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected ({selectedProducts.size})
              </Button>
            )}
            {canCreateProduct() && (
              <Button asChild className="bg-[#D4AF37] hover:bg-[#C19B2E]">
                <Link href="/admin/products/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Product
                </Link>
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No products found</p>
            {canCreateProduct() && (
              <Button asChild className="bg-[#D4AF37] hover:bg-[#C19B2E]">
                <Link href="/admin/products/new">Add Your First Product</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {canDeleteProduct() && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                        <button
                          onClick={handleSelectAll}
                          className="flex items-center justify-center w-5 h-5 border border-gray-300 rounded hover:border-[#D4AF37] transition-colors"
                          title={selectedProducts.size === products.length ? "Deselect all" : "Select all"}
                        >
                          {selectedProducts.size === products.length && products.length > 0 ? (
                            <CheckSquare className="h-4 w-4 text-[#D4AF37]" />
                          ) : (
                            <Square className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr 
                      key={product.product_id} 
                      className={`hover:bg-gray-50 ${selectedProducts.has(product.product_id) ? 'bg-blue-50' : ''}`}
                    >
                      {canDeleteProduct() && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleSelectProduct(product.product_id)}
                            className="flex items-center justify-center w-5 h-5 border border-gray-300 rounded hover:border-[#D4AF37] transition-colors"
                            title={selectedProducts.has(product.product_id) ? "Deselect" : "Select"}
                          >
                            {selectedProducts.has(product.product_id) ? (
                              <CheckSquare className="h-4 w-4 text-[#D4AF37]" />
                            ) : (
                              <Square className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12 bg-gray-100 rounded overflow-hidden">
                            {product.images && product.images.length > 0 ? (
                              <img
                                src={product.images[0]}
                                alt={product.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <Package className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {product.title}
                            </div>
                            <div className="text-sm text-gray-500">{product.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 capitalize">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          ₹{product.price}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-sm ${
                            product.stock_qty > 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {product.stock_qty}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            product.stock_qty > 0
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {product.stock_qty > 0 ? "In Stock" : "Out of Stock"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/products/${product.slug}`}
                            target="_blank"
                            className="text-gray-600 hover:text-[#D4AF37]"
                            title="View on site"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          {canEditProduct() && (
                            <Link
                              href={`/admin/products/${product.product_id}/edit`}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                          )}
                          {canDeleteProduct() && (
                            <button
                              onClick={() =>
                                handleDelete(product.product_id, product.title)
                              }
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
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

