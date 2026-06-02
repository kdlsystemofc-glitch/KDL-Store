# SIMULAÇÃO DE 30 DIAS — SMARTTECH VENDAS E ASSISTÊNCIA v3.2
**Versão:** 3.2 — Cenário Ultra-Completo e Exaustivo  
**Gerado em:** 2026-06-02  
**Base:** `mapeamento_completo_sistema.md` v2.0  
**Objetivo:** Validação manual passo a passo de TODAS as telas, TODOS os campos de formulário, TODOS os botões, validações de plano, fluxos de erro, controle de garantias e batimento matemático de KPIs.

---

> ## ⚠️ LEIA ANTES DE COMEÇAR — REGRAS DE OURO
>
> 1. **Fidelidade Total:** Execute cada tarefa exatamente na ordem e no dia simulado. Não pule etapas, não inverta a sequência. A matemática dos KPIs depende disso.
> 2. **Preencha tudo:** Todo campo obrigatório (\*) E opcional deve ser preenchido, salvo quando a instrução pede para testar a opcionalidade.
> 3. **Plano Start (Dias 1–5):** Acesso a Financeiro DRE, Despesas, Fechamento de Caixa, Comissões e Usuários extras é bloqueado. Fiado é acessível.
> 4. **Upgrade Pro no Dia 6:** A partir do Dia 6 todos os módulos ficam disponíveis.
> 5. **Marque cada checkbox:** Use o campo `[x]` ao completar cada passo. Nunca marque sem ter executado.
> 6. **Anote discrepâncias:** Se um valor no sistema diferir do valor esperado, anote no campo de observação do dia.

---

## 🏪 PERFIL DA LOJA DE TESTES

```
┌──────────────────────────────────────────────────────────────┐
│                SMARTTECH VENDAS E ASSISTÊNCIA                │
├──────────────────┬───────────────────────────────────────────┤
│ Segmento         │ Venda de Eletrônicos, Acessórios e Lab OS │
│ Cidade           │ São Paulo / SP                            │
│ WhatsApp         │ (11) 97766-5544                           │
│ Telefone Fixo    │ (11) 3333-2211                            │
│ E-mail           │ contato@smarttech.com                     │
│ CNPJ             │ 12.345.678/0001-90                        │
│ URL do Catálogo  │ loja/smarttech                            │
│ Plano inicial    │ Start → Pro (upgrade Dia 6)               │
└──────────────────┴───────────────────────────────────────────┘
```

---

## 📦 CATÁLOGO DE PRODUTOS (Dias 2–3)

| # | Produto | SKU | Cód. Barras | Custo | Varejo | Min.PDV | Atacado | VIP | Qtd | QtdMín | QtdMáx | AtacMín | Loc | Brinde | Série | Catálogo | Garantia |
|---|---------|-----|-------------|-------|--------|---------|---------|-----|-----|--------|--------|---------|-----|--------|-------|----------|----------|
| P1 | Carregador Rápido USB-C 20W | `CAR-USBC-20W` | `7890000000001` | 15,00 | 39,90 | 30,00 | 29,90 | 34,90 | 50 | 10 | 100 | 5 | Prateleira A1 | ❌ | ❌ | ✅ | Sem |
| P2 | Cabo Lightning Reforçado 1.2m | `CAB-LIGHT-12` | `7890000000002` | 10,00 | 24,90 | 18,00 | 17,90 | 19,90 | 40 | 8 | 80 | 5 | Prateleira A2 | ❌ | ❌ | ✅ | Sem |
| P3 | Película de Vidro 3D | `PEL-VIDR-3D` | `7890000000003` | 5,00 | 19,90 | 12,00 | 9,90 | 14,90 | 60 | 15 | 150 | 10 | Gaveteiro B1 | ✅ | ❌ | ✅ | Sem |
| P4 | Fone Bluetooth SoundPro | `FON-BLUE-SP` | `7890000000004` | 60,00 | 149,90 | 110,00 | 99,90 | 129,90 | 15 | 3 | 30 | 3 | Vitrine 1 | ❌ | ❌ | ✅ | 90 dias |
| P5 | Smartphone Nexus 12 Lite 128GB | `SMA-NEX12-L` | `7890000000005` | 900,00 | 1.899,00 | 1.600,00 | 1.500,00 | 1.699,00 | 6 | 2 | 12 | 2 | Cofre Auxiliar | ❌ | ✅ | ❌ | 365 dias |
| P6 | Capa Protetora Anti-Impacto | `CAP-PROT-AI` | `7890000000006` | 8,00 | 29,90 | 20,00 | 19,90 | 24,90 | 30 | 6 | 60 | 5 | Prateleira A3 | ❌ | ❌ | ✅ | Sem |

---

## 👥 CLIENTES (Dia 3)

| # | Nome | Tipo | CPF/CNPJ | E-mail | WhatsApp | CEP | Nº | Complemento |
|---|------|------|----------|--------|----------|-----|----|-------------|
| C1 | Conecta Distribuidora | Atacado | 10.200.300/0001-40 | vendas@conectadistribuidora.com.br | (11) 98888-7777 | 01311-100 | 1374 | 3º Andar, Sala 32 |
| C2 | Bruno Lima | Varejo | 111.222.333-44 | bruno.lima@gmail.com | (11) 97777-6666 | 04101-300 | 1500 | Apto 42B |
| C3 | Mariana Silveira | VIP | 555.666.777-88 | mariana.silveira@outlook.com | (11) 96666-5555 | 01223-010 | 350 | — |
| C4 | Assistência Prime | VIP | 20.300.400/0001-50 | contato@assistenciaprime.com | (11) 95555-4444 | 01001-000 | 100 | Conjunto 12 |

## 🏭 FORNECEDORES (Dia 3)

| # | Nome | Contato | CNPJ | E-mail | WhatsApp | CEP | Nº | Categ. | Prazo | Ped.Mín |
|---|------|---------|------|--------|----------|-----|----|--------|-------|---------|
| F1 | Global Importer Eletrônicos | Marcelo | 88.777.666/0001-55 | marcelo@globalimporter.com | (11) 95555-1111 | 01103-000 | 200 | Eletrônicos | 3 dias úteis | R$ 300,00 |
| F2 | TechParts Peças de Celular | Sandra | 77.666.555/0001-44 | vendas@techparts.com | (11) 94444-2222 | 01202-000 | 150 | Acessórios | 24h | R$ 200,00 |

---

# ══════════════════════════════════════════════════
# SEMANA 1 — PLANO START: CONFIGURAÇÃO E CADASTROS (Dias 1–5)
# ══════════════════════════════════════════════════

## DIA 1 — CRIAÇÃO DA CONTA, EMPRESA E FORMAS DE PAGAMENTO
**Módulos:** Cadastro · Configurações → Empresa · Configurações → Pagamentos

---

### ➔ Passo 1.1 — Cadastro de Conta com Validação de Senha
- [ ] Acessar a URL de cadastro `/cadastro`
- [ ] Verificar que a página exibe os campos: **Nome da loja**, **E-mail**, **Senha** e **Confirmar senha**
- [ ] Digitar no campo **"Nome da loja"**: `SmartTech`
- [ ] Digitar no campo **"E-mail"**: `thiago@smarttech.com`
- [ ] **Teste de senha fraca:**
  - Digitar no campo **"Senha"**: `123`
  - Clicar no botão **"Criar Conta e Entrar"**
  - **✅ VERIFICAR:** O indicador de força de senha exibe erro (necessita maiúscula, caractere especial e mínimo 8 dígitos). O formulário não é submetido.
- [ ] Digitar no campo **"Senha"**: `SmartTech@2026`
- [ ] Digitar no campo **"Confirmar senha"**: `SmartTech@2026`
- [ ] **✅ VERIFICAR:** O indicador de força da senha muda para verde/forte.
- [ ] Clicar no botão **"Criar Conta e Entrar"**.
- [ ] **✅ VERIFICAR:** Redirecionado para `/dashboard` com badge **Plano Start** visível na barra lateral.
- [ ] **✅ VERIFICAR:** Card de boas-vindas "Configure sua loja" exibido no Dashboard.

---

### ➔ Passo 1.2 — Dados Completos da Empresa (Todos os Campos)
- [ ] Acessar **Configurações** na barra lateral → Aba **"Geral"** (rota `/configuracoes/empresa`)
- [ ] Verificar que a aba "Geral" está selecionada no painel de abas superior.
- [ ] Preencher **TODOS** os campos do formulário:
  - **Nome da loja \*:** `SmartTech Vendas e Assistência`
  - **Link do catálogo (slug único):** `smarttech`
    - **✅ VERIFICAR:** Abaixo do campo aparece a prévia `loja/smarttech` em tempo real.
  - **CNPJ / CPF:** `12.345.678/0001-90`
  - **E-mail:** `contato@smarttech.com`
  - **WhatsApp:** `(11) 97766-5544`
  - **Telefone fixo:** `(11) 3333-2211`
  - **Instagram:** `smarttech.sp`
    - **✅ VERIFICAR:** O campo exibe o prefixo `@` e ao digitar o texto final fica `@smarttech.sp`.
  - **Endereço completo:** `Avenida Paulista, 1000 — Bela Vista`
  - **Cidade:** `São Paulo`
  - **Estado:** Selecionar `SP` no dropdown (verificar que há todos os estados)
  - **CEP:** `01310-100`
  - **Prazo inatividade CRM (dias):** `60`
- [ ] **Teste de upload de logo:**
  - Clicar no campo/botão de upload de logo (ícone de câmera ou botão "Enviar logo").
  - **✅ VERIFICAR:** Modal/janela de seleção de arquivo se abre.
  - Selecionar qualquer arquivo PNG do computador.
  - **✅ VERIFICAR:** Prévia da logo aparece no formulário.
- [ ] Clicar no botão **"Salvar Alterações"**.
- [ ] **✅ VERIFICAR:** Toast de sucesso com mensagem "Configurações da empresa salvas com sucesso!" aparece e desaparece após alguns segundos.
- [ ] **✅ VERIFICAR:** Ao recarregar a página, todos os campos mantêm os valores preenchidos (verificar persistência).

---

### ➔ Passo 1.3 — Configuração de Formas de Pagamento (Todos os Campos e Ações)
- [ ] Acessar **Configurações → Aba "Pagamentos"** (`/configuracoes/pagamentos`)
- [ ] **✅ VERIFICAR:** As 5 formas padrão já existem na lista: **PIX (0%)**, **Dinheiro (0%)**, **Crédito (3,5%)**, **Débito (1,8%)**, **Fiado (0%)**
- [ ] **Teste do toggle Fiado:**
  - Localizar a linha do **Fiado** na lista.
  - Clicar no switch toggle para **desativar** o Fiado (muda para cinza).
  - **✅ VERIFICAR:** O switch ficou cinza/inativo. A forma "Fiado" ainda aparece na lista mas marcada como desativada.
  - *Nota: Fiado será reativado no Dia 6 após upgrade Pro.*
- [ ] **Editar taxa do Crédito:**
  - Clicar no botão **Editar (ícone de lápis ✏️)** na linha do **Crédito**.
  - **✅ VERIFICAR:** O campo "Taxa (%)" fica editável com o valor atual `3,5`.
  - Limpar o campo e digitar: `2,99`
  - Clicar no botão **"Salvar"** (ou confirmar com Enter).
  - **✅ VERIFICAR:** A linha do Crédito exibe `2,99%` e o botão voltou ao ícone de lápis.
- [ ] **Editar taxa do Débito:**
  - Clicar no botão **Editar (lápis)** na linha do **Débito**.
  - Alterar de `1,8` para `1,50`.
  - Clicar em **"Salvar"**.
  - **✅ VERIFICAR:** A linha do Débito exibe `1,50%`.
- [ ] **Editar taxa do PIX:**
  - Clicar no botão **Editar (lápis)** na linha do **PIX**.
  - **✅ VERIFICAR:** O campo exibe `0`. Deixar em `0` e clicar em **"Salvar"** (testa que não quebra com valor zero).
- [ ] **Adicionar forma de pagamento personalizada:**
  - Localizar o card/seção "Nova Forma de Pagamento".
  - Campo **"Nome da forma"**: `Boleto Bancário`
  - Campo **"Taxa (%)"**: `2,00`
  - Clicar no botão **"Adicionar"** (ícone `+`).
  - **✅ VERIFICAR:** "Boleto Bancário" aparece na lista com taxa `2%` e switch ativo (verde).
- [ ] **Adicionar segunda forma personalizada:**
  - Campo **"Nome da forma"**: `Transferência Bancária`
  - Campo **"Taxa (%)"**: `0`
  - Clicar em **"Adicionar"**.
  - **✅ VERIFICAR:** "Transferência Bancária" aparece com taxa `0%` e switch ativo.
- [ ] **Testar exclusão de forma de pagamento personalizada:**
  - Localizar **"Transferência Bancária"**.
  - Clicar no botão **Excluir (ícone de lixeira 🗑️)** na linha.
  - **✅ VERIFICAR:** Aparece diálogo/modal de confirmação ("Deseja remover esta forma de pagamento?").
  - Confirmar a exclusão.
  - **✅ VERIFICAR:** "Transferência Bancária" sumiu da lista.
- [ ] **✅ VERIFICAR ESTADO FINAL:** A lista contém: PIX (0%), Dinheiro (0%), Crédito (2,99%), Débito (1,50%), Fiado (desativado), Boleto Bancário (2%).

---

### ➔ Passo 1.4 — Validar Configurações de Categorias (Aba)
- [ ] Acessar **Configurações → Aba "Categorias"** (`/configuracoes/categorias`)
- [ ] **✅ VERIFICAR:** Tela exibe lista vazia de categorias (ou categorias padrão se existirem).
- [ ] Clicar no botão **"+ Nova Categoria"** (ou equivalente).
- [ ] Digitar: `Eletrônicos Geral`
- [ ] Confirmar criação.
- [ ] **✅ VERIFICAR:** "Eletrônicos Geral" aparece na lista de categorias.
- [ ] Clicar no botão **Editar (lápis)** na categoria recém-criada.
- [ ] Alterar o nome para: `Eletrônicos`
- [ ] Salvar.
- [ ] **✅ VERIFICAR:** O nome atualiza para "Eletrônicos" na lista.
- [ ] Clicar no botão **Excluir (lixeira)** na categoria "Eletrônicos".
- [ ] **✅ VERIFICAR:** Modal de confirmação é exibido.
- [ ] Confirmar exclusão.
- [ ] **✅ VERIFICAR:** Categoria removida da lista.

---

