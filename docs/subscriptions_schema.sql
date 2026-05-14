-- ================================================================
-- KDL Store — Tabela de Assinaturas
-- Execute no Supabase: SQL Editor → New Query → Run
-- ================================================================

-- Tabela de assinaturas (1 por empresa)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id          uuid NOT NULL UNIQUE REFERENCES public.empresas(id) ON DELETE CASCADE,
  plano               text NOT NULL CHECK (plano IN ('start', 'pro')),
  status              text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled')),
  preco               integer NOT NULL, -- centavos: 6500 = R$ 65
  inicio              timestamptz NOT NULL DEFAULT now(),
  proximo_pagamento   timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  cancelado_em        timestamptz,
  criado_em           timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Membros da empresa podem ver sua assinatura
CREATE POLICY "subscription_select" ON public.subscriptions
  FOR SELECT USING (
    empresa_id IN (SELECT empresa_id FROM public.profiles WHERE id = auth.uid())
  );

-- Só admin da empresa pode criar assinatura
CREATE POLICY "subscription_insert" ON public.subscriptions
  FOR INSERT WITH CHECK (
    empresa_id IN (SELECT empresa_id FROM public.profiles WHERE id = auth.uid() AND papel = 'admin')
  );

-- Só admin pode atualizar
CREATE POLICY "subscription_update" ON public.subscriptions
  FOR UPDATE USING (
    empresa_id IN (SELECT empresa_id FROM public.profiles WHERE id = auth.uid() AND papel = 'admin')
  );

-- Trigger: sincronizar empresas.plano quando subscription muda
CREATE OR REPLACE FUNCTION sync_empresa_plano()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.empresas
  SET plano = CASE
    WHEN NEW.status = 'active' THEN NEW.plano
    ELSE 'nenhum'
  END
  WHERE id = NEW.empresa_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_subscription_change
  AFTER INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION sync_empresa_plano();

-- Atualizar default do campo plano em empresas
ALTER TABLE public.empresas ALTER COLUMN plano SET DEFAULT 'nenhum';
