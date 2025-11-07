export interface Review {
  id: string;
  customer_name: string;
  customer_email?: string;
  rating: number; // 1-5
  review_text: string;
  is_featured: boolean;
  created_at: string;
  updated_at?: string;
}

