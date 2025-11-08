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
    <div className="space-y-8">
      {/* Title & Price */}
      <div>
        <h1 className="font-serif text-4xl md:text-5xl font-light mb-4 tracking-tight">{product.title}</h1>
        <div className="flex items-center gap-4 mb-6">
          <span className="text-3xl font-semibold text-gray-900">₹{product.price}</span>
          {product.mrp && product.mrp > product.price && (
            <span className="text-xl text-gray-400 line-through">₹{product.mrp}</span>
          )}
          {product.is_new && !isOutOfStock && (
            <span className="bg-gradient-to-r from-[#D4AF37] to-[#C19B2E] text-white text-xs px-3 py-1.5 rounded-full font-medium shadow-sm">New</span>
          )}
        </div>
      </div>

      {/* Benefits */}
      <div className="flex flex-wrap gap-6 text-sm">
        <div className="flex items-center gap-2 text-gray-700">
          <div className="p-2 rounded-lg bg-[#D4AF37]/10">
            <Shield className="h-5 w-5 text-[#D4AF37]" />
          </div>
          <span className="font-medium">Anti-tarnish</span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <div className="p-2 rounded-lg bg-[#D4AF37]/10">
            <Check className="h-5 w-5 text-[#D4AF37]" />
          </div>
          <span className="font-medium">Hypoallergenic</span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <div className="p-2 rounded-lg bg-[#D4AF37]/10">
            <RotateCcw className="h-5 w-5 text-[#D4AF37]" />
          </div>
          <span className="font-medium">30-day return</span>
        </div>
      </div>

      {/* Size Options */}
      {product.size_options && product.size_options.length > 0 && (
        <div>
          <label className="block text-sm font-semibold mb-3 text-gray-900">Size</label>
          <div className="flex flex-wrap gap-3">
            {product.size_options.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`px-5 py-2.5 rounded-xl border-2 text-sm font-medium transition-all duration-300 ${
                  selectedSize === size
                    ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37] shadow-sm"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div>
        <label className="block text-sm font-semibold mb-3 text-gray-900">Quantity</label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="w-12 h-12 rounded-xl border-2 border-gray-200 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all duration-300 font-medium text-lg"
          >
            −
          </button>
          <span className="w-16 text-center text-lg font-semibold">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => q + 1)}
            className="w-12 h-12 rounded-xl border-2 border-gray-200 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all duration-300 font-medium text-lg"
          >
            +
          </button>
        </div>
      </div>

      {/* Add to Cart & Buy Now / Notify Me */}
      <div className="flex gap-4 pt-4">
        {isOutOfStock ? (
          <Button
            onClick={handleNotifyMe}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Bell className="h-5 w-5" />
            Notify Me
          </Button>
        ) : (
          <>
            <Button
              onClick={handleAddToCart}
              className="flex-1 bg-[#D4AF37] hover:bg-[#C19B2E] text-white font-medium py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Add to Cart
            </Button>
            <Button
              onClick={() => {
                if (!user) {
                  router.push("/auth/login?callbackUrl=/checkout");
                  return;
                }
                handleAddToCart();
                window.location.href = "/checkout";
              }}
              variant="outline"
              className="flex-1 border-2 border-gray-300 hover:border-[#D4AF37] px-8 py-6 rounded-xl font-medium hover:bg-[#D4AF37]/5 transition-all duration-300"
            >
              Buy Now
            </Button>
          </>
        )}
        <Button
          onClick={handleWishlistToggle}
          variant="outline"
          className="px-5 border-2 border-gray-300 hover:border-[#D4AF37] rounded-xl hover:bg-[#D4AF37]/5 transition-all duration-300"
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className={`h-5 w-5 transition-all duration-300 ${
              inWishlist
                ? "fill-[#D4AF37] text-[#D4AF37] scale-110"
                : "text-gray-600"
            }`}
          />
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-t border-gray-200 pt-8">
        <div className="flex gap-6 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("description")}
            className={`pb-3 text-sm font-semibold transition-all duration-300 relative ${
              activeTab === "description"
                ? "text-[#D4AF37]"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Description
            {activeTab === "description" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37]"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("shipping")}
            className={`pb-3 text-sm font-semibold transition-all duration-300 relative ${
              activeTab === "shipping"
                ? "text-[#D4AF37]"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Shipping & Returns
            {activeTab === "shipping" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37]"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`pb-3 text-sm font-semibold transition-all duration-300 relative ${
              activeTab === "reviews"
                ? "text-[#D4AF37]"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Reviews
            {activeTab === "reviews" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37]"></span>
            )}
          </button>
        </div>

        <div className="prose prose-sm max-w-none">
          {activeTab === "description" && (
            <div>
              <p className="text-gray-700 mb-6 leading-relaxed text-base">{product.description}</p>
              {product.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "shipping" && (
            <div className="space-y-6 text-sm text-gray-700">
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-base">
                  <Truck className="h-5 w-5 text-[#D4AF37]" />
                  Shipping
                </h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Free shipping on orders over ₹999</li>
                  <li>Standard shipping: ₹50 (3-5 business days)</li>
                  <li>Express shipping: ₹150 (1-2 business days)</li>
                  <li>We ship across India</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-base">
                  <RotateCcw className="h-5 w-5 text-[#D4AF37]" />
                  Returns
                </h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>30-day return policy</li>
                  <li>Items must be unworn and in original packaging</li>
                  <li>Return shipping costs are the customer's responsibility</li>
                  <li>Refunds processed within 5-7 business days</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="text-center py-12 text-gray-500">
              <p>No reviews yet. Be the first to review this product!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailClient;

