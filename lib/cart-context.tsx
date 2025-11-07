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

  // Load cart and offer from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("vairanya_cart");
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
      }
    }
    
    const savedOffer = localStorage.getItem("vairanya_applied_offer");
    if (savedOffer) {
      try {
        setAppliedOffer(JSON.parse(savedOffer));
      } catch (error) {
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("vairanya_cart", JSON.stringify(items));
  }, [items]);

  // Save offer to localStorage whenever it changes
  useEffect(() => {
    if (appliedOffer) {
      localStorage.setItem("vairanya_applied_offer", JSON.stringify(appliedOffer));
    } else {
      localStorage.removeItem("vairanya_applied_offer");
    }
  }, [appliedOffer]);

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
    localStorage.removeItem("vairanya_cart");
    localStorage.removeItem("vairanya_applied_offer");
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

