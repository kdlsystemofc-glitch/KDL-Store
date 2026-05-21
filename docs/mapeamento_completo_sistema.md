# MAPEAMENTO COMPLETO DO SISTEMA — KDL STORE
**Versão:** 1.0  
**Gerado em:** 2026-05-20  
**Cobertura:** Landing Page · Auth · Dashboard · APIs · Middleware  
**Total de arquivos analisados:** ~55

---

> Este documento representa a fonte de verdade técnica do sistema KDL Store.
> Cada campo, botão, rota e conexão foi extraído diretamente do código-fonte.

---

## ÍNDICE
1. Estrutura Global (Sidebar + Layout)
2. Landing Page
3. Autenticação (Login, Cadastro, Redefinir Senha, Convite)
4. Assinatura (/assinar)
5. Dashboard Principal
6. PDV — Nova Venda
7. Histórico de Vendas
8. Detalhe de Venda
9. Produtos
10. Estoque
11. Catálogo Online
12. Clientes e Fornecedores
13. Clientes Inativos (PRO)
14. Fornecedores
15. Financeiro — DRE
16. Fiado
17. Despesas
18. Fechamento de Caixa
19. Garantias
20. Detalhe de Garantia
21. Ordens de Serviço
22. Nova OS
23. Detalhe OS
24. Comissões
25. Relatórios (PRO)
26. Configurações — Geral
27. Configurações — Empresa
28. Configurações — Usuários
29. Configurações — Formas de Pagamento
30. Configurações — Categorias
31. Configurações — Planos
32. Componentes Reutilizáveis
33. APIs e Rotas de Backend
34. Middleware
35. Mapa de Conexões
36. Mapa de Dados
37. Campos Faltando ou Inconsistentes

---

## 1. ESTRUTURA GLOBAL — SIDEBAR + LAYOUT (`/dashboard/*`)
**Plan:** Start + Pro  
**File:** `src/app/(dashboard)/layout.tsx`

### General Layout

O layout do dashboard envolve **todas** as páginas autenticadas. É composto por:
- **Sidebar** fixa à esquerda (230px de largura, fundo `var(--roxo-escuro)`)
- **Header** fixo no topo da área de conteúdo (48px de altura, fundo `var(--surface)`)
- **SubscriptionBanner** — banner condicional abaixo do header
- **`<main>`** com scroll vertical e padding `1.25rem 1.5rem`

Antes da montagem (`isMounted = false`), exibe uma **splash screen** centralizada com o logo "KDL Store" e o texto "Iniciando sistema..." sobre fundo `var(--roxo-escuro)`.

O layout é `'use client'`. Na montagem, busca via Supabase:
1. `profiles` → `nome`, `empresa_id`, `papel`
2. `empresas` → `nome`, `plano`

Esses dados alimentam a Sidebar. Um canal Realtime (`postgres_changes`) monitora o registro do usuário em `profiles`:
- Se `status = 'congelado'` ou `status = 'excluido'` ou `empresa_id = null` → faz `signOut()` e redireciona para `/login`.
- Se o registro for **deletado** (`DELETE`) → faz `signOut()` e redireciona para `/login`.

---

### Sidebar

#### Seção: Logo
- Texto "**K**DL Store" (K em verde itálico, "DL Store" em branco) como link para `/dashboard`.
- Botão `X` (ícone Lucide) visível apenas em mobile para fechar a sidebar (`lg:hidden`).

#### Seção: Nome da Loja + Plano
- Exibe `nomeLoja` (branco, truncado com ellipsis).
- Badge de plano:
  - **Plano Pro** → fundo `var(--amarelo)`, texto branco, label `"Plano Pro"`
  - **Plano Start** → fundo `rgba(0,191,165,0.2)`, texto `var(--verde)`, label `"Plano Start"`

#### Seção: Botão Nova Venda
- Visível **apenas para Operadores** (envolvido por `<OperadorOnly>`).
- Link para `/vendas/nova`.
- Aparência: fundo `var(--verde)`, texto branco, ícone `<Plus size={15} />`, texto **"Nova Venda"**.
- Fecha a sidebar no clique (`onClose`).

#### Seção: Navegação Principal

Itens de navegação são filtrados por regra: **Configurações** só aparece se `papel === 'admin'`.

Todos os itens abaixo são sempre renderizados (não há filtro por plano na sidebar — o bloqueio de acesso ocorre no Middleware):

| Label na Sidebar | Rota (`href`) | Ícone Lucide | Ativo quando... |
|---|---|---|---|
| Dashboard | `/dashboard` | `LayoutDashboard` | `pathname === '/dashboard'` |
| Histórico de Vendas | `/vendas` | `ShoppingCart` | pathname começa com `/vendas/` e não inclui `/nova` |
| Produtos / Estoque | `/produtos` | `Package` | pathname começa com `/produtos`, `/estoque` ou `/catalogo` |
| Clientes e Fornecedores | `/clientes` | `Users` | pathname começa com `/clientes` ou `/fornecedores` |
| Ops Extras | `/garantias` | `Shield` | pathname começa com `/garantias`, `/ordens-de-servico` ou `/comissoes` |
| Financeiro | `/financeiro` | `BarChart3` | pathname começa com `/financeiro` |
| Relatórios | `/relatorios` | `FileBarChart2` | pathname começa com `/relatorios` |
| Configurações | `/configuracoes` | `Settings` | pathname começa com `/configuracoes` (**somente `papel === 'admin'`**) |

> **Nota de plano:** Os itens "Financeiro" e "Relatórios" fazem parte do array `proItems` no código, mas **não são filtrados** na sidebar — o acesso é bloqueado via Middleware. Isso significa que usuários Start verão os links mas serão redirecionados ao clicar.

Estado visual dos links:
- **Ativo:** fundo `rgba(0,191,165,0.15)`, cor `var(--verde)`
- **Inativo:** fundo transparente, cor `rgba(240,235,245,0.55)`
- **Hover (inativo):** fundo `rgba(255,255,255,0.05)`

#### Seção: Rodapé da Sidebar
- Avatar circular (32×32px, fundo `var(--verde)`) exibindo a inicial do usuário (`inicialUsuario`).
- Nome da loja (pequeno, truncado).
- Botão de **Logout** (ícone `<LogOut size={15} />`):
  - Texto `title="Sair"`
  - Ação: chama `supabase.auth.signOut()` e redireciona para `/login`.

---

### Header (topo da área de conteúdo)
- Altura: 48px, fundo `var(--surface)`, borda inferior `var(--borda)`.
- **Botão hamburger** (ícone `<Menu size={18} />`): visível apenas em mobile (`lg:hidden`), abre a sidebar.
- **Nome da loja** exibido à direita (oculto em telas pequenas: `hidden sm:block`), estilo muted.

---

### SubscriptionBanner (componente)

Componente renderizado entre o header e o `<main>`. Consome o hook `useSubscription`. Exibe banners condicionais:

| Condição | Cor de fundo | Texto | Botão |
|---|---|---|---|
| `status === 'past_due'` | `#FF4C4C` (vermelho) | 🚨 Pagamento recusado. Atualize seu cartão para não perder o acesso. | "Atualizar Cartão (Stripe)" / "Aguarde..." |
| `cancel_at_period_end === true` E `current_period_end` existe | `#FFB800` (amarelo) | ⚠️ Sua assinatura será encerrada em {data}. Clique aqui para reativar. | "Reativar Assinatura (Stripe)" / "Aguarde..." |
| Nenhuma das condições | — | (não renderiza nada) | — |

**Ação do botão em ambos os casos:** chama `POST /api/stripe/portal` com `{ empresaId }`, recebe `{ url }` e redireciona `window.location.href = url` (Stripe Customer Portal).

---

### Alerts and Special States
- **Splash screen:** Exibida enquanto o componente não está montado. Logo KDL Store + "Iniciando sistema...".
- **Overlay mobile:** Div semi-transparente `rgba(0,0,0,0.5)` que aparece sobre o conteúdo quando a sidebar está aberta em mobile; clicar fecha a sidebar.
- **Congelamento/Exclusão de conta:** Via Realtime, o sistema faz logout automático se o status do perfil mudar para `congelado`, `excluido` ou se `empresa_id` for removido.

---

### Connections to Other Modules
- Lê: `profiles` (Supabase) → `nome`, `empresa_id`, `papel`
- Lê: `empresas` (Supabase) → `nome`, `plano`
- Chama: `POST /api/stripe/portal` (gerenciamento de assinatura via Stripe)
- Redireciona para: `/login` (logout / congelamento), `/vendas/nova` (botão Nova Venda)
- Usa hook: `useSubscription` (de `@/hooks/useSubscription`)
- Usa componente: `<OperadorOnly>` (de `@/components/OperadorOnly`)

---

## 2. LANDING PAGE (`/landing.html`)
**Plan:** N/A — página pública  
**File:** `public/landing.html`

### General Layout

Página HTML estática servida diretamente. Usa fontes Google Fonts (`Nunito` 700/800/900 e `Nunito Sans` 400/500/600/700/800). Carrega vídeo hero `/Hero-oficial.mp4` com `preload`, poster `/hero-poster.jpg`. Folha de estilos: `landing.css`. Script: `landing.js`. Meta description: "PDV, estoque, fiado, garantias e CRM em um só lugar. Feito para o comércio popular brasileiro. Comece por R$ 65/mês."

Estrutura de seções:
1. `<header>` — Navegação principal (nav)
2. `<section id="home">` — Hero com vídeo
3. `<section id="problema">` — Comparação (sem vs com KDL Store)
4. `<section class="stats-bar">` — Estatísticas animadas
5. `<section id="modulos">` — Grade de módulos do sistema
6. `<section id="planos">` — Planos e preços
7. `<section id="depoimentos">` — Depoimentos de clientes
8. `<section class="cta-final">` — CTA final
9. `<footer>` — Rodapé

---

### Page Header (Navegação)

| Item | Tipo | Destino |
|---|---|---|
| Logo "KDL Store" (K verde, "DL Store" texto) | Link âncora | `#` (topo da página) |
| Funcionalidades | Link âncora | `#problema` |
| Planos | Link âncora | `#planos` |
| Depoimentos | Link âncora | `#depoimentos` |
| Entrar no sistema | Botão/Link CTA | `/login` |
| Hamburger (mobile) | Botão `id="navToggle"` | Abre/fecha `#navLinks` |

---

### KPIs / Summary Cards — Seção Hero

Badge: "🇧🇷 Feito para o comércio brasileiro"  
Título: "Gerencie sua loja **como nunca antes.**"  
Subtítulo: "O sistema de gestão feito para lojistas de rua. PDV, estoque, fiado, garantias e CRM — tudo no celular."

**Botões Hero:**

| Texto | Tipo | Destino |
|---|---|---|
| "Começar agora — R$ 65/mês" | `btn-primary` | `/cadastro` |
| "Ver funcionalidades ↓" | `btn-secondary` | `#problema` |

**Stats Animadas (Hero):** Usam atributos `data-target`, `data-prefix`, `data-suffix` para animação via `landing.js`:

| Número | Label |
|---|---|
| 500+ | lojas ativas |
| R$ 2M+ | processados |
| 98% | satisfação |
| Zero | papel |

---

### Seção Problema (Diagnóstico Honesto)

Eyebrow: "Diagnóstico honesto"  
Título: "Você ainda controla sua loja assim?"  
Intro: "A maioria dos lojistas de rua ainda usa caderno, papelzinho e memória..."

**Tabela de comparação — "Sem o KDL Store" (lado esquerdo, ícone 😓):**

| Problema | Stat exibida |
|---|---|
| Controla estoque no caderno | → Média de 3 produtos zerados por semana sem perceber |
| Emite garantia em papel | → 67% dos papéis de garantia se perdem no primeiro mês |
| Não sabe se lucrou | → 8 em 10 lojistas não sabem a margem real dos produtos |
| Cliente some sem aviso | → Reconquistar cliente custa 5x menos que buscar um novo |
| Puxador sem controle | → Média de R$340/mês perdidos em comissões não calculadas |
| Produto zera no meio da semana | → Perda média de R$180 por produto zerado não reposto |

**Tabela de comparação — "Com o KDL Store" (lado direito, ícone 🚀):**

| Solução | Benefício |
|---|---|
| Estoque em tempo real com alerta automático | → Nunca mais perde venda por produto zerado |
| Garantia digital com QR Code imprimível | → Histórico completo, cliente nunca perde o comprovante |
| Painel "Como foi?" — lucro em 30 segundos | → DRE, faturamento e despesas num único painel |
| CRM avisa e abre WhatsApp do cliente sumido | → Recupera clientes que você achava perdidos |
| Comissão calculada automaticamente por venda | → Sem briga, sem "combinado de boca" |
| Alerta imediato + pedido direto ao fornecedor | → Reposição antes do cliente perceber a falta |

---

### Seção Stats Bar (Números do KDL Store)

Frase: "O KDL Store já está dentro de centenas de lojas."

| Número | Label |
|---|---|
| 500+ | lojas ativas |
| R$ 2M+ | em vendas processadas |
| 98% | de satisfação |
| Zero | papel necessário |

Todos animados via `data-target`, `data-prefix`, `data-suffix`.

---

### Seção Módulos ("Por dentro do sistema")

Eyebrow: "Por dentro do sistema"  
Título: "Tudo que sua loja precisa. Num só lugar."  
Sub: "12 módulos integrados, feitos para o ritmo do comércio de rua."

| Ícone | Módulo | Badge PRO? | Benefício principal |
|---|---|---|---|
| 🛒 | PDV — Frente de Caixa | Não | Fecha uma venda em menos de 30 segundos |
| 📊 | Painel "Como foi?" | **PRO** | Resultado do dia em 30 segundos, sem planilha |
| 📦 | Produtos & Estoque | Não | Nunca mais perde venda por produto zerado |
| 👥 | CRM de Clientes Sumidos | **PRO** | Recupera clientes que você achava perdidos |
| 💰 | Financeiro Completo | Não | Sabe exatamente onde o dinheiro vai |
| 🛡️ | Garantias Digitais | Não | Chega de papelzinho colado no produto |
| 🎯 | Comissões de Puxadores | **PRO** | Fim do combinado de boca que vira briga |
| 📒 | Fiado com Cobrança Facilitada | **PRO** | Cobra sem constrangimento, recebe mais rápido |
| 📱 | Catálogo com QR Code | Não | Vende mesmo quando a loja está fechada |
| 🔧 | Ordens de Serviço | Não | Organiza o pós-venda sem papel |
| 📈 | Relatórios | **PRO** | Decisões baseadas em número, não em achismo |
| ⚙️ | Multi-usuário | **PRO** | Delega sem perder o controle |

---

### Seção Planos

Eyebrow: "Preços"  
Título: "Simples e sem surpresa."  
Sub: "Sem contrato de fidelidade. Cancele quando quiser."

**Plano Start:**
- Posição: card sem destaque
- Tagline: "Comece com o essencial."
- Público: "Para lojistas que querem sair do caderno"
- Preço: **R$ 65/mês**
- Capacidade: por loja · 1 usuário
- Funcionalidades listadas:
  - PDV com leitor de código de barras
  - Estoque em tempo real
  - Garantias digitais
  - Catálogo com QR Code
  - Recibo imprimível
  - 1 usuário
- Botão: **"Começar com Start"** → `/cadastro?plano=start` (estilo `plan-cta-outline`)

**Plano Pro:**
- Posição: card destacado (`plan-featured`), badge "⭐ MAIS ESCOLHIDO"
- Tagline: "Tudo que sua loja precisa para crescer."
- Público: "Quem quer gestão completa"
- Preço: **R$ 95/mês**
- Capacidade: por loja · até 5 usuários
- Funcionalidades listadas:
  - Tudo do Start
  - Painel "Como foi?" + envio por WhatsApp
  - CRM de Clientes Sumidos
  - Comissões de puxadores
  - DRE completo
  - Fiado com cobrança facilitada via WhatsApp
  - Fechamento de caixa
  - Até 5 usuários
- Botão: **"Começar com Pro"** → `/cadastro?plano=pro` (estilo `plan-cta-solid`)

Nota abaixo dos planos: "Sem contrato de fidelidade. Cancele quando quiser. Suporte via WhatsApp."

---

### Seção Depoimentos

Eyebrow: "Clientes"  
Título: "Quem usa, não volta atrás."

| Avatar | Nome | Segmento | Depoimento (5 estrelas) |
|---|---|---|---|
| C | Carlos M. | Loja de Som Automotivo | "Antes eu controlava tudo em caderno. Hoje sei exatamente quanto lucrei essa semana. O painel 'Como foi?' mudou minha vida." |
| J | Juliana P. | Moda Feminina | "Meus clientes sumidos voltaram depois que comecei a mandar WhatsApp pelo sistema. Recuperei R$ 4.000 em um mês." |
| R | Roberto S. | Eletrônicos e Acessórios | "O leitor de código de barras no celular é incrível. Bipo e já vai pro carrinho. Economizo meia hora por dia." |

---

### Seção CTA Final

Título: "Sua loja merece um sistema de verdade."  
Subtítulo: "Comece hoje por R$ 65/mês. Sem contrato, sem complicação."  
Botão: **"Criar minha conta grátis →"** → `/cadastro` (classe `cta-btn`)

---

### Rodapé (Footer)

| Link | Destino |
|---|---|
| Planos | `#planos` |
| Funcionalidades | `#problema` |
| Suporte via WhatsApp | `https://wa.me/5511910000000` (target `_blank`, `rel="noopener"`) |
| Entrar | `/login` |

Texto: © 2026 KDL Store. Todos os direitos reservados.  
Tagline: "Feito para o comércio brasileiro 🇧🇷"

---

### Connections to Other Modules
- `/cadastro` (com e sem query string `?plano=start` ou `?plano=pro`)
- `/login`
- Suporte via WhatsApp: `https://wa.me/5511910000000`

---

## 3. AUTENTICAÇÃO

### 3.1 — Login (`/login`)
**Plan:** N/A — rota pública  
**File:** `src/app/(auth)/login/page.tsx`

#### General Layout

Página renderizada dentro do layout `(auth)` (não documentado nesta fase, mas envolve um card centralizado). Conteúdo principal: título, subtítulo, formulário de login, recuperação de senha inline, e link para cadastro.

#### Page Header
- Título: **"Entrar na plataforma"** (Nunito, 800, 1.3rem)
- Subtítulo: "Digite suas credenciais para acessar o sistema" (muted, 0.85rem)

#### Forms and Modals — Formulário de Login

| Campo | Label na Tela | Tipo | Placeholder | Obrigatório | Validação |
|---|---|---|---|---|---|
| `email` | E-mail | `email` | `seu@email.com` | Sim | HTML5 `required` + verificação JS: campo não vazio |
| `senha` | Senha | `password` / `text` (toggle) | `••••••••` | Sim | HTML5 `required` + verificação JS: campo não vazio |

**Botões do formulário principal:**

| Texto | Ação | Navega para |
|---|---|---|
| "Ver" / "Ocultar" | Alterna visibilidade da senha (`showPwd`) | — |
| "Esqueci minha senha" | Exibe/oculta painel de recuperação inline (`showRec`) | — |
| "Verificando..." / **"Entrar no sistema"** | `type="submit"` — chama `supabase.auth.signInWithPassword({ email, password })` | `/dashboard` (em sucesso) |

#### Forms and Modals — Recuperação de Senha (inline, condicional)

Exibido abaixo do campo Senha quando `showRec === true`. Título: "Recuperar acesso".

| Campo | Label na Tela | Tipo | Placeholder | Obrigatório | Validação |
|---|---|---|---|---|---|
| `emailRec` | — (sem label) | `email` | `Seu e-mail` | Sim (JS) | Campo não vazio |

**Botão:**

| Texto | Ação | Navega para |
|---|---|---|
| "Enviando..." / **"Enviar link de recuperação"** | Chama `supabase.auth.resetPasswordForEmail(emailRec, { redirectTo: origin + '/auth/callback?next=/redefinir-senha' })` | — (exibe mensagem de feedback) |

#### Alerts and Special States

| Estado | Aparência | Mensagem |
|---|---|---|
| Erro de login (campo vazio) | Borda laranja, fundo `#fdf2f1` | "Preencha e-mail e senha." |
| Erro de login (e-mail não confirmado) | Borda laranja, fundo `#fdf2f1` | "Confirme seu e-mail antes de entrar." |
| Erro de login (credenciais incorretas) | Borda laranja, fundo `#fdf2f1` | "E-mail ou senha incorretos." |
| Recuperação — campo vazio | Inline no painel de recuperação (laranja) | "Preencha o e-mail." |
| Recuperação — erro da API | Inline (laranja) | `error.message` do Supabase |
| Recuperação — sucesso | Inline (verde) | "Link enviado. Verifique sua caixa de entrada." (fecha o painel após 8s) |
| Botão submit carregando | `disabled`, opacidade 0.7, cursor `not-allowed` | Texto "Verificando..." |

#### Connections to Other Modules
- **Link "Criar conta"** → `/cadastro`
- **Pós-login** → `/dashboard` (+ `router.refresh()`)
- **Recuperação de senha** → envia email com link para `/auth/callback?next=/redefinir-senha`
- Supabase: `auth.signInWithPassword`, `auth.resetPasswordForEmail`

---

### 3.2 — Cadastro (`/cadastro`)
**Plan:** N/A — rota pública  
**File:** `src/app/(auth)/cadastro/page.tsx`

#### General Layout

Página dentro do layout `(auth)`. Dois estados visuais: formulário de cadastro (padrão) e tela de sucesso pós-cadastro.

#### Page Header
- Título: **"Criar sua conta"** (Nunito, 800, 1.3rem)
- Subtítulo: "Preencha os dados abaixo para começar" (muted, 0.85rem)
- Badges de features (fundo verde claro): ✓ PDV completo · ✓ Estoque real-time · ✓ Garantias digitais · ✓ Suporte WhatsApp

#### Forms and Modals — Formulário de Cadastro

| Campo | Label na Tela | Tipo | Placeholder | Obrigatório | Validação |
|---|---|---|---|---|---|
| `nomeLoja` | Nome da sua loja * | `text` | `Ex: Eletrônicos do João` | Sim | JS: campo não vazio |
| `tipo` | Tipo de negócio * | `select` | "Selecione seu negócio..." | Sim | JS: campo não vazio |
| `email` | E-mail * | `email` | `seu@email.com` | Sim | JS: campo não vazio |
| `senha` | Senha * | `password` / `text` (toggle) | `Mínimo 8 caracteres` | Sim | JS: ≥8 chars, 1 maiúscula, 1 número |
| `confirmar` | Confirmar senha * | `password` / `text` (toggle) | `Repita a senha` | Sim | JS: igual ao campo `senha` |

**Opções do select "Tipo de negócio":**

| Valor | Label exibida |
|---|---|
| `` (vazio) | Selecione seu negócio... |
| `eletronicos` | 🔊 Eletrônicos / Som Automotivo |
| `acessorios` | 🚗 Acessórios para Veículos |
| `roupas` | 👕 Roupas e Calçados |
| `alimentacao` | 🍕 Alimentação |
| `papelaria` | 📚 Papelaria / Livraria |
| `geral` | 🏪 Comércio Geral |
| `outro` | Outro |

**Indicador de força da senha (exibido quando `senha.length > 0`):**

| Critério | Label | Cor quando atendido |
|---|---|---|
| `senha.length >= 8` | 8+ chars | `var(--verde)` |
| `/[A-Z]/.test(senha)` | Maiúscula | `var(--verde)` |
| `/[0-9]/.test(senha)` | Número | `var(--verde)` |

(Critério não atendido: cor `var(--muted)`, ícone `○`; atendido: ícone `✓`)

**Indicador de confirmação:** Se `confirmar` não vazio E `confirmar !== senha`, o campo de confirmação exibe borda `var(--laranja)` e texto "As senhas não coincidem" abaixo.

**Botões:**

| Texto | Ação | Navega para |
|---|---|---|
| "Ver" / "Ocultar" | Alterna visibilidade de senha e confirmação | — |
| "Criando conta..." / **"Criar minha conta"** | `type="submit"` — valida e chama `supabase.auth.signUp({ email, password, options: { data: { nome_loja, tipo_negocio } } })` | Nenhuma (mostra tela de sucesso) |

