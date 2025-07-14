export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserProfile, 'id' | 'created_at'>>;
      };
      links: {
        Row: Link;
        Insert: Omit<Link, 'id' | 'created_at' | 'click_count'>;
        Update: Partial<Omit<Link, 'id' | 'created_at'>>;
      };
      link_analytics: {
        Row: LinkAnalytics;
        Insert: Omit<LinkAnalytics, 'id' | 'timestamp'>;
        Update: Partial<Omit<LinkAnalytics, 'id' | 'timestamp'>>;
      };
      qr_codes: {
        Row: QRCode;
        Insert: Omit<QRCode, 'id' | 'created_at' | 'download_count'>;
        Update: Partial<Omit<QRCode, 'id' | 'created_at'>>;
      };
    };
  };
}

export interface UserProfile {
  id: string;
  username: string;
  plan_type: 'free' | 'starter' | 'professional' | 'enterprise';
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Link {
  id: string;
  user_id?: string;
  original_url: string;
  short_code: string;
  custom_alias?: string;
  title?: string;
  description?: string;
  tags?: string[];
  password_hash?: string;
  created_at: string;
  expires_at?: string;
  is_active: boolean;
  click_count: number;
}

export interface LinkAnalytics {
  id: string;
  link_id: string;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  country?: string;
  city?: string;
  device_type?: string;
  browser?: string;
}

export interface QRCode {
  id: string;
  link_id: string;
  style_config?: any;
  file_path?: string;
  download_count: number;
  created_at: string;
}