export interface CarouselSlide {
  id: string;
  image_url: string;
  title?: string;
  subtitle?: string;
  link_url?: string;
  link_text?: string;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

