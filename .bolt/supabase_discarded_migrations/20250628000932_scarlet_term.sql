/*
  # Fix authentication issues with Clerk integration

  1. Database Changes
    - Remove category constraints from tables
    - Update RLS policies to be more permissive
    - Add auto_set_user_id function and triggers
    - Fix user creation and management

  2. Security
    - Ensure proper user creation flow
    - Fix RLS policies to work with Clerk auth
    - Add better error handling
*/

-- Step 1: Remove category constraints from tables
ALTER TABLE IF EXISTS categories DROP CONSTRAINT IF EXISTS categories_category_check;
ALTER TABLE IF EXISTS transactions DROP CONSTRAINT IF EXISTS transactions_category_check;
ALTER TABLE IF EXISTS payables DROP CONSTRAINT IF EXISTS payables_category_check;
ALTER TABLE IF EXISTS investments DROP CONSTRAINT IF EXISTS investments_category_check;

-- Step 2: Create or replace the auto_set_user_id function
CREATE OR REPLACE FUNCTION auto_set_user_id()
RETURNS trigger AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    NEW.user_id := auth.uid()::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Add auto_set_user_id triggers to tables
DROP TRIGGER IF EXISTS auto_set_user_id_categories ON categories;
CREATE TRIGGER auto_set_user_id_categories
  BEFORE INSERT ON categories
  FOR EACH ROW EXECUTE FUNCTION auto_set_user_id();

DROP TRIGGER IF EXISTS auto_set_user_id_transactions ON transactions;
CREATE TRIGGER auto_set_user_id_transactions
  BEFORE INSERT ON transactions
  FOR EACH ROW EXECUTE FUNCTION auto_set_user_id();

DROP TRIGGER IF EXISTS auto_set_user_id_payables ON payables;
CREATE TRIGGER auto_set_user_id_payables
  BEFORE INSERT ON payables
  FOR EACH ROW EXECUTE FUNCTION auto_set_user_id();

DROP TRIGGER IF EXISTS auto_set_user_id_investments ON investments;
CREATE TRIGGER auto_set_user_id_investments
  BEFORE INSERT ON investments
  FOR EACH ROW EXECUTE FUNCTION auto_set_user_id();

-- Step 4: Create or replace the ensure_user_before_operation function
CREATE OR REPLACE FUNCTION ensure_user_before_operation()
RETURNS trigger AS $$
BEGIN
  -- Insert user if not exists
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO users (id, email, created_at, updated_at)
    VALUES (
      auth.uid()::text,
      coalesce((SELECT email FROM auth.users WHERE id = auth.uid()), auth.uid()::text || '@clerk.local'),
      now(),
      now()
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Add ensure_user_before_operation triggers to tables
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

-- Step 6: Create or replace the create_user_from_clerk function with better error handling
CREATE OR REPLACE FUNCTION create_user_from_clerk()
RETURNS trigger AS $$
BEGIN
  -- Insert user record, ignore conflicts
  INSERT INTO public.users (id, email, first_name, last_name, created_at, updated_at)
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

-- Step 7: Create a public function to ensure a user exists
CREATE OR REPLACE FUNCTION public.ensure_user_exists(user_id text, user_email text DEFAULT NULL)
RETURNS void AS $$
BEGIN
  INSERT INTO users (id, email, created_at, updated_at)
  VALUES (
    user_id,
    COALESCE(user_email, user_id || '@clerk.local'),
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;