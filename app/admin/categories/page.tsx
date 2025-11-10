"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit, X, Check, ArrowLeft, Search, FolderTree } from "lucide-react";
import { getAdminSession } from "@/lib/admin-auth";
import { useToast } from "@/components/ToastProvider";
import Link from "next/link";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { showError, showSuccess, showWarning } = useToast();

  // Filter categories
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return categories;
    }
    const query = searchQuery.toLowerCase();
    return categories.filter((cat) => cat.toLowerCase().includes(query));
  }, [categories, searchQuery]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black p-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-3 md:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link href="/admin">
              <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
                <ArrowLeft className="h-3 w-3 mr-1" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
              {categories.length}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-3 py-2 rounded text-xs">
            {error}
          </div>
        )}

        {/* Add Category Form - Compact */}
        <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm border dark:border-white/10 p-2 md:p-3 mb-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <FolderTree className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Category name (e.g., rings, earrings)"
                className="w-full pl-8 pr-3 py-1.5 text-xs md:text-sm border dark:border-white/10 border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddCategory();
                  }
                }}
              />
            </div>
            <Button
              onClick={handleAddCategory}
              size="sm"
              className="h-8 px-3 text-xs bg-[#D4AF37] hover:bg-[#C19B2E]"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        {categories.length > 0 && (
          <div className="mb-3">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs md:text-sm border border-gray-200 dark:border-white/10 rounded-md bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>
          </div>
        )}

        {/* Categories List - Compact Cards */}
        <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm border dark:border-white/10">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-8">
              <FolderTree className="h-8 w-8 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {searchQuery ? "No categories found" : categories.length === 0 ? "No categories yet" : "No matches"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-white/10 max-h-[calc(100vh-300px)] overflow-y-auto">
              {filteredCategories.map((category) => (
                <div
                  key={category}
                  className="p-2 md:p-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  {editingCategory === category ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 px-2 py-1.5 text-sm border dark:border-white/10 border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white"
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
                        className="p-1.5 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                        title="Save"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-1.5 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                        title="Cancel"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FolderTree className="h-4 w-4 text-[#D4AF37] flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white capitalize truncate">
                          {category}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleStartEdit(category)}
                          className="p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category)}
                          className="p-1.5 text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

