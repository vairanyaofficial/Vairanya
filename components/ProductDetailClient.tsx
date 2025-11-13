"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/components/AuthProvider";
import { useWishlist } from "@/lib/wishlist-context";
import type { Product } from "@/lib/products-types";
import type { Review } from "@/lib/reviews-types";
import { Check, Shield, Truck, RotateCcw, Heart, Bell, Star, MessageSquare, Sparkles } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import Image from "next/image";
import Link from "next/link";

interface ProductDetailClientProps {
  product: Product;
}

const ProductDetailClient: React.FC<ProductDetailClientProps> = ({ product }) => {
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { showToast, showWarning, showSuccess } = useToast();
  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    product.size_options?.[0]
  );
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"description" | "shipping" | "reviews">(
    "description"
  );
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const inWishlist = isInWishlist(product.product_id);
  const isOutOfStock = product.stock_qty === 0;

  // Fetch reviews when reviews tab is active
  useEffect(() => {
    if (activeTab === "reviews") {
      fetchReviews();
    }
  }, [activeTab, product.product_id]);

  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const response = await fetch(`/api/reviews?product_id=${product.product_id}`);
      const data = await response.json();
      if (data.success) {
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleAddToCart = () => {
    if (isOutOfStock) {
      showWarning("This product is currently out of stock");
      return;
    }
    addToCart(product, quantity, selectedSize);
    showToast(`${product.title} added to cart!`);
  };

  const handleNotifyMe = () => {
    if (!user) {
      showWarning("Please login to get notified when this product is back in stock");
      const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";
      router.push("/login?callbackUrl=" + encodeURIComponent(currentPath));
      return;
    }
    
    showSuccess("We'll notify you when this product is back in stock!");
  };

  const handleWishlistToggle = async () => {
    if (!user) {
      showToast("Please login to add items to wishlist");
      const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";
      router.push("/login?callbackUrl=" + encodeURIComponent(currentPath));
      return;
    }

    if (inWishlist) {
      await removeFromWishlist(product.product_id);
      showToast("Removed from wishlist");
    } else {
      await addToWishlist(product.product_id);
      showToast("Added to wishlist");
    }
  };

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Header Section - Compact */}
      <div className="space-y-2">
        {/* Category Badge */}
        <div className="flex items-center gap-1.5">
          <Link 
            href={`/products?category=${product.category}`}
            className="text-[10px] font-medium text-[#D4AF37] uppercase tracking-wider hover:underline transition-colors"
          >
            {product.category}
          </Link>
          {product.is_new && !isOutOfStock && (
            <span className="bg-[#D4AF37] text-white text-[9px] px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-0.5">
              <Sparkles className="h-2.5 w-2.5" />
              New
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="font-serif text-lg sm:text-xl md:text-2xl font-light tracking-tight text-gray-900 dark:text-white leading-tight">
          {product.title}
        </h1>

        {/* Price Section - Compact */}
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            ₹{product.price.toLocaleString()}
          </span>
          {product.mrp && product.mrp > product.price && (
            <>
              <span className="text-sm md:text-base text-gray-400 dark:text-gray-500 line-through">
                ₹{product.mrp.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-[#D4AF37]">
                {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF
              </span>
            </>
          )}
        </div>

        {/* Stock Status - Compact */}
        {isOutOfStock ? (
          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-[10px]">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
            <span className="font-medium text-red-700 dark:text-red-300">Out of Stock</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-[10px]">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
            <span className="font-medium text-green-700 dark:text-green-300">In Stock</span>
          </div>
        )}
      </div>

      {/* Benefits - Compact */}
      <div className="grid grid-cols-3 gap-2 p-2 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-[#0a0a0a] dark:to-[#1a1a1a] rounded-lg border border-gray-200 dark:border-white/10">
        <div className="flex flex-col items-center gap-1 text-gray-700 dark:text-gray-300">
          <div className="p-1.5 rounded bg-[#D4AF37]/10">
            <Shield className="h-3 w-3 text-[#D4AF37]" />
          </div>
          <span className="text-[10px] font-medium text-center">Anti-tarnish</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-gray-700 dark:text-gray-300">
          <div className="p-1.5 rounded bg-[#D4AF37]/10">
            <Check className="h-3 w-3 text-[#D4AF37]" />
          </div>
          <span className="text-[10px] font-medium text-center">Hypoallergenic</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-gray-700 dark:text-gray-300">
          <div className="p-1.5 rounded bg-[#D4AF37]/10">
            <RotateCcw className="h-3 w-3 text-[#D4AF37]" />
          </div>
          <span className="text-[10px] font-medium text-center">30-day return</span>
        </div>
      </div>

      {/* Size Options & Quantity - Compact Row */}
      <div className="space-y-2">
        {product.size_options && product.size_options.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-900 dark:text-white">Size</label>
            <div className="flex flex-wrap gap-1.5">
              {product.size_options.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-2.5 py-1.5 rounded-md border text-xs font-semibold transition-all ${
                    selectedSize === size
                      ? "border-[#D4AF37] bg-[#D4AF37] text-white"
                      : "border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] text-gray-700 dark:text-gray-300 hover:border-[#D4AF37]/50"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantity - Compact */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-900 dark:text-white">Quantity</label>
          <div className="flex items-center gap-2 w-fit">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all font-bold text-sm text-gray-900 dark:text-white flex items-center justify-center"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-10 text-center text-sm font-bold text-gray-900 dark:text-white">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 h-8 rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all font-bold text-sm text-gray-900 dark:text-white flex items-center justify-center"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons - Compact */}
      <div className="space-y-2 pt-1">
        {isOutOfStock ? (
          <Button
            onClick={handleNotifyMe}
            className="w-full bg-[#D4AF37] hover:bg-[#C19B2E] text-white font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 text-sm"
          >
            <Bell className="h-4 w-4" />
            Notify Me When Available
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={handleAddToCart}
              className="flex-1 bg-[#D4AF37] hover:bg-[#C19B2E] text-white font-semibold py-2.5 rounded-lg transition-all text-sm"
            >
              Add to Cart
            </Button>
            <Button
              onClick={() => {
                if (!user) {
                  router.push("/login?callbackUrl=/checkout");
                  return;
                }
                handleAddToCart();
                window.location.href = "/checkout";
              }}
              variant="outline"
              className="flex-1 border border-gray-300 dark:border-white/10 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 py-2.5 rounded-lg font-semibold transition-all text-sm text-gray-900 dark:text-white"
            >
              Buy Now
            </Button>
            <Button
              onClick={handleWishlistToggle}
              variant="outline"
              className="px-3 border border-gray-300 dark:border-white/10 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 rounded-lg transition-all"
              aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart
                className={`h-4 w-4 transition-all ${
                  inWishlist
                    ? "fill-[#D4AF37] text-[#D4AF37]"
                    : "text-gray-600 dark:text-white hover:text-[#D4AF37]"
                }`}
              />
            </Button>
          </div>
        )}
      </div>

      {/* Tabs - Compact */}
      <div className="border-t border-gray-200 dark:border-white/10 pt-3">
        <div className="flex gap-0.5 border-b border-gray-200 dark:border-white/10 mb-3 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab("description")}
            className={`pb-2 px-3 text-xs font-semibold transition-all relative whitespace-nowrap ${
              activeTab === "description"
                ? "text-[#D4AF37]"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Description
            {activeTab === "description" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37] rounded-t"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("shipping")}
            className={`pb-2 px-3 text-xs font-semibold transition-all relative whitespace-nowrap ${
              activeTab === "shipping"
                ? "text-[#D4AF37]"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Shipping
            {activeTab === "shipping" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37] rounded-t"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`pb-2 px-3 text-xs font-semibold transition-all relative whitespace-nowrap ${
              activeTab === "reviews"
                ? "text-[#D4AF37]"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Reviews {reviews.length > 0 && `(${reviews.length})`}
            {activeTab === "reviews" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37] rounded-t"></span>
            )}
          </button>
        </div>

        <div className="max-w-none">
          {activeTab === "description" && (
            <div className="space-y-2">
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                {product.description}
              </p>
              {product.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs font-medium border border-gray-200 dark:border-white/10"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "shipping" && (
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 dark:bg-[#0a0a0a] rounded-lg border border-gray-200 dark:border-white/10">
                <h4 className="font-semibold mb-2 flex items-center gap-1.5 text-sm text-gray-900 dark:text-white">
                  <Truck className="h-4 w-4 text-[#D4AF37]" />
                  Shipping
                </h4>
                <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-1.5">
                    <Check className="h-3 w-3 text-[#D4AF37] mt-0.5 flex-shrink-0" />
                    <span>Free shipping on orders over ₹999</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="h-3 w-3 text-[#D4AF37] mt-0.5 flex-shrink-0" />
                    <span>Standard: ₹50 (3-5 days)</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="h-3 w-3 text-[#D4AF37] mt-0.5 flex-shrink-0" />
                    <span>Express: ₹150 (1-2 days)</span>
                  </li>
                </ul>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-[#0a0a0a] rounded-lg border border-gray-200 dark:border-white/10">
                <h4 className="font-semibold mb-2 flex items-center gap-1.5 text-sm text-gray-900 dark:text-white">
                  <RotateCcw className="h-4 w-4 text-[#D4AF37]" />
                  Returns
                </h4>
                <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-1.5">
                    <Check className="h-3 w-3 text-[#D4AF37] mt-0.5 flex-shrink-0" />
                    <span>30-day return policy</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="h-3 w-3 text-[#D4AF37] mt-0.5 flex-shrink-0" />
                    <span>Unworn items in original packaging</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="h-3 w-3 text-[#D4AF37] mt-0.5 flex-shrink-0" />
                    <span>Refunds in 5-7 business days</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="space-y-3">
              {loadingReviews ? (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#D4AF37] mx-auto mb-2"></div>
                  <p className="text-xs">Loading reviews...</p>
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium mb-1">No reviews yet</p>
                  <p className="text-xs">Be the first to review!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-3 bg-gray-50 dark:bg-[#0a0a0a] rounded-lg border border-gray-200 dark:border-white/10"
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                              {review.customer_name}
                            </h4>
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3 w-3 ${
                                    star <= review.rating
                                      ? "fill-[#D4AF37] text-[#D4AF37]"
                                      : "text-gray-300 dark:text-gray-600"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-2">
                            {review.review_text}
                          </p>
                          {/* Review Images */}
                          {review.images && review.images.length > 0 && (
                            <div className="grid grid-cols-3 gap-1.5 mt-2">
                              {review.images.map((imageUrl, index) => (
                                <div
                                  key={index}
                                  className="relative aspect-square rounded border border-gray-200 dark:border-white/10 overflow-hidden"
                                >
                                  <Image
                                    src={imageUrl}
                                    alt={`Review image ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 640px) 33vw, 100px"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailClient;
