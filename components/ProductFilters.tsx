"use client";

import React, { useEffect, useState } from "react";
import type { Category, MetalFinish } from "@/lib/products-types";
import { getAllCategories, getAllMetalFinishes } from "@/lib/products-types";
import { X } from "lucide-react";

interface ProductFiltersProps {
  selectedCategory: Category | "all";
  selectedMetalFinish: MetalFinish | "all";
  selectedSize: string | "all";
  priceRange: [number, number];
  onCategoryChange: (category: Category | "all") => void;
  onMetalFinishChange: (finish: MetalFinish | "all") => void;
  onSizeChange: (size: string | "all") => void;
  onPriceRangeChange: (range: [number, number]) => void;
  onReset: () => void;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
  selectedCategory,
  selectedMetalFinish,
  selectedSize,
  priceRange,
  onCategoryChange,
  onMetalFinishChange,
  onSizeChange,
  onPriceRangeChange,
  onReset,
}) => {
  const [categories, setCategories] = useState<string[]>(getAllCategories());
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const metalFinishes = getAllMetalFinishes();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (data.success && Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      } catch {
        // ignore and keep defaults
      }
    })();
  }, []);

  // Extract unique sizes from products
  useEffect(() => {
    const fetchSizes = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        if (data.success && Array.isArray(data.products)) {
          const allSizes = new Set<string>();
          data.products.forEach((product: any) => {
            if (product.size_options && Array.isArray(product.size_options)) {
              product.size_options.forEach((size: string) => {
                if (size && size.trim()) {
                  allSizes.add(size.trim());
                }
              });
            }
          });
          const sortedSizes = Array.from(allSizes).sort((a, b) => {
            const aNum = parseInt(a);
            const bNum = parseInt(b);
            if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
            if (!isNaN(aNum)) return -1;
            if (!isNaN(bNum)) return 1;
            return a.localeCompare(b);
          });
          setAvailableSizes(sortedSizes);
        }
      } catch {
        const commonSizes = ["S", "M", "L", "XL", "6", "7", "8", "9", "10", "11", "12"];
        setAvailableSizes(commonSizes);
      }
    };
    fetchSizes();
  }, []);

  const hasActiveFilters = selectedCategory !== "all" || selectedMetalFinish !== "all" || selectedSize !== "all" || (priceRange[0] !== 0 || priceRange[1] < 999999);

  return (
    <div className="space-y-4 rounded-lg border border-gray-200/50 dark:border-white/10 bg-white dark:bg-[#0a0a0a] p-4 shadow-sm dark:shadow-none">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-xs text-[#D4AF37] hover:text-[#C19B2E] font-medium transition-colors flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      {/* Category Filter - Compact */}
      <div>
        <h4 className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">Category</h4>
        <div className="space-y-1.5">
          <label className={`flex items-center gap-2 text-xs cursor-pointer transition-colors ${
            selectedCategory === "all" 
              ? "text-[#D4AF37] font-medium" 
              : "text-gray-900 dark:text-gray-300 hover:text-[#D4AF37]"
          }`}>
            <input
              type="radio"
              name="category"
              checked={selectedCategory === "all"}
              onChange={() => onCategoryChange("all")}
              className="h-3 w-3 text-[#D4AF37] focus:ring-[#D4AF37] dark:bg-black dark:border-white/20 accent-[#D4AF37]"
            />
            <span>All</span>
          </label>
          {categories.map((category) => (
            <label key={category} className={`flex items-center gap-2 text-xs capitalize cursor-pointer transition-colors ${
              selectedCategory === category 
                ? "text-[#D4AF37] font-medium" 
                : "text-gray-900 dark:text-gray-300 hover:text-[#D4AF37]"
            }`}>
              <input
                type="radio"
                name="category"
                checked={selectedCategory === category}
                onChange={() => onCategoryChange(category as any)}
                className="h-3 w-3 text-[#D4AF37] focus:ring-[#D4AF37] dark:bg-black dark:border-white/20 accent-[#D4AF37]"
              />
              <span>{category}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Metal Finish Filter - Compact & Fixed */}
      <div>
        <h4 className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">Metal Finish</h4>
        <div className="space-y-1.5">
          <label className={`flex items-center gap-2 text-xs cursor-pointer transition-colors ${
            selectedMetalFinish === "all" 
              ? "text-[#D4AF37] font-medium" 
              : "text-gray-900 dark:text-gray-300 hover:text-[#D4AF37]"
          }`}>
            <input
              type="radio"
              name="metalFinish"
              checked={selectedMetalFinish === "all"}
              onChange={() => onMetalFinishChange("all")}
              className="h-3 w-3 text-[#D4AF37] focus:ring-[#D4AF37] dark:bg-black dark:border-white/20 accent-[#D4AF37]"
            />
            <span>All</span>
          </label>
          {metalFinishes.map((finish) => (
            <label key={finish} className={`flex items-center gap-2 text-xs capitalize cursor-pointer transition-colors ${
              selectedMetalFinish === finish 
                ? "text-[#D4AF37] font-medium" 
                : "text-gray-900 dark:text-gray-300 hover:text-[#D4AF37]"
            }`}>
              <input
                type="radio"
                name="metalFinish"
                checked={selectedMetalFinish === finish}
                onChange={() => onMetalFinishChange(finish)}
                className="h-3 w-3 text-[#D4AF37] focus:ring-[#D4AF37] dark:bg-black dark:border-white/20 accent-[#D4AF37]"
              />
              <span>{finish.replace(/-/g, " ")}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Size Filter - Compact */}
      {availableSizes.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">Size</h4>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            <label className={`flex items-center gap-2 text-xs cursor-pointer transition-colors ${
              selectedSize === "all" 
                ? "text-[#D4AF37] font-medium" 
                : "text-gray-900 dark:text-gray-300 hover:text-[#D4AF37]"
            }`}>
              <input
                type="radio"
                name="size"
                checked={selectedSize === "all"}
                onChange={() => onSizeChange("all")}
                className="h-3 w-3 text-[#D4AF37] focus:ring-[#D4AF37] dark:bg-black dark:border-white/20 accent-[#D4AF37]"
              />
              <span>All</span>
            </label>
            {availableSizes.map((size) => (
              <label key={size} className={`flex items-center gap-2 text-xs cursor-pointer transition-colors ${
                selectedSize === size 
                  ? "text-[#D4AF37] font-medium" 
                  : "text-gray-900 dark:text-gray-300 hover:text-[#D4AF37]"
              }`}>
                <input
                  type="radio"
                  name="size"
                  checked={selectedSize === size}
                  onChange={() => onSizeChange(size)}
                  className="h-3 w-3 text-[#D4AF37] focus:ring-[#D4AF37] dark:bg-black dark:border-white/20 accent-[#D4AF37]"
                />
                <span>{size}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price Range Filter - Compact */}
      <div>
        <h4 className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">Price Range</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              value={priceRange[0] || ""}
              onChange={(e) =>
                onPriceRangeChange([Number(e.target.value) || 0, priceRange[1]])
              }
              className="w-full rounded border border-gray-300 dark:border-white/10 dark:bg-black dark:text-white px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37]"
              min="0"
            />
            <span className="text-gray-400 dark:text-gray-500 text-xs">-</span>
            <input
              type="number"
              placeholder="Max"
              value={priceRange[1] === 999999 ? "" : priceRange[1]}
              onChange={(e) =>
                onPriceRangeChange([priceRange[0], Number(e.target.value) || 999999])
              }
              className="w-full rounded border border-gray-300 dark:border-white/10 dark:bg-black dark:text-white px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37]"
              min="0"
            />
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            ₹{priceRange[0].toLocaleString()} - ₹{priceRange[1] === 999999 ? "∞" : priceRange[1].toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;
