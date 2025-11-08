"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import type { Order } from "@/lib/orders-types";
import { auth } from "@/lib/firebaseClient";
import { updateProfile } from "firebase/auth";
import { useToast } from "@/components/ToastProvider";

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

type Tab = "profile" | "addresses" | "orders";

export default function AccountPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [addressLoading, setAddressLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

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

    fetchProfile();
    fetchOrders();
    fetchAddresses();
  }, [user, router]);

  const getAuthToken = async (): Promise<string | null> => {
    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch {
      return null;
    }
  };

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      const response = await fetch(`/api/orders?user_id=${user?.uid}`);
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch (error) {
    }
  };

  const fetchAddresses = async () => {
    if (!user) return;
    try {
      setAddressLoading(true);
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch("/api/addresses", {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileForm),
      });

      const data = await response.json();
      if (data.success) {
        setProfile(data.profile);
        setEditingProfile(false);
        // Update Firebase user display name
        try {
          const currentUser = auth.currentUser;
          if (currentUser) {
            await updateProfile(currentUser, { displayName: profileForm.displayName });
          }
        } catch (error) {
          // Don't fail the whole operation if Firebase update fails
        }
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
      const token = await getAuthToken();
      if (!token) return;

      const url = editingAddress
        ? `/api/addresses/${editingAddress}`
        : "/api/addresses";
      const method = editingAddress ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
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
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch(`/api/addresses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
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

  if (!user) {
    return null; // Will redirect
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "packing":
        return "bg-purple-100 text-purple-800";
      case "packed":
        return "bg-indigo-100 text-indigo-800";
      case "shipped":
        return "bg-green-100 text-green-800";
      case "delivered":
        return "bg-emerald-100 text-emerald-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
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
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50/30 to-white">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        <h1 className="font-serif text-4xl md:text-5xl font-light mb-10 tracking-tight">My Account</h1>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("profile")}
              className={`py-4 px-1 border-b-2 font-semibold text-sm transition-all duration-300 relative ${
                activeTab === "profile"
                  ? "border-[#D4AF37] text-[#D4AF37]"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile
              </div>
            </button>
            <button
              onClick={() => setActiveTab("addresses")}
              className={`py-4 px-1 border-b-2 font-semibold text-sm transition-all duration-300 relative ${
                activeTab === "addresses"
                  ? "border-[#D4AF37] text-[#D4AF37]"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Addresses
              </div>
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`py-4 px-1 border-b-2 font-semibold text-sm transition-all duration-300 relative ${
                activeTab === "orders"
                  ? "border-[#D4AF37] text-[#D4AF37]"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Orders
              </div>
            </button>
          </nav>
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-serif text-2xl font-medium">Account Information</h2>
              {!editingProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingProfile(true)}
                  className="border-2 border-gray-300 hover:border-[#D4AF37] rounded-xl"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>

            {loading ? (
              <p className="text-gray-600">Loading...</p>
            ) : editingProfile ? (
              <div className="space-y-6 max-w-md">
                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-900">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.displayName}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, displayName: e.target.value })
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-900">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile?.email || ""}
                    disabled
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Email cannot be changed
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-900">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profileForm.phoneNumber}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, phoneNumber: e.target.value })
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all"
                    placeholder="+91 1234567890"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={saveProfile}
                    disabled={profileLoading}
                    className="bg-[#D4AF37] hover:bg-[#C19B2E] text-white px-6 py-6 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <Save className="h-4 w-4 mr-2" />
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
                    className="border-2 border-gray-300 hover:border-[#D4AF37] px-6 py-6 rounded-xl font-medium hover:bg-[#D4AF37]/5 transition-all duration-300"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                  <div className="p-4 rounded-xl bg-gray-50">
                    <span className="text-sm text-gray-600 font-medium">Name:</span>
                    <p className="font-semibold text-lg mt-1">{profile?.displayName || user.displayName || "N/A"}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50">
                    <span className="text-sm text-gray-600 font-medium">Email:</span>
                    <p className="font-semibold text-lg mt-1">{profile?.email || user.email}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50">
                    <span className="text-sm text-gray-600 font-medium">Phone:</span>
                    <p className="font-semibold text-lg mt-1">
                      {profile?.phoneNumber || user.phoneNumber || "Not set"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Addresses Tab */}
        {activeTab === "addresses" && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl font-medium">Saved Addresses</h2>
              {!showAddAddress && (
                <Button
                  onClick={() => {
                    resetAddressForm();
                    setShowAddAddress(true);
                  }}
                  className="bg-[#D4AF37] hover:bg-[#C19B2E] text-white px-6 py-6 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add New Address
                </Button>
              )}
            </div>

            {showAddAddress && (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-serif text-xl font-medium">
                    {editingAddress ? "Edit Address" : "Add New Address"}
                  </h3>
                  <button
                    onClick={() => {
                      setShowAddAddress(false);
                      resetAddressForm();
                    }}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-gray-900">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={addressForm.name}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, name: e.target.value })
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-gray-900">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={addressForm.phone}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, phone: e.target.value })
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-3 text-gray-900">
                      Address Line 1 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={addressForm.address_line1}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, address_line1: e.target.value })
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-3 text-gray-900">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      value={addressForm.address_line2}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, address_line2: e.target.value })
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-gray-900">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, city: e.target.value })
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-gray-900">
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={addressForm.state}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, state: e.target.value })
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-gray-900">
                      Pincode <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={addressForm.pincode}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, pincode: e.target.value })
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-gray-900">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={addressForm.country}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, country: e.target.value })
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={addressForm.is_default}
                        onChange={(e) =>
                          setAddressForm({ ...addressForm, is_default: e.target.checked })
                        }
                        className="h-5 w-5 text-[#D4AF37] rounded focus:ring-[#D4AF37]"
                      />
                      <span className="text-sm font-medium">Set as default address</span>
                    </label>
                  </div>
                  <div className="md:col-span-2 flex gap-3 pt-2">
                    <Button
                      onClick={saveAddress}
                      disabled={addressLoading}
                      className="bg-[#D4AF37] hover:bg-[#C19B2E] text-white px-6 py-6 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <Save className="h-5 w-5 mr-2" />
                      {addressLoading ? "Saving..." : "Save Address"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddAddress(false);
                        resetAddressForm();
                      }}
                      className="border-2 border-gray-300 hover:border-[#D4AF37] px-6 py-6 rounded-xl font-medium hover:bg-[#D4AF37]/5 transition-all duration-300"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {addressLoading && !showAddAddress ? (
              <p className="text-gray-600">Loading addresses...</p>
            ) : addresses.length === 0 && !showAddAddress ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center shadow-sm">
                <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-6" />
                <p className="text-gray-600 mb-6 text-lg">No saved addresses yet.</p>
                <Button
                  onClick={() => {
                    resetAddressForm();
                    setShowAddAddress(true);
                  }}
                  className="bg-[#D4AF37] hover:bg-[#C19B2E] text-white px-8 py-6 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Your First Address
                </Button>
              </div>
            ) : (
              !showAddAddress && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className="bg-white rounded-2xl border border-gray-200 p-6 relative shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      {address.is_default && (
                        <span className="absolute top-4 right-4 bg-gradient-to-r from-[#D4AF37] to-[#C19B2E] text-white text-xs px-3 py-1.5 rounded-full font-medium shadow-sm">
                          Default
                        </span>
                      )}
                      <div className="space-y-3 mb-6">
                        <p className="font-semibold text-lg">{address.name}</p>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {address.address_line1}
                          {address.address_line2 && `, ${address.address_line2}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          {address.city}, {address.state} {address.pincode}
                        </p>
                        <p className="text-sm text-gray-600">{address.country}</p>
                        {address.phone && (
                          <p className="text-sm text-gray-600">Phone: {address.phone}</p>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editAddress(address)}
                          className="border-2 border-gray-300 hover:border-[#D4AF37] rounded-xl hover:bg-[#D4AF37]/5 transition-all duration-300"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteAddress(address.id)}
                          className="border-2 border-red-300 hover:border-red-500 text-red-600 hover:text-red-700 rounded-xl hover:bg-red-50 transition-all duration-300"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
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
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h2 className="font-serif text-2xl font-medium mb-8">Order History</h2>
            {loading ? (
              <p className="text-gray-600">Loading orders...</p>
            ) : orders.length === 0 ? (
              <div className="text-center py-16">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-6" />
                <p className="text-gray-600 mb-6 text-lg">No orders yet.</p>
                <Link href="/products">
                  <Button className="bg-[#D4AF37] hover:bg-[#C19B2E] text-white px-8 py-6 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300">
                    Start Shopping
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="border-2 border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="font-semibold text-xl mb-2">{order.order_number}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                      <span
                        className={`px-4 py-2 text-sm rounded-xl flex items-center gap-2 font-medium shadow-sm ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusIcon(order.status)}
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>

                    {order.tracking_number && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Truck className="h-5 w-5 text-blue-600" />
                          <span className="text-blue-800 font-medium">
                            Tracking:{" "}
                            <span className="font-mono font-semibold">
                              {order.tracking_number}
                            </span>
                          </span>
                        </div>
                      </div>
                    )}

                    {order.status === "cancelled" && order.refund_status && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <AlertCircle className="h-5 w-5 text-yellow-600" />
                          <span className="text-yellow-800 font-medium">
                            Refund: <span className="font-semibold capitalize">{order.refund_status}</span>
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex-1">
                        <div className="text-sm text-gray-600 mb-2">
                          {order.items.length} item(s) • ₹{order.total.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Payment: {order.payment_method.toUpperCase()} ({order.payment_status})
                        </div>
                      </div>
                      <Link href={`/account/orders/${order.id}`}>
                        <Button variant="outline" size="sm" className="border-2 border-gray-300 hover:border-[#D4AF37] rounded-xl hover:bg-[#D4AF37]/5 transition-all duration-300">
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
      </main>
      <Footer />
    </div>
  );
}
