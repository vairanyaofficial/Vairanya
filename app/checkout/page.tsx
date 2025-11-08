"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ArrowLeft, Tag, X, MapPin, Plus, CreditCard, Wallet, Sparkles, CheckCircle2, User } from "lucide-react";
import Link from "next/link";
import type { Offer } from "@/lib/offers-types";

interface SavedAddress {
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

interface CheckoutFormData {
  name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  payment_method: "razorpay" | "cod" | "upi";
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, getSubtotal, getShipping, getTotal, getDiscount, appliedOffer, applyOffer, removeOffer, clearCart, isLoading: cartLoading } = useCart();
  const { showError, showSuccess } = useToast();
  const [formData, setFormData] = useState<CheckoutFormData>({
    name: "",
    email: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    payment_method: "razorpay",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutFormData, string>>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [offerCode, setOfferCode] = useState("");
  const [isApplyingOffer, setIsApplyingOffer] = useState(false);
  const [saveAddress, setSaveAddress] = useState(true);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [availableOffers, setAvailableOffers] = useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [showAllOffers, setShowAllOffers] = useState(false);

  // Require login for checkout
  useEffect(() => {
    // Wait a bit for auth to initialize
    const timer = setTimeout(() => {
      setIsCheckingAuth(false);
      
      if (!user && !hasRedirected) {
        setHasRedirected(true);
        router.replace("/login?callbackUrl=/checkout");
        return;
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [user, router, hasRedirected]);

  // Pre-fill form with user data (separate effect to avoid redirect loop)
  useEffect(() => {
    if (user && user.email && !formData.email) {
      setFormData((prev) => ({
        ...prev,
        email: user.email || "",
        name: user.displayName || "",
      }));
    }
  }, [user]);

  // Fetch saved addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!user) return;
      try {
        setLoadingAddresses(true);
        const token = await user.getIdToken();
        if (!token) return;

        const response = await fetch("/api/addresses", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.success && data.addresses) {
          setSavedAddresses(data.addresses);
          // Auto-select default address if available
          const defaultAddress = data.addresses.find((addr: SavedAddress) => addr.is_default);
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id);
            fillAddressForm(defaultAddress);
          } else if (data.addresses.length > 0) {
            // Select first address if no default
            setSelectedAddressId(data.addresses[0].id);
            fillAddressForm(data.addresses[0]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch addresses:", error);
      } finally {
        setLoadingAddresses(false);
      }
    };

    if (user) {
      fetchAddresses();
      fetchAvailableOffers();
    }
  }, [user]);

  // Fetch available offers
  const fetchAvailableOffers = async () => {
    if (!user) return;
    try {
      setLoadingOffers(true);
      const response = await fetch(`/api/offers?customer_email=${encodeURIComponent(user.email || "")}&customer_id=${user.uid}`);
      const data = await response.json();
      if (data.success && data.offers) {
        // Filter offers that meet minimum order amount
        const applicableOffers = data.offers.filter((offer: Offer) => {
          if (!offer.min_order_amount) return true;
          return getSubtotal() >= offer.min_order_amount;
        });
        setAvailableOffers(applicableOffers);
      }
    } catch (error) {
      console.error("Failed to fetch offers:", error);
    } finally {
      setLoadingOffers(false);
    }
  };

  // Refetch offers when items change (with debounce)
  useEffect(() => {
    if (user && items.length > 0) {
      const timer = setTimeout(() => {
        fetchAvailableOffers();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [items.length, user]);

  const fillAddressForm = (address: SavedAddress) => {
    setFormData((prev) => ({
      ...prev,
      name: address.name || prev.name,
      phone: address.phone || prev.phone,
      address_line1: address.address_line1,
      address_line2: address.address_line2 || "",
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      country: address.country,
    }));
  };

  const handleAddressSelect = (addressId: string | null) => {
    if (addressId === null) {
      // Use new address
      setUseNewAddress(true);
      setSelectedAddressId(null);
      // Clear address fields
      setFormData((prev) => ({
        ...prev,
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        pincode: "",
      }));
    } else {
      const address = savedAddresses.find((addr) => addr.id === addressId);
      if (address) {
        setSelectedAddressId(addressId);
        setUseNewAddress(false);
        fillAddressForm(address);
      }
    }
  };

  const handleApplyOffer = async () => {
    if (!offerCode.trim()) {
      showError("Please enter an offer code");
      return;
    }

    setIsApplyingOffer(true);
    try {
      const response = await fetch("/api/offers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offer_code: offerCode.trim().toUpperCase(),
          subtotal: getSubtotal(),
          customer_email: user?.email || formData.email || undefined,
          customer_id: user?.uid || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        applyOffer({
          id: data.offer.id,
          title: data.offer.title,
          discount: data.discount,
        });
        showSuccess(`Offer "${data.offer.title}" applied successfully!`);
        setOfferCode("");
        // Refresh available offers
        fetchAvailableOffers();
      } else {
        showError(data.error || "Failed to apply offer");
      }
    } catch (error: any) {
      showError("Failed to apply offer. Please try again.");
    } finally {
      setIsApplyingOffer(false);
    }
  };

  const handleApplyOfferFromList = async (offer: Offer) => {
    if (!offer.code) {
      showError("This offer doesn't have a code");
      return;
    }
    setOfferCode(offer.code);
    setIsApplyingOffer(true);
    try {
      const response = await fetch("/api/offers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offer_code: offer.code.trim().toUpperCase(),
          subtotal: getSubtotal(),
          customer_email: user?.email || formData.email || undefined,
          customer_id: user?.uid || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        applyOffer({
          id: data.offer.id,
          title: data.offer.title,
          discount: data.discount,
        });
        showSuccess(`Offer "${data.offer.title}" applied successfully!`);
        setOfferCode("");
        fetchAvailableOffers();
      } else {
        showError(data.error || "Failed to apply offer");
      }
    } catch (error: any) {
      showError("Failed to apply offer. Please try again.");
    } finally {
      setIsApplyingOffer(false);
    }
  };

  const handleRemoveOffer = () => {
    removeOffer();
    showSuccess("Offer removed");
    fetchAvailableOffers();
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CheckoutFormData, string>> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = "Invalid phone number (10 digits)";
    }
    
    // Only validate address fields if using new address or no saved addresses exist
    // If a saved address is selected, skip address validation (address is already valid)
    const isUsingSavedAddress = savedAddresses.length > 0 && selectedAddressId && !useNewAddress;
    if (!isUsingSavedAddress) {
      if (!formData.address_line1.trim()) newErrors.address_line1 = "Address is required";
      if (!formData.city.trim()) newErrors.city = "City is required";
      if (!formData.state.trim()) newErrors.state = "State is required";
      if (!formData.pincode.trim()) {
        newErrors.pincode = "Pincode is required";
      } else if (!/^[0-9]{6}$/.test(formData.pincode)) {
        newErrors.pincode = "Invalid pincode (6 digits)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);

    try {
      if (formData.payment_method === "razorpay") {
        // Initialize Razorpay payment
        const response = await fetch("/api/razorpay/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Math.round(getTotal() * 100), // Convert to paise
            items,
            customer: {
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
            },
            shipping_address: {
              name: formData.name,
              address_line1: formData.address_line1,
              address_line2: formData.address_line2,
              city: formData.city,
              state: formData.state,
              pincode: formData.pincode,
              country: formData.country,
            },
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to create Razorpay order");
        }

        // Load Razorpay script dynamically
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onerror = () => {
          showError("Failed to load payment gateway. Please refresh and try again.");
          setIsProcessing(false);
        };
        script.onload = () => {
          // Razorpay checkout options for India
          const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_1DP5mmOlF5G5ag",
            amount: data.order.amount, // Amount in paise
            currency: "INR", // Indian Rupees
            name: "Vairanya",
            description: `Order for ${items.length} item${items.length > 1 ? "s" : ""}`,
            order_id: data.order.id,
            image: "/images/logo-ivory.png", // Optional: Add your logo
            handler: async function (response: any) {
              // Verify payment on server
              const verifyResponse = await fetch("/api/razorpay/verify-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderData: {
                    items,
                    total: getTotal(),
                    subtotal: getSubtotal(),
                    shipping: getShipping(),
                    discount: getDiscount(),
                    offer_id: appliedOffer?.id || null,
                    customer: {
                      name: formData.name,
                      email: formData.email,
                      phone: formData.phone,
                    },
                    shipping_address: {
                      name: formData.name,
                      address_line1: formData.address_line1,
                      address_line2: formData.address_line2,
                      city: formData.city,
                      state: formData.state,
                      pincode: formData.pincode,
                      country: formData.country,
                    },
                    payment_method: formData.payment_method,
                    user_id: user?.uid || null, // Add user ID
                  },
                }),
              });

              const verifyData = await verifyResponse.json();

              if (verifyData.success) {
                // Save address only if:
                // 1. Checkbox is checked
                // 2. User is logged in
                // 3. It's a NEW address (not a saved address that's already selected)
                const isUsingSavedAddress = savedAddresses.length > 0 && selectedAddressId && !useNewAddress;
                if (saveAddress && user && !isUsingSavedAddress) {
                  try {
                    const token = await user.getIdToken();
                    if (token) {
                      // Check if address already exists before saving
                      const addressExists = savedAddresses.some((addr) => {
                        return (
                          addr.address_line1.toLowerCase().trim() === formData.address_line1.toLowerCase().trim() &&
                          addr.city.toLowerCase().trim() === formData.city.toLowerCase().trim() &&
                          addr.state.toLowerCase().trim() === formData.state.toLowerCase().trim() &&
                          addr.pincode.trim() === formData.pincode.trim() &&
                          addr.name.toLowerCase().trim() === formData.name.toLowerCase().trim()
                        );
                      });

                      if (!addressExists) {
                        await fetch("/api/addresses", {
                          method: "POST",
                          headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            name: formData.name,
                            address_line1: formData.address_line1,
                            address_line2: formData.address_line2 || "",
                            city: formData.city,
                            state: formData.state,
                            pincode: formData.pincode,
                            country: formData.country,
                            phone: formData.phone,
                            is_default: false,
                          }),
                        });
                      }
                    }
                  } catch (error) {
                    // Don't block order completion if address save fails
                    console.error("Failed to save address:", error);
                  }
                }
                clearCart();
                router.push(`/checkout/success?order_id=${verifyData.order_id}&method=razorpay`);
              } else {
                showError("Payment verification failed. Please contact support.");
                setIsProcessing(false);
              }
            },
            prefill: {
              name: formData.name,
              email: formData.email,
              contact: formData.phone,
            },
            theme: {
              color: "#D4AF37",
            },
          };

          const razorpay = new (window as any).Razorpay(options);
          
          // Handle payment failure
          razorpay.on("payment.failed", function (response: any) {
            showError(`Payment failed: ${response.error?.description || "Please try again."}`);
            setIsProcessing(false);
          });

          // Handle modal close
          razorpay.on("modal.close", function () {
            setIsProcessing(false);
          });

          // Open Razorpay checkout
          razorpay.open();
        };
        document.body.appendChild(script);
      }
    } catch (error: any) {
      showError(error.message || "Failed to initialize payment. Please try again.");
      setIsProcessing(false);
    }

    if (formData.payment_method === "cod") {
        // COD - create order directly in Firestore
        try {
          const codResponse = await fetch("/api/orders/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items,
              total: getTotal(),
              subtotal: getSubtotal(),
              shipping: getShipping(),
              discount: getDiscount(),
              offer_id: appliedOffer?.id || null,
              customer: {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
              },
              shipping_address: {
                name: formData.name,
                address_line1: formData.address_line1,
                address_line2: formData.address_line2,
                city: formData.city,
                state: formData.state,
                pincode: formData.pincode,
                country: formData.country,
              },
              payment_method: formData.payment_method,
              payment_status: "pending",
              status: "confirmed",
              user_id: user?.uid || null,
            }),
          });

          let codData;
          try {
            codData = await codResponse.json();
          } catch (jsonError) {
            // If response is not JSON, show a generic error
            throw new Error(`Server error (${codResponse.status}): ${codResponse.statusText}`);
          }

          if (!codResponse.ok || !codData.success) {
            // Show the actual error message from the server
            const errorMessage = codData.error || codData.details || `Failed to create order (${codResponse.status})`;
            console.error("Order creation failed:", codData);
            showError(errorMessage);
            setIsProcessing(false);
            return;
          }

          // Save address only if:
          // 1. Checkbox is checked
          // 2. User is logged in
          // 3. It's a NEW address (not a saved address that's already selected)
          const isUsingSavedAddress = savedAddresses.length > 0 && selectedAddressId && !useNewAddress;
          if (saveAddress && user && !isUsingSavedAddress) {
            try {
              const token = await user.getIdToken();
              if (token) {
                // Check if address already exists before saving
                const addressExists = savedAddresses.some((addr) => {
                  return (
                    addr.address_line1.toLowerCase().trim() === formData.address_line1.toLowerCase().trim() &&
                    addr.city.toLowerCase().trim() === formData.city.toLowerCase().trim() &&
                    addr.state.toLowerCase().trim() === formData.state.toLowerCase().trim() &&
                    addr.pincode.trim() === formData.pincode.trim() &&
                    addr.name.toLowerCase().trim() === formData.name.toLowerCase().trim()
                  );
                });

                if (!addressExists) {
                  await fetch("/api/addresses", {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      name: formData.name,
                      address_line1: formData.address_line1,
                      address_line2: formData.address_line2 || "",
                      city: formData.city,
                      state: formData.state,
                      pincode: formData.pincode,
                      country: formData.country,
                      phone: formData.phone,
                      is_default: false,
                    }),
                  });
                }
              }
            } catch (error) {
              // Don't block order completion if address save fails
              console.error("Failed to save address:", error);
            }
          }

