alter table public.empresas
  add column if not exists cnpj text,
  add column if not exists email text,
  add column if not exists estado text,
  add column if not exists endereco text,
  add column if not exists whatsapp text,
  add column if not exists instagram text;
