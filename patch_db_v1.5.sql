-- 1. Colunas para endereço estruturado na tabela fornecedores
ALTER TABLE fornecedores ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE fornecedores ADD COLUMN IF NOT EXISTS rua TEXT;
ALTER TABLE fornecedores ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE fornecedores ADD COLUMN IF NOT EXISTS bairro TEXT;
ALTER TABLE fornecedores ADD COLUMN IF NOT EXISTS complemento TEXT;

-- 2. Vínculo de fornecedor na tabela produtos
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS fornecedor_id UUID REFERENCES fornecedores(id) ON DELETE SET NULL;
