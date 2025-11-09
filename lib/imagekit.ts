/**
 * ImageKit.io integration utility
 * Handles image uploads to ImageKit.io CDN using the Next.js ImageKit SDK
 */

import {
  ImageKitAbortError,
  ImageKitInvalidRequestError,
  ImageKitServerError,
  ImageKitUploadNetworkError,
  upload,
  type UploadResponse,
} from "@imagekit/next";

export interface ImageKitUploadResponse {
  fileId: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  height: number;
  width: number;
  size: number;
  filePath: string;
  fileType: string;
}

export interface ImageKitUploadError {
  message: string;
  help?: string;
}

/**
 * Authenticates and retrieves the necessary upload credentials from the server.
 * This is a client-side helper function that calls the upload-auth API endpoint.
 * 
 * @param adminSession - Optional admin session with username and role. If not provided, will try to get from getAdminSession.
 */
async function getUploadAuthParams(adminSession?: { username: string; role: string } | null): Promise<{
  signature: string;
  expire: number;
  token: string;
  publicKey: string;
}> {
  try {
    // Try to get admin session if not provided
    let session = adminSession;
    if (!session) {
      // Dynamic import to avoid SSR issues
      const { getAdminSession } = await import("@/lib/admin-auth");
      session = getAdminSession();
    }

    if (!session) {
      throw new Error("Admin session required for image upload");
    }

    // Include admin authentication headers
    const response = await fetch("/api/upload-auth", {
      headers: {
        "x-admin-username": session.username,
        "x-admin-role": session.role || "admin",
      },
    });

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // If JSON parsing fails, try to get text
        try {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        } catch {
          // If text parsing also fails, use default message
        }
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const { signature, expire, token, publicKey } = data;
    return { signature, expire, token, publicKey };
  } catch (error) {
    console.error("Authentication error:", error);
    const errorMessage = error instanceof Error ? error.message : "Authentication request failed";
    throw new Error(errorMessage);
  }
}

/**
 * Upload image to ImageKit.io using the Next.js SDK
 * @param file - File to upload
 * @param fileName - Optional custom file name
 * @param onProgress - Optional progress callback (0-100)
 * @param abortSignal - Optional AbortSignal to cancel the upload
 * @param adminSession - Optional admin session. If not provided, will try to get from getAdminSession.
 * @param folder - Optional folder path where the file will be stored (e.g., "products", "carousel"). If not provided, files are uploaded to root.
 * @returns Promise with ImageKit URL
 */
export async function uploadToImageKit(
  file: File,
  fileName?: string,
  onProgress?: (progress: number) => void,
  abortSignal?: AbortSignal,
  adminSession?: { username: string; role: string } | null,
  folder?: string
): Promise<string> {
  try {
    // Get authentication parameters (will get admin session internally if not provided)
    const authParams = await getUploadAuthParams(adminSession);
    const { signature, expire, token, publicKey } = authParams;

    // Prepare upload options
    const uploadOptions: any = {
      // Authentication parameters
      expire,
      token,
      signature,
      publicKey,
      file,
      fileName: fileName || file.name,
      // Progress callback
      onProgress: onProgress
        ? (event: { loaded: number; total: number }) => {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        : undefined,
      // Abort signal (optional)
      abortSignal: abortSignal,
      // Use unique file names by default
      useUniqueFileName: true,
    };

    // Add folder if specified
    if (folder && folder.trim() !== "") {
      // Clean folder path: remove leading/trailing slashes and ensure proper format
      const cleanFolder = folder.replace(/^\/+|\/+$/g, "").trim();
      if (cleanFolder) {
        uploadOptions.folder = cleanFolder;
      }
    }

    // Upload file using ImageKit SDK
    const uploadResponse: UploadResponse = await upload(uploadOptions);

    if (!uploadResponse.url) {
      throw new Error("ImageKit upload failed: No URL returned");
    }

    return uploadResponse.url;
  } catch (error) {
    // Handle specific error types provided by the ImageKit SDK
    if (error instanceof ImageKitAbortError) {
      throw new Error(`Upload aborted: ${error.reason}`);
    } else if (error instanceof ImageKitInvalidRequestError) {
      throw new Error(`Invalid request: ${error.message}`);
    } else if (error instanceof ImageKitUploadNetworkError) {
      throw new Error(`Network error: ${error.message}`);
    } else if (error instanceof ImageKitServerError) {
      throw new Error(`Server error: ${error.message}`);
    } else {
      // Handle any other errors
      const errorMessage = error instanceof Error ? error.message : "Unknown upload error";
      throw new Error(`Failed to upload image to ImageKit.io: ${errorMessage}`);
    }
  }
}

/**
 * Upload image with progress tracking using the Next.js SDK
 * @param file - File to upload
 * @param onProgress - Progress callback (0-100)
 * @param fileName - Optional custom file name
 * @param folder - Optional folder path where the file will be stored
 * @returns Promise with ImageKit URL
 */
export function uploadToImageKitWithProgress(
  file: File,
  onProgress?: (progress: number) => void,
  fileName?: string,
  folder?: string
): Promise<string> {
  return uploadToImageKit(file, fileName, onProgress, undefined, undefined, folder);
}

