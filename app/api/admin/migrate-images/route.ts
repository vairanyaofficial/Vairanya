import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth-server";
import {
  migrateImagesToImageKit,
  shouldMigrateUrl,
  isImageKitUrl,
} from "@/lib/image-migration";

/**
 * API Endpoint to migrate product images to ImageKit
 * 
 * POST /api/admin/migrate-images
 * Body: { productId: string, imageUrls: string[] }
 * 
 * This endpoint migrates existing product images from various sources
 * (imgBB, Pixabay, etc.) to ImageKit.io
 */

export async function POST(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { productId, imageUrls, folder } = body;

    if (!imageUrls || !Array.isArray(imageUrls)) {
      return NextResponse.json(
        { success: false, error: "imageUrls array is required" },
        { status: 400 }
      );
    }

    // Filter URLs that need migration
    const urlsToMigrate = imageUrls.filter(shouldMigrateUrl);

    if (urlsToMigrate.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No images need migration (all are already in ImageKit or local)",
        migratedUrls: imageUrls,
        skipped: imageUrls.length,
      });
    }

    // Migrate images to ImageKit
    const migrationFolder = folder || "/vairanya/products";
    const results = await migrateImagesToImageKit(
      urlsToMigrate,
      migrationFolder
    );

    // Build new image URLs array
    const migratedUrls: string[] = [];
    const errors: string[] = [];

    imageUrls.forEach((originalUrl) => {
      if (isImageKitUrl(originalUrl) || originalUrl.startsWith("/images/")) {
        // Keep ImageKit URLs and local static assets as-is
        migratedUrls.push(originalUrl);
      } else {
        // Find migration result
        const result = results.find((r) => r.originalUrl === originalUrl);
        if (result?.imageKitUrl) {
          migratedUrls.push(result.imageKitUrl);
        } else if (result?.error) {
          errors.push(`${originalUrl}: ${result.error}`);
          // Keep original URL if migration failed (don't break the product)
          migratedUrls.push(originalUrl);
        } else {
          // Shouldn't happen, but keep original just in case
          migratedUrls.push(originalUrl);
        }
      }
    });

    return NextResponse.json({
      success: true,
      migratedUrls,
      migrationResults: results,
      errors: errors.length > 0 ? errors : undefined,
      message: `Migrated ${results.filter((r) => r.imageKitUrl).length} image(s) to ImageKit`,
    });
  } catch (error: any) {
    console.error("Image migration error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to migrate images",
      },
      { status: 500 }
    );
  }
}

