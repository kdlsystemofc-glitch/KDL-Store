# SEÇÃO 5 — FLUXOS, PERMISSÕES, SEGURANÇA E COMPONENTES

## 5.1 Fluxo de Cadastro de Novo Lojista

```
1. Usuário acessa /cadastro
2. Preenche: nome, email, senha, nome da loja
3. Supabase Auth cria auth.users com raw_user_meta_data = { nome, nome_loja }
4. Trigger handle_new_user dispara:
   a. Cria empresas (nome = nome_loja)
   b. Cria subscriptions (plano='start', status='active', preco=6500)
   c. Cria profiles (papel='admin', status='ativo')
   d. Trigger trg_formas_padrao insere 6 formas de pagamento
5. Middleware detecta sessão válida → /dashboard
6. Dashboard carrega dados do empresaId
```

## 5.2 Fluxo de Login

```
1. Usuário acessa /login
2. Preenche email e senha
3. supabase.auth.signInWithPassword()
4. Sessão criada (cookie httpOnly via Supabase SSR)
5. Middleware: getUser() → OK
6. Middleware: busca profiles.empresa_id → OK
7. Middleware: busca subscriptions.status → 'active'
8. Redirect → /dashboard
```

## 5.3 Fluxo de Recuperação de Senha

```
1. /redefinir-senha → usuário informa email
2. supabase.auth.resetPasswordForEmail()
3. Supabase envia email com magic link
4. Usuário clica no link → /auth/callback
5. /auth/callback processa token → cria sessão
6. Redirect → /redefinir-senha (com nova senha)
7. supabase.auth.updateUser({ password })
8. Redirect → /dashboard
```

## 5.4 Fluxo de Convite de Usuário

```
1. Admin acessa /configuracoes/usuarios
2. Clica "+ Convidar" → informa email, nome e papel
3. Cria registro em convites (token único, expira em 7 dias)
4. [Aviso]: Se a confirmação de email estiver desativada mas o SMTP do Supabase estiver ON, o email chega normalmente. Caso todo o SMTP esteja OFF, será necessário implementar fallback (cópia de link manual).
5. Convidado clica no link do email → /convite?token=...
6. Sistema valida token (status='pendente' E expira_em > NOW())
7. Convidado cria senha
8. Trigger handle_new_user detecta invite_token nos metadados:
   a. Associa ao empresa_id do convite
   b. Cria profile com papel do convite
   c. Marca convite como 'aceito'
9. Convidado acessa o sistema da empresa
```

## 5.5 Fluxo Completo de Venda (PDV)

```
ENTRADA:
  - Produtos com ativo=true e qtd_atual >= 0
  - Formas de pagamento com ativo=true

PROCESSO:
  1. Busca produto (nome/SKU/EAN ou câmera)
  2. Adiciona ao carrinho
  3. [Opcional] Ajusta qty, preço, brinde, série
  4. [Opcional] Seleciona tabela (Varejo/Atacado/VIP)
  5. [Opcional] Informa cliente
  6. Seleciona forma de pagamento
  7. [Opcional] Aplica desconto
  8. Clica FINALIZAR

SAÍDA (Transação Atômica no Banco via RPC):
  - O frontend chama `supabase.rpc('checkout_venda_transaction')`
  - O banco de dados (PostgreSQL) faz TUDO em uma única transação segura (ACID):
    ① INSERT vendas
    ② INSERT itens_venda e estoque_movimentacoes
    ③ INSERT fiados (se pagamento = Fiado, incluindo vencimento opcional)
    ④ INSERT garantias (se item tiver garantia e não for brinde)
  - Trigger atualizar_ultima_compra: UPDATE clientes.ultima_compra
  - Trigger decrementar_estoque_venda baixa o estoque

RESULTADO:
  - Tela de sucesso com número do recibo
  - Botões: Ver Recibo | + Nova Venda
```

## 5.6 Fluxo de Detecção de Usuário Congelado (Realtime)

```
Layout dashboard carrega → supabase.auth.getUser()
    ↓
Cria subscription Realtime no canal 'profile-status-{userId}'
    ↓
Escuta: postgres_changes em profiles WHERE id = userId
    ↓
Se UPDATE: status='congelado' OU status='excluido' OU empresa_id=null
    → signOut() + redirect /login
    ↓
Se DELETE do profile:
    → signOut() + redirect /login
```

---

## 5.7 Permissões e Papéis

### Papéis Disponíveis

