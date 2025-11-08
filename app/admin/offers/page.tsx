"use client";

import React, { useState, useEffect, Suspense } from "react";
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
      router.replace("/login?mode=admin");
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
      console.error("Failed to load offers:", err);
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
      console.error("Failed to load customers:", err);
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
        console.error("Offer save error:", errorMsg);
        showError(errorMsg);
      }
    } catch (err: any) {
      console.error("Offer save exception:", err);
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
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Loading offers...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl mb-2 text-gray-900 dark:text-white">Offers</h1>
          <p className="text-gray-600 dark:text-gray-400">Create and manage promotional offers</p>
        </div>
        <Button
          onClick={() => {
            setShowForm(true);
            setEditingOffer(null);
            resetForm();
          }}
          className="bg-[#D4AF37] hover:bg-[#C19B2E]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Offer
        </Button>
      </div>

      {/* Offer Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border dark:border-white/10">
            <div className="p-6 border-b dark:border-white/10 flex items-center justify-between">
              <h2 className="font-serif text-xl text-gray-900 dark:text-white">
                {editingOffer ? "Edit Offer" : "Create New Offer"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingOffer(null);
                  resetForm();
                }}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="e.g., Summer Sale 20% Off"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Offer Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="e.g., SAVE10, WELCOME20 (optional)"
                  pattern="[A-Z0-9]*"
                  title="Only uppercase letters and numbers allowed"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Enter a unique code for easy application at checkout. Leave empty to use offer ID.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  rows={3}
                  placeholder="Offer description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_type: e.target.value as "percentage" | "fixed",
                      })
                    }
                    className="w-full px-3 py-2 border dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Discount Value *
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
                      className="w-full px-3 py-2 border dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder={formData.discount_type === "percentage" ? "10" : "100"}
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                      {formData.discount_type === "percentage" ? "%" : "₹"}
                    </span>
                  </div>
                </div>
              </div>

              {formData.discount_type === "percentage" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Discount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.max_discount}
                    onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                    className="w-full px-3 py-2 border dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="Optional: Maximum discount amount"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Minimum Order Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.min_order_amount}
                  onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                  className="w-full px-3 py-2 border dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Optional: Minimum order amount"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Valid From *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                    className="w-full px-3 py-2 border dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Valid Until *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    className="w-full px-3 py-2 border dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Customers (Leave empty for all customers)
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleOpenCustomerModal}
                    className="flex-1"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    {selectedCustomers.length > 0
                      ? `${selectedCustomers.length} Customer${selectedCustomers.length > 1 ? "s" : ""} Selected`
                      : "Select Customers"}
                  </Button>
                  {selectedCustomers.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClearCustomers}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                {selectedCustomers.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedCustomers.map((email) => {
                      const customer = customers.find((c) => c.email === email);
                      return (
                        <span
                          key={email}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20 text-sm rounded text-gray-900 dark:text-white"
                        >
                          {customer?.name || email}
                          <button
                            type="button"
                            onClick={() => handleCustomerToggle(email)}
                            className="hover:text-red-600 dark:hover:text-red-400"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Usage Limit (Optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                  className="w-full px-3 py-2 border dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Maximum number of times offer can be used"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="one_time_per_user"
                  checked={formData.one_time_per_user}
                  onChange={(e) => setFormData({ ...formData, one_time_per_user: e.target.checked })}
                  className="h-4 w-4 text-[#D4AF37] focus:ring-[#D4AF37] border-gray-300 dark:border-white/20 rounded"
                />
                <label htmlFor="one_time_per_user" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  One time per user (Each user can use this offer only once)
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 border-gray-300 dark:border-white/20"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Active
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="bg-[#D4AF37] hover:bg-[#C19B2E] flex-1"
                >
                  {editingOffer ? "Update Offer" : "Create Offer"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Customers</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
            </div>

            {/* Selected Count */}
            {selectedCustomers.length > 0 && (
              <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                {selectedCustomers.length} customer{selectedCustomers.length > 1 ? "s" : ""} selected
              </div>
            )}

            {/* Customer List */}
            <div className="flex-1 overflow-y-auto border dark:border-white/10 rounded-lg">
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No customers found
                </div>
              ) : (
                <div className="divide-y dark:divide-white/10">
                  {filteredCustomers.map((customer) => {
                    const isSelected = selectedCustomers.includes(customer.email);
                    return (
                      <div
                        key={customer.email}
                        className={`p-4 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer flex items-center gap-3 ${
                          isSelected ? "bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20" : ""
                        }`}
                        onClick={() => handleCustomerToggle(customer.email)}
                      >
                        <div className={`flex-shrink-0 w-5 h-5 border-2 rounded flex items-center justify-center ${
                          isSelected
                            ? "bg-[#D4AF37] border-[#D4AF37]"
                            : "border-gray-300 dark:border-white/20"
                        }`}>
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 dark:text-white">{customer.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{customer.email}</div>
                          {customer.phone && (
                            <div className="text-xs text-gray-400 dark:text-gray-500">{customer.phone}</div>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {customer.total_orders} orders
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCustomerModal(false);
                setCustomerSearchQuery("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApplyCustomers}
              className="bg-[#D4AF37] hover:bg-[#C19B2E]"
            >
              Apply ({selectedCustomers.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Offers List */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-sm border dark:border-white/10">
        {offers.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="h-12 w-12 text-gray-400 dark:text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">No offers created yet</p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-[#D4AF37] hover:bg-[#C19B2E]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Offer
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-[#0a0a0a] border-b dark:border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Offer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Discount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Validity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Usage
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                {offers.map((offer) => {
                  const now = new Date();
                  const validFrom = new Date(offer.valid_from);
                  const validUntil = new Date(offer.valid_until);
                  const isCurrentlyValid = now >= validFrom && now <= validUntil;

                  return (
                    <tr key={offer.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{offer.title}</p>
                          {offer.code && (
                            <p className="text-xs font-mono text-[#D4AF37] mt-1">Code: {offer.code}</p>
                          )}
                          {offer.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{offer.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {offer.discount_type === "percentage" ? (
                            <Percent className="h-4 w-4 text-[#D4AF37]" />
                          ) : (
                            <DollarSign className="h-4 w-4 text-[#D4AF37]" />
                          )}
                          <span className="font-medium text-gray-900 dark:text-white">
                            {offer.discount_type === "percentage"
                              ? `${offer.discount_value}%`
                              : `₹${offer.discount_value}`}
                          </span>
                          {offer.min_order_amount && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              (Min: ₹{offer.min_order_amount})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                            <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <span>{new Date(offer.valid_from).toLocaleDateString()}</span>
                          </div>
                          <div className="text-gray-500 dark:text-gray-400 mt-1">
                            to {new Date(offer.valid_until).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {offer.customer_emails && offer.customer_emails.length > 0 ? (
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <span className="text-gray-600 dark:text-gray-400">
                              {offer.customer_emails.length} Customer{offer.customer_emails.length > 1 ? "s" : ""}
                            </span>
                          </div>
                        ) : offer.customer_email ? (
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <span className="text-gray-600 dark:text-gray-400">{offer.customer_email}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">All Customers</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          <span className="font-medium">{offer.used_count}</span>
                          {offer.usage_limit && (
                            <span className="text-gray-500 dark:text-gray-400"> / {offer.usage_limit}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {offer.is_active && isCurrentlyValid ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 flex items-center gap-1">
                              <XCircle className="h-3 w-3" />
                              Inactive
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleActive(offer)}
                          >
                            {offer.is_active ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(offer)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(offer.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OffersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF9F6]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center text-gray-500">Loading...</div>
        </div>
      </div>
    }>
      <OffersPageContent />
    </Suspense>
  );
}

