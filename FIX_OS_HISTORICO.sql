-- ═══════════════════════════════════════════════════════════════
-- FIX_OS_HISTORICO.sql
-- Execute no Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════

-- 1. Adiciona a coluna de histórico na tabela de ordens de serviço
ALTER TABLE ordens_servico ADD COLUMN IF NOT EXISTS historico JSONB DEFAULT '[]'::jsonb;

-- 2. Habilita acesso de leitura pública (anônimo) para a página de acompanhamento
-- Isso permite carregar os dados de uma OS sabendo apenas o seu ID UUID (que não é adivinhável)
DROP POLICY IF EXISTS "os_leitura_anonima" ON ordens_servico;
CREATE POLICY "os_leitura_anonima" ON ordens_servico
  FOR SELECT TO anon
  USING (TRUE);
