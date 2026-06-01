-- ═══════════════════════════════════════════════════════════════════
-- FIX_DESPESAS_V2 — Adiciona forma_pagamento e observacao
-- Execute no Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

-- Colunas da fase 1 (garante idempotência)
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pendente';
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS numero_base INT;
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS numero_parcela INT;
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS total_parcelas INT;
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS identificador TEXT;
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES despesas(id) ON DELETE CASCADE;

-- Novas colunas desta fase
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS forma_pagamento TEXT;
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS observacao TEXT;

-- Gera identificadores para despesas que ainda não têm
DO $$
DECLARE
  r RECORD;
  i INT;
BEGIN
  SELECT COALESCE(MAX(numero_base), 0) + 1 INTO i FROM despesas;
  FOR r IN SELECT id FROM despesas WHERE numero_base IS NULL ORDER BY data, criado_em LOOP
    UPDATE despesas SET numero_base = i, identificador = i::text WHERE id = r.id;
    i := i + 1;
  END LOOP;
END $$;
