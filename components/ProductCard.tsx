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
    <div className={`group relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-[#D4AF37]/40 hover:shadow-md transition-all duration-200 ${isOutOfStock ? 'opacity-60' : ''}`}>
      <Link href={`/products/${product.slug}`} className="block">
        {/* Image Container - Compact */}
        <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
          <Image
            src={product.images[0] || "/images/ring-1.jpg"}
            alt={product.title}
            fill
            className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            unoptimized={product.images[0]?.startsWith("http")}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== "/images/ring-1.jpg") {
                target.src = "/images/ring-1.jpg";
              }
            }}
          />
          {/* New Badge - Minimal */}
          {product.is_new && !isOutOfStock && (
            <span className="absolute top-2 left-2 bg-[#D4AF37] text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
              New
            </span>
          )}
          {/* Wishlist Button - Minimal */}
          <button
            onClick={handleWishlistToggle}
            className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white transition-all duration-200"
            aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              className={`h-3.5 w-3.5 transition-all duration-200 ${
                inWishlist
                  ? "fill-[#D4AF37] text-[#D4AF37]"
                  : "text-gray-400 hover:text-[#D4AF37]"
              }`}
            />
          </button>
        </div>

        {/* Content - Compact */}
        <div className="p-3">
          <h4 className="font-medium text-sm font-serif mb-1 line-clamp-1 group-hover:text-[#D4AF37] transition-colors">
            {product.title}
          </h4>
          <div className="flex items-center justify-between mt-2">
            <span className="font-semibold text-base text-gray-900">₹{product.price.toLocaleString()}</span>
            {product.mrp && product.mrp > product.price && (
              <span className="text-xs text-gray-400 line-through">₹{product.mrp.toLocaleString()}</span>
            )}
          </div>
        </div>
      </Link>

      {/* Add to Cart Button - Minimal */}
      <div className="px-3 pb-3">
        {isOutOfStock ? (
          <button
            onClick={handleNotifyMe}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium py-2 rounded-md transition-all duration-200 flex items-center justify-center gap-1.5"
          >
            <Bell className="h-3.5 w-3.5" />
            Notify Me
          </button>
        ) : (
          <button
            onClick={handleAddToCart}
            className="w-full bg-[#D4AF37] hover:bg-[#C19B2E] text-white text-xs font-medium py-2 rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm hover:shadow"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
