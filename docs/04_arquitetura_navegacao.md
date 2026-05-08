# NexoCommerce — Arquitetura de Navegação v2.0

> **Regra:** Este arquivo documenta as decisões estruturais de UX/navegação.
> **Versão:** 2.0.0 | **Atualizado:** 08/05/2026 — Sprint de Consolidação de Navegação

---

## PRINCÍPIO GUIA

> **"Se uma ação pode ser concluída sem trocar de tela, ela deve ser concluída sem trocar de tela."**

O público-alvo são lojistas da 25 de Março que nunca usaram um sistema de gestão. Cada redirecionamento desnecessário é uma barreira que causa abandono. Por isso, toda a estrutura foi projetada para minimizar saltos de tela.

---

## SIDEBAR — ESTRUTURA ATUAL (8 itens)

A sidebar foi reduzida de **17 itens** para **8 entradas visíveis**, agrupando módulos relacionados.

| # | Label na Sidebar | Rota | Descrição |
|---|---|---|---|
| 1 | 🛒 Nova Venda (F2) | `/vendas/nova` | Acesso rápido ao PDV, sempre visível no topo |
| 2 | 📊 Dashboard | `/dashboard` | KPIs e visão geral do dia |
| 3 | 🧾 Vendas | `/vendas` | Histórico de todas as vendas |
| 4 | 📦 Produtos & Estoque | `/produtos` | Entrada para Produtos + Estoque + Catálogo via abas |
| 5 | 👥 CRM & Parceiros | `/clientes` | Entrada para Clientes + Sumidos + Fornecedores via abas |
| 6 | 💹 Financeiro | `/financeiro` | Entrada para DRE + Despesas + Fiado + Fechamento via abas |
| 7 | ⚙ Operações Extras | `/garantias` | Entrada para Garantias + OS + Comissões via abas |
| 8 | ⚙️ Configurações | `/configuracoes` | Configurações gerais |

---

## SISTEMA DE ABAS (PageTabs)

O componente `<PageTabs>` foi criado em `src/components/PageTabs.tsx` para sub-navegação dentro de módulos, sem usar a sidebar.

### Grupos de Abas

#### 📦 Grupo: Produtos & Estoque
| Aba | Rota |
|---|---|
| Produtos | `/produtos` |
| Estoque e Movimentações | `/estoque` |
| Catálogo Online | `/catalogo` |

#### 👥 Grupo: CRM & Parceiros
| Aba | Rota |
|---|---|
| Todos os Clientes | `/clientes` |
| Sumidos ⚠ | `/clientes/inativos` |
| Fornecedores | `/fornecedores` |

#### 💹 Grupo: Financeiro
| Aba | Rota |
|---|---|
| Visão Geral (DRE) | `/financeiro` |
| Despesas | `/financeiro/despesas` |
| Fiados 📒 | `/financeiro/fiado` |
| Fechamento de Caixa | `/financeiro/fechamento` |

#### ⚙ Grupo: Operações Extras
| Aba | Rota |
|---|---|
| Garantias | `/garantias` |
| Ordens de Serviço | `/ordens-de-servico` |
| Comissões | `/comissoes` |

---

## SISTEMA DE MODAIS (Formulários de Criação)

Todos os formulários de cadastro foram convertidos de páginas separadas para **modais overlay**, permitindo que o lojista cadastre sem perder o contexto da listagem atual.

### Componentes de Formulário (`src/components/`)

| Componente | Props | Usado em |
|---|---|---|
| `FormProduto.tsx` | `onSuccess`, `onCancel` | `/produtos` (modal "Novo Produto") |
| `FormCliente.tsx` | `onSuccess`, `onCancel` | `/clientes` (modal), `/vendas/nova` (modal contextual) |
| `FormFornecedor.tsx` | `onSuccess`, `onCancel` | `/fornecedores` (modal "Novo Fornecedor") |

### Padrão de Modal

