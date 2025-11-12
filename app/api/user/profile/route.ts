import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromSession, getUserEmailFromSession } from "@/lib/auth-helpers";
import { initializeMongoDB, getMongoDB } from "@/lib/mongodb.server";

// GET - Get user profile
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromSession(request);
    const userEmail = await getUserEmailFromSession(request);
    
    if (!userId || !userEmail) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 503 }
      );
    }

    const db = getMongoDB();
    if (!db) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 503 }
      );
    }

    // Get customer from MongoDB
    const customer = await db.collection("customers").findOne({ email: userEmail });
    
    return NextResponse.json({
      success: true,
      profile: {
        uid: userId,
        email: userEmail,
        displayName: customer?.name || "",
        phoneNumber: customer?.phone || "",
        photoURL: customer?.photoURL || "",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserIdFromSession(request);
    const userEmail = await getUserEmailFromSession(request);
    
    if (!userId || !userEmail) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 503 }
      );
    }

    const db = getMongoDB();
    if (!db) {
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { displayName, phoneNumber, photoURL } = body;

    const updates: any = {
      updatedAt: new Date(),
    };
    if (displayName !== undefined) updates.name = displayName;
    if (phoneNumber !== undefined) updates.phone = phoneNumber;
    if (photoURL !== undefined) updates.photoURL = photoURL;

    if (Object.keys(updates).length === 1) { // Only updatedAt
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
    }

    // Update customer in MongoDB
    const result = await db.collection("customers").findOneAndUpdate(
      { email: userEmail },
      { $set: updates },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: {
        uid: userId,
        email: userEmail,
        displayName: result.name || "",
        phoneNumber: result.phone || "",
        photoURL: result.photoURL || "",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
