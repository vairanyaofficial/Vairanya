"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";
import { auth } from "@/lib/firebaseClient";
import { useToast } from "@/components/ToastProvider";

interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

interface WishlistContextType {
  items: WishlistItem[];
  isLoading: boolean;
  addToWishlist: (productId: string) => Promise<boolean>;
  removeFromWishlist: (productId: string) => Promise<boolean>;
  isInWishlist: (productId: string) => boolean;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType>({
  items: [],
  isLoading: false,
  addToWishlist: async () => false,
  removeFromWishlist: async () => false,
  isInWishlist: () => false,
  refreshWishlist: async () => {},
});

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { showError, showWarning, showSuccess } = useToast();

  const getAuthToken = async (): Promise<string | null> => {
    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch {
      return null;
    }
  };

  const fetchWishlist = async () => {
    if (!user) {
      setItems([]);
      return;
    }

    try {
      setIsLoading(true);
      const token = await getAuthToken();
      if (!token) {
        setItems([]);
        return;
      }

      const response = await fetch("/api/wishlist", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setItems(data.items || []);
      } else {
        setItems([]);
      }
    } catch (error) {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setItems([]);
    }
  }, [user]);

  const addToWishlist = async (productId: string): Promise<boolean> => {
    if (!user) {
      showWarning("Please login to add items to wishlist");
      return false;
    }

    try {
      const token = await getAuthToken();
      if (!token) return false;

      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ product_id: productId }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchWishlist();
        showSuccess("Added to wishlist");
        return true;
      } else {
        if (data.error?.includes("already in wishlist")) {
          // Already in wishlist, that's okay
          return true;
        }
        showError(data.error || "Failed to add to wishlist");
        return false;
      }
    } catch (error) {
      showError("Failed to add to wishlist");
      return false;
    }
  };

  const removeFromWishlist = async (productId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const token = await getAuthToken();
      if (!token) return false;

      const response = await fetch(`/api/wishlist?product_id=${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        await fetchWishlist();
        showSuccess("Removed from wishlist");
        return true;
      } else {
        showError(data.error || "Failed to remove from wishlist");
        return false;
      }
    } catch (error) {
      showError("Failed to remove from wishlist");
      return false;
    }
  };

  const isInWishlist = (productId: string): boolean => {
    return items.some((item) => item.product_id === productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        isLoading,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        refreshWishlist: fetchWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);

