/*
  # Criar tabela de workouts para exemplo TanStack Query

  1. Nova Tabela
    - `workouts`
      - `id` (uuid, primary key)
      - `user_id` (text, foreign key para users)
      - `name` (text, nome do treino)
      - `description` (text, descrição)
      - `duration` (integer, duração em minutos)
      - `difficulty` (text, nível de dificuldade)
      - `exercises` (text[], lista de exercícios)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - Enable RLS na tabela `workouts`
    - Política para usuários lerem/criarem/editarem seus próprios workouts

  3. Triggers
    - Trigger para atualizar `updated_at` automaticamente
*/

-- Criar tabela workouts
CREATE TABLE IF NOT EXISTS workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  duration integer NOT NULL CHECK (duration > 0),
  difficulty text NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  exercises text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own workouts"
  ON workouts
  FOR SELECT
  TO authenticated
  USING (user_id = uid());

CREATE POLICY "Users can create their own workouts"
  ON workouts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = uid());

CREATE POLICY "Users can update their own workouts"
  ON workouts
  FOR UPDATE
  TO authenticated
  USING (user_id = uid())
  WITH CHECK (user_id = uid());

CREATE POLICY "Users can delete their own workouts"
  ON workouts
  FOR DELETE
  TO authenticated
  USING (user_id = uid());

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_workouts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workouts_updated_at
  BEFORE UPDATE ON workouts
  FOR EACH ROW
  EXECUTE FUNCTION update_workouts_updated_at();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_difficulty ON workouts(difficulty);
CREATE INDEX IF NOT EXISTS idx_workouts_created_at ON workouts(created_at DESC);