"use client";

import React, { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import ProductFilters from "@/components/ProductFilters";
import type { Category, MetalFinish, Product } from "@/lib/products-types";
import type { Collection } from "@/lib/collections-types";
import { Filter, X, Package, ChevronDown } from "lucide-react";
import Image from "next/image";
import { ProductGridSkeleton, LoadingMoreSkeleton } from "@/components/SkeletonLoader";

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
  
  // Track loading states to prevent multiple simultaneous loads
  const loadingStateRef = React.useRef({ isLoading: false, isLoadingMore: false });
  
  // Track if initialization has completed
  const hasInitialized = React.useRef(false);

  // Function to load products with pagination
  const loadProducts = useCallback(async (offset: number, isInitial: boolean = false) => {
    // Prevent multiple simultaneous loads
    if (isInitial && loadingStateRef.current.isLoading) {
      return;
    }
    if (!isInitial && loadingStateRef.current.isLoadingMore) {
      return;
    }

    try {
      if (isInitial) {
        loadingStateRef.current.isLoading = true;
        loadingStateRef.current.isLoadingMore = false;
        setIsLoading(true);
        setIsLoadingMore(false);
      } else {
        loadingStateRef.current.isLoadingMore = true;
        setIsLoadingMore(true);
      }

      const response = await fetch(`/api/products?limit=${PRODUCTS_PER_PAGE}&offset=${offset}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`);
      }
      
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
      // Always reset loading states
      if (isInitial) {
        loadingStateRef.current.isLoading = false;
        setIsLoading(false);
      } else {
        loadingStateRef.current.isLoadingMore = false;
        setIsLoadingMore(false);
      }
    }
  }, [PRODUCTS_PER_PAGE]);

  // Load initial products and max price - only once on mount
  useEffect(() => {
    // Only run initialization once
    if (hasInitialized.current) {
      return;
    }

    let isMounted = true;

    const initializeData = async () => {
      hasInitialized.current = true;

      try {
        setIsLoading(true);
        setIsLoadingMore(false);
        loadingStateRef.current.isLoading = true;
        loadingStateRef.current.isLoadingMore = false;

        // Fetch collections and max price in parallel
        const [collectionsRes, maxPriceRes] = await Promise.all([
          fetch("/api/collections").catch((err) => {
            console.error("Error fetching collections:", err);
            return null;
          }),
          fetch("/api/products?all=true").catch(() => null), // Get all products for max price calculation
        ]);

        if (!isMounted) {
          setIsLoading(false);
          loadingStateRef.current.isLoading = false;
          return;
        }

        // Set collections
        if (collectionsRes && collectionsRes.ok) {
          try {
            const collectionData = await collectionsRes.json();
            if (collectionData.success && collectionData.collections && Array.isArray(collectionData.collections)) {
              // Filter to only active collections, but log for debugging
              const activeCollections = collectionData.collections.filter((c: Collection) => {
                // Check if is_active exists and is true, or if is_active is undefined, include it
                return c.is_active !== false; // Include if is_active is true or undefined
              });
              console.log(`Loaded ${activeCollections.length} active collections out of ${collectionData.collections.length} total`);
              setCollections(activeCollections);
            } else {
              console.warn("Collections API returned unsuccessful response or invalid data:", collectionData);
              setCollections([]);
            }
          } catch (err) {
            console.error("Error parsing collections:", err);
            setCollections([]);
          }
        } else {
          if (collectionsRes) {
            console.warn("Collections API returned non-ok status:", collectionsRes.status, collectionsRes.statusText);
          } else {
            console.warn("Collections API request failed - no response received");
          }
          setCollections([]);
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
              // Don't set totalProducts here - it will be set from the paginated products API call
              // This prevents race conditions where totalProducts gets set to wrong value
            }
          } catch (err) {
            console.error("Error calculating max price:", err);
          }
        }

        // Load initial batch of products using the memoized function
        if (isMounted && !loadingStateRef.current.isLoading) {
          // Double check - if somehow isLoading got reset, set it again
          setIsLoading(true);
          loadingStateRef.current.isLoading = true;
        }
        
        if (isMounted) {
          await loadProducts(0, true);
        }
      } catch (err) {
        console.error("Error initializing data:", err);
        if (isMounted) {
          setIsLoading(false);
          setIsLoadingMore(false);
          loadingStateRef.current.isLoading = false;
          loadingStateRef.current.isLoadingMore = false;
        }
      }
    };

    initializeData();

    return () => {
      isMounted = false;
    };
  }, [loadProducts]); // Include loadProducts - it's stable and memoized

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

    // Ensure loading state is false when filters change (filtering is instant, no API call)
    if (isLoading && products.length > 0) {
      setIsLoading(false);
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
  }, [searchParams, isLoading, products.length]); // Only depend on searchParams to avoid loops - state updates are handled via functional updates

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
    
    // Only auto-load if we're not currently loading and have products to load
    if (hasActiveFilter && filteredProducts.length < 8 && hasMore && !isLoadingMore && !isLoading && products.length > 0) {
      // Auto-load more products to ensure we have enough filtered results
      const timer = setTimeout(() => {
        // Double check conditions before loading to prevent unnecessary loads
        if (!isLoadingMore && !isLoading && hasMore) {
          loadProducts(currentOffset);
        }
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
    // Only reload if we don't have products, otherwise just reset filters
    if (products.length === 0) {
      loadProducts(0, true);
    }
    router.replace("/products", { scroll: false });
  };

  const handleCollectionChange = useCallback((collectionSlug: string) => {
    // Ensure loading state is false when filters change
    if (isLoading && products.length > 0) {
      setIsLoading(false);
      loadingStateRef.current.isLoading = false;
    }
    // Update state immediately for instant UI feedback
    setSelectedCollection(collectionSlug);
    // Update URL (which will sync with state via useEffect, but we prevent loops)
    updateURLParams({ collection: collectionSlug });
  }, [updateURLParams, isLoading, products.length]);

  const handleCategoryChange = useCallback((category: Category | "all") => {
    // Ensure loading state is false when filters change
    if (isLoading && products.length > 0) {
      setIsLoading(false);
      loadingStateRef.current.isLoading = false;
    }
    // Update state immediately for instant UI feedback
    setSelectedCategory(category);
    // Update URL (which will sync with state via useEffect, but we prevent loops)
    updateURLParams({ category });
  }, [updateURLParams, isLoading, products.length]);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6">
        {/* Mobile Optimized Header */}
        <div className="mb-4 md:mb-6">
          <div className="flex items-baseline justify-between mb-3 md:mb-4">
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Products</h1>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
              {filteredProducts.length > 0 ? `${filteredProducts.length} items` : ''}
            </p>
          </div>

          {/* Collections Section - Mobile Optimized Horizontal Pills */}
          {collections.length > 0 && (
            <div className="flex gap-2 md:gap-1.5 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
              <button
                onClick={() => handleCollectionChange("all")}
                className={`flex-shrink-0 px-4 md:px-3 py-2 md:py-1.5 rounded-full text-xs md:text-[11px] font-semibold md:font-medium transition-all whitespace-nowrap border-2 md:border touch-manipulation ${
                  selectedCollection === "all"
                    ? "bg-[#D4AF37] text-white border-[#D4AF37] shadow-md"
                    : "bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 active:border-[#D4AF37] dark:active:border-[#D4AF37] active:text-[#D4AF37] dark:active:text-[#D4AF37] md:hover:border-[#D4AF37] dark:md:hover:border-[#D4AF37] md:hover:text-[#D4AF37] dark:md:hover:text-[#D4AF37]"
                }`}
              >
                All
              </button>
              {collections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => handleCollectionChange(collection.slug)}
                  className={`flex-shrink-0 px-4 md:px-3 py-2 md:py-1.5 rounded-full text-xs md:text-[11px] font-semibold md:font-medium transition-all whitespace-nowrap border-2 md:border touch-manipulation ${
                    selectedCollection === collection.slug
                      ? "bg-[#D4AF37] text-white border-[#D4AF37] shadow-md"
                      : "bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 active:border-[#D4AF37] dark:active:border-[#D4AF37] active:text-[#D4AF37] dark:active:text-[#D4AF37] md:hover:border-[#D4AF37] dark:md:hover:border-[#D4AF37] md:hover:text-[#D4AF37] dark:md:hover:text-[#D4AF37]"
                  }`}
                >
                  {collection.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-3 md:gap-4">
          {/* Desktop Filters - More Compact */}
          <aside className="hidden md:block w-52 flex-shrink-0">
            <ProductFilters
              selectedCategory={selectedCategory}
              selectedMetalFinish={selectedMetalFinish}
              selectedSize={selectedSize}
              priceRange={priceRange}
              onCategoryChange={handleCategoryChange}
              onMetalFinishChange={(finish) => {
                if (isLoading && products.length > 0) {
                  setIsLoading(false);
                  loadingStateRef.current.isLoading = false;
                }
                setSelectedMetalFinish(finish);
              }}
              onSizeChange={(size) => {
                if (isLoading && products.length > 0) {
                  setIsLoading(false);
                  loadingStateRef.current.isLoading = false;
                }
                setSelectedSize(size);
              }}
              onPriceRangeChange={(range) => {
                if (isLoading && products.length > 0) {
                  setIsLoading(false);
                  loadingStateRef.current.isLoading = false;
                }
                setPriceRange(range);
              }}
              onReset={handleReset}
            />
          </aside>

          {/* Mobile Filter Button - Better Touch Target */}
          <div className="md:hidden mb-2 w-full">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-between w-full rounded-xl border-2 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] px-4 py-3 text-sm font-medium text-gray-900 dark:text-white active:border-[#D4AF37] active:bg-gray-50 dark:active:bg-[#1a1a1a] transition-colors touch-manipulation"
            >
              <div className="flex items-center gap-2.5">
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </div>
              {showFilters ? <X className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {/* Mobile Filters - Slide Down */}
          {showFilters && (
            <div className="md:hidden mb-3 w-full bg-white dark:bg-[#0a0a0a] border-2 border-gray-200 dark:border-white/10 rounded-xl p-4">
              <ProductFilters
                selectedCategory={selectedCategory}
                selectedMetalFinish={selectedMetalFinish}
                selectedSize={selectedSize}
                priceRange={priceRange}
                onCategoryChange={handleCategoryChange}
                onMetalFinishChange={(finish) => {
                  if (isLoading && products.length > 0) {
                    setIsLoading(false);
                    loadingStateRef.current.isLoading = false;
                  }
                  setSelectedMetalFinish(finish);
                }}
                onSizeChange={(size) => {
                  if (isLoading && products.length > 0) {
                    setIsLoading(false);
                    loadingStateRef.current.isLoading = false;
                  }
                  setSelectedSize(size);
                }}
                onPriceRangeChange={(range) => {
                  if (isLoading && products.length > 0) {
                    setIsLoading(false);
                    loadingStateRef.current.isLoading = false;
                  }
                  setPriceRange(range);
                }}
                onReset={handleReset}
              />
            </div>
          )}

          {/* Products Grid - Mobile Optimized */}
          <div className="flex-1 min-w-0">
            {/* Mobile Optimized filter info */}
            <div className="mb-3 md:mb-3 flex items-center justify-between">
              <p className="text-xs md:text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                {filteredProducts.length} {filteredProducts.length === 1 ? "item" : "items"}
                {totalProducts > 0 && totalProducts >= filteredProducts.length && ` of ${totalProducts}`}
              </p>
              {(selectedCategory !== "all" || selectedMetalFinish !== "all" || selectedSize !== "all" || selectedCollection !== "all" || searchQuery.trim()) && (
                <button
                  onClick={handleReset}
                  className="text-xs md:text-[11px] text-gray-600 dark:text-gray-400 active:text-gray-900 dark:active:text-white md:hover:text-gray-900 dark:md:hover:text-white font-semibold md:font-medium transition-colors flex items-center gap-1 underline touch-manipulation"
                >
                  Clear filters
                </button>
              )}
            </div>

            {/* Show skeleton during initial load when no products exist */}
            {isLoading && products.length === 0 ? (
              <ProductGridSkeleton count={8} />
            ) : filteredProducts.length === 0 && products.length > 0 ? (
              <div className="rounded-xl md:rounded-lg border-2 md:border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] p-12 md:p-12 text-center">
                <Package className="h-12 w-12 md:h-8 md:w-8 text-gray-300 dark:text-gray-700 mx-auto mb-3 md:mb-2" />
                <p className="text-sm md:text-xs text-gray-500 dark:text-gray-400 mb-3 md:mb-2 font-medium">No products found</p>
                <button
                  onClick={handleReset}
                  className="text-sm md:text-[11px] text-gray-600 dark:text-gray-400 active:text-gray-900 dark:active:text-white md:hover:text-gray-900 dark:md:hover:text-white font-semibold md:font-medium underline touch-manipulation"
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
                
                {/* Loading more skeleton */}
                {isLoadingMore && <LoadingMoreSkeleton />}
                
                {/* End of results message */}
                {!hasMore && filteredProducts.length > 0 && (
                  <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    No more products to load
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Compact Categories & Collections Section */}
        {!isLoading && filteredProducts.length > 0 && (
          <section className="mt-8 md:mt-10 pt-6 border-t border-gray-100 dark:border-white/10">
            <div className="space-y-6">
              {/* Browse by Category - Compact */}
              <div>
                <h2 className="text-xs font-semibold text-gray-900 dark:text-white mb-2.5 uppercase tracking-wider">Browse by Category</h2>
                <div className="flex flex-wrap gap-2">
                  {(['rings', 'earrings', 'pendants', 'bracelets', 'necklaces'] as Category[]).map((category) => (
                    <button
                      key={category}
                      onClick={() => handleCategoryChange(category)}
                      className={`group px-3 py-1.5 rounded-md border transition-all ${
                        selectedCategory === category
                          ? "border-[#D4AF37] bg-[#D4AF37] text-white shadow-md"
                          : "border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] hover:border-[#D4AF37] dark:hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 dark:hover:bg-[#D4AF37]/5"
                      }`}
                    >
                      <span className={`text-[11px] font-medium capitalize transition-colors ${
                        selectedCategory === category
                          ? "text-white"
                          : "text-gray-700 dark:text-gray-300 group-hover:text-[#D4AF37] dark:group-hover:text-[#D4AF37]"
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
                  <h2 className="text-xs font-semibold text-gray-900 dark:text-white mb-2.5 uppercase tracking-wider">Featured Collections</h2>
                  <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                    {collections.filter(c => c.is_featured).slice(0, 6).map((collection) => (
                      <button
                        key={collection.id}
                        onClick={() => handleCollectionChange(collection.slug)}
                        className={`group relative flex-shrink-0 w-32 h-20 rounded-md border transition-all overflow-hidden ${
                          selectedCollection === collection.slug
                            ? "border-[#D4AF37] ring-2 ring-[#D4AF37] shadow-lg"
                            : "border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] hover:border-[#D4AF37] dark:hover:border-[#D4AF37]"
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
                          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#1a1a1a] dark:to-[#0a0a0a]" />
                        )}
                        <div className={`absolute inset-0 flex items-end p-2 bg-gradient-to-t transition-colors ${
                          selectedCollection === collection.slug
                            ? "from-[#D4AF37]/60 via-[#D4AF37]/20 to-transparent"
                            : "from-black/40 via-black/10 to-transparent group-hover:from-[#D4AF37]/40 group-hover:via-[#D4AF37]/10"
                        }`}>
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
      <div className="min-h-screen bg-[#FAF9F6] dark:bg-black">
        <Header />
        <main className="max-w-7xl mx-auto px-6 py-16">
          <ProductGridSkeleton count={8} />
        </main>
        <Footer />
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
