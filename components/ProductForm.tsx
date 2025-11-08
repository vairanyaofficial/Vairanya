"use client";
import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getAdminSession } from "@/lib/admin-auth";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/products-types";

type Props = {
  initialCategories?: string[];
  product?: Product; // For editing
  onSubmit?: (product: Partial<Product>) => Promise<void>; // For editing
  isSaving?: boolean; // For editing
};

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2 MB

export default function ProductForm({ initialCategories = [], product, onSubmit, isSaving = false }: Props) {
  const { adminInfo } = useAuth();
  const router = useRouter();
  const isEditMode = !!product;

  // core fields
  const [title, setTitle] = useState(product?.title || "");
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState(product?.price?.toString() || "");
  const [mrp, setMrp] = useState(product?.mrp?.toString() || "");

  // extra fields
  const [sku, setSku] = useState(product?.sku || "");
  const [stock, setStock] = useState(product?.stock_qty?.toString() || "");
  const [tagsInput, setTagsInput] = useState(product?.tags?.join(", ") || "");
  const [sizesInput, setSizesInput] = useState(product?.size_options?.join(", ") || "");

  // categories: just select from available, no management
  const [availableCategories, setAvailableCategories] = useState<string[]>(initialCategories);
  const [selectedCategory, setSelectedCategory] = useState<string>(product?.category || "");
  
  // metal finish
  const [selectedMetalFinish, setSelectedMetalFinish] = useState<"gold" | "rose-gold" | "silver" | "platinum">(
    product?.metal_finish || "gold"
  );

  // image + UX - multiple images support
  const [existingImages, setExistingImages] = useState<string[]>(product?.images || []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const previewUrlsRef = useRef<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [msg, setMsg] = useState<{ type: "info" | "error" | "success"; text: string } | null>(null);

  // Load categories on mount (always load if not provided, especially for edit mode)
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) {
          throw new Error("Failed to fetch categories");
        }
        const data = await res.json();
        // Handle both response formats (with or without success field)
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          setAvailableCategories(data.categories);
          // Only set default category for new products (not edit mode)
          // In edit mode, the product category will be set by the product useEffect
          if (!isEditMode && data.categories.length > 0) {
            // Use functional update to check current state
            setSelectedCategory((current) => {
              // Only set default if no category is currently selected
              return current || data.categories[0];
            });
          }
        }
      } catch (error) {
        console.error("Failed to load categories:", error);
        // Keep initialCategories if they exist
        if (initialCategories && initialCategories.length > 0) {
          setAvailableCategories(initialCategories);
        }
      }
    };
    // Always try to load categories if we don't have them or they're empty
    // This is especially important for edit mode where initialCategories might not be passed
    if (!initialCategories || initialCategories.length === 0) {
      loadCategories();
    } else {
      // If we have initialCategories, use them but also try to refresh from API
      setAvailableCategories(initialCategories);
      loadCategories(); // Still load to get latest categories
    }
  }, [initialCategories, isEditMode]);

  // Load product data when editing
  useEffect(() => {
    if (product) {
      setTitle(product.title || "");
      setDescription(product.description || "");
      setPrice(product.price?.toString() || "");
      setMrp(product.mrp?.toString() || "");
      setSku(product.sku || "");
      setStock(product.stock_qty?.toString() || "");
      setTagsInput(product.tags?.join(", ") || "");
      setSizesInput(product.size_options?.join(", ") || "");
      setSelectedCategory(product.category || "");
      setSelectedMetalFinish(product.metal_finish || "gold");
      setExistingImages(product.images || []);
    }
  }, [product]);

  // Generate preview URLs for new files
  useEffect(() => {
    // Cleanup old preview URLs first
    previewUrlsRef.current.forEach((url) => {
      if (url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    });

    if (newFiles.length === 0) {
      setPreviewUrls([]);
      previewUrlsRef.current = [];
      return;
    }
    
    const urls = newFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    previewUrlsRef.current = urls;
    
    // Cleanup preview URLs when component unmounts
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newFiles]);

  const isPriceValid = (p: string) => /^[0-9]+(\.[0-9]{1,2})?$/.test(p.trim());
  const isStockValid = (s: string) => /^[0-9]+$/.test(s.trim()) || s.trim() === "";

  // ImgBB upload with progress via XHR
  const uploadToImgBB = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const key = process.env.NEXT_PUBLIC_IMGBB_KEY;
      if (!key) {
        return reject(new Error("ImgBB API key missing. Please add NEXT_PUBLIC_IMGBB_KEY to your .env.local file. Get your free API key from https://api.imgbb.com/"));
      }

      if (key.length < 20) {
        return reject(new Error("Invalid ImgBB API key format. Please check your NEXT_PUBLIC_IMGBB_KEY in .env.local"));
      }

      const form = new FormData();
      form.append("image", file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `https://api.imgbb.com/1/upload?key=${key}`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        try {
          const res = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && res?.data?.url) {
            setUploadProgress(100);
            resolve(res.data.url);
          } else {
            let errorMsg = "ImgBB upload failed";
            if (res?.error) {
              if (res.error.message?.includes("Invalid API") || res.error.message?.includes("API key")) {
                errorMsg = "Invalid ImgBB API key. Please check your NEXT_PUBLIC_IMGBB_KEY in .env.local. Get a free key at https://api.imgbb.com/";
              } else {
                errorMsg = res.error.message || errorMsg;
              }
            }
            reject(new Error(errorMsg));
          }
        } catch (err) {
          reject(new Error("ImgBB upload: invalid response from server"));
        }
      };

      xhr.onerror = () => reject(new Error("ImgBB upload network error. Please check your internet connection."));
      xhr.send(form);
    });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMsg(null);
    const files = Array.from(e.target.files || []);
    if (files.length === 0) {
      return;
    }

    // Validate all files
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setMsg({ type: "error", text: `"${file.name}" is not a valid image file.` });
        return;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        setMsg({ type: "error", text: `"${file.name}" is too large. Max 2 MB per image.` });
        return;
      }
    }

    // Add new files to existing ones
    setNewFiles((prev) => [...prev, ...files]);
    
    // Reset input to allow selecting the same file again
    e.target.value = "";
  };

  const removeNewFile = (index: number) => {
    setNewFiles((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      // The useEffect will automatically clean up the revoked URLs
      return updated;
    });
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    const session = getAdminSession();
    if (!session) {
      return setMsg({ type: "error", text: "Please sign in as admin to save products." });
    }

    if (!title.trim()) return setMsg({ type: "error", text: "Product title required." });
    if (!isPriceValid(price)) return setMsg({ type: "error", text: "Enter valid price (e.g., 499 or 499.99)." });
    if (!isStockValid(stock)) return setMsg({ type: "error", text: "Stock must be a number." });
    if (!selectedCategory) return setMsg({ type: "error", text: "Please select a category." });

    // If editing and onSubmit provided, use it
    if (isEditMode && onSubmit) {
      setLoading(true);
      try {
        // Upload all new files
        const uploadedUrls: string[] = [];
        if (newFiles.length > 0) {
          setMsg({ type: "info", text: `Uploading ${newFiles.length} image(s)...` });
          for (let i = 0; i < newFiles.length; i++) {
            setUploadProgress(Math.round(((i + 1) / newFiles.length) * 100));
            const url = await uploadToImgBB(newFiles[i]);
            uploadedUrls.push(url);
          }
          setUploadProgress(100);
        }

        // Combine existing images (that weren't removed) with newly uploaded images
        const allImages = [...existingImages, ...uploadedUrls];

        const productData: Partial<Product> = {
          title: title.trim(),
          description: description.trim(),
          short_description: description.trim().substring(0, 150) || "",
          price: parseFloat(price),
          mrp: mrp.trim() ? parseFloat(mrp) : undefined,
          sku: sku.trim() || undefined,
          stock_qty: stock.trim() ? parseInt(stock, 10) : 0,
          category: selectedCategory as any,
          tags: tagsInput
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          size_options: sizesInput
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          images: allImages,
          slug: product?.slug || title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, ""),
          metal_finish: selectedMetalFinish,
          is_new: product?.is_new ?? true,
        };

        await onSubmit(productData);
        setMsg({ type: "success", text: "Product updated successfully! ✅" });
        setUploadProgress(0);
      } catch (err: any) {
        setMsg({ type: "error", text: "Error: " + (err?.message || "Failed to update product.") });
        setUploadProgress(0);
      } finally {
        setLoading(false);
      }
      return;
    }

    // New product flow
    setLoading(true);
    setUploadProgress(0);

    try {
      // Upload all new files
      const uploadedUrls: string[] = [];
      if (newFiles.length > 0) {
        setMsg({ type: "info", text: `Uploading ${newFiles.length} image(s)...` });
        for (let i = 0; i < newFiles.length; i++) {
          setUploadProgress(Math.round(((i + 1) / newFiles.length) * 100));
          const url = await uploadToImgBB(newFiles[i]);
          uploadedUrls.push(url);
        }
        setUploadProgress(100);
      }

      // Generate slug from title
      const slug = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

      // Prepare product data
      const productData = {
        title: title.trim(),
        description: description.trim(),
        short_description: description.trim().substring(0, 150) || "",
        price: parseFloat(price),
        mrp: mrp.trim() ? parseFloat(mrp) : undefined,
        sku: sku.trim() || undefined,
        stock_qty: stock.trim() ? parseInt(stock, 10) : 0,
        category: selectedCategory as any,
        tags: tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        size_options: sizesInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        images: uploadedUrls,
        slug: slug,
        metal_finish: selectedMetalFinish,
        is_new: true,
      };

      // Save via admin API
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-username": session.username,
          "x-admin-role": session.role,
        },
        body: JSON.stringify(productData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to save product");
      }

      setMsg({ type: "success", text: "Product saved successfully! ✅" });
      
      // Reset fields
      setTitle("");
      setDescription("");
      setPrice("");
      setMrp("");
      setSku("");
      setStock("");
      setTagsInput("");
      setSizesInput("");
      setSelectedCategory(availableCategories[0] || "");
      setSelectedMetalFinish("gold");
      setNewFiles([]);
      setExistingImages([]);
      setPreviewUrls([]);
      setUploadProgress(0);

      // Redirect to products list after 1 second
      setTimeout(() => {
        router.refresh(); // Refresh router cache
        router.push("/admin/products");
      }, 1000);
    } catch (err: any) {
      setMsg({ type: "error", text: "Error: " + (err?.message || "Failed to save product.") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{isEditMode ? "Edit Product" : "Add Product"}</h2>
        <div className="text-right text-sm">
          {adminInfo ? (
            <div>
              <div className="font-medium">{adminInfo.name || "Admin"}</div>
              <div className="text-gray-500">Signed in</div>
            </div>
          ) : (
            <div className="text-red-600 text-sm">Please sign in as admin</div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3" aria-live="polite">
        {/* Basic */}
        <label className="block">
          <span className="text-sm font-medium">Title *</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Product title" className="mt-1 w-full border p-2 rounded" required />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Description</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Product description" className="mt-1 w-full border p-2 rounded" rows={3} />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-medium">Price (INR) *</span>
            <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g., 499.99" className="mt-1 w-full border p-2 rounded" inputMode="decimal" required />
          </label>

          <label className="block">
            <span className="text-sm font-medium">MRP (INR)</span>
            <input value={mrp} onChange={(e) => setMrp(e.target.value)} placeholder="e.g., 599.99" className="mt-1 w-full border p-2 rounded" inputMode="decimal" />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-medium">Stock qty</span>
            <input value={stock} onChange={(e) => setStock(e.target.value)} placeholder="e.g., 10" className="mt-1 w-full border p-2 rounded" inputMode="numeric" />
          </label>

          <label className="block">
            <span className="text-sm font-medium">SKU</span>
            <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU (optional)" className="mt-1 w-full border p-2 rounded" />
          </label>
        </div>

        {/* Category Selection */}
        <div>
          <label className="block">
            <span className="text-sm font-medium">Category *</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="mt-1 w-full border p-2 rounded"
              required
            >
              <option value="">Select a category</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Manage categories in <a href="/admin/categories" className="text-[#D4AF37] hover:underline">Categories</a> section
          </p>
        </div>

        {/* Metal Finish */}
        <div>
          <label className="block">
            <span className="text-sm font-medium">Metal Finish *</span>
            <select
              value={selectedMetalFinish}
              onChange={(e) => setSelectedMetalFinish(e.target.value as "gold" | "rose-gold" | "silver" | "platinum")}
              className="mt-1 w-full border p-2 rounded"
              required
            >
              <option value="gold">Gold</option>
              <option value="rose-gold">Rose Gold</option>
              <option value="silver">Silver</option>
              <option value="platinum">Platinum</option>
            </select>
          </label>
        </div>

        {/* Sizes */}
        <div>
          <label className="block">
            <span className="text-sm font-medium">Sizes (comma separated)</span>
            <input
              value={sizesInput}
              onChange={(e) => setSizesInput(e.target.value)}
              placeholder="e.g., S, M, L, XL or 6, 7, 8, 9"
              className="mt-1 w-full border p-2 rounded"
            />
          </label>
          <p className="text-xs text-gray-500 mt-1">Enter sizes separated by commas (e.g., S, M, L or 6, 7, 8)</p>
        </div>

        {/* Tags */}
        <div>
          <label className="block">
            <span className="text-sm font-medium">Tags (comma separated)</span>
            <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="e.g., elegant, minimalist, everyday" className="mt-1 w-full border p-2 rounded" />
          </label>
        </div>

        {/* Images - Multiple */}
        <div className="block">
          <span className="text-sm font-medium block mb-2">Images (optional) — max 2MB per image</span>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            multiple
            className="mt-1 w-full" 
            aria-label="Product images" 
          />
          <p className="text-xs text-gray-500 mt-1">You can select multiple images at once</p>
        </div>

        {/* Existing Images */}
        {existingImages.length > 0 && (
          <div className="mt-3">
            <div className="text-xs text-gray-500 mb-2">Existing Images (click X to remove)</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {existingImages.map((img, index) => (
                <div key={`existing-${index}`} className="relative group">
                  <img 
                    src={img} 
                    alt={`Existing ${index + 1}`} 
                    className="w-full h-32 object-cover rounded border" 
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove image"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Image Previews */}
        {previewUrls.length > 0 && (
          <div className="mt-3">
            <div className="text-xs text-gray-500 mb-2">New Images (click X to remove)</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {previewUrls.map((preview, index) => (
                <div key={`new-${index}`} className="relative group">
                  <img 
                    src={preview} 
                    alt={`New ${index + 1}`} 
                    className="w-full h-32 object-cover rounded border" 
                  />
                  <button
                    type="button"
                    onClick={() => removeNewFile(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove image"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Image count info */}
        {(existingImages.length > 0 || previewUrls.length > 0) && (
          <div className="text-xs text-gray-500 mt-2">
            Total images: {existingImages.length + previewUrls.length}
          </div>
        )}

        {uploadProgress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mt-2">
            <div className="h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%`, background: "linear-gradient(90deg,#D4AF37,#C19B2E)" }} />
          </div>
        )}

        {/* Submit */}
        <div>
          <button type="submit" disabled={loading || isSaving || !adminInfo} className={`w-full px-4 py-2 rounded text-white transition ${loading || isSaving || !adminInfo ? "bg-gray-400 cursor-not-allowed" : "bg-[#D4AF37] hover:bg-[#C19B2E]"}`}>
            {loading || isSaving ? "Saving..." : isEditMode ? "Update Product" : "Save Product"}
          </button>
        </div>

        {msg && (
          <div className={`mt-2 text-center text-sm ${msg.type === "error" ? "text-red-600" : msg.type === "success" ? "text-green-600" : "text-gray-700"}`} role={msg.type === "error" ? "alert" : "status"}>
            {msg.text}
          </div>
        )}
      </form>
    </div>
  );
}
