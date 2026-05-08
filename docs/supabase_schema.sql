-- ================================================================
-- KDL Store — Schema Supabase
-- Execute este SQL no Supabase: SQL Editor → New Query → Run
-- ================================================================

-- ----------------------------------------------------------------
-- EXTENSÕES
-- ----------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------
-- EMPRESAS (multi-tenant: cada loja é uma empresa)
-- ----------------------------------------------------------------
create table public.empresas (
  id          uuid primary key default uuid_generate_v4(),
  nome        text not null,
  telefone    text,
  cidade      text,
  plano       text not null default 'essencial',
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- PROFILES (extensão do auth.users do Supabase)
-- ----------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  empresa_id  uuid references public.empresas(id) on delete cascade,
  nome        text,
  papel       text not null default 'vendedor', -- 'admin' | 'vendedor' | 'estoquista'
  status      text not null default 'ativo',   -- ADICIONADO: 'ativo'|'congelado'|'excluido'
  criado_em   timestamptz not null default now()
);

-- Trigger: cria profile automaticamente ao criar usuário
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, nome)
  values (new.id, new.raw_user_meta_data->>'nome');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------
-- PRODUTOS
-- ----------------------------------------------------------------
create table public.produtos (
  id              uuid primary key default uuid_generate_v4(),
  empresa_id      uuid not null references public.empresas(id) on delete cascade,
  nome            text not null,
  sku             text,
  codigo_barras   text,
  categoria       text,
  descricao       text,
  preco_custo     numeric(10,2) not null default 0,
  preco_varejo    numeric(10,2) not null default 0,
  preco_atacado   numeric(10,2),
  preco_vip       numeric(10,2),
  preco_minimo    numeric(10,2),
  qtd_min_atacado integer not null default 5,
  qtd_atual       integer not null default 0,
  qtd_minima      integer not null default 0,
  qtd_maxima      integer,
  localizacao     text,
  tem_serie       boolean not null default false,
  tem_garantia    boolean not null default false,
  dias_garantia   integer,
  texto_garantia  text,
  pode_ser_brinde boolean not null default false,
  ativo_catalogo  boolean not null default true,
  preco_catalogo  text not null default 'varejo', -- 'varejo'|'atacado'|'vip'|'ocultar'
  destaque        boolean not null default false,
  ativo           boolean not null default true,
  criado_em       timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- CLIENTES
-- ----------------------------------------------------------------
create table public.clientes (
  id            uuid primary key default uuid_generate_v4(),
  empresa_id    uuid not null references public.empresas(id) on delete cascade,
  nome          text not null,
  telefone      text,
  cpf           text,
  email         text,
  endereco      text,
  tipo          text not null default 'varejo', -- 'varejo'|'atacado'|'vip'
  anotacoes     text,
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now(),
  ultima_compra timestamptz
);

-- ----------------------------------------------------------------
-- FORNECEDORES
-- ----------------------------------------------------------------
create table public.fornecedores (
  id            uuid primary key default uuid_generate_v4(),
  empresa_id    uuid not null references public.empresas(id) on delete cascade,
  nome          text not null,
  contato       text,
  telefone      text,
  email         text,           -- ADICIONADO: usado no FormFornecedor
  cnpj          text,           -- ADICIONADO: usado no FormFornecedor
  categoria     text,
  cidade        text,
  estado        text,           -- ADICIONADO: usado no FormFornecedor
  prazo_entrega text,
  pedido_minimo numeric(10,2),
  anotacoes     text,
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- PEDIDOS AO FORNECEDOR
-- ----------------------------------------------------------------
create table public.pedidos_fornecedor (
  id            uuid primary key default uuid_generate_v4(),
  empresa_id    uuid not null references public.empresas(id) on delete cascade,
  fornecedor_id uuid references public.fornecedores(id),
  produto       text not null,
  quantidade    integer not null default 1,
  status        text not null default 'aguardando', -- 'aguardando'|'confirmado'|'entregue'
  criado_em     timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- CATEGORIAS DE PRODUTO (dinâmicas por empresa)
-- ADICIONADO: a outra IA implementou categorias dinâmicas no commit 7b9c0bc
-- ----------------------------------------------------------------
create table public.categorias_produto (
  id          uuid primary key default uuid_generate_v4(),
  empresa_id  uuid not null references public.empresas(id) on delete cascade,
  nome        text not null,
  criado_em   timestamptz not null default now(),
  unique (empresa_id, nome)
);

-- ----------------------------------------------------------------
-- CONVITES DE USUÁRIO (sistema de acesso por link)
-- ADICIONADO: a outra IA implementou convites no commit 7b9c0bc
-- ----------------------------------------------------------------
create table public.convites (
  id          uuid primary key default uuid_generate_v4(),
  empresa_id  uuid not null references public.empresas(id) on delete cascade,
  email       text not null,
  nome        text,
  papel       text not null default 'vendedor', -- 'admin'|'vendedor'|'estoquista'
  status      text not null default 'pendente', -- 'pendente'|'cancelado'|'aceito'
  token       uuid not null default uuid_generate_v4(),
  expira_em   timestamptz not null default (now() + interval '7 days'),
  criado_em   timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- COMISSÕES (puxadores) — nome real da tabela no código: comissoes
-- ----------------------------------------------------------------
create table public.comissoes (
  id            uuid primary key default uuid_generate_v4(),
  empresa_id    uuid not null references public.empresas(id) on delete cascade,
  nome          text not null,
  telefone      text,
  tipo_comissao text not null default 'percentual', -- 'percentual'|'fixo'
  taxa          numeric(10,2) not null default 5,
  status        text not null default 'ativo',      -- ADICIONADO: 'ativo'|'inativo'
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- VENDAS
-- ----------------------------------------------------------------
create table public.vendas (
  id               uuid primary key default uuid_generate_v4(),
  empresa_id       uuid not null references public.empresas(id) on delete cascade,
  numero           serial,
  cliente_id       uuid references public.clientes(id),
  cliente_nome     text,
  comissionado_id  uuid references public.comissionados(id),
  comissionado_nome text,
  forma_pagamento  text not null, -- 'PIX'|'Dinheiro'|'Crédito'|'Débito'|'Fiado'
  subtotal         numeric(10,2) not null default 0,
  desconto         numeric(10,2) not null default 0,
  total            numeric(10,2) not null default 0,
  troco            numeric(10,2),
  status           text not null default 'concluida', -- 'concluida'|'cancelada'
  registrado_por   uuid references auth.users(id),
  registrado_nome  text,
  criado_em        timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- ITENS DA VENDA
-- Nomes de colunas refletem o que o código usa na prática
-- ----------------------------------------------------------------
create table public.itens_venda (
  id            uuid primary key default uuid_generate_v4(),
  venda_id      uuid not null references public.vendas(id) on delete cascade,
  empresa_id    uuid references public.empresas(id),   -- ADICIONADO: inserido pelo PDV
  produto_id    uuid references public.produtos(id),
  produto_nome  text not null,                         -- era 'nome' no rascunho inicial
  sku           text,
  quantidade    integer not null default 1,
  preco_unitario numeric(10,2) not null,               -- era 'preco_unit' no rascunho inicial
  preco_custo   numeric(10,2),
  tabela        text not null default 'varejo',
  brinde        boolean not null default false,
  num_serie     text,
  tem_garantia  boolean not null default false,
  dias_garantia integer,
  texto_garantia text
);

-- ----------------------------------------------------------------
-- ESTOQUE — MOVIMENTAÇÕES
-- ----------------------------------------------------------------
create table public.estoque_movimentacoes (
  id          uuid primary key default uuid_generate_v4(),
  empresa_id  uuid not null references public.empresas(id) on delete cascade,
  produto_id  uuid not null references public.produtos(id) on delete cascade,
  tipo        text not null, -- 'entrada'|'venda'|'brinde'|'ajuste'
  quantidade  integer not null, -- positivo=entrada, negativo=saída
  venda_id    uuid references public.vendas(id),
  obs         text,
  criado_em   timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- GARANTIAS
-- ----------------------------------------------------------------
create table public.garantias (
  id              uuid primary key default uuid_generate_v4(),
  empresa_id      uuid not null references public.empresas(id) on delete cascade,
  venda_id        uuid references public.vendas(id),
  item_venda_id   uuid references public.itens_venda(id),
  produto_id      uuid references public.produtos(id),  -- ADICIONADO: inserido pelo PDV
  produto_nome    text not null,
  num_serie       text,
  cliente_id      uuid references public.clientes(id),
  cliente_nome    text,
  cliente_tel     text,
  cliente_cpf     text,
  data_compra     date not null,
  data_vencimento date not null,
  dias_garantia   integer,               -- nullable: PDV não insere este campo
  texto_garantia  text,
  status          text not null default 'ativa', -- 'ativa'|'vencida'
  criado_em       timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- ORDENS DE SERVIÇO
-- Nomes de colunas refletem o que o código usa na prática
-- ----------------------------------------------------------------
create table public.ordens_servico (
  id              uuid primary key default uuid_generate_v4(),
  empresa_id      uuid not null references public.empresas(id) on delete cascade,
  numero          serial,
  cliente_id      uuid references public.clientes(id),
  cliente_nome    text not null,
  cliente_tel     text,                -- ADICIONADO: usado no formulário de OS
  tecnico         text,
  equipamento     text,
  defeito_relatado text,               -- era 'defeito' no rascunho inicial
  orcamento       numeric(10,2),       -- era 'valor' no rascunho inicial
  previsao        date,
  status          text not null default 'aguardando', -- 'aguardando'|'em_servico'|'concluido'|'entregue'|'cancelado'
  obs_internas    text,
  criado_em       timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- DESPESAS
-- ----------------------------------------------------------------
create table public.despesas (
  id           uuid primary key default uuid_generate_v4(),
  empresa_id   uuid not null references public.empresas(id) on delete cascade,
  descricao    text not null,
  categoria    text not null,
  tipo         text not null default 'variavel', -- 'fixa'|'variavel'
  valor        numeric(10,2) not null,
  data         date not null default current_date,
  recorrente   boolean not null default false,
  criado_em    timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- FIADO
-- ----------------------------------------------------------------
create table public.fiados (
  id            uuid primary key default uuid_generate_v4(),
  empresa_id    uuid not null references public.empresas(id) on delete cascade,
  venda_id      uuid references public.vendas(id),
  cliente_id    uuid references public.clientes(id),
  cliente_nome  text not null,
  cliente_tel   text,
  valor_aberto  numeric(10,2) not null,
  valor_pago    numeric(10,2) not null default 0,
  status        text not null default 'aberto', -- 'aberto'|'pago'
  pago_em       timestamptz,
  criado_em     timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- FECHAMENTOS DE CAIXA
-- ----------------------------------------------------------------
create table public.fechamentos_caixa (
  id                   uuid primary key default uuid_generate_v4(),
  empresa_id           uuid not null references public.empresas(id) on delete cascade,
  periodo              text not null, -- 'diario'|'quinzenal'|'mensal'
  data_inicio          date not null,
  data_fim             date not null,
  total_entradas       numeric(10,2) not null default 0,
  total_saidas         numeric(10,2) not null default 0,
  saldo_esperado       numeric(10,2) not null default 0,
  saldo_fisico         numeric(10,2) not null default 0,
  diferenca            numeric(10,2) not null default 0,
  responsavel_id       uuid references auth.users(id),
  criado_em            timestamptz not null default now()
);

-- ================================================================
-- ROW LEVEL SECURITY (RLS) — cada loja só vê seus dados
-- ================================================================
alter table public.empresas               enable row level security;
alter table public.profiles               enable row level security;
alter table public.produtos               enable row level security;
alter table public.clientes               enable row level security;
alter table public.fornecedores           enable row level security;
alter table public.pedidos_fornecedor     enable row level security;
alter table public.comissoes              enable row level security;
alter table public.vendas                 enable row level security;
alter table public.itens_venda            enable row level security;
alter table public.estoque_movimentacoes  enable row level security;
alter table public.garantias              enable row level security;
alter table public.ordens_servico         enable row level security;
alter table public.despesas               enable row level security;
alter table public.fiados                 enable row level security;
alter table public.fechamentos_caixa      enable row level security;
alter table public.categorias_produto     enable row level security;  -- ADICIONADO
alter table public.convites               enable row level security;  -- ADICIONADO

-- Helper: retorna empresa_id do usuário logado
create or replace function public.minha_empresa_id()
returns uuid language sql stable as $$
  select empresa_id from public.profiles where id = auth.uid()
$$;

-- Policies genéricas (cada tabela só deixa passar registros da empresa do usuário)
-- PRODUTOS
create policy "Empresa vê seus produtos"   on public.produtos for select using (empresa_id = minha_empresa_id());
create policy "Empresa insere produtos"    on public.produtos for insert with check (empresa_id = minha_empresa_id());
create policy "Empresa atualiza produtos"  on public.produtos for update using (empresa_id = minha_empresa_id());
create policy "Empresa deleta produtos"    on public.produtos for delete using (empresa_id = minha_empresa_id());

-- CLIENTES
create policy "Empresa vê seus clientes"   on public.clientes for select using (empresa_id = minha_empresa_id());
create policy "Empresa insere clientes"    on public.clientes for insert with check (empresa_id = minha_empresa_id());
create policy "Empresa atualiza clientes"  on public.clientes for update using (empresa_id = minha_empresa_id());
create policy "Empresa deleta clientes"    on public.clientes for delete using (empresa_id = minha_empresa_id());

-- VENDAS
create policy "Empresa vê suas vendas"     on public.vendas for select using (empresa_id = minha_empresa_id());
create policy "Empresa insere vendas"      on public.vendas for insert with check (empresa_id = minha_empresa_id());
create policy "Empresa atualiza vendas"    on public.vendas for update using (empresa_id = minha_empresa_id());

-- ITENS VENDA
create policy "Empresa vê itens"           on public.itens_venda for select
  using (venda_id in (select id from public.vendas where empresa_id = minha_empresa_id()));
create policy "Empresa insere itens"       on public.itens_venda for insert
  with check (venda_id in (select id from public.vendas where empresa_id = minha_empresa_id()));

-- FORNECEDORES
create policy "Empresa vê fornecedores"    on public.fornecedores for select using (empresa_id = minha_empresa_id());
create policy "Empresa insere fornecedores" on public.fornecedores for insert with check (empresa_id = minha_empresa_id());
create policy "Empresa atualiza fornecedores" on public.fornecedores for update using (empresa_id = minha_empresa_id());

-- PEDIDOS FORNECEDOR
create policy "Empresa vê pedidos"         on public.pedidos_fornecedor for select using (empresa_id = minha_empresa_id());
create policy "Empresa insere pedidos"     on public.pedidos_fornecedor for insert with check (empresa_id = minha_empresa_id());
create policy "Empresa atualiza pedidos"   on public.pedidos_fornecedor for update using (empresa_id = minha_empresa_id());

-- COMISSÕES (tabela real: comissoes)
create policy "Empresa vê comissoes"       on public.comissoes for select using (empresa_id = minha_empresa_id());
create policy "Empresa insere comissoes"   on public.comissoes for insert with check (empresa_id = minha_empresa_id());
create policy "Empresa atualiza comissoes" on public.comissoes for update using (empresa_id = minha_empresa_id());
create policy "Empresa deleta comissoes"   on public.comissoes for delete using (empresa_id = minha_empresa_id());

-- ESTOQUE
create policy "Empresa vê estoque"         on public.estoque_movimentacoes for select using (empresa_id = minha_empresa_id());
create policy "Empresa insere estoque"     on public.estoque_movimentacoes for insert with check (empresa_id = minha_empresa_id());

-- GARANTIAS
create policy "Empresa vê garantias"       on public.garantias for select using (empresa_id = minha_empresa_id());
create policy "Empresa insere garantias"   on public.garantias for insert with check (empresa_id = minha_empresa_id());
create policy "Empresa atualiza garantias" on public.garantias for update using (empresa_id = minha_empresa_id());

-- OS
create policy "Empresa vê OS"              on public.ordens_servico for select using (empresa_id = minha_empresa_id());
create policy "Empresa insere OS"          on public.ordens_servico for insert with check (empresa_id = minha_empresa_id());
create policy "Empresa atualiza OS"        on public.ordens_servico for update using (empresa_id = minha_empresa_id());

-- DESPESAS
create policy "Empresa vê despesas"        on public.despesas for select using (empresa_id = minha_empresa_id());
create policy "Empresa insere despesas"    on public.despesas for insert with check (empresa_id = minha_empresa_id());
create policy "Empresa deleta despesas"    on public.despesas for delete using (empresa_id = minha_empresa_id());

-- FIADO
create policy "Empresa vê fiados"          on public.fiados for select using (empresa_id = minha_empresa_id());
create policy "Empresa insere fiados"      on public.fiados for insert with check (empresa_id = minha_empresa_id());
create policy "Empresa atualiza fiados"    on public.fiados for update using (empresa_id = minha_empresa_id());

-- FECHAMENTOS
create policy "Empresa vê fechamentos"     on public.fechamentos_caixa for select using (empresa_id = minha_empresa_id());
create policy "Empresa insere fechamentos" on public.fechamentos_caixa for insert with check (empresa_id = minha_empresa_id());

-- PROFILES (lojistas da mesma empresa podem ver outros membros)
create policy "Usuário vê seu profile"     on public.profiles for select using (id = auth.uid() or empresa_id = minha_empresa_id());
create policy "Usuário atualiza profile"   on public.profiles for update using (id = auth.uid());

-- EMPRESAS
create policy "Usuário vê sua empresa"     on public.empresas for select
  using (id = minha_empresa_id());
create policy "Usuário atualiza empresa"   on public.empresas for update
  using (id = minha_empresa_id());

-- CATEGORIAS DE PRODUTO -- ADICIONADO
create policy "Empresa vê categorias"      on public.categorias_produto for select using (empresa_id = minha_empresa_id());
create policy "Empresa insere categorias"  on public.categorias_produto for insert with check (empresa_id = minha_empresa_id());
create policy "Empresa deleta categorias"  on public.categorias_produto for delete using (empresa_id = minha_empresa_id());

-- CONVITES -- ADICIONADO
create policy "Empresa vê convites"        on public.convites for select using (empresa_id = minha_empresa_id());
create policy "Empresa insere convites"    on public.convites for insert with check (empresa_id = minha_empresa_id());
create policy "Empresa atualiza convites"  on public.convites for update using (empresa_id = minha_empresa_id());
-- Usuário convidado pode ler o convite pelo token (sem estar logado)
create policy "Público lê convite por token" on public.convites for select using (true);

