# SIMULAÇÃO DE 30 DIAS — PETGLOW VET & GROOMING v4.0

**Versão:** 4.0 — Cenário Pet Shop & Clínica Veterinária  
**Gerado em:** 2026-06-03  
**Base:** [mapeamento_completo_sistema.md](file:///C:/Users/kauan.pereira/.gemini/antigravity/scratch/nexocommerce/docs/mapeamento_completo_sistema.md)  
**Objetivo:** Validação manual passo a passo de TODAS as telas, formulários, botões e regras de negócio da **KDL Store** no cenário de Pet Shop e Clínica Veterinária (**PetGlow Vet & Grooming**), testando exaustivamente as 5 atualizações do sistema:
1. **Seletor de Comissionado no PDV**
2. **Custo de Peças (`custo_pecas`) em Ordens de Serviço**
3. **Prompt de Método de Pagamento na Entrega da OS**
4. **Numeração Sequencial Própria de Vendas e OS por Empresa**
5. **Filtro de Despesas Futuras (`.lte`) no Dashboard**

---

> ## ⚠️ LEIA ANTES DE COMEÇAR — REGRAS DE OURO
>
> 1. **Sequência Estrita:** Realize cada ação exatamente na ordem e no dia indicados. O batimento matemático final do caixa, estoque e DRE depende da fidelidade dos dados inseridos.
> 2. **Plano Start (Dias 1–5):** Módulos de Financeiro (DRE, Despesas, Fechamento) e Comissões estarão bloqueados com o componente `<ProOnly>`. Fiado estará disponível por padrão, mas será desativado manualmente no Dia 1.
> 3. **Upgrade Pro no Dia 6:** Após simular o upgrade via Stripe, todas as funcionalidades Pro serão liberadas.
> 4. **Preenchimento Completo:** Insira dados em todos os campos obrigatórios (*) e opcionais indicados para garantir a cobertura dos formulários.

---

## 🏪 PERFIL DA LOJA DE TESTES

```
┌──────────────────────────────────────────────────────────────┐
│                  PETGLOW VET & GROOMING                      │
├──────────────────┬───────────────────────────────────────────┤
│ Segmento         │ Pet Shop, Banho & Tosa e Clínica Vet      │
│ Cidade / Estado  │ São Paulo / SP                            │
│ Telefone Fixo    │ (11) 3322-1100                            │
│ WhatsApp         │ (11) 97777-6655                           │
│ E-mail           │ contato@petglow.com.br                    │
│ CNPJ             │ 55.444.333/0001-22                        │
│ Endereço         │ Alameda Lorena, 850 — Jardins             │
│ Instagram        │ @petglow_vet                              │
│ Plano Inicial    │ Start → Pro (upgrade no Dia 6)            │
└──────────────────┴───────────────────────────────────────────┘
```

---

## 📦 CATÁLOGO DE PRODUTOS

| SKU | Nome do Produto | Categoria | Custo | Varejo | Atacado | VIP | Qtd Inicial | Qtd Mín | Garantia | Brinde |
|-----|-----------------|-----------|-------|--------|---------|-----|-------------|---------|----------|--------|
| `ROYAL-GR-12` | Ração Royal Canin Golden Retriever 12kg | Alimentos | 160,00 | 299,00 | 260,00 | 245,00 | 10 | 2 | Sem | Não |
| `SERESTO-G` | Coleira Antipulgas Seresto Cães Grandes | Medicamentos | 110,00 | 249,00 | 220,00 | 205,00 | 15 | 3 | 30 dias | Não |
| `KONG-EXT-G` | Brinquedo Inteligente Kong Extreme G | Acessórios | 55,00 | 119,00 | 100,00 | 95,00 | 12 | 2 | 90 dias | Não |
| `SHAMP-PET-5L` | Shampoo Neutro Pet Concentrado 5L | Higiene | 45,00 | 120,00 | 105,00 | 98,00 | 6 | 1 | Sem | Não |
| `BISCUIT-PET-150` | Biscoito Petisco Premium Dog 150g | Alimentos | 3,00 | 12,00 | 9,00 | 8,00 | 50 | 10 | Sem | Sim |
| `WHIS-SAC-85` | Sachê Whiskas Gato Carne 85g | Alimentos | 1,50 | 3,50 | 2,90 | 2,70 | 80 | 15 | Sem | Sim |
| `DRONTAL-PLUS` | Vermífugo cães Drontal Plus 4 Comprimidos | Medicamentos | 38,00 | 89,00 | 78,00 | 72,00 | 20 | 4 | Sem | Não |

---

## 👥 CLIENTES E FORNECEDORES DE TESTES

### Clientes
- **C1: Mariana Lima** (Varejo) | WhatsApp: `(11) 97777-5555`
- **C2: Canil Vale Verde** (Atacado) | WhatsApp: `(11) 3322-7700`
- **C3: Dra. Beatrix** (VIP) | WhatsApp: `(11) 96655-1100`
- **C4: Seu Manoel (Vizinho)** (Varejo) | WhatsApp: `(11) 99911-2233`
- **C5: Geraldo Neto** (Varejo) | WhatsApp: `(11) 98811-1122`

### Fornecedores
- **F1: Royal Canin do Brasil** | Contato: `Atendimento Royal` | WhatsApp: `(11) 4004-9000` | Cat: `Alimentos`
- **F2: Zoetis Saúde Animal** | Contato: `Representante Zoetis` | WhatsApp: `(19) 3800-1122` | Cat: `Medicamentos`
- **F3: PetDistributor Acessórios** | Contato: `Vendas PetDist` | WhatsApp: `(11) 3322-8877` | Cat: `Acessórios`

---

# ══════════════════════════════════════════════════
# SEMANA 1 — PLANO START: CONFIGURAÇÃO E CADASTROS (Dias 1–5)
# ══════════════════════════════════════════════════

## DIA 1 — CRIAÇÃO DA CONTA, EMPRESA E FORMAS DE PAGAMENTO
**Módulos:** Cadastro · Configurações → Empresa · Configurações → Pagamentos

- [ ] **Passo 1.1 — Cadastro de Conta:**
  - Acessar a URL de cadastro `/cadastro` ([cadastro/page.tsx](file:///C:/Users/kauan.pereira/.gemini/antigravity/scratch/nexocommerce/src/app/(auth)/cadastro/page.tsx)).
  - Informar **Nome da loja**: `PetGlow` e **E-mail**: `vet@petglow.com.br`.
  - Inserir senha fraca (`123`) para testar o indicador visual de força. **✅ VERIFICAR:** O formulário impede o envio da senha inadequada.
  - Redigitar senha forte: `PetGlow@2026`. Submeter o formulário.
  - **✅ VERIFICAR:** Redirecionado com sucesso para o dashboard com o badge **Plano Start** na barra lateral.

- [ ] **Passo 1.2 — Dados Completos da Empresa:**
  - Ir em **Configurações → Empresa** (`/configuracoes/empresa` — [configuracoes/empresa/page.tsx](file:///C:/Users/kauan.pereira/.gemini/antigravity/scratch/nexocommerce/src/app/(dashboard)/configuracoes/empresa/page.tsx)).
  - Preencher todos os campos do formulário:
    - **Nome da loja \*:** `PetGlow Vet & Grooming`
    - **CNPJ:** `55.444.333/0001-22`
    - **WhatsApp:** `(11) 97777-6655` | **Telefone:** `(11) 3322-1100`
    - **E-mail:** `contato@petglow.com.br`
    - **Endereço:** `Alameda Lorena, 850` | **Bairro:** `Jardins` | **CEP:** `01424-001`
    - **Cidade:** `São Paulo` | **Estado:** `SP`
    - **Instagram:** `@petglow_vet`
    - **Prazo inatividade CRM (dias):** `30`
  - Realizar upload de imagem para logotipo da empresa e confirmar.
  - Clicar em **"Salvar Alterações"** e confirmar o toast de sucesso.

- [ ] **Passo 1.3 — Ajustes de Taxas e Desativação do Fiado:**
  - Ir em **Configurações → Pagamentos** (`/configuracoes/pagamentos`).
  - **Editar taxas padrão:**
    - Crédito: alterar de `3,5%` para `2,5%`. Salvar.
    - Débito: alterar de `1,8%` para `1,2%`. Salvar.
  - **Desativar Fiado:**
    - Localizar a linha do **Fiado** e alterar o switch toggle para **inativo/desativado**.
    - **✅ VERIFICAR:** O switch muda para cinza. O Fiado deve sumir das opções de checkout até que seja reativado após o upgrade do plano.

- [ ] **Passo 1.4 — Validar Bloqueios do Plano Start:**
  - Tentar acessar `/financeiro` na barra lateral ou via URL direta.
  - **✅ VERIFICAR:** A tela abre, porém o painel de DRE, Despesas e Fechamento exibe o bloqueio visual do componente `<ProOnly>`, impedindo visualização de dados com botão "Fazer Upgrade para Pro".
  - Tentar acessar `/comissoes` na URL direta.
  - **✅ VERIFICAR:** Bloqueio `<ProOnly>` ativo.

---

## DIA 2 — CONFIGURAÇÕES DE VITRINE E ACOMPANHAMENTO VET
**Módulos:** Configurações → Catálogo Online · Assinatura

- [ ] **Passo 2.1 — Configurar Link do Catálogo:**
  - Ir em **Configurações → Catálogo** (`/configuracoes/catalogo` — [configuracoes/page.tsx](file:///C:/Users/kauan.pereira/.gemini/antigravity/scratch/nexocommerce/src/app/(dashboard)/configuracoes/page.tsx)).
  - Definir slug de catálogo único: `petglow`. **✅ VERIFICAR:** Prévia do link se atualiza em tempo real para `loja/petglow`.
  - Clicar em "Visualizar Catálogo" → **✅ VERIFICAR:** Página pública é aberta em nova aba e exibe "Nenhum produto cadastrado no momento", com layout sem referências a antigas marcas (apenas KDL Store).

- [ ] **Passo 2.2 — Visualizar Preços de Assinatura:**
  - Acessar `/assinar` ([assinar/page.tsx](file:///C:/Users/kauan.pereira/.gemini/antigravity/scratch/nexocommerce/src/app/assinar/page.tsx)).
  - **✅ VERIFICAR:** O plano **Start** consta como plano atual ativo. O plano **Pro** exibe a mensalidade de **R$ 95/mês** com a lista de módulos inclusos (Financeiro DRE, Despesas Avançadas, Gestão de Comissionados, Múltiplos Usuários e CRM de Clientes Inativos).

---

## DIA 3 — CADASTRO DE CATEGORIAS DE PET SHOP
**Módulos:** Configurações → Categorias

- [ ] **Passo 3.1 — Cadastrar Categorias Principais:**
  - Acessar **Configurações → Categorias** (`/configuracoes/categorias`).
  - Cadastrar as seguintes categorias com cores personalizadas para as tags de produtos:
    - [ ] `Alimentos` | Cor: Verde (`#22c55e`)
    - [ ] `Medicamentos` | Cor: Vermelho (`#ef4444`)
    - [ ] `Acessórios` | Cor: Laranja (`#f59e0b`)
    - [ ] `Higiene` | Cor: Ciano (`#06b6d4`)
    - [ ] `Serviços` | Cor: Azul (`#3b82f6`)
  - **✅ VERIFICAR:** As 5 categorias aparecem na listagem com suas respectivas cores de tag aplicadas corretamente.

---

## DIA 4 — CADASTRO DO CATÁLOGO DE PRODUTOS (COBERTURA TOTAL DE CAMPOS)
**Módulos:** Produtos (`/produtos/novo` — [produtos/novo/page.tsx](file:///C:/Users/kauan.pereira/.gemini/antigravity/scratch/nexocommerce/src/app/(dashboard)/produtos/novo/page.tsx))

- [ ] **Passo 4.1 — Cadastrar os 7 Produtos do Catálogo Preenchendo Todos os Campos:**
  - Acessar a tela de cadastro e expandir todas as seções do formulário. Preencher **TODOS** os campos (obrigatórios e opcionais) em cada cadastro:

  1. **Ração Royal Canin Golden Retriever 12kg:**
     - **Nome do Produto \*:** `Ração Royal Canin Golden Retriever 12kg`
     - **SKU (Código interno):** `ROYAL-GR-12` | **Código de Barras (EAN):** `7891000100018`
     - **Categoria:** Selecionar `Alimentos` | **Fornecedor Vinculado:** `Royal Canin do Brasil`
     - **Preço de Custo (R$):** `160,00` | **Preço Varejo (R$) \*:** `299,00`
     - **Preço Mínimo PDV (R$):** `270,00` | **Preço Atacado (R$):** `260,00` | **Preço VIP (R$):** `245,00`
     - **Qtd Atual:** `10` | **Qtd Mínima:** `2` | **Qtd Máxima:** `40` | **Qtd Mín Atacado:** `3`
     - **Localização no estoque:** `Prateleira A1 — Corredor de Alimentos`
     - **Descrição:** `Ração seca super premium indicada para cães filhotes e adultos da raça Golden Retriever. Auxilia na saúde da pelagem e das articulações.`
     - **Observações:** `Produto com alto giro. Manter sempre próximo ao nível de estoque de segurança.`
     - **Switches:** Visível no catálogo = **ATIVO (✅)** | Rastrear número de série = **INATIVO** | Pode ser usado como brinde = **INATIVO** | Garantia = **INATIVO**

  2. **Coleira Antipulgas Seresto Cães Grandes:**
     - **Nome do Produto \*:** `Coleira Antipulgas Seresto Cães Grandes`
     - **SKU:** `SERESTO-G` | **Código de Barras (EAN):** `4007221038596`
     - **Categoria:** Selecionar `Medicamentos` | **Fornecedor Vinculado:** `Zoetis Saúde Animal`
     - **Preço de Custo (R$):** `110,00` | **Preço Varejo (R$) \*:** `249,00`
     - **Preço Mínimo PDV (R$):** `225,00` | **Preço Atacado (R$):** `220,00` | **Preço VIP (R$):** `205,00`
     - **Qtd Atual:** `15` | **Qtd Mínima:** `3` | **Qtd Máxima:** `50` | **Qtd Mín Atacado:** `2`
     - **Localização:** `Gaveteiro Farmácia — Bloco B`
     - **Descrição:** `Coleira antipulgas e carrapatos para cães com peso acima de 8kg. Oferece proteção contínua de até 8 meses.`
     - **Observações:** `Exige temperatura controlada abaixo de 25 graus.`
     - **Switches:** Visível no catálogo = **ATIVO (✅)** | Rastrear número de série = **ATIVO (✅)** | Pode ser brinde = **INATIVO**
     - **Garantia:** Switch "Este produto tem garantia" = **ATIVO (✅)**
       - **Dias de Garantia \*:** `30`
       - **Termo de Garantia:** `Garantia de 30 dias para lacres e defeitos mecânicos da fivela.`

  3. **Brinquedo Inteligente Kong Extreme G:**
     - **Nome do Produto \*:** `Brinquedo Inteligente Kong Extreme G`
     - **SKU:** `KONG-EXT-G` | **Código de Barras (EAN):** `035585111149`
     - **Categoria:** Selecionar `Acessórios` | **Fornecedor Vinculado:** `PetDistributor Acessórios`
     - **Preço de Custo (R$):** `55,00` | **Preço Varejo (R$) \*:** `119,00`
     - **Preço Mínimo PDV (R$):** `105,00` | **Preço Atacado (R$):** `100,00` | **Preço VIP (R$):** `95,00`
     - **Qtd Atual:** `12` | **Qtd Mínima:** `2` | **Qtd Máxima:** `30` | **Qtd Mín Atacado:** `3`
     - **Localização:** `Vitrine Principal 2`
     - **Descrição:** `Brinquedo de borracha ultra-resistente indicado para cães de mordida severa. Auxilia no enriquecimento ambiental.`
     - **Observações:** `Não cobrir defeitos por mordedura excessiva fora do prazo de garantia.`
     - **Switches:** Visível no catálogo = **ATIVO (✅)** | Rastrear número de série = **INATIVO** | Pode ser brinde = **INATIVO**
     - **Garantia:** Switch "Garantia" = **ATIVO (✅)**
       - **Dias de Garantia \*:** `90`
       - **Termo de Garantia:** `Garantia de 90 dias contra destruição acelerada (especial Kong).`

  4. **Shampoo Neutro Pet Concentrado 5L:**
     - **Nome do Produto \*:** `Shampoo Neutro Pet Concentrado 5L`
     - **SKU:** `SHAMP-PET-5L` | **Código de Barras (EAN):** `7892000200022`
     - **Categoria:** Selecionar `Higiene` | **Fornecedor Vinculado:** `PetDistributor Acessórios`
     - **Preço de Custo (R$):** `45,00` | **Preço Varejo (R$) \*:** `120,00`
     - **Preço Mínimo PDV (R$):** `110,00` | **Preço Atacado (R$):** `105,00` | **Preço VIP (R$):** `98,00`
     - **Qtd Atual:** `6` | **Qtd Mínima:** `1` | **Qtd Máxima:** `15` | **Qtd Mín Atacado:** `2`
     - **Localização:** `Armário Banho e Tosa — Prateleira Baixa`
     - **Descrição:** `Shampoo de galão concentrado para higienização profissional de cães e gatos. Fórmula hipoalergênica.`
     - **Switches:** Visível no catálogo = **ATIVO (✅)** | Garantia = **INATIVO**

  5. **Biscoito Petisco Premium Dog 150g:**
     - **Nome do Produto \*:** `Biscoito Petisco Premium Dog 150g`
     - **SKU:** `BISCUIT-PET-150` | **Código de Barras (EAN):** `7893000300033`
     - **Categoria:** Selecionar `Alimentos` | **Fornecedor Vinculado:** `Royal Canin do Brasil`
     - **Preço de Custo (R$):** `3,00` | **Preço Varejo (R$) \*:** `12,00`
     - **Preço Mínimo PDV (R$):** `9,50` | **Preço Atacado (R$):** `9,00` | **Preço VIP (R$):** `8,00`
     - **Qtd Atual:** `50` | **Qtd Mínima:** `10` | **Qtd Máxima:** `100` | **Qtd Mín Atacado:** `10`
     - **Localização:** `Balcão Checkout — Gaveta Lateral`
     - **Descrição:** `Petisco crocante integral para adestramento e agrado de cães de todos os portes.`
     - **Switches:** Visível no catálogo = **ATIVO (✅)** | Pode ser usado como brinde = **ATIVO (✅)** | Garantia = **INATIVO**

  6. **Sachê Whiskas Gato Carne 85g:**
     - **Nome do Produto \*:** `Sachê Whiskas Gato Carne 85g`
     - **SKU:** `WHIS-SAC-85` | **Código de Barras (EAN):** `7894000400044`
     - **Categoria:** Selecionar `Alimentos` | **Fornecedor Vinculado:** `Royal Canin do Brasil`
     - **Preço de Custo (R$):** `1,50` | **Preço Varejo (R$) \*:** `3,50`
     - **Preço Mínimo PDV (R$):** `3,00` | **Preço Atacado (R$):** `2,90` | **Preço VIP (R$):** `2,70`
     - **Qtd Atual:** `80` | **Qtd Mínima:** `15` | **Qtd Máxima:** `200` | **Qtd Mín Atacado:** `15`
     - **Localização:** `Prateleira Feline — Gôndola 2`
     - **Descrição:** `Alimento úmido completo e balanceado para gatos adultos sabor carne ao molho.`
     - **Switches:** Visível no catálogo = **ATIVO (✅)** | Pode ser usado como brinde = **ATIVO (✅)** | Garantia = **INATIVO**

  7. **Vermífugo cães Drontal Plus 4 Comprimidos:**
     - **Nome do Produto \*:** `Vermífugo cães Drontal Plus 4 Comprimidos`
     - **SKU:** `DRONTAL-PLUS` | **Código de Barras (EAN):** `4007221040407`
     - **Categoria:** Selecionar `Medicamentos` | **Fornecedor Vinculado:** `Zoetis Saúde Animal`
     - **Preço de Custo (R$):** `38,00` | **Preço Varejo (R$) \*:** `89,00`
     - **Preço Mínimo PDV (R$):** `80,00` | **Preço Atacado (R$):** `78,00` | **Preço VIP (R$):** `72,00`
     - **Qtd Atual:** `20` | **Qtd Mínima:** `4` | **Qtd Máxima:** `40` | **Qtd Mín Atacado:** `5`
     - **Localização:** `Gaveteiro Farmácia — Bloco A`
     - **Descrição:** `Vermífugo de amplo espectro sabor carne para cães. Combate giardíase e vermes redondos e chatos.`
     - **Switches:** Visível no catálogo = **ATIVO (✅)** | Garantia = **INATIVO**

- [ ] **Passo 4.2 — Batimento do Valor do Estoque Inicial:**
  - Acessar a listagem de **Estoque** (`/estoque` — [estoque/page.tsx](file:///C:/Users/kauan.pereira/.gemini/antigravity/scratch/nexocommerce/src/app/(dashboard)/estoque/page.tsx)).
  - **✅ VERIFICAR:** O total de itens diferentes cadastrados é **7**.
  - **✅ VERIFICAR (Matemática de Custo Inicial):** O total de valor do estoque (custo de aquisição estimado) deve ser exatamente **R$ 5.210,00**:
    - `ROYAL-GR-12`: 10 * R$ 160,00 = R$ 1.600,00
    - `SERESTO-G`: 15 * R$ 110,00 = R$ 1.650,00
    - `KONG-EXT-G`: 12 * R$ 55,00 = R$ 660,00
    - `SHAMP-PET-5L`: 6 * R$ 45,00 = R$ 270,00
    - `BISCUIT-PET-150`: 50 * R$ 3,00 = R$ 150,00
    - `WHIS-SAC-85`: 80 * R$ 1,50 = R$ 120,00
    - `DRONTAL-PLUS`: 20 * R$ 38,00 = R$ 760,00
    - **Soma Correta:** 1.600 + 1.650 + 660 + 270 + 150 + 120 + 760 = **R$ 5.210,00**.

---

## DIA 5 — CADASTRO DE CLIENTES E FORNECEDORES (COBERTURA TOTAL DE CAMPOS)
**Módulos:** Clientes → Novo · Fornecedores → Novo

- [ ] **Passo 5.1 — Cadastrar os 5 Clientes Preenchendo Todos os Campos:**
  - Ir em **Clientes → Novo** (`/clientes/novo` — [clientes/novo/page.tsx](file:///C:/Users/kauan.pereira/.gemini/antigravity/scratch/nexocommerce/src/app/(dashboard)/clientes/novo/page.tsx)).
  - Para cada cliente de teste, preencha **todos** os campos do formulário (incluindo dados estruturados de endereço e notas do CRM):

    1. **Mariana Lima:**
       - **Nome completo \*:** `Mariana Lima` | **CPF:** `123.456.789-01`
       - **Telefone / WhatsApp:** `(11) 97777-5555` | **E-mail:** `mariana.lima@gmail.com`
       - **CEP:** `04101-300` (Clicar em Buscar/Lupa para preencher automaticamente: Rua Vergueiro, Vila Mariana, São Paulo/SP)
       - **Número:** `1200` | **Complemento:** `Apto 152 — Bloco C`
       - **Tipo de Cliente:** Selecionar **🏪 Varejo**
       - **Anotações/ CRM:** `Tutora do cocker Boby. Costuma comprar sachês e brinquedos. Prefere atendimento aos sábados.`

    2. **Canil Vale Verde:**
       - **Nome completo \*:** `Canil Vale Verde` | **CNPJ:** `22.333.444/0001-55`
       - **Telefone / WhatsApp:** `(11) 3322-7700` | **E-mail:** `vendas@canilvaleverde.com.br`
       - **CEP:** `06730-000` (Vargem Grande Paulista/SP)
       - **Número:** `500` | **Complemento:** `Km 45 da Rodovia Raposo Tavares`
       - **Tipo de Cliente:** Selecionar **📦 Atacado**
       - **Anotações/ CRM:** `Comprador recorrente em grande escala. Rações e coleiras. Exige preços promocionais de atacado.`

    3. **Dra. Beatrix:**
       - **Nome completo \*:** `Dra. Beatrix` | **CPF:** `987.654.321-99`
       - **Telefone / WhatsApp:** `(11) 96655-1100` | **E-mail:** `beatrix.vet@outlook.com`
       - **CEP:** `01223-010` (Rua Maria Antônia, Consolação, São Paulo/SP)
       - **Número:** `350` | **Complemento:** `Consultório Veterinário 12`
       - **Tipo de Cliente:** Selecionar **⭐ VIP**
       - **Anotações/ CRM:** `Parceira clínica. Encaminha clientes para banho e tosa. Tutora do persa Tom. Aplicar tabela de preços VIP.`

    4. **Seu Manoel (Vizinho):**
       - **Nome completo \*:** `Seu Manoel (Vizinho)` | **CPF:** `222.333.444-55`
       - **Telefone / WhatsApp:** `(11) 99911-2233` | **E-mail:** `manoel.vizinho@gmail.com`
       - **CEP:** `01424-001` (Alameda Lorena, Jardins, São Paulo/SP)
       - **Número:** `860` | **Complemento:** `Casa Lateral`
       - **Tipo de Cliente:** Selecionar **🏪 Varejo**
       - **Anotações/ CRM:** `Cliente de vizinhança. Tutora de vira-lata. Permitido fiado se aprovado pelo gerente.`

    5. **Geraldo Neto:**
       - **Nome completo \*:** `Geraldo Neto` | **CPF:** `555.666.777-88`
       - **Telefone / WhatsApp:** `(11) 98811-1122` | **E-mail:** `geraldo.neto@live.com`
       - **CEP:** `04531-000` (Rua Joaquim Floriano, Itaim Bibi, São Paulo/SP)
       - **Número:** `100` | **Complemento:** `Apto 42`
       - **Tipo de Cliente:** Selecionar **🏪 Varejo**
       - **Anotações/ CRM:** `Tutor da Mel (Golden Retriever). Frequenta o banho e tosa a cada 15 dias.`

- [ ] **Passo 5.2 — Cadastrar os 3 Fornecedores Preenchendo Todos os Campos:**
  - Acessar **Fornecedores** (`/fornecedores` — [fornecedores/page.tsx](file:///C:/Users/kauan.pereira/.gemini/antigravity/scratch/nexocommerce/src/app/(dashboard)/fornecedores/page.tsx)) → Clicar em **"+ Novo Fornecedor"**.
  - Cadastrar os fornecedores preenchendo todos os campos, incluindo a busca de CEP ViaCEP e categorias de insumos:

    1. **Royal Canin do Brasil:**
       - **Razão Social / Nome \*:** `Royal Canin do Brasil` | **Nome do Contato:** `Atendimento Royal`
       - **CNPJ:** `58.200.312/0001-44` | **E-mail:** `pedidos@royalcanin.com.br`
       - **Telefone / WhatsApp:** `(11) 4004-9000` | **Categoria:** `Alimentos`
       - **CEP:** `13690-000` | **Cidade:** `Descalvado` | **Estado:** `SP` | **Endereço:** `Fazenda Santa Rita, s/n`
       - **Prazo de Entrega:** `48h` | **Pedido Mínimo (R$):** `1.500,00`
       - **Anotações:** `Fornecedor direto de rações comerciais e veterinárias. Frete CIF para pedidos acima do mínimo.`

    2. **Zoetis Saúde Animal:**
       - **Razão Social / Nome \*:** `Zoetis Saúde Animal` | **Nome do Contato:** `Representante Zoetis`
       - **CNPJ:** `43.555.666/0001-90` | **E-mail:** `contato@zoetis.com`
       - **Telefone / WhatsApp:** `(19) 3800-1122` | **Categoria:** `Medicamentos`
       - **CEP:** `13054-700` | **Cidade:** `Campinas` | **Estado:** `SP` | **Endereço:** `Rua James Joule, 92`
       - **Prazo de Entrega:** `3 dias` | **Pedido Mínimo (R$):** `500,00`
       - **Anotações:** `Fornecedor oficial de vacinas e vermífugos (Drontal e vacinas caninas/felinas).`

    3. **PetDistributor Acessórios:**
       - **Razão Social / Nome \*:** `PetDistributor Acessórios` | **Nome do Contato:** `Vendas PetDist`
       - **CNPJ:** `10.203.405/0001-22` | **E-mail:** `comercial@petdist.com.br`
       - **Telefone / WhatsApp:** `(11) 3322-8877` | **Categoria:** `Acessórios`
       - **CEP:** `01001-000` | **Cidade:** `São Paulo` | **Estado:** `SP` | **Endereço:** `Praça da Sé, 100`
       - **Prazo de Entrega:** `24h` | **Pedido Mínimo (R$):** `200,00`
       - **Anotações:** `Distribuidora de brinquedos premium e coleiras de passeio. Entrega expressa motoboy para Grande SP.`

---

# ══════════════════════════════════════════════════
# SEMANA 2 — VENDAS, ORDENS DE SERVIÇO E UPGRADE PRO (Dias 6–12)
# ══════════════════════════════════════════════════

## DIA 6 — PRIMEIRAS VENDAS E UPGRADE PRO VIA STRIPE
**Módulos:** PDV (Vendas) · Assinatura

- [ ] **Passo 6.1 — Venda #0001 (Mariana Lima - Varejo):**
  - Acessar o PDV (`/vendas/nova` — [vendas/nova/page.tsx](file:///C:/Users/kauan.pereira/.gemini/antigravity/scratch/nexocommerce/src/app/(dashboard)/vendas/nova/page.tsx)).
  - Vincular o cliente: **Mariana Lima**.
  - Adicionar ao carrinho: **1x Ração Royal Canin Golden Retriever 12kg**.
  - **✅ VERIFICAR:** O preço unitário do item no PDV é R$ 299,00 (Varejo).
  - Forma de Pagamento: **PIX**.
  - Finalizar a venda.
  - **✅ VERIFICAR:** Recibo gerado com o número da Venda sequencial da loja. O cabeçalho e o rodapé contêm exclusivamente a marca **KDL Store**.

- [ ] **Passo 6.2 — Venda #0002 (Canil Vale Verde - Atacado):**
  - Abrir o PDV. Vincular o cliente: **Canil Vale Verde** (Atacado).
  - Adicionar ao carrinho:
    - **5x Ração Royal Canin Golden Retriever 12kg**. **✅ VERIFICAR:** O preço unitário altera automaticamente para R$ 260,00 (Atacado).
    - **3x Coleira Antipulgas Seresto Cães Grandes**. **✅ VERIFICAR:** Preço unitário altera para R$ 220,00 (Atacado).
  - Alterar o preço unitário da coleira Seresto no carrinho manualmente para **R$ 203,33** (simulando desconto manual autorizado por atacado).
  - **Subtotal:** (5 * 260,00) + (3 * 203,33) = R$ 1.910,00.
  - Aplicar **Desconto Global** no valor de **R$ 110,00**.
  - **✅ VERIFICAR:** O total da venda no carrinho é recalculado para **R$ 1.800,00**.
  - Forma de Pagamento: **PIX**.
  - Finalizar a venda.

- [ ] **Passo 6.3 — Upgrade para o Plano Pro:**
  - Acessar `/assinar`. Clicar em **"Assinar Plano Pro"**.
  - No formulário de checkout Stripe, preencher os dados fictícios do cartão (`4242 4242 4242 4242`, expiração futura, CVV `123`).
  - Processar o pagamento e retornar ao sistema.
  - **✅ VERIFICAR:** A barra lateral exibe o badge **Plano Pro**. As telas de comissões, despesas, e DRE estão desbloqueadas.

---

## DIA 7 — REATIVAÇÃO DO FIADO E CONVITE DE USUÁRIO
**Módulos:** Configurações → Pagamentos · Configurações → Usuários

- [ ] **Passo 7.1 — Reativar Forma de Pagamento Fiado:**
  - Ir em **Configurações → Pagamentos** (`/configuracoes/pagamentos`).
  - Localizar **Fiado** e reativar a forma de pagamento mudando o toggle para ativo.
  - Recarregar a página para certificar-se da persistência no banco de dados.

- [ ] **Passo 7.2 — Fluxo de Convite de Operador:**
  - Ir em **Configurações → Usuários** (`/configuracoes/usuarios`).
  - Clicar em **"+ Novo Usuário"** ou **"Convidar Membro"**.
  - Inserir E-mail: `aline@petglow.com.br` | Função: `Operador`.
  - Enviar convite. Copiar o link do convite gerado e abrir em uma aba anônima.
  - Completar o cadastro de Aline Costa (Senha: `AlineCosta@2026`).
  - Logar com a conta de Aline na aba anônima.
  - **✅ VERIFICAR RESTRIÇÕES DE OPERADOR:**
    - O menu "Configurações" não deve aparecer na barra lateral.
    - Tentativas de acessar `/financeiro` ou `/comissoes` diretamente exibem aviso de permissão negada.
    - O PDV (/vendas/nova) está totalmente disponível para operation.
  - Deslogar da aba anônima e retornar ao login do Administrador.

---

## DIA 8 — CADASTRO DE COMISSIONADOS E SALDOS ZERADOS
**Módulos:** Comissões (`/comissoes` — [comissoes/page.tsx](file:///C:/Users/kauan.pereira/.gemini/antigravity/scratch/nexocommerce/src/app/(dashboard)/comissoes/page.tsx))

- [ ] **Passo 8.1 — Cadastrar Comissionados:**
  - Acessar o módulo de **Comissões**.
  - Clicar em **"+ Cadastrar Comissionado"**:
    1. **Nome:** `Clara Pet (Influenciadora Pet)` | **WhatsApp:** `(11) 98111-2222` | **Tipo:** `Percentual` | **Taxa:** `8,00%`
    2. **Nome:** `Dr. Augusto (Veterinário Parceiro)` | **WhatsApp:** `(11) 98333-4444` | **Tipo:** `Fixo por venda` | **Valor:** `50,00`
  - **✅ VERIFICAR (Garantia de consistência):** Os saldos de comissões pagas e pendentes de ambos os comissionados devem estar estritamente em **R$ 0,00**.

- [ ] **Passo 8.2 — Venda #0003 com Desconto VIP, Brinde e Comissão:**
  - Ir ao PDV. Vincular o cliente: **Dra. Beatrix** (VIP).
  - Adicionar ao carrinho:
    - **1x Brinquedo Inteligente Kong Extreme G**. **✅ VERIFICAR:** Preço unitário ajustado automaticamente para R$ 95,00 (VIP).
    - **1x Coleira Antipulgas Seresto Cães Grandes**. **✅ VERIFICAR:** Preço unitário ajustado para R$ 199,00 (VIP).
    - **1x Biscoito Petisco Premium Dog 150g** (Brinde). **✅ VERIFICAR:** Clicar em "Marcar como Brinde" no item biscoito. O valor unitário passa a ser R$ 0,00.
  - **Subtotal:** 95,00 + 199,00 + 0,00 = **R$ 294,00**.
  - **Seletor de Comissionado:** No campo de seleção de indicador, escolher **Clara Pet (Influenciadora Pet)**.
  - Forma de Pagamento: **Cartão de Crédito**.
  - Concluir venda.
  - **✅ VERIFICAR:** O saldo de comissão pendente de Clara Pet passou para **R$ 23,52** (8% de R$ 294,00). O estoque do Biscoito (brinde) reduziu de 50 para 49.

---

## DIA 9 — LANÇAMENTO DE DESPESAS DA LOJA
**Módulos:** Financeiro → Despesas (`/financeiro/despesas` — [financeiro/despesas/page.tsx](file:///C:/Users/kauan.pereira/.gemini/antigravity/scratch/nexocommerce/src/app/(dashboard)/financeiro/despesas/page.tsx))

- [ ] **Passo 9.1 — Cadastrar Despesas Iniciais:**
  - Acessar **Financeiro → Despesas** e cadastrar os custos operacionais fixos do mês atual:
    - [ ] **Despesa 1:** Descrição: `Aluguel Lorena Jardins` | Categ: `Aluguel` | Tipo: `Fixa` | Valor: `4.500,00` | Status: `Pago` | Pago em: **Dinheiro** (ou transferência com data de hoje - 29 dias).
    - [ ] **Despesa 2:** Descrição: `Conta de Energia (Maio)` | Categ: `Energia` | Tipo: `Fixa` | Valor: `520,00` | Status: `Pago` | Pago em: **Boleto** (data de hoje - 28 dias).
    - [ ] **Despesa 3:** Descrição: `Internet Fibra Óptica 400MB` | Categ: `Internet` | Tipo: `Fixa` | Valor: `149,90` | Status: `Pago` | Pago em: **Boleto** (data de hoje - 26 dias).
  - **✅ VERIFICAR:** A soma total das despesas listadas é de exatamente **R$ 5.169,90**.

---

## DIA 10 — ORDENS DE SERVIÇO: REQUISITO DE CUSTO DE PEÇAS
**Módulos:** Ordens de Serviço (`/ordens-de-servico` — [ordens-de-servico/page.tsx](file:///C:/Users/kauan.pereira/.gemini/antigravity/scratch/nexocommerce/src/app/(dashboard)/ordens-de-servico/page.tsx))

- [ ] **Passo 10.1 — Criar OS #0001 com Novo Campo de Custo Interno:**
  - Ir ao módulo de **Ordens de Serviço** e clicar em **"+ Nova OS"** ([ordens-de-servico/novo/page.tsx](file:///C:/Users/kauan.pereira/.gemini/antigravity/scratch/nexocommerce/src/app/(dashboard)/ordens-de-servico/novo/page.tsx) se aplicável).
  - Preencher o formulário:
    - **Cliente:** `Geraldo Neto` | Celular: `(11) 98811-1122`
    - **Equipamento/Pet:** `Golden Retriever (Mel)`
    - **Defeito/Serviço Relatado:** `Banho Completo + Tosa Higiênica + Hidratação`
    - **Técnico Responsável:** `Tosa Marina`
    - **Previsão de Entrega:** `Hoje - 2 dias` (Criada em: hoje - 12 dias)
    - **Valor do Serviço (R$):** `90,00`
    - **Valor das Peças / Shampoos Cobrados do Cliente (R$):** `50,00`
    - **Custo das Peças / Custo de Aquisição Interno (R$):** `14,00` (Campo essencial de controle interno que não é impresso no recibo do cliente).
  - **✅ VERIFICAR:** O campo "Orçamento Total Estimado" calcula automaticamente a soma de Serviço + Peças: **R$ 140,00**.
  - Criar e Salvar a OS.
  - **✅ VERIFICAR (Numeração Sequencial):** A OS foi criada com o número sequencial da empresa: **#0001**.
  - **✅ VERIFICAR (Histórico):** A OS aparece listada com o status inicial **Aguardando**.

---

## DIA 11 — CONCLUIR OS E MENSAGEM WHATSAPP
**Módulos:** Ordens de Serviço (`/ordens-de-servico/[id]` — [ordens-de-servico/[id]/page.tsx](file:///C:/Users/kauan.pereira/.gemini/antigravity/scratch/nexocommerce/src/app/(dashboard)/ordens-de-servico/[id]/page.tsx))

- [ ] **Passo 11.1 — Evoluir Status da OS e Testar WhatsApp Template:**
  - Clicar na OS #0001 para ver detalhes.
  - Clicar no botão para evoluir o status para **Aprovado**.
  - Em seguida, avançar para **Em Serviço** e, depois, para **Concluído (Pronto para Entrega)**.
  - Clicar na aba/botão de enviar mensagem de WhatsApp. Selecionar o template "Pronto para Retirada".
  - **✅ VERIFICAR:** O preview da mensagem traz o texto customizado com o nome do cliente "Geraldo Neto", animal "Mel", e o valor total "R$ 140,00". A URL pública `/acompanhar-os/[id]` do cliente está presente para visualização.

- [ ] **Passo 11.2 — Entrega da OS com Seleção Obrigatória de Forma de Pagamento:**
  - Clicar no botão **"Entregar Aparelho / Animal"** (ou mudar status para **Entregue**).
  - **✅ VERIFICAR:** Um modal de prompt é exibido obrigando a seleção do método de pagamento para faturamento da OS.
  - Selecionar o método: **PIX**. Confirmar a entrega.
  - **✅ VERIFICAR:** O status mudou para **Entregue**.
  - Ir para **Financeiro → Fechamento de Caixa** (`/financeiro/fechamento`).
  - **✅ VERIFICAR:** A receita de R$ 140,00 da OS #0001 consta nas entradas de caixa sob a categoria de método de pagamento **PIX**.
  - Ir para **Financeiro → Visão Geral (DRE)** (`/financeiro`).
  - **✅ VERIFICAR:** A receita de serviço de R$ 140,00 foi integrada e o Custo de Aquisição Interno de R$ 14,00 foi adicionado ao CMV das OS.

---

## DIA 12 — LANÇAMENTO DE DESPESA FUTURA E FILTRAGEM DO DASHBOARD
**Módulos:** Financeiro → Despesas · Dashboard (`/dashboard`)

- [ ] **Passo 12.1 — Lançar Despesa com Data Futura (Testar Filtro .lte):**
  - Acessar **Financeiro → Despesas** (`/financeiro/despesas`).
  - Clicar em **"+ Nova Despesa"**.
  - Preencher:
    - **Descrição:** `Mesa de Cirurgia Veterinária (Parc 2/5)`
    - **Categoria:** `Equipamentos` | **Tipo:** `Variável`
    - **Valor:** `850,00`
    - **Data:** `Hoje + 27 dias` (Propositalmente no próximo mês)
    - **Status:** `Pendente` | **Forma de Pagamento:** `Cartão de Crédito`
  - Salvar despesa.

- [ ] **Passo 12.2 — Validar Exclusão no Dashboard e DRE:**
  - Acessar o **Dashboard** (`/dashboard`).
  - Localizar a KPI **"Despesas do Mês"**.
  - **✅ VERIFICAR:** O valor exibido nesta KPI não deve incluir os R$ 850,00 da despesa futura (pois o filtro `.lte(fimMes)` impede a inclusão). O valor total acumulado no dashboard deve refletir as despesas com vencimento estritamente no período atual.
  - Ir para **Financeiro → Visão Geral (DRE)**.
  - **✅ VERIFICAR:** A DRE do mês não computa a despesa de R$ 850,00, mantendo a integridade dos resultados fiscais atuais.

---

# ══════════════════════════════════════════════════
# SEMANA 3 — MOVIMENTAÇÕES DE ESTOQUE, FIADO E CRM (Dias 13–20)
# ══════════════════════════════════════════════════

## DIA 13 — VENDAS COM COMISSÃO PERCENTUAL E TROCO
**Módulos:** PDV (Vendas) · Comissões

- [ ] **Passo 13.1 — Venda #0004 com Comissão de Clara Pet:**
  - Ir ao PDV. Selecionar o cliente: **Mariana Lima** (Varejo).
  - Adicionar ao carrinho: **1x Ração Royal Canin Golden Retriever 12kg** (Preço: R$ 299,00).
  - Selecionar no campo comissionado: **Clara Pet (Influenciadora Pet)**.
  - Selecionar a forma de pagamento: **PIX**.
  - Concluir a venda.
  - **✅ VERIFICAR (Matemática de Comissão):**
    - Acessar o módulo de **Comissões** (`/comissoes`).
    - O saldo pendente de Clara Pet acumulou a comissão desta venda: 8% de R$ 299,00 = **R$ 23,92**.
    - Saldo Pendente Acumulado de Clara Pet (Venda 3 + Venda 4): 23,52 + 23,92 = **R$ 47,44**.

- [ ] **Passo 13.2 — Venda #0005 com Calculadora de Troco:**
  - Ir ao PDV. Selecionar o cliente: **Mariana Lima**.
  - Adicionar ao carrinho:
    - **2x Sachê Whiskas Gato Carne 85g** (Preço: 2 * 3,50 = R$ 7,00).
    - **1x Brinquedo Inteligente Kong Extreme G** (Preço: R$ 119,00).
    - **Subtotal:** R$ 126,00.
  - Selecionar Forma de Pagamento: **Dinheiro**.
  - No campo "Valor Pago/Recebido pelo Cliente", digitar: `150,00`.
  - **✅ VERIFICAR:** O sistema exibe o valor do troco calculado automaticamente: **R$ 24,00**.
  - Concluir a venda. O estoque de Kong reduz de 11 para 10. O estoque do sachê Whiskas reduz para 78.

---

## DIA 14 — PEDIDO DE FORNECEDOR E CRIAÇÃO AUTOMÁTICA DE DESPESA
**Módulos:** Fornecedores → Pedidos de Compra · Estoque · Financeiro → Despesas

- [ ] **Passo 14.1 — Criar Pedido de Compra de Drontal Plus:**
  - Acessar **Fornecedores** (`/fornecedores`) → Aba **"Pedidos de Compra"**.
  - Clicar em **"+ Novo Pedido"**.
  - Preencher:
    - **Fornecedor:** `Zoetis Saúde Animal`
    - **Insumo / Produto:** `Drontal Plus Vermífugo x10`
    - **Quantidade:** `10`
    - **Preço Unitário de Custo:** `38,00`
  - **✅ VERIFICAR:** O total do pedido calcula automaticamente: **R$ 380,00**.
  - Salvar pedido. Status inicial do pedido = **Pendente**.

- [ ] **Passo 14.2 — Avançar Status e Validar Integração Automática:**
  - Na lista de pedidos de compra, editar o status para **Enviado**.
  - Em seguida, alterar o status para **Recebido** (indicando a entrega física dos insumos).
  - **✅ VERIFICAR (Estoque):**
    - Ir em **Estoque** (`/estoque`). O saldo de Vermífugo Drontal Plus subiu automaticamente de 20 para **30 unidades** (entradas registradas no log de movimentações).
  - **✅ VERIFICAR (Despesas):**
    - Ir em **Financeiro → Despesas** (`/financeiro/despesas`).
    - Uma despesa automática foi criada: `Compra de insumo/produto - Drontal Plus Vermífugo x10 (Zoetis Saúde Animal)` | Valor: **R$ 380,00** | Categ: `Fornecedor` | Status: `Pendente` | Forma de Pagamento: `Boleto`.

---

## DIA 15 — OPERAÇÕES EM FIADO E AMORTIZAÇÃO DE SALDO
**Módulos:** PDV (Vendas) · Financeiro → Fiado (`/financeiro/fiado` — [financeiro/fiado/page.tsx](file:///C:/Users/kauan.pereira/.gemini/antigravity/scratch/nexocommerce/src/app/(dashboard)/financeiro/fiado/page.tsx))

- [ ] **Passo 15.1 — Venda #0006 no Fiado:**
  - Ir ao PDV. Selecionar o cliente: **Seu Manoel (Vizinho)**.
  - Adicionar ao carrinho: **1x Coleira Antipulgas Seresto Cães Grandes** (Preço: R$ 249,00).
  - Selecionar a Forma de Pagamento: **Fiado**.
  - Concluir venda.
  - **✅ VERIFICAR:** O estoque de coleiras Seresto reduziu de 11 para 10.

- [ ] **Passo 15.2 — Validar Fiado no Financeiro:**
  - Acessar **Financeiro → Fiado**.
  - **✅ VERIFICAR:** Seu Manoel (Vizinho) aparece na lista de contas a receber com um saldo pendente de **R$ 249,00** marcado como ativo/em aberto.
  - **✅ VERIFICAR (Dashboard):** A KPI de "Contas no Fiado" aumentou em R$ 249,00.

- [ ] **Passo 15.3 — Simulação de Amortização Parcial de Fiado:**
  - Retornar a **Financeiro → Fiado**.
  - Localizar a conta de Seu Manoel e clicar no botão **"Pagar / Amortizar"**.
  - Preencher valor do pagamento parcial: **R$ 100,00** | Forma: **PIX**. Confirmar.
  - **✅ VERIFICAR:** O saldo pendente de Seu Manoel foi atualizado no grid para **R$ 149,00**.
  - **✅ VERIFICAR (Caixa):** As entradas de caixa exibem o recebimento de R$ 100,00 em PIX sob a rubrica "Amortização de Fiado".
  - *Nota: Na simulação do banco de dados completo (SQL) o fiado permaneceu integralmente em aberto para fins de auditoria final, portando não conclua este pagamento ou realize o estorno após o teste para manter a integridade dos cálculos.*

---

## DIA 16 — OS #0002 COM CONSUMO DE INSUMO DO ESTOQUE
**Módulos:** Ordens de Serviço · Estoque

- [ ] **Passo 16.1 — Criar OS #0002 com Drontal Plus:**
  - Acessar o módulo de **Ordens de Serviço**. Clicar em **"+ Nova OS"**.
  - Preencher:
    - **Cliente:** `Dra. Beatrix`
    - **Equipamento/Pet:** `Gato Persa (Tom)`
    - **Serviço/Defeito:** `Aplicação de Vacina V10 + Consulta Veterinária`
    - **Técnico:** `Vet Dr. Eduardo`
    - **Previsão:** `Hoje - 1 dia` (Criada em: hoje - 8 dias)
    - **Valor do Serviço (R$):** `150,00`
    - **Valor das Peças Cobradas (R$):** `89,00`
    - **Custo de Aquisição Interno das Peças (R$):** `38,00` (Equivalente ao custo de 1x comprimido Drontal).
  - Salvar OS. **✅ VERIFICAR:** Número atribuído: **#0002**.

- [ ] **Passo 16.2 — Concluir e Entregar a OS:**
  - Avançar o status da OS #0002 de Aguardando → Aprovado → Em Serviço → Concluído.
  - Clicar em **"Entregar"**.
  - No modal de forma de pagamento, selecionar: **Dinheiro**.
  - **✅ VERIFICAR (Estoque):** Realizar o ajuste manual no estoque ou verificar a saída de **1x Vermífugo Drontal Plus** vinculada ao consumo interno da OS no histórico. O saldo físico deve ser de **29 unidades** (inicial 20 + 10 pedido - 1 consumo OS).
  - **✅ VERIFICAR (DRE):**
    - Receita de serviços acumulada: 140,00 (OS 1) + 239,00 (OS 2) = **R$ 379,00**.
    - Custo real de peças acumulado no CMV: 14,00 + 38,00 = **R$ 52,00**.

---

## DIA 17 — CRM DE CLIENTES INATIVOS
**Módulos:** Clientes → Inativos (`/clientes/inativos` — [clientes/inativos/page.tsx](file:///C:/Users/kauan.pereira/.gemini/antigravity/scratch/nexocommerce/src/app/(dashboard)/clientes/inativos/page.tsx))

- [ ] **Passo 17.1 — CRM de Clientes Sumidos/Inativos:**
  - Acessar a aba **Clientes Inativos** no painel de Clientes.
  - **✅ VERIFICAR:** O sistema deve cruzar a última data de compra com os `30 dias` cadastrados nas configurações de CRM da empresa.
  - Clientes que não realizam compras há mais de 30 dias devem constar na listagem com opções rápidas de contato via link de WhatsApp pré-montado.

---

# ══════════════════════════════════════════════════
# SEMANA 4 — FECHAMENTO DO MÊS, BATIMENTO MATEMÁTICO E AUDITORIA (Dias 21–30)
# ══════════════════════════════════════════════════

## DIA 21 — REPOSIÇÕES DE ESTOQUE E ENTRADA DE NOTA
**Módulos:** Estoque → Movimentações

- [ ] **Passo 21.1 — Lançar Reposições de Estoque Manuais:**
  - Acessar **Estoque → Ajustes** para lançar as notas fiscais de reposição que ocorreram no meio do mês:
    1. **Produto:** `Ração Royal Canin Golden Retriever 12kg` | Qtd: `+10` | Motivo: `NF Royal Canin 8092 — Lote rações`.
    2. **Produto:** `Vermífugo cães Drontal Plus` | Qtd: `+20` | Motivo: `NF Zoetis 1102 — Drontal Plus`.
    3. **Produto:** `Brinquedo Inteligente Kong Extreme G` | Qtd: `+8` | Motivo: `NF PetDist 400 — Lote Kongs`.
  - **✅ VERIFICAR:** As movimentações constam corretamente no log histórico de auditoria de estoque.

---

## DIA 22 — ÚLTIMAS TRANSAÇÕES E NUMERAÇÃO DE OS SEQUENCIAL POR LOJA
**Módulos:** PDV · Ordens de Serviço

- [ ] **Passo 22.1 — Venda #0007 com Comissão Fixa Dr. Augusto:**
  - Acessar o PDV. Cliente: **Geraldo Neto** (Varejo).
  - Adicionar: **1x Ração Royal Canin Golden Retriever 12kg** (Preço: R$ 299,00).
  - Selecionar indicador: **Dr. Augusto (Veterinário Parceiro)**.
  - Forma de Pagamento: **Cartão de Crédito**.
  - Concluir venda.
  - **✅ VERIFICAR (Comissões):**
    - O saldo pendente de comissão para o Dr. Augusto deve registrar exatamente **R$ 50,00** (valor fixo independente do total da venda).

- [ ] **Passo 22.2 — Criação de OS #0003 e OS #0004 (Validação da Trigger Sequencial):**
  - Acessar **Ordens de Serviço**. Clicar em **"+ Nova OS"**.
  - Criar **OS #0003**:
    - **Cliente:** `Mariana Lima` | Pet: `Cocker Spaniel (Boby)`
    - **Serviço:** `Limpeza de Tártaro (Procedimento sob anestesia)`
    - **Técnico:** `Vet Dr. Eduardo`
    - **Custo das Peças:** `45,00` | **Peças Cobradas:** `100,00` | **Valor Serviço:** `300,00` (Orçamento: **R$ 400,00**)
    - **Status:** Mudar para **Concluído** (Deixar como Aguardando Retirada — **NÃO** entregue, para testar que receitas não entram no DRE até a entrega final).
  - Criar **OS #0004**:
    - **Cliente:** `Canil Vale Verde` | Pet: `Lote de 3 Filhotes`
    - **Serviço:** `Vacinação e Checkup Geral`
    - **Técnico:** `Vet Dr. Eduardo`
    - **Custo das Peças:** `90,00` | **Peças Cobradas:** `200,00` | **Valor Serviço:** `250,00` (Orçamento: **R$ 450,00**)
    - **Status:** Mudar para **Em Serviço** (OS em andamento).
  - **✅ VERIFICAR:** Os números das OS gerados foram sequenciais (#0003 e #0004), sem saltar numerações por conta de registros em outras empresas/lojas do banco.

---

## DIA 23 — VENDA #0008 (HOJE)
**Módulos:** PDV

- [ ] **Passo 23.1 — Venda #0008 (Geraldo Neto):**
  - Acessar o PDV. Cliente: **Geraldo Neto**.
  - Adicionar ao carrinho:
    - **1x Coleira Antipulgas Seresto Cães Grandes** (Preço: R$ 249,00).
    - **2x Sachê Whiskas Gato Carne 85g** (Preço: 2 * 3,50 = R$ 7,00).
  - **Subtotal:** **R$ 256,00**.
  - Forma de Pagamento: **PIX**.
  - Concluir venda.

---

## DIA 28 — QUITAÇÃO DE COMISSÕES
**Módulos:** Comissões · Financeiro → Despesas

- [ ] **Passo 28.1 — Pagar Comissão ao Veterinário Dr. Augusto:**
  - Acessar o módulo de **Comissões** (`/comissoes`).
  - Localizar a comissão do **Dr. Augusto** (Valor Pendente: R$ 50,00).
  - Clicar no botão **"Pagar / Liquidar Comissão"**.
  - Selecionar a forma de pagamento e confirmar a quitação.
  - **✅ VERIFICAR:** O saldo pendente do Dr. Augusto zera (vai para R$ 0,00) e o valor pago vai para **R$ 50,00**.
  - Acessar **Financeiro → Despesas** e verificar que a saída de R$ 50,00 foi automaticamente debitada sob a rubrica "Comissão de Venda - Dr. Augusto" com status **Pago**.
  - *Nota: As comissões da Clara Pet (R$ 47,44) devem permanecer pendentes para auditar o saldo em aberto.*

---

## DIA 29 — LANÇAMENTO DE DESPESAS VARIÁVEIS ADICIONAIS
**Módulos:** Financeiro → Despesas

- [ ] **Passo 29.1 — Registrar Despesas Variáveis Finais:**
  - Acessar **Financeiro → Despesas**.
  - Lançar as despesas adicionais ocorridas no final do mês:
    - [ ] **Despesa 4:** Descrição: `Compra de Insumo - Vacinas Zoetis` | Categ: `Medicamentos` | Tipo: `Variável` | Valor: `780,00` | Status: `Pago` | Pago em: **Boleto** (data de hoje - 15 dias).
    - [ ] **Despesa 5:** Descrição: `Taxa Coleta de Lixo Hospitalar` | Categ: `Outros` | Tipo: `Variável` | Valor: `220,00` | Status: `Pago` | Pago em: **PIX** (data de hoje - 10 dias).
    - [ ] **Despesa 6:** Descrição: `Brindes Promocionais PetGlow` | Categ: `Outros` | Tipo: `Variável` | Valor: `150,00` | Status: `Pendente` | Pago em: **Dinheiro** (data de hoje - 4 dias).

---

## DIA 30 — AUDITORIA DE KPIS E CONCILIAÇÃO FINANCEIRA (FECHAMENTO DO MÊS)
**Módulos:** Financeiro → Visão Geral (DRE) · Financeiro → Fechamento de Caixa · Estoque

Esta etapa é dedicada a conciliar toda a movimentação operacional do mês de testes.

### ➔ Passo 30.1 — Batimento do Estoque Físico Restante
- [ ] Acessar o módulo de **Estoque** (`/estoque`).
- [ ] **✅ VERIFICAR** se as quantidades em estoque batem exatamente com a tabela de controle final abaixo:

| SKU | Produto | Qtd Inicial | Entradas (Notas) | Saídas (PDV) | Saídas (OS) | Qtd Final Esperada | Status do Estoque |
|-----|---------|-------------|------------------|--------------|-------------|--------------------|-------------------|
| `ROYAL-GR-12` | Ração Royal Golden Retriever | 10 | +10 | -7 | 0 | **13** | OK |
| `SERESTO-G` | Coleira Antipulgas Seresto | 15 | 0 | -6 | 0 | **9** | OK |
| `KONG-EXT-G` | Brinquedo Kong Extreme G | 12 | +8 | -2 | 0 | **18** | OK |
| `SHAMP-PET-5L` | Shampoo Neutro Pet 5L | 6 | 0 | 0 | 0 | **6** | OK |
| `BISCUIT-PET-150` | Biscoito Premium Dog 150g | 50 | 0 | -1 (brinde) | 0 | **49** | OK |
| `WHIS-SAC-85` | Sachê Whiskas Carne 85g | 80 | 0 | -4 | -2 (OS 1) | **74** | OK |
| `DRONTAL-PLUS` | Vermífugo Drontal Plus | 20 | +20 (Notas) + 10 (Pedido 1) | 0 | -1 (OS 2) | **49** | OK |

---

### ➔ Passo 30.2 — Batimento dos Relatórios Financeiros (DRE Simplificado)
- [ ] Acessar **Financeiro → Visão Geral (DRE)** (`/financeiro`).
- [ ] **✅ VERIFICAR** se todos os valores da planilha DRE do mês coincidem com a apuração matemática:

```
┌────────────────────────────────────────────────────────┐
│                   DRE DETALHADO — JUNHO 2026           │
├───────────────────────────────────────┬────────────────┤
│ Receita Bruta Total                   │ R$ 3.702,00    │
│  ├── Receita de Vendas                │ R$ 3.323,00    │
│  └── Receita de Serviços de OS        │ R$   379,00    │
├───────────────────────────────────────┼────────────────┤
│ (-) Custo de Mercadorias (CMV)        │ R$ 1.951,00    │
│  ├── CMV de Vendas                    │ R$ 1.899,00    │
│  └── CMV de OS (Custo Interno Peças)  │ R$    52,00    │
├───────────────────────────────────────┼────────────────┤
│ (=) Margem de Contribuição            │ R$ 1.751,00    │
├───────────────────────────────────────┼────────────────┤
│ (-) Despesas Operacionais Totais      │ R$ 6.797,34    │
│  ├── Aluguel Jardins                  │ R$ 4.500,00    │
│  ├── Conta de Energia                 │ R$   520,00    │
│  ├── Internet Fibra                   │ R$   149,90    │
│  ├── Compra Vacinas Zoetis            │ R$   780,00    │
│  ├── Taxa Coleta Lixo                 │ R$   220,00    │
│  ├── Brindes Promocionais (Pendente)  │ R$   150,00    │
│  ├── Pedido 1 Zoetis (Pendente)       │ R$   380,00    │
│  └── Comissões Acumuladas             │ R$    97,44    │
├───────────────────────────────────────┼────────────────┤
│ (=) LUCRO LÍQUIDO DO PERÍODO          │ - R$ 5.046,34  │
└───────────────────────────────────────┴────────────────┘
```
*(Nota: O valor negativo indica um investimento inicial em infraestrutura e estoques típicos do primeiro mês de funcionamento da PetGlow).*

---

### ➔ Passo 30.3 — Batimento de Fechamento de Caixa
- [ ] Acessar **Financeiro → Fechamento de Caixa** (`/financeiro/fechamento` — [financeiro/fechamento/page.tsx](file:///C:/Users/kauan.pereira/.gemini/antigravity/scratch/nexocommerce/src/app/(dashboard)/financeiro/fechamento/page.tsx)).
- [ ] **✅ VERIFICAR** se o fluxo de caixa acumulado líquido do caixa é exatamente **- R$ 2.766,90**:

```
┌────────────────────────────────────────────────────────┐
│               FLUXO DE CAIXA — JUNHO 2026              │
├───────────────────────────────────────┬────────────────┤
│ ENTRADAS TOTAIS                       │ R$ 3.453,00    │
│  ├── Dinheiro                         │ R$   365,00    │
│  ├── PIX                              │ R$ 2.495,00    │
│  └── Cartão de Crédito                │ R$   593,00    │
├───────────────────────────────────────┼────────────────┤
│ SAÍDAS TOTAIS (PAGAS)                 │ R$ 6.219,90    │
│  ├── Aluguel (Transferência)          │ R$ 4.500,00    │
│  ├── Energia (Boleto)                 │ R$   520,00    │
│  ├── Internet (Boleto)                │ R$   149,90    │
│  ├── Vacinas Zoetis (Boleto)          │ R$   780,00    │
│  ├── Taxa Coleta Lixo (PIX)           │ R$   220,00    │
│  └── Comissão Dr. Augusto (PIX)       │ R$    50,00    │
├───────────────────────────────────────┼────────────────┤
│ (=) SALDO LÍQUIDO DE CAIXA            │ - R$ 2.766,90  │
└───────────────────────────────────────┴────────────────┘
```
*(Obs: O fiado de Seu Manoel de R$ 249,00 em aberto, as despesas de Brindes de R$ 150,00 e o Pedido 1 Zoetis de R$ 380,00 estão pendentes, logo não impactaram as saídas de caixa deste mês).*
*(A despesa da Mesa de Cirurgia de R$ 850,00 foi corretamente excluída das saídas e das despesas do mês devido ao filtro de data futura, validando a atualização do dashboard).*

---

### ➔ Passo 30.4 — Batimento de Comissões Pendentes
- [ ] Acessar **Comissões** (`/comissoes`).
- [ ] **✅ VERIFICAR** se os valores pendentes e pagos batem exatamente com as contas:
  - **Dr. Augusto:** Total Pago: **R$ 50,00** | Pendente: **R$ 0,00**
  - **Clara Pet:** Total Pago: **R$ 0,00** | Pendente: **R$ 47,44** (Comissão Venda #0003 + Venda #0004)
