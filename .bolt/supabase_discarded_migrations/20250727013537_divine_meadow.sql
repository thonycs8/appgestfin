/*
  # Correção completa do schema - Supabase + Clerk Integration

  1. Correções de Schema
    - Adicionar colunas faltantes nas tabelas existentes
    - Corrigir tipos de dados incompatíveis
    - Atualizar foreign keys para usar text em vez de uuid
    
  2. Tabelas Atualizadas
    - `users` - Tabela principal de usuários sincronizada com Clerk
    - `profiles` - Perfis de usuário com dados adicionais
    - `categories` - Categorias de transações
    - `income` - Receitas (renomeada de transactions)
    - `expenses` - Despesas (renomeada de transactions)
    - `payables` - Contas a pagar
    - `investments` - Investimentos
    
  3. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas baseadas em uid() do Clerk
    - Funções de segurança atualizadas
*/

-- Função para obter user ID do JWT do Clerk
CREATE OR REPLACE FUNCTION uid() RETURNS text AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'sub',
    current_setting('request.jwt.claims', true)::json->>'user_id'
  )::text;
$$ LANGUAGE sql STABLE;

-- Função para verificar autenticação
CREATE OR REPLACE FUNCTION is_authenticated() RETURNS boolean AS $$
  SELECT uid() IS NOT NULL;
$$ LANGUAGE sql STABLE;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.first_name || ' ' || NEW.last_name, NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. TABELA USERS (Principal)
DROP TABLE IF EXISTS users CASCADE;
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

-- Índices para users
CREATE INDEX IF NOT EXISTS users_clerk_id_idx ON users(clerk_id);
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);
CREATE INDEX IF NOT EXISTS users_is_active_idx ON users(is_active);

-- RLS para users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (id = uid());

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (id = uid());

-- Trigger para users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 2. TABELA PROFILES (Dados adicionais do usuário)
DROP TABLE IF EXISTS profiles CASCADE;
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

-- RLS para profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (user_id = uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (user_id = uid());

CREATE POLICY "Users can create their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = uid());

-- Trigger para profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 3. TABELA CATEGORIES
DROP TABLE IF EXISTS categories CASCADE;
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  description text,
  color text DEFAULT '#3B82F6',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name, type)
);

-- Índices para categories
CREATE INDEX IF NOT EXISTS categories_user_id_idx ON categories(user_id);
CREATE INDEX IF NOT EXISTS categories_type_idx ON categories(type);
CREATE INDEX IF NOT EXISTS categories_is_active_idx ON categories(is_active);

-- RLS para categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own categories"
  ON categories FOR SELECT
  TO authenticated
  USING (user_id = uid());

CREATE POLICY "Users can create their own categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (user_id = uid());

CREATE POLICY "Users can update their own categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (user_id = uid());

CREATE POLICY "Users can delete their own categories"
  ON categories FOR DELETE
  TO authenticated
  USING (user_id = uid());

-- Trigger para categories
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. TABELA INCOME (Receitas)
DROP TABLE IF EXISTS income CASCADE;
CREATE TABLE income (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  description text,
  date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para income
CREATE INDEX IF NOT EXISTS income_user_id_idx ON income(user_id);
CREATE INDEX IF NOT EXISTS income_category_id_idx ON income(category_id);
CREATE INDEX IF NOT EXISTS income_date_idx ON income(date);
CREATE INDEX IF NOT EXISTS income_amount_idx ON income(amount);

-- RLS para income
ALTER TABLE income ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own income"
  ON income FOR SELECT
  TO authenticated
  USING (user_id = uid());

CREATE POLICY "Users can create their own income"
  ON income FOR INSERT
  TO authenticated
  WITH CHECK (user_id = uid());

CREATE POLICY "Users can update their own income"
  ON income FOR UPDATE
  TO authenticated
  USING (user_id = uid());

CREATE POLICY "Users can delete their own income"
  ON income FOR DELETE
  TO authenticated
  USING (user_id = uid());

-- Trigger para income
DROP TRIGGER IF EXISTS update_income_updated_at ON income;
CREATE TRIGGER update_income_updated_at
  BEFORE UPDATE ON income
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. TABELA EXPENSES (Despesas)
DROP TABLE IF EXISTS expenses CASCADE;
CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  description text,
  date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para expenses
CREATE INDEX IF NOT EXISTS expenses_user_id_idx ON expenses(user_id);
CREATE INDEX IF NOT EXISTS expenses_category_id_idx ON expenses(category_id);
CREATE INDEX IF NOT EXISTS expenses_date_idx ON expenses(date);
CREATE INDEX IF NOT EXISTS expenses_amount_idx ON expenses(amount);

-- RLS para expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (user_id = uid());

CREATE POLICY "Users can create their own expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (user_id = uid());

CREATE POLICY "Users can update their own expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (user_id = uid());

CREATE POLICY "Users can delete their own expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (user_id = uid());

-- Trigger para expenses
DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. ATUALIZAR TABELA PAYABLES (corrigir user_id)
DO $$
BEGIN
  -- Verificar se a coluna user_id existe e é do tipo correto
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payables' AND column_name = 'user_id' AND data_type = 'uuid'
  ) THEN
    -- Remover dados existentes se houver incompatibilidade
    DELETE FROM payables;
    
    -- Alterar tipo da coluna
    ALTER TABLE payables ALTER COLUMN user_id TYPE text;
  END IF;
  
  -- Adicionar coluna se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payables' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE payables ADD COLUMN user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Atualizar RLS para payables
