"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/components/AuthProvider";
import { useWishlist } from "@/lib/wishlist-context";
import type { Product } from "@/lib/products-types";
import { Check, Shield, Truck, RotateCcw, Heart, Bell } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

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
  const inWishlist = isInWishlist(product.product_id);
  const isOutOfStock = product.stock_qty === 0;

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
    
    // TODO: Implement notify me functionality
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
    <div className="space-y-4 md:space-y-6">
      {/* Title & Price - Compact Mobile */}
      <div>
        <h1 className="font-serif text-xl md:text-3xl font-light mb-2 md:mb-4 tracking-tight text-gray-900 dark:text-white leading-tight">{product.title}</h1>
        <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-5 flex-wrap">
          <span className="text-2xl md:text-2xl font-bold md:font-semibold text-gray-900 dark:text-gray-50">₹{product.price.toLocaleString()}</span>
          {product.mrp && product.mrp > product.price && (
            <span className="text-lg md:text-lg text-gray-400 dark:text-gray-500 line-through">₹{product.mrp.toLocaleString()}</span>
          )}
          {product.is_new && !isOutOfStock && (
            <span className="bg-[#D4AF37] text-white text-[10px] md:text-xs px-2 md:px-2.5 py-1 md:py-1 rounded-full font-semibold md:font-medium shadow-sm">New</span>
          )}
        </div>
      </div>

      {/* Benefits - Compact Mobile */}
      <div className="flex flex-wrap gap-2 md:gap-4 text-xs md:text-xs border-b border-gray-200 dark:border-white/10 pb-3 md:pb-4">
        <div className="flex items-center gap-1.5 md:gap-1.5 text-gray-600 dark:text-gray-400">
          <Shield className="h-4 w-4 md:h-4 md:w-4 text-[#D4AF37]" />
          <span className="font-medium">Anti-tarnish</span>
        </div>
        <div className="flex items-center gap-1.5 md:gap-1.5 text-gray-600 dark:text-gray-400">
          <Check className="h-4 w-4 md:h-4 md:w-4 text-[#D4AF37]" />
          <span className="font-medium">Hypoallergenic</span>
        </div>
        <div className="flex items-center gap-1.5 md:gap-1.5 text-gray-600 dark:text-gray-400">
          <RotateCcw className="h-4 w-4 md:h-4 md:w-4 text-[#D4AF37]" />
          <span className="font-medium">30-day return</span>
        </div>
      </div>

      {/* Size Options - Compact Mobile */}
      {product.size_options && product.size_options.length > 0 && (
        <div>
          <label className="block text-xs md:text-xs font-semibold md:font-medium mb-2 md:mb-2 text-gray-900 dark:text-white md:text-gray-700">Size</label>
          <div className="flex flex-wrap gap-2 md:gap-2">
            {product.size_options.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`px-3 md:px-4 py-2 md:py-2 rounded-lg md:rounded-lg border-2 md:border text-xs md:text-xs font-semibold md:font-medium transition-all touch-manipulation ${
                  selectedSize === size
                    ? "border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-black shadow-md"
                    : "border-gray-200 dark:border-white/10 active:border-gray-400 dark:active:border-white/30 md:hover:border-gray-400 dark:md:hover:border-white/30 active:bg-gray-50 dark:active:bg-[#1a1a1a] md:hover:bg-gray-50 dark:md:hover:bg-[#1a1a1a] text-gray-700 dark:text-gray-300"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity - Compact Mobile */}
      <div>
        <label className="block text-xs md:text-xs font-semibold md:font-medium mb-2 md:mb-2 text-gray-900 dark:text-white md:text-gray-700">Quantity</label>
        <div className="flex items-center gap-3 md:gap-3">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="w-10 h-10 md:w-10 md:h-10 rounded-lg md:rounded-lg border-2 md:border border-gray-200 dark:border-white/10 active:border-gray-400 dark:active:border-white/30 md:hover:border-gray-400 dark:md:hover:border-white/30 active:bg-gray-100 dark:active:bg-[#1a1a1a] md:hover:bg-gray-50 dark:md:hover:bg-[#1a1a1a] transition-all font-bold md:font-medium text-base md:text-base touch-manipulation text-gray-900 dark:text-white"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-12 md:w-12 text-center text-base md:text-base font-bold md:font-semibold text-gray-900 dark:text-white">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => q + 1)}
            className="w-10 h-10 md:w-10 md:h-10 rounded-lg md:rounded-lg border-2 md:border border-gray-200 dark:border-white/10 active:border-gray-400 dark:active:border-white/30 md:hover:border-gray-400 dark:md:hover:border-white/30 active:bg-gray-100 dark:active:bg-[#1a1a1a] md:hover:bg-gray-50 dark:md:hover:bg-[#1a1a1a] transition-all font-bold md:font-medium text-base md:text-base touch-manipulation text-gray-900 dark:text-white"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      {/* Add to Cart & Buy Now / Notify Me - Compact Mobile */}
      <div className="flex gap-2 md:gap-3 pt-2 md:pt-2">
        {isOutOfStock ? (
          <Button
            onClick={handleNotifyMe}
            className="flex-1 bg-[#D4AF37] active:bg-[#C19B2E] md:hover:bg-[#C19B2E] text-white font-semibold md:font-medium py-3 md:py-3 rounded-lg md:rounded-lg transition-all flex items-center justify-center gap-2 touch-manipulation shadow-md md:shadow-sm text-sm md:text-base"
          >
            <Bell className="h-4 w-4 md:h-4 md:w-4" />
            Notify Me
          </Button>
        ) : (
          <>
            <Button
              onClick={handleAddToCart}
              className="flex-1 bg-[#D4AF37] active:bg-[#C19B2E] md:hover:bg-[#C19B2E] text-white font-semibold md:font-medium py-3 md:py-3 rounded-lg md:rounded-lg transition-all touch-manipulation shadow-md md:shadow-sm text-sm md:text-base"
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
              className="flex-1 border-2 md:border border-gray-300 dark:border-white/10 active:border-gray-400 dark:active:border-white/30 md:hover:border-gray-400 dark:md:hover:border-white/30 py-3 md:py-3 rounded-lg md:rounded-lg font-semibold md:font-medium active:bg-gray-50 dark:active:bg-[#1a1a1a] md:hover:bg-gray-50 dark:md:hover:bg-[#1a1a1a] transition-all touch-manipulation text-sm md:text-base text-gray-900 dark:text-white"
            >
              Buy Now
            </Button>
          </>
        )}
        <Button
          onClick={handleWishlistToggle}
          variant="outline"
          className="px-4 md:px-4 py-3 md:py-3 border-2 md:border border-gray-300 dark:border-white/10 active:border-gray-400 dark:active:border-white/30 md:hover:border-gray-400 dark:md:hover:border-white/30 rounded-lg md:rounded-lg active:bg-gray-50 dark:active:bg-[#1a1a1a] md:hover:bg-gray-50 dark:md:hover:bg-[#1a1a1a] transition-all touch-manipulation"
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className={`h-4 w-4 md:h-4 md:w-4 transition-all ${
              inWishlist
                ? "fill-[#D4AF37] text-[#D4AF37]"
                : "text-gray-600 dark:text-white active:text-[#D4AF37] md:hover:text-[#D4AF37]"
            }`}
          />
        </Button>
      </div>

      {/* Tabs - Compact Mobile */}
      <div className="border-t border-gray-200 dark:border-white/10 pt-4 md:pt-6">
        <div className="flex gap-2 md:gap-4 border-b border-gray-200 dark:border-white/10 mb-3 md:mb-4 overflow-x-auto scrollbar-hide -mx-1 px-1">
          <button
            onClick={() => setActiveTab("description")}
            className={`pb-2 md:pb-2 text-xs md:text-xs font-semibold md:font-medium transition-all relative whitespace-nowrap touch-manipulation px-2 ${
              activeTab === "description"
                ? "text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-gray-400 active:text-gray-700 dark:active:text-gray-300 md:hover:text-gray-700 dark:md:hover:text-gray-300"
            }`}
          >
            Description
            {activeTab === "description" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37]"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("shipping")}
            className={`pb-2 md:pb-2 text-xs md:text-xs font-semibold md:font-medium transition-all relative whitespace-nowrap touch-manipulation px-2 ${
              activeTab === "shipping"
                ? "text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-gray-400 active:text-gray-700 dark:active:text-gray-300 md:hover:text-gray-700 dark:md:hover:text-gray-300"
            }`}
          >
            Shipping & Returns
            {activeTab === "shipping" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37]"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`pb-2 md:pb-2 text-xs md:text-xs font-semibold md:font-medium transition-all relative whitespace-nowrap touch-manipulation px-2 ${
              activeTab === "reviews"
                ? "text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-gray-400 active:text-gray-700 dark:active:text-gray-300 md:hover:text-gray-700 dark:md:hover:text-gray-300"
            }`}
          >
            Reviews
            {activeTab === "reviews" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37]"></span>
            )}
          </button>
        </div>

        <div className="max-w-none">
          {activeTab === "description" && (
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-4 md:mb-4 leading-relaxed text-sm md:text-sm">{product.description}</p>
              {product.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 md:gap-2">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 px-3 md:px-3 py-1.5 md:py-1 rounded-md md:rounded text-xs md:text-xs font-medium border border-gray-200 dark:border-white/10"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "shipping" && (
            <div className="space-y-4 md:space-y-4 text-xs md:text-xs text-gray-600 dark:text-gray-400">
              <div>
                <h4 className="font-semibold md:font-medium mb-2 md:mb-2 flex items-center gap-2 text-sm md:text-sm text-gray-900 dark:text-white">
                  <Truck className="h-4 w-4 md:h-4 md:w-4 text-[#D4AF37]" />
                  Shipping
                </h4>
                <ul className="list-disc list-inside space-y-1 md:space-y-1 ml-2">
                  <li>Free shipping on orders over ₹999</li>
                  <li>Standard shipping: ₹50 (3-5 business days)</li>
                  <li>Express shipping: ₹150 (1-2 business days)</li>
                  <li>We ship across India</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold md:font-medium mb-2 md:mb-2 flex items-center gap-2 text-sm md:text-sm text-gray-900 dark:text-white">
                  <RotateCcw className="h-4 w-4 md:h-4 md:w-4 text-[#D4AF37]" />
                  Returns
                </h4>
                <ul className="list-disc list-inside space-y-1 md:space-y-1 ml-2">
                  <li>30-day return policy</li>
                  <li>Items must be unworn and in original packaging</li>
                  <li>Return shipping costs are the customer's responsibility</li>
                  <li>Refunds processed within 5-7 business days</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="text-center py-8 md:py-8 text-gray-400 dark:text-gray-500 text-xs md:text-xs">
              <p>No reviews yet. Be the first to review this product!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailClient;

