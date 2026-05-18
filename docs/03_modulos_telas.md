# SEÇÃO 3 — MÓDULOS E TELAS

## 3.1 Sidebar — Navegação Principal

A sidebar é renderizada no `(dashboard)/layout.tsx` e **filtrada por plano**:

| Item | Rota | Start | Pro |
|---|---|---|---|
| Dashboard | `/dashboard` | ✅ | ✅ |
| Histórico de Vendas | `/vendas` | ✅ | ✅ |
| Produtos / Estoque | `/produtos` | ✅ | ✅ |
| Clientes | `/clientes` | ✅ | ✅ |
| Ops Extras | `/garantias` | ✅ | ✅ |
| Configurações | `/configuracoes` | ✅ | ✅ |
| Financeiro | `/financeiro` | ❌ | ✅ |
| Relatórios | `/relatorios` | ❌ | ✅ |

> Módulos Pro **não aparecem** na sidebar para usuários Start. Não são exibidos nem bloqueados — ficam completamente ocultos.

---

## 3.2 MÓDULO: Dashboard (`/dashboard`)

**Objetivo**: Visão geral operacional da loja no dia.

**Acesso**: Start + Pro (com diferenças)

### KPIs Operacionais (todos os planos)
| Card | Dado | Fonte |
|---|---|---|
| Estoque Crítico | Produtos com `qtd_atual <= qtd_minima` | tabela `produtos` |
| Fiado em Aberto | Soma de `valor_aberto` com `status='aberto'` | tabela `fiados` |
| Despesas do Mês | Soma de `valor` no mês corrente | tabela `despesas` |
| Clientes Sumidos | Clientes sem compra além do prazo CRM | tabela `clientes` |

### Gráfico de Barras (todos os planos)
- Vendas dos últimos 7 dias agrupadas por dia
- Fonte: `vendas` com `status='concluida'`

### Painel "Como foi?" [PRO APENAS]
- Exibido somente para `plano === 'pro'`
- Coleta NPS pós-venda dos clientes
- Fonte: `ComoFoiPainel` component

### Acesso Rápido
| Botão | Start | Pro |
|---|---|---|
| + Nova Venda | ✅ | ✅ |
| Ver Fiado | ❌ | ✅ |
| Lançar Despesa | ❌ | ✅ |
| Fechar Caixa | ❌ | ✅ |

### Alertas Automáticos
- **Estoque Crítico**: banner vermelho se `produtosCriticos > 0`
- **Fiado em Aberto**: banner amarelo se `fiadoAberto > 0`

---

## 3.3 MÓDULO: PDV — Frente de Caixa (`/vendas/nova`)

**Objetivo**: Registrar vendas em tempo real (ponto de venda).

**Acesso**: Start + Pro

### Layout
```
[HEADER: PDV — FRENTE DE CAIXA]
┌──────────────────────┬──────────────────┐
│  Busca + Carrinho    │  Painel direito  │
│                      │                  │
│  [Campo busca]       │  Tabela preço    │
│  [Lista resultados]  │  [Varejo][Atacado][VIP] │
│                      │  Cliente         │
│  [Carrinho]          │  Pagamento       │
│  - item 1            │  [PIX][Dinheiro] │
│  - item 2            │  [Crédito][Débito][Fiado] │
│                      │                  │
│  [Campo desconto]    │  [RESUMO]        │
│                      │  Subtotal:       │
│                      │  Desconto:       │
│                      │  TOTAL:          │
│                      │  [FINALIZAR]     │
└──────────────────────┴──────────────────┘
```

### Fluxo de Venda

```
1. Buscar produto (nome, SKU ou EAN)
   ↓ Enter com 1 resultado → adiciona automaticamente
   ↓ Câmera → lê código de barras (se dispositivo tem câmera)
2. Ajustar quantidade (− / +)
3. Editar preço unitário (campo editável, alerta se < preço mínimo)
4. Marcar como brinde (zera preço, não desconta estoque "normal")
5. Selecionar tabela de preço: Varejo / Atacado / VIP
6. Informar cliente (obrigatório se pagamento = Fiado)
7. Selecionar forma de pagamento
8. Se Dinheiro: calcular troco
9. Aplicar desconto (campo R$)
10. Clicar "FINALIZAR VENDA"
```

