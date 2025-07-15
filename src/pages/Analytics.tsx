import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BarChart3, TrendingUp, Globe, Smartphone, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { Link, LinkAnalytics } from '../types/database';
import Button from '../components/ui/Button';

const Analytics: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedLinkId = searchParams.get('link');
  
  const [links, setLinks] = useState<Link[]>([]);
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  const [analytics, setAnalytics] = useState<LinkAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Fetch links when user is available
  useEffect(() => {
    if (user && !authLoading) {
      fetchLinks();
    }
  }, [user, authLoading]);

  const fetchLinks = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('links')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const linksData = data || [];
      setLinks(linksData);
      
      // Set selected link
      if (linksData.length > 0) {
        const linkToSelect = selectedLinkId 
          ? linksData.find(l => l.id === selectedLinkId) || linksData[0]
          : linksData[0];
        
        setSelectedLink(linkToSelect);
        await fetchAnalytics(linkToSelect.id);
      }
    } catch (err: any) {
      console.error('Error fetching links:', err);
      setError(err.message || 'Failed to load links');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async (linkId: string) => {
    try {
      const { data, error } = await supabase
        .from('link_analytics')
        .select('*')
        .eq('link_id', linkId)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      
      setAnalytics(data || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics([]);
    }
  };

  const handleLinkChange = async (linkId: string) => {
    const link = links.find(l => l.id === linkId);
    if (link) {
      setSelectedLink(link);
      await fetchAnalytics(link.id);
    }
  };

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if no user (will redirect)
  if (!user) {
    return null;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <div className="text-2xl font-bold text-red-600 mb-4">Something went wrong</div>
        <div className="mb-4 text-slate-600 dark:text-slate-400">{error}</div>
        <Button onClick={fetchLinks}>Try Again</Button>
      </div>
    );
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
      percentage: analytics.length > 0 ? Math.round((count / analytics.length) * 100) : 0
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
      percentage: analytics.length > 0 ? Math.round((count / analytics.length) * 100) : 0
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
        {links.length > 0 && (
          <div className="w-full md:w-auto">
            <select
              value={selectedLink?.id || ''}
              onChange={(e) => handleLinkChange(e.target.value)}
              className="w-full md:w-64 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
            >
              {links.map(link => (
                <option key={link.id} value={link.id}>
                  {link.title || link.original_url.slice(0, 50)}...
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading analytics...</p>
        </div>
      ) : selectedLink ? (
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
                      {selectedLink.click_count || 0}
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
                  {deviceStats.length > 0 ? deviceStats.map((device, index) => (
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
                  )) : (
                    <p className="text-slate-500 dark:text-slate-400 text-center py-4">
                      No device data available
                    </p>
                  )}
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
                  {countryStats.length > 0 ? countryStats.slice(0, 5).map((country, index) => (
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
                  )) : (
                    <p className="text-slate-500 dark:text-slate-400 text-center py-4">
                      No country data available
                    </p>
                  )}
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
                {clicksOverTime.length > 0 ? clicksOverTime.map((day, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-slate-500" />
                      <span className="text-slate-700 dark:text-slate-300">{day.date}</span>
                    </div>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {day.clicks} clicks
                    </span>
                  </div>
                )) : (
                  <p className="text-slate-500 dark:text-slate-400 text-center py-4">
                    No click data available
                  </p>
                )}
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