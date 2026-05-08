# NexoCommerce â€” Auditoria Completa de Telas, BotÃµes e ConexÃµes

> **Regra:** Este arquivo DEVE ser atualizado a cada mudanÃ§a no cÃ³digo.
> **Ãšltima atualizaÃ§Ã£o:** 08/05/2026 v2.1.0 â€” EdiÃ§Ã£o de Fornecedores + RelatÃ³rio de ComissÃµes + Migration SQL

---

## MAPA DE ROTAS E STATUS

| Rota | Arquivo | Status |
|---|---|---|
| `/` | `app/page.tsx` | Redirect â†’ `/dashboard` |
| `/login` | `(auth)/login/page.tsx` | âœ… Completo |
| `/cadastro` | `(auth)/cadastro/page.tsx` | âœ… Completo |
| `/dashboard` | `(dashboard)/dashboard/page.tsx` | âœ… Completo |
| `/vendas` | `(dashboard)/vendas/page.tsx` | âœ… Completo |
| `/vendas/nova` | `(dashboard)/vendas/nova/page.tsx` | âœ… Completo (PDV com modal de cliente inline) |
| `/vendas/[id]` | `(dashboard)/vendas/[id]/page.tsx` | âœ… Completo |
| `/produtos` | `(dashboard)/produtos/page.tsx` | âœ… Completo (modal Novo Produto + abas) |
| `/produtos/novo` | `(dashboard)/produtos/novo/page.tsx` | â†©ï¸ Redirect â†’ `/produtos` (modal) |
| `/estoque` | `(dashboard)/estoque/page.tsx` | âœ… Completo (abas Produtos/Estoque/CatÃ¡logo) |
| `/catalogo` | `(dashboard)/catalogo/page.tsx` | âœ… Completo (abas Produtos/Estoque/CatÃ¡logo) |
| `/clientes` | `(dashboard)/clientes/page.tsx` | âœ… Completo (modal Novo Cliente + abas) |
| `/clientes/novo` | `(dashboard)/clientes/novo/page.tsx` | â†©ï¸ Redirect â†’ `/clientes` (modal) |
| `/clientes/inativos` | `(dashboard)/clientes/inativos/page.tsx` | âœ… Completo (abas CRM) |
| `/fornecedores` | `(dashboard)/fornecedores/page.tsx` | âœ… Completo (modal Novo Fornecedor + abas) |
| `/fornecedores/novo` | `(dashboard)/fornecedores/novo/page.tsx` | â†©ï¸ Redirect â†’ `/fornecedores` (modal) |
| `/garantias` | `(dashboard)/garantias/page.tsx` | âœ… Completo (abas OperaÃ§Ãµes Extras) |
| `/garantias/[id]` | `(dashboard)/garantias/[id]/page.tsx` | âœ… Completo |
| `/ordens-de-servico` | `(dashboard)/ordens-de-servico/page.tsx` | âœ… Completo (modal Nova OS + abas) |
| `/ordens-de-servico/nova` | `(dashboard)/ordens-de-servico/nova/page.tsx` | â†©ï¸ Redirect â†’ `/ordens-de-servico` (modal) |
| `/comissoes` | `(dashboard)/comissoes/page.tsx` | âœ… Completo (abas OperaÃ§Ãµes Extras) |
| `/puxadores` | `(dashboard)/puxadores/page.tsx` | Redirect â†’ `/comissoes` |
| `/financeiro` | `(dashboard)/financeiro/page.tsx` | âœ… Completo (abas Financeiro) |
| `/financeiro/fiado` | `(dashboard)/financeiro/fiado/page.tsx` | âœ… Completo (abas Financeiro) |
| `/financeiro/despesas` | `(dashboard)/financeiro/despesas/page.tsx` | âœ… Completo (abas Financeiro) |
| `/financeiro/fechamento` | `(dashboard)/financeiro/fechamento/page.tsx` | âœ… Completo (abas Financeiro) |
| `/relatorios` | `(dashboard)/relatorios/page.tsx` | âœ… Completo |
| `/configuracoes` | `(dashboard)/configuracoes/page.tsx` | âœ… Completo |
| `/produtos/[id]/editar` | â€” | TODO |

---

## SIDEBAR â€” ESTRUTURA ATUAL (8 itens visÃ­veis)

> **v2.0:** Reduzida de 17 para 8 entradas. MÃ³dulos filhos vivem dentro de abas (`PageTabs`), nÃ£o na sidebar.

