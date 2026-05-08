-- Add crm_prazo_inatividade_dias to empresas
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS crm_prazo_inatividade_dias int DEFAULT 60;

-- Create devolucoes table
CREATE TABLE IF NOT EXISTS public.devolucoes (
  id uuid primary key default uuid_generate_v4(),
  empresa_id uuid not null references public.empresas(id),
  garantia_id uuid not null references public.garantias(id),
  venda_id uuid references public.vendas(id),
  motivo text not null,
  resolucao text not null,
  criado_em timestamp with time zone default now()
);

ALTER TABLE public.devolucoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresa vê devolucoes" ON public.devolucoes FOR SELECT USING (empresa_id = minha_empresa_id());
CREATE POLICY "Empresa insere devolucoes" ON public.devolucoes FOR INSERT WITH CHECK (empresa_id = minha_empresa_id());
CREATE POLICY "Empresa atualiza devolucoes" ON public.devolucoes FOR UPDATE USING (empresa_id = minha_empresa_id());

-- Add crm_prazo_inatividade_dias to docs/supabase_schema.sql if not exists
