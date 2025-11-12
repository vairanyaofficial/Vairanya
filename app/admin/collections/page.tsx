"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  ArrowLeft,
  Search,
  Filter,
  Layers,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAdminSession, isAdminAuthenticated } from "@/lib/admin-auth";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import type { Collection } from "@/lib/collections-types";
import type { Product } from "@/lib/products-types";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function CollectionsPage() {
  const router = useRouter();
  const { user, adminInfo } = useAuth();
  const { showSuccess, showError } = useToast();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFeatured, setFilterFeatured] = useState<"all" | "featured" | "not-featured">("all");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const [productSearchQuery, setProductSearchQuery] = useState("");
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

  // Filter collections
  const filteredCollections = useMemo(() => {
    let filtered = collections;

    // Filter by featured status
    if (filterFeatured === "featured") {
      filtered = filtered.filter((c) => c.is_featured);
    } else if (filterFeatured === "not-featured") {
      filtered = filtered.filter((c) => !c.is_featured);
    }

    // Filter by active status
    if (filterActive === "active") {
      filtered = filtered.filter((c) => c.is_active);
    } else if (filterActive === "inactive") {
      filtered = filtered.filter((c) => !c.is_active);
    }

    // Search by name, slug, or description
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.slug.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query) ||
          c.short_description?.toLowerCase().includes(query)
      );
    }

    // Sort by display_order (ascending), then by name
    filtered.sort((a, b) => {
      const orderA = a.display_order || 0;
      const orderB = b.display_order || 0;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.name.localeCompare(b.name);
    });

    return filtered;
  }, [collections, searchQuery, filterFeatured, filterActive]);

  // Filter products in form
  const filteredProducts = useMemo(() => {
    if (!productSearchQuery.trim()) {
      return products;
    }
    const query = productSearchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
    );
  }, [products, productSearchQuery]);

  useEffect(() => {
    if (user && !adminInfo) {
      router.replace("/");
      return;
    }
    
    if (!isAdminAuthenticated()) {
      router.replace("/login");
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
      // Failed to load products
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
        showError(errorMsg);
      }
    } catch (err: any) {
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

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts (prevents accidental drags)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end - update display_order based on new position
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = filteredCollections.findIndex((c) => c.id === active.id);
    const newIndex = filteredCollections.findIndex((c) => c.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Update local state immediately for better UX
    const reorderedCollections = arrayMove(filteredCollections, oldIndex, newIndex);
    
    // Update display_order for all affected collections
    try {
      const sessionData = getAdminSession();
      if (!sessionData) {
        return;
      }

      // Update all collections that changed position
      const updates = reorderedCollections.map((collection, index) => ({
        id: collection.id,
        display_order: index,
      }));

      // Update all collections in parallel
      const updatePromises = updates.map((update) =>
        fetch("/api/admin/collections", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-admin-username": sessionData.username,
          },
          body: JSON.stringify(update),
        })
      );

      const results = await Promise.allSettled(updatePromises);
      const failed = results.filter((r) => r.status === "rejected");
      
      if (failed.length > 0) {
        showError("Some collections failed to update");
        loadCollections(); // Reload to sync with server
      } else {
        showSuccess("Display order updated successfully");
        loadCollections(); // Reload to sync with server
      }
    } catch (err) {
      showError("Failed to update display order");
      loadCollections(); // Reload to sync with server
    }
  };

  // Sortable Collection Item Component
  function SortableCollectionItem({ collection }: { collection: Collection }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: collection.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`p-2 md:p-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${
          isDragging ? "bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Layers className="h-4 w-4 text-[#D4AF37] flex-shrink-0" />
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {collection.name}
              </p>
              {collection.is_featured && (
                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20 text-[#D4AF37] flex items-center gap-0.5 flex-shrink-0">
                  <Star className="h-2.5 w-2.5" />
                  Featured
                </span>
              )}
              {collection.is_active ? (
                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 flex items-center gap-0.5 flex-shrink-0">
                  <CheckCircle className="h-2.5 w-2.5" />
                  Active
                </span>
              ) : (
                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 flex items-center gap-0.5 flex-shrink-0">
                  <XCircle className="h-2.5 w-2.5" />
                  Inactive
                </span>
              )}
            </div>
            {collection.short_description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-1">
                {collection.short_description}
              </p>
            )}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                <Package className="h-3 w-3" />
                <span>{collection.product_ids?.length || 0} products</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500">
                /{collection.slug}
              </div>
              <div className="text-xs font-semibold text-[#D4AF37] dark:text-[#D4AF37]">
                Order: {collection.display_order || 0}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Drag Handle */}
            <button
              {...attributes}
              {...listeners}
              className="h-7 w-7 p-0 flex items-center justify-center cursor-grab active:cursor-grabbing text-gray-400 dark:text-gray-500 hover:text-[#D4AF37] dark:hover:text-[#D4AF37] transition-colors touch-manipulation"
              title="Drag to reorder"
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(collection)}
              className="h-7 w-7 p-0"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(collection.id)}
              className="h-7 w-7 p-0 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black p-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading collections...</p>
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
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Collections</h1>
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
              {collections.length}
            </span>
          </div>
          <Button
            onClick={() => {
              setShowForm(true);
              setEditingCollection(null);
              resetForm();
            }}
            size="sm"
            className="h-8 px-2 text-xs bg-[#D4AF37] hover:bg-[#C19B2E]"
          >
            <Plus className="h-3 w-3 mr-1" />
            Create
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="mb-3 space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs md:text-sm border border-gray-200 dark:border-white/10 rounded-md bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <div className="flex-1 overflow-x-auto scroll-smooth scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div className="flex items-center gap-1 min-w-max">
                <div className="flex gap-1">
                  {(["all", "featured", "not-featured"] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setFilterFeatured(filter)}
                      className={`px-2 py-1 text-xs rounded-md transition-colors whitespace-nowrap flex-shrink-0 ${
                        filterFeatured === filter
                          ? "bg-[#D4AF37] text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      {filter === "all" ? "All" : filter === "featured" ? "Featured" : "Not Featured"}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1 ml-1">
                  {(["all", "active", "inactive"] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setFilterActive(filter)}
                      className={`px-2 py-1 text-xs rounded-md transition-colors whitespace-nowrap flex-shrink-0 ${
                        filterActive === filter
                          ? "bg-[#D4AF37] text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      {filter === "all" ? "All" : filter === "active" ? "Active" : "Inactive"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
              {filteredCollections.length}/{collections.length}
            </span>
          </div>
        </div>

        {/* Collection Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-gray-900/20 dark:bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto border dark:border-white/10">
              <div className="p-3 md:p-4 border-b dark:border-white/10 flex items-center justify-between sticky top-0 bg-white dark:bg-[#0a0a0a] z-10">
                <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
                  {editingCollection ? "Edit Collection" : "Create Collection"}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingCollection(null);
                    resetForm();
                  }}
                  className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-white/5"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-3 md:p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (!formData.slug || formData.slug === editingCollection?.slug) {
                          const autoSlug = e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                          setFormData((prev) => ({ ...prev, slug: autoSlug }));
                        }
                      }}
                      className="w-full px-2 py-1.5 text-sm border dark:border-white/10 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder="Collection name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Slug *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") })}
                      className="w-full px-2 py-1.5 text-sm border dark:border-white/10 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder="collection-slug"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Short Description
                  </label>
                  <input
                    type="text"
                    value={formData.short_description}
                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border dark:border-white/10 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="Brief description"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border dark:border-white/10 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    rows={2}
                    placeholder="Full description..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Products ({formData.product_ids.length} selected)
                  </label>
                  <div className="mb-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={productSearchQuery}
                        onChange={(e) => setProductSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 dark:border-white/10 rounded-md bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                      />
                    </div>
                  </div>
                  <div className="border dark:border-white/10 rounded-md p-2 max-h-40 overflow-y-auto bg-white dark:bg-[#0a0a0a]">
                    {filteredProducts.length === 0 ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">No products available</p>
                    ) : (
                      <div className="space-y-1">
                        {filteredProducts.map((product) => (
                          <label
                            key={product.product_id}
                            className="flex items-center gap-2 p-1.5 hover:bg-gray-50 dark:hover:bg-white/5 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.product_ids.includes(product.product_id)}
                              onChange={() => toggleProduct(product.product_id)}
                              className="h-3.5 w-3.5 text-[#D4AF37] focus:ring-[#D4AF37] border-gray-300 dark:border-white/20"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-gray-900 dark:text-white truncate">{product.title}</div>
                              <div className="text-[10px] text-gray-500 dark:text-gray-400">{product.sku} - ₹{product.price}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Display Order
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 text-sm border dark:border-white/10 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="h-3.5 w-3.5 text-[#D4AF37] focus:ring-[#D4AF37] border-gray-300 dark:border-white/20"
                    />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Featured</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-3.5 w-3.5 border-gray-300 dark:border-white/20"
                    />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Active</span>
                  </label>
                </div>

                <div className="flex gap-2 pt-2 border-t dark:border-white/10">
                  <Button
                    type="submit"
                    size="sm"
                    className="h-8 flex-1 text-xs bg-[#D4AF37] hover:bg-[#C19B2E]"
                  >
                    {editingCollection ? "Update" : "Create"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs"
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

        {/* Collections List - Compact Cards with Drag and Drop */}
        <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm border dark:border-white/10">
          {filteredCollections.length === 0 ? (
            <div className="text-center py-8">
              <Layers className="h-8 w-8 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {searchQuery || filterFeatured !== "all" || filterActive !== "all" ? "No collections found" : "No collections yet"}
              </p>
              {!searchQuery && filterFeatured === "all" && filterActive === "all" && (
                <Button
                  onClick={() => setShowForm(true)}
                  size="sm"
                  className="h-8 text-xs bg-[#D4AF37] hover:bg-[#C19B2E]"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Create Collection
                </Button>
              )}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredCollections.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="divide-y divide-gray-200 dark:divide-white/10 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {filteredCollections.map((collection) => (
                    <SortableCollectionItem key={collection.id} collection={collection} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </div>
  );
}

