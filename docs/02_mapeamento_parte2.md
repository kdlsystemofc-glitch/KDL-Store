# NexoCommerce — Mapeamento Completo do Sistema (Parte 2)

**Cobre:** Clientes, Fornecedores, Garantias, OS, Puxadores, CRM Sumição, Financeiro (DRE), Catálogo, Configurações, Relatórios

---

## TELA: Clientes (`/clientes`)

**KPIs (4 cards):**
- Total de clientes
- Faturado Total (verde)
- Ticket Médio
- Sumidos +30 dias (vermelho) → link para `/clientes/inativos`

**Botões:** `⚠ Sumidos (N)` + `+ Novo Cliente` → `/clientes/novo`

**Filtros:** busca (nome/telefone) + tipo (Varejo/Atacado/VIP)

**Tabela:**
| Coluna | Tipo |
|---|---|
| Cliente | Negrito |
| Telefone | Cinza |
| Tipo | `⭐ VIP` (verde) / `📦 Atacado` (azul) / `🏪 Varejo` (cinza) |
| Compras | Número |
| Total Gasto | Verde monospace |
| Última Compra | Cinza |
| Atividade | `● Ativo` (vd) / `● Xd sem comprar` (am se +30d, vm se +60d) |
| Ações | + Venda (verde) + 💬 WhatsApp |

**Tipos de cliente:**
- **Varejo:** preço tabela normal
- **Atacado:** preço atacado automático em todo PDV
- **VIP:** preço especial + tratamento diferenciado

---

## TELA: Novo Cliente (`/clientes/novo`)

**Campos:**
- Nome completo (obrigatório)
- Telefone/WhatsApp (obrigatório)
- CPF (opcional)
- E-mail (opcional)
- Endereço (opcional)
- Anotações (textarea, opcional)

**Tipo de cliente (toggle visual 3 botões):**
- 🏪 Varejo → preço normal
- 📦 Atacado → preço atacado
- ⭐ VIP → preço especial

**Ações:** Cancelar | Salvar cliente

---

## TELA: Clientes Sumidos / CRM de Sumição (`/clientes/inativos`)

**Objetivo:** Recuperar clientes que pararam de comprar.

**Alerta educativo:** "Recuperar um cliente antigo custa 5x menos que conquistar um novo."

**KPIs (4 cards):**
- 🟡 Mornos (30–60 dias) → "Mandar mensagem leve"
- 🟠 Frios (60–90 dias) → "Ofereça algo especial"
- 🔴 Perdidos (90+ dias) → "Ação urgente!"
- Ticket Médio dos Sumidos (potencial de recuperação)

**Tabela:**
| Coluna | Tipo |
|---|---|
| Cliente | Negrito |
| Telefone | Cinza |
| Última Compra | Data |
| Dias Parado | Número colorido GRANDE (cor = temperatura) |
| Total Gasto | Verde monospace |
| Compras | Número |
| Temperatura | `🟡 Morno` / `🟠 Frio` / `🔴 Perdido` |
| Ação | `💬 Chamar no WhatsApp` (verde WhatsApp, abre chat com mensagem pré-pronta) |

**Mensagens pré-prontas por temperatura:**
- Morno: "Olá [Nome]! Faz um tempo que não te vejo. Tenho novidades que você vai gostar..."
- Frio: "Olá [Nome]! Tô com novidades e lembrei de você. Vem dar uma olhada!"
- Perdido: "Olá [Nome]! Faz um tempo que não te vejo por aqui..."

**Card inferior:** Exibe as 3 mensagens pré-prontas com preview de texto.

---

## TELA: Fornecedores (`/fornecedores`)

**Botão:** `+ Novo Fornecedor` → `/fornecedores/novo`

**Filtros:** busca + categoria

