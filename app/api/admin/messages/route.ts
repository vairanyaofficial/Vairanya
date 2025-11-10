import { NextRequest, NextResponse } from "next/server";
import { requireSuperUser } from "@/lib/admin-auth-server";
import {
  getAllMessages,
  getMessageById,
  updateMessage,
  deleteMessage,
  getUnreadMessagesCount,
} from "@/lib/messages-mongodb";
import { initializeMongoDB } from "@/lib/mongodb.server";

export async function GET(request: NextRequest) {
  const auth = requireSuperUser(request);
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Initialize MongoDB connection
    const mongoInit = await initializeMongoDB();
    if (!mongoInit.success) {
      console.error("[Admin Messages API] MongoDB initialization failed:", mongoInit.error);
      return NextResponse.json(
        { success: false, error: "Database unavailable" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const countOnly = searchParams.get("count") === "true";

    if (countOnly) {
      try {
        const count = await getUnreadMessagesCount();
        console.log(`[Admin Messages API] Unread messages count: ${count}`);
        return NextResponse.json({ success: true, count });
      } catch (error: any) {
        // For count endpoint, return 0 if database is unavailable to prevent UI errors
        console.error("[Admin Messages API] Error fetching message count:", error);
        if (error?.message?.includes("Database unavailable") || error?.message?.includes("MongoDB not available")) {
          console.warn("[Admin Messages API] Database unavailable for message count, returning 0");
          return NextResponse.json({ success: true, count: 0 });
        }
        // Re-throw other errors
        throw error;
      }
    }

    if (id) {
      console.log(`[Admin Messages API] Fetching message with ID: ${id}`);
      const message = await getMessageById(id);
      if (!message) {
        console.error(`[Admin Messages API] Message not found with ID: ${id}`);
        return NextResponse.json(
          { success: false, error: "Message not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, message });
    }

    console.log("[Admin Messages API] Fetching all messages...");
    const messages = await getAllMessages();
    console.log(`[Admin Messages API] Retrieved ${messages.length} messages`);
    return NextResponse.json({ success: true, messages });
  } catch (error: any) {
    console.error("[Admin Messages API] Error fetching messages:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireSuperUser(request);
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
    const { id, is_read } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Message ID is required" },
        { status: 400 }
      );
    }

    console.log(`[Admin Messages API] Updating message ${id}, is_read: ${is_read}`);
    const updatedMessage = await updateMessage(id, { is_read });
    return NextResponse.json({ success: true, message: updatedMessage });
  } catch (error: any) {
    console.error("[Admin Messages API] Error updating message:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update message" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = requireSuperUser(request);
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
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Message ID is required" },
        { status: 400 }
      );
    }

    console.log(`[Admin Messages API] Deleting message ${id}`);
    await deleteMessage(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Admin Messages API] Error deleting message:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete message" },
      { status: 500 }
    );
  }
}