| Papel | Quem é | Permissões |
|---|---|---|
| `admin` | Dono da loja / gestor | Tudo: CRUD completo, convidar usuários, ver financeiro, configurações |
| `operador` | Funcionário do caixa | PDV, estoque, clientes, garantias, OS, acionar fornecedor |
| `visualizador` | Contador / sócio passivo | Apenas visualização de dashboards e registros, sem botões de ação |

> **Nota**: O sistema possui Role-Based Access Control (RBAC) estruturado com componentes `<AdminOnly>` e `<OperadorOnly>`. A API, Sidebars e layouts verificam automaticamente a role do usuário no banco (`profiles.papel`).

### Controle de Acesso por Plano

Implementado via componente `<ProOnly>` e filtro no sidebar:

```typescript
// sidebar — itens filtrados por plano
[...startItems, ...(planoAtivo === 'pro' ? proItems : [])]

// página — conteúdo bloqueado
<ProOnly>
  {/* Conteúdo só visível para Pro */}
</ProOnly>
```

### Comportamento do `<ProOnly>`

```typescript
// src/components/ProOnly.tsx
// 1. Lê plano via useSubscription()
// 2. Se plano === 'pro': renderiza children normalmente
// 3. Se plano !== 'pro': retorna `null` 
//    - O conteúdo é completamente OMITIDO da tela.
//    - Não há blur, não há upsell poluindo a visão (a pedido do usuário).
```

---

## 5.8 Segurança

### Autenticação
- **Provedor**: Supabase Auth (email + senha)
- **Sessão**: Cookie httpOnly gerenciado pelo Supabase SSR
- **Refresh**: automático pelo Supabase SDK
- **Logout**: `supabase.auth.signOut()` → limpa cookie + redirect /login

### Proteção de Rotas
- **Middleware Next.js** (`src/middleware.ts`): Edge Runtime, executa antes do render
- Verifica: sessão válida + empresa_id + subscription ativa
- Rotas públicas não passam pelo middleware

### Isolamento de Dados (Multi-tenant)
- **RLS ativado** em todas as 19 tabelas
- `minha_empresa_id()` é `SECURITY DEFINER` — roda com permissão de superuser mas retorna apenas o empresa_id do usuário logado
- Mesmo que o frontend envie um `empresa_id` diferente, o banco rejeita via RLS

### Proteção no PDV (Fiado)
- Sistema verifica fiados em aberto antes de criar novo
- Bloqueia a finalização com mensagem: "Cliente já possui fiado em aberto"

### Upload de Imagens (Service Role via API Route)
- **Rota**: `POST /api/upload-logo` (`src/app/api/upload-logo/route.ts`)
- **Cliente**: `createAdminClient()` (`src/lib/supabase/admin.ts`) usando `SUPABASE_SERVICE_ROLE_KEY`
- **Fluxo**:
  1. Browser envia `multipart/form-data` para a rota Next.js
  2. A rota valida a sessão do usuário (anon key via cookies)
  3. Usa a **service role** para criar o bucket `logos` se não existir
  4. Faz o upload e retorna a URL pública
- **Por que não usar o cliente browser direto?** O bucket precisa de permissão de `service_role` para ser criado e a política RLS de INSERT pode não estar configurada para o usuário anon; a rota server-side evita expor a service role key ao browser
- **Variável necessária**: `SUPABASE_SERVICE_ROLE_KEY` no `.env.local` (nunca prefixar com `NEXT_PUBLIC_`)

---

## 5.9 Componentes Reutilizáveis

### `PageTabs` (`src/components/PageTabs.tsx`)
**Uso**: Navegação entre sub-páginas de um módulo (ex: `/financeiro`, `/financeiro/fiado`, etc.)

```typescript
<PageTabs tabs={[
  { label: 'DRE',       href: '/financeiro' },
  { label: 'Fiado',     href: '/financeiro/fiado' },
  { label: 'Despesas',  href: '/financeiro/despesas' },
  { label: 'Fechamento', href: '/financeiro/fechamento' },
]} />
```

**Comportamento**:
- Destaca a aba ativa com match **exato** (`pathname === tab.href`)
- Usa `Link` do Next.js (sem reload de página)
- Estilo: tab ativa = fundo verde + texto escuro; inativa = transparente

### `ProOnly` (`src/components/ProOnly.tsx`)
```typescript
<ProOnly>
  {/* Renderizado para Pro; overlay para Start */}
</ProOnly>
```

### `useEmpresaId` (`src/lib/useEmpresaId.ts`)
```typescript
const { empresaId, loading } = useEmpresaId()
// Retorna: empresa_id do usuário logado + estado de loading
// Usado em: TODOS os componentes que fazem query ao banco
```

