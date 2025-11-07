"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/products-types";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import { Heart, Bell } from "lucide-react";

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
  };

  const handleNotifyMe = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      showWarning("Please login to get notified when this product is back in stock");
      return;
    }
    
    // TODO: Implement notify me functionality
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
    }
  };

  return (
    <Card className={`group rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all duration-300 relative border border-gray-100 ${isOutOfStock ? '[filter:grayscale(100%)]' : ''}`}>
      {/* Wishlist Button */}
      <button
        onClick={handleWishlistToggle}
        className="absolute top-3 right-3 z-10 p-2.5 rounded-full bg-white/90 backdrop-blur-md shadow-lg hover:bg-white transition-all duration-300 hover:scale-110"
        aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart
          className={`h-5 w-5 transition-all duration-300 ${
            inWishlist
              ? "fill-[#D4AF37] text-[#D4AF37] scale-110"
              : "text-gray-600 hover:text-[#D4AF37]"
          }`}
        />
      </button>
      <Link href={`/products/${product.slug}`}>
        <div className="h-64 w-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden relative group-hover:bg-gradient-to-br group-hover:from-gray-100 group-hover:to-gray-50 transition-all duration-300">
          <Image
            src={product.images[0] || "/images/ring-1.jpg"}
            alt={product.title}
            fill
            className="object-contain group-hover:scale-110 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            unoptimized={product.images[0]?.startsWith("http")}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== "/images/ring-1.jpg") {
                target.src = "/images/ring-1.jpg";
              }
            }}
          />
        </div>
        <CardContent className="p-5">
          <h4 className="font-medium text-base font-serif mb-2 group-hover:text-[#D4AF37] transition-colors">{product.title}</h4>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed">
            {product.short_description || product.description}
          </p>
          <div className="mt-4 flex items-center justify-between">
            <div className="font-semibold text-lg text-gray-900">₹{product.price}</div>
            {product.is_new && !isOutOfStock && (
              <span className="text-xs bg-gradient-to-r from-[#D4AF37] to-[#C19B2E] text-white px-3 py-1 rounded-full font-medium shadow-sm">New</span>
            )}
          </div>
        </CardContent>
      </Link>
      <div className="px-5 pb-5">
        {isOutOfStock ? (
          <Button
            onClick={handleNotifyMe}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Bell className="h-5 w-5" />
            Notify Me
          </Button>
        ) : (
          <Button
            onClick={handleAddToCart}
            className="w-full bg-[#D4AF37] hover:bg-[#C19B2E] text-white font-medium py-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
          >
            Add to Cart
          </Button>
        )}
      </div>
    </Card>
  );
};

export default ProductCard;
