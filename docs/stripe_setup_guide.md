# Guia Definitivo: Configurando Stripe, Vercel e Supabase

Como você já criou a conta no Stripe (em modo teste) e já criou os 2 produtos (Start e Pro), vamos focar em como conectar tudo! Siga este guia com calma, copiando e colando as chaves nos lugares certos.

---

## PASSO 1: Preparar o Banco de Dados (Supabase)

Primeiro, precisamos criar as colunas que vão receber os dados do Stripe.

1. Acesse o **[Painel do Supabase](https://supabase.com/dashboard)** e abra o seu projeto.
2. No menu lateral esquerdo, clique em **SQL Editor** (o ícone de código `</>`).
3. Clique em **+ New Query**.
4. Cole exatamente este código abaixo:
   ```sql
   ALTER TABLE subscriptions 
   ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
   ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE,
   ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
   ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false,
   ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

   CREATE INDEX IF NOT EXISTS idx_sub_stripe_customer ON subscriptions(stripe_customer_id);
   CREATE INDEX IF NOT EXISTS idx_sub_stripe_sub ON subscriptions(stripe_subscription_id);
   ```
5. Clique no botão verde **Run** (ou pressione `Ctrl + Enter`). Você deve ver a mensagem "Success. No rows returned".

---

## PASSO 2: Pegar as Chaves do Supabase

Você vai precisar de 3 chaves do Supabase para colocar na Vercel.

1. No Supabase, vá em **Project Settings** (ícone de engrenagem no menu lateral, lá embaixo).
2. Clique em **API** no submenu de configurações.
3. Copie e anote os 3 valores abaixo (salve num bloco de notas temporário):
   - **Project URL:** Sua URL (ex: `https://xxxx.supabase.co`) → *Esta é a `NEXT_PUBLIC_SUPABASE_URL`*
   - **Project API Keys (anon / public):** → *Esta é a `NEXT_PUBLIC_SUPABASE_ANON_KEY`*
   - **Project API Keys (service_role / secret):** (Talvez você precise clicar no olho para revelar) → *Esta é a `SUPABASE_SERVICE_ROLE_KEY`*
     > ⚠️ **Atenção:** A `service_role` é super secreta. É ela que permite ao Webhook mudar os planos sem estar logado no sistema. Nunca revele ela publicamente.

---

## PASSO 3: Pegar as Chaves e IDs no Stripe

Vamos coletar tudo que precisamos do painel do Stripe. Garanta que a chave **"Modo de teste" (Test mode)** no canto superior direito esteja **ativada**.

### 3.1: Chaves da API
1. No menu superior do Stripe, clique em **Desenvolvedores** (Developers).
2. Vá na aba **Chaves de API** (API keys).
3. Copie as duas chaves:
   - **Chave publicável (Publishable key):** Começa com `pk_test_...` → *Esta é a `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`*
   - **Chave secreta (Secret key):** Clique para revelar e copiar. Começa com `sk_test_...` → *Esta é a `STRIPE_SECRET_KEY`*

### 3.2: IDs dos Preços (Products)
Como você já criou os produtos:
1. No Stripe, vá em **Catálogo de produtos > Produtos**.
2. Clique no produto **KDL Store Start**.
3. Na seção de preços, clique nos 3 pontinhos e depois em **Copiar ID do preço** (ou clique diretamente em cima do código que começa com `price_...`).
   - Anote no bloco de notas: → *Este é o `STRIPE_PRICE_START`*
4. Volte, clique no produto **KDL Store Pro**.
5. Copie o ID do preço dele: → *Este é o `STRIPE_PRICE_PRO`*

### 3.3: Configurar o Portal do Cliente (Billing Portal)
1. No Stripe, vá na barra de busca superior e digite **"Customer portal"** e clique na opção.
2. Ative o portal de testes.
3. Marque que o cliente pode **cancelar assinaturas** e **atualizar formas de pagamento**.
4. Defina a política de cancelamento para o final do ciclo de faturamento (At end of billing period).
5. Salve as alterações. Se não fizer isso, o botão "Gerenciar assinatura" da sua loja dará erro.

---

## PASSO 4: Adicionar as Variáveis na Vercel

Agora vamos colocar todos esses dados na hospedagem.

1. Acesse o **[Painel da Vercel](https://vercel.com/dashboard)** e clique no projeto da `KDL Store`.
2. Vá na aba **Settings** e depois clique em **Environment Variables** no menu lateral esquerdo.
3. Você precisa adicionar (ou atualizar) **exatamente** as seguintes variáveis uma a uma:

| Key (Nome) | Value (Valor anotado do bloco de notas) |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | A sua URL do Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sua anon_key do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Sua service_role key do Supabase |
| `STRIPE_SECRET_KEY` | Sua chave `sk_test_...` do Stripe |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`| Sua chave `pk_test_...` do Stripe |
| `STRIPE_PRICE_START` | ID do preço Start (`price_...`) |
| `STRIPE_PRICE_PRO` | ID do preço Pro (`price_...`) |
| `NEXT_PUBLIC_SITE_URL` | A URL do seu site (ex: `https://kdl-store.vercel.app`) |

> ⏳ Depois de adicionar todas, não saia da Vercel ainda! Precisamos de mais uma para o Webhook.

---

## PASSO 5: Configurar o Webhook no Stripe

O Webhook é o "carteiro" que avisa seu sistema que o cliente pagou. Sem ele, o cliente paga, mas o painel da KDL Store não é liberado.

1. No Stripe, vá em **Desenvolvedores > Webhooks**.
2. Clique no botão **Adicionar endpoint** (Add endpoint).
3. Em **Endpoint URL**, cole a URL da sua Vercel somada de `/api/stripe/webhook`
   - *Exemplo:* `https://kdl-store.vercel.app/api/stripe/webhook`
4. Na seção "Eventos a serem enviados" (Select events to listen to), selecione **exatamente** estes 5 eventos:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Clique em **Adicionar endpoint**.
6. Na tela do webhook que acabou de ser criado, procure pela seção **Segredo de Assinatura** (Signing secret) e clique em **Revelar** (Reveal).
7. Copie essa chave que começa com `whsec_...`
8. Volte correndo para a **Vercel > Environment Variables** e adicione a última variável:
   - **Key:** `STRIPE_WEBHOOK_SECRET`
   - **Value:** `whsec_...` (A chave que você acabou de copiar)

---

## PASSO 6: O REDEPLOY MÁGICO

Como você alterou as variáveis de ambiente, a Vercel precisa reiniciar seu sistema para puxar as novas chaves.

1. Na Vercel, clique na aba **Deployments** do seu projeto.
2. Clique nos 3 pontinhos do deployment mais recente no topo da lista.
3. Selecione **Redeploy**.
4. Aguarde o build finalizar (cerca de 1 minuto).

---

## 🎉 Tudo Pronto! Como Testar?

1. Entre no seu site na Vercel e faça o login com uma conta de teste.
2. Quando a tela de Assinatura aparecer, clique em "Começar com Pro".
3. Você será redirecionado para a página de checkout oficial do Stripe.
4. **Para testar pagamento com sucesso:** use os números de cartão de teste do Stripe. Digite o cartão `4242 4242 4242 4242`, valide como qualquer mês/ano no futuro (ex: `12/34`) e qualquer CVC (ex: `123`).
5. Clique em assinar.
6. Você será redirecionado de volta para o Dashboard e verá o botão de sucesso! (Seu webhook comunicou perfeitamente ao Supabase).

Quando for passar para produção (vender de verdade), basta desligar o "Modo de Teste" no Stripe, criar os produtos na conta oficial e trocar todas as chaves (que não terão mais a palavra `test`) lá na Vercel, gerando um novo webhook real.
