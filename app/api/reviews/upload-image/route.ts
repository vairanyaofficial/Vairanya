import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import path from "path";
import fs from "fs/promises";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { success: false, error: "Please login to upload images" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (5MB)
    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Image size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Save to public/uploads/reviews folder
    const uploadDir = path.join(process.cwd(), "public", "uploads", "reviews");
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `review_${timestamp}_${safeName}`;
    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, buffer);
    const imageUrl = `/uploads/reviews/${filename}`;

    return NextResponse.json(
      { success: true, url: imageUrl },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error uploading review image:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to upload image" },
      { status: 500 }
    );
  }
}

