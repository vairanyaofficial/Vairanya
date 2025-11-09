"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Image } from "@imagekit/next";
import ProductCard from "./ProductCard";
import HorizontalSlider from "./HorizontalSlider";
import type { Product } from "@/lib/products-types";
import type { Collection } from "@/lib/collections-types";
import { ProductSliderSkeleton } from "@/components/SkeletonLoader";

interface ProductSuggestionsProps {
  product: Product;
}

interface SuggestionsData {
  relatedProducts: Product[];
  sameMetalFinishProducts: Product[];
  productCollections: Collection[];
  suggestedCollections: Collection[];
  otherCategories: string[];
  categoryImages: Record<string, string>;
}

export default function ProductSuggestions({ product }: ProductSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SuggestionsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch suggestions asynchronously
    const fetchSuggestions = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/products/${product.slug}/suggestions`);
        const result = await response.json();
        
        if (result.success && result.data) {
          setSuggestions(result.data);
        } else {
          setError(result.error || "Failed to load suggestions");
        }
      } catch (err) {
        console.error("Error fetching suggestions:", err);
        setError("Failed to load suggestions");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [product.slug]);

  // Create stable render functions
  const renderProductItem = useCallback((item: Product) => (
    <div className="min-w-[200px] max-w-[200px]">
      <ProductCard product={item} />
    </div>
  ), []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-10 md:space-y-16 mt-10 md:mt-20 border-t border-gray-100 dark:border-white/10 pt-8 md:pt-16">
        <div className="space-y-6 md:space-y-8">
          <div className="h-5 md:h-6 bg-gray-200 dark:bg-[#1a1a1a] rounded w-40 md:w-48 animate-pulse"></div>
          <ProductSliderSkeleton count={4} />
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !suggestions) {
    return null; // Fail silently, don't show error to user
  }

  const {
    relatedProducts,
    sameMetalFinishProducts,
    productCollections,
    suggestedCollections,
    otherCategories,
    categoryImages,
  } = suggestions;
  return (
    <div className="space-y-10 md:space-y-16 mt-10 md:mt-20 border-t border-gray-100 dark:border-white/10 pt-8 md:pt-16">
      {/* Related Products - Same Category */}
      {relatedProducts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-base md:text-lg font-medium text-gray-900 dark:text-white">Similar Products</h2>
            <Link 
              href={`/products?category=${product.category}`}
              className="text-xs md:text-sm text-gray-600 dark:text-gray-400 active:text-gray-900 dark:active:text-white md:hover:text-gray-900 dark:md:hover:text-white underline touch-manipulation"
            >
              View all {product.category}
            </Link>
          </div>
          <HorizontalSlider
            items={relatedProducts}
            renderItem={renderProductItem}
            cardWidth={216}
            gap={16}
            infiniteScroll={false}
            showNavigation={relatedProducts.length > 3}
            emptyMessage="No similar products found"
          />
        </section>
      )}

      {/* Products with Same Metal Finish */}
      {sameMetalFinishProducts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-base md:text-lg font-medium text-gray-900 dark:text-white">More {product.metal_finish} Products</h2>
            <Link 
              href={`/products?metal_finish=${product.metal_finish}`}
              className="text-xs md:text-sm text-gray-600 dark:text-gray-400 active:text-gray-900 dark:active:text-white md:hover:text-gray-900 dark:md:hover:text-white underline touch-manipulation"
            >
              View all
            </Link>
          </div>
          <HorizontalSlider
            items={sameMetalFinishProducts}
            renderItem={renderProductItem}
            cardWidth={216}
            gap={16}
            infiniteScroll={false}
            showNavigation={sameMetalFinishProducts.length > 3}
            emptyMessage="No products found"
          />
        </section>
      )}

      {/* Collections containing this product */}
      {productCollections.length > 0 && (
        <section>
          <h2 className="text-base md:text-lg font-medium text-gray-900 dark:text-white mb-4 md:mb-6">Part of Collections</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {productCollections.map((collection) => (
              <Link
                key={collection.id}
                href={`/products?collection=${collection.slug}`}
                className="group relative aspect-[4/3] rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] hover:border-gray-400 dark:hover:border-white/30 transition-all overflow-hidden"
              >
                {collection.image ? (
                  <div className="absolute inset-0">
                    <Image
                      src={collection.image}
                      alt={collection.name}
                      fill
                      className="object-cover opacity-70 group-hover:opacity-90 transition-opacity"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#1a1a1a] dark:to-[#0a0a0a]" />
                )}
                <div className="absolute inset-0 flex items-end p-3">
                  <span className="text-xs font-medium text-gray-900 dark:text-white">
                    {collection.name}
                  </span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Browse Other Categories */}
      <section>
        <h2 className="text-base md:text-lg font-medium text-gray-900 dark:text-white mb-4 md:mb-6">Browse by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          {otherCategories.map((category) => {
            const categoryImage = categoryImages[category] || null;
            
            return (
              <Link
                key={category}
                href={`/products?category=${category}`}
                className="group relative aspect-square rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] hover:border-gray-400 dark:hover:border-white/30 transition-all overflow-hidden"
              >
                {categoryImage ? (
                  <div className="absolute inset-0">
                    <Image
                      src={categoryImage}
                      alt={category}
                      fill
                      className="object-cover opacity-40 group-hover:opacity-60 transition-opacity"
                      sizes="(max-width: 768px) 50vw, 20vw"
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#1a1a1a] dark:to-[#0a0a0a]" />
                )}
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <span className="text-sm font-medium text-gray-900 dark:text-white capitalize text-center z-10">
                    {category}
                  </span>
                </div>
                <div className="absolute inset-0 bg-white/50 dark:bg-black/50 group-hover:bg-white/30 dark:group-hover:bg-black/30 transition-colors" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Suggested Collections */}
      {suggestedCollections.length > 0 && (
        <section>
          <h2 className="text-base md:text-lg font-medium text-gray-900 dark:text-white mb-4 md:mb-6">Featured Collections</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {suggestedCollections.map((collection) => (
              <Link
                key={collection.id}
                href={`/products?collection=${collection.slug}`}
                className="group relative aspect-[4/3] rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] hover:border-gray-400 dark:hover:border-white/30 transition-all overflow-hidden"
              >
                {collection.image ? (
                  <div className="absolute inset-0">
                    <Image
                      src={collection.image}
                      alt={collection.name}
                      fill
                      className="object-cover opacity-70 group-hover:opacity-90 transition-opacity"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#1a1a1a] dark:to-[#0a0a0a]" />
                )}
                <div className="absolute inset-0 flex items-end p-3">
                  <span className="text-xs font-medium text-gray-900 dark:text-white">
                    {collection.name}
                  </span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

