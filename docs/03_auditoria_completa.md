# NexoCommerce — Auditoria Completa de Telas, Botões e Conexões

> **Regra:** Este arquivo DEVE ser atualizado a cada mudança no código.
> **Última atualização:** 06/05/2026 v1.3.0 — 28 páginas auditadas

---

## MAPA DE ROTAS E STATUS

| Rota | Arquivo | Status |
|---|---|---|
| `/` | `app/page.tsx` | Redirect → `/dashboard` |
| `/login` | `(auth)/login/page.tsx` | ✅ Completo |
| `/cadastro` | `(auth)/cadastro/page.tsx` | ✅ Completo |
| `/dashboard` | `(dashboard)/dashboard/page.tsx` | ✅ Completo |
| `/vendas` | `(dashboard)/vendas/page.tsx` | ✅ Completo |
| `/vendas/nova` | `(dashboard)/vendas/nova/page.tsx` | ✅ Completo |
| `/vendas/[id]` | `(dashboard)/vendas/[id]/page.tsx` | ✅ Completo |
| `/produtos` | `(dashboard)/produtos/page.tsx` | ✅ Completo |
| `/produtos/novo` | `(dashboard)/produtos/novo/page.tsx` | ✅ Completo |
| `/estoque` | `(dashboard)/estoque/page.tsx` | ✅ Completo |
| `/clientes` | `(dashboard)/clientes/page.tsx` | ✅ Completo |
| `/clientes/novo` | `(dashboard)/clientes/novo/page.tsx` | ✅ Completo |
| `/clientes/inativos` | `(dashboard)/clientes/inativos/page.tsx` | ✅ Completo |
| `/fornecedores` | `(dashboard)/fornecedores/page.tsx` | ✅ Completo |
| `/fornecedores/novo` | `(dashboard)/fornecedores/novo/page.tsx` | ✅ Completo |
| `/garantias` | `(dashboard)/garantias/page.tsx` | ✅ Completo |
| `/garantias/[id]` | `(dashboard)/garantias/[id]/page.tsx` | ✅ Completo |
| `/ordens-de-servico` | `(dashboard)/ordens-de-servico/page.tsx` | ✅ Completo |
| `/ordens-de-servico/nova` | `(dashboard)/ordens-de-servico/nova/page.tsx` | ✅ Completo |
| `/comissoes` | `(dashboard)/comissoes/page.tsx` | ✅ Completo |
| `/puxadores` | `(dashboard)/puxadores/page.tsx` | Redirect → `/comissoes` |
| `/catalogo` | `(dashboard)/catalogo/page.tsx` | ✅ Completo |
| `/financeiro` | `(dashboard)/financeiro/page.tsx` | ✅ Completo |
| `/financeiro/fiado` | `(dashboard)/financeiro/fiado/page.tsx` | ✅ Completo |
| `/financeiro/despesas` | `(dashboard)/financeiro/despesas/page.tsx` | ✅ Completo |
| `/financeiro/fechamento` | `(dashboard)/financeiro/fechamento/page.tsx` | ✅ Completo |
| `/relatorios` | `(dashboard)/relatorios/page.tsx` | ✅ Completo |
| `/configuracoes` | `(dashboard)/configuracoes/page.tsx` | ✅ Completo |
| `/produtos/[id]/editar` | — | TODO |

---

## SIDEBAR — TODOS OS LINKS

| Label | Rota | Lógica ativo |
|---|---|---|
| NOVA VENDA (F2) | `/vendas/nova` | Sempre visível |
| Dashboard | `/dashboard` | exact match |
| Vendas | `/vendas` | exact match |
| Produtos | `/produtos` | exact match |
| Estoque | `/estoque` | startsWith |
| Clientes | `/clientes` | exact match |
| Sumidos ⚠ | `/clientes/inativos` | startsWith |
| Fornecedores | `/fornecedores` | startsWith |
| Comissões | `/comissoes` | startsWith |
| Garantias | `/garantias` | startsWith |
| Ordens de Serviço | `/ordens-de-servico` | startsWith |
| Catálogo Online | `/catalogo` | startsWith |
| Visão Geral | `/financeiro` | exact match |
| Fiado 📒 | `/financeiro/fiado` | startsWith |
| Despesas | `/financeiro/despesas` | startsWith |
| Fechamento | `/financeiro/fechamento` | startsWith |
| Relatórios | `/relatorios` | startsWith |
| Configurações | `/configuracoes` | startsWith |

