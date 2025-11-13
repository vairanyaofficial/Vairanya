"use client";

import React, { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/products-types";
import type { Collection } from "@/lib/collections-types";
import { Filter, X, Search, SlidersHorizontal, Loader2, Package, ChevronDown, ChevronUp, Sparkles, Gem, Heart, Circle, Link as LinkIcon } from "lucide-react";
import { ProductGridSkeleton } from "@/components/SkeletonLoader";

// Category icons mapping - will be sized responsively in component
const categoryIcons: Record<string, React.ReactNode> = {
  rings: <Circle />,
  earrings: <Sparkles />,
  pendants: <Gem />,
  bracelets: <LinkIcon />,
  necklaces: <Heart />,
};

// Category display names
const categoryNames: Record<string, string> = {
  rings: "Rings",
  earrings: "Earrings",
  pendants: "Pendants",
  bracelets: "Bracelets",
  necklaces: "Necklaces",
};

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // State Management
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dynamic filter options
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableMetalFinishes, setAvailableMetalFinishes] = useState<string[]>([]);
  
  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedMetalFinish, setSelectedMetalFinish] = useState<string>("all");
  const [selectedSize, setSelectedSize] = useState<string>("all");
  const [selectedCollection, setSelectedCollection] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [maxPrice, setMaxPrice] = useState(100000);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Mobile filter sections state
  const [openFilterSection, setOpenFilterSection] = useState<string | null>(null);
  
  // Load products from API
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

  // Load categories dynamically
  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/categories");
      const data = await response.json();
      
      if (data.success && Array.isArray(data.categories) && data.categories.length > 0) {
        setAvailableCategories(data.categories);
      } else {
        // Fallback to default categories
        setAvailableCategories(["rings", "earrings", "pendants", "bracelets", "necklaces"]);
      }
    } catch (err) {
      console.error("Error loading categories:", err);
      // Fallback to default categories
      setAvailableCategories(["rings", "earrings", "pendants", "bracelets", "necklaces"]);
    }
  }, []);

  // Extract metal finishes dynamically from products
  useEffect(() => {
    if (allProducts.length > 0) {
      const finishes = new Set<string>();
      allProducts.forEach((product) => {
        if (product.metal_finish) {
          const finish = product.metal_finish.toLowerCase().trim();
          if (finish) {
            finishes.add(finish);
          }
        }
      });
      const sortedFinishes = Array.from(finishes).sort((a, b) => {
        // Sort: gold, rose-gold, silver, platinum first, then others
        const order = ["gold", "rose-gold", "silver", "platinum"];
        const aIndex = order.indexOf(a);
        const bIndex = order.indexOf(b);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return a.localeCompare(b);
      });
      setAvailableMetalFinishes(sortedFinishes);
    }
  }, [allProducts]);

  // Initialize data
  useEffect(() => {
    loadProducts();
    loadCollections();
    loadCategories();
  }, [loadProducts, loadCollections, loadCategories]);

  // Update filters from URL params
  useEffect(() => {
    const category = searchParams.get("category");
    const collection = searchParams.get("collection");
    const search = searchParams.get("search");
    
    if (category && availableCategories.includes(category)) {
      setSelectedCategory(category);
    }
    
    if (collection) {
      setSelectedCollection(collection);
    }
    
    if (search) {
      setSearchQuery(search);
    }
  }, [searchParams, availableCategories]);

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

  // Get category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allProducts.forEach((product) => {
      const cat = product.category;
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
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
    (category: string) => {
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

  // Toggle filter section (mobile)
  const toggleFilterSection = (section: string) => {
    setOpenFilterSection(openFilterSection === section ? null : section);
  };

  // Filter Section Component
  const FilterSection = ({ title, children, sectionId }: { title: string; children: React.ReactNode; sectionId: string }) => {
    const isOpen = openFilterSection === sectionId;
    return (
      <div className="border-b border-gray-200 dark:border-white/10 last:border-b-0">
        <button
          onClick={() => toggleFilterSection(sectionId)}
          className="w-full flex items-center justify-between py-3 text-left"
        >
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>
        {isOpen && <div className="pb-3">{children}</div>}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        {/* Header Section - Modern Design */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-1.5 font-serif">
                  Our Collection
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Discover exquisite jewelry crafted with precision
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-[#0a0a0a] px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10">
                  {isLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <span className="font-medium">{filteredProducts.length} {filteredProducts.length === 1 ? "item" : "items"}</span>
                  )}
                </div>
                {/* Mobile Filter Button */}
                <button
                  onClick={() => setShowFilters(true)}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-xs sm:text-sm"
                >
                  <Filter className="h-3.5 w-3.5" />
                  <span className="font-medium">Filters</span>
                  {hasActiveFilters && (
                    <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full"></span>
                  )}
                </button>
              </div>
            </div>

            {/* Search Bar - Compact */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all"
              />
            </div>

            {/* Categories - Compact Design */}
            <div className="space-y-2">
              <h2 className="text-[10px] sm:text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Shop by Category</h2>
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-1.5 sm:gap-2">
                {/* All Categories */}
                <button
                  onClick={() => handleCategoryChange("all")}
                  className={`group relative overflow-hidden rounded-md sm:rounded-lg p-1.5 sm:p-2.5 border transition-all duration-300 ${
                    selectedCategory === "all"
                      ? "border-[#D4AF37] bg-gradient-to-br from-[#D4AF37]/10 to-[#D4AF37]/5 shadow-md sm:scale-105"
                      : "border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] hover:border-[#D4AF37]/50 hover:shadow-sm"
                  }`}
                >
                  <div className={`flex flex-col items-center gap-0.5 sm:gap-1.5 ${selectedCategory === "all" ? "text-[#D4AF37]" : "text-gray-600 dark:text-gray-400 group-hover:text-[#D4AF37]"}`}>
                    <div className="p-1 sm:p-1.5 rounded-md bg-gray-50 dark:bg-black/50 group-hover:bg-[#D4AF37]/10 transition-colors">
                      <Package className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-semibold">All</span>
                    <span className="text-[8px] sm:text-[9px] text-gray-500 dark:text-gray-500">{allProducts.length}</span>
                  </div>
                </button>

                {/* Category Cards */}
                {availableCategories.map((category) => {
                  const count = categoryCounts[category] || 0;
                  const isSelected = selectedCategory === category;
                  return (
                    <button
                      key={category}
                      onClick={() => handleCategoryChange(category)}
                      className={`group relative overflow-hidden rounded-md sm:rounded-lg p-1.5 sm:p-2.5 border transition-all duration-300 ${
                        isSelected
                          ? "border-[#D4AF37] bg-gradient-to-br from-[#D4AF37]/10 to-[#D4AF37]/5 shadow-md sm:scale-105"
                          : "border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] hover:border-[#D4AF37]/50 hover:shadow-sm"
                      }`}
                    >
                      <div className={`flex flex-col items-center gap-0.5 sm:gap-1.5 ${isSelected ? "text-[#D4AF37]" : "text-gray-600 dark:text-gray-400 group-hover:text-[#D4AF37]"}`}>
                        <div className={`p-1 sm:p-1.5 rounded-md transition-colors ${
                          isSelected 
                            ? "bg-[#D4AF37]/20" 
                            : "bg-gray-50 dark:bg-black/50 group-hover:bg-[#D4AF37]/10"
                        }`}>
                          {categoryIcons[category] ? (
                            <div className="[&>svg]:h-3.5 [&>svg]:w-3.5 sm:[&>svg]:h-5 sm:[&>svg]:w-5">
                              {categoryIcons[category]}
                            </div>
                          ) : <Package className="h-3.5 w-3.5 sm:h-5 sm:w-5" />}
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-semibold capitalize leading-tight text-center">{categoryNames[category] || category}</span>
                        <span className="text-[8px] sm:text-[9px] text-gray-500 dark:text-gray-500">{count}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Collections Pills - Compact */}
            {collections.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-[10px] sm:text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Collections</h2>
                <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
                  <button
                    onClick={() => handleCollectionChange("all")}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                      selectedCollection === "all"
                        ? "bg-[#D4AF37] text-white shadow-md"
                        : "bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-[#D4AF37] hover:text-[#D4AF37]"
                    }`}
                  >
                    All
                  </button>
                  {collections.map((collection) => (
                    <button
                      key={collection.id}
                      onClick={() => handleCollectionChange(collection.slug)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                        selectedCollection === collection.slug
                          ? "bg-[#D4AF37] text-white shadow-md"
                          : "bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-[#D4AF37] hover:text-[#D4AF37]"
                      }`}
                    >
                      {collection.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Filters Sidebar - Desktop Only - Modern */}
          <aside className="hidden lg:block lg:w-72 flex-shrink-0">
            <div className="sticky top-6 space-y-5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-white/10">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-[#D4AF37]" />
                  Filters
                </h2>
                {hasActiveFilters && (
                  <button
                    onClick={handleReset}
                    className="text-xs text-[#D4AF37] hover:text-[#C19B2E] font-medium flex items-center gap-1 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                    Reset
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div>
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-2.5 uppercase tracking-wide">
                  Category
                </h3>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer group p-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === "all"}
                      onChange={() => handleCategoryChange("all")}
                      className="h-3.5 w-3.5 text-[#D4AF37] focus:ring-[#D4AF37] accent-[#D4AF37]"
                    />
                    <span className={`text-xs transition-colors ${selectedCategory === "all" ? "text-[#D4AF37] font-semibold" : "text-gray-700 dark:text-gray-300 group-hover:text-[#D4AF37]"}`}>All</span>
                  </label>
                  {availableCategories.map((category) => (
                    <label key={category} className="flex items-center gap-2 cursor-pointer group p-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === category}
                        onChange={() => handleCategoryChange(category)}
                        className="h-3.5 w-3.5 text-[#D4AF37] focus:ring-[#D4AF37] accent-[#D4AF37]"
                      />
                      <span className={`text-xs capitalize transition-colors flex items-center gap-1.5 ${selectedCategory === category ? "text-[#D4AF37] font-semibold" : "text-gray-700 dark:text-gray-300 group-hover:text-[#D4AF37]"}`}>
                        <span className="text-gray-400 text-[10px]">{categoryIcons[category] || null}</span>
                        {categoryNames[category] || category}
                        <span className="text-[10px] text-gray-400">({categoryCounts[category] || 0})</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Metal Finish Filter */}
              {availableMetalFinishes.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-2.5 uppercase tracking-wide">
                    Metal Finish
                  </h3>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer group p-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <input
                        type="radio"
                        name="metalFinish"
                        checked={selectedMetalFinish === "all"}
                        onChange={() => setSelectedMetalFinish("all")}
                        className="h-3.5 w-3.5 text-[#D4AF37] focus:ring-[#D4AF37] accent-[#D4AF37]"
                      />
                      <span className={`text-xs transition-colors ${selectedMetalFinish === "all" ? "text-[#D4AF37] font-semibold" : "text-gray-700 dark:text-gray-300 group-hover:text-[#D4AF37]"}`}>All</span>
                    </label>
                    {availableMetalFinishes.map((finish) => (
                      <label key={finish} className="flex items-center gap-2 cursor-pointer group p-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <input
                          type="radio"
                          name="metalFinish"
                          checked={selectedMetalFinish === finish}
                          onChange={() => setSelectedMetalFinish(finish)}
                          className="h-3.5 w-3.5 text-[#D4AF37] focus:ring-[#D4AF37] accent-[#D4AF37]"
                        />
                        <span className={`text-xs capitalize transition-colors ${selectedMetalFinish === finish ? "text-[#D4AF37] font-semibold" : "text-gray-700 dark:text-gray-300 group-hover:text-[#D4AF37]"}`}>
                          {finish.replace(/-/g, " ")}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Filter */}
              {availableSizes.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-2.5 uppercase tracking-wide">
                    Size
                  </h3>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-hide">
                    <label className="flex items-center gap-2 cursor-pointer group p-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <input
                        type="radio"
                        name="size"
                        checked={selectedSize === "all"}
                        onChange={() => setSelectedSize("all")}
                        className="h-3.5 w-3.5 text-[#D4AF37] focus:ring-[#D4AF37] accent-[#D4AF37]"
                      />
                      <span className={`text-xs transition-colors ${selectedSize === "all" ? "text-[#D4AF37] font-semibold" : "text-gray-700 dark:text-gray-300 group-hover:text-[#D4AF37]"}`}>All</span>
                    </label>
                    {availableSizes.map((size) => (
                      <label key={size} className="flex items-center gap-2 cursor-pointer group p-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <input
                          type="radio"
                          name="size"
                          checked={selectedSize === size}
                          onChange={() => setSelectedSize(size)}
                          className="h-3.5 w-3.5 text-[#D4AF37] focus:ring-[#D4AF37] accent-[#D4AF37]"
                        />
                        <span className={`text-xs transition-colors ${selectedSize === size ? "text-[#D4AF37] font-semibold" : "text-gray-700 dark:text-gray-300 group-hover:text-[#D4AF37]"}`}>{size}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Range Filter */}
              <div>
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-2.5 uppercase tracking-wide">
                  Price Range
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange[0] || ""}
                      onChange={(e) =>
                        setPriceRange([Number(e.target.value) || 0, priceRange[1]])
                      }
                      className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-white/10 rounded-md bg-white dark:bg-black text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all"
                      min="0"
                    />
                    <span className="text-gray-400 text-xs">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceRange[1] === maxPrice ? "" : priceRange[1]}
                      onChange={(e) =>
                        setPriceRange([priceRange[0], Number(e.target.value) || maxPrice])
                      }
                      className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-white/10 rounded-md bg-white dark:bg-black text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all"
                      min="0"
                    />
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-black/50 px-2 py-1 rounded-md">
                    ₹{priceRange[0].toLocaleString()} - ₹
                    {priceRange[1] === maxPrice ? "∞" : priceRange[1].toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Products Grid - Redesigned */}
          <div className="flex-1 min-w-0">
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl">
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
              <div className="text-center py-16">
                <Package className="h-20 w-20 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No products found
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  {hasActiveFilters
                    ? "Try adjusting your filters to see more products"
                    : "No products available at the moment"}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 text-sm bg-[#D4AF37] text-white rounded-lg hover:bg-[#C19B2E] transition-colors font-medium shadow-md"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
                {filteredProducts.map((product, index) => (
                  <ProductCard key={product.product_id} product={product} priority={index < 8} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Filter Modal - Redesigned */}
      {showFilters && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={() => setShowFilters(false)}>
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#0a0a0a] rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto border-t-2 border-gray-200 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-white/10 px-6 py-4 flex items-center justify-between z-10 backdrop-blur-sm">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-[#D4AF37]" />
                Filters
              </h2>
              <div className="flex items-center gap-3">
                {hasActiveFilters && (
                  <button
                    onClick={handleReset}
                    className="text-sm text-[#D4AF37] hover:text-[#C19B2E] font-medium transition-colors"
                  >
                    Reset
                  </button>
                )}
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
            <div className="px-6 py-6">
              {/* Category Filter */}
              <FilterSection title="Category" sectionId="category">
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5">
                    <input
                      type="radio"
                      name="category-mobile"
                      checked={selectedCategory === "all"}
                      onChange={() => handleCategoryChange("all")}
                      className="h-4 w-4 text-[#D4AF37] focus:ring-[#D4AF37] accent-[#D4AF37]"
                    />
                    <span className={`text-sm ${selectedCategory === "all" ? "text-[#D4AF37] font-semibold" : "text-gray-700 dark:text-gray-300"}`}>All Categories</span>
                  </label>
                  {availableCategories.map((category) => (
                    <label key={category} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5">
                      <input
                        type="radio"
                        name="category-mobile"
                        checked={selectedCategory === category}
                        onChange={() => handleCategoryChange(category)}
                        className="h-4 w-4 text-[#D4AF37] focus:ring-[#D4AF37] accent-[#D4AF37]"
                      />
                      <span className={`text-sm capitalize flex items-center gap-2 ${selectedCategory === category ? "text-[#D4AF37] font-semibold" : "text-gray-700 dark:text-gray-300"}`}>
                        <span className="text-gray-400">{categoryIcons[category] || null}</span>
                        {categoryNames[category] || category}
                        <span className="text-xs text-gray-400">({categoryCounts[category] || 0})</span>
                      </span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              {/* Metal Finish Filter */}
              {availableMetalFinishes.length > 0 && (
                <FilterSection title="Metal Finish" sectionId="metalFinish">
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5">
                      <input
                        type="radio"
                        name="metalFinish-mobile"
                        checked={selectedMetalFinish === "all"}
                        onChange={() => setSelectedMetalFinish("all")}
                        className="h-4 w-4 text-[#D4AF37] focus:ring-[#D4AF37] accent-[#D4AF37]"
                      />
                      <span className={`text-sm ${selectedMetalFinish === "all" ? "text-[#D4AF37] font-semibold" : "text-gray-700 dark:text-gray-300"}`}>All Finishes</span>
                    </label>
                    {availableMetalFinishes.map((finish) => (
                      <label key={finish} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5">
                        <input
                          type="radio"
                          name="metalFinish-mobile"
                          checked={selectedMetalFinish === finish}
                          onChange={() => setSelectedMetalFinish(finish)}
                          className="h-4 w-4 text-[#D4AF37] focus:ring-[#D4AF37] accent-[#D4AF37]"
                        />
                        <span className={`text-sm capitalize ${selectedMetalFinish === finish ? "text-[#D4AF37] font-semibold" : "text-gray-700 dark:text-gray-300"}`}>
                          {finish.replace(/-/g, " ")}
                        </span>
                      </label>
                    ))}
                  </div>
                </FilterSection>
              )}

              {/* Size Filter */}
              {availableSizes.length > 0 && (
                <FilterSection title="Size" sectionId="size">
                  <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
                    <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5">
                      <input
                        type="radio"
                        name="size-mobile"
                        checked={selectedSize === "all"}
                        onChange={() => setSelectedSize("all")}
                        className="h-4 w-4 text-[#D4AF37] focus:ring-[#D4AF37] accent-[#D4AF37]"
                      />
                      <span className={`text-sm ${selectedSize === "all" ? "text-[#D4AF37] font-semibold" : "text-gray-700 dark:text-gray-300"}`}>All Sizes</span>
                    </label>
                    {availableSizes.map((size) => (
                      <label key={size} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5">
                        <input
                          type="radio"
                          name="size-mobile"
                          checked={selectedSize === size}
                          onChange={() => setSelectedSize(size)}
                          className="h-4 w-4 text-[#D4AF37] focus:ring-[#D4AF37] accent-[#D4AF37]"
                        />
                        <span className={`text-sm ${selectedSize === size ? "text-[#D4AF37] font-semibold" : "text-gray-700 dark:text-gray-300"}`}>{size}</span>
                      </label>
                    ))}
                  </div>
                </FilterSection>
              )}

              {/* Price Range Filter */}
              <FilterSection title="Price Range" sectionId="price">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange[0] || ""}
                      onChange={(e) =>
                        setPriceRange([Number(e.target.value) || 0, priceRange[1]])
                      }
                      className="flex-1 px-3 py-2 border-2 border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-black text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37]"
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
                      className="flex-1 px-3 py-2 border-2 border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-black text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                      min="0"
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-black/50 px-3 py-2 rounded-lg">
                    ₹{priceRange[0].toLocaleString()} - ₹
                    {priceRange[1] === maxPrice ? "∞" : priceRange[1].toLocaleString()}
                  </div>
                </div>
              </FilterSection>

              {/* Apply Button */}
              <div className="sticky bottom-0 bg-white dark:bg-[#0a0a0a] pt-6 border-t border-gray-200 dark:border-white/10 -mx-6 px-6 pb-6 mt-6">
                <button
                  onClick={() => setShowFilters(false)}
                  className="w-full py-3.5 bg-[#D4AF37] text-white rounded-xl hover:bg-[#C19B2E] transition-colors font-semibold shadow-lg"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-black">
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