| Label | Rota entrada | MÃ³dulos nas abas |
|---|---|---|
| ðŸ›’ Nova Venda | `/vendas/nova` | â€” |
| ðŸ“Š Dashboard | `/dashboard` | â€” |
| ðŸ§¾ Vendas | `/vendas` | â€” |
| ðŸ“¦ Produtos & Estoque | `/produtos` | Produtos Â· Estoque Â· CatÃ¡logo |
| ðŸ‘¥ CRM & Parceiros | `/clientes` | Clientes Â· Sumidos Â· Fornecedores |
| ðŸ’¹ Financeiro | `/financeiro` | DRE Â· Despesas Â· Fiados Â· Fechamento |
| âš™ OperaÃ§Ãµes Extras | `/garantias` | Garantias Â· OS Â· ComissÃµes |
| âš™ï¸ ConfiguraÃ§Ãµes | `/configuracoes` | â€” |

---

## BOTÃ•ES E CONEXÃ•ES POR TELA

### `/login`
| Elemento | AÃ§Ã£o / Destino |
|---|---|
| Btn `Entrar` | Supabase Auth â†’ `/dashboard` |
| Link `Criar conta grÃ¡tis` | â†’ `/cadastro` |
| Link `Esqueceu a senha?` | TODO |

### `/cadastro`
| Elemento | AÃ§Ã£o / Destino |
|---|---|
| Btn `Criar minha conta grÃ¡tis` | Supabase Auth â†’ `/dashboard` |
| Link `Entrar` | â†’ `/login` |

### `/dashboard`
| Elemento | AÃ§Ã£o / Destino |
|---|---|
| Alerta estoque zerado | Btn â†’ `/estoque` |
| Alerta clientes sumidos | Btn â†’ `/clientes/inativos` |
| Alerta comissÃ£o pendente | Btn â†’ `/comissoes` |
| KPI Faturamento Hoje | â†’ `/relatorios` |
| KPI Vendas Hoje | â†’ `/vendas` |
| KPI Despesas | â†’ `/financeiro` |
| KPI Lucro LÃ­quido | â†’ `/financeiro` |
| Ãšltimas Vendas (linha) | â†’ `/vendas/[id]` |
| Estoque CrÃ­tico â€” Ligar | WhatsApp do fornecedor |
| Acesso RÃ¡pido: Nova Venda | â†’ `/vendas/nova` |
| Acesso RÃ¡pido: Produto | â†’ `/produtos/novo` |
| Acesso RÃ¡pido: Despesa | â†’ `/financeiro/despesas` |
| Acesso RÃ¡pido: Fechar Caixa | â†’ `/financeiro/fechamento` |
| Acesso RÃ¡pido: Garantias | â†’ `/garantias` |
| Acesso RÃ¡pido: Sumidos | â†’ `/clientes/inativos` |

### `/vendas/nova` (PDV)
| Elemento | AÃ§Ã£o / Destino |
|---|---|
| Banner onboarding (1Âª vez) | Mostra ao abrir, fecha c/ X, salva no banco |
| Busca produto: resultado vazio | Aparece botÃ£o "ðŸ“¦ Pedir ao Fornecedor" |
| Btn "ðŸ“¦ Pedir ao Fornecedor" | Abre modal inline (produto prÃ©-preenchido) |
| Modal: select Fornecedor | Lista fornecedores cadastrados |
| Modal: Btn "ðŸ’¬ Abrir WhatsApp" | Monta msg + salva em `pedidos_fornecedor` (Supabase) |
| Toggle Brinde ON | PreÃ§o â†’ R$0, exibe custo real do brinde |
| Tipo cliente Varejo/Atacado/VIP | Atualiza preÃ§os do carrinho |
| Campo Comissionado | Registra indicaÃ§Ã£o na venda |
| Pgto = Fiado | Campo cliente torna-se **obrigatÃ³rio** + borda vermelha + aviso |
| Btn "AnÃ´nimo" | Desabilitado quando Fiado selecionado |
| Btn "ðŸ“’ REGISTRAR NO FIADO" | Salva em `fiados` (Supabase) + finaliza venda |
| Btns PIX/Dinheiro/CrÃ©dito/DÃ©bito/Fiado | Seleciona forma pgto |
| Btn FINALIZAR VENDA | Processa â†’ tela sucesso |
| Sucesso: Btn Ver Recibo | â†’ `/vendas/[id]` |
| Sucesso: Btn Nova Venda | Reset do PDV |

### `/vendas/[id]` (Recibo)
| Elemento | AÃ§Ã£o / Destino |
|---|---|
| Btn â† Voltar | â†’ `/vendas` |
| Btn ðŸ’¬ WhatsApp | `wa.me/55{tel}?text={msg}` |
| Btn ðŸ–¨ Imprimir | `window.print()` |

