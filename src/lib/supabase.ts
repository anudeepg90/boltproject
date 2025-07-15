import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

// Create Supabase client with proper error handling
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'linkforge-web/1.0'
    }
  }
});

// Helper functions
export const getCurrentUser = async () => {
  try {
    // Validate configuration first
    if (!supabaseUrl || !supabaseAnonKey || 
        supabaseUrl === 'https://your-project.supabase.co' || 
        supabaseAnonKey === 'your-anon-key' ||
        supabaseUrl.includes('your-project') ||
        supabaseAnonKey.includes('your-anon') ||
        !supabaseAnonKey.startsWith('eyJ')) {
      console.log('getCurrentUser: Supabase not configured');
      return null;
    }
    
    // Get session first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      console.log('getCurrentUser: No valid session');
      return null;
    }
    
    return session.user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString();
};

export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};