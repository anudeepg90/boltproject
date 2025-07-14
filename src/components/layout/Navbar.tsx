import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Link as LinkIcon, Moon, Sun, Menu, X } from 'lucide-react';
import Button from '../ui/Button';
import { useState } from 'react';
import toast from 'react-hot-toast';

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    // Show confirmation dialog
    const confirmed = window.confirm('Are you sure you want to sign out?');
    if (!confirmed) return;

    setIsSigningOut(true);
    try {
      const { error } = await signOut();
      if (error) {
        toast.error('Failed to sign out. Please try again.');
        return;
      }

      // Clear any cached data
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
      
      // Force a page reload to clear any cached state
      window.location.href = '/';
      
      toast.success('Signed out successfully!');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <LinkIcon className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              LinkForge
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Home
            </Link>
            {user ? (
              <>
                <Link to="/dashboard" className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Dashboard
                </Link>
                <Link to="/analytics" className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Analytics
                </Link>
                <Link to="/settings" className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Settings
                </Link>
              </>
            ) : (
              <Link to="/pricing" className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Pricing
              </Link>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-2">
            {user ? (
              <>
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center mr-2"
                  aria-label="Toggle theme"
                >
                  {theme === 'light' ? <Moon className="h-5 w-5 text-blue-600" /> : <Sun className="h-5 w-5 text-yellow-400" />}
                </button>
                <span className="text-sm text-slate-600 dark:text-slate-400 mr-2">
                  {user.email}
                </span>
                <Button 
                  onClick={handleSignOut} 
                  variant="outline" 
                  size="sm"
                  disabled={isSigningOut}
                >
                  {isSigningOut ? 'Signing Out...' : 'Sign Out'}
                </Button>
              </>
            ) : (
              <>
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center mr-2"
                  aria-label="Toggle theme"
                >
                  {theme === 'light' ? <Moon className="h-5 w-5 text-blue-600" /> : <Sun className="h-5 w-5 text-yellow-400" />}
                </button>
                <Button onClick={() => navigate('/login')} variant="ghost" size="sm">
                  Sign In
                </Button>
                <Button onClick={() => navigate('/register')} size="sm">
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center space-x-2 mb-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? <Moon className="h-5 w-5 text-blue-600" /> : <Sun className="h-5 w-5 text-yellow-400" />}
              </button>
            </div>
            <div className="flex flex-col space-y-4">
              <Link to="/" className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Home
              </Link>
              {user ? (
                <>
                  <Link to="/dashboard" className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Dashboard
                  </Link>
                  <Link to="/analytics" className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Analytics
                  </Link>
                  <Link to="/settings" className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Settings
                  </Link>
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      {user.email}
                    </p>
                    <Button 
                      onClick={handleSignOut} 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      disabled={isSigningOut}
                    >
                      {isSigningOut ? 'Signing Out...' : 'Sign Out'}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/pricing" className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Pricing
                  </Link>
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col space-y-2">
                    <Button onClick={() => navigate('/login')} variant="ghost" size="sm" className="w-full">
                      Sign In
                    </Button>
                    <Button onClick={() => navigate('/register')} size="sm" className="w-full">
                      Get Started
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;