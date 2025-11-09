/**
 * ImageKit.io server-side utility functions
 * Handles image deletion and folder management on the server side
 */

import "server-only";
import ImageKit from "imagekit";

/**
 * Initialize ImageKit SDK for server-side operations
 */
function getImageKitInstance() {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

  if (!privateKey || !publicKey || !urlEndpoint) {
    throw new Error("ImageKit credentials are not configured");
  }

  return new ImageKit({
    publicKey: publicKey.trim(),
    privateKey: privateKey.trim(),
    urlEndpoint: urlEndpoint.trim(),
  });
}

/**
 * Delete all images in a specific folder from ImageKit
 * @param folderPath - The folder path to delete (e.g., "products/gold-ring-001")
 * @returns Promise<void>
 */
export async function deleteFolderImages(folderPath: string): Promise<void> {
  try {
    const imagekit = getImageKitInstance();

    // Clean folder path: remove leading/trailing slashes
    const cleanFolder = folderPath.replace(/^\/+|\/+$/g, "").trim();
    
    if (!cleanFolder) {
      throw new Error("Invalid folder path");
    }

    // List all files in the folder
    // ImageKit folder paths should end with / and the path should match the folder structure
    // Format: "products/gold-ring-001/" (with trailing slash)
    const folderPathWithSlash = cleanFolder.endsWith("/") ? cleanFolder : `${cleanFolder}/`;
    
    let files: any[] = [];
    let skip = 0;
    const limit = 100; // ImageKit API limit per request
    let hasMore = true;

    // ImageKit listFiles API - search files by path (folder)
    while (hasMore) {
      try {
        const response = await imagekit.listFiles({
          path: folderPathWithSlash,
          skip: skip,
          limit: limit,
        });

        // ImageKit SDK returns an array directly
        if (response && Array.isArray(response)) {
          if (response.length > 0) {
            files = [...files, ...response];
            skip += response.length;
            
            // If we got fewer files than the limit, we've reached the end
            if (response.length < limit) {
              hasMore = false;
            }
          } else {
            // Empty response means no more files
            hasMore = false;
          }
        } else {
          // Unexpected response format
          hasMore = false;
        }
      } catch (listError: any) {
        // If folder doesn't exist or is empty, that's okay - just return
        const errorMessage = (listError?.message || "").toLowerCase();
        const errorCode = listError?.response?.status || listError?.statusCode;
        
        if (
          errorCode === 404 ||
          errorMessage.includes("not found") ||
          errorMessage.includes("no files") ||
          errorMessage.includes("empty")
        ) {
          return;
        }
        // Don't throw - folder might not exist or be empty
        return;
      }
    }

    if (files.length === 0) {
      return;
    }

    // Delete all files by their fileId
    // Filter out folders - only delete files (files have fileId property, folders don't)
    const fileObjects = files.filter((f: any): f is { fileId: string; [key: string]: any } => {
      return typeof f === 'object' && f !== null && 'fileId' in f && typeof f.fileId === 'string';
    });
    
    const deletePromises = fileObjects.map(async (file) => {
      try {
        await imagekit.deleteFile(file.fileId);
      } catch (deleteError: any) {
        // Continue deleting other files even if one fails
        // Don't throw - continue with other files
      }
    });

    await Promise.all(deletePromises);
  } catch (error: any) {
    // Don't throw - we don't want to prevent product deletion if image deletion fails
    // Silently fail - image deletion errors should not block product deletion
  }
}

/**
 * Delete specific images by their URLs from ImageKit
 * @param imageUrls - Array of image URLs to delete
 * @returns Promise<void>
 */
export async function deleteImagesByUrls(imageUrls: string[]): Promise<void> {
  try {
    const imagekit = getImageKitInstance();

    if (!imageUrls || imageUrls.length === 0) {
      return;
    }

    // Extract file paths from ImageKit URLs and find their fileIds
    const deletePromises = imageUrls.map(async (url) => {
      if (!url || typeof url !== "string" || !url.includes("imagekit.io")) {
        return; // Skip non-ImageKit URLs
      }

      try {
        // Extract file path from ImageKit URL
        // Format: https://ik.imagekit.io/your_id/products/slug/image.jpg
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split("/").filter(Boolean);
        
        if (pathParts.length < 2) {
          return;
        }

        // Remove the first part (imagekit ID) to get the file path
        const filePath = pathParts.slice(1).join("/");
        
        if (!filePath) {
          return;
        }

        // Try to find the file by searching for files with this path
        // ImageKit allows searching by filePath
        try {
          const files = await imagekit.listFiles({
            path: filePath,
            limit: 10, // Should only be one file, but allow a few
          });

          if (files && Array.isArray(files) && files.length > 0) {
            // Filter out folders and only work with files
            // Type guard to ensure we only have file objects with fileId
            type ImageKitFile = { fileId: string; filePath?: string; url?: string; [key: string]: any };
            const fileObjects = files.filter((f: any): f is ImageKitFile => {
              return typeof f === 'object' && f !== null && 'fileId' in f && typeof f.fileId === 'string';
            }) as ImageKitFile[];
            
            if (fileObjects.length > 0) {
              // Find the exact matching file
              const matchingFile = fileObjects.find((f: ImageKitFile) => 
                (f.filePath && f.filePath === filePath) || 
                (f.url && f.url === url) ||
                (f.filePath && f.filePath.endsWith(filePath)) ||
                (f.url && f.url.includes(filePath))
              );

              if (matchingFile && matchingFile.fileId) {
                await imagekit.deleteFile(matchingFile.fileId);
              } else if (fileObjects[0] && fileObjects[0].fileId) {
                // If exact match not found, try the first result
                await imagekit.deleteFile(fileObjects[0].fileId);
              }
            }
          }
        } catch (searchError: any) {
          // Continue with other files
        }
      } catch (urlError: any) {
        // Continue with other URLs
      }
    });

    await Promise.all(deletePromises);
  } catch (error: any) {
    // Don't throw - continue even if image deletion fails
    // Silently fail - image deletion errors should not block operations
  }
}

/**
 * Delete product images from ImageKit when a product is deleted
 * @param productSlug - The product slug (folder name)
 * @param imageUrls - Optional array of image URLs to delete (fallback method)
 * @returns Promise<void>
 */
export async function deleteProductImages(
  productSlug: string,
  imageUrls?: string[]
): Promise<void> {
  try {
    const folderPath = `products/${productSlug}`;
    
    // First, try to delete by folder (more efficient)
    await deleteFolderImages(folderPath);

    // If imageUrls are provided, also try to delete them individually
    // This ensures we catch any images that might not be in the folder
    if (imageUrls && imageUrls.length > 0) {
      await deleteImagesByUrls(imageUrls);
    }
  } catch (error: any) {
    // Don't throw - we don't want to prevent product deletion
    // Silently fail - image deletion errors should not block product deletion
  }
}

