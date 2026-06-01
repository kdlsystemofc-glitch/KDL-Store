-- ═══════════════════════════════════════════════════════════════
-- EMERGENCY_FIX_DESPESAS_DUPLICATAS.sql  (v2 — corrigido)
-- Execute no Supabase → SQL Editor → Run
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
-- (As instâncias serão recriadas corretamente ao abrir o módulo de despesas)
DELETE FROM despesas WHERE parent_id IS NOT NULL;

-- PASSO 3: Adiciona índice único para impedir duplicatas no futuro
-- Usa DATE_TRUNC porque a coluna 'data' é do tipo DATE (não TEXT)
DROP INDEX IF EXISTS idx_despesas_parent_mes;
CREATE UNIQUE INDEX idx_despesas_parent_mes
  ON despesas (empresa_id, parent_id, DATE_TRUNC('month', data))
  WHERE parent_id IS NOT NULL;

-- PASSO 4: Gera identificadores sequenciais para registros sem numero_base
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

-- Verificação final
SELECT tipo, recorrente, COUNT(*) as total, SUM(valor) as soma
FROM despesas
GROUP BY tipo, recorrente
ORDER BY tipo;
