// Product types - safe to import in client components
// This file contains only types and has no server-only dependencies

export type MetalFinish = "gold" | "rose-gold" | "silver" | "platinum";
export type Category = "rings" | "earrings" | "pendants" | "bracelets" | "necklaces";

export interface Product {
  sku: string;
  product_id: string;
  title: string;
  category: Category;
  price: number;
  cost_price?: number;
  stock_qty: number;
  weight?: number; // in grams
  metal_finish: MetalFinish;
  images: string[]; // Array of image filenames/paths
  description: string;
  short_description?: string;
  tags: string[];
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  shipping_class?: string;
  slug: string; // URL-friendly identifier
  is_new?: boolean;
  mrp?: number; // MRP if applicable
  size_options?: string[]; // For items with sizes
}

// Cart item type (extends Product with quantity)
export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
}

// Order type
export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  subtotal: number;
  shipping: number;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  shipping_address: {
    name: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  payment_method: "razorpay" | "cod" | "upi";
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  created_at: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
}

// Helper functions that don't need server-only
export function getAllCategories(): Category[] {
  return ["rings", "earrings", "pendants", "bracelets", "necklaces"];
}

export function getAllMetalFinishes(): MetalFinish[] {
  return ["gold", "rose-gold", "silver", "platinum"];
}

