-- =============================================================
-- KDL STORE — SQL COMPLETO E DEFINITIVO
-- Supabase PostgreSQL
-- Executar inteiramente em: Supabase > SQL Editor > Run
-- =============================================================

-- ─────────────────────────────────────────────
-- EXTENSÕES
-- ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE papel_usuario   AS ENUM ('admin', 'operador', 'visualizador');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE status_usuario  AS ENUM ('ativo', 'congelado', 'excluido');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE status_plano    AS ENUM ('active', 'inactive', 'cancelled', 'trialing', 'past_due');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Garante que bancos existentes também tenham o valor 'past_due'
DO $$ BEGIN
  ALTER TYPE status_plano ADD VALUE IF NOT EXISTS 'past_due';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tipo_plano      AS ENUM ('start', 'pro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE status_venda    AS ENUM ('concluida', 'cancelada', 'pendente');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE status_fiado    AS ENUM ('aberto', 'pago');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tipo_movimentacao AS ENUM ('entrada', 'saida', 'ajuste', 'brinde', 'devolucao');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE status_os       AS ENUM ('aberto', 'em_andamento', 'concluido', 'cancelado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE status_garantia AS ENUM ('ativa', 'em_analise', 'em_devolucao', 'finalizada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE status_pedido   AS ENUM ('rascunho', 'enviado', 'recebido', 'cancelado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE status_convite  AS ENUM ('pendente', 'aceito', 'cancelado', 'expirado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────
-- TABELA: empresas
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS empresas (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome                        TEXT NOT NULL,
  cnpj                        TEXT,
  email                       TEXT,
  telefone                    TEXT,
  whatsapp                    TEXT,
  instagram                   TEXT,
  endereco                    TEXT,
  cidade                      TEXT,
  estado                      TEXT,
  slug                        TEXT UNIQUE,
  plano                       tipo_plano NOT NULL DEFAULT 'start',
  crm_prazo_inatividade_dias  INT NOT NULL DEFAULT 60,
  catalogo_cor_primaria       TEXT DEFAULT '#6C63FF',
  catalogo_cor_secundaria     TEXT DEFAULT '#00BFA5',
  catalogo_descricao          TEXT,
  catalogo_template           TEXT DEFAULT 'moderno',
  catalogo_fonte              TEXT DEFAULT 'Inter',
  catalogo_logo_url           TEXT,
  catalogo_mostrar_carrinho   BOOLEAN DEFAULT TRUE,
  catalogo_formas_envio       TEXT,
  criado_em                   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TABELA: profiles (extende auth.users)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id  UUID REFERENCES empresas(id) ON DELETE SET NULL,
  nome        TEXT,
  papel       papel_usuario  NOT NULL DEFAULT 'admin',
  status      status_usuario NOT NULL DEFAULT 'ativo',
  criado_em   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TABELA: subscriptions
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id          UUID NOT NULL UNIQUE REFERENCES empresas(id) ON DELETE CASCADE,
  plano               tipo_plano   NOT NULL DEFAULT 'start',
  status              status_plano NOT NULL DEFAULT 'active',
  preco               INT          NOT NULL DEFAULT 6500, -- centavos (6500 = R$65)
  inicio              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  proximo_pagamento   TIMESTAMPTZ,
  stripe_customer_id  TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id     TEXT,
  cancel_at_period_end BOOLEAN DEFAULT false,
  current_period_end  TIMESTAMPTZ,
  criado_em           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  atualizado_em       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sub_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_sub_stripe_sub ON subscriptions(stripe_subscription_id);

-- ─────────────────────────────────────────────
-- TABELA: convites (convidar usuários para a empresa)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS convites (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id   UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  nome         TEXT,
  papel        papel_usuario  NOT NULL DEFAULT 'operador',
  status       status_convite NOT NULL DEFAULT 'pendente',
  token        TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  auth_user_id UUID,           -- ID do usuário criado no Supabase Auth via inviteUserByEmail
  expira_em    TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Adiciona coluna em tabelas já existentes (idempotente)
ALTER TABLE convites ADD COLUMN IF NOT EXISTS auth_user_id UUID;

-- ─────────────────────────────────────────────
-- TABELA: categorias_produto
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categorias_produto (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id  UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  cor         TEXT DEFAULT '#4A1D6B',
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TABELA: produtos
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS produtos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id      UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  sku             TEXT,
  ean             TEXT,
  categoria       TEXT,
  descricao       TEXT,
  preco_custo     NUMERIC(12,2) NOT NULL DEFAULT 0,
  preco_varejo    NUMERIC(12,2) NOT NULL DEFAULT 0,
  preco_atacado   NUMERIC(12,2),
  preco_vip       NUMERIC(12,2),
  preco_catalogo  TEXT,                        -- 'varejo' | 'atacado' | 'vip' | 'ocultar'
  qtd_atual       NUMERIC(12,3) NOT NULL DEFAULT 0,
  qtd_minima      NUMERIC(12,3) NOT NULL DEFAULT 0,
  qtd_maxima      NUMERIC(12,3),
  qtd_min_atacado NUMERIC(12,3),
  localizacao     TEXT,
  pode_ser_brinde BOOLEAN NOT NULL DEFAULT FALSE,
  tem_serie       BOOLEAN NOT NULL DEFAULT FALSE,
  tem_garantia    BOOLEAN NOT NULL DEFAULT FALSE,
  dias_garantia   INT,
  texto_garantia  TEXT,
  codigo_barras   TEXT,
  preco_minimo    NUMERIC(12,2),
  ativo           BOOLEAN NOT NULL DEFAULT TRUE,
  ativo_catalogo  BOOLEAN NOT NULL DEFAULT FALSE,
  destaque        BOOLEAN NOT NULL DEFAULT FALSE,
  obs             TEXT,
  imagem_url      TEXT,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TABELA: estoque_movimentacoes
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS estoque_movimentacoes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id  UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  produto_id  UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  tipo        tipo_movimentacao NOT NULL,
  quantidade  NUMERIC(12,3) NOT NULL,
  obs         TEXT,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TABELA: clientes
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clientes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id      UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  telefone        TEXT,
  email           TEXT,
  cpf             TEXT,
  endereco        TEXT,
  anotacoes       TEXT,
  obs             TEXT,
  tipo            TEXT NOT NULL DEFAULT 'varejo', -- 'varejo' | 'atacado' | 'vip'
  ultima_compra   DATE,
  ativo           BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TABELA: formas_pagamento
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS formas_pagamento (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id  UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  taxa        NUMERIC(5,2) NOT NULL DEFAULT 0, -- taxa em %
  ativo       BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TABELA: comissoes (comissionados/puxadores)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comissoes (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id     UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome           TEXT NOT NULL,
  telefone       TEXT,
  tipo_comissao  TEXT NOT NULL DEFAULT 'percentual', -- 'percentual' | 'fixo'
  taxa           NUMERIC(10,2) NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'ativo',      -- 'ativo' | 'inativo'
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TABELA: vendas
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendas (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  numero                  SERIAL,
  cliente_id              UUID REFERENCES clientes(id) ON DELETE SET NULL,
  cliente_nome            TEXT,
  forma_pagamento         TEXT NOT NULL,
  total                   NUMERIC(12,2) NOT NULL DEFAULT 0,
  desconto                NUMERIC(12,2) NOT NULL DEFAULT 0,
  status                  status_venda NOT NULL DEFAULT 'concluida',
  motivo_cancelamento     TEXT,
  comissionado_id         UUID REFERENCES comissoes(id) ON DELETE SET NULL,
  comissionado_nome       TEXT,
  registrado_nome         TEXT,
  obs                     TEXT,
  -- feedback "Como foi?"
  como_foi_nota           INT,
  como_foi_resposta       TEXT,
  como_foi_respondido_em  TIMESTAMPTZ,
  criado_em               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TABELA: itens_venda
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS itens_venda (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id      UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  venda_id        UUID NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
  produto_id      UUID REFERENCES produtos(id) ON DELETE SET NULL,
  produto_nome    TEXT NOT NULL,
  quantidade      NUMERIC(12,3) NOT NULL,
  preco_unitario  NUMERIC(12,2) NOT NULL,
  brinde          BOOLEAN NOT NULL DEFAULT FALSE,
  num_serie       TEXT,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TABELA: fiados
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fiados (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id    UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  cliente_id    UUID REFERENCES clientes(id) ON DELETE SET NULL,
  cliente_nome  TEXT NOT NULL,
  cliente_tel   TEXT,
  valor_aberto  NUMERIC(12,2) NOT NULL DEFAULT 0,
  data_vencimento DATE,
  status        status_fiado NOT NULL DEFAULT 'aberto',
  pago_em       TIMESTAMPTZ,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TABELA: despesas
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS despesas (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id  UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  descricao   TEXT NOT NULL,
  categoria   TEXT,
  tipo        TEXT,
  valor       NUMERIC(12,2) NOT NULL DEFAULT 0,
  data        DATE NOT NULL DEFAULT CURRENT_DATE,
  recorrente  BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TABELA: fornecedores
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fornecedores (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id      UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  contato         TEXT,
  telefone        TEXT,
  email           TEXT,
  cnpj            TEXT,
  categoria       TEXT,
  cidade          TEXT,
  estado          TEXT,
  prazo_entrega   TEXT,
  pedido_minimo   NUMERIC(12,2),
  anotacoes       TEXT,
  endereco        TEXT,
  obs             TEXT,
  ativo           BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TABELA: pedidos_fornecedor
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pedidos_fornecedor (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id      UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  fornecedor_id   UUID REFERENCES fornecedores(id) ON DELETE SET NULL,
  fornecedor_nome TEXT,
  venda_id        UUID REFERENCES public.vendas(id) ON DELETE SET NULL,
  produto         TEXT NOT NULL DEFAULT '',
  quantidade      NUMERIC(12,3) NOT NULL DEFAULT 1,
  status          TEXT NOT NULL DEFAULT 'aguardando', -- 'aguardando' | 'confirmado' | 'entregue'
  total           NUMERIC(12,2) NOT NULL DEFAULT 0,
  obs             TEXT,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TABELA: garantias
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS garantias (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id      UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  venda_id        UUID REFERENCES vendas(id) ON DELETE SET NULL,
  produto_id      UUID REFERENCES produtos(id) ON DELETE SET NULL,
  cliente_nome    TEXT,
  cliente_tel     TEXT,
  produto_nome    TEXT NOT NULL,
  num_serie       TEXT,
  status          TEXT NOT NULL DEFAULT 'ativa', -- 'ativa' | 'vencida' | 'em devolução'
  data_compra     DATE NOT NULL DEFAULT CURRENT_DATE,
  data_inicio     DATE NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento DATE NOT NULL,
  data_fim        DATE NOT NULL DEFAULT CURRENT_DATE,
  texto_garantia  TEXT,
  obs             TEXT,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TABELA: devolucoes
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS devolucoes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id   UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  garantia_id  UUID REFERENCES garantias(id) ON DELETE SET NULL,
  venda_id     UUID REFERENCES vendas(id) ON DELETE SET NULL,
  motivo       TEXT,
  resolucao    TEXT,
  valor        NUMERIC(12,2) NOT NULL DEFAULT 0,
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TABELA: ordens_servico
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ordens_servico (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id      UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  numero          SERIAL,
  venda_id        UUID REFERENCES public.vendas(id) ON DELETE SET NULL,
  cliente_nome    TEXT NOT NULL,
  cliente_tel     TEXT,
  equipamento     TEXT NOT NULL DEFAULT '',
  produto_desc    TEXT,
  defeito_relatado TEXT NOT NULL DEFAULT '',
  problema        TEXT,
  laudo           TEXT,
  observacoes     TEXT,
  status          TEXT NOT NULL DEFAULT 'aguardando',
  orcamento       NUMERIC(12,2),
  valor_servico   NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_pecas     NUMERIC(12,2) NOT NULL DEFAULT 0,
  tecnico         TEXT,
  previsao        DATE,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- ÍNDICES
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_empresa      ON profiles(empresa_id);
CREATE INDEX IF NOT EXISTS idx_produtos_empresa      ON produtos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_vendas_empresa        ON vendas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_vendas_criado         ON vendas(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_vendas_cliente        ON vendas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_itens_venda           ON itens_venda(venda_id);
CREATE INDEX IF NOT EXISTS idx_clientes_empresa      ON clientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_fiados_empresa        ON fiados(empresa_id);
CREATE INDEX IF NOT EXISTS idx_fiados_cliente        ON fiados(cliente_id);
CREATE INDEX IF NOT EXISTS idx_despesas_empresa      ON despesas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_despesas_data         ON despesas(data DESC);
CREATE INDEX IF NOT EXISTS idx_comissoes_empresa     ON comissoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_garantias_empresa     ON garantias(empresa_id);
CREATE INDEX IF NOT EXISTS idx_os_empresa            ON ordens_servico(empresa_id);
CREATE INDEX IF NOT EXISTS idx_estoque_produto       ON estoque_movimentacoes(produto_id);
CREATE INDEX IF NOT EXISTS idx_estoque_empresa       ON estoque_movimentacoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_empresa ON subscriptions(empresa_id);
CREATE INDEX IF NOT EXISTS idx_convites_empresa      ON convites(empresa_id);
CREATE INDEX IF NOT EXISTS idx_convites_token        ON convites(token);

-- =============================================================
-- TRIGGER: criar profile ao registrar novo usuário no auth
-- =============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_empresa_id  UUID;
  v_nome        TEXT;
  v_invite_tok  TEXT;
  v_convite     RECORD;
BEGIN
  -- Verifica se veio token de convite nos metadados
  v_invite_tok := NEW.raw_user_meta_data->>'invite_token';
  v_nome       := COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1));

  IF v_invite_tok IS NOT NULL THEN
    -- Fluxo: usuário convidado — associa à empresa do convite
    SELECT * INTO v_convite
    FROM public.convites
    WHERE token = v_invite_tok
      AND status = 'pendente'
      AND expira_em > NOW();

    IF FOUND THEN
      v_empresa_id := v_convite.empresa_id;

      INSERT INTO public.profiles (id, empresa_id, nome, papel, status)
      VALUES (NEW.id, v_empresa_id, v_nome, v_convite.papel, 'ativo');

      UPDATE public.convites SET status = 'aceito' WHERE id = v_convite.id;
      RETURN NEW;
    END IF;
  END IF;

  -- Fluxo: novo lojista — cria empresa + subscription
  INSERT INTO public.empresas (nome)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'nome_loja', 'Minha Loja'))
  RETURNING id INTO v_empresa_id;

  INSERT INTO public.subscriptions (empresa_id, plano, status, preco)
  VALUES (v_empresa_id, 'start', 'inactive', 0);

  INSERT INTO public.profiles (id, empresa_id, nome, papel, status)
  VALUES (NEW.id, v_empresa_id, v_nome, 'admin', 'ativo');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================
-- FUNÇÃO HELPER: localiza auth.users.id pelo e-mail
-- Usada pelo endpoint /api/convite/aceitar quando o e-mail já existe
-- no Supabase Auth (criado por inviteUserByEmail) e precisamos atualizar
-- a senha via Admin API sem depender do SDK que não tem getUserByEmail.
-- =============================================================
CREATE OR REPLACE FUNCTION public.get_auth_user_id_by_email(p_email TEXT)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = auth, public
AS $$
  SELECT id FROM auth.users WHERE email = p_email LIMIT 1;
$$;

-- =============================================================
-- TRIGGER: atualizar ultima_compra do cliente ao fechar venda
-- =============================================================
CREATE OR REPLACE FUNCTION atualizar_ultima_compra()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.cliente_id IS NOT NULL AND NEW.status = 'concluida' THEN
    UPDATE clientes
    SET ultima_compra = CURRENT_DATE
    WHERE id = NEW.cliente_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ultima_compra ON vendas;
CREATE TRIGGER trg_ultima_compra
  AFTER INSERT OR UPDATE OF status ON vendas
  FOR EACH ROW EXECUTE FUNCTION atualizar_ultima_compra();

-- =============================================================
-- TRIGGER: atualizar estoque ao criar item de venda
-- =============================================================
CREATE OR REPLACE FUNCTION decrementar_estoque_venda()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NOT NEW.brinde THEN
    UPDATE produtos
    SET qtd_atual = qtd_atual - NEW.quantidade
    WHERE id = NEW.produto_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_estoque_venda ON itens_venda;
CREATE TRIGGER trg_estoque_venda
  AFTER INSERT ON itens_venda
  FOR EACH ROW EXECUTE FUNCTION decrementar_estoque_venda();

-- =============================================================
-- MIGRAÇÕES SEGURAS PARA BANCOS EXISTENTES
-- Como CREATE TABLE IF NOT EXISTS ignora novas colunas, 
-- executamos os ALTER TABLE de forma segura aqui ANTES do RLS.
-- =============================================================

-- 1. Tabela: empresas
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cnpj TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS estado TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS endereco TEXT;

-- 1b. Tabela: produtos
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS descricao TEXT;

-- 1c. Tabela: clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS anotacoes TEXT;

-- 1d. Tabela: despesas
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS recorrente BOOLEAN NOT NULL DEFAULT FALSE;

-- 1e. Tabela: pedidos_fornecedor
ALTER TABLE pedidos_fornecedor ADD COLUMN IF NOT EXISTS venda_id UUID REFERENCES public.vendas(id) ON DELETE SET NULL;

-- 1f. Tabela: ordens_servico
ALTER TABLE ordens_servico ADD COLUMN IF NOT EXISTS venda_id UUID REFERENCES public.vendas(id) ON DELETE SET NULL;
ALTER TABLE ordens_servico ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- 2. Tabela: subscriptions
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
-- Corrige ENUM para bancos existentes (past_due ausente causava falha silenciosa no webhook)
DO $$ BEGIN
  ALTER TYPE status_plano ADD VALUE IF NOT EXISTS 'past_due';
EXCEPTION WHEN others THEN NULL; END $$;

-- 3. Tabela: fiados
ALTER TABLE fiados ADD COLUMN IF NOT EXISTS data_vencimento DATE;

-- 4. Tabela: itens_venda (Migrando dados antigos sem quebrar)
ALTER TABLE itens_venda ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE;

-- Preenche empresa_id baseado na venda (para registros antigos)
UPDATE itens_venda iv
SET empresa_id = v.empresa_id
FROM vendas v
WHERE iv.venda_id = v.id AND iv.empresa_id IS NULL;

-- Remove qualquer item órfão que não tenha empresa_id antes de forçar NOT NULL
DELETE FROM itens_venda WHERE empresa_id IS NULL;

-- Depois de preencher os antigos, obriga a ser NOT NULL nas próximas transações
ALTER TABLE itens_venda ALTER COLUMN empresa_id SET NOT NULL;

-- 5. BUG CRÍTICO: preco_catalogo era NUMERIC mas o sistema armazena texto
-- ('varejo' | 'atacado' | 'vip' | 'ocultar') — corrigi para TEXT
ALTER TABLE produtos
  ALTER COLUMN preco_catalogo TYPE TEXT USING preco_catalogo::TEXT;

-- 6. C1: valor_comissao — grava a comissão calculada no momento da venda
-- Evita que mudanças de taxa retroagem no histórico
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS valor_comissao NUMERIC(12,2) DEFAULT NULL;

-- 7. C2: comissao_paga — controle de pagamento de comissões ao puxador
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS comissao_paga BOOLEAN NOT NULL DEFAULT FALSE;

-- 8. G1: valor na tabela devolucoes (já existe no schema, garante para BDs antigos)
ALTER TABLE devolucoes ALTER COLUMN valor DROP NOT NULL;
ALTER TABLE devolucoes ALTER COLUMN valor SET DEFAULT NULL;

-- =============================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================
ALTER TABLE empresas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE convites           ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_produto ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE estoque_movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE formas_pagamento   ENABLE ROW LEVEL SECURITY;
ALTER TABLE comissoes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas             ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_venda        ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiados             ENABLE ROW LEVEL SECURITY;
ALTER TABLE despesas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornecedores       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_fornecedor ENABLE ROW LEVEL SECURITY;
ALTER TABLE garantias          ENABLE ROW LEVEL SECURITY;
ALTER TABLE devolucoes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordens_servico     ENABLE ROW LEVEL SECURITY;

-- ── Helper: retorna empresa_id do usuário logado ──
CREATE OR REPLACE FUNCTION minha_empresa_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT empresa_id FROM profiles WHERE id = auth.uid();
$$;

-- ── empresas ──
DROP POLICY IF EXISTS "empresa_minha" ON empresas;
CREATE POLICY "empresa_minha" ON empresas
  FOR ALL USING (id = minha_empresa_id());

-- ── profiles ──
DROP POLICY IF EXISTS "profile_minha_empresa" ON profiles;
CREATE POLICY "profile_minha_empresa" ON profiles
  FOR ALL USING (empresa_id = minha_empresa_id() OR id = auth.uid());

-- ── subscriptions ──
DROP POLICY IF EXISTS "sub_minha_empresa" ON subscriptions;
CREATE POLICY "sub_minha_empresa" ON subscriptions
  FOR ALL USING (empresa_id = minha_empresa_id());

-- ── convites ──
DROP POLICY IF EXISTS "convites_minha_empresa" ON convites;
CREATE POLICY "convites_minha_empresa" ON convites
  FOR ALL USING (empresa_id = minha_empresa_id());

-- Permite SELECT público de convites PENDENTES para validação de token
-- (usuário convidado ainda não tem sessão/profile no momento da aceitação)
DROP POLICY IF EXISTS "convites_validacao_token" ON convites;
CREATE POLICY "convites_validacao_token" ON convites
  FOR SELECT USING (status = 'pendente' AND expira_em > NOW());

-- ── categorias_produto ──
DROP POLICY IF EXISTS "cat_minha_empresa" ON categorias_produto;
CREATE POLICY "cat_minha_empresa" ON categorias_produto
  FOR ALL USING (empresa_id = minha_empresa_id());

-- ── produtos ──
DROP POLICY IF EXISTS "produtos_minha_empresa" ON produtos;
CREATE POLICY "produtos_minha_empresa" ON produtos
  FOR ALL USING (empresa_id = minha_empresa_id());

-- ── estoque_movimentacoes ──
DROP POLICY IF EXISTS "estoque_minha_empresa" ON estoque_movimentacoes;
CREATE POLICY "estoque_minha_empresa" ON estoque_movimentacoes
  FOR ALL USING (empresa_id = minha_empresa_id());

-- ── clientes ──
DROP POLICY IF EXISTS "clientes_minha_empresa" ON clientes;
CREATE POLICY "clientes_minha_empresa" ON clientes
  FOR ALL USING (empresa_id = minha_empresa_id());

-- ── formas_pagamento ──
DROP POLICY IF EXISTS "formas_minha_empresa" ON formas_pagamento;
CREATE POLICY "formas_minha_empresa" ON formas_pagamento
  FOR ALL USING (empresa_id = minha_empresa_id());

-- ── comissoes ──
DROP POLICY IF EXISTS "comissoes_minha_empresa" ON comissoes;
CREATE POLICY "comissoes_minha_empresa" ON comissoes
  FOR ALL USING (empresa_id = minha_empresa_id());

-- ── vendas ──
DROP POLICY IF EXISTS "vendas_minha_empresa" ON vendas;
CREATE POLICY "vendas_minha_empresa" ON vendas
  FOR ALL USING (empresa_id = minha_empresa_id());

-- ── itens_venda ──
DROP POLICY IF EXISTS "itens_venda_minha_empresa" ON itens_venda;
CREATE POLICY "itens_venda_minha_empresa" ON itens_venda
  FOR ALL USING (empresa_id = minha_empresa_id());

-- ── fiados ──
DROP POLICY IF EXISTS "fiados_minha_empresa" ON fiados;
CREATE POLICY "fiados_minha_empresa" ON fiados
  FOR ALL USING (empresa_id = minha_empresa_id());

-- ── despesas ──
DROP POLICY IF EXISTS "despesas_minha_empresa" ON despesas;
CREATE POLICY "despesas_minha_empresa" ON despesas
  FOR ALL USING (empresa_id = minha_empresa_id());

-- ── fornecedores ──
DROP POLICY IF EXISTS "fornecedores_minha_empresa" ON fornecedores;
CREATE POLICY "fornecedores_minha_empresa" ON fornecedores
  FOR ALL USING (empresa_id = minha_empresa_id());

-- ── pedidos_fornecedor ──
DROP POLICY IF EXISTS "pedidos_minha_empresa" ON pedidos_fornecedor;
CREATE POLICY "pedidos_minha_empresa" ON pedidos_fornecedor
  FOR ALL USING (empresa_id = minha_empresa_id());

-- ── garantias ──
DROP POLICY IF EXISTS "garantias_minha_empresa" ON garantias;
CREATE POLICY "garantias_minha_empresa" ON garantias
  FOR ALL USING (empresa_id = minha_empresa_id());

-- ── devolucoes ──
DROP POLICY IF EXISTS "devolucoes_minha_empresa" ON devolucoes;
CREATE POLICY "devolucoes_minha_empresa" ON devolucoes
  FOR ALL USING (empresa_id = minha_empresa_id());

-- ── ordens_servico ──
DROP POLICY IF EXISTS "os_minha_empresa" ON ordens_servico;
CREATE POLICY "os_minha_empresa" ON ordens_servico
  FOR ALL USING (empresa_id = minha_empresa_id());

-- =============================================================
-- FORMAS DE PAGAMENTO PADRÃO (inseridas junto com empresa)
-- =============================================================
CREATE OR REPLACE FUNCTION inserir_formas_pagamento_padrao()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO formas_pagamento (empresa_id, nome, taxa, ativo) VALUES
    (NEW.id, 'Dinheiro',         0,    TRUE),
    (NEW.id, 'PIX',              0,    TRUE),
    (NEW.id, 'Cartão Débito',    1.5,  TRUE),
    (NEW.id, 'Cartão Crédito',   2.99, TRUE),
    (NEW.id, 'Boleto',           1.5,  FALSE),
    (NEW.id, 'Cheque',           0,    FALSE);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_formas_padrao ON empresas;
CREATE TRIGGER trg_formas_padrao
  AFTER INSERT ON empresas
  FOR EACH ROW EXECUTE FUNCTION inserir_formas_pagamento_padrao();

-- =============================================================
-- FIM DO SCRIPT
-- =============================================================

-- =============================================================
-- RPC: TRANSAÇÃO ATÔMICA DE VENDA
-- =============================================================
CREATE OR REPLACE FUNCTION checkout_venda_transaction(
  p_empresa_id UUID,
  p_cliente_id UUID,
  p_cliente_nome TEXT,
  p_forma_pagamento TEXT,
  p_total NUMERIC,
  p_desconto NUMERIC,
  p_comissionado_id UUID,
  p_comissionado_nome TEXT,
  p_registrado_nome TEXT,
  p_obs TEXT,
  p_itens JSONB,
  p_prazo_dias INT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_venda_id UUID;
  v_item_json JSONB;
  v_produto_id UUID;
  v_quantidade NUMERIC;
  v_brinde BOOLEAN;
  v_tem_garantia BOOLEAN;
  v_dias_garantia INT;
  v_texto_garantia TEXT;
  v_venc_garantia DATE;
  v_data_vencimento DATE := NULL;
BEGIN
  -- 1. Inserir a venda
  INSERT INTO vendas (
    empresa_id, cliente_id, cliente_nome, forma_pagamento, total, desconto, 
    comissionado_id, comissionado_nome, registrado_nome, obs, status
  ) VALUES (
    p_empresa_id, p_cliente_id, p_cliente_nome, p_forma_pagamento, p_total, p_desconto,
    p_comissionado_id, p_comissionado_nome, p_registrado_nome, p_obs, 'concluida'
  ) RETURNING id INTO v_venda_id;

  -- 2. Processar itens
  FOR v_item_json IN SELECT * FROM jsonb_array_elements(p_itens)
  LOOP
    v_produto_id := (v_item_json->>'produto_id')::UUID;
    v_quantidade := (v_item_json->>'quantidade')::NUMERIC;
    v_brinde := COALESCE((v_item_json->>'brinde')::BOOLEAN, FALSE);

    INSERT INTO itens_venda (
      empresa_id, venda_id, produto_id, produto_nome, quantidade, preco_unitario, brinde, num_serie
    ) VALUES (
      p_empresa_id, v_venda_id, v_produto_id, v_item_json->>'produto_nome', 
      v_quantidade, (v_item_json->>'preco_unitario')::NUMERIC, v_brinde, v_item_json->>'num_serie'
    );
    
    INSERT INTO estoque_movimentacoes (
      empresa_id, produto_id, tipo, quantidade, obs
    ) VALUES (
      p_empresa_id, v_produto_id, CASE WHEN v_brinde THEN 'brinde'::tipo_movimentacao ELSE 'venda'::tipo_movimentacao END, -v_quantidade, 'Venda registrada via Checkout'
    );

    v_tem_garantia := COALESCE((v_item_json->>'tem_garantia')::BOOLEAN, FALSE);
    v_dias_garantia := (v_item_json->>'dias_garantia')::INT;
    
    IF v_tem_garantia AND v_dias_garantia IS NOT NULL AND v_dias_garantia > 0 AND NOT v_brinde THEN
      v_texto_garantia := v_item_json->>'texto_garantia';
      v_venc_garantia := CURRENT_DATE + v_dias_garantia;
      
      INSERT INTO garantias (
        empresa_id, venda_id, produto_id, produto_nome, num_serie, cliente_nome, 
        data_compra, data_vencimento, texto_garantia, status
      ) VALUES (
        p_empresa_id, v_venda_id, v_produto_id, v_item_json->>'produto_nome', v_item_json->>'num_serie', COALESCE(p_cliente_nome, 'Anônimo'),
        CURRENT_DATE, v_venc_garantia, v_texto_garantia, 'ativa'
      );
    END IF;

  END LOOP;

  -- 3. Fiado
  IF p_forma_pagamento = 'Fiado' AND p_cliente_nome IS NOT NULL THEN
    IF p_prazo_dias IS NOT NULL THEN
      v_data_vencimento := CURRENT_DATE + p_prazo_dias;
    END IF;

    INSERT INTO fiados (empresa_id, cliente_id, cliente_nome, valor_aberto, data_vencimento)
    VALUES (p_empresa_id, p_cliente_id, p_cliente_nome, p_total, v_data_vencimento);
  END IF;

  RETURN v_venda_id;
END;
$$;
