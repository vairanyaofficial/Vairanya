"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getAdminSession, isAdminAuthenticated } from "@/lib/admin-auth";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Mail, Trash2, Eye, EyeOff, ArrowLeft, Search, Filter, Phone, Clock } from "lucide-react";
import Link from "next/link";
import type { ContactMessage } from "@/lib/messages-types";

export default function MessagesPage() {
  const router = useRouter();
  const { user, adminInfo } = useAuth();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRead, setFilterRead] = useState<"all" | "read" | "unread">("all");
  const [showMobileDetail, setShowMobileDetail] = useState(false);

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
        setMessages(data.messages || []);
        console.log(`[Admin Messages] Loaded ${data.messages?.length || 0} messages`);
      } else {
        console.error(`[Admin Messages] Failed to load messages:`, data.error);
      }
    } catch (error: any) {
      console.error("[Admin Messages] Error loading messages:", error);
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

  // Filter and search messages
  const filteredMessages = useMemo(() => {
    let filtered = messages;

    // Filter by read status
    if (filterRead === "read") {
      filtered = filtered.filter((m) => m.is_read);
    } else if (filterRead === "unread") {
      filtered = filtered.filter((m) => !m.is_read);
    }

    // Search by name, email, phone, or message
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          m.email.toLowerCase().includes(query) ||
          m.phone?.toLowerCase().includes(query) ||
          m.message.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [messages, searchQuery, filterRead]);

  // Handle message selection for mobile
  const handleMessageSelect = (message: ContactMessage) => {
    setSelectedMessage(message);
    setShowMobileDetail(true);
  };

  // Close mobile detail view
  const handleCloseMobileDetail = () => {
    setShowMobileDetail(false);
    setSelectedMessage(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black p-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-3 md:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link href="/admin">
              <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
                <ArrowLeft className="h-3 w-3 mr-1" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Messages</h1>
            {unreadCount > 0 && (
              <span className="text-xs text-white bg-blue-500 dark:bg-blue-600 px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
          {/* Messages List */}
          <div className={`lg:col-span-1 bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm border dark:border-white/10 ${
            showMobileDetail ? "hidden lg:block" : "block"
          }`}>
            {/* Search and Filter Bar */}
            <div className="p-2 md:p-3 border-b dark:border-white/10 space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs md:text-sm border border-gray-200 dark:border-white/10 rounded-md bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-gray-400" />
                <div className="flex gap-1">
                  {(["all", "unread", "read"] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setFilterRead(filter)}
                      className={`px-2 py-1 text-xs rounded-md transition-colors ${
                        filterRead === filter
                          ? "bg-[#D4AF37] text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      {filter === "all" ? "All" : filter === "unread" ? "Unread" : "Read"}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                  {filteredMessages.length}/{messages.length}
                </span>
              </div>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-white/10 max-h-[calc(100vh-220px)] overflow-y-auto">
              {filteredMessages.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  <Mail className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-700" />
                  <p className="text-sm">
                    {searchQuery || filterRead !== "all" ? "No messages found" : "No messages yet"}
                  </p>
                </div>
              ) : (
                filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => handleMessageSelect(message)}
                    className={`p-2 md:p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${
                      selectedMessage?.id === message.id ? "bg-[#D4AF37]/5 dark:bg-[#D4AF37]/10" : ""
                    } ${!message.is_read ? "bg-blue-50/50 dark:bg-blue-900/20" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                            {message.name}
                          </h3>
                          {!message.is_read && (
                            <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full flex-shrink-0"></div>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate mb-1">
                          {message.email}
                        </p>
                        {message.phone && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 truncate mb-1.5 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {message.phone}
                          </p>
                        )}
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-1">
                          {message.message}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(message.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Message Detail */}
          <div className={`lg:col-span-2 ${
            showMobileDetail ? "block" : "hidden lg:block"
          }`}>
            {selectedMessage ? (
              <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm border dark:border-white/10">
                {/* Mobile Header with Back Button */}
                <div className="lg:hidden flex items-center justify-between p-3 border-b dark:border-white/10">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCloseMobileDetail}
                    className="h-8 px-2 text-xs"
                  >
                    <ArrowLeft className="h-3 w-3 mr-1" />
                    Back
                  </Button>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Message Details</span>
                  <div className="w-16"></div>
                </div>
                
                <div className="p-3 md:p-4 border-b dark:border-white/10">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <h2 className="text-base md:text-lg font-semibold mb-1 text-gray-900 dark:text-white">
                        {selectedMessage.name}
                      </h2>
                      <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {selectedMessage.email}
                      </p>
                      {selectedMessage.phone && (
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5 mb-2">
                          <Phone className="h-3.5 w-3.5" />
                          {selectedMessage.phone}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {new Date(selectedMessage.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleReadStatus(selectedMessage.id, selectedMessage.is_read)}
                        className="h-8 text-xs"
                      >
                        {selectedMessage.is_read ? (
                          <>
                            <EyeOff className="h-3 w-3 mr-1" />
                            Unread
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3 mr-1" />
                            Read
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(selectedMessage.id)}
                        className="h-8 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="p-3 md:p-4">
                  <h3 className="text-xs font-semibold mb-2 text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Message
                  </h3>
                  <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {selectedMessage.message}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm border dark:border-white/10 p-6 md:p-12 text-center">
                <Mail className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-2 md:mb-4 text-gray-300 dark:text-gray-700" />
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Select a message to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