**Tabela:**
| Coluna | Tipo |
|---|---|
| Fornecedor | Negrito |
| Contato | Nome do responsável |
| Telefone | (XX) XXXXX-XXXX |
| Categoria | Tag azul |
| Cidade | Cinza |
| Prazo Entrega | Negrito (24h/48h/72h) |
| Pedido Mínimo | R$ X |
| Status | `● Ativo` (verde) / `● Inativo` (cinza) |
| Ações | `💬 WhatsApp` (verde) + `✏` (editar) |

---

## TELA: Novo Fornecedor (`/fornecedores/novo`)

**Campos:**
- Nome da empresa (obrigatório)
- Nome do contato
- Telefone/WhatsApp (obrigatório)
- Categoria de produtos (select)
- Cidade
- Prazo de entrega (select: 24h/48h/72h/1 semana)
- Pedido mínimo (R$)
- Anotações (opcional)

**Ações:** Cancelar | Salvar fornecedor

---

## TELA: Garantias (`/garantias`)

**KPIs (3 cards):**
- Ativas (verde)
- Vencendo em 30 dias (amarelo)
- Vencidas (vermelho)

**Alerta:** Faixa amarela se houver garantias vencendo em 30 dias.

**Filtros:** busca + status

**Tabela:**
| Coluna | Tipo |
|---|---|
| # Garantia | Monospace verde (ex: #0001) |
| Produto | Negrito |
| Cliente | Cinza |
| Nº Série | Monospace pequeno cinza |
| Início | Data |
| Vencimento | Data |
| Dias Restantes | Número grande (verde se ok, amarelo se <30d, "—" se vencido) |
| Status | `● Ativa` (verde) / `● Vencida` (vermelho) |
| Ações | 🖨 Imprimir (link `/garantias/[id]`) + 💬 WhatsApp |

---

## TELA: Certificado de Garantia (`/garantias/[id]`)

**Objetivo:** Documento oficial de garantia imprimível.

**Ações (não imprimíveis):**
- `💬 WhatsApp` — envia mensagem pré-pronta ao cliente
- `🖨 Imprimir` — `window.print()` (oculta navbar)

**Alertas (não imprimíveis):**
- Faixa amarela se vence em ≤30 dias
- Faixa vermelha se já vencida

**Conteúdo do certificado:**
1. Cabeçalho: "🛡️ CERTIFICADO DE GARANTIA" + nome + endereço + telefone da loja
2. Card verde: produto + nº de série
3. Card cinza: proprietário (nome, CPF, telefone)
4. Grid 3 colunas: Data da Compra | Validade até | Prazo (dias)
5. Banner status: `✓ GARANTIA ATIVA — X dias restantes` (verde) ou `✕ GARANTIA VENCIDA` (vermelho)
6. Termos e Condições (texto livre)
7. Rodapé com 2 campos de assinatura: Vendedor | Cliente
8. Link de verificação: `nexocommerce.app/garantia/XXXX`

---

## TELA: Ordens de Serviço (`/ordens-de-servico`)

**KPIs (3 cards):**
- Em Aberto (amarelo)
- Concluídas (verde)
- Faturado em OS (verde)

**Filtros:** busca + status

**Botão:** `+ Nova OS` → `/ordens-de-servico/nova`

**Tabela:**
| Coluna | Tipo |
|---|---|
| # OS | Monospace verde |
| Cliente | Negrito |
| Serviço | Cinza (truncado) |
| Técnico | Cinza |
| Abertura | Data cinza |
| Previsão | Data negrito |
| Valor | Verde monospace |
| Status | `● Aberta` (azul) / `● Em andamento` (amarelo) / `● Concluída` (verde) |
| Ações | Ver OS + ✓ Concluir (se não concluída) |

---

## TELA: Nova Ordem de Serviço (`/ordens-de-servico/nova`)

**Seção: Cliente e Equipamento**
- Cliente (busca por nome ou telefone)
- Técnico responsável
- Descrição do serviço (obrigatório)
- Equipamento/produto
- Defeito relatado pelo cliente (textarea)

