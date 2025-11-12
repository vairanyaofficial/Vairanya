export interface Review {
  id: string;
  product_id?: string; // Product ID for product-specific reviews
  customer_name: string;
  customer_email?: string;
  user_id?: string; // User ID who wrote the review
  rating: number; // 1-5
  review_text: string;
  images?: string[]; // Array of image URLs
  is_featured: boolean;
  created_at: string;
  updated_at?: string;
}

