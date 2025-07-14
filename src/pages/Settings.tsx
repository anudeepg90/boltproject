import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Bell, CreditCard, Globe, Shield } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const { user, profile, loading, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    username: profile?.username || '',
    email: user?.email || '',
  });

  React.useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const { error } = await updateProfile({
        username: formData.username,
      });

      if (error) throw error;
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Settings
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Profile Settings
            </h2>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter your username"
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                disabled
                placeholder="Your email address"
              />
            </div>
            <Button type="submit" loading={isUpdating}>
              Update Profile
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Current Plan
            </h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-medium text-slate-900 dark:text-slate-100">
                {profile?.plan_type === 'free' ? 'Free Plan' : 
                 profile?.plan_type === 'starter' ? 'Starter Plan' :
                 profile?.plan_type === 'professional' ? 'Professional Plan' :
                 'Enterprise Plan'}
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                {profile?.plan_type === 'free' ? 'Basic features with limited usage' :
                 'Full access to premium features'}
              </p>
            </div>
            <Button onClick={() => navigate('/pricing')} variant="outline">
              {profile?.plan_type === 'free' ? 'Upgrade Plan' : 'Manage Plan'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Security Settings
            </h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  Change Password
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Update your password to keep your account secure
                </p>
              </div>
              <Button variant="outline">
                Change Password
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  Two-Factor Authentication
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Button variant="outline">
                Enable 2FA
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Preferences
            </h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  Email Notifications
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Receive emails about your account activity
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  defaultChecked
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  Link Expiration Notifications
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Get notified when your links are about to expire
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  defaultChecked
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
            <h2 className="text-xl font-semibold text-red-900 dark:text-red-100">
              Danger Zone
            </h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-red-900 dark:text-red-100">
                  Delete Account
                </p>
                <p className="text-sm text-red-600 dark:text-red-400">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <Button variant="danger">
                Delete Account
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;