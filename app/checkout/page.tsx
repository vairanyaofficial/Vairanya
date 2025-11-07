"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ArrowLeft, Tag, X } from "lucide-react";
import Link from "next/link";

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
  const { items, getSubtotal, getShipping, getTotal, getDiscount, appliedOffer, applyOffer, removeOffer, clearCart } = useCart();
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

  // Require login for checkout
  useEffect(() => {
    // Wait a bit for auth to initialize
    const timer = setTimeout(() => {
      setIsCheckingAuth(false);
      
      if (!user && !hasRedirected) {
        setHasRedirected(true);
        router.replace("/auth/login?callbackUrl=/checkout");
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
    if (!formData.address_line1.trim()) newErrors.address_line1 = "Address is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state.trim()) newErrors.state = "State is required";
    if (!formData.pincode.trim()) {
      newErrors.pincode = "Pincode is required";
    } else if (!/^[0-9]{6}$/.test(formData.pincode)) {
      newErrors.pincode = "Invalid pincode (6 digits)";
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

  // Show loading if checking auth or if user is not logged in
  if (isCheckingAuth || (!user && !hasRedirected)) {
    return (
      <div className="min-h-screen bg-[#FAF9F6]">
        <Header />
        <main className="max-w-6xl mx-auto px-6 py-12">
          <div className="rounded-lg border bg-white p-12 text-center">
            <p className="text-gray-600">Loading...</p>
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

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF9F6]">
        <Header />
        <main className="max-w-6xl mx-auto px-6 py-12">
          <div className="rounded-lg border bg-white p-12 text-center">
            <h1 className="font-serif text-3xl mb-2">Your cart is empty</h1>
            <p className="text-gray-600 mb-6">Add some products before proceeding to checkout.</p>
            <Link
              href="/collection"
              className="inline-flex items-center gap-2 px-5 py-3 rounded bg-[#D4AF37] text-white hover:bg-[#C19B2E]"
            >
              <ArrowLeft className="h-4 w-4" />
              Go to Collection
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50/30 to-white">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-6 md:py-8">
        <Link
          href="/collection"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Continue Shopping
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <h1 className="font-serif text-3xl md:text-4xl font-light mb-6 tracking-tight">Checkout</h1>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Contact Information */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm">
                <h2 className="font-serif text-xl md:text-2xl font-medium mb-4">Contact Information</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full rounded-xl border px-3 py-2 md:px-4 md:py-2.5 transition-all ${
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
                      className={`w-full rounded-xl border px-3 py-2 md:px-4 md:py-2.5 transition-all ${
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
                      className={`w-full rounded-xl border px-3 py-2 md:px-4 md:py-2.5 transition-all ${
                        errors.phone ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37]"
                      } focus:outline-none focus:ring-2`}
                      placeholder="10-digit mobile number"
                    />
                    {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm">
                <h2 className="font-serif text-xl md:text-2xl font-medium mb-4">Shipping Address</h2>
                <div className="space-y-3">
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
                      className={`w-full rounded-xl border px-3 py-2 md:px-4 md:py-2.5 transition-all ${
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
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 md:px-4 md:py-2.5 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className={`w-full rounded-xl border px-3 py-2 md:px-4 md:py-2.5 transition-all ${
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
                        className={`w-full rounded-xl border px-3 py-2 md:px-4 md:py-2.5 transition-all ${
                          errors.state ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37]"
                        } focus:outline-none focus:ring-2`}
                      />
                      {errors.state && <p className="mt-1 text-xs text-red-500">{errors.state}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Pincode <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      className={`w-full rounded-xl border px-3 py-2 md:px-4 md:py-2.5 transition-all ${
                        errors.pincode ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37]"
                      } focus:outline-none focus:ring-2`}
                      placeholder="6-digit pincode"
                    />
                    {errors.pincode && (
                      <p className="mt-1 text-xs text-red-500">{errors.pincode}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Offer Code */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm">
                <h2 className="font-serif text-xl md:text-2xl font-medium mb-4">Offer Code</h2>
                {appliedOffer ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-900">{appliedOffer.title}</p>
                        <p className="text-xs text-green-700">Discount: ₹{appliedOffer.discount}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveOffer}
                      className="text-green-600 hover:text-green-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={offerCode}
                      onChange={(e) => setOfferCode(e.target.value)}
                      placeholder="Enter offer code (e.g., SAVE10)"
                      className="flex-1 rounded-xl border border-gray-200 px-3 py-2 md:px-4 md:py-2.5 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all"
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
                      disabled={isApplyingOffer}
                      className="bg-[#D4AF37] hover:bg-[#C19B2E] whitespace-nowrap"
                    >
                      {isApplyingOffer ? "Applying..." : "Apply"}
                    </Button>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm">
                <h2 className="font-serif text-xl md:text-2xl font-medium mb-4">Payment Method</h2>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 md:p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5 transition-all duration-300 group">
                    <input
                      type="radio"
                      name="payment_method"
                      value="razorpay"
                      checked={formData.payment_method === "razorpay"}
                      onChange={(e) =>
                        setFormData({ ...formData, payment_method: e.target.value as any })
                      }
                      className="h-4 w-4 md:h-5 md:w-5 text-[#D4AF37] focus:ring-[#D4AF37]"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-sm md:text-base text-gray-900 group-hover:text-[#D4AF37] transition-colors">Card / UPI / Net Banking</div>
                      <div className="text-xs md:text-sm text-gray-500 mt-0.5">Pay securely via Razorpay</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 md:p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5 transition-all duration-300 group">
                    <input
                      type="radio"
                      name="payment_method"
                      value="cod"
                      checked={formData.payment_method === "cod"}
                      onChange={(e) =>
                        setFormData({ ...formData, payment_method: e.target.value as any })
                      }
                      className="h-4 w-4 md:h-5 md:w-5 text-[#D4AF37] focus:ring-[#D4AF37]"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-sm md:text-base text-gray-900 group-hover:text-[#D4AF37] transition-colors">Cash on Delivery</div>
                      <div className="text-xs md:text-sm text-gray-500 mt-0.5">Pay when you receive</div>
                    </div>
                  </label>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-[#D4AF37] hover:bg-[#C19B2E] text-white font-medium py-3 md:py-4 text-base md:text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isProcessing ? "Processing..." : "Complete Order"}
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-lg">
              <h2 className="font-serif text-xl md:text-2xl font-medium mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4">
                {items.map((item, index) => (
                  <div key={`${item.product_id}-${item.selectedSize || ""}-${index}`} className="flex gap-2 md:gap-3">
                    <div className="relative h-12 w-12 md:h-14 md:w-14 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                      <img
                        src={item.images[0] || "/images/ring-1.jpg"}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-gray-500">
                        Qty: {item.quantity} × ₹{item.price}
                      </p>
                    </div>
                    <p className="text-xs md:text-sm font-semibold">₹{item.price * item.quantity}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t pt-3 text-xs md:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>₹{getSubtotal()}</span>
                </div>
                {appliedOffer && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({appliedOffer.title})</span>
                    <span>-₹{getDiscount()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>{getShipping() === 0 ? "Free" : `₹${getShipping()}`}</span>
                </div>
                <div className="flex justify-between border-t pt-2 text-base md:text-lg font-semibold">
                  <span>Total</span>
                  <span>₹{getTotal()}</span>
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

