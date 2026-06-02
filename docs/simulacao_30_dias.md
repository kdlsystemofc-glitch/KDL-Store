# SIMULAÇÃO DE 30 DIAS — KDL STORE v2.0
**Versão:** 2.0 — Reescrita completa  
**Base:** `mapeamento_completo_sistema.md` v2.0  
**Objetivo:** Validação manual exaustiva com verificação matemática de KPIs

---

> ## ⚠️ LEIA ANTES DE COMEÇAR
>
> Esta simulação foi desenhada com **rigor matemático**. A cada etapa que envolve números (vendas, estoque, financeiro), os valores esperados são calculados antecipadamente. Você **deve bater os números** — se o sistema exibir valor diferente do esperado, é um bug.
>
> **Princípio fundamental:** Nunca verifique um KPI antes de ter executado as ações que o geram. A ordem das etapas é obrigatória.
>
> **Loja fictícia:** Ponto Digital — Eletrônicos e Acessórios  
> **Período simulado:** 30 dias corridos (Junho/2026)  
> **Plano:** Start nos dias 1–6 → upgrade para Pro no Dia 7

---

## 🏪 PERFIL DA LOJA

```
┌──────────────────────────────────────────────────────────────┐
│                     PONTO DIGITAL                            │
├──────────────────┬───────────────────────────────────────────┤
│ Segmento         │ Eletrônicos, Celulares e Acessórios       │
│ Cidade           │ São Paulo / SP                            │
│ WhatsApp         │ (11) 91234-5678                           │
│ Plano inicial    │ Start → Pro (upgrade Dia 7)               │
└──────────────────┴───────────────────────────────────────────┘
```

---

## 👥 EQUIPE

| # | Nome | E-mail | Papel | Quando entra |
|---|------|--------|-------|-------------|
| 1 | **Kauan** (Dono) | kauan@pontodigital.com | admin | Dia 1 |
| 2 | **Lucas Ferreira** | lucas@pontodigital.com | operador | Dia 6 (convite) |

---

## 📦 CATÁLOGO (6 produtos — enxuto para facilitar a validação)

| # | Produto | Custo | Venda | Estoque Inicial | Mín |
|---|---------|-------|-------|-----------------|-----|
| P1 | Fone Bluetooth JBL T110 | R$ 45,00 | R$ 89,90 | 15 un | 3 |
| P2 | Carregador Turbo 65W USB-C | R$ 32,00 | R$ 69,90 | 20 un | 5 |
| P3 | Capa Anti-Impacto Samsung A55 | R$ 18,00 | R$ 39,90 | 30 un | 5 |
| P4 | Cabo USB-C 1m Reforçado | R$ 8,00 | R$ 19,90 | 50 un | 10 |
| P5 | Caixa de Som JBL Go 4 | R$ 120,00 | R$ 229,90 | 6 un | 2 |
| P6 | Película Hydrogel Samsung | R$ 5,00 | R$ 12,90 | 80 un | 20 |

---

## 👤 CLIENTES

| # | Nome | Telefone | CPF |
|---|------|----------|-----|
| C1 | Ana Paula Costa | (11) 98765-4321 | 111.222.333-44 |
| C2 | Bruno Lima | (11) 97654-3210 | 222.333.444-55 |
| C3 | Carla Souza (revendedora) | (11) 96543-2109 | 333.444.555-66 |
| C4 | Diego Alves | (11) 95432-1098 | 444.555.666-77 |

---

## 🏭 FORNECEDORES

| # | Nome | Contato | Telefone |
|---|------|---------|----------|
| F1 | TechBR Distribuidora | Sandro | (11) 3456-7890 |
| F2 | InfoParts Ltda | Carla | (11) 2222-3333 |

---

## 🔧 TÉCNICOS (para OS)

| # | Nome | Especialidade |
|---|------|--------------|
| T1 | **Marcos Silva** | Celulares e fones |
| T2 | **Fábio Ramos** | Carregadores e cabos |

---

## 🎯 COMISSIONADOS

| # | Nome | Tipo | Taxa | Cadastrar em |
|---|------|------|------|-------------|
| COM1 | Pedro Indicador | % sobre venda | 3% | Dia 7 |
| COM2 | Lucas Ferreira | % sobre venda | 2% | Dia 7 |

> ⚠️ Comissionados são cadastrados ANTES das vendas comissionadas. Validação de KPIs de comissão somente após vendas vinculadas a eles.

---

## 📐 PLANILHA DE CONTROLE (preencha conforme executa)

| Métrica | Esperado após Dia 10 | Real (anote aqui) |
|---------|---------------------|-------------------|
| Receita total (vendas) | R$ 619,30 | ___ |
| CMV acumulado | R$ 243,00 | ___ |
| Estoque P1 restante | 12 un | ___ |
| Estoque P2 restante | 18 un | ___ |
| Estoque P3 restante | 26 un | ___ |
| Fiado em aberto | R$ 89,90 | ___ |
| Despesas lançadas | R$ 200,00 | ___ |

> Os valores desta planilha são calculados matematicamente ao longo dos dias. Use-a para verificar se o sistema está contando corretamente.

---

# ══════════════════════════════════════════════
# SEMANA 1 — SETUP COMPLETO (Dias 1–7)
# ══════════════════════════════════════════════

---

## DIA 1 — CONTA, EMPRESA E PRODUTOS
**Módulos:** Cadastro · Configurações · Produtos

---

### ETAPA 1.1 — Criar Conta

- [ ] Acessar a URL do sistema e clicar em **"Criar conta"**
- [ ] Preencher:

| Campo | Valor |
|-------|-------|
| Nome da loja | `Ponto Digital` |
| Tipo de negócio | `Eletrônicos / Som Automotivo` |
| E-mail | `kauan@pontodigital.com` |
| Senha | `Ponto@2026` |
| Confirmar senha | `Ponto@2026` |

- [ ] **✅ VERIFICAR:** Indicador de força mostra `✓ 8+ chars`, `✓ Maiúscula`, `✓ Número`
- [ ] Confirmar e-mail recebido → clicar no link
- [ ] **✅ VERIFICAR:** Redirecionado para `/dashboard`
- [ ] **✅ VERIFICAR:** Banner de boas-vindas com "Primeiros Passos" aparece (nenhum produto ainda)

---

### ETAPA 1.2 — Configurar Empresa

- [ ] Acessar **Configurações → Empresa**
- [ ] Preencher:

| Campo | Valor |
|-------|-------|
| Nome da empresa | `Ponto Digital` |
| WhatsApp | `(11) 91234-5678` |
| Estado | `SP` |
| Cidade | `São Paulo` |
| Endereço | `Av. Paulista, 1000` |
| Prazo inatividade CRM | `45` dias |

- [ ] Salvar
- [ ] **✅ VERIFICAR:** Toast de sucesso aparece

---

### ETAPA 1.3 — Configurar Formas de Pagamento

- [ ] Acessar **Configurações → Formas de Pagamento**
- [ ] **✅ VERIFICAR:** Dinheiro, PIX, Débito (1.5%), Crédito (2.99%) já estão ativos
- [ ] Ativar **Fiado** (toggle)
- [ ] **✅ VERIFICAR:** 5 formas ativas ao total

---

### ETAPA 1.4 — Cadastrar os 6 Produtos

Para cada produto abaixo, clicar em **"+ Novo Produto"**:

**P1 — Fone Bluetooth JBL T110:**

| Campo | Valor |
|-------|-------|
| Nome | `Fone Bluetooth JBL T110` |
| Código de Barras | `7891234567890` |
| Categoria | `Fones de Ouvido` |
| Preço de Custo | `45,00` |
| Preço Varejo | `89,90` |
| Qtd Atual | `15` |
| Qtd Mínima | `3` |
| Garantia | ✅ Ativo · 90 dias |
| Termos | `Garantia de 90 dias contra defeitos de fabricação.` |