### Ações ao Finalizar
1. Insere registro em `vendas`
2. Insere itens em `itens_venda`
3. Atualiza `qtd_atual` em `produtos` (decrementa)
4. Registra em `estoque_movimentacoes` (tipo: `venda` ou `brinde`)
5. Se pagamento = Fiado → insere em `fiados`
6. Para produtos com garantia → insere em `garantias`
7. Exibe tela de sucesso com número do recibo

### Validações
- Bloqueia finalizar se carrinho vazio
- Bloqueia finalizar se forma de pagamento não selecionada
- Bloqueia Fiado se cliente não informado
- Bloqueia Fiado se cliente já tem fiado em aberto (previne duplicata)
- Alerta visual se preço digitado < preço mínimo do produto

### Tela de Sucesso (fase='ok')
- Emoji ✅ + "Venda Concluída!"
- Número do recibo `#0001`
- Valor total
- Se Fiado: "Registrado no fiado de [cliente]"
- Botões: "Ver Recibo" | "+ Nova Venda"

---

## 3.4 MÓDULO: Histórico de Vendas (`/vendas`)

**Objetivo**: Consultar, filtrar e cancelar vendas realizadas.

**Acesso**: Start + Pro

### Funcionalidades
- Listagem paginada de vendas (mais recentes primeiro)
- Filtros: por data, por forma de pagamento, por status
- Busca por cliente ou número da venda
- Visualizar detalhes de cada venda
- Cancelar venda (muda `status` para `cancelada`, não exclui)

### Tela de Detalhe (`/vendas/[id]`)
- Recibo completo com itens, preços, desconto, total
- Forma de pagamento, cliente, data
- Botão "Cancelar Venda" (com campo de motivo)
- Lista de garantias geradas nessa venda

---

## 3.5 MÓDULO: Produtos / Estoque (`/produtos`)

**Objetivo**: Cadastrar e gerenciar produtos, preços e estoque.

**Acesso**: Start + Pro

### Abas via `PageTabs`
| Aba | Rota | Conteúdo |
|---|---|---|
| Produtos | `/produtos` | Lista de produtos |
| Estoque | `/estoque` | Movimentações de estoque |
| Catálogo | `/catalogo` | Catálogo online compartilhável |

### Dados do Produto
| Campo | Tipo | Obs |
|---|---|---|
| nome | TEXT | Obrigatório |
| SKU | TEXT | Código interno |
| EAN | TEXT | Código de barras |
| categoria | TEXT | Livre ou da lista de categorias |
| preco_custo | NUMERIC | Custo do produto |
| preco_varejo | NUMERIC | Preço padrão |
| preco_atacado | NUMERIC | Tabela atacado |
| preco_vip | NUMERIC | Tabela VIP |
| preco_minimo | NUMERIC | Alerta no PDV se vender abaixo |
| preco_catalogo | NUMERIC | Preço exibido no catálogo |
| qtd_atual | NUMERIC | Estoque atual |
| qtd_minima | NUMERIC | Estoque mínimo (alerta) |
| tem_garantia | BOOLEAN | Gera garantia ao vender |
| dias_garantia | INT | Duração em dias |
| texto_garantia | TEXT | Texto do certificado |
| ativo_catalogo | BOOLEAN | Exibir no catálogo |
| destaque | BOOLEAN | Destaque no catálogo |

### Ações na Lista
- Editar produto
- Excluir produto
- Ativar/desativar do catálogo (toggle)
- Marcar como destaque (toggle)
- Editar preço do catálogo inline

### Estoque (`/estoque`)
- Histórico de movimentações (entradas, saídas, ajustes, brindes)
- Ajuste manual de estoque com observação
- Tipos: `entrada`, `saida`, `ajuste`, `brinde`, `devolucao`, `venda`

---

