/**
 * Image Migration Utility
 * Helps migrate existing product images from various sources to ImageKit.io
 */

import ImageKit from "imagekit";

interface ImageMigrationResult {
  originalUrl: string;
  imageKitUrl: string | null;
  error: string | null;
}

/**
 * Initialize ImageKit client
 */
function getImageKitClient(): ImageKit {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

  if (!privateKey || !publicKey || !urlEndpoint) {
    throw new Error(
      "ImageKit credentials not configured. Please set IMAGEKIT_PRIVATE_KEY, NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY, and NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT"
    );
  }

  return new ImageKit({
    publicKey,
    privateKey,
    urlEndpoint,
  });
}

/**
 * Check if URL is already from ImageKit
 */
export function isImageKitUrl(url: string): boolean {
  return url.includes("imagekit.io") || url.includes("ik.imagekit.io");
}

/**
 * Check if URL should be migrated (not ImageKit, not local static assets)
 */
export function shouldMigrateUrl(url: string): boolean {
  // Skip if already ImageKit
  if (isImageKitUrl(url)) {
    return false;
  }

  // Skip local static assets
  if (url.startsWith("/images/")) {
    return false;
  }

  // Skip if it's a data URL or blob
  if (url.startsWith("data:") || url.startsWith("blob:")) {
    return false;
  }

  // Migrate external URLs (imgBB, Pixabay, Firebase, etc.)
  return url.startsWith("http");
}

/**
 * Upload image from URL to ImageKit
 * @param imageUrl - URL of the image to upload
 * @param folder - Folder path in ImageKit (default: /vairanya/products)
 * @param fileName - Optional custom file name
 */
export async function migrateImageToImageKit(
  imageUrl: string,
  folder: string = "/vairanya/products",
  fileName?: string
): Promise<string> {
  try {
    const imagekit = getImageKitClient();

    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Get file extension from URL or content-type
    const contentType = response.headers.get("content-type") || "image/jpeg";
    let extension = "jpg";
    if (contentType.includes("png")) extension = "png";
    else if (contentType.includes("webp")) extension = "webp";
    else if (contentType.includes("gif")) extension = "gif";

    // Generate file name
    const timestamp = Date.now();
    const finalFileName =
      fileName || `${timestamp}_migrated_image.${extension}`;

    // Upload to ImageKit
    const uploadData = await imagekit.upload({
      file: fileBuffer,
      fileName: finalFileName,
      useUniqueFileName: true,
      folder: folder,
    });

    return uploadData.url;
  } catch (error: any) {
    throw new Error(
      `Failed to migrate image to ImageKit: ${error.message}`
    );
  }
}

/**
 * Migrate multiple images to ImageKit
 * @param imageUrls - Array of image URLs to migrate
 * @param folder - Folder path in ImageKit
 * @returns Array of migration results
 */
export async function migrateImagesToImageKit(
  imageUrls: string[],
  folder: string = "/vairanya/products"
): Promise<ImageMigrationResult[]> {
  const results: ImageMigrationResult[] = [];

  for (const url of imageUrls) {
    try {
      if (!shouldMigrateUrl(url)) {
        results.push({
          originalUrl: url,
          imageKitUrl: url, // Keep as-is if shouldn't migrate
          error: null,
        });
        continue;
      }

      const imageKitUrl = await migrateImageToImageKit(url, folder);
      results.push({
        originalUrl: url,
        imageKitUrl,
        error: null,
      });
    } catch (error: any) {
      results.push({
        originalUrl: url,
        imageKitUrl: null,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Filter product images to only include ImageKit URLs
 * Removes non-ImageKit URLs and local /uploads/ URLs
 */
export function filterImageKitUrls(images: string[]): string[] {
  return images.filter((img) => {
    // Keep ImageKit URLs
    if (isImageKitUrl(img)) {
      return true;
    }

    // Keep local static assets
    if (img.startsWith("/images/")) {
      return true;
    }

    // Remove everything else (imgBB, Pixabay, /uploads/, etc.)
    return false;
  });
}

