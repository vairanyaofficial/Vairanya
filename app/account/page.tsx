"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  User,
  Edit,
  Plus,
  Trash2,
  X,
  Save,
  AlertCircle,
  Tag,
  Copy,
  MessageSquare,
  Star,
} from "lucide-react";
import type { Order } from "@/lib/orders-types";
import type { Offer } from "@/lib/offers-types";
import { useToast } from "@/components/ToastProvider";
import { AccountProfileSkeleton, AccountAddressesSkeleton, AccountOrdersSkeleton, AccountOffersSkeleton } from "@/components/SkeletonLoader";
import ReviewForm from "@/components/ReviewForm";

interface Address {
  id: string;
  name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phone?: string;
  is_default?: boolean;
}

interface Profile {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber: string;
  photoURL: string;
}

type Tab = "profile" | "addresses" | "orders" | "offers";

function AccountPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [addressLoading, setAddressLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedProductForReview, setSelectedProductForReview] = useState<{ productId: string; productSlug: string } | null>(null);

  // Edit states
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingAddress, setEditingAddress] = useState<string | null>(null);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [profileForm, setProfileForm] = useState({ displayName: "", phoneNumber: "" });
  const { showError, showSuccess } = useToast();
  const [addressForm, setAddressForm] = useState({
    name: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    phone: "",
    is_default: false,
  });

  useEffect(() => {
    if (!user) {
      router.push("/login?callbackUrl=/account");
      return;
    }

    // Check for tab query parameter
    const tabParam = searchParams.get("tab");
    if (tabParam && ["profile", "addresses", "orders", "offers"].includes(tabParam)) {
      setActiveTab(tabParam as Tab);
    }

    fetchProfile();
    fetchOrders();
    fetchAddresses();
    fetchOffers();
  }, [user, router, searchParams]);

  // NextAuth handles authentication via cookies, no token needed

  const fetchProfile = async () => {
    if (!user) return;
    try {
      // NextAuth handles authentication via cookies
      const response = await fetch("/api/user/profile");
      const data = await response.json();
      if (data.success) {
        setProfile(data.profile);
        setProfileForm({
          displayName: data.profile.displayName || "",
          phoneNumber: data.profile.phoneNumber || "",
        });
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      // API now uses session-based authentication, no need to pass user_id
      const response = await fetch(`/api/orders`);
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders || []);
      } else {
        console.error("Failed to fetch orders:", data.error);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const fetchAddresses = async () => {
    if (!user) return;
    try {
      setAddressLoading(true);
      // NextAuth handles authentication via cookies
      const response = await fetch("/api/addresses");
      const data = await response.json();
      if (data.success) {
        setAddresses(data.addresses || []);
      }
    } catch (error) {
    } finally {
      setAddressLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    try {
      setProfileLoading(true);
      // NextAuth handles authentication via cookies
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileForm),
      });

      const data = await response.json();
      if (data.success) {
        setProfile(data.profile);
        setEditingProfile(false);
        // Profile updated in MongoDB via API
        showSuccess("Profile updated successfully");
      } else {
        showError(data.error || "Failed to update profile");
      }
    } catch (error) {
      showError("Failed to update profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const saveAddress = async () => {
    if (!user) return;
    try {
      setAddressLoading(true);
      // NextAuth handles authentication via cookies
      const url = editingAddress
        ? `/api/addresses/${editingAddress}`
        : "/api/addresses";
      const method = editingAddress ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(addressForm),
      });

      const data = await response.json();
      if (data.success) {
        await fetchAddresses();
        setEditingAddress(null);
        setShowAddAddress(false);
        resetAddressForm();
        showSuccess("Address saved successfully");
      } else {
        showError(data.error || "Failed to save address");
      }
    } catch (error) {
      showError("Failed to save address");
    } finally {
      setAddressLoading(false);
    }
  };

  const deleteAddress = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    if (!user) return;

    try {
      setAddressLoading(true);
      // NextAuth handles authentication via cookies
      const response = await fetch(`/api/addresses/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        await fetchAddresses();
        showSuccess("Address deleted successfully");
      } else {
        showError(data.error || "Failed to delete address");
      }
    } catch (error) {
      showError("Failed to delete address");
    } finally {
      setAddressLoading(false);
    }
  };

  const editAddress = (address: Address) => {
    setAddressForm({
      name: address.name,
      address_line1: address.address_line1,
      address_line2: address.address_line2 || "",
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      country: address.country,
      phone: address.phone || "",
      is_default: address.is_default || false,
    });
    setEditingAddress(address.id);
    setShowAddAddress(true);
  };

  const resetAddressForm = () => {
    setAddressForm({
      name: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      phone: "",
      is_default: false,
    });
    setEditingAddress(null);
  };

  const fetchOffers = async () => {
    if (!user) return;
    try {
      setOffersLoading(true);
      const response = await fetch(`/api/offers?customer_email=${encodeURIComponent(user.email || "")}&customer_id=${user.id || user.uid || ""}`);
      const data = await response.json();
      if (data.success && data.offers) {
        setOffers(data.offers);
      }
    } catch (error) {
      console.error("Failed to fetch offers:", error);
    } finally {
      setOffersLoading(false);
    }
  };


  const copyOfferCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showSuccess("Offer code copied to clipboard!");
  };

  if (!user) {
    return null; // Will redirect
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200";
      case "confirmed":
        return "bg-blue-100 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300";
      case "processing":
        return "bg-yellow-100 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-300";
      case "packing":
        return "bg-purple-100 dark:bg-purple-950/30 text-purple-800 dark:text-purple-300";
      case "packed":
        return "bg-indigo-100 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-300";
      case "shipped":
        return "bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-300";
      case "delivered":
        return "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300";
      case "cancelled":
        return "bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-300";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "packing":
      case "packed":
        return <Package className="h-4 w-4" />;
      case "shipped":
        return <Truck className="h-4 w-4" />;
      case "delivered":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50/30 to-white dark:from-black dark:via-black dark:to-black">
      <Header />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-8">
        <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-light mb-6 md:mb-8 tracking-tight text-gray-900 dark:text-white">My Account</h1>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-white/10 mb-4 md:mb-6 overflow-x-auto">
          <nav className="flex space-x-2 sm:space-x-4 md:space-x-6 min-w-max">
            <button
              onClick={() => setActiveTab("profile")}
              className={`py-2 sm:py-3 md:py-4 px-1 border-b-2 font-semibold text-xs sm:text-sm transition-all duration-300 relative whitespace-nowrap ${
                activeTab === "profile"
                  ? "border-[#D4AF37] text-[#D4AF37]"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Profile</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("addresses")}
              className={`py-2 sm:py-3 md:py-4 px-1 border-b-2 font-semibold text-xs sm:text-sm transition-all duration-300 relative whitespace-nowrap ${
                activeTab === "addresses"
                  ? "border-[#D4AF37] text-[#D4AF37]"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Addresses</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`py-2 sm:py-3 md:py-4 px-1 border-b-2 font-semibold text-xs sm:text-sm transition-all duration-300 relative whitespace-nowrap ${
                activeTab === "orders"
                  ? "border-[#D4AF37] text-[#D4AF37]"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Orders</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("offers")}
              className={`py-2 sm:py-3 md:py-4 px-1 border-b-2 font-semibold text-xs sm:text-sm transition-all duration-300 relative whitespace-nowrap ${
                activeTab === "offers"
                  ? "border-[#D4AF37] text-[#D4AF37]"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Tag className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Offers</span>
                {offers.length > 0 && (
                  <span className="bg-[#D4AF37] text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full">
                    {offers.length}
                  </span>
                )}
              </div>
            </button>
          </nav>
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-4 md:space-y-6">
            <div className="glass-card rounded-xl md:rounded-2xl border border-gray-200/50 dark:border-white/10 p-4 sm:p-6 md:p-8 shadow-sm backdrop-blur-md">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 md:mb-6">
                <div>
                  <h2 className="font-serif text-xl sm:text-2xl font-medium mb-1 text-gray-900 dark:text-white">Account Settings</h2>
                  <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Manage your account information and preferences</p>
                </div>
                {!editingProfile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingProfile(true)}
                    className="border-2 border-gray-300 dark:border-white/20 hover:border-[#D4AF37] dark:hover:border-[#D4AF37] rounded-lg sm:rounded-xl text-gray-900 dark:text-white text-xs sm:text-sm w-full sm:w-auto"
                  >
                    <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>

            {loading ? (
              <AccountProfileSkeleton />
            ) : editingProfile ? (
              <div className="space-y-4 md:space-y-6 max-w-md">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-2 text-gray-900 dark:text-white">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.displayName}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, displayName: e.target.value })
                    }
                    className="w-full rounded-lg sm:rounded-xl border border-gray-200 dark:border-white/10 px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-2 text-gray-900 dark:text-white">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile?.email || ""}
                    disabled
                    className="w-full rounded-lg sm:rounded-xl border border-gray-200 dark:border-white/10 px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 dark:bg-[#1a1a1a] text-gray-900 dark:text-white text-sm sm:text-base"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                    Email cannot be changed
                  </p>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-2 text-gray-900 dark:text-white">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profileForm.phoneNumber}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, phoneNumber: e.target.value })
                    }
                    className="w-full rounded-lg sm:rounded-xl border border-gray-200 dark:border-white/10 px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all"
                    placeholder="+91 1234567890"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                  <Button
                    onClick={saveProfile}
                    disabled={profileLoading}
                    className="bg-[#D4AF37] hover:bg-[#C19B2E] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-300 w-full sm:w-auto"
                  >
                    <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    {profileLoading ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingProfile(false);
                      setProfileForm({
                        displayName: profile?.displayName || "",
                        phoneNumber: profile?.phoneNumber || "",
                      });
                    }}
                    className="border-2 border-gray-300 dark:border-white/20 hover:border-[#D4AF37] dark:hover:border-[#D4AF37] px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm hover:bg-[#D4AF37]/5 dark:hover:bg-[#D4AF37]/5 transition-all duration-300 text-gray-900 dark:text-white w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                  <div className="p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#1a1a1a] dark:to-[#0a0a0a] border border-gray-200 dark:border-white/10 hover:shadow-md transition-all duration-300">
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Full Name
                    </span>
                    <p className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white">
                      {profile?.displayName || user.name || "Not set"}
                    </p>
                  </div>
                  <div className="p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#1a1a1a] dark:to-[#0a0a0a] border border-gray-200 dark:border-white/10 hover:shadow-md transition-all duration-300">
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <span className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex items-center justify-center text-xs sm:text-sm">@</span>
                      Email Address
                    </span>
                    <p className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white break-all">
                      {profile?.email || user.email}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1.5">Email cannot be changed</p>
                  </div>
                  <div className="p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#1a1a1a] dark:to-[#0a0a0a] border border-gray-200 dark:border-white/10 hover:shadow-md transition-all duration-300">
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <span className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex items-center justify-center text-xs sm:text-sm">📱</span>
                      Phone Number
                    </span>
                    <p className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white">
                      {profile?.phoneNumber || "Not set"}
                    </p>
                  </div>
                  <div className="p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#D4AF37]/5 to-[#C19B2E]/5 dark:from-[#D4AF37]/10 dark:to-[#C19B2E]/10 border border-[#D4AF37]/20 dark:border-[#D4AF37]/30 hover:shadow-md transition-all duration-300">
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Total Orders
                    </span>
                    <p className="font-semibold text-base sm:text-lg text-[#D4AF37]">
                      {orders.length}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1.5">{orders.filter(o => o.status === "delivered").length} delivered</p>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        )}

        {/* Addresses Tab */}
        {activeTab === "addresses" && (
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="font-serif text-xl sm:text-2xl font-medium text-gray-900 dark:text-white">Saved Addresses</h2>
              {!showAddAddress && (
                <Button
                  onClick={() => {
                    resetAddressForm();
                    setShowAddAddress(true);
                  }}
                  className="bg-[#D4AF37] hover:bg-[#C19B2E] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-300 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
                  Add New Address
                </Button>
              )}
            </div>

            {showAddAddress && (
              <div className="glass-card rounded-xl md:rounded-2xl border border-gray-200/50 dark:border-white/10 p-4 sm:p-6 md:p-8 shadow-sm backdrop-blur-md">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h3 className="font-serif text-lg sm:text-xl font-medium text-gray-900 dark:text-white">
                    {editingAddress ? "Edit Address" : "Add New Address"}
                  </h3>
                  <button
                    onClick={() => {
                      setShowAddAddress(false);
                      resetAddressForm();
                    }}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold mb-2 text-gray-900 dark:text-white">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={addressForm.name}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, name: e.target.value })
                      }
                      className="w-full rounded-lg sm:rounded-xl border border-gray-200 dark:border-white/10 px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold mb-2 text-gray-900 dark:text-white">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={addressForm.phone}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, phone: e.target.value })
                      }
                      className="w-full rounded-lg sm:rounded-xl border border-gray-200 dark:border-white/10 px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs sm:text-sm font-semibold mb-2 text-gray-900 dark:text-white">
                      Address Line 1 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={addressForm.address_line1}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, address_line1: e.target.value })
                      }
                      className="w-full rounded-lg sm:rounded-xl border border-gray-200 dark:border-white/10 px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs sm:text-sm font-semibold mb-2 text-gray-900 dark:text-white">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      value={addressForm.address_line2}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, address_line2: e.target.value })
                      }
                      className="w-full rounded-lg sm:rounded-xl border border-gray-200 dark:border-white/10 px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold mb-2 text-gray-900 dark:text-white">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, city: e.target.value })
                      }
                      className="w-full rounded-lg sm:rounded-xl border border-gray-200 dark:border-white/10 px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold mb-2 text-gray-900 dark:text-white">
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={addressForm.state}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, state: e.target.value })
                      }
                      className="w-full rounded-lg sm:rounded-xl border border-gray-200 dark:border-white/10 px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold mb-2 text-gray-900 dark:text-white">
                      Pincode <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={addressForm.pincode}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, pincode: e.target.value })
                      }
                      className="w-full rounded-lg sm:rounded-xl border border-gray-200 dark:border-white/10 px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold mb-2 text-gray-900 dark:text-white">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={addressForm.country}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, country: e.target.value })
                      }
                      className="w-full rounded-lg sm:rounded-xl border border-gray-200 dark:border-white/10 px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-2 sm:gap-3">
                      <input
                        type="checkbox"
                        checked={addressForm.is_default}
                        onChange={(e) =>
                          setAddressForm({ ...addressForm, is_default: e.target.checked })
                        }
                        className="h-4 w-4 sm:h-5 sm:w-5 text-[#D4AF37] rounded focus:ring-[#D4AF37]"
                      />
                      <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Set as default address</span>
                    </label>
                  </div>
                  <div className="sm:col-span-2 flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                    <Button
                      onClick={saveAddress}
                      disabled={addressLoading}
                      className="bg-[#D4AF37] hover:bg-[#C19B2E] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-300 w-full sm:w-auto"
                    >
                      <Save className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
                      {addressLoading ? "Saving..." : "Save Address"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddAddress(false);
                        resetAddressForm();
                      }}
                      className="border-2 border-gray-300 dark:border-white/20 hover:border-[#D4AF37] dark:hover:border-[#D4AF37] px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm hover:bg-[#D4AF37]/5 dark:hover:bg-[#D4AF37]/5 transition-all duration-300 text-gray-900 dark:text-white w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {addressLoading && !showAddAddress ? (
              <AccountAddressesSkeleton />
            ) : addresses.length === 0 && !showAddAddress ? (
              <div className="glass-card rounded-xl md:rounded-2xl border border-gray-200/50 dark:border-white/10 p-8 sm:p-12 md:p-16 text-center shadow-sm backdrop-blur-md">
                <MapPin className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4 sm:mb-6" />
                <p className="text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 text-base sm:text-lg">No saved addresses yet.</p>
                <Button
                  onClick={() => {
                    resetAddressForm();
                    setShowAddAddress(true);
                  }}
                  className="bg-[#D4AF37] hover:bg-[#C19B2E] text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
                  Add Your First Address
                </Button>
              </div>
            ) : (
              !showAddAddress && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className="glass-card rounded-xl md:rounded-2xl border border-gray-200/50 dark:border-white/10 p-4 sm:p-5 md:p-6 relative shadow-sm hover:shadow-md transition-all duration-300 backdrop-blur-md"
                    >
                      {address.is_default && (
                        <span className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-gradient-to-r from-[#D4AF37] to-[#C19B2E] text-white text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-medium shadow-sm">
                          Default
                        </span>
                      )}
                      <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 pr-16 sm:pr-20">
                        <p className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white">{address.name}</p>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                          {address.address_line1}
                          {address.address_line2 && `, ${address.address_line2}`}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          {address.city}, {address.state} {address.pincode}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{address.country}</p>
                        {address.phone && (
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Phone: {address.phone}</p>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editAddress(address)}
                          className="border-2 border-gray-300 dark:border-white/20 hover:border-[#D4AF37] dark:hover:border-[#D4AF37] rounded-lg sm:rounded-xl hover:bg-[#D4AF37]/5 dark:hover:bg-[#D4AF37]/5 transition-all duration-300 text-gray-900 dark:text-white text-xs sm:text-sm w-full sm:w-auto"
                        >
                          <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteAddress(address.id)}
                          className="border-2 border-red-300 dark:border-red-500/50 hover:border-red-500 dark:hover:border-red-500 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 rounded-lg sm:rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-300 text-xs sm:text-sm w-full sm:w-auto"
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="glass-card rounded-xl md:rounded-2xl border border-gray-200/50 dark:border-white/10 p-4 sm:p-6 md:p-8 shadow-sm backdrop-blur-md">
            <h2 className="font-serif text-xl sm:text-2xl font-medium mb-4 sm:mb-6 md:mb-8 text-gray-900 dark:text-white">Order History</h2>
            {loading ? (
              <AccountOrdersSkeleton />
            ) : orders.length === 0 ? (
              <div className="text-center py-8 sm:py-12 md:py-16">
                <Package className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4 sm:mb-6" />
                <p className="text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 text-base sm:text-lg">No orders yet.</p>
                <Link href="/products">
                  <Button className="bg-[#D4AF37] hover:bg-[#C19B2E] text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-300">
                    Start Shopping
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4 md:space-y-6">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="border-2 border-gray-200 dark:border-white/10 rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 hover:shadow-lg transition-all duration-300 glass-card backdrop-blur-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-base sm:text-lg md:text-xl mb-1 sm:mb-2 text-gray-900 dark:text-white break-words">{order.order_number}</div>
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          {new Date(order.created_at).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                      <span
                        className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg sm:rounded-xl flex items-center gap-1.5 sm:gap-2 font-medium shadow-sm whitespace-nowrap ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusIcon(order.status)}
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>

                    {order.tracking_number && (
                      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                          <span className="text-blue-800 dark:text-blue-300 font-medium break-words">
                            Tracking:{" "}
                            <span className="font-mono font-semibold">
                              {order.tracking_number}
                            </span>
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Shipping Address */}
                    <div className="bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
                      <h4 className="font-semibold text-xs sm:text-sm mb-2 flex items-center gap-1.5 sm:gap-2 text-gray-900 dark:text-white">
                        <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Shipping Address
                      </h4>
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 space-y-0.5 sm:space-y-1">
                        <p className="font-medium text-gray-900 dark:text-white">{order.shipping_address.name}</p>
                        <p>{order.shipping_address.address_line1}</p>
                        {order.shipping_address.address_line2 && (
                          <p>{order.shipping_address.address_line2}</p>
                        )}
                        <p>
                          {order.shipping_address.city}, {order.shipping_address.state}{" "}
                          {order.shipping_address.pincode}
                        </p>
                        <p>{order.shipping_address.country}</p>
                      </div>
                    </div>

                    {order.status === "cancelled" && order.refund_status && (
                      <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800/50 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                          <span className="text-yellow-800 dark:text-yellow-300 font-medium">
                            Refund: <span className="font-semibold capitalize">{order.refund_status}</span>
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Order Items with Review Buttons for Delivered Orders */}
                    {order.items && order.items.length > 0 && (
                      <div className="bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
                        <h4 className="font-semibold text-xs sm:text-sm mb-3 flex items-center gap-1.5 sm:gap-2 text-gray-900 dark:text-white">
                          <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          Order Items
                        </h4>
                        <div className="space-y-3">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex items-start justify-between gap-3 pb-3 border-b border-gray-200 dark:border-white/10 last:border-0 last:pb-0">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-xs sm:text-sm text-gray-900 dark:text-white mb-1">{item.title}</p>
                                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                                  Qty: {item.quantity} × ₹{item.price.toFixed(2)} = ₹{(item.price * item.quantity).toFixed(2)}
                                </p>
                              </div>
                              {order.status === "delivered" && (
                                <Button
                                  onClick={async () => {
                                    // Fetch product slug from product_id
                                    try {
                                      const response = await fetch(`/api/products/by-id/${item.product_id}`);
                                      const data = await response.json();
                                      if (data.success && data.product) {
                                        setSelectedProductForReview({
                                          productId: item.product_id,
                                          productSlug: data.product.slug,
                                        });
                                        setShowReviewForm(true);
                                      } else {
                                        showError("Could not load product details. Please try again.");
                                      }
                                    } catch (error) {
                                      showError("Failed to load product. Please try again.");
                                    }
                                  }}
                                  size="sm"
                                  className="bg-[#D4AF37] hover:bg-[#C19B2E] text-white text-[10px] sm:text-xs whitespace-nowrap"
                                >
                                  <Star className="h-3 w-3 mr-1" />
                                  Review
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-white/10">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1 sm:mb-2">
                          {order.items.length} item(s) • ₹{order.total.toFixed(2)}
                        </div>
                        <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500">
                          Payment: {order.payment_method.toUpperCase()} ({order.payment_status})
                        </div>
                      </div>
                      <Link href={`/account/orders/${order.id}`} className="w-full sm:w-auto">
                        <Button variant="outline" size="sm" className="border-2 border-gray-300 dark:border-white/20 hover:border-[#D4AF37] dark:hover:border-[#D4AF37] rounded-lg sm:rounded-xl hover:bg-[#D4AF37]/5 dark:hover:bg-[#D4AF37]/5 transition-all duration-300 text-gray-900 dark:text-white text-xs sm:text-sm w-full sm:w-auto">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Offers Tab */}
        {activeTab === "offers" && (
          <div className="space-y-4 md:space-y-6">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-medium mb-1 sm:mb-2 text-gray-900 dark:text-white">My Personal Offers</h2>
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                Special offers exclusively for you
              </p>
            </div>

            {offersLoading ? (
              <AccountOffersSkeleton />
            ) : offers.length === 0 ? (
              <div className="glass-card rounded-xl md:rounded-2xl border border-gray-200/50 dark:border-white/10 p-8 sm:p-12 md:p-16 text-center shadow-sm backdrop-blur-md">
                <Tag className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4 sm:mb-6" />
                <p className="text-gray-600 dark:text-gray-400 mb-2 text-base sm:text-lg">No personal offers available</p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
                  Check back later for exclusive offers tailored just for you!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                {offers.map((offer) => {
                  const now = new Date();
                  const validUntil = new Date(offer.valid_until);
                  const isValid = now <= validUntil && offer.is_active;
                  const usageLeft = offer.usage_limit ? offer.usage_limit - offer.used_count : null;

                  return (
                    <div
                      key={offer.id}
                      className={`bg-gradient-to-br rounded-xl md:rounded-2xl border-2 p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-lg transition-all duration-300 backdrop-blur-sm ${
                        isValid
                          ? "from-[#D4AF37]/10 via-[#C19B2E]/5 to-[#D4AF37]/10 dark:from-[#D4AF37]/20 dark:via-[#C19B2E]/10 dark:to-[#D4AF37]/20 border-[#D4AF37]/30 dark:border-[#D4AF37]/40"
                          : "from-gray-50 to-gray-100 dark:from-[#1a1a1a] dark:to-[#0a0a0a] border-gray-200 dark:border-white/10 opacity-60"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                            <Tag className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${isValid ? "text-[#D4AF37]" : "text-gray-400 dark:text-gray-600"}`} />
                            <h3 className="font-serif text-base sm:text-lg md:text-xl font-medium text-gray-900 dark:text-white truncate">{offer.title}</h3>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-3">{offer.description}</p>
                        </div>
                        <div
                          className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap flex-shrink-0 ${
                            isValid
                              ? "bg-gradient-to-r from-[#D4AF37] to-[#C19B2E] text-white"
                              : "bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {offer.discount_type === "percentage"
                            ? `${offer.discount_value}% OFF`
                            : `₹${offer.discount_value} OFF`}
                        </div>
                      </div>

                      {offer.code && (
                        <div className="bg-white dark:bg-[#0a0a0a] rounded-lg sm:rounded-xl p-2.5 sm:p-3 mb-3 sm:mb-4 border border-gray-200 dark:border-white/10">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1">Offer Code</p>
                              <p className="font-mono font-semibold text-sm sm:text-base md:text-lg text-gray-900 dark:text-white truncate">{offer.code}</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyOfferCode(offer.code!)}
                              className="border-2 border-[#D4AF37] hover:bg-[#D4AF37] hover:text-white dark:hover:text-white rounded-lg text-gray-900 dark:text-white text-xs sm:text-sm flex-shrink-0"
                            >
                              <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                              Copy
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
                        {offer.min_order_amount && (
                          <p>
                            <span className="font-semibold">Min. Order:</span> ₹
                            {offer.min_order_amount}
                          </p>
                        )}
                        {offer.max_discount && offer.discount_type === "percentage" && (
                          <p>
                            <span className="font-semibold">Max Discount:</span> ₹
                            {offer.max_discount}
                          </p>
                        )}
                        <p>
                          <span className="font-semibold">Valid Until:</span>{" "}
                          {new Date(offer.valid_until).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        {usageLeft !== null && (
                          <p>
                            <span className="font-semibold">Usage Left:</span> {usageLeft} time
                            {usageLeft !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>

                      {!isValid && (
                        <div className="mt-3 sm:mt-4 bg-gray-200 dark:bg-gray-800 rounded-lg p-2 text-center">
                          <p className="text-[10px] sm:text-xs font-semibold text-gray-600 dark:text-gray-400">Offer Expired</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />

      {/* Review Form Dialog */}
      {selectedProductForReview && (
        <ReviewForm
          open={showReviewForm}
          onOpenChange={(open) => {
            setShowReviewForm(open);
            if (!open) {
              setSelectedProductForReview(null);
            }
          }}
          onReviewSubmitted={() => {
            // Refresh orders to show updated review status if needed
            fetchOrders();
          }}
          productId={selectedProductForReview.productId}
          productSlug={selectedProductForReview.productSlug}
          skipPurchaseCheck={true}
        />
      )}
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50/30 to-white dark:from-black dark:via-black dark:to-black">
        <Header />
        <main className="max-w-7xl mx-auto px-6 py-12 md:py-16">
          <AccountProfileSkeleton />
        </main>
        <Footer />
      </div>
    }>
      <AccountPageContent />
    </Suspense>
  );
}