**Seção: Valores e Prazo**
- Valor do serviço (R$)
- Previsão de entrega (date picker)
- Status inicial (Aberta / Em andamento)
- Observações internas (textarea)

**Ações:** Cancelar | Abrir OS


**KPIs (3 cards):**
- Em Aberto (amarelo)
- Concluídas (verde)
- Faturado em OS (verde)

**Filtros:** busca + status

**Tabela:**
| Coluna | Tipo |
|---|---|
| # OS | Monospace verde |
| Cliente | Negrito |
| Serviço | Cinza (truncado) |
| Técnico | Cinza |
| Abertura | Data cinza |
| Previsão | Data negrito |
| Valor | Verde monospace |
| Status | `● Aberta` (azul) / `● Em andamento` (amarelo) / `● Concluída` (verde) |
| Ações | Ver OS + ✓ Concluir (se não concluída) |

---

## TELA: Comissões / Comissionados (`/comissoes`)

> **Renomeado:** anteriormente chamado de "Puxadores". Sidebar e rota atualizadas.

**Objetivo:** Gerenciar comissões de pessoas que indicam clientes para a loja.

**Botão:** `+ Cadastrar Comissionado` → abre **modal inline** (sem navegar para outra página)

**Modal de cadastro:**
- Nome (obrigatório)
- Telefone/WhatsApp (obrigatório)
- Tipo: `% Percentual` | `R$ Fixo/venda` (toggle visual)
- Taxa (% ou R$)
- Botões: Cancelar | Salvar

**Alerta educativo:** Explica o conceito de comissionado.

**KPIs (4 cards):**
- Ativos
- Vendas via Comissão (mês)
- A Pagar este Mês (vermelho)
- Já Pago este Mês (azul)

**Tabela:**
| Coluna | Tipo |
|---|---|
| Comissionado | Negrito |
| Telefone | Cinza |
| Tipo Comissão | `● Percentual` (azul) / `● Valor Fixo` (cinza) |
| Taxa | % ou R$/venda |
| Vendas (mês) | Número |
| Valor Vendas | Verde monospace |
| Comissão a Pagar | Vermelho (negrito) se pendente, cinza se pago |
| Situação | `● Pago` (verde) / `● Pendente` (vermelho) |
| Ações | 💬 WhatsApp + ✓ Marcar Pago (funcional, atualiza estado) |

**Card inferior — Ranking do Mês:**
- 🥇🥈🥉 ordenado por valor de vendas

---

## TELA: Financeiro — Visão Geral / DRE (`/financeiro`)

**Objetivo:** Mostrar P&L (Lucro e Prejuízo) de forma simples.

**Botões:** `+ Lançar Despesa` + `🔒 Fechar Período`

**Seletor de período:** Hoje | Semana | Quinzena | Mês | Ano

**DRE do período atual (coluna esquerda):**
| Linha | Valor | Cor |
|---|---|---|
| Receita Total de Vendas | R$ XX.XXX | Verde |
| (-) Custo das Mercadorias (CMV) | R$ XX.XXX | Vermelho |
| = Lucro Bruto | R$ XX.XXX | Verde negrito |
| (-) Despesas Operacionais | R$ XX.XXX | Vermelho |
| **= Lucro Líquido** | **R$ XX.XXX** | **Verde grande (destaque)** |
| Margem de Lucro | XX.X% | Verde/vermelho |

**Despesas por Categoria (coluna direita):**
- Lista com nome, tipo (Fixa=azul / Variável=amarelo), valor
- Total no rodapé

**Gráfico Histórico (6 meses):**
- Barras verticais agrupadas: Receita (verde) + Despesa (vermelho) + Lucro (azul)
- Meses nos eixos

---

## TELA: Despesas (`/financeiro/despesas`)

**Objetivo:** Lançar e visualizar despesas.

**Botão:** `+ Lançar Despesa` → abre formulário inline

