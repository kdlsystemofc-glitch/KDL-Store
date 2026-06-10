-- Migration: Sistema de Notificações Internas
-- Sprint 3 / Grupo 3

CREATE TABLE IF NOT EXISTS notificacoes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    uuid NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  tipo          text NOT NULL CHECK (tipo IN (
                  'estoque_critico', 'garantia_expirando', 'fiado_vencido',
                  'os_vencida', 'pedido_aguardando_entrada', 'geral'
                )),
  titulo        text NOT NULL,
  descricao     text,
  link          text,
  lida          boolean NOT NULL DEFAULT false,
  criado_em     timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_notificacoes_empresa   ON notificacoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_nao_lidas ON notificacoes(empresa_id, lida) WHERE lida = false;

-- RLS
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notificacoes: leitura por empresa" ON notificacoes
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "notificacoes: insert por empresa" ON notificacoes
  FOR INSERT WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "notificacoes: update por empresa" ON notificacoes
  FOR UPDATE USING (
    empresa_id IN (
      SELECT empresa_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "notificacoes: delete por empresa" ON notificacoes
  FOR DELETE USING (
    empresa_id IN (
      SELECT empresa_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Limpar notificações lidas com mais de 30 dias (opcional, via pg_cron ou trigger)
-- CREATE OR REPLACE FUNCTION cleanup_old_notifications() RETURNS void AS $$
--   DELETE FROM notificacoes WHERE lida = true AND criado_em < now() - interval '30 days';
-- $$ LANGUAGE sql;
