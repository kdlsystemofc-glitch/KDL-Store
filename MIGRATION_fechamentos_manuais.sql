-- =============================================================
-- MIGRATION: Tabela fechamentos_manuais
-- Usada para registrar entradas/saídas avulsas no fechamento de
-- caixa (ex: recebimentos de fiado, ajustes manuais).
-- =============================================================

CREATE TABLE IF NOT EXISTS fechamentos_manuais (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  data            DATE NOT NULL DEFAULT CURRENT_DATE,
  descricao       TEXT NOT NULL,
  tipo            TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  valor           NUMERIC(10, 2) NOT NULL CHECK (valor > 0),
  forma_pagamento TEXT DEFAULT 'Dinheiro',
  criado_em       TIMESTAMPTZ DEFAULT now()
);

-- Índice para consultas por empresa e data
CREATE INDEX IF NOT EXISTS idx_fechamentos_manuais_empresa_data
  ON fechamentos_manuais (empresa_id, data);

-- RLS
ALTER TABLE fechamentos_manuais ENABLE ROW LEVEL SECURITY;

-- Política: apenas usuários autenticados da própria empresa podem ver/inserir
CREATE POLICY "fechamentos_manuais_empresa_policy"
  ON fechamentos_manuais
  USING (
    empresa_id IN (
      SELECT empresa_id FROM profiles WHERE id = auth.uid()
    )
  );