**Texto legal abaixo do botão:** "Ao criar sua conta você concorda com os **Termos de Uso** e **Política de Privacidade**" (spans com cursor pointer, sem link real implementado no código).

#### Alerts and Special States

| Estado | Aparência | Mensagem |
|---|---|---|
| Campo(s) vazio(s) | Borda laranja, fundo `#fdf2f1` | "Preencha todos os campos." |
| Senhas não coincidem (validação JS) | Borda laranja, fundo `#fdf2f1` | "As senhas não coincidem." |
| Senha fraca | Borda laranja, fundo `#fdf2f1` | "Senha fraca. Use 8+ caracteres, 1 maiúscula e 1 número." |
| Erro da API Supabase | Borda laranja, fundo `#fdf2f1` | `error.message` do Supabase |
| Botão carregando | `disabled`, fundo `var(--muted)`, cursor `not-allowed` | Texto "Criando conta..." |

#### Tela de Sucesso (após cadastro bem-sucedido)

Exibida quando `sucesso === true`:
- Emoji 📧 grande
- Título: **"Verifique seu e-mail!"**
- Texto: "Enviamos um link de confirmação para **{email}**. Clique no link para ativar sua conta."
- Box de alerta verde: "✉️ Verifique também a pasta de spam."
- Botão/Link: **"Ir para o Login →"** → `/login`

#### Connections to Other Modules
- **Link "Entrar no sistema"** → `/login`
- **Pós-sucesso** → `/login`
- Supabase: `auth.signUp` com `metadata: { nome_loja, tipo_negocio }` (usado por trigger do banco para criar `empresa` e `profile`)

---

### 3.3 — Redefinir Senha (`/redefinir-senha`)
**Plan:** N/A — rota pública (acessada via link de email)  
**File:** `src/app/(auth)/redefinir-senha/page.tsx`

#### General Layout

Página dentro do layout `(auth)`. Acessada após o usuário clicar no link de redefinição enviado pelo email. Dois estados: formulário (padrão) e tela de sucesso.

#### Page Header
- Título: **"Nova Senha"** (sans-serif, 900, 1.75rem, cor `#1a1a1a`)
- Subtítulo: "Digite sua nova senha abaixo" (cor `#6b7280`, 0.9rem)

#### Forms and Modals — Formulário de Redefinição

| Campo | Label na Tela | Tipo | Placeholder | Obrigatório | Validação |
|---|---|---|---|---|---|
| `senha` | Nova Senha | `password` | `Mínimo de 6 caracteres` | HTML5 `required` | JS: `senha.length >= 6` |
| `confirma` | Confirme a Senha | `password` | `Repita a senha` | HTML5 `required` | JS: `senha === confirma` |

**Botões:**

| Texto | Ação | Navega para |
|---|---|---|
| "Salvando..." / **"Salvar nova senha"** | `type="submit"` — chama `supabase.auth.updateUser({ password: senha })` | `/dashboard` (após 2s, em sucesso) |

#### Alerts and Special States

| Estado | Aparência | Mensagem |
|---|---|---|
| Senha muito curta | Fundo `#fef2f2`, borda `#fca5a5`, texto `#dc2626` | "⚠️ A senha deve ter no mínimo 6 caracteres." |
| Senhas não conferem | Fundo `#fef2f2`, borda `#fca5a5`, texto `#dc2626` | "⚠️ As senhas não conferem." |
| Erro da API Supabase | Fundo `#fef2f2`, borda `#fca5a5`, texto `#dc2626` | "⚠️ {error.message}" |
| Botão carregando | `disabled`, fundo `#6b7280`, cursor `not-allowed` | Texto "Salvando..." |

#### Tela de Sucesso (após redefinição bem-sucedida)

Exibida quando `sucesso === true`:
- Emoji ✅ (3rem)
- Texto verde (`#15803d`, 800): **"Senha atualizada com sucesso!"**
- Texto muted: "Redirecionando para o painel..."
- Redireciona automaticamente para `/dashboard` após 2 segundos.

#### Connections to Other Modules
- **Pós-sucesso** → `/dashboard` (após 2s + `router.refresh()`)
- Supabase: `auth.updateUser` (requer sessão ativa com token de redefinição)
- Acesso via: link de email gerado por `auth.resetPasswordForEmail` (rota `/auth/callback?next=/redefinir-senha`)

---

### 3.4 — Convite (`/convite`)
**Plan:** N/A — rota semi-pública (requer token válido na query string)  
**File:** `src/app/convite/page.tsx`

#### General Layout

Página independente (fora do layout `(auth)` e do `(dashboard)`). Fundo `var(--fundo)`, conteúdo centralizado, largura máxima 420px. Quatro estados: `loading`, `form` (válido), `form` (inválido), `success`.

**Logo:** "NexoCommerce" (texto verde, 1.5rem, 900) + "Sistema de Gestão para Lojas" (texto desabilitado). ⚠️ *Inconsistência: o logo exibe "NexoCommerce" em vez de "KDL Store".*

#### Page Header
- Estado `loading`: Spinner (`<Loader2>` animado) + "Verificando convite..."
- Estado válido: 🎉 **"Você foi convidado!"** + "Crie sua senha para acessar o sistema"

**Leitura do token:** Na montagem, lê `?token=` da URL. Consulta tabela `convites` filtrando por:
- `token = <valor>` 
- `status = 'pendente'`
- `expira_em > now()`

Se não encontrado → estado inválido.

#### Forms and Modals — Formulário de Criação de Conta (estado válido)

**Info do convite (exibida acima do form):**
- Email do convidado (📧 `{convite.email}`)
- Descrição do papel (mapeado de DB para UI):
  - `admin` (DB) / `admin` (UI) → "Administrador — acesso total"
  - `operador` (DB) / `vendedor` (UI) → "Vendedor — vendas e clientes"
  - `visualizador` (DB) / `estoquista` (UI) → "Estoquista — produtos e estoque"

| Campo | Label na Tela | Tipo | Placeholder | Obrigatório | Validação |
|---|---|---|---|---|---|
| `nome` | Seu Nome Completo | `text` | `Ex: João da Silva` | JS: campo não vazio (`trim()`) | `nome.trim()` não vazio |
| `senha` | Criar Senha * | `password` | `Mínimo 6 caracteres` | JS | `senha.length >= 6` |
| `confirm` | Confirmar Senha * | `password` | `Repita a senha` | JS | `senha === confirm` |

**Botões:**

| Texto | Ação | Navega para |
|---|---|---|
| `<Loader2>` "Criando conta..." / **"🔓 Criar Conta e Entrar"** | Chama `supabase.auth.signUp({ email: convite.email, password: senha, options: { data: { convite_token, nome } } })` | `/dashboard` (após 3s, em sucesso) |
| **"Ir para o Login"** | Link (estado inválido) | `/login` |
| **"Fazer login"** | Link no rodapé da página | `/login` |

#### Alerts and Special States

| Estado | Aparência | Mensagem |
|---|---|---|
| `loading` | Spinner centralizado | "Verificando convite..." |
| Token inválido/expirado | `<XCircle>` vermelho (48px) centralizado | "Convite inválido ou expirado" + "Este link de convite não existe ou já foi utilizado. Solicite um novo convite ao administrador da loja." |
| Nome vazio | `alerta alerta-perigo` (div de erro) | "Informe seu nome." |
| Senha curta | `alerta alerta-perigo` | "A senha deve ter pelo menos 6 caracteres." |
| Senhas diferentes | `alerta alerta-perigo` | "As senhas não coincidem." |
| Convite nulo | `alerta alerta-perigo` | "Convite inválido." |
| Erro da API | `alerta alerta-perigo` | `error.message` do Supabase |

#### Tela de Sucesso

Quando `step === 'success'`:
- `<CheckCircle>` verde (48px) centralizado
- Texto bold: **"Conta criada com sucesso!"**
- Texto muted: "Redirecionando para o sistema..."
- Spinner verde `<Loader2>` centralizado
- Redireciona para `/dashboard` após 3 segundos.

> **Nota técnica:** O comentário no código indica que o trigger `handle_new_user` do Supabase é responsável por criar o `profile` com `empresa_id` e `papel` corretos baseado no `convite_token` passado nos metadados.

#### Connections to Other Modules
- Lê: tabela `convites` (`token`, `email`, `nome`, `papel`, `status`, `expira_em`)
- Cria usuário via: `supabase.auth.signUp` (trigger do banco processa o convite)
- **Pós-sucesso** → `/dashboard` (após 3s)
- Link: `/login`

---

## 4. ASSINATURA (`/assinar`)
**Plan:** N/A — exibida a usuários logados SEM assinatura ativa, ou escolha inicial  
**File:** `src/app/assinar/page.tsx`

### General Layout

Página standalone (fora do layout dashboard). Conteúdo centralizado (`textAlign: center`). Usa `<Suspense>` para lidar com `useSearchParams`. Exibe logo KDL Store, título, subtítulo e grade 2 colunas com os planos.

**Query strings lidas:**
- `?plano=start` ou `?plano=pro` → pré-seleciona o plano (altera texto do botão e cor do card)
- `?motivo=inadimplente` → exibe banner vermelho de pagamento recusado
- `?motivo=cancelado` → exibe banner amarelo de assinatura cancelada
- `?mudar_plano` → permite usuário com assinatura ativa acessar a página (sem redirecionamento pelo Middleware)

### Page Header
- Logo: "**K**DL Store" (K verde itálico, "DL Store" texto)
- Título dinâmico:
  - Se `planoParam = 'pro'`: **"Você escolheu o plano Pro ⭐"**
  - Se `planoParam = 'start'`: **"Você escolheu o plano Start"**
  - Sem parâmetro: **"Escolha seu plano"**
- Subtítulo: "Sem contrato. Cancele quando quiser." (muted, 0.88rem)

### Alerts and Special States (Banners contextuais)

| Condição (`?motivo=`) | Cor | Mensagem |
|---|---|---|
| `inadimplente` | `#FF4C4C` (vermelho) | 🚨 Seu pagamento falhou. Atualize seu cartão ou assine novamente para continuar. |
| `cancelado` | `#FFB800` (amarelo, texto `#111`) | ⚠️ Sua assinatura foi cancelada. Assine novamente para recuperar seu acesso. |
| Erro de rede/API | Borda laranja, fundo `#fdf2f1` | `erro` (string do estado) |

Erros específicos capturados:
- Sessão expirada: "Sessão expirada. Faça login novamente."
- Perfil não encontrado: "Perfil não encontrado."
- Assinatura já ativa (HTTP 400, `data.error.includes('assinatura ativa')`): redireciona para `/configuracoes/planos`
- Erro de rede: "Erro de rede ao conectar com Stripe."
- Erro genérico: `data.error || 'Erro ao processar pagamento.'`

### KPIs / Summary Cards — Grade de Planos

**Plano Start (coluna esquerda):**
- Nome: **Start**
- Público: "Para lojistas que querem sair do caderno"
- Tagline: *"Comece com o essencial."*
- Preço: **R$ 65/mês**
- Capacidade: por loja · 1 usuário
- Funcionalidades:
  - PDV com leitor de código de barras
  - Estoque em tempo real
  - Garantias digitais
  - Catálogo com QR Code
  - Recibo imprimível
  - 1 usuário
- Botão:
  - Sem `planoParam`: **"Começar com Start"** (contorno roxo)
  - Com `planoParam = 'start'`: **"▶ Confirmar plano Start"** (preenchido roxo)
  - Com `planoParam = 'pro'`: **"Começar com Start"** (contorno roxo, opacidade reduzida)
  - Carregando: **"Ativando..."**

**Plano Pro (coluna direita, destaque):**
- Badge: "⭐ MAIS ESCOLHIDO" (fundo `var(--amarelo)`)
- Nome: **Pro**
- Público: "Quem quer gestão completa"
- Tagline: *"Tudo que sua loja precisa para crescer."*
- Preço: **R$ 95/mês**
- Capacidade: por loja · até 5 usuários
- Funcionalidades:
  - Tudo do Start
  - Painel "Como foi?" + WhatsApp
  - CRM de Clientes Sumidos
  - Comissões de puxadores
  - DRE completo
  - Fiado com cobrança automática
  - Fechamento de caixa
  - Até 5 usuários
- Botão:
  - Sem `planoParam`: **"Começar com Pro"** (verde sólido)
  - Com `planoParam = 'pro'`: **"▶ Confirmar plano Pro"** (verde sólido)
  - Com `planoParam = 'start'`: **"Começar com Pro"** (opacidade reduzida)
  - Carregando: **"Ativando..."**

**Nota abaixo:** "Sem contrato de fidelidade. Cancele quando quiser. Suporte via WhatsApp."

### Forms and Modals — Ação de Assinatura

Não há formulário com campos. A ação é disparada pelo clique nos botões de plano:

1. Verifica usuário logado via `supabase.auth.getUser()`
2. Busca `empresa_id` do usuário em `profiles`
3. Faz `POST /api/stripe/checkout` com `{ plano, empresaId }`
4. Recebe `{ url }` e redireciona `window.location.href = url` (Stripe Checkout)

### Connections to Other Modules
- Lê: `profiles` → `empresa_id`
- Chama: `POST /api/stripe/checkout`
- Redireciona para: Stripe Checkout (externo) em sucesso
- Redireciona para: `/configuracoes/planos` se já tem assinatura ativa
- Redireciona de: Middleware (usuários sem assinatura ou inadimplentes)

---

## 34. MIDDLEWARE
**File:** `src/middleware.ts`

### Descrição Geral

Middleware Next.js que intercepta **todas** as requisições (exceto assets estáticos). Executa em sequência quatro camadas de verificação: rotas públicas → configuração Supabase → autenticação → assinatura.

### Matcher (Rotas Interceptadas)

O middleware processa tudo, **exceto**:
```
_next/static, _next/image, favicon.ico
Extensões: html, css, js, svg, png, jpg, jpeg, gif, webp, mp4, webm, ogg, mp3, wav, woff, woff2, ttf, otf, ico, xml, txt, pdf, json
```

---

### Verificação 1 — Rotas 100% Públicas (sem auth)

| Rota | Comportamento |
|---|---|
| `/` | Passa diretamente (`NextResponse.next()`) |
| `/login` | Passa diretamente |
| `/cadastro` | Passa diretamente |
| `/redefinir-senha` | Passa diretamente (e qualquer sub-rota: `/redefinir-senha/...`) |
| `/garantia` | Passa diretamente (e qualquer sub-rota) |
| `/landing` | Passa diretamente (e qualquer sub-rota) |
| `/landing.html` | Passa diretamente (match exato, sem sub-rotas) |

**Lógica de match:** `pathname === r` OU (`r !== '/'` E `r !== '/landing.html'` E `pathname.startsWith(r)`). Isso significa que `/redefinir-senha/qualquercoisa` também é público, mas `/landing.html/qualquercoisa` não é.

---

### Verificação 2 — Dev Mode (Supabase não configurado)

Se `NEXT_PUBLIC_SUPABASE_URL` ou `NEXT_PUBLIC_SUPABASE_ANON_KEY` estiverem ausentes, vazios ou iguais a `'your_supabase_project_url'`, o middleware permite tudo (`NextResponse.next()`). Isso habilita desenvolvimento local sem Supabase configurado.

---

### Verificação 3 — Auth Guard (Usuário logado?)

Cria cliente Supabase SSR via `@supabase/ssr` com cookies da request. Chama `supabase.auth.getUser()`.

**Se usuário NÃO está logado:**

| Tipo de rota | Comportamento |
|---|---|
| `/api/stripe/webhook` | Passa (o webhook valida via assinatura Stripe, não via Supabase auth) |
| Qualquer outra `/api/*` | Retorna `{ error: 'Unauthorized' }` com status HTTP 401 |
| Qualquer rota de página | Redireciona para `/login` |

---

### Verificação 4 — Subscription Guard (Tem assinatura ativa?)

Busca `empresa_id` do usuário em `profiles`. Depois busca a assinatura em `subscriptions` (`status`, `plano`, `cancel_at_period_end`, `current_period_end`).

**Lógica de `podeAcessar`:**

| Condição | Resultado |
|---|---|
| `status === 'active'` OU `status === 'trialing'` | `podeAcessar = true` |
| `cancel_at_period_end === true` E `current_period_end > agora` | `podeAcessar = true` (ainda no período pago) |
| Qualquer outra combinação | `podeAcessar = false` |

**Motivo de redirecionamento determinado quando `!podeAcessar`:**

| Condição | `motivoRedirecionamento` |
|---|---|
| `status === 'past_due'` | `?motivo=inadimplente` |
| `status === 'cancelled'` OU (`cancel_at_period_end` E `current_period_end <= agora`) | `?motivo=cancelado` |

---

### Proteção de Rotas Pro

Rotas que exigem plano Pro:

| Rota | Comportamento para plano Start |
|---|---|
| `/financeiro` (e sub-rotas) | Redireciona para `/assinar` |
| `/relatorios` (e sub-rotas) | Redireciona para `/assinar` |
| `/clientes/inativos` (e sub-rotas) | Redireciona para `/assinar` |
| `/comissoes` (e sub-rotas) | Redireciona para `/assinar` |

Condição: usuário tem assinatura ativa (`hasActiveSubscription`) MAS `userPlan !== 'pro'` E está acessando uma rota Pro.

---

### Regras Especiais de Redirecionamento

| Condição | Comportamento |
|---|---|
| Logado SEM assinatura + rota = `/configuracoes/planos` | **Permite acesso** (exceção para permitir atualização de cartão) |
| Logado SEM assinatura + rota ≠ `/assinar` + não é `/api/*` + não é `/_next` | Redireciona para `/assinar` com `?motivo=...` |
| Logado COM assinatura + rota = `/assinar` + sem `?mudar_plano` | Redireciona para `/dashboard` (usuário já tem plano) |
| Logado + rota = `/login` OU `/cadastro` | Redireciona para `/dashboard` (já autenticado) |

---

### Fluxo Completo do Middleware (Diagrama)

```
Request entra
    │
    ├─ É rota pública? ──────────────────────────────────→ PASSA
    │
    ├─ Supabase não configurado? ────────────────────────→ PASSA (dev mode)
    │
    ├─ Supabase configurado: verifica auth
    │       │
    │       ├─ Não logado + /api/stripe/webhook ─────────→ PASSA
    │       ├─ Não logado + /api/* ──────────────────────→ 401 JSON
    │       └─ Não logado + página ─────────────────────→ REDIRECT /login
    │
    ├─ Logado: verifica assinatura
    │       │
    │       ├─ Sem assinatura + /configuracoes/planos ───→ PASSA
    │       ├─ Sem assinatura + página ─────────────────→ REDIRECT /assinar?motivo=...
    │       │
    │       ├─ Com assinatura Start + rota Pro ──────────→ REDIRECT /assinar
    │       ├─ Com assinatura + /assinar sem mudar_plano → REDIRECT /dashboard
    │       └─ Logado + /login ou /cadastro ────────────→ REDIRECT /dashboard
    │
    └─ Tudo ok ──────────────────────────────────────────→ PASSA
```

### Connections to Other Modules
- Lê: `profiles` (`empresa_id`)
- Lê: `subscriptions` (`status`, `plano`, `cancel_at_period_end`, `current_period_end`)
- Protege rotas Pro: `/financeiro`, `/relatorios`, `/clientes/inativos`, `/comissoes`
- Exceção de webhook: `/api/stripe/webhook`
- Exceção de planos: `/configuracoes/planos`

---

*Fim da Fase 1 — Próximas fases documentarão os módulos do dashboard (itens 5–31 do índice).*

---

## 5. DASHBOARD (`/dashboard`)
**Plano:** Start + Pro  
**Arquivo:** `src/app/(dashboard)/dashboard/page.tsx`

### Layout Geral
Coluna única (`flex-direction: column`), `gap: 0.75rem`. Ordem de cima para baixo:
1. Banner "Primeiros passos" (condicional — só quando `totalProdutos === 0`)
2. Header (título + botão Nova Venda para Operadores)
3. Painel `<ComoFoiPainel />` (apenas Pro)
4. Grid 4 colunas — KPIs operacionais
5. Card de gráfico de barras horizontal — Últimos 7 dias
6. Grid 4 colunas — Acesso Rápido
7. Alertas condicionais (rodapé)

### Header da Tela
- **Título:** `Dashboard`
- **Subtítulo:** data atual no formato longo pt-BR (ex: `segunda-feira, 20 de maio`)
- **Botão (OperadorOnly):** `+ Nova Venda` → `/vendas/nova`

### Onboarding Banner (condicional)
Exibido quando `totalProdutos === 0`. Fundo `#e8f5ee`, borda esquerda verde `#1a7a3c`.
- **Título:** "Bem-vindo! Configure sua loja nos primeiros passos:"
- **3 cartões de link:**

| # | Título | Descrição | Destino |
|---|---|---|---|
| 1 | Cadastrar Produto | Adicione o que você vende ao estoque | `/produtos` |
| 2 | Primeira Venda | Registre uma venda no PDV para testar | `/vendas/nova` |
| 3 | Fornecedores | Cadastre de quem você compra | `/fornecedores` |

### KPIs / Cards de Resumo — Alertas Operacionais (grid 4 colunas)

| Label | Valor | Fonte Supabase | Cor do valor | Borda top | Clicável | Destino |
|---|---|---|---|---|---|---|
| Estoque Crítico | qtd de produtos com `qtd_atual <= qtd_minima` | `produtos` | vermelho se >0, verde se =0 | vermelho se >0, verde se =0 | Sim | `/estoque` |
| Fiado em Aberto | soma de `valor_aberto` dos fiados `status=aberto` | `fiados` | amarelo se >0, verde se =0 | amarelo se >0, cinza se =0 | Sim | `/financeiro/fiado` |
| Despesas do Mês | soma de `valor` das despesas do mês corrente | `despesas` | `#111111` (sempre) | `#1a5fa8` (sempre) | Sim | `/financeiro/despesas` |
| Clientes Sumidos | qtd clientes sem `ultima_compra` ≥ prazo CRM (`crm_prazo_inatividade_dias`, default 60d) | `clientes` + `empresas` | amarelo se >0, verde se =0 | amarelo se >0, cinza se =0 | Sim | `/clientes` |

**Extra no card Fiado:** Se `fiadosVencidos > 0` exibe sub-texto vermelho: `⚠ {n} vencido(s)`.

### Gráfico de Barras — Últimos 7 Dias
- **Seção Header:** "Vendas — Últimos 7 dias" + link "Ver relatório →" → `/relatorios`
- **Dados:** `vendas.total` agrupado por dia (últimos 7 dias), de `vendas` com `status=concluida`
- **Apresentação:** barras horizontais, dia mais recente no topo, largura proporcional ao maior valor
- **Hoje:** barra na cor `#1a7a3c` (verde escuro), dias anteriores: `#2d8a4e`
- **Estado vazio:** "Nenhuma venda nos últimos 7 dias."

### Acesso Rápido (grid 4 colunas, filtrado por plano)

| Label | Descrição | Destino | Aparece para |
|---|---|---|---|
| Nova Venda | Frente de caixa | `/vendas/nova` | Start + Pro |
| Ver Fiado | `{valor aberto}` aberto | `/financeiro/fiado` | **Apenas Pro** |
| Lançar Despesa | Registrar saída | `/financeiro/despesas` | **Apenas Pro** |
| Fechar Caixa | Conferência do dia | `/financeiro/fechamento` | **Apenas Pro** |

### Alertas e Estados Especiais

| Condição | Classe | Texto |
|---|---|---|
| `produtosCriticos > 0` | `alerta alerta-perigo` | ⚠ **{n} produto(s)** com estoque abaixo do mínimo. [Ver estoque →] |
| `fiadoAberto > 0` | `alerta alerta-aviso` | ● {R$ valor} em fiado pendente. [Cobrar agora →] |
| Loading | Spinner 36px + texto | "Carregando dados..." |

### Conexões com Outros Módulos
- Lê: `vendas`, `produtos`, `fiados`, `despesas`, `clientes`, `empresas`
- Usa componente: `<ComoFoiPainel />` (apenas Pro)
- Navega para: `/vendas/nova`, `/estoque`, `/financeiro/fiado`, `/financeiro/despesas`, `/financeiro/fechamento`, `/clientes`, `/relatorios`, `/produtos`, `/fornecedores`

