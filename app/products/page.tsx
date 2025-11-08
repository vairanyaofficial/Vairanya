"use client";

import React, { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import type { Category, MetalFinish, Product } from "@/lib/products-types";
import type { Collection } from "@/lib/collections-types";
import { Filter, X, Search, SlidersHorizontal, Loader2, Package } from "lucide-react";
import { ProductGridSkeleton } from "@/components/SkeletonLoader";

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // State Management
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all");
  const [selectedMetalFinish, setSelectedMetalFinish] = useState<MetalFinish | "all">("all");
  const [selectedSize, setSelectedSize] = useState<string | "all">("all");
  const [selectedCollection, setSelectedCollection] = useState<string | "all">("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [maxPrice, setMaxPrice] = useState(100000);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Load products from Firestore
  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch("/api/products?all=true");
      const data = await response.json();
      
      if (data.success && Array.isArray(data.products)) {
        setAllProducts(data.products);
        setProducts(data.products);
        
        // Calculate max price
        if (data.products.length > 0) {
          const max = Math.max(...data.products.map((p: Product) => p.price || 0));
          const calculatedMax = Math.ceil(max * 1.1);
          setMaxPrice(calculatedMax);
          setPriceRange([0, calculatedMax]);
        }
      } else {
        throw new Error(data.error || "Failed to load products");
      }
    } catch (err: any) {
      console.error("Error loading products:", err);
      setError(err.message || "Failed to load products. Please try again.");
      setProducts([]);
      setAllProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load collections
  const loadCollections = useCallback(async () => {
    try {
      const response = await fetch("/api/collections");
      const data = await response.json();
      
      if (data.success && Array.isArray(data.collections)) {
        // Filter active collections
        const activeCollections = data.collections.filter(
          (c: Collection) => c.is_active !== false
        );
        setCollections(activeCollections);
      }
    } catch (err) {
      console.error("Error loading collections:", err);
      setCollections([]);
    }
  }, []);

  // Initialize data
  useEffect(() => {
    loadProducts();
    loadCollections();
  }, [loadProducts, loadCollections]);

  // Update filters from URL params
  useEffect(() => {
    const category = searchParams.get("category");
    const collection = searchParams.get("collection");
    const search = searchParams.get("search");
    
    if (category && ["rings", "earrings", "pendants", "bracelets", "necklaces"].includes(category)) {
      setSelectedCategory(category as Category);
    }
    
    if (collection) {
      setSelectedCollection(collection);
    }
    
    if (search) {
      setSearchQuery(search);
    }
  }, [searchParams]);

  // Get unique sizes from products
  const availableSizes = useMemo(() => {
    const sizes = new Set<string>();
    allProducts.forEach((product) => {
      if (product.size_options && Array.isArray(product.size_options)) {
        product.size_options.forEach((size) => {
          if (size && size.trim()) {
            sizes.add(size.trim());
          }
        });
      }
    });
    return Array.from(sizes).sort((a, b) => {
      const aNum = parseInt(a);
      const bNum = parseInt(b);
      if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
      if (!isNaN(aNum)) return -1;
      if (!isNaN(bNum)) return 1;
      return a.localeCompare(b);
    });
  }, [allProducts]);

  // Filter products
  const filteredProducts = useMemo(() => {
    let filtered = [...allProducts];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((product) => {
        return (
          product.title.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          product.tags.some((tag) => tag.toLowerCase().includes(query))
        );
      });
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((product) => product.category === selectedCategory);
    }

    // Metal finish filter
    if (selectedMetalFinish !== "all") {
      filtered = filtered.filter((product) => {
        const productFinish = (product.metal_finish || "").toLowerCase().trim().replace(/\s+/g, "-");
        const selectedFinish = selectedMetalFinish.toLowerCase().trim().replace(/\s+/g, "-");
        return productFinish === selectedFinish;
      });
    }

    // Size filter
    if (selectedSize !== "all") {
      filtered = filtered.filter((product) => {
        return product.size_options && product.size_options.includes(selectedSize);
      });
    }

    // Collection filter
    if (selectedCollection !== "all") {
      const collection = collections.find((c) => c.slug === selectedCollection);
      if (collection && collection.product_ids) {
        filtered = filtered.filter((product) =>
          collection.product_ids.includes(product.product_id)
        );
      } else {
        filtered = [];
      }
    }

    // Price range filter
    const isDefaultRange = priceRange[0] === 0 && priceRange[1] >= maxPrice;
    if (!isDefaultRange) {
      filtered = filtered.filter(
        (product) => product.price >= priceRange[0] && product.price <= priceRange[1]
      );
    }

    return filtered;
  }, [
    allProducts,
    searchQuery,
    selectedCategory,
    selectedMetalFinish,
    selectedSize,
    selectedCollection,
    priceRange,
    maxPrice,
    collections,
  ]);

  // Update URL params
  const updateURL = useCallback(
    (updates: { category?: string; collection?: string; search?: string }) => {
      const params = new URLSearchParams(searchParams.toString());
      
      if (updates.category) {
        if (updates.category === "all") {
          params.delete("category");
        } else {
          params.set("category", updates.category);
        }
      }
      
      if (updates.collection) {
        if (updates.collection === "all") {
          params.delete("collection");
        } else {
          params.set("collection", updates.collection);
        }
      }
      
      if (updates.search !== undefined) {
        if (updates.search.trim() === "") {
          params.delete("search");
        } else {
          params.set("search", updates.search.trim());
        }
      }
      
      const newURL = params.toString() ? `/products?${params.toString()}` : "/products";
      router.replace(newURL, { scroll: false });
    },
    [searchParams, router]
  );

  // Handle filter changes
  const handleCategoryChange = useCallback(
    (category: Category | "all") => {
      setSelectedCategory(category);
      updateURL({ category });
    },
    [updateURL]
  );

  const handleCollectionChange = useCallback(
    (collectionSlug: string) => {
      setSelectedCollection(collectionSlug);
      updateURL({ collection: collectionSlug });
    },
    [updateURL]
  );

  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
      updateURL({ search: query });
    },
    [updateURL]
  );

  const handleReset = useCallback(() => {
    setSelectedCategory("all");
    setSelectedMetalFinish("all");
    setSelectedSize("all");
    setSelectedCollection("all");
    setPriceRange([0, maxPrice]);
    setSearchQuery("");
    updateURL({ category: "all", collection: "all", search: "" });
  }, [maxPrice, updateURL]);

  const hasActiveFilters =
    selectedCategory !== "all" ||
    selectedMetalFinish !== "all" ||
    selectedSize !== "all" ||
    selectedCollection !== "all" ||
    searchQuery.trim() !== "" ||
    priceRange[0] !== 0 ||
    priceRange[1] < maxPrice;

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Our Products
            </h1>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span>{filteredProducts.length} {filteredProducts.length === 1 ? "item" : "items"}</span>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
            />
          </div>

          {/* Collections Pills */}
          {collections.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
              <button
                onClick={() => handleCollectionChange("all")}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border-2 ${
                  selectedCollection === "all"
                    ? "bg-[#D4AF37] text-white border-[#D4AF37] shadow-md"
                    : "bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-[#D4AF37] hover:text-[#D4AF37]"
                }`}
              >
                All
              </button>
              {collections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => handleCollectionChange(collection.slug)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border-2 ${
                    selectedCollection === collection.slug
                      ? "bg-[#D4AF37] text-white border-[#D4AF37] shadow-md"
                      : "bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-[#D4AF37] hover:text-[#D4AF37]"
                  }`}
                >
                  {collection.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <aside className={`lg:w-64 flex-shrink-0 ${showFilters ? "block" : "hidden lg:block"}`}>
            <div className="sticky top-4 space-y-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5" />
                  Filters
                </h2>
                {hasActiveFilters && (
                  <button
                    onClick={handleReset}
                    className="text-sm text-[#D4AF37] hover:text-[#C19B2E] font-medium flex items-center gap-1"
                  >
                    <X className="h-4 w-4" />
                    Reset
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Category
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === "all"}
                      onChange={() => handleCategoryChange("all")}
                      className="h-4 w-4 text-[#D4AF37] focus:ring-[#D4AF37]"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">All</span>
                  </label>
                  {(["rings", "earrings", "pendants", "bracelets", "necklaces"] as Category[]).map(
                    (category) => (
                      <label key={category} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="category"
                          checked={selectedCategory === category}
                          onChange={() => handleCategoryChange(category)}
                          className="h-4 w-4 text-[#D4AF37] focus:ring-[#D4AF37]"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                          {category}
                        </span>
                      </label>
                    )
                  )}
                </div>
              </div>

              {/* Metal Finish Filter */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Metal Finish
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="metalFinish"
                      checked={selectedMetalFinish === "all"}
                      onChange={() => setSelectedMetalFinish("all")}
                      className="h-4 w-4 text-[#D4AF37] focus:ring-[#D4AF37]"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">All</span>
                  </label>
                  {(["gold", "rose-gold", "silver", "platinum"] as MetalFinish[]).map((finish) => (
                    <label key={finish} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="metalFinish"
                        checked={selectedMetalFinish === finish}
                        onChange={() => setSelectedMetalFinish(finish)}
                        className="h-4 w-4 text-[#D4AF37] focus:ring-[#D4AF37]"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                        {finish.replace(/-/g, " ")}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Size Filter */}
              {availableSizes.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Size
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="size"
                        checked={selectedSize === "all"}
                        onChange={() => setSelectedSize("all")}
                        className="h-4 w-4 text-[#D4AF37] focus:ring-[#D4AF37]"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">All</span>
                    </label>
                    {availableSizes.map((size) => (
                      <label key={size} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="size"
                          checked={selectedSize === size}
                          onChange={() => setSelectedSize(size)}
                          className="h-4 w-4 text-[#D4AF37] focus:ring-[#D4AF37]"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{size}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Range Filter */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Price Range
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange[0] || ""}
                      onChange={(e) =>
                        setPriceRange([Number(e.target.value) || 0, priceRange[1]])
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-black text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      min="0"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceRange[1] === maxPrice ? "" : priceRange[1]}
                      onChange={(e) =>
                        setPriceRange([priceRange[0], Number(e.target.value) || maxPrice])
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-black text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      min="0"
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    ₹{priceRange[0].toLocaleString()} - ₹
                    {priceRange[1] === maxPrice ? "∞" : priceRange[1].toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Mobile Filter Toggle */}
          <div className="lg:hidden">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-between w-full px-4 py-3 border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white"
            >
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                <span className="font-medium">Filters</span>
                {hasActiveFilters && (
                  <span className="px-2 py-0.5 bg-[#D4AF37] text-white text-xs rounded-full">
                    Active
                  </span>
                )}
              </div>
              {showFilters ? <X className="h-5 w-5" /> : <Filter className="h-5 w-5" />}
            </button>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                <button
                  onClick={loadProducts}
                  className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
                >
                  Try again
                </button>
              </div>
            )}

            {isLoading ? (
              <ProductGridSkeleton count={12} />
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No products found
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {hasActiveFilters
                    ? "Try adjusting your filters to see more products"
                    : "No products available at the moment"}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-[#D4AF37] text-white rounded-lg hover:bg-[#C19B2E] transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
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

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white dark:bg-black">
          <Header />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            <ProductGridSkeleton count={12} />
          </main>
          <Footer />
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
