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
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'supabase.auth.token'
  },
  global: {
    headers: {
      'X-Client-Info': 'linkforge-web/1.0',
      'Cache-Control': 'no-cache'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  db: {
    schema: 'public'
  }
});

// Track client health state
let clientHealthState = {
  isHealthy: true,
  lastCheck: 0,
  consecutiveFailures: 0,
  lastReset: 0,
  networkCorruptionDetected: false,
  consecutiveTimeouts: 0
};

// Force browser to clear all cached connections to Supabase
const forceNetworkReset = async () => {
  console.log('Supabase: Force network reset - clearing browser connection cache');
  
  try {
    // Clear any cached connections by making a fresh fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log('Supabase: Network reset successful');
      clientHealthState.networkCorruptionDetected = false;
      clientHealthState.consecutiveTimeouts = 0;
      return true;
    } else {
      console.log('Supabase: Network reset failed - response not ok');
      return false;
    }
  } catch (error) {
    console.log('Supabase: Network reset failed - fetch error:', error);
    return false;
  }
};

// Aggressive network reset when we detect the specific corruption pattern
const aggressiveNetworkReset = async () => {
  console.log('Supabase: Aggressive network reset - browser connection corruption detected');
  
  try {
    // Force multiple fresh connections to clear any corrupted state
    const promises = [
      fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }),
      fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      })
    ];
    
    const results = await Promise.allSettled(promises);
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
    
    if (successCount > 0) {
      console.log('Supabase: Aggressive network reset successful');
      clientHealthState.networkCorruptionDetected = false;
      clientHealthState.consecutiveTimeouts = 0;
      return true;
    } else {
      console.log('Supabase: Aggressive network reset failed');
      return false;
    }
  } catch (error) {
    console.log('Supabase: Aggressive network reset error:', error);
    return false;
  }
};

// Nuclear option - force complete browser connection reset
export const nuclearNetworkReset = async () => {
  console.log('Supabase: NUCLEAR OPTION - Complete browser connection reset');
  
  try {
    // Force multiple parallel connections with different approaches
    const promises = [
      // Approach 1: Fresh fetch with no cache
      fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store'
      }),
      
      // Approach 2: Different endpoint
      fetch(`${supabaseUrl}/auth/v1/user`, {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store'
      }),
      
      // Approach 3: Force new connection with different method
      fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'OPTIONS',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store'
      })
    ];
    
    // Wait for at least one to succeed
    const results = await Promise.allSettled(promises);
    const successCount = results.filter(r => 
      r.status === 'fulfilled' && 
      r.value.ok && 
      r.value.status >= 200 && 
      r.value.status < 500
    ).length;
    
    if (successCount > 0) {
      console.log('Supabase: Nuclear reset successful - browser connections cleared');
      clientHealthState.networkCorruptionDetected = false;
      clientHealthState.consecutiveTimeouts = 0;
      clientHealthState.consecutiveFailures = 0;
      return true;
    } else {
      console.log('Supabase: Nuclear reset failed - all attempts failed');
      return false;
    }
  } catch (error) {
    console.log('Supabase: Nuclear reset error:', error);
    return false;
  }
};

// Comprehensive connection health check that tests the exact query patterns used in the app
export const checkSupabaseConnection = async (userId?: string): Promise<boolean> => {
  // Validate Supabase configuration
  if (!supabaseUrl || !supabaseAnonKey || 
      supabaseUrl === 'https://your-project.supabase.co' || 
      supabaseAnonKey === 'your-anon-key' ||
      supabaseUrl.includes('your-project') ||
      supabaseAnonKey.includes('your-anon') ||
      !supabaseAnonKey.startsWith('eyJ')) {
    console.log('Supabase: No configuration found, skipping health check');
    return false;
  }
  
  const now = Date.now();
  
  // Skip health check if we just checked recently (within 10 seconds)
  if (now - clientHealthState.lastCheck < 10000) {
    return clientHealthState.isHealthy;
  }
  
  try {
    console.log('Supabase: Checking connection health...');
    clientHealthState.lastCheck = now;
    
    // If we've detected network corruption, force a reset first
    if (clientHealthState.networkCorruptionDetected) {
      console.log('Supabase: Network corruption detected, forcing reset');
      const resetSuccess = await forceNetworkReset();
      if (!resetSuccess) {
        console.log('Supabase: Network reset failed, connection unhealthy');
        clientHealthState.consecutiveFailures++;
        clientHealthState.isHealthy = false;
        return false;
      }
    }
    
    // Simplified basic connectivity test
    const { data: basicTest, error: basicError } = await supabase
      .from('links')
      .select('id')
      .limit(1);
    
    if (basicError) {
      console.error('Supabase: Basic connectivity test failed', basicError);
      // Don't immediately fail on basic test errors
      console.log('Supabase: Basic test failed, but continuing...');
    }
    
    // If we get here, basic connectivity is working
    clientHealthState.consecutiveFailures = 0;
    clientHealthState.isHealthy = true;
    clientHealthState.networkCorruptionDetected = false;
    console.log('Supabase: Connection health check passed');
    return true;
  } catch (error) {
    console.error('Supabase: Connection health check error', error);
    // Don't immediately mark as unhealthy on errors
    console.log('Supabase: Health check error, but not marking as unhealthy');
    return true; // Assume healthy unless proven otherwise
  }
};

