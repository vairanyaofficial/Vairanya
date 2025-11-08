"use client";

import React, { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import ProductFilters from "@/components/ProductFilters";
import type { Category, MetalFinish, Product } from "@/lib/products-types";
import type { Collection } from "@/lib/collections-types";
import { Filter, X, Package } from "lucide-react";
import Image from "next/image";

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const PRODUCTS_PER_PAGE = 20; // Load 20 products at a time
  
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all");
  const [selectedMetalFinish, setSelectedMetalFinish] = useState<MetalFinish | "all">("all");
  const [selectedSize, setSelectedSize] = useState<string | "all">("all");
  const [selectedCollection, setSelectedCollection] = useState<string | "all">("all");
  const [maxPrice, setMaxPrice] = useState<number>(999999);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 999999]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Debounce timer for URL updates
  const urlUpdateTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Load initial products and max price
  useEffect(() => {
    let isMounted = true;

    const initializeData = async () => {
      try {
        setIsLoading(true);

        // Fetch collections and max price in parallel
        const [collectionsRes, maxPriceRes] = await Promise.all([
          fetch("/api/collections").catch(() => null),
          fetch("/api/products?all=true").catch(() => null), // Get all products for max price calculation
        ]);

        if (!isMounted) return;

        // Set collections
        if (collectionsRes) {
          try {
            const collectionData = await collectionsRes.json();
            if (collectionData.success && collectionData.collections) {
              setCollections(collectionData.collections.filter((c: Collection) => c.is_active));
            }
          } catch (err) {
            console.error("Error parsing collections:", err);
          }
        }

        // Calculate max price from all products
        if (maxPriceRes) {
          try {
            const maxPriceData = await maxPriceRes.json();
            if (maxPriceData.success && maxPriceData.products && maxPriceData.products.length > 0) {
              const max = Math.max(...maxPriceData.products.map((p: Product) => p.price || 0));
              const calculatedMax = Math.ceil(max * 1.1);
              setMaxPrice(calculatedMax);
              setPriceRange([0, calculatedMax]);
              setTotalProducts(maxPriceData.total || maxPriceData.products.length);
            }
          } catch (err) {
            console.error("Error calculating max price:", err);
          }
        }

        // Load initial batch of products
        await loadProducts(0, true);
      } catch (err) {
        console.error("Error initializing data:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeData();

    return () => {
      isMounted = false;
    };
  }, []); // Only run on mount

  // Function to load products with pagination
  const loadProducts = useCallback(async (offset: number, isInitial: boolean = false) => {
    try {
      if (isInitial) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const response = await fetch(`/api/products?limit=${PRODUCTS_PER_PAGE}&offset=${offset}`);
      const data = await response.json();

      if (data.success && data.products) {
        if (isInitial) {
          setProducts(data.products);
          setCurrentOffset(data.products.length);
        } else {
          setProducts(prev => [...prev, ...data.products]);
          setCurrentOffset(prev => prev + data.products.length);
        }
        setHasMore(data.hasMore || false);
        setTotalProducts(data.total || 0);
      }
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [PRODUCTS_PER_PAGE]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      // Check if user is near bottom of page (within 300px)
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Load more when user is 300px from bottom
      if (
        scrollTop + windowHeight >= documentHeight - 300 &&
        !isLoadingMore &&
        hasMore &&
        !isLoading
      ) {
        loadProducts(currentOffset);
      }
    };

    // Throttle scroll event for better performance
    let timeoutId: NodeJS.Timeout | null = null;
    const throttledHandleScroll = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        handleScroll();
        timeoutId = null;
      }, 100);
    };

    window.addEventListener("scroll", throttledHandleScroll, { passive: true });
    // Also check on mount in case page is already scrolled
    handleScroll();
    
    return () => {
      window.removeEventListener("scroll", throttledHandleScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [currentOffset, hasMore, isLoadingMore, isLoading, loadProducts]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (urlUpdateTimerRef.current) {
        clearTimeout(urlUpdateTimerRef.current);
      }
    };
  }, []);

  // Track if we're updating from URL to prevent loops
  const isUpdatingFromURL = React.useRef(false);

  // Update filter state from URL params (only when URL changes from external source like browser back/forward)
  useEffect(() => {
    // Skip if we're currently updating URL ourselves (from user action)
    if (isUpdatingFromURL.current) {
      return;
    }

    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const collection = searchParams.get("collection");
    
    // Only update state if it's different from current state to prevent unnecessary re-renders
    // Use functional updates to avoid dependency issues
    setSearchQuery((prev) => {
      const newSearch = search || "";
      return newSearch !== prev ? newSearch : prev;
    });

    setSelectedCategory((prev) => {
      const urlCategory = category && ["rings", "earrings", "pendants", "bracelets", "necklaces"].includes(category)
        ? (category as Category)
        : "all";
      return urlCategory !== prev ? urlCategory : prev;
    });

    setSelectedCollection((prev) => {
      const urlCollection = collection || "all";
      return urlCollection !== prev ? urlCollection : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Only depend on searchParams to avoid loops - state updates are handled via functional updates

  // Helper function to update URL params without page reload
  const updateURLParams = useCallback((updates: {
    category?: Category | "all";
    collection?: string | "all";
    search?: string;
  }) => {
    // Clear existing timer
    if (urlUpdateTimerRef.current) {
      clearTimeout(urlUpdateTimerRef.current);
    }

    // Mark that we're updating from user action (not from URL)
    isUpdatingFromURL.current = true;

    // Debounce URL updates for smoother UX
    urlUpdateTimerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      let hasChanges = false;
      
      if (updates.category !== undefined) {
        const currentCategory = searchParams.get("category");
        if (updates.category === "all") {
          if (currentCategory !== null) {
            params.delete("category");
            hasChanges = true;
          }
        } else {
          if (currentCategory !== updates.category) {
            params.set("category", updates.category);
            hasChanges = true;
          }
        }
      }
      
      if (updates.collection !== undefined) {
        const currentCollection = searchParams.get("collection");
        if (updates.collection === "all") {
          if (currentCollection !== null) {
            params.delete("collection");
            hasChanges = true;
          }
        } else {
          if (currentCollection !== updates.collection) {
            params.set("collection", updates.collection);
            hasChanges = true;
          }
        }
      }
      
      if (updates.search !== undefined) {
        const currentSearch = searchParams.get("search");
        const newSearch = updates.search.trim();
        if (!newSearch) {
          if (currentSearch !== null) {
            params.delete("search");
            hasChanges = true;
          }
        } else {
          if (currentSearch !== newSearch) {
            params.set("search", newSearch);
            hasChanges = true;
          }
        }
      }

      // Only update URL if there are actual changes
      if (hasChanges) {
        // Build new URL
        const newURL = params.toString() 
          ? `${pathname}?${params.toString()}`
          : pathname;

        // Use replace to avoid adding to history and prevent full reload
        router.replace(newURL, { scroll: false });
        
        // Reset flag after a short delay to allow router to update
        // The flag prevents the useEffect from running when URL updates
        setTimeout(() => {
          isUpdatingFromURL.current = false;
        }, 150);
      } else {
        // Reset flag immediately if no changes
        isUpdatingFromURL.current = false;
      }
    }, 100); // 100ms debounce
  }, [searchParams, pathname, router]);

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

      // Metal finish filter - fix: normalize the comparison
      if (selectedMetalFinish !== "all") {
        // Normalize both values for comparison (handle case and spacing)
        const productFinish = (product.metal_finish || "").toLowerCase().trim().replace(/\s+/g, "-");
        const selectedFinish = selectedMetalFinish.toLowerCase().trim().replace(/\s+/g, "-");
        if (productFinish !== selectedFinish) {
          return false;
        }
      }

      // Collection filter
      if (selectedCollection !== "all") {
        const collection = collections.find(c => c.slug === selectedCollection);
        if (collection && collection.product_ids) {
          if (!collection.product_ids.includes(product.product_id)) {
            return false;
          }
        } else {
          return false;
        }
      }

      // Size filter
      if (selectedSize !== "all" && product.size_options && product.size_options.length > 0) {
        if (!product.size_options.includes(selectedSize)) {
          return false;
        }
      } else if (selectedSize !== "all" && (!product.size_options || product.size_options.length === 0)) {
        return false;
      }

      // Price range filter
      const isDefaultRange = priceRange[0] === 0 && priceRange[1] >= maxPrice;
      if (!isDefaultRange) {
        if (product.price < priceRange[0] || product.price > priceRange[1]) {
          return false;
        }
      }

      return true;
    });
  }, [products, selectedCategory, selectedMetalFinish, selectedSize, selectedCollection, priceRange, maxPrice, searchQuery, collections]);

  // Auto-load more products when filtered results are low (smart loading for filters)
  useEffect(() => {
    // If we have filters active and filtered results are less than 8, auto-load more
    const hasActiveFilter = selectedCategory !== "all" || 
                           selectedMetalFinish !== "all" || 
                           selectedSize !== "all" || 
                           selectedCollection !== "all" || 
                           searchQuery.trim() !== "" ||
                           (priceRange[0] !== 0 || priceRange[1] < maxPrice);
    
    if (hasActiveFilter && filteredProducts.length < 8 && hasMore && !isLoadingMore && !isLoading && products.length > 0) {
      // Auto-load more products to ensure we have enough filtered results
      const timer = setTimeout(() => {
        loadProducts(currentOffset);
      }, 500); // Small delay to avoid rapid requests
      
      return () => clearTimeout(timer);
    }
  }, [filteredProducts.length, hasMore, isLoadingMore, isLoading, selectedCategory, selectedMetalFinish, selectedSize, selectedCollection, searchQuery, priceRange, maxPrice, currentOffset, loadProducts, products.length]);

  const handleReset = () => {
    setSelectedCategory("all");
    setSelectedMetalFinish("all");
    setSelectedSize("all");
    setSelectedCollection("all");
    setPriceRange([0, maxPrice]);
    setSearchQuery("");
    // Reset pagination
    setCurrentOffset(0);
    setHasMore(true);
    loadProducts(0, true);
    router.replace("/products", { scroll: false });
  };

  const handleCollectionChange = useCallback((collectionSlug: string) => {
    // Update state immediately for instant UI feedback
    setSelectedCollection(collectionSlug);
    // Update URL (which will sync with state via useEffect, but we prevent loops)
    updateURLParams({ collection: collectionSlug });
  }, [updateURLParams]);

  const handleCategoryChange = useCallback((category: Category | "all") => {
    // Update state immediately for instant UI feedback
    setSelectedCategory(category);
    // Update URL (which will sync with state via useEffect, but we prevent loops)
    updateURLParams({ category });
  }, [updateURLParams]);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 md:py-6">
        {/* Compact Header */}
        <div className="mb-6">
          <div className="flex items-baseline justify-between mb-3">
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900 tracking-tight">Products</h1>
            <p className="text-xs text-gray-500">
              {filteredProducts.length > 0 ? `${filteredProducts.length} items` : ''}
            </p>
          </div>

          {/* Collections Section - Compact Horizontal Pills */}
          {collections.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
              <button
                onClick={() => handleCollectionChange("all")}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all whitespace-nowrap border ${
                  selectedCollection === "all"
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900"
                }`}
              >
                All
              </button>
              {collections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => handleCollectionChange(collection.slug)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all whitespace-nowrap border ${
                    selectedCollection === collection.slug
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900"
                  }`}
                >
                  {collection.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 md:gap-4">
          {/* Desktop Filters - More Compact */}
          <aside className="hidden md:block w-52 flex-shrink-0">
            <ProductFilters
              selectedCategory={selectedCategory}
              selectedMetalFinish={selectedMetalFinish}
              selectedSize={selectedSize}
              priceRange={priceRange}
              onCategoryChange={handleCategoryChange}
              onMetalFinishChange={setSelectedMetalFinish}
              onSizeChange={setSelectedSize}
              onPriceRangeChange={setPriceRange}
              onReset={handleReset}
            />
          </aside>

          {/* Mobile Filter Button */}
          <div className="md:hidden mb-3 w-full">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-between w-full rounded-md border bg-white px-3 py-2 text-xs hover:border-[#D4AF37] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5" />
                <span>Filters</span>
              </div>
              {showFilters && <X className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Mobile Filters */}
          {showFilters && (
            <div className="md:hidden mb-3 w-full">
              <ProductFilters
                selectedCategory={selectedCategory}
                selectedMetalFinish={selectedMetalFinish}
                selectedSize={selectedSize}
                priceRange={priceRange}
                onCategoryChange={handleCategoryChange}
                onMetalFinishChange={setSelectedMetalFinish}
                onSizeChange={setSelectedSize}
                onPriceRangeChange={setPriceRange}
                onReset={handleReset}
              />
            </div>
          )}

          {/* Products Grid */}
          <div className="flex-1 min-w-0">
            {/* Compact filter info */}
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] text-gray-500">
                {filteredProducts.length} {filteredProducts.length === 1 ? "item" : "items"}
                {totalProducts > 0 && ` of ${totalProducts}`}
              </p>
              {(selectedCategory !== "all" || selectedMetalFinish !== "all" || selectedSize !== "all" || selectedCollection !== "all" || searchQuery.trim()) && (
                <button
                  onClick={handleReset}
                  className="text-[11px] text-gray-600 hover:text-gray-900 font-medium transition-colors flex items-center gap-1 underline"
                >
                  Clear filters
                </button>
              )}
            </div>

            {isLoading && products.length === 0 ? (
              <div className="rounded-lg border border-gray-100 bg-white p-12 text-center">
                <div className="animate-pulse space-y-3">
                  <div className="h-3 bg-gray-200 rounded w-24 mx-auto"></div>
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div key={i} className="bg-gray-200 rounded-lg aspect-square"></div>
                    ))}
                  </div>
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-lg border border-gray-100 bg-white p-12 text-center">
                <Package className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500 mb-2">No products found</p>
                <button
                  onClick={handleReset}
                  className="text-[11px] text-gray-600 hover:text-gray-900 font-medium underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.product_id} product={product} />
                  ))}
                </div>
                
                {/* Loading more indicator */}
                {isLoadingMore && (
                  <div className="mt-6 flex justify-center">
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="h-4 w-4 border-2 border-gray-300 border-t-[#D4AF37] rounded-full animate-spin"></div>
                      <span className="text-sm">Loading more products...</span>
                    </div>
                  </div>
                )}
                
                {/* End of results message */}
                {!hasMore && filteredProducts.length > 0 && (
                  <div className="mt-6 text-center text-sm text-gray-500">
                    No more products to load
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Compact Categories & Collections Section */}
        {!isLoading && filteredProducts.length > 0 && (
          <section className="mt-8 md:mt-10 pt-6 border-t border-gray-100">
            <div className="space-y-6">
              {/* Browse by Category - Compact */}
              <div>
                <h2 className="text-xs font-semibold text-gray-900 mb-2.5 uppercase tracking-wider">Browse by Category</h2>
                <div className="flex flex-wrap gap-2">
                  {(['rings', 'earrings', 'pendants', 'bracelets', 'necklaces'] as Category[]).map((category) => (
                    <button
                      key={category}
                      onClick={() => handleCategoryChange(category)}
                      className={`group px-3 py-1.5 rounded-md border transition-all ${
                        selectedCategory === category
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <span className={`text-[11px] font-medium capitalize ${
                        selectedCategory === category
                          ? "text-white"
                          : "text-gray-700 group-hover:text-gray-900"
                      }`}>
                        {category}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Featured Collections - Compact Horizontal Scroll */}
              {collections.filter(c => c.is_featured).length > 0 && (
                <div>
                  <h2 className="text-xs font-semibold text-gray-900 mb-2.5 uppercase tracking-wider">Featured Collections</h2>
                  <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                    {collections.filter(c => c.is_featured).slice(0, 6).map((collection) => (
                      <button
                        key={collection.id}
                        onClick={() => handleCollectionChange(collection.slug)}
                        className={`group relative flex-shrink-0 w-32 h-20 rounded-md border transition-all overflow-hidden ${
                          selectedCollection === collection.slug
                            ? "border-gray-900 ring-2 ring-gray-900"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        {collection.image ? (
                          <div className="absolute inset-0">
                            <Image
                              src={collection.image}
                              alt={collection.name}
                              fill
                              className={`object-cover transition-opacity ${
                                selectedCollection === collection.slug
                                  ? "opacity-90"
                                  : "opacity-70 group-hover:opacity-90"
                              }`}
                              sizes="128px"
                            />
                          </div>
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100" />
                        )}
                        <div className="absolute inset-0 flex items-end p-2 bg-gradient-to-t from-black/40 via-black/10 to-transparent">
                          <span className="text-[10px] font-medium text-white drop-shadow-sm truncate w-full">
                            {collection.name}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF9F6]">
        <Header />
        <main className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center text-gray-500">Loading...</div>
        </main>
        <Footer />
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
