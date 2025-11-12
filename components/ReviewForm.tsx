"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, LogIn, X, Upload, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import Image from "next/image";

interface ReviewFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReviewSubmitted?: () => void;
  productId?: string; // Product ID for product-specific reviews (used in review submission)
  productSlug?: string; // Product slug for checking purchase status
  skipPurchaseCheck?: boolean; // Skip purchase verification (e.g., when called from orders page for delivered items)
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_IMAGES = 5; // Maximum number of images per review

export default function ReviewForm({ open, onOpenChange, onReviewSubmitted, productId, productSlug, skipPurchaseCheck = false }: ReviewFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    rating: 5,
    review_text: "",
  });
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [hasPurchased, setHasPurchased] = useState<boolean | null>(null);
  const [checkingPurchase, setCheckingPurchase] = useState(false);

  // Pre-fill form with user data if logged in
  useEffect(() => {
    if (user && open) {
      setFormData(prev => ({
        ...prev,
        customer_name: user.name || "",
        customer_email: user.email || "",
      }));
    }
  }, [user, open]);

  // Check purchase status when productSlug is provided
  useEffect(() => {
    if (skipPurchaseCheck && (productId || productSlug)) {
      // Skip purchase check if explicitly requested (e.g., from orders page for delivered items)
      setHasPurchased(true);
    } else if (!productSlug && !productId) {
      // If no productSlug/productId, allow review (general review)
      setHasPurchased(true);
    } else if ((productSlug || productId) && !user) {
      // If product review but not logged in, set to false
      setHasPurchased(false);
    } else if (productSlug && user && open && !skipPurchaseCheck) {
      // Only check purchase status if not skipping
      checkPurchaseStatus();
    } else if ((productSlug || productId) && user && open) {
      // If user is logged in and has product info, allow review (we removed backend verification)
      setHasPurchased(true);
    }
  }, [productSlug, productId, user, open, skipPurchaseCheck]);

  const checkPurchaseStatus = async () => {
    if (!productSlug || !user) return;
    
    setCheckingPurchase(true);
    try {
      const response = await fetch(`/api/products/${productSlug}/check-purchase`);
      const data = await response.json();
      setHasPurchased(data.success && data.hasPurchased);
    } catch (error) {
      console.error("Error checking purchase status:", error);
      setHasPurchased(false);
    } finally {
      setCheckingPurchase(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (images.length + files.length > MAX_IMAGES) {
      alert(`You can upload a maximum of ${MAX_IMAGES} images.`);
      return;
    }

    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          alert(`${file.name} is not an image file.`);
          continue;
        }

        // Validate file size
        if (file.size > MAX_IMAGE_SIZE) {
          alert(`${file.name} is too large. Maximum size is 5MB.`);
          continue;
        }

        // Upload image
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/reviews/upload-image", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        if (data.success) {
          uploadedUrls.push(data.url);
        } else {
          alert(`Failed to upload ${file.name}: ${data.error}`);
        }
      }

      setImages(prev => [...prev, ...uploadedUrls]);
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Failed to upload images. Please try again.");
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is logged in
    if (!user || !user.email) {
      alert("Please login to write a review.");
      onOpenChange(false);
      const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";
      router.push("/login?callbackUrl=" + encodeURIComponent(currentPath));
      return;
    }

    // Validate form data
    if (!formData.customer_name || formData.customer_name.trim().length === 0) {
      alert("Please enter your name.");
      return;
    }

    if (!formData.review_text || formData.review_text.trim().length < 10) {
      alert("Please enter a review with at least 10 characters.");
      return;
    }

    if (!formData.rating || formData.rating < 1 || formData.rating > 5) {
      alert("Please select a rating between 1 and 5.");
      return;
    }

    // Purchase check removed - reviews are only accessible from delivered orders page

    setIsSubmitting(true);

    try {
      const requestBody = {
        ...formData,
        product_id: productId,
        images: images.length > 0 ? images : undefined,
        customer_email: user.email, // Always use logged-in user's email
      };

      console.log("[ReviewForm] Submitting review:", { ...requestBody, images: images.length });

      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("[ReviewForm] Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("[ReviewForm] API error:", errorData);
        alert(errorData.error || `Failed to submit review. Status: ${response.status}`);
        return;
      }

      const data = await response.json();
      console.log("[ReviewForm] Response data:", data);

      if (data.success) {
        setSubmitted(true);
        // Call the callback to refetch reviews if provided
        if (onReviewSubmitted) {
          onReviewSubmitted();
        }
        setTimeout(() => {
          setSubmitted(false);
          onOpenChange(false);
          setFormData({
            customer_name: "",
            customer_email: "",
            rating: 5,
            review_text: "",
          });
          setImages([]);
        }, 2000);
      } else {
        alert(data.error || "Failed to submit review. Please try again.");
      }
    } catch (error) {
      console.error("[ReviewForm] Error submitting review:", error);
      alert("Failed to submit review. Please check console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {(productId || productSlug) ? "Write a Review" : "Website Review Form"}
          </DialogTitle>
          <DialogDescription>
            {(productId || productSlug)
              ? "Share your experience with this product. Only customers who purchased this item can write reviews."
              : "Share your experience with Vairanya. Your website review may be featured on our homepage!"}
          </DialogDescription>
        </DialogHeader>

        {!user ? (
          <div className="text-center py-8">
            <div className="rounded-full bg-[#D4AF37]/10 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <LogIn className="h-8 w-8 text-[#D4AF37]" />
            </div>
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Login Required</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Please login to write a review.
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";
                  router.push("/login?callbackUrl=" + encodeURIComponent(currentPath));
                }}
                className="flex-1 bg-[#D4AF37] hover:bg-[#C19B2E]"
              >
                Login
              </Button>
            </div>
          </div>
        ) : checkingPurchase ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
            <p className="text-gray-600">Checking purchase status...</p>
          </div>
        ) : (productId || productSlug) && hasPurchased === false ? (
          <div className="text-center py-8">
            <div className="rounded-full bg-yellow-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Review Not Available</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You can only review products after your order has been delivered. Please check your orders page for delivered items.
            </p>
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="bg-[#D4AF37] hover:bg-[#C19B2E]"
            >
              Close
            </Button>
          </div>
        ) : submitted ? (
          <div className="text-center py-8">
            <div className="rounded-full bg-green-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Star className="h-8 w-8 text-green-600 fill-green-600" />
            </div>
            <h3 className="font-semibold mb-2">Thank you!</h3>
            <p className="text-gray-600">Your review has been submitted successfully.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Your Name *</label>
              <input
                type="text"
                required
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37]"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Your Email</label>
              <input
                type="email"
                value={user.email || formData.customer_email}
                disabled
                className="w-full rounded border border-gray-300 px-3 py-2 bg-gray-50 text-gray-500 cursor-not-allowed"
                placeholder="your@email.com"
              />
              <p className="text-xs text-gray-500 mt-1">Email is automatically set from your account</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Rating *</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        star <= (hoveredRating || formData.rating)
                          ? "fill-[#D4AF37] text-[#D4AF37]"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Your Review *</label>
              <textarea
                required
                rows={4}
                value={formData.review_text}
                onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
                className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37]"
                placeholder="Write your review here (minimum 10 characters)..."
                minLength={10}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.review_text.length}/10 characters minimum
              </p>
            </div>

            {/* Only show image upload for product-specific reviews */}
            {productId && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Product Images (Optional)
                </label>
                <div className="space-y-2">
                  {images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {images.map((url, index) => (
                        <div key={index} className="relative group">
                          <Image
                            src={url}
                            alt={`Review image ${index + 1}`}
                            width={100}
                            height={100}
                            className="w-full h-24 object-cover rounded border border-gray-300"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {images.length < MAX_IMAGES && (
                    <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-[#D4AF37] transition-colors">
                      <div className="flex flex-col items-center">
                        {uploadingImages ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#D4AF37]"></div>
                        ) : (
                          <>
                            <Upload className="h-6 w-6 text-gray-400 mb-1" />
                            <span className="text-xs text-gray-500">Upload images (max {MAX_IMAGES}, 5MB each)</span>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        disabled={uploadingImages}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || formData.review_text.length < 10 || !formData.customer_name.trim()}
                className="flex-1 bg-[#D4AF37] hover:bg-[#C19B2E] disabled:opacity-50 disabled:cursor-not-allowed"
                title={
                  isSubmitting
                    ? "Submitting review..."
                    : formData.review_text.length < 10
                    ? "Review must be at least 10 characters"
                    : !formData.customer_name.trim()
                    ? "Please enter your name"
                    : "Submit your review"
                }
                onClick={(e) => {
                  // Debug: Log button click
                  console.log("[ReviewForm] Submit button clicked", {
                    isSubmitting,
                    reviewLength: formData.review_text.length,
                    hasName: !!formData.customer_name.trim(),
                    disabled: isSubmitting || formData.review_text.length < 10 || !formData.customer_name.trim()
                  });
                  
                  // If button is enabled, ensure form submission happens
                  if (!isSubmitting && formData.review_text.length >= 10 && formData.customer_name.trim()) {
                    // Prevent default to avoid double submission, then call handleSubmit directly
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const form = e.currentTarget.closest('form') as HTMLFormElement;
                    if (form) {
                      // Create a proper synthetic event
                      const syntheticEvent = {
                        preventDefault: () => {},
                        stopPropagation: () => {},
                        currentTarget: form,
                        target: form,
                        nativeEvent: e.nativeEvent,
                        bubbles: true,
                        cancelable: true,
                        defaultPrevented: false,
                        eventPhase: 0,
                        isTrusted: false,
                        timeStamp: Date.now(),
                        type: 'submit',
                      } as unknown as React.FormEvent<HTMLFormElement>;
                      
                      handleSubmit(syntheticEvent);
                    }
                  }
                }}
              >
                {isSubmitting ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