---

## BOTÕES E CONEXÕES POR TELA

### `/login`
| Elemento | Ação / Destino |
|---|---|
| Btn `Entrar` | Supabase Auth → `/dashboard` |
| Link `Criar conta grátis` | → `/cadastro` |
| Link `Esqueceu a senha?` | TODO |

### `/cadastro`
| Elemento | Ação / Destino |
|---|---|
| Btn `Criar minha conta grátis` | Supabase Auth → `/dashboard` |
| Link `Entrar` | → `/login` |

### `/dashboard`
| Elemento | Ação / Destino |
|---|---|
| Alerta estoque zerado | Btn → `/estoque` |
| Alerta clientes sumidos | Btn → `/clientes/inativos` |
| Alerta comissão pendente | Btn → `/comissoes` |
| KPI Faturamento Hoje | → `/relatorios` |
| KPI Vendas Hoje | → `/vendas` |
| KPI Despesas | → `/financeiro` |
| KPI Lucro Líquido | → `/financeiro` |
| Últimas Vendas (linha) | → `/vendas/[id]` |
| Estoque Crítico — Ligar | WhatsApp do fornecedor |
| Acesso Rápido: Nova Venda | → `/vendas/nova` |
| Acesso Rápido: Produto | → `/produtos/novo` |
| Acesso Rápido: Despesa | → `/financeiro/despesas` |
| Acesso Rápido: Fechar Caixa | → `/financeiro/fechamento` |
| Acesso Rápido: Garantias | → `/garantias` |
| Acesso Rápido: Sumidos | → `/clientes/inativos` |

### `/vendas/nova` (PDV)
| Elemento | Ação / Destino |
|---|---|
| Banner onboarding (1ª vez) | Mostra ao abrir, fecha c/ X, salva `localStorage.pdv_onboarding` |
| Busca produto: resultado vazio | Aparece botão "📦 Pedir ao Fornecedor" |
| Btn "📦 Pedir ao Fornecedor" | Abre modal inline (produto pré-preenchido) |
| Modal: select Fornecedor | Lista fornecedores cadastrados |
| Modal: Btn "💬 Abrir WhatsApp" | Monta msg + salva em `localStorage.pedidosPendentes` |
| Toggle Brinde ON | Preço → R$0, exibe custo real do brinde |
| Tipo cliente Varejo/Atacado/VIP | Atualiza preços do carrinho |
| Campo Comissionado | Registra indicação |
| Pgto = Fiado | Campo cliente torna-se **obrigatório** + borda vermelha + aviso |
| Btn "Anônimo" | Desabilitado quando Fiado selecionado |
| Btn "📒 REGISTRAR NO FIADO" | Salva em `localStorage.fiadosAbertos` + finaliza venda |
| Btns PIX/Dinheiro/Crédito/Débito/Fiado | Seleciona forma pgto |
| Btn FINALIZAR VENDA | Processa → tela sucesso |
| Sucesso: Btn Ver Recibo | → `/vendas/[id]` |
| Sucesso: Btn Nova Venda | Reset do PDV |

### `/vendas/[id]` (Recibo)
| Elemento | Ação / Destino |
|---|---|
| Btn ← Voltar | → `/vendas` |
| Btn 💬 WhatsApp | `wa.me/55{tel}?text={msg}` |
| Btn 🖨 Imprimir | `window.print()` |

### `/produtos`
| Elemento | Ação / Destino |
|---|---|
| Btn `+ Novo Produto` | → `/produtos/novo` |
| Alerta crítico | → `/estoque` |
| Btn Editar | TODO: → `/produtos/[id]/editar` |
| Btn ✕ excluir | TODO: confirmar + deletar |

### `/produtos/novo`
| Elemento | Ação / Destino |
|---|---|
| Btn ↺ regerar SKU | Gera novo código aleatório |
| Toggle Garantia | Mostra campos de garantia |
| Margem | Calculada em tempo real |
| Btn Cancelar | → `/produtos` |
| Btn `Salvar produto` | TODO: Supabase insert |

