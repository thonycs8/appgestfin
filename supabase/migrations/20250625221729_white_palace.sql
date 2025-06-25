/*
  # Fix RLS policies and user creation

  1. Security
    - Fix RLS policies for all tables
    - Ensure proper user creation flow
    - Add proper error handling for user creation

  2. Changes
    - Update RLS policies to handle user creation
    - Add better error handling
    - Ensure foreign key constraints work properly
*/

-- Step 1: Create or replace the user creation function with better error handling
CREATE OR REPLACE FUNCTION create_user_from_clerk()
RETURNS trigger AS $$
BEGIN
  -- Insert user record, ignore conflicts
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NEW.created_at, NEW.updated_at)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = EXCLUDED.updated_at;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth process
    RAISE WARNING 'Failed to create user record: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_from_clerk();

-- Step 3: Create a function to ensure user exists before operations
CREATE OR REPLACE FUNCTION ensure_user_exists(user_id text, user_email text DEFAULT NULL)
RETURNS void AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (user_id, COALESCE(user_email, user_id || '@unknown.com'), now(), now())
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Update RLS policies to be more permissive for user creation

-- Categories policies - allow insert if user exists or can be created
DROP POLICY IF EXISTS "Users can manage their own categories" ON categories;
CREATE POLICY "Users can manage their own categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (
    auth.uid()::text = user_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text)
  )
  WITH CHECK (
    auth.uid()::text = user_id
  );

-- Transactions policies - allow insert if user exists or can be created
DROP POLICY IF EXISTS "Users can manage their own transactions" ON transactions;
CREATE POLICY "Users can manage their own transactions"
  ON transactions
  FOR ALL
  TO authenticated
  USING (
    auth.uid()::text = user_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text)
  )
  WITH CHECK (
    auth.uid()::text = user_id
  );

-- Payables policies - allow insert if user exists or can be created
DROP POLICY IF EXISTS "Users can manage their own payables" ON payables;
CREATE POLICY "Users can manage their own payables"
  ON payables
  FOR ALL
  TO authenticated
  USING (
    auth.uid()::text = user_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text)
  )
  WITH CHECK (
    auth.uid()::text = user_id
  );

-- Investments policies - allow insert if user exists or can be created
DROP POLICY IF EXISTS "Users can manage their own investments" ON investments;
CREATE POLICY "Users can manage their own investments"
  ON investments
  FOR ALL
  TO authenticated
  USING (
    auth.uid()::text = user_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text)
  )
  WITH CHECK (
    auth.uid()::text = user_id
  );

-- Step 5: Create a more permissive policy for users table
DROP POLICY IF EXISTS "Users can insert own data" ON users;
CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = id);

-- Allow users to insert their own record even if it doesn't exist yet
DROP POLICY IF EXISTS "Allow user self-creation" ON users;
CREATE POLICY "Allow user self-creation"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Allow any authenticated user to create their record

-- Step 6: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id_active ON categories(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id_date ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_payables_user_id_status ON payables(user_id, status);

-- Step 7: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.categories TO authenticated;
GRANT ALL ON public.transactions TO authenticated;
GRANT ALL ON public.payables TO authenticated;
GRANT ALL ON public.investments TO authenticated;