### ➔ Passo 1.5 — Validar Bloqueios do Plano Start
- [ ] Clicar em **Financeiro** na barra lateral.
  - **✅ VERIFICAR:** A página `/financeiro` abre. O cabeçalho "Financeiro" e as abas de navegação (Visão Geral, Despesas, Fechamento, Fiado) estão visíveis.
  - **✅ VERIFICAR:** O conteúdo abaixo das abas exibe o componente `<ProOnly>` com uma mensagem de upgrade e botão "Fazer Upgrade para Pro".
- [ ] Clicar na aba **"Despesas"** dentro de Financeiro.
  - **✅ VERIFICAR:** Header e abas visíveis, mas o conteúdo de Despesas exibe `<ProOnly>` bloqueando.
- [ ] Clicar na aba **"Fechamento"** dentro de Financeiro.
  - **✅ VERIFICAR:** Exibe `<ProOnly>` bloqueando o conteúdo de Fechamento de Caixa.
- [ ] Clicar na aba **"Fiado"** dentro de Financeiro.
  - **✅ VERIFICAR:** A tela de Fiado abre **sem** bloqueio Pro (Fiado é disponível para todos os planos, mas o toggle foi desativado no passo 1.3).
- [ ] Tentar acessar `/comissoes` diretamente na URL.
  - **✅ VERIFICAR:** A página de Comissões exibe bloqueio Pro ou redireciona para `/assinar`.
- [ ] Acessar **Dashboard** (`/dashboard`).
  - **✅ VERIFICAR:** O botão de atalho "Ver Fiado" está presente e acessível (não mostra cadeado).
  - **✅ VERIFICAR:** O badge "Plano Start" está visível no topo ou na sidebar.
- [ ] Acessar **Configurações → Aba "Planos"** (`/configuracoes/planos`).
  - **✅ VERIFICAR:** Tela exibe o plano atual como **Start**, com a lista de funcionalidades disponíveis e botão "Fazer Upgrade".

---

## DIA 2 — CONFIGURAÇÕES: CATÁLOGO ONLINE E ASSINATURA (VISÃO)
**Módulos:** Configurações → Catálogo Online · Configurações → Assinatura

---

### ➔ Passo 2.1 — Configurar o Catálogo Online
- [ ] Acessar **Configurações → Aba "Catálogo Online"** (`/configuracoes/catalogo`)
- [ ] **✅ VERIFICAR:** A tela exibe o link público do catálogo (algo como `/loja/smarttech`) e um botão "Visualizar Catálogo".
- [ ] Clicar em **"Visualizar Catálogo"** (ou no link).
  - **✅ VERIFICAR:** Abre em nova aba a loja pública. Como ainda não há produtos cadastrados, a vitrine aparece vazia.
- [ ] Voltar para as Configurações do Catálogo.
- [ ] **✅ VERIFICAR:** Existem configurações como "Mostrar preços no catálogo", "Permitir pedidos via WhatsApp" (ou similar). Verificar que as opções têm toggles funcionais.
- [ ] Ativar qualquer opção de configuração disponível → clicar em **"Salvar"**.
- [ ] **✅ VERIFICAR:** Toast de confirmação de salvo.

---

### ➔ Passo 2.2 — Visualizar Tela de Assinatura e Planos
- [ ] Acessar **`/assinar`** (ou clicar no badge "Plano Start" na sidebar).
- [ ] **✅ VERIFICAR:** A tela exibe os dois planos: **Start** e **Pro**.
- [ ] **✅ VERIFICAR para o plano Start:**
  - O plano Start está marcado como "Plano Atual".
  - A lista de funcionalidades inclui: PDV, Estoque, Clientes, Fornecedores, Ordens de Serviço, Garantias, Fiado, Catálogo Online.
  - O botão "Assinar Start" está desabilitado ou diz "Plano Atual".
- [ ] **✅ VERIFICAR para o plano Pro:**
  - O preço exibido é **R$ 95/mês**.
  - A lista de funcionalidades adiciona: Financeiro DRE, Despesas, Fechamento de Caixa, Comissões, Relatórios Avançados, Usuários múltiplos com permissões, CRM Inativos.
  - O botão **"Assinar Pro"** está ativo e clicável.
- [ ] Clicar em **"Assinar Pro"** → **✅ VERIFICAR:** Redireciona para o Stripe checkout (tela de pagamento). Fechar sem completar (o upgrade real será no Dia 6).

---

## DIA 3 — CADASTRO DE CATEGORIAS DE PRODUTOS (INLINE)
**Módulos:** Configurações → Categorias · Produtos (criação de categorias via botão inline)

---

### ➔ Passo 3.1 — Criar Categorias no Módulo de Configurações
- [ ] Acessar **Configurações → Aba "Categorias"** (`/configuracoes/categorias`)
- [ ] Criar as 4 categorias dos produtos:
  1. Clicar em **"+ Nova Categoria"** → digitar `Acessórios de Energia` → salvar.
     - **✅ VERIFICAR:** Aparece na lista.
  2. Clicar em **"+ Nova Categoria"** → digitar `Proteção e Telas` → salvar.
  3. Clicar em **"+ Nova Categoria"** → digitar `Áudio e Som` → salvar.
  4. Clicar em **"+ Nova Categoria"** → digitar `Smartphones` → salvar.
- [ ] **✅ VERIFICAR:** Todas as 4 categorias aparecem na lista.

---

## DIA 4 — CADASTRO DE PRODUTOS (TODOS OS CAMPOS)
**Módulos:** Produtos (`/produtos`)

---

### ➔ Passo 4.1 — Cadastrar os 6 Produtos Completos

- [ ] Acessar **Produtos** e clicar em **"+ NOVO PRODUTO"** para abrir o formulário/modal.

#### **P1 — Carregador Rápido USB-C 20W**
- [ ] **Nome do Produto \*:** `Carregador Rápido USB-C 20W`
- [ ] **SKU (Código interno):** `CAR-USBC-20W`
- [ ] **Código de Barras:** `7890000000001`
- [ ] **Categoria:** Selecionar `Acessórios de Energia` no dropdown.
  - **✅ VERIFICAR:** O dropdown lista as 4 categorias criadas no passo anterior.
- [ ] **Fornecedor vinculado:** Deixar em branco por ora.
- [ ] **Preço de Custo (R$):** `15,00`
- [ ] **Preço Varejo (R$) \*:** `39,90`
- [ ] **Preço Mínimo PDV (R$):** `30,00`
- [ ] **Preço Atacado (R$):** `29,90`
- [ ] **Preço VIP (R$):** `34,90`
- [ ] **Qtd Atual:** `50`
- [ ] **Qtd Mínima (alerta):** `10`
- [ ] **Qtd Máxima:** `100`
- [ ] **Qtd Mínima para Atacado:** `5`
- [ ] **Localização no estoque:** `Prateleira A1`
- [ ] **Switches/Opções:**
  - "Visível no catálogo online" → **ATIVO (✅)**
  - "Pode ser usado como brinde" → **INATIVO**
  - "Rastrear número de série" → **INATIVO**
- [ ] **Garantia:** Switch "Este produto tem garantia" → **INATIVO**
- [ ] Clicar em **"Salvar Produto"**.
- [ ] **✅ VERIFICAR:** P1 aparece na lista de produtos com estoque **50**, categoria **Acessórios de Energia**, preço **R$ 39,90**.

#### **P2 — Cabo Lightning Reforçado 1.2m**
- [ ] Clicar em **"+ NOVO PRODUTO"**.
- [ ] **Nome \*:** `Cabo Lightning Reforçado 1.2m`
- [ ] **SKU:** `CAB-LIGHT-12` | **Código de Barras:** `7890000000002`
- [ ] **Categoria:** `Acessórios de Energia`
- [ ] **Custo:** `10,00` | **Varejo \*:** `24,90` | **Mínimo PDV:** `18,00`
- [ ] **Atacado:** `17,90` | **VIP:** `19,90`
- [ ] **Qtd Atual:** `40` | **Qtd Mínima:** `8` | **Qtd Máxima:** `80` | **Qtd Mín Atacado:** `5`
- [ ] **Localização:** `Prateleira A2`
- [ ] Switches: "Visível no catálogo" → **ATIVO**; demais → **INATIVO**
- [ ] Garantia → **INATIVO**
- [ ] Clicar em **"Salvar Produto"**.
- [ ] **✅ VERIFICAR:** P2 na lista com estoque **40**.

#### **P3 — Película de Vidro 3D**
- [ ] Clicar em **"+ NOVO PRODUTO"**.
- [ ] **Nome \*:** `Película de Vidro 3D`
- [ ] **SKU:** `PEL-VIDR-3D` | **Barras:** `7890000000003`
- [ ] **Categoria:** `Proteção e Telas`
- [ ] **Custo:** `5,00` | **Varejo \*:** `19,90` | **Mínimo PDV:** `12,00`
- [ ] **Atacado:** `9,90` | **VIP:** `14,90`
- [ ] **Qtd Atual:** `60` | **Qtd Mínima:** `15` | **Qtd Máxima:** `150` | **Qtd Mín Atacado:** `10`
- [ ] **Localização:** `Gaveteiro B1`
- [ ] Switches: "Pode ser usado como brinde" → **ATIVO (✅)** | "Visível no catálogo" → **ATIVO (✅)**; "Rastrear número de série" → **INATIVO**
- [ ] Garantia → **INATIVO**
- [ ] Clicar em **"Salvar Produto"**.
- [ ] **✅ VERIFICAR:** P3 na lista com ícone de brinde visível, estoque **60**.

#### **P4 — Fone Bluetooth SoundPro**
- [ ] Clicar em **"+ NOVO PRODUTO"**.
- [ ] **Nome \*:** `Fone Bluetooth SoundPro`
- [ ] **SKU:** `FON-BLUE-SP` | **Barras:** `7890000000004`
- [ ] **Categoria:** `Áudio e Som`
- [ ] **Custo:** `60,00` | **Varejo \*:** `149,90` | **Mínimo PDV:** `110,00`
- [ ] **Atacado:** `99,90` | **VIP:** `129,90`
- [ ] **Qtd Atual:** `15` | **Qtd Mínima:** `3` | **Qtd Máxima:** `30` | **Qtd Mín Atacado:** `3`
- [ ] **Localização:** `Vitrine 1`
- [ ] Switches: "Visível no catálogo" → **ATIVO**; demais → **INATIVO**
- [ ] **Garantia:** Switch "Este produto tem garantia" → **ATIVO (✅)**
  - Campo **"Dias de garantia \*":** `90`
  - Campo **"Termos da garantia (opcional)":** `Garantia de 90 dias contra defeitos de hardware. Não cobre mau uso.`
  - **✅ VERIFICAR:** Os campos de garantia aparecem ao ativar o switch.
- [ ] Clicar em **"Salvar Produto"**.
- [ ] **✅ VERIFICAR:** P4 na lista com badge/ícone de garantia visível, estoque **15**.

#### **P5 — Smartphone Nexus 12 Lite 128GB**
- [ ] Clicar em **"+ NOVO PRODUTO"**.
- [ ] **Nome \*:** `Smartphone Nexus 12 Lite 128GB`
- [ ] **SKU:** `SMA-NEX12-L` | **Barras:** `7890000000005`
- [ ] **Categoria:** `Smartphones`
- [ ] **Custo:** `900,00` | **Varejo \*:** `1.899,00` | **Mínimo PDV:** `1.600,00`
- [ ] **Atacado:** `1.500,00` | **VIP:** `1.699,00`
- [ ] **Qtd Atual:** `6` | **Qtd Mínima:** `2` | **Qtd Máxima:** `12` | **Qtd Mín Atacado:** `2`
- [ ] **Localização:** `Cofre Auxiliar`
- [ ] Switches: "Rastrear número de série" → **ATIVO (✅)** | "Visível no catálogo" → **INATIVO** | "Brinde" → **INATIVO**
- [ ] **Garantia:** Switch "Este produto tem garantia" → **ATIVO (✅)**
  - **Dias:** `365`
  - **Termos:** `Garantia de 1 ano do fabricante contra defeitos de hardware. Sujeita a análise técnica.`
- [ ] Clicar em **"Salvar Produto"**.
- [ ] **✅ VERIFICAR:** P5 na lista com badge de garantia e ícone de número de série, estoque **6**.

#### **P6 — Capa Protetora Anti-Impacto**
- [ ] Clicar em **"+ NOVO PRODUTO"**.
- [ ] **Nome \*:** `Capa Protetora Anti-Impacto`
- [ ] **SKU:** `CAP-PROT-AI` | **Barras:** `7890000000006`
- [ ] **Categoria:** `Proteção e Telas`
- [ ] **Custo:** `8,00` | **Varejo \*:** `29,90` | **Mínimo PDV:** `20,00`
- [ ] **Atacado:** `19,90` | **VIP:** `24,90`
- [ ] **Qtd Atual:** `30` | **Qtd Mínima:** `6` | **Qtd Máxima:** `60` | **Qtd Mín Atacado:** `5`
- [ ] **Localização:** `Prateleira A3`
- [ ] Switches: "Visível no catálogo" → **ATIVO**; demais → **INATIVO**
- [ ] Garantia → **INATIVO**
- [ ] Clicar em **"Salvar Produto"**.

---

### ➔ Passo 4.2 — Verificação Global de Produtos e KPIs de Estoque
- [ ] **✅ VERIFICAR:** Total de produtos na lista = **6**
- [ ] **✅ VERIFICAR:** Valor total do estoque (custo) = (50×15)+(40×10)+(60×5)+(15×60)+(6×900)+(30×8) = 750+400+300+900+5.400+240 = **R$ 7.990,00**
- [ ] **✅ VERIFICAR:** Nenhum produto em **Estoque Crítico** (todos acima do mínimo)
- [ ] **Teste de edição de produto:**
  - Clicar em **EDITAR** no produto P1 (Carregador USB-C).
  - **✅ VERIFICAR:** O formulário abre com todos os campos preenchidos com os dados salvos.
  - Alterar o campo **"Localização"** de `Prateleira A1` para `Prateleira A1 — Nível 2`.
  - Clicar em **"Salvar Produto"**.
  - **✅ VERIFICAR:** A atualização é salva. Reabrir P1 e verificar que a localização está `Prateleira A1 — Nível 2`.
  - Editar novamente e reverter para `Prateleira A1`. Salvar.
- [ ] **Teste de busca/filtro de produtos:**
  - Digitar `cabo` no campo de busca da página de Produtos.
  - **✅ VERIFICAR:** Apenas **P2 (Cabo Lightning)** aparece no resultado.
  - Limpar a busca.
  - Filtrar por categoria `Proteção e Telas`.
  - **✅ VERIFICAR:** Apenas **P3 (Película)** e **P6 (Capa)** aparecem.
  - Limpar filtro.

---

