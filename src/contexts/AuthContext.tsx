import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, executeQuery, resetSupabaseClient } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { UserProfile } from '../types/database';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  console.log('AuthContext: Component rendered', { user: user?.id, loading, profile: profile?.username });

  useEffect(() => {
    console.log('AuthContext: useEffect triggered');
    
    // Validate Supabase configuration before proceeding
    const validateSupabaseConfig = () => {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!url || !key || 
          url === 'https://your-project.supabase.co' || 
          key === 'your-anon-key' ||
          url.includes('your-project') ||
          key.includes('your-anon')) {
        console.error('AuthContext: Invalid Supabase configuration detected');
        setUser(null);
        setProfile(null);
        setLoading(false);
        return false;
      }
      
      // Validate anon key format (should be a JWT)
      if (!key.startsWith('eyJ')) {
        console.error('AuthContext: Invalid anon key format - should be a JWT token');
        setUser(null);
        setProfile(null);
        setLoading(false);
        return false;
      }
      
      return true;
    };
    
    if (!validateSupabaseConfig()) {
      return;
    }
    
    // Clear any corrupted auth tokens on startup
    try {
      const authToken = localStorage.getItem('supabase.auth.token');
      if (authToken) {
        const parsed = JSON.parse(authToken);
        // Check if token is malformed or missing required claims
        if (!parsed.access_token || !parsed.refresh_token) {
          console.log('AuthContext: Clearing corrupted auth tokens');
          localStorage.removeItem('supabase.auth.token');
          sessionStorage.clear();
        }
      }
    } catch (error) {
      console.log('AuthContext: Clearing invalid auth tokens due to parse error');
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
    }
    
    // Get initial session
    const getSession = async () => {
      try {
        console.log('AuthContext: Getting initial session...');
        
        // Get session without calling protected endpoints
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('AuthContext: Session error', sessionError);
          console.log('AuthContext: No valid session, continuing as guest');
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }
        
        console.log('AuthContext: Initial session check', { 
          user: session?.user?.id, 
          event: 'initial',
          hasSession: !!session,
          sessionExpiry: session?.expires_at 
        });
        
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('AuthContext: Valid session found, fetching profile for user', session.user.id);
          await fetchProfile(session.user.id);
        } else {
          console.log('AuthContext: No session found, clearing profile');
          setProfile(null);
        }
      } catch (error) {
        console.error('AuthContext: Error getting initial session', error);
        // Don't call any protected endpoints when there's an error
        setUser(null);
        setProfile(null);
      } finally {
        console.log('AuthContext: Setting loading to false');
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthContext: Auth state change', { 
        event, 
        user: session?.user?.id,
        hasSession: !!session,
        sessionExpiry: session?.expires_at 
      });
      setUser(session?.user ?? null);
      
      // Validate session user before proceeding
      if (session?.user && !session.user.id) {
        console.error('AuthContext: Invalid session in auth change - missing user ID');
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      
      if (session?.user) {
        console.log('AuthContext: Fetching profile after auth change for user', session.user.id);
        await fetchProfile(session.user.id);
      } else {
        console.log('AuthContext: Clearing profile after auth change');
        setProfile(null);
      }
      setLoading(false);
    });

    // Listen for storage events (cross-tab/session change)
    const handleStorageChange = (event: StorageEvent) => {
      console.log('AuthContext: Storage event', { 
        key: event.key, 
        newValue: event.newValue,
        oldValue: event.oldValue,
        url: event.url 
      });
      if (event.key === 'supabase.auth.token') {
        console.log('AuthContext: Supabase auth token changed, re-fetching session');
        supabase.auth.getSession().then(({ data: { session } }) => {
          console.log('AuthContext: Session after storage change', { 
            user: session?.user?.id,
            hasSession: !!session,
            sessionExpiry: session?.expires_at 
          });
          setUser(session?.user ?? null);
          if (session?.user) {
            console.log('AuthContext: Fetching profile after storage change for user', session.user.id);
            fetchProfile(session.user.id);
          } else {
            console.log('AuthContext: Clearing profile after storage change');
            setProfile(null);
          }
          setLoading(false);
        }).catch(error => {
          console.error('AuthContext: Error getting session after storage change', error);
          setUser(null);
          setProfile(null);
          setLoading(false);
        });
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Listen for custom events from short link redirects
    const handleShortLinkRedirect = (event: CustomEvent) => {
      console.log('AuthContext: Short link redirect detected', event.detail);
      
      // Proactively reset network connection when short link is opened
      setTimeout(async () => {
        console.log('AuthContext: Proactively resetting network connection after short link redirect');
        await resetSupabaseClient();
      }, 1000); // Small delay to let the redirect complete
    };
    window.addEventListener('shortLinkRedirect', handleShortLinkRedirect as EventListener);

    // Detect when user returns to tab after opening short link
    let tabHiddenTime: number | null = null;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab became hidden (user opened short link in new tab)
        tabHiddenTime = Date.now();
        console.log('AuthContext: Tab hidden - user likely opened short link');
      } else {
        // Tab became visible again (user returned)
        if (tabHiddenTime && (Date.now() - tabHiddenTime) > 2000) {
          // Tab was hidden for more than 2 seconds, likely a short link redirect
          console.log('AuthContext: Tab visible again after short link redirect, performing nuclear reset');
          setTimeout(async () => {
            // Import the nuclear reset function
            const { nuclearNetworkReset } = await import('../lib/supabase');
            await nuclearNetworkReset();
          }, 500);
        }
        tabHiddenTime = null;
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Periodic session check (every 30 seconds) as a fallback
    const sessionCheckInterval = setInterval(async () => {
      try {
        console.log('AuthContext: Periodic session check');
        const { data: { session } } = await supabase.auth.getSession();
        const currentUserId = user?.id;
        const newUserId = session?.user?.id;
        
        console.log('AuthContext: Session comparison', { 
          current: currentUserId, 
          new: newUserId,
          hasSession: !!session 
        });
        
        if (currentUserId !== newUserId) {
          console.log('AuthContext: Session mismatch detected', { current: currentUserId, new: newUserId });
          setUser(session?.user ?? null);
          if (session?.user) {
            console.log('AuthContext: Fetching profile after session mismatch for user', session.user.id);
            await fetchProfile(session.user.id);
          } else {
            console.log('AuthContext: Clearing profile after session mismatch');
            setProfile(null);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('AuthContext: Error in periodic session check', error);
      }
    }, 30000);

    return () => {
      console.log('AuthContext: Cleaning up event listeners');
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('shortLinkRedirect', handleShortLinkRedirect as EventListener);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(sessionCheckInterval);
    };
  }, [user?.id]); // Add user.id as dependency to detect changes

  const fetchProfile = async (userId: string) => {
    // Validate Supabase configuration
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!url || !key || 
        url === 'https://your-project.supabase.co' || 
        key === 'your-anon-key' ||
        url.includes('your-project') ||
        key.includes('your-anon') ||
        !key.startsWith('eyJ')) {
      console.log('AuthContext: Skipping profile fetch - Supabase not configured');
      return;
    }
    
    try {
      console.log('AuthContext: Fetching profile for user', userId);
      
      const result = await executeQuery(
        async () => {
          return await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();
        },
        {
          timeout: 8000,
          maxRetries: 1,
          retryDelay: 1000
        }
      );

      if (result.error) {
        console.error('AuthContext: Error fetching profile', result.error);
        // Only set profile to null if it's a real error, not a timeout
        if (!result.error.message?.includes('timeout')) {
          setProfile(null);
        }
        return;
      }

      const profileData = result.data as UserProfile | null;
      console.log('AuthContext: Profile fetched successfully', { username: profileData?.username });
      setProfile(profileData);
    } catch (error) {
      console.error('AuthContext: Exception fetching profile', error);
      // Don't clear profile on network errors
    }
  };

  const signIn = async (email: string, password: string) => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!url || !key || 
        url === 'https://your-project.supabase.co' || 
        key === 'your-anon-key' ||
        url.includes('your-project') ||
        key.includes('your-anon') ||
        !key.startsWith('eyJ')) {
      return { error: 'Supabase not configured properly. Please check your .env file and ensure you have valid credentials.' };
    }
    
    // Clear any existing corrupted tokens before signing in
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.clear();
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, username: string) => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!url || !key || 
        url === 'https://your-project.supabase.co' || 
        key === 'your-anon-key' ||
        url.includes('your-project') ||
        key.includes('your-anon') ||
        !key.startsWith('eyJ')) {
      return { error: 'Supabase not configured properly. Please check your .env file and ensure you have valid credentials.' };
    }
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!url || !key || 
        url === 'https://your-project.supabase.co' || 
        key === 'your-anon-key' ||
        url.includes('your-project') ||
        key.includes('your-anon') ||
        !key.startsWith('eyJ')) {
      return { error: 'Supabase not configured properly. Please check your .env file and ensure you have valid credentials.' };
    }
    
    // Clear tokens before and after sign out
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.clear();
    
    const { error } = await supabase.auth.signOut();
    
    // Ensure tokens are cleared after sign out
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.clear();
    
    return { error };
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: 'No user logged in' };
    
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!url || !key || 
        url === 'https://your-project.supabase.co' || 
        key === 'your-anon-key' ||
        url.includes('your-project') ||
        key.includes('your-anon') ||
        !key.startsWith('eyJ')) {
      return { error: 'Supabase not configured properly. Please check your .env file and ensure you have valid credentials.' };
    }

    const { error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id);

    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    }

    return { error };
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};