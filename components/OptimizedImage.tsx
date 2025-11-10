"use client";

import React, { useState, useEffect } from "react";
import { Image as ImageKitImage } from "@imagekit/next";
import NextImage from "next/image";
import { isImageKitUrl, isLocalAsset, getFallbackImageUrl } from "@/lib/imagekit-utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  quality?: number;
  priority?: boolean;
  loading?: "lazy" | "eager";
  transformation?: Array<{
    format?: string;
    quality?: number;
    width?: number;
    height?: number;
    [key: string]: any;
  }>;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  onClick?: () => void;
  style?: React.CSSProperties;
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  [key: string]: any; // Allow other props
}

/**
 * Smart Image component that intelligently chooses between ImageKit and Next.js Image
 * - Uses Next.js Image for local assets (always reliable)
 * - Uses ImageKit Image for ImageKit URLs (with fallback to Next.js Image)
 * - Uses Next.js Image for other external URLs
 * 
 * This ensures images work correctly in both development and production
 */
export function OptimizedImage({
  src,
  alt,
  fill,
  width,
  height,
  className = "",
  sizes,
  quality = 85,
  priority = false,
  loading,
  transformation,
  onError,
  onClick,
  style,
  objectFit = "cover",
  ...otherProps
}: OptimizedImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [shouldUseImageKit, setShouldUseImageKit] = useState(false);
  const fallbackUrl = getFallbackImageUrl();

  // Update currentSrc when src prop changes
  useEffect(() => {
    setCurrentSrc(src);
    setShouldUseImageKit(false);
  }, [src]);

  // Determine which Image component to use
  const isImageKit = isImageKitUrl(currentSrc);
  const isLocal = isLocalAsset(currentSrc);

  // Only use ImageKit Image for ImageKit URLs (not local assets)
  // In production, if ImageKit provider fails, we'll fall back to Next.js Image via error handling
  useEffect(() => {
    if (isImageKit && !isLocal && typeof window !== 'undefined') {
      setShouldUseImageKit(true);
    } else {
      setShouldUseImageKit(false);
    }
  }, [isImageKit, isLocal]);

  // Handle image error - fall back to Next.js Image or fallback URL
  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    
    // If using ImageKit and it fails, switch to Next.js Image with the same URL
    if (shouldUseImageKit) {
      setShouldUseImageKit(false);
      // Don't change currentSrc - let Next.js Image try to load it
      return;
    }
    
    // If Next.js Image also fails and we're not using fallback, switch to fallback
    if (!target.src.includes('ring-1.jpg') && currentSrc !== fallbackUrl) {
      setCurrentSrc(fallbackUrl);
      setShouldUseImageKit(false);
    }
    
    // Call custom error handler if provided
    if (onError) {
      onError(e);
    }
  };

  // Prepare common props
  const commonProps = {
    src: currentSrc,
    alt,
    className: className || '',
    quality,
    priority,
    onClick,
    style: style || {},
    ...otherProps,
  };

  // Use ImageKit Image for ImageKit URLs (when provider is available)
  if (shouldUseImageKit && isImageKit && !isLocal) {
    const imageKitProps: any = {
      src: currentSrc,
      alt,
      className: className || '',
      quality,
      priority,
      onClick,
      style: style || {},
      onError: handleError,
      ...otherProps,
    };

    // ImageKit Image props - either fill or width/height, not both
    if (fill) {
      imageKitProps.fill = true;
      imageKitProps.sizes = sizes || "(max-width: 768px) 100vw, 50vw";
    } else {
      imageKitProps.width = width || 800;
      imageKitProps.height = height || 800;
    }

    if (loading) {
      imageKitProps.loading = loading;
    } else if (!priority) {
      imageKitProps.loading = "lazy";
    }

    if (transformation) {
      imageKitProps.transformation = transformation;
    }

    // Handle object-fit for ImageKit Image
    if (objectFit && fill) {
      const objectFitClass = `object-${objectFit}`;
      if (!imageKitProps.className.includes(objectFitClass)) {
        imageKitProps.className = `${imageKitProps.className} ${objectFitClass}`.trim();
      }
    }

    // Wrap in error boundary-like component
    // If ImageKit Image fails to render, it will trigger onError which switches to Next.js Image
    return <ImageKitImage {...imageKitProps} />;
  }

  // Use Next.js Image for local assets, external URLs, and as fallback
  // Next.js Image handles local images and external images configured in next.config.mjs
  const nextImageProps: any = {
    ...commonProps,
    onError: handleError,
  };

  if (fill) {
    nextImageProps.fill = true;
    nextImageProps.sizes = sizes || "(max-width: 768px) 100vw, 50vw";
  } else {
    nextImageProps.width = width || 800;
    nextImageProps.height = height || 800;
  }

  if (loading) {
    nextImageProps.loading = loading;
  }

  // Handle object-fit - Next.js Image uses className for object-fit when using fill
  if (objectFit) {
    const objectFitClass = `object-${objectFit}`;
    if (fill) {
      // For fill, ensure object-fit class is present
      if (!nextImageProps.className.includes(objectFitClass)) {
        nextImageProps.className = `${nextImageProps.className} ${objectFitClass}`.trim();
      }
    } else {
      // For fixed size, use inline style
      nextImageProps.style = { ...nextImageProps.style, objectFit };
    }
  }

  // Remove transformation prop for Next.js Image (it doesn't understand it)
  delete nextImageProps.transformation;

  return <NextImage {...nextImageProps} />;
}

