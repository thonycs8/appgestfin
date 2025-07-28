/*
  # Melhorar integração Clerk/Supabase e autenticação

  1. Novos campos na tabela users
    - clerk_id (identificador único do Clerk)
    - username, avatar_url, phone
    - email_verified, phone_verified
    - role (user, admin, manager)
    - is_active, last_sign_in_at
    - metadata (dados adicionais em JSON)

  2. Funções melhoradas
    - Função para extrair user_id do JWT
    - Sincronização automática com Clerk
    - Funções de estatísticas financeiras

  3. Políticas RLS atualizadas
    - Usar nova função de autenticação
    - Melhor segurança por usuário

  4. Índices para performance
    - Índices simples e compostos
    - Otimização de queries comuns
*/

-- Atualizar tabela users com campos necessários para Clerk
DO $$
BEGIN
  -- Adicionar colunas se não existirem
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'clerk_id'
  ) THEN
    ALTER TABLE users ADD COLUMN clerk_id text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'username'
  ) THEN
    ALTER TABLE users ADD COLUMN username text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE users ADD COLUMN avatar_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'phone'
  ) THEN
    ALTER TABLE users ADD COLUMN phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE users ADD COLUMN email_verified boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'phone_verified'
  ) THEN
    ALTER TABLE users ADD COLUMN phone_verified boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE users ADD COLUMN role text DEFAULT 'user' CHECK (role IN ('user', 'admin', 'manager'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE users ADD COLUMN is_active boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'last_sign_in_at'
  ) THEN
    ALTER TABLE users ADD COLUMN last_sign_in_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE users ADD COLUMN metadata jsonb DEFAULT '{}';
  END IF;
END $$;

-- Criar função para extrair user_id do JWT (sem usar schema auth)
CREATE OR REPLACE FUNCTION public.get_current_user_id() 
RETURNS text 
LANGUAGE sql 
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json ->> 'sub',
    current_setting('request.jwt.claims', true)::json ->> 'user_id',
    current_setting('request.jwt.claims', true)::json ->> 'clerk_user_id'
  );
$$;

-- Função alternativa para obter JWT claims
CREATE OR REPLACE FUNCTION public.get_jwt_claims()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json,
    '{}'::json
  );
$$;

-- Criar função para sincronização de usuários do Clerk
CREATE OR REPLACE FUNCTION public.handle_clerk_user_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_data json;
  current_user_id text;
