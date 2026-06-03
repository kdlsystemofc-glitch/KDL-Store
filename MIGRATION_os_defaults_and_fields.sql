-- ─────────────────────────────────────────────────────────────
-- MIGRATION: REMOVE DEFAULT SERIAL SEQUENCES & ADD FIELDS
-- ─────────────────────────────────────────────────────────────

-- 1. Remove default sequence constraints so trigger set_venda_numero / set_os_numero can execute correctly
ALTER TABLE public.vendas ALTER COLUMN numero DROP DEFAULT;
ALTER TABLE public.ordens_servico ALTER COLUMN numero DROP DEFAULT;

-- 2. Add columns for OS payment method and parts cost
ALTER TABLE public.ordens_servico ADD COLUMN IF NOT EXISTS forma_pagamento TEXT;
ALTER TABLE public.ordens_servico ADD COLUMN IF NOT EXISTS custo_pecas NUMERIC(12,2) DEFAULT 0;

-- 3. Correct sequence numbers for existing test OS (Renumber OS #0004 to #0001)
UPDATE public.ordens_servico SET numero = 1 WHERE numero = 4;
