"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getAdminSession, isAdminAuthenticated } from "@/lib/admin-auth";
import { Image as ImageIcon, Plus, Edit, Trash2, ArrowUp, ArrowDown, X, Save } from "lucide-react";
import type { CarouselSlide } from "@/lib/carousel-types";
import { uploadToImageKit } from "@/lib/imagekit";

export default function AdminCarouselPage() {
  const router = useRouter();
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSlide, setEditingSlide] = useState<CarouselSlide | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    image_url: "",
    title: "",
    subtitle: "",
    link_url: "",
    link_text: "",
    is_active: true,
  });

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.replace("/login?mode=admin");
      return;
    }
    loadSlides();
  }, [router]);

  const loadSlides = async () => {
    try {
      setIsLoading(true);
      const session = getAdminSession();
      const response = await fetch("/api/admin/carousel", {
        headers: {
          "x-admin-username": session?.username || "",
        },
      });
      const data = await response.json();
      if (data.success) {
        setSlides(data.slides || []);
      }
    } catch (error) {
      console.error("Failed to load carousel slides:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const session = getAdminSession();
      if (!session) {
        throw new Error("Admin session required");
      }

      // Use the new SDK upload function with admin session
      // Upload to "carousel" folder for carousel images
      // The utility will handle admin authentication headers automatically
      const url = await uploadToImageKit(file, file.name, undefined, undefined, session, "carousel");
      return url;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await handleFileUpload(file);
      setFormData({ ...formData, image_url: url });
    } catch (error) {
      alert("Failed to upload image");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image_url) {
      alert("Please upload an image");
      return;
    }

    setIsSaving(true);
    try {
      const session = getAdminSession();
      const maxOrder = slides.length > 0 ? Math.max(...slides.map(s => s.order)) : -1;

      if (editingSlide) {
        // Update existing slide
        const response = await fetch("/api/admin/carousel", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-admin-username": session?.username || "",
          },
          body: JSON.stringify({
            action: "update",
            slide_id: editingSlide.id,
            updates: {
              ...formData,
              order: editingSlide.order,
            },
          }),
        });

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || "Failed to update slide");
        }
      } else {
        // Create new slide
        const response = await fetch("/api/admin/carousel", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-username": session?.username || "",
          },
          body: JSON.stringify({
            ...formData,
            order: maxOrder + 1,
          }),
        });

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || "Failed to create slide");
        }
      }

      resetForm();
      loadSlides();
    } catch (error: any) {
      alert(error.message || "Failed to save slide");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (slide: CarouselSlide) => {
    setEditingSlide(slide);
    setFormData({
      image_url: slide.image_url,
      title: slide.title || "",
      subtitle: slide.subtitle || "",
      link_url: slide.link_url || "",
      link_text: slide.link_text || "",
      is_active: slide.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this slide?")) return;

    try {
      const session = getAdminSession();
      const response = await fetch(`/api/admin/carousel?id=${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-username": session?.username || "",
        },
      });

      const data = await response.json();
      if (data.success) {
        loadSlides();
      } else {
        alert(data.error || "Failed to delete slide");
      }
    } catch (error) {
      alert("Failed to delete slide");
    }
  };

  const handleReorder = async (id: string, direction: "up" | "down") => {
    const index = slides.findIndex(s => s.id === id);
    if (index === -1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= slides.length) return;

    const reorderedSlides = [...slides];
    [reorderedSlides[index], reorderedSlides[newIndex]] = [reorderedSlides[newIndex], reorderedSlides[index]];

    const slideOrders = reorderedSlides.map((slide, idx) => ({
      id: slide.id,
      order: idx,
    }));

    try {
      const session = getAdminSession();
      const response = await fetch("/api/admin/carousel", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-username": session?.username || "",
        },
        body: JSON.stringify({
          action: "reorder",
          slide_orders: slideOrders,
        }),
      });

      const data = await response.json();
      if (data.success) {
        loadSlides();
      } else {
        alert(data.error || "Failed to reorder slides");
      }
    } catch (error) {
      alert("Failed to reorder slides");
    }
  };

  const resetForm = () => {
    setFormData({
      image_url: "",
      title: "",
      subtitle: "",
      link_url: "",
      link_text: "",
      is_active: true,
    });
    setEditingSlide(null);
    setShowForm(false);
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Loading carousel slides...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl mb-2 text-gray-900 dark:text-white">Carousel Management</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage homepage carousel slides</p>
          </div>
          {!showForm && (
            <Button
              onClick={() => setShowForm(true)}
              className="bg-[#D4AF37] hover:bg-[#C19B2E] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Slide
            </Button>
          )}
        </div>

        {showForm && (
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border dark:border-white/10 p-6 mb-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl text-gray-900 dark:text-white">
                {editingSlide ? "Edit Slide" : "Add New Slide"}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                Image <span className="text-red-500">*</span>
              </label>
              {formData.image_url ? (
                <div className="relative">
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg mb-2 border border-gray-200 dark:border-white/10"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image_url: "" })}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 dark:border-white/20 rounded-lg p-8 text-center bg-gray-50 dark:bg-[#0a0a0a]">
                  <ImageIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={uploading}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer inline-block bg-gray-100 dark:bg-[#1a1a1a] hover:bg-gray-200 dark:hover:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 px-4 py-2 rounded transition-colors"
                  >
                    {uploading ? "Uploading..." : "Choose Image"}
                  </label>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded border border-gray-300 dark:border-white/20 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] dark:focus:ring-[#D4AF37]"
                  placeholder="e.g., New Collection"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Subtitle</label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full rounded border border-gray-300 dark:border-white/20 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] dark:focus:ring-[#D4AF37]"
                  placeholder="e.g., Discover our latest designs"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Link URL</label>
                <input
                  type="text"
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  className="w-full rounded border border-gray-300 dark:border-white/20 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] dark:focus:ring-[#D4AF37]"
                  placeholder="e.g., /products"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Link Text</label>
                <input
                  type="text"
                  value={formData.link_text}
                  onChange={(e) => setFormData({ ...formData, link_text: e.target.value })}
                  className="w-full rounded border border-gray-300 dark:border-white/20 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] dark:focus:ring-[#D4AF37]"
                  placeholder="e.g., Shop Now"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-gray-900 dark:text-white">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-[#D4AF37] rounded border-gray-300 dark:border-white/20 focus:ring-[#D4AF37]"
                />
                <span className="text-sm">Active (show on homepage)</span>
              </label>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-[#D4AF37] hover:bg-[#C19B2E] text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : editingSlide ? "Update Slide" : "Add Slide"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm} className="border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border dark:border-white/10 shadow-sm">
        <div className="p-6 border-b dark:border-white/10">
          <h2 className="font-serif text-xl text-gray-900 dark:text-white">Carousel Slides</h2>
        </div>
        {slides.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p>No carousel slides yet. Add your first slide to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-white/10">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className="p-6 flex items-center gap-6 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
              >
                <div className="flex-1 flex items-center gap-4">
                  <div className="relative w-32 h-20 flex-shrink-0 rounded overflow-hidden bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10">
                    <img
                      src={slide.image_url}
                      alt={slide.title || "Slide"}
                      className="w-full h-full object-cover"
                    />
                    {!slide.is_active && (
                      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center">
                        <span className="text-white text-xs font-medium">Inactive</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{slide.title || "Untitled Slide"}</h3>
                      {slide.is_active && (
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded">
                          Active
                        </span>
                      )}
                    </div>
                    {slide.subtitle && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{slide.subtitle}</p>
                    )}
                    {slide.link_url && (
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Link: {slide.link_url} {slide.link_text && `(${slide.link_text})`}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReorder(slide.id, "up")}
                    disabled={index === 0}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-[#D4AF37] dark:hover:text-[#D4AF37] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleReorder(slide.id, "down")}
                    disabled={index === slides.length - 1}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-[#D4AF37] dark:hover:text-[#D4AF37] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(slide)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-[#D4AF37] dark:hover:text-[#D4AF37] transition-colors"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(slide.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

