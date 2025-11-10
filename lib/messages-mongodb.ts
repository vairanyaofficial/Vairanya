// lib/messages-mongodb.ts
// MongoDB implementation for messages - server-side only
import "server-only";
import { getMongoDB } from "@/lib/mongodb.server";
import { ObjectId } from "mongodb";
import type { ContactMessage } from "./messages-types";

const MESSAGES_COLLECTION = "Message";
const MESSAGES_COLLECTION_ALT = "messages"; // Alternative collection name

// Convert MongoDB document to ContactMessage
function docToMessage(doc: any): ContactMessage {
  return {
    id: doc._id?.toString() || doc.id,
    name: doc.name || "",
    email: doc.email || "",
    phone: doc.phone || undefined,
    message: doc.message || "",
    is_read: doc.is_read !== undefined ? doc.is_read : false,
    created_at: doc.created_at || new Date().toISOString(),
    updated_at: doc.updated_at || new Date().toISOString(),
  };
}

// Get all messages
export async function getAllMessages(): Promise<ContactMessage[]> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    // Try primary collection name first
    let collection = db.collection(MESSAGES_COLLECTION);
    let docs: any[] = [];
    
    try {
      docs = await collection.find({}).sort({ created_at: -1 }).toArray();
      console.log(`[Messages] Found ${docs.length} messages in "${MESSAGES_COLLECTION}" collection`);
    } catch (error: any) {
      // Try alternative collection name
      console.log(`[Messages] Error with "${MESSAGES_COLLECTION}", trying "${MESSAGES_COLLECTION_ALT}"...`);
      try {
        collection = db.collection(MESSAGES_COLLECTION_ALT);
        docs = await collection.find({}).sort({ created_at: -1 }).toArray();
        console.log(`[Messages] Found ${docs.length} messages in "${MESSAGES_COLLECTION_ALT}" collection`);
      } catch (altError: any) {
        console.error(`[Messages] Both collections failed:`, altError?.message);
        return [];
      }
    }
    
    const messages = docs.map(docToMessage);
    // Sort in memory to ensure correct order
    messages.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA; // Descending order (newest first)
    });
    
    return messages;
  } catch (error: any) {
    console.error("[Messages] Error fetching messages:", error);
    return [];
  }
}

// Get unread messages count
export async function getUnreadMessagesCount(): Promise<number> {
  const db = getMongoDB();
  if (!db) {
    return 0;
  }

  try {
    // Try primary collection name first
    let collection = db.collection(MESSAGES_COLLECTION);
    let count = 0;
    
    try {
      count = await collection.countDocuments({ is_read: false });
      console.log(`[Messages] Unread count from "${MESSAGES_COLLECTION}": ${count}`);
    } catch (error: any) {
      // Try alternative collection name
      try {
        collection = db.collection(MESSAGES_COLLECTION_ALT);
        count = await collection.countDocuments({ is_read: false });
        console.log(`[Messages] Unread count from "${MESSAGES_COLLECTION_ALT}": ${count}`);
      } catch (altError: any) {
        console.error(`[Messages] Error counting unread messages:`, altError?.message);
        return 0;
      }
    }
    
    return count;
  } catch (error: any) {
    console.error("[Messages] Error fetching unread messages count:", error);
    return 0;
  }
}

// Get message by ID
export async function getMessageById(id: string): Promise<ContactMessage | null> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    // Try primary collection name first
    let collection = db.collection(MESSAGES_COLLECTION);
    
    // Build query - try multiple formats
    let query: any;
    
    // First, try to parse as ObjectId
    try {
      const objectId = new ObjectId(id);
      query = { _id: objectId };
    } catch {
      // If not a valid ObjectId, try multiple query formats
      query = { 
        $or: [
          { _id: id },
          { id: id }
        ]
      };
    }
    
    let doc = await collection.findOne(query);
    
    if (!doc) {
      // Try alternative collection name
      try {
        collection = db.collection(MESSAGES_COLLECTION_ALT);
        doc = await collection.findOne(query);
        if (doc) {
          console.log(`[Messages] Found message by ID in "${MESSAGES_COLLECTION_ALT}" collection`);
        }
      } catch (altError: any) {
        console.error(`[Messages] Error searching in alternative collection:`, altError?.message);
      }
    }
    
    if (!doc) {
      console.log(`[Messages] Message not found with ID: ${id}`);
      return null;
    }
    
    console.log(`[Messages] Found message with ID: ${id}`);
    return docToMessage(doc);
  } catch (error: any) {
    console.error(`[Messages] Error getting message by ID (${id}):`, error);
    return null;
  }
}

