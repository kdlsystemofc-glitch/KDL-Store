-- ============================================================
-- NEXO COMMERCE — Correção da Sequência de Vendas
-- Migration: 20260608_fix_venda_sequence.sql
-- ============================================================

-- 1. Remove o default SERIAL (nextval) da coluna numero na tabela vendas
ALTER TABLE public.vendas ALTER COLUMN numero DROP DEFAULT;

-- 2. Cria a função de numeração sequencial por empresa com advisory lock
CREATE OR REPLACE FUNCTION public.fn_next_venda_numero(p_empresa_id UUID)
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
  v_next INTEGER;
BEGIN
  -- Bloqueio baseado no hash do ID da empresa para evitar concorrência no mesmo instante
  PERFORM pg_advisory_xact_lock(hashtext(p_empresa_id::text));
  
  -- Obtém o maior número de venda daquela empresa
  SELECT COALESCE(MAX(numero), 0) + 1 INTO v_next 
  FROM public.vendas 
  WHERE empresa_id = p_empresa_id;
  
  RETURN v_next;
END; $$;

-- 3. Cria a função do trigger BEFORE INSERT
CREATE OR REPLACE FUNCTION public.set_venda_numero()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Se o número for nulo ou 0, gera o próximo número para a empresa
  IF NEW.numero IS NULL OR NEW.numero = 0 THEN
    NEW.numero := public.fn_next_venda_numero(NEW.empresa_id);
  END IF;
  RETURN NEW;
END; $$;

-- 4. Cria o trigger BEFORE INSERT na tabela vendas
DROP TRIGGER IF EXISTS trg_set_venda_numero ON public.vendas;
CREATE TRIGGER trg_set_venda_numero
  BEFORE INSERT ON public.vendas
  FOR EACH ROW EXECUTE FUNCTION public.set_venda_numero();