**Formulário inline:**
- Descrição (campo texto, obrigatório)
- Categoria (select: Aluguel | Funcionários | Energia/Internet | Compras | Comissões | Outros)
- Tipo (select: Fixa | Variável)
- Valor (R$, número)
- Data
- Checkbox: "Despesa recorrente (se repete todo mês)"
- Botões: Cancelar | Salvar Despesa

**KPIs (3 cards):**
- Total Mês (vermelho)
- Despesas Fixas (azul)
- Despesas Variáveis (amarelo)

**Tabela:**
| Coluna | Tipo |
|---|---|
| Descrição | Negrito |
| Categoria | Normal |
| Tipo | `● Fixa` (azul) / `● Variável` (amarelo) |
| Data | Cinza |
| Recorrente | `● Sim` (verde) / `— Não` (cinza) |
| Valor | Vermelho monospace |
| Ação | Excluir (vermelho) |

**Rodapé da tabela:** TOTAL DO PERÍODO em destaque.

---

## TELA: Fechamento de Caixa (`/financeiro/fechamento`)

**Objetivo:** Conferir o caixa físico vs. sistema e fechar o período.

**Seletor de período:** Diário | Quinzenal | Mensal | Anual

**Cabeçalho do período:** barra escura com nome do período + status (ABERTO/FECHADO)

**Tabela Entradas por Forma de Pagamento:**
- PIX, Dinheiro, Crédito, Débito
- Valor esperado + % do total

**Conferência Final:**
- Total de Entradas
- (-) Saídas/Sangria
- = Saldo Esperado em Caixa
- Campo: "Saldo físico contado (R$)" → input manual
- Diferença calculada automaticamente → alerta: OK / Sobra / Falta

**Botões:** 🖨 Imprimir Relatório | 🔒 Fechar Dia/Mês/etc.

**Histórico de Fechamentos:**
- Tabela com data, período, entradas, saídas, saldo, diferença (OK/valor)

---

## TELA: Catálogo Online (`/catalogo`)

**Objetivo:** Configurar vitrine digital compartilhável via QR Code.

**Botão:** `↗ Ver Catálogo Público`

**Card de URL e QR Code:**
- Link do catálogo: `https://nexocommerce.app/catalogo/[slug-da-loja]`
- Botão: 📋 Copiar
- QR Code visual (simulado com grid de pixels)
- Botões: 💬 Compartilhar no WhatsApp + 🖨 Imprimir QR Code

**Prévia — Como os clientes veem:**
- Header verde com nome + cidade + telefone
- Grid de produtos com emoji + nome + categoria + preço
- Badge "DESTAQUE" em amarelo (quando marcado)
- Rodapé: "Gostou? Mande mensagem via WhatsApp"

**Tabela de Controle:**
| Coluna | Tipo |
|---|---|
| Produto | Emoji + nome |
| Categoria | Normal |
| Preço | Verde monospace |
| Visível | `● Visível` (verde) / `○ Oculto` (cinza) |
| Destaque | `★ Sim` (amarelo) / `—` |
| Ação | Ocultar/Mostrar |

---

## TELA: Configurações (`/configuracoes`)

**Card do Plano (banner verde):**
- Crown dourado + "PLANO ATUAL"
- Nome do plano (ex: Essencial)
- Data de renovação + preço
- Lista de recursos incluídos (checkmarks)
- Botão: `👑 Upgrade` (branco)

**Lista de seções (clicáveis):**
- 🏪 Dados da Empresa → `/configuracoes/empresa`
- 👥 Usuários e Acessos → `/configuracoes/usuarios`
- 💳 Formas de Pagamento → `/configuracoes/pagamentos`
- 🏷️ Categorias de Produtos → `/configuracoes/categorias`
- 🌐 Catálogo Online → `/catalogo`

**Zona de Perigo:**
- Card com borda vermelha
- Botões: "🗑 Limpar dados de teste" + "✕ Encerrar conta"

