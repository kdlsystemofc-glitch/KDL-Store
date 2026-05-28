-- ═══════════════════════════════════════════════════════════════════
-- SCRIPT DE SEGURANÇA: Proteção do plano e faturamento (Stripe)
-- Execute no Supabase SQL Editor: https://supabase.com/dashboard/project/jcgbqqvlcbwnewzqigya/sql/new
-- ═══════════════════════════════════════════════════════════════════

-- 1. Restringe a política de segurança da tabela subscriptions para SELECT apenas
DROP POLICY IF EXISTS "sub_minha_empresa" ON subscriptions;
CREATE POLICY "sub_minha_empresa" ON subscriptions
  FOR SELECT USING (empresa_id = minha_empresa_id());

-- 2. Cria a função de trigger para impedir alteração de campos sensíveis de faturamento por usuários comuns
CREATE OR REPLACE FUNCTION check_security_billing_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o papel de autenticação for diferente de 'service_role' (usado por rotas backend admin), bloqueia
  IF auth.role() <> 'service_role' THEN
    -- Na tabela empresas, o plano não pode ser alterado por usuários comuns via RLS/client-side
    IF TG_TABLE_NAME = 'empresas' THEN
      IF OLD.plano IS DISTINCT FROM NEW.plano THEN
        RAISE EXCEPTION 'Apenas o gateway de pagamento (Stripe) pode alterar o plano da empresa diretamente.';
      END IF;
    END IF;

    -- Na tabela subscriptions, nenhum campo crítico de faturamento pode ser alterado por usuários comuns
    IF TG_TABLE_NAME = 'subscriptions' THEN
      IF OLD.plano IS DISTINCT FROM NEW.plano OR
         OLD.status IS DISTINCT FROM NEW.status OR
         OLD.stripe_subscription_id IS DISTINCT FROM NEW.stripe_subscription_id OR
         OLD.stripe_customer_id IS DISTINCT FROM NEW.stripe_customer_id OR
         OLD.stripe_price_id IS DISTINCT FROM NEW.stripe_price_id THEN
        RAISE EXCEPTION 'Apenas o sistema de cobrança (Stripe) pode gerenciar as informações da assinatura.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Associa o gatilho à tabela empresas
DROP TRIGGER IF EXISTS trg_proteger_plano_empresa ON empresas;
CREATE TRIGGER trg_proteger_plano_empresa
  BEFORE UPDATE ON empresas
  FOR EACH ROW
  EXECUTE FUNCTION check_security_billing_fields();

-- 4. Associa o gatilho à tabela subscriptions
DROP TRIGGER IF EXISTS trg_proteger_sub_campos ON subscriptions;
CREATE TRIGGER trg_proteger_sub_campos
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION check_security_billing_fields();

-- 5. Verificação final
SELECT tgname, tgrelid::regclass, tgenabled FROM pg_trigger WHERE tgname IN ('trg_proteger_plano_empresa', 'trg_proteger_sub_campos');
