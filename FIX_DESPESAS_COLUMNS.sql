-- ═══════════════════════════════════════════════════════════════════
-- SCRIPT DE DESPESAS: Status, Parcelamento e Recorrência Planejada
-- ═══════════════════════════════════════════════════════════════════

-- 1. Adicionar colunas necessárias na tabela de despesas
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pendente';
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS numero_base INT;
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS numero_parcela INT;
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS total_parcelas INT;
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS identificador TEXT;
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES despesas(id) ON DELETE CASCADE;

-- 2. Atualizar as despesas legadas para status 'pago' e gerar número base retrospectivo
UPDATE despesas SET status = 'pago' WHERE status = 'pendente';

DO $$
DECLARE
  r RECORD;
  i INT := 1;
BEGIN
  FOR r IN SELECT id FROM despesas WHERE numero_base IS NULL ORDER BY data, criado_em LOOP
    UPDATE despesas 
    SET numero_base = i, identificador = i::text 
    WHERE id = r.id;
    i := i + 1;
  END LOOP;
END $$;
