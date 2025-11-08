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
    <div className="space-y-6">
      {/* Title & Price - Minimal */}
      <div>
        <h1 className="font-serif text-2xl md:text-3xl font-light mb-3 tracking-tight text-gray-900">{product.title}</h1>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl font-semibold text-gray-900">₹{product.price}</span>
          {product.mrp && product.mrp > product.price && (
            <span className="text-lg text-gray-400 line-through">₹{product.mrp}</span>
          )}
          {product.is_new && !isOutOfStock && (
            <span className="bg-gray-900 text-white text-xs px-2.5 py-1 rounded-full font-medium">New</span>
          )}
        </div>
      </div>

      {/* Benefits - Minimal */}
      <div className="flex flex-wrap gap-4 text-xs border-b border-gray-100 pb-4">
        <div className="flex items-center gap-1.5 text-gray-600">
          <Shield className="h-4 w-4 text-gray-400" />
          <span>Anti-tarnish</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-600">
          <Check className="h-4 w-4 text-gray-400" />
          <span>Hypoallergenic</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-600">
          <RotateCcw className="h-4 w-4 text-gray-400" />
          <span>30-day return</span>
        </div>
      </div>

      {/* Size Options - Minimal */}
      {product.size_options && product.size_options.length > 0 && (
        <div>
          <label className="block text-xs font-medium mb-2 text-gray-700">Size</label>
          <div className="flex flex-wrap gap-2">
            {product.size_options.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`px-4 py-2 rounded-lg border text-xs font-medium transition-all ${
                  selectedSize === size
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 hover:border-gray-400 text-gray-700"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity - Minimal */}
      <div>
        <label className="block text-xs font-medium mb-2 text-gray-700">Quantity</label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="w-10 h-10 rounded-lg border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all font-medium text-base"
          >
            −
          </button>
          <span className="w-12 text-center text-base font-semibold">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => q + 1)}
            className="w-10 h-10 rounded-lg border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all font-medium text-base"
          >
            +
          </button>
        </div>
      </div>

      {/* Add to Cart & Buy Now / Notify Me - Minimal */}
      <div className="flex gap-3 pt-2">
        {isOutOfStock ? (
          <Button
            onClick={handleNotifyMe}
            className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Notify Me
          </Button>
        ) : (
          <>
            <Button
              onClick={handleAddToCart}
              className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 rounded-lg transition-all"
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
              className="flex-1 border border-gray-300 hover:border-gray-400 py-3 rounded-lg font-medium hover:bg-gray-50 transition-all"
            >
              Buy Now
            </Button>
          </>
        )}
        <Button
          onClick={handleWishlistToggle}
          variant="outline"
          className="px-4 border border-gray-300 hover:border-gray-400 rounded-lg hover:bg-gray-50 transition-all"
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className={`h-4 w-4 transition-all ${
              inWishlist
                ? "fill-gray-900 text-gray-900"
                : "text-gray-600"
            }`}
          />
        </Button>
      </div>

      {/* Tabs - Minimal */}
      <div className="border-t border-gray-100 pt-6">
        <div className="flex gap-4 border-b border-gray-100 mb-4">
          <button
            onClick={() => setActiveTab("description")}
            className={`pb-2 text-xs font-medium transition-all relative ${
              activeTab === "description"
                ? "text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Description
            {activeTab === "description" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("shipping")}
            className={`pb-2 text-xs font-medium transition-all relative ${
              activeTab === "shipping"
                ? "text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Shipping & Returns
            {activeTab === "shipping" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`pb-2 text-xs font-medium transition-all relative ${
              activeTab === "reviews"
                ? "text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Reviews
            {activeTab === "reviews" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></span>
            )}
          </button>
        </div>

        <div className="max-w-none">
          {activeTab === "description" && (
            <div>
              <p className="text-gray-600 mb-4 leading-relaxed text-sm">{product.description}</p>
              {product.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-gray-100 text-gray-600 px-3 py-1 rounded text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "shipping" && (
            <div className="space-y-4 text-xs text-gray-600">
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2 text-sm text-gray-900">
                  <Truck className="h-4 w-4 text-gray-400" />
                  Shipping
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Free shipping on orders over ₹999</li>
                  <li>Standard shipping: ₹50 (3-5 business days)</li>
                  <li>Express shipping: ₹150 (1-2 business days)</li>
                  <li>We ship across India</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2 text-sm text-gray-900">
                  <RotateCcw className="h-4 w-4 text-gray-400" />
                  Returns
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>30-day return policy</li>
                  <li>Items must be unworn and in original packaging</li>
                  <li>Return shipping costs are the customer's responsibility</li>
                  <li>Refunds processed within 5-7 business days</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="text-center py-8 text-gray-400 text-xs">
              <p>No reviews yet. Be the first to review this product!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailClient;

