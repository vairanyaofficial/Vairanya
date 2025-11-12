"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Users,
  Percent,
  DollarSign,
  X,
  CheckCircle,
  XCircle,
  Search,
  Check,
  ArrowLeft,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { getAdminSession, isAdminAuthenticated } from "@/lib/admin-auth";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import type { Offer } from "@/lib/offers-types";
import type { Customer } from "@/lib/offers-types";

function OffersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, adminInfo } = useAuth();
  const { showSuccess, showError } = useToast();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    description: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: "",
    min_order_amount: "",
    max_discount: "",
    valid_from: "",
    valid_until: "",
    is_active: true,
    customer_email: "",
    customer_id: "",
    usage_limit: "",
    one_time_per_user: false,
  });

  useEffect(() => {
    if (user && !adminInfo) {
      router.replace("/");
      return;
    }
    
    if (!isAdminAuthenticated()) {
      router.replace("/login");
      return;
    }
    
    loadOffers();
    
    // Check if customer_email is in URL params
    const customerEmail = searchParams.get("customer_email");
    if (customerEmail) {
      setSelectedCustomers([customerEmail]);
      setShowForm(true);
    }
    
    // Refresh when page comes into focus
    const handleFocus = () => {
      loadOffers();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [router, user, adminInfo, searchParams]);

  useEffect(() => {
    // Filter customers based on search query
    if (customerSearchQuery.trim()) {
      const filtered = customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
          customer.email.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
          customer.phone?.toLowerCase().includes(customerSearchQuery.toLowerCase())
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [customerSearchQuery, customers]);

  // Filter offers
  const filteredOffers = useMemo(() => {
    let filtered = offers;

    // Filter by active status
    if (filterActive === "active") {
      filtered = filtered.filter((o) => o.is_active);
    } else if (filterActive === "inactive") {
      filtered = filtered.filter((o) => !o.is_active);
    }

    // Search by title, code, or description
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.title.toLowerCase().includes(query) ||
          o.code?.toLowerCase().includes(query) ||
          o.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [offers, searchQuery, filterActive]);

  const loadOffers = async () => {
    try {
      setIsLoading(true);
      const sessionData = getAdminSession();
      if (!sessionData) {
        return;
      }

      const res = await fetch("/api/admin/offers", {
        headers: { "x-admin-username": sessionData.username },
      });

      const data = await res.json();
      if (data.success) {
        setOffers(data.offers);
      }
    } catch (err) {
      showError("Failed to load offers");
    } finally {
      setIsLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const sessionData = getAdminSession();
      if (!sessionData) {
        return;
      }

      const res = await fetch("/api/admin/customers", {
        headers: { "x-admin-username": sessionData.username },
      });

      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers);
        setFilteredCustomers(data.customers);
      }
    } catch (err) {
      showError("Failed to load customers");
    }
  };

  const handleOpenCustomerModal = () => {
    loadCustomers();
    setShowCustomerModal(true);
  };

  const handleCustomerToggle = (email: string) => {
    setSelectedCustomers((prev) => {
      if (prev.includes(email)) {
        return prev.filter((e) => e !== email);
      } else {
        return [...prev, email];
      }
    });
  };

  const handleApplyCustomers = () => {
    setShowCustomerModal(false);
    setCustomerSearchQuery("");
  };

  const handleClearCustomers = () => {
    setSelectedCustomers([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const sessionData = getAdminSession();
      if (!sessionData) {
        return;
      }

      const offerData: any = {
        title: formData.title,
        description: formData.description || "",
        discount_type: formData.discount_type,
        discount_value: Number(formData.discount_value),
        valid_from: formData.valid_from || new Date().toISOString(),
        valid_until: formData.valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: formData.is_active,
      };

      // Add code if provided
      if (formData.code && formData.code.trim() !== "") {
        offerData.code = formData.code.trim().toUpperCase();
      }

      // Only add optional fields if they have actual values
      if (formData.min_order_amount && formData.min_order_amount.trim() !== "") {
        offerData.min_order_amount = Number(formData.min_order_amount);
      }
      if (formData.max_discount && formData.max_discount.trim() !== "") {
        offerData.max_discount = Number(formData.max_discount);
      }
      // Add selected customer emails
      if (selectedCustomers.length > 0) {
        offerData.customer_emails = selectedCustomers;
      }
      if (formData.usage_limit && formData.usage_limit.trim() !== "") {
        offerData.usage_limit = Number(formData.usage_limit);
      }
      if (formData.one_time_per_user !== undefined) {
        offerData.one_time_per_user = formData.one_time_per_user;
      }

      let response;
      if (editingOffer) {
        response = await fetch("/api/admin/offers", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-admin-username": sessionData.username,
          },
          body: JSON.stringify({ id: editingOffer.id, ...offerData }),
        });
      } else {
        response = await fetch("/api/admin/offers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-username": sessionData.username,
          },
          body: JSON.stringify(offerData),
        });
      }

      const data = await response.json();
      if (data.success) {
        showSuccess(editingOffer ? "Offer updated successfully" : "Offer created successfully");
        setShowForm(false);
        setEditingOffer(null);
        resetForm();
        loadOffers();
      } else {
        const errorMsg = data.message || data.error || "Failed to save offer";
        showError(errorMsg);
      }
    } catch (err: any) {
      showError(err?.message || "Failed to save offer");
    }
  };

  const handleEdit = (offer: Offer) => {
    setEditingOffer(offer);
    setFormData({
      code: offer.code || "",
      title: offer.title,
      description: offer.description,
      discount_type: offer.discount_type,
      discount_value: offer.discount_value.toString(),
      min_order_amount: offer.min_order_amount?.toString() || "",
      max_discount: offer.max_discount?.toString() || "",
      valid_from: offer.valid_from.split("T")[0],
      valid_until: offer.valid_until.split("T")[0],
      is_active: offer.is_active,
      customer_email: offer.customer_email || "",
      customer_id: offer.customer_id || "",
      usage_limit: offer.usage_limit?.toString() || "",
      one_time_per_user: offer.one_time_per_user || false,
    });
    // Set selected customers from offer
    if (offer.customer_emails && offer.customer_emails.length > 0) {
      setSelectedCustomers(offer.customer_emails);
    } else if (offer.customer_email) {
      setSelectedCustomers([offer.customer_email]);
    } else {
      setSelectedCustomers([]);
    }
    setShowForm(true);
  };

  const handleDelete = async (offerId: string) => {
    if (!confirm("Are you sure you want to delete this offer?")) {
      return;
    }

    try {
      const sessionData = getAdminSession();
      if (!sessionData) {
        return;
      }

      const response = await fetch(`/api/admin/offers?id=${offerId}`, {
        method: "DELETE",
        headers: { "x-admin-username": sessionData.username },
      });

      const data = await response.json();
      if (data.success) {
        showSuccess("Offer deleted successfully");
        loadOffers();
      } else {
        showError(data.error || "Failed to delete offer");
      }
    } catch (err) {
      showError("Failed to delete offer");
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      title: "",
      description: "",
      discount_type: "percentage",
      discount_value: "",
      min_order_amount: "",
      max_discount: "",
      valid_from: "",
      valid_until: "",
      is_active: true,
      customer_email: "",
      customer_id: "",
      usage_limit: "",
      one_time_per_user: false,
    });
    setSelectedCustomers([]);
  };

  const toggleActive = async (offer: Offer) => {
    try {
      const sessionData = getAdminSession();
      if (!sessionData) {
        return;
      }

      const response = await fetch("/api/admin/offers", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-username": sessionData.username,
        },
        body: JSON.stringify({ id: offer.id, is_active: !offer.is_active }),
      });

      const data = await response.json();
      if (data.success) {
        showSuccess(`Offer ${!offer.is_active ? "activated" : "deactivated"} successfully`);
        loadOffers();
      } else {
        showError(data.error || "Failed to update offer");
      }
    } catch (err) {
      showError("Failed to update offer");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black p-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading offers...</p>
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
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Offers</h1>
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
              {offers.length}
            </span>
          </div>
          <Button
            onClick={() => {
              setShowForm(true);
              setEditingOffer(null);
              resetForm();
            }}
            size="sm"
            className="h-8 px-2 text-xs bg-[#D4AF37] hover:bg-[#C19B2E]"
          >
            <Plus className="h-3 w-3 mr-1" />
            Create
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="mb-3 space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search offers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs md:text-sm border border-gray-200 dark:border-white/10 rounded-md bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <div className="flex gap-1">
              {(["all", "active", "inactive"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setFilterActive(filter)}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    filterActive === filter
                      ? "bg-[#D4AF37] text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {filter === "all" ? "All" : filter === "active" ? "Active" : "Inactive"}
                </button>
              ))}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
              {filteredOffers.length}/{offers.length}
            </span>
          </div>
        </div>

      {/* Offer Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-900/20 dark:bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border dark:border-white/10">
            <div className="p-3 md:p-4 border-b dark:border-white/10 flex items-center justify-between sticky top-0 bg-white dark:bg-[#0a0a0a] z-10">
              <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
                {editingOffer ? "Edit Offer" : "Create Offer"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingOffer(null);
                  resetForm();
                }}
                className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-3 md:p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border dark:border-white/10 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="e.g., Summer Sale 20% Off"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Offer Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-2 py-1.5 text-sm border dark:border-white/10 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="e.g., SAVE10 (optional)"
                  pattern="[A-Z0-9]*"
                  title="Only uppercase letters and numbers allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border dark:border-white/10 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  rows={2}
                  placeholder="Offer description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type *
                  </label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_type: e.target.value as "percentage" | "fixed",
                      })
                    }
                    className="w-full px-2 py-1.5 text-sm border dark:border-white/10 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Value *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.discount_value}
                      onChange={(e) =>
                        setFormData({ ...formData, discount_value: e.target.value })
                      }
                      className="w-full px-2 py-1.5 pr-7 text-sm border dark:border-white/10 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder={formData.discount_type === "percentage" ? "10" : "100"}
                    />
                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">
                      {formData.discount_type === "percentage" ? "%" : "₹"}
                    </span>
                  </div>
                </div>
              </div>

              {formData.discount_type === "percentage" && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Discount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.max_discount}
                    onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border dark:border-white/10 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="Optional"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Min Order (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.min_order_amount}
                  onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border dark:border-white/10 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Optional"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    From *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border dark:border-white/10 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Until *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border dark:border-white/10 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Customers
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleOpenCustomerModal}
                    className="flex-1 h-7 text-xs"
                  >
                    <Users className="h-3 w-3 mr-1" />
                    {selectedCustomers.length > 0
                      ? `${selectedCustomers.length} Selected`
                      : "Select Customers"}
                  </Button>
                  {selectedCustomers.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleClearCustomers}
                      className="h-7 px-2 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                {selectedCustomers.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {selectedCustomers.map((email) => {
                      const customer = customers.find((c) => c.email === email);
                      return (
                        <span
                          key={email}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20 text-xs rounded text-gray-900 dark:text-white"
                        >
                          {customer?.name || email}
                          <button
                            type="button"
                            onClick={() => handleCustomerToggle(email)}
                            className="hover:text-red-600 dark:hover:text-red-400"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Usage Limit
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border dark:border-white/10 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Optional"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="one_time_per_user"
                  checked={formData.one_time_per_user}
                  onChange={(e) => setFormData({ ...formData, one_time_per_user: e.target.checked })}
                  className="h-3.5 w-3.5 text-[#D4AF37] focus:ring-[#D4AF37] border-gray-300 dark:border-white/20 rounded"
                />
                <label htmlFor="one_time_per_user" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  One time per user
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-3.5 w-3.5 border-gray-300 dark:border-white/20"
                />
                <label htmlFor="is_active" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Active
                </label>
              </div>

              <div className="flex gap-2 pt-2 border-t dark:border-white/10">
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 flex-1 text-xs bg-[#D4AF37] hover:bg-[#C19B2E]"
                >
                  {editingOffer ? "Update" : "Create"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={() => {
                    setShowForm(false);
                    setEditingOffer(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Selection Modal */}
      <Dialog open={showCustomerModal} onOpenChange={setShowCustomerModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-3 md:p-4 border-b dark:border-white/10">
            <DialogTitle className="text-base">Select Customers</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden flex flex-col p-3 md:p-4">
            {/* Search Bar */}
            <div className="mb-3">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs md:text-sm border dark:border-white/10 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
            </div>

            {/* Selected Count */}
            {selectedCustomers.length > 0 && (
              <div className="mb-2 text-xs text-gray-600 dark:text-gray-400">
                {selectedCustomers.length} selected
              </div>
            )}

            {/* Customer List */}
            <div className="flex-1 overflow-y-auto border dark:border-white/10 rounded-md">
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-500 dark:text-gray-400">
                  No customers found
                </div>
              ) : (
                <div className="divide-y dark:divide-white/10">
                  {filteredCustomers.map((customer) => {
                    const isSelected = selectedCustomers.includes(customer.email);
                    return (
                      <div
                        key={customer.email}
                        className={`p-2 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer flex items-center gap-2 ${
                          isSelected ? "bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20" : ""
                        }`}
                        onClick={() => handleCustomerToggle(customer.email)}
                      >
                        <div className={`flex-shrink-0 w-4 h-4 border-2 rounded flex items-center justify-center ${
                          isSelected
                            ? "bg-[#D4AF37] border-[#D4AF37]"
                            : "border-gray-300 dark:border-white/20"
                        }`}>
                          {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{customer.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{customer.email}</div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {customer.total_orders} orders
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="p-3 md:p-4 border-t dark:border-white/10">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowCustomerModal(false);
                setCustomerSearchQuery("");
              }}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApplyCustomers}
              size="sm"
              className="h-8 text-xs bg-[#D4AF37] hover:bg-[#C19B2E]"
            >
              Apply ({selectedCustomers.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

        {/* Offers List */}
        <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm border dark:border-white/10">
          {filteredOffers.length === 0 ? (
            <div className="text-center py-8">
              <Tag className="h-8 w-8 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {searchQuery || filterActive !== "all" ? "No offers found" : "No offers created yet"}
              </p>
              {!searchQuery && filterActive === "all" && (
                <Button
                  onClick={() => setShowForm(true)}
                  size="sm"
                  className="h-8 text-xs bg-[#D4AF37] hover:bg-[#C19B2E]"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Create Offer
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-white/10 max-h-[calc(100vh-300px)] overflow-y-auto">
              {filteredOffers.map((offer) => {
                const now = new Date();
                const validFrom = new Date(offer.valid_from);
                const validUntil = new Date(offer.valid_until);
                const isCurrentlyValid = now >= validFrom && now <= validUntil;

                return (
                  <div
                    key={offer.id}
                    className="p-2 md:p-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {offer.title}
                          </p>
                          {offer.is_active && isCurrentlyValid ? (
                            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 flex items-center gap-0.5 flex-shrink-0">
                              <CheckCircle className="h-2.5 w-2.5" />
                              Active
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 flex items-center gap-0.5 flex-shrink-0">
                              <XCircle className="h-2.5 w-2.5" />
                              Inactive
                            </span>
                          )}
                        </div>
                        {offer.code && (
                          <p className="text-xs font-mono text-[#D4AF37] mb-1">Code: {offer.code}</p>
                        )}
                        {offer.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-1.5">
                            {offer.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                            {offer.discount_type === "percentage" ? (
                              <Percent className="h-3 w-3 text-[#D4AF37]" />
                            ) : (
                              <DollarSign className="h-3 w-3 text-[#D4AF37]" />
                            )}
                            <span className="font-medium">
                              {offer.discount_type === "percentage"
                                ? `${offer.discount_value}%`
                                : `₹${offer.discount_value}`}
                            </span>
                            {offer.min_order_amount && (
                              <span className="text-gray-500">(Min: ₹{offer.min_order_amount})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(offer.valid_from).toLocaleDateString()}</span>
                            <span className="text-gray-400">-</span>
                            <span>{new Date(offer.valid_until).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                            <Users className="h-3 w-3" />
                            <span>
                              {offer.customer_emails && offer.customer_emails.length > 0
                                ? `${offer.customer_emails.length} Customer${offer.customer_emails.length > 1 ? "s" : ""}`
                                : offer.customer_email
                                ? "1 Customer"
                                : "All Customers"}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            Used: {offer.used_count}
                            {offer.usage_limit && ` / ${offer.usage_limit}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleActive(offer)}
                          className="h-7 px-2 text-xs"
                        >
                          {offer.is_active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(offer)}
                          className="h-7 w-7 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(offer.id)}
                          className="h-7 w-7 p-0 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OffersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-black p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">Loading...</div>
        </div>
      </div>
    }>
      <OffersPageContent />
    </Suspense>
  );
}

