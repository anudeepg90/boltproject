/*
  # LinkForge Database Schema

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `username` (text, unique)
      - `plan_type` (text, default 'free')
      - `stripe_customer_id` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `links`
      - `id` (uuid, primary key)
      - `user_id` (uuid, optional, references auth.users)
      - `original_url` (text, required)
      - `short_code` (text, unique, required)
      - `custom_alias` (text, optional)
      - `title` (text, optional)
      - `description` (text, optional)
      - `tags` (text array, optional)
      - `password_hash` (text, optional)
      - `created_at` (timestamp)
      - `expires_at` (timestamp, optional)
      - `is_active` (boolean, default true)
      - `click_count` (integer, default 0)
    - `link_analytics`
      - `id` (uuid, primary key)
      - `link_id` (uuid, references links)
      - `timestamp` (timestamp)
      - `ip_address` (inet, optional)
      - `user_agent` (text, optional)
      - `referrer` (text, optional)
      - `country` (text, optional)
      - `city` (text, optional)
      - `device_type` (text, optional)
      - `browser` (text, optional)
    - `qr_codes`
      - `id` (uuid, primary key)
      - `link_id` (uuid, references links)
      - `style_config` (jsonb, optional)
      - `file_path` (text, optional)
      - `download_count` (integer, default 0)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Allow anonymous users to create links (guest functionality)
    - Allow anonymous users to insert analytics data
*/

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid REFERENCES auth.users(id) PRIMARY KEY,
  username text UNIQUE,
  plan_type text DEFAULT 'free' CHECK (plan_type IN ('free', 'starter', 'professional', 'enterprise')),
  stripe_customer_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Links table
CREATE TABLE IF NOT EXISTS links (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  original_url text NOT NULL,
  short_code text UNIQUE NOT NULL,
  custom_alias text,
  title text,
  description text,
  tags text[],
  password_hash text,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  click_count integer DEFAULT 0
);

-- Link analytics table
CREATE TABLE IF NOT EXISTS link_analytics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id uuid REFERENCES links(id) ON DELETE CASCADE,
  timestamp timestamptz DEFAULT now(),
  ip_address inet,
  user_agent text,
  referrer text,
  country text,
  city text,
  device_type text,
  browser text
);

-- QR codes table
CREATE TABLE IF NOT EXISTS qr_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id uuid REFERENCES links(id) ON DELETE CASCADE,
  style_config jsonb,
  file_path text,
  download_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for links
CREATE POLICY "Users can read own links" ON links
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert links" ON links
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own links" ON links
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own links" ON links
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for link_analytics
CREATE POLICY "Users can read analytics for own links" ON link_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM links 
      WHERE links.id = link_analytics.link_id 
      AND (links.user_id = auth.uid() OR links.user_id IS NULL)
    )
  );

CREATE POLICY "Anyone can insert analytics" ON link_analytics
  FOR INSERT WITH CHECK (true);

-- RLS Policies for qr_codes
CREATE POLICY "Users can read QR codes for own links" ON qr_codes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM links 
      WHERE links.id = qr_codes.link_id 
      AND (links.user_id = auth.uid() OR links.user_id IS NULL)
    )
  );

CREATE POLICY "Anyone can insert QR codes" ON qr_codes
  FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);
CREATE INDEX IF NOT EXISTS idx_links_short_code ON links(short_code);
CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_link_id ON link_analytics(link_id);
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON link_analytics(timestamp);

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username, plan_type)
  VALUES (new.id, new.raw_user_meta_data->>'username', 'free');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on user_profiles
DROP TRIGGER IF EXISTS handle_updated_at ON user_profiles;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();