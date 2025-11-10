import { NextRequest, NextResponse } from "next/server";
import { requireSuperUser } from "@/lib/admin-auth-server";
import {
  getAllMessages,
  getMessageById,
  updateMessage,
  deleteMessage,
  getUnreadMessagesCount,
} from "@/lib/messages-firestore";

export async function GET(request: NextRequest) {
  const auth = requireSuperUser(request);
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const countOnly = searchParams.get("count") === "true";

    if (countOnly) {
      try {
        const count = await getUnreadMessagesCount();
        return NextResponse.json({ success: true, count });
      } catch (error: any) {
        // For count endpoint, return 0 if database is unavailable to prevent UI errors
        if (error?.message?.includes("Database unavailable")) {
          console.warn("Database unavailable for message count, returning 0");
          return NextResponse.json({ success: true, count: 0 });
        }
        // Re-throw other errors
        throw error;
      }
    }

    if (id) {
      const message = await getMessageById(id);
      if (!message) {
        return NextResponse.json(
          { success: false, error: "Message not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, message });
    }

    const messages = await getAllMessages();
    return NextResponse.json({ success: true, messages });
  } catch (error: any) {
    console.error("Error fetching messages:", error);
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
    const body = await request.json();
    const { id, is_read } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Message ID is required" },
        { status: 400 }
      );
    }

    const updatedMessage = await updateMessage(id, { is_read });
    return NextResponse.json({ success: true, message: updatedMessage });
  } catch (error: any) {
    console.error("Error updating message:", error);
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Message ID is required" },
        { status: 400 }
      );
    }

    await deleteMessage(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete message" },
      { status: 500 }
    );
  }
}

