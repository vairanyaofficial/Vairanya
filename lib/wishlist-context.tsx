"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
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
  const pathname = usePathname();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { showError, showWarning, showSuccess } = useToast();

  // Check if we're on admin or worker pages
  const isAdminOrWorkerPage = pathname?.startsWith("/admin") || pathname?.startsWith("/worker");

  // NextAuth handles authentication via cookies, no token needed

  const fetchWishlist = async (retryCount = 0, maxRetries = 3) => {
    // Don't fetch wishlist on admin or worker pages
    if (isAdminOrWorkerPage) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    if (!user) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    try {
      // Only set loading on first attempt
      if (retryCount === 0) {
        setIsLoading(true);
        // Add delay on first attempt to wait for DB connection
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      }
      
      // NextAuth handles authentication via cookies
      const response = await fetch("/api/wishlist");

      // Retry on 401 (Unauthorized) or 503 (Service Unavailable) errors
      if ((response.status === 401 || response.status === 503) && retryCount < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWishlist(retryCount + 1, maxRetries);
      }

      const data = await response.json();
      if (data.success) {
        setItems(data.items || []);
      } else {
        setItems([]);
      }
      setIsLoading(false);
    } catch (error) {
      // Retry on network errors if we haven't exceeded max retries
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWishlist(retryCount + 1, maxRetries);
      }
      setItems([]);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Don't fetch wishlist on admin or worker pages
    if (isAdminOrWorkerPage) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    if (user) {
      fetchWishlist();
    } else {
      setItems([]);
    }
  }, [user, isAdminOrWorkerPage]);

  const addToWishlist = async (productId: string): Promise<boolean> => {
    // Don't allow wishlist operations on admin or worker pages
    if (isAdminOrWorkerPage) {
      return false;
    }

    if (!user) {
      showWarning("Please login to add items to wishlist");
      return false;
    }

    try {
      // NextAuth handles authentication via cookies
      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: {
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
    // Don't allow wishlist operations on admin or worker pages
    if (isAdminOrWorkerPage) {
      return false;
    }

    if (!user) return false;

    try {
      // NextAuth handles authentication via cookies
      const response = await fetch(`/api/wishlist?product_id=${productId}`, {
        method: "DELETE",
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

