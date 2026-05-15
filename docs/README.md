# KDL STORE — DOCUMENTAÇÃO TÉCNICA VIVA
> Repositório: `github.com/kdlsystemofc-glitch/KDL-Store` | Branch: `master`
> Última atualização: 2026-05-15

---

## ÍNDICE GERAL

| # | Arquivo | Conteúdo |
|---|---|---|
| 01 | [01_visao_geral.md](./01_visao_geral.md) | Projeto, planos, stack, multi-tenant |
| 02 | [02_arquitetura.md](./02_arquitetura.md) | Estrutura de pastas, middleware, padrões |
| 03 | [03_modulos_telas.md](./03_modulos_telas.md) | Todos os módulos e telas detalhados |
| 04 | [04_banco_de_dados.md](./04_banco_de_dados.md) | Tabelas, colunas, triggers, RLS |
| 05 | [05_fluxos_seguranca_componentes.md](./05_fluxos_seguranca_componentes.md) | Fluxos, permissões, segurança, componentes, roadmap |

---

## REGRA DE MANUTENÇÃO

Sempre que uma funcionalidade for **criada, alterada ou removida**:

1. Atualizar o arquivo de módulo/tela correspondente em `03_modulos_telas.md`
2. Se envolver banco: atualizar `04_banco_de_dados.md` E `database.sql`
3. Se envolver fluxo de autenticação/plano: atualizar `05_fluxos_seguranca_componentes.md`
4. Se envolver arquitetura: atualizar `02_arquitetura.md`
5. Sempre registrar no **Changelog Vivo** em `05_fluxos_seguranca_componentes.md` seção 5.13
6. Atualizar o **Roadmap** em `05_fluxos_seguranca_componentes.md` seção 5.14

---

## REFERÊNCIA RÁPIDA

### Planos e Restrições
| Módulo | Start | Pro | Arquivo |
|---|---|---|---|
| Dashboard (KPIs básicos) | ✅ | ✅ | `(dashboard)/dashboard/page.tsx` |
| PDV / Nova Venda | ✅ | ✅ | `(dashboard)/vendas/nova/page.tsx` |
| Histórico de Vendas | ✅ | ✅ | `(dashboard)/vendas/page.tsx` |
| Produtos / Estoque / Catálogo | ✅ | ✅ | `(dashboard)/produtos/`, `/estoque/`, `/catalogo/` |
| Clientes | ✅ | ✅ | `(dashboard)/clientes/page.tsx` |
| Fornecedores | ✅ | ✅ | `(dashboard)/fornecedores/page.tsx` |
| Garantias | ✅ | ✅ | `(dashboard)/garantias/page.tsx` |
| Ordens de Serviço | ✅ | ✅ | `(dashboard)/ordens-de-servico/page.tsx` |
| Configurações | ✅ | ✅ | `(dashboard)/configuracoes/` |
| Painel "Como foi?" | ❌ | ✅ | `components/ComoFoiPainel.tsx` |
| Financeiro (DRE) | ❌ | ✅ | `(dashboard)/financeiro/page.tsx` |
| Fiado | ❌ | ✅ | `(dashboard)/financeiro/fiado/page.tsx` |
| Fechamento de Caixa | ❌ | ✅ | `(dashboard)/financeiro/fechamento/page.tsx` |
| Relatórios | ❌ | ✅ | `(dashboard)/relatorios/page.tsx` |
| CRM Clientes Sumidos | ❌ | ✅ | `(dashboard)/clientes/inativos/page.tsx` |
| Comissões | ❌ | ✅ | `(dashboard)/comissoes/page.tsx` |

### Preços dos Planos
| Plano | Preço | Coluna no banco |
|---|---|---|
| Start | R$ 65/mês | `subscriptions.preco = 6500` |
| Pro | R$ 95/mês | `subscriptions.preco = 9500` |

### Tabelas Críticas por Módulo
| Módulo | Tabelas principais |
|---|---|
| PDV | `vendas`, `itens_venda`, `produtos`, `fiados`, `garantias`, `estoque_movimentacoes` |
| Clientes | `clientes`, `vendas`, `fiados` |
| Financeiro | `vendas`, `despesas`, `fiados` |
| Comissões | `comissoes`, `vendas` |
| Estoque | `produtos`, `estoque_movimentacoes` |
| Garantias/OS | `garantias`, `devolucoes`, `ordens_servico` |
| Usuários | `profiles`, `convites`, `empresas` |
| Assinatura | `subscriptions`, `empresas` |

### Hooks Disponíveis
| Hook | Retorna | Fonte |
|---|---|---|
| `useEmpresaId()` | `{ empresaId, loading }` | `profiles.empresa_id` via auth |
| `useSubscription()` | `{ plano, ativo, loading }` | `subscriptions` |

### Componentes de Controle de Acesso
```tsx
// Ocultar conteúdo para plano Start
<ProOnly>
  {/* Visível apenas para Pro */}
</ProOnly>

// Verificar plano no código
const { plano } = useSubscription()
const isPro = plano === 'pro'
if (isPro) { /* lógica exclusiva */ }

// Sidebar filtrada automaticamente no layout.tsx
[...startItems, ...(planoAtivo === 'pro' ? proItems : [])]
```
