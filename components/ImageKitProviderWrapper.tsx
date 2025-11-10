"use client";

import { ImageKitProvider } from "@imagekit/next";

interface ImageKitProviderWrapperProps {
  children: React.ReactNode;
  urlEndpoint: string;
}

export function ImageKitProviderWrapper({ children, urlEndpoint }: ImageKitProviderWrapperProps) {
  // Use provided urlEndpoint or fallback to default
  // In Next.js, NEXT_PUBLIC_* env vars are embedded at build time
  const imagekitUrlEndpoint = urlEndpoint || process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/zjax0fbrm";

  // Always render provider with endpoint (even if it's fallback)
  // This ensures ImageKit Image component works for ImageKit URLs
  // For non-ImageKit URLs, the OptimizedImage component will use Next.js Image
  return (
    <ImageKitProvider 
      urlEndpoint={imagekitUrlEndpoint}
      transformationPosition="path"
    >
      {children}
    </ImageKitProvider>
  );
}

