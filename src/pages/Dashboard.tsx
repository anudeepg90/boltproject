import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Link2, BarChart3, QrCode, Copy, ExternalLink, Trash2, Plus, Search, Filter } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
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
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Fetch links function
  const fetchLinks = async () => {
    if (!user || isLoading) return;

    console.log('Dashboard: Starting to fetch links for user', user.id);
    setIsLoading(true);
    setHasError(false);

    try {
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Dashboard: Error fetching links', error);
        throw error;
      }
      
      console.log('Dashboard: Links fetched successfully', { count: data?.length || 0 });
      setLinks(data || []);
      setHasError(false);
    } catch (error) {
      console.error('Dashboard: Error fetching links:', error);
      setHasError(true);
      setLinks([]);
      toast.error('Failed to fetch links. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch links when user is available
  useEffect(() => {
    if (user && !loading) {
      fetchLinks();
    }
  }, [user, loading]);

  // Filter links
  useEffect(() => {
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

    setFilteredLinks(filtered);
  }, [links, searchTerm, filterActive]);

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
    if (!confirm('Are you sure you want to delete this link?')) return;

    try {
      const { error } = await supabase
        .from('links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;
      
      setLinks(links.filter(link => link.id !== linkId));
      toast.success('Link deleted successfully');
    } catch (error) {
      console.error('Error deleting link:', error);
      toast.error('Failed to delete link');
    }
  };

  const toggleActive = async (linkId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('links')
        .update({ is_active: !isActive })
        .eq('id', linkId);

      if (error) throw error;
      
      setLinks(links.map(link => 
        link.id === linkId ? { ...link, is_active: !isActive } : link
      ));
      toast.success(`Link ${!isActive ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error updating link:', error);
      toast.error('Failed to update link');
    }
  };

  // Show loading spinner while auth is loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect if no user
  if (!user) {
    return null;
  }

  // Show error state
  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <div className="text-2xl font-bold text-red-600 mb-4">Something went wrong</div>
        <div className="mb-4 text-slate-600 dark:text-slate-400">
          Failed to load your links. Please try again.
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchLinks}>Try Again</Button>
          <Button onClick={() => window.location.reload()} variant="outline">Refresh Page</Button>
        </div>
      </div>
    );
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
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">Loading your links...</p>
            </div>
          ) : filteredLinks.length === 0 ? (
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