## 3.6 MÓDULO: Clientes (`/clientes`)

**Objetivo**: CRM básico de clientes da loja.

**Acesso**: Start + Pro

### Abas via `PageTabs`
| Aba | Rota | Plano |
|---|---|---|
| Todos os Clientes | `/clientes` | Start + Pro |
| Sumidos ⚠ | `/clientes/inativos` | Pro |
| Fornecedores | `/fornecedores` | Start + Pro |

### Dados do Cliente
| Campo | Obs |
|---|---|
| nome | Obrigatório |
| telefone | Para WhatsApp |
| email | Opcional |
| cpf | Opcional |
| endereco | Opcional |
| obs | Observações |
| ultima_compra | Atualizado automaticamente ao fechar venda |
| ativo | Soft-delete |

### Perfil do Cliente (`/clientes/[id]`)
- Dados cadastrais
- Histórico de compras (últimas 20 vendas)
- Fiados do cliente

### CRM Sumidos (`/clientes/inativos`) [PRO]
- Lista clientes sem compra há X dias (configurável por empresa)
- Categorias: 🟡 Atenção (morno) / 🟠 Sumido (frio) / 🔴 Perdido
- Botão "💬 Chamar no WhatsApp" com mensagem pré-pronta personalizada por temperatura
- KPIs: total por categoria + ticket médio potencial de recuperação

---

## 3.7 MÓDULO: Financeiro (`/financeiro`) [PRO]

**Objetivo**: Visão financeira completa da loja.

**Acesso**: Exclusivo Pro

### Abas via `PageTabs`
| Aba | Rota |
|---|---|
| DRE | `/financeiro` |
| Fiado | `/financeiro/fiado` |
| Despesas | `/financeiro/despesas` |
| Fechamento | `/financeiro/fechamento` |

### DRE (`/financeiro`)
- Receita Bruta: soma das vendas do mês
- Descontos: soma dos descontos do mês
- Receita Líquida: Bruta - Descontos
- Despesas: soma do mês
- Resultado: Receita Líquida - Despesas
- Gráfico de formas de pagamento

### Fiado (`/financeiro/fiado`) [PRO]
- Lista de fiados em aberto por cliente
- Total em aberto
- Botão "Marcar como Pago"
- Botão WhatsApp de cobrança
- Histórico de fiados pagos

### Despesas (`/financeiro/despesas`)
- Lançar despesas com categoria, tipo, valor e data
- Categorias: aluguel, fornecedor, energia, etc.
- Listagem com filtro por mês
- Excluir despesa

### Fechamento de Caixa (`/financeiro/fechamento`) [PRO]
- Resumo do dia: total vendido por forma de pagamento
- Total de descontos do dia
- Total de despesas do dia
- Resultado líquido do dia
- Exportação/impressão do relatório

---

## 3.8 MÓDULO: Ops Extras (`/garantias`)

**Objetivo**: Gestão de garantias e ordens de serviço.

**Acesso**: Start + Pro

### Abas via `PageTabs`
| Aba | Rota |
|---|---|
| Garantias | `/garantias` |
| Ordens de Serviço | `/ordens-de-servico` |
| Comissões | `/comissoes` [PRO] |

### Garantias
- Criadas automaticamente ao vender produto com `tem_garantia = true`
- Status: ativa / em_analise / em_devolucao / finalizada
- Detalhe da garantia com histórico
- Abrir devolução a partir da garantia

### Ordens de Serviço
- Registrar OS (cliente, produto, problema, valor)
- Status: aberto / em_andamento / concluido / cancelado
- Avançar status com botão

---

## 3.9 MÓDULO: Comissões (`/comissoes`) [PRO]

**Objetivo**: Gestão de comissionados (puxadores / indicadores).

**Acesso**: Exclusivo Pro — todo conteúdo bloqueado via `<ProOnly>`

### Sub-abas internas (botões, não PageTabs)
- **Comissionados**: lista, cadastro, ativar/inativar, excluir
- **Por Venda**: histórico de vendas comissionadas + ranking

