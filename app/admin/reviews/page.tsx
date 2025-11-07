"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAdminSession, isAdminAuthenticated } from "@/lib/admin-auth";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Star, Trash2, Eye, EyeOff, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import type { Review } from "@/lib/reviews-types";

export default function ReviewsPage() {
  const router = useRouter();
  const { user, adminInfo } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  useEffect(() => {
    if (user && !adminInfo) {
      router.replace("/");
      return;
    }

    if (!isAdminAuthenticated()) {
      router.replace("/admin/login");
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-600">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/admin">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Customer Reviews</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reviews List */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">All Reviews ({reviews.length})</h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-[calc(100vh-200px)] overflow-y-auto">
              {reviews.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Star className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No reviews yet</p>
                </div>
              ) : (
                reviews.map((review) => (
                  <div
                    key={review.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedReview?.id === review.id ? "bg-[#D4AF37]/5" : ""
                    }`}
                    onClick={() => setSelectedReview(review)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-semibold">{review.customer_name}</p>
                          {review.is_featured && (
                            <span className="text-xs bg-[#D4AF37] text-white px-2 py-0.5 rounded-full">
                              Featured
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? "fill-[#D4AF37] text-[#D4AF37]"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {review.review_text}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="ml-4">
                        {review.is_featured ? (
                          <Eye className="h-4 w-4 text-[#D4AF37]" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Review Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {selectedReview ? (
              <div className="p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold mb-4">Review Details</h2>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Customer Name</p>
                      <p className="font-semibold">{selectedReview.customer_name}</p>
                    </div>
                    {selectedReview.customer_email && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Email</p>
                        <p className="text-sm">{selectedReview.customer_email}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Rating</p>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < selectedReview.rating
                                ? "fill-[#D4AF37] text-[#D4AF37]"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Review</p>
                      <p className="text-gray-700 leading-relaxed">
                        "{selectedReview.review_text}"
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Submitted</p>
                      <p className="text-sm">
                        {new Date(selectedReview.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-4 border-t border-gray-200">
                  <Button
                    onClick={() => toggleFeatured(selectedReview.id, selectedReview.is_featured)}
                    className={`w-full ${
                      selectedReview.is_featured
                        ? "bg-gray-600 hover:bg-gray-700"
                        : "bg-[#D4AF37] hover:bg-[#C19B2E]"
                    }`}
                  >
                    {selectedReview.is_featured ? (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Unfeature
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Feature on Homepage
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleDelete(selectedReview.id)}
                    variant="outline"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Review
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Star className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select a review to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

