import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

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
              .update({ 
                click_count: link.click_count ? link.click_count + 1 : 1 
              })
              .eq('id', link.id);
          } catch (error) {
            console.error('Analytics tracking failed:', error);
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
        setError('An unexpected error occurred');
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

  return null;
};

export default RedirectHandler;