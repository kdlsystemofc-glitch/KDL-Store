-- ═══════════════════════════════════════════════════════
-- PATCH V3: Identidade Visual e Recursos do Catálogo Online
-- Execute em: Supabase > SQL Editor > Run
-- ═══════════════════════════════════════════════════════

ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS catalogo_template          TEXT DEFAULT 'moderno',
  ADD COLUMN IF NOT EXISTS catalogo_fonte             TEXT DEFAULT 'Inter',
  ADD COLUMN IF NOT EXISTS catalogo_logo_url          TEXT,
  ADD COLUMN IF NOT EXISTS catalogo_mostrar_carrinho  BOOLEAN DEFAULT TRUE;

-- Atualiza registros existentes para garantir que possuam valores padrão
UPDATE empresas SET
  catalogo_template = 'moderno' WHERE catalogo_template IS NULL;

UPDATE empresas SET
  catalogo_fonte = 'Inter' WHERE catalogo_fonte IS NULL;

UPDATE empresas SET
  catalogo_mostrar_carrinho = TRUE WHERE catalogo_mostrar_carrinho IS NULL;
