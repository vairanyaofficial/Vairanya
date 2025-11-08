"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import ProductFilters from "@/components/ProductFilters";
import type { Category, MetalFinish, Product } from "@/lib/products-types";
import type { Collection } from "@/lib/collections-types";
import { Filter, X, Package } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all");
  const [selectedMetalFinish, setSelectedMetalFinish] = useState<MetalFinish | "all">("all");
  const [selectedSize, setSelectedSize] = useState<string | "all">("all");
  const [selectedCollection, setSelectedCollection] = useState<string | "all">("all");
  const [maxPrice, setMaxPrice] = useState<number>(999999);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 999999]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Get search query and category from URL params
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const collection = searchParams.get("collection");
    
    if (search) {
      setSearchQuery(search);
    }
    if (category && ["rings", "earrings", "pendants", "bracelets", "necklaces"].includes(category)) {
      setSelectedCategory(category as Category);
    }
    if (collection) {
      setSelectedCollection(collection);
    }

    // Fetch collections
    fetch("/api/collections")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.collections) {
          setCollections(data.collections.filter((c: Collection) => c.is_active));
        }
      })
      .catch(() => {});

    // Fetch products from public API endpoint
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          let productsList = data.products;
          
          // If collection parameter exists, filter by collection
          if (collection) {
            fetch("/api/collections")
              .then((res) => res.json())
              .then((collectionData) => {
                if (collectionData.success && collectionData.collections) {
                  const selectedCollection = collectionData.collections.find(
                    (c: any) => c.slug === collection
                  );
                  if (selectedCollection && selectedCollection.product_ids) {
                    productsList = productsList.filter((p: Product) =>
                      selectedCollection.product_ids.includes(p.product_id)
                    );
                  }
                  setProducts(productsList);
                  // Calculate max price from products to set default range
                  if (productsList && productsList.length > 0) {
                    const max = Math.max(...productsList.map((p: Product) => p.price || 0));
                    const calculatedMax = Math.ceil(max * 1.1);
                    setMaxPrice(calculatedMax);
                    setPriceRange([0, calculatedMax]);
                  }
                }
              })
              .catch(() => {
                setProducts(productsList);
              });
          } else {
            setProducts(productsList);
            // Calculate max price from products to set default range
            if (productsList && productsList.length > 0) {
              const max = Math.max(...productsList.map((p: Product) => p.price || 0));
              const calculatedMax = Math.ceil(max * 1.1);
              setMaxPrice(calculatedMax);
              setPriceRange([0, calculatedMax]);
            }
          }
        }
      })
      .catch(() => {
        // Fallback to static import if API fails
        import("@/lib/products").then((mod) => {
          setProducts(mod.products);
          if (mod.products && mod.products.length > 0) {
            const max = Math.max(...mod.products.map((p: Product) => p.price || 0));
            const calculatedMax = Math.ceil(max * 1.1);
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

  const handleReset = () => {
    setSelectedCategory("all");
    setSelectedMetalFinish("all");
    setSelectedSize("all");
    setSelectedCollection("all");
    setPriceRange([0, maxPrice]);
    setSearchQuery("");
    router.push("/products");
  };

  const handleCollectionChange = (collectionSlug: string) => {
    setSelectedCollection(collectionSlug);
    if (collectionSlug === "all") {
      router.push("/products");
    } else {
      router.push(`/products?collection=${collectionSlug}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50/30 to-white">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        {/* Compact Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="font-serif text-3xl md:text-4xl font-light mb-2 tracking-tight">Products</h1>
          <p className="text-sm md:text-base text-gray-600">
            Discover our handcrafted, anti-tarnish jewellery collection
          </p>
        </div>

        {/* Collections Section - Compact */}
        {collections.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">Collections</h2>
              {selectedCollection !== "all" && (
                <button
                  onClick={() => handleCollectionChange("all")}
                  className="text-xs text-[#D4AF37] hover:text-[#C19B2E] flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  Clear
                </button>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => handleCollectionChange("all")}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  selectedCollection === "all"
                    ? "bg-[#D4AF37] text-white"
                    : "bg-white border border-gray-200 text-gray-700 hover:border-[#D4AF37]"
                }`}
              >
                All Products
              </button>
              {collections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => handleCollectionChange(collection.slug)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    selectedCollection === collection.slug
                      ? "bg-[#D4AF37] text-white"
                      : "bg-white border border-gray-200 text-gray-700 hover:border-[#D4AF37]"
                  }`}
                >
                  {collection.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4 md:gap-6">
          {/* Desktop Filters - Compact */}
          <aside className="hidden md:block w-56 flex-shrink-0">
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
          <div className="md:hidden mb-4 w-full">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-between w-full rounded-lg border bg-white px-3 py-2 text-sm hover:border-[#D4AF37] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </div>
              {showFilters && <X className="h-4 w-4" />}
            </button>
          </div>

          {/* Mobile Filters */}
          {showFilters && (
            <div className="md:hidden mb-4 w-full">
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
            </div>
          )}

          {/* Products Grid */}
          <div className="flex-1 min-w-0">
            <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
              <p className="text-xs md:text-sm text-gray-600">
                {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"} found
              </p>
              {(selectedCategory !== "all" || selectedMetalFinish !== "all" || selectedSize !== "all" || selectedCollection !== "all" || searchQuery.trim()) && (
                <button
                  onClick={handleReset}
                  className="text-xs text-[#D4AF37] hover:text-[#C19B2E] font-medium transition-colors flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  Clear all filters
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                <p className="text-sm text-gray-500">Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-sm text-gray-500 mb-3">No products found matching your filters.</p>
                <button
                  onClick={handleReset}
                  className="text-xs text-[#D4AF37] hover:text-[#C19B2E] font-medium transition-colors"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
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
