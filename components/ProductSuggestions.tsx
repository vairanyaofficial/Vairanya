"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import ProductCard from "./ProductCard";
import HorizontalSlider from "./HorizontalSlider";
import type { Product } from "@/lib/products-types";
import type { Collection } from "@/lib/collections-types";

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
      <div className="space-y-16 mt-20 border-t border-gray-100 pt-16">
        <div className="animate-pulse space-y-8">
          <div className="h-6 bg-gray-200 rounded w-48"></div>
          <div className="flex gap-4 overflow-x-auto">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="min-w-[200px] h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
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
    <div className="space-y-16 mt-20 border-t border-gray-100 pt-16">
      {/* Related Products - Same Category */}
      {relatedProducts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">Similar Products</h2>
            <Link 
              href={`/products?category=${product.category}`}
              className="text-sm text-gray-600 hover:text-gray-900 underline"
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">More {product.metal_finish} Products</h2>
            <Link 
              href={`/products?metal_finish=${product.metal_finish}`}
              className="text-sm text-gray-600 hover:text-gray-900 underline"
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
          <h2 className="text-lg font-medium text-gray-900 mb-6">Part of Collections</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {productCollections.map((collection) => (
              <Link
                key={collection.id}
                href={`/products?collection=${collection.slug}`}
                className="group relative aspect-[4/3] rounded-lg border border-gray-200 bg-white hover:border-gray-400 transition-all overflow-hidden"
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
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100" />
                )}
                <div className="absolute inset-0 flex items-end p-3">
                  <span className="text-xs font-medium text-gray-900">
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
        <h2 className="text-lg font-medium text-gray-900 mb-6">Browse by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {otherCategories.map((category) => {
            const categoryImage = categoryImages[category] || null;
            
            return (
              <Link
                key={category}
                href={`/products?category=${category}`}
                className="group relative aspect-square rounded-lg border border-gray-200 bg-white hover:border-gray-400 transition-all overflow-hidden"
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
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100" />
                )}
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <span className="text-sm font-medium text-gray-900 capitalize text-center z-10">
                    {category}
                  </span>
                </div>
                <div className="absolute inset-0 bg-white/50 group-hover:bg-white/30 transition-colors" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Suggested Collections */}
      {suggestedCollections.length > 0 && (
        <section>
          <h2 className="text-lg font-medium text-gray-900 mb-6">Featured Collections</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {suggestedCollections.map((collection) => (
              <Link
                key={collection.id}
                href={`/products?collection=${collection.slug}`}
                className="group relative aspect-[4/3] rounded-lg border border-gray-200 bg-white hover:border-gray-400 transition-all overflow-hidden"
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
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100" />
                )}
                <div className="absolute inset-0 flex items-end p-3">
                  <span className="text-xs font-medium text-gray-900">
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

