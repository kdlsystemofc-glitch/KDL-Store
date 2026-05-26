-- ═══════════════════════════════════════════════════════
-- PATCH: Personalização do Catálogo Online
-- Execute em: Supabase > SQL Editor > Run
-- ═══════════════════════════════════════════════════════

ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS catalogo_cor_primaria    TEXT DEFAULT '#6C63FF',
  ADD COLUMN IF NOT EXISTS catalogo_cor_secundaria  TEXT DEFAULT '#00BFA5',
  ADD COLUMN IF NOT EXISTS catalogo_descricao       TEXT,
  ADD COLUMN IF NOT EXISTS catalogo_banner_url      TEXT;

-- Atualiza registros existentes com os valores padrão se estiverem nulos
UPDATE empresas SET
  catalogo_cor_primaria   = '#6C63FF'  WHERE catalogo_cor_primaria IS NULL,
  catalogo_cor_secundaria = '#00BFA5'  WHERE catalogo_cor_secundaria IS NULL;
