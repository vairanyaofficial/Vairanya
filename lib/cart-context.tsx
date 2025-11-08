"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { CartItem, Product } from "./products-types";

interface AppliedOffer {
  id: string;
  title: string;
  discount: number;
}

interface CartContextType {
  items: CartItem[];
  appliedOffer: AppliedOffer | null;
  isLoading: boolean; // Add loading state
  addToCart: (product: Product, quantity?: number, selectedSize?: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  applyOffer: (offer: AppliedOffer) => void;
  removeOffer: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
  getShipping: () => number;
  getDiscount: () => number;
  getTotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedOffer, setAppliedOffer] = useState<AppliedOffer | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Track loading state

  // Load cart and offer from localStorage on mount (client-side only)
  useEffect(() => {
    // Check if we're on the client side
    if (typeof window === "undefined") {
      setIsLoading(false);
      return;
    }

    try {
      const savedCart = localStorage.getItem("vairanya_cart");
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          // Always set items if it's a valid array (even if empty)
          if (Array.isArray(parsedCart)) {
            setItems(parsedCart);
          } else {
            // Invalid data, remove it
            localStorage.removeItem("vairanya_cart");
          }
        } catch (error) {
          console.error("Error parsing saved cart:", error);
          localStorage.removeItem("vairanya_cart");
        }
      }
      
      const savedOffer = localStorage.getItem("vairanya_applied_offer");
      if (savedOffer) {
        try {
          const parsedOffer = JSON.parse(savedOffer);
          // Validate offer structure
          if (parsedOffer && typeof parsedOffer === "object" && parsedOffer.id && parsedOffer.title) {
            setAppliedOffer(parsedOffer);
          } else {
            // Invalid offer data, remove it
            localStorage.removeItem("vairanya_applied_offer");
          }
        } catch (error) {
          console.error("Error parsing saved offer:", error);
          localStorage.removeItem("vairanya_applied_offer");
        }
      }
    } catch (error) {
      console.error("Error loading cart from localStorage:", error);
    } finally {
      setIsLoading(false); // Mark as loaded
    }
  }, []);

  // Save cart to localStorage whenever it changes (but not during initial load)
  useEffect(() => {
    if (!isLoading && typeof window !== "undefined") {
      try {
        // Always save the current state to localStorage
        // Empty array means cart is empty, which is a valid state
        localStorage.setItem("vairanya_cart", JSON.stringify(items));
      } catch (error) {
        console.error("Error saving cart to localStorage:", error);
        // If localStorage is full, try to handle it gracefully
        if (error instanceof DOMException && error.code === 22) {
          console.warn("LocalStorage is full. Consider clearing old data.");
        }
      }
    }
  }, [items, isLoading]);

  // Save offer to localStorage whenever it changes (but not during initial load)
  useEffect(() => {
    if (!isLoading && typeof window !== "undefined") {
      try {
        if (appliedOffer) {
          localStorage.setItem("vairanya_applied_offer", JSON.stringify(appliedOffer));
        } else {
          localStorage.removeItem("vairanya_applied_offer");
        }
      } catch (error) {
        console.error("Error saving offer to localStorage:", error);
      }
    }
  }, [appliedOffer, isLoading]);

  const addToCart = (product: Product, quantity: number = 1, selectedSize?: string) => {
    // Prevent adding out-of-stock items to cart
    if (product.stock_qty === 0) {
      return;
    }

    setItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.product_id === product.product_id && item.selectedSize === selectedSize
      );

      if (existingItem) {
        // Update quantity if item already exists, but don't exceed stock
        return prevItems.map((item) =>
          item.product_id === product.product_id && item.selectedSize === selectedSize
            ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock_qty) }
            : item
        );
      } else {
        // Add new item, but don't exceed stock
        return [...prevItems, { ...product, quantity: Math.min(quantity, product.stock_qty), selectedSize }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.product_id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.product_id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedOffer(null);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("vairanya_cart");
        localStorage.removeItem("vairanya_applied_offer");
      } catch (error) {
        console.error("Error clearing cart from localStorage:", error);
      }
    }
  };

  const applyOffer = (offer: AppliedOffer) => {
    setAppliedOffer(offer);
  };

  const removeOffer = () => {
    setAppliedOffer(null);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getSubtotal = () => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getShipping = () => {
    const subtotal = getSubtotal();
    // Free shipping over ₹999
    return subtotal >= 999 ? 0 : 50;
  };

  const getDiscount = () => {
    if (!appliedOffer) return 0;
    return appliedOffer.discount;
  };

  const getTotal = () => {
    const subtotal = getSubtotal();
    const shipping = getShipping();
    const discount = getDiscount();
    return Math.max(0, subtotal + shipping - discount);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        appliedOffer,
        isLoading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        applyOffer,
        removeOffer,
        getTotalItems,
        getSubtotal,
        getShipping,
        getDiscount,
        getTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

