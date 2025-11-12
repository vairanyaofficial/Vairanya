// Messages MongoDB service - server-side only
// This file maintains backward compatibility by re-exporting MongoDB functions
import "server-only";
import * as messagesMongo from "./messages-mongodb";
import type { ContactMessage } from "./messages-types";

// Re-export all MongoDB functions
export async function getAllMessages(): Promise<ContactMessage[]> {
  return messagesMongo.getAllMessages();
}

export async function getUnreadMessagesCount(): Promise<number> {
  return messagesMongo.getUnreadMessagesCount();
}

export async function getMessageById(id: string): Promise<ContactMessage | null> {
  return messagesMongo.getMessageById(id);
}

export async function createMessage(
  message: Omit<ContactMessage, "id" | "created_at" | "updated_at">
): Promise<ContactMessage> {
  return messagesMongo.createMessage(message);
}

export async function updateMessage(
  id: string,
  updates: Partial<Omit<ContactMessage, "id" | "created_at">>
): Promise<ContactMessage> {
  return messagesMongo.updateMessage(id, updates);
}

export async function deleteMessage(id: string): Promise<void> {
  return messagesMongo.deleteMessage(id);
}
