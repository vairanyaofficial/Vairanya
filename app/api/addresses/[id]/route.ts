import { NextRequest, NextResponse } from "next/server";
import { initializeMongoDB, getMongoDB } from "@/lib/mongodb.server";
import { getUserIdFromSession } from "@/lib/auth-helpers";
import { ObjectId } from "mongodb";

const ADDRESSES_COLLECTION = "addresses";

// PUT - Update an address
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const db = getMongoDB();
    if (!db) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 500 }
      );
    }

    // Verify address belongs to user
    let addressId: ObjectId;
    try {
      addressId = new ObjectId(id);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid address ID" },
        { status: 400 }
      );
    }

    const existingAddress = await db
      .collection(ADDRESSES_COLLECTION)
      .findOne({ _id: addressId, user_id: userId });

    if (!existingAddress) {
      return NextResponse.json(
        { success: false, error: "Address not found" },
        { status: 404 }
      );
    }

    // If this is set as default, unset other defaults
    if (is_default) {
      await db.collection(ADDRESSES_COLLECTION).updateMany(
        { user_id: userId, is_default: true, _id: { $ne: addressId } },
        { $set: { is_default: false } }
      );
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

    await db.collection(ADDRESSES_COLLECTION).updateOne(
      { _id: addressId },
      { $set: updates }
    );

    const updatedAddress = await db
      .collection(ADDRESSES_COLLECTION)
      .findOne({ _id: addressId });

    return NextResponse.json({
      success: true,
      address: {
        id: updatedAddress?._id.toString(),
        ...updatedAddress,
        _id: undefined,
      },
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

    const { id } = await params;

    const db = getMongoDB();
    if (!db) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 500 }
      );
    }

    // Verify address belongs to user
    let addressId: ObjectId;
    try {
      addressId = new ObjectId(id);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid address ID" },
        { status: 400 }
      );
    }

    const existingAddress = await db
      .collection(ADDRESSES_COLLECTION)
      .findOne({ _id: addressId, user_id: userId });

    if (!existingAddress) {
      return NextResponse.json(
        { success: false, error: "Address not found" },
        { status: 404 }
      );
    }

    await db.collection(ADDRESSES_COLLECTION).deleteOne({ _id: addressId });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete address" },
      { status: 500 }
    );
  }
}
