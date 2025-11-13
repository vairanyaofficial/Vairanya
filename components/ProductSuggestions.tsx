"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ProductCard from "./ProductCard";
import HorizontalSlider from "./HorizontalSlider";
import type { Product } from "@/lib/products-types";
import { ProductSliderSkeleton } from "@/components/SkeletonLoader";

interface ProductSuggestionsProps {
  product: Product;
}

interface SuggestionsData {
  relatedProducts: Product[];
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
    <div className="min-w-[160px] sm:min-w-[180px] md:min-w-[200px] max-w-[160px] sm:max-w-[180px] md:max-w-[200px]">
      <ProductCard product={item} />
    </div>
  ), []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="mt-4 md:mt-6 border-t border-gray-100 dark:border-white/10 pt-4 md:pt-6">
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-[#1a1a1a] rounded w-32 animate-pulse"></div>
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
  } = suggestions;
  return (
    <div className="mt-4 md:mt-6 border-t border-gray-100 dark:border-white/10 pt-4 md:pt-6">
      {/* Related Products - Same Category */}
      {relatedProducts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-sm md:text-base font-medium text-gray-900 dark:text-white">Similar Products</h2>
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
    </div>
  );
}

