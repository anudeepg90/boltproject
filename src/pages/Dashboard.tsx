import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Link2, BarChart3, QrCode, Copy, ExternalLink, Trash2, Plus, Search, Filter } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { supabase, checkSupabaseConnection, resetSupabaseClient, executeQuery } from '../lib/supabase';
import { Link } from '../types/database';
import { formatDate, copyToClipboard } from '../lib/utils';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [links, setLinks] = useState<Link[]>([]);
  const [filteredLinks, setFilteredLinks] = useState<Link[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'expired'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  console.log('Dashboard: Component rendered', { 
    user: user?.id, 
    loading, 
    isLoading, 
    hasError, 
    retryCount,
    linksCount: links.length 
  });

  useEffect(() => {
    console.log('Dashboard: Auth check effect', { user: user?.id, loading });
    if (!loading && !user) {
      console.log('Dashboard: No user, navigating to login');
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    console.log('Dashboard: User effect triggered', { user: user?.id });
    if (user) {
      console.log('Dashboard: User exists, fetching links');
      fetchLinks();
    } else {
      console.log('Dashboard: No user, resetting state');
      // Reset state when user is null
      setIsLoading(false);
      setLinks([]);
      setFilteredLinks([]);
      setHasError(false);
      setRetryCount(0);
    }
  }, [user]);

  // Auto-retry mechanism if stuck in loading
  useEffect(() => {
    console.log('Dashboard: Auto-retry effect', { isLoading, user: user?.id, loading, retryCount });
    if (isLoading && user && !loading) {
      const timeout = setTimeout(() => {
        console.log('Dashboard: Auto-retry after timeout', { retryCount });
        setRetryCount(prev => prev + 1);
        fetchLinks();
      }, 5000); // 5 second timeout

      return () => {
        console.log('Dashboard: Clearing auto-retry timeout');
        clearTimeout(timeout);
      };
    }
  }, [isLoading, user, loading, retryCount]);

  useEffect(() => {
    console.log('Dashboard: Filter effect', { linksCount: links.length, searchTerm, filterActive });
    filterLinks();
  }, [links, searchTerm, filterActive]);

  const fetchLinks = async () => {
    try {
      console.log('Dashboard: Starting fetchLinks', { user: user?.id });
      setIsLoading(true);
      setHasError(false);
      
      // Check if user is still valid
      if (!user) {
        console.log('Dashboard: No user during fetch, stopping');
        setIsLoading(false);
        return;
      }

      // Validate session before making API calls
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session?.user) {
          console.log('Dashboard: No valid session, redirecting to login');
          navigate('/login');
          return;
        }
        
        if (session.user.id !== user.id) {
          console.log('Dashboard: Session user mismatch, refreshing auth');
          window.location.reload();
          return;
        }
      } catch (sessionCheckError) {
        console.error('Dashboard: Session check failed', sessionCheckError);
        setHasError(true);
        setIsLoading(false);
        return;
      }

      console.log('Dashboard: Fetching links for user', user.id);
      
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
        console.error('Dashboard: Supabase error fetching links', result.error);
        
        // Handle specific error types
        if (result.error.message?.includes('invalid claim') || 
            result.error.message?.includes('bad_jwt') ||
            result.error.message?.includes('403')) {
          console.log('Dashboard: Auth error detected, redirecting to login');
          navigate('/login');
          return;
        }
        
        throw result.error;
      }
      
      console.log('Dashboard: Links fetched successfully', { count: result.data?.length });
      setLinks(result.data || []);
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error('Dashboard: Error fetching links:', error);
      
      // Handle different error types appropriately
      if (error instanceof Error) {
        if (error.message?.includes('invalid claim') || 
            error.message?.includes('bad_jwt') ||
            error.message?.includes('403')) {
          console.log('Dashboard: Auth error in catch, redirecting to login');
          navigate('/login');
          return;
        }
        
        if (error.message?.includes('timeout') || 
            error.message?.includes('network')) {
          toast.error('Network error. Please check your connection and try again.');
        } else {
          toast.error('Failed to fetch links. Please refresh or sign in again.');
        }
      }
      
      setHasError(true);
      setLinks([]);
    } finally {
      console.log('Dashboard: Setting isLoading to false');
      setIsLoading(false);
    }
  };

  const filterLinks = () => {
    console.log('Dashboard: Filtering links', { 
      totalLinks: links.length, 
      searchTerm, 
      filterActive 
    });
    
    let filtered = links;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(link =>
        link.original_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.short_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply active/expired filter
    if (filterActive !== 'all') {
      const now = new Date();
      filtered = filtered.filter(link => {
        const isExpired = link.expires_at && new Date(link.expires_at) < now;
        if (filterActive === 'active') return !isExpired && link.is_active;
        if (filterActive === 'expired') return isExpired || !link.is_active;
        return true;
      });
    }

    console.log('Dashboard: Filtered links result', { 
      original: links.length, 
      filtered: filtered.length 
    });
    setFilteredLinks(filtered);
  };

  const handleCopy = async (shortCode: string) => {
    const shortUrl = `${window.location.origin}/${shortCode}`;
    try {
      await copyToClipboard(shortUrl);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleDelete = async (linkId: string) => {
    try {
      const result = await executeQuery(
        async () => {
          return await supabase
            .from('links')
            .delete()
            .eq('id', linkId);
        },
        {
          timeout: 8000,
          maxRetries: 2,
          retryDelay: 1000
        }
      );

      if (result.error) throw result.error;
      
      setLinks(links.filter(link => link.id !== linkId));
      toast.success('Link deleted successfully');
    } catch (error) {
      console.error('Error deleting link:', error);
      toast.error('Failed to delete link');
    }
  };

  const toggleActive = async (linkId: string, isActive: boolean) => {
    try {
      const result = await executeQuery(
        async () => {
          return await supabase
            .from('links')
            .update({ is_active: !isActive })
            .eq('id', linkId);
        },
        {
          timeout: 8000,
          maxRetries: 2,
          retryDelay: 1000
        }
      );

      if (result.error) throw result.error;
      
      setLinks(links.map(link => 
        link.id === linkId ? { ...link, is_active: !isActive } : link
      ));
      toast.success(`Link ${!isActive ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error updating link:', error);
      toast.error('Failed to update link');
    }
  };

  const handleRefresh = async () => {
    console.log('Dashboard: Manual refresh triggered');
    setRetryCount(0);
    setHasError(false);
    fetchLinks();
  };

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <div className="text-2xl font-bold text-red-600 mb-4">Something went wrong</div>
        <div className="mb-4 text-slate-600 dark:text-slate-400">
          Failed to load your links. {retryCount > 0 && `Retried ${retryCount} times.`}
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh}>Try Again</Button>
          <Button onClick={() => window.location.reload()} variant="outline">Refresh Page</Button>
          <Button onClick={() => navigate('/login')} variant="outline">Sign In Again</Button>
        </div>
      </div>
    );
  }

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const stats = {
    totalLinks: links.length,
    activeLinks: links.filter(link => link.is_active).length,
    totalClicks: links.reduce((sum, link) => sum + link.click_count, 0),
    expiredLinks: links.filter(link => 
      link.expires_at && new Date(link.expires_at) < new Date()
    ).length
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Welcome back, {profile?.username || user.email}
          </p>
        </div>
        <div className="flex gap-4">
          <Button onClick={() => navigate('/analytics')}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button onClick={() => navigate('/')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Link
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Links</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {stats.totalLinks}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Link2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Active Links</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {stats.activeLinks}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                <ExternalLink className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Clicks</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {stats.totalClicks}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Expired Links</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {stats.expiredLinks}
                </p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Links Management */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Your Links
            </h2>
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search links..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full md:w-64"
                />
              </div>
              <select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'expired')}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
              >
                <option value="all">All Links</option>
                <option value="active">Active Only</option>
                <option value="expired">Expired Only</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredLinks.length === 0 ? (
            <div className="text-center py-12">
              <Link2 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                {links.length === 0 ? 'No links created yet' : 'No links match your search'}
              </p>
              <Button onClick={() => navigate('/')}>
                Create Your First Link
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLinks.map((link) => (
                <div
                  key={link.id}
                  className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-slate-900 dark:text-slate-100 truncate">
                          {link.title || link.original_url}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          link.is_active 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        }`}>
                          {link.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 truncate">
                        {link.original_url}
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                        {window.location.origin}/{link.short_code}
                      </p>
                      <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <span>Created: {formatDate(link.created_at)}</span>
                        <span>Clicks: {link.click_count}</span>
                        {link.expires_at && (
                          <span>Expires: {formatDate(link.expires_at)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleCopy(link.short_code)}
                        variant="outline"
                        size="sm"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => navigate(`/analytics?link=${link.id}`)}
                        variant="outline"
                        size="sm"
                      >
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => window.open(`${window.location.origin}/${link.short_code}`, '_blank')}
                        variant="outline"
                        size="sm"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => toggleActive(link.id, link.is_active)}
                        variant="outline"
                        size="sm"
                      >
                        {link.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        onClick={() => handleDelete(link.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;