// app/api/admin/collections/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getAllCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  getCollectionById,
} from "@/lib/collections-firestore";
import { requireAdmin } from "@/lib/admin-auth-server";
import type { Collection } from "@/lib/collections-types";

// GET - Fetch all collections
export async function GET(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const collections = await getAllCollections();
    
    return NextResponse.json({
      success: true,
      collections,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch collections",
        message: String(error?.message || error),
      },
      { status: 500 }
    );
  }
}

// POST - Create new collection
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
    const {
      name,
      description,
      short_description,
      image,
      product_ids,
      is_featured,
      is_active,
      slug,
      display_order,
    } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: "Name and slug are required" },
        { status: 400 }
      );
    }

    // Generate slug from name if not provided
    let collectionSlug = slug || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const collectionData: Omit<Collection, "id" | "createdAt" | "updatedAt"> = {
      name,
      description: description || "",
      short_description: short_description || "",
      image: image || "",
      product_ids: Array.isArray(product_ids) ? product_ids : [],
      is_featured: is_featured === true,
      is_active: is_active !== false, // Default to true
      slug: collectionSlug,
      display_order: display_order !== undefined ? Number(display_order) : undefined,
    };

    const collection = await createCollection(collectionData);

    return NextResponse.json({
      success: true,
      collection,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create collection",
        message: String(error?.message || error),
      },
      { status: 500 }
    );
  }
}

// PUT - Update collection
export async function PUT(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Collection ID is required" },
        { status: 400 }
      );
    }

    const collection = await updateCollection(id, updates);

    return NextResponse.json({
      success: true,
      collection,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update collection",
        message: String(error?.message || error),
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete collection
export async function DELETE(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Collection ID is required" },
        { status: 400 }
      );
    }

    await deleteCollection(id);

    return NextResponse.json({
      success: true,
      message: "Collection deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete collection",
        message: String(error?.message || error),
      },
      { status: 500 }
    );
  }
}

