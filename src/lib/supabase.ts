import { createClient } from '@supabase/supabase-js';
import { useAuth, useSession } from '@clerk/clerk-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are properly configured
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not configured. Using mock mode.');
}

// Use placeholder values if environment variables are not set
const defaultUrl = 'https://placeholder.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder';

export const supabase = createClient(
  supabaseUrl || defaultUrl,
  supabaseAnonKey || defaultKey, 
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'X-Client-Info': 'gestfin-app'
      }
    }
  }
);

// Function to create authenticated Supabase client
export const createAuthenticatedSupabaseClient = async (getToken: () => Promise<string | null>) => {
  try {
    const token = await getToken({ template: 'supabase' });
    
    if (!token) {
      throw new Error('No Supabase token available');
    }

    // Create a new Supabase client with the Clerk token
    const authenticatedSupabase = createClient(
      supabaseUrl || defaultUrl,
      supabaseAnonKey || defaultKey,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Client-Info': 'gestfin-app'
          }
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }
    );

    return authenticatedSupabase;
  } catch (error) {
    console.error('Error creating authenticated Supabase client:', error);
    throw error;
  }
};

// Hook to get authenticated Supabase client
export const useSupabase = () => {
  const { getToken, isSignedIn } = useAuth();
  
  const getAuthenticatedClient = async () => {
    if (!isSignedIn) {
      throw new Error('User not authenticated');
    }
    
    return createAuthenticatedSupabaseClient(getToken);
  };
  
  return {
    supabase,
    getAuthenticatedClient
  };
};
// Rate limiting configuration
export const RATE_LIMITS = {
  TRANSACTIONS_PER_MINUTE: 10,
  CATEGORIES_PER_MINUTE: 5,
  PAYABLES_PER_MINUTE: 5,
  API_CALLS_PER_MINUTE: 30
};

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(key: string, limit: number): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  
  const current = rateLimitStore.get(key);
  
  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= limit) {
    return false;
  }
  
  current.count++;
  return true;
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}

export function validateAmount(amount: number): boolean {
  return !isNaN(amount) && amount > 0 && amount <= 1000000;
}

export function validateDate(date: string): boolean {
  const parsedDate = new Date(date);
  const now = new Date();
  const minDate = new Date('2000-01-01');
  
  return parsedDate instanceof Date && 
         !isNaN(parsedDate.getTime()) && 
         parsedDate >= minDate && 
         parsedDate <= now;
}