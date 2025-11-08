"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HorizontalSliderProps<T> {
  items: T[];
  renderItem?: (item: T, index: number) => React.ReactNode;
  children?: React.ReactNode; // Pre-rendered children as alternative to renderItem
  cardWidth: number; // Width of each card including gap
  gap?: number; // Gap between cards (default 16px / gap-4)
  infiniteScroll?: boolean; // Enable infinite scroll (like reviews)
  showNavigation?: boolean; // Show prev/next buttons
  className?: string;
  emptyMessage?: string;
  scrollAmount?: number; // Amount to scroll on button click (defaults to cardWidth)
  buttonSize?: 'sm' | 'md' | 'lg'; // Button size (defaults to 'sm')
}

// Helper function to get item identifier
function getItemKey(item: any, index: number): string | number {
  return item?.id ?? item?.product_id ?? item?.slug ?? index;
}

export default function HorizontalSlider<T = any>({
  items,
  renderItem,
  children,
  cardWidth,
  gap = 16,
  infiniteScroll = false,
  showNavigation = true,
  className = "",
  emptyMessage = "No items to display",
  scrollAmount,
  buttonSize = 'sm',
}: HorizontalSliderProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const scrollByAmount = scrollAmount || cardWidth;

  // Only render on client to avoid SSR serialization issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize scroll position for infinite scroll
  useEffect(() => {
    if (infiniteScroll && scrollRef.current && items.length > 0) {
      const startPosition = items.length * cardWidth;
      scrollRef.current.scrollLeft = startPosition;
    }
  }, [items.length, cardWidth, infiniteScroll]);

  // Handle infinite scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!infiniteScroll || isScrolling) return;
    
    const container = e.currentTarget;
    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;
    const sectionWidth = items.length * cardWidth;
    
    // If scrolled to the end (third cloned section), jump to the middle (original)
    if (scrollLeft >= sectionWidth * 2 - 50) {
      setIsScrolling(true);
      container.scrollLeft = sectionWidth + (scrollLeft - sectionWidth * 2);
      setTimeout(() => setIsScrolling(false), 50);
    }
    // If scrolled to the beginning (first cloned section), jump to the middle (original)
    else if (scrollLeft <= 50) {
      setIsScrolling(true);
      container.scrollLeft = sectionWidth + scrollLeft;
      setTimeout(() => setIsScrolling(false), 50);
    }
  };

  const scrollLeft = () => {
    if (scrollRef.current && (!infiniteScroll || !isScrolling)) {
      scrollRef.current.scrollBy({ left: -scrollByAmount, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current && (!infiniteScroll || !isScrolling)) {
      scrollRef.current.scrollBy({ left: scrollByAmount, behavior: 'smooth' });
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  const getGapClass = () => {
    switch (gap) {
      case 12: return "gap-3";
      case 16: return "gap-4";
      case 24: return "gap-6";
      default: return "gap-4";
    }
  };


  // Render a single item with proper key
  const renderItemNode = (item: T, index: number, prefix = '') => {
    const itemKey = getItemKey(item, index);
    const key = prefix ? `clone-${prefix}-${itemKey}` : itemKey;
    
    if (children) {
      // If children are provided, use them (should be array of nodes matching items)
      const childrenArray = React.Children.toArray(children);
      return (
        <div key={key} className="shrink-0">
          {childrenArray[index] || null}
        </div>
      );
    }
    
    // Only call renderItem after mounting to avoid SSR issues
    if (isMounted && renderItem) {
      try {
        return (
          <div key={key} className="shrink-0">
            {renderItem(item, index)}
          </div>
        );
      } catch (error) {
        console.error('Error rendering item:', error);
        return (
          <div key={key} className="shrink-0" style={{ width: cardWidth }}>
            <div className="animate-pulse bg-gray-200 rounded" style={{ width: cardWidth - gap, height: 300 }} />
          </div>
        );
      }
    }
    
    // Show placeholder during SSR
    return (
      <div key={key} className="shrink-0" style={{ width: cardWidth }}>
        <div className="animate-pulse bg-gray-200 rounded" style={{ width: cardWidth - gap, height: 300 }} />
      </div>
    );
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div
        ref={scrollRef}
        className="overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
        style={{ WebkitOverflowScrolling: 'touch' }}
        onScroll={infiniteScroll ? handleScroll : undefined}
      >
        <div className={`flex ${getGapClass()} min-w-max`}>
          {infiniteScroll && (
            // Clone items for infinite scroll (first set)
            items.map((item, index) => renderItemNode(item, index, 'start'))
          )}
          
          {/* Original items */}
          {items.map((item, index) => renderItemNode(item, index))}
          
          {infiniteScroll && (
            // Clone items for infinite scroll (end set)
            items.map((item, index) => renderItemNode(item, index, 'end'))
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      {showNavigation && items.length > 1 && (
        <>
          <button
            onClick={scrollLeft}
            className={`absolute ${
              buttonSize === 'lg' ? '-left-4 md:-left-6 p-3' : '-left-2 md:-left-4 p-2'
            } top-1/2 -translate-y-1/2 bg-black/80 dark:bg-black/80 hover:bg-black dark:hover:bg-black backdrop-blur-md rounded-full text-white hover:text-[#D4AF37] transition-all duration-300 z-10 shadow-lg border border-white/20 dark:border-white/20 hover:border-[#D4AF37]/50`}
            aria-label="Previous"
          >
            <ChevronLeft className={buttonSize === 'lg' ? "h-6 w-6" : "h-5 w-5"} />
          </button>
          <button
            onClick={scrollRight}
            className={`absolute ${
              buttonSize === 'lg' ? '-right-4 md:-right-6 p-3' : '-right-2 md:-right-4 p-2'
            } top-1/2 -translate-y-1/2 bg-black/80 dark:bg-black/80 hover:bg-black dark:hover:bg-black backdrop-blur-md rounded-full text-white hover:text-[#D4AF37] transition-all duration-300 z-10 shadow-lg border border-white/20 dark:border-white/20 hover:border-[#D4AF37]/50`}
            aria-label="Next"
          >
            <ChevronRight className={buttonSize === 'lg' ? "h-6 w-6" : "h-5 w-5"} />
          </button>
        </>
      )}
    </div>
  );
}

