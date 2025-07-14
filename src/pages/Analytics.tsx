import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BarChart3, TrendingUp, Globe, Smartphone, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { supabase, checkSupabaseConnection, resetSupabaseClient, executeQuery } from '../lib/supabase';
import { Link, LinkAnalytics } from '../types/database';
import Button from '../components/ui/Button';

const Analytics: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedLinkId = searchParams.get('link');
  
  const [links, setLinks] = useState<Link[]>([]);
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  const [analytics, setAnalytics] = useState<LinkAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  console.log('Analytics: Component rendered', { 
    user: user?.id, 
    loading, 
    isLoading, 
    hasError, 
    retryCount,
    linksCount: links.length,
    selectedLinkId 
  });

  useEffect(() => {
    console.log('Analytics: Auth check effect', { user: user?.id, loading });
    if (!loading && !user) {
      console.log('Analytics: No user, navigating to login');
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    console.log('Analytics: User effect triggered', { user: user?.id });
    if (user) {
      console.log('Analytics: User exists, fetching links');
      fetchLinks();
    } else {
      console.log('Analytics: No user, resetting state');
      // Reset state when user is null
      setIsLoading(false);
      setLinks([]);
      setSelectedLink(null);
      setAnalytics([]);
      setHasError(false);
      setRetryCount(0);
    }
  }, [user]);

  // Auto-retry mechanism if stuck in loading
  useEffect(() => {
    console.log('Analytics: Auto-retry effect', { isLoading, user: user?.id, loading, retryCount });
    if (isLoading && user && !loading) {
      const timeout = setTimeout(() => {
        console.log('Analytics: Auto-retry after timeout', { retryCount });
        setRetryCount(prev => prev + 1);
        fetchLinks();
      }, 5000); // 5 second timeout

      return () => {
        console.log('Analytics: Clearing auto-retry timeout');
        clearTimeout(timeout);
      };
    }
  }, [isLoading, user, loading, retryCount]);

  useEffect(() => {
    console.log('Analytics: Selected link effect', { selectedLinkId, linksCount: links.length });
    if (selectedLinkId && links.length > 0) {
      const link = links.find(l => l.id === selectedLinkId);
      if (link) {
        console.log('Analytics: Setting selected link', { linkId: link.id });
        setSelectedLink(link);
        fetchAnalytics(link.id);
      }
    }
  }, [selectedLinkId, links]);

  const fetchLinks = async () => {
    try {
      console.log('Analytics: Starting fetchLinks', { user: user?.id });
      setIsLoading(true);
      setHasError(false);
      
      // Check if user is still valid
      if (!user) {
        console.log('Analytics: No user during fetch, stopping');
        setIsLoading(false);
        return;
      }

      console.log('Analytics: Fetching links for user', user.id);
      
      // Use the new executeQuery wrapper for better error handling
      const result = await executeQuery(
        async () => {
          return await supabase
            .from('links')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        },
        {
          timeout: 15000, // 15 second timeout
          maxRetries: 3,
          retryDelay: 2000
        }
      );

      if (result.error) {
        console.error('Analytics: Supabase error fetching links', result.error);
        throw result.error;
      }
      
      console.log('Analytics: Links fetched successfully', { count: result.data?.length });
      setLinks(result.data || []);
      setRetryCount(0); // Reset retry count on success
      
      if (result.data && result.data.length > 0 && !selectedLinkId) {
        console.log('Analytics: Setting first link as selected', { linkId: result.data[0].id });
        setSelectedLink(result.data[0]);
        fetchAnalytics(result.data[0].id);
      }
    } catch (error) {
      console.error('Analytics: Error fetching links:', error);
      setLinks([]);
      setSelectedLink(null);
      setAnalytics([]);
      setHasError(true);
    } finally {
      console.log('Analytics: Setting isLoading to false');
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    console.log('Analytics: Manual refresh triggered');
    setRetryCount(0);
    setHasError(false);
    fetchLinks();
  };

  const fetchAnalytics = async (linkId: string) => {
    try {
      console.log('Analytics: Fetching analytics for link', linkId);
      
      const result = await executeQuery(
        async () => {
          return await supabase
            .from('link_analytics')
            .select('*')
            .eq('link_id', linkId)
            .order('timestamp', { ascending: false });
        },
        {
          timeout: 10000,
          maxRetries: 2,
          retryDelay: 1000
        }
      );

      if (result.error) {
        console.error('Analytics: Supabase error fetching analytics', result.error);
        throw result.error;
      }
      
      console.log('Analytics: Analytics fetched successfully', { count: result.data?.length });
      setAnalytics(result.data || []);
    } catch (error) {
      console.error('Analytics: Error fetching analytics:', error);
      setAnalytics([]);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <div className="text-2xl font-bold text-red-600 mb-4">Something went wrong</div>
        <div className="mb-4 text-slate-600 dark:text-slate-400">
          Failed to load your analytics. {retryCount > 0 && `Retried ${retryCount} times.`}
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh}>Try Again</Button>
          <Button onClick={() => window.location.reload()} variant="outline">Refresh Page</Button>
          <Button onClick={() => navigate('/login')} variant="outline">Sign In Again</Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getDeviceStats = () => {
    const deviceTypes = analytics.reduce((acc, item) => {
      const device = item.device_type || 'Unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(deviceTypes).map(([device, count]) => ({
      name: device,
      value: count,
      percentage: Math.round((count / analytics.length) * 100)
    }));
  };

  const getCountryStats = () => {
    const countries = analytics.reduce((acc, item) => {
      const country = item.country || 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(countries).map(([country, count]) => ({
      name: country,
      value: count,
      percentage: Math.round((count / analytics.length) * 100)
    }));
  };

  const getClicksOverTime = () => {
    const clicksByDate = analytics.reduce((acc, item) => {
      const date = new Date(item.timestamp).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(clicksByDate).map(([date, clicks]) => ({
      date,
      clicks
    }));
  };

  const deviceStats = getDeviceStats();
  const countryStats = getCountryStats();
  const clicksOverTime = getClicksOverTime();

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Analytics
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Track your link performance and engagement
          </p>
        </div>
        
        {/* Link Selector */}
        <div className="w-full md:w-auto">
          <select
            value={selectedLink?.id || ''}
            onChange={(e) => {
              const link = links.find(l => l.id === e.target.value);
              if (link) {
                setSelectedLink(link);
                fetchAnalytics(link.id);
              }
            }}
            className="w-full md:w-64 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
          >
            {links.map(link => (
              <option key={link.id} value={link.id}>
                {link.title || link.original_url.slice(0, 50)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedLink ? (
        <>
          {/* Link Overview */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Link Overview
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Original URL</p>
                  <p className="text-slate-900 dark:text-slate-100 truncate">
                    {selectedLink.original_url}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Short URL</p>
                  <p className="text-blue-600 dark:text-blue-400">
                    {window.location.origin}/{selectedLink.short_code}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Created</p>
                  <p className="text-slate-900 dark:text-slate-100">
                    {new Date(selectedLink.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Clicks</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {selectedLink.click_count}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Unique Visitors</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {analytics.length}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Countries</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {countryStats.length}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                    <Globe className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Devices</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {deviceStats.length}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                    <Smartphone className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Device Breakdown */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Device Breakdown
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deviceStats.map((device, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          index === 0 ? 'bg-blue-500' : 
                          index === 1 ? 'bg-green-500' : 'bg-purple-500'
                        }`} />
                        <span className="text-slate-700 dark:text-slate-300">{device.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {device.percentage}%
                        </span>
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {device.value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Country Breakdown */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Top Countries
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {countryStats.slice(0, 5).map((country, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          index === 0 ? 'bg-blue-500' : 
                          index === 1 ? 'bg-green-500' : 
                          index === 2 ? 'bg-purple-500' : 
                          index === 3 ? 'bg-orange-500' : 'bg-red-500'
                        }`} />
                        <span className="text-slate-700 dark:text-slate-300">{country.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {country.percentage}%
                        </span>
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {country.value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Clicks Over Time */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Clicks Over Time
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clicksOverTime.map((day, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-slate-500" />
                      <span className="text-slate-700 dark:text-slate-300">{day.date}</span>
                    </div>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {day.clicks} clicks
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">
              No links found. Create your first link to see analytics.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Analytics;