### `/estoque`
| Elemento | Ação / Destino |
|---|---|
| Filtro "Todas as saídas" | Filtra Vendas normais / 🎁 Saídas como Brinde |
| Tabela Movimentações: col. Tipo | Venda ● (verde) / 🎁 Brinde (amarelo) / ↑ Entrada (azul) |
| Btn `+ Entrada` | TODO: modal entrada |
| Btn `- Saída` | TODO: modal saída |

### `/clientes`
| Elemento | Ação / Destino |
|---|---|
| Btn `⚠ Sumidos` | → `/clientes/inativos` |
| Btn `+ Novo Cliente` | → `/clientes/novo` |
| Btn `+ Venda` | TODO: → `/vendas/nova?cliente=id` |
| Btn 💬 WhatsApp | `wa.me/55{tel}` |

### `/clientes/novo`
| Elemento | Ação / Destino |
|---|---|
| Toggle Varejo/Atacado/VIP | Seleciona tipo de cliente |
| Btn Cancelar | → `/clientes` |
| Btn `Salvar cliente` | TODO: Supabase insert |

### `/clientes/inativos`
| Elemento | Ação / Destino |
|---|---|
| Btn 💬 WhatsApp | `wa.me/55{tel}?text={msg_temperatura}` |

### `/fornecedores`
| Elemento | Ação / Destino |
|---|---|
| Aba "Fornecedores" | Lista de fornecedores |
| Aba "Pedidos Pendentes" | Lista de pedidos + badge com contador |
| Btn `+ Novo Fornecedor` | → `/fornecedores/novo` |
| Btn 💬 WhatsApp | `wa.me/55{tel}` |
| Btn ✏ editar | TODO: → `/fornecedores/[id]/editar` |
| Pedidos: Btn “✓ Confirmar” | Avança status para Confirmado |
| Pedidos: Btn “✓ Entregue” | Avança status para Entregue |

### `/fornecedores/novo`
| Elemento | Ação / Destino |
|---|---|
| Btn Cancelar | → `/fornecedores` |
| Btn `Salvar fornecedor` | TODO: Supabase insert |

### `/garantias`
| Elemento | Ação / Destino |
|---|---|
| Btn 🖨 Imprimir | → `/garantias/[id]` |
| Btn 💬 WhatsApp | `wa.me/55{tel}` |

### `/garantias/[id]` (Certificado)
| Elemento | Ação / Destino |
|---|---|
| Btn ← Voltar | → `/garantias` |
| Btn 💬 WhatsApp | `wa.me/55{tel}?text={msg}` |
| Btn 🖨 Imprimir | `window.print()` (navbar oculta) |

### `/ordens-de-servico`
| Elemento | Ação / Destino |
|---|---|
| Btn `+ Nova OS` | → `/ordens-de-servico/nova` |
| Btn `Ver OS` | TODO: → `/ordens-de-servico/[id]` |
| Btn `✓ Concluir` | TODO: atualiza status |

### `/ordens-de-servico/nova`
| Elemento | Ação / Destino |
|---|---|
| Btn Cancelar | → `/ordens-de-servico` |
| Btn `Abrir OS` | TODO: Supabase insert |

### `/comissoes`
| Elemento | Ação / Destino |
|---|---|
| Btn `+ Cadastrar Comissionado` | Abre modal inline |
| Modal Btn Cancelar | Fecha modal |
| Modal Btn `Salvar` | Adiciona à lista (estado local) |
| Btn 💬 WhatsApp | `wa.me/55{tel}` |
| Btn `✓ Marcar Pago` | Atualiza estado local |

### `/catalogo`
| Elemento | Ação / Destino |
|---|---|
| Btn `📋 Copiar` | `navigator.clipboard.writeText(url)` |
| Btn `💬 Compartilhar WhatsApp` | `wa.me/?text=Olá! Veja nossos produtos: [link]. Para fazer seu pedido é só chamar aqui no zap!` |
| Btn `🖨 Imprimir QR Code` | `window.print()` |
| Btn `↗ Ver Catálogo Público` | URL pública |
| Select "Preço exibido" (por produto) | Varejo / Atacado / VIP / Ocultar preço |
| Btn `🛒 Vender` | → `/vendas/nova?produto=[id]` |
| Btn Ocultar/Mostrar | Alterna visibilidade (estado local) |
| Prévia | Respeita o preço configurado por produto |

