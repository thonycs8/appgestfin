import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

console.log('🔧 Initializing Supabase client with URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false, // Clerk handles token refresh
    persistSession: false,   // Don't persist sessions since Clerk manages auth
    detectSessionInUrl: false // Don't detect sessions from URL
  },
  global: {
    headers: {
      'X-Client-Info': 'gestfin-app'
    }
  }
});

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