### `useSubscription` (`src/hooks/useSubscription.ts`)
```typescript
const { plano, ativo, loading } = useSubscription()
// plano: 'start' | 'pro' | null
// ativo: boolean (status === 'active')
// Fonte: tabela subscriptions
```

### `BarcodeScannerModal` (`src/components/BarcodeScannerModal.tsx`)
- Usa `getUserMedia` para acessar câmera
- Detecta automaticamente se dispositivo tem câmera (`useHasCamera`)
- Lê EAN/QR Code via câmera
- Retorna código via callback `onScan(code: string)`

### `FormCliente` / `FormProduto` / `FormFornecedor`
- Formulários reutilizáveis
- Usados tanto em páginas dedicadas quanto em modais
- Props: `onSuccess()` e `onCancel()`

---

## 5.10 Landing Page (`/` e `/landing`)

**Arquivo**: `public/landing.html` (HTML estático)
**CSS**: `public/landing.css`
**JS**: `public/landing.js`
**Vídeo Hero**: `public/Hero-oficial.mp4`

**Roteamento**: configurado em `next.config.ts`:
```typescript
rewrites: [
  { source: '/',        destination: '/landing.html' },
  { source: '/landing', destination: '/landing.html' },
]
```

### Seções da Landing
1. **Hero** — vídeo de fundo, headline, CTA "Começar Grátis"
2. **Estatísticas** — números do sistema
3. **Funcionalidades** — cards dos módulos
4. **Planos** — Start vs Pro com preços
5. **Depoimentos** — clientes reais
6. **FAQ** — perguntas frequentes
7. **CTA Final** — "Criar conta grátis"
8. **Footer** — links, contato, redes sociais

---

## 5.11 Página de Assinaturas (`/assinar`)

**Arquivo**: `src/app/assinar/page.tsx`
**Layout**: `src/app/assinar/layout.tsx` (layout próprio, fullscreen, sem sidebar)

**Quando aparece**: Middleware redireciona para `/assinar` quando `subscriptions.status !== 'active'`

### Conteúdo
- Card comparativo Start (R$65) vs Pro (R$95)
- Lista de funcionalidades por plano
- CTA por plano
- Para usuários já autenticados: botão "Continuar com Start" ou "Fazer Upgrade"

---

## 5.12 CSS e Design System

**Arquivo principal**: `src/app/globals.css`
**Tokens**: `src/styles/design-tokens.css`

### Paleta de Cores (CSS Variables)
| Variável | Uso |
|---|---|
| `--verde` | Cor primária, CTAs, sucesso |
| `--verde-claro` | Fundo de hover, alertas info |
| `--vermelho` | Erros, alertas críticos |
| `--amarelo` | Avisos, plano Pro badge |
| `--roxo-escuro` | Fundo da sidebar |
| `--surface` | Fundo de cards |
| `--surface-alt` | Fundo alternado de tabelas |
| `--borda` | Bordas gerais |
| `--texto` | Texto principal |
| `--texto-sec` | Texto secundário |
| `--texto-desab` | Texto desabilitado |

### Classes Utilitárias Principais
| Classe | Uso |
|---|---|
| `.card` | Container com borda e fundo |
| `.btn.btn-primary` | Botão verde principal |
| `.btn.btn-secondary` | Botão neutro |
| `.btn.btn-ghost` | Botão transparente |
| `.campo` | Input de formulário |
| `.campo-label` | Label de formulário |
| `.pg-titulo` | Título de página (h1) |
| `.pg-sub` | Subtítulo de página |
| `.pg-header` | Container header de página |
| `.tabela-wrap` | Container de tabela com scroll |
| `.tabela` | Tabela estilizada |
| `.alerta.alerta-info` | Alerta azul informativo |
| `.alerta.alerta-perigo` | Alerta vermelho |
| `.alerta.alerta-aviso` | Alerta amarelo |
| `.status-ok` | Badge verde (ativo, pago) |
| `.status-neutro` | Badge cinza (inativo) |
| `.status-info` | Badge azul |

### Animações
- `.anim-fade`: desativada (era fade-in 0.15s, removida para UX de SPA)
- `.anim-pop`: entrada de modais e dropdowns (scale + fade)
- `.blink`: cursor piscante em estados de loading
- `spin`: rotação de ícones Loader2

---

## 5.13 Changelog Vivo

