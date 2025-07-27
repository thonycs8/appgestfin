/*
  # Complete Authentication Integration Fix

  This migration creates a complete, robust authentication system integrating Clerk with Supabase.
  It includes all necessary tables, functions, policies, and triggers.

  ## What this migration does:
  1. Creates authentication functions (uid, is_authenticated)
  2. Creates all necessary tables with correct structure
  3. Sets up Row Level Security (RLS) policies
  4. Creates automatic triggers for user management
  5. Creates default categories for new users
  6. Sets up Stripe integration tables
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- AUTHENTICATION FUNCTIONS
-- =============================================

-- Function to get current user ID from JWT token
CREATE OR REPLACE FUNCTION uid() 
RETURNS text 
LANGUAGE sql 
STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'sub',
    current_setting('request.jwt.claims', true)::json->>'user_id',
    current_setting('request.headers', true)::json->>'x-user-id',
    'anonymous'
  )::text;
$$;

-- Function to check if user is authenticated
CREATE OR REPLACE FUNCTION is_authenticated() 
RETURNS boolean 
LANGUAGE sql 
STABLE
AS $$
  SELECT uid() != 'anonymous' AND uid() IS NOT NULL;
$$;

-- =============================================
-- USERS TABLE
-- =============================================

-- Drop existing users table if it exists
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
  id text PRIMARY KEY,
  clerk_id text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  first_name text,
  last_name text,
  username text,
  avatar_url text,
  phone text,
  email_verified boolean DEFAULT false,
  phone_verified boolean DEFAULT false,
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin', 'manager')),
  is_active boolean DEFAULT true,
  last_sign_in_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for users
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Enable RLS on users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS policies for users
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (id = uid());

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (id = uid());

CREATE POLICY "Allow user creation" ON users
  FOR INSERT WITH CHECK (id = uid());

-- =============================================
-- PROFILES TABLE
-- =============================================

-- Drop existing profiles table if it exists
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (user_id = uid());

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (user_id = uid());

CREATE POLICY "Users can create their own profile" ON profiles
  FOR INSERT WITH CHECK (user_id = uid());

-- =============================================
-- CATEGORIES TABLE
-- =============================================

-- Drop existing categories table if it exists
DROP TABLE IF EXISTS categories CASCADE;

-- Create categories table
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text DEFAULT '#3B82F6',
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name, type)
);

-- Create indexes for categories
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

-- Enable RLS on categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for categories
CREATE POLICY "Users can view their own categories" ON categories
  FOR SELECT USING (user_id = uid());

CREATE POLICY "Users can create their own categories" ON categories
  FOR INSERT WITH CHECK (user_id = uid());

CREATE POLICY "Users can update their own categories" ON categories
  FOR UPDATE USING (user_id = uid());

CREATE POLICY "Users can delete their own categories" ON categories
  FOR DELETE USING (user_id = uid());

-- =============================================
-- TRANSACTIONS TABLE (UNIFIED)
-- =============================================

-- Drop existing transaction-related tables
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS income CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;

-- Create unified transactions table
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  category text DEFAULT 'geral',
  subcategory text DEFAULT 'Sem categoria',
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  description text NOT NULL,
  date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- Enable RLS on transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for transactions
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (user_id = uid());

CREATE POLICY "Users can create their own transactions" ON transactions
  FOR INSERT WITH CHECK (user_id = uid());

CREATE POLICY "Users can update their own transactions" ON transactions
  FOR UPDATE USING (user_id = uid());

CREATE POLICY "Users can delete their own transactions" ON transactions
  FOR DELETE USING (user_id = uid());

-- =============================================
-- COMPATIBILITY VIEWS (for legacy code)
-- =============================================

-- Create income view for backward compatibility
CREATE OR REPLACE VIEW income AS
SELECT 
  id,
  user_id,
  category,
  subcategory,
  amount,
  description,
  date,
  status,
  created_at,
  updated_at
FROM transactions 
WHERE type = 'income';

-- Create expenses view for backward compatibility
CREATE OR REPLACE VIEW expenses AS
SELECT 
  id,
  user_id,
  category,
  subcategory,
  amount,
  description,
  date,
  status,
  created_at,
  updated_at
FROM transactions 
WHERE type = 'expense';

-- =============================================
-- PAYABLES TABLE
-- =============================================

-- Drop existing payables table if it exists
DROP TABLE IF EXISTS payables CASCADE;

-- Create payables table
CREATE TABLE payables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id text,
  title text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  description text,
  due_date date NOT NULL,
  is_paid boolean DEFAULT false,
  paid_date date,
  supplier text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for payables
CREATE INDEX IF NOT EXISTS idx_payables_user_id ON payables(user_id);
CREATE INDEX IF NOT EXISTS idx_payables_due_date ON payables(due_date);
CREATE INDEX IF NOT EXISTS idx_payables_is_paid ON payables(is_paid);
CREATE INDEX IF NOT EXISTS idx_payables_category_id ON payables(category_id);

-- Enable RLS on payables
ALTER TABLE payables ENABLE ROW LEVEL SECURITY;

-- RLS policies for payables
CREATE POLICY "Users can view their own payables" ON payables
  FOR SELECT USING (user_id = uid());

CREATE POLICY "Users can create their own payables" ON payables
  FOR INSERT WITH CHECK (user_id = uid());

CREATE POLICY "Users can update their own payables" ON payables
  FOR UPDATE USING (user_id = uid());

CREATE POLICY "Users can delete their own payables" ON payables
  FOR DELETE USING (user_id = uid());

-- =============================================
-- INVESTMENTS TABLE
-- =============================================

-- Drop existing investments table if it exists
DROP TABLE IF EXISTS investments CASCADE;

-- Create investments table
CREATE TABLE investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  current_value numeric(12,2),
  investment_type text NOT NULL,
  description text,
  purchase_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for investments
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_type ON investments(investment_type);
CREATE INDEX IF NOT EXISTS idx_investments_purchase_date ON investments(purchase_date);

-- Enable RLS on investments
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

-- RLS policies for investments
CREATE POLICY "Users can view their own investments" ON investments
  FOR SELECT USING (user_id = uid());

CREATE POLICY "Users can create their own investments" ON investments
  FOR INSERT WITH CHECK (user_id = uid());

CREATE POLICY "Users can update their own investments" ON investments
  FOR UPDATE USING (user_id = uid());

CREATE POLICY "Users can delete their own investments" ON investments
  FOR DELETE USING (user_id = uid());

-- =============================================
-- STRIPE INTEGRATION TABLES
-- =============================================

-- Stripe subscription status enum
DO $$ BEGIN
  CREATE TYPE stripe_subscription_status AS ENUM (
    'not_started',
    'incomplete',
    'incomplete_expired',
    'trialing',
    'active',
    'past_due',
    'canceled',
    'unpaid',
    'paused'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Stripe order status enum
DO $$ BEGIN
  CREATE TYPE stripe_order_status AS ENUM (
    'pending',
    'completed',
    'canceled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Drop existing Stripe tables if they exist
DROP TABLE IF EXISTS stripe_customers CASCADE;
DROP TABLE IF EXISTS stripe_subscriptions CASCADE;
DROP TABLE IF EXISTS stripe_orders CASCADE;

-- Stripe customers table
CREATE TABLE stripe_customers (
  id bigserial PRIMARY KEY,
  user_id text UNIQUE NOT NULL REFERENCES users(id),
  customer_id text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Stripe subscriptions table
CREATE TABLE stripe_subscriptions (
  id bigserial PRIMARY KEY,
  customer_id text UNIQUE NOT NULL,
  subscription_id text,
  price_id text,
  current_period_start bigint,
  current_period_end bigint,
  cancel_at_period_end boolean DEFAULT false,
  payment_method_brand text,
  payment_method_last4 text,
  status stripe_subscription_status NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Stripe orders table
CREATE TABLE stripe_orders (
  id bigserial PRIMARY KEY,
  checkout_session_id text NOT NULL,
  payment_intent_id text NOT NULL,
  customer_id text NOT NULL,
  amount_subtotal bigint NOT NULL,
  amount_total bigint NOT NULL,
  currency text NOT NULL,
  payment_status text NOT NULL,
  status stripe_order_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Enable RLS on Stripe tables
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_orders ENABLE ROW LEVEL SECURITY;

-- RLS policies for Stripe tables
CREATE POLICY "Users can view their own customer data" ON stripe_customers
  FOR SELECT USING (user_id = uid() AND deleted_at IS NULL)
  TO authenticated;

CREATE POLICY "Users can view their own subscription data" ON stripe_subscriptions
  FOR SELECT USING (
    customer_id IN (
      SELECT customer_id FROM stripe_customers 
      WHERE user_id = uid() AND deleted_at IS NULL
    ) AND deleted_at IS NULL
  )
  TO authenticated;

CREATE POLICY "Users can view their own order data" ON stripe_orders
  FOR SELECT USING (
    customer_id IN (
      SELECT customer_id FROM stripe_customers 
      WHERE user_id = uid() AND deleted_at IS NULL
    ) AND deleted_at IS NULL
  )
  TO authenticated;

-- =============================================
-- STRIPE VIEWS
-- =============================================

-- Stripe user subscriptions view
CREATE OR REPLACE VIEW stripe_user_subscriptions 
WITH (security_definer=true)
AS
SELECT 
  sc.customer_id,
  ss.subscription_id,
  ss.status as subscription_status,
  ss.price_id,
  ss.current_period_start,
  ss.current_period_end,
  ss.cancel_at_period_end,
  ss.payment_method_brand,
  ss.payment_method_last4
FROM stripe_customers sc
LEFT JOIN stripe_subscriptions ss ON sc.customer_id = ss.customer_id
WHERE sc.user_id = uid() AND sc.deleted_at IS NULL AND ss.deleted_at IS NULL;

-- Stripe user orders view
CREATE OR REPLACE VIEW stripe_user_orders 
WITH (security_definer=true)
AS
SELECT 
  sc.customer_id,
  so.id as order_id,
  so.checkout_session_id,
  so.payment_intent_id,
  so.amount_subtotal,
  so.amount_total,
  so.currency,
  so.payment_status,
  so.status as order_status,
  so.created_at as order_date
FROM stripe_customers sc
LEFT JOIN stripe_orders so ON sc.customer_id = so.customer_id
WHERE sc.user_id = uid() AND sc.deleted_at IS NULL AND so.deleted_at IS NULL;

-- =============================================
-- TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile for new user
  INSERT INTO profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.first_name || ' ' || NEW.last_name, NEW.username, 'User'),
    NEW.email
  );
  
  -- Create default categories for new user
  PERFORM create_default_categories(NEW.id);
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payables_updated_at ON payables;
CREATE TRIGGER update_payables_updated_at
  BEFORE UPDATE ON payables
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_investments_updated_at ON investments;
CREATE TRIGGER update_investments_updated_at
  BEFORE UPDATE ON investments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for new user handling
DROP TRIGGER IF EXISTS on_auth_user_created ON users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =============================================
-- UTILITY FUNCTIONS
-- =============================================

-- Function to create default categories for a user
CREATE OR REPLACE FUNCTION create_default_categories(p_user_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert default income categories
  INSERT INTO categories (user_id, name, type, color) VALUES
    (p_user_id, 'Salário', 'income', '#22c55e'),
    (p_user_id, 'Freelance', 'income', '#16a34a'),
    (p_user_id, 'Investimentos', 'income', '#15803d'),
    (p_user_id, 'Vendas', 'income', '#166534')
  ON CONFLICT (user_id, name, type) DO NOTHING;
  
  -- Insert default expense categories
  INSERT INTO categories (user_id, name, type, color) VALUES
    (p_user_id, 'Alimentação', 'expense', '#ef4444'),
    (p_user_id, 'Transporte', 'expense', '#dc2626'),
    (p_user_id, 'Moradia', 'expense', '#b91c1c'),
    (p_user_id, 'Saúde', 'expense', '#991b1b'),
    (p_user_id, 'Educação', 'expense', '#7f1d1d'),
    (p_user_id, 'Lazer', 'expense', '#fbbf24'),
    (p_user_id, 'Compras', 'expense', '#f59e0b')
  ON CONFLICT (user_id, name, type) DO NOTHING;
END;
$$;

-- Function to get user financial statistics
CREATE OR REPLACE FUNCTION get_user_financial_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_income', COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0),
    'total_expenses', COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0),
    'net_profit', COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0),
    'transaction_count', COUNT(*),
    'categories_count', (SELECT COUNT(*) FROM categories WHERE user_id = uid()),
    'payables_count', (SELECT COUNT(*) FROM payables WHERE user_id = uid()),
    'overdue_payables', (SELECT COUNT(*) FROM payables WHERE user_id = uid() AND due_date < CURRENT_DATE AND NOT is_paid)
  ) INTO result
  FROM transactions
  WHERE user_id = uid() AND status = 'completed';
  
  RETURN result;
END;
$$;

-- =============================================
-- FINAL SETUP
-- =============================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';