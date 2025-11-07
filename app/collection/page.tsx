"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import ProductFilters from "@/components/ProductFilters";
import type { Category, MetalFinish, Product } from "@/lib/products-types";
import { Filter, Grid } from "lucide-react";

export default function CollectionPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all");
  const [selectedMetalFinish, setSelectedMetalFinish] = useState<MetalFinish | "all">("all");
  const [selectedSize, setSelectedSize] = useState<string | "all">("all");
  const [maxPrice, setMaxPrice] = useState<number>(999999);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 999999]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Get search query and category from URL params
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    
    if (search) {
      setSearchQuery(search);
    }
    if (category && ["rings", "earrings", "pendants", "bracelets", "necklaces"].includes(category)) {
      setSelectedCategory(category as Category);
    }

    // Fetch products from public API endpoint
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProducts(data.products);
          // Calculate max price from products to set default range
          if (data.products && data.products.length > 0) {
            const max = Math.max(...data.products.map((p: Product) => p.price || 0));
            const calculatedMax = Math.ceil(max * 1.1); // Add 10% buffer
            setMaxPrice(calculatedMax);
            setPriceRange([0, calculatedMax]);
          }
        }
      })
      .catch(() => {
        // Fallback to static import if API fails
        import("@/lib/products").then((mod) => {
          setProducts(mod.products);
          if (mod.products && mod.products.length > 0) {
            const max = Math.max(...mod.products.map((p: Product) => p.price || 0));
            const calculatedMax = Math.ceil(max * 1.1); // Add 10% buffer
            setMaxPrice(calculatedMax);
            setPriceRange([0, calculatedMax]);
          }
        });
      })
      .finally(() => setIsLoading(false));
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          product.title.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          product.tags.some((tag) => tag.toLowerCase().includes(query));
        if (!matchesSearch) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== "all" && product.category !== selectedCategory) {
        return false;
      }

      // Metal finish filter
      if (selectedMetalFinish !== "all" && product.metal_finish !== selectedMetalFinish) {
        return false;
      }

      // Size filter
      if (selectedSize !== "all" && product.size_options && product.size_options.length > 0) {
        if (!product.size_options.includes(selectedSize)) {
          return false;
        }
      } else if (selectedSize !== "all" && (!product.size_options || product.size_options.length === 0)) {
        return false;
      }

      // Price range filter - only apply if user has set a custom range
      // If min is 0 and max is at or above the calculated max, show all products
      const isDefaultRange = priceRange[0] === 0 && priceRange[1] >= maxPrice;
      if (!isDefaultRange) {
        if (product.price < priceRange[0] || product.price > priceRange[1]) {
          return false;
        }
      }

      return true;
    });
  }, [products, selectedCategory, selectedMetalFinish, selectedSize, priceRange, maxPrice, searchQuery]);

  const handleReset = () => {
    setSelectedCategory("all");
    setSelectedMetalFinish("all");
    setSelectedSize("all");
    setPriceRange([0, maxPrice]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50/30 to-white">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        <div className="mb-10 md:mb-12">
          <h1 className="font-serif text-5xl md:text-6xl font-light mb-4 tracking-tight">Collection</h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Discover our handcrafted, anti-tarnish jewellery collection
          </p>
        </div>

        <div className="flex gap-8">
          {/* Desktop Filters */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <ProductFilters
              selectedCategory={selectedCategory}
              selectedMetalFinish={selectedMetalFinish}
              selectedSize={selectedSize}
              priceRange={priceRange}
              onCategoryChange={setSelectedCategory}
              onMetalFinishChange={setSelectedMetalFinish}
              onSizeChange={setSelectedSize}
              onPriceRangeChange={setPriceRange}
              onReset={handleReset}
            />
          </aside>

          {/* Mobile Filter Button */}
          <div className="md:hidden mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm"
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
          </div>

          {/* Mobile Filters */}
          {showFilters && (
            <div className="md:hidden mb-6">
              <ProductFilters
                selectedCategory={selectedCategory}
                selectedMetalFinish={selectedMetalFinish}
                priceRange={priceRange}
                onCategoryChange={setSelectedCategory}
                onMetalFinishChange={setSelectedMetalFinish}
                onPriceRangeChange={setPriceRange}
                onReset={handleReset}
              />
            </div>
          )}

          {/* Products Grid */}
          <div className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"} found
              </p>
            </div>

            {isLoading ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-16 text-center shadow-sm">
                <p className="text-gray-500">Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-16 text-center shadow-sm">
                <p className="text-gray-500 mb-4">No products found matching your filters.</p>
                <button
                  onClick={handleReset}
                  className="text-[#D4AF37] hover:text-[#C19B2E] font-medium transition-colors"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.product_id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

