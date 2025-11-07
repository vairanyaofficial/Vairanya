"use client";

import React, { useEffect, useState } from "react";
import type { Category, MetalFinish } from "@/lib/products-types";
import { getAllCategories, getAllMetalFinishes } from "@/lib/products-types";

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
          // Extract all unique sizes from all products
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
            // Sort numbers first, then letters
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
        // Fallback to common sizes
        const commonSizes = ["S", "M", "L", "XL", "6", "7", "8", "9", "10", "11", "12"];
        setAvailableSizes(commonSizes);
      }
    };
    fetchSizes();
  }, []);

  return (
    <div className="space-y-6 rounded-lg border bg-white p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg font-semibold">Filters</h3>
        <button
          onClick={onReset}
          className="text-sm text-[#D4AF37] hover:underline"
        >
          Reset
        </button>
      </div>

      {/* Category Filter */}
      <div>
        <h4 className="mb-3 text-sm font-medium">Category</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="category"
              checked={selectedCategory === "all"}
              onChange={() => onCategoryChange("all")}
              className="h-4 w-4 text-[#D4AF37]"
            />
            <span>All</span>
          </label>
          {categories.map((category) => (
            <label key={category} className="flex items-center gap-2 text-sm capitalize">
              <input
                type="radio"
                name="category"
                checked={selectedCategory === category}
                onChange={() => onCategoryChange(category as any)}
                className="h-4 w-4 text-[#D4AF37]"
              />
              <span>{category}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Metal Finish Filter */}
      <div>
        <h4 className="mb-3 text-sm font-medium">Metal Finish</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="metalFinish"
              checked={selectedMetalFinish === "all"}
              onChange={() => onMetalFinishChange("all")}
              className="h-4 w-4 text-[#D4AF37]"
            />
            <span>All</span>
          </label>
          {metalFinishes.map((finish) => (
            <label key={finish} className="flex items-center gap-2 text-sm capitalize">
              <input
                type="radio"
                name="metalFinish"
                checked={selectedMetalFinish === finish}
                onChange={() => onMetalFinishChange(finish)}
                className="h-4 w-4 text-[#D4AF37]"
              />
              <span>{finish.replace("-", " ")}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Size Filter */}
      <div>
        <h4 className="mb-3 text-sm font-medium">Size</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="size"
              checked={selectedSize === "all"}
              onChange={() => onSizeChange("all")}
              className="h-4 w-4 text-[#D4AF37]"
            />
            <span>All</span>
          </label>
          {availableSizes.map((size) => (
            <label key={size} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="size"
                checked={selectedSize === size}
                onChange={() => onSizeChange(size)}
                className="h-4 w-4 text-[#D4AF37]"
              />
              <span>{size}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div>
        <h4 className="mb-3 text-sm font-medium">Price Range</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              value={priceRange[0] || ""}
              onChange={(e) =>
                onPriceRangeChange([Number(e.target.value) || 0, priceRange[1]])
              }
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              placeholder="Max"
              value={priceRange[1] || ""}
              onChange={(e) =>
                onPriceRangeChange([priceRange[0], Number(e.target.value) || 9999])
              }
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;

