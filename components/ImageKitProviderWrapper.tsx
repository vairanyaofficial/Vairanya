"use client";

import { ImageKitProvider } from "@imagekit/next";

interface ImageKitProviderWrapperProps {
  children: React.ReactNode;
  urlEndpoint: string;
}

export function ImageKitProviderWrapper({ children, urlEndpoint }: ImageKitProviderWrapperProps) {
  // Use provided credentials or fallback to defaults
  const imagekitUrlEndpoint = urlEndpoint || "https://ik.imagekit.io/zjax0fbrm";

  // Only render provider if urlEndpoint is provided
  if (!imagekitUrlEndpoint) {
    return <>{children}</>;
  }

  return (
    <ImageKitProvider 
      urlEndpoint={imagekitUrlEndpoint}
      transformationPosition="path"
    >
      {children}
    </ImageKitProvider>
  );
}

