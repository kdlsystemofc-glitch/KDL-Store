-- ═══════════════════════════════════════════════════════════════
-- EMERGENCY_FIX_DESPESAS_DUPLICATAS.sql
-- Execute IMEDIATAMENTE no Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════

-- PASSO 1: Garante que todas as colunas necessárias existem
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pendente';
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS numero_base INT;
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS numero_parcela INT;
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS total_parcelas INT;
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS identificador TEXT;
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES despesas(id) ON DELETE CASCADE;
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS forma_pagamento TEXT;
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS observacao TEXT;

-- PASSO 2: Remove TODAS as instâncias auto-geradas (parent_id não nulo)
-- mantendo apenas o registro original (recorrente = true)
DELETE FROM despesas WHERE parent_id IS NOT NULL;

-- PASSO 3: Adiciona índice único para impedir duplicatas no futuro
-- (apenas 1 instância filha por parent por mês)
DROP INDEX IF EXISTS idx_despesas_parent_mes;
CREATE UNIQUE INDEX idx_despesas_parent_mes
  ON despesas (empresa_id, parent_id, LEFT(data, 7))
  WHERE parent_id IS NOT NULL;

-- PASSO 4: Gera identificadores para registros sem numero_base
DO $$
DECLARE
  r RECORD;
  i INT;
BEGIN
  SELECT COALESCE(MAX(numero_base), 0) + 1 INTO i FROM despesas;
  FOR r IN SELECT id FROM despesas WHERE numero_base IS NULL ORDER BY data LOOP
    UPDATE despesas SET numero_base = i, identificador = i::text WHERE id = r.id;
    i := i + 1;
  END LOOP;
END $$;

-- Verificação final: quantas despesas existem por tipo
SELECT tipo, recorrente, COUNT(*) as total, SUM(valor) as soma
FROM despesas
GROUP BY tipo, recorrente
ORDER BY tipo;