---

## 6. PDV — NOVA VENDA (`/vendas/nova`)
**Plano:** Start + Pro  
**Arquivo:** `src/app/(dashboard)/vendas/nova/page.tsx`

### Layout Geral
Grid 2 colunas: coluna esquerda (flex, busca + carrinho) e coluna direita (340px fixo: tabela de preço + cliente + pagamento + resumo + botão finalizar).

### Header da Tela
- **Título:** `PDV — FRENTE DE CAIXA`
- **Subtítulo:** `REGISTRE A VENDA · ENTER ADICIONA PRODUTO`
- **Botão:** `◀ VOLTAR` → `/vendas`

### Campo de Busca de Produto
- **ID:** `pdv-busca`
- **Placeholder:** `BUSCAR POR NOME, SKU OU EAN_`
- **Comportamento:** busca em tempo real com `busca.length >= 1`, filtra por nome, SKU ou EAN (EAN exige match exato)
- **Enter:** se `resultados.length === 1`, adiciona automaticamente ao carrinho
- **Botão câmera** (exibido quando dispositivo tem câmera): `title="Ler código de barras"` — abre `<BarcodeScannerModal />`

### Dropdown de Resultados (autocomplete de produto)
Exibido quando `resultados.length > 0`. Para cada resultado:
- Nome do produto (bold)
- `SKU: {sku} · ESTQ: {qtd_atual}`
- Preço segundo tabela ativa (verde)
- Se tabela atacado/vip: preço varejo riscado abaixo

**Estado sem resultado:** se `busca.length >= 2 && resultados.length === 0` → "Produto não encontrado no estoque."

### Painel TABELA DE PREÇO (coluna direita)
3 botões toggle: `VAREJO` · `ATACADO` · `VIP`. Ao mudar, todos os preços do carrinho são recalculados. Se cliente selecionado for do tipo `atacado` ou `vip`, muda automaticamente ao selecioná-lo.

### Carrinho
- **Header:** `CARRINHO — {n} ITEM(S)`
- **Vazio:** `[ CARRINHO VAZIO ]` + "Busque um produto no campo acima"
- **Por item:**
  - Nome do produto
  - Tag `★ BRINDE` se brinde ativo
  - Campo "Nº de série" (se `tem_garantia && !brinde`): placeholder `Nº de série (garantia: {n}d)`
  - Botão `−` / quantidade / botão `+` (qty mínimo: 1)
  - Botão `🎁 Brinde` / `🎁 Brinde ON` (toggle)
  - Se brinde: exibe `R$ 0,00`
  - Se não brinde: campo numérico editável de preço (borda vermelha + aviso `⚠ Abaixo do preço mínimo` quando `precoUsado < preco_minimo`)
  - Subtotal da linha: `= {R$ valor}`
  - Botão `✕` para remover item

### Campo DESCONTO
- **Label:** `DESCONTO R$:`
- **Tipo:** `number`, `min="0"`
- **Placeholder:** `0,00`
- Localizado na barra inferior do carrinho

### Painel Cliente (coluna direita)
- **Label dinâmica:** `Cliente * obrigatório` (quando pagamento=Fiado) ou `Cliente (opcional)`
- **Botão:** `+ Novo` → abre modal `CADASTRAR NOVO CLIENTE` (usa `<FormCliente />`)
- **Campo de autocomplete:**
  - **ID:** `pdv-cliente`
  - **Placeholder:** `Nome do cliente...`
  - `autoComplete="off"`
  - Ao digitar ≥2 chars: filtra `clientesDB` e exibe dropdown (máx 6 resultados)
  - Selecionar do dropdown: preenche nome, vincula `clienteId` (UUID), fecha dropdown, ajusta tabela de preço se tipo atacado/vip
  - Badge quando vinculado: `● CLIENTE VINCULADO — HISTÓRICO SERÁ ATUALIZADO`
- **Botão:** `Anônimo` — define `cliente='Anônimo'`, limpa `clienteId` (desabilitado quando pagamento=Fiado)

### Painel FORMA DE PAGAMENTO
- **Label:** `FORMA DE PAGAMENTO`
- **Opções (botões toggle, grid 2 colunas):** `PIX` · `Dinheiro` · `Crédito` · `Débito` · `Fiado`
- **Se Dinheiro:**
  - Campo "DINHEIRO RECEBIDO" (number, placeholder `0,00`)
  - Exibe: `TROCO: {valor}` quando `troco > 0`
- **Se Fiado:**
  - Seção "PRAZO PARA PAGAMENTO" com 4 botões: `7 D` · `15 D` · `30 D` · `S/ PRAZO`

### Resumo (Recibo Térmico)
- SUBTOTAL
- DESCONTO (se `desconto > 0`, em vermelho)
- **TOTAL A PAGAR** (valor grande em verde)

### Botão Finalizar
- **ID:** `btn-finalizar-venda`
- **Texto dinâmico:**
  - Quando `pagamento='Fiado'`: `▶ REGISTRAR NO FIADO — {R$ total}`
  - Caso contrário: `▶ FINALIZAR VENDA — {R$ total}`
  - Durante processamento: `PROCESSANDO_` (com cursor piscante)
- **Desabilitado quando:** `salvando || itens.length===0 || !pagamento || (pagamento==='Fiado' && !cliente)`
- **Hint abaixo:** `ADICIONE AO MENOS 1 PRODUTO` / `⚠ INFORME O CLIENTE PARA O FIADO` / `SELECIONE A FORMA DE PAGAMENTO`

### Formulário — Modal Novo Cliente
- **Abre via:** botão `+ Novo` no painel Cliente
- **Título:** `CADASTRAR NOVO CLIENTE` + "Preencha os dados do cliente"
- **Conteúdo:** componente `<FormCliente />` (documentado na seção de Componentes)
- **Ao salvar:** fecha modal, tenta preencher o campo cliente com o nome digitado

### Modal Scanner de Código de Barras
- **Abre via:** botão câmera (só aparece se `hasCamera === true`)
- **Componente:** `<BarcodeScannerModal />`
- **Ao escanear:** fecha modal, preenche `busca` com o código e adiciona ao carrinho se encontrado exato (EAN ou SKU)

### Tela de Sucesso (fase='ok')
Exibida após venda finalizada:
- Emoji ✅ (4rem)
- **Título:** `Venda Concluída!` (verde)
- **Recibo:** `Recibo #0001` (número com padding 4 dígitos)
- **Total:** valor formatado em verde
- Se fiado: `📒 Registrado no fiado de {cliente}` (amarelo)
- **Botões:**
  - `🧾 Ver Recibo` → `/vendas/{vendaId}`
  - `+ Nova Venda` — reinicia o PDV (limpa itens, fase, pagamento, cliente, desconto, troco, clienteId, clienteSugs, prazoDias)

### Alertas e Estados Especiais

| Estado | Classe | Texto |
|---|---|---|
| Tabela Atacado ativa | `alerta alerta-info` | 📦 Tabela **Atacado** ativa |
| Tabela VIP ativa | `alerta alerta-info` | ⭐ Tabela **VIP** ativa |
| Erro na finalização | `alerta alerta-perigo` | Mensagem do erro |
| Fiado com cliente existente | `alerta alerta-perigo` | 🚨 O cliente "{nome}" já possui um Fiado em aberto... |

### Ao Finalizar (RPC `checkout_venda_transaction`)
Parâmetros enviados: `p_empresa_id`, `p_cliente_id` (UUID ou null), `p_cliente_nome`, `p_forma_pagamento`, `p_total`, `p_desconto`, `p_comissionado_id` (null), `p_comissionado_nome` (null), `p_registrado_nome` ('Anônimo'), `p_obs` (null), `p_itens` (array), `p_prazo_dias`.

Pós-venda: atualiza `clientes.ultima_compra = hoje` se `clienteId` não nulo.

### Conexões com Outros Módulos
- Lê: `produtos`, `fiados` (cliente_nome dos abertos), `clientes` (para autocomplete)
- RPC: `checkout_venda_transaction` (afeta: `vendas`, `itens_venda`, `estoque_movimentacoes`, `produtos`, `fiados`, `garantias`)
- Escreve: `clientes.ultima_compra`
- Usa: `<FormCliente />`, `<BarcodeScannerModal />`

---

## 7. HISTÓRICO DE VENDAS (`/vendas`)
**Plano:** Start + Pro  
**Arquivo:** `src/app/(dashboard)/vendas/page.tsx`

### Layout Geral
Coluna única. KPIs (grid 4) + filtros + tabela.

### Header da Tela
- **Título:** `HISTÓRICO DE VENDAS`
- **Subtítulo:** `HOJE: {n} VENDAS · {R$ valor}`
- **Botão (OperadorOnly):** `▶ NOVA VENDA` → `/vendas/nova`

### KPIs / Cards de Resumo (grid 4 colunas)

| Label | Valor | Fonte |
|---|---|---|
| FATURAMENTO HOJE | soma `total` das vendas de hoje com `status=concluida` | `vendas` (local) |
| VENDAS HOJE | contagem das vendas de hoje `status=concluida` | `vendas` (local) |
| TOTAL PERÍODO | soma `total` das vendas filtradas | calculado em JS |
| REGISTROS | qtd de linhas filtradas | calculado em JS |

### Filtros e Busca
- **Filtros de forma de pagamento (botões toggle):** `TODOS` · `PIX` · `DINHEIRO` · `CREDITO` · `DEBITO` · `FIADO`
- **Busca livre:** placeholder `BUSCAR POR Nº OU CLIENTE_` — filtra por `numero` (string) ou `cliente_nome`

### Tabela de Vendas
- **Colunas:** `#` · `CLIENTE` · `PAGAMENTO` · `TOTAL` · `DATA/HORA` · `OPERADOR` · `STATUS` · `REC.`
- **Dados:** `vendas` (limit 200, ordem `criado_em DESC`)
- **Por linha:**
  - `#`: número formatado com 4 dígitos (ex: `#0001`), cor `var(--texto-mono)`
  - `CLIENTE`: nome ou `ANÔNIMO` (muted)
  - `PAGAMENTO`: forma formatada em uppercase
  - `TOTAL`: verde, tabular-nums
  - `DATA/HORA`: `dd/mm hh:mm`
  - `OPERADOR`: `registrado_nome` ou `—`
  - `STATUS`: `● OK` (verde) ou `○ CANC.` (neutro)
  - `REC.`: botão `VER` → `/vendas/{id}`

### Alertas e Estados Especiais
- **Loading:** `CARREGANDO VENDAS_` (com cursor piscante)
- **Vazio sem filtro:** `[ NENHUMA VENDA REGISTRADA ]` + botão `▶ REGISTRAR VENDA` (OperadorOnly)
- **Vazio com filtro:** `[ NENHUMA VENDA ENCONTRADA ]`

### Conexões com Outros Módulos
- Lê: `vendas` (limit 200)
- Navega: `/vendas/nova`, `/vendas/{id}`

---

## 8. DETALHE DE VENDA / RECIBO (`/vendas/[id]`)
**Plano:** Start + Pro  
**Arquivo:** `src/app/(dashboard)/vendas/[id]/page.tsx`

### Layout Geral
Coluna única, largura máxima 560px. Banner de cancelada (condicional) + modais + header + botões de ação + card de recibo + links de rodapé.

### Header da Tela
- **Botão voltar:** ícone `<ArrowLeft />` → `/vendas`
- **Título:** `🧾 Recibo #XXXX` (4 dígitos)
- **Subtítulo:** data/hora completa (`dd/mm/yyyy hh:mm`)
- **Botão:** `<Printer /> Imprimir` → `window.print()`

### Botões de Ação Pós-Venda (OperadorOnly)

| Botão | Ícone | Ação | Quando habilitado |
|---|---|---|---|
| Acionar Fornecedor | `<Package />` | Abre Modal Acionar Fornecedor | `status !== 'cancelada'` |
| Abrir Ordem de Serviço | `<Wrench />` | Abre Modal Abrir OS | `status !== 'cancelada'` |
| Cancelar Venda | `<X />` (cor vermelha) | Abre Modal Cancelar Venda | `status === 'concluida'` (AdminOnly) |

### Card de Recibo
Exibe:
- Cabeçalho: "KDL Store" + "Sistema de Gestão"
- Dados: Cliente, Pagamento (com ícone emoji), Status (`● Concluída` / `○ Cancelada`)
- Itens: nome + serial (se houver) + `{qtd}x {preço}` + total da linha + badge BRINDE
- Rodapé financeiro: Subtotal / Desconto (se > 0) / **TOTAL**
- Nota: "Obrigado pela preferência! 🙏" + "Guarde este recibo para a garantia."

### Modal — Cancelar Venda
- **Abre via:** botão "✕ Cancelar Venda" (AdminOnly)
- **Título:** `✕ Cancelar Venda` (vermelho)
- **Aviso:** "Atenção: Os produtos serão devolvidos ao estoque. Esta ação não pode ser desfeita."
- **Campos:**

| Campo | Label | Tipo | Placeholder | Obrigatório |
|---|---|---|---|---|
| `cancMotivo` | Motivo do cancelamento * | `textarea` (3 linhas) | "Ex: Cliente desistiu..." | Sim |

- **Botões:** `Voltar` (ghost) · `Confirmar Cancelamento` (vermelho, desabilitado se vazio)
- **Ao salvar:** `vendas.status = 'cancelada'`, `vendas.motivo_cancelamento = texto`; restaura `qtd_atual` de cada item; insere `estoque_movimentacoes` tipo entrada; se Fiado: `fiados.status = 'cancelado'`

### Modal — Acionar Fornecedor
- **Abre via:** botão "Acionar Fornecedor"
- **Título:** `📦 Acionar Fornecedor` + `Venda #XXXX · {cliente}`
- **Campos:**

| Campo | Label | Tipo | Opções | Obrigatório |
|---|---|---|---|---|
| `fornSel` | Fornecedor * | `select` | lista de fornecedores ativos | Sim |
| `fornItem` | Item necessário * | `text` | placeholder: "Ex: Moldura para Palio 2010 preta" | Sim |

- **Info box:** "💬 Será aberto o WhatsApp do fornecedor com a mensagem já preenchida, incluindo o contexto da venda."
- **Botões:** `Cancelar` · `Acionar via WhatsApp` (Package icon)
- **Ao salvar:** insere `pedidos_fornecedor` (status `aguardando`, `venda_id` vinculado); abre WhatsApp `wa.me/55{telefone}?text={msg pré-preenchida com produtos e contexto da venda}`

### Modal — Abrir Ordem de Serviço
- **Abre via:** botão "Abrir Ordem de Serviço"
- **Título:** `🔧 Abrir Ordem de Serviço` + `Vinculada à Venda #XXXX`
- **Campos:**

| Campo | Label | Tipo | Placeholder | Obrigatório |
|---|---|---|---|---|
| `venda.cliente_nome` | Cliente | `text` (read-only) | — | Pré-preenchido |
| `osEquip` | Equipamento / Produto * | `text` | primeiro produto da venda | Sim |
| `osDefeito` | Defeito / Serviço Solicitado | `textarea` (2 linhas) | "Ex: Instalação do equipamento..." | Não |
| `osTecnico` | Técnico responsável | `text` | "Nome do técnico" | Não |
| `osObs` | Observações | `text` | "Opcional" | Não |

- **Botões:** `Cancelar` · `Criar OS` (Wrench icon)
- **Ao salvar:** insere `ordens_servico` com `venda_id` vinculado, status `aberta`
- **Sucesso:** exibe banner `✅ OS criada com sucesso! Vinculada à Venda #XXXX.` + link "Ver OS →" → `/ordens-de-servico`

### Alertas e Estados Especiais
- **Loading:** "Carregando recibo..."
- **Venda não encontrada:** `alerta alerta-perigo` com "Venda não encontrada."
- **Venda cancelada:** banner vermelho `● Venda Cancelada` + motivo abaixo

### Conexões com Outros Módulos
- Lê: `vendas`, `itens_venda`, `fornecedores`
- Escreve: `vendas`, `produtos`, `estoque_movimentacoes`, `fiados`, `pedidos_fornecedor`, `ordens_servico`
- Navega: `/vendas`, `/vendas/nova`, `/ordens-de-servico`

---

## 9. PRODUTOS & ESTOQUE (`/produtos`)
**Plano:** Start + Pro  
**Arquivo:** `src/app/(dashboard)/produtos/page.tsx`

### Layout Geral
Coluna única. Header + Modal (inline) + PageTabs + KPIs (grid 3) + alerta críticos + busca + tabela.

### Header da Tela
- **Título:** `PRODUTOS & ESTOQUE`
- **Subtítulo:** `{n} CADASTROS · {totalItens} ITENS EM ESTOQUE`
- **Botão:** `+ NOVO PRODUTO` → abre modal inline

### Abas (PageTabs)
| Label | Rota |
|---|---|
| Produtos | `/produtos` |
| Estoque e Movimentações | `/estoque` |
| Catálogo Online | `/catalogo` |

### KPIs / Cards de Resumo (grid 3 colunas)

| Label | Valor | Fonte | Cor |
|---|---|---|---|
| TOTAL PRODUTOS | qtd de registros em `produtos` | `produtos.length` | verde |
| VALOR ESTOQUE | soma de `qtd_atual × preco_custo` | calculado em JS | `var(--texto-mono)` |
| ESTQ. CRÍTICO | qtd com `qtd_atual <= qtd_minima && qtd_minima > 0` | calculado em JS | vermelho se >0, verde se =0 |

### Filtros e Busca
- **Campo busca:** placeholder `BUSCAR POR NOME, SKU OU CATEGORIA_` — filtra por `nome`, `sku`, `categoria`

### Tabela de Produtos
- **Colunas:** `PRODUTO` · `SKU` · `CATEGORIA` · `CUSTO` · `VENDA` · `ESTQ.` · `STATUS` · `AÇÃO`
- **Dados:** `produtos` da empresa, ordem por `nome ASC`
- **Por linha:**
  - Miniatura 40×40px (imagem ou emoji 📦)
  - Nome (truncado 2 linhas)
  - SKU ou `—`
  - Categoria ou `—`
  - Custo (muted)
  - Preço varejo (verde)
  - Qtd atual (vermelho + `⚠ MÍNIMO` se crítico)
  - Status: `● ATIVO` (verde) ou `○ INATIVO` (neutro)
  - Botão `EDITAR` → `/produtos/{id}/editar`

### Formulário — Modal Novo Produto
- **Abre via:** botão `+ NOVO PRODUTO`
- **Título:** `CADASTRAR NOVO PRODUTO` + "Preencha os dados do item"
- **Conteúdo:** componente `<FormProduto />` (documentado na seção de Componentes)
- **Ao salvar:** `toast.success('Salvo com sucesso!')`, fecha modal, recarrega lista

### Alertas e Estados Especiais
- **Alert críticos:** `⚠ {n} produto(s) abaixo do estoque mínimo: {nomes}`
- **Loading:** `CARREGANDO PRODUTOS_`
- **Estoque vazio:** `[ ESTOQUE VAZIO ]` + "Cadastre seu primeiro produto" + botão `+ CADASTRAR PRODUTO`
- **Sem resultado de busca:** `[ NENHUM PRODUTO ENCONTRADO PARA "{busca}" ]`
- **Erro de carregamento:** `alerta alerta-perigo` com "Erro ao carregar produtos."

### Conexões com Outros Módulos
- Lê: `produtos`
- Usa: `<FormProduto />`
- Navega: `/produtos/{id}/editar`, `/estoque`, `/catalogo`

---

## 10. ESTOQUE — MOVIMENTAÇÕES (`/estoque`)
**Plano:** Start + Pro  
**Arquivo:** `src/app/(dashboard)/estoque/page.tsx`

### Layout Geral
Coluna única. Header (com botões + ENTRADA e - AJUSTE) + PageTabs + Modal + KPIs (grid 3) + filtros + tabela de posição + tabela de movimentações recentes.

### Header da Tela
- **Título:** `ESTOQUE — MOVIMENTAÇÕES`
- **Subtítulo:** `VALOR EM ESTOQUE: {R$ valorEstoque}`
- **Botões:**
  - `- AJUSTE` (secondary) → abre modal com tipo pré-definido `ajuste`
  - `+ ENTRADA` (primary) → abre modal com tipo pré-definido `entrada`

### Abas (PageTabs)
(Mesmas da seção Produtos: Produtos / Estoque e Movimentações / Catálogo Online)

### KPIs / Cards de Resumo (grid 3 colunas)

| Label | Valor | Cor |
|---|---|---|
| VALOR ESTOQUE | soma de `qtd_atual × preco_custo` | `var(--texto-mono)` |
| TOTAL ITENS | soma total de `qtd_atual` de todos os produtos | verde |
| ESTQ. CRÍTICO | qtd com `qtd_atual <= qtd_minima && qtd_minima > 0` | vermelho se >0, verde se =0 |

### Filtros e Busca
- **Filtros de situação (botões toggle):** `TODOS` · `⚠ CRÍTICOS` · `★ BRINDES`
- **Busca:** placeholder `BUSCAR PRODUTO_` — filtra por `nome` e `sku`

### Tabela de Posição de Estoque
- **Colunas:** `PRODUTO` · `SKU` · `CATEGORIA` · `ATUAL` · `MÍN.` · `CUSTO` · `TOTAL` · `STATUS`
- **Por linha:**
  - Nome do produto
  - SKU ou `—`
  - Categoria ou `—`
  - Qtd atual (vermelho se crítico, verde se ok)
  - Qtd mínima (muted)
  - Custo unitário
  - Total em estoque (qtd × custo)
  - Status: `⚠ CRÍTICO` / `ZERADO` / `● OK`

### Tabela — Últimas Movimentações (últimas 50)
- **Seção Header:** `ÚLTIMAS MOVIMENTAÇÕES`
- **Colunas:** `PRODUTO` · `TIPO` · `QTD` · `OBS.` · `DATA/HORA`
- **Tipos de movimentação e cores:**
  - `ENTRADA` → verde
  - `VENDA` → azul
  - `BRINDE` → amarelo
  - `AJUSTE` → muted
- **QTD:** verde com `+` se positivo, vermelho se negativo
- **Vazio:** `[ NENHUMA MOVIMENTAÇÃO REGISTRADA ]`

### Formulário — Modal Ajuste de Estoque
- **Abre via:** botão `- AJUSTE` ou `+ ENTRADA` (pré-define o tipo)
- **Título:** `AJUSTAR ESTOQUE`
- **Campos:**

| Campo | Label | Tipo | Opções/Placeholder | Obrigatório |
|---|---|---|---|---|
| `produtoId` | PRODUTO * | `select` | lista de produtos (com qtd atual) | Sim |
| `tipo` | TIPO | `select` | `ENTRADA (+)` / `AJUSTE (-)` | Sim |
| `quantidade` | QUANTIDADE | `number` (min 1, center, bold) | 1 | Sim |
| `obs` | OBSERVAÇÃO (OPCIONAL) | `text` | "Ex: Compra do fornecedor..." | Não |

- **Botões:** `CANCELAR` · `▶ CONFIRMAR` (desabilitado se sem produto)
- **Ao salvar:** insere `estoque_movimentacoes`; atualiza `produtos.qtd_atual` (delta positivo para entrada, negativo para ajuste)

### Alertas e Estados Especiais
- **Alert críticos:** `⚠ {n} produto(s) abaixo do estoque mínimo`
- **Loading:** `CARREGANDO ESTOQUE_`

### Conexões com Outros Módulos
- Lê: `produtos`, `estoque_movimentacoes`
- Escreve: `estoque_movimentacoes`, `produtos`
- Navega: `/produtos`, `/catalogo`

---

## 11. CATÁLOGO ONLINE (`/catalogo`)
**Plano:** Start + Pro  
**Arquivo:** `src/app/(dashboard)/catalogo/page.tsx`

### Layout Geral
Coluna única, max-width 900px. Header + PageTabs + Card Link do Catálogo + Tabela de produtos.

### Header da Tela
- **Título:** `CATÁLOGO ONLINE`
- **Subtítulo:** `{n} PRODUTO(S) VISÍVEIS NO CATÁLOGO PÚBLICO`
- **Botão:** `↗ VER CATÁLOGO` → `https://{urlCatalogo}` (target `_blank`)

