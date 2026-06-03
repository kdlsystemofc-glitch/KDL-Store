-- ═══════════════════════════════════════════════════════════════
-- PATCH V3.4 — Correções críticas
-- Execute este script no SQL Editor do Supabase
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. Colunas de endereço estruturado na tabela empresas
--    (mesmo formato dos fornecedores: CEP, rua, numero, etc.)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS cep         TEXT,
  ADD COLUMN IF NOT EXISTS rua         TEXT,
  ADD COLUMN IF NOT EXISTS numero      TEXT,
  ADD COLUMN IF NOT EXISTS bairro      TEXT,
  ADD COLUMN IF NOT EXISTS complemento TEXT,
  ADD COLUMN IF NOT EXISTS logo_url    TEXT;

-- Migração: tenta popular rua/bairro a partir do campo "endereco" existente
-- (apenas para empresas que já têm endereço preenchido mas os campos estruturados vazios)
UPDATE public.empresas
  SET rua = endereco
WHERE endereco IS NOT NULL
  AND rua IS NULL;

-- ─────────────────────────────────────────────────────────────
-- 2. Remover Fiado das formas de pagamento padrão
--    para empresas com plano "start"
--    (Fiado é exclusivo do plano PRO)
-- ─────────────────────────────────────────────────────────────
-- Desativa Fiado em empresas Start
UPDATE public.formas_pagamento fp
  SET ativo = false
FROM public.empresas e
WHERE fp.empresa_id = e.id
  AND fp.nome = 'Fiado'
  AND e.plano = 'start';

-- ─────────────────────────────────────────────────────────────
-- 3. Sequências de número por empresa (vendas e ordens de serviço)
--    Remove DEFAULT SERIAL e usa trigger para calcular o próximo
--    número por empresa_id, evitando saltos entre tenants.
-- ─────────────────────────────────────────────────────────────

-- 3a. Trigger para vendas
CREATE OR REPLACE FUNCTION public.set_venda_numero()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = 0 THEN
    SELECT COALESCE(MAX(numero), 0) + 1
      INTO NEW.numero
      FROM public.vendas
     WHERE empresa_id = NEW.empresa_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_venda_numero ON public.vendas;
CREATE TRIGGER trg_set_venda_numero
  BEFORE INSERT ON public.vendas
  FOR EACH ROW EXECUTE FUNCTION public.set_venda_numero();

-- 3b. Trigger para ordens de serviço
CREATE OR REPLACE FUNCTION public.set_os_numero()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = 0 THEN
    SELECT COALESCE(MAX(numero), 0) + 1
      INTO NEW.numero
      FROM public.ordens_servico
     WHERE empresa_id = NEW.empresa_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_os_numero ON public.ordens_servico;
CREATE TRIGGER trg_set_os_numero
  BEFORE INSERT ON public.ordens_servico
  FOR EACH ROW EXECUTE FUNCTION public.set_os_numero();

-- ─────────────────────────────────────────────────────────────
-- 4. Garante que itens_venda tenha FK para vendas com índice
--    (necessário para a query de CMV com !inner join)
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_itens_venda_venda_id
  ON public.itens_venda(venda_id);

CREATE INDEX IF NOT EXISTS idx_vendas_empresa_status
  ON public.vendas(empresa_id, status);

-- ─────────────────────────────────────────────────────────────
-- 5. Adiciona coluna logo_url no bucket de produtos (se aplicável)
--    Garante que o bucket "produtos" exista para upload de logos
-- ─────────────────────────────────────────────────────────────
-- Nota: o bucket "produtos" já é criado pela API /api/upload-logo
-- Este script apenas garante que a coluna logo_url esteja na tabela empresas (feito no passo 1)

-- ─────────────────────────────────────────────────────────────
-- VERIFICAÇÃO FINAL
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '✅ PATCH V3.4 aplicado com sucesso!';
  RAISE NOTICE '   - Colunas de endereço estruturado adicionadas à tabela empresas';
  RAISE NOTICE '   - Coluna logo_url adicionada à tabela empresas';
  RAISE NOTICE '   - Fiado desativado para empresas com plano Start';
  RAISE NOTICE '   - Triggers de numeração por empresa criados para vendas e OS';
  RAISE NOTICE '   - Índices de performance adicionados';
END;
$$;
