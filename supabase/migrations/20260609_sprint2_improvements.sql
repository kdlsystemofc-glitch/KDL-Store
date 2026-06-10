-- ============================================================
-- SPRINT 2 — MELHORIAS DE ROBUSTEZ
-- Gerado em: 2026-06-09
-- ============================================================

-- ── 1. CRM: 3 categorias de inatividade ──────────────────────
ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS crm_dias_atencao INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS crm_dias_sumido  INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS crm_dias_perdido INTEGER NOT NULL DEFAULT 90;

-- Migração conservadora: popula a partir da coluna antiga se existir
UPDATE empresas
SET
  crm_dias_atencao = GREATEST(7,  COALESCE(crm_prazo_inatividade_dias, 30) / 2),
  crm_dias_sumido  = GREATEST(14, COALESCE(crm_prazo_inatividade_dias, 60)),
  crm_dias_perdido = GREATEST(21, COALESCE(crm_prazo_inatividade_dias, 60) * 3 / 2)
WHERE crm_prazo_inatividade_dias IS NOT NULL;

-- ── 2. Pedidos de Compra: tabela de itens ────────────────────
CREATE TABLE IF NOT EXISTS itens_pedido_fornecedor (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id       UUID NOT NULL REFERENCES pedidos_fornecedor(id) ON DELETE CASCADE,
  empresa_id      UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  produto_nome    TEXT NOT NULL,
  quantidade      NUMERIC(12, 4) NOT NULL DEFAULT 1,
  custo_unitario  NUMERIC(12, 4) NOT NULL DEFAULT 0,
  subtotal        NUMERIC(12, 4) GENERATED ALWAYS AS (quantidade * custo_unitario) STORED,
  produto_id      UUID REFERENCES produtos(id) ON DELETE SET NULL,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS para itens_pedido_fornecedor
ALTER TABLE itens_pedido_fornecedor ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "itens_pedido_empresa" ON itens_pedido_fornecedor;
CREATE POLICY "itens_pedido_empresa"
  ON itens_pedido_fornecedor
  FOR ALL
  USING (
    empresa_id IN (
      SELECT empresa_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ── 3. Estoque: custo_unitario em movimentacoes ───────────────
ALTER TABLE estoque_movimentacoes
  ADD COLUMN IF NOT EXISTS custo_unitario NUMERIC(12, 4),
  ADD COLUMN IF NOT EXISTS nota_fiscal    TEXT;

-- ── 4. Histórico de Pagamentos de Comissão ───────────────────
CREATE TABLE IF NOT EXISTS pagamentos_comissao (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id       UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  comissionado_id  UUID REFERENCES comissoes(id) ON DELETE SET NULL,
  comissionado_nome TEXT NOT NULL,
  forma_pagamento  TEXT NOT NULL DEFAULT 'Dinheiro',
  total_pago       NUMERIC(12, 4) NOT NULL DEFAULT 0,
  data_pagamento   DATE NOT NULL DEFAULT CURRENT_DATE,
  vendas_ids       UUID[] NOT NULL DEFAULT '{}',
  criado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS para pagamentos_comissao
ALTER TABLE pagamentos_comissao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pagamentos_comissao_empresa" ON pagamentos_comissao;
CREATE POLICY "pagamentos_comissao_empresa"
  ON pagamentos_comissao
  FOR ALL
  USING (
    empresa_id IN (
      SELECT empresa_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ── 5. Índices de performance ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_itens_pedido_pedido_id   ON itens_pedido_fornecedor(pedido_id);
CREATE INDEX IF NOT EXISTS idx_itens_pedido_empresa_id  ON itens_pedido_fornecedor(empresa_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_comissao_emp  ON pagamentos_comissao(empresa_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_comissao_com  ON pagamentos_comissao(comissionado_id);
