/*
  # Complete Database Setup for Gestfin

  1. New Tables
    - `users` - User management with Clerk integration
    - `profiles` - User profiles
    - `categories` - Transaction categories
    - `transactions` - All financial transactions (income/expense)
    - `payables` - Bills to pay
    - `investments` - Investment tracking
    - `stripe_customers` - Stripe customer mapping
    - `stripe_subscriptions` - Subscription management
    - `stripe_orders` - One-time payments

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Create helper functions for authentication

  3. Functions
    - `uid()` - Get current user ID from Clerk JWT
    - `is_authenticated()` - Check if user is authenticated
    - `create_default_categories()` - Create default categories for new users
    - `get_user_financial_stats()` - Get financial statistics
*/

-- Drop existing tables if they exist (in correct order to handle dependencies)
DROP TABLE IF EXISTS stripe_orders CASCADE;
DROP TABLE IF EXISTS stripe_subscriptions CASCADE;
DROP TABLE IF EXISTS stripe_customers CASCADE;
DROP TABLE IF EXISTS investments CASCADE;
DROP TABLE IF EXISTS payables CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS uid() CASCADE;
DROP FUNCTION IF EXISTS is_authenticated() CASCADE;
DROP FUNCTION IF EXISTS create_default_categories(text) CASCADE;
DROP FUNCTION IF EXISTS get_user_financial_stats() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS stripe_subscription_status CASCADE;
DROP TYPE IF EXISTS stripe_order_status CASCADE;

-- Create custom types
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

CREATE TYPE stripe_order_status AS ENUM (
  'pending',
  'completed',
  'canceled'
);

-- Create helper functions first
CREATE OR REPLACE FUNCTION uid()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json ->> 'sub',
    current_setting('request.jwt.claims', true)::json ->> 'user_id'
  );
$$;

CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT uid() IS NOT NULL;
$$;

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Users table (main user data from Clerk)
CREATE TABLE IF NOT EXISTS users (
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

-- Profiles table (additional user information)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
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

-- Transactions table (unified for income and expenses)
CREATE TABLE IF NOT EXISTS transactions (
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

-- Income table (view for compatibility)
CREATE VIEW income AS
SELECT 
  id,
  user_id,
  category AS category_id,
  subcategory AS title,
  amount,
  description,
  date,
  status,
  created_at,
  updated_at
FROM transactions 
WHERE type = 'income';

-- Expenses table (view for compatibility)
CREATE VIEW expenses AS
SELECT 
  id,
  user_id,
  category AS category_id,
  subcategory AS title,
  amount,
  description,
  date,
  status,
  created_at,
  updated_at
FROM transactions 
WHERE type = 'expense';

-- Payables table
CREATE TABLE IF NOT EXISTS payables (
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

-- Investments table
CREATE TABLE IF NOT EXISTS investments (
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

-- Stripe customers table
CREATE TABLE IF NOT EXISTS stripe_customers (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id text UNIQUE NOT NULL REFERENCES users(id),
  customer_id text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Stripe subscriptions table
CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
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
CREATE TABLE IF NOT EXISTS stripe_orders (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_payables_user_id ON payables(user_id);
CREATE INDEX IF NOT EXISTS idx_payables_due_date ON payables(due_date);
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id ON stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_customer_id ON stripe_customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_customer_id ON stripe_subscriptions(customer_id);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payables ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated
  USING (id = uid());

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE TO authenticated
  USING (id = uid());

-- Create RLS policies for profiles table
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT TO public
  USING (user_id = uid());

CREATE POLICY "Users can create their own profile" ON profiles
  FOR INSERT TO public
  WITH CHECK (user_id = uid());

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE TO public
  USING (user_id = uid());

-- Create RLS policies for categories table
CREATE POLICY "Users can view their own categories" ON categories
  FOR SELECT TO public
  USING (user_id = uid());

CREATE POLICY "Users can create their own categories" ON categories
  FOR INSERT TO public
  WITH CHECK (user_id = uid());

CREATE POLICY "Users can update their own categories" ON categories
  FOR UPDATE TO public
  USING (user_id = uid());

CREATE POLICY "Users can delete their own categories" ON categories
  FOR DELETE TO public
  USING (user_id = uid());

-- Create RLS policies for transactions table
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT TO public
  USING (user_id = uid());

CREATE POLICY "Users can create their own transactions" ON transactions
  FOR INSERT TO public
  WITH CHECK (user_id = uid());

CREATE POLICY "Users can update their own transactions" ON transactions
  FOR UPDATE TO public
  USING (user_id = uid());

CREATE POLICY "Users can delete their own transactions" ON transactions
  FOR DELETE TO public
  USING (user_id = uid());

-- Create RLS policies for payables table
CREATE POLICY "Users can view their own payables" ON payables
  FOR SELECT TO public
  USING (user_id = uid());

CREATE POLICY "Users can create their own payables" ON payables
  FOR INSERT TO public
  WITH CHECK (user_id = uid());

CREATE POLICY "Users can update their own payables" ON payables
  FOR UPDATE TO public
  USING (user_id = uid());

CREATE POLICY "Users can delete their own payables" ON payables
  FOR DELETE TO public
  USING (user_id = uid());

-- Create RLS policies for investments table
CREATE POLICY "Users can view their own investments" ON investments
  FOR SELECT TO public
  USING (user_id = uid());

CREATE POLICY "Users can create their own investments" ON investments
  FOR INSERT TO public
  WITH CHECK (user_id = uid());

CREATE POLICY "Users can update their own investments" ON investments
  FOR UPDATE TO public
  USING (user_id = uid());

CREATE POLICY "Users can delete their own investments" ON investments
  FOR DELETE TO public
  USING (user_id = uid());

-- Create RLS policies for Stripe tables
CREATE POLICY "Users can view their own customer data" ON stripe_customers
  FOR SELECT TO authenticated
  USING (user_id = uid() AND deleted_at IS NULL);

CREATE POLICY "Users can view their own subscription data" ON stripe_subscriptions
  FOR SELECT TO authenticated
  USING (customer_id IN (
    SELECT customer_id FROM stripe_customers 
    WHERE user_id = uid() AND deleted_at IS NULL
  ) AND deleted_at IS NULL);

CREATE POLICY "Users can view their own order data" ON stripe_orders
  FOR SELECT TO authenticated
  USING (customer_id IN (
    SELECT customer_id FROM stripe_customers 
    WHERE user_id = uid() AND deleted_at IS NULL
  ) AND deleted_at IS NULL);

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payables_updated_at
  BEFORE UPDATE ON payables
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investments_updated_at
  BEFORE UPDATE ON investments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.first_name || ' ' || NEW.last_name, NEW.first_name, NEW.last_name),
    NEW.email
  );
  
  -- Create default categories
  PERFORM create_default_categories(NEW.id);
  
  RETURN NEW;
END;
$$;

-- Trigger to automatically create profile when user is created
CREATE TRIGGER on_user_created
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to create default categories for new users
CREATE OR REPLACE FUNCTION create_default_categories(p_user_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Income categories
  INSERT INTO categories (user_id, name, type, color) VALUES
    (p_user_id, 'Prestação de Serviços', 'income', '#22c55e'),
    (p_user_id, 'Vendas', 'income', '#16a34a'),
    (p_user_id, 'Salário', 'income', '#15803d'),
    (p_user_id, 'Freelance', 'income', '#059669'),
    (p_user_id, 'Investimentos', 'income', '#0d9488');
  
  -- Expense categories
  INSERT INTO categories (user_id, name, type, color) VALUES
    (p_user_id, 'Marketing', 'expense', '#ef4444'),
    (p_user_id, 'Software', 'expense', '#dc2626'),
    (p_user_id, 'Alimentação', 'expense', '#b91c1c'),
    (p_user_id, 'Transporte', 'expense', '#991b1b'),
    (p_user_id, 'Escritório', 'expense', '#7f1d1d');
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
    'transaction_count', COUNT(*),
    'categories_count', (SELECT COUNT(*) FROM categories WHERE user_id = uid()),
    'payables_count', (SELECT COUNT(*) FROM payables WHERE user_id = uid())
  )
  INTO result
  FROM transactions
  WHERE user_id = uid();
  
  RETURN result;
END;
$$;

-- Create views for Stripe integration
CREATE OR REPLACE VIEW stripe_user_subscriptions AS
SELECT 
  sc.customer_id,
  ss.subscription_id,
  ss.status AS subscription_status,
  ss.price_id,
  ss.current_period_start,
  ss.current_period_end,
  ss.cancel_at_period_end,
  ss.payment_method_brand,
  ss.payment_method_last4
FROM stripe_customers sc
LEFT JOIN stripe_subscriptions ss ON sc.customer_id = ss.customer_id
WHERE sc.user_id = uid() AND sc.deleted_at IS NULL;

CREATE OR REPLACE VIEW stripe_user_orders AS
SELECT 
  sc.customer_id,
  so.id AS order_id,
  so.checkout_session_id,
  so.payment_intent_id,
  so.amount_subtotal,
  so.amount_total,
  so.currency,
  so.payment_status,
  so.status AS order_status,
  so.created_at AS order_date
FROM stripe_customers sc
LEFT JOIN stripe_orders so ON sc.customer_id = so.customer_id
WHERE sc.user_id = uid() AND sc.deleted_at IS NULL;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';