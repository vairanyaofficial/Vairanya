// Order and Task types for admin dashboard

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "packing"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type TaskType = "packing" | "quality_check" | "shipping_prep" | "other";

export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface Order {
  id: string;
  order_number: string; // Display number like ORD-2024-001
  items: OrderItem[];
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
  payment_status: "pending" | "paid" | "failed" | "refunded";
  status: OrderStatus;
  discount?: number; // Discount amount applied
  offer_id?: string; // ID of the offer applied
  created_at: string;
  updated_at: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  tracking_number?: string;
  courier_company?: string; // Courier company name
  assigned_to?: string; // Worker username
  notes?: string;
  user_id?: string; // Firebase user UID
  refund_status?: "started" | "processing" | "completed" | "failed"; // Refund status for cancelled orders
  razorpay_refund_id?: string; // Razorpay refund ID
  refund_notes?: string; // Notes about the refund process
}

export interface OrderItem {
  product_id: string;
  sku: string;
  title: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface Task {
  id: string;
  order_id: string;
  order_number: string;
  type: TaskType;
  status: TaskStatus;
  assigned_to: string; // Worker username
  assigned_by: string; // Super admin username
  created_at: string;
  updated_at: string;
  completed_at?: string;
  priority: "low" | "medium" | "high";
  notes?: string;
  order_details?: {
    customer_name: string;
    items: OrderItem[];
    shipping_address: Order["shipping_address"];
  };
}

export interface DashboardStats {
  total_orders: number;
  pending_orders: number;
  processing_orders: number;
  packed_orders: number;
  shipped_orders: number;
  delivered_orders: number;
  total_revenue: number;
  today_revenue: number;
  today_orders: number;
  pending_tasks: number;
  in_progress_tasks: number;
  completed_tasks_today: number;
  worker_stats: {
    username: string;
    name: string;
    pending_tasks: number;
    in_progress_tasks: number;
    completed_tasks: number;
  }[];
}

