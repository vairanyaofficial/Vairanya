"use client";

import React, { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/components/AuthProvider";
import { X, Plus, Minus, ShoppingBag } from "lucide-react";

interface CartProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const Cart: React.FC<CartProps> = ({ open, onOpenChange }) => {
  const router = useRouter();
  const { user } = useAuth();
  const cartRef = useRef<HTMLDivElement>(null);
  const {
    items,
    updateQuantity,
    removeFromCart,
    getTotalItems,
    getSubtotal,
    getShipping,
    getDiscount,
    getTotal,
    appliedOffer,
  } = useCart();

  // Close cart when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40 animate-in fade-in duration-200" 
        onClick={() => onOpenChange(false)} 
      />
      
      {/* Cart Dropdown */}
      <div
        ref={cartRef}
        className="fixed right-4 top-20 w-full max-w-sm bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[calc(100vh-6rem)] flex flex-col animate-in slide-in-from-top-2 fade-in duration-200"
      >
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-semibold text-gray-900">Shopping Cart</h2>
            <p className="text-xs text-gray-500 mt-1">
              {getTotalItems()} {getTotalItems() === 1 ? "item" : "items"}
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <ShoppingBag className="mb-4 h-16 w-16 text-gray-300" />
              <p className="mb-2 text-lg font-medium text-gray-900">Your cart is empty</p>
              <p className="mb-6 text-sm text-gray-500">
                Start shopping to add items to your cart
              </p>
              <Button
                onClick={() => onOpenChange(false)}
                asChild
                className="bg-[#D4AF37] hover:bg-[#C19B2E]"
              >
                <Link href="/collection">Browse Collection</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={`${item.product_id}-${item.selectedSize || ""}`}
                  className="flex gap-4 pb-4 border-b last:border-0 last:pb-0"
                >
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                    <Image
                      src={item.images[0] || "/images/ring-1.jpg"}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900 truncate">{item.title}</h4>
                        {item.selectedSize && (
                          <p className="mt-1 text-xs text-gray-500">Size: {item.selectedSize}</p>
                        )}
                        <p className="mt-1 font-semibold text-sm text-gray-900">₹{item.price}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                        aria-label="Remove item"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 hover:bg-gray-50 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 hover:bg-gray-50 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <div className="ml-auto text-sm font-semibold text-gray-900">
                        ₹{item.price * item.quantity}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with Summary */}
        {items.length > 0 && (
          <div className="border-t bg-gray-50 px-6 py-4 space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900">₹{getSubtotal()}</span>
              </div>
              {appliedOffer && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({appliedOffer.title})</span>
                  <span className="font-medium">-₹{getDiscount()}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="font-medium text-gray-900">
                  {getShipping() === 0 ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    `₹${getShipping()}`
                  )}
                </span>
              </div>
              {getSubtotal() < 999 && (
                <p className="text-xs text-gray-500 pt-1">
                  Add ₹{999 - getSubtotal()} more for free shipping
                </p>
              )}
              <div className="flex justify-between border-t pt-2 text-base font-semibold text-gray-900">
                <span>Total</span>
                <span>₹{getTotal()}</span>
              </div>
            </div>
            <Button
              onClick={() => {
                if (!user) {
                  onOpenChange(false);
                  router.push("/auth/login?callbackUrl=/checkout");
                  return;
                }
                onOpenChange(false);
                router.push("/checkout");
              }}
              className="w-full bg-[#D4AF37] hover:bg-[#C19B2E] text-white font-medium py-2.5"
            >
              Proceed to Checkout
            </Button>
            <Link
              href="/collection"
              onClick={() => onOpenChange(false)}
              className="block text-center text-sm text-gray-600 hover:text-[#D4AF37] transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default Cart;

