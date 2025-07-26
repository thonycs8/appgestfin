/*
  # Integração Supabase + Clerk Authentication

  1. Tabelas de Usuários
    - `users` - Tabela principal de usuários sincronizada com Clerk
    - `profiles` - Perfis de usuários com informações adicionais

  2. Funções de Autenticação
    - `uid()` - Função para obter o ID do usuário atual
    - `handle_new_user()` - Trigger para criar perfil automaticamente

  3. Políticas RLS
    - Políticas baseadas no ID do usuário do Clerk
    - Acesso restrito aos próprios dados

  4. Triggers
    - Criação automática de perfil quando usuário é inserido
    - Atualização de timestamps
*/

-- Criar extensão para UUID se não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Função para obter o ID do usuário atual (compatível com Clerk)
CREATE OR REPLACE FUNCTION uid() RETURNS text AS $$
BEGIN
  -- Tenta obter o user_id do JWT do Clerk
  RETURN COALESCE(
    current_setting('request.jwt.claims', true)::json->>'sub',
    current_setting('request.jwt.claims', true)::json->>'user_id',
    ''
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se o usuário está autenticado
CREATE OR REPLACE FUNCTION is_authenticated() RETURNS boolean AS $$
BEGIN
  RETURN uid() != '';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tabela de usuários (sincronizada com Clerk)
CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY, -- ID do Clerk
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

-- Índices para performance
CREATE INDEX IF NOT EXISTS users_clerk_id_idx ON users(clerk_id);
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);
CREATE INDEX IF NOT EXISTS users_is_active_idx ON users(is_active);

-- Atualizar tabela de perfis para usar o ID do Clerk
DO $$
BEGIN
  -- Verificar se a coluna user_id já existe e tem o tipo correto
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'user_id' AND data_type = 'uuid'
  ) THEN
    -- Alterar o tipo da coluna user_id para text
    ALTER TABLE profiles ALTER COLUMN user_id TYPE text;
  END IF;
END $$;

-- Garantir que a tabela profiles existe com a estrutura correta
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

-- Atualizar tabelas existentes para usar text em vez de uuid para user_id
DO $$
BEGIN
  -- Categories
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'user_id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE categories ALTER COLUMN user_id TYPE text;
  END IF;

  -- Income
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'income' AND column_name = 'user_id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE income ALTER COLUMN user_id TYPE text;
  END IF;

  -- Expenses
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'user_id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE expenses ALTER COLUMN user_id TYPE text;
  END IF;

  -- Payables
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payables' AND column_name = 'user_id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE payables ALTER COLUMN user_id TYPE text;
  END IF;

  -- Investments
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'investments' AND column_name = 'user_id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE investments ALTER COLUMN user_id TYPE text;
  END IF;

  -- Stripe customers
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stripe_customers' AND column_name = 'user_id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE stripe_customers ALTER COLUMN user_id TYPE text;
  END IF;
END $$;

-- Criar tabela de transações se não existir
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  category text,
  subcategory text,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  description text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para transações
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_type_idx ON transactions(type);
CREATE INDEX IF NOT EXISTS transactions_date_idx ON transactions(date);
CREATE INDEX IF NOT EXISTS transactions_category_idx ON transactions(category);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
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

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para criar perfil automaticamente
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

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payables ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para users
DROP POLICY IF EXISTS "Users can view their own data" ON users;
CREATE POLICY "Users can view their own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (id = uid());

DROP POLICY IF EXISTS "Users can update their own data" ON users;
CREATE POLICY "Users can update their own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = uid())
  WITH CHECK (id = uid());

DROP POLICY IF EXISTS "Users can insert their own data" ON users;
CREATE POLICY "Users can insert their own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (id = uid());

-- Políticas RLS para profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (user_id = uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = uid())
  WITH CHECK (user_id = uid());

DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
CREATE POLICY "Users can create their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = uid());

-- Políticas RLS para transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
CREATE POLICY "Users can view their own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (user_id = uid());

DROP POLICY IF EXISTS "Users can create their own transactions" ON transactions;
CREATE POLICY "Users can create their own transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = uid());

DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
CREATE POLICY "Users can update their own transactions"
  ON transactions
  FOR UPDATE
  TO authenticated
  USING (user_id = uid())
  WITH CHECK (user_id = uid());

DROP POLICY IF EXISTS "Users can delete their own transactions" ON transactions;
CREATE POLICY "Users can delete their own transactions"
  ON transactions
  FOR DELETE
  TO authenticated
  USING (user_id = uid());

-- Políticas RLS para categories
DROP POLICY IF EXISTS "Users can view their own categories" ON categories;
CREATE POLICY "Users can view their own categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (user_id = uid());

DROP POLICY IF EXISTS "Users can create their own categories" ON categories;
CREATE POLICY "Users can create their own categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = uid());

