-- ═══════════════════════════════════════════════════════
-- SCRIPT DE MIGRAÇÃO COMPLETO: Catálogo & Storage Bucket (V4)
-- Execute em: Supabase > SQL Editor > Run
-- ═══════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- 1. CRIAÇÃO E CONFIGURAÇÃO DO BUCKET DE STORAGE
-- ─────────────────────────────────────────────

-- Garante que o bucket 'produtos' exista usando a função oficial do Supabase
-- Se o bucket já existir, a função não gerará erro
SELECT storage.create_bucket('produtos', 'produtos', true);

-- Habilita políticas de leitura pública para o bucket 'produtos'
DROP POLICY IF EXISTS "Leitura Pública de Imagens" ON storage.objects;
CREATE POLICY "Leitura Pública de Imagens"
ON storage.objects FOR SELECT
USING (bucket_id = 'produtos');

-- Habilita políticas de upload para o bucket 'produtos'
DROP POLICY IF EXISTS "Upload de Imagens" ON storage.objects;
CREATE POLICY "Upload de Imagens"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'produtos');

-- Habilita políticas de atualização/exclusão
DROP POLICY IF EXISTS "Atualização de Imagens" ON storage.objects;
CREATE POLICY "Atualização de Imagens"
ON storage.objects FOR UPDATE
USING (bucket_id = 'produtos');

DROP POLICY IF EXISTS "Exclusão de Imagens" ON storage.objects;
CREATE POLICY "Exclusão de Imagens"
ON storage.objects FOR DELETE
USING (bucket_id = 'produtos');


-- ─────────────────────────────────────────────
-- 2. ALTERAÇÕES DE TABELA DO BANCO DE DADOS
-- ─────────────────────────────────────────────

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
