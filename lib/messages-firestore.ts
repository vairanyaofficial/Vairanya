// Messages Firestore service - server-side only
import "server-only";
import { adminFirestore } from "@/lib/firebaseAdmin.server";
import type { ContactMessage } from "./messages-types";

const MESSAGES_COLLECTION = "contact_messages";

// Convert Firestore document to ContactMessage
function docToMessage(doc: any): ContactMessage {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name || "",
    email: data.email || "",
    phone: data.phone || undefined,
    message: data.message || "",
    is_read: data.is_read !== undefined ? data.is_read : false,
    created_at: data.created_at 
      ? (typeof data.created_at === 'string' ? data.created_at : data.created_at.toDate?.()?.toISOString() || new Date().toISOString())
      : new Date().toISOString(),
    updated_at: data.updated_at 
      ? (typeof data.updated_at === 'string' ? data.updated_at : data.updated_at.toDate?.()?.toISOString() || new Date().toISOString())
      : new Date().toISOString(),
  };
}

// Get all messages
export async function getAllMessages(): Promise<ContactMessage[]> {
  if (!adminFirestore) {
    throw new Error("Database unavailable");
  }

  try {
    const snapshot = await adminFirestore
      .collection(MESSAGES_COLLECTION)
      .orderBy("created_at", "desc")
      .get();

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map(docToMessage);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
}

// Get unread messages count
export async function getUnreadMessagesCount(): Promise<number> {
  if (!adminFirestore) {
    throw new Error("Database unavailable");
  }

  try {
    const snapshot = await adminFirestore
      .collection(MESSAGES_COLLECTION)
      .where("is_read", "==", false)
      .get();

    return snapshot.size;
  } catch (error) {
    console.error("Error fetching unread messages count:", error);
    return 0;
  }
}

// Get message by ID
export async function getMessageById(id: string): Promise<ContactMessage | null> {
  if (!adminFirestore) {
    throw new Error("Database unavailable");
  }

  try {
    const doc = await adminFirestore.collection(MESSAGES_COLLECTION).doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return docToMessage(doc);
  } catch (error) {
    console.error("Error fetching message:", error);
    return null;
  }
}

// Create new message
export async function createMessage(
  message: Omit<ContactMessage, "id" | "is_read" | "created_at" | "updated_at">
): Promise<ContactMessage> {
  if (!adminFirestore) {
    throw new Error("Database unavailable");
  }

  try {
    const messageData = {
      name: message.name,
      email: message.email,
      phone: message.phone || null,
      message: message.message,
      is_read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const docRef = await adminFirestore.collection(MESSAGES_COLLECTION).add(messageData);
    const doc = await docRef.get();
    return docToMessage(doc);
  } catch (error: any) {
    throw new Error(error.message || "Failed to create message");
  }
}

// Update message (mark as read/unread)
export async function updateMessage(
  id: string,
  updates: Partial<Pick<ContactMessage, "is_read">>
): Promise<ContactMessage> {
  if (!adminFirestore) {
    throw new Error("Database unavailable");
  }

  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.is_read !== undefined) {
      updateData.is_read = updates.is_read;
    }

    await adminFirestore.collection(MESSAGES_COLLECTION).doc(id).update(updateData);
    const updatedDoc = await adminFirestore.collection(MESSAGES_COLLECTION).doc(id).get();
    return docToMessage(updatedDoc);
  } catch (error: any) {
    throw new Error(error.message || "Failed to update message");
  }
}

// Delete message
export async function deleteMessage(id: string): Promise<void> {
  if (!adminFirestore) {
    throw new Error("Database unavailable");
  }

  try {
    await adminFirestore.collection(MESSAGES_COLLECTION).doc(id).delete();
  } catch (error: any) {
    throw new Error(error.message || "Failed to delete message");
  }
}

