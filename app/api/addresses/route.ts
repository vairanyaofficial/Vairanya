import { NextRequest, NextResponse } from "next/server";
import { initializeMongoDB, getMongoDB } from "@/lib/mongodb.server";
import { getUserIdFromSession } from "@/lib/auth-helpers";

const ADDRESSES_COLLECTION = "addresses";

interface Address {
  id?: string;
  user_id: string;
  name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phone?: string;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
}

// GET - Fetch all addresses for the authenticated user
export async function GET(request: NextRequest) {
  try {
    // Initialize MongoDB
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 500 }
      );
    }

    // Get user ID from NextAuth session
    const userId = await getUserIdFromSession(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = getMongoDB();
    if (!db) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 500 }
      );
    }

    const addresses = await db
      .collection(ADDRESSES_COLLECTION)
      .find({ user_id: userId })
      .sort({ is_default: -1, created_at: -1 })
      .toArray();

    const formattedAddresses = addresses.map((addr: any) => ({
      id: addr._id?.toString() || addr.id,
      ...addr,
      _id: undefined, // Remove MongoDB _id from response
    }));

    return NextResponse.json({ success: true, addresses: formattedAddresses });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch addresses" },
      { status: 500 }
    );
  }
}

// POST - Create a new address
export async function POST(request: NextRequest) {
  try {
    // Initialize MongoDB
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 500 }
      );
    }
    
    const userId = await getUserIdFromSession(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      address_line1,
      address_line2,
      city,
      state,
      pincode,
      country,
      phone,
      is_default,
    } = body;

    if (!name || !address_line1 || !city || !state || !pincode || !country) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = getMongoDB();
    if (!db) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 500 }
      );
    }

    // If this is set as default, unset other defaults
    if (is_default) {
      await db.collection(ADDRESSES_COLLECTION).updateMany(
        { user_id: userId, is_default: true },
        { $set: { is_default: false } }
      );
    }

    const addressData: Omit<Address, "id"> = {
      user_id: userId,
      name,
      address_line1,
      address_line2: address_line2 || "",
      city,
      state,
      pincode,
      country,
      phone: phone || "",
      is_default: is_default || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const result = await db.collection(ADDRESSES_COLLECTION).insertOne(addressData);

    return NextResponse.json({
      success: true,
      address: { id: result.insertedId.toString(), ...addressData },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create address" },
      { status: 500 }
    );
  }
}
