-- ═══════════════════════════════════════════════════════════════
-- EMERGENCY_FIX_DESPESAS_DUPLICATAS.sql  (v4)
-- Execute no Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════

-- PASSO 1: Adicionar colunas faltantes se não existirem (idempotente)
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pendente';
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS numero_base INT;
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS numero_parcela INT;
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS total_parcelas INT;
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS identificador TEXT;
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES despesas(id) ON DELETE CASCADE;
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS forma_pagamento TEXT;
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS observacao TEXT;

-- PASSO 2: Limpar duplicadas com segurança (mantém a primeira ou a que estiver paga)
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY empresa_id, parent_id, EXTRACT(YEAR FROM data), EXTRACT(MONTH FROM data)
           ORDER BY status = 'pago' DESC, criado_em ASC, id ASC
         ) as rn
  FROM despesas
  WHERE parent_id IS NOT NULL
)
DELETE FROM despesas
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- PASSO 3: Criar o índice único usando funções 100% IMMUTABLE para evitar erros no PostgreSQL
DROP INDEX IF EXISTS idx_despesas_parent_mes;
CREATE UNIQUE INDEX idx_despesas_parent_mes
  ON despesas (empresa_id, parent_id, EXTRACT(YEAR FROM data), EXTRACT(MONTH FROM data))
  WHERE parent_id IS NOT NULL;

-- PASSO 4: Gerar identificadores sequenciais para registros sem numero_base
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
SELECT tipo, status, recorrente, COUNT(*) as total, ROUND(SUM(valor)::numeric, 2) as soma
FROM despesas
GROUP BY tipo, status, recorrente
ORDER BY tipo, status;
