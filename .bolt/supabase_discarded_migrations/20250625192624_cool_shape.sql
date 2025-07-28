/*
  # Fix user ID types for Clerk integration

  1. Schema Changes
    - Change user_id columns from uuid to text to support Clerk user IDs
    - Update all tables that reference user_id
    - Update foreign key constraints
    - Preserve existing data

  2. Tables Updated
    - categories: user_id uuid -> text
    - transactions: user_id uuid -> text  
    - payables: user_id uuid -> text
    - investments: user_id uuid -> text
    - stripe_customers: user_id uuid -> text

  3. Security
    - Maintain existing RLS policies
    - Update policies to work with text user IDs
*/

-- First, drop existing foreign key constraints
ALTER TABLE IF EXISTS categories DROP CONSTRAINT IF EXISTS categories_user_id_fkey;
ALTER TABLE IF EXISTS transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
ALTER TABLE IF EXISTS payables DROP CONSTRAINT IF EXISTS payables_user_id_fkey;
ALTER TABLE IF EXISTS investments DROP CONSTRAINT IF EXISTS investments_user_id_fkey;
ALTER TABLE IF EXISTS stripe_customers DROP CONSTRAINT IF EXISTS stripe_customers_user_id_fkey;

-- Update categories table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'user_id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE categories ALTER COLUMN user_id TYPE text USING user_id::text;
  END IF;
END $$;

-- Update transactions table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'user_id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE transactions ALTER COLUMN user_id TYPE text USING user_id::text;
  END IF;
END $$;

-- Update payables table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payables' AND column_name = 'user_id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE payables ALTER COLUMN user_id TYPE text USING user_id::text;
  END IF;
END $$;

-- Update investments table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'investments' AND column_name = 'user_id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE investments ALTER COLUMN user_id TYPE text USING user_id::text;
  END IF;
END $$;

-- Update stripe_customers table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stripe_customers' AND column_name = 'user_id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE stripe_customers ALTER COLUMN user_id TYPE text USING user_id::text;
  END IF;
END $$;

-- Create users table if it doesn't exist (for Clerk users)
CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  email text UNIQUE NOT NULL,
  first_name text,
  last_name text,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' AND policyname = 'Users can read own data'
  ) THEN
    CREATE POLICY "Users can read own data"
      ON users
      FOR SELECT
      TO authenticated
      USING (auth.uid()::text = id);
  END IF;
END $$;

-- Create policy for users to update their own data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' AND policyname = 'Users can update own data'
  ) THEN
    CREATE POLICY "Users can update own data"
      ON users
      FOR UPDATE
      TO authenticated
      USING (auth.uid()::text = id)
      WITH CHECK (auth.uid()::text = id);
  END IF;
END $$;

-- Create policy for users to insert their own data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' AND policyname = 'Users can insert own data'
  ) THEN
    CREATE POLICY "Users can insert own data"
      ON users
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid()::text = id);
  END IF;
END $$;

-- Update RLS policies to use text user IDs
-- Categories policies
DROP POLICY IF EXISTS "Users can manage their own categories" ON categories;
CREATE POLICY "Users can manage their own categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Transactions policies  
DROP POLICY IF EXISTS "Users can manage their own transactions" ON transactions;
CREATE POLICY "Users can manage their own transactions"
  ON transactions
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Payables policies
DROP POLICY IF EXISTS "Users can manage their own payables" ON payables;
CREATE POLICY "Users can manage their own payables"
  ON payables
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Investments policies
DROP POLICY IF EXISTS "Users can manage their own investments" ON investments;
CREATE POLICY "Users can manage their own investments"
  ON investments
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Stripe customers policies
DROP POLICY IF EXISTS "Users can view their own customer data" ON stripe_customers;
CREATE POLICY "Users can view their own customer data"
  ON stripe_customers
  FOR SELECT
  TO authenticated
  USING ((auth.uid()::text = user_id) AND (deleted_at IS NULL));

-- Add foreign key constraints back (referencing users table)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'categories_user_id_fkey'
  ) THEN
    ALTER TABLE categories ADD CONSTRAINT categories_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES users(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'transactions_user_id_fkey'
  ) THEN
    ALTER TABLE transactions ADD CONSTRAINT transactions_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES users(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'payables_user_id_fkey'
  ) THEN
    ALTER TABLE payables ADD CONSTRAINT payables_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES users(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'investments_user_id_fkey'
  ) THEN
    ALTER TABLE investments ADD CONSTRAINT investments_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES users(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'stripe_customers_user_id_fkey'
  ) THEN
    ALTER TABLE stripe_customers ADD CONSTRAINT stripe_customers_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES users(id);
  END IF;
END $$;

-- Create function to automatically create user record from Clerk
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

-- Create trigger to automatically create user records
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_from_clerk();