DROP POLICY IF EXISTS "Users can update their own categories" ON categories;
CREATE POLICY "Users can update their own categories"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (user_id = uid())
  WITH CHECK (user_id = uid());

DROP POLICY IF EXISTS "Users can delete their own categories" ON categories;
CREATE POLICY "Users can delete their own categories"
  ON categories
  FOR DELETE
  TO authenticated
  USING (user_id = uid());

-- Políticas RLS para income
DROP POLICY IF EXISTS "Users can view their own income" ON income;
CREATE POLICY "Users can view their own income"
  ON income
  FOR SELECT
  TO authenticated
  USING (user_id = uid());

DROP POLICY IF EXISTS "Users can create their own income" ON income;
CREATE POLICY "Users can create their own income"
  ON income
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = uid());

DROP POLICY IF EXISTS "Users can update their own income" ON income;
CREATE POLICY "Users can update their own income"
  ON income
  FOR UPDATE
  TO authenticated
  USING (user_id = uid())
  WITH CHECK (user_id = uid());

DROP POLICY IF EXISTS "Users can delete their own income" ON income;
CREATE POLICY "Users can delete their own income"
  ON income
  FOR DELETE
  TO authenticated
  USING (user_id = uid());

-- Políticas RLS para expenses
DROP POLICY IF EXISTS "Users can view their own expenses" ON expenses;
CREATE POLICY "Users can view their own expenses"
  ON expenses
  FOR SELECT
  TO authenticated
  USING (user_id = uid());

DROP POLICY IF EXISTS "Users can create their own expenses" ON expenses;
CREATE POLICY "Users can create their own expenses"
  ON expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = uid());

DROP POLICY IF EXISTS "Users can update their own expenses" ON expenses;
CREATE POLICY "Users can update their own expenses"
  ON expenses
  FOR UPDATE
  TO authenticated
  USING (user_id = uid())
  WITH CHECK (user_id = uid());

DROP POLICY IF EXISTS "Users can delete their own expenses" ON expenses;
CREATE POLICY "Users can delete their own expenses"
  ON expenses
  FOR DELETE
  TO authenticated
  USING (user_id = uid());

-- Políticas RLS para payables
DROP POLICY IF EXISTS "Users can view their own payables" ON payables;
CREATE POLICY "Users can view their own payables"
  ON payables
  FOR SELECT
  TO authenticated
  USING (user_id = uid());

DROP POLICY IF EXISTS "Users can create their own payables" ON payables;
CREATE POLICY "Users can create their own payables"
  ON payables
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = uid());

DROP POLICY IF EXISTS "Users can update their own payables" ON payables;
CREATE POLICY "Users can update their own payables"
  ON payables
  FOR UPDATE
  TO authenticated
  USING (user_id = uid())
  WITH CHECK (user_id = uid());

DROP POLICY IF EXISTS "Users can delete their own payables" ON payables;
CREATE POLICY "Users can delete their own payables"
  ON payables
  FOR DELETE
  TO authenticated
  USING (user_id = uid());

-- Políticas RLS para investments
DROP POLICY IF EXISTS "Users can view their own investments" ON investments;
CREATE POLICY "Users can view their own investments"
  ON investments
  FOR SELECT
  TO authenticated
  USING (user_id = uid());

DROP POLICY IF EXISTS "Users can create their own investments" ON investments;
CREATE POLICY "Users can create their own investments"
  ON investments
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = uid());

DROP POLICY IF EXISTS "Users can update their own investments" ON investments;
CREATE POLICY "Users can update their own investments"
  ON investments
  FOR UPDATE
  TO authenticated
  USING (user_id = uid())
  WITH CHECK (user_id = uid());

DROP POLICY IF EXISTS "Users can delete their own investments" ON investments;
CREATE POLICY "Users can delete their own investments"
  ON investments
  FOR DELETE
  TO authenticated
  USING (user_id = uid());

-- Atualizar políticas do Stripe para usar text
DROP POLICY IF EXISTS "Users can view their own customer data" ON stripe_customers;
CREATE POLICY "Users can view their own customer data"
  ON stripe_customers
  FOR SELECT
  TO authenticated
  USING (user_id = uid() AND deleted_at IS NULL);

-- Função para obter estatísticas financeiras do usuário
CREATE OR REPLACE FUNCTION get_user_financial_stats()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_transactions', COUNT(*),
    'total_income', COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0),
    'total_expenses', COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0),
    'net_balance', COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0),
    'categories_count', (SELECT COUNT(*) FROM categories WHERE user_id = uid()),
    'payables_count', (SELECT COUNT(*) FROM payables WHERE user_id = uid())
  )
  INTO result
  FROM transactions
  WHERE user_id = uid();
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões necessárias
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;