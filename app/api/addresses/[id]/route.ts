import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin.server";
import { adminAuth } from "@/lib/firebaseAdmin.server";

const ADDRESSES_COLLECTION = "addresses";

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

// PUT - Update an address
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
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

    if (!adminFirestore) {
      return NextResponse.json(
        { success: false, error: "Firestore not initialized" },
        { status: 500 }
      );
    }

    // Verify address belongs to user
    const addressRef = adminFirestore.collection(ADDRESSES_COLLECTION).doc(id);
    const addressDoc = await addressRef.get();

    if (!addressDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Address not found" },
        { status: 404 }
      );
    }

    const addressData = addressDoc.data();
    if (addressData?.user_id !== userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
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
        if (doc.id !== id) {
          const data = doc.data();
          if (data.is_default) {
            batch.update(doc.ref, { is_default: false });
          }
        }
      });
      if (existingAddresses.docs.length > 0) {
        await batch.commit();
      }
    }

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = name;
    if (address_line1 !== undefined) updates.address_line1 = address_line1;
    if (address_line2 !== undefined) updates.address_line2 = address_line2;
    if (city !== undefined) updates.city = city;
    if (state !== undefined) updates.state = state;
    if (pincode !== undefined) updates.pincode = pincode;
    if (country !== undefined) updates.country = country;
    if (phone !== undefined) updates.phone = phone;
    if (is_default !== undefined) updates.is_default = is_default;

    await addressRef.update(updates);

    const updatedDoc = await addressRef.get();
    return NextResponse.json({
      success: true,
      address: { id: updatedDoc.id, ...updatedDoc.data() },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update address" },
      { status: 500 }
    );
  }
}

// DELETE - Delete an address
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!adminFirestore) {
      return NextResponse.json(
        { success: false, error: "Firestore not initialized" },
        { status: 500 }
      );
    }

    // Verify address belongs to user
    const addressRef = adminFirestore.collection(ADDRESSES_COLLECTION).doc(id);
    const addressDoc = await addressRef.get();

    if (!addressDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Address not found" },
        { status: 404 }
      );
    }

    const addressData = addressDoc.data();
    if (addressData?.user_id !== userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    await addressRef.delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete address" },
      { status: 500 }
    );
  }
}

