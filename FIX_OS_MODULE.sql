-- ═══════════════════════════════════════════════════════════════
-- FIX_OS_MODULE.sql
-- Execute no Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════

-- 1. Garante que a coluna status da ordens_servico seja do tipo TEXT (corrige o erro de enum status_os)
ALTER TABLE ordens_servico ALTER COLUMN status TYPE TEXT USING status::TEXT;
ALTER TABLE ordens_servico ALTER COLUMN status SET DEFAULT 'aguardando';

-- 2. Adiciona a coluna cliente_id para relacionar formalmente com a tabela de clientes
ALTER TABLE ordens_servico ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL;

-- 3. Garante que os valores antigos de status ('aberto', 'em_andamento') sejam convertidos para o novo padrão do frontend
UPDATE ordens_servico SET status = 'aguardando' WHERE status = 'aberto';
UPDATE ordens_servico SET status = 'em_servico' WHERE status = 'em_andamento';

-- 4. Cria índice para busca rápida de clientes vinculados
CREATE INDEX IF NOT EXISTS idx_os_cliente ON ordens_servico(cliente_id);

-- 5. Remove restrições NOT NULL incorretas ou obsoletas de colunas opcionais (evita falhas de inserção)
ALTER TABLE ordens_servico ALTER COLUMN produto_desc DROP NOT NULL;
ALTER TABLE ordens_servico ALTER COLUMN problema DROP NOT NULL;
ALTER TABLE ordens_servico ALTER COLUMN laudo DROP NOT NULL;
ALTER TABLE ordens_servico ALTER COLUMN observacoes DROP NOT NULL;
ALTER TABLE ordens_servico ALTER COLUMN tecnico DROP NOT NULL;
ALTER TABLE ordens_servico ALTER COLUMN orcamento DROP NOT NULL;