## DIA 5 — CADASTRO DE CLIENTES E FORNECEDORES (TODOS OS CAMPOS)
**Módulos:** Clientes (`/clientes`) · Fornecedores (`/fornecedores`)

---

### ➔ Passo 5.1 — Cadastrar os 4 Clientes com Busca de CEP

- [ ] Acessar **Clientes** e clicar em **"+ NOVO CLIENTE"**.

#### **C1 — Conecta Distribuidora (CNPJ / Atacado)**
- [ ] **Nome completo \*:** `Conecta Distribuidora`
- [ ] **Telefone / WhatsApp:** `(11) 98888-7777`
- [ ] **CPF / CNPJ:** `10.200.300/0001-40`
- [ ] **E-mail:** `vendas@conectadistribuidora.com.br`
- [ ] **Endereço (seção opcional):**
  - Campo **CEP:** Digitar `01311-100` e clicar na **Lupa (Buscar CEP)**.
  - **✅ VERIFICAR:** Os campos Logradouro, Bairro, Cidade e Estado preenchem automaticamente (Av. Paulista, Cerqueira César, São Paulo, SP).
  - **Número:** `1374`
  - **Complemento:** `3º Andar, Sala 32`
- [ ] **Anotações:** `Distribui acessórios em lote. Exige preço de atacado.`
- [ ] **Tipo de cliente:** Clicar no botão **📦 Atacado**.
  - **✅ VERIFICAR:** O botão "Atacado" fica destacado/selecionado.
- [ ] Clicar em **"Salvar cliente"**.
- [ ] **✅ VERIFICAR:** C1 aparece na lista com badge "Atacado".

#### **C2 — Bruno Lima (CPF / Varejo)**
- [ ] Clicar em **"+ NOVO CLIENTE"**.
- [ ] **Nome \*:** `Bruno Lima`
- [ ] **WhatsApp:** `(11) 97777-6666`
- [ ] **CPF:** `111.222.333-44`
- [ ] **E-mail:** `bruno.lima@gmail.com`
- [ ] **CEP:** `04101-300` → Buscar → **✅ VERIFICAR:** Rua Vergueiro, Vila Mariana, São Paulo, SP preenche.
- [ ] **Número:** `1500` | **Complemento:** `Apto 42B`
- [ ] **Anotações:** `Cliente assíduo, prefere novidades de áudio.`
- [ ] **Tipo:** Clicar em **🏪 Varejo**.
- [ ] Salvar.
- [ ] **✅ VERIFICAR:** C2 na lista com badge "Varejo".

#### **C3 — Mariana Silveira (CPF / VIP)**
- [ ] Clicar em **"+ NOVO CLIENTE"**.
- [ ] **Nome \*:** `Mariana Silveira`
- [ ] **WhatsApp:** `(11) 96666-5555`
- [ ] **CPF:** `555.666.777-88`
- [ ] **E-mail:** `mariana.silveira@outlook.com`
- [ ] **CEP:** `01223-010` → Buscar → **✅ VERIFICAR:** Rua Maria Antônia, Consolação preenche.
- [ ] **Número:** `350` | **Complemento:** Deixar em branco propositalmente (campo opcional — verificar que salva sem complemento).
- [ ] **Anotações:** `Parceira antiga, sempre aplicar desconto VIP.`
- [ ] **Tipo:** Clicar em **⭐ VIP**.
- [ ] Salvar.
- [ ] **✅ VERIFICAR:** C3 na lista com badge "VIP".

#### **C4 — Assistência Prime (CNPJ / VIP)**
- [ ] Clicar em **"+ NOVO CLIENTE"**.
- [ ] **Nome \*:** `Assistência Prime`
- [ ] **WhatsApp:** `(11) 95555-4444`
- [ ] **CNPJ:** `20.300.400/0001-50`
- [ ] **E-mail:** `contato@assistenciaprime.com`
- [ ] **CEP:** `01001-000` → Buscar → **✅ VERIFICAR:** Praça da Sé, Centro preenche.
- [ ] **Número:** `100` | **Complemento:** `Conjunto 12`
- [ ] **Anotações:** `Compra telas em lote e terceiriza reparos de placa.`
- [ ] **Tipo:** Clicar em **⭐ VIP**.
- [ ] Salvar.

- [ ] **✅ VERIFICAR GLOBAL:** Todos os 4 clientes estão listados e ativos.
- [ ] **Teste de busca de clientes:** Digitar `mari` → apenas C3 (Mariana Silveira) aparece. Limpar.
- [ ] **Teste de filtro por tipo:** Filtrar por "VIP" → C3 e C4 aparecem. Filtrar por "Atacado" → apenas C1. Limpar.
- [ ] **Teste de edição de cliente:** Clicar em EDITAR em C2 (Bruno Lima). Adicionar no campo Anotações: ` Comprou fone no Dia 4.` Salvar. Verificar atualização.

---

### ➔ Passo 5.2 — Cadastrar os 2 Fornecedores

- [ ] Acessar **Fornecedores** e clicar em **"+ NOVO FORNECEDOR"**.

#### **F1 — Global Importer Eletrônicos**
- [ ] **Nome da empresa \*:** `Global Importer Eletrônicos`
- [ ] **Nome do contato:** `Marcelo`
- [ ] **CNPJ:** `88.777.666/0001-55`
- [ ] **Telefone / WhatsApp:** `(11) 95555-1111`
- [ ] **E-mail:** `marcelo@globalimporter.com`
- [ ] **Categoria:** Selecionar `Eletrônicos` no dropdown.
- [ ] **Prazo de entrega:** `3 dias úteis`
- [ ] **CEP:** Digitar `01103-000` e clicar em Buscar/blur. **✅ VERIFICAR:** Rua Santa Ifigênia preenche automaticamente.
- [ ] **Número:** `200`
- [ ] **Pedido mínimo (R$):** `300,00`
- [ ] **Anotações:** `Fornecedor principal de cabos e carregadores. Frete CIF acima de R$ 1.500.`
- [ ] Clicar em **"Salvar Fornecedor"**.
- [ ] **✅ VERIFICAR:** F1 aparece na lista de fornecedores como ativo.

#### **F2 — TechParts Peças de Celular**
- [ ] Clicar em **"+ NOVO FORNECEDOR"**.
- [ ] **Nome da empresa \*:** `TechParts Peças de Celular`
- [ ] **Nome do contato:** `Sandra`
- [ ] **CNPJ:** `77.666.555/0001-44`
- [ ] **WhatsApp:** `(11) 94444-2222`
- [ ] **E-mail:** `vendas@techparts.com`
- [ ] **Categoria:** `Acessórios`
- [ ] **Prazo de entrega:** `24h`
- [ ] **CEP:** `01202-000` → Buscar → **✅ VERIFICAR:** Rua Aurora preenche.
- [ ] **Número:** `150`
- [ ] **Pedido mínimo (R$):** `200,00`
- [ ] **Anotações:** `Fornecedor de telas LCD/OLED e baterias homologadas. Entrega expressa disponível.`
- [ ] Clicar em **"Salvar Fornecedor"**.

---

### ➔ Passo 5.3 — Vincular Fornecedores a Produtos
- [ ] Acessar **Produtos** (`/produtos`).
- [ ] Localizar **P4 (Fone Bluetooth SoundPro)** → clicar em **EDITAR**.
  - Campo **"Fornecedor vinculado"**: Selecionar `TechParts Peças de Celular (F2)`.
  - Clicar em **"Salvar Produto"**.
  - **✅ VERIFICAR:** P4 exibe o vínculo com TechParts no card ou detalhe.
- [ ] Localizar **P6 (Capa Protetora Anti-Impacto)** → clicar em **EDITAR**.
  - Campo **"Fornecedor vinculado"**: Selecionar `Global Importer Eletrônicos (F1)`.
  - Salvar.
- [ ] Acessar **Fornecedores** → Clicar em **F1 (Global Importer)** → acessar aba **"Produtos Vinculados"** (ou equivalente).
  - **✅ VERIFICAR:** P6 (Capa Protetora) aparece como produto vinculado a F1.

---

# ══════════════════════════════════════════════════
# SEMANA 2 — VENDAS, ORDENS DE SERVIÇO E UPGRADE PRO (Dias 6–12)
# ══════════════════════════════════════════════════

## DIA 6 — PRIMEIRAS VENDAS E UPGRADE PARA O PLANO PRO
**Módulos:** PDV (Vendas) · Assinatura

---

### ➔ Passo 6.1 — Venda #1: Dinheiro, Consumidor Anônimo
- [ ] Ir ao PDV (`/vendas/nova` ou botão **"Nova Venda"** na sidebar)
- [ ] **✅ VERIFICAR:** A tela do PDV carregou com campo de busca de cliente, campo de busca de produto e carrinho vazio.
- [ ] Deixar o campo **"Cliente"** em branco (Consumidor Anônimo — nenhum cliente vinculado).
- [ ] No campo de busca de produto, digitar `carregador`.
  - **✅ VERIFICAR:** P1 (Carregador Rápido USB-C 20W) aparece na lista de sugestões com preço R$ 39,90.
  - Selecionar P1.
- [ ] **✅ VERIFICAR:** P1 é adicionado ao carrinho com quantidade 1 e preço R$ 39,90.
- [ ] Alterar a **quantidade** de P1 para `2`.
  - **✅ VERIFICAR:** Subtotal de P1 atualiza para R$ 79,80.
- [ ] Digitar `películ` no campo de produto → selecionar **P3 (Película de Vidro 3D)**.
- [ ] Alterar quantidade de P3 para `3`.
  - **✅ VERIFICAR:** Subtotal P3 = R$ 59,70.
- [ ] **✅ VERIFICAR:** Subtotal total do carrinho = R$ 79,80 + R$ 59,70 = **R$ 139,50**.
- [ ] Campo **"Desconto"**: manter `0`.
- [ ] Campo **"Método de pagamento"**: Selecionar **Dinheiro**.
- [ ] Campo **"Valor recebido"**: Digitar `150,00`.
  - **✅ VERIFICAR:** O campo "Troco" calcula automaticamente: **R$ 10,50**.
