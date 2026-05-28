-- ═══════════════════════════════════════════════════════════════════
-- SCRIPT DEFINITIVO — EXECUTAR UMA VEZ NO SUPABASE SQL EDITOR
-- Adiciona todas as colunas do catálogo e cria o bucket de logos
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- PARTE 1: Colunas do catálogo na tabela "empresas"
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS catalogo_cor_primaria      TEXT DEFAULT '#6C63FF',
  ADD COLUMN IF NOT EXISTS catalogo_cor_secundaria    TEXT DEFAULT '#00BFA5',
  ADD COLUMN IF NOT EXISTS catalogo_descricao         TEXT,
  ADD COLUMN IF NOT EXISTS catalogo_template          TEXT DEFAULT 'moderno',
  ADD COLUMN IF NOT EXISTS catalogo_fonte             TEXT DEFAULT 'Inter',
  ADD COLUMN IF NOT EXISTS catalogo_logo_url          TEXT,
  ADD COLUMN IF NOT EXISTS catalogo_mostrar_carrinho  BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS catalogo_formas_envio      TEXT;

-- Garante valores padrão para registros já existentes
UPDATE empresas SET catalogo_cor_primaria     = '#6C63FF'  WHERE catalogo_cor_primaria IS NULL;
UPDATE empresas SET catalogo_cor_secundaria   = '#00BFA5'  WHERE catalogo_cor_secundaria IS NULL;
UPDATE empresas SET catalogo_template         = 'moderno'  WHERE catalogo_template IS NULL;
UPDATE empresas SET catalogo_fonte            = 'Inter'    WHERE catalogo_fonte IS NULL;
UPDATE empresas SET catalogo_mostrar_carrinho = TRUE       WHERE catalogo_mostrar_carrinho IS NULL;

-- ─────────────────────────────────────────────────────────────────
-- PARTE 2: Coluna "ativo_catalogo" em produtos (se não existir)
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE produtos
  ADD COLUMN IF NOT EXISTS ativo_catalogo  BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS destaque        BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS preco_catalogo  TEXT    DEFAULT 'varejo';

-- ─────────────────────────────────────────────────────────────────
-- PARTE 3: Bucket de logos no Supabase Storage
-- ─────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Política de leitura pública para logos
DROP POLICY IF EXISTS "Logos - Leitura Pública" ON storage.objects;
CREATE POLICY "Logos - Leitura Pública"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos');

-- Política de upload de logos (apenas usuários autenticados)
DROP POLICY IF EXISTS "Logos - Upload Autenticado" ON storage.objects;
CREATE POLICY "Logos - Upload Autenticado"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');

-- Política de atualização de logos
DROP POLICY IF EXISTS "Logos - Atualização" ON storage.objects;
CREATE POLICY "Logos - Atualização"
ON storage.objects FOR UPDATE
USING (bucket_id = 'logos' AND auth.role() = 'authenticated');

-- Política de exclusão de logos
DROP POLICY IF EXISTS "Logos - Exclusão" ON storage.objects;
CREATE POLICY "Logos - Exclusão"
ON storage.objects FOR DELETE
USING (bucket_id = 'logos' AND auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────────────
-- PARTE 4: Bucket de produtos no Supabase Storage
-- ─────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('produtos', 'produtos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Produtos - Leitura Pública" ON storage.objects;
CREATE POLICY "Produtos - Leitura Pública"
ON storage.objects FOR SELECT
USING (bucket_id = 'produtos');

DROP POLICY IF EXISTS "Produtos - Upload" ON storage.objects;
CREATE POLICY "Produtos - Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'produtos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Produtos - Atualização" ON storage.objects;
CREATE POLICY "Produtos - Atualização"
ON storage.objects FOR UPDATE
USING (bucket_id = 'produtos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Produtos - Exclusão" ON storage.objects;
CREATE POLICY "Produtos - Exclusão"
ON storage.objects FOR DELETE
USING (bucket_id = 'produtos' AND auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────────────
-- VERIFICAÇÃO FINAL — Deve mostrar as colunas adicionadas
-- ─────────────────────────────────────────────────────────────────

SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'empresas'
  AND column_name LIKE 'catalogo_%'
ORDER BY column_name;
