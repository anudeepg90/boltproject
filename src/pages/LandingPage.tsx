import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Link2, Copy, QrCode, BarChart3, Shield, Zap, Check, Star, ArrowRight, ExternalLink, X, Download } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { generateShortCode, isValidUrl, copyToClipboard } from '../lib/utils';
import toast from 'react-hot-toast';

const LandingPage: React.FC = () => {
  const [url, setUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleShorten = async () => {
    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    if (!isValidUrl(url)) {
      toast.error('Please enter a valid URL');
      return;
    }

    setIsLoading(true);

    try {
      // Check if Supabase is properly configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        throw new Error('Supabase configuration missing. Please set up your environment variables.');
      }

      const shortCode = generateShortCode();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days for guest users

      const { data, error } = await supabase
        .from('links')
        .insert({
          original_url: url,
          short_code: shortCode,
          expires_at: expiresAt.toISOString(),
          user_id: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;

      const shortUrl = `${window.location.origin}/${shortCode}`;
      setShortUrl(shortUrl);
      toast.success('URL shortened successfully!');
    } catch (error) {
      console.error('Error:', error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        toast.error('Connection failed. Please check your Supabase configuration and internet connection.');
      } else if (error instanceof Error && error.message.includes('Supabase configuration')) {
        toast.error('Supabase not configured. Please set up your environment variables.');
      } else {
        toast.error('Failed to shorten URL. Please check your database setup.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await copyToClipboard(shortUrl);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const generateQR = () => {
    if (!shortUrl) return;
    setShowQR(true);
  };

  const closeQR = () => {
    setShowQR(false);
  };

  const downloadQRCode = async () => {
    try {
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=800x800&data=${encodeURIComponent(shortUrl)}&format=jpg&margin=20&color=000000&bgcolor=FFFFFF`;
      
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-code-${shortUrl.split('/').pop()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('QR code downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download QR code');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-purple-900/20 -z-10"></div>
          
          {/* Main Content */}
          <div className="text-center space-y-8">
            {/* Hero Title */}
            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent leading-tight">
                Shorten, Track, and
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                  Optimize Your Links
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
                Transform long URLs into powerful, trackable short links. Perfect for social media, email campaigns, and analytics.
              </p>
            </div>

            {/* URL Shortener Form */}
            <div className="max-w-4xl mx-auto">
              <Card className="shadow-2xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    {/* Input Section */}
                    <div className="flex flex-col lg:flex-row gap-4">
                      <div className="flex-1">
                        <Input
                          placeholder="Enter your long URL here..."
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          className="h-14 text-lg"
                          icon={<Link2 className="h-6 w-6 text-slate-400" />}
                        />
                      </div>
                      <Button
                        onClick={handleShorten}
                        loading={isLoading}
                        size="lg"
                        className="h-14 px-8 text-lg font-semibold"
                      >
                        Shorten URL
                      </Button>
                    </div>

                    {/* Results Section */}
                    {shortUrl && (
                      <div className="flex flex-col items-center w-full space-y-4">
                        <div className="w-full flex flex-col items-center bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200 dark:border-green-800 p-6">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <p className="text-sm font-medium text-green-800 dark:text-green-300">
                              Your shortened URL is ready!
                            </p>
                          </div>
                          {/* Output row: prominent box for the short URL and copy button */}
                          <div className="flex w-full max-w-2xl mx-auto gap-3 justify-center items-center mb-2">
                            <div className="flex-1 flex items-center justify-center">
                              <div className="px-6 py-3 rounded-xl bg-white dark:bg-slate-800 border-2 border-green-200 dark:border-green-800 text-lg font-mono text-slate-900 dark:text-slate-100 shadow-md w-full text-center break-all select-all" style={{ minWidth: '320px' }}>
                                {shortUrl}
                              </div>
                            </div>
                            <Button 
                              onClick={handleCopy} 
                              variant="outline" 
                              size="md"
                              className="h-12 px-4 min-w-[100px]"
                            >
                              <Copy className="h-5 w-5 mr-2" />
                              Copy
                            </Button>
                          </div>
                          {/* Action buttons row */}
                          <div className="flex flex-wrap items-center gap-3 w-full max-w-2xl mx-auto justify-center">
                            <Button 
                              onClick={generateQR} 
                              variant="outline" 
                              size="md"
                              className="h-12 px-4 min-w-[140px]"
                            >
                              <QrCode className="h-5 w-5 mr-2" />
                              Generate QR Code
                            </Button>
                            <Button 
                              onClick={() => window.open(shortUrl, '_blank')}
                              variant="outline" 
                              size="md"
                              className="h-12 px-4 min-w-[120px]"
                            >
                              <ExternalLink className="h-5 w-5 mr-2" />
                              Open Link
                            </Button>
                            {!user && (
                              <Button 
                                onClick={() => navigate('/register')} 
                                size="md"
                                className="h-12 px-4 min-w-[180px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                              >
                                Sign Up for More Features
                              </Button>
                            )}
                          </div>
                        </div>
                        {!user && (
                          <div className="w-full p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 text-center">
                            <p className="text-sm text-blue-800 dark:text-blue-300">
                              <strong>Guest limitations:</strong> 7-day expiry, basic analytics only. 
                              <button
                                onClick={() => navigate('/register')}
                                className="text-blue-600 dark:text-blue-400 hover:underline ml-1 font-semibold"
                              >
                                Sign up for unlimited features!
                              </button>
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-12">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100">
                Why Choose LinkForge?
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
                Powerful features designed to make link management simple and effective
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <Card className="p-8 text-center border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                  Lightning Fast
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Create short links instantly with our optimized platform. No waiting, no delays.
                </p>
              </Card>

              {/* Feature 2 */}
              <Card className="p-8 text-center border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                  Advanced Analytics
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Track clicks, locations, devices, and more. Get insights into your link performance.
                </p>
              </Card>

              {/* Feature 3 */}
              <Card className="p-8 text-center border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                  Secure & Reliable
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Enterprise-grade security with 99.9% uptime. Your links are always accessible.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Start Shortening?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who trust LinkForge for their link management needs
          </p>
          <Button
            onClick={() => navigate('/register')}
            size="lg"
            className="bg-white text-blue-600 hover:bg-blue-50 shadow-xl text-lg font-semibold px-8 py-4"
          >
            Get Started Free
            <ArrowRight className="ml-2 h-6 w-6" />
          </Button>
        </div>
      </section>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-8 relative">
            <button
              onClick={closeQR}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-6 w-6 text-slate-500" />
            </button>
            
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  QR Code
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Scan this QR code to visit your shortened link
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-lg">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=800x800&data=${encodeURIComponent(shortUrl)}&format=jpg&margin=20&color=000000&bgcolor=FFFFFF`}
                  alt="QR Code"
                  className="w-full h-auto rounded-xl"
                />
              </div>
              
              <div className="space-y-3">
                <p className="text-sm text-slate-500 dark:text-slate-400 break-all">
                  {shortUrl}
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(shortUrl);
                      toast.success('QR code URL copied!');
                    }}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy URL
                  </Button>
                  <Button
                    onClick={downloadQRCode}
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download JPG
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;