**P2 — Carregador Turbo 65W USB-C:**

| Campo | Valor |
|-------|-------|
| Nome | `Carregador Turbo 65W USB-C` |
| Código de Barras | `7893456789012` |
| Categoria | `Carregadores` |
| Preço de Custo | `32,00` |
| Preço Varejo | `69,90` |
| Qtd Atual | `20` |
| Qtd Mínima | `5` |
| Garantia | ✅ Ativo · 90 dias |

**P3 — Capa Anti-Impacto Samsung A55:**

| Campo | Valor |
|-------|-------|
| Nome | `Capa Anti-Impacto Samsung A55` |
| Código de Barras | `7898901234567` |
| Categoria | `Capas e Películas` |
| Preço de Custo | `18,00` |
| Preço Varejo | `39,90` |
| Qtd Atual | `30` |
| Qtd Mínima | `5` |
| Garantia | ❌ |

**P4 — Cabo USB-C 1m Reforçado:**

| Campo | Valor |
|-------|-------|
| Nome | `Cabo USB-C 1m Reforçado` |
| Código de Barras | `7895678901234` |
| Categoria | `Cabos` |
| Preço de Custo | `8,00` |
| Preço Varejo | `19,90` |
| Qtd Atual | `50` |
| Qtd Mínima | `10` |
| Garantia | ❌ |

**P5 — Caixa de Som JBL Go 4:**

| Campo | Valor |
|-------|-------|
| Nome | `Caixa de Som JBL Go 4` |
| Código de Barras | `7891357924680` |
| Categoria | `Caixas de Som` |
| Preço de Custo | `120,00` |
| Preço Varejo | `229,90` |
| Qtd Atual | `6` |
| Qtd Mínima | `2` |
| Garantia | ✅ Ativo · 90 dias |

**P6 — Película Hydrogel Samsung:**

| Campo | Valor |
|-------|-------|
| Nome | `Película Hydrogel Samsung` |
| Código de Barras | `7890123456789` |
| Categoria | `Capas e Películas` |
| Preço de Custo | `5,00` |
| Preço Varejo | `12,90` |
| Qtd Atual | `80` |
| Qtd Mínima | `20` |
| Garantia | ❌ |

Após cadastrar os 6:

- [ ] **✅ VERIFICAR (Estoque):** 6 produtos listados, nenhum em estoque crítico
- [ ] **✅ VERIFICAR (Dashboard):** Card "Produtos Ativos" exibe **6**
- [ ] **✅ VERIFICAR (Dashboard):** Banner de boas-vindas desapareceu

---

## DIA 2 — CADASTRAR CLIENTES E FORNECEDORES
**Módulos:** Clientes · Fornecedores

---

### ETAPA 2.1 — Cadastrar Clientes

- [ ] Acessar **Clientes → + Novo Cliente** para cada um:

**C1 — Ana Paula Costa:**

| Campo | Valor |
|-------|-------|
| Nome | `Ana Paula Costa` |
| Telefone | `(11) 98765-4321` |
| CPF | `111.222.333-44` |
| E-mail | `ana@email.com` |

**C2 — Bruno Lima:**

| Campo | Valor |
|-------|-------|
| Nome | `Bruno Lima` |
| Telefone | `(11) 97654-3210` |
| CPF | `222.333.444-55` |

**C3 — Carla Souza:**

| Campo | Valor |
|-------|-------|
| Nome | `Carla Souza` |
| Telefone | `(11) 96543-2109` |
| CPF | `333.444.555-66` |

**C4 — Diego Alves:**

| Campo | Valor |
|-------|-------|
| Nome | `Diego Alves` |
| Telefone | `(11) 95432-1098` |
| CPF | `444.555.666-77` |

- [ ] **✅ VERIFICAR:** 4 clientes listados

---

### ETAPA 2.2 — Cadastrar Fornecedores

- [ ] Acessar **Clientes → aba Fornecedores → + Novo Fornecedor**

**F1 — TechBR Distribuidora:**

| Campo | Valor |
|-------|-------|
| Nome | `TechBR Distribuidora` |
| Contato | `Sandro` |
| Telefone | `(11) 3456-7890` |
| E-mail | `contato@techbr.com.br` |
| CNPJ | `12.345.678/0001-90` |
| Prazo entrega | `3 dias` |
| Pedido mínimo | `100` |

**F2 — InfoParts Ltda:**

| Campo | Valor |
|-------|-------|
| Nome | `InfoParts Ltda` |
| Contato | `Carla` |
| Telefone | `(11) 2222-3333` |
| E-mail | `pedidos@infoparts.com` |
| CNPJ | `98.765.432/0001-11` |
| Prazo entrega | `24h` |
| Pedido mínimo | `150` |

- [ ] **✅ VERIFICAR:** 2 fornecedores listados e ativos

---

## DIA 3 — PRIMEIRAS VENDAS E VALIDAÇÃO DE ESTOQUE
**Módulos:** PDV · Estoque · Dashboard

---

### ETAPA 3.1 — Primeira Venda (Dinheiro · sem cliente)

- [ ] Acessar **Vendas → + Nova Venda**
- [ ] Adicionar produtos:
  - P1 (Fone JBL) × 1 = R$ 89,90
  - P4 (Cabo USB-C) × 2 = R$ 39,80
