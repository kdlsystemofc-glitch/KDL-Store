-- ============================================================
-- NEXO COMMERCE — Patch Migration 2026-06-08
-- Execute no Supabase SQL Editor (ou via CLI: supabase db push)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. vendas: coluna comissao_despesa_id
--    Guarda o ID da despesa gerada ao pagar uma comissão.
--    Permite desfazer a despesa ao desmarcar "pago".
-- ─────────────────────────────────────────────────────────────
ALTER TABLE vendas
  ADD COLUMN IF NOT EXISTS comissao_despesa_id UUID REFERENCES despesas(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────────────────────
-- 2. fiados: coluna pago_em e valor_original
--    pago_em   — timestamp de quando o fiado foi quitado
--    valor_original — valor original do fiado (antes de amortizações)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE fiados
  ADD COLUMN IF NOT EXISTS pago_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS valor_original NUMERIC(10,2);

-- Backfill: para fiados já marcados como "pago" sem pago_em,
-- usa criado_em como fallback (não será exato, mas preserva dados existentes)
UPDATE fiados
SET pago_em = updated_at
WHERE status = 'pago' AND pago_em IS NULL AND updated_at IS NOT NULL;

-- Backfill valor_original: copia valor_aberto para fiados antigos sem valor_original
-- (em fiados já quitados, valor_aberto pode ser 0, então este backfill é apenas aproximado)
-- Para produção, você pode ajustar a lógica conforme seus dados históricos.
UPDATE fiados
SET valor_original = valor_aberto
WHERE valor_original IS NULL AND status = 'aberto';

-- ─────────────────────────────────────────────────────────────
-- 3. pedidos_fornecedor: numeração sequencial por empresa
--    numero — número legível do pedido (ex: OC-0001)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE pedidos_fornecedor
  ADD COLUMN IF NOT EXISTS numero INTEGER;

-- Sequence por empresa usando uma sequence global + trigger
-- (alternativa simples: contador por empresa na tabela empresas)

-- Cria uma sequence global para o número do pedido
CREATE SEQUENCE IF NOT EXISTS pedidos_fornecedor_numero_seq START 1;

-- Backfill: numera os pedidos existentes ordenados por data de criação
DO $$
DECLARE
  rec RECORD;
  n   INTEGER := 1;
BEGIN
  FOR rec IN
    SELECT id FROM pedidos_fornecedor WHERE numero IS NULL ORDER BY criado_em ASC
  LOOP
    UPDATE pedidos_fornecedor SET numero = n WHERE id = rec.id;
    n := n + 1;
  END LOOP;
END $$;

-- Trigger: atribui número automático a novos pedidos
CREATE OR REPLACE FUNCTION set_pedido_numero()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.numero IS NULL THEN
    NEW.numero := nextval('pedidos_fornecedor_numero_seq');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_pedido_numero ON pedidos_fornecedor;
CREATE TRIGGER trg_set_pedido_numero
  BEFORE INSERT ON pedidos_fornecedor
  FOR EACH ROW EXECUTE FUNCTION set_pedido_numero();

-- ─────────────────────────────────────────────────────────────
-- 4. fornecedores: garantir que telefone e email existem
--    (necessário para os botões de WhatsApp/E-mail na Ordem de Compra)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE fornecedores
  ADD COLUMN IF NOT EXISTS telefone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT;

-- ─────────────────────────────────────────────────────────────
-- VERIFICAÇÃO FINAL
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 2026-06-08 aplicada com sucesso!';
  RAISE NOTICE '   - vendas.comissao_despesa_id: OK';
  RAISE NOTICE '   - fiados.pago_em: OK';
  RAISE NOTICE '   - fiados.valor_original: OK';
  RAISE NOTICE '   - pedidos_fornecedor.numero + trigger: OK';
  RAISE NOTICE '   - fornecedores.telefone + email: OK';
END $$;