### Abas (PageTabs)
(Mesmas da seção Produtos: Produtos / Estoque e Movimentações / Catálogo Online)

### Card — Link do Catálogo Público
**Seção Header:** `LINK DO SEU CATÁLOGO PÚBLICO`

**Se `empresa.slug` definido:**
- QR Code SVG 100×100px (branco, borda arredondada)
- URL em `<code>`: `https://{host}/loja/{slug}`
- Botão `📋 COPIAR` → `navigator.clipboard.writeText(url)`
- Botão `↗ ABRIR` → abre URL (target `_blank`)
- Botão `💬 COMPARTILHAR WA` → `wa.me/?text={msg codificada}` com texto: "Olá! Veja nossos produtos no catálogo online: https://{url}"
- Botão `🖨 IMP. QR` → `window.print()`

**Se `empresa.slug` não definido:**
- Texto: "Você precisa definir o Link do Catálogo (Slug) antes de compartilhar."
- Botão `Configurar Link` → `/configuracoes/empresa`

### Tabela de Produtos do Catálogo
- **Colunas:** `PRODUTO` · `CATEGORIA` · `PREÇO EXIBIDO` · `EXIBIÇÃO` · `VISÍVEL` · `DESTAQUE` · `AÇÃO`
- **Linha com opacidade 0.55 se `ativo_catalogo = false`**
- **Por linha:**
  - Nome do produto
  - Categoria em uppercase
  - Preço exibido (calculado por `preco_catalogo`)
  - Select `EXIBIÇÃO`:
    - `VAREJO` → usa `preco_varejo`
    - `ATACADO` → usa `preco_atacado || preco_varejo`
    - `VIP` → usa `preco_vip || preco_varejo`
    - `OCULTAR` → exibe `—`
  - Toggle `VISÍVEL`: `● VISÍVEL` (verde, `ativo_catalogo=true`) / `○ OCULTO` (neutro) — atualiza `produtos.ativo_catalogo`
  - Toggle `DESTAQUE`: `★ DESTAQUE` (amarelo, `destaque=true`) / `—` (neutro) — atualiza `produtos.destaque`
  - Botão `EDITAR` → `/produtos/{id}/editar`

### Alertas e Estados Especiais
- **Loading:** `CARREGANDO CATÁLOGO_`
- **Sem produtos:** `[ NENHUM PRODUTO CADASTRADO ]` + botão `+ CADASTRAR PRODUTO` → `/produtos/novo`

### Conexões com Outros Módulos
- Lê: `produtos`, `empresas` (nome, telefone, cidade, slug)
- Escreve: `produtos.ativo_catalogo`, `produtos.destaque`, `produtos.preco_catalogo`
- Navega: `/configuracoes/empresa`, `/produtos/{id}/editar`
- Página pública do catálogo: `/loja/{slug}` (não mapeada neste documento — rota pública)

---

## 12. CLIENTES E FORNECEDORES (`/clientes`)
**Plano:** Start + Pro  
**Arquivo:** `src/app/(dashboard)/clientes/page.tsx`

### Layout Geral
Coluna única. Header + Modal + PageTabs + filtros + tabela.

### Header da Tela
- **Título:** `CLIENTES`
- **Subtítulo:** `{n} ATIVOS · {n} SUMIDOS`
- **Botão:** `+ NOVO CLIENTE` → abre modal

### Abas (PageTabs)
| Label | Rota |
|---|---|
| Todos os Clientes | `/clientes` |
| Sumidos ⚠ | `/clientes/inativos` |
| Fornecedores | `/fornecedores` |

### Filtros e Busca
- **Filtros de tipo (botões toggle):** `TODOS` · `VAREJO` · `ATACADO` · `★ VIP` · `⚠ SUMIDOS`
- **Busca:** placeholder `BUSCAR POR NOME OU TELEFONE_` — filtra por `nome` e `telefone`

### Tabela de Clientes
- **Colunas:** `NOME` · `TELEFONE/WA` · `TIPO` · `ÚLT. COMPRA` · `STATUS` · `AÇÃO`
- **Dados:** `clientes` da empresa, ordem por `nome ASC`
- **Por linha:**
  - Nome (bold)
  - Telefone: link `WA {telefone}` → `wa.me/55{telefone}` (target `_blank`) ou `—`
  - Tipo: badge `★ VIP` (status-alerta) / `ATACADO` (status-aviso) / `VAREJO` (status-neutro)
  - Última compra: data `dd/mm/yyyy` ou `—`
  - Status: `● ATIVO` (verde) ou `○ SUMIDO` (neutro)
  - Botão `VER` → `/clientes/{id}`

### Formulário — Modal Novo Cliente
- **Abre via:** botão `+ NOVO CLIENTE`
- **Título:** `CADASTRAR NOVO CLIENTE` + "Preencha os dados do cliente"
- **Conteúdo:** componente `<FormCliente />` (documentado na seção de Componentes)
- **Ao salvar:** `toast.success('Salvo com sucesso!')`, fecha modal, recarrega lista

### Alertas e Estados Especiais
- **Loading:** `CARREGANDO CLIENTES_`
- **Vazio sem filtro:** `[ CADASTRO VAZIO ]` + "Cadastre seu primeiro cliente" + botão `+ CADASTRAR CLIENTE`
- **Vazio com filtro/busca:** `[ NENHUM CLIENTE ENCONTRADO ]`

### Conexões com Outros Módulos
- Lê: `clientes`
- Usa: `<FormCliente />`
- Navega: `/clientes/{id}`, `/clientes/inativos`, `/fornecedores`

---

## 13. DETALHE / PERFIL DO CLIENTE (`/clientes/[id]`)
**Plano:** Start + Pro  
**Arquivo:** `src/app/(dashboard)/clientes/[id]/page.tsx`

### Layout Geral
Coluna única, max-width 760px. Header + KPIs (grid 3) + Card Dados + Histórico de Compras + Fiado.

### Header da Tela
- **Botão voltar:** `<ArrowLeft />` → `/clientes`
- **Título:** `👤 {cliente.nome}`
- **Subtítulo:** badge de tipo (`⭐ VIP` / `📦 Atacado` / `🛒 Varejo`) + "· Cliente desde {data}"
- **Botões:**
  - `✏️ Editar` / `Cancelar` — alterna modo edição
  - `Excluir` (vermelho) — `confirm()` + `DELETE clientes WHERE id = {id}` + redireciona para `/clientes`

### KPIs / Cards de Resumo (grid 3 colunas)

| Label | Valor | Cor |
|---|---|---|
| Total gasto | soma de `vendas.total` com `status=concluida` vinculadas ao `cliente_id` (last 20) | verde |
| Compras | qtd de vendas vinculadas (last 20) | texto padrão |
| Fiado em aberto | soma de `fiados.valor_aberto` com `status=aberto` | vermelho se >0, verde se =0 |

### Card — Dados do Cliente

**Modo Leitura:**

| Campo | Label |
|---|---|
| `telefone` | Telefone (link WhatsApp verde `💬 {tel}` se preenchido) |
| `email` | E-mail |
| `cpf` | CPF |
| `endereco` | Endereço |
| `anotacoes` | Anotações (itálico, span inteiro) |

**Modo Edição (formulário inline):**

| Campo | Label | Tipo | Obrigatório |
|---|---|---|---|
| `nome` | Nome | `text` | Sim |
| `telefone` | Telefone | `text` | Não |
| `email` | E-mail | `email` | Não |
| `cpf` | CPF | `text` (monospace) | Não |
| `endereco` | Endereço | `text` | Não |
| `anotacoes` | Anotações | `textarea` (2 linhas) | Não |
| `tipo` | — | 3 botões toggle: `🏪 Varejo` · `📦 Atacado` · `⭐ VIP` | Não |

- **Botões:** `Cancelar` · `✓ Salvar` (spinner durante `salvando`)
- **Ao salvar:** `UPDATE clientes SET nome, telefone, email, cpf, endereco, anotacoes, tipo, ativo WHERE id`

### Histórico de Compras (últimas 20, ordem DESC)
- **Seção:** `🛒 Histórico de Compras`
- **Colunas:** `#` (link verde → `/vendas/{id}`) · `Pagamento` · `Total` · `Data` · `Status`
- **Vazio:** "Nenhuma compra registrada ainda."

### Fiado (exibido apenas se `fiados.length > 0`)
- **Seção:** `📒 Fiado`
- **Colunas:** `Valor` (vermelho se aberto, verde se pago) · `Data` · `Status` (`● Pago` / `● Aberto`)

### Alertas e Estados Especiais
- **Loading:** spinner `<Loader2 />` + "Carregando..."
- **Cliente não encontrado:** `alerta alerta-perigo` com "Cliente não encontrado."

### Conexões com Outros Módulos
- Lê: `clientes`, `vendas` (por `cliente_id`, limit 20), `fiados` (por `cliente_id`)
- Escreve: `clientes` (UPDATE / DELETE)
- Navega: `/clientes`, `/vendas/{id}`

---

## 14. CLIENTES SUMIDOS / CRM (`/clientes/inativos`)
**Plano:** Apenas Pro  
**Arquivo:** `src/app/(dashboard)/clientes/inativos/page.tsx`

### Layout Geral
Coluna única. Header + PageTabs + Alerta info + KPIs (grid auto-fit) + Tabela + Card de mensagens pré-prontas.

### Header da Tela
- **Título:** `👤 Clientes Sumidos`
- **Subtítulo:** `Clientes que pararam de comprar — recupere-os com 1 clique`

### Abas (PageTabs)
(Mesmas de Clientes: Todos os Clientes / Sumidos ⚠ / Fornecedores)

### Alerta Info Fixo
`💡 Recuperar um cliente antigo custa **5x menos** que conquistar um novo. Mande uma mensagem agora.`

### Lógica de Classificação
- Lê `empresas.crm_prazo_inatividade_dias` (default: 60 dias)
- Filtra clientes `ativo=true` com `ultima_compra` não nula
- Exclui clientes com `diasSemComprar < max(15, prazo/2)` (ainda ativos)
- Classifica por dias sem comprar:
  - `morno`: `>= prazo/2` e `< prazo`
  - `frio`: `>= prazo` e `< prazo*1.5`
  - `perdido`: `>= prazo*1.5`
- Ordena por `diasSemComprar DESC`

### KPIs / Cards de Resumo (grid auto-fit, min 150px)

| Temperatura | Emoji | Label | Cor da borda |
|---|---|---|---|
| Morno | 🟡 | Atenção | `var(--amarelo)` |
| Frio | 🟠 | Sumido | `#c05200` |
| Perdido | 🔴 | Perdido | `var(--vermelho)` |

Cada card exibe: emoji + label / qtd / descrição / dica de ação.
Card extra: **Ticket Médio dos Sumidos** — média do ticket dos clientes frio+perdido (verde, "Potencial de recuperação").

### Tabela de Clientes Sumidos
- **Colunas:** `Cliente` · `Telefone` · `Última Compra` · `Dias Parado` · `Total Gasto` · `Compras` · `Temperatura` · `Ação`
- **Por linha:**
  - Nome (bold)
  - Telefone
  - Data última compra (`dd/mm/yyyy`)
  - Dias sem comprar (bold, cor da temperatura)
  - Total gasto (verde, monospace)
  - Nº de compras
  - Badge: `{emoji} {label}` na cor da temperatura
  - **Ação:** botão `💬 Chamar no WhatsApp` (verde `#25D366`, target `_blank`) → `wa.me/55{telefone}?text={msg}` com mensagem personalizada por temperatura; ou "Sem telefone" se não houver

### Mensagens Pré-prontas (por temperatura)

| Temperatura | Mensagem |
|---|---|
| Morno (Atenção) | `"Oi {primeiro nome}! Novidade boa chegou aqui. Pode vir conferir? 🙌"` |
| Frio (Sumido) | `"Olá {primeiro nome}! Tô com novidades aqui na loja e lembrei de você. Vem dar uma olhada! 💪"` |
| Perdido | `"Olá {primeiro nome}! Faz um tempo que não te vejo por aqui... Tenho novidades que você vai gostar. Passa na loja ou me chama aqui! 😊"` |

### Alertas e Estados Especiais
- **Loading:** spinner `<Loader2 />` + "Analisando clientes..."
- **Nenhum sumido:** `🎉 Nenhum cliente sumido! Todos os seus clientes compraram nos últimos 30 dias.`

### Conexões com Outros Módulos
- Lê: `empresas.crm_prazo_inatividade_dias`, `clientes`, `vendas` (por cliente_id)
- Navega: `/clientes`, `/fornecedores`
- Abre: WhatsApp externo com mensagem pré-formatada

---

## 15. FORNECEDORES (`/fornecedores`)
**Plano:** Start + Pro  
**Arquivo:** `src/app/(dashboard)/fornecedores/page.tsx`

### Layout Geral
Coluna única. Modais (Novo Pedido + Novo Fornecedor + Editar Fornecedor) → Header → PageTabs → Abas internas → Conteúdo da aba.

### Header da Tela
- **Título:** `FORNECEDORES`
- **Subtítulo:** `{n} CADASTRADOS · {n} PEDIDO(S) PENDENTE(S)`
- **Botões:**
  - `+ NOVO PEDIDO` (secondary) — visível apenas quando aba `pedidos` ativa
  - `+ NOVO FORNECEDOR` (primary) — sempre visível

### Abas (PageTabs externas)
| Label | Rota |
|---|---|
| Todos os Clientes | `/clientes` |
| Sumidos ⚠ | `/clientes/inativos` (apenas Pro) |
| Fornecedores | `/fornecedores` |

### Abas Internas (toggle)
| Label | Estado |
|---|---|
| FORNECEDORES | `aba = 'lista'` |
| PEDIDOS ({n}) | `aba = 'pedidos'` — exibe contagem de pendentes se > 0 |

### Aba FORNECEDORES — Filtros e Busca
- **Busca:** placeholder `BUSCAR FORNECEDOR_` — filtra por `nome` e `categoria`

### Aba FORNECEDORES — Tabela de Fornecedores
- **Colunas:** `FORNECEDOR` · `CONTATO/WA` · `CATEGORIA` · `CIDADE/UF` · `PRAZO` · `STATUS` · `AÇÃO`
- **Por linha:**
  - Nome (bold)
  - Contato: link `WA {contato ou telefone}` → `wa.me/55{telefone}` se tem telefone, senão exibe `{contato}` ou `—`
  - Categoria em uppercase
  - Cidade/UF concatenados com `/`
  - Prazo de entrega ou `—`
  - Status: `● ATIVO` (verde) / `○ INATIVO` (neutro)
  - Botão `EDITAR` → abre Modal Editar Fornecedor

### Aba PEDIDOS — Tabela de Pedidos ao Fornecedor
- **Colunas:** `PRODUTO` · `FORNECEDOR` · `QTD` · `DATA` · `STATUS` · `AÇÃO`
- **Status e cores:**
  - `○ AGUARDANDO` (neutro)
  - `◐ CONFIRMADO` (status-alerta/amarelo)
  - `● ENTREGUE` (status-ok/verde)
- **Ação:** botão `CONFIRMAR` (se aguardando) ou `ENTREGUE` (se confirmado) — avança status; oculto se já entregue
- **Vazio:** `[ NENHUM PEDIDO PENDENTE ]`

### Formulário — Modal Novo Fornecedor
- **Abre via:** botão `+ NOVO FORNECEDOR`
- **Título:** `CADASTRAR NOVO FORNECEDOR` + "Preencha os dados do fornecedor"
- **Conteúdo:** componente `<FormFornecedor />` (documentado na seção de Componentes)
- **Ao salvar:** `toast.success('Salvo com sucesso!')`, fecha modal, recarrega lista

### Formulário — Modal Editar Fornecedor
- **Abre via:** botão `EDITAR` na tabela
- **Título:** `EDITAR FORNECEDOR` + `{nome}`
- **Campos (grid 2 colunas):**

| Campo | Label | Tipo | Placeholder/Opções | Obrigatório |
|---|---|---|---|---|
| `nome` | Nome da empresa * | `text` | — | Sim |
| `contato` | Nome do contato | `text` | — | Não |
| `telefone` | Telefone / WhatsApp | `text` | — | Não |
| `email` | E-mail | `email` | — | Não |
| `cnpj` | CNPJ | `text` (monospace) | — | Não |
| `categoria` | Categoria | `select` | Eletrônicos / Acessórios / Autopeças / Serviços / Embalagens / Outros | Não |
| `cidade` | Cidade | `text` | — | Não |
| `estado` | Estado | `select` | 27 UFs brasileiras | Não |
| `prazo_entrega` | Prazo de entrega | `text` | "Ex: 24h, 3 dias úteis" | Não |
| `pedido_minimo` | Pedido mínimo (R$) | `number` | — | Não |

- **Campo extra:** Anotações (`textarea`, 2 linhas)
- **Toggle Status:** `● Ativo` / `○ Inativo` (botões)
- **Botões:** `Cancelar` · `Salvar alterações` (spinner durante salvamento)
- **Ao salvar:** `UPDATE fornecedores SET todos os campos WHERE id`

### Formulário — Modal Novo Pedido (FO2)
- **Abre via:** botão `+ NOVO PEDIDO` (apenas na aba PEDIDOS)
- **Título:** `📦 Novo Pedido ao Fornecedor`
- **Campos:**

| Campo | Label | Tipo | Placeholder | Obrigatório |
|---|---|---|---|---|
| `pedProduto` | Produto / Descrição * | `text` | "Ex: Cabo HDMI 2m" | Sim |
| `pedQtd` | Quantidade * | `number` (min 1) | — | Sim |
| `pedFornId` | Fornecedor (opcional) | `select` | lista de fornecedores ativos | Não |

- **Botões:** `Cancelar` · `Criar Pedido` (Save icon, spinner)
- **Ao salvar:** `INSERT pedidos_fornecedor { empresa_id, fornecedor_id, produto, quantidade, status: 'aguardando' }`; adiciona ao topo da lista localmente

### Alertas e Estados Especiais
- **Loading:** `CARREGANDO FORNECEDORES_`
- **Vazio sem busca:** `[ NENHUM FORNECEDOR CADASTRADO ]` + botão `+ CADASTRAR FORNECEDOR`
- **Vazio com busca:** `[ NENHUM FORNECEDOR ENCONTRADO ]`

### Conexões com Outros Módulos
- Lê: `fornecedores`, `pedidos_fornecedor`
- Escreve: `fornecedores` (UPDATE), `pedidos_fornecedor` (INSERT, UPDATE status)
- Usa: `<FormFornecedor />`
- Navega: `/clientes`, `/clientes/inativos`

---

## 16. FINANCEIRO — VISÃO GERAL / DRE (`/financeiro`)
**Plano:** Apenas Pro  
**Arquivo:** `src/app/(dashboard)/financeiro/page.tsx`

### Layout Geral
Coluna única. Header + PageTabs + KPIs (grid 4) + Gráfico 15 dias + Grid 2 colunas (formas de pagamento + despesas por categoria) + DRE simplificado.

### Header da Tela
- **Título:** `FINANCEIRO — VISÃO GERAL`
- **Subtítulo:** `{MÊS CORRENTE} · TEMPO REAL`
- **Botões:**
  - `+ DESPESA` (secondary) → `/financeiro/despesas`
  - `■ FECHAR CAIXA` (primary) → `/financeiro/fechamento`

### Abas (PageTabs)
| Label | Rota |
|---|---|
| Visão Geral (DRE) | `/financeiro` |
| Despesas | `/financeiro/despesas` |
| Fiados 📒 | `/financeiro/fiado` |
| Fechamento de Caixa | `/financeiro/fechamento` |

### KPIs / Cards de Resumo (grid 4 colunas — mês corrente)

| Label | Valor | Fonte | Cor |
|---|---|---|---|
| RECEITA MÊS | soma de `vendas.total` `status=concluida` desde início do mês | `vendas` | verde |
| DESPESAS MÊS | soma de `despesas.valor` desde início do mês | `despesas` | vermelho |
| LUCRO ESTIM. | `receita - CMV - brindes - despesas` | calculado | verde se ≥0, vermelho se <0 |
| FIADO ABERTO | soma de `fiados.valor_aberto` `status=aberto` | `fiados` | amarelo se >0, verde se =0 |

- **Card LUCRO ESTIM.** exibe sub-texto: `MARGEM: {x.x}%`

### Fórmula de Lucro
`Lucro Líquido = Receita - CMV - Brindes - Despesas`
- **CMV** = soma de `itens_venda.quantidade × produtos.preco_custo` do mês
- **Brindes** = soma de `|qtd| × preco_custo` das movimentações tipo `brinde` do mês

### Gráfico — Faturamento Últimos 15 Dias
- **Seção Header:** `FATURAMENTO — ÚLTIMOS 15 DIAS`
- Barras horizontais, dia mais recente no topo (exibe os 8 mais recentes)
- Verde escuro para hoje, verde muted para os demais
- Valor em monospace à direita ou `—`
- **Vazio:** `[ NENHUMA VENDA NO PERÍODO ]`

### Painel — Por Forma de Pagamento
- **Seção Header:** `POR FORMA DE PAGAMENTO`
- Para cada forma: nome em uppercase + valor (verde) + barra de progresso proporcional à receita total
- **Vazio:** `[ NENHUMA VENDA ESTE MÊS ]`

### Painel — Despesas por Categoria
- **Seção Header:** `DESPESAS POR CATEGORIA`
- Para cada categoria: nome + valor (vermelho), ordenado por maior valor
- **Vazio:** `[ NENHUMA DESPESA ESTE MÊS ]` + link `+ LANÇAR DESPESA` → `/financeiro/despesas`

### DRE Simplificado
- **Seção Header:** `DRE SIMPLIFICADO — {MÊS CORRENTE}`
- Linhas:

| Linha | Cor |
|---|---|
| (+) RECEITA DE VENDAS | verde |
| (-) CMV (CUSTO MERCADORIA) | vermelho |
| (-) BRINDES CONCEDIDOS | amarelo |
| (-) DESPESAS TOTAIS | vermelho |
| **(=) LUCRO LÍQUIDO ESTIMADO** | verde se ≥0, vermelho se <0 (bold, 1rem) |

- **Nota:** `* Fiado não recebido não está incluído na receita.`

### Alertas e Estados Especiais
- **Loading:** `CARREGANDO DADOS_`

### Conexões com Outros Módulos
- Lê: `vendas`, `despesas`, `fiados`, `estoque_movimentacoes`, `itens_venda`, `produtos`
- Navega: `/financeiro/despesas`, `/financeiro/fechamento`, `/financeiro/fiado`

---

## 17. FIADO — CONTROLE (`/financeiro/fiado`)
**Plano:** Apenas Pro  
**Arquivo:** `src/app/(dashboard)/financeiro/fiado/page.tsx`

### Layout Geral
Coluna única. Header + PageTabs + KPIs (grid 3) + Alerta vencidos + Filtros + Tabela de abertos.

### Header da Tela
- **Título:** `📒 Controle de Fiado`
- **Subtítulo:** `{n} devedor(es) · {R$ valor} em aberto`

### Abas (PageTabs)
(Mesmas do Financeiro: Visão Geral / Despesas / Fiados 📒 / Fechamento)

### KPIs (grid 3 colunas)

| Label | Valor | Cor |
|---|---|---|
| Total em Aberto | soma de `valor_aberto` dos fiados `status=aberto` | vermelho se >0, verde se =0 |
| Recebido este Mês | soma de `valor_aberto` dos fiados `status=pago` no mês | verde |
| Nº de Devedores | qtd de fiados `status=aberto` | amarelo se >0, verde se =0 |

### Alerta Condicional
`🚨 Há fiados vencidos! Considere cobrar via WhatsApp.` — exibido quando algum fiado aberto tem `data_vencimento < hoje`

### Filtros (botões toggle)
`TODOS` · `VENCIDOS` · `VENCENDO HOJE` · `A VENCER`

