"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAdminSession, isAdminAuthenticated } from "@/lib/admin-auth";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Mail, Trash2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ContactMessage } from "@/lib/messages-types";

export default function MessagesPage() {
  const router = useRouter();
  const { user, adminInfo } = useAuth();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  useEffect(() => {
    if (user && !adminInfo) {
      router.replace("/");
      return;
    }

    if (!isAdminAuthenticated()) {
      router.replace("/login?mode=admin");
      return;
    }

    const sessionData = getAdminSession();
    if (sessionData && sessionData.role === "worker") {
      router.replace("/worker/dashboard");
      return;
    }

    loadMessages();
  }, [router, user, adminInfo]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const sessionData = getAdminSession();
      if (!sessionData) {
        return;
      }

      const response = await fetch("/api/admin/messages", {
        headers: { "x-admin-username": sessionData.username },
      });

      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleReadStatus = async (messageId: string, currentStatus: boolean) => {
    try {
      const sessionData = getAdminSession();
      if (!sessionData) {
        return;
      }

      const response = await fetch("/api/admin/messages", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-username": sessionData.username,
        },
        body: JSON.stringify({
          id: messageId,
          is_read: !currentStatus,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, is_read: !currentStatus } : msg
          )
        );
        if (selectedMessage?.id === messageId) {
          setSelectedMessage({ ...selectedMessage, is_read: !currentStatus });
        }
      }
    } catch (error) {
      console.error("Error updating message status:", error);
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm("Are you sure you want to delete this message?")) {
      return;
    }

    try {
      const sessionData = getAdminSession();
      if (!sessionData) {
        return;
      }

      const response = await fetch(`/api/admin/messages?id=${messageId}`, {
        method: "DELETE",
        headers: { "x-admin-username": sessionData.username },
      });

      const data = await response.json();
      if (data.success) {
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(null);
        }
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const unreadCount = messages.filter((msg) => !msg.is_read).length;

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Loading messages...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="font-serif text-3xl mb-2 flex items-center gap-2 text-gray-900 dark:text-white">
              <Mail className="h-6 w-6" />
              Contact Messages
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? "s" : ""}` : "All messages read"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm border dark:border-white/10">
            <div className="p-4 border-b dark:border-white/10">
              <h2 className="font-semibold text-gray-900 dark:text-white">Messages ({messages.length})</h2>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {messages.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
                  <p>No messages yet</p>
                </div>
              ) : (
                <div className="divide-y dark:divide-white/10">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      onClick={() => setSelectedMessage(message)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${
                        selectedMessage?.id === message.id ? "bg-[#D4AF37]/5 dark:bg-[#D4AF37]/10" : ""
                      } ${!message.is_read ? "bg-blue-50/50 dark:bg-blue-900/20" : ""}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate text-gray-900 dark:text-white">{message.name}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{message.email}</p>
                        </div>
                        {!message.is_read && (
                          <div className="w-2 h-2 bg-blue-600 dark:bg-blue-500 rounded-full flex-shrink-0 ml-2 mt-1"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">{message.message}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(message.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-2">
          {selectedMessage ? (
            <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm border dark:border-white/10">
              <div className="p-6 border-b dark:border-white/10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="font-serif text-2xl mb-1 text-gray-900 dark:text-white">{selectedMessage.name}</h2>
                    <p className="text-gray-600 dark:text-gray-400">{selectedMessage.email}</p>
                    {selectedMessage.phone && (
                      <p className="text-gray-600 dark:text-gray-400">{selectedMessage.phone}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleReadStatus(selectedMessage.id, selectedMessage.is_read)}
                    >
                      {selectedMessage.is_read ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Mark Unread
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Mark Read
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(selectedMessage.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:border-red-300 dark:hover:border-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Received: {new Date(selectedMessage.created_at).toLocaleString()}
                </p>
              </div>
              <div className="p-6">
                <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Message</h3>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {selectedMessage.message}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm border dark:border-white/10 p-12 text-center">
              <Mail className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
              <p className="text-gray-500 dark:text-gray-400">Select a message to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

