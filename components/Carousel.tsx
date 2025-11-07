"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CarouselSlide } from "@/lib/carousel-types";

interface CarouselProps {
  slides: CarouselSlide[];
  autoPlay?: boolean;
  interval?: number;
}

export default function Carousel({ slides, autoPlay = true, interval = 5000 }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!autoPlay || isPaused || slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, slides.length, isPaused]);

  // Reset to first slide when slides change
  useEffect(() => {
    if (slides.length > 0 && currentIndex >= slides.length) {
      setCurrentIndex(0);
    }
  }, [slides.length, currentIndex]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  if (!slides || slides.length === 0) {
    return null;
  }

  const currentSlide = slides[currentIndex];

  return (
    <div
      className="relative w-full h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden rounded-2xl shadow-2xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slide Image with Transition */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentIndex ? "opacity-100 z-0" : "opacity-0 z-[-1]"
            }`}
          >
            <Image
              src={slide.image_url}
              alt={slide.title || "Carousel slide"}
              fill
              className="object-cover"
              priority={index === 0}
              sizes="100vw"
              unoptimized={slide.image_url?.startsWith("http")}
              onError={(e) => {
                console.error("Carousel image failed to load:", slide.image_url);
              }}
            />
          </div>
        ))}
        
        {/* Overlay Gradient - Left side for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent z-0"></div>

        {/* Content Overlay - Left Side */}
        <div className="absolute inset-0 flex items-center z-10">
          <div className="max-w-7xl mx-auto px-6 md:px-12 w-full">
            <div className="max-w-2xl space-y-6 lg:space-y-8">
              {/* Badge/Tag */}
              <div className="inline-block">
                <span className="text-xs md:text-sm font-semibold text-[#D4AF37] uppercase tracking-wider bg-[#D4AF37]/20 backdrop-blur-sm px-4 py-2 rounded-full border border-[#D4AF37]/30">
                  {currentSlide.subtitle || "HANDCRAFTED EXCELLENCE"}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-light leading-tight tracking-tight text-white">
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
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-4 items-start">
                <Link
                  href={currentSlide.link_url || "/collection"}
                  className="inline-block bg-[#D4AF37] hover:bg-[#C19B2E] text-white px-3 py-1.5 sm:px-6 sm:py-4 md:px-8 md:py-6 text-xs sm:text-base font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-center w-fit"
                >
                  {currentSlide.link_text || "Shop Collection"}
                </Link>
                <Link
                  href="/about"
                  className="inline-block border-2 border-white/30 hover:border-white/50 text-white px-3 py-1.5 sm:px-6 sm:py-4 md:px-8 md:py-6 text-xs sm:text-base font-medium rounded-lg hover:bg-white/10 transition-all duration-300 text-center backdrop-blur-sm w-fit"
                >
                  Our Story
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full p-3 text-white transition-all duration-300 z-20 shadow-lg"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full p-3 text-white transition-all duration-300 z-20 shadow-lg"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "w-8 bg-[#D4AF37]"
                  : "w-2 bg-white/50 hover:bg-white/70"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Slide Counter (for multiple slides) */}
      {slides.length > 1 && (
        <div className="absolute top-6 right-6 bg-black/30 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium z-20">
          {currentIndex + 1} / {slides.length}
        </div>
      )}
    </div>
  );
}

