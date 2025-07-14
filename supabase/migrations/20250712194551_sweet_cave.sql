/*
  # Add Click Count Increment Function

  1. New Functions
    - `increment_click_count` - Safely increments click count for a link
  
  2. Security
    - Function can be called by anyone (needed for redirect functionality)
    - Uses security definer to bypass RLS for increment operation
*/

-- Function to safely increment click count
CREATE OR REPLACE FUNCTION increment_click_count(link_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE links 
  SET click_count = click_count + 1 
  WHERE id = link_id;
END;
$$;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION increment_click_count(UUID) TO anon;
GRANT EXECUTE ON FUNCTION increment_click_count(UUID) TO authenticated;