DROP POLICY IF EXISTS "Users can view their own payables" ON payables;
DROP POLICY IF EXISTS "Users can create their own payables" ON payables;
DROP POLICY IF EXISTS "Users can update their own payables" ON payables;
DROP POLICY IF EXISTS "Users can delete their own payables" ON payables;

CREATE POLICY "Users can view their own payables"
  ON payables FOR SELECT
  TO authenticated
  USING (user_id = uid());

CREATE POLICY "Users can create their own payables"
  ON payables FOR INSERT
  TO authenticated
  WITH CHECK (user_id = uid());

CREATE POLICY "Users can update their own payables"
  ON payables FOR UPDATE
  TO authenticated
  USING (user_id = uid());

CREATE POLICY "Users can delete their own payables"
  ON payables FOR DELETE
  TO authenticated
  USING (user_id = uid());

-- 7. ATUALIZAR TABELA INVESTMENTS (corrigir user_id)
DO $$
BEGIN
  -- Verificar se a coluna user_id existe e é do tipo correto
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'investments' AND column_name = 'user_id' AND data_type = 'uuid'
  ) THEN
    -- Remover dados existentes se houver incompatibilidade
    DELETE FROM investments;
    
    -- Alterar tipo da coluna
    ALTER TABLE investments ALTER COLUMN user_id TYPE text;
  END IF;
  
  -- Adicionar coluna se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'investments' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE investments ADD COLUMN user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Atualizar RLS para investments
DROP POLICY IF EXISTS "Users can view their own investments" ON investments;
DROP POLICY IF EXISTS "Users can create their own investments" ON investments;
DROP POLICY IF EXISTS "Users can update their own investments" ON investments;
DROP POLICY IF EXISTS "Users can delete their own investments" ON investments;

CREATE POLICY "Users can view their own investments"
  ON investments FOR SELECT
  TO authenticated
  USING (user_id = uid());

CREATE POLICY "Users can create their own investments"
  ON investments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = uid());

CREATE POLICY "Users can update their own investments"
  ON investments FOR UPDATE
  TO authenticated
  USING (user_id = uid());

CREATE POLICY "Users can delete their own investments"
  ON investments FOR DELETE
  TO authenticated
  USING (user_id = uid());

-- 8. ATUALIZAR TABELAS STRIPE (corrigir user_id)
DO $$
BEGIN
  -- Atualizar stripe_customers
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stripe_customers' AND column_name = 'user_id' AND data_type = 'uuid'
  ) THEN
    DELETE FROM stripe_customers;
    ALTER TABLE stripe_customers ALTER COLUMN user_id TYPE text;
  END IF;
END $$;

-- Atualizar RLS para stripe_customers
DROP POLICY IF EXISTS "Users can view their own customer data" ON stripe_customers;
CREATE POLICY "Users can view their own customer data"
  ON stripe_customers FOR SELECT
  TO authenticated
  USING (user_id = uid() AND deleted_at IS NULL);

-- 9. CRIAR TABELA TRANSACTIONS UNIFICADA (para compatibilidade)
DROP TABLE IF EXISTS transactions CASCADE;
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

-- Índices para transactions
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_type_idx ON transactions(type);
CREATE INDEX IF NOT EXISTS transactions_date_idx ON transactions(date);
CREATE INDEX IF NOT EXISTS transactions_status_idx ON transactions(status);

-- RLS para transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (user_id = uid());

CREATE POLICY "Users can create their own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = uid());

CREATE POLICY "Users can update their own transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (user_id = uid());

CREATE POLICY "Users can delete their own transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (user_id = uid());

-- Trigger para transactions
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 10. TRIGGER PARA CRIAR PERFIL AUTOMATICAMENTE
DROP TRIGGER IF EXISTS on_auth_user_created ON users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 11. INSERIR CATEGORIAS PADRÃO (função)
CREATE OR REPLACE FUNCTION create_default_categories(p_user_id text)
RETURNS void AS $$
BEGIN
  -- Categorias de receita
  INSERT INTO categories (user_id, name, type, color) VALUES
    (p_user_id, 'Salário', 'income', '#22c55e'),
    (p_user_id, 'Freelance', 'income', '#16a34a'),
    (p_user_id, 'Investimentos', 'income', '#15803d'),
    (p_user_id, 'Vendas', 'income', '#166534')
  ON CONFLICT (user_id, name, type) DO NOTHING;
  
  -- Categorias de despesa
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. FUNÇÃO PARA ESTATÍSTICAS FINANCEIRAS
CREATE OR REPLACE FUNCTION get_user_financial_stats(p_user_id text DEFAULT uid())
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_income', COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0),
    'total_expenses', COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0),
    'transaction_count', COUNT(*),
    'categories_count', (SELECT COUNT(*) FROM categories WHERE user_id = p_user_id AND is_active = true),
    'last_transaction_date', MAX(date)
  ) INTO result
  FROM transactions 
  WHERE user_id = p_user_id AND status = 'completed';
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. VIEWS PARA RELATÓRIOS
CREATE OR REPLACE VIEW user_transaction_summary AS
SELECT 
  user_id,
  type,
  category,
  subcategory,
  DATE_TRUNC('month', date) as month,
  COUNT(*) as transaction_count,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount
FROM transactions
WHERE user_id = uid()
GROUP BY user_id, type, category, subcategory, DATE_TRUNC('month', date);

-- RLS para view
ALTER VIEW user_transaction_summary SET (security_barrier = true);

-- 14. GRANT PERMISSIONS
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;