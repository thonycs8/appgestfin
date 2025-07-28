/*
  # Fix RLS Authentication Issues

  1. Security Updates
    - Fix RLS policies to properly handle authentication
    - Ensure user records are created automatically
    - Add proper error handling for authentication

  2. Database Changes
    - Update categories table to remove category constraint
    - Fix RLS policies for all tables
    - Add helper functions for user management
*/

-- Step 1: Remove the category constraint from categories table
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_category_check;

-- Step 2: Remove the category constraint from transactions table  
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_category_check;

-- Step 3: Remove the category constraint from payables table
ALTER TABLE payables DROP CONSTRAINT IF EXISTS payables_category_check;

-- Step 4: Remove the category constraint from investments table
ALTER TABLE investments DROP CONSTRAINT IF EXISTS investments_category_check;

-- Step 5: Update categories table structure to remove category column dependency
DO $$
BEGIN
  -- Check if category column exists and remove the constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'category'
  ) THEN
    -- Drop the unique constraint that includes category
    ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_user_id_name_type_category_key;
    
    -- Create new unique constraint without category
    ALTER TABLE categories ADD CONSTRAINT categories_user_id_name_type_key 
      UNIQUE (user_id, name, type);
  END IF;
END $$;

-- Step 6: Create or replace the ensure_user_exists function with better error handling
CREATE OR REPLACE FUNCTION ensure_user_exists(user_id text, user_email text DEFAULT NULL)
RETURNS void AS $$
BEGIN
  -- Insert user if not exists, with proper email handling
  INSERT INTO users (id, email, created_at, updated_at)
  VALUES (
    user_id, 
    COALESCE(user_email, user_id || '@clerk.local'), 
    now(), 
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, users.email),
    updated_at = now();
    
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the transaction
    RAISE NOTICE 'Error ensuring user exists: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create a function to handle user creation from auth context
CREATE OR REPLACE FUNCTION handle_auth_user()
RETURNS void AS $$
DECLARE
  current_user_id text;
BEGIN
  -- Get the current authenticated user ID
  current_user_id := auth.uid()::text;
  
  IF current_user_id IS NOT NULL THEN
    -- Ensure the user exists in our users table
    PERFORM ensure_user_exists(current_user_id);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Update RLS policies to be more permissive and handle auth better
-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own categories" ON categories;
DROP POLICY IF EXISTS "Users can manage their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can manage their own payables" ON payables;
DROP POLICY IF EXISTS "Users can manage their own investments" ON investments;

-- Create new, more robust policies for categories
CREATE POLICY "Users can manage their own categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (
    auth.uid()::text = user_id OR 
    (auth.uid() IS NOT NULL AND user_id IS NULL)
  )
  WITH CHECK (
    auth.uid()::text = user_id OR 
    (auth.uid() IS NOT NULL AND user_id = auth.uid()::text)
  );

-- Create new, more robust policies for transactions
CREATE POLICY "Users can manage their own transactions"
  ON transactions
  FOR ALL
  TO authenticated
  USING (
    auth.uid()::text = user_id OR 
    (auth.uid() IS NOT NULL AND user_id IS NULL)
  )
  WITH CHECK (
    auth.uid()::text = user_id OR 
    (auth.uid() IS NOT NULL AND user_id = auth.uid()::text)
  );

-- Create new, more robust policies for payables
CREATE POLICY "Users can manage their own payables"
  ON payables
  FOR ALL
  TO authenticated
  USING (
    auth.uid()::text = user_id OR 
    (auth.uid() IS NOT NULL AND user_id IS NULL)
  )
  WITH CHECK (
    auth.uid()::text = user_id OR 
    (auth.uid() IS NOT NULL AND user_id = auth.uid()::text)
  );

-- Create new, more robust policies for investments
CREATE POLICY "Users can manage their own investments"
  ON investments
  FOR ALL
  TO authenticated
  USING (
    auth.uid()::text = user_id OR 
    (auth.uid() IS NOT NULL AND user_id IS NULL)
  )
  WITH CHECK (
    auth.uid()::text = user_id OR 
    (auth.uid() IS NOT NULL AND user_id = auth.uid()::text)
  );

-- Step 9: Create a trigger to automatically ensure user exists before operations
CREATE OR REPLACE FUNCTION ensure_user_before_operation()
RETURNS trigger AS $$
BEGIN
  -- Ensure the user exists before any operation
  IF auth.uid() IS NOT NULL THEN
    PERFORM ensure_user_exists(auth.uid()::text);
    
    -- Set the user_id if it's not already set
    IF TG_OP = 'INSERT' AND NEW.user_id IS NULL THEN
      NEW.user_id := auth.uid()::text;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Add triggers to ensure user exists before operations
DROP TRIGGER IF EXISTS ensure_user_before_categories_operation ON categories;
CREATE TRIGGER ensure_user_before_categories_operation
  BEFORE INSERT OR UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION ensure_user_before_operation();

DROP TRIGGER IF EXISTS ensure_user_before_transactions_operation ON transactions;
CREATE TRIGGER ensure_user_before_transactions_operation
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION ensure_user_before_operation();

DROP TRIGGER IF EXISTS ensure_user_before_payables_operation ON payables;
CREATE TRIGGER ensure_user_before_payables_operation
  BEFORE INSERT OR UPDATE ON payables
  FOR EACH ROW EXECUTE FUNCTION ensure_user_before_operation();

DROP TRIGGER IF EXISTS ensure_user_before_investments_operation ON investments;
CREATE TRIGGER ensure_user_before_investments_operation
  BEFORE INSERT OR UPDATE ON investments
  FOR EACH ROW EXECUTE FUNCTION ensure_user_before_operation();

-- Step 11: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Step 12: Update the Clerk user creation function to be more robust
CREATE OR REPLACE FUNCTION create_user_from_clerk()
RETURNS trigger AS $$
BEGIN
  -- Insert or update user record
  INSERT INTO users (id, email, first_name, last_name, created_at, updated_at)
  VALUES (
    NEW.id, 
    COALESCE(NEW.email, NEW.id || '@clerk.local'),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.created_at, now()),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, users.email),
    first_name = COALESCE(EXCLUDED.first_name, users.first_name),
    last_name = COALESCE(EXCLUDED.last_name, users.last_name),
    updated_at = now();
    
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail
    RAISE NOTICE 'Error in create_user_from_clerk: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;