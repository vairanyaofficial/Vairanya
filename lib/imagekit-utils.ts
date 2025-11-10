/**
 * ImageKit image optimization utilities
 * Provides helper functions to optimize image URLs with ImageKit transformations
 */

/**
 * Check if a URL is an ImageKit URL
 */
export function isImageKitUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.includes('imagekit.io') || url.includes('ik.imagekit.io');
}

/**
 * Check if a URL is a local/static asset
 */
export function isLocalAsset(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('/') && !url.startsWith('//');
}

/**
 * Get optimized image URL with ImageKit transformations
 * 
 * @param src - Original image URL
 * @param options - Transformation options
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(
  src: string | undefined | null,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
    fit?: 'contain' | 'cover' | 'fill' | 'inside' | 'outside';
    aspectRatio?: string;
  } = {}
): string {
  // Fallback to default image if no src provided
  if (!src) {
    return '/images/ring-1.jpg';
  }

  // Return local assets as-is (they'll be served by Next.js)
  if (isLocalAsset(src)) {
    return src;
  }

  // For ImageKit URLs, the Image component from @imagekit/next will automatically
  // apply transformations based on the props passed to it
  // However, we can pre-process the URL if needed for server-side rendering
  
  // If it's already an ImageKit URL, return it as-is
  // The ImageKit Image component will handle transformations
  if (isImageKitUrl(src)) {
    return src;
  }

  // For external URLs (not ImageKit), try to proxy through ImageKit if configured
  // Otherwise, return as-is and let Next.js Image optimization handle it
  return src;
}

/**
 * Get default fallback image URL
 */
export function getFallbackImageUrl(): string {
  return '/images/ring-1.jpg';
}

/**
 * Check if an image URL is valid and not empty
 */
export function isValidImageUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') return false;
  
  const cleanUrl = url.trim();
  
  // Empty strings are invalid
  if (cleanUrl === '') return false;
  
  // Check for common invalid patterns
  if (
    cleanUrl === 'undefined' ||
    cleanUrl === 'null' ||
    cleanUrl === 'NaN' ||
    cleanUrl.toLowerCase() === 'none' ||
    cleanUrl.startsWith('data:') // Skip data URIs for now
  ) {
    return false;
  }
  
  // Valid URLs must start with http://, https://, or /
  // Or be ImageKit URLs
  if (
    cleanUrl.startsWith('http://') ||
    cleanUrl.startsWith('https://') ||
    cleanUrl.startsWith('/') ||
    isImageKitUrl(cleanUrl)
  ) {
    return true;
  }
  
  // Relative paths without protocol might be valid if they look like file paths
  if (!cleanUrl.includes('://') && !cleanUrl.startsWith('/')) {
    // Check if it looks like a valid file path
    const validPathPattern = /^[a-zA-Z0-9_\-./]+\.(jpg|jpeg|png|gif|webp|avif|svg)$/i;
    if (validPathPattern.test(cleanUrl)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Validate image URL and return a valid URL or fallback
 */
export function validateImageUrl(url: string | undefined | null): string {
  if (!isValidImageUrl(url)) {
    return getFallbackImageUrl();
  }
  
  // Clean up the URL
  const cleanUrl = url!.trim();
  
  // Return valid URLs (http, https, or absolute paths starting with /)
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('/')) {
    return cleanUrl;
  }
  
  // If it's a relative path without leading slash, add it
  if (!cleanUrl.includes('://') && !cleanUrl.startsWith('/')) {
    return `/${cleanUrl}`;
  }
  
  // Default fallback for invalid URLs
  return getFallbackImageUrl();
}

/**
 * Filter and validate an array of image URLs
 * Returns only valid image URLs, filtering out invalid/empty ones
 */
export function filterValidImageUrls(urls: (string | undefined | null)[]): string[] {
  if (!Array.isArray(urls)) return [];
  
  const validUrls: string[] = [];
  const seenUrls = new Set<string>();
  
  for (const url of urls) {
    if (isValidImageUrl(url)) {
      const validatedUrl = validateImageUrl(url);
      // Avoid duplicates
      if (!seenUrls.has(validatedUrl)) {
        seenUrls.add(validatedUrl);
        validUrls.push(validatedUrl);
      }
    }
  }
  
  return validUrls;
}

/**
 * Get ImageKit transformation parameters for the Image component
 * These are passed as props to the ImageKit Image component
 */
export function getImageKitTransformations(options: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  fit?: 'contain' | 'cover' | 'fill' | 'inside' | 'outside';
} = {}): {
  transformation?: Array<{
    height?: number;
    width?: number;
    quality?: number;
    format?: string;
    fit?: string;
  }>;
} {
  const transformations: any = {};
  
  if (options.width) transformations.width = options.width;
  if (options.height) transformations.height = options.height;
  if (options.quality) transformations.quality = options.quality;
  if (options.format && options.format !== 'auto') transformations.format = options.format;
  if (options.fit) transformations.fit = options.fit;
  
  // Only return transformation object if we have at least one transformation
  if (Object.keys(transformations).length > 0) {
    return {
      transformation: [transformations]
    };
  }
  
  return {};
}

