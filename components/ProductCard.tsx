"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";
import type { Product } from "@/lib/products-types";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import { Heart, Bell, ShoppingBag } from "lucide-react";

type Props = {
  product: Product;
};

const ProductCard: React.FC<Props> = ({ product }) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const { showWarning, showSuccess } = useToast();
  const inWishlist = isInWishlist(product.product_id);
  const isOutOfStock = product.stock_qty === 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isOutOfStock) {
      showWarning("This product is currently out of stock");
      return;
    }
    
    addToCart(product);
    showSuccess("Added to cart");
  };

  const handleNotifyMe = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      showWarning("Please login to get notified when this product is back in stock");
      return;
    }
    
    showSuccess("We'll notify you when this product is back in stock!");
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      showWarning("Please login to add items to wishlist");
      return;
    }

    if (inWishlist) {
      await removeFromWishlist(product.product_id);
    } else {
      await addToWishlist(product.product_id);
      showSuccess("Added to wishlist");
    }
  };

  return (
    <div className={`group relative glass-card rounded-xl md:rounded-2xl border border-gray-200/50 dark:border-white/10 overflow-hidden active:border-[#D4AF37]/40 dark:active:border-[#D4AF37]/40 md:hover:border-[#D4AF37]/40 dark:md:hover:border-[#D4AF37]/40 active:shadow-lg md:hover:shadow-xl dark:active:shadow-lg dark:md:hover:shadow-xl transition-all duration-200 backdrop-blur-md ${isOutOfStock ? 'opacity-60' : ''}`}>
      <Link href={`/products/${product.slug}`} className="block">
        {/* Image Container - Mobile Optimized */}
        <div className="relative aspect-square bg-gradient-to-br from-gray-50/50 to-gray-100/50 dark:from-black/20 dark:to-black/20 overflow-hidden backdrop-blur-sm">
          <Image
            src={product.images[0] || "/images/ring-1.jpg"}
            alt={product.title}
            fill
            className="object-contain p-2 md:p-3 group-active:scale-105 md:group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            unoptimized={product.images[0]?.startsWith("http")}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== "/images/ring-1.jpg") {
                target.src = "/images/ring-1.jpg";
              }
            }}
          />
          {/* New Badge - Mobile Optimized */}
          {product.is_new && !isOutOfStock && (
            <span className="absolute top-2 left-2 bg-[#D4AF37] text-white text-[10px] md:text-[10px] font-semibold px-2.5 py-1 md:px-2 md:py-0.5 rounded-full shadow-sm">
              New
            </span>
          )}
          {/* Wishlist Button - Better Touch Target */}
          <button
            onClick={handleWishlistToggle}
            className="absolute top-2 right-2 z-10 p-2 md:p-1.5 rounded-full glass backdrop-blur-md shadow-lg active:glass-strong md:hover:glass-strong transition-all duration-200 touch-manipulation"
            aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              className={`h-4 w-4 md:h-3.5 md:w-3.5 transition-all duration-200 ${
                inWishlist
                  ? "fill-[#D4AF37] text-[#D4AF37]"
                  : "text-gray-400 dark:text-white active:text-[#D4AF37] dark:active:text-[#D4AF37] md:hover:text-[#D4AF37] dark:md:hover:text-[#D4AF37]"
              }`}
            />
          </button>
        </div>

        {/* Content - Mobile Optimized */}
        <div className="p-3 md:p-3">
          <h4 className="font-medium text-sm md:text-sm font-serif mb-1.5 md:mb-1 line-clamp-2 md:line-clamp-1 group-active:text-[#D4AF37] dark:group-active:text-[#D4AF37] md:group-hover:text-[#D4AF37] dark:md:group-hover:text-[#D4AF37] transition-colors min-h-[2.5rem] md:min-h-0 text-gray-900 dark:text-white">
            {product.title}
          </h4>
          <div className="flex items-center justify-between mt-2 md:mt-2 gap-2">
            <span className="font-bold md:font-semibold text-base md:text-base text-gray-900 dark:text-white">₹{product.price.toLocaleString()}</span>
            {product.mrp && product.mrp > product.price && (
              <span className="text-xs md:text-xs text-gray-400 dark:text-gray-600 line-through flex-shrink-0">₹{product.mrp.toLocaleString()}</span>
            )}
          </div>
        </div>
      </Link>

      {/* Add to Cart Button - Mobile Optimized */}
      <div className="px-3 pb-3 md:pb-3">
        {isOutOfStock ? (
          <button
            onClick={handleNotifyMe}
            className="w-full bg-gray-100 dark:bg-[#1a1a1a] active:bg-gray-200 dark:active:bg-[#2a2a2a] md:hover:bg-gray-200 dark:md:hover:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 text-sm md:text-xs font-semibold md:font-medium py-3 md:py-2 rounded-xl md:rounded-md transition-all duration-200 flex items-center justify-center gap-2 md:gap-1.5 touch-manipulation"
          >
            <Bell className="h-4 w-4 md:h-3.5 md:w-3.5" />
            Notify Me
          </button>
        ) : (
          <button
            onClick={handleAddToCart}
            className="w-full bg-[#D4AF37] active:bg-[#C19B2E] md:hover:bg-[#C19B2E] text-white text-sm md:text-xs font-semibold md:font-medium py-3 md:py-2 rounded-xl md:rounded-md transition-all duration-200 flex items-center justify-center gap-2 md:gap-1.5 shadow-md active:shadow-lg md:hover:shadow touch-manipulation"
          >
            <ShoppingBag className="h-4 w-4 md:h-3.5 md:w-3.5" />
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
