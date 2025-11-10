import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin.server";
import { adminAuth } from "@/lib/firebaseAdmin.server";

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

// Helper to verify Firebase token and get user ID
async function getUserIdFromToken(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;
    
    const token = authHeader.substring(7);
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

// GET - Fetch all addresses for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!adminFirestore) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 500 }
      );
    }

    const snapshot = await adminFirestore
      .collection(ADDRESSES_COLLECTION)
      .where("user_id", "==", userId)
      .get();

    const addresses = snapshot.docs
      .map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a: any, b: any) => {
        // Sort by default first, then by created_at
        if (a.is_default && !b.is_default) return -1;
        if (!a.is_default && b.is_default) return 1;
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });

    return NextResponse.json({ success: true, addresses });
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
    const userId = await getUserIdFromToken(request);
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

    if (!adminFirestore) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 500 }
      );
    }

    // If this is set as default, unset other defaults
    if (is_default) {
      const existingAddresses = await adminFirestore
        .collection(ADDRESSES_COLLECTION)
        .where("user_id", "==", userId)
        .get();

      const batch = adminFirestore.batch();
      existingAddresses.docs.forEach((doc: any) => {
        const data = doc.data();
        if (data.is_default) {
          batch.update(doc.ref, { is_default: false });
        }
      });
      if (existingAddresses.docs.length > 0) {
        await batch.commit();
      }
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

    const docRef = await adminFirestore
      .collection(ADDRESSES_COLLECTION)
      .add(addressData);

    return NextResponse.json({
      success: true,
      address: { id: docRef.id, ...addressData },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create address" },
      { status: 500 }
    );
  }
}

