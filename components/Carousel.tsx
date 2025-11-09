"use client";

import React, { useState, useEffect, useRef } from "react";
import { Image } from "@imagekit/next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CarouselSlide } from "@/lib/carousel-types";
import { CarouselSkeleton } from "./SkeletonLoader";

interface CarouselProps {
  slides: CarouselSlide[];
  autoPlay?: boolean;
  interval?: number;
}

export default function Carousel({ slides, autoPlay = true, interval = 5000 }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [imageLoaded, setImageLoaded] = useState<boolean[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);
  const autoPlayTimer = useRef<NodeJS.Timeout | null>(null);

  // Initialize image loaded state
  useEffect(() => {
    if (slides.length > 0) {
      setImageLoaded(new Array(slides.length).fill(false));
      setIsInitialLoad(true);
    }
  }, [slides.length]);

  // Preload all images
  useEffect(() => {
    if (slides.length === 0 || typeof window === 'undefined') return;

    const preloadImages = () => {
      slides.forEach((slide, index) => {
        if (slide?.image_url) {
          const img = new window.Image();
          img.src = slide.image_url;
          img.onload = () => {
            setImageLoaded((prev) => {
              const newState = [...prev];
              newState[index] = true;
              return newState;
            });
          };
          img.onerror = () => {
            setImageLoaded((prev) => {
              const newState = [...prev];
              newState[index] = true; // Mark as loaded even on error
              return newState;
            });
          };
        }
      });
    };

    preloadImages();

    // Hide initial load after images start loading
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [slides]);

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || isPaused || slides.length <= 1) {
      if (autoPlayTimer.current) {
        clearInterval(autoPlayTimer.current);
        autoPlayTimer.current = null;
      }
      return;
    }

    autoPlayTimer.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, interval);

    return () => {
      if (autoPlayTimer.current) {
        clearInterval(autoPlayTimer.current);
      }
    };
  }, [autoPlay, interval, slides.length, isPaused]);

  // Handle image load event
  const handleImageLoad = (index: number) => {
    setImageLoaded((prev) => {
      const newState = [...prev];
      newState[index] = true;
      return newState;
    });
  };

  const goToSlide = (index: number) => {
    if (index >= 0 && index < slides.length) {
      setCurrentIndex(index);
    }
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  // Touch handlers for swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;
    setIsPaused(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) {
      setIsPaused(false);
      return;
    }

    const distance = touchStart.current - touchEnd.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }

    setIsPaused(false);
    touchStart.current = null;
    touchEnd.current = null;
  };

  if (!slides || slides.length === 0) {
    return <CarouselSkeleton />;
  }

  const currentSlide = slides[currentIndex];

  return (
    <div
      className="relative w-full h-[240px] sm:h-[280px] md:h-[400px] lg:h-[450px] overflow-hidden rounded-xl shadow-lg"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Loading Skeleton - Only on initial load */}
      {isInitialLoad && !imageLoaded[0] && (
        <div className="absolute inset-0 z-40">
          <CarouselSkeleton />
        </div>
      )}

      {/* Slides Container */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => {
          const isActive = index === currentIndex;
          const isVisible = isActive || imageLoaded[index];

          return (
            <div
              key={slide.id || `slide-${index}`}
              className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* Image Container */}
              <div className="relative w-full h-full bg-gray-200 dark:bg-gray-900">
                {isVisible && (
                  <Image
                    src={slide.image_url}
                    alt={slide.title || `Carousel slide ${index + 1}`}
                    fill
                    className="object-cover"
                    priority={index === 0 || index === 1}
                    sizes="100vw"
                    quality={90}
                    loading={index <= 1 ? undefined : "lazy"}
                    onLoad={() => handleImageLoad(index)}
                    onError={(e) => {
                      console.error("Carousel image failed to load:", slide.image_url, index);
                      handleImageLoad(index);
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Overlay Gradient - Left side for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent z-20 pointer-events-none"></div>

      {/* Content Overlay - Left Side */}
      <div className="absolute inset-0 flex items-center z-30 pointer-events-none">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-8 w-full">
          <div className="max-w-xl space-y-2 sm:space-y-3 md:space-y-4">
            {/* Badge/Tag */}
            <div className="inline-block">
              <span className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-[#D4AF37] uppercase tracking-wider bg-[#D4AF37]/20 backdrop-blur-sm px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-[#D4AF37]/30">
                {currentSlide.subtitle || "HANDCRAFTED EXCELLENCE"}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-lg sm:text-xl md:text-3xl lg:text-4xl font-serif font-light leading-tight tracking-tight text-white">
              {currentSlide.title ? (
                <>
                  {currentSlide.title.split('\n').map((line, idx) => (
                    <React.Fragment key={idx}>
                      {idx === 0 && <span>{line}</span>}
                      {idx > 0 && line.trim() && (
                        <span className="block text-[#D4AF37] font-normal">{line}</span>
                      )}
                    </React.Fragment>
                  ))}
                  {!currentSlide.title.includes('\n') && (
                    <span className="block text-[#D4AF37] font-normal">Collection</span>
                  )}
                </>
              ) : (
                <>
                  Where Elegance
                  <span className="block text-[#D4AF37] font-normal">Meets Soul</span>
                </>
              )}
            </h1>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2 pt-1 sm:pt-2 items-start pointer-events-auto">
              <Link
                href={currentSlide.link_url || "/products"}
                className="inline-block bg-[#D4AF37] hover:bg-[#C19B2E] text-white px-3 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2.5 text-xs sm:text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-center w-fit"
              >
                {currentSlide.link_text || "Shop Collection"}
              </Link>
              <Link
                href="/about"
                className="inline-block border border-white/30 hover:border-white/50 text-white px-3 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2.5 text-xs sm:text-sm font-medium rounded-lg hover:bg-white/10 transition-all duration-300 text-center backdrop-blur-sm w-fit"
              >
                Our Story
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows - Hidden on mobile, shown on desktop */}
      {slides.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full p-2 text-white transition-all duration-300 z-40 shadow-md items-center justify-center"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goToNext}
            className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full p-2 text-white transition-all duration-300 z-40 shadow-md items-center justify-center"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {slides.length > 1 && (
        <div className="absolute bottom-2 sm:bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-40 pointer-events-auto">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-1 sm:h-1.5 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "w-5 sm:w-6 bg-[#D4AF37]"
                  : "w-1 sm:w-1.5 bg-white/50 hover:bg-white/70"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Slide Counter (for multiple slides) */}
      {slides.length > 1 && (
        <div className="absolute top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4 bg-black/30 backdrop-blur-md text-white px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium z-40 pointer-events-none">
          {currentIndex + 1} / {slides.length}
        </div>
      )}
    </div>
  );
}