          clearCart();
          router.push(`/checkout/success?order_id=${codData.order_id}`);
        } catch (error: any) {
          console.error("Order creation error:", error);
          const errorMessage = error.message || "Failed to create order. Please try again.";
          showError(errorMessage);
          setIsProcessing(false);
        }
      }
  };

  // Show loading if checking auth, cart is loading, or if user is not logged in
  if (isCheckingAuth || cartLoading || (!user && !hasRedirected)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
        <Header />
        <main className="max-w-6xl mx-auto px-6 py-12">
          <div className="rounded-lg border bg-white p-12 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600">Loading checkout...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // If user is not logged in and we've already redirected, don't render
  if (!user) {
    return null;
  }

  // Only show empty cart message after cart has finished loading
  if (!cartLoading && items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
        <Header />
        <main className="max-w-6xl mx-auto px-6 py-12">
          <div className="rounded-lg border bg-white p-12 text-center shadow-lg">
            <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h1 className="font-serif text-3xl mb-2">Your cart is empty</h1>
            <p className="text-gray-600 mb-6">Add some products before proceeding to checkout.</p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-5 py-3 rounded bg-gradient-to-r from-[#D4AF37] to-[#C19B2E] text-white hover:from-[#C19B2E] hover:to-[#D4AF37] transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              Go to Products
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-6 md:py-8">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#D4AF37] mb-6 transition-colors font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Continue Shopping
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h1 className="font-serif text-4xl md:text-5xl font-light mb-2 tracking-tight text-gray-900">Checkout</h1>
              <p className="text-gray-600 text-sm">Complete your order details</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Contact Information - Compact */}
              <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/50 p-5 md:p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-gradient-to-br from-[#D4AF37]/10 to-[#C19B2E]/5 rounded-lg">
                    <User className="h-5 w-5 text-[#D4AF37]" />
                  </div>
                  <h2 className="font-serif text-xl md:text-2xl font-medium">Contact Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full rounded-xl border px-3 py-2 transition-all ${
                        errors.name ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37]"
                      } focus:outline-none focus:ring-2`}
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full rounded-xl border px-3 py-2 transition-all ${
                        errors.email ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37]"
                      } focus:outline-none focus:ring-2`}
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className={`w-full rounded-xl border px-3 py-2 transition-all ${
                        errors.phone ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37]"
                      } focus:outline-none focus:ring-2`}
                      placeholder="10 digits"
                    />
                    {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/50 p-5 md:p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-[#D4AF37]/10 to-[#C19B2E]/5 rounded-lg">
                      <MapPin className="h-5 w-5 text-[#D4AF37]" />
                    </div>
                    <h2 className="font-serif text-xl md:text-2xl font-medium">Shipping Address</h2>
                  </div>
                  {savedAddresses.length > 0 && (
                    <Link
                      href="/account?tab=addresses"
                      className="text-xs text-[#D4AF37] hover:underline font-medium"
                    >
                      Manage Addresses
                    </Link>
                  )}
                </div>
                
                {/* Saved Addresses Selection */}
                {loadingAddresses ? (
                  <p className="text-sm text-gray-600 py-4">Loading addresses...</p>
                ) : savedAddresses.length > 0 ? (
                  <div className="space-y-3 mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Saved Address
                    </label>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {savedAddresses.map((address) => (
                        <label
                          key={address.id}
                          className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedAddressId === address.id
                              ? "border-[#D4AF37] bg-[#D4AF37]/5"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="address"
                            value={address.id}
                            checked={selectedAddressId === address.id}
                            onChange={() => handleAddressSelect(address.id)}
                            className="mt-1 h-4 w-4 text-[#D4AF37] focus:ring-[#D4AF37]"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-sm text-gray-900">{address.name}</p>
                              {address.is_default && (
                                <span className="text-xs bg-[#D4AF37] text-white px-2 py-0.5 rounded-full">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600">
                              {address.address_line1}
                              {address.address_line2 && `, ${address.address_line2}`}
                            </p>
                            <p className="text-xs text-gray-600">
                              {address.city}, {address.state} {address.pincode}
                            </p>
                            {address.phone && (
                              <p className="text-xs text-gray-500 mt-1">Phone: {address.phone}</p>
                            )}
                          </div>
                        </label>
                      ))}
                      
                      {/* Add New Address Option */}
                      <label
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          useNewAddress && !selectedAddressId
                            ? "border-[#D4AF37] bg-[#D4AF37]/5"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => handleAddressSelect(null)}
                      >
                        <input
                          type="radio"
                          name="address"
                          value="new"
                          checked={useNewAddress && !selectedAddressId}
                          onChange={() => handleAddressSelect(null)}
                          className="h-4 w-4 text-[#D4AF37] focus:ring-[#D4AF37]"
                        />
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4 text-[#D4AF37]" />
                          <span className="font-medium text-sm text-gray-900">Add New Address</span>
                        </div>
                      </label>
                    </div>
                  </div>
                ) : null}

                {/* Selected Address Summary - Show when saved address is selected */}
                {savedAddresses.length > 0 && selectedAddressId && !useNewAddress && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="h-4 w-4 text-green-600" />
                          <p className="font-semibold text-sm text-green-900">Selected Address</p>
                        </div>
                        {(() => {
                          const selectedAddr = savedAddresses.find(addr => addr.id === selectedAddressId);
                          return selectedAddr ? (
                            <div className="text-sm text-green-800 space-y-1">
                              <p className="font-medium">{selectedAddr.name}</p>
                              <p>{selectedAddr.address_line1}</p>
                              {selectedAddr.address_line2 && <p>{selectedAddr.address_line2}</p>}
                              <p>{selectedAddr.city}, {selectedAddr.state} {selectedAddr.pincode}</p>
                              {selectedAddr.phone && <p className="text-xs text-green-700">Phone: {selectedAddr.phone}</p>}
                            </div>
                          ) : null;
                        })()}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddressSelect(null)}
                        className="border-green-300 text-green-700 hover:bg-green-100 text-xs"
                      >
                        Change
                      </Button>
                    </div>
                  </div>
                )}

                {/* Address Form - Show only when new address is selected or no saved addresses exist */}
                {(savedAddresses.length === 0 || useNewAddress) && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Address Line 1 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.address_line1}
                          onChange={(e) =>
                            setFormData({ ...formData, address_line1: e.target.value })
                          }
                          className={`w-full rounded-xl border px-3 py-2 transition-all ${
                            errors.address_line1 ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37]"
                          } focus:outline-none focus:ring-2`}
                        />
                        {errors.address_line1 && (
                          <p className="mt-1 text-xs text-red-500">{errors.address_line1}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Address Line 2</label>
                        <input
                          type="text"
                          value={formData.address_line2}
                          onChange={(e) =>
                            setFormData({ ...formData, address_line2: e.target.value })
                          }
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          City <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className={`w-full rounded-xl border px-3 py-2 transition-all ${
                            errors.city ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37]"
                          } focus:outline-none focus:ring-2`}
                        />
                        {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          State <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          className={`w-full rounded-xl border px-3 py-2 transition-all ${
                            errors.state ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37]"
                          } focus:outline-none focus:ring-2`}
                        />
                        {errors.state && <p className="mt-1 text-xs text-red-500">{errors.state}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Pincode <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.pincode}
                          onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                          className={`w-full rounded-xl border px-3 py-2 transition-all ${
                            errors.pincode ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37]"
                          } focus:outline-none focus:ring-2`}
                          placeholder="6 digits"
                        />
                        {errors.pincode && (
                          <p className="mt-1 text-xs text-red-500">{errors.pincode}</p>
                        )}
                      </div>
                    </div>
                    {/* Save Address Checkbox - Only show when using new address */}
                    {user && (savedAddresses.length === 0 || useNewAddress) && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={saveAddress}
                            onChange={(e) => setSaveAddress(e.target.checked)}
                            className="h-4 w-4 text-[#D4AF37] rounded focus:ring-[#D4AF37] border-gray-300"
                          />
                          <span className="text-xs font-medium text-gray-700">
                            Save this address for future orders
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Offers & Discounts */}
              <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/50 p-5 md:p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-gradient-to-br from-[#D4AF37]/10 to-[#C19B2E]/5 rounded-lg">
                    <Sparkles className="h-5 w-5 text-[#D4AF37]" />
                  </div>
                  <h2 className="font-serif text-xl md:text-2xl font-medium">Offers & Discounts</h2>
                </div>

                {appliedOffer ? (
                  <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-green-900">{appliedOffer.title}</p>
                          <p className="text-sm text-green-700">You saved ₹{appliedOffer.discount.toFixed(2)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveOffer}
                        className="p-2 hover:bg-green-200 rounded-lg transition-colors"
                      >
                        <X className="h-5 w-5 text-green-600" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Have a coupon code?
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={offerCode}
                        onChange={(e) => setOfferCode(e.target.value)}
                        placeholder="Enter offer code"
                        className="flex-1 rounded-xl border-2 border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all font-medium"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleApplyOffer();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={handleApplyOffer}
                        disabled={isApplyingOffer || !offerCode.trim()}
                        className="bg-gradient-to-r from-[#D4AF37] to-[#C19B2E] hover:from-[#C19B2E] hover:to-[#D4AF37] text-white px-6 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                      >
                        {isApplyingOffer ? "Applying..." : "Apply"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Available Offers */}
                {!appliedOffer && (
                  <div className="mt-4">
                    {loadingOffers ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">Loading offers...</p>
                      </div>
                    ) : availableOffers.length > 0 ? (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-semibold text-gray-700">
                            Available Offers ({availableOffers.length})
                          </p>
                          {availableOffers.length > 3 && (
                            <button
                              type="button"
                              onClick={() => setShowAllOffers(!showAllOffers)}
                              className="text-xs text-[#D4AF37] hover:underline font-medium"
                            >
                              {showAllOffers ? "Show Less" : "Show All"}
                            </button>
                          )}
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {(showAllOffers ? availableOffers : availableOffers.slice(0, 3)).map((offer) => {
                            const discountAmount = offer.discount_type === "percentage"
                              ? Math.min((getSubtotal() * offer.discount_value) / 100, offer.max_discount || Infinity)
                              : offer.discount_value;
                            const isEligible = !offer.min_order_amount || getSubtotal() >= offer.min_order_amount;

                            return (
                              <div
                                key={offer.id}
                                className={`p-4 rounded-xl border-2 transition-all ${
                                  isEligible
                                    ? "border-[#D4AF37]/30 bg-gradient-to-r from-[#D4AF37]/5 to-[#C19B2E]/5 hover:border-[#D4AF37]/50 hover:shadow-md cursor-pointer"
                                    : "border-gray-200 bg-gray-50 opacity-60"
                                }`}
                                onClick={() => isEligible && offer.code && handleApplyOfferFromList(offer)}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Tag className={`h-4 w-4 ${isEligible ? "text-[#D4AF37]" : "text-gray-400"}`} />
                                      <h3 className="font-semibold text-sm text-gray-900">{offer.title}</h3>
                                    </div>
                                    <p className="text-xs text-gray-600 mb-2">{offer.description}</p>
                                    <div className="flex items-center gap-4 text-xs">
                                      <span className={`font-bold ${isEligible ? "text-[#D4AF37]" : "text-gray-500"}`}>
                                        {offer.discount_type === "percentage"
                                          ? `${offer.discount_value}% OFF`
                                          : `₹${offer.discount_value} OFF`}
                                      </span>
                                      {offer.min_order_amount && (
                                        <span className="text-gray-500">
                                          Min. order: ₹{offer.min_order_amount}
                                        </span>
                                      )}
                                      {offer.code && (
                                        <span className="font-mono bg-white px-2 py-1 rounded border border-gray-200 text-gray-700">
                                          {offer.code}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {isEligible && offer.code && (
                                    <Button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleApplyOfferFromList(offer);
                                      }}
                                      className="bg-gradient-to-r from-[#D4AF37] to-[#C19B2E] hover:from-[#C19B2E] hover:to-[#D4AF37] text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm hover:shadow transition-all"
                                    >
                                      Apply
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 border-2 border-dashed border-gray-200 rounded-xl">
                        <Tag className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No offers available at the moment</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/50 p-5 md:p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-gradient-to-br from-[#D4AF37]/10 to-[#C19B2E]/5 rounded-lg">
                    <CreditCard className="h-5 w-5 text-[#D4AF37]" />
                  </div>
                  <h2 className="font-serif text-xl md:text-2xl font-medium">Payment Method</h2>
                </div>
                <div className="space-y-3">
                  <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 group ${
                    formData.payment_method === "razorpay"
                      ? "border-[#D4AF37] bg-gradient-to-r from-[#D4AF37]/10 to-[#C19B2E]/5 shadow-md"
                      : "border-gray-200 hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5"
                  }`}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="razorpay"
                      checked={formData.payment_method === "razorpay"}
                      onChange={(e) =>
                        setFormData({ ...formData, payment_method: e.target.value as any })
                      }
                      className="h-5 w-5 text-[#D4AF37] focus:ring-[#D4AF37]"
                    />
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-white rounded-lg border border-gray-200">
                        <CreditCard className="h-5 w-5 text-[#D4AF37]" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-base text-gray-900 group-hover:text-[#D4AF37] transition-colors">
                          Card / UPI / Net Banking
                        </div>
                        <div className="text-sm text-gray-500 mt-0.5">Pay securely via Razorpay</div>
                      </div>
                    </div>
                  </label>
                  <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 group ${
                    formData.payment_method === "cod"
                      ? "border-[#D4AF37] bg-gradient-to-r from-[#D4AF37]/10 to-[#C19B2E]/5 shadow-md"
                      : "border-gray-200 hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5"
                  }`}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="cod"
                      checked={formData.payment_method === "cod"}
                      onChange={(e) =>
                        setFormData({ ...formData, payment_method: e.target.value as any })
                      }
                      className="h-5 w-5 text-[#D4AF37] focus:ring-[#D4AF37]"
                    />
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-white rounded-lg border border-gray-200">
                        <Wallet className="h-5 w-5 text-[#D4AF37]" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-base text-gray-900 group-hover:text-[#D4AF37] transition-colors">
                          Cash on Delivery
                        </div>
                        <div className="text-sm text-gray-500 mt-0.5">Pay when you receive</div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-[#D4AF37] to-[#C19B2E] hover:from-[#C19B2E] hover:to-[#D4AF37] text-white font-semibold py-4 text-lg rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Complete Order
                  </span>
                )}
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/50 p-5 md:p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-gradient-to-br from-[#D4AF37]/10 to-[#C19B2E]/5 rounded-lg">
                  <ShoppingBag className="h-5 w-5 text-[#D4AF37]" />
                </div>
                <h2 className="font-serif text-xl md:text-2xl font-medium">Order Summary</h2>
              </div>
              
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-2">
                {items.map((item, index) => (
                  <div key={`${item.product_id}-${item.selectedSize || ""}-${index}`} className="flex gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 border border-gray-200">
                      <img
                        src={item.images[0] || "/images/ring-1.jpg"}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Qty: {item.quantity} × ₹{item.price.toFixed(2)}
                      </p>
                      {item.selectedSize && (
                        <p className="text-xs text-gray-400 mt-1">Size: {item.selectedSize}</p>
                      )}
                    </div>
                    <p className="text-sm font-bold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t border-gray-200 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">₹{getSubtotal().toFixed(2)}</span>
                </div>
                {appliedOffer && (
                  <div className="flex justify-between text-sm bg-green-50 p-2 rounded-lg border border-green-200">
                    <span className="text-green-700 font-medium">Discount</span>
                    <span className="font-bold text-green-700">-₹{getDiscount().toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className={`font-medium ${getShipping() === 0 ? "text-green-600" : "text-gray-900"}`}>
                    {getShipping() === 0 ? "Free" : `₹${getShipping().toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between border-t-2 border-gray-300 pt-3">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-[#D4AF37]">₹{getTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

