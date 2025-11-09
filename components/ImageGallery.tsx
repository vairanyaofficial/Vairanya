"use client";

import React, { useState, useRef, useEffect } from "react";
import { Image } from "@imagekit/next";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ZoomIn, ZoomOut, X, Maximize2 } from "lucide-react";

interface ImageGalleryProps {
  images: string[];
  productTitle: string;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, productTitle }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Ensure we have at least one image
  const displayImages = images.length > 0 ? images : ["/images/ring-1.jpg"];

  // Reset zoom when image changes or modal closes
  useEffect(() => {
    if (!zoomOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [zoomOpen, selectedImage]);

  // Zoom functions
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 5));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const newScale = Math.max(prev - 0.5, 1);
      if (newScale <= 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    const newScale = Math.max(1, Math.min(5, scale + delta));
    setScale(newScale);
    if (newScale <= 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  // Drag to pan
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging && scale > 1) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Optional: Add bounds checking to prevent panning too far
      // This is a simple implementation - you can adjust bounds based on image size
      setPosition({
        x: newX,
        y: newY,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch events for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (scale > 1 && e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isDragging && scale > 1 && e.touches.length === 1) {
      e.preventDefault(); // Prevent scrolling
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <>
      <div className="space-y-3 md:space-y-4">
        {/* Main Image */}
        <div className="relative aspect-square w-full overflow-hidden rounded-lg md:rounded-lg bg-gray-100 dark:bg-[#1a1a1a]">
          <Image
            src={displayImages[selectedImage]}
            alt={`${productTitle} - Image ${selectedImage + 1}`}
            fill
            className="object-cover cursor-zoom-in"
            onClick={() => setZoomOpen(true)}
            priority
            quality={90}
            sizes="(max-width: 768px) 100vw, 50vw"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== "/images/ring-1.jpg") {
                target.src = "/images/ring-1.jpg";
              }
            }}
          />
          <button
            onClick={() => setZoomOpen(true)}
            className="absolute bottom-3 right-3 md:bottom-4 md:right-4 rounded-full bg-white/90 dark:bg-black/90 p-2 shadow-md active:bg-white dark:active:bg-black md:hover:bg-white dark:md:hover:bg-black transition-colors touch-manipulation"
            aria-label="Zoom image"
          >
            <ZoomIn className="h-4 w-4 md:h-5 md:w-5 text-gray-900 dark:text-white" />
          </button>
        </div>

        {/* Thumbnail Gallery - Compact Mobile */}
        {displayImages.length > 1 && (
          <div className="grid grid-cols-4 gap-2 md:gap-4">
            {displayImages.map((img, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`relative aspect-square overflow-hidden rounded-md border-2 transition-all touch-manipulation ${
                  selectedImage === index
                    ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/20"
                    : "border-transparent dark:border-white/10 active:border-gray-300 dark:active:border-white/30 md:hover:border-gray-300 dark:md:hover:border-white/30"
                }`}
              >
                <Image
                  src={img}
                  alt={`${productTitle} thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  quality={75}
                  loading="lazy"
                  sizes="(max-width: 768px) 25vw, 12.5vw"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== "/images/ring-1.jpg") {
                      target.src = "/images/ring-1.jpg";
                    }
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Zoom Modal - Full Screen */}
      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent 
          className="!max-w-[95vw] !max-h-[95vh] !w-[95vw] !h-[95vh] p-0 !bg-black/95 !border-0 !rounded-lg [&>button]:!bg-white/90 [&>button]:hover:!bg-white [&>button]:!text-black"
          showCloseButton={true}
        >
          <DialogTitle className="sr-only">Zoomed view of {productTitle}</DialogTitle>
          
          {/* Zoom Controls */}
          <div className="absolute top-4 right-20 z-50 flex gap-2">
            <button
              onClick={handleZoomOut}
              disabled={scale <= 1}
              className="rounded-full bg-white/90 dark:bg-black/90 hover:bg-white dark:hover:bg-black p-2.5 shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Zoom out"
            >
              <ZoomOut className="h-5 w-5 text-gray-900 dark:text-white" />
            </button>
            <button
              onClick={handleZoomIn}
              disabled={scale >= 5}
              className="rounded-full bg-white/90 dark:bg-black/90 hover:bg-white dark:hover:bg-black p-2.5 shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Zoom in"
            >
              <ZoomIn className="h-5 w-5 text-gray-900 dark:text-white" />
            </button>
            {scale > 1 && (
              <button
                onClick={handleResetZoom}
                className="rounded-full bg-white/90 dark:bg-black/90 hover:bg-white dark:hover:bg-black p-2.5 shadow-lg transition-all"
                aria-label="Reset zoom"
              >
                <Maximize2 className="h-5 w-5 text-gray-900 dark:text-white" />
              </button>
            )}
          </div>

          {/* Image Container with Zoom and Pan */}
          <div
            ref={containerRef}
            className="relative w-full h-full flex items-center justify-center overflow-hidden"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
          >
            <div
              ref={imageRef}
              className="relative flex items-center justify-center"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
              }}
            >
              <img
                src={displayImages[selectedImage]}
                alt={`${productTitle} - Zoomed`}
                className="max-w-none select-none"
                style={{ 
                  maxWidth: scale === 1 ? '90vw' : 'none',
                  maxHeight: scale === 1 ? '90vh' : 'none',
                  width: 'auto',
                  height: 'auto',
                  display: 'block',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== "/images/ring-1.jpg") {
                    target.src = "/images/ring-1.jpg";
                  }
                }}
                draggable={false}
              />
            </div>
          </div>

          {/* Navigation Arrows */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={() => {
                  setSelectedImage((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
                  handleResetZoom();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 dark:bg-black/90 hover:bg-white dark:hover:bg-black p-3 shadow-lg z-50 transition-all"
                aria-label="Previous image"
              >
                <svg
                  className="h-6 w-6 text-gray-900 dark:text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={() => {
                  setSelectedImage((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
                  handleResetZoom();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 dark:bg-black/90 hover:bg-white dark:hover:bg-black p-3 shadow-lg z-50 transition-all"
                aria-label="Next image"
              >
                <svg
                  className="h-6 w-6 text-gray-900 dark:text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          )}

          {/* Zoom Level Indicator */}
          {scale > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-black/90 px-4 py-2 rounded-full shadow-lg text-sm font-medium z-50 text-gray-900 dark:text-white">
              {Math.round(scale * 100)}%
            </div>
          )}

          {/* Image Counter */}
          {displayImages.length > 1 && (
            <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-black/90 px-4 py-2 rounded-full shadow-lg text-sm font-medium z-50 text-gray-900 dark:text-white">
              {selectedImage + 1} / {displayImages.length}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageGallery;