BEGIN
  -- Extrair dados do usuário do JWT
  user_data := public.get_jwt_claims();
  current_user_id := public.get_current_user_id();
  
  IF current_user_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Inserir ou atualizar usuário
  INSERT INTO public.users (
    id,
    clerk_id,
    email,
    first_name,
    last_name,
    username,
    avatar_url,
    phone,
    email_verified,
    phone_verified,
    role,
    is_active,
    last_sign_in_at,
    metadata,
    created_at,
    updated_at
  ) VALUES (
    current_user_id,
    user_data ->> 'clerk_user_id',
    user_data ->> 'email',
    user_data ->> 'given_name',
    user_data ->> 'family_name',
    user_data ->> 'username',
    user_data ->> 'image_url',
    user_data ->> 'phone_number',
    COALESCE((user_data ->> 'email_verified')::boolean, false),
    COALESCE((user_data ->> 'phone_verified')::boolean, false),
    COALESCE(user_data ->> 'role', 'user'),
    COALESCE((user_data ->> 'active')::boolean, true),
    NOW(),
    COALESCE(user_data -> 'user_metadata', '{}'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    clerk_id = EXCLUDED.clerk_id,
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    username = EXCLUDED.username,
    avatar_url = EXCLUDED.avatar_url,
    phone = EXCLUDED.phone,
    email_verified = EXCLUDED.email_verified,
    phone_verified = EXCLUDED.phone_verified,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    last_sign_in_at = EXCLUDED.last_sign_in_at,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Melhorar função auto_set_user_id para usar a nova função
CREATE OR REPLACE FUNCTION public.auto_set_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id text;
BEGIN
  current_user_id := public.get_current_user_id();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  NEW.user_id := current_user_id;
  RETURN NEW;
END;
$$;

-- Melhorar função ensure_user_before_operation
CREATE OR REPLACE FUNCTION public.ensure_user_before_operation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id text;
  user_data json;
BEGIN
  current_user_id := public.get_current_user_id();
  user_data := public.get_jwt_claims();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Garantir que o usuário existe na tabela users
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (
    current_user_id,
    COALESCE(user_data ->> 'email', 'unknown@example.com'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    last_sign_in_at = NOW(),
    updated_at = NOW();

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Atualizar políticas RLS para usar a nova função
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;

CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated
  USING (id = public.get_current_user_id());

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE TO authenticated
  USING (id = public.get_current_user_id())
  WITH CHECK (id = public.get_current_user_id());

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT TO authenticated
  WITH CHECK (id = public.get_current_user_id());

-- Atualizar políticas para outras tabelas
DROP POLICY IF EXISTS "Users can manage their own transactions" ON transactions;
CREATE POLICY "Users can manage their own transactions" ON transactions
  FOR ALL TO authenticated
  USING (user_id = public.get_current_user_id())
  WITH CHECK (user_id = public.get_current_user_id());

DROP POLICY IF EXISTS "Users can manage their own categories" ON categories;
CREATE POLICY "Users can manage their own categories" ON categories
  FOR ALL TO authenticated
  USING (user_id = public.get_current_user_id())
  WITH CHECK (user_id = public.get_current_user_id());

DROP POLICY IF EXISTS "Users can manage their own payables" ON payables;
CREATE POLICY "Users can manage their own payables" ON payables
  FOR ALL TO authenticated
  USING (user_id = public.get_current_user_id())
  WITH CHECK (user_id = public.get_current_user_id());

DROP POLICY IF EXISTS "Users can manage their own investments" ON investments;
CREATE POLICY "Users can manage their own investments" ON investments
  FOR ALL TO authenticated
  USING (user_id = public.get_current_user_id())
  WITH CHECK (user_id = public.get_current_user_id());

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_last_sign_in ON users(last_sign_in_at);

-- Criar índices compostos para queries comuns
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON transactions(user_id, category);

CREATE INDEX IF NOT EXISTS idx_categories_user_type ON categories(user_id, type);
CREATE INDEX IF NOT EXISTS idx_categories_user_active ON categories(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_payables_user_status ON payables(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payables_user_due_date ON payables(user_id, due_date);

-- Função para obter estatísticas do usuário
CREATE OR REPLACE FUNCTION public.get_user_financial_stats(user_id_param text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id text;
  stats jsonb;
BEGIN
  target_user_id := COALESCE(user_id_param, public.get_current_user_id());
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT jsonb_build_object(
    'total_income', COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0),
    'total_expenses', COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0),
    'transaction_count', COUNT(*),
    'categories_count', (
      SELECT COUNT(DISTINCT id) FROM categories 
      WHERE categories.user_id = target_user_id AND is_active = true
    ),
    'payables_pending', (
      SELECT COUNT(*) FROM payables 
      WHERE payables.user_id = target_user_id AND status = 'pending'
    ),
    'payables_overdue', (
      SELECT COUNT(*) FROM payables 
      WHERE payables.user_id = target_user_id AND status = 'overdue'
    )
  ) INTO stats
  FROM transactions
  WHERE transactions.user_id = target_user_id;

  RETURN stats;
END;
$$;

-- Função para limpar dados antigos (opcional)
CREATE OR REPLACE FUNCTION public.cleanup_old_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Remover transações muito antigas (mais de 5 anos) se necessário
  -- DELETE FROM transactions WHERE created_at < NOW() - INTERVAL '5 years';
  
  -- Remover logs antigos se existirem
  -- DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '1 year';
  
  -- Por enquanto, apenas um placeholder
  RAISE NOTICE 'Cleanup function executed';
END;
$$;

-- Função para sincronizar usuário manualmente
CREATE OR REPLACE FUNCTION public.sync_user_from_jwt()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_data json;
  current_user_id text;
BEGIN
  user_data := public.get_jwt_claims();
  current_user_id := public.get_current_user_id();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Inserir ou atualizar usuário
  INSERT INTO public.users (
    id,
    clerk_id,
    email,
    first_name,
    last_name,
    username,
    avatar_url,
    phone,
    email_verified,
    phone_verified,
    role,
    is_active,
    last_sign_in_at,
    metadata,
    created_at,
    updated_at
  ) VALUES (
    current_user_id,
    user_data ->> 'clerk_user_id',
    user_data ->> 'email',
    user_data ->> 'given_name',
    user_data ->> 'family_name',
    user_data ->> 'username',
    user_data ->> 'image_url',
    user_data ->> 'phone_number',
    COALESCE((user_data ->> 'email_verified')::boolean, false),
    COALESCE((user_data ->> 'phone_verified')::boolean, false),
    COALESCE(user_data ->> 'role', 'user'),
    COALESCE((user_data ->> 'active')::boolean, true),
    NOW(),
    COALESCE(user_data -> 'user_metadata', '{}'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    clerk_id = EXCLUDED.clerk_id,
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    username = EXCLUDED.username,
    avatar_url = EXCLUDED.avatar_url,
    phone = EXCLUDED.phone,
    email_verified = EXCLUDED.email_verified,
    phone_verified = EXCLUDED.phone_verified,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    last_sign_in_at = EXCLUDED.last_sign_in_at,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();
END;
$$;