### `/produtos`
| Elemento | AÃ§Ã£o / Destino |
|---|---|
| Btn `+ Novo Produto` | â†’ `/produtos/novo` |
| Alerta crÃ­tico | â†’ `/estoque` |
| Btn Editar | TODO: â†’ `/produtos/[id]/editar` |
| Btn âœ• excluir | TODO: confirmar + deletar |

### `/produtos/novo`
| Elemento | AÃ§Ã£o / Destino |
|---|---|
| Btn â†º regerar SKU | Gera novo cÃ³digo aleatÃ³rio |
| Toggle Garantia | Mostra campos de garantia |
| Margem | Calculada em tempo real |
| Btn Cancelar | â†’ `/produtos` |
| Btn `Salvar produto` | ✅ Concluído (Supabase) |

### `/estoque`
| Elemento | AÃ§Ã£o / Destino |
|---|---|
| Filtro "Todas as saÃ­das" | Filtra Vendas normais / ðŸŽ SaÃ­das como Brinde |
| Tabela MovimentaÃ§Ãµes: col. Tipo | Venda â— (verde) / ðŸŽ Brinde (amarelo) / â†‘ Entrada (azul) |
| Btn `+ Entrada` | ✅ Concluído |
| Btn `- SaÃ­da` | TODO: modal saÃ­da |

### `/clientes`
| Elemento | AÃ§Ã£o / Destino |
|---|---|
| Btn `âš  Sumidos` | â†’ `/clientes/inativos` |
| Btn `+ Novo Cliente` | â†’ `/clientes/novo` |
| Btn `+ Venda` | TODO: â†’ `/vendas/nova?cliente=id` |
| Btn ðŸ’¬ WhatsApp | `wa.me/55{tel}` |

### `/clientes/novo`
| Elemento | AÃ§Ã£o / Destino |
|---|---|
| Toggle Varejo/Atacado/VIP | Seleciona tipo de cliente |
| Btn Cancelar | â†’ `/clientes` |
| Btn `Salvar cliente` | ✅ Concluído (Supabase) |

### `/clientes/inativos`
| Elemento | AÃ§Ã£o / Destino |
|---|---|
| Btn ðŸ’¬ WhatsApp | `wa.me/55{tel}?text={msg_temperatura}` |

### `/fornecedores`
| Elemento | AÃ§Ã£o / Destino |
|---|---|
| Aba "Fornecedores" | Lista de fornecedores |
| Aba "Pedidos Pendentes" | Lista de pedidos + badge com contador |
| Btn `+ Novo Fornecedor` | â†’ `/fornecedores/novo` |
| Btn ðŸ’¬ WhatsApp | `wa.me/55{tel}` |
| Btn âœ editar | TODO: â†’ `/fornecedores/[id]/editar` |
| Pedidos: Btn â€œâœ“ Confirmarâ€ | AvanÃ§a status para Confirmado |
| Pedidos: Btn â€œâœ“ Entregueâ€ | AvanÃ§a status para Entregue |

### `/fornecedores/novo`
| Elemento | AÃ§Ã£o / Destino |
|---|---|
| Btn Cancelar | â†’ `/fornecedores` |
| Btn `Salvar fornecedor` | ✅ Concluído (Supabase) |

### `/garantias`
| Elemento | AÃ§Ã£o / Destino |
|---|---|
| Btn ðŸ–¨ Imprimir | â†’ `/garantias/[id]` |
| Btn ðŸ’¬ WhatsApp | `wa.me/55{tel}` |

### `/garantias/[id]` (Certificado)
| Elemento | AÃ§Ã£o / Destino |
|---|---|
| Btn â† Voltar | â†’ `/garantias` |
| Btn ðŸ’¬ WhatsApp | `wa.me/55{tel}?text={msg}` |
| Btn ðŸ–¨ Imprimir | `window.print()` (navbar oculta) |

### `/ordens-de-servico`
| Elemento | AÃ§Ã£o / Destino |
|---|---|
| Btn `+ Nova OS` | â†’ `/ordens-de-servico/nova` |
| Btn `Ver OS` | TODO: â†’ `/ordens-de-servico/[id]` |
| Btn `âœ“ Concluir` | TODO: atualiza status |

### `/ordens-de-servico/nova`
| Elemento | AÃ§Ã£o / Destino |
|---|---|
| Btn Cancelar | â†’ `/ordens-de-servico` |
| Btn `Abrir OS` | ✅ Concluído |

