-- ================================================================
-- NexoCommerce — Migration v2.1
-- Execute este SQL no Supabase: SQL Editor → New Query → Run
-- Só adiciona o que está FALTANDO — não recria nada existente
-- ================================================================

-- ----------------------------------------------------------------
-- 1. COLUNAS NOVAS EM TABELAS EXISTENTES
-- ----------------------------------------------------------------

-- profiles: coluna status (controle de acesso de usuários)
alter table public.profiles
  add column if not exists status text not null default 'ativo';
-- Valores: 'ativo' | 'congelado' | 'excluido'

-- profiles: coluna papel com estoquista
-- (já existe, só atualiza o comentário — sem SQL necessário)

-- fornecedores: colunas adicionadas pelo FormFornecedor
alter table public.fornecedores
  add column if not exists email  text,
  add column if not exists cnpj   text,
  add column if not exists estado text;

-- comissoes: coluna status
-- (verificar se a tabela se chama 'comissoes' ou 'comissionados' no seu banco)
-- Se for 'comissoes':
alter table public.comissoes
  add column if not exists status text not null default 'ativo';
-- Se for 'comissionados' (nome original do schema):
-- alter table public.comissionados add column if not exists status text not null default 'ativo';

-- itens_venda: colunas com nomes corretos
-- Atenção: se as colunas já existem com esses nomes, ignore.
-- Se existem com nomes antigos (nome, preco_unit), rode os RENAMEs abaixo:
-- alter table public.itens_venda rename column nome to produto_nome;
-- alter table public.itens_venda rename column preco_unit to preco_unitario;
alter table public.itens_venda
  add column if not exists empresa_id uuid references public.empresas(id);

-- ordens_servico: colunas com nomes corretos
-- Se as colunas existem com nomes antigos (defeito, valor), rode os RENAMEs:
-- alter table public.ordens_servico rename column defeito to defeito_relatado;
-- alter table public.ordens_servico rename column valor to orcamento;
alter table public.ordens_servico
  add column if not exists cliente_tel text;

-- garantias: produto_id e dias_garantia nullable
alter table public.garantias
  add column if not exists produto_id uuid references public.produtos(id);
-- Se dias_garantia for NOT NULL e quiser tornar nullable:
-- alter table public.garantias alter column dias_garantia drop not null;

-- ----------------------------------------------------------------
-- 2. NOVAS TABELAS
-- ----------------------------------------------------------------

-- Categorias de produto (dinâmicas por empresa)
create table if not exists public.categorias_produto (
  id          uuid primary key default uuid_generate_v4(),
  empresa_id  uuid not null references public.empresas(id) on delete cascade,
  nome        text not null,
  criado_em   timestamptz not null default now(),
  unique (empresa_id, nome)
);

-- Convites de usuário (sistema de acesso por link)
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

create policy if not exists "Empresa vê categorias"
  on public.categorias_produto for select using (empresa_id = minha_empresa_id());
create policy if not exists "Empresa insere categorias"
  on public.categorias_produto for insert with check (empresa_id = minha_empresa_id());
create policy if not exists "Empresa deleta categorias"
  on public.categorias_produto for delete using (empresa_id = minha_empresa_id());

create policy if not exists "Empresa vê convites"
  on public.convites for select using (empresa_id = minha_empresa_id());
create policy if not exists "Empresa insere convites"
  on public.convites for insert with check (empresa_id = minha_empresa_id());
create policy if not exists "Empresa atualiza convites"
  on public.convites for update using (empresa_id = minha_empresa_id());
-- Permite que usuário não logado leia convite pelo token
create policy if not exists "Público lê convite por token"
  on public.convites for select using (true);

-- RLS profiles: membros da mesma empresa podem se ver (gestão de usuários)
-- Remova a policy antiga antes de criar a nova:
drop policy if exists "Usuário vê seu profile" on public.profiles;
create policy "Usuário vê seu profile"
  on public.profiles for select
  using (id = auth.uid() or empresa_id = minha_empresa_id());

-- ----------------------------------------------------------------
-- 4. TRIGGER ATUALIZADO — handle_new_user com suporte a convites
-- ----------------------------------------------------------------
-- Este trigger cria o profile do usuário. Se vier de um convite,
-- vincula automaticamente à empresa e aplica o papel correto.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  v_token      uuid;
  v_empresa_id uuid;
  v_papel      text;
begin
  -- Verifica se tem token de convite nos metadados
  v_token := (new.raw_user_meta_data->>'convite_token')::uuid;

  if v_token is not null then
    -- Busca convite válido
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

  -- Cria o profile
  insert into public.profiles (id, nome, empresa_id, papel)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', new.email),
    v_empresa_id,   -- null se não veio de convite
    coalesce(v_papel, 'admin')  -- admin se criou conta própria, papel do convite se convidado
  );

  return new;
end;
$$;

-- Recria o trigger (drop + create para garantir versão atualizada)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
