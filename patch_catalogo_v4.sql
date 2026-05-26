-- ═══════════════════════════════════════════════════════
-- SCRIPT DE MIGRAÇÃO: Formas de Envio Customizadas (V4)
-- Execute em: Supabase > SQL Editor > Run
-- ═══════════════════════════════════════════════════════

-- Adiciona a coluna 'catalogo_formas_envio' para customização de opções de entrega no carrinho
ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS catalogo_formas_envio TEXT;