### Dados do Comissionado
| Campo | Obs |
|---|---|
| nome | Obrigatório |
| telefone | WhatsApp |
| tipo_comissao | `percentual` ou `fixo` |
| taxa | % ou R$ por venda |
| status | ativo / inativo |

### Cálculo de Comissão
- `percentual`: `(venda.total * taxa) / 100`
- `fixo`: `taxa` por venda

### Ranking de Indicadores
- Agrupa vendas por `comissionado_id`
- Ordena por valor de comissão decrescente

---

## 3.10 MÓDULO: Relatórios (`/relatorios`) [PRO]

**Objetivo**: Relatórios analíticos profundos da loja.

**Acesso**: Exclusivo Pro

### Funcionalidades e Seções
- **Seletor de Período**: Essa semana, Esse mês, Mês anterior, Esse ano, Personalizado.
- **Resumo Financeiro (DRE Estimado)**: Faturamento bruto, Descontos, Total de Despesas, Lucro Estimado.
- **Formas de Pagamento**: Tabela com Qtd, Valor e % do total.
- **Produtos Mais Vendidos**: Top 10 com Qtd, Receita gerada e %.
- **Desempenho por Dia da Semana**: Gráfico de barras indicando os dias com maior faturamento.
- **Melhores Clientes**: Top 5 clientes por compras, com data da última compra.
- **Comissões do Período**: Tabela agrupando o valor a pagar por comissionado, baseada nas vendas.
- **Botões de Ação**: Exportação de dados em CSV e visualização para Impressão (com formatação limpa).

---

## 3.11 MÓDULO: Configurações (`/configuracoes`)

**Objetivo**: Personalizar a loja e gerenciar usuários.

**Acesso**: Start + Pro (Protegido inteiramente via `<AdminOnly>`. Operadores e Visualizadores não acessam)

### Sub-páginas
| Página | Rota | Conteúdo |
|---|---|---|
| Geral | `/configuracoes` | Overview das configurações, Status da Assinatura, Preferências CRM, Zona de Perigo (Cancelar Assinatura) |
| Empresa | `/configuracoes/empresa` | Nome, telefone, cidade, link do catálogo |
| Usuários | `/configuracoes/usuarios` | Listar, convidar, mudar papel, congelar |
| Pagamentos | `/configuracoes/pagamentos` | Formas de pagamento + taxas |
| Categorias | `/configuracoes/categorias` | Categorias de produtos |
| Planos | `/configuracoes/planos` | Ver plano atual, Upgrade e Portal de Faturamento |

### Gestão de Usuários
- Listar usuários da empresa
- Mudar papel: admin / operador / visualizador
- Congelar / descongelar usuário
- Excluir usuário (soft-delete via `status='excluido'`)
- Convidar novo usuário por email (token com validade de 7 dias)

### Zona de Perigo & Assinatura (Root Settings)
- **Cancelar Assinatura**: O usuário nunca "deleta sua conta" e os dados não são apagados em cascata. Ele é redirecionado para o portal do Stripe.
- Quando o Stripe envia o Webhook de cancelamento, a assinatura fica `cancelled` e o sistema bloqueia acessos dependentes do plano ativo.

---

## 3.12 MÓDULO: Fornecedores (`/fornecedores`)

**Objetivo**: Cadastro de fornecedores e pedidos de compra.

**Acesso**: Start + Pro (acessado pela aba Clientes)

### Funcionalidades
- Cadastrar/editar/excluir fornecedores
- Registrar pedidos de compra (status: rascunho → enviado → recebido)
- Ao receber pedido: atualiza estoque automaticamente

---

## 3.13 MÓDULO: Catálogo Online (`/catalogo`)

**Objetivo**: Catálogo de produtos compartilhável via link/QR Code.

**Acesso**: Start + Pro

### Funcionalidades
- Lista produtos com `ativo_catalogo = true`
- Produtos em destaque aparecem primeiro
- Exibe `preco_catalogo` (pode ser diferente do varejo)
- Link público sem autenticação
- QR Code gerado para compartilhar
