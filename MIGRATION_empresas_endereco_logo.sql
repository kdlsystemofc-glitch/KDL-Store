-- ============================================================
-- MIGRATION: Adiciona colunas de endereço estruturado e logo
--            à tabela `empresas`
--
-- Execute este script no SQL Editor do Supabase
-- (menu lateral: SQL Editor → New query → cole e clique em RUN)
-- ============================================================

-- 1. Endereço estruturado
ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS cep          TEXT,
  ADD COLUMN IF NOT EXISTS rua          TEXT,
  ADD COLUMN IF NOT EXISTS numero       TEXT,
  ADD COLUMN IF NOT EXISTS bairro       TEXT,
  ADD COLUMN IF NOT EXISTS complemento  TEXT,
  ADD COLUMN IF NOT EXISTS cidade       TEXT,
  ADD COLUMN IF NOT EXISTS estado       TEXT,
  ADD COLUMN IF NOT EXISTS endereco     TEXT;

-- 2. Logo da loja
ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS logo_url     TEXT;

-- 3. Força o PostgREST a recarregar o schema cache imediatamente
NOTIFY pgrst, 'reload schema';

-- Verificação: lista todas as colunas da tabela empresas
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'empresas'
ORDER BY ordinal_position;
