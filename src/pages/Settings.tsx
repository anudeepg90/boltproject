import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Shield } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const { user, profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    username: profile?.username || '',
  });

  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

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
                value={user.email || ''}
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
            <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
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
    </div>
  );
};

export default Settings;