// Collections types
export interface Collection {
  id: string;
  name: string;
  description?: string;
  short_description?: string;
  image?: string; // Banner/cover image URL
  product_ids: string[]; // Array of product IDs in this collection
  is_featured: boolean; // Whether to show on homepage
  is_active: boolean; // Whether collection is active
  slug: string; // URL-friendly identifier
  display_order?: number; // Order for display on homepage
  createdAt?: Date;
  updatedAt?: Date;
}

