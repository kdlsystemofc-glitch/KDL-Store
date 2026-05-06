# NexoCommerce — Mapeamento Completo do Sistema (Parte 1)

**Cobre:** Auth, Dashboard, PDV, Vendas, Produtos, Estoque

---

## TELA: Login (`/login`)

**Objetivo:** Autenticar o lojista no sistema.

**Layout:** 2 colunas — painel verde à esquerda (branding) + formulário à direita.

**Elementos:**
- Painel esquerdo: logo NexoCommerce, tagline, 3 benefícios listados
- Formulário:
  - Campo: `E-mail` (tipo email, obrigatório)
  - Campo: `Senha` (tipo password + toggle ver/ocultar, obrigatório)
  - Botão: `Entrar` (primário, verde, ocupa 100% da largura)
  - Link: `Esqueceu a senha?`
  - Link: `Criar conta grátis` → `/cadastro`
- Validação: zod (email válido, senha mínimo 8 chars)
- Erro: faixa vermelha com mensagem do Supabase Auth
- Sucesso: redireciona para `/dashboard`

---

## TELA: Cadastro (`/cadastro`)

**Objetivo:** Criar conta nova + configurar loja.

**Layout:** Mesmo padrão do login (painel + formulário).

**Elementos:**
- Chips de benefícios: `✓ PDV ilimitado`, `✓ Estoque`, `✓ Garantias`, `✓ Suporte`
- Campo: `Nome da sua loja` (mínimo 3 chars)
- Campo: `Tipo de negócio` (select: Eletrônicos, Acessórios, Roupas, Alimentação, Papelaria, Geral, Outro)
- Campo: `E-mail`
- Campo: `Senha` + indicador de força (fraca/média/forte com 3 barras)
- Campo: `Confirmar senha`
- Checkbox: aceite de termos
- Botão: `Criar minha conta grátis` (primário)
- Link: `Entrar no sistema` → `/login`

**Indicador de senha:**
- 3 barras coloridas (vermelho/amarelo/verde)
- Checks: 8+ chars, letra maiúscula, número

---

## TELA: Dashboard (`/dashboard`)

**Objetivo:** Visão geral do dia + alertas urgentes + acesso rápido.

**Layout:** Sidebar fixa (220px) + área principal com conteúdo em grid.

### Alertas Inteligentes (topo da página)
Faixas coloridas com 1 botão de ação cada:
- `🚫 Vermelho` — produto zerado → ação: "Chamar fornecedor"
- `⚠️ Amarelo` — clientes sumidos há +60 dias → ação: "Ver lista"
- `⚠️ Amarelo` — produto crítico → ação: "Repor"
- `💰 Azul` — puxador com comissão a pagar → ação: "Ver comissões"

### KPIs (4 cards lado a lado)
| KPI | Cor | Link |
|---|---|---|
| Faturamento Hoje | Verde grande | `/relatorios` |
| Vendas Hoje | Preto | `/vendas` |
| Despesas (mês) | Vermelho | `/financeiro` |
| Lucro Líquido (mês) | Verde | `/financeiro` |

