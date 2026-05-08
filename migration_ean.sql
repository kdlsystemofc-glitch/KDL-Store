ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS ean TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS produtos_ean_empresa_idx ON public.produtos(empresa_id, ean) WHERE ean IS NOT NULL;
