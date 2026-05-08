# NexoCommerce — Contexto Completo do Projeto

**Versão:** 1.1.0 | **Atualizado:** Maio/2026 (inclui sprint de correções)

---

## 1. Visão Geral

O **NexoCommerce** é um SaaS de gestão operacional mobile-first voltado exclusivamente para pequenos comerciantes de rua, especialmente os do perfil da **25 de Março** (São Paulo): vendedores de som automotivo, acessórios veiculares, roupas, calçados, eletrônicos e comércio popular.

### O Problema Real
Um lojista da 25 de Março:
- Controla estoque em papéis ou cadernos
- Emite "notas" feitas à mão
- Cola papelzinhos de garantia no produto
- Não sabe quem parou de comprar
- Não sabe se está lucrando ou apenas girando dinheiro
- Não tem como mostrar produtos para clientes à distância
- Depende de "puxadores" sem controle de comissão

---

## 2. Público-Alvo

| Perfil | Características |
|---|---|
| **Primário** | Lojistas de rua, 30–55 anos, pouco contato com tecnologia |
| **Tipo de negócio** | Som automotivo, acessórios, roupas, eletrônicos |
| **Localização** | 25 de Março/SP, feiras populares, comércio de rua |
| **Dispositivo** | Celular Android (maioria), tablet, balcão |

---

## 3. Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **Framework** | Next.js 14+ (App Router) |
| **CSS** | Vanilla CSS com design system próprio (globals.css) |
| **Banco de dados** | Supabase (PostgreSQL + Auth + RLS) |
| **Hospedagem** | Vercel |
| **Autenticação** | Supabase Auth (email/senha) |
| **Custo infra** | R$ 0 (free tiers) |

---

## 4. Localização dos Arquivos

```
C:\Users\kauan.pereira\.gemini\antigravity\scratch\nexocommerce\
│
├── src/
│   ├── app/
│   │   ├── globals.css              ← Design System completo
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   └── cadastro/page.tsx
│   │   └── (dashboard)/
│   │       ├── layout.tsx               ← Sidebar + header
│   │       ├── dashboard/page.tsx
│   │       ├── vendas/page.tsx
│   │       ├── vendas/nova/page.tsx     ← PDV (atacado/varejo/VIP + brindes)
│   │       ├── vendas/[id]/page.tsx     ← Recibo imprimível + WhatsApp
│   │       ├── produtos/page.tsx
│   │       ├── produtos/novo/page.tsx   ← Formulário completo (3 tabelas de preço)
│   │       ├── estoque/page.tsx
│   │       ├── clientes/page.tsx
│   │       ├── clientes/novo/page.tsx   ← Novo (era 404)
│   │       ├── clientes/inativos/page.tsx ← CRM de Sumição
│   │       ├── fornecedores/page.tsx
│   │       ├── fornecedores/novo/page.tsx ← Novo
│   │       ├── garantias/page.tsx
│   │       ├── garantias/[id]/page.tsx  ← Certificado imprimível
│   │       ├── ordens-de-servico/page.tsx
│   │       ├── ordens-de-servico/nova/page.tsx ← Novo
│   │       ├── comissoes/page.tsx       ← Ex-Puxadores (renomeado)
│   │       ├── catalogo/page.tsx
│   │       ├── financeiro/page.tsx      ← DRE
│   │       ├── financeiro/despesas/page.tsx
│   │       ├── financeiro/fechamento/page.tsx
│   │       ├── relatorios/page.tsx
│   │       └── configuracoes/page.tsx
│   └── lib/
│       ├── supabase/client.ts
│       ├── supabase/server.ts
│       └── utils.ts
└── .env.local                       ← NÃO commitar
```

---

## 5. Variáveis de Ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## 6. Design System — "Neobrutalismo (Premium Modern Retro)"

Inspirado em sistemas clássicos de mercado dos anos 90, mas refinado com tendências de design premium para SaaS B2B moderno.

**Princípios:**
- **Contraste Forte:** Fundo cinza claro (`#f3f4f6`) com cartões em branco puro (`#ffffff`).
- **Bordas Grossas e Sombras Secas:** Componentes como botões, cartões e abas possuem `border: 2px solid #111827` e sombras sólidas (ex: `4px 4px 0px #111827`), criando uma sensação de interface tátil e física.
- **Tabelas:** Design zebrado leve, mas envolto em bordas pesadas e um cabeçalho muito escuro para legibilidade máxima.
- **Abas Estilo "Pasta":** Navegação horizontal imitando divisórias físicas de pastas de arquivo, aumentando a clareza para usuários com pouca intimidade tecnológica.

**Cores principais:**
```css
--verde:        #059669; /* Emerald - Dinheiro, sucesso, moderno */
--vermelho:     #dc2626; /* Erro, zerado */
--amarelo:      #d97706; /* Alerta, crítico */
--azul:         #2563eb; /* Info, atacado */
--fundo:        #f3f4f6; /* Fundo geral claro */
--surface:      #ffffff; /* Fundo de formulários */
--borda:        #111827; /* Preto puro para bordas (Stark Contrast) */
--sidebar-bg:   #111827; /* Sidebar bem escura */
```

---

## 7. Modelo de Negócio

| Plano | Preço | Recursos |
|---|---|---|
| **Essencial** | R$ 39/mês | 1 usuário, todos os módulos |
| **Profissional** | R$ 79/mês | 3 usuários + relatórios avançados |
| **Ilimitado** | R$ 149/mês | Ilimitado + API |

**Custo operacional: R$ 0** (Supabase + Vercel free)

---

## 8. Diferenciais Únicos

| Funcionalidade | Nenhum concorrente tem |
|---|---|
| **Painel "Como foi?"** | Resumo 1-click do negócio com insights e envio via WhatsApp |
| **Puxador Digital** | Comissão de indicadores de rua |
| **CRM de Sumição** | Alerta + WhatsApp automático para clientes parados |
| **Atacado/Varejo/VIP** | 3 tabelas de preço por perfil |
| **Catálogo com QR Code** | Vitrine digital para WhatsApp |
| **DRE Simplificado** | P&L real para pequeno comércio |
| **Fechamento Multi-Período** | Diário, quinzenal, mensal, anual |
| **Brindes no PDV** | Item brinde aparece no recibo |
| **Recibo com Garantia** | Termos + nº de série no recibo |
| **Leitor EAN Inteligente** | Leitura via Câmera (zxing) no mobile ou leitor físico no PDV |

---

## 9. Próximos Passos para Produção

1. Criar projeto no Supabase (https://supabase.com)
2. Executar schema SQL no Supabase SQL Editor
3. Preencher `.env.local` com as chaves
4. Substituir dados mock por queries reais do Supabase
5. Remover bypass de auth no `middleware.ts`
6. Ativar RLS (Row Level Security) por `empresa_id`
7. Deploy: `npx vercel --prod`

---

## 10. Comando para Rodar Localmente

```bash
cd C:\Users\kauan.pereira\.gemini\antigravity\scratch\nexocommerce
npm run dev
# Acesse: http://localhost:3000/dashboard
```
