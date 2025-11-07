// Types for offers system

export interface Offer {
  id: string;
  code?: string; // Offer code for easy application (e.g., "SAVE10", "WELCOME20")
  title: string;
  description: string;
  discount_type: "percentage" | "fixed"; // percentage or fixed amount
  discount_value: number; // e.g., 10 for 10% or 100 for ₹100
  min_order_amount?: number; // minimum order amount to apply offer
  max_discount?: number; // maximum discount amount (for percentage)
  valid_from: string; // ISO date string
  valid_until: string; // ISO date string
  is_active: boolean;
  customer_email?: string; // if null, offer is for all customers (deprecated, use customer_emails)
  customer_emails?: string[]; // array of customer emails for multi-customer offers
  customer_id?: string; // Firebase user ID if individual offer
  customer_ids?: string[]; // array of customer IDs for multi-customer offers
  usage_limit?: number; // maximum number of times offer can be used
  used_count: number; // number of times offer has been used
  created_at: string;
  updated_at: string;
  created_by?: string; // admin username who created the offer
}

export interface Customer {
  email: string;
  name: string;
  phone?: string;
  total_orders: number;
  total_spent: number;
  last_order_date?: string;
  user_id?: string; // Firebase user ID if registered
  addresses?: Array<{
    name: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  }>;
}