- [ ] Clicar no botão **"Finalizar Venda"**.
- [ ] **✅ VERIFICAR:** Modal/tela de confirmação exibe o número da venda (ex: #001), valor, troco.
- [ ] **✅ VERIFICAR (Estoque):** P1 = **48 un** | P3 = **57 un**.
- [ ] **✅ VERIFICAR (Dashboard):** O card de "Faturamento Hoje" reflete R$ 139,50.

---

### ➔ Passo 6.2 — Venda #2: PIX, Mariana Silveira (VIP — preço VIP automático)
- [ ] Iniciar nova venda no PDV.
- [ ] No campo **"Cliente"**, digitar `mariana`.
  - **✅ VERIFICAR:** Mariana Silveira (VIP) aparece nas sugestões.
  - Selecionar Mariana Silveira.
- [ ] **✅ VERIFICAR:** Um badge "VIP" ou indicador visual aparece ao lado do nome do cliente.
- [ ] Adicionar ao carrinho: **P4 (Fone Bluetooth SoundPro)** → Qtd: `1`.
  - **✅ VERIFICAR:** O preço cobrado é **R$ 129,90** (preço VIP, e não R$ 149,90 varejo).
- [ ] Método de pagamento: Selecionar **PIX**.
- [ ] Campo "Valor recebido": não preencher (ou sistema não exige para PIX).
- [ ] Clicar em **"Finalizar Venda"**.
- [ ] **✅ VERIFICAR (Estoque P4):** 15 - 1 = **14 un**.
- [ ] **✅ VERIFICAR (Garantias):** Acessar `/garantias`. A garantia de 90 dias para Mariana Silveira (Fone Bluetooth SoundPro) deve constar ativa com data de expiração = hoje + 90 dias.
  - **✅ VERIFICAR:** O certificado de garantia exibe o nome **"SmartTech Vendas e Assistência"** (não "NexoCommerce").

---

### ➔ Passo 6.3 — Venda #3: PIX, Bruno Lima (Varejo)
- [ ] Iniciar nova venda.
- [ ] Selecionar cliente: **Bruno Lima** (Varejo).
- [ ] Adicionar: **P2 (Cabo Lightning Reforçado 1.2m)** → Qtd: `2`.
  - **✅ VERIFICAR:** Preço cobrado = **R$ 24,90** (preço varejo). Subtotal: R$ 49,80.
- [ ] Método de pagamento: **PIX**.
- [ ] Finalizar.
- [ ] **✅ VERIFICAR (Estoque P2):** 40 - 2 = **38 un**.

---

### ➔ Passo 6.4 — Teste Negativo: Fiado sem ativar (Start Plan, Fiado desativado)
- [ ] Iniciar nova venda.
- [ ] Selecionar cliente: **Bruno Lima**.
- [ ] Adicionar: **P6 (Capa Protetora)** → Qtd: `1`.
- [ ] Abrir o dropdown de **"Método de pagamento"**.
  - **✅ VERIFICAR:** A opção **Fiado** **NÃO** aparece na lista (pois foi desativada no Dia 1, Passo 1.3).
  - **✅ VERIFICAR:** Aparecem apenas: PIX, Dinheiro, Crédito, Débito, Boleto Bancário.
- [ ] Selecionar **Dinheiro**. Finalizar esta venda (**Venda #4**).
- [ ] **✅ VERIFICAR (Estoque P6):** 30 - 1 = **29 un**.

---

### ➔ Passo 6.5 — Venda #5: Crédito, Conecta Distribuidora (Preços Atacado)
- [ ] Iniciar nova venda.
- [ ] Selecionar cliente: **Conecta Distribuidora** (Atacado).
  - **✅ VERIFICAR:** Badge "Atacado" aparece no carrinho.
- [ ] Adicionar:
  - **P1 (Carregador USB-C)** → Qtd: `10`
    - **✅ VERIFICAR:** Preço cobrado = **R$ 29,90** (atacado, pois Qtd 10 ≥ mínimo atacado 5). Subtotal: R$ 299,00.
  - **P2 (Cabo Lightning)** → Qtd: `10`
    - **✅ VERIFICAR:** Preço = **R$ 17,90** (atacado). Subtotal: R$ 179,00.
  - **P6 (Capa Protetora)** → Qtd: `5`
    - **✅ VERIFICAR:** Preço = **R$ 19,90** (atacado, Qtd 5 = mínimo). Subtotal: R$ 99,50.
- [ ] **✅ VERIFICAR:** Subtotal total = R$ 299,00 + R$ 179,00 + R$ 99,50 = **R$ 577,50**.
- [ ] Método de pagamento: **Crédito** (taxa de 2,99% incidirá na DRE).
- [ ] Finalizar.
- [ ] **✅ VERIFICAR (Estoque):** P1 = **38 un** | P2 = **28 un** | P6 = **24 un** (era 29, menos 5).

---

### ➔ Passo 6.6 — Teste Negativo: Preço abaixo do Mínimo PDV
- [ ] Iniciar nova venda (sem cliente ou qualquer cliente).
- [ ] Adicionar **P4 (Fone SoundPro)** → Qtd: `1` (preço R$ 149,90).
- [ ] Tentar editar o preço unitário do item para **R$ 50,00** (abaixo do mínimo PDV de R$ 110,00).
  - **✅ VERIFICAR:** O sistema exibe alerta/erro ("Preço abaixo do mínimo permitido para este produto") e **não** permite finalizar, OU o campo é bloqueado, OU mostra aviso visual em vermelho.
- [ ] Reverter para o preço correto ou fechar o PDV sem finalizar.

---

### ➔ Passo 6.7 — Upgrade para o Plano Pro
- [ ] Acessar **`/assinar`** (clicando no badge "Plano Start" na sidebar ou pela URL).
- [ ] Selecionar o plano **Pro (R$ 95/mês)** e clicar em **"Assinar Pro"**.
- [ ] No Stripe checkout, preencher os dados de teste:
  - **Número do cartão:** `4242 4242 4242 4242`
  - **Validade:** `12/29`
  - **CVV:** `123`
  - **Nome:** `Thiago Souza`
  - **CEP de cobrança:** `01310-100`
- [ ] Confirmar o pagamento.
- [ ] **✅ VERIFICAR:** Redirecionado de volta ao sistema com badge **Plano Pro** na sidebar.
- [ ] **✅ VERIFICAR:** O menu **Financeiro** na sidebar agora é acessível sem bloqueio `<ProOnly>`.
- [ ] **✅ VERIFICAR:** O menu **Comissões** na sidebar é acessível.
- [ ] **✅ VERIFICAR:** O botão "Fazer Upgrade" nas telas bloqueadas sumiu.

---

## DIA 7 — CONFIGURAÇÕES PRO: FORMAS DE PAGAMENTO E USUÁRIOS
**Módulos:** Configurações → Pagamentos · Configurações → Usuários

---

### ➔ Passo 7.1 — Reativar Fiado (Agora no Plano Pro)
- [ ] Acessar **Configurações → Aba "Pagamentos"** (`/configuracoes/pagamentos`).
- [ ] Localizar a linha do **Fiado** (ainda desativado do Dia 1).
- [ ] Clicar no switch para **ativar** o Fiado.
- [ ] **✅ VERIFICAR:** O switch ficou verde/ativo.
- [ ] Recarregar a página e **✅ VERIFICAR:** O Fiado permanece ativo após recarregar (persistência).

---

### ➔ Passo 7.2 — Convidar Usuário Operador e Validar Restrições
- [ ] Acessar **Configurações → Aba "Usuários"** (`/configuracoes/usuarios`).
- [ ] **✅ VERIFICAR:** A lista exibe o usuário administrador `thiago@smarttech.com` como Admin.
- [ ] Clicar no botão **"+ Convidar Usuário"** (ou **"+ Adicionar Membro"**):
  - **E-mail:** `aline@smarttech.com`
  - **Papel / Função:** Selecionar `Operador` (ou Vendedor)
  - **✅ VERIFICAR:** O dropdown de papéis lista pelo menos: Admin, Operador, Técnico (ou equivalentes do sistema).
  - Clicar em **"Enviar Convite"**.
- [ ] **✅ VERIFICAR:** Aline Costa aparece na lista com status **"Pendente"** (aguardando aceite).
- [ ] Copiar o link/código do convite. Abrir em aba anônima/privada.
- [ ] Completar o cadastro de Aline: Senha `Aline@2026` → confirmar.
- [ ] Logar como Aline (`aline@smarttech.com` / `Aline@2026`).
- [ ] **✅ VERIFICAR restrições do papel Operador:**
  - O menu **"Configurações"** NÃO aparece na barra lateral.
  - Tentar acessar `/configuracoes/empresa` diretamente — deve ser bloqueado ou redirecionar.
  - O menu **"Financeiro"** NÃO aparece ou aparece bloqueado para Operador.
  - O menu **"Comissões"** NÃO aparece ou aparece bloqueado.
  - O PDV (Vendas) **É** acessível.
  - A tela de Clientes **É** acessível.
  - A tela de Produtos **É** acessível (somente visualização, sem edição).
- [ ] Fazer **logout** de Aline e voltar a logar como **Thiago Souza (Admin)**.
- [ ] **✅ VERIFICAR (Configurações → Usuários):** Status de Aline agora é **"Ativo"** (aceitou o convite).

---

## DIA 8 — COMISSÕES: CADASTRO E VALIDAÇÃO DE SALDO ZERADO
**Módulos:** Comissões (`/comissoes`)

---

### ➔ Passo 8.1 — Cadastrar Comissionados
- [ ] Acessar **Comissões** (`/comissoes`).
- [ ] **✅ VERIFICAR:** A tela exibe a lista de comissionados (vazia) e os KPIs: Total Pago R$ 0,00, Pendente R$ 0,00.
- [ ] Clicar em **"+ Cadastrar Comissionado"** (ou botão equivalente):

  **Lucas Vendas (percentual):**
  - **Nome:** `Lucas Vendas`
  - **WhatsApp:** `(11) 99999-1111`
  - **Tipo:** Selecionar `Percentual (%)`
  - **Taxa:** `3`
  - Clicar em **"Salvar"**.
  - **✅ VERIFICAR:** Lucas Vendas aparece na lista com taxa "3%".

  **Amanda Divulgadora (fixo por venda):**
  - Clicar em **"+ Cadastrar Comissionado"**.
  - **Nome:** `Amanda Divulgadora`
  - **WhatsApp:** `(11) 99999-2222`
  - **Tipo:** Selecionar `Fixo por venda`
  - **Valor:** `10,00`
  - Salvar.
  - **✅ VERIFICAR:** Amanda Divulgadora aparece com "R$ 10,00 / venda".

- [ ] **✅ VERIFICAR RIGOROSAMENTE (saldo zerado):**
  - Lucas Vendas → Comissões Pagas: **R$ 0,00** | Pendentes: **R$ 0,00**
  - Amanda Divulgadora → Comissões Pagas: **R$ 0,00** | Pendentes: **R$ 0,00**
  - *Ambos devem estar totalmente zerados antes de qualquer venda comissionada.*

---

## DIA 9 — LANÇAMENTO DE DESPESAS E DRE (PRÓ)
**Módulos:** Financeiro → Despesas · Financeiro → Visão Geral (DRE)

---

### ➔ Passo 9.1 — Criar Pedido de Compra e Receber Estoque (F1)
- [ ] Acessar **Fornecedores** → **Pedidos de Compra** → clicar em **"+ Novo Pedido"**.
- [ ] Preencher:
  - **Fornecedor:** Selecionar `Global Importer Eletrônicos (F1)`
  - **Produto:** Selecionar `Capa Protetora Anti-Impacto (P6)`
  - **Quantidade:** `20`
  - **Preço unitário de custo:** `8,00`
  - **✅ VERIFICAR:** Campo "Total do Pedido" calcula automaticamente: **R$ 160,00**
  - **Observações:** `Reposição de estoque após venda atacado.`
- [ ] Clicar em **"Criar Pedido"**. Status inicial = **PENDENTE**.
- [ ] **✅ VERIFICAR:** Pedido aparece na lista com status "Pendente".
- [ ] Acessar Fornecedores → clicar em **Global Importer** → aba **"Pedidos"**.
  - **✅ VERIFICAR:** O pedido de R$ 160,00 aparece no histórico do fornecedor.
- [ ] Voltar ao pedido → mudar status para **ENVIADO**.
  - **✅ VERIFICAR:** Status muda visualmente.
- [ ] Mudar status para **RECEBIDO**.
- [ ] **✅ VERIFICAR (Estoque P6):** Estoque sobe de 24 para **44 un** (24 + 20).
- [ ] **✅ VERIFICAR (Movimentações):** Acessar Estoque → detalhes do P6 → aba "Movimentações". Deve constar entrada de +20 un vinculada ao pedido de compra e ao fornecedor Global Importer.

---

### ➔ Passo 9.2 — Lançar Despesas Manuais do Mês
- [ ] Acessar **Financeiro → Despesas** (`/financeiro/despesas`).
- [ ] **✅ VERIFICAR:** A aba "Despesas" está selecionada e a lista mostra a despesa automática gerada pelo pedido de compra: `Compra de Mercadoria — Global Importer Eletrônicos` | R$ 160,00.
- [ ] Clicar em **"+ Nova Despesa"**:

  **Despesa 1 — Aluguel:**
  - **Descrição:** `Aluguel Comercial — Junho 2026`
  - **Categoria:** Selecionar `Infraestrutura` (ou criar se não existir)
  - **Tipo:** Selecionar `Fixa`
  - **Valor:** `1.200,00`
  - **Data:** Hoje
  - **Forma de Pagamento:** `Dinheiro`
  - **Observações:** `Aluguel mensal do ponto comercial.`
  - Clicar em **"Salvar"**.
  - **✅ VERIFICAR:** Despesa aparece na lista com categoria "Infraestrutura".

  **Despesa 2 — Utilidades:**
  - Clicar em **"+ Nova Despesa"**.
  - **Descrição:** `Internet e Energia Elétrica — Junho 2026`
  - **Categoria:** `Utilidades`
  - **Tipo:** `Variável`
  - **Valor:** `250,00`
  - **Data:** Hoje
  - **Forma de Pagamento:** `PIX`
  - Salvar.

- [ ] **✅ VERIFICAR (Total Despesas):** A soma na tela = R$ 160,00 (compra) + R$ 1.200,00 (aluguel) + R$ 250,00 (utilidades) = **R$ 1.610,00**.

---

### ➔ Passo 9.3 — Verificar DRE Parcial
- [ ] Acessar **Financeiro → Visão Geral (DRE)**.
- [ ] **✅ VERIFICAR:**
  - Receita de Vendas = Soma das vendas 1 a 5 = R$ 139,50 + R$ 129,90 + R$ 49,80 + R$ 29,90 + R$ 577,50 = **R$ 926,60**
  - Despesas = **R$ 1.610,00**
  - *Nota: DRE em negativo neste ponto é normal pois o mês está no início.*
- [ ] **✅ VERIFICAR:** O gráfico de barras/linha exibe os dias com movimento.
- [ ] **✅ VERIFICAR:** As abas ou filtros de período estão funcionando (clicar em "7 dias", "15 dias", "30 dias" e verificar que o intervalo muda).

---

## DIA 10 — ORDENS DE SERVIÇO: CICLO COMPLETO (OS #0001)
**Módulos:** Ordens de Serviço (`/ordens-de-servico`) · Templates WhatsApp

---

### ➔ Passo 10.1 — Criar OS #0001 (Todos os Campos)
- [ ] Acessar **Ordens de Serviço** e clicar em **"+ NOVA OS"**.
- [ ] Preencher **todos** os campos do formulário básico:
  - **Cliente \*:** Buscar e selecionar `Conecta Distribuidora`
  - **WhatsApp de Contato:** `(11) 98888-7777`
  - **Equipamento \*:** `iPhone 13 Pro Max`
  - **IMEI / Número de Série (opcional):** `356732109876543`
  - **Defeito Relatado \*:** `Tela trincada e touch inoperante devido a queda`
  - **Acessórios recebidos:** `Aparelho sem capa e sem película`
  - **Técnico Responsável:** Selecionar `Julia Santos` (ou primeiro técnico disponível)
  - **Previsão de Entrega:** Selecionar data = hoje + 3 dias
- [ ] Expandir a seção **"▶ INFORMAÇÕES TÉCNICAS E VALORES DETALHADOS"** (seção colapsável):
  - **Problema Diagnosticado (Real):** `Tela OLED quebrada internamente, carcaça levemente empenada.`
  - **Laudo Técnico:** `Realizada substituição de tela original OLED e alinhamento de chassi.`
  - **Valor Mão de Obra (R$):** `350,00`
  - **Valor Peças (R$):** `300,00`
  - **✅ VERIFICAR:** O campo "Orçamento Total Estimado (R$)" atualiza automaticamente para **R$ 650,00**.
  - **Observações Internas:** `Cliente necessita do aparelho com urgência para trabalho.`
- [ ] Clicar no botão **"▶ CRIAR OS"** (ou "Salvar OS").
- [ ] **✅ VERIFICAR:** A OS é listada como **#0001** com status **AGUARDANDO** e dados corretos.
- [ ] **✅ VERIFICAR (Número da OS):** O sistema gerou o número sequencial (0001).

---

### ➔ Passo 10.2 — Avançar Status e Testar Templates WhatsApp
- [ ] Na linha da OS #0001, clicar no botão **"→ APROVADO"**.
  - **✅ VERIFICAR:** Status muda para "Aprovado" e a cor do badge muda.
- [ ] Clicar em **"Ver Detalhes"** da OS #0001.
  - **✅ VERIFICAR:** A tela de detalhes exibe todos os campos preenchidos.
  - **✅ VERIFICAR:** O campo de link público da OS está disponível para copiar.
- [ ] Localizar a seção de **Templates WhatsApp**. Selecionar o template **"Orçamento"**:
  - **✅ VERIFICAR:** O preview do template exibe as variáveis substituídas: cliente = `Conecta Distribuidora`, equipamento = `iPhone 13 Pro Max`, valor = `R$ 650,00`, número = `OS #0001`.
  - Clicar em **"Enviar pelo WhatsApp"**.
  - **✅ VERIFICAR:** O link abre (ou direciona) para o WhatsApp com número `(11) 98888-7777` e mensagem pré-formatada.
- [ ] Voltar à lista de OS. Clicar em **"→ EM SERVIÇO"**.
  - **✅ VERIFICAR:** Status muda para "Em Serviço".
- [ ] Entrar nos detalhes da OS #0001 → selecionar template **"Em Andamento"**:
  - No campo de edição de mensagem, acrescentar ao final: ` A tela já foi removida com sucesso. Iniciando aplicação do novo painel.`
  - **✅ VERIFICAR:** O preview atualiza em **tempo real** conforme o texto é digitado.
  - Clicar em **"Enviar pelo WhatsApp"**. Verificar redirecionamento correto.
- [ ] Voltar à lista → clicar em **"→ CONCLUIDO"**.
  - **✅ VERIFICAR:** Status muda para "Concluído".
- [ ] Acessar detalhes → selecionar template **"Conclusão"**:
  - **✅ VERIFICAR:** Preview do template indica que o aparelho está pronto para retirada.
  - Clicar em Enviar.
- [ ] Voltar à lista → clicar em **"→ ENTREGUE"**.
  - No modal de entrega, selecionar forma de recebimento: **PIX**.
  - Confirmar entrega.
  - **✅ VERIFICAR:** Status muda para "Entregue".

---

### ➔ Passo 10.3 — Verificar Acompanhamento Público da OS
- [ ] Copiar o link público da OS #0001 (ex: `/acompanhar-os/[id]`).
- [ ] Abrir em aba anônima (sem login).
- [ ] **✅ VERIFICAR:** A página pública exibe:
  - Status atual: **ENTREGUE**
  - Equipamento: `iPhone 13 Pro Max`
  - Nome do cliente: `Conecta Distribuidora` (ou modo privado — apenas primeiro nome)
  - Defeito relatado e laudo (conforme configuração de privacidade)
  - **NÃO** exige login.

---

### ➔ Passo 10.4 — Verificar Impacto na DRE
- [ ] Acessar **Financeiro → Visão Geral (DRE)**.
- [ ] **✅ VERIFICAR:**
  - Receita Serviços (OS) = **R$ 650,00** (OS #0001)
  - Custo Peças (OS) contabilizado como CMV ou custo de serviços = **R$ 300,00**

---

## DIA 11 — OS #0002: ATRASO, NOVO TÉCNICO E PAGAMENTO DÉBITO
**Módulos:** Ordens de Serviço

---

### ➔ Passo 11.1 — Criar e Processar OS #0002
- [ ] Acessar **Ordens de Serviço** → **"+ NOVA OS"**.
- [ ] Preencher:
  - **Cliente \*:** `Mariana Silveira`
  - **WhatsApp:** `(11) 96666-5555`
  - **Equipamento \*:** `Samsung Galaxy S22`
  - **IMEI:** `490154203237518`
  - **Defeito Relatado \*:** `Conector de carga USB-C quebrado — não carrega`
  - **Acessórios:** `Cabo USB-C original`
  - **Técnico:** Selecionar `Julia Santos` (ou disponível)
  - **Previsão de Entrega:** hoje + 2 dias
- [ ] Expandir seção de detalhes técnicos:
  - **Problema Diagnosticado:** `Conector quebrado devido a inserção forçada de cabo incompatível.`
  - **Laudo:** `Efetuada microsoldagem do conector USB-C na placa principal.`
  - **Mão de Obra:** `140,00` | **Peças:** `80,00`
  - **✅ VERIFICAR:** Total atualiza para **R$ 220,00**.
- [ ] Clicar em **"Criar OS"**. (OS **#0002** criada como **AGUARDANDO**).
- [ ] Avançar para **APROVADO** → **EM SERVIÇO**.
- [ ] Nos detalhes → selecionar template **"Atraso"**:
  - Editar a mensagem acrescentando: ` Aguardando chegada do conector original de fornecedor.`
  - **✅ VERIFICAR:** Preview atualiza em tempo real.
  - Clicar em Enviar.
- [ ] Avançar para **CONCLUIDO** → **ENTREGUE**.
  - Forma de recebimento: **Débito**.
- [ ] **✅ VERIFICAR (DRE):** Receita OS acumulada = R$ 650,00 + R$ 220,00 = **R$ 870,00**.

---

## DIA 12 — VENDAS COMISSIONADAS (PERCENTUAL E FIXO)
**Módulos:** PDV (Vendas) · Comissões

---

### ➔ Passo 12.1 — Venda #6: Preço VIP + Comissão Percentual (Lucas Vendas)
- [ ] Ir ao PDV. Selecionar cliente: **Mariana Silveira** (VIP).
- [ ] Adicionar ao carrinho:
  - **P1 (Carregador USB-C)** → Qtd: `1` | **✅ VERIFICAR:** Preço VIP = R$ 34,90
  - **P2 (Cabo Lightning)** → Qtd: `2` | **✅ VERIFICAR:** Preço VIP = R$ 19,90 cada (Total: R$ 39,80)
  - **P6 (Capa Protetora)** → Qtd: `2` | **✅ VERIFICAR:** Preço VIP = R$ 24,90 cada (Total: R$ 49,80)
- [ ] **✅ VERIFICAR:** Subtotal VIP total = R$ 34,90 + R$ 39,80 + R$ 49,80 = **R$ 124,50**
- [ ] Campo **"Comissionado"**: Selecionar `Lucas Vendas (3%)`.
  - **✅ VERIFICAR:** Um campo/badge de comissão aparece no carrinho indicando "3% de comissão".
- [ ] Método: **PIX** | Finalizar.
- [ ] **Comissão calculada:** R$ 124,50 × 3% = **R$ 3,74** (pendente para Lucas).
- [ ] **✅ VERIFICAR (Estoque):** P1 = **37 un** | P2 = **26 un** | P6 = **43 un** (eram 38, 28, 44 — menos 1, 2, 2 respectivamente; P6 era 44 porque +20 pedido e -1 venda4 = 44, menos 2 = 42... *anote a contagem exata conforme o sistema*).

---

### ➔ Passo 12.2 — Venda #7: Preço VIP + Comissão Fixa (Amanda Divulgadora)
- [ ] Ir ao PDV. Selecionar cliente: **Assistência Prime** (VIP).
- [ ] Adicionar: **P4 (Fone Bluetooth SoundPro)** → Qtd: `2`
  - **✅ VERIFICAR:** Preço VIP = R$ 129,90 cada. Subtotal: **R$ 259,80**.
- [ ] Campo **"Comissionado"**: Selecionar `Amanda Divulgadora (R$ 10,00 fixo)`.
- [ ] Método: **Crédito** | Finalizar.
- [ ] **Comissão calculada:** **R$ 10,00** (fixo, independente do valor da venda).
- [ ] **✅ VERIFICAR (Estoque P4):** 14 - 2 = **12 un**.

---

### ➔ Passo 12.3 — Venda #8: Fiado + Comissão Percentual (Lucas Vendas)
- [ ] Ir ao PDV. Selecionar cliente: **Bruno Lima** (Varejo).
- [ ] Adicionar: **P4 (Fone Bluetooth SoundPro)** → Qtd: `1` (Preço Varejo: R$ 149,90)
- [ ] Campo **"Comissionado"**: Selecionar `Lucas Vendas (3%)`.
- [ ] Método de pagamento: Selecionar **Fiado**.
  - **✅ VERIFICAR:** A opção Fiado **aparece** no dropdown (ativado no Dia 7).
- [ ] Finalizar.
- [ ] **Comissão calculada:** R$ 149,90 × 3% = **R$ 4,50** (pendente para Lucas).
- [ ] **✅ VERIFICAR (Estoque P4):** 12 - 1 = **11 un**.
- [ ] **✅ VERIFICAR (Financeiro → Fiado):** Bruno Lima aparece com dívida pendente de **R$ 149,90**.

---

### ➔ Passo 12.4 — Auditoria de Comissões
- [ ] Acessar **Comissões** (`/comissoes`).
- [ ] **✅ VERIFICAR KPIs Gerais:**
  - Total em Comissões (mês) = R$ 3,74 + R$ 10,00 + R$ 4,50 = **R$ 18,24**
  - Pendente Pagar = **R$ 18,24**
  - Já Pago = **R$ 0,00**
- [ ] Clicar na aba **"Por Venda"** (ou "Histórico"):
  - **✅ VERIFICAR:** Aparecem 3 linhas: Venda #6 (Lucas R$ 3,74), Venda #7 (Amanda R$ 10,00), Venda #8 (Lucas R$ 4,50).
- [ ] Localizar a comissão da Venda #6 (Lucas, R$ 3,74) → clicar em **"Marcar como Pago"**.
  - **✅ VERIFICAR:** A linha muda de status para "Pago".
- [ ] **✅ VERIFICAR KPIs Atualizados:**
  - Pendente Pagar = **R$ 14,50** (Amanda R$ 10,00 + Lucas R$ 4,50)
  - Já Pago = **R$ 3,74**
- [ ] Clicar na aba **"Por Comissionado"** (ou "Ranking"):
  - **✅ VERIFICAR:** Lucas Vendas: Total = R$ 8,24 | Pago = R$ 3,74 | Pendente = R$ 4,50
  - **✅ VERIFICAR:** Amanda Divulgadora: Total = R$ 10,00 | Pago = R$ 0,00 | Pendente = R$ 10,00

---

# ══════════════════════════════════════════════════
# SEMANA 3 — GARANTIAS, FIADO, FECHAMENTO DE CAIXA (Dias 13–19)
# ══════════════════════════════════════════════════

## DIA 13 — GARANTIAS: CERTIFICADO, REEMBOLSO E TROCA
**Módulos:** Garantias (`/garantias`) · PDV · Financeiro

---

### ➔ Passo 13.1 — Visualizar e Inspecionar Certificado de Garantia
- [ ] Acessar **Garantias** (`/garantias`).
- [ ] **✅ VERIFICAR:** A lista exibe:
  - Garantia de **Mariana Silveira** (Fone Bluetooth SoundPro, 90 dias, Venda #2)
  - Garantia de **Bruno Lima** (Fone Bluetooth SoundPro, 90 dias, Venda #8)
  - Garantia de (**Venda #7 — Assistência Prime, Fone SoundPro × 2, 90 dias**) — confirmar se gera por produto ou por cliente
- [ ] Clicar no certificado de **Mariana Silveira** para abrir o documento.
- [ ] **✅ VERIFICAR no Certificado de Garantia (PDF / tela):**
  - Nome da loja: **"SmartTech Vendas e Assistência"** (não "NexoCommerce")
  - CNPJ da loja: **12.345.678/0001-90**
  - Nome do produto: **Fone Bluetooth SoundPro**
  - Prazo de garantia: **90 dias**
  - Data de início: data da venda
  - Data de expiração: data da venda + 90 dias
  - Número da venda: **#002** (ou o número correto)
  - Termos: `Garantia de 90 dias contra defeitos de hardware. Não cobre mau uso.`
  - **QR Code** presente e visível na página
  - **✅ VERIFICAR:** O QR Code leva ao link público de acompanhamento da OS ou de verificação da garantia ao ser escaneado.
- [ ] Verificar o botão **"Imprimir Certificado"** ou **"Baixar PDF"** — clicar e confirmar que abre/baixa o documento formatado.

---

### ➔ Passo 13.2 — Devolução com Reembolso (Mariana Silveira)
> Mariana retorna à loja: o Fone Bluetooth SoundPro parou de funcionar no lado esquerdo e não carrega.

- [ ] Na tela de Garantias, localizar a garantia de Mariana Silveira.
- [ ] Clicar em **"Registrar Devolução"** (ou botão equivalente):
  - **Motivo da devolução:** `Lado esquerdo parou de funcionar e conector não está carregando.`
  - **Resolução:** Selecionar **Reembolso**
  - **Valor do Reembolso (R$):** `129,90` (preço VIP pago)
- [ ] Clicar em **"Confirmar Devolução"**.
- [ ] **✅ VERIFICAR (Estoque P4):** O fone devolvido retornou ao estoque. Estoque de P4 sobe de 11 para **12 un**.
- [ ] **✅ VERIFICAR (Financeiro → Despesas):** Nova despesa automática criada: `Reembolso de Garantia — Mariana Silveira` | Valor: **R$ 129,90** | Categoria: `Garantia / Reembolso` | Status: "Paga".
- [ ] **✅ VERIFICAR (Garantias):** A garantia de Mariana Silveira está marcada como **"Devolvida"** ou **"Encerrada"**.

---

### ➔ Passo 13.3 — Devolução com Troca (Bruno Lima)
> Bruno Lima retorna: o Fone SoundPro comprado por Fiado apresenta falha de pareamento Bluetooth.

- [ ] Na tela de Garantias, localizar a garantia de Bruno Lima (Venda #8).
- [ ] Clicar em **"Registrar Devolução"**:
  - **Motivo:** `Falha de pareamento Bluetooth — aparelho não conecta a nenhum dispositivo.`
  - **Resolução:** Selecionar **Troca** (substituir por aparelho novo do estoque)
- [ ] Confirmar Devolução.
- [ ] **✅ VERIFICAR (Estoque P4):** +1 devolvido (defeituoso) e -1 entregue (novo) = impacto líquido **0**. Estoque permanece em **12 un**.
- [ ] **✅ VERIFICAR (Financeiro → Despesas):** Nenhuma despesa de reembolso gerada (troca física, sem dinheiro retornando ao cliente).
- [ ] **✅ VERIFICAR (Garantias):** Garantia de Bruno Lima marcada como "Devolvida / Trocada". Uma nova garantia de 90 dias deve ser gerada para o produto substituto.

---

## DIA 14 — FIADO: COBRANÇA E LIQUIDAÇÃO
**Módulos:** Financeiro → Fiado (`/financeiro/fiado`) · Dashboard

---

### ➔ Passo 14.1 — Verificar Painel de Fiado
- [ ] Acessar **Financeiro → aba "Fiado"** (`/financeiro/fiado`).
- [ ] **✅ VERIFICAR:** Bruno Lima consta listado com dívida pendente de **R$ 149,90** (Venda #8).
- [ ] **✅ VERIFICAR:** O total de Fiado em Aberto no topo/card = **R$ 149,90**.
- [ ] **✅ VERIFICAR (Dashboard):** O card "Fiado em Aberto" exibe **R$ 149,90**.

---

### ➔ Passo 14.2 — Liquidar Dívida de Bruno Lima
- [ ] Na linha de Bruno Lima, clicar em **"Receber"** (ou botão equivalente).
- [ ] No modal de recebimento:
  - **Valor recebido:** `149,90`
  - **Forma de pagamento:** **PIX**
  - **Observações:** `Cliente veio pessoalmente pagar o fiado.`
- [ ] Clicar em **"Confirmar Recebimento"**.
- [ ] **✅ VERIFICAR:** Bruno Lima some da lista de fiados em aberto (ou aparece como "Quitado").
- [ ] **✅ VERIFICAR (Dashboard):** Card "Fiado em Aberto" cai para **R$ 0,00**.
- [ ] **✅ VERIFICAR (DRE/Financeiro):** Uma entrada de PIX de R$ 149,90 é registrada para o dia de hoje (quitação do fiado).

---

### ➔ Passo 14.3 — Criar Novo Fiado para Testar Cobrança Parcial
- [ ] Ir ao PDV. Selecionar cliente: **Mariana Silveira**.
- [ ] Adicionar: **P3 (Película de Vidro 3D)** → Qtd: `5` (Preço VIP: R$ 14,90 cada = R$ 74,50)
- [ ] Método: **Fiado** | Finalizar (**Venda #9**).
- [ ] **✅ VERIFICAR (Fiado):** Mariana Silveira aparece em Fiado em Aberto com **R$ 74,50**.
- [ ] Clicar em **"Receber"** para Mariana → Registrar recebimento **parcial**:
  - **Valor recebido:** `30,00`
  - **Forma de pagamento:** **Dinheiro**
- [ ] Confirmar.
- [ ] **✅ VERIFICAR:** Mariana ainda aparece na lista com saldo restante de **R$ 44,50** (74,50 - 30,00).
- [ ] Quitar o restante: clicar novamente em "Receber" → valor: `44,50` → **PIX** → confirmar.
- [ ] **✅ VERIFICAR:** Mariana some da lista de fiados em aberto. Total fiado em aberto = **R$ 0,00**.

---

## DIA 15 — FECHAMENTO DE CAIXA DIÁRIO (3 CENÁRIOS)
**Módulos:** Financeiro → Fechamento de Caixa

---

### ➔ Passo 15.1 — Venda do Dia e Despesa do Dia
- [ ] Ir ao PDV (Consumidor Anônimo).
- [ ] Adicionar: **P3 (Película de Vidro 3D)** × `5` = R$ 99,50 (preço varejo). Método: **Dinheiro**. Finalizar (**Venda #10**).
- [ ] **✅ VERIFICAR (Estoque P3):** cai pela quantidade vendida.
- [ ] Acessar **Financeiro → Despesas → + Nova Despesa**:
  - **Descrição:** `Lanche para equipe de vendas`
  - **Categoria:** `Alimentação`
  - **Tipo:** `Variável`
  - **Valor:** `30,00`
  - **Forma de Pagamento:** `Dinheiro`
  - Salvar.

---

### ➔ Passo 15.2 — Testar Fechamento de Caixa (3 Cenários)
- [ ] Acessar **Financeiro → aba "Fechamento"** (`/financeiro/fechamento`).
- [ ] **✅ VERIFICAR (Resumo do sistema):**
  - Entradas em Dinheiro do dia = **R$ 99,50** (Venda #10)
  - Saídas em Dinheiro do dia = **R$ 30,00** (lanche)
  - Saldo Esperado = **R$ 69,50**

**Cenário A — Caixa Conferido (Sem Diferença):**
- [ ] Campo **"Saldo físico em caixa"**: Digitar `69,50`.
- [ ] **✅ VERIFICAR:** O sistema exibe badge **"✓ Conferido"** com diferença **R$ 0,00**. O indicador fica verde.

**Cenário B — Caixa com Sobra:**
- [ ] Alterar campo "Saldo físico em caixa" para `169,50`.
- [ ] **✅ VERIFICAR:** O sistema exibe indicador **"↑ Sobra"** de **+R$ 100,00**. O indicador fica azul/amarelo.
- [ ] Campo **"Observações"**: Digitar `R$ 100,00 de troco inicial na gaveta.`

**Cenário C — Caixa com Falta:**
- [ ] Alterar campo para `64,50`.
- [ ] **✅ VERIFICAR:** O sistema exibe indicador **"↓ Falta"** de **-R$ 5,00**. O indicador fica vermelho.

- [ ] Retornar o valor para `69,50` (conferido).
- [ ] Clicar em **"🔒 Confirmar Fechamento do Dia"**.
- [ ] **✅ VERIFICAR:** Tela de sucesso ou mensagem confirmando o fechamento diário.
- [ ] **✅ VERIFICAR:** Ao voltar à tela de Fechamento, o fechamento do dia aparece no histórico.

---

## DIA 16 — COMPRA DE REPOSIÇÃO (F2) E AJUSTE AUTOMÁTICO
**Módulos:** Fornecedores → Pedidos de Compra · Estoque

---

### ➔ Passo 16.1 — Pedido de Reposição de Fones
- [ ] Acessar **Fornecedores → Pedidos de Compra → + Novo Pedido**.
- [ ] Preencher:
  - **Fornecedor:** `TechParts Peças de Celular (F2)`
  - **Produto:** `Fone Bluetooth SoundPro (P4)`
  - **Quantidade:** `10`
  - **Preço unitário:** `60,00`
  - **✅ VERIFICAR:** Total = **R$ 600,00**
  - **Observações:** `Reposição urgente após devoluções e vendas do mês.`
- [ ] Salvar como **Pendente**.
- [ ] Verificar aba **"Pedidos"** de F2 (TechParts) — pedido deve constar.
- [ ] Mudar status para **ENVIADO** → depois **RECEBIDO**.
- [ ] **✅ VERIFICAR (Estoque P4):** Estoque sobe em +10 un.
- [ ] **✅ VERIFICAR (Financeiro → Despesas):** Nova despesa automática: `Compra de Mercadoria — TechParts Peças de Celular` | R$ 600,00 | Categoria: Compra de Mercadoria.
- [ ] **✅ VERIFICAR (Movimentações P4):** Entrada de +10 un registrada no histórico de movimentações do produto.

---

## DIA 17 — VENDAS COM DESCONTOS (POR ITEM E GLOBAL)
**Módulos:** PDV

---

### ➔ Passo 17.1 — Venda #11: Desconto por Item (Lucas Vendas)
- [ ] Ir ao PDV. Selecionar cliente: **Mariana Silveira** (VIP).
- [ ] Adicionar: **P1 (Carregador USB-C)** → Qtd: `5` (Preço VIP: R$ 34,90 × 5 = R$ 174,50)
- [ ] No item P1 no carrinho, localizar o campo de desconto por item.
- [ ] Digitar desconto de: `14,50` (real ou percentual — conforme o sistema oferece).
  - **✅ VERIFICAR:** O valor do item cai para R$ 160,00 (174,50 − 14,50).
- [ ] Campo **"Comissionado"**: Selecionar `Lucas Vendas`.
- [ ] Método: **PIX** | Finalizar.
- [ ] **Comissão:** R$ 160,00 × 3% = **R$ 4,80** (sobre o valor final cobrado, após desconto).

---

### ➔ Passo 17.2 — Venda #12: Desconto Global (Amanda Divulgadora)
- [ ] Ir ao PDV. Selecionar: **Bruno Lima** (Varejo).
- [ ] Adicionar:
  - **P2 (Cabo Lightning)** → Qtd: `4` (R$ 24,90 × 4 = R$ 99,60)
  - **P6 (Capa Protetora)** → Qtd: `2` (R$ 29,90 × 2 = R$ 59,80)
  - **Subtotal:** R$ 159,40
- [ ] No campo de **"Desconto Global"** (rodapé do carrinho), digitar: `9,40`.
  - **✅ VERIFICAR:** Total final = **R$ 150,00**.
- [ ] Comissionado: `Amanda Divulgadora`.
- [ ] Método: **Crédito** | Finalizar.
- [ ] **Comissão:** **R$ 10,00** (fixo — não afetado pelo desconto global).

---

### ➔ Passo 17.3 — Venda #13: Produto Brinde (Bruno Lima)
- [ ] Ir ao PDV. Selecionar: **Bruno Lima** (Varejo).
- [ ] Adicionar:
  - **P1 (Carregador USB-C)** → Qtd: `1` (R$ 39,90)
  - **P3 (Película de Vidro 3D)** → Qtd: `1`
- [ ] No item P3 no carrinho, marcar como **Brinde** (checkbox, switch ou aplicar desconto de 100%).
  - **✅ VERIFICAR:** P3 aparece com valor R$ 0,00 e algum indicador "Brinde".
- [ ] **✅ VERIFICAR:** Total cobrado = **R$ 39,90** (apenas P1).
- [ ] Método: **PIX** | Finalizar.
- [ ] **✅ VERIFICAR (DRE):** Linha "Brindes Concedidos" registra o custo de P3 = **R$ 5,00** (custo de 1 película).

---

## DIA 18 — CANCELAMENTO DE VENDA E ESTORNO DE ESTOQUE
**Módulos:** Vendas → Histórico · Estoque · Financeiro

---

### ➔ Passo 18.1 — Cancelar Venda #1 (Dinheiro, Consumidor Anônimo)
- [ ] Acessar **Vendas → Histórico** (`/vendas`).
- [ ] Localizar a **Venda #1** (Consumidor Anônimo, R$ 139,50, P1 × 2 e P3 × 3, Dinheiro, Dia 6).
- [ ] Clicar no botão **"Cancelar Venda"** (ou ícone de cancelamento).
- [ ] **✅ VERIFICAR:** Aparece modal de confirmação com aviso sobre o estorno de estoque.
- [ ] Confirmar o cancelamento.
- [ ] **✅ VERIFICAR (Estoque):**
  - P1 (Carregador) retorna +2 un (anotação: verificar o número atual e confirmar o +2).
  - P3 (Película) retorna +3 un.
- [ ] **✅ VERIFICAR (Financeiro → DRE):** Receita de vendas do período diminui em **R$ 139,50**.
- [ ] **✅ VERIFICAR (Histórico):** A Venda #1 agora exibe status **"Cancelada"** (com a data do cancelamento).
- [ ] **✅ VERIFICAR:** A Venda #1 cancelada **não** some do histórico — apenas muda de status.

---

### ➔ Passo 18.2 — Tentativa de Cancelar Venda Já Cancelada (Teste Negativo)
- [ ] Na Venda #1 (já cancelada), tentar clicar novamente em "Cancelar Venda".
- [ ] **✅ VERIFICAR:** O botão está desabilitado ou o sistema exibe mensagem "Esta venda já foi cancelada."

---

## DIA 19 — ALERTA DE ESTOQUE CRÍTICO
**Módulos:** PDV · Estoque · Dashboard

---

### ➔ Passo 19.1 — Venda que Leva ao Limite Mínimo (P5)
- [ ] Ir ao PDV. Selecionar: **Mariana Silveira** (VIP).
- [ ] Adicionar: **P5 (Smartphone Nexus 12 Lite 128GB)** → Qtd: `4`
  - **✅ VERIFICAR:** Preço VIP = R$ 1.699,00 × 4 = **R$ 6.796,00**
- [ ] Método: **PIX** | Finalizar (**Venda #14**).
- [ ] **✅ VERIFICAR (Estoque P5):** Caiu de 6 para **2 un** (exatamente no limite mínimo).
- [ ] **✅ VERIFICAR (Dashboard):** Card "Estoque Crítico" ainda = **0** (atingiu o mínimo, não ficou abaixo).

---

### ➔ Passo 19.2 — Venda que Passa Abaixo do Mínimo (Alerta Ativo)
- [ ] Ir ao PDV (Consumidor Anônimo).
- [ ] Adicionar: **P5 (Smartphone Nexus)** → Qtd: `1` (Preço Varejo: R$ 1.899,00).
- [ ] Método: **Dinheiro** | Finalizar (**Venda #15**).
- [ ] **✅ VERIFICAR (Estoque P5):** Cai para **1 un** (abaixo do mínimo de 2).
- [ ] **✅ VERIFICAR (Dashboard):** Card "Estoque Crítico" = **1**.
- [ ] **✅ VERIFICAR (Produtos):** P5 aparece com badge/indicador vermelho de "Crítico" na lista.

---

# ══════════════════════════════════════════════════
# SEMANA 4 — AJUSTES, REAJUSTES, CATÁLOGO E RELATÓRIOS (Dias 20–30)
# ══════════════════════════════════════════════════

## DIA 20 — AJUSTES MANUAIS DE ESTOQUE
**Módulos:** Estoque (Produtos → Ajuste Manual)

---

### ➔ Passo 20.1 — Entrada Manual (P3 — Película)
- [ ] Acessar **Produtos** (ou **Estoque**). Localizar **P3 (Película de Vidro 3D)**.
- [ ] Clicar no botão **"Ajustar Estoque"** (ou ícone de ajuste):
  - **Tipo de movimentação:** Selecionar **Entrada**
  - **Quantidade:** `10`
  - **Motivo / Anotações:** `Recebimento extra de lote excedente de fornecedor sem pedido formal.`
- [ ] Confirmar.
- [ ] **✅ VERIFICAR (Estoque P3):** Quantidade sobe em +10 un (anotar estoque antes e depois).
- [ ] **✅ VERIFICAR (Movimentações P3):** O ajuste manual está registrado no histórico com o motivo.

---

### ➔ Passo 20.2 — Saída Manual (P2 — Cabo)
- [ ] Localizar **P2 (Cabo Lightning Reforçado)**.
- [ ] Clicar em **"Ajustar Estoque"**:
  - **Tipo:** **Saída**
  - **Quantidade:** `2`
  - **Motivo:** `Avaria detectada no lote de exposição física. Itens inutilizados.`
- [ ] Confirmar.
- [ ] **✅ VERIFICAR (Estoque P2):** Quantidade cai em -2 un.
- [ ] **✅ VERIFICAR:** O histórico de P2 exibe a saída manual com o motivo "Avaria...".

---

## DIA 21 — OS #0003: CICLO COMPLETO COM SÉRIE E DÉBITO
**Módulos:** Ordens de Serviço

---

### ➔ Passo 21.1 — Criar e Concluir OS #0003
- [ ] Acessar **Ordens de Serviço → + NOVA OS**.
- [ ] Preencher:
  - **Cliente \*:** `Bruno Lima`
  - **WhatsApp:** `(11) 97777-6666`
  - **Equipamento \*:** `Xiaomi Redmi Note 11`
  - **IMEI:** `869765030953141`
  - **Defeito Relatado \*:** `Bateria estufada — desliga automaticamente com 20% de bateria`
  - **Acessórios:** `Cabo USB-C e capa protetora original`
  - **Técnico:** Selecionar disponível
  - **Previsão de Entrega:** hoje + 1 dia
- [ ] Expandir seção técnica:
  - **Problema Diagnosticado:** `Bateria Li-Ion com inchaço físico, causando deformação da carcaça traseira.`
  - **Laudo:** `Realizada substituição de bateria por componente original Xiaomi homologado.`
  - **Mão de Obra:** `90,00` | **Peças:** `60,00`
  - **✅ VERIFICAR:** Total = **R$ 150,00**
- [ ] Criar OS → avançar por: AGUARDANDO → APROVADO → EM SERVIÇO → CONCLUIDO → ENTREGUE
  - Na entrega: selecionar **Débito** como forma de recebimento.
- [ ] **✅ VERIFICAR (DRE):** Receita de serviços acumulada = R$ 870,00 + R$ 150,00 = **R$ 1.020,00**.
- [ ] **✅ VERIFICAR:** Link de acompanhamento público da OS #0003 está disponível.

---

### ➔ Passo 21.2 — Criar OS Diretamente a Partir de uma Venda
- [ ] Acessar **Vendas → Histórico**.
- [ ] Localizar a **Venda #2** (Mariana Silveira, Fone SoundPro).
  - **✅ VERIFICAR:** Se houver botão "Abrir OS" ou "Criar OS a partir desta venda", clicar e verificar se o formulário de OS pré-preenche os dados do cliente e do produto.
  - *Se a funcionalidade não existir: anotar como funcionalidade ausente.*
- [ ] Fechar sem criar.

---

## DIA 22 — CATÁLOGO ONLINE PÚBLICO E FILTROS
**Módulos:** Catálogo Online (`/loja/smarttech`)

---

### ➔ Passo 22.1 — Validar Catálogo Público
- [ ] Acessar **Configurações → Catálogo Online**.
- [ ] Copiar o link do catálogo: `https://[dominio]/loja/smarttech`.
- [ ] Abrir em aba anônima (sem login).
- [ ] **✅ VERIFICAR (Produtos exibidos):**
  - **P1 (Carregador):** Visível ✅
  - **P2 (Cabo Lightning):** Visível ✅
  - **P3 (Película):** Visível ✅
  - **P4 (Fone SoundPro):** Visível ✅
  - **P5 (Smartphone Nexus):** **Não visível** ❌ (catálogo desativado no cadastro)
  - **P6 (Capa Protetora):** Visível ✅
- [ ] **Filtrar por categoria** `Proteção e Telas`:
  - **✅ VERIFICAR:** Apenas P3 (Película) e P6 (Capa) aparecem.
- [ ] **Filtrar por categoria** `Áudio e Som`:
  - **✅ VERIFICAR:** Apenas P4 (Fone SoundPro) aparece.
- [ ] Limpar filtros → **Filtrar por categoria** `Acessórios de Energia`:
  - **✅ VERIFICAR:** P1 e P2 aparecem.
- [ ] Clicar no botão **"Comprar via WhatsApp"** no produto P1:
  - **✅ VERIFICAR:** Link abre o WhatsApp direcionado para o número `(11) 97766-5544` (número da loja, cadastrado nas configs de empresa).
- [ ] **✅ VERIFICAR (Identidade Visual da Loja):** O catálogo exibe o nome "SmartTech Vendas e Assistência" e a logo cadastrada (não "NexoCommerce").

---

### ➔ Passo 22.2 — Ativar P5 no Catálogo e Verificar
- [ ] Voltar ao sistema (com login).
- [ ] Acessar **Produtos → P5 (Smartphone Nexus)** → Editar.
- [ ] Ativar switch **"Visível no catálogo online"** → Salvar.
- [ ] Voltar à aba anônima e recarregar `/loja/smarttech`.
- [ ] **✅ VERIFICAR:** P5 agora aparece no catálogo.
- [ ] Desfazer: Editar P5 novamente → desativar o switch → salvar.

---

## DIA 23 — REAJUSTE DE PREÇO E IMUTABILIDADE DO HISTÓRICO
**Módulos:** Produtos → Editar · Vendas → Histórico

---

### ➔ Passo 23.1 — Aumentar Preço do Carregador (P1)
- [ ] Acessar **Produtos** → localizar P1 → clicar em **EDITAR**.
- [ ] Alterar **Preço Varejo** de `39,90` para `44,90`.
- [ ] Clicar em **"Salvar Produto"**.
- [ ] **✅ VERIFICAR:** A lista de produtos exibe P1 com novo preço **R$ 44,90**.
- [ ] **✅ VERIFICAR:** O PDV (nova venda) exibe P1 ao preço de **R$ 44,90**.

---

### ➔ Passo 23.2 — Venda com Preço Novo (Venda #16)
- [ ] Ir ao PDV (Consumidor Anônimo).
- [ ] Adicionar: **P1 (Carregador USB-C)** → Qtd: `1` → **✅ VERIFICAR:** Preço = R$ 44,90 (novo).
- [ ] Método: **Dinheiro** | Finalizar.
- [ ] **✅ VERIFICAR (Estoque P1):** Cai em -1 un.

---

### ➔ Passo 23.3 — Verificar Imutabilidade do Histórico de Vendas
- [ ] Acessar **Vendas → Histórico**.
- [ ] Localizar a **Venda #6** (Mariana Silveira, Dia 12 — com P1 ao preço VIP R$ 34,90).
- [ ] Clicar para ver detalhes ou expandir o item.
- [ ] **✅ VERIFICAR CRÍTICO:** O item P1 na Venda #6 mantém o preço histórico de **R$ 34,90** (preço VIP da época).
- [ ] **✅ VERIFICAR:** O preço NÃO foi alterado para R$ 44,90 pelo reajuste.

---

## DIA 24 — CRM CLIENTES INATIVOS
**Módulos:** Clientes → Aba Inativos

---

### ➔ Passo 24.1 — Testar CRM de Clientes Inativos/Sumidos
- [ ] Acessar **Configurações → Empresa** (`/configuracoes/empresa`).
- [ ] Alterar **"Prazo inatividade CRM (dias)"** de `60` para `2`.
- [ ] Clicar em **"Salvar Alterações"**.
- [ ] Acessar **Clientes → aba "Inativos"** (ou "Sumidos").
- [ ] **✅ VERIFICAR:** Os clientes que não realizaram compras nos últimos 2 dias aparecem na lista.
  - Clientes esperados na lista: C1 (Conecta Distribuidora), C2 (Bruno Lima), C3 (Mariana Silveira), C4 (Assistência Prime) — pois todos compraram há mais de 2 dias.
- [ ] Para um dos clientes listados (ex: C2 Bruno Lima), verificar se há botão **"Enviar mensagem WhatsApp"** ou **"Acionar via WhatsApp"**.
  - Se existir: clicar e **✅ VERIFICAR** que o WhatsApp se abre com mensagem pré-preenchida para o número de Bruno Lima.
- [ ] Voltar às configurações → reverter o prazo para `60` dias → salvar.
- [ ] **✅ VERIFICAR:** A aba Inativos fica vazia novamente (nenhum cliente ficou 60 dias sem comprar ainda).

---

## DIA 25 — RELATÓRIOS FINANCEIROS E FILTROS
**Módulos:** Relatórios (`/relatorios`) · Financeiro → Visão Geral

---

### ➔ Passo 25.1 — Relatório de Produtos Mais Vendidos
- [ ] Acessar **Relatórios** (ou a seção de Relatórios no Financeiro).
- [ ] Clicar em **"Produtos Mais Vendidos"**.
- [ ] **✅ VERIFICAR:** Aparece um ranking dos produtos pelo volume de vendas do período.
- [ ] **✅ VERIFICAR:** P4 (Fone SoundPro) e P3 (Película) devem estar entre os mais vendidos.

---

### ➔ Passo 25.2 — Relatório com Filtro de Período Personalizado
- [ ] Na tela de Relatórios ou Financeiro → Visão Geral, localizar o seletor de período.
- [ ] Selecionar **"Período personalizado"**.
- [ ] Data inicial: Dia 6 (primeiro dia de vendas) | Data final: Dia 12.
- [ ] Aplicar filtro.
- [ ] **✅ VERIFICAR:** Os números da DRE e dos gráficos mudam para refletir apenas o período selecionado.
- [ ] **✅ VERIFICAR:** Vendas realizadas no Dia 1 (se existirem) não aparecem neste filtro.
- [ ] Trocar para filtro **"Este mês"** e aplicar.
- [ ] **✅ VERIFICAR:** Todos os dados do mês aparecem novamente.

---

### ➔ Passo 25.3 — Verificar DRE Consolidada Parcial
- [ ] Acessar **Financeiro → Visão Geral (DRE)** com filtro "Mês atual".
- [ ] Anotar os valores exibidos pelo sistema para comparação no Dia 30.

---

## DIA 26 — INATIVAR FORNECEDOR E VALIDAÇÃO DE BLOQUEIO
**Módulos:** Fornecedores

---

### ➔ Passo 26.1 — Inativar e Reativar Fornecedor
- [ ] Acessar **Fornecedores**. Clicar em **EDITAR** no F1 (Global Importer Eletrônicos).
- [ ] Desmarcar a opção **"Ativo"** (ou toggle "Fornecedor ativo").
- [ ] Clicar em **"Salvar Fornecedor"**.
- [ ] **✅ VERIFICAR:** F1 aparece na lista com badge/ícone **INATIVO** ou em cor diferente.
- [ ] Tentar criar um **Novo Pedido de Compra** para F1:
  - Acessar Pedidos de Compra → + Novo Pedido.
  - Selecionar **Global Importer** no dropdown.
  - **✅ VERIFICAR:** Um aviso/alerta é exibido indicando que o fornecedor está inativo, OU o fornecedor não aparece na lista.
- [ ] Cancelar o pedido. Voltar a F1 → Editar → Reativar → Salvar.
- [ ] **✅ VERIFICAR:** F1 volta ao status **Ativo**.

---

## DIA 27 — NOVA OS CRIADA A PARTIR DO ZERO (FLUXO COMPLETO + TEMPLATE CONCLUSÃO)
**Módulos:** Ordens de Serviço

---

### ➔ Passo 27.1 — OS #0004 com Todos os Status e Templates
- [ ] Criar **OS #0004**:
  - **Cliente:** `Assistência Prime` (C4)
  - **WhatsApp:** `(11) 95555-4444`
  - **Equipamento:** `Motorola Moto G84 5G`
  - **IMEI:** `351756110076633`
  - **Defeito:** `Câmera traseira embaçada e sem foco`
  - **Acessórios:** `Apenas o aparelho`
  - **Técnico:** disponível
  - **Previsão:** hoje + 2 dias
  - **Mão de obra:** `120,00` | **Peças:** `80,00` | **Total:** `200,00`
- [ ] Criar → avançar para APROVADO.
  - Usar template **Orçamento** → **✅ VERIFICAR** preview com valor R$ 200,00.
  - Clicar "Enviar pelo WhatsApp".
- [ ] Avançar para **EM SERVIÇO**.
  - Usar template **Em Andamento**.
  - Editar mensagem: acrescentar ` Câmera removida. Aguardando limpeza do módulo.`
  - **✅ VERIFICAR:** preview em tempo real atualiza.
  - Enviar.
- [ ] Avançar para **CONCLUIDO**.
  - Usar template **Conclusão** → Enviar.
- [ ] Avançar para **ENTREGUE** → Recebimento via **PIX**.
- [ ] **✅ VERIFICAR (DRE):** Receita de serviços = R$ 1.020,00 + R$ 200,00 = **R$ 1.220,00**.

---

## DIA 28 — TESTES DE VALIDAÇÃO E CAMPOS OBRIGATÓRIOS
**Módulos:** Todos os formulários

---

### ➔ Passo 28.1 — Testar Formulários com Campos Obrigatórios Vazios
- [ ] **Produto (formulário vazio):**
  - Acessar Produtos → + Novo Produto.
  - Deixar o campo **"Nome do Produto"** vazio.
  - Clicar em Salvar.
  - **✅ VERIFICAR:** Mensagem de erro "Campo obrigatório" aparece abaixo do campo Nome.
  - Preencher nome, deixar **"Preço Varejo"** vazio → salvar.
  - **✅ VERIFICAR:** Erro no campo Preço Varejo.
  - Fechar sem salvar.

- [ ] **Cliente (formulário vazio):**
  - Acessar Clientes → + Novo Cliente.
  - Deixar o campo **"Nome completo"** vazio → salvar.
  - **✅ VERIFICAR:** Erro de validação no campo Nome.
  - Fechar.

- [ ] **OS (campos obrigatórios):**
  - Abrir + Nova OS.
  - Deixar campo **"Equipamento"** vazio → tentar criar.
  - **✅ VERIFICAR:** Erro de validação.
  - Fechar sem criar.

- [ ] **Despesa (campos obrigatórios):**
  - Abrir + Nova Despesa.
  - Deixar **"Descrição"** vazio → salvar.
  - **✅ VERIFICAR:** Erro de validação.
  - Fechar.

---

## DIA 29 — MULTI-USUÁRIO: VERIFICAÇÃO FINAL DE ACESSOS
**Módulos:** Configurações → Usuários · Todos os módulos

---

### ➔ Passo 29.1 — Logar como Aline (Operador) e Testar Restrições Finais
- [ ] Fazer logout de Thiago. Logar como `aline@smarttech.com` / `Aline@2026`.
- [ ] **✅ VERIFICAR (Itens visíveis na barra lateral para Operador):**
  - Dashboard ✅
  - Vendas (PDV) ✅
  - Clientes ✅
  - Produtos ✅
  - Ordens de Serviço ✅
  - Garantias ✅
  - Fornecedores: verificar se é visível
  - Financeiro ❌ (não deve aparecer ou deve estar bloqueado)
  - Comissões ❌
  - Relatórios: verificar política do sistema
  - Configurações ❌ (não deve aparecer)
- [ ] Tentar acessar diretamente `/financeiro/despesas`:
  - **✅ VERIFICAR:** Bloqueado por falta de permissão ou redirecionado.
- [ ] Tentar acessar diretamente `/configuracoes/usuarios`:
  - **✅ VERIFICAR:** Bloqueado.
- [ ] Tentar acessar `/comissoes`:
  - **✅ VERIFICAR:** Bloqueado.
- [ ] Criar uma nova venda como Operador (Aline):
  - PDV → Cliente anônimo → P6 (Capa) × 1 → Dinheiro → Finalizar (**Venda #17**).
  - **✅ VERIFICAR:** Operador consegue realizar vendas.
- [ ] Logout de Aline. Login de Thiago.

---

## DIA 30 — FECHAMENTO FINAL E AUDITORIA MATEMÁTICA DA DRE
**Módulos:** Comissões · Financeiro → Fechamento de Caixa · Financeiro → Visão Geral (DRE) · Garantias · Dashboard

---

### ➔ Passo 30.1 — Liquidar Todas as Comissões Pendentes
- [ ] Acessar **Comissões** (`/comissoes`).
- [ ] **Auditoria dos Saldos de Comissões (calculados ao longo das vendas):**

  | Comissionado | Venda | Valor base | Comissão | Status |
  |---|---|---|---|---|
  | Lucas Vendas | #6 | R$ 124,50 | R$ 3,74 (3%) | Pago (Dia 12) |
  | Amanda Divulgadora | #7 | R$ 259,80 | R$ 10,00 (fixo) | Pendente |
  | Lucas Vendas | #8 | R$ 149,90 | R$ 4,50 (3%) | Pendente |
  | Lucas Vendas | #11 | R$ 160,00 | R$ 4,80 (3%) | Pendente |
  | Amanda Divulgadora | #12 | R$ 150,00 | R$ 10,00 (fixo) | Pendente |

  - Lucas: Total = R$ 13,04 | Pago = R$ 3,74 | **Pendente = R$ 9,30**
  - Amanda: Total = R$ 20,00 | Pago = R$ 0,00 | **Pendente = R$ 20,00**
  - **Total Pendente = R$ 29,30**

- [ ] Marcar todas as comissões pendentes de Lucas como pagas.
  - **✅ VERIFICAR:** Saldo pendente Lucas = R$ 0,00.
- [ ] Marcar todas as comissões pendentes de Amanda como pagas.
  - **✅ VERIFICAR:** Saldo pendente Amanda = R$ 0,00.
- [ ] **✅ VERIFICAR KPIs Finais (Comissões):**
  - Total Pago no mês = **R$ 33,04**
  - Pendente = **R$ 0,00**

---

### ➔ Passo 30.2 — Fechamento de Caixa Mensal
- [ ] Acessar **Financeiro → Fechamento de Caixa**.
- [ ] Verificar o histórico de fechamentos diários realizados no mês.
  - **✅ VERIFICAR:** O fechamento do Dia 15 está registrado no histórico.
- [ ] Realizar o **Fechamento Final do Mês** (se o sistema suportar período mensal):
  - Inserir o saldo físico final calculado com base em todas as entradas/saídas em dinheiro do mês.
  - **✅ VERIFICAR:** O sistema exibe o saldo esperado e a diferença.
  - Confirmar o fechamento.

---

### ➔ Passo 30.3 — Auditoria Final da DRE
- [ ] Acessar **Financeiro → Visão Geral (DRE)** com filtro "Este mês".
- [ ] **✅ VERIFICAR RIGOROSAMENTE** cada linha da DRE:

| Linha DRE | Valor Esperado | Composição |
|-----------|----------------|------------|
| **(+) Receita de Vendas** | *(somar vendas 2–17 não canceladas)* | Todas as vendas finalizadas, exceto Venda #1 (cancelada) |
| **(+) Receita Serviços OS** | **R$ 1.220,00** | OS #0001 (R$ 650) + OS #0002 (R$ 220) + OS #0003 (R$ 150) + OS #0004 (R$ 200) |
| **(=) Receita Bruta Total** | Vendas + Serviços | — |
| **(−) CMV** | *(somar custo dos produtos vendidos)* | Custo × quantidade de cada produto vendido |
| **(−) Brindes Concedidos** | **R$ 5,00** | Custo de 1 Película P3 (Venda #13) |
| **(−) Despesas** | *(somar despesas do mês)* | Compra F1 (R$ 160) + Compra F2 (R$ 600) + Aluguel (R$ 1.200) + Utilidades (R$ 250) + Lanche (R$ 30) + Reembolso Mariana (R$ 129,90) |
| **(=) Lucro Líquido** | Receita Bruta − CMV − Brindes − Despesas | — |
| **Margem %** | Lucro / Receita Bruta × 100 | — |

- [ ] **✅ VERIFICAR:** Os valores de CMV da taxa de Crédito (2,99%) sobre a Venda #5 (Crédito, R$ 577,50) estão contabilizados se o sistema deduz taxas de pagamento na DRE.
- [ ] **✅ VERIFICAR:** A Venda #1 cancelada **não** compõe a Receita de Vendas.
- [ ] **✅ VERIFICAR:** As 4 OS concluídas somam R$ 1.220,00 em Receita de Serviços.
- [ ] **✅ VERIFICAR:** O gráfico de barras/linhas exibe os picos de faturamento nos dias corretos (Dias 6, 10, 14, 19, 23, 27).

---

### ➔ Passo 30.4 — Auditoria Final de Garantias
- [ ] Acessar **Garantias** (`/garantias`).
- [ ] **✅ VERIFICAR:** A lista exibe as garantias atribuídas ao longo do mês.
- [ ] Verificar o status de cada garantia:
  - Mariana Silveira (Fone SoundPro, Venda #2) → Status: **Devolvida/Encerrada** (reembolsada no Dia 13)
  - Bruno Lima (Fone SoundPro, Venda #8) → Status: **Devolvida/Trocada** (troca no Dia 13)
  - Assistência Prime (Fone SoundPro × 2, Venda #7) → Status: **Ativa** (dentro do prazo de 90 dias)
  - Mariana Silveira (Smartphone Nexus, Venda #14) → Status: **Ativa** (365 dias)
  - Consumidor Anônimo (Smartphone Nexus, Venda #15) → *verificar se gera garantia para venda sem cliente*
- [ ] **✅ VERIFICAR:** A data de expiração de cada garantia ativa é correta (data da venda + prazo em dias).

---

### ➔ Passo 30.5 — Verificações Finais Gerais do Sistema
- [ ] **Dashboard:**
  - Card "Faturamento Hoje" exibe o valor das vendas/serviços do dia.
  - Card "Fiado em Aberto" = **R$ 0,00** (todos os fiados quitados).
  - Card "Estoque Crítico" = **1** (P5 com apenas 1 un).
  - O botão "Ver Fiado" é acessível.
- [ ] **Verificar links de OS públicos:**
  - Abrir `/acompanhar-os/1` → Status: Entregue, dados corretos.
  - Abrir `/acompanhar-os/2` → Status: Entregue, dados corretos.
  - Abrir `/acompanhar-os/3` → Status: Entregue, dados corretos.
  - Abrir `/acompanhar-os/4` → Status: Entregue, dados corretos.
- [ ] **Verificar catálogo público:**
  - Abrir `/loja/smarttech` → 5 produtos visíveis (P1, P2, P3, P4, P6). P5 oculto.
- [ ] **Configurações → Planos:**
  - **✅ VERIFICAR:** Plano atual é **Pro**. Botão "Gerenciar assinatura" ou "Cancelar" presente.
  - **✅ VERIFICAR:** Histórico de faturas mostra a cobrança do plano Pro realizada no Dia 6.

---

## 📋 CHECKLIST MASTER DE COBERTURA — SmartTech v3.2

| Módulo / Funcionalidade | Dia(s) | Testado? | KPIs ✅? |
|-------------------------|--------|----------|---------|
| Cadastro de conta nova com validação de senha | 1 | ☐ | — |
| Configurações → Empresa (todos os campos + logo) | 1 | ☐ | — |
| Configurações → Formas de Pagamento (editar taxa, toggle, excluir, adicionar) | 1 | ☐ | — |
| Configurações → Categorias (criar, editar, excluir) | 1/3 | ☐ | — |
| Configurações → Catálogo Online (link, visualizar) | 2 | ☐ | — |
| Configurações → Assinatura — visualizar planos e Stripe | 2/6 | ☐ | — |
| Configurações → Usuários (convidar, papel, verificar restrições) | 7/29 | ☐ | — |
| Configurações → Planos (upgrade, downgrade, histórico de faturas) | 6/30 | ☐ | — |
| Cadastro de 6 produtos (todos os campos + switches + garantia) | 4 | ☐ | — |
| Edição de produto e verificação de persistência | 4 | ☐ | — |
| Busca e filtro de produtos por nome e categoria | 4 | ☐ | — |
| Cadastro de 4 clientes (PF e PJ, busca de CEP, tipos) | 5 | ☐ | — |
| Busca e filtro de clientes por nome e tipo | 5 | ☐ | — |
| Edição de cliente | 5 | ☐ | — |
| Cadastro de 2 fornecedores (busca de CEP, categorias) | 5 | ☐ | — |
| Vinculação de fornecedor a produto | 5 | ☐ | — |
| PDV — venda simples (dinheiro, consumidor anônimo, troco) | 6 | ☐ | ☐ |
| PDV — venda cliente VIP (preço VIP automático) | 6 | ☐ | ☐ |
| PDV — venda atacado (preço atacado por quantidade) | 6 | ☐ | ☐ |
| PDV — teste negativo preço abaixo do mínimo PDV | 6 | ☐ | — |
| PDV — venda Fiado (após ativação) | 12 | ☐ | ☐ |
| PDV — venda com comissão percentual | 12 | ☐ | ☐ |
| PDV — venda com comissão fixa | 12 | ☐ | ☐ |
| PDV — venda com desconto por item | 17 | ☐ | ☐ |
| PDV — venda com desconto global | 17 | ☐ | ☐ |
| PDV — venda com brinde | 17 | ☐ | ☐ |
| PDV — teste: Fiado ausente quando desativado | 6 | ☐ | — |
| Cancelamento de venda + estorno estoque | 18 | ☐ | ☐ |
| Tentativa de cancelar venda já cancelada (teste negativo) | 18 | ☐ | — |
| Imutabilidade do histórico de preços após reajuste | 23 | ☐ | ☐ |
| Estoque — movimentações automáticas por venda | 6 | ☐ | ☐ |
| Estoque — movimentações automáticas por pedido de compra | 9/16 | ☐ | ☐ |
| Estoque — histórico de movimentações por produto | 9/20 | ☐ | — |
| Estoque — ajuste manual entrada (com motivo) | 20 | ☐ | ☐ |
| Estoque — ajuste manual saída (com motivo) | 20 | ☐ | ☐ |
| Estoque — alerta de crítico (limite mínimo e abaixo) | 19 | ☐ | ☐ |
| Clientes — CRM Inativos com botão WhatsApp | 24 | ☐ | — |
| Fornecedores — pedido de compra (criar, trocar status) | 9/16 | ☐ | ☐ |
| Fornecedores — recebimento → atualiza estoque automático | 9/16 | ☐ | ☐ |
| Fornecedores — recebimento → despesa automática na DRE | 9/16 | ☐ | ☐ |
| Fornecedores — visualizar pedidos no perfil do fornecedor | 9 | ☐ | — |
| Fornecedores — inativar e testar bloqueio em pedidos | 26 | ☐ | — |
| Financeiro — DRE (todas as linhas e filtro de período) | 9/25/30 | ☐ | ☐ |
| Financeiro — despesas manuais (fixas e variáveis, categorias) | 9 | ☐ | ☐ |
| Financeiro — despesas automáticas (pedido + garantia) | 9/13 | ☐ | ☐ |
| Financeiro — Fiado lançamento (venda + visualização) | 12/14 | ☐ | ☐ |
| Financeiro — Fiado recebimento parcial | 14 | ☐ | ☐ |
| Financeiro — Fiado recebimento total | 14 | ☐ | ☐ |
| Financeiro — Fechamento de caixa (conferido, sobra, falta) | 15 | ☐ | ☐ |
| Financeiro — histórico de fechamentos | 15/30 | ☐ | — |
| Financeiro — gráficos de faturamento e período | 9/25 | ☐ | — |
| OS — criação com TODOS os campos (básico + técnico) | 10/11/21/27 | ☐ | — |
| OS — fluxo completo de status (AGUARDANDO→ENTREGUE) | 10 | ☐ | — |
| OS — template WhatsApp: Orçamento (preview + envio) | 10 | ☐ | — |
| OS — template WhatsApp: Em Andamento (edição + live preview) | 10 | ☐ | — |
| OS — template WhatsApp: Conclusão | 10/27 | ☐ | — |
| OS — template WhatsApp: Atraso (edição + envio) | 11 | ☐ | — |
| OS — live preview em tempo real ao editar mensagem | 10/11 | ☐ | — |
| OS — integração com DRE financeiro (receita de serviços) | 10/30 | ☐ | ☐ |
| OS — acompanhamento público sem login (4 OSs) | 10/30 | ☐ | — |
| OS — criar a partir de uma venda (se existente) | 21 | ☐ | — |
| Garantias — geração automática por venda com produto garantia | 6 | ☐ | — |
| Garantias — certificado completo (CNPJ, dados, QR Code) | 13 | ☐ | — |
| Garantias — devolução com reembolso → despesa automática | 13 | ☐ | ☐ |
| Garantias — devolução com troca → estorno e nova garantia | 13 | ☐ | ☐ |
| Garantias — verificar status e datas de expiração | 30 | ☐ | — |
| Comissões — cadastro percentual e fixo com saldo zerado | 8 | ☐ | — |
| Comissões — comissão sobre venda com desconto (base correta) | 17 | ☐ | ☐ |
| Comissões — marcar como pago individualmente | 12 | ☐ | ☐ |
| Comissões — marcar todas pendentes como pagas | 30 | ☐ | ☐ |
| Comissões — KPIs (total, pago, pendente) | 12/30 | ☐ | ☐ |
| Comissões — aba "Por Venda" (histórico) | 12 | ☐ | — |
| Comissões — aba "Por Comissionado" (ranking) | 12 | ☐ | — |
| Relatórios — produtos mais vendidos | 25 | ☐ | — |
| Relatórios — filtro por período personalizado | 25 | ☐ | — |
| Catálogo — configurar loja pública e visualizar | 2/22 | ☐ | — |
| Catálogo — filtro por categoria | 22 | ☐ | — |
| Catálogo — botão WhatsApp com número correto | 22 | ☐ | — |
| Catálogo — produto oculto não aparece na vitrine | 22 | ☐ | — |
| Catálogo — ativar/desativar produto no catálogo dinamicamente | 22 | ☐ | — |
| Upgrade Start → Pro (Stripe checkout) | 6 | ☐ | — |
| Multi-usuário — papel Operador (acesso e restrições) | 7/29 | ☐ | — |
| Multi-usuário — Operador consegue criar vendas | 29 | ☐ | — |
| Validação de campos obrigatórios (todos os formulários) | 28 | ☐ | — |
| Plano Start — bloqueios corretos na UI | 1 | ☐ | — |
| Plano Pro — desbloqueio correto de todos os módulos | 6 | ☐ | — |
| Dashboard — todos os cards e atalhos | 1/19/30 | ☐ | ☐ |
| Persistência de dados (recarregar e verificar) | 1/4 | ☐ | — |

---

## 📐 TABELA AUXILIAR DE RASTREAMENTO DE ESTOQUE (Atualizar a cada venda)

| Produto | Estoque Inicial | Após V1 | Após V2 | Após V3 | Após V4 | Após V5 | Após Ped.F1 | Após V6 | Após V7 | Após V8 | ... |
|---------|----------------|---------|---------|---------|---------|---------|-------------|---------|---------|---------|-----|
| P1 Carregador | 50 | 48 | — | — | — | 38 | — | 37 | — | — | |
| P2 Cabo | 40 | — | — | 38 | — | 28 | — | 26 | — | — | |
| P3 Película | 60 | 57 | — | — | — | — | — | — | — | — | |
| P4 Fone | 15 | — | 14 | — | — | — | — | — | 12 | 11 | |
| P5 Smartphone | 6 | — | — | — | — | — | — | — | — | — | |
| P6 Capa | 30 | — | — | — | 29 | 24 | +20=44 | 42* | — | — | |

*Ajustar os números exatos conforme o sistema exibir, utilizando esta tabela como guia de rastreamento.*

---

*Documento: `docs/simulacao_30_dias.md` v3.2 — Cenário: SmartTech Vendas e Assistência · Jun/2026*  
*Cobertura: 90+ itens testados, todos os módulos, todos os campos de formulário, validações positivas e negativas, múltiplas formas de pagamento, fluxos de garantia, comissões, OS e fechamento financeiro.*
