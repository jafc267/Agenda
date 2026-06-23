-- ============================================================
-- Agenda — Script SQL para o Supabase
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================

-- 1. Criar tabela de contatos
CREATE TABLE IF NOT EXISTS contatos (
  id        BIGSERIAL PRIMARY KEY,
  nome      TEXT NOT NULL,
  email     TEXT NOT NULL UNIQUE,
  telefone  TEXT NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Índice para busca por nome (ordem alfabética)
CREATE INDEX IF NOT EXISTS idx_contatos_nome ON contatos (nome);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE contatos ENABLE ROW LEVEL SECURITY;

-- 4. Policy: permitir todas as operações via service_role (backend)
CREATE POLICY "Backend acesso total" ON contatos
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Pronto! A tabela está criada e pronta para uso.
-- ============================================================
