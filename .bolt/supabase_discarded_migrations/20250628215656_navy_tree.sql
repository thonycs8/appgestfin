/*
  # Database Schema Migration - User ID Type Conversion

  This migration converts user_id columns from uuid to text across all tables
  to be compatible with Clerk authentication system.

  ## Changes Made:
  1. Drop existing views and policies
  2. Convert user_id columns from uuid to text
  3. Create users table for Clerk integration
  4. Recreate RLS policies with text user IDs
  5. Recreate views without security_definer parameter
  6. Add foreign key constraints
  7. Create Clerk integration functions and triggers
*/

-- Step 1: Drop views that depend on user_id columns
DROP VIEW IF EXISTS stripe_user_subscriptions;
DROP VIEW IF EXISTS stripe_user_orders;

-- Step 2: Drop ALL RLS policies that might depend on user_id columns
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop policies from all tables that might reference user_id
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      policy_record.policyname, 
                      policy_record.schemaname, 
                      policy_record.tablename);
    END LOOP;
END $$;

-- Step 3: Drop existing foreign key constraints
ALTER TABLE IF EXISTS categories DROP CONSTRAINT IF EXISTS categories_user_id_fkey;
ALTER TABLE IF EXISTS transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
ALTER TABLE IF EXISTS payables DROP CONSTRAINT IF EXISTS payables_user_id_fkey;
ALTER TABLE IF EXISTS investments DROP CONSTRAINT IF EXISTS investments_user_id_fkey;
ALTER TABLE IF EXISTS stripe_customers DROP CONSTRAINT IF EXISTS stripe_customers_user_id_fkey;

-- Step 4: Create users table first (for foreign key references)
CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  email text UNIQUE NOT NULL,
  first_name text,
  last_name text,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Step 5: Update user_id columns from uuid to text for all tables
-- Categories table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'user_id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE categories ALTER COLUMN user_id TYPE text USING user_id::text;
  END IF;
END $$;

-- Transactions table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'user_id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE transactions ALTER COLUMN user_id TYPE text USING user_id::text;
  END IF;
END $$;

-- Payables table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payables' AND column_name = 'user_id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE payables ALTER COLUMN user_id TYPE text USING user_id::text;
  END IF;
END $$;

-- Investments table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'investments' AND column_name = 'user_id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE investments ALTER COLUMN user_id TYPE text USING user_id::text;
  END IF;
END $$;

-- Stripe customers table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stripe_customers' AND column_name = 'user_id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE stripe_customers ALTER COLUMN user_id TYPE text USING user_id::text;
  END IF;
END $$;

-- Step 6: Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for users table
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = id);

-- Step 8: Recreate RLS policies for all tables with text user IDs
-- Categories policies
CREATE POLICY "Users can manage their own categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Transactions policies  
CREATE POLICY "Users can manage their own transactions"
  ON transactions
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Payables policies
CREATE POLICY "Users can manage their own payables"
  ON payables
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Investments policies
CREATE POLICY "Users can manage their own investments"
  ON investments
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Stripe customers policies
CREATE POLICY "Users can view their own customer data"
  ON stripe_customers
  FOR SELECT
  TO authenticated
  USING ((auth.uid()::text = user_id) AND (deleted_at IS NULL));

-- Stripe subscriptions policies
CREATE POLICY "Users can view their own subscription data"
  ON stripe_subscriptions
  FOR SELECT
  TO authenticated
  USING ((customer_id IN ( 
    SELECT stripe_customers.customer_id
    FROM stripe_customers
    WHERE ((stripe_customers.user_id = auth.uid()::text) AND (stripe_customers.deleted_at IS NULL))
  )) AND (deleted_at IS NULL));

-- Stripe orders policies
CREATE POLICY "Users can view their own order data"
  ON stripe_orders
  FOR SELECT
  TO authenticated
  USING ((customer_id IN ( 
    SELECT stripe_customers.customer_id
    FROM stripe_customers
    WHERE ((stripe_customers.user_id = auth.uid()::text) AND (stripe_customers.deleted_at IS NULL))
  )) AND (deleted_at IS NULL));

-- Step 9: Recreate views with updated column types (without security_definer)
-- Recreate stripe_user_subscriptions view
CREATE VIEW stripe_user_subscriptions AS 
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
WHERE sc.user_id = auth.uid()::text AND sc.deleted_at IS NULL;

-- Recreate stripe_user_orders view
CREATE VIEW stripe_user_orders AS 
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
WHERE sc.user_id = auth.uid()::text AND sc.deleted_at IS NULL;

-- Step 10: Add foreign key constraints back (referencing users table)
ALTER TABLE categories ADD CONSTRAINT categories_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE transactions ADD CONSTRAINT transactions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE payables ADD CONSTRAINT payables_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE investments ADD CONSTRAINT investments_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE stripe_customers ADD CONSTRAINT stripe_customers_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

-- Step 11: Create function to automatically create user record from Clerk
CREATE OR REPLACE FUNCTION create_user_from_clerk()
RETURNS trigger AS $$
BEGIN
  INSERT INTO users (id, email, created_at)
  VALUES (NEW.id, NEW.email, NEW.created_at)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 12: Create trigger to automatically create user records
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_from_clerk();

-- Step 13: Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 14: Add updated_at trigger to users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 15: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id_active ON categories(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id_date ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_payables_user_id ON payables(user_id);
CREATE INDEX IF NOT EXISTS idx_payables_user_id_status ON payables(user_id, status);
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);