### Área principal (2 colunas)
**Coluna esquerda:**
1. Gráfico de barras — Faturamento 7 dias (barras verdes, sábado em destaque)
2. Tabela "Últimas Vendas" (últimas 5 vendas, colunas: #, hora, cliente, pagamento, total, status)
   - Status: `● Concluída` (verde) / `● Cancelada` (vermelho)

**Coluna direita:**
1. "Estoque Crítico" — lista cada produto zerado/crítico com botão "Ligar" (link WhatsApp do fornecedor)
2. "Acesso Rápido" — grid 2x3 de botões grandes: Nova Venda, Produto, Despesa, Fechar Caixa, Garantias, Sumidos

### Sidebar
- Logo NexoCommerce (N verde + nome)
- Botão NOVA VENDA (F2) — verde, sempre visível
- Grupos de navegação:
  - **PRINCIPAL:** Dashboard, Vendas, Produtos, Estoque
  - **CLIENTES & PARCEIROS:** Clientes, Sumidos ⚠, Fornecedores, Comissões
  - **OPERAÇÕES:** Garantias, Ordens de Serviço, Catálogo Online
  - **FINANCEIRO:** Visão Geral, Despesas, Fechamento
- Footer: Relatórios, Configurações, Sair da conta
- **Comportamento ativo:** exact match para rotas com filhos (`/clientes`, `/vendas`, `/financeiro`, `/produtos`) — evita double-highlight

---

## TELA: PDV — Nova Venda (`/vendas/nova`)

**Objetivo:** Registrar uma venda com rapidez máxima.

**Layout:** 2 colunas — busca + carrinho (esq) | cliente + pagamento + total (dir).

### Coluna Esquerda
**Busca de produto:**
- Campo de busca (nome, SKU ou código de barras)
- Ao digitar: lista de resultados com emoji + nome + preço
- Ao clicar no resultado: adiciona ao carrinho

**Carrinho:**
- Lista de itens com:
  - Emoji + nome do produto
  - Série (campo opcional para eletrônicos)
  - Quantidade (- / número / +)
  - Preço unitário (editável para desconto manual)
  - Toggle "🎁 Brinde" — quando ativado: preço vira R$ 0,00 e item aparece como BRINDE
  - Botão ✕ (remover item)
- Subtotais por item
- Campo: "Desconto geral" (R$ com motivo obrigatório)
- Estado vazio: ícone carrinho + "Busque um produto acima"

**Tabela de preços automática por cliente:**
- Varejo = preço normal
- Atacado = preço atacado (ativado quando tipo do cliente é "atacado" ou qtd >= mínimo definido)
- VIP = preço especial

### Coluna Direita
**Cliente (opcional):**
- Campo busca cliente (nome ou telefone)
- Botão "Anônimo" (venda sem cadastro)
- Botão "+ Novo" (cadastrar cliente rápido)
- Quando cliente selecionado: mostra nome + tipo (Varejo/Atacado/VIP)

**Puxador (opcional):**
- Campo: "Quem trouxe esse cliente?"
- Select dos puxadores cadastrados

**Forma de pagamento:**
- 5 botões grandes: PIX | Dinheiro | Crédito | Débito | Fiado
- Selecionado: borda verde + fundo verde-claro

**Resumo financeiro:**
- Subtotal
- Desconto (se houver)
- **TOTAL** (verde, fonte grande)
- Campo troco (aparece quando "Dinheiro" selecionado)

**Botão "FINALIZAR VENDA":**
- Cinza (desabilitado) quando carrinho vazio
- Verde (ativo) quando tem item + forma de pagamento

**Modal de confirmação:**
- Resumo da venda (total, forma pgto, cliente)
- Botão "Confirmar e Finalizar" → processa a venda
- Botão "Voltar"

**Tela de sucesso:**
- Ícone ✓ verde grande
- Número da venda (#XXXX)
- Botões: "Imprimir Recibo", "Enviar WhatsApp", "Nova Venda"

---

## TELA: Histórico de Vendas (`/vendas`)

**KPIs (4 cards):**
- Faturado Hoje (verde, bordinha esquerda verde)
- Vendas Hoje
- Ticket Médio
- Canceladas (vermelho)

**Filtros:** busca, período (Hoje/Semana/Mês), forma de pagamento, status

**Tabela (zebra stripes, header escuro):**
| Coluna | Tipo |
|---|---|
| # Venda | Monospace verde, link para recibo |
| Data | Texto cinza |
| Hora | Texto cinza-claro |
| Cliente | Negrito |
| Pagamento | Normal |
| Vendedor | Cinza |
| **Puxador** | Azul+negrito se houver, "—" se não |
| Total | Negrito verde direita |
| Status | `● Concluída` verde / `● Cancelada` vermelho |
| Ações | Ver (abre recibo) + Imprimir |

---

## TELA: Recibo de Venda (`/vendas/[id]`)

**Objetivo:** Documento de venda imprimível + enviável por WhatsApp.

**Ações (não imprimíveis):**
- Botão: `💬 Enviar por WhatsApp` (abre chat com cliente)
- Botão: `🖨 Imprimir` (window.print())

**Conteúdo do recibo (fonte monospace):**
1. Cabeçalho: nome da loja, endereço, telefone
2. "RECIBO DE VENDA" + número (#XXXX) + data/hora
3. Dados do cliente (nome, CPF, telefone)
4. Tabela de itens:
   - Nome do produto
   - Nº de série (se houver)
   - 🛡 Garantia: X dias (se houver)
   - 🎁 BRINDE (se item brinde)
   - Qtd / Valor
5. Totais (subtotal, desconto, TOTAL, forma de pagamento, troco)
6. Indicado por (puxador, se houver)
7. Rodapé: "Emitido via NexoCommerce · verificar em nexocommerce.app/verificar/XXXX"

**Seção separada — Termos de Garantia:**
- Card verde com termos por produto
- Inclui nº de série e data de início

---

## TELA: Produtos (`/produtos`)

**KPIs:** (não tem KPIs — só o subtítulo mostra criticos)

**Alerta:** `⚠️ X produto(s) com estoque abaixo do mínimo` (faixa amarela)

**Filtros:** busca, categoria, status

**Tabela:**
| Coluna | Tipo |
|---|---|
| Produto | Emoji + nome negrito |
| SKU | Monospace cinza |
| Categoria | Azul |
| Custo | Cinza |
| Venda | Verde negrito |
| Margem | Verde/azul/amarelo (plain text, %) |
| Estoque | Número colorido + "/ mín.X" |
| Status | `✕ Sem estoque` (vm) / `▼ Crítico` (am) / `✓ Normal` (vd) |
| Ações | Editar + Excluir |

**Botões:** Exportar + Novo Produto

---

## TELA: Novo Produto (`/produtos/novo`)

**Seções com cabeçalho escuro:**

**1. Identificação:**
- Nome do produto (texto, obrigatório)
- SKU (gerado automaticamente + botão ↺ regerar)
- Código de barras (opcional)
- Categoria (select)
- Descrição (textarea, opcional)

**2. Preços:**
- Preço de Custo (R$)
- Preço de Venda — Varejo (R$)
- Preço de Venda — Atacado (R$, ativado por qtd ou tipo de cliente)
- Preço de Venda — VIP (R$)
- Preço Mínimo (limite de desconto no PDV)
- Margem de lucro — calculada automaticamente (verde/amarelo/vermelho)

**3. Estoque:**
- Quantidade inicial
- Estoque mínimo (alerta abaixo deste valor)
- Estoque máximo
- Localização (ex: "Prateleira A3")
- Toggle: "Rastrear número de série" (habilita campo de série no PDV)

**4. Garantia (toggle on/off):**
- Prazo em dias
- Texto dos termos

**Ações:** Cancelar | Salvar e criar outro | Salvar produto

---

## TELA: Estoque (`/estoque`)

**KPIs (4 cards):**
- Zerados (vermelho)
- Críticos (amarelo)
- Normais (verde)
- Valor total em estoque (custo × quantidade)

**Filtros:** busca + status

**Tabela:**
| Coluna | Tipo |
|---|---|
| Produto | Emoji + nome |
| SKU | Monospace |
| Localização | Cinza |
| Atual | Número grande colorido |
| Mínimo | Cinza |
| Máximo | Cinza |
| Nível | Barra de progresso colorida + % |
| Status | Plain text colorido |
| Ações | + Entrada / - Saída |
