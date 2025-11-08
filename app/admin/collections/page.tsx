"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Star,
  Eye,
  X,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAdminSession, isAdminAuthenticated } from "@/lib/admin-auth";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import type { Collection } from "@/lib/collections-types";
import type { Product } from "@/lib/products-types";

export default function CollectionsPage() {
  const router = useRouter();
  const { user, adminInfo } = useAuth();
  const { showSuccess, showError } = useToast();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    short_description: "",
    product_ids: [] as string[],
    is_featured: false,
    is_active: true,
    slug: "",
    display_order: 0,
  });

  useEffect(() => {
    if (user && !adminInfo) {
      router.replace("/");
      return;
    }
    
    if (!isAdminAuthenticated()) {
      router.replace("/login?mode=admin");
      return;
    }
    
    loadCollections();
    loadProducts();
    
    // Refresh when page comes into focus
    const handleFocus = () => {
      loadCollections();
      loadProducts();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [router, user, adminInfo]);

  const loadCollections = async () => {
    try {
      setIsLoading(true);
      const sessionData = getAdminSession();
      if (!sessionData) {
        return;
      }

      const res = await fetch("/api/admin/collections", {
        headers: { "x-admin-username": sessionData.username },
      });

      const data = await res.json();
      if (data.success) {
        setCollections(data.collections);
      }
    } catch (err) {
      console.error("Failed to load collections:", err);
      showError("Failed to load collections");
    } finally {
      setIsLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const sessionData = getAdminSession();
      if (!sessionData) {
        return;
      }

      const res = await fetch("/api/admin/products", {
        headers: { "x-admin-username": sessionData.username },
      });

      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error("Failed to load products:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const sessionData = getAdminSession();
      if (!sessionData) {
        return;
      }

      // Generate slug from name if not provided
      let slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

      const collectionData: any = {
        name: formData.name,
        description: formData.description || "",
        short_description: formData.short_description || "",
        image: "", // Banner image removed
        product_ids: formData.product_ids,
        is_featured: formData.is_featured,
        is_active: formData.is_active,
        slug: slug,
        display_order: formData.display_order || 0,
      };

      let response;
      if (editingCollection) {
        response = await fetch("/api/admin/collections", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-admin-username": sessionData.username,
          },
          body: JSON.stringify({ id: editingCollection.id, ...collectionData }),
        });
      } else {
        response = await fetch("/api/admin/collections", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-username": sessionData.username,
          },
          body: JSON.stringify(collectionData),
        });
      }

      const data = await response.json();
      if (data.success) {
        showSuccess(editingCollection ? "Collection updated successfully" : "Collection created successfully");
        setShowForm(false);
        setEditingCollection(null);
        resetForm();
        loadCollections();
      } else {
        const errorMsg = data.message || data.error || "Failed to save collection";
        console.error("Collection save error:", errorMsg);
        showError(errorMsg);
      }
    } catch (err: any) {
      console.error("Collection save exception:", err);
      showError(err?.message || "Failed to save collection");
    }
  };

  const handleEdit = (collection: Collection) => {
    setEditingCollection(collection);
    setFormData({
      name: collection.name,
      description: collection.description || "",
      short_description: collection.short_description || "",
      product_ids: collection.product_ids || [],
      is_featured: collection.is_featured || false,
      is_active: collection.is_active !== false,
      slug: collection.slug || "",
      display_order: collection.display_order || 0,
    });
    setShowForm(true);
  };

  const handleDelete = async (collectionId: string) => {
    if (!confirm("Are you sure you want to delete this collection?")) {
      return;
    }

    try {
      const sessionData = getAdminSession();
      if (!sessionData) {
        return;
      }

      const response = await fetch(`/api/admin/collections?id=${collectionId}`, {
        method: "DELETE",
        headers: { "x-admin-username": sessionData.username },
      });

      const data = await response.json();
      if (data.success) {
        showSuccess("Collection deleted successfully");
        loadCollections();
      } else {
        showError(data.error || "Failed to delete collection");
      }
    } catch (err) {
      showError("Failed to delete collection");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      short_description: "",
      product_ids: [],
      is_featured: false,
      is_active: true,
      slug: "",
      display_order: 0,
    });
  };

  const toggleProduct = (productId: string) => {
    setFormData((prev) => ({
      ...prev,
      product_ids: prev.product_ids.includes(productId)
        ? prev.product_ids.filter((id) => id !== productId)
        : [...prev.product_ids, productId],
    }));
  };

  const getProductById = (productId: string) => {
    return products.find((p) => p.product_id === productId);
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading collections...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl mb-2">Collections</h1>
          <p className="text-gray-600">Create and manage product collections</p>
        </div>
        <Button
          onClick={() => {
            setShowForm(true);
            setEditingCollection(null);
            resetForm();
          }}
          className="bg-[#D4AF37] hover:bg-[#C19B2E]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Collection
        </Button>
      </div>

      {/* Collection Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="font-serif text-xl">
                {editingCollection ? "Edit Collection" : "Create New Collection"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingCollection(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Collection Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      // Auto-generate slug from name if slug is empty
                      if (!formData.slug || formData.slug === editingCollection?.slug) {
                        const autoSlug = e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                        setFormData((prev) => ({ ...prev, slug: autoSlug }));
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    placeholder="e.g., Christmas Collection"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    placeholder="e.g., christmas-collection"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Short Description
                </label>
                <input
                  type="text"
                  value={formData.short_description}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  placeholder="Brief description for display"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  rows={3}
                  placeholder="Full description of the collection..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Products
                </label>
                <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                  {products.length === 0 ? (
                    <p className="text-gray-500 text-sm">No products available</p>
                  ) : (
                    <div className="space-y-2">
                      {products.map((product) => (
                        <label
                          key={product.product_id}
                          className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.product_ids.includes(product.product_id)}
                            onChange={() => toggleProduct(product.product_id)}
                            className="h-4 w-4 text-[#D4AF37] focus:ring-[#D4AF37]"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{product.title}</div>
                            <div className="text-xs text-gray-500">{product.sku} - ₹{product.price}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {formData.product_ids.length > 0 && (
                  <p className="mt-2 text-sm text-gray-600">
                    {formData.product_ids.length} product{formData.product_ids.length > 1 ? "s" : ""} selected
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    placeholder="0"
                  />
                  <p className="mt-1 text-xs text-gray-500">Lower numbers appear first</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="h-4 w-4 text-[#D4AF37] focus:ring-[#D4AF37]"
                  />
                  <span className="text-sm font-medium text-gray-700">Featured (Show on Homepage)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 text-[#D4AF37] focus:ring-[#D4AF37]"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="bg-[#D4AF37] hover:bg-[#C19B2E] flex-1"
                >
                  {editingCollection ? "Update Collection" : "Create Collection"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingCollection(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collections List */}
      <div className="bg-white rounded-lg shadow-sm border">
        {collections.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No collections created yet</p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-[#D4AF37] hover:bg-[#C19B2E]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Collection
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Collection
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Products
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Featured
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {collections.map((collection) => (
                  <tr key={collection.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{collection.name}</p>
                        {collection.short_description && (
                          <p className="text-sm text-gray-500 mt-1">{collection.short_description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">/{collection.slug}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {collection.product_ids?.length || 0} product{collection.product_ids?.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {collection.is_active ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 flex items-center gap-1 w-fit">
                          <XCircle className="h-3 w-3" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {collection.is_featured ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-[#D4AF37]/10 text-[#D4AF37] flex items-center gap-1 w-fit">
                          <Star className="h-3 w-3" />
                          Featured
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(collection)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(collection.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

