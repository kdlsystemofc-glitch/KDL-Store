-- EXECUTE ESTE SCRIPT NO EDITOR SQL DO SUPABASE
-- Adiciona a coluna de permissões personalizadas para o papel de Operador no profiles

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS permissoes JSONB DEFAULT '{}'::jsonb;

-- Comentário explicativo:
-- Esta coluna armazenará um objeto JSON com o nível de acesso para cada tela:
-- Exemplo: { "financeiro": "none", "vendas": "read", "produtos": "write" }
