import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const RedirectHandler: React.FC = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [status, setStatus] = useState<'loading' | 'redirecting' | 'error' | 'not-found'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleRedirect = async () => {
      if (!shortCode) {
        setStatus('not-found');
        return;
      }

      try {
        setStatus('loading');

        // Check if Supabase is properly configured
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey || 
            supabaseUrl === 'https://your-project.supabase.co' || 
            supabaseKey === 'your-anon-key' ||
            supabaseUrl.includes('your-project') ||
            supabaseKey.includes('your-anon') ||
            !supabaseKey.startsWith('eyJ')) {
          setError('Database connection not configured. Please check your environment variables.');
          setStatus('error');
          return;
        }

        // Look up the link by short code
        const { data: link, error: linkError } = await supabase
          .from('links')
          .select('id, original_url, is_active, expires_at')
          .eq('short_code', shortCode)
          .single();

        if (linkError || !link) {
          setStatus('not-found');
          return;
        }

        // Check if link is active
        if (!link.is_active) {
          setError('This link has been deactivated');
          setStatus('error');
          return;
        }

        // Check if link has expired
        if (link.expires_at && new Date(link.expires_at) < new Date()) {
          setError('This link has expired');
          setStatus('error');
          return;
        }

        // Track the click (don't wait for it)
        const trackClick = async () => {
          try {
            // Skip tracking if Supabase is not properly configured
            if (!supabaseUrl || !supabaseKey || 
                supabaseUrl.includes('your-project') ||
                supabaseKey.includes('your-anon')) {
              return;
            }

            // Get basic client info
            const userAgent = navigator.userAgent;
            const referrer = document.referrer;

            // Insert analytics record
            await supabase
              .from('link_analytics')
              .insert({
                link_id: link.id,
                user_agent: userAgent,
                referrer: referrer || null,
                timestamp: new Date().toISOString()
              });

            // Update click count
            await supabase
              .from('links')
              .update({ click_count: (link.click_count || 0) + 1 })
              .eq('id', link.id);
          } catch (error) {
            // Silently fail analytics tracking - don't block redirect
            console.warn('Analytics tracking failed:', error);
          }
        };

        // Track click asynchronously
        trackClick();

        // Set redirecting status
        setStatus('redirecting');

        // Redirect to the original URL
        window.location.href = link.original_url;

      } catch (error) {
        console.error('Redirect error:', error);
        
        // Check if it's a network/connection error
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          setError('Unable to connect to database. Please check your internet connection or contact support.');
        } else {
          setError('An unexpected error occurred while processing your request.');
        }
        setStatus('error');
      }
    };

    handleRedirect();
  }, [shortCode]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'redirecting') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  if (status === 'not-found') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            404 - Link Not Found
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            The short link you're looking for doesn't exist or has been removed.
          </p>
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Link Unavailable
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {error}
          </p>
          <div className="space-y-4">
            <a
              href="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Homepage
            </a>
            {error.includes('Database connection') && (
              <div className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                <p className="mb-2">If you're the site owner, please:</p>
                <ul className="text-left space-y-1">
                  <li>• Check your .env file has valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY</li>
                  <li>• Ensure your Supabase project is active</li>
                  <li>• Verify your network connection</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default RedirectHandler;