### `/comissoes`
| Elemento | AÃ§Ã£o / Destino |
|---|---|
| Btn `+ Cadastrar Comissionado` | Abre modal inline |
| Modal Btn Cancelar | Fecha modal |
| Modal Btn `Salvar` | Adiciona Ã  tabela `comissoes` (Supabase) |
| Btn ðŸ’¬ WhatsApp | `wa.me/55{tel}` |
| Btn `âœ“ Marcar Pago` | Atualiza status no banco (Supabase) |

### `/catalogo`
| Elemento | AÃ§Ã£o / Destino |
|---|---|
| Btn `ðŸ“‹ Copiar` | `navigator.clipboard.writeText(url)` |
| Btn `ðŸ’¬ Compartilhar WhatsApp` | `wa.me/?text=OlÃ¡! Veja nossos produtos: [link]. Para fazer seu pedido Ã© sÃ³ chamar aqui no zap!` |
| Btn `ðŸ–¨ Imprimir QR Code` | `window.print()` |
| Btn `â†— Ver CatÃ¡logo PÃºblico` | URL pÃºblica |
| Select "PreÃ§o exibido" (por produto) | Varejo / Atacado / VIP / Ocultar preÃ§o |
| Btn `ðŸ›’ Vender` | â†’ `/vendas/nova?produto=[id]` |
| Btn Ocultar/Mostrar | Alterna visibilidade (estado local) |
| PrÃ©via | Respeita o preÃ§o configurado por produto |

### `/financeiro`
| Elemento | AÃ§Ã£o / Destino |
|---|---|
| Btn `+ LanÃ§ar Despesa` | â†’ `/financeiro/despesas` |
| Btn `ðŸ”’ Fechar PerÃ­odo` | â†’ `/financeiro/fechamento` |
| Seletor perÃ­odo | Filtra DRE (Hoje/Semana/Quinzena/MÃªs/Ano) |
| DRE linha "(-) Brindes concedidos" | Separada do CMV, em amarelo |

### `/financeiro/fiado`
| Elemento | AÃ§Ã£o / Destino |
|---|---|
| KPI Total em Aberto | vermelho â€” total de fiados pendentes |
| KPI Recebido este MÃªs | verde â€” fiados quitados no mÃªs |
| KPI NÂº de Devedores | contagem |
| Alerta +15 dias | faixa vermelha condicional |
| Btn `ðŸ’¬ Cobrar` | `wa.me/55{tel}?text=Oi [Nome], vocÃª tem R$[X] em aberto...` |
| Btn `âœ“ Pago` | `confirm()` â†’ remove da lista |

### `/financeiro/despesas`
| Elemento | AÃ§Ã£o / Destino |
|---|---|
| Btn `+ LanÃ§ar Despesa` | Mostra form inline |
| Form Btn Cancelar | Fecha form |
| Form Btn `Salvar Despesa` | Adiciona Ã  lista |
| Btn Excluir | Remove despesa |

### `/financeiro/fechamento`
| Elemento | AÃ§Ã£o / Destino |
|---|---|
| Card instruÃ§Ã£o (3 passos) | FechÃ¡vel â€” salva estado em useState |
| Seletor perÃ­odo | DiÃ¡rio/Quinzenal/Mensal/Anual |
| Label "O sistema diz que vocÃª deveria ter" | (era: Saldo Esperado em Caixa) |
| Label "Dinheiro que vocÃª tirou do caixa" | (era: SaÃ­das/Sangria) |
| Campo "Quanto de dinheiro tem no caixa agora?" | placeholder com exemplo real |
| Resultado: âœ“ Zerado / Sobrou / Faltou | Ã­cone âœ…âš âŒ com linguagem simples |
| Btn `Confirmar e fechar o caixa de hoje` | (era: Fechar o Dia) |
| Btn `ðŸ–¨ Imprimir RelatÃ³rio` | `window.print()` |

### `/relatorios`
| Elemento | AÃ§Ã£o / Destino |
|---|---|
| Select mÃªs | Filtra perÃ­odo |
| Btn `â¬‡ Exportar PDF` | TODO |
| Btn `Ver DRE completo` | â†’ `/financeiro` |
| Btn `ðŸ”’ Fechar PerÃ­odo` | â†’ `/financeiro/fechamento` |

### `/configuracoes`
| Elemento | AÃ§Ã£o / Destino |
|---|---|
| Btn `ðŸ‘‘ Upgrade` | TODO: checkout |
| Item ðŸª Dados da Empresa | â†’ `/configuracoes/empresa` (TODO) |
| Item ðŸ‘¥ UsuÃ¡rios e Acessos | â†’ `/configuracoes/usuarios` (TODO) |
| Item ðŸ’³ Formas de Pagamento | â†’ `/configuracoes/pagamentos` (TODO) |
| Item ðŸ·ï¸ Categorias | â†’ `/configuracoes/categorias` (TODO) |
| Item ðŸŒ CatÃ¡logo Online | â†’ `/catalogo` |
| Btn "Limpar dados" | confirm() â†’ "Tem certeza? Isso nÃ£o pode ser desfeito." |
| Btn "Encerrar conta" | confirm() â†’ "Tem certeza? Isso nÃ£o pode ser desfeito." |

