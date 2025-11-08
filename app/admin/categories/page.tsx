"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit, X, Check } from "lucide-react";
import { getAdminSession } from "@/lib/admin-auth";
import { useToast } from "@/components/ToastProvider";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const { showError, showSuccess, showWarning } = useToast();

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const session = getAdminSession();
      if (!session) {
        setError("Not authenticated");
        return;
      }

      const response = await fetch("/api/admin/categories", {
        headers: {
          "x-admin-username": session.username,
          "x-admin-role": session.role,
        },
      });
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories || []);
      } else {
        setError(data.error || "Failed to load categories");
      }
    } catch (err) {
      setError("Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    
    // Refresh when page comes into focus (user navigates back)
    const handleFocus = () => {
      loadCategories();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      setError("Category name is required");
      return;
    }

    try {
      const session = getAdminSession();
      if (!session) {
        showError("Not authenticated");
        return;
      }

      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-username": session.username,
          "x-admin-role": session.role,
        },
        body: JSON.stringify({ name: newCategory.trim() }),
      });

      const data = await response.json();
      if (data.success) {
        setCategories(data.categories || []);
        setNewCategory("");
        setError("");
        showSuccess("Category added successfully");
      } else {
        const errorMsg = data.error || "Failed to add category";
        setError(errorMsg);
        showError(errorMsg);
      }
    } catch (err) {
      setError("Failed to add category");
    }
  };

  const handleDeleteCategory = async (categoryName: string) => {
    if (!confirm(`Are you sure you want to delete "${categoryName}"? This cannot be undone.`)) {
      return;
    }

    try {
      const session = getAdminSession();
      if (!session) {
        showError("Not authenticated");
        return;
      }

      const response = await fetch(`/api/admin/categories/${encodeURIComponent(categoryName)}`, {
        method: "DELETE",
        headers: {
          "x-admin-username": session.username,
          "x-admin-role": session.role,
        },
      });

      const data = await response.json();
      if (data.success) {
        loadCategories();
        showSuccess("Category deleted successfully");
      } else {
        showError(data.error || "Failed to delete category");
      }
    } catch (err) {
      showError("Failed to delete category");
    }
  };

  const handleStartEdit = (category: string) => {
    setEditingCategory(category);
    setEditValue(category);
  };

  const handleSaveEdit = async () => {
    if (!editingCategory || !editValue.trim()) {
      setEditingCategory(null);
      return;
    }

    if (editValue.trim() === editingCategory) {
      setEditingCategory(null);
      return;
    }

    try {
      const session = getAdminSession();
      if (!session) {
        showError("Not authenticated");
        return;
      }

      const response = await fetch(`/api/admin/categories/${encodeURIComponent(editingCategory)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-username": session.username,
          "x-admin-role": session.role,
        },
        body: JSON.stringify({ name: editValue.trim() }),
      });

      const data = await response.json();
      if (data.success) {
        loadCategories();
        setEditingCategory(null);
        setEditValue("");
        showSuccess("Category updated successfully");
      } else {
        showError(data.error || "Failed to update category");
      }
    } catch (err) {
      showError("Failed to update category");
    }
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setEditValue("");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl text-gray-900 dark:text-white">Categories</h1>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Add Category Form */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm border dark:border-white/10 p-6 mb-6">
        <h2 className="font-semibold mb-4 text-gray-900 dark:text-white">Add New Category</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Category name (e.g., rings, earrings)"
            className="flex-1 px-4 py-2 border dark:border-white/10 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleAddCategory();
              }
            }}
          />
          <Button
            onClick={handleAddCategory}
            className="bg-[#D4AF37] hover:bg-[#C19B2E]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
      </div>

      {/* Categories List */}
      {isLoading ? (
        <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-12 text-center border dark:border-white/10">
          <p className="text-gray-500 dark:text-gray-400">Loading categories...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm p-12 text-center border dark:border-white/10">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No categories found</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Add your first category above</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm border dark:border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-[#0a0a0a] border-b dark:border-white/10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category Name
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#0a0a0a] divide-y divide-gray-200 dark:divide-white/10">
                {categories.map((category) => (
                  <tr key={category} className="hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="px-6 py-4">
                      {editingCategory === category ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="px-3 py-1 border dark:border-white/10 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white"
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                handleSaveEdit();
                              } else if (e.key === "Escape") {
                                handleCancelEdit();
                              }
                            }}
                            autoFocus
                          />
                          <button
                            onClick={handleSaveEdit}
                            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                            title="Save"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                            title="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                          {category}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {editingCategory !== category && (
                          <>
                            <button
                              onClick={() => handleStartEdit(category)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category)}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
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