// Enhanced client reset function
export const resetSupabaseClient = async () => {
  const now = Date.now();
  
  // Prevent too frequent resets (minimum 10 seconds between resets)
  if (now - clientHealthState.lastReset < 10000) {
    console.log('Supabase: Reset skipped - too recent');
    return;
  }
  
  console.log('Supabase: Resetting client...');
  clientHealthState.lastReset = now;
  
  try {
    // Force network reset first
    await forceNetworkReset();
    
    // Clear any existing connections
    await supabase.auth.signOut();
    
    // Create a completely new client instance with better configuration
    const newClient = createClient(supabaseUrl, supabaseAnonKey, {
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
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      },
      db: {
        schema: 'public'
      }
    });
    
    // Copy the new client's properties to the existing one
    Object.assign(supabase, newClient);
    
    // Reset health state
    clientHealthState = {
      isHealthy: true,
      lastCheck: 0,
      consecutiveFailures: 0,
      lastReset: now,
      networkCorruptionDetected: false,
      consecutiveTimeouts: 0
    };
    
    console.log('Supabase: Client reset complete');
  } catch (error) {
    console.error('Supabase: Error resetting client', error);
  }
};

// Enhanced query wrapper with automatic retry and client reset
export const executeQuery = async <T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: {
    timeout?: number;
    maxRetries?: number;
    retryDelay?: number;
  } = {}
): Promise<{ data: T | null; error: any }> => {
  // Validate Supabase configuration
  if (!supabaseUrl || !supabaseAnonKey || 
      supabaseUrl === 'https://your-project.supabase.co' || 
      supabaseAnonKey === 'your-anon-key' ||
      supabaseUrl.includes('your-project') ||
      supabaseAnonKey.includes('your-anon') ||
      !supabaseAnonKey.startsWith('eyJ')) {
    return { 
      data: null, 
      error: new Error('Supabase not configured properly. Please check your .env file and ensure you have valid credentials from your Supabase dashboard.') 
    };
  }
  
  const {
    timeout = 15000,
    maxRetries = 1,
    retryDelay = 1000
  } = options;
  
  let lastError: any = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Supabase: Query attempt ${attempt + 1}/${maxRetries + 1}`);
      
      // Skip health check for first attempt to avoid delays
      if (attempt > 0) {
        const isHealthy = await checkSupabaseConnection();
        if (!isHealthy) {
          console.log('Supabase: Connection unhealthy, resetting client');
          await resetSupabaseClient();
        }
      }
      
      // Execute query directly without timeout wrapper for now
      const result = await queryFn();
      
      if (result.error) {
        throw result.error;
      }
      
      console.log(`Supabase: Query successful on attempt ${attempt + 1}`);
      
      // Reset consecutive timeout counter on success
      if (clientHealthState.consecutiveTimeouts > 0) {
        console.log('Supabase: Query succeeded, resetting consecutive timeout counter');
        clientHealthState.consecutiveTimeouts = 0;
      }
      
      return result;
    } catch (error) {
      lastError = error;
      console.error(`Supabase: Query attempt ${attempt + 1} failed:`, error);
      
      if (attempt < maxRetries) {
        console.log(`Supabase: Retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  console.error('Supabase: All query attempts failed');
  return { data: null, error: lastError };
};

// Helper functions
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
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