**Rodapé:** "NexoCommerce v1.0.0 · Feito para o pequeno comércio brasileiro 🇧🇷"

---

## TELA: Relatórios (`/relatorios`)

**Objetivo:** Análise de performance de vendas.

**Filtros:** período

**KPIs:**
- Faturamento Total
- Total de Vendas
- Ticket Médio
- Margem Média

**Gráfico de Barras:** Faturamento diário do período selecionado

**Análise por Forma de Pagamento:**
- Barras horizontais coloridas (PIX/Dinheiro/Crédito/Débito)
- % e valor de cada

**Top Produtos:**
- 🥇🥈🥉 medals + nome + qtd vendida + faturamento

---

## FLUXO COMPLETO: Ciclo de Vida de uma Venda

```
1. CLIENTE ENTRA NA LOJA
   └→ Puxador trouxe? → Registrar no PDV

2. PDV (/vendas/nova)
   ├→ Buscar produto
   ├→ Adicionar ao carrinho
   ├→ Brinde? Toggle ON → preço = R$ 0
   ├→ Tipo de cliente → preço automático (varejo/atacado/VIP)
   ├→ Selecionar forma de pagamento
   └→ Confirmar venda

3. PÓS-VENDA AUTOMÁTICO
   ├→ Recibo gerado (/vendas/[id])
   ├→ Estoque decrementado automaticamente
   ├→ Garantia registrada (se produto tem garantia)
   ├→ Comissão do puxador calculada
   └→ CMV atualizado no DRE

4. CRM
   ├→ Cliente não compra em 30d → aparece como "Morno"
   ├→ 60d → "Frio"
   ├→ 90d → "Perdido" + alerta no dashboard
   └→ Lojista manda WhatsApp 1-clique

5. FINANCEIRO
   ├→ Receita somada ao DRE automaticamente
   ├→ Lojista lança despesas manualmente
   └→ Fecha caixa (conferência física vs. sistema)
```

---

## SEGURANÇA E MULTI-TENANCY

- Cada empresa tem `empresa_id` único no Supabase
- RLS (Row Level Security) garante isolamento total entre empresas
- `middleware.ts` verifica sessão antes de liberar rotas `/dashboard/*`
- Usuários dentro da mesma empresa compartilham dados
- Senhas gerenciadas pelo Supabase Auth (bcrypt)
- NUNCA armazenar senhas no banco direto

---

## ROTAS COMPLETAS DO SISTEMA

| Rota | Descrição |
|---|---|
| `/login` | Autenticação |
| `/cadastro` | Novo usuário/empresa |
| `/dashboard` | Painel principal |
| `/vendas` | Histórico de vendas |
| `/vendas/nova` | PDV (atacado/varejo/VIP + brindes) |
| `/vendas/[id]` | Recibo imprimível |
| `/produtos` | Lista de produtos |
| `/produtos/novo` | Formulário de novo produto (3 tabelas de preço) |
| `/produtos/[id]/editar` | Editar produto |
| `/estoque` | Controle de estoque |
| `/clientes` | Lista de clientes |
| `/clientes/novo` | Formulário de novo cliente |
| `/clientes/inativos` | CRM de Sumição |
| `/fornecedores` | Lista de fornecedores |
| `/fornecedores/novo` | Formulário de novo fornecedor |
| `/garantias` | Lista de garantias |
| `/garantias/[id]` | Certificado de Garantia imprimível |
| `/ordens-de-servico` | Ordens de serviço |
| `/ordens-de-servico/nova` | Nova OS |
| `/comissoes` | Gestão de comissionados (ex-Puxadores) |
| `/catalogo` | Catálogo online + QR Code |
| `/financeiro` | DRE / Visão geral |
| `/financeiro/despesas` | Lançar despesas |
| `/financeiro/fechamento` | Fechamento de caixa |
| `/relatorios` | Relatórios |
| `/configuracoes` | Configurações gerais |
