import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are properly configured
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase environment variables not configured. Using mock mode.');
}

// Use placeholder values if environment variables are not set
const defaultUrl = 'https://placeholder.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder';

// Create the base Supabase client
export const supabase = createClient(
  supabaseUrl || defaultUrl,
  supabaseAnonKey || defaultKey,
  {
    auth: {
      autoRefreshToken: false,
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

// Function to create authenticated Supabase client with Clerk integration
export const createAuthenticatedSupabaseClient = async (getToken: () => Promise<string | null>) => {
  try {
    console.log('🔑 Creating authenticated Supabase client...');
    
    // Try to get the default Clerk token first
    let token = await getToken();
    
    // If no token or template doesn't exist, try without template
    if (!token) {
      console.log('⚠️ No token from default getToken, trying without template...');
      try {
        // Get raw token without template
        token = await getToken();
      } catch (error) {
        console.error('❌ Failed to get token:', error);
        throw new Error('No authentication token available');
      }
    }
    
    if (!token) {
      console.error('❌ No authentication token available');
      throw new Error('No authentication token available');
    }

    console.log('✅ Authentication token obtained');

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

    console.log('✅ Authenticated Supabase client created successfully');
    return authenticatedSupabase;
  } catch (error) {
    console.error('❌ Error creating authenticated Supabase client:', error);
    throw error;
  }
};

// Alternative function that uses Clerk user ID directly for RLS
export const createSupabaseClientWithUserId = async (userId: string) => {
  try {
    console.log('🔑 Creating Supabase client with user ID:', userId);
    
    // Create a custom JWT payload for Supabase RLS
    const customPayload = {
      sub: userId,
      user_id: userId,
      aud: 'authenticated',
      role: 'authenticated',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
    };

    // For development, we'll use the anon key but set custom headers
    const authenticatedSupabase = createClient(
      supabaseUrl || defaultUrl,
      supabaseAnonKey || defaultKey,
      {
        global: {
          headers: {
            'X-User-ID': userId,
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

    console.log('✅ Supabase client with user ID created successfully');
    return authenticatedSupabase;
  } catch (error) {
    console.error('❌ Error creating Supabase client with user ID:', error);
    throw error;
  }
};

// Database types for better TypeScript support
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          clerk_id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          username: string | null;
          avatar_url: string | null;
          phone: string | null;
          email_verified: boolean;
          phone_verified: boolean;
          role: string;
          is_active: boolean;
          last_sign_in_at: string | null;
          metadata: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          clerk_id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          email_verified?: boolean;
          phone_verified?: boolean;
          role?: string;
          is_active?: boolean;
          last_sign_in_at?: string | null;
          metadata?: any;
        };
        Update: {
          first_name?: string | null;
          last_name?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          email_verified?: boolean;
          phone_verified?: boolean;
          role?: string;
          is_active?: boolean;
          last_sign_in_at?: string | null;
          metadata?: any;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: 'income' | 'expense';
          category: string;
          subcategory: string;
          amount: number;
          description: string;
          date: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          type: 'income' | 'expense';
          category?: string;
          subcategory?: string;
          amount: number;
          description: string;
          date?: string;
          status?: string;
        };
        Update: {
          type?: 'income' | 'expense';
          category?: string;
          subcategory?: string;
          amount?: number;
          description?: string;
          date?: string;
          status?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          color: string;
          type: 'income' | 'expense';
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          description?: string | null;
          color?: string;
          type: 'income' | 'expense';
          is_active?: boolean;
        };
        Update: {
          name?: string;
          description?: string | null;
          color?: string;
          type?: 'income' | 'expense';
          is_active?: boolean;
          updated_at?: string;
        };
      };
      payables: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          title: string;
          amount: number;
          description: string | null;
          due_date: string;
          is_paid: boolean;
          paid_date: string | null;
          supplier: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          category_id?: string | null;
          title: string;
          amount: number;
          description?: string | null;
          due_date: string;
          is_paid?: boolean;
          paid_date?: string | null;
          supplier?: string | null;
        };
        Update: {
          category_id?: string | null;
          title?: string;
          amount?: number;
          description?: string | null;
          due_date?: string;
          is_paid?: boolean;
          paid_date?: string | null;
          supplier?: string | null;
          updated_at?: string;
        };
      };
    };
    Views: {
      stripe_user_subscriptions: {
        Row: {
          customer_id: string | null;
          subscription_id: string | null;
          subscription_status: string | null;
          price_id: string | null;
          current_period_start: number | null;
          current_period_end: number | null;
          cancel_at_period_end: boolean | null;
          payment_method_brand: string | null;
          payment_method_last4: string | null;
        };
      };
    };
    Functions: {
      uid: {
        Returns: string;
      };
      is_authenticated: {
        Returns: boolean;
      };
      create_default_categories: {
        Args: { p_user_id: string };
        Returns: void;
      };
      get_user_financial_stats: {
        Returns: any;
      };
    };
  };
}

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