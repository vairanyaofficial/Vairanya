import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth-server";
import {
  getCarouselSlides,
  createCarouselSlide,
  updateCarouselSlide,
  deleteCarouselSlide,
  reorderCarouselSlides,
} from "@/lib/carousel-mongodb";
import type { CarouselSlide } from "@/lib/carousel-types";
import { initializeMongoDB } from "@/lib/mongodb.server";

// GET - Get all carousel slides (admin)
export async function GET(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 503 }
      );
    }
    const slides = await getCarouselSlides(false); // Get all slides, not just active
    return NextResponse.json({ success: true, slides }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch carousel slides" },
      { status: 500 }
    );
  }
}

// POST - Create new carousel slide
export async function POST(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Initialize MongoDB connection
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { image_url, title, subtitle, link_url, link_text, order, is_active } = body;

    if (!image_url) {
      return NextResponse.json(
        { success: false, error: "Image URL is required" },
        { status: 400 }
      );
    }

    // Get current max order to set default
    const existingSlides = await getCarouselSlides(false);
    const maxOrder = existingSlides.length > 0
      ? Math.max(...existingSlides.map(s => s.order))
      : -1;

    const slideData = {
      image_url,
      title: title || "",
      subtitle: subtitle || "",
      link_url: link_url || "",
      link_text: link_text || "",
      order: order !== undefined ? order : maxOrder + 1,
      is_active: is_active !== undefined ? is_active : true,
    };

    const newSlide = await createCarouselSlide(slideData);
    return NextResponse.json({ success: true, slide: newSlide }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating carousel slide:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create carousel slide" },
      { status: 500 }
    );
  }
}

// PUT - Update carousel slide order
export async function PUT(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Initialize MongoDB connection
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { action, slide_id, updates, slide_orders } = body;

    if (action === "reorder" && slide_orders) {
      await reorderCarouselSlides(slide_orders);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (action === "update" && slide_id && updates) {
      const updatedSlide = await updateCarouselSlide(slide_id, updates);
      return NextResponse.json({ success: true, slide: updatedSlide }, { status: 200 });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action or missing parameters" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error updating carousel:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update carousel" },
      { status: 500 }
    );
  }
}

// DELETE - Delete carousel slide
export async function DELETE(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Initialize MongoDB connection
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const slideId = searchParams.get("id");

    if (!slideId) {
      return NextResponse.json(
        { success: false, error: "Slide ID is required" },
        { status: 400 }
      );
    }

    await deleteCarouselSlide(slideId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting carousel slide:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete carousel slide" },
      { status: 500 }
    );
  }
}

