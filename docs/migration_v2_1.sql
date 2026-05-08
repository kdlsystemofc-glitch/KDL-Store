-- ================================================================
-- NexoCommerce — Migration v2.1 (CORRIGIDA)
-- Execute SOMENTE este arquivo no Supabase:
--   SQL Editor → New Query → cole aqui → Run
--
-- ⚠ NÃO execute o supabase_schema.sql — ele é apenas para bancos novos.
-- Este script adiciona só o que está FALTANDO, sem destruir dados.
-- ================================================================

-- ----------------------------------------------------------------
-- 1. COLUNAS NOVAS EM TABELAS EXISTENTES
-- ----------------------------------------------------------------

-- profiles: status para congelar/excluir usuários
alter table public.profiles
  add column if not exists status text not null default 'ativo';

-- fornecedores: campos usados pelo FormFornecedor
alter table public.fornecedores
  add column if not exists email  text,
  add column if not exists cnpj   text,
  add column if not exists estado text;

-- comissoes: status ativo/inativo
-- (ajuste o nome se sua tabela se chama 'comissionados')
alter table public.comissoes
  add column if not exists status text not null default 'ativo';

-- itens_venda: empresa_id (inserido pelo PDV)
alter table public.itens_venda
  add column if not exists empresa_id uuid references public.empresas(id);

-- ordens_servico: cliente_tel e venda_id (vínculo com venda de origem)
alter table public.ordens_servico
  add column if not exists cliente_tel text,
  add column if not exists venda_id uuid references public.vendas(id);

-- garantias: produto_id (inserido automaticamente pelo PDV)
alter table public.garantias
  add column if not exists produto_id uuid references public.produtos(id);

-- Nota: dias_garantia nao existe nesta versao do banco — sem alteracao necessaria.


-- ----------------------------------------------------------------
-- 2. NOVAS TABELAS
-- ----------------------------------------------------------------

create table if not exists public.categorias_produto (
  id          uuid primary key default uuid_generate_v4(),
  empresa_id  uuid not null references public.empresas(id) on delete cascade,
  nome        text not null,
  criado_em   timestamptz not null default now(),
  unique (empresa_id, nome)
);

create table if not exists public.convites (
  id          uuid primary key default uuid_generate_v4(),
  empresa_id  uuid not null references public.empresas(id) on delete cascade,
  email       text not null,
  nome        text,
  papel       text not null default 'vendedor',
  status      text not null default 'pendente',
  token       uuid not null default uuid_generate_v4(),
  expira_em   timestamptz not null default (now() + interval '7 days'),
  criado_em   timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- 3. RLS PARA NOVAS TABELAS
-- ----------------------------------------------------------------

alter table public.categorias_produto enable row level security;
alter table public.convites           enable row level security;

-- categorias_produto
drop policy if exists "Empresa vê categorias"     on public.categorias_produto;
drop policy if exists "Empresa insere categorias" on public.categorias_produto;
drop policy if exists "Empresa deleta categorias" on public.categorias_produto;

create policy "Empresa vê categorias"
  on public.categorias_produto for select using (empresa_id = minha_empresa_id());
create policy "Empresa insere categorias"
  on public.categorias_produto for insert with check (empresa_id = minha_empresa_id());
create policy "Empresa deleta categorias"
  on public.categorias_produto for delete using (empresa_id = minha_empresa_id());

-- convites
drop policy if exists "Empresa vê convites"           on public.convites;
drop policy if exists "Empresa insere convites"       on public.convites;
drop policy if exists "Empresa atualiza convites"     on public.convites;
drop policy if exists "Público lê convite por token"  on public.convites;

create policy "Empresa vê convites"
  on public.convites for select using (empresa_id = minha_empresa_id());
create policy "Empresa insere convites"
  on public.convites for insert with check (empresa_id = minha_empresa_id());
create policy "Empresa atualiza convites"
  on public.convites for update using (empresa_id = minha_empresa_id());
-- Usuário não logado pode ler o convite pelo token (fluxo /convite?token=...)
create policy "Público lê convite por token"
  on public.convites for select using (true);

-- ----------------------------------------------------------------
-- 4. ATUALIZA POLICY DE PROFILES (membros da empresa se veem)
-- ----------------------------------------------------------------

drop policy if exists "Usuário vê seu profile" on public.profiles;
create policy "Usuário vê seu profile"
  on public.profiles for select
  using (id = auth.uid() or empresa_id = minha_empresa_id());

-- ----------------------------------------------------------------
-- 5. TRIGGER ATUALIZADO — suporte a convites
-- Quando um usuário cria conta via /convite?token=...,
-- o trigger lê o token, pega empresa_id e papel do convite,
-- vincula o profile e marca o convite como aceito.
-- ----------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  v_token      uuid;
  v_empresa_id uuid;
  v_papel      text;
begin
  -- Lê token de convite dos metadados (se existir)
  begin
    v_token := (new.raw_user_meta_data->>'convite_token')::uuid;
  exception when others then
    v_token := null;
  end;

  if v_token is not null then
    -- Busca convite válido e não expirado
    select empresa_id, papel
      into v_empresa_id, v_papel
      from public.convites
     where token = v_token
       and status = 'pendente'
       and expira_em > now()
     limit 1;

    -- Marca convite como aceito
    if v_empresa_id is not null then
      update public.convites
         set status = 'aceito'
       where token = v_token;
    end if;
  end if;

  -- Cria o profile do novo usuário
  insert into public.profiles (id, nome, empresa_id, papel)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', new.email),
    v_empresa_id,                       -- null se não veio de convite
    coalesce(v_papel, 'admin')          -- admin se criou conta própria
  );

  return new;
end;
$$;

-- Recria o trigger com a versão atualizada
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
