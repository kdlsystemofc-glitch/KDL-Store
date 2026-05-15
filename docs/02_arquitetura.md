# SEÇÃO 2 — ARQUITETURA DO SISTEMA

## 2.1 Estrutura de Pastas

```
nexocommerce/
├── src/
│   ├── app/
│   │   ├── (auth)/                 # Grupo: telas de autenticação (layout max-width restrito)
│   │   │   ├── layout.tsx          # Layout auth: centralizado, sem sidebar
│   │   │   ├── login/page.tsx      # Login com email/senha
│   │   │   ├── cadastro/page.tsx   # Registro de novo lojista
│   │   │   └── redefinir-senha/page.tsx
│   │   ├── (dashboard)/            # Grupo: app principal com sidebar
│   │   │   ├── layout.tsx          # Layout dashboard: sidebar + header + main
│   │   │   ├── dashboard/page.tsx  # Página inicial (KPIs)
│   │   │   ├── vendas/
│   │   │   │   ├── page.tsx        # Histórico de vendas
│   │   │   │   ├── nova/page.tsx   # PDV — Frente de caixa
│   │   │   │   └── [id]/page.tsx   # Detalhe / recibo de venda
│   │   │   ├── produtos/
│   │   │   │   ├── page.tsx        # Lista de produtos + estoque
│   │   │   │   ├── novo/page.tsx   # Cadastrar produto
│   │   │   │   └── [id]/editar/page.tsx
│   │   │   ├── clientes/
│   │   │   │   ├── page.tsx        # Lista de clientes
│   │   │   │   ├── novo/page.tsx
│   │   │   │   ├── [id]/page.tsx   # Perfil do cliente
│   │   │   │   └── inativos/page.tsx  # CRM Sumidos [PRO]
│   │   │   ├── financeiro/         # [PRO]
│   │   │   │   ├── page.tsx        # DRE mensal
│   │   │   │   ├── fiado/page.tsx  # Controle de fiados [PRO]
│   │   │   │   ├── despesas/page.tsx
│   │   │   │   └── fechamento/page.tsx  # Fechamento de caixa [PRO]
│   │   │   ├── garantias/
│   │   │   │   ├── page.tsx        # Lista de garantias
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── ordens-de-servico/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── nova/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── comissoes/page.tsx  # [PRO]
│   │   │   ├── relatorios/page.tsx # [PRO]
│   │   │   ├── fornecedores/
│   │   │   │   ├── page.tsx
│   │   │   │   └── novo/page.tsx
│   │   │   ├── estoque/page.tsx    # Movimentações de estoque
│   │   │   ├── catalogo/page.tsx   # Catálogo online
│   │   │   ├── puxadores/page.tsx  # Alias para comissões
│   │   │   └── configuracoes/
│   │   │       ├── page.tsx
│   │   │       ├── empresa/page.tsx
│   │   │       ├── usuarios/page.tsx
│   │   │       ├── pagamentos/page.tsx
│   │   │       ├── categorias/page.tsx
│   │   │       └── planos/page.tsx
│   │   ├── assinar/                # Fora dos grupos — página de planos (fullscreen)
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── auth/callback/route.ts  # Callback OAuth / magic link
│   │   ├── convite/page.tsx        # Aceitar convite de empresa
│   │   ├── globals.css             # CSS global + design tokens
│   │   └── layout.tsx              # Root layout (fonts, meta)
│   ├── components/
│   │   ├── PageTabs.tsx            # Abas de sub-navegação dos módulos
│   │   ├── ProOnly.tsx             # Wrapper de bloqueio para features Pro
│   │   ├── ComoFoiPainel.tsx       # Painel feedback pós-venda [PRO]
│   │   ├── FormCliente.tsx         # Formulário reutilizável de cliente
│   │   ├── FormFornecedor.tsx      # Formulário reutilizável de fornecedor
│   │   ├── FormProduto.tsx         # Formulário reutilizável de produto
│   │   ├── BarcodeScannerModal.tsx # Modal leitor de código de barras
│   │   └── EmConstrucao.tsx        # Placeholder de tela em desenvolvimento
│   ├── hooks/
│   │   └── useSubscription.ts      # Hook: retorna plano e status da assinatura
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           # Supabase client-side (browser)
│   │   │   └── server.ts           # Supabase server-side (SSR)
│   │   ├── useEmpresaId.ts         # Hook: retorna empresa_id do usuário logado
│   │   ├── garantirEmpresa.ts      # Utilitário: garante empresa criada
│   │   └── utils.ts                # formatCurrency, etc.
│   ├── styles/
│   │   └── design-tokens.css       # Tokens CSS (cores, espaçamentos, tipografia)
│   ├── middleware.ts               # Proteção de rotas: auth + assinatura
│   └── types/index.ts              # Tipos TypeScript compartilhados
├── public/
│   ├── landing.html                # Landing page (HTML estático)
│   ├── landing.css                 # Estilos da landing
│   ├── landing.js                  # Scripts da landing
│   ├── Hero-oficial.mp4            # Vídeo do Hero da landing
│   └── favicon.svg
├── database.sql                    # SQL COMPLETO do Supabase
├── next.config.ts                  # Config Next.js (rewrites landing)
├── tsconfig.json
└── package.json
```

## 2.2 Arquitetura de Autenticação

```
Usuário acessa rota protegida
        ↓
middleware.ts intercepta
        ↓
supabase.auth.getUser()
        ↓
Não autenticado? → redirect /login
        ↓
Autenticado → busca profiles.empresa_id
        ↓
Sem empresa? → redirect /login
        ↓
Busca subscriptions.status
        ↓
status !== 'active'? → redirect /assinar
        ↓
Rota liberada → página renderiza
```

## 2.3 Fluxo de Requisições (Client-Side)

```
Componente React
    ↓
createClient() [lib/supabase/client.ts]
    ↓
Supabase JS SDK
    ↓
Supabase API (REST / Realtime)
    ↓
PostgreSQL com RLS ativado
    ↓
minha_empresa_id() filtra automaticamente
    ↓
Retorna apenas dados da empresa do usuário
```

## 2.4 Middleware (`src/middleware.ts`)

**Rotas públicas** (sem autenticação):
- `/login`, `/cadastro`, `/redefinir-senha`
- `/assinar` (página de planos)
- `/auth/callback`
- `/convite`
- `/` e `/landing` (landing page)

**Rotas protegidas**: todo o resto exige:
1. Sessão Supabase válida
2. `profiles.empresa_id` preenchido
3. `subscriptions.status === 'active'`

## 2.5 Padrões de Design Utilizados

| Padrão | Onde | Por quê |
|---|---|---|
| Multi-tenant por `empresa_id` | Todas as tabelas | Isolamento de dados por loja |
| RLS no banco | Supabase | Segurança server-side, sem depender do frontend |
| Hook customizado (`useEmpresaId`, `useSubscription`) | Componentes cliente | Centraliza lógica de contexto do usuário |
| Wrapper condicional (`ProOnly`) | Páginas Pro | Separa UI de lógica de plano |
| Server-side redirect (Middleware) | Next.js | Protege rotas antes de renderizar |
| Realtime subscription | Layout dashboard | Detecta usuário congelado/excluído |

## 2.6 Renderização

| Tipo | Onde |
|---|---|
| **Static** (SSG) | Maioria das páginas do dashboard (geradas em build) |
| **Dynamic** (SSR) | Rotas com parâmetro dinâmico (`[id]`) |
| **Client Component** | Todas as páginas que usam estado (`'use client'`) |
| **Middleware** | Proteção de rotas (Edge Runtime) |
