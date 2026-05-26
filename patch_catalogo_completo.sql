-- ═══════════════════════════════════════════════════════
-- SCRIPT DE MIGRAÇÃO COMPLETO: Personalização do Catálogo
-- Execute em: Supabase > SQL Editor > Run
-- ═══════════════════════════════════════════════════════

ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS catalogo_cor_primaria      TEXT DEFAULT '#6C63FF',
  ADD COLUMN IF NOT EXISTS catalogo_cor_secundaria    TEXT DEFAULT '#00BFA5',
  ADD COLUMN IF NOT EXISTS catalogo_descricao         TEXT,
  ADD COLUMN IF NOT EXISTS catalogo_template          TEXT DEFAULT 'moderno',
  ADD COLUMN IF NOT EXISTS catalogo_fonte             TEXT DEFAULT 'Inter',
  ADD COLUMN IF NOT EXISTS catalogo_logo_url          TEXT,
  ADD COLUMN IF NOT EXISTS catalogo_mostrar_carrinho  BOOLEAN DEFAULT TRUE;

-- Atualiza registros existentes para garantir valores padrão seguros
UPDATE empresas SET
  catalogo_cor_primaria = '#6C63FF' WHERE catalogo_cor_primaria IS NULL;

UPDATE empresas SET
  catalogo_cor_secundaria = '#00BFA5' WHERE catalogo_cor_secundaria IS NULL;

UPDATE empresas SET
  catalogo_template = 'moderno' WHERE catalogo_template IS NULL;

UPDATE empresas SET
  catalogo_fonte = 'Inter' WHERE catalogo_fonte IS NULL;

UPDATE empresas SET
  catalogo_mostrar_carrinho = TRUE WHERE catalogo_mostrar_carrinho IS NULL;