```tsx
{showModal && (
  <div
    style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.6)', ... }}
    onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
  >
    <div className="card anim-pop" style={{ maxHeight:'90vh', overflowY:'auto' }}>
      {/* Header fixo (sticky) com título e botão X */}
      <div style={{ position:'sticky', top:0, ... }}>
        <h2>Título</h2>
        <button onClick={() => setShowModal(false)} className="btn-icon"><X /></button>
      </div>
      {/* Formulário scrollável */}
      <div style={{ padding:'1.25rem' }}>
        <FormComponente onSuccess={() => { setShowModal(false); carregar(empresaId) }} onCancel={() => setShowModal(false)} />
      </div>
    </div>
  </div>
)}
```

### Comportamento padrão dos modais
- **Fechar clicando fora** do card (backdrop click)
- **Fechar pelo botão X** (`.btn-icon`) no header fixo
- **Fechar pelo botão Cancelar** dentro do formulário
- **Ao salvar:** fecha o modal e recarrega a listagem automaticamente
- **Header sticky:** permanece visível ao fazer scroll no formulário

### Funcionalidade Especial — Criar Categoria Inline

Dentro do `FormProduto`, ao selecionar a categoria, há um botão **"+ Nova"** que expande um mini-formulário inline para criar a categoria sem abrir outra tela:

```
[ select de categorias ▼ ] [ + Nova ]
            ↓ ao clicar "+ Nova" ↓
[ input "Nome da nova categoria" ] [ Salvar ] [ ✕ ]
```

Após salvar, a nova categoria é automaticamente selecionada no select.

---

## PÁGINAS /novo MANTIDAS COMO REDIRECT

Para garantir compatibilidade com bookmarks e links externos, as páginas de criação antigas foram mantidas mas redirecionam automaticamente para a rota pai:

| Rota antiga | Redireciona para |
|---|---|
| `/produtos/novo` | `/produtos` |
| `/clientes/novo` | `/clientes` |
| `/fornecedores/novo` | `/fornecedores` |
| `/ordens-de-servico/nova` | `/ordens-de-servico` |

---

## CORREÇÕES DE ESTABILIDADE

### Bug 406 — useEmpresaId (`src/lib/useEmpresaId.ts`)
**Problema:** Query global sem filtro na tabela `profiles` retornava 406 (Not Acceptable).
**Solução:** Buscar usuário autenticado via `supabase.auth.getUser()` primeiro, depois filtrar `profiles` pelo `id` do usuário.

### Bug #418 — Hidratação SSR (`src/app/(dashboard)/layout.tsx`)
**Problema:** Mismatch entre HTML gerado no servidor e no cliente causava erro de hidratação React #418.
**Solução:** Padrão `isMounted` — servidor entrega estado neutro "Carregando", cliente hidrata normalmente após montagem.

---

## COMPONENTES DISPONÍVEIS

| Componente | Path | Descrição |
|---|---|---|
| `PageTabs` | `src/components/PageTabs.tsx` | Sub-navegação por abas dentro de módulos |
| `FormProduto` | `src/components/FormProduto.tsx` | Formulário completo de cadastro de produto |
| `FormCliente` | `src/components/FormCliente.tsx` | Formulário de cadastro de cliente |
| `FormFornecedor` | `src/components/FormFornecedor.tsx` | Formulário de cadastro de fornecedor |
| `EmConstrucao` | `src/components/EmConstrucao.tsx` | Placeholder para módulos em desenvolvimento |

---

## DECISÕES DE DESIGN

1. **Sidebar mínima:** 8 itens. Nenhum módulo filho aparece diretamente na sidebar — eles vivem dentro das abas.
2. **Sem páginas de criação standalone:** Todo cadastro novo usa modal. Páginas `/novo` são redirects.
3. **Recarregamento automático:** Após salvar no modal, a listagem recarrega via `carregar(empresaId)` — sem necessidade de refresh manual.
4. **Design system preservado:** Nenhuma alteração visual nas telas existentes. Apenas estrutura de navegação foi modificada.
5. **Supabase intacto:** Toda lógica de banco de dados, RLS e autenticação foi mantida integralmente.
