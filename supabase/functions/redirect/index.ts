import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  try {
    // Helper function to extract short code from URL
    function extractShortCode(url: string): string {
      const path = new URL(url).pathname;
      // Remove leading slash and "redirect/" prefix if present
      const cleanPath = path.substring(1);
      if (cleanPath.startsWith('redirect/')) {
        return cleanPath.substring(9); // Remove "redirect/" prefix
      }
      return cleanPath;
    }

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    // Extract short code from URL
    const shortCode = extractShortCode(req.url);
    
    console.log('Redirect request received:', {
      url: req.url,
      shortCode,
      method: req.method,
      userAgent: req.headers.get('user-agent')
    });
    
    if (!shortCode) {
      console.log('No short code provided');
      return new Response('Short code not provided', { 
        status: 400,
        headers: corsHeaders 
      })
    }

    // Initialize Supabase client with anon key (automatically available)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    console.log('Supabase config:', {
      url: supabaseUrl ? 'configured' : 'missing',
      key: supabaseAnonKey ? 'configured' : 'missing'
    });
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Look up the link by short code
    const { data: link, error } = await supabase
      .from('links')
      .select('id, original_url, is_active, expires_at')
      .eq('short_code', shortCode)
      .single()

    console.log('Database lookup result:', {
      shortCode,
      found: !!link,
      error: error?.message
    });

    if (error || !link) {
      console.log('Link not found or error:', error);
      return new Response('Link not found', { 
        status: 404,
        headers: corsHeaders 
      })
    }

    // Check if link is active
    if (!link.is_active) {
      return new Response('Link is inactive', { 
        status: 410,
        headers: corsHeaders 
      })
    }

    // Check if link has expired
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      console.log('Link expired:', link.expires_at);
      return new Response('Link has expired', { 
        status: 410,
        headers: corsHeaders 
      })
    }

    console.log('Redirecting to:', link.original_url);

    // Get client information for analytics
    const userAgent = req.headers.get('user-agent') || ''
    const referer = req.headers.get('referer') || ''
    const clientIP = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown'

    // Track the click asynchronously (don't wait for it)
    supabase
      .from('link_analytics')
      .insert({
        link_id: link.id,
        ip_address: clientIP,
        user_agent: userAgent,
        referrer: referer,
        timestamp: new Date().toISOString()
      })
      .then(() => {
        console.log('Analytics tracked successfully');
        // Update click count
        return supabase
          .from('links')
          .rpc('increment_click_count', { link_id: link.id })
          .eq('id', link.id)
      })
      .catch(err => console.error('Analytics tracking failed:', err))

    // Redirect to the original URL
    return Response.redirect(link.original_url, 302)

  } catch (error) {
    console.error('Redirect error:', error)
    return new Response('Internal server error', { 
      status: 500,
      headers: corsHeaders 
    })
  }
})