// Create new message
export async function createMessage(
  message: Omit<ContactMessage, "id" | "is_read" | "created_at" | "updated_at">
): Promise<ContactMessage> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    const now = new Date().toISOString();
    const messageData = {
      name: message.name,
      email: message.email,
      phone: message.phone || null,
      message: message.message,
      is_read: false,
      created_at: now,
      updated_at: now,
    };

    // Use primary collection name for creating messages
    const collection = db.collection(MESSAGES_COLLECTION);
    const result = await collection.insertOne(messageData);
    const created = await collection.findOne({ _id: result.insertedId });

    if (!created) {
      throw new Error("Failed to create message");
    }

    console.log(`[Messages] Created message with ID: ${result.insertedId}`);
    return docToMessage(created);
  } catch (error: any) {
    console.error("[Messages] Error creating message:", error);
    throw new Error(error.message || "Failed to create message");
  }
}

// Update message (mark as read/unread)
export async function updateMessage(
  id: string,
  updates: Partial<Pick<ContactMessage, "is_read">>
): Promise<ContactMessage> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    // Try primary collection name first
    let collection = db.collection(MESSAGES_COLLECTION);
    
    // Build query - try multiple formats
    let query: any;
    
    // First, try to parse as ObjectId
    try {
      const objectId = new ObjectId(id);
      query = { _id: objectId };
    } catch {
      // If not a valid ObjectId, try multiple query formats
      query = { 
        $or: [
          { _id: id },
          { id: id }
        ]
      };
    }
    
    // First find the message to verify it exists and get the actual _id
    let message = await collection.findOne(query);
    
    if (!message) {
      // Try alternative collection name
      try {
        collection = db.collection(MESSAGES_COLLECTION_ALT);
        message = await collection.findOne(query);
        if (message) {
          query = { _id: message._id };
        } else {
          throw new Error(`Message not found with ID: ${id}`);
        }
      } catch (altError: any) {
        throw new Error(`Message not found with ID: ${id}`);
      }
    } else {
      // Use the actual _id from the found document
      query = { _id: message._id };
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.is_read !== undefined) {
      updateData.is_read = updates.is_read;
    }

    const result = await collection.updateOne(query, { $set: updateData });
    
    if (result.matchedCount === 0) {
      throw new Error(`Message not found with ID: ${id}`);
    }

    const updated = await collection.findOne(query);
    if (!updated) {
      throw new Error("Failed to retrieve updated message");
    }
    
    console.log(`[Messages] Updated message with ID: ${id}`);
    return docToMessage(updated);
  } catch (error: any) {
    console.error(`[Messages] Error updating message (${id}):`, error);
    throw new Error(error.message || "Failed to update message");
  }
}

// Delete message
export async function deleteMessage(id: string): Promise<void> {
  const db = getMongoDB();
  if (!db) {
    throw new Error("MongoDB not available");
  }

  try {
    // Try primary collection name first
    let collection = db.collection(MESSAGES_COLLECTION);
    
    // Build query - try multiple formats
    let query: any;
    
    // First, try to parse as ObjectId
    try {
      const objectId = new ObjectId(id);
      query = { _id: objectId };
    } catch {
      // If not a valid ObjectId, try multiple query formats
      query = { 
        $or: [
          { _id: id },
          { id: id }
        ]
      };
    }
    
    // First find the message to verify it exists and get the actual _id
    let message = await collection.findOne(query);
    
    if (!message) {
      // Try alternative collection name
      try {
        collection = db.collection(MESSAGES_COLLECTION_ALT);
        message = await collection.findOne(query);
        if (message) {
          query = { _id: message._id };
        } else {
          throw new Error(`Message not found with ID: ${id}`);
        }
      } catch (altError: any) {
        throw new Error(`Message not found with ID: ${id}`);
      }
    } else {
      // Use the actual _id from the found document
      query = { _id: message._id };
    }
    
    const result = await collection.deleteOne(query);
    
    if (result.deletedCount === 0) {
      throw new Error(`Message not found with ID: ${id}`);
    }
    
    console.log(`[Messages] Deleted message with ID: ${id}`);
  } catch (error: any) {
    console.error(`[Messages] Error deleting message (${id}):`, error);
    throw new Error(error.message || "Failed to delete message");
  }
}

