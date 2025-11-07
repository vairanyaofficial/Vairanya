"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ZoomIn, X } from "lucide-react";

interface ImageGalleryProps {
  images: string[];
  productTitle: string;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, productTitle }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  // Ensure we have at least one image
  const displayImages = images.length > 0 ? images : ["/images/ring-1.jpg"];

  return (
    <>
      <div className="space-y-4">
        {/* Main Image */}
        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
          <Image
            src={displayImages[selectedImage]}
            alt={`${productTitle} - Image ${selectedImage + 1}`}
            fill
            className="object-cover cursor-zoom-in"
            onClick={() => setZoomOpen(true)}
            priority
            unoptimized={displayImages[selectedImage]?.startsWith("http")}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== "/images/ring-1.jpg") {
                target.src = "/images/ring-1.jpg";
              }
            }}
          />
          <button
            onClick={() => setZoomOpen(true)}
            className="absolute bottom-4 right-4 rounded-full bg-white/80 p-2 shadow-md hover:bg-white transition-colors"
            aria-label="Zoom image"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
        </div>

        {/* Thumbnail Gallery */}
        {displayImages.length > 1 && (
          <div className="grid grid-cols-4 gap-4">
            {displayImages.map((img, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`relative aspect-square overflow-hidden rounded-md border-2 transition-all ${
                  selectedImage === index
                    ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/20"
                    : "border-transparent hover:border-gray-300"
                }`}
              >
                <Image
                  src={img}
                  alt={`${productTitle} thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  unoptimized={img?.startsWith("http")}
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

      {/* Zoom Modal */}
      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-w-4xl p-0">
          <DialogTitle className="sr-only">Zoomed view of {productTitle}</DialogTitle>
          <div className="relative aspect-square w-full">
            <Image
              src={displayImages[selectedImage]}
              alt={`${productTitle} - Zoomed`}
              fill
              className="object-contain"
              unoptimized={displayImages[selectedImage]?.startsWith("http")}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src !== "/images/ring-1.jpg") {
                  target.src = "/images/ring-1.jpg";
                }
              }}
            />
            {displayImages.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setSelectedImage((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1))
                  }
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg hover:bg-white"
                  aria-label="Previous image"
                >
                  <svg
                    className="h-6 w-6"
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
                  onClick={() =>
                    setSelectedImage((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1))
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg hover:bg-white"
                  aria-label="Next image"
                >
                  <svg
                    className="h-6 w-6"
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
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageGallery;

