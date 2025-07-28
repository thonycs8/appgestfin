/*
  # Fix user_id column types for Clerk integration

  1. Database Changes
    - Convert user_id columns from uuid to text to support Clerk user IDs
    - Create users table for Clerk user data
    - Update all foreign key constraints
    - Recreate RLS policies with text user IDs

  2. Security
    - Maintain RLS on all tables
    - Update policies to work with text user IDs
    - Add policies for users table

  3. Functions
    - Add function to automatically create user records from Clerk
*/

-- Step 1: Drop all RLS policies that depend on user_id columns
DROP POLICY IF EXISTS "Users can manage their own categories" ON categories;
DROP POLICY IF EXISTS "Users can manage their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can manage their own payables" ON payables;
DROP POLICY IF EXISTS "Users can manage their own investments" ON investments;
DROP POLICY IF EXISTS "Users can view their own customer data" ON stripe_customers;

-- Step 2: Drop existing foreign key constraints
ALTER TABLE IF EXISTS categories DROP CONSTRAINT IF EXISTS categories_user_id_fkey;
ALTER TABLE IF EXISTS transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
ALTER TABLE IF EXISTS payables DROP CONSTRAINT IF EXISTS payables_user_id_fkey;
ALTER TABLE IF EXISTS investments DROP CONSTRAINT IF EXISTS investments_user_id_fkey;
ALTER TABLE IF EXISTS stripe_customers DROP CONSTRAINT IF EXISTS stripe_customers_user_id_fkey;

-- Step 3: Create users table first (for foreign key references)
CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  email text UNIQUE NOT NULL,
  first_name text,
  last_name text,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Step 4: Update user_id columns from uuid to text
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

-- Step 5: Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for users table
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

-- Step 7: Recreate RLS policies for all tables with text user IDs
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

-- Step 8: Add foreign key constraints back (referencing users table)
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

-- Step 9: Create function to automatically create user record from Clerk
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

-- Step 10: Create trigger to automatically create user records
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_from_clerk();

-- Step 11: Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 12: Add updated_at trigger to users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();