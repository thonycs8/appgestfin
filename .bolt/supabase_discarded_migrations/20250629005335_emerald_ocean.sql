/*
  # Migração para integração Clerk + Supabase

  1. Novos Campos na Tabela Users
    - clerk_id (identificador único do Clerk)
    - username, avatar_url, phone
    - email_verified, phone_verified
    - role (user, admin, manager)
    - is_active, last_sign_in_at
    - metadata (dados adicionais em JSON)

  2. Funções de Autenticação
    - get_current_user_id() - extrai ID do usuário do JWT
    - get_jwt_claims() - obtém claims do JWT
    - sync_user_from_jwt() - sincronização manual

  3. Políticas RLS Atualizadas
    - Usar funções públicas em vez do schema auth
    - Manter segurança por usuário

  4. Índices de Performance
    - Índices para campos de busca frequente
    - Índices compostos para queries otimizadas
*/

-- Verificar se a tabela users existe antes de modificar
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    RAISE EXCEPTION 'Table users does not exist. Please ensure the users table is created first.';
  END IF;
END $$;

-- Atualizar tabela users com campos necessários para Clerk
DO $$
BEGIN
  -- Adicionar clerk_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'clerk_id'
  ) THEN
    ALTER TABLE users ADD COLUMN clerk_id text;
    -- Criar índice único após adicionar a coluna
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_clerk_id_unique ON users(clerk_id) WHERE clerk_id IS NOT NULL;
  END IF;

  -- Adicionar username se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'username'
  ) THEN
    ALTER TABLE users ADD COLUMN username text;
  END IF;

  -- Adicionar avatar_url se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE users ADD COLUMN avatar_url text;
  END IF;

  -- Adicionar phone se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'phone'
  ) THEN
    ALTER TABLE users ADD COLUMN phone text;
  END IF;

  -- Adicionar email_verified se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE users ADD COLUMN email_verified boolean DEFAULT false;
  END IF;

  -- Adicionar phone_verified se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'phone_verified'
  ) THEN
    ALTER TABLE users ADD COLUMN phone_verified boolean DEFAULT false;
  END IF;

  -- Adicionar role se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE users ADD COLUMN role text DEFAULT 'user';
    -- Adicionar constraint após criar a coluna
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin', 'manager'));
  END IF;

  -- Adicionar is_active se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE users ADD COLUMN is_active boolean DEFAULT true;
  END IF;

  -- Adicionar last_sign_in_at se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'last_sign_in_at'
  ) THEN
    ALTER TABLE users ADD COLUMN last_sign_in_at timestamptz;
  END IF;

  -- Adicionar metadata se não existir
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

-- Atualizar políticas RLS para usar a nova função (apenas se existirem)
DO $$
BEGIN
  -- Verificar se as políticas existem antes de tentar removê-las
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can read own data') THEN
    DROP POLICY "Users can read own data" ON users;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update own data') THEN
    DROP POLICY "Users can update own data" ON users;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can insert own data') THEN
    DROP POLICY "Users can insert own data" ON users;
  END IF;
END $$;

-- Criar políticas RLS para users
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

-- Atualizar políticas para outras tabelas (apenas se as tabelas existirem)
DO $$
BEGIN
  -- Verificar e atualizar políticas para transactions
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions') THEN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Users can manage their own transactions') THEN
      DROP POLICY "Users can manage their own transactions" ON transactions;
    END IF;
    
    CREATE POLICY "Users can manage their own transactions" ON transactions
      FOR ALL TO authenticated
      USING (user_id = public.get_current_user_id())
      WITH CHECK (user_id = public.get_current_user_id());
  END IF;

  -- Verificar e atualizar políticas para categories
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Users can manage their own categories') THEN
      DROP POLICY "Users can manage their own categories" ON categories;
    END IF;
    
    CREATE POLICY "Users can manage their own categories" ON categories
      FOR ALL TO authenticated
      USING (user_id = public.get_current_user_id())
      WITH CHECK (user_id = public.get_current_user_id());
  END IF;

  -- Verificar e atualizar políticas para payables
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payables') THEN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payables' AND policyname = 'Users can manage their own payables') THEN
      DROP POLICY "Users can manage their own payables" ON payables;
    END IF;
    
    CREATE POLICY "Users can manage their own payables" ON payables
      FOR ALL TO authenticated
      USING (user_id = public.get_current_user_id())
      WITH CHECK (user_id = public.get_current_user_id());
  END IF;

  -- Verificar e atualizar políticas para investments
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'investments') THEN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'investments' AND policyname = 'Users can manage their own investments') THEN
      DROP POLICY "Users can manage their own investments" ON investments;
    END IF;
    
    CREATE POLICY "Users can manage their own investments" ON investments
      FOR ALL TO authenticated
      USING (user_id = public.get_current_user_id())
      WITH CHECK (user_id = public.get_current_user_id());
  END IF;
END $$;

-- Criar índices para melhor performance (apenas se não existirem)
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_last_sign_in ON users(last_sign_in_at);

-- Criar índices compostos para queries comuns (apenas se as tabelas existirem)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions') THEN
    CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);
    CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON transactions(user_id, type);
    CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON transactions(user_id, category);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
    CREATE INDEX IF NOT EXISTS idx_categories_user_type ON categories(user_id, type);
    CREATE INDEX IF NOT EXISTS idx_categories_user_active ON categories(user_id, is_active);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payables') THEN
    CREATE INDEX IF NOT EXISTS idx_payables_user_status ON payables(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_payables_user_due_date ON payables(user_id, due_date);
  END IF;
END $$;

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

  -- Verificar se a tabela transactions existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions') THEN
    RETURN jsonb_build_object(
      'total_income', 0,
      'total_expenses', 0,
      'transaction_count', 0,
      'categories_count', 0,
      'payables_pending', 0,
      'payables_overdue', 0
    );
  END IF;

  SELECT jsonb_build_object(
    'total_income', COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0),
    'total_expenses', COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0),
    'transaction_count', COUNT(*),
    'categories_count', (
      SELECT COALESCE(COUNT(DISTINCT id), 0) FROM categories 
      WHERE categories.user_id = target_user_id AND is_active = true
    ),
    'payables_pending', (
      SELECT COALESCE(COUNT(*), 0) FROM payables 
      WHERE payables.user_id = target_user_id AND status = 'pending'
    ),
    'payables_overdue', (
      SELECT COALESCE(COUNT(*), 0) FROM payables 
      WHERE payables.user_id = target_user_id AND status = 'overdue'
    )
  ) INTO stats
  FROM transactions
  WHERE transactions.user_id = target_user_id;

  RETURN COALESCE(stats, jsonb_build_object(
    'total_income', 0,
    'total_expenses', 0,
    'transaction_count', 0,
    'categories_count', 0,
    'payables_pending', 0,
    'payables_overdue', 0
  ));
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
  RAISE NOTICE 'Cleanup function executed successfully';
END;
$$;