### `/financeiro`
| Elemento | Ação / Destino |
|---|---|
| Btn `+ Lançar Despesa` | → `/financeiro/despesas` |
| Btn `🔒 Fechar Período` | → `/financeiro/fechamento` |
| Seletor período | Filtra DRE (Hoje/Semana/Quinzena/Mês/Ano) |
| DRE linha "(-) Brindes concedidos" | Separada do CMV, em amarelo |

### `/financeiro/fiado`
| Elemento | Ação / Destino |
|---|---|
| KPI Total em Aberto | vermelho — total de fiados pendentes |
| KPI Recebido este Mês | verde — fiados quitados no mês |
| KPI Nº de Devedores | contagem |
| Alerta +15 dias | faixa vermelha condicional |
| Btn `💬 Cobrar` | `wa.me/55{tel}?text=Oi [Nome], você tem R$[X] em aberto...` |
| Btn `✓ Pago` | `confirm()` → remove da lista |

### `/financeiro/despesas`
| Elemento | Ação / Destino |
|---|---|
| Btn `+ Lançar Despesa` | Mostra form inline |
| Form Btn Cancelar | Fecha form |
| Form Btn `Salvar Despesa` | Adiciona à lista |
| Btn Excluir | Remove despesa |

### `/financeiro/fechamento`
| Elemento | Ação / Destino |
|---|---|
| Card instrução (3 passos) | Fechável — salva estado em useState |
| Seletor período | Diário/Quinzenal/Mensal/Anual |
| Label "O sistema diz que você deveria ter" | (era: Saldo Esperado em Caixa) |
| Label "Dinheiro que você tirou do caixa" | (era: Saídas/Sangria) |
| Campo "Quanto de dinheiro tem no caixa agora?" | placeholder com exemplo real |
| Resultado: ✓ Zerado / Sobrou / Faltou | ícone ✅⚠❌ com linguagem simples |
| Btn `Confirmar e fechar o caixa de hoje` | (era: Fechar o Dia) |
| Btn `🖨 Imprimir Relatório` | `window.print()` |

### `/relatorios`
| Elemento | Ação / Destino |
|---|---|
| Select mês | Filtra período |
| Btn `⬇ Exportar PDF` | TODO |
| Btn `Ver DRE completo` | → `/financeiro` |
| Btn `🔒 Fechar Período` | → `/financeiro/fechamento` |

### `/configuracoes`
| Elemento | Ação / Destino |
|---|---|
| Btn `👑 Upgrade` | TODO: checkout |
| Item 🏪 Dados da Empresa | → `/configuracoes/empresa` (TODO) |
| Item 👥 Usuários e Acessos | → `/configuracoes/usuarios` (TODO) |
| Item 💳 Formas de Pagamento | → `/configuracoes/pagamentos` (TODO) |
| Item 🏷️ Categorias | → `/configuracoes/categorias` (TODO) |
| Item 🌐 Catálogo Online | → `/catalogo` |
| Btn "Limpar dados" | confirm() → "Tem certeza? Isso não pode ser desfeito." |
| Btn "Encerrar conta" | confirm() → "Tem certeza? Isso não pode ser desfeito." |

---

## FLUXOS PRINCIPAIS

**Venda:** `/vendas/nova` → carrinho → pgto → `/vendas/[id]`

**Garantia:** produto com garantia → venda → `/garantias` → `/garantias/[id]`

**CRM:** dashboard alerta → `/clientes/inativos` → WhatsApp

**Financeiro:** vendas auto → DRE `/financeiro` → despesas → `/financeiro/fechamento`

**Comissão:** PDV select puxador → venda → `/comissoes` → Marcar Pago

---

## ITENS TODO (fases futuras

| Item | Onde |
|---|---|
| Supabase queries reais | Todos módulos |
| Modal cliente rápido no PDV | `/vendas/nova` |
| `/produtos/[id]/editar` | Produtos |
| `/ordens-de-servico/[id]` | OS |
| `/fornecedores/[id]/editar` | Fornecedores |
| Export CSV/PDF | Relatórios, Produtos |
| Checkout upgrade | Configurações |
| Subpáginas `/configuracoes/*` | Configurações |
| RLS por empresa_id | Supabase (produção) |
