"use client";

import React, { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Image } from "@imagekit/next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/components/AuthProvider";
import { X, Plus, Minus, ShoppingBag } from "lucide-react";
import { validateImageUrl, getFallbackImageUrl } from "@/lib/imagekit-utils";

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

  // Close cart when clicking outside and prevent body scroll
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.body.style.overflow = 'hidden';
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 glass-overlay z-40 animate-in fade-in duration-200 backdrop-blur-md" 
        onClick={() => onOpenChange(false)} 
      />
      
      {/* Cart Drawer - Mobile Full Screen, Desktop Side Panel */}
      <div
        ref={cartRef}
        className="fixed right-0 top-0 md:right-4 md:top-20 w-full md:w-full md:max-w-sm h-full md:h-auto md:max-h-[calc(100vh-6rem)] glass-strong md:rounded-2xl shadow-2xl border-0 md:border border-gray-200/50 dark:border-white/10 z-50 flex flex-col animate-in slide-in-from-right md:slide-in-from-top-2 fade-in duration-300 safe-area-inset backdrop-blur-xl"
      >
        {/* Header - Mobile Optimized */}
        <div className="border-b border-gray-200/50 dark:border-white/10 px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 glass z-10 backdrop-blur-xl">
          <div>
            <h2 className="font-serif text-lg md:text-xl font-semibold text-gray-900 dark:text-white">Shopping Cart</h2>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-500 mt-0.5">
              {getTotalItems()} {getTotalItems() === 1 ? "item" : "items"}
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 text-gray-400 dark:text-gray-500 active:text-gray-600 dark:active:text-gray-300 md:hover:text-gray-600 dark:md:hover:text-gray-300 rounded-lg active:bg-gray-100 dark:active:bg-[#1a1a1a] md:hover:bg-gray-100 dark:md:hover:bg-[#1a1a1a] transition-colors touch-manipulation"
            aria-label="Close cart"
          >
            <X className="h-6 w-6 md:h-5 md:w-5" />
          </button>
        </div>

        {/* Cart Items - Mobile Optimized */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12 md:py-16">
              <ShoppingBag className="mb-4 h-20 w-20 md:h-16 md:w-16 text-gray-300 dark:text-gray-700" />
              <p className="mb-2 text-lg md:text-xl font-medium text-gray-900 dark:text-white">Your cart is empty</p>
              <p className="mb-6 text-sm md:text-base text-gray-500 dark:text-gray-500 px-4">
                Start shopping to add items to your cart
              </p>
              <Button
                onClick={() => onOpenChange(false)}
                asChild
                className="bg-[#D4AF37] active:bg-[#C19B2E] md:hover:bg-[#C19B2E] text-white px-6 py-3 text-base touch-manipulation"
              >
                <Link href="/products">Browse Products</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-3">
              {items.map((item) => (
                <div
                  key={`${item.product_id}-${item.selectedSize || ""}`}
                  className="flex gap-3 md:gap-4 pb-4 md:pb-3 border-b border-gray-200/30 dark:border-white/10 last:border-0 last:pb-0"
                >
                  <Link
                    href={`/products/${item.slug}`}
                    onClick={() => onOpenChange(false)}
                    className="relative h-24 w-24 md:h-20 md:w-20 flex-shrink-0 overflow-hidden rounded-xl md:rounded-md glass-card backdrop-blur-md"
                  >
                    <Image
                      src={validateImageUrl(item.images?.[0])}
                      alt={item.title}
                      fill
                      className="object-cover"
                      quality={80}
                      loading="lazy"
                      transformation={[{
                        format: 'auto',
                      }]}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const fallbackUrl = getFallbackImageUrl();
                        if (!target.src.includes(fallbackUrl.split('/').pop() || '')) {
                          target.src = fallbackUrl;
                        }
                      }}
                    />
                  </Link>
                  <div className="flex flex-1 flex-col min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={() => onOpenChange(false)}
                          className="block"
                        >
                          <h4 className="font-medium text-base md:text-sm text-gray-900 dark:text-white truncate active:text-[#D4AF37] dark:active:text-[#D4AF37] md:hover:text-[#D4AF37] dark:md:hover:text-[#D4AF37] transition-colors">{item.title}</h4>
                        </Link>
                        {item.selectedSize && (
                          <p className="mt-1 text-xs md:text-xs text-gray-500 dark:text-gray-500">Size: {item.selectedSize}</p>
                        )}
                        <p className="mt-1.5 font-semibold text-base md:text-sm text-gray-900 dark:text-white">₹{item.price.toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        className="text-gray-400 dark:text-gray-600 active:text-red-500 dark:active:text-red-400 md:hover:text-red-500 dark:md:hover:text-red-400 transition-colors flex-shrink-0 p-1 touch-manipulation"
                        aria-label="Remove item"
                      >
                        <X className="h-5 w-5 md:h-4 md:w-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center gap-2.5 md:gap-2">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        className="flex h-10 w-10 md:h-8 md:w-8 items-center justify-center rounded-xl md:rounded border-2 md:border border-gray-300 dark:border-[#1a1a1a] active:bg-gray-100 dark:active:bg-[#1a1a1a] md:hover:bg-gray-50 dark:md:hover:bg-[#1a1a1a] transition-colors touch-manipulation"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4 md:h-3 md:w-3 text-gray-600 dark:text-gray-400" />
                      </button>
                      <span className="w-10 md:w-8 text-center text-base md:text-sm font-semibold md:font-medium text-gray-900 dark:text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        className="flex h-10 w-10 md:h-8 md:w-8 items-center justify-center rounded-xl md:rounded border-2 md:border border-gray-300 dark:border-[#1a1a1a] active:bg-gray-100 dark:active:bg-[#1a1a1a] md:hover:bg-gray-50 dark:md:hover:bg-[#1a1a1a] transition-colors touch-manipulation"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4 md:h-3 md:w-3 text-gray-600 dark:text-gray-400" />
                      </button>
                      <div className="ml-auto text-base md:text-sm font-bold md:font-semibold text-gray-900 dark:text-white">
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with Summary - Mobile Optimized */}
        {items.length > 0 && (
          <div className="border-t border-gray-200/50 dark:border-white/10 glass px-4 md:px-6 py-4 md:py-5 space-y-4 sticky bottom-0 safe-area-inset-bottom backdrop-blur-xl">
            <div className="space-y-2.5 md:space-y-2 text-sm md:text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span className="text-base md:text-sm">Subtotal</span>
                <span className="font-semibold md:font-medium text-gray-900 dark:text-white text-base md:text-sm">₹{getSubtotal().toLocaleString()}</span>
              </div>
              {appliedOffer && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span className="text-base md:text-sm">Discount ({appliedOffer.title})</span>
                  <span className="font-semibold md:font-medium text-base md:text-sm">-₹{getDiscount().toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span className="text-base md:text-sm">Shipping</span>
                <span className="font-semibold md:font-medium text-gray-900 dark:text-white text-base md:text-sm">
                  {getShipping() === 0 ? (
                    <span className="text-green-600 dark:text-green-400">Free</span>
                  ) : (
                    `₹${getShipping().toLocaleString()}`
                  )}
                </span>
              </div>
              {getSubtotal() < 999 && (
                <p className="text-xs md:text-xs text-gray-500 dark:text-gray-500 pt-1 glass-card p-2 rounded-lg border border-yellow-200/50 dark:border-white/10 backdrop-blur-md">
                  Add ₹{(999 - getSubtotal()).toLocaleString()} more for free shipping
                </p>
              )}
              <div className="flex justify-between border-t border-gray-200/50 dark:border-white/10 pt-3 md:pt-2 text-lg md:text-base font-bold md:font-semibold text-gray-900 dark:text-white">
                <span>Total</span>
                <span>₹{getTotal().toLocaleString()}</span>
              </div>
            </div>
            <Button
              onClick={() => {
                if (!user) {
                  onOpenChange(false);
                  router.push("/login?callbackUrl=/checkout");
                  return;
                }
                onOpenChange(false);
                router.push("/checkout");
              }}
              className="w-full bg-[#D4AF37] active:bg-[#C19B2E] md:hover:bg-[#C19B2E] text-white font-semibold py-4 md:py-3 text-base md:text-sm touch-manipulation shadow-lg md:shadow-sm"
            >
              Proceed to Checkout
            </Button>
            <Link
              href="/products"
              onClick={() => onOpenChange(false)}
              className="block text-center text-sm md:text-sm text-gray-600 active:text-[#D4AF37] md:hover:text-[#D4AF37] transition-colors py-2 touch-manipulation"
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