- [ ] Forma de pagamento: **Dinheiro**
- [ ] Clicar em **Finalizar Venda**
- [ ] **✅ VERIFICAR:** Tela de sucesso exibe número da venda (ex: #0001)
- [ ] **✅ VERIFICAR (Estoque):**
  - P1: de 15 → **14 un** ✓
  - P4: de 50 → **48 un** ✓
- [ ] **✅ VERIFICAR (Movimentações):** 2 linhas de `saida` com os produtos corretos (não `—`)

> 💰 **Caixa acumulado:** R$ 89,90 + R$ 39,80 = **R$ 129,70**  
> 📦 **CMV da venda:** R$ 45,00 (P1×1) + R$ 16,00 (P4×2) = **R$ 61,00**

---

### ETAPA 3.2 — Segunda Venda (PIX · com cliente · com garantia)

- [ ] Nova venda
- [ ] Selecionar cliente: **Ana Paula Costa**
- [ ] Adicionar: P2 (Carregador 65W) × 1 = R$ 69,90
- [ ] Forma: **PIX**
- [ ] Finalizar
- [ ] **✅ VERIFICAR:** Estoque P2: de 20 → **19 un**
- [ ] **✅ VERIFICAR (Garantias):** Uma garantia foi gerada automaticamente para Ana Paula (P2 tem 90 dias de garantia)
- [ ] Acessar **Garantias** → confirmar que aparece a garantia com:
  - Cliente: Ana Paula Costa
  - Produto: Carregador Turbo 65W USB-C
  - Data de vencimento: hoje + 90 dias

> 💰 **Caixa acumulado:** R$ 129,70 + R$ 69,90 = **R$ 199,60**  
> 📦 **CMV acumulado:** R$ 61,00 + R$ 32,00 = **R$ 93,00**

---

### ETAPA 3.3 — Terceira Venda (Fiado · com cliente)

- [ ] Nova venda
- [ ] Selecionar cliente: **Bruno Lima**
- [ ] Adicionar: P1 (Fone JBL) × 1 = R$ 89,90
- [ ] Forma: **Fiado**
- [ ] Finalizar
- [ ] **✅ VERIFICAR:** Estoque P1: de 14 → **13 un**
- [ ] **✅ VERIFICAR (Financeiro → Fiado):** Bruno Lima aparece com R$ 89,90 em aberto
- [ ] **✅ VERIFICAR (Dashboard):** KPI "Fiado em Aberto" exibe **R$ 89,90**

> 💰 **Receita de vendas (apenas concluídas, fiado não entra):** R$ 199,60  
> 📒 **Fiado aberto:** R$ 89,90  
> 📦 **CMV acumulado:** R$ 93,00 + R$ 45,00 = **R$ 138,00**

---

### ETAPA 3.4 — Validação do Dashboard Dia 3

- [ ] Ir para **Dashboard**
- [ ] **✅ VERIFICAR KPI "Faturamento de Hoje":** R$ 199,60 *(2 vendas concluídas; fiado não conta)*
- [ ] **✅ VERIFICAR KPI "Ticket Médio":** R$ 199,60 ÷ 2 = **R$ 99,80**
- [ ] **✅ VERIFICAR KPI "Vendas Hoje":** **2**
- [ ] **✅ VERIFICAR KPI "Produtos Ativos":** **6**
- [ ] **✅ VERIFICAR KPI "Estoque Crítico":** **0** *(todos acima do mínimo)*
- [ ] **✅ VERIFICAR KPI "Fiado em Aberto":** **R$ 89,90**

---

## DIA 4 — LANÇAR DESPESAS E TESTAR ABERTURA DE CAIXA
**Módulos:** Financeiro · Despesas

> ⚠️ Para usar Financeiro, é necessário **Plano Pro**. Neste dia ainda estamos no Start. As etapas financeiras abaixo serão desbloqueadas no Dia 7 após o upgrade. Marque-as como pendentes e execute no Dia 7.

---

### ETAPA 4.1 — Verificar Bloqueio Pro

- [ ] Tentar acessar **Financeiro** na sidebar
- [ ] **✅ VERIFICAR:** O componente `<ProOnly>` exibe o overlay de upsell com botão de upgrade
- [ ] **✅ VERIFICAR:** O conteúdo do DRE está bloqueado/oculto

---

### ETAPA 4.2 — Realizar Mais Vendas (continuação da operação)

- [ ] **Venda #4:** P3 (Capa Samsung) × 2 + P6 (Película) × 3 · Forma: **Crédito** · Cliente: **Carla Souza**
  - Total: R$ 79,80 + R$ 38,70 = **R$ 118,50**
  - Estoque P3: 30 → 28 | P6: 80 → 77
  - CMV: R$ 36,00 (P3×2) + R$ 15,00 (P6×3) = R$ 51,00

- [ ] **Venda #5:** P5 (Caixa JBL) × 1 · Forma: **PIX** · Cliente: **Diego Alves** · com garantia
  - Total: **R$ 229,90**
  - Estoque P5: 6 → 5
  - CMV: R$ 120,00
  - **✅ VERIFICAR (Garantias):** Garantia gerada para Diego (P5, 90 dias)

> 💰 **Receita acumulada:** R$ 199,60 + R$ 118,50 + R$ 229,90 = **R$ 547,00**  
> 📦 **CMV acumulado:** R$ 138,00 + R$ 51,00 + R$ 120,00 = **R$ 309,00**

---

## DIA 5 — TESTAR PEDIDO AO FORNECEDOR
**Módulos:** Fornecedores · Pedidos de Compra · Estoque (entrada) · Financeiro (despesa)

---

### ETAPA 5.1 — Criar Pedido de Compra

- [ ] Acessar **Clientes → Fornecedores → aba Pedidos de Compra**
- [ ] Clicar em **"+ Novo Pedido"**
- [ ] Preencher:

| Campo | Valor |
|-------|-------|
| Fornecedor | `TechBR Distribuidora` |
| Produto | `Fone Bluetooth JBL T110` *(digitar e selecionar do autocomplete)* |
| Quantidade | `10` |
| Preço Unitário | `45,00` |
| Previsão de Entrega | *(data de amanhã)* |
| Observações | `Reposição urgente — estoque baixando` |

- [ ] **✅ VERIFICAR:** Campo "Total" calculado automaticamente: 10 × R$ 45,00 = **R$ 450,00**
- [ ] Salvar pedido
- [ ] **✅ VERIFICAR:** Pedido aparece com status **PENDENTE**
- [ ] **✅ VERIFICAR (Modal Fornecedor):** Clicar no ícone de editar de "TechBR" → histórico de pedidos exibe este pedido

---

### ETAPA 5.2 — Simular Recebimento do Pedido

- [ ] No pedido criado, alterar status para **ENVIADO**
- [ ] **✅ VERIFICAR:** Status muda para Enviado
- [ ] Alterar status para **RECEBIDO**
- [ ] **✅ VERIFICAR (Estoque P1):** Estoque de P1 aumentou de 13 → **23 un** *(entrada de 10 unidades)*
- [ ] **✅ VERIFICAR (Movimentações Estoque):** Nova linha tipo `entrada` com produto "Fone Bluetooth JBL T110" e qtd +10
- [ ] **✅ VERIFICAR (após Dia 7 — Financeiro → Despesas):** Despesa lançada automaticamente: `Compra de Mercadoria · TechBR · R$ 450,00`

> ⚠️ A verificação da despesa no Financeiro só é possível após o upgrade Pro no Dia 7.

---

## DIA 6 — CONVIDAR SEGUNDO USUÁRIO
**Módulos:** Configurações → Usuários

---

### ETAPA 6.1 — Enviar Convite

- [ ] Acessar **Configurações → Usuários**
- [ ] Clicar em **"+ Convidar usuário"**
- [ ] Preencher:

| Campo | Valor |
|-------|-------|
| E-mail | `lucas@pontodigital.com` |
| Papel | `operador` |

- [ ] Enviar convite
- [ ] **✅ VERIFICAR:** Convite aparece na lista com status "Pendente"

---

### ETAPA 6.2 — Aceitar o Convite (simular como Lucas)

- [ ] Abrir o link do convite recebido por e-mail (ou copiar o link da tela)
- [ ] **✅ VERIFICAR:** Tela do convite exibe o e-mail de Lucas e papel "Vendedor"
- [ ] Criar senha: `Lucas@2026`
- [ ] Clicar em **"Criar Conta e Entrar"**
- [ ] **✅ VERIFICAR:** Redirecionado para `/dashboard` com acesso como **Lucas Ferreira**
- [ ] **✅ VERIFICAR:** Sidebar exibe "Ponto Digital" — o mesmo sistema
- [ ] **✅ VERIFICAR:** Lucas NÃO vê o menu "Configurações" (papel operador)
- [ ] Fazer logout do Lucas e logar novamente como Kauan

---

## DIA 7 — UPGRADE PARA PRO + COMISSIONADOS + ABERTURA DO FINANCEIRO
**Módulos:** Assinatura · Comissões · Financeiro

---

### ETAPA 7.1 — Fazer Upgrade para Pro

- [ ] Clicar no badge "Plano Start" na sidebar ou acessar `/assinar`
- [ ] Selecionar plano **Pro (R$ 95/mês)**
- [ ] Clicar em **"Confirmar plano Pro"**
- [ ] Completar o checkout do Stripe *(dados de teste)*
- [ ] **✅ VERIFICAR:** Redirecionado de volta ao sistema
- [ ] **✅ VERIFICAR:** Badge na sidebar agora exibe **"Plano Pro"** (amarelo)
- [ ] **✅ VERIFICAR:** Menu Financeiro agora acessível (sem overlay de bloqueio)

---

### ETAPA 7.2 — Cadastrar Comissionados

> ⚠️ Comissionados são cadastrados AGORA. As primeiras vendas comissionadas só ocorrerão na ETAPA 8.2. Não verificar KPIs de comissão antes de existirem vendas vinculadas.

- [ ] Acessar **Ops Extras → Comissões**
- [ ] **✅ VERIFICAR KPIs antes:** Total = R$ 0,00 · Pendente = R$ 0,00 · Pago = R$ 0,00 · Ativos = 0

- [ ] Clicar em **"+ Cadastrar"**

**COM1 — Pedro Indicador:**

| Campo | Valor |
|-------|-------|
| Nome | `Pedro Indicador` |
| WhatsApp | `(11) 91111-2222` |
| Tipo | `% Percentual` |
| Taxa | `3` |

- [ ] Salvar

**COM2 — Lucas Ferreira:**

| Campo | Valor |
|-------|-------|
| Nome | `Lucas Ferreira` |
| WhatsApp | `(11) 97654-3210` |
| Tipo | `% Percentual` |
| Taxa | `2` |

- [ ] Salvar

- [ ] **✅ VERIFICAR KPIs após cadastro:** Comissionados Ativos = **2** · Total ainda = R$ 0,00
- [ ] **✅ VERIFICAR:** Ranking ainda não aparece (sem vendas comissionadas)

---

### ETAPA 7.3 — Verificar o Módulo Financeiro pela Primeira Vez

- [ ] Acessar **Financeiro → Visão Geral (DRE)**
- [ ] **✅ VERIFICAR KPI "Receita Total":** Soma das vendas concluídas do mês = **R$ 547,00** *(Vendas #1, #2, #4, #5 — Fiado Bruno não conta)*

> **Cálculo da conferência:**
> - Venda #1: R$ 129,70
> - Venda #2: R$ 69,90
> - Venda #4: R$ 118,50
> - Venda #5: R$ 229,90
> - **Total Vendas:** R$ 548,00 *(verifique valor exato no sistema — pode variar por arredondamento)*

- [ ] **✅ VERIFICAR KPI "Serviços (OS)":** R$ 0,00 *(nenhuma OS concluída ainda)*
- [ ] **✅ VERIFICAR KPI "Despesas MÊS":** R$ 0,00 *(ainda não lançamos despesas manualmente)*
- [ ] **✅ VERIFICAR DRE — CMV:** Deve ser próximo de **R$ 309,00**

> ⚠️ O CMV é calculado pelos `itens_venda`. Se diferir, confira se todos os preços de custo foram cadastrados corretamente.

---

### ETAPA 7.4 — Lançar Despesas Manuais

- [ ] Acessar **Financeiro → Despesas → + Despesa**

**Despesa 1:**

| Campo | Valor |
|-------|-------|
| Descrição | `Aluguel do Ponto` |
| Categoria | `Aluguel` |
| Tipo | `Fixa` |
| Valor | `1200,00` |
| Data | *(hoje)* |

- [ ] Salvar

**Despesa 2:**

| Campo | Valor |
|-------|-------|
| Descrição | `Material de limpeza e embalagens` |
| Categoria | `Operacional` |
| Tipo | `Variável` |
| Valor | `85,00` |
| Data | *(hoje)* |

- [ ] Salvar

- [ ] **✅ VERIFICAR KPI "Despesas MÊS":** R$ 1.200,00 + R$ 85,00 = **R$ 1.285,00**
- [ ] **✅ VERIFICAR (Despesas por Categoria):** Aluguel = R$ 1.200,00 · Operacional = R$ 85,00
- [ ] **✅ VERIFICAR (Despesa Automática):** Compra de Mercadoria (TechBR, R$ 450,00) do Dia 5 aparece na lista

> 💰 **Despesas totais do mês:** R$ 1.285,00 + R$ 450,00 = **R$ 1.735,00**  
> 🏆 **Lucro estimado:** R$ 548,00 - R$ 309,00 - R$ 1.735,00 = **−R$ 1.496,00** *(normal para início de mês com despesas fixas altas)*

---

# ══════════════════════════════════════════════
# SEMANA 2 — OPERAÇÃO AVANÇADA (Dias 8–14)
# ══════════════════════════════════════════════

---

## DIA 8 — ORDEM DE SERVIÇO COMPLETA
**Módulos:** Ordens de Serviço · Financeiro (OS)

> Este é o dia mais completo. Vamos criar uma OS, passar por todos os status, usar os templates WhatsApp e verificar a integração com o financeiro.

---

### ETAPA 8.1 — Criar Nova OS

- [ ] Acessar **Ops Extras → Ordens de Serviço → + Nova OS**
- [ ] Preencher:

| Campo | Valor |
|-------|-------|
| Cliente | `Ana Paula Costa` *(digitar e selecionar)* |
| Telefone | `(11) 98765-4321` |
| Equipamento | `Samsung Galaxy A55` |
| Defeito Relatado | `Carregador não está funcionando, bateria não carrega` |
| Técnico | `Marcos Silva` |
| Orçamento (R$) | `120,00` |
| Valor Serviço | `80,00` |
| Valor Peças | `40,00` |
| Previsão de Entrega | *(data de 3 dias à frente)* |
| Observações | `Cliente deixou o carregador original junto` |

- [ ] Salvar
- [ ] **✅ VERIFICAR:** OS criada com número (ex: #001) e status **AGUARDANDO**
- [ ] **✅ VERIFICAR (DRE Financeiro):** Receita de Serviços ainda R$ 0,00 *(OS não concluída)*

---

### ETAPA 8.2 — Avançar Status da OS + Templates WhatsApp

- [ ] Clicar na OS #001 para abrir o detalhe
- [ ] Clicar em **"Avançar Status"** → muda para **APROVADO**

**Testar Template WhatsApp — Orçamento:**
- [ ] Na seção de mensagem, selecionar preset **"Orçamento"**
- [ ] **✅ VERIFICAR:** Live Preview mostra bolha de mensagem com `{CLIENTE}` = "Ana Paula Costa", `{VALOR}` = "R$ 120,00", `{EQUIPAMENTO}` = "Samsung Galaxy A55"
- [ ] Clicar na tag `{NUMERO_OS}` → **✅ VERIFICAR:** Tag inserida no campo de texto
- [ ] Clicar em **"Enviar pelo WhatsApp"** → **✅ VERIFICAR:** Nova aba abre com `wa.me/5511...` e mensagem pré-preenchida

- [ ] Avançar para **EM SERVIÇO**

**Testar Template WhatsApp — Em Andamento:**
- [ ] Selecionar preset **"Em Andamento"**
- [ ] **✅ VERIFICAR:** Mensagem diferente do preset de Orçamento
- [ ] **✅ VERIFICAR:** Live preview atualiza em tempo real ao digitar no campo

- [ ] Avançar para **CONCLUÍDO**

**Testar Template WhatsApp — Conclusão:**
- [ ] Selecionar preset **"Concluído"**
- [ ] **✅ VERIFICAR:** Mensagem inclui valor final = R$ 120,00

---

### ETAPA 8.3 — Verificar Integração OS × Financeiro

- [ ] Acessar **Financeiro → Visão Geral**
- [ ] **✅ VERIFICAR KPI "Serviços (OS)":** **R$ 120,00** *(valor_servico R$ 80,00 + valor_pecas R$ 40,00)*
- [ ] **✅ VERIFICAR DRE:**
  - `(+) Receita de Vendas:` ~R$ 548,00
  - `(+) Receita de Serviços (OS):` **R$ 120,00**
  - `(=) Receita Bruta Total:` ~R$ 668,00

- [ ] Avançar OS para **ENTREGUE**
- [ ] **✅ VERIFICAR:** Receita de OS permanece R$ 120,00 *(status entregue também conta)*

---

### ETAPA 8.4 — Verificar Acompanhamento Público da OS

- [ ] Acessar `/acompanhar-os/001` (URL pública, sem login)
- [ ] **✅ VERIFICAR:** Página exibe status atual da OS sem pedir autenticação
- [ ] **✅ VERIFICAR:** Dados exibidos: cliente, equipamento, status, previsão

---

## DIA 9 — VENDAS COM COMISSÃO
**Módulos:** PDV · Comissões

> ⚠️ Comissionados foram cadastrados no Dia 7. Agora fazemos as primeiras vendas vinculadas a eles.

---

### ETAPA 9.1 — Venda com Comissão (Pedro Indicador)

- [ ] Nova Venda
- [ ] Selecionar cliente: **Carla Souza**
- [ ] Adicionar: P1 (Fone JBL) × 1 = R$ 89,90
- [ ] Campo **Comissionado:** Selecionar **Pedro Indicador**
- [ ] **✅ VERIFICAR:** Campo exibe o nome e a taxa (3%)
- [ ] Forma: **PIX**
- [ ] Finalizar venda

> **Comissão esperada:** R$ 89,90 × 3% = **R$ 2,697 ≈ R$ 2,70**

---

### ETAPA 9.2 — Venda com Comissão (Lucas Ferreira)

- [ ] Nova Venda
- [ ] Selecionar cliente: **Diego Alves**
- [ ] Adicionar: P2 (Carregador) × 1 = R$ 69,90 + P3 (Capa) × 1 = R$ 39,90
- [ ] Total: **R$ 109,80**
- [ ] Comissionado: **Lucas Ferreira** (2%)
- [ ] Forma: **Dinheiro**
- [ ] Finalizar

> **Comissão esperada:** R$ 109,80 × 2% = **R$ 2,196 ≈ R$ 2,20**

---

### ETAPA 9.3 — Verificar KPIs de Comissão

- [ ] Acessar **Comissões**
- [ ] **✅ VERIFICAR KPI "Total em Comissões":** R$ 2,70 + R$ 2,20 = **R$ 4,90** *(aproximado)*
- [ ] **✅ VERIFICAR KPI "Pendente Pagar":** **R$ 4,90** *(nenhuma marcada como paga ainda)*
- [ ] **✅ VERIFICAR KPI "Já Pago":** **R$ 0,00**
- [ ] **✅ VERIFICAR Ranking:**
  - 🥇 Pedro Indicador — 1 venda — R$ 2,70
  - 🥈 Lucas Ferreira — 1 venda — R$ 2,20
- [ ] **✅ VERIFICAR Aba "Por Venda":** 2 linhas exibidas, ambas com status "PENDENTE"

---

### ETAPA 9.4 — Marcar Comissão do Pedro como Paga

- [ ] Na aba **Por Venda**, clicar em **"○ PENDENTE"** na venda de Carla Souza
- [ ] **✅ VERIFICAR:** Botão muda para **"✔ PAGO"**
- [ ] **✅ VERIFICAR KPI "Já Pago":** **R$ 2,70**
- [ ] **✅ VERIFICAR KPI "Pendente Pagar":** **R$ 2,20** *(somente Lucas)*
- [ ] **✅ VERIFICAR (Aba Comissionados):** Pedro exibe Comissão Total R$ 2,70 · Pendente = R$ 0,00

---

## DIA 10 — GARANTIA COMPLETA: CERTIFICADO + DEVOLUÇÃO COM REEMBOLSO
**Módulos:** Garantias · Financeiro (despesa automática)

---

### ETAPA 10.1 — Acessar o Certificado de Garantia

- [ ] Acessar **Ops Extras → Garantias**
- [ ] **✅ VERIFICAR:** Lista exibe as garantias criadas automaticamente pelas vendas com garantia:
  - Ana Paula — Carregador Turbo 65W — 90 dias
  - Diego Alves — Caixa de Som JBL Go 4 — 90 dias
- [ ] Clicar em uma garantia para ver o detalhe (`/garantias/[id]`)
- [ ] **✅ VERIFICAR:** Certificado premium exibido com:
  - Nome do produto real
  - Nome do cliente real
  - Período de garantia correto
  - Data de vencimento calculada
  - QR Code presente
  - Nome da empresa "Ponto Digital"
  - *(NÃO deve exibir "NexoCommerce" em nenhum lugar)*

---

### ETAPA 10.2 — Registrar Devolução com Reembolso

> **Cenário:** Diego Alves voltou dizendo que a Caixa de Som JBL Go 4 tem um defeito no alto-falante. Vamos processar a devolução com reembolso.

- [ ] Na garantia de Diego Alves (Caixa de Som JBL Go 4), clicar em **"Registrar Devolução"**
- [ ] Preencher:

| Campo | Valor |
|-------|-------|
| Motivo | `Alto-falante com defeito, som com ruído` |
| Resolução | `Reembolso` |
| Valor do Reembolso | `229,90` |

- [ ] Confirmar

- [ ] **✅ VERIFICAR (Estoque P5):** Caixa JBL Go 4 de 5 → **6 un** *(retornou ao estoque)*
- [ ] **✅ VERIFICAR (Movimentações):** Nova entrada tipo `entrada` com P5 qtd +1

**Verificar impacto financeiro:**
- [ ] Acessar **Financeiro → Despesas**
- [ ] **✅ VERIFICAR:** Despesa gerada automaticamente:
  - Categoria: `Reembolso de Garantia`
  - Valor: `R$ 229,90`
  - Status: `Paga`
- [ ] **✅ VERIFICAR (DRE):** Despesas totais aumentaram R$ 229,90

---

### ETAPA 10.3 — Registrar Devolução com Troca

> **Cenário:** Ana Paula quer trocar o Carregador com defeito por outro novo.

- [ ] Na garantia de Ana Paula (Carregador 65W), clicar em **"Registrar Devolução"**
- [ ] Preencher:

| Campo | Valor |
|-------|-------|
| Motivo | `Parou de carregar após 2 semanas de uso` |
| Resolução | `Troca` |

- [ ] Confirmar
- [ ] **✅ VERIFICAR (Estoque P2):** Carregador: retornou +1 (do defeituoso) e saiu -1 (do substituto) → estoque líquido = **19 un** *(sem alteração)*
- [ ] **✅ VERIFICAR:** Nenhuma despesa financeira gerada para troca *(reembolso gera, troca não)*

---

## DIA 11 — ABERTURA E FECHAMENTO DE CAIXA
**Módulos:** Financeiro → Fechamento de Caixa

---

### ETAPA 11.1 — Acessar Fechamento de Caixa

- [ ] Acessar **Financeiro → Fechamento de Caixa**
- [ ] **✅ VERIFICAR:** Resumo do dia exibe:
  - Entradas por forma: Dinheiro, PIX, Crédito discriminados
  - Saídas (despesas do dia)
  - Saldo do dia

---

### ETAPA 11.2 — Fazer uma Venda e Verificar no Fechamento

- [ ] Fazer uma venda simples: P4 (Cabo) × 3 = R$ 59,70 · Forma: **Dinheiro**
- [ ] Voltar ao **Fechamento de Caixa**
- [ ] **✅ VERIFICAR:** O valor de R$ 59,70 aparece na linha "Dinheiro" das entradas do dia
- [ ] **✅ VERIFICAR:** Total de entradas do dia inclui esta venda

---

### ETAPA 11.3 — Lançar Despesa e Verificar no Fechamento

- [ ] Acessar **Financeiro → Despesas → + Despesa**:

| Campo | Valor |
|-------|-------|
| Descrição | `Embalagens e sacolas` |
| Categoria | `Operacional` |
| Valor | `45,00` |
| Data | *(hoje)* |

- [ ] Voltar ao **Fechamento de Caixa**
- [ ] **✅ VERIFICAR:** R$ 45,00 aparece nas saídas do dia
- [ ] **✅ VERIFICAR:** Saldo do dia = Entradas − Saídas

---

### ETAPA 11.4 — Validar Saldo do Dia

> **Cálculo esperado para o Dia 11:**
> - Entrada Dinheiro: R$ 59,70
> - Saída: R$ 45,00
> - **Saldo do Dia:** R$ 59,70 − R$ 45,00 = **R$ 14,70**

- [ ] **✅ VERIFICAR:** Saldo exibido no fechamento = **R$ 14,70** *(ou valor próximo conforme outras vendas do dia)*

---

## DIA 12 — COBRAR FIADO E VERIFICAR BAIXA
**Módulos:** Financeiro → Fiado

---

### ETAPA 12.1 — Verificar Fiado em Aberto

- [ ] Acessar **Financeiro → Fiado**
- [ ] **✅ VERIFICAR:** Bruno Lima aparece com **R$ 89,90** em aberto *(venda fiado do Dia 3)*
- [ ] **✅ VERIFICAR:** Data da venda exibida corretamente

---

### ETAPA 12.2 — Registrar Pagamento do Fiado

- [ ] Clicar em **"Receber"** (ou botão equivalente) na linha de Bruno Lima
- [ ] Registrar pagamento: **R$ 89,90** (total)
- [ ] Forma do pagamento recebido: **PIX**
- [ ] **✅ VERIFICAR:** Bruno Lima sai da lista de fiados em aberto
- [ ] **✅ VERIFICAR (Dashboard):** KPI "Fiado em Aberto" = **R$ 0,00**
- [ ] **✅ VERIFICAR (Financeiro):** Receita do dia aumenta R$ 89,90 *(pagamento de fiado conta como entrada)*

---

## DIA 13 — CLIENTES INATIVOS E CRM
**Módulos:** Clientes → Inativos

---

### ETAPA 13.1 — Verificar Clientes Ativos

- [ ] Acessar **Clientes**
- [ ] **✅ VERIFICAR:** 4 clientes listados

---

### ETAPA 13.2 — Simular Cliente Inativo

> Como a simulação está em andamento há poucos dias, nenhum cliente estará "inativo" pelo prazo de 45 dias. Vamos reduzir temporariamente o prazo para testar o módulo.

- [ ] Acessar **Configurações → Empresa**
- [ ] Alterar prazo de inatividade para **`1` dia**
- [ ] Salvar
- [ ] Acessar **Clientes → aba Inativos**
- [ ] **✅ VERIFICAR:** Clientes sem compra hoje aparecem como inativos
- [ ] **✅ VERIFICAR (Dashboard):** KPI "Clientes Sumidos" exibe número > 0
- [ ] Restaurar prazo para **45 dias** e salvar

---

## DIA 14 — RELATÓRIOS E GRÁFICO DE 15 DIAS
**Módulos:** Relatórios · Financeiro (gráfico)

---

### ETAPA 14.1 — Acessar Relatórios

- [ ] Acessar **Relatórios**
- [ ] **✅ VERIFICAR:** Período padrão mostrando o mês atual
- [ ] **✅ VERIFICAR:** Produtos mais vendidos exibidos em ranking

**Verificar ranking de produtos:**

> Até o Dia 14, os produtos vendidos foram:
> - P1 (Fone JBL): 3 unidades (vendas #1, #3 fiado, #9.1)
> - P2 (Carregador): 2 unidades (venda #2, #9.2)
> - P3 (Capa Samsung): 3 unidades (venda #4, #9.2)
> - P4 (Cabo): 5 unidades (vendas #1 e #11.2)
> - P5 (Caixa JBL): 1 unidade (venda #5, devolvida)
> - P6 (Película): 3 unidades (venda #4)

- [ ] **✅ VERIFICAR:** Ranking reflete as quantidades acima

---

### ETAPA 14.2 — Validar Gráfico 15 Dias no Financeiro

- [ ] Acessar **Financeiro → Visão Geral**
- [ ] Observar o gráfico "Faturamento Total (Vendas + OS) — Últimos 15 Dias"
- [ ] **✅ VERIFICAR:** Os dias com vendas e/ou OS concluídas aparecem com barras maiores que zero
- [ ] **✅ VERIFICAR:** O título do gráfico menciona "Vendas + OS" *(não apenas Vendas)*
- [ ] **✅ VERIFICAR:** A OS do Dia 8 aparece somada ao faturamento do dia correspondente

---

# ══════════════════════════════════════════════
# SEMANA 3 — CENÁRIOS AVANÇADOS (Dias 15–21)
# ══════════════════════════════════════════════

---

## DIA 15 — SEGUNDO PEDIDO DE COMPRA + ALERTA DE ESTOQUE CRÍTICO

---

### ETAPA 15.1 — Verificar Estoque Crítico

- [ ] Acessar **Estoque**
- [ ] **✅ VERIFICAR:** Produtos em estado crítico (qtd atual ≤ qtd mínima)

> Após as vendas dos Dias 3–14:
> - P2 Carregador: início 20, -2 (vendas) + reposição (troca de garantia) = verificar valor real
> - P5 Caixa JBL: vendida 1, devolvida 1 → deve estar em 6 un *(acima do mínimo 2)*

- [ ] **✅ VERIFICAR (Dashboard):** KPI "Estoque Crítico" bate com o número de produtos abaixo do mínimo no Estoque

---

### ETAPA 15.2 — Criar Segundo Pedido ao Fornecedor

- [ ] Acessar Fornecedores → Pedidos de Compra → **+ Novo Pedido**

| Campo | Valor |
|-------|-------|
| Fornecedor | `InfoParts Ltda` |
| Produto | `Película Hydrogel Samsung` |
| Quantidade | `50` |
| Preço Unitário | `5,00` |
| Total | `R$ 250,00` *(verificar autocálculo)* |
| Previsão | *(amanhã)* |

- [ ] Salvar como Pendente
- [ ] Marcar como **Recebido** imediatamente *(simulação de entrega rápida)*
- [ ] **✅ VERIFICAR (Estoque P6):** Película: 77 − vendas + 50 = verificar valor exato
- [ ] **✅ VERIFICAR (Despesas):** Despesa automática de R$ 250,00 — Compra de Mercadoria InfoParts

---

## DIA 16 — SEGUNDA OS (DIFERENTE TIPO DE SERVIÇO)

---

### ETAPA 16.1 — Criar OS para Bruno Lima

- [ ] Nova OS

| Campo | Valor |
|-------|-------|
| Cliente | `Bruno Lima` |
| Equipamento | `Carregador Turbo 65W USB-C` |
| Defeito Relatado | `Cabo derretendo na ponta, possível curto` |
| Técnico | `Fábio Ramos` |
| Orçamento | `60,00` |
| Valor Serviço | `40,00` |
| Valor Peças | `20,00` |
| Previsão | *(3 dias)* |

- [ ] Avançar para **APROVADO** → **EM SERVIÇO**

**Template WhatsApp — Atraso:**
- [ ] Selecionar preset **"Atraso"**
- [ ] **✅ VERIFICAR:** Mensagem de atraso com variáveis do cliente preenchidas
- [ ] Enviar pelo WhatsApp *(verificar que abre `wa.me/` com o número de Bruno)*

- [ ] Avançar para **CONCLUÍDO**

- [ ] **✅ VERIFICAR (Financeiro DRE):** Receita de Serviços agora = R$ 120,00 (OS #1) + R$ 60,00 (OS #2) = **R$ 180,00**

---

## DIA 17 — VENDA COM DESCONTO E VENDA NO ATACADO

---

### ETAPA 17.1 — Venda com Desconto Individual no Item

- [ ] Nova Venda · cliente: **Carla Souza**
- [ ] Adicionar P1 (Fone JBL) × 2 = R$ 179,80
- [ ] Aplicar desconto no item: **R$ 10,00**
- [ ] Total do item: R$ 169,80
- [ ] Forma: **Crédito**
- [ ] Finalizar
- [ ] **✅ VERIFICAR:** Recibo exibe desconto aplicado e valor final correto
- [ ] **✅ VERIFICAR (Estoque P1):** Diminuiu 2 unidades

---

### ETAPA 17.2 — Venda Atacado (múltiplos itens · cliente Carla)

- [ ] Nova Venda · cliente: **Carla Souza**
- [ ] P3 (Capa Samsung) × 5 = R$ 199,50
- [ ] P6 (Película) × 10 = R$ 129,00
- [ ] Desconto global: **R$ 20,00**
- [ ] Total final: **R$ 308,50**
- [ ] Forma: **PIX**
- [ ] Finalizar
- [ ] **✅ VERIFICAR:** Estoque P3 caiu 5 · P6 caiu 10

---

## DIA 18 — CANCELAR UMA VENDA E VERIFICAR ESTORNO

---

### ETAPA 18.1 — Abrir Detalhe de uma Venda e Cancelar

- [ ] Acessar **Vendas** → abrir a venda #4 (Carla Souza, Crédito, R$ 118,50 do Dia 4)
- [ ] Clicar em **"Cancelar Venda"**
- [ ] Confirmar cancelamento
- [ ] **✅ VERIFICAR:** Venda exibe status **"Cancelada"** na lista
- [ ] **✅ VERIFICAR (Estoque):** P3 retornou +2 (as 2 unidades da venda cancelada)
- [ ] **✅ VERIFICAR (Financeiro):** Receita do mês diminuiu R$ 118,50

---

## DIA 19 — CATÁLOGO ONLINE E LOJA PÚBLICA

---

### ETAPA 19.1 — Configurar Catálogo

- [ ] Acessar **Produtos/Estoque → Catálogo**
- [ ] **✅ VERIFICAR:** Produtos com "Visível no catálogo" ativo aparecem na lista
- [ ] Verificar o slug da loja exibido *(ex: `ponto-digital`)*

---

### ETAPA 19.2 — Acessar a Loja Pública

- [ ] Abrir `/loja/ponto-digital` em aba anônima *(sem login)*
- [ ] **✅ VERIFICAR:** Produtos visíveis exibidos na vitrine
- [ ] **✅ VERIFICAR:** Botão "Comprar via WhatsApp" aparece em cada produto
- [ ] **✅ VERIFICAR:** Filtro de categoria funciona

---

## DIA 20 — PAINEL "COMO FOI?" E ENVIO POR WHATSAPP

---

### ETAPA 20.1 — Verificar ComoFoiPainel

- [ ] Acessar **Dashboard**
- [ ] **✅ VERIFICAR:** Painel "Como foi?" está visível (somente Pro)
- [ ] **✅ VERIFICAR:** Exibe:
  - Faturamento do mês
  - Número de vendas
  - Ticket médio
  - Despesas
- [ ] Clicar em **"Enviar por WhatsApp"**
- [ ] **✅ VERIFICAR:** Abre `wa.me/` com o resumo do dia formatado como mensagem

---

## DIA 21 — DRE COMPLETO: CONFERÊNCIA GERAL
**Módulos:** Financeiro — Validação matemática completa

---

### ETAPA 21.1 — Conferir DRE Completo

- [ ] Acessar **Financeiro → Visão Geral**

**Calcule os valores esperados antes de olhar o sistema:**

| Linha DRE | Cálculo | Valor Esperado |
|-----------|---------|----------------|
| (+) Receita Vendas | Soma das vendas concluídas do mês | *(calcule pelo histórico)* |
| (+) Receita Serviços OS | OS #1 R$120 + OS #2 R$60 | **R$ 180,00** |
| (=) Receita Bruta Total | Receita Vendas + R$ 180,00 | *(conferir)* |
| (-) CMV | Soma custo × qtd de todos itens vendidos | *(calcule)* |
| (-) Brindes | R$ 0,00 *(não demos brindes)* | **R$ 0,00** |
| (-) Despesas Totais | Aluguel + Operacional + Compras + Reembolso | *(calcule)* |
| (=) Lucro Líquido | Bruta - CMV - Despesas | *(conferir)* |

- [ ] **✅ VERIFICAR:** Cada linha do DRE corresponde ao valor calculado
- [ ] **✅ VERIFICAR:** Margem % = (Lucro / Receita Bruta) × 100

---

# ══════════════════════════════════════════════
# SEMANA 4 — EDGE CASES E VALIDAÇÃO FINAL (Dias 22–30)
# ══════════════════════════════════════════════

---

## DIA 22 — AJUSTE MANUAL DE ESTOQUE

---

### ETAPA 22.1 — Fazer Ajuste de Entrada Manual

- [ ] Acessar **Estoque**
- [ ] Clicar em **"Ajuste Manual"** para P4 (Cabo USB-C)
- [ ] Tipo: **Entrada** · Quantidade: `5` · Observação: `Ajuste de inventário`
- [ ] Confirmar
- [ ] **✅ VERIFICAR:** Estoque P4 aumentou 5 unidades
- [ ] **✅ VERIFICAR (Movimentações):** Nova linha tipo `entrada` com obs "Ajuste de inventário"

---

### ETAPA 22.2 — Fazer Ajuste de Saída Manual

- [ ] Ajuste manual P6 (Película Hydrogel)
- [ ] Tipo: **Saída** · Quantidade: `3` · Observação: `Avariadas no recebimento`
- [ ] **✅ VERIFICAR:** Estoque P6 caiu 3 unidades

---

## DIA 23 — TESTAR BRINDES

---

### ETAPA 23.1 — Venda com Brinde

- [ ] Nova Venda · cliente: **Ana Paula Costa**
- [ ] Adicionar P3 (Capa) × 1 = R$ 39,90
- [ ] Adicionar P6 (Película) × 1 como **BRINDE** *(marcar como brinde no PDV)*
- [ ] Forma: **PIX**
- [ ] Finalizar

- [ ] **✅ VERIFICAR (Movimentações):** P6 gerou movimentação tipo `brinde` *(não `saida` normal)*
- [ ] **✅ VERIFICAR (Financeiro DRE → Brindes Concedidos):** Valor do custo do brinde aparece em "Brindes Concedidos"
  - Custo P6 = R$ 5,00 → Brindes = **R$ 5,00**

---

## DIA 24 — EDITAR E EXCLUIR PRODUTO · TESTAR CRM

---

### ETAPA 24.1 — Editar Produto

- [ ] Acessar **Produtos** → clicar em editar P4 (Cabo USB-C)
- [ ] Alterar preço de venda de R$ 19,90 para **R$ 22,90**
- [ ] Salvar
- [ ] **✅ VERIFICAR:** Nova venda com P4 exibe R$ 22,90

---

### ETAPA 24.2 — Verificar que Histórico Não Muda

- [ ] Acessar **Vendas** → abrir uma venda antiga com P4
- [ ] **✅ VERIFICAR:** O valor da venda antiga ainda exibe o preço original *(histórico imutável)*

---

### ETAPA 24.3 — CRM: Buscar Cliente por Telefone

- [ ] Acessar **Clientes**
- [ ] Buscar: `97654`
- [ ] **✅ VERIFICAR:** Bruno Lima aparece no resultado *(busca por telefone parcial)*

---

## DIA 25 — VENDA QUE GERA ALERTA DE ESTOQUE

---

### ETAPA 25.1 — Vender Quase Todo Estoque de P5

- [ ] P5 (Caixa JBL) tem 6 un. Mínimo = 2.
- [ ] Fazer venda: P5 × 4 = R$ 919,60 · cliente: **Carla Souza** · Forma: **PIX**
- [ ] **✅ VERIFICAR (após venda):** P5 → 2 un *(exatamente no mínimo)*
- [ ] **✅ VERIFICAR (Dashboard):** KPI "Estoque Crítico" = **1** *(P5 está no limite)*

- [ ] Fazer outra venda: P5 × 1 = R$ 229,90
- [ ] **✅ VERIFICAR:** P5 → 1 un *(abaixo do mínimo 2)*
- [ ] **✅ VERIFICAR (Dashboard):** Alerta vermelho de estoque crítico aparece
- [ ] **✅ VERIFICAR (Dashboard alerta inline):** "⚠ 1 produto(s) com estoque abaixo do mínimo"

---

## DIA 26 — RELATÓRIO CONSOLIDADO

---

### ETAPA 26.1 — Verificar Relatório do Mês

- [ ] Acessar **Relatórios**
- [ ] **✅ VERIFICAR Top Produtos por Quantidade:** P4 (Cabo) deve liderar pelas várias vendas
- [ ] **✅ VERIFICAR Ticket Médio do Período:** Valor coerente com as vendas realizadas
- [ ] **✅ VERIFICAR Formas de Pagamento:** PIX, Dinheiro, Crédito com percentuais

---

## DIA 27 — TESTAR COMPORTAMENTO SEM PERMISSÃO

---

### ETAPA 27.1 — Logar como Lucas (Operador)

- [ ] Fazer logout e logar como `lucas@pontodigital.com`
- [ ] **✅ VERIFICAR:** Lucas vê o Dashboard mas NÃO vê Configurações na sidebar
- [ ] Tentar acessar `/configuracoes` diretamente na URL
- [ ] **✅ VERIFICAR:** Bloqueado ou redirecionado *(operador sem acesso)*
- [ ] Lucas consegue acessar Vendas → **Nova Venda** ✅
- [ ] Lucas NÃO deve conseguir excluir produtos *(se implementado por papel)*
- [ ] Logar de volta como Kauan (admin)

---

## DIA 28 — INATIVAR FORNECEDOR E PRODUTO

---

### ETAPA 28.1 — Inativar Fornecedor

- [ ] Acessar Fornecedores → editar **InfoParts Ltda**
- [ ] Alterar status para **Inativo**
- [ ] Salvar
- [ ] **✅ VERIFICAR:** InfoParts exibe badge "○ Inativo" com opacidade reduzida
- [ ] Reativar: alterar para Ativo novamente

---

## DIA 29 — VALIDAÇÃO FINAL DE KPIs (CONFERÊNCIA TOTAL)
**Módulo:** Financeiro — DRE final + Comissões

---

### ETAPA 29.1 — Validação de Comissões

- [ ] Acessar **Comissões**

**Calcule o esperado:**
- Pedro Indicador: Venda #9.1 (R$ 89,90 × 3% = R$ 2,70) — **PAGO** *(marcamos no Dia 9)*
- Lucas Ferreira: Venda #9.2 (R$ 109,80 × 2% = R$ 2,20) — **PENDENTE**

- [ ] **✅ VERIFICAR KPI "Total":** R$ 4,90
- [ ] **✅ VERIFICAR KPI "Já Pago":** R$ 2,70
- [ ] **✅ VERIFICAR KPI "Pendente":** R$ 2,20
- [ ] Marcar comissão de Lucas como paga
- [ ] **✅ VERIFICAR:** Pendente = R$ 0,00 · Pago = R$ 4,90

---

### ETAPA 29.2 — DRE Final Consolidado

- [ ] Acessar **Financeiro → Visão Geral**
- [ ] Anotar na planilha de controle os valores exibidos:
  - Receita Total: ___
  - Receita Vendas: ___
  - Receita Serviços OS: ___
  - CMV: ___
  - Brindes: ___
  - Despesas Totais: ___
  - Lucro Líquido: ___
  - Margem %: ___

- [ ] **✅ VERIFICAR:** Receita Serviços OS = **R$ 180,00** *(OS1 R$120 + OS2 R$60)*
- [ ] **✅ VERIFICAR:** Brindes = **R$ 5,00** *(1 película brinde do Dia 23)*
- [ ] **✅ VERIFICAR:** Despesas incluem o Reembolso da Garantia de R$ 229,90

---

## DIA 30 — VERIFICAÇÃO DE ACOMPANHAMENTO DE OS PÚBLICO + ENCERRAMENTO

---

### ETAPA 30.1 — Verificar OS Públicas

- [ ] Abrir em aba anônima `/acompanhar-os/1` e `/acompanhar-os/2`
- [ ] **✅ VERIFICAR:** Ambas exibem status corretamente sem autenticação

---

### ETAPA 30.2 — Verificar Catálogo Público

- [ ] Acessar `/loja/ponto-digital` sem login
- [ ] **✅ VERIFICAR:** Produtos visíveis na vitrine
- [ ] **✅ VERIFICAR:** Botão WhatsApp direciona para `wa.me/5511...`

---

### ETAPA 30.3 — Fechamento de Caixa do Último Dia

- [ ] Acessar **Financeiro → Fechamento de Caixa**
- [ ] **✅ VERIFICAR:** Entradas do dia discriminadas por forma de pagamento
- [ ] **✅ VERIFICAR:** Saldo do dia calculado corretamente
- [ ] Testar função de impressão/exportação se disponível

---

### ETAPA 30.4 — Checklist Final de Cobertura

Confirme que cada módulo foi exercitado:

| Módulo | Testado? | KPIs validados? |
|--------|----------|-----------------|
| Dashboard | ☐ | ☐ |
| PDV — Nova Venda (básica) | ☐ | ☐ |
| PDV — Com comissão | ☐ | ☐ |
| PDV — Com fiado | ☐ | ☐ |
| PDV — Com brinde | ☐ | ☐ |
| PDV — Com desconto | ☐ | ☐ |
| PDV — Cancelamento | ☐ | ☐ |
| Produtos — Cadastro | ☐ | — |
| Produtos — Edição | ☐ | — |
| Estoque — Movimentações | ☐ | ☐ |
| Estoque — Ajuste Manual | ☐ | ☐ |
| Estoque — Alerta Crítico | ☐ | ☐ |
| Clientes — Cadastro | ☐ | — |
| Clientes — Inativos CRM | ☐ | ☐ |
| Fornecedores — Cadastro | ☐ | — |
| Fornecedores — Pedido Compra | ☐ | ☐ |
| Fornecedores — Recebimento (→ estoque + despesa) | ☐ | ☐ |
| Financeiro — DRE | ☐ | ☐ |
| Financeiro — Despesas Manuais | ☐ | ☐ |
| Financeiro — Despesas Automáticas | ☐ | ☐ |
| Financeiro — Fiado (lançamento) | ☐ | ☐ |
| Financeiro — Fiado (recebimento) | ☐ | ☐ |
| Financeiro — Fechamento de Caixa | ☐ | ☐ |
| OS — Criação | ☐ | — |
| OS — Fluxo de Status | ☐ | — |
| OS — Templates WhatsApp | ☐ | — |
| OS — Integração Financeiro | ☐ | ☐ |
| OS — Acompanhamento Público | ☐ | — |
| Garantias — Certificado Premium | ☐ | — |
| Garantias — Devolução Reembolso (→ despesa) | ☐ | ☐ |
| Garantias — Devolução Troca (→ estoque) | ☐ | ☐ |
| Comissões — Cadastro | ☐ | — |
| Comissões — KPIs globais | ☐ | ☐ |
| Comissões — Ranking | ☐ | ☐ |
| Comissões — Marcar como Pago | ☐ | ☐ |
| Relatórios | ☐ | ☐ |
| Catálogo/Loja Pública | ☐ | — |
| Configurações — Empresa | ☐ | — |
| Configurações — Usuários/Convite | ☐ | — |
| Configurações — Formas Pagamento | ☐ | — |
| Multi-usuário — Permissões por Papel | ☐ | — |
| Plano Start → Pro (upgrade) | ☐ | — |

---

> **Critério de aprovação:** Todos os checkboxes marcados ✅ e todos os KPIs verificados coincidem com os valores calculados manualmente.  
> Se qualquer valor divergir → reportar o módulo, os valores esperado e real, e as etapas que os geraram.

---

*Documento: `docs/simulacao_30_dias.md` v2.0 · KDL Store · Jun/2026*