### v1.7.0 — 2026-05-26
- ✅ **Fix: Upload de Logo via API Server-Side**: O upload da logomarca do catálogo foi migrado de chamada direta ao Supabase Storage no browser para uma rota Next.js server-side (`POST /api/upload-logo`). A rota usa a `SUPABASE_SERVICE_ROLE_KEY` para criar automaticamente o bucket `logos` se não existir e realizar o upload sem depender de políticas RLS do cliente, eliminando o erro *"Bucket not found"*.
- ✅ **Admin Client**: Criado `src/lib/supabase/admin.ts` com `createAdminClient()` para uso exclusivo em rotas de servidor.

### v1.6.0 — 2026-05-26
- ✅ **Renovação Visual do Catálogo**: Lançamento de 3 templates de design premium (*Grid Moderno*, *Minimalista Clean*, *Luxo Escuro*).
- ✅ **Google Fonts Dinâmico**: Tipografias carregadas sob demanda do Google Fonts (*Inter*, *Poppins*, *Outfit*, *Playfair Display*).
- ✅ **Carrinho de Compras e WhatsApp Checkout**: Adicionado sistema completo de carrinho de compras flutuante com gaveta lateral, permitindo que os clientes finais finalizem pedidos estruturados de forma consolidada via API do WhatsApp.
- ✅ **Modal de Detalhes**: Pop-up interativo com zoom e descrição detalhada de produtos.
- ✅ **Preview Administrativo em Tempo Real**: Novo container interativo no painel de customização `/catalogo` que reproduz fielmente as opções do catálogo do cliente em tempo real ao alterar cores, layouts e fontes.
- ✅ **Migration SQL**: Script `patch_catalogo_v3.sql` gerado para fácil aplicação no editor do Supabase.

### v1.0.0 — 2026-05-15
- ✅ Sistema completo funcional em produção (Vercel)
- ✅ Sidebar filtrada por plano (Start não vê módulos Pro)
- ✅ `<ProOnly>` implementado em: Fiado, Fechamento, Sumidos, Comissões
- ✅ Painel "Como foi?" oculto para Start
- ✅ Atalhos Pro removidos do dashboard Start
- ✅ `PageTabs` com match exato (sem bug de múltiplas abas ativas)
- ✅ Animação `.anim-fade` desativada (navegação instantânea)
- ✅ Middleware sem bypass RSC (autenticação íntegra)
- ✅ Repositório limpo: removidos screenshots, docs antigas, scripts QA, SQLs fragmentados
- ✅ `database.sql` único e completo criado
- ✅ Vídeo Hero restaurado (foi removido por engano)
- ✅ Documentação viva criada (esta estrutura)
- ✅ Role-Based Access Control (RBAC) implementado (`<AdminOnly>`, `<OperadorOnly>`, `usePapel`)
- ✅ Relatórios avançados (DRE, Top Produtos, Formas de Pagamento, etc.)
- ✅ Exportação de Relatórios para CSV e visualização para Impressão

---

## 5.14 Roadmap e Pendências

### ✅ Concluído
- PDV com leitor de câmera
- Multi-preço (Varejo/Atacado/VIP)
- Fiado com bloqueio de duplicata
- Garantias automáticas
- CRM Sumidos com WhatsApp
- Comissões com ranking
- Catálogo online com Carrinho Integrado (v1.6.0)
- Ordens de Serviço
- Convite de usuários
- Segregação Start/Pro no sidebar e conteúdo

### ✅ Concluído (v1.1.0 e v1.2.0)
- Checkout Atômico: todas as vendas são seguras contra quedas de internet via RPC (Stored Procedure)
- Integração Total com Stripe (Assinatura, Upgrades, Downgrades com modal, Cancelamentos)
- Webhooks do Stripe configurados com falhas silenciosas corrigidas
- Catálogo online compartilhável (Link: /loja/[slug] e QR Code)
- Zona de Perigo protegida, evita remoção acidental de empresa

### 🚧 Em Andamento
- Envio real de email de convite (dependente do SMTP do Supabase)

### 📋 Planejado
- App mobile nativo (PWA ou React Native)
- Notificações push (fiado vencendo, estoque crítico)
- Integração WhatsApp API (além dos links `wa.me`)
- Painel administrativo global (gestão de todos os tenants)
- Exportação de relatórios em PDF
- Módulo de metas de vendas
- Dashboard do comissionado (link externo sem login)

### 🔒 Pendências Técnicas
- Rate limiting nas APIs (Supabase handles some, mas middleware pode reforçar)
- Testes automatizados (E2E com Playwright)
