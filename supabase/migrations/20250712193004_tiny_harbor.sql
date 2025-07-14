/*
  # Add Analytics Tracking Function

  1. Functions
    - `increment_click_count()` - Safely increment click count for links
    - `track_link_click()` - Track analytics data for link clicks

  2. Triggers
    - Auto-increment click count when analytics record is inserted

  3. Indexes
    - Performance indexes for analytics queries
*/

-- Function to safely increment click count
CREATE OR REPLACE FUNCTION increment_click_count(link_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE links 
  SET click_count = click_count + 1 
  WHERE id = link_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track link clicks with analytics
CREATE OR REPLACE FUNCTION track_link_click(
  p_link_id UUID,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_device_type TEXT DEFAULT NULL,
  p_browser TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  analytics_id UUID;
BEGIN
  -- Insert analytics record
  INSERT INTO link_analytics (
    link_id,
    ip_address,
    user_agent,
    referrer,
    country,
    city,
    device_type,
    browser,
    timestamp
  ) VALUES (
    p_link_id,
    p_ip_address,
    p_user_agent,
    p_referrer,
    p_country,
    p_city,
    p_device_type,
    p_browser,
    NOW()
  ) RETURNING id INTO analytics_id;

  -- Increment click count
  PERFORM increment_click_count(p_link_id);

  RETURN analytics_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_links_short_code_active ON links(short_code) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_links_expires_at ON links(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp_desc ON link_analytics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_link_timestamp ON link_analytics(link_id, timestamp DESC);