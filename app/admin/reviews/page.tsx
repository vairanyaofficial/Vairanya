"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getAdminSession, isAdminAuthenticated } from "@/lib/admin-auth";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Star, Trash2, Eye, EyeOff, ArrowLeft, CheckCircle, XCircle, Search, Filter } from "lucide-react";
import Link from "next/link";
import type { Review } from "@/lib/reviews-types";

export default function ReviewsPage() {
  const router = useRouter();
  const { user, adminInfo } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFeatured, setFilterFeatured] = useState<"all" | "featured" | "not-featured">("all");

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

    loadReviews();
  }, [router, user, adminInfo]);

  const loadReviews = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/reviews");
      const data = await response.json();
      if (data.success) {
        setReviews(data.reviews);
      }
    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFeatured = async (reviewId: string, currentStatus: boolean) => {
    try {
      const sessionData = getAdminSession();
      if (!sessionData) {
        alert("You must be logged in as admin");
        return;
      }

      const response = await fetch("/api/admin/reviews", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-username": sessionData.username,
          "x-admin-role": sessionData.role || "superuser",
        },
        body: JSON.stringify({
          review_id: reviewId,
          is_featured: !currentStatus,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setReviews((prev) =>
          prev.map((review) =>
            review.id === reviewId ? { ...review, is_featured: !currentStatus } : review
          )
        );
        if (selectedReview?.id === reviewId) {
          setSelectedReview({ ...selectedReview, is_featured: !currentStatus });
        }
      } else {
        alert(data.error || "Failed to update review");
      }
    } catch (error) {
      console.error("Error updating review:", error);
      alert("Failed to update review");
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) {
      return;
    }

    try {
      const sessionData = getAdminSession();
      if (!sessionData) {
        alert("You must be logged in as admin");
        return;
      }

      const response = await fetch(`/api/admin/reviews?review_id=${reviewId}`, {
        method: "DELETE",
        headers: {
          "x-admin-username": sessionData.username,
          "x-admin-role": sessionData.role || "superuser",
        },
      });

      const data = await response.json();
      if (data.success) {
        setReviews((prev) => prev.filter((review) => review.id !== reviewId));
        if (selectedReview?.id === reviewId) {
          setSelectedReview(null);
        }
      } else {
        alert(data.error || "Failed to delete review");
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("Failed to delete review");
    }
  };

  // Filter and search reviews
  const filteredReviews = useMemo(() => {
    let filtered = reviews;

    // Filter by featured status
    if (filterFeatured === "featured") {
      filtered = filtered.filter((r) => r.is_featured);
    } else if (filterFeatured === "not-featured") {
      filtered = filtered.filter((r) => !r.is_featured);
    }

    // Search by name, email, or review text
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.customer_name.toLowerCase().includes(query) ||
          r.customer_email?.toLowerCase().includes(query) ||
          r.review_text.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [reviews, searchQuery, filterFeatured]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black p-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading reviews...</p>
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
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Reviews</h1>
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
              {reviews.length}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
          {/* Reviews List */}
          <div className="lg:col-span-2 bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm border dark:border-white/10">
            {/* Search and Filter Bar */}
            <div className="p-2 md:p-3 border-b dark:border-white/10 space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search reviews..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs md:text-sm border border-gray-200 dark:border-white/10 rounded-md bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-gray-400" />
                <div className="flex gap-1">
                  {(["all", "featured", "not-featured"] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setFilterFeatured(filter)}
                      className={`px-2 py-1 text-xs rounded-md transition-colors ${
                        filterFeatured === filter
                          ? "bg-[#D4AF37] text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      {filter === "all" ? "All" : filter === "featured" ? "Featured" : "Not Featured"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-white/10 max-h-[calc(100vh-180px)] overflow-y-auto">
              {filteredReviews.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  <Star className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-700" />
                  <p className="text-sm">
                    {searchQuery || filterFeatured !== "all" ? "No reviews found" : "No reviews yet"}
                  </p>
                </div>
              ) : (
                filteredReviews.map((review) => (
                  <div
                    key={review.id}
                    className={`p-2 md:p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${
                      selectedReview?.id === review.id ? "bg-[#D4AF37]/5 dark:bg-[#D4AF37]/10" : ""
                    }`}
                    onClick={() => setSelectedReview(review)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                            {review.customer_name}
                          </p>
                          {review.is_featured && (
                            <span className="text-[10px] bg-[#D4AF37] text-white px-1.5 py-0.5 rounded-full flex-shrink-0">
                              Featured
                            </span>
                          )}
                        </div>
                        <div className="flex gap-0.5 mb-1.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < review.rating
                                  ? "fill-[#D4AF37] text-[#D4AF37]"
                                  : "text-gray-300 dark:text-gray-700"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-1">
                          {review.review_text}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex-shrink-0 mt-0.5">
                        {review.is_featured ? (
                          <Eye className="h-3.5 w-3.5 text-[#D4AF37]" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5 text-gray-400 dark:text-gray-600" />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Review Details */}
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm border dark:border-white/10">
            {selectedReview ? (
              <div className="p-3 md:p-4">
                <div className="mb-3">
                  <h2 className="text-sm md:text-base font-semibold mb-3 text-gray-900 dark:text-white">Details</h2>
                  <div className="space-y-2.5">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Customer Name</p>
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">{selectedReview.customer_name}</p>
                    </div>
                    {selectedReview.customer_email && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Email</p>
                        <p className="text-xs text-gray-900 dark:text-white break-all">{selectedReview.customer_email}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Rating</p>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < selectedReview.rating
                                ? "fill-[#D4AF37] text-[#D4AF37]"
                                : "text-gray-300 dark:text-gray-700"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Review</p>
                      <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        "{selectedReview.review_text}"
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Submitted</p>
                      <p className="text-xs text-gray-900 dark:text-white">
                        {new Date(selectedReview.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 pt-3 border-t dark:border-white/10">
                  <Button
                    onClick={() => toggleFeatured(selectedReview.id, selectedReview.is_featured)}
                    size="sm"
                    className={`w-full h-8 text-xs ${
                      selectedReview.is_featured
                        ? "bg-gray-600 hover:bg-gray-700"
                        : "bg-[#D4AF37] hover:bg-[#C19B2E]"
                    }`}
                  >
                    {selectedReview.is_featured ? (
                      <>
                        <XCircle className="h-3 w-3 mr-1.5" />
                        Unfeature
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1.5" />
                        Feature
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleDelete(selectedReview.id)}
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-3 w-3 mr-1.5" />
                    Delete
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                <Star className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-700" />
                <p className="text-xs md:text-sm">Select a review to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

