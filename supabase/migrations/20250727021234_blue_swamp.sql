/*
  # Complete Auth Integration Fix - Clerk + Supabase

  1. Create all necessary tables with correct structure
  2. Set up proper RLS policies using Clerk user IDs
  3. Create helper functions for authentication
  4. Fix all column types and constraints
  5. Add proper indexes for performance
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom function to get user ID from JWT (Clerk integration)
CREATE OR REPLACE FUNCTION uid() RETURNS text AS $$
BEGIN
  -- Try to get user ID from JWT claims
  RETURN COALESCE(
    current_setting('request.jwt.claims', true)::json->>'sub',
    current_setting('request.jwt.claims', true)::json->>'user_id',
    current_setting('request.headers', true)::json->>'x-user-id'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is authenticated
CREATE OR REPLACE FUNCTION is_authenticated() RETURNS boolean AS $$
BEGIN
  RETURN uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create users table (compatible with Clerk)
CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY, -- Clerk user ID
  clerk_id text UNIQUE NOT NULL,
  email text NOT NULL,
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

-- Create profiles table (for additional user data)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  color text DEFAULT '#3B82F6',
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name, type)
);

-- Create unified transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text REFERENCES users(id) ON DELETE CASCADE NOT NULL,
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

-- Create payables table
CREATE TABLE IF NOT EXISTS payables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text REFERENCES users(id) ON DELETE CASCADE NOT NULL,
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

-- Create investments table
CREATE TABLE IF NOT EXISTS investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  current_value numeric(12,2),
  investment_type text NOT NULL,
  description text,
  purchase_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create compatibility views for legacy code
CREATE OR REPLACE VIEW income AS
SELECT 
  id,
  user_id,
  category,
  subcategory AS title,
  amount,
  description,
  date,
  status,
  created_at,
  updated_at
FROM transactions 
WHERE type = 'income';

CREATE OR REPLACE VIEW expenses AS
SELECT 
  id,
  user_id,
  category,
  subcategory AS title,
  amount,
  description,
  date,
  status,
  created_at,
  updated_at
FROM transactions 
WHERE type = 'expense';

-- Create indexes for performance
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

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payables ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
DROP POLICY IF EXISTS "Users can view their own data" ON users;
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (id = uid());

DROP POLICY IF EXISTS "Users can update their own data" ON users;
CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (id = uid());

DROP POLICY IF EXISTS "Users can insert their own data" ON users;
CREATE POLICY "Users can insert their own data" ON users
  FOR INSERT WITH CHECK (id = uid());

-- Create RLS policies for profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (user_id = uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (user_id = uid());

DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
CREATE POLICY "Users can create their own profile" ON profiles
  FOR INSERT WITH CHECK (user_id = uid());

-- Create RLS policies for categories table
DROP POLICY IF EXISTS "Users can view their own categories" ON categories;
CREATE POLICY "Users can view their own categories" ON categories
  FOR SELECT USING (user_id = uid());

DROP POLICY IF EXISTS "Users can create their own categories" ON categories;
CREATE POLICY "Users can create their own categories" ON categories
  FOR INSERT WITH CHECK (user_id = uid());

DROP POLICY IF EXISTS "Users can update their own categories" ON categories;
CREATE POLICY "Users can update their own categories" ON categories
  FOR UPDATE USING (user_id = uid());

DROP POLICY IF EXISTS "Users can delete their own categories" ON categories;
CREATE POLICY "Users can delete their own categories" ON categories
  FOR DELETE USING (user_id = uid());

-- Create RLS policies for transactions table
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (user_id = uid());

DROP POLICY IF EXISTS "Users can create their own transactions" ON transactions;
CREATE POLICY "Users can create their own transactions" ON transactions
  FOR INSERT WITH CHECK (user_id = uid());

DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
CREATE POLICY "Users can update their own transactions" ON transactions
  FOR UPDATE USING (user_id = uid());

DROP POLICY IF EXISTS "Users can delete their own transactions" ON transactions;
CREATE POLICY "Users can delete their own transactions" ON transactions
  FOR DELETE USING (user_id = uid());

-- Create RLS policies for payables table
DROP POLICY IF EXISTS "Users can view their own payables" ON payables;
CREATE POLICY "Users can view their own payables" ON payables
  FOR SELECT USING (user_id = uid());

DROP POLICY IF EXISTS "Users can create their own payables" ON payables;
CREATE POLICY "Users can create their own payables" ON payables
  FOR INSERT WITH CHECK (user_id = uid());

DROP POLICY IF EXISTS "Users can update their own payables" ON payables;
CREATE POLICY "Users can update their own payables" ON payables
  FOR UPDATE USING (user_id = uid());

DROP POLICY IF EXISTS "Users can delete their own payables" ON payables;
CREATE POLICY "Users can delete their own payables" ON payables
  FOR DELETE USING (user_id = uid());

-- Create RLS policies for investments table
DROP POLICY IF EXISTS "Users can view their own investments" ON investments;
CREATE POLICY "Users can view their own investments" ON investments
  FOR SELECT USING (user_id = uid());

DROP POLICY IF EXISTS "Users can create their own investments" ON investments;
CREATE POLICY "Users can create their own investments" ON investments
  FOR INSERT WITH CHECK (user_id = uid());

DROP POLICY IF EXISTS "Users can update their own investments" ON investments;
CREATE POLICY "Users can update their own investments" ON investments
  FOR UPDATE USING (user_id = uid());

DROP POLICY IF EXISTS "Users can delete their own investments" ON investments;
CREATE POLICY "Users can delete their own investments" ON investments
  FOR DELETE USING (user_id = uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- Create function to automatically create user profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.first_name || ' ' || NEW.last_name, NEW.first_name, NEW.last_name),
    NEW.email,
    NEW.avatar_url
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create function to create default categories for new users
CREATE OR REPLACE FUNCTION create_default_categories(p_user_id text)
RETURNS void AS $$
BEGIN
  -- Income categories
  INSERT INTO categories (user_id, name, type, color) VALUES
    (p_user_id, 'Prestação de Serviços', 'income', '#22c55e'),
    (p_user_id, 'Vendas', 'income', '#16a34a'),
    (p_user_id, 'Salário', 'income', '#15803d'),
    (p_user_id, 'Freelance', 'income', '#166534'),
    (p_user_id, 'Investimentos', 'income', '#14532d')
  ON CONFLICT (user_id, name, type) DO NOTHING;
  
  -- Expense categories
  INSERT INTO categories (user_id, name, type, color) VALUES
    (p_user_id, 'Marketing', 'expense', '#ef4444'),
    (p_user_id, 'Software', 'expense', '#dc2626'),
    (p_user_id, 'Alimentação', 'expense', '#b91c1c'),
    (p_user_id, 'Transporte', 'expense', '#991b1b'),
    (p_user_id, 'Escritório', 'expense', '#7f1d1d')
  ON CONFLICT (user_id, name, type) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user financial statistics
CREATE OR REPLACE FUNCTION get_user_financial_stats()
RETURNS json AS $$
DECLARE
  user_id_val text := uid();
  result json;
BEGIN
  IF user_id_val IS NULL THEN
    RETURN '{"error": "Not authenticated"}'::json;
  END IF;

  SELECT json_build_object(
    'total_income', COALESCE(income_sum, 0),
    'total_expenses', COALESCE(expense_sum, 0),
    'net_profit', COALESCE(income_sum, 0) - COALESCE(expense_sum, 0),
    'transaction_count', COALESCE(transaction_count, 0),
    'category_count', COALESCE(category_count, 0),
    'payable_count', COALESCE(payable_count, 0)
  ) INTO result
  FROM (
    SELECT 
      (SELECT SUM(amount) FROM transactions WHERE user_id = user_id_val AND type = 'income') as income_sum,
      (SELECT SUM(amount) FROM transactions WHERE user_id = user_id_val AND type = 'expense') as expense_sum,
      (SELECT COUNT(*) FROM transactions WHERE user_id = user_id_val) as transaction_count,
      (SELECT COUNT(*) FROM categories WHERE user_id = user_id_val) as category_count,
      (SELECT COUNT(*) FROM payables WHERE user_id = user_id_val) as payable_count
  ) stats;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;