### Tabela de Fiados Abertos
- **Ordenação:** vencidos primeiro, depois por `data_vencimento ASC`, sem prazo por último
- **Colunas:** `Cliente` · `Valor` · `Vencimento` · `Desde` · `Ações`
- **Por linha:**
  - Cliente (bold)
  - Valor (vermelho, monospace, 1.1rem)
  - Vencimento: data + sufixo `(Vencido)` / `(Hoje)` / `({n}d)` ou `S/ Prazo`
    - Cor: vermelho se vencido, amarelo se ≤7 dias, verde se >7 dias
  - Data de criação (`dd/mm/yyyy`)
  - **Ações:**
    - `💬 Cobrar` (verde WhatsApp #25D366) → `wa.me/55{tel}?text={msg}` com mensagem automática contextual (vencido / vencendo hoje / a vencer / sem prazo)
    - `✓ Pago` (OperadorOnly) → `confirm()` + `UPDATE fiados SET status='pago', pago_em=now() WHERE id`

### Mensagens WhatsApp por Contexto
- **Sem prazo:** "Oi {nome}, tudo bem? Passando para lembrar que você tem {R$} em aberto aqui na loja..."
- **Vencido:** "Oi {nome}, seu fiado de {R$} venceu em {data}. Quando puder, vamos acertar?"
- **Vence hoje:** "Oi {nome}, seu fiado de {R$} vence hoje. Pode passar aqui ou me chamar para acertar!"
- **A vencer:** "Oi {nome}, lembrando que seu fiado de {R$} vence em {data}. Qualquer dúvida é só chamar!"

### Alertas e Estados Especiais
- **Loading:** spinner + "Carregando..."
- **Nenhum fiado aberto:** `🎉 Nenhum fiado em aberto! Todos os clientes estão em dia.`
- **Nenhum no filtro:** `[ NENHUM FIADO NESTE FILTRO ]`

### Conexões com Outros Módulos
- Lê: `fiados`
- Escreve: `fiados.status`, `fiados.pago_em`
- Navega: `/financeiro`, `/financeiro/despesas`, `/financeiro/fechamento`

---

## 18. DESPESAS (`/financeiro/despesas`)
**Plano:** Apenas Pro  
**Arquivo:** `src/app/(dashboard)/financeiro/despesas/page.tsx`

### Layout Geral
Coluna única, max-width 820px. Header + PageTabs + KPIs (grid 3) + Formulário inline (condicional) + Tabela.

### Header da Tela
- **Botão voltar:** `<ArrowLeft />` → `/financeiro`
- **Título:** `💸 Despesas`
- **Subtítulo:** `Este mês: {R$ totalMes}`
- **Botão:** `+ Lançar Despesa` / `Cancelar` (toggle — alterna `showForm`)

### Abas (PageTabs)
(Mesmas do Financeiro: Visão Geral / Despesas / Fiados 📒 / Fechamento)

### KPIs (grid 3 colunas — mês corrente)

| Label | Valor | Cor |
|---|---|---|
| Total este mês | soma de `despesas.valor` do mês | vermelho |
| Despesas fixas | soma das `tipo=fixa` do mês | amarelo |
| Despesas variáveis | `totalMes - totalFixas` | texto padrão |

### Formulário Inline — Nova Despesa
- **Abre via:** botão `+ Lançar Despesa` (toggle)
- **Seção Header:** `➕ Nova Despesa`
- **Campos:**

| Campo | Label | Tipo | Placeholder/Opções | Obrigatório |
|---|---|---|---|---|
| `descricao` | Descrição * | `text` | "Ex: Conta de energia junho" | Sim |
| `categoria` | Categoria | `select` | Aluguel / Energia / Internet / Fornecedor / Transporte / Funcionário / Marketing / Manutenção / Imposto / Outros | Não (default: Outros) |
| `tipo` | Tipo | `select` | `🔒 Fixa (mensal)` / `📊 Variável` | Não (default: variavel) |
| `data` | Data | `date` | hoje (default) | Não |
| `valor` | Valor (R$) * | `number` (step 0.01) com prefixo R$ | `0,00` | Sim |

- **Botão:** `✓ Salvar` (spinner durante salvamento)
- **Ao salvar:** `INSERT despesas { empresa_id, descricao, categoria, tipo, valor, data, recorrente }`; fecha form, recarrega lista

### Tabela de Despesas (todas, ordem DESC por data)
- **Colunas:** `Descrição` · `Categoria` · `Tipo` · `Data` · `Valor` · `Ação`
- **Por linha:**
  - Descrição (bold)
  - Categoria
  - Tipo: `🔒 Fixa` (status-neutro) / `📊 Variável` (status-aviso)
  - Data `dd/mm/yyyy`
  - Valor (vermelho, monospace)
  - Botão `<Trash2 />` (vermelho, AdminOnly) → `confirm()` + `DELETE despesas WHERE id`

### Alertas e Estados Especiais
- **Loading:** spinner + "Carregando..."
- **Vazio:** "Nenhuma despesa lançada ainda. Clique em 'Lançar Despesa' para começar."
- **Erro de validação:** `alerta alerta-perigo` com "Preencha descrição e valor."

### Conexões com Outros Módulos
- Lê: `despesas`
- Escreve: `despesas` (INSERT / DELETE)
- Navega: `/financeiro`

---

## 19. FECHAMENTO DE CAIXA (`/financeiro/fechamento`)
**Plano:** Apenas Pro  
**Arquivo:** `src/app/(dashboard)/financeiro/fechamento/page.tsx`

### Layout Geral
Coluna única, max-width 680px. Header + PageTabs + Seletor de Período (toggle de botões) + Grid de 3 Cards Resumo + Painel de Conferência de Caixa.

### Header da Tela
- **Título:** `🔒 Fechamento de Caixa`
- **Subtítulo:** `Confirme as entradas e saídas físicas do período`

### Abas (PageTabs)
(Mesmas do Financeiro: Visão Geral / Despesas / Fiados 📒 / Fechamento)

### Seletor de Modo (Período)
Dois botões toggle para definir o ponto de partida do fechamento:
- `📅 Diário`: calcula movimentações a partir de hoje (00:00:00).
- `📆 Mensal`: calcula movimentações a partir do primeiro dia do mês atual.

### Métricas e Cálculos de Caixa
O sistema realiza duas queries paralelas a partir da data de início selecionada:
1. `vendas` com `status = 'concluida'` e `criado_em >= data_inicio`.
2. `despesas` com `data >= data_inicio`.

#### Cards de Resumo (Grid 3 colunas)
- **💰 Entradas:** Soma do valor das vendas agrupadas por `forma_pagamento`.
- **💸 Saídas:** Soma total de despesas registradas no período.
- **🧮 Conferência:** Exibe a receita líquida esperada (`entradas - saídas`).

### Painel de Conferência Física
Campo numérico para digitação direta do operador:
- **Input:** `Saldo físico em caixa (R$)`
- **Cálculo em tempo real:** `diferença = saldoFisico - saldoEsperado`
- **Estados Visuais de Diferença:**
  - `|diferença| < 0.01` (Verde): `✓ Conferido (Sem discrepâncias)`
  - `diferença > 0` (Azul): `↑ Sobra no caixa de R$ {diferença}`
  - `diferença < 0` (Vermelho): `↓ Falta no caixa de R$ {diferença}`

### Ações e Estados Especiais
- **🔒 Confirmar Fechamento:** Altera o estado local `fechado` para `true` (nota: não persiste no banco de dados).
- **Imprimir Fechamento:** Botão aciona `window.print()` ocultando elementos interativos.
- **Loading:** Spinner com mensagem "Carregando movimentações..."
- **Estado de Fechado com Sucesso:** Exibe tela com banner `✅ Caixa fechado com sucesso!`, o resumo do saldo físico/esperado, e botões para `← Voltar` ou `Ir ao Dashboard`.

### Conexões com Outros Módulos
- Lê: `vendas`, `despesas`
- Escreve: Nenhuma persistência direta no banco de dados (estado puramente local)
- Navega: `/financeiro`, `/dashboard`

---

## 20. GARANTIAS (`/garantias`)
**Plano:** Start e Pro  
**Arquivo:** `src/app/(dashboard)/garantias/page.tsx`

### Layout Geral
Coluna única. Header + PageTabs (se plano for Pro) + Grid KPIs (3 cards) + Banner Alerta + Filtros e Busca + Tabela de Garantias + Modais Contextuais.

### Header da Tela
- **Título:** `🛡️ Controle de Garantias`
- **Subtítulo:** `{n} garantia(s) registrada(s)`

### Abas (PageTabs)
(Mesmas da OS: Garantias / Ordens de Serviço / Comissões - comissões ocultado se plano for Start)

### KPIs de Garantia (Grid 3 colunas)
Calculados em tempo real com base na data atual comparada com `data_vencimento`:
- **Garantias Ativas (Verde):** `data_vencimento >= hoje` e `status = 'ativa'`
- **Vencendo em 30 dias (Amarelo):** `data_vencimento` entre hoje e hoje + 30 dias.
- **Garantias Vencidas (Vermelho):** `data_vencimento < hoje` ou `status = 'vencida'`

### Alerta de Vencimento Condicional
Se existirem garantias vencendo nos próximos 30 dias, exibe o banner:
`⚠ {N} GARANTIA(S) VENCEM NOS PRÓXIMOS 30 DIAS.`

### Filtros e Busca
- **Toggle de Filtro:** `TODAS` | `ATIVAS` | `VENCIDAS`
- **Campo de Busca:** Input `BUSCAR PRODUTO, CLIENTE OU SÉRIE...` (busca case-insensitive em nome do produto, cliente ou serial).

### Tabela de Garantias
- **Colunas:** `Produto` · `Nº Série` · `Cliente` · `Compra` · `Vencim.` · `Restante` · `Status` · `Ações`
- **Por linha:**
  - Produto (bold) e SKU/EAN
  - Número de série (monospace) ou `-` se inexistente
  - Cliente com link rápido de WhatsApp (`wa.me`)
  - Data da compra (`dd/mm/yyyy`)
  - Data de vencimento (`dd/mm/yyyy`)
  - Dias restantes (`{n} dias restantes` ou `Vencida há {n} dias`)
  - Status Badge: `Ativa` (verde) ou `Vencida` (vermelho)
  - **Ações:**
    - **TERMO:** Abre modal contendo o "Certificado de Garantia".
    - **DEVOL. (Devolução):** Visível apenas se garantia ativa. Abre modal para registrar devolução.

### Modais do Sistema

#### 1. Certificado de Garantia (Modal in-page)
- Exibe o cabeçalho da loja, dados do cliente, especificações do produto, número de série, prazo de validade e assinaturas.
- Botões de **Fechar** ou **Imprimir** (usa print rules).

#### 2. Registrar Devolução
- Formulário para coletar detalhes do retorno:
  - **Motivo da devolução * (obrigatório):** Textarea
  - **Resolução (select):** `Troca de produto` | `Reembolso` | `Envio para reparo` | `Sem resolução por ora`
  - **Valor da devolução (R$):** Opcional, insere em `devolucoes.valor`.
- **Lógica de Estoque na Troca:** Se selecionado `Troca de produto`, o estoque do produto volta +1 em `produtos.qtd_atual` e uma movimentação é inserida em `estoque_movimentacoes` com a observação: `Retorno por troca de garantia (Venda #?)`.
- **Atualização de Status:** Atualiza `garantias.status` para `'em devolução'`.
- **Inserção:** Cria registro em `devolucoes` com `{ empresa_id, garantia_id, motivo, resolucao, valor }`.

### Conexões com Outros Módulos
- Lê: `garantias`, `produtos`
- Escreve: `garantias.status`, `produtos.qtd_atual`, `estoque_movimentacoes`, `devolucoes`

---

## 21. DETALHE GARANTIA (`/garantias/[id]`)
**Plano:** Start e Pro  
**Arquivo:** `src/app/(dashboard)/garantias/[id]/page.tsx`

### 🚨 Inconsistência Crítica Detectada
- **Uso de Mock Data:** Esta página não está integrada ao Supabase. Ela consulta dados estáticos de um objeto local hardcoded:
  ```typescript
  const mock: Record<string, Garantia> = { ... }
  ```
  Caso o `id` não exista nas chaves `'1'` ou `'2'`, o sistema exibe por padrão as informações do mock `'1'`, ignorando completamente os registros reais do banco de dados.

### Layout Geral
Card centralizado de Certificado, max-width 680px. Rodapé com assinaturas. Ações fora da área de impressão.

### Ações (ocultadas na impressão com `.no-print`)
- **Botão Voltar:** `←` redireciona para `/garantias`
- **Botão WhatsApp:** Abre mensagem automática parametrizada no número do cliente.
- **Botão Imprimir:** Aciona o comando de impressão do navegador (`window.print()`).

### Bloco de Certificado (`#certificado`)
- **Cabeçalho:** Logotipo/Nome da empresa, CNPJ e informações de contato.
- **Bloco do Produto:** Fundo verde-claro contendo nome do produto, SKU e Número de Série.
- **Bloco do Cliente:** Nome completo, documento (CPF) e telefone.
- **Grid de Vigências:** 3 colunas exibindo `Data da Compra`, `Validade até` e `Prazo total (dias)`.
- **Condicionais de Alerta:**
  - Vencida: Banner vermelho `❌ ESTA GARANTIA ESTÁ VENCIDA`.
  - Próxima do vencimento (<= 30 dias): Alerta amarelo `⚠️ ATENÇÃO: ESTA GARANTIA VENCE EM BREVE`.
- **Termos e Condições:** Texto legal detalhado de cobertura e exclusões de garantia.
- **Linhas de Assinatura:** Duas vias de assinatura (Cliente e Lojista).
- **Rodapé Técnico:** Contém a string: `Certificado gerado via NexoCommerce · nexocommerce.app/garantia/{num}` (inconsistência de marca: exibe NexoCommerce em vez de KDL Store).

### Conexões com Outros Módulos
- Lê: Estrutura estática de mocks locais
- Navega: `/garantias`

---

## 22. ORDENS DE SERVIÇO (`/ordens-de-servico`)
**Plano:** Start e Pro  
**Arquivo:** `src/app/(dashboard)/ordens-de-servico/page.tsx`

### Layout Geral
Coluna única. Header + PageTabs + KPIs + Filtros e Busca + Tabela de Ordens + Modal de Nova OS.

### Fluxo de Status das OS
As OS seguem a seguinte máquina de estados lineares:
`aguardando` ➔ `aprovado` ➔ `em_servico` ➔ `concluido` ➔ `entregue`

#### Mapeamento de Rótulos e Cores
- `aguardando`: `AGUARDANDO` (cinza / `.status-neutro`)
- `aprovado`: `APROVADO` (amarelo / `.status-aviso`)
- `em_servico`: `EM SERVIÇO` (azul / `.status-aviso`)
- `concluido`: `CONCLUÍDO` (verde / `.status-ok`)
- `entregue`: `ENTREGUE` (verde / `.status-ok`)
- `cancelado`: `CANCELADO` (vermelho / `.status-perigo`)

### Header da Tela
- **Título:** `🔧 Ordens de Serviço`
- **Subtítulo:** `{n} OS registradas · {m} em aberto`
- **Botão:** `+ NOVA OS` (abre formulário)

### Abas (PageTabs)
(Mesmas da Garantia: Garantias / Ordens de Serviço / Comissões)

### KPIs de Ordens (Grid de 3 colunas)
Exibe contagem rápida de:
1. `Em Aberto` (soma de status `aguardando`, `aprovado`, `em_servico`).
2. `Concluídas` (status `concluido`).
3. `Faturamento Previsto` (soma do `orcamento` das OS em aberto).

### Filtros e Busca
- **Filtros rápidos (toggles):** `TODAS` | `AGUARD.` | `EM SERV.` | `CONCLUÍDA` | `ENTREGUE`
- **Busca:** Input `BUSCAR OS, CLIENTE OU EQUIPAMENTO...`

### Tabela de Ordens de Serviço
- **Colunas:** `#` · `Cliente` · `Equipamento` · `Defeito` · `Técnico` · `Orçamento` · `Previsão` · `Status` · `Ações`
- **Por linha:**
  - Nº da OS (padStart com zeros)
  - Cliente (nome bold + link WhatsApp)
  - Equipamento
  - Defeito (truncado com reticências, exibe tooltip com texto completo)
  - Técnico responsável
  - Orçamento (R$ monospace)
  - Data de previsão (vermelho se estiver no passado e não finalizada)
  - Status Badge colorido correspondente
  - **Ações:**
    - **VER:** Abre detalhe da OS (`/ordens-de-servico/{id}`).
    - **Avançar Status (`→ PROX_STATUS`):** Botão verde para transicionar a OS de forma rápida no fluxo (ex: `→ EM SERVIÇO`).
    - **CANCELAR:** Exibe confirmação nativa e muda status para `cancelado`.

### Formulário Modal: Nova OS
- **Campos:**
  - `Cliente *` e `WhatsApp` (Grid 2)
  - `Equipamento *` (single)
  - `Defeito relatado *` (Textarea)
  - `Orçamento (R$)` (monetário), `Técnico responsável` e `Previsão de entrega` (Grid 3)
- **Validação:** Exibe erro se cliente, equipamento ou defeito estiverem vazios.
- **Ação Salvar:** `INSERT ordens_servico` com `{ empresa_id, cliente_nome, cliente_tel, equipamento, defeito_relatado, orcamento, tecnico, previsao, status: 'aguardando' }`.

### Conexões com Outros Módulos
- Lê: `ordens_servico`
- Escreve: `ordens_servico` (INSERT / UPDATE)

---

## 23. NOVA OS (`/ordens-de-servico/nova`)
**Plano:** Start e Pro  
**Arquivo:** `src/app/(dashboard)/ordens-de-servico/nova/page.tsx`

### Finalidade
Esta página atua puramente como um **redirecionador imediato**. 

### Comportamento
- Ao carregar a rota no navegador, o componente dispara um `useEffect` com `router.replace('/ordens-de-servico')`.
- Durante a transição de frações de segundos, exibe um ícone de carregamento (`Loader2`) centralizado com o texto `"Redirecionando..."`.
- **Nota técnica:** A funcionalidade de criação de OS foi unificada diretamente na listagem principal através de um modal.

### Conexões com Outros Módulos
- Navega: `/ordens-de-servico` (redirecionamento automático)

---

## 24. DETALHE OS (`/ordens-de-servico/[id]`)
**Plano:** Start e Pro  
**Arquivo:** `src/app/(dashboard)/ordens-de-servico/[id]/page.tsx`

### Layout Geral
Centralizado com max-width de 680px. Ações superiores (no-print) + Área de impressão de folha de OS (`#print-area`).

### Header de Ações (`.no-print`)
- **Botão Voltar:** `← Voltar` para `/ordens-de-servico`.
- **Botão WhatsApp:** Abre WhatsApp Web com mensagem contextual pré-configurada se a OS estiver concluída:
  `Olá {cliente}, sua ordem de serviço #{numero} do equipamento {equipamento} foi concluída! O valor total ficou R$ {orcamento}. Você já pode passar na loja para retirar.`
- **Botão Imprimir:** Dispara `window.print()`.

### Folha da OS (`#print-area`)
- **Cabeçalho:** Informações da loja (KDL Store), nº da OS (ex: `OS #0023`), data de abertura e badge de status com emojis parametrizados:
  - ⏳ Aguardando / ✅ Aprovado / 🔧 Em Serviço / ✔ Concluído / 📦 Entregue / ✕ Cancelado
- **Grid de Dados (2 colunas):**
  - **Cliente:** Nome completo e telefone.
  - **Dados Adicionais:** Técnico encarregado, Previsão de entrega e Orçamento final.
- **Equipamento & Defeito:** Caixa de destaque exibindo bold do equipamento e a descrição do defeito.
- **Laudo & Serviços Realizados:** Seção cinza destacada contendo o laudo técnico do serviço e observações.

### Alerta de Venda Vinculada (`.no-print`)
Caso a OS tenha sido vinculada a uma venda de peças/produtos, exibe um banner indicando:
`🔗 Esta OS está vinculada a uma venda. [Ver Recibo da Venda]` (com link direto para `/vendas/{venda_id}`).

### Botão de Ação Rápida
Se o status atual não for final (`concluido`, `entregue` ou `cancelado`), exibe o botão:
- `Marcar como Concluída`: Altera status no Supabase para `concluido` e atualiza a interface instantaneamente.

### Conexões com Outros Módulos
- Lê: `ordens_servico`
- Escreve: `ordens_servico.status` (UPDATE)
- Navega: `/ordens-de-servico`, `/vendas/{venda_id}`

---

## 25. COMISSÕES (`/comissoes`)
**Plano:** Apenas Pro  
**Arquivo:** `src/app/(dashboard)/comissoes/page.tsx`

### Layout Geral
Coluna única. Header + PageTabs + Painel de Abas Internas (Comissionados / Por Venda) + Tabela de Registros.

### Header da Tela
- **Título:** `🎯 Comissões`
- **Subtítulo:** `{n} comissionado(s) ativo(s) · {m} vendas comissionadas`
- **Botão:** `+ Cadastrar Comissionado` (abre modal de formulário)

### Abas de Página (PageTabs)
(Mesmas da OS/Garantia: Garantias / Ordens de Serviço / Comissões)

### Abas Internas da Tela
- **COMISSIONADOS:** Exibe a listagem de parceiros/puxadores de comissão cadastrados.
- **POR VENDA:** Exibe a listagem detalhada de vendas vinculadas a comissionados.

### Modal: Cadastrar Comissionado
- **Campos:**
  - `Nome *` (input text)
  - `WhatsApp` (input text)
  - **Tipo de Comissão (botões toggle):** `% Percentual` | `R$ Fixo/venda`
  - `Taxa` (input number): Label dinâmico exibe `Porcentagem (%)` ou `Valor por venda (R$)` conforme o tipo selecionado.
- **Ação Salvar:** `INSERT comissoes` com `{ empresa_id, nome, telefone, tipo_comissao: 'percentual'|'fixo', taxa, status: 'ativo' }`.

### Aba COMISSIONADOS
- **Banner de Ajuda:** `▶ COMISSIONADOS RECEBEM POR CADA VENDA ONDE FORAM INDICADORES.`
- **Tabela de Comissionados:**
  - **Colunas:** `Nome` · `WhatsApp` · `Tipo` · `Taxa` · `Status` · `Ações`
  - **Ação Status Toggle:** Botão switch muda `status` entre `'ativo'` e `'inativo'`.
  - **Ação Deletar:** Exibe confirmação nativa e executa `DELETE FROM comissoes WHERE id`.

### Aba POR VENDA (Lazy Loading)
Carrega dados de vendas apenas ao clicar pela primeira vez.
- **Cálculo de Comissão:**
  - O sistema lê `vendas.valor_comissao` gravado historicamente.
  - **Fallback:** Se `valor_comissao` for nulo, calcula dinamicamente com base na `taxa` e `tipo_comissao` atuais do comissionado.
- **KPIs Resumo (Grid 3 colunas):**
  - **Vendas comissionadas:** Contagem de vendas com indicador.
  - **Pendente de pagamento (Amarelo):** Soma de comissões com `comissao_paga = false`.
  - **Total pago (Verde):** Soma de comissões com `comissao_paga = true`.
- **🏆 Ranking de Indicadores:** Painel exibindo a lista ordenada dos comissionados que geraram maior número de vendas e comissões.
- **Tabela Detalhada de Vendas:**
  - **Colunas:** `# Venda` · `Data` · `Indicador` · `Total Venda` · `Comissão` · `Status`
  - **Controle de Status de Pagamento (AdminOnly):** Botão toggle dinâmico que alterna entre `✔ PAGO` (verde) e `○ PENDENTE` (amarelo), executando `UPDATE vendas SET comissao_paga = !comissao_paga WHERE id`.
  - **Rodapé da Tabela:** Exibe a soma total acumulada do valor das vendas e das comissões do período.

### Conexões com Outros Módulos
- Lê: `comissoes`, `vendas`
- Escreve: `comissoes` (INSERT / UPDATE / DELETE), `vendas.comissao_paga` (UPDATE)

---

## 26. RELATÓRIOS (`/relatorios`)
**Plano:** Apenas Pro  
**Arquivo:** `src/app/(dashboard)/relatorios/page.tsx`

### Layout Geral
Coluna única. Header + Seletor de Período + Painel de KPIs Gerenciais + Seções de Tabelas e Gráficos + Opções de Exportação.

### Header da Tela
- **Título:** `📈 Relatórios Gerenciais`
- **Subtítulo:** `Análise detalhada de performance`
- **Ações:**
  - `Exportar CSV` (Icon Download): Baixa o arquivo formatado `relatorio_vendas_{inicio}_a_{fim}.csv`.
  - `Imprimir` (Icon Printer): Dispara o comando de impressão nativo do navegador.

### Seletor de Período (Presets)
Inputs de data `De:` e `Até:` com botões de atalho rápido:
- `Essa semana` | `Esse mês` | `Mês anterior` | `Esse ano` | `Personalizado`

### Métricas de Performance (KPIs - Grid 4 colunas)
- **Faturamento Bruto:** Soma de `vendas.total` no período.
- **Descontos Concedidos:** Soma de `vendas.desconto` no período.
- **Total de Despesas:** Soma de `despesas.valor` no período.
- **Lucro Estimado:** Calculado como `faturamentoBruto - totalDespesas` (Verde se `>= 0`, vermelho se `< 0`).

### Detalhamento por Seções

#### 1. Formas de Pagamento
Tabela exibindo a distribuição das vendas pelas formas utilizadas:
- **Colunas:** `Forma` · `Qtd Vendas` · `Total Recebido` · `Participação (%)`

#### 2. Top 10 Produtos Mais Vendidos
Tabela ordenando os produtos com maior volume de vendas (exclui brindes):
- **Colunas:** `Produto` · `Qtd Vendida` · `Receita Gerada` · `Fração do Total (%)`

#### 3. Desempenho por Dia da Semana
**Gráfico de Barras em CSS:** Renderização sem bibliotecas externas. Exibe barras verticais para os 7 dias da semana (Dom a Sáb).
- A altura de cada barra é calculada proporcionalmente em porcentagem: `(faturamento_dia / faturamento_maximo_dia) * 100`.

#### 4. Melhores Clientes (Top 5)
Tabela detalhada mostrando os compradores mais frequentes e de maior ticket:
- **Colunas:** `Cliente` · `Nº Compras` · `Total Gasto` · `Última Compra`

#### 5. Comissões do Período
Visível apenas se houver comissionados cadastrados:
- **Colunas:** `Comissionado` · `Vendas Indicadas` · `Comissão Gerada` · `Pendente / Pago`

### Conexões com Outros Módulos
- Lê: `vendas`, `despesas`, `comissoes`, `itens_venda`
- Escreve: Nenhuma persistência direta no banco de dados

---

## 27. CONFIGURAÇÕES GERAL (`/configuracoes`)
**Plano:** Start e Pro  
**Arquivo:** `src/app/(dashboard)/configuracoes/page.tsx`

### Layout Geral
Duas colunas. Esquerda: Menu de Configurações por cartões clicáveis + Preferências do CRM. Direita: Detalhamento do Plano Atual.

### Card do Plano Atual (Direita)
Exibe borda amarela de destaque se o plano for Pro, ou verde se for Start.
- **Detalhes exibidos:** Nome do plano (START ou PRO), preço de tabela (R$ 65/mês ou R$ 95/mês) e o status da assinatura (ex: `ASSINATURA ATIVA`, `MUDANÇA AGENDADA PARA {plano}`, `CANCELADA - ACESSO ATÉ {data}`).
- **Checklist de Recursos (Features):** Exibe itens como PDV Ilimitado, Controle de Estoque, CRM de Sumiço (Apenas Pro) e Relatórios (Apenas Pro) com marcação de checked ou indisponível.
- **Ações:**
  - `⚙ GERENCIAR ASSINATURA` ou `♻ REATIVAR ASSINATURA`: Redireciona para a página interna `/configuracoes/planos`.
  - `💳 CARTÕES E FATURAS (STRIPE)`: Posta para `/api/stripe/portal` e abre o portal de faturamento do Stripe.
  - `▶ ASSINAR AGORA`: Abre fluxo de assinatura para contas inativas.
  - `👑 UPGRADE PARA PRO`: Botão rápido visível se plano for Start.

### Menu de Configurações (Esquerda)
Lista de cartões interativos de navegação com hover background e chevrons:
1. `Dados da Empresa` ➔ `/configuracoes/empresa`
2. `Usuários e Acessos` ➔ `/configuracoes/usuarios`
3. `Formas de Pagamento` ➔ `/configuracoes/pagamentos`
4. `Categorias de Produtos` ➔ `/configuracoes/categorias`
5. `Catálogo Online` ➔ `/configuracoes/catalogo` (exibe link do catálogo público)
6. `Assinatura e Planos` ➔ `/configuracoes/planos`

### Painel: Preferências do CRM (Pro)
Permite definir o limite de tempo para classificação de inatividade de clientes:
- **Input:** `ALERTAR CLIENTES INATIVOS APÓS (DIAS)` (limites: min 7, max 365).
- **Ação:** Botão `▶ Salvar` executa `UPDATE empresas SET crm_prazo_inatividade_dias = novo_valor WHERE id`. Exibe toast de sucesso.

### Zona de Perigo (Danger Zone)
Ocultada se a assinatura já estiver agendada para cancelamento.
- **Botão:** `⚠ CANCELAR MINHA ASSINATURA`
- **Fluxo:** Confirmação em duas etapas. Se confirmado, posta para `/api/stripe/portal` passando `{ empresaId, flow: 'cancel' }`, redirecionando o lojista diretamente para a tela de cancelamento no Stripe.

### Rodapé da Página
`KDL STORE v1.2.0 · FEITO PARA O PEQUENO COMÉRCIO BRASILEIRO`

### Conexões com Outros Módulos
- Lê: `subscriptions`, `empresas`
- Escreve: `empresas.crm_prazo_inatividade_dias` (UPDATE)
- Navega: Rotas internas de configurações, `/api/stripe/portal`

---

## 28. CONFIG. EMPRESA (`/configuracoes/empresa`)
**Plano:** Start e Pro  
**Arquivo:** `src/app/(dashboard)/configuracoes/empresa/page.tsx`

### Layout Geral
Coluna única. Header + Formulários divididos por seções lógicas de dados + Botão Salvar inferior.

### Header da Tela
- **Título:** `🏢 Dados da Empresa`
- **Subtítulo:** `Informações da sua loja · Plano: {plano}`

### Seções de Formulário

#### 1. 🏷️ Identificação
- `Nome da Loja *` (obrigatório)
- **Link do catálogo público:** Prefixo não editável `loja/` + input do slug.
  - **Lógica de sanitização do slug em tempo real:** Remove acentos, caracteres especiais e espaços, convertendo para minúsculas:
    ```typescript
    slug.toLowerCase().replace(/[^a-z0-9-]/g, '')
    ```
- `CNPJ / CPF` e `E-mail de Contato` (Grid 2 colunas)

#### 2. 📍 Localização
- `Endereço completo`
- `Cidade` e `Estado` (Grid 2 colunas, Estado é um Select com as 27 UFs brasileiras).

#### 3. 📱 Contato e Redes Sociais
- `WhatsApp` e `Telefone Fixo` (Grid 2 colunas)
- `Instagram` (exibe prefixo `@` fixado no input)

### Ação Salvar
Executa `UPDATE empresas` com os dados informados e sanitizados. Valida se o nome foi preenchido. Apresenta banner de confirmação por 3 segundos.

### Conexões com Outros Módulos
- Lê: `empresas`
- Escreve: `empresas` (UPDATE)
- Navega: `/configuracoes`

---

## 29. CONFIG. USUÁRIOS (`/configuracoes/usuarios`)
**Plano:** Start e Pro  
**Arquivo:** `src/app/(dashboard)/configuracoes/usuarios/page.tsx`

### Layout Geral
Coluna única. Header + Grid de Cartão de Novo Convite e Convites Pendentes + Tabela de Usuários Ativos + Painel Informativo de Papéis.

### Header da Tela
- **Título:** `👥 Usuários & Acessos`
- **Subtítulo:** `{n} usuário(s) ativo(s) na empresa`

### Seção de Convites (Novos Acessos)

#### 1. Modal / Form "Convidar Usuário"
- **Campos:**
  - `Nome (opcional)`
  - `E-mail *` (obrigatório)
  - **Papel (botões toggle):** `Vendedor` | `Estoquista` | `Admin`
- **Lógica de descrição de papel:** O painel exibe dinamicamente o que o papel selecionado pode acessar.
- **Ação:** Botão `Gerar Link de Acesso` posta para `/api/convite` passando `{ email, nome, papel, empresaId }`.

#### 2. Painel de Convites Pendentes
Exibe a lista de convites gerados e ainda não aceitos.
- Mostra: E-mail, papel, data de expiração e status.
- **Ações:**
  - **Copiar Link:** Gera e copia o link completo `window.location.origin + '/convite?token=' + token`. Exibe confirmação de copiado por 2.5s.
  - **Cancelar (✕):** Altera o status do convite para `'cancelado'` no banco de dados.

### Tabela de Usuários Ativos
Lista de colaboradores com contas ativas vinculadas à empresa:
- **Colunas:** `Usuário` · `Papel` · `Status` · `Membro Desde` · `Ações`
- **Por linha:**
  - Usuário: Nome e e-mail (exibe tag `← você` no usuário logado).
  - Papel: Select dropdown permitindo alteração imediata de papel (`admin` | `vendedor` | `estoquista`), executando `UPDATE profiles SET papel = novo_papel`.
  - Status Badge: `Ativo` (verde), `Congelado` (azul) ou `Inativo` (cinza).
  - **Ações (desabilitadas para a própria conta logada):**
    - **Congelar/Ativar:** Botão switch. Executa `UPDATE profiles SET status = 'congelado'|'ativo'`. Se congelado, o Supabase Realtime detecta e expulsa o usuário do sistema em tempo real.
    - **Remover (Trash):** Soft delete. Executa `UPDATE profiles SET empresa_id = null, status = 'excluido'`.

### Conexões com Outros Módulos
- Lê: `profiles`, `convites`
- Escreve: `profiles` (UPDATE), `convites` (INSERT / UPDATE)

---

## 30. CONFIG. PAGAMENTOS (`/configuracoes/pagamentos`)
**Plano:** Start e Pro  
**Arquivo:** `src/app/(dashboard)/configuracoes/pagamentos/page.tsx`

### Layout Geral
Coluna única, max-width 680px. Header + Formulário de Nova Forma + Lista de Formas Ativas e Inativas.

### Métodos de Pagamento Iniciais
O sistema possui 5 formas padrões que são auto-inseridas via Trigger do Supabase na criação da empresa:
- `Dinheiro` (taxa 0%) · `PIX` (taxa 0%) · `Cartão Débito` (taxa 1.5%) · `Cartão Crédito` (taxa 2.99%) · `Fiado` (taxa 0%)
- **Mapeamento de Ícones:** PIX (📱), Dinheiro (💵), Crédito (💳), Débito (💴), Fiado (📒).

### Formulário de Cadastro
- **Campos:** `Nova forma` (text) e `Taxa (%)` (number step 0.1).
- **Ação:** Botão `Adicionar` executa `INSERT INTO formas_pagamento`.

### Listagem de Formas
Exibidas em cartões flexbox. Formas desativadas ficam com opacidade reduzida (`0.55`).
- **Campos:** Ícone correspondente, nome da forma e taxa cadastrada (se maior que zero).
- **Ações:**
  - **Toggle Ativo/Inativo:** Switch altera `ativo` (true/false) no banco. Se desativado, a forma deixa de aparecer no PDV de novas vendas.
  - **Excluir (Trash):** Executa `DELETE FROM formas_pagamento WHERE id`.

### Conexões com Outros Módulos
- Lê: `formas_pagamento`
- Escreve: `formas_pagamento` (INSERT / UPDATE / DELETE)

---

## 31. CONFIG. CATEGORIAS (`/configuracoes/categorias`)
**Plano:** Start e Pro  
**Arquivo:** `src/app/(dashboard)/configuracoes/categorias/page.tsx`

### Layout Geral
Coluna única. Header + Bloco de Criação Rápida + Grid de Categorias Cadastradas.

### Seção Nova Categoria
- **Campos:**
  - `Nome da Categoria`
  - **Seletor de Cor:** Grid circular com 8 cores predefinidas:
    - Verde (`#22c55e`), Azul (`#3b82f6`), Amarelo (`#f59e0b`), Vermelho (`#ef4444`), Roxo (`#8b5cf6`), Ciano (`#06b6d4`), Laranja (`#f97316`), Rosa (`#ec4899`).
    - A cor selecionada recebe um efeito CSS de escala (`scale(1.2)`) e borda forte de destaque.
  - **Visualização:** Badge dinâmico de preview da categoria contendo o nome digitado e a cor selecionada.
- **Ação:** Tecla `Enter` ou botão `Salvar Categoria` executa `INSERT INTO categorias_produto`.

### Grid de Categorias
Exibe cartões com círculo de cor, nome da categoria em negrito, data de criação formatada e botão trash para excluir com confirmação (`DELETE FROM categorias_produto WHERE id`).

### Conexões com Outros Módulos
- Lê: `categorias_produto`
- Escreve: `categorias_produto` (INSERT / DELETE)

---

## 32. CONFIG. PLANOS (`/configuracoes/planos`)
**Plano:** Start e Pro  
**Arquivo:** `src/app/(dashboard)/configuracoes/planos/page.tsx`

### Layout Geral
Coluna única. Header + Resumo da Assinatura Atual + Painel de Ações de Planos (Stripe Billing Integration) + Modais de Confirmação.

### Integração Stripe Status
A página faz chamadas seguras para a rota `/api/stripe/status` para resgatar os metadados e status reais da assinatura:
- Estado da assinatura (active, past_due, trialing, cancelled, inactive).
- Sinalização se há cancelamento ou mudança de plano agendados para o fim do período.

### Card Resumo
- Exibe ícone `Crown` de destaque (coroas coloridas baseadas no plano).
- Status colorido (Verde para `Ativo`, Amarelo para `Agendado`, Vermelho para `Atrasado`).
- Exibição do Próximo Pagamento com data formatada.

### Ações e Fluxos Stripe

#### 1. Mudar para Pro (Upgrade)
- Disponível se plano atual for Start.
- **Comportamento:** O upgrade é imediato. O Stripe calcula o valor proporcional restante do plano Start e o desconta na fatura de upgrade (proration).
- Abre modal explicativo de upgrade antes de disparar o POST para `/api/stripe/mudar-plano`.

#### 2. Mudar para Start (Downgrade)
- Disponível se plano atual for Pro.
- **Comportamento:** O downgrade é agendado para o próximo ciclo de cobrança. O usuário permanece Pro até o final do período e a cobrança é reduzida no próximo vencimento.
- **Modal de Aviso de Recursos:** O modal lista detalhadamente todos os recursos PRO que o lojista perderá após a transição (Financeiro, Relatórios Gerenciais, CRM, Comissões e Fechamento de Caixa).

#### 3. Cancelar Assinatura
- Disponível para assinaturas ativas.
- Dispara POST para `/api/stripe/cancelar` que define `cancel_at_period_end = true` no Stripe.
- Exibe banner informativo de que o acesso continuará até o término do ciclo atual e que as informações de cadastro serão salvas por 90 dias.

#### 4. Reativar Assinatura
- Disponível se o cancelamento estiver agendado mas o ciclo não tiver terminado.
- Aciona a API do Stripe para reverter a flag `cancel_at_period_end` para `false`.

### Conexões com Outros Módulos
- Lê: `/api/stripe/status` (GET)
- Escreve: `/api/stripe/mudar-plano`, `/api/stripe/portal`, `/api/stripe/cancelar` (POST)

---

## 33. COMPONENTES REUTILIZÁVEIS (`src/components/`)
**Plano:** Start e Pro  
O sistema utiliza um conjunto de componentes centralizados para controle de acesso, formulários complexos de cadastro e painéis analíticos interativos.

### 1. `AdminOnly.tsx`
Componente wrapper de controle de autorização baseado em papel administrativo.
- **Lógica de Acesso:** Consome o hook `usePapel()`. Se `loading` for `false` e `isAdmin` for `false`, e houver uma propriedade `fallbackRedirect` (string) fornecida, redireciona o usuário usando `router.replace(fallbackRedirect)`.
- **Renderização:** Enquanto `loading` for verdadeiro ou se o usuário não for administrador (`!isAdmin`), retorna `null` para evitar vazamento de tela/conteúdo. Caso contrário, renderiza os filhos `{children}` normalmente.

### 2. `OperadorOnly.tsx`
Componente wrapper de autorização para restringir acesso apenas a colaboradores com papéis de nível igual ou superior a operador (Admin e Operador).
- **Lógica de Acesso:** Consome o hook `usePapel()`. Se `loading` for `false` e `isOperador` (ou `isAdmin`) for `false`, e houver `fallbackRedirect` fornecido, efetua o redirecionamento.
- **Renderização:** Retorna `null` se carregando ou se o papel não for qualificado, protegendo trechos específicos do layout.

### 3. `ProOnly.tsx`
Componente de barreira comercial que restringe recursos exclusivos do plano Pro.
- **Lógica de Acesso:** Consome o hook `useSubscription()`.
- **Renderização:**
  - Se `loading` for verdadeiro, renderiza provisoriamente os filhos `{children}`.
  - Se o plano ativo for `'pro'`, renderiza `{children}`.
  - Se o plano for `'start'`, retorna `null` de forma silenciosa (Nota: A implementação técnica do componente não renderiza nenhum modal/upsell de bloqueio visível ou tela de plano, ao contrário do alegado nos comentários internos do código).

### 4. `PageTabs.tsx`
Componente estrutural para abas de navegação interna nos submódulos (ex: Configurações, Relatórios).
- **Parâmetros:** Recebe um array `tabs` com objetos contendo `{ label: string; href: string }`.
- **Estilo Visual:** Container flexível horizontal com borda inferior sólida `2px solid var(--borda)`.
- **Aba Ativa:** Identificada comparando o `pathname` do Next.js. Exibe o caractere `▶ ` antes do título da aba em letras maiúsculas, com cor `var(--verde)` e borda inferior correspondente. Abas inativas usam a cor `var(--texto-desab)` e `transparent`.

### 5. `EmConstrucao.tsx`
Template genérico monospace para telas/recursos em fase de implementação.
- **Parâmetros:** Recebe um `titulo` opcional.
- **Interface e Elementos:**
  - Texto verde centralizado com fonte mono: `// MÓDULO EM DESENVOLVIMENTO //`.
  - Título em letras maiúsculas seguido por um caractere piscante `_` simulando terminal.
  - Subtexto explicativo cinza: `ESTA FUNCIONALIDADE ESTÁ SENDO DESENVOLVIDA E ESTARÁ DISPONÍVEL EM BREVE.`
  - Botão cinza fosco `← VOLTAR` que aciona `router.back()`.

### 6. `FormCliente.tsx`
Formulário inteligente e modularizado para cadastro rápido de novos clientes.
- **Campos do Formulário:**
  - `Nome completo *` (campo de texto obrigatório, identificador: `cli-nome`).
  - `Telefone / WhatsApp` (campo de texto, id: `cli-tel`).
  - `CPF` (fonte mono, id: `cli-cpf`, placeholder formatado: `000.000.000-00`).
  - `E-mail` (campo do tipo email, id: `cli-email`).
  - **Endereço Estruturado** (agrupado em container dedicado):
    - `CEP`: Campo numérico de 8 dígitos (`00000-000`) com busca de CEP ativa que consome a API externa do **ViaCEP** (`https://viacep.com.br/ws/[cep]/json/`) ao preencher ou ao clicar no botão de busca. Auto-preenche rua, bairro, cidade e estado.
    - `Rua / Logradouro`: Campo de texto.
    - `Número` e `Complemento` (Apto, bloco, sala, etc.).
    - `Bairro` e `Cidade`: Campos de texto.
    - `UF`: Campo de 2 caracteres em maiúsculo (ex: SP).
  - `Anotações` (textarea sem redimensionamento, 2 linhas, id: `cli-obs`).
- **Seletor de Tipo de Cliente:** Grid com 3 colunas toggleables (`varejo` | `atacado` | `vip`):
  - `🏪 Varejo` (Preço normal)
  - `📦 Atacado` (Preço de atacado)
  - `⭐ VIP` (Preço especial)
  - O tipo selecionado recebe borda verde `2px solid var(--verde)` e fundo `var(--verde-claro)`.
- **Ações:** Botão `Salvar cliente` com ícone `Save` e feedback visual de salvamento (`Loader2` com rotação 360° infinita) que serializa o endereço estruturado como uma string JSON e executa a transação direta de `INSERT` na tabela `clientes` com os dados digitados e `empresa_id` capturado no contexto de sessão. Retrocompatibilidade automática garante que endereços antigos em formato texto simples sejam lidos e salvos corretamente sem perda de informação.

### 7. `FormFornecedor.tsx`
Formulário completo para credenciamento e rastreamento de distribuidores parceiros.
- **Campos do Formulário:**
  - `Nome da empresa *` (obrigatório, id: `f-nome`).
  - `Nome do contato` (id: `f-contato`).
  - `CNPJ` (id: `f-cnpj`).
  - `Telefone / WhatsApp` (id: `f-tel`).
  - `E-mail` (id: `f-email`).
  - `Categoria` (select predefinido: `Eletrônicos`, `Acessórios`, `Autopeças`, `Serviços`, `Embalagens`, `Outros`, id: `f-cat`).
  - `Prazo de entrega` (id: `f-prazo`).
  - `Cidade` e `Estado` (seletor drop-down com as 27 UFs brasileiras, ids: `f-cidade` e `f-estado`).
  - `Pedido mínimo (R$)` (campo numérico decimal precedido pelo prefixo estático `R$`, id: `f-pedmin`).
  - `Anotações` (textarea, id: `f-obs`).
- **Ações:** Botão `Salvar fornecedor` executa a chamada assíncrona ao banco na tabela `fornecedores` validando dados e atualizando o status inicial do fornecedor como ativo (`ativo: true`).

### 8. `FormProduto.tsx`
O formulário de cadastro de produtos é a peça central do estoque, agrupando controle fiscal, controle de lotes, gestão de precificação dinâmica e integração com câmera.
- **Destaque Visual - Margem de Lucro Dinâmica:** Se o preço de custo e o preço de venda de varejo forem preenchidos com valores maiores que zero, um banner verde flexbox calcula em tempo real a margem de lucro (`((varejo - custo) / varejo * 100)`) exibindo o percentual em fonte mono negrito de destaque.
- **Campos Agrupados:**
  - **📸 Imagem do Produto:** Bloco de arrastar/selecionar imagem de até 2MB. Mostra preview em miniatura. Faz upload no bucket Supabase Storage `produtos` sob a pasta `{empresa_id}/{timestamp}-{hash}.ext` gerando a URL pública.
  - **📦 Identificação:**
    - `Nome do Produto` (Obrigatório).
    - `SKU (Código interno)` (Permite inserção manual ou geração aleatória imediata via botão com ícone `RefreshCw` invocando `generateSKU()`. Contém dica explicativa).
    - `Código de Barras (EAN/ISBN)` (Integrado ao modal scanner via câmera. Contém dica explicativa).
  - **🏷️ Categorias & Atributos:**
    - `Categoria` (Dropdown). Possui botão ao lado (`+`) para cadastrar categorias inline rapidamente em modal flutuante sem perder o preenchimento do formulário.
    - `Preço Custo`, `Preço Varejo` (Obrigatório), `Preço Atacado` (com dica explicativa) e `Preço VIP` (com dica explicativa).
    - `Preço Mínimo` (Bloqueio automático de desconto no PDV. Contém dica explicativa).
  - **🗃️ Estoque & Logística:**
    - `Quantidade Atual`, `Quantidade Mínima` (Alerta de reposição, com dica explicativa) e `Quantidade Máxima` (com dica explicativa).
    - `Qtd Mínima p/ Atacado` (com dica explicativa) e `Localização` (ex: Prateleira B2).
  - **⚙️ Configurações Especiais (Botões Toggle Estilo Switch):**
    - `Pode ser brinde?` (Toggle).
    - `Controlar número de série?` (Toggle - exige digitação de serial no PDV).
    - `Ativo no catálogo público?` (Toggle).
    - `Produto em Destaque?` (Toggle).
    - `Tem garantia contratual?` (Toggle - abre dinamicamente os campos de `Dias de Garantia` e `Termos de Garantia`).
- **Ações:** Valida dados obrigatorios, verifica duplicidade de SKU no banco e executa o `INSERT INTO produtos` incluindo todos os parâmetros e caminhos de arquivos.

### 9. `ComoFoiPainel.tsx`
Painel analítico do desempenho do negócio para acompanhamento em tempo real.
- **Abas de Período:** Ontem, Essa semana, Esse mês, Esse ano. O sistema calcula datas retroativas de início e fim no fuso horário para buscar os agregados e as faturas do período anterior correspondente (faturamento de referência).
- **Indicadores Principais (KPIs):**
  - **Faturamento:** Soma total de vendas concluídas. Clicar no cartão de faturamento abre um modal dinâmico listando o extrato detalhado de cada venda no período (data, cliente, itens, total).
  - **Vendas:** Quantidade total de pedidos faturados.
  - **Ticket Médio:** Razão entre faturamento e número de vendas.
  - **Despesas:** Total de despesas pagas. Clicar abre modal contendo listagem detalhada das saídas do caixa.
  - **Lucro Estimado:** Diferença direta entre faturamento e despesas.
- **Inteligência Gerencial (Insights):** O painel analisa o desempenho e exibe dinamicamente banners de alertas gerenciais personalizados:
  - *"Você perdeu vendas por falta de estoque. Hora de repor."* (se houver vendas de produtos cujo estoque atual é igual ou menor que zero).
  - *"Você vendeu bem mas os custos pesaram. Revise as despesas."* (se a margem líquida for menor que 15% e houver despesas ativas).
  - *"Dia fraco/Semana abaixo da média. Ainda dá tempo..."* (se o faturamento for 20% ou mais inferior ao do período anterior).
  - *"Resultado positivo no período / Dia lucrativo."* (se houve lucro real positivo).
- **Compartilhamento WhatsApp:** Botão verde que serializa os KPIs, ticket médio, fiado em aberto e frase de insights em texto formatado com emojis e gera o link seguro do WhatsApp Web (`https://wa.me/?text=...`) para compartilhamento rápido com sócios ou gerentes.

### 10. `BarcodeScannerModal.tsx`
Integração com câmera nativa do dispositivo para leitura física de produtos pelo PDV ou Inventário.
- **Tecnologia:** Utiliza a biblioteca `@zxing/library` (`BrowserMultiFormatReader`).
- **Comportamento e Seleção de Câmera:** Mapeia os dispositivos de vídeo do sistema. Prioriza a câmera traseira do celular ou notebook (buscando as labels "back" ou "traseira" no identificador de hardware). Se não achar, abre a primeira câmera padrão disponível.
- **Ações de Leitura:** Roda um loop de detecção contínua sobre a tag `<video>` do HTML. Ao decodificar com sucesso qualquer código de barras, executa a propriedade callback `onScan(codigo)`, desliga os feeds de mídia da câmera imediatamente e fecha o modal.
- **Hook `useHasCamera`:** Mapeia nativamente o array de periféricos (`navigator.mediaDevices.enumerateDevices`) e retorna se há algum hardware de entrada de vídeo ativo (`videoinput`), controlando a exibição do botão de escanear nas telas do sistema.

---

## 34. ROTAS DE API (`src/app/api/`)
**Plano:** Start e Pro  
O sistema utiliza rotas de API seguras integradas ao Next.js Route Handlers executando lógica de servidor protegida (bypass de RLS pelo Supabase Admin com `service_role`).

### 1. Rota de Convite de Colaboradores (`/api/convite/route.ts`)
Responsável pelo envio e registro de novos membros da equipe.
- **Método:** `POST`
- **Fluxo de Processamento:**
  1. Recebe `{ email, nome, papel, empresaId }` no corpo da requisição.
  2. Valida a presença dos parâmetros essenciais (`email` e `empresaId`).
  3. Cria o cliente administrativo `supabaseAdmin` utilizando a chave de bypass de segurança `SUPABASE_SERVICE_ROLE_KEY`.
  4. Gera um token seguro de 64 caracteres hexadecimais aleatórios.
  5. Insere o registro na tabela `convites` com status `'pendente'` e validade estendida para 7 dias (`expira_em`).
  6. Dispara o e-mail de convite utilizando a API nativa do Supabase Auth: `supabaseAdmin.auth.admin.inviteUserByEmail()`, contendo nos metadados as propriedades `{ invite_token, empresa_id, papel, nome }` e a URL de redirecionamento segura `/convite?token={token}` baseada no host atual do lojista (`NEXT_PUBLIC_SITE_URL`).
  7. Se o envio de e-mail falhar, remove fisicamente o registro de convite recém-criado para evitar chaves órfãs e retorna código `500`.

### 2. Sincronização de Status Stripe (`/api/stripe/status/route.ts`)
Busca em tempo real as configurações e estados de assinaturas diretamente da API do Stripe, garantindo total integridade com a listagem interna do banco.
- **Método:** `GET`
- **Parâmetros:** `empresaId` (Query string)
- **Fluxo de Processamento:**
  1. Lê os dados da tabela `subscriptions` da empresa informada.
  2. Se a empresa não possui `stripe_subscription_id` cadastrada, retorna os dados secos salvos localmente.
  3. Efetua a requisição segura `stripe.subscriptions.retrieve()` usando a chave secreta.
  4. Extrai a propriedade `scheduled_plan` gravada na metadata da assinatura ou, caso não exista, busca na fila de planos agendados (`subscriptionSchedules`) do Stripe Customer ativo para descobrir se há migrações futuras pendentes.
  5. Limpa a sinalização se o plano agendado já for o plano corrente.
  6. Retorna a assinatura local estendida com os metadados dinâmicos e atualizados do Stripe: `status`, `cancel_at_period_end` (booleano), `current_period_end` (data formatada de encerramento de ciclo) e `scheduled_plan` (plano de destino agendado).

### 3. Criação de Checkout Stripe (`/api/stripe/checkout/route.ts`)
Gera sessões de pagamento seguras para adesão aos planos Start e Pro.
- **Método:** `POST`
- **Fluxo de Processamento:**
  1. Recebe `{ plano, empresaId }` do corpo do post.
  2. Autentica a sessão do usuário chamando `supabase.auth.getUser()`.
  3. Busca na tabela local `subscriptions` se o lojista já possui uma assinatura ativa (`active` ou `trialing`). Se possuir, impede a operação e avisa que upgrades/downgrades devem ser efetuados pela rota específica.
  4. Se o lojista não tiver um `stripe_customer_id` gerado, aciona a criação do cliente no Stripe via `stripe.customers.create()` passando o e-mail do usuário e `{ empresa_id }` na metadata, e atualiza a tabela `subscriptions` com o ID criado.
  5. Mapeia o plano desejado para os IDs de preço oficiais configurados nas variáveis de ambiente (`STRIPE_PRICE_PRO` ou `STRIPE_PRICE_START`).
  6. Cria a sessão de checkout no Stripe com modo `subscription`, permitindo cupons de desconto (`allow_promotion_codes: true`), definindo URLs de retorno de sucesso (`/dashboard?sucesso=1`) e cancelamento (`/assinar`).
  7. Retorna a URL segura de redirecionamento gerada pelo Stripe para o frontend.

### 4. Transição de Assinatura (`/api/stripe/mudar-plano/route.ts`)
Trata de atualizações imediatas de assinatura ou agendamentos de downgrades.
- **Método:** `POST`
- **Fluxo de Processamento:**
  1. Recebe `{ plano_destino, empresaId }` e autentica o usuário.
  2. Localiza a assinatura e verifica se a conta já se encontra no plano de destino.
  3. **Fluxo de Upgrade (Start ➔ Pro):**
     - O upgrade entra em vigor de forma imediata.
     - Se houver algum agendamento pendente (`schedule` ativo), remove-o via `stripe.subscriptionSchedules.release()`.
     - Atualiza o item de assinatura no Stripe definindo o novo preço e configura `proration_behavior` como `'create_prorations'`, efetuando o cálculo proporcional de créditos não utilizados do plano Start para abater na fatura.
  4. **Fluxo de Downgrade (Pro ➔ Start):**
     - O downgrade é agendado para o fim do ciclo vigente para preservar o valor pago pelo lojista.
     - Cria ou atualiza um cronograma de assinatura (`subscriptionSchedules`) a partir da assinatura ativa do Stripe.
     - Divide o plano em fases: Fase 1 (mantém as condições Pro até o término da data de vencimento do ciclo atual `current_period_end`) e Fase 2 (inicia a transição do item de assinatura para o preço do plano Start com `proration_behavior: 'none'`).
     - Atualiza a metadata da assinatura do Stripe com `{ scheduled_plan: 'start' }` para sincronia instantânea no front.

### 5. Portal de Faturamento do Cliente (`/api/stripe/portal/route.ts`)
Gera links temporários do Stripe Customer Portal para que o cliente gerencie meios de pagamento de forma autônoma.
- **Método:** `POST`
- **Fluxo de Processamento:**
  1. Recebe `{ empresaId, flow }` e valida autenticação.
  2. Resgata o ID do cliente Stripe na tabela `subscriptions`.
  3. Configura a URL de redirecionamento final para `/configuracoes/planos`.
  4. **Fluxo Direto de Cancelamento (`flow === 'cancel'`):** Se acionado para cancelamento rápido, insere um parâmetro `flow_data` instruindo o portal do Stripe a abrir a sessão já dentro do assistente de cancelamento de assinatura (`subscription_cancel`), com redirecionamento de retorno apontando direto para `/configuracoes` após a conclusão.
  5. Dispara `stripe.billingPortal.sessions.create()` e retorna o link de acesso seguro.

### 6. Cancelamento Seguro (`/api/stripe/cancelar/route.ts`)
Programa o encerramento da assinatura contratada para o término do ciclo.
- **Método:** `POST`
- **Fluxo de Processamento:**
  1. Recebe `{ empresaId }` e autentica a sessão.
  2. Carrega a ID da assinatura e executa o comando `stripe.subscriptions.update()` alterando a propriedade lógica `cancel_at_period_end` para `true`.
  3. Não remove a assinatura do banco de imediato: o status permanece ativo até que o Stripe dispare o webhook definitivo de remoção.

### 7. Webhook do Stripe (`/api/stripe/webhook/route.ts`)
O coração financeiro do sistema. Escuta de forma assíncrona todas as movimentações e atualizações geradas pela infraestrutura do Stripe, sincronizando em tempo real com o banco de dados Supabase sob privilégios administrativos.
- **Método:** `POST`
- **Eventos Monitorados e Ações Práticas:**
  - `checkout.session.completed` (Nova contratação realizada):
    - Extrai metadados (`empresa_id`, `plano`). Efetua consulta de informações do plano no Stripe.
    - Insere ou atualiza o registro correspondente na tabela `subscriptions` com o status `'active'`, data de início, preço final pago em centavos, ID do cliente, ID da assinatura, ID do preço do Stripe, booleano de agendamento de cancelamento e o timestamp limite de acesso do ciclo atual.
    - Sincroniza a tabela principal de empresas atualizando a coluna `empresas.plano` para `'pro'` ou `'start'` de acordo com o preço contratado.
  - `invoice.payment_succeeded` (Renovação de ciclo ou pagamento em atraso regularizado):
    - Identifica a assinatura Stripe, busca o período vigente e define o status da assinatura local como `'active'`.
    - Sobrescreve e sincroniza a coluna `empresas.plano` da tabela da loja correspondente ao e-mail de faturamento do cliente, restabelecendo ou mantendo as permissões de acesso aos recursos avançados.
  - `invoice.payment_failed` (Falha no débito ou assinatura vencida):
    - O Stripe tenta cobrar e falha.
    - Localiza o registro e altera o status da assinatura local para `'past_due'`.
  - `customer.subscription.updated` (Qualquer alteração cadastral, prorrogação ou mudança de ciclo executada diretamente no Stripe):
    - Atualiza os campos chaves da tabela local `subscriptions`: `status`, `cancel_at_period_end` (booleano), `current_period_end` (data de expiração), `proximo_pagamento` e o plano ativo (atualizado dinamicamente caso um downgrade agendado tenha entrado em vigor no ciclo atual).
  - `customer.subscription.deleted` (Assinatura oficialmente cancelada, expirada ou inadimplente por período contínuo):
    - Disparado no fim efetivo da vigência ou após cancelamento definitivo.
    - Atualiza o registro na tabela `subscriptions` definindo `status` como `'cancelled'` e redefine a coluna da empresa do lojista (`empresas.plano`) para `'start'`, bloqueando de forma automática todos os módulos Pro e retornando a conta para as limitações padrão do sistema.

---

## 35. SCHEMA DO BANCO DE DADOS (`database.sql`)
**Plano:** Start e Pro  
O modelo de dados completo do sistema KDL Store roda sobre o banco Supabase PostgreSQL. Abaixo encontra-se o mapeamento físico e lógico das tabelas, tipos enumerados, gatilhos (triggers), regras de RLS (Segurança a Nível de Linha) e funções de RPC.

### 1. Tipos Enumerados (Custom PostgreSQL Enums)
O banco padroniza o estado de variáveis e restrições através de enums nativos:
- `papel_usuario`: `'admin'` | `'operador'` | `'visualizador'` (restringe papéis na equipe).
- `status_usuario`: `'ativo'` | `'congelado'` | `'excluido'` (bloqueia o login e o fluxo do Realtime).
- `status_plano`: `'active'` | `'inactive'` | `'cancelled'` | `'trialing'` | `'past_due'` (vinculado ao Stripe).
- `tipo_plano`: `'start'` | `'pro'` (mapeamento comercial do lojista).
- `status_venda`: `'concluida'` | `'cancelada'` | `'pendente'` (PDV).
- `status_fiado`: `'aberto'` | `'pago'` (módulo CRM/Fiados).
- `tipo_movimentacao`: `'entrada'` | `'saida'` | `'ajuste'` | `'brinde'` | `'devolucao'` (logística de estoque).
- `status_os`: `'aberto'` | `'em_andamento'` | `'concluido'` | `'cancelado'` (ordens de serviço).
- `status_garantia`: `'ativa'` | `'em_analise'` | `'em_devolucao'` | `'finalizada'` (pós-venda).
- `status_pedido`: `'rascunho'` | `'enviado'` | `'recebido'` | `'cancelado'` (pedidos a fornecedor).
- `status_convite`: `'pendente'` | `'aceito'` | `'cancelado'` | `'expirado'` (convites por e-mail).

### 2. Dicionário de Tabelas e Atributos Físicos

```
┌───────────────────────────────────────────────────────────────────────────┐
│                                 empresas                                  │
├──────────────────────────────┬─────────────┬──────────────────────────────┤
│ Campo                        │ Tipo        │ Restrições                   │
├──────────────────────────────┼─────────────┼──────────────────────────────┤
│ id                           │ UUID        │ PK DEFAULT uuid_generate_v4()│
│ nome                         │ TEXT        │ NOT NULL                     │
│ telefone                     │ TEXT        │                              │
│ whatsapp                     │ TEXT        │                              │
│ instagram                    │ TEXT        │                              │
│ cidade                       │ TEXT        │                              │
│ slug                         │ TEXT        │ UNIQUE                       │
│ plano                        │ tipo_plano  │ NOT NULL DEFAULT 'start'     │
│ crm_prazo_inatividade_dias   │ INT         │ NOT NULL DEFAULT 60          │
│ criado_em                    │ TIMESTAMPTZ │ NOT NULL DEFAULT NOW()       │
└──────────────────────────────┴─────────────┴──────────────────────────────┘
```

```
┌───────────────────────────────────────────────────────────────────────────┐
│                                 profiles                                  │
├──────────────────────────────┬─────────────┬──────────────────────────────┤
│ Campo                        │ Tipo        │ Restrições                   │
├──────────────────────────────┼─────────────┼──────────────────────────────┤
│ id                           │ UUID        │ PK REFERENCES auth.users     │
│ empresa_id                   │ UUID        │ REFERENCES empresas          │
│ nome                         │ TEXT        │                              │
│ papel                        │ papel_user  │ NOT NULL DEFAULT 'admin'     │
│ status                       │ status_user │ NOT NULL DEFAULT 'ativo'     │
│ criado_em                    │ TIMESTAMPTZ │ NOT NULL DEFAULT NOW()       │
└──────────────────────────────┴─────────────┴──────────────────────────────┘
```

```
┌───────────────────────────────────────────────────────────────────────────┐
│                               subscriptions                               │
├──────────────────────────────┬─────────────┬──────────────────────────────┤
│ Campo                        │ Tipo        │ Restrições                   │
├──────────────────────────────┼─────────────┼──────────────────────────────┤
│ id                           │ UUID        │ PK DEFAULT uuid_generate_v4()│
│ empresa_id                   │ UUID        │ NOT NULL UNIQUE REF empresas │
│ plano                        │ tipo_plano  │ NOT NULL DEFAULT 'start'     │
│ status                       │ status_plano│ NOT NULL DEFAULT 'active'    │
│ preco                        │ INT         │ NOT NULL DEFAULT 6500        │
│ inicio                       │ TIMESTAMPTZ │ NOT NULL DEFAULT NOW()       │
│ proximo_pagamento            │ TIMESTAMPTZ │                              │
│ stripe_customer_id           │ TEXT        │ UNIQUE                       │
│ stripe_subscription_id       │ TEXT        │ UNIQUE                       │
│ stripe_price_id              │ TEXT        │                              │
│ cancel_at_period_end         │ BOOLEAN     │ DEFAULT FALSE                │
│ current_period_end           │ TIMESTAMPTZ │                              │
│ criado_em                    │ TIMESTAMPTZ │ NOT NULL DEFAULT NOW()       │
│ atualizado_em                │ TIMESTAMPTZ │ NOT NULL DEFAULT NOW()       │
└──────────────────────────────┴─────────────┴──────────────────────────────┘
```

```
┌───────────────────────────────────────────────────────────────────────────┐
│                                 convites                                  │
├──────────────────────────────┬─────────────┬──────────────────────────────┤
│ Campo                        │ Tipo        │ Restrições                   │
├──────────────────────────────┼─────────────┼──────────────────────────────┤
│ id                           │ UUID        │ PK DEFAULT uuid_generate_v4()│
│ empresa_id                   │ UUID        │ NOT NULL REFERENCES empresas │
│ email                        │ TEXT        │ NOT NULL                     │
│ nome                         │ TEXT        │                              │
│ papel                        │ papel_user  │ NOT NULL DEFAULT 'operador'  │
│ status                       │ status_conv │ NOT NULL DEFAULT 'pendente'  │
│ token                        │ TEXT        │ UNIQUE DEFAULT gen_random()  │
│ expira_em                    │ TIMESTAMPTZ │ NOT NULL DEFAULT (7 dias)    │
│ criado_em                    │ TIMESTAMPTZ │ NOT NULL DEFAULT NOW()       │
└──────────────────────────────┴─────────────┴──────────────────────────────┘
```

```
┌───────────────────────────────────────────────────────────────────────────┐
│                            categorias_produto                             │
├──────────────────────────────┬─────────────┬──────────────────────────────┤
│ Campo                        │ Tipo        │ Restrições                   │
├──────────────────────────────┼─────────────┼──────────────────────────────┤
│ id                           │ UUID        │ PK DEFAULT uuid_generate_v4()│
│ empresa_id                   │ UUID        │ NOT NULL REFERENCES empresas │
│ nome                         │ TEXT        │ NOT NULL                     │
│ cor                          │ TEXT        │ DEFAULT '#4A1D6B'            │
│ criado_em                    │ TIMESTAMPTZ │ NOT NULL DEFAULT NOW()       │
└──────────────────────────────┴─────────────┴──────────────────────────────┘
```

```
┌───────────────────────────────────────────────────────────────────────────┐
│                                 produtos                                  │
├──────────────────────────────┬─────────────┬──────────────────────────────┤
│ Campo                        │ Tipo        │ Restrições                   │
├──────────────────────────────┼─────────────┼──────────────────────────────┤
│ id                           │ UUID        │ PK DEFAULT uuid_generate_v4()│
│ empresa_id                   │ UUID        │ NOT NULL REFERENCES empresas │
│ nome                         │ TEXT        │ NOT NULL                     │
│ sku                          │ TEXT        │                              │
│ ean                          │ TEXT        │                              │
│ categoria                    │ TEXT        │                              │
│ preco_custo                  │ NUMERIC     │ NOT NULL DEFAULT 0           │
│ preco_varejo                 │ NUMERIC     │ NOT NULL DEFAULT 0           │
│ preco_atacado                │ NUMERIC     │                              │
│ preco_vip                    │ NUMERIC     │                              │
│ preco_catalogo               │ TEXT        │ 'varejo'|'atacado'|'vip'|etc │
│ qtd_atual                    │ NUMERIC     │ NOT NULL DEFAULT 0           │
│ qtd_minima                   │ NUMERIC     │ NOT NULL DEFAULT 0           │
│ qtd_maxima                   │ NUMERIC     │                              │
│ qtd_min_atacado              │ NUMERIC     │                              │
│ localizacao                  │ TEXT        │                              │
│ pode_ser_brinde              │ BOOLEAN     │ NOT NULL DEFAULT FALSE       │
│ tem_serie                    │ BOOLEAN     │ NOT NULL DEFAULT FALSE       │
│ tem_garantia                 │ BOOLEAN     │ NOT NULL DEFAULT FALSE       │
│ dias_garantia                │ INT         │                              │
│ texto_garantia               │ TEXT        │                              │
│ codigo_barras                │ TEXT        │                              │
│ preco_minimo                 │ NUMERIC     │                              │
│ ativo                        │ BOOLEAN     │ NOT NULL DEFAULT TRUE        │
│ ativo_catalogo               │ BOOLEAN     │ NOT NULL DEFAULT FALSE       │
│ destaque                     │ BOOLEAN     │ NOT NULL DEFAULT FALSE       │
│ obs                          │ TEXT        │                              │
│ imagem_url                   │ TEXT        │                              │
│ criado_em                    │ TIMESTAMPTZ │ NOT NULL DEFAULT NOW()       │
│ atualizado_em                │ TIMESTAMPTZ │ NOT NULL DEFAULT NOW()       │
└──────────────────────────────┴─────────────┴──────────────────────────────┘
```

```
┌───────────────────────────────────────────────────────────────────────────┐
│                           estoque_movimentacoes                           │
├──────────────────────────────┬─────────────┬──────────────────────────────┤
│ Campo                        │ Tipo        │ Restrições                   │
├──────────────────────────────┼─────────────┼──────────────────────────────┤
│ id                           │ UUID        │ PK DEFAULT uuid_generate_v4()│
│ empresa_id                   │ UUID        │ NOT NULL REFERENCES empresas │
│ produto_id                   │ UUID        │ NOT NULL REFERENCES produtos │
│ tipo                         │ tipo_movim  │ NOT NULL                     │
│ quantidade                   │ NUMERIC     │ NOT NULL                     │
│ obs                          │ TEXT        │                              │
│ criado_em                    │ TIMESTAMPTZ │ NOT NULL DEFAULT NOW()       │
└──────────────────────────────┴─────────────┴──────────────────────────────┘
```

```
┌───────────────────────────────────────────────────────────────────────────┐
│                                 clientes                                  │
├──────────────────────────────┬─────────────┬──────────────────────────────┤
│ Campo                        │ Tipo        │ Restrições                   │
├──────────────────────────────┼─────────────┼──────────────────────────────┤
│ id                           │ UUID        │ PK DEFAULT uuid_generate_v4()│
│ empresa_id                   │ UUID        │ NOT NULL REFERENCES empresas │
│ nome                         │ TEXT        │ NOT NULL                     │
│ telefone                     │ TEXT        │                              │
│ email                        │ TEXT        │                              │
│ cpf                          │ TEXT        │                              │
│ endereco                     │ TEXT        │                              │
│ obs                          │ TEXT        │                              │
│ tipo                         │ TEXT        │ NOT NULL DEFAULT 'varejo'    │
│ ultima_compra                │ DATE        │                              │
│ ativo                        │ BOOLEAN     │ NOT NULL DEFAULT TRUE        │
│ criado_em                    │ TIMESTAMPTZ │ NOT NULL DEFAULT NOW()       │
└──────────────────────────────┴─────────────┴──────────────────────────────┘
```

```
┌───────────────────────────────────────────────────────────────────────────┐
│                              formas_pagamento                             │
├──────────────────────────────┬─────────────┬──────────────────────────────┤
│ Campo                        │ Tipo        │ Restrições                   │
├──────────────────────────────┼─────────────┼──────────────────────────────┤
│ id                           │ UUID        │ PK DEFAULT uuid_generate_v4()│
│ empresa_id                   │ UUID        │ NOT NULL REFERENCES empresas │
│ nome                         │ TEXT        │ NOT NULL                     │
│ taxa                         │ NUMERIC     │ NOT NULL DEFAULT 0           │
│ ativo                        │ BOOLEAN     │ NOT NULL DEFAULT TRUE        │
│ criado_em                    │ TIMESTAMPTZ │ NOT NULL DEFAULT NOW()       │
└──────────────────────────────┴─────────────┴──────────────────────────────┘
```

```
┌───────────────────────────────────────────────────────────────────────────┐
│                                 comissoes                                 │
├──────────────────────────────┬─────────────┬──────────────────────────────┤
│ Campo                        │ Tipo        │ Restrições                   │
├──────────────────────────────┼─────────────┼──────────────────────────────┤
│ id                           │ UUID        │ PK DEFAULT uuid_generate_v4()│
│ empresa_id                   │ UUID        │ NOT NULL REFERENCES empresas │
│ nome                         │ TEXT        │ NOT NULL                     │
│ telefone                     │ TEXT        │                              │
│ tipo_comissao                │ TEXT        │ NOT NULL DEFAULT 'percentual'│
│ taxa                         │ NUMERIC     │ NOT NULL DEFAULT 0           │
│ status                       │ TEXT        │ NOT NULL DEFAULT 'ativo'     │
│ criado_em                    │ TIMESTAMPTZ │ NOT NULL DEFAULT NOW()       │
└──────────────────────────────┴─────────────┴──────────────────────────────┘
```

```
┌───────────────────────────────────────────────────────────────────────────┐
│                                  vendas                                   │
├──────────────────────────────┬─────────────┬──────────────────────────────┤
│ Campo                        │ Tipo        │ Restrições                   │
├──────────────────────────────┼─────────────┼──────────────────────────────┤
│ id                           │ UUID        │ PK DEFAULT uuid_generate_v4()│
│ empresa_id                   │ UUID        │ NOT NULL REFERENCES empresas │
│ numero                       │ SERIAL      │                              │
│ cliente_id                   │ UUID        │ REFERENCES clientes          │
│ cliente_nome                 │ TEXT        │                              │
│ forma_pagamento              │ TEXT        │ NOT NULL                     │
│ total                        │ NUMERIC     │ NOT NULL DEFAULT 0           │
│ desconto                     │ NUMERIC     │ NOT NULL DEFAULT 0           │
│ status                       │ status_venda│ NOT NULL DEFAULT 'concluida' │
│ motivo_cancelamento          │ TEXT        │                              │
│ comissionado_id              │ UUID        │ REFERENCES comissoes         │
│ comissionado_nome            │ TEXT        │                              │
│ registrado_nome              │ TEXT        │                              │
│ obs                          │ TEXT        │                              │
│ como_foi_nota                │ INT         │                              │
│ como_foi_resposta            │ TEXT        │                              │
│ como_foi_respondido_em       │ TIMESTAMPTZ │                              │
│ valor_comissao               │ NUMERIC     │ DEFAULT NULL                 │
│ comissao_paga                │ BOOLEAN     │ NOT NULL DEFAULT FALSE       │
│ criado_em                    │ TIMESTAMPTZ │ NOT NULL DEFAULT NOW()       │
└──────────────────────────────┴─────────────┴──────────────────────────────┘
```

```
┌───────────────────────────────────────────────────────────────────────────┐
│                                itens_venda                                │
├──────────────────────────────┬─────────────┬──────────────────────────────┤
│ Campo                        │ Tipo        │ Restrições                   │
├──────────────────────────────┼─────────────┼──────────────────────────────┤
│ id                           │ UUID        │ PK DEFAULT uuid_generate_v4()│
│ empresa_id                   │ UUID        │ NOT NULL REFERENCES empresas │
│ venda_id                     │ UUID        │ NOT NULL REFERENCES vendas   │
│ produto_id                   │ UUID        │ REFERENCES produtos          │
│ produto_nome                 │ TEXT        │ NOT NULL                     │
│ quantidade                   │ NUMERIC     │ NOT NULL                     │
│ preco_unitario               │ NUMERIC     │ NOT NULL                     │
│ brinde                       │ BOOLEAN     │ NOT NULL DEFAULT FALSE       │
│ num_serie                    │ TEXT        │                              │
│ criado_em                    │ TIMESTAMPTZ │ NOT NULL DEFAULT NOW()       │
└──────────────────────────────┴─────────────┴──────────────────────────────┘
```

```
┌───────────────────────────────────────────────────────────────────────────┐
│                                  fiados                                   │
├──────────────────────────────┬─────────────┬──────────────────────────────┤
│ Campo                        │ Tipo        │ Restrições                   │
├──────────────────────────────┼─────────────┼──────────────────────────────┤
│ id                           │ UUID        │ PK DEFAULT uuid_generate_v4()│
│ empresa_id                   │ UUID        │ NOT NULL REFERENCES empresas │
│ cliente_id                   │ UUID        │ REFERENCES clientes          │
│ cliente_nome                 │ TEXT        │ NOT NULL                     │
│ cliente_tel                  │ TEXT        │                              │
│ valor_aberto                 │ NUMERIC     │ NOT NULL DEFAULT 0           │
│ data_vencimento              │ DATE        │                              │
│ status                       │ status_fiado│ NOT NULL DEFAULT 'aberto'    │
│ pago_em                      │ TIMESTAMPTZ │                              │
│ criado_em                    │ TIMESTAMPTZ │ NOT NULL DEFAULT NOW()       │
└──────────────────────────────┴─────────────┴──────────────────────────────┘
```

```
┌───────────────────────────────────────────────────────────────────────────┐
│                                 despesas                                  │
├──────────────────────────────┬─────────────┬──────────────────────────────┤
│ Campo                        │ Tipo        │ Restrições                   │
├──────────────────────────────┼─────────────┼──────────────────────────────┤
│ id                           │ UUID        │ PK DEFAULT uuid_generate_v4()│
│ empresa_id                   │ UUID        │ NOT NULL REFERENCES empresas │
│ descricao                    │ TEXT        │ NOT NULL                     │
│ categoria                    │ TEXT        │                              │
│ tipo                         │ TEXT        │                              │
│ valor                        │ NUMERIC     │ NOT NULL DEFAULT 0           │
│ data                         │ DATE        │ NOT NULL DEFAULT CURRENT_DATE│
│ criado_em                    │ TIMESTAMPTZ │ NOT NULL DEFAULT NOW()       │
└──────────────────────────────┴─────────────┴──────────────────────────────┘
```

```
┌───────────────────────────────────────────────────────────────────────────┐
│                               fornecedores                                │
├──────────────────────────────┬─────────────┬──────────────────────────────┤
│ Campo                        │ Tipo        │ Restrições                   │
├──────────────────────────────┼─────────────┼──────────────────────────────┤
│ id                           │ UUID        │ PK DEFAULT uuid_generate_v4()│
│ empresa_id                   │ UUID        │ NOT NULL REFERENCES empresas │
│ nome                         │ TEXT        │ NOT NULL                     │
│ contato                      │ TEXT        │                              │
│ telefone                     │ TEXT        │                              │
│ email                        │ TEXT        │                              │
│ cnpj                         │ TEXT        │                              │
│ categoria                    │ TEXT        │                              │
│ cidade                       │ TEXT        │                              │
│ estado                       │ TEXT        │                              │
│ prazo_entrega                │ TEXT        │                              │
│ pedido_minimo                │ NUMERIC     │                              │
│ anotacoes                    │ TEXT        │                              │
│ endereco                     │ TEXT        │                              │
│ obs                          │ TEXT        │                              │
│ ativo                        │ BOOLEAN     │ NOT NULL DEFAULT TRUE        │
│ criado_em                    │ TIMESTAMPTZ │ NOT NULL DEFAULT NOW()       │
└──────────────────────────────┴─────────────┴──────────────────────────────┘
```

```
┌───────────────────────────────────────────────────────────────────────────┐
│                            pedidos_fornecedor                             │
├──────────────────────────────┬─────────────┬──────────────────────────────┤
│ Campo                        │ Tipo        │ Restrições                   │
├──────────────────────────────┼─────────────┼──────────────────────────────┤
│ id                           │ UUID        │ PK DEFAULT uuid_generate_v4()│
│ empresa_id                   │ UUID        │ NOT NULL REFERENCES empresas │
│ fornecedor_id                │ UUID        │ REFERENCES fornecedores      │
│ fornecedor_nome              │ TEXT        │                              │
│ produto                      │ TEXT        │ NOT NULL DEFAULT ''          │
│ quantidade                   │ NUMERIC     │ NOT NULL DEFAULT 1           │
│ status                       │ TEXT        │ NOT NULL DEFAULT 'aguardando'│
│ total                        │ NUMERIC     │ NOT NULL DEFAULT 0           │
│ obs                          │ TEXT        │                              │
│ criado_em                    │ TIMESTAMPTZ │ NOT NULL DEFAULT NOW()       │
└──────────────────────────────┴─────────────┴──────────────────────────────┘
```

```
┌───────────────────────────────────────────────────────────────────────────┐
│                                 garantias                                 │
├──────────────────────────────┬─────────────┬──────────────────────────────┤
│ Campo                        │ Tipo        │ Restrições                   │
├──────────────────────────────┼─────────────┼──────────────────────────────┤
│ id                           │ UUID        │ PK DEFAULT uuid_generate_v4()│
│ empresa_id                   │ UUID        │ NOT NULL REFERENCES empresas │
│ venda_id                     │ UUID        │ REFERENCES vendas            │
│ produto_id                   │ UUID        │ REFERENCES produtos          │
│ cliente_nome                 │ TEXT        │                              │
│ cliente_tel                  │ TEXT        │                              │
│ produto_nome                 │ TEXT        │ NOT NULL                     │
│ num_serie                    │ TEXT        │                              │
│ status                       │ TEXT        │ NOT NULL DEFAULT 'ativa'     │
│ data_compra                  │ DATE        │ NOT NULL DEFAULT CURRENT_DATE│
│ data_inicio                  │ DATE        │ NOT NULL DEFAULT CURRENT_DATE│
│ data_vencimento              │ DATE        │ NOT NULL                     │
│ data_fim                     │ DATE        │ NOT NULL DEFAULT CURRENT_DATE│
│ texto_garantia               │ TEXT        │                              │
│ obs                          │ TEXT        │                              │
│ criado_em                    │ TIMESTAMPTZ │ NOT NULL DEFAULT NOW()       │
└──────────────────────────────┴─────────────┴──────────────────────────────┘
```

```
┌───────────────────────────────────────────────────────────────────────────┐
│                                devolucoes                                 │
├──────────────────────────────┬─────────────┬──────────────────────────────┤
│ Campo                        │ Tipo        │ Restrições                   │
├──────────────────────────────┼─────────────┼──────────────────────────────┤
│ id                           │ UUID        │ PK DEFAULT uuid_generate_v4()│
│ empresa_id                   │ UUID        │ NOT NULL REFERENCES empresas │
│ garantia_id                  │ UUID        │ REFERENCES garantias         │
│ venda_id                     │ UUID        │ REFERENCES vendas            │
│ motivo                       │ TEXT        │                              │
│ resolucao                    │ TEXT        │                              │
│ valor                        │ NUMERIC     │ DEFAULT NULL                 │
│ criado_em                    │ TIMESTAMPTZ │ NOT NULL DEFAULT NOW()       │
└──────────────────────────────┴─────────────┴──────────────────────────────┘
```

```
┌───────────────────────────────────────────────────────────────────────────┐
│                              ordens_servico                               │
├──────────────────────────────┬─────────────┬──────────────────────────────┤
│ Campo                        │ Tipo        │ Restrições                   │
├──────────────────────────────┼─────────────┼──────────────────────────────┤
│ id                           │ UUID        │ PK DEFAULT uuid_generate_v4()│
│ empresa_id                   │ UUID        │ NOT NULL REFERENCES empresas │
│ numero                       │ SERIAL      │                              │
│ cliente_nome                 │ TEXT        │ NOT NULL                     │
│ cliente_tel                  │ TEXT        │                              │
│ equipamento                  │ TEXT        │ NOT NULL DEFAULT ''          │
│ produto_desc                 │ TEXT        │                              │
│ defeito_relatado             │ TEXT        │ NOT NULL DEFAULT ''          │
│ problema                     │ TEXT        │                              │
│ laudo                        │ TEXT        │                              │
│ status                       │ TEXT        │ NOT NULL DEFAULT 'aguardando'│
│ orcamento                    │ NUMERIC     │                              │
│ valor_servico                │ NUMERIC     │ NOT NULL DEFAULT 0           │
│ valor_pecas                  │ NUMERIC     │ NOT NULL DEFAULT 0           │
│ tecnico                      │ TEXT        │                              │
│ previsao                     │ DATE        │                              │
│ criado_em                    │ TIMESTAMPTZ │ NOT NULL DEFAULT NOW()       │
│ atualizado_em                │ TIMESTAMPTZ │ NOT NULL DEFAULT NOW()       │
└──────────────────────────────┴─────────────┴──────────────────────────────┘
```

### 3. Gatilhos do Banco (Database Triggers)
- `on_auth_user_created` (Tabela `auth.users`): Dispara `handle_new_user()` após a inclusão de um usuário no Supabase Auth.
  - **Função `handle_new_user()`**: Se houver um token de convite pendente e válido nos metadados da conta, associa o usuário recém-registrado à empresa do convite correspondente, define o papel especificado e altera o convite para `'aceito'`. Se for um registro normal, cria automaticamente uma nova empresa (`empresas`), cria uma assinatura start associada (`subscriptions` zerada e `'inactive'`) e registra o perfil (`profiles`) como `papel = 'admin'`.
- `trg_ultima_compra` (Tabela `vendas`): Dispara `atualizar_ultima_compra()`.
  - **Função `atualizar_ultima_compra()`**: Atualiza a coluna `ultima_compra = CURRENT_DATE` na tabela `clientes` sempre que uma venda associada ao cliente for inserida ou alterada para `'concluida'`.
- `trg_estoque_venda` (Tabela `itens_venda`): Dispara `decrementar_estoque_venda()`.
  - **Função `decrementar_estoque_venda()`**: Executa o comando de débito do estoque na tabela de produtos sempre que um item de venda é inserido (ignora itens marcados como `brinde`).
- `trg_formas_padrao` (Tabela `empresas`): Dispara `inserir_formas_pagamento_padrao()`.
  - **Função `inserir_formas_pagamento_padrao()`**: Cria automaticamente as 6 formas de pagamento iniciais para a loja recém-criada, ativando `Dinheiro`, `PIX`, `Cartão Débito` (taxa 1.5%) e `Cartão Crédito` (taxa 2.99%), e inserindo como inativos o `Boleto` e `Cheque`.

### 4. RLS - Segurança Dinâmica por Loja
O banco de dados do KDL Store protege estritamente o isolamento multi-inquilino (multi-tenant) ativando a RLS em todas as tabelas.
- **Função Helper `minha_empresa_id()`**: Função estável com privilégios definidores (`SECURITY DEFINER`) que realiza a consulta `SELECT empresa_id FROM profiles WHERE id = auth.uid()`, devolvendo dinamicamente a ID da loja do operador logado no contexto do Supabase.
- **Políticas de Acesso (RLS Policies):**
  - Tabela `empresas`: Registros acessíveis se `id = minha_empresa_id()`.
  - Tabela `profiles`: Registros acessíveis se `empresa_id = minha_empresa_id() OR id = auth.uid()`.
  - Todas as demais tabelas (produtos, vendas, fiados, despesas, fornecedores, etc.): Registros isolados baseando a liberação diretamente na checagem `empresa_id = minha_empresa_id()`.

### 5. Procedimentos de Banco de Dados (RPC)
O banco de dados implementa uma rotina extremamente crítica para transações atômicas de venda.
- **RPC `checkout_venda_transaction`**:
  - **Objetivo:** Garante que o registro da venda, itens associados, movimentações de estoque, criação de termos de garantia física e provisionamento de fiado ocorram dentro de uma única transação atômica ACID no banco de dados. Evita desbalanço de estoque ou registros fantasmas no caixa caso a conexão caia.
  - **Fluxo:**
    1. Insere a venda principal na tabela `vendas` com status `'concluida'`.
    2. Itera sobre a lista de itens passados em JSONB (`p_itens`).
    3. Para cada item da lista, insere na tabela `itens_venda` e lança uma saída no histórico de estoque (`estoque_movimentacoes`) com o tipo `'venda'` ou `'brinde'`.
    4. Se o item exigir garantia (`v_tem_garantia`) e os termos forem válidos, calcula a data de término somando os dias no calendário (`CURRENT_DATE + dias_garantia`) e insere na tabela `garantias`.
    5. Se o método de pagamento selecionado for `'Fiado'`, insere o provisionamento em aberto na tabela `fiados` com a data de vencimento calculada a partir de `p_brazo_dias`.
    6. Retorna a ID da venda gerada para o PDV redirecionar a tela.

---

## 36. MATRIZ DE TRANSIÇÃO DE TELAS
**Plano:** Start e Pro  
O fluxo de navegação do usuário final entre os diferentes painéis e modais é estruturado da seguinte forma:

| Tela de Origem | Gatilho / Ação do Usuário | Destino / Feedback |
| :--- | :--- | :--- |
| **Login / Registro** | Autenticação bem-sucedida (Lojista) | `/dashboard` (Carrega Painel Principal) |
| **Login / Registro** | Autenticação bem-sucedida (Convidado) | `/dashboard` (Força perfil e papel operador/estoquista) |
| **Dashboard / Geral** | Clique em `PDV` ou Tecla `F2` | `/pdv` (Interface de vendas rápida) |
| **PDV (Frente de Caixa)**| Tecla `ESC` | `/dashboard` (Fecha o caixa e retorna ao painel) |
| **PDV (Frente de Caixa)**| Finaliza venda (Checkout) | Modal de sucesso da venda ➔ Permanece no PDV para nova venda |
| **Dashboard / Geral** | Menu lateral `Estoque` | `/estoque` (Lista produtos e alertas de mínimo) |
| **Estoque (Listagem)** | Clique em `+ Novo Produto` | Modal flutuante cadastrar produto com `FormProduto` |
| **Estoque (Listagem)** | Clique no ícone de editar produto | Modal com dados carregados no `FormProduto` |
| **Dashboard / Geral** | Menu lateral `Clientes` | `/clientes` (Listagem de CRM) |
| **Clientes (Listagem)** | Clique em `+ Novo Cliente` | Modal de cadastro contendo o `FormCliente` |
| **Dashboard / Geral** | Menu lateral `Financeiro` | `/financeiro` (Módulo Pro) |
| **Financeiro (Módulo)** | Clique em `+ Despesa` | Modal simplificado para registrar despesa |
| **Financeiro (Módulo)** | Clique em `Fechamento de Caixa` | `/financeiro/fechamento-caixa` (Relatório fiscal Pro) |
| **Dashboard / Geral** | Menu lateral `Garantias` | `/garantias` (Pós-venda e histórico de prazos) |
| **Garantias (Listagem)** | Clique em uma garantia ativa | `/garantias/[id]` (Página estática com detalhes) |
| **Dashboard / Geral** | Menu lateral `Configurações` | `/configuracoes` (Ajustes da conta e equipe) |
| **Configurações (Geral)**| Clique em aba `Empresa` | `/configuracoes/empresa` (Nome, WhatsApp e Redes) |
| **Configuracoes (Geral)**| Clique em aba `Colaboradores` | `/configuracoes/usuarios` (Gestão de papéis e convites) |
| **Configuracoes (Geral)**| Clique em aba `Planos e Assinatura`| `/configuracoes/planos` (Stripe upgrades e downgrades) |

---

## 37. MATRIZ DE OPERAÇÕES DO BANCO (CRUD)
Abaixo encontra-se a matriz de controle de acessos e operações diretas de banco de dados executadas por módulo:

| Módulo / Página | Tabela Principal | CREATE (C) | READ (R) | UPDATE (U) | DELETE (D) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **PDV (Vendas)** | `vendas` | Sim | Sim | Sim | Não |
| **PDV (Vendas)** | `itens_venda` | Sim | Sim | Não | Não |
| **PDV (Vendas)** | `estoque_movimentacoes`| Sim | Sim | Não | Não |
| **PDV (Vendas)** | `fiados` | Sim | Sim | Não | Não |
| **Estoque (Produtos)**| `produtos` | Sim | Sim | Sim | Sim |
| **Estoque (Produtos)**| `categorias_produto` | Sim | Sim | Não | Sim |
| **Financeiro** | `despesas` | Sim | Sim | Sim | Sim |
| **Clientes (CRM)** | `clientes` | Sim | Sim | Sim | Sim |
| **Fornecedores** | `fornecedores` | Sim | Sim | Sim | Sim |
| **Fornecedores** | `pedidos_fornecedor` | Sim | Sim | Sim | Sim |
| **Garantias** | `garantias` | Sim | Sim | Sim | Não |
| **Garantias** | `devolucoes` | Sim | Sim | Não | Não |
| **Ordens de Serviço**| `ordens_servico` | Sim | Sim | Sim | Sim |
| **Configurações** | `empresas` | Não | Sim | Sim | Não |
| **Configurações** | `profiles` | Não | Sim | Sim | Sim |
| **Configurações** | `convites` | Sim | Sim | Sim | Sim |
| **Configurações** | `formas_pagamento` | Sim | Sim | Sim | Sim |

---

## 38. INCONSISTÊNCIAS IDENTIFICADAS E ALERTAS
Durante a auditoria analítica e mapeamento minucioso do repositório de código fonte do KDL Store, foram catalogadas as seguintes inconsistências lógicas e limitações técnicas estruturais:

### 1. Inconsistência Crítica na Tela de Detalhes da Garantia (`/garantias/[id]`)
- **Problema:** Ao clicar em uma garantia e navegar para `/garantias/[id]`, a página falha em buscar os dados dinâmicos reais da venda, do cliente ou dos prazos no banco de dados Supabase.
- **Evidência:** O arquivo de página utiliza um objeto estático de dados simulados (mock data) com informações genéricas de exemplo fixas. Além disso, o rodapé exibe o nome do produto concorrente/anterior `"NexoCommerce"` em vez da marca `"KDL Store"` adotada no restante do sistema.

### 2. Contradição Visual do Componente ProOnly (`src/components/ProOnly.tsx`)
- **Problema:** Os comentários internos e a documentação de código do componente alegam categoricamente: *"Se o plano é Start, mostra overlay com upsell"*.
- **Evidência:** A implementação do código é um retorno silencioso de valor nulo (`return null`). Não há lógica para exibição de sobreposição escura, banner explicativo, pop-up de ofertas ou botão de direcionamento para assinatura, resultando em uma ocultação silenciosa das opções do plano Start sem qualquer direcionamento comercial para conversão.

### 3. Redirecionamento em Loop ou Tela Travada em OS Nova (`/ordens-de-servico/nova`)
- **Problema:** A navegação para o cadastro de ordens de serviço novas resulta em travamento ou em uma experiência inutilizável.
- **Evidência:** O arquivo de página está implementado com um estado de carregamento permanente ou spinner de redirecionamento infinito no carregamento devido à ausência do formulário físico correspondente, impossibilitando a abertura direta por operadores.

### 4. Hardcoding de Versão nas Configurações Gerais (`/configuracoes/page.tsx`)
- **Problema:** Inconsistência de versionamento global.
- **Evidência:** O rodapé da tela de configurações exibe de forma estática o texto `"KDL STORE v1.2.0"`. Essa informação não provém de variáveis de ambiente do Next.js ou do arquivo central `package.json`, forçando atualizações manuais no código-fonte a cada novo deploy do sistema de vendas.

