// Types for site settings

export interface SiteSettings {
  id: string;
  site_icon?: string; // URL to the site icon/favicon
  site_logo?: string; // URL to the site logo
  updated_at: string;
  updated_by?: string; // admin username who updated
}

