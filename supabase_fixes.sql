-- Fix 1: Ensure proper RLS policies for links table
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own links" ON links;
DROP POLICY IF EXISTS "Users can insert own links" ON links;
DROP POLICY IF EXISTS "Users can update own links" ON links;
DROP POLICY IF EXISTS "Users can delete own links" ON links;

-- Create proper RLS policies
CREATE POLICY "Users can view own links" ON links
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own links" ON links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own links" ON links
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own links" ON links
  FOR DELETE USING (auth.uid() = user_id);

-- Fix 2: Ensure proper RLS policies for link_analytics table
DROP POLICY IF EXISTS "Users can view own analytics" ON link_analytics;
DROP POLICY IF EXISTS "Users can insert own analytics" ON link_analytics;

CREATE POLICY "Users can view own analytics" ON link_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM links 
      WHERE links.id = link_analytics.link_id 
      AND links.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own analytics" ON link_analytics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM links 
      WHERE links.id = link_analytics.link_id 
      AND links.user_id = auth.uid()
    )
  );

-- Fix 3: Ensure proper RLS policies for user_profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Fix 4: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);
CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at);
CREATE INDEX IF NOT EXISTS idx_link_analytics_link_id ON link_analytics(link_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);

-- Fix 5: Ensure tables have RLS enabled
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Fix 6: Add a public policy for redirects (if needed)
-- This allows the redirect function to work without authentication
CREATE POLICY "Public redirect access" ON links
  FOR SELECT USING (true);

-- Fix 7: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated; 