---

## FLUXOS PRINCIPAIS

**Venda:** `/vendas/nova` â†’ carrinho â†’ pgto â†’ `/vendas/[id]`

**Garantia:** produto com garantia â†’ venda â†’ `/garantias` â†’ `/garantias/[id]`

**CRM:** dashboard alerta â†’ `/clientes/inativos` â†’ WhatsApp

**Financeiro:** vendas auto â†’ DRE `/financeiro` â†’ despesas â†’ `/financeiro/fechamento`

**ComissÃ£o:** PDV select puxador â†’ venda salva `comissionado_id` â†’ `/comissoes` aba "Por Venda" â†’ ver total a pagar por indicador

---

## ITENS TODO (fases futuras)

| Item | Onde | Status |
|---|---|---|
| Modal cliente rÃ¡pido no PDV | `/vendas/nova` | âœ… ConcluÃ­do v2.0 |
| `/produtos/[id]/editar` | Produtos | âœ… ConcluÃ­do (outra IA) |
| `/fornecedores/[id]/editar` | Fornecedores | âœ… ConcluÃ­do v2.1 (modal inline) |
| RelatÃ³rio de comissÃµes por venda | `/comissoes` | âœ… ConcluÃ­do v2.1 (aba "Por Venda") |
| Migration SQL novas tabelas/colunas | Supabase | âœ… `docs/migration_v2_1.sql` criado |
| Trigger conviteâ†’empresa no Supabase | Supabase | âœ… IncluÃ­do na migration |
| `/ordens-de-servico/[id]` | OS | ✅ Concluído |
| Export CSV/PDF | RelatÃ³rios, Produtos | TODO |
| Checkout upgrade | ConfiguraÃ§Ãµes | TODO |
| SubpÃ¡ginas `/configuracoes/*` | ConfiguraÃ§Ãµes | TODO |
| Esqueceu a senha? | Login | TODO |


## AtualizaÃ§Ãµes de Maio/2026 (RefatoraÃ§Ã£o Neobrutalista e Barcode)
1. **Design System:** Migrado de "ClÃ¡ssico" para "Neobrutalismo (Premium Modern Retro)", com bordas grossas, sombras sÃ³lidas e cores vibrantes.
2. **Dashboard KPIs:** ComoFoiPainel agora possui modais interativos para detalhamento de vendas e despesas.
3. **Leitura EAN (Barcode):** 
   - FormProduto e PDV (/vendas/nova) agora suportam leitura via CÃ¢mera Mobile (zxing) e leitores fÃ­sicos de cÃ³digo de barras.
   - O campo de busca do PDV processa o auto-submit (Enter) para scanners fÃ­sicos.
4. **SKU EditÃ¡vel:** O SKU agora Ã© editÃ¡vel em FormProduto, mantendo geraÃ§Ã£o aleatÃ³ria via botÃ£o, com validaÃ§Ã£o de unicidade.
5. **Schema e Banco:** Adicionada coluna ean e Ã­ndice Ãºnico na tabela produtos. Inseridas colunas faltantes na tabela empresas (cnpj, email, etc.).
6. **CorreÃ§Ãµes:** Resolvido o loop de autenticaÃ§Ã£o no layout, erro 400 em despesas e problemas de encoding.

## Resumo Final da Auditoria
1.  **Fiado:** Refatorado para usar a tabela `fiados` no Supabase, com suporte a relatÃ³rios no Dashboard e cÃ¡lculo em DRE.
2.  **Acionar Fornecedor:** Refatorado para salvar pedidos diretamente na tabela `pedidos_fornecedor` no Supabase e enviar WhatsApp.
3.  **ComissÃµes:** Usa a tabela `comissoes` do Supabase de forma nativa e calcula as comissÃµes dinamicamente associando com o ID da Venda (`comissionado_id`).
4.  **Tudo 100% no Banco:** O sistema **NÃƒO utiliza** `localStorage` nem estado local temporÃ¡rio para armazenamento persistente de dados. Qualquer dado financeiro, venda, cliente, produto e comissÃµes sÃ£o restritos ao PostgreSQL (Supabase) garantindo sincronizaÃ§Ã£o e seguranÃ§a.
