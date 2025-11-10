"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/components/AuthProvider";
import { useWishlist } from "@/lib/wishlist-context";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";
import { Image } from "@imagekit/next";
import { useCart } from "@/lib/cart-context";
import type { Product } from "@/lib/products-types";
import { ProductGridSkeleton } from "@/components/SkeletonLoader";

export default function WishlistPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, isLoading, removeFromWishlist, refreshWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/login?callbackUrl=/wishlist");
      return;
    }

    fetchProducts();
  }, [user, items, router]);

  const fetchProducts = async () => {
    if (items.length === 0) {
      setProducts([]);
      setLoadingProducts(false);
      return;
    }

    try {
      setLoadingProducts(true);
      const response = await fetch("/api/products");
      const data = await response.json();

      if (data.success) {
        // Filter products that are in wishlist
        const wishlistProductIds = items.map((item) => item.product_id);
        const wishlistProducts = data.products.filter((product: Product) =>
          wishlistProductIds.includes(product.product_id)
        );
        setProducts(wishlistProducts);
      }
    } catch (error) {
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleRemove = async (productId: string) => {
    await removeFromWishlist(productId);
    await refreshWishlist();
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product);
  };

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50/30 to-white dark:from-black dark:via-black dark:to-black">
      <Header />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-8">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-light mb-2 sm:mb-3 tracking-tight text-gray-900 dark:text-white">My Wishlist</h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400">
              {items.length} {items.length === 1 ? "item" : "items"} saved
            </p>
          </div>
        </div>

        {isLoading || loadingProducts ? (
          <ProductGridSkeleton count={4} />
        ) : items.length === 0 ? (
          <div className="glass-card rounded-xl md:rounded-2xl border border-gray-200/50 dark:border-white/10 p-8 sm:p-12 md:p-16 text-center shadow-sm backdrop-blur-md">
            <Heart className="h-16 w-16 sm:h-20 sm:w-20 text-gray-300 dark:text-gray-700 mx-auto mb-4 sm:mb-6" />
            <h2 className="font-serif text-2xl sm:text-3xl font-light mb-2 sm:mb-3 tracking-tight text-gray-900 dark:text-white">Your wishlist is empty</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 text-base sm:text-lg">
              Start adding products you love to your wishlist
            </p>
            <Link href="/products">
              <Button className="bg-[#D4AF37] hover:bg-[#C19B2E] text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all duration-300">
                <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
                Browse Collection
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
            {products.map((product) => (
              <div
                key={product.product_id}
                className="glass-card rounded-xl md:rounded-2xl border border-gray-200/50 dark:border-white/10 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 relative group backdrop-blur-md"
              >
                {/* Remove from wishlist button */}
                <button
                  onClick={() => handleRemove(product.product_id)}
                  className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 p-2 sm:p-2.5 rounded-full glass backdrop-blur-md shadow-lg hover:glass-strong hover:scale-110 transition-all duration-300"
                  aria-label="Remove from wishlist"
                >
                  <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 dark:text-red-400" />
                </button>

                <Link href={`/products/${product.slug}`}>
                  <div className="h-48 sm:h-56 md:h-64 w-full bg-gradient-to-br from-gray-50/50 to-gray-100/50 dark:from-black/20 dark:to-black/20 flex items-center justify-center overflow-hidden group-hover:bg-gradient-to-br group-hover:from-gray-100/50 dark:group-hover:from-black/30 group-hover:to-gray-50/50 dark:group-hover:to-black/30 transition-all duration-300 backdrop-blur-sm">
                    <Image
                      src={product.images[0] || "/images/ring-1.jpg"}
                      alt={product.title}
                      width={400}
                      height={320}
                      className="object-contain group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-3 sm:p-4 md:p-5">
                    <h4 className="font-medium text-sm sm:text-base font-serif mb-1.5 sm:mb-2 group-hover:text-[#D4AF37] dark:group-hover:text-[#D4AF37] transition-colors text-gray-900 dark:text-white line-clamp-2">
                      {product.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2 sm:mb-3 line-clamp-2 leading-relaxed">
                      {product.short_description || product.description}
                    </p>
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white">₹{product.price.toLocaleString()}</div>
                      {product.is_new && (
                        <span className="text-[10px] sm:text-xs bg-gradient-to-r from-[#D4AF37] to-[#C19B2E] text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-medium shadow-sm">
                          New
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
                <div className="px-3 sm:px-4 md:px-5 pb-3 sm:pb-4 md:pb-5">
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      handleAddToCart(product);
                    }}
                    className="w-full bg-[#D4AF37] hover:bg-[#C19B2E] text-white font-medium text-xs sm:text-sm py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
                    Add to Cart
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

