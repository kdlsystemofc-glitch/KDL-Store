# KDL STORE — DOCUMENTAÇÃO TÉCNICA VIVA
> Última atualização: 2026-05-15 | Versão: 1.0

---

# SEÇÃO 1 — VISÃO GERAL DO PROJETO

## 1.1 Identificação

| Campo | Valor |
|---|---|
| **Nome** | KDL Store |
| **Tipo** | SaaS multi-tenant B2B |
| **Segmento** | Gestão para micro e pequenos varejistas |
| **País** | Brasil |
| **Moeda** | BRL (R$) |

## 1.2 Problema que Resolve

Lojistas de rua (eletrônicos, roupas, acessórios, pequenos mercados) operam sem sistema de gestão — usam cadernos, planilhas ou WhatsApp para controlar vendas, estoque e fiado. O KDL Store digitaliza toda a operação no celular, sem necessidade de computador ou treinamento técnico.

## 1.3 Público-Alvo

- Donos de lojas físicas de pequeno porte
- Lojas de bairro (eletrônicos, acessórios, roupas)
- Vendedores ambulantes com estoque
- Lojistas que vendem no atacado e varejo

## 1.4 Diferenciais

1. **PDV no celular** — frente de caixa completa, sem precisar de computador
2. **Leitor de código de barras** — câmera do celular como scanner
3. **Fiado digital** — controle de fiados com cobrança automática via WhatsApp
4. **Garantias digitais** — geradas automaticamente na venda
5. **CRM de Sumidos** — alerta de clientes que pararam de comprar
6. **Multi-preço** — varejo, atacado e VIP por produto
7. **Catálogo com QR Code** — catálogo online compartilhável
8. **Sem contrato** — pagamento mensal, cancela quando quiser

## 1.5 Modelo SaaS e Planos

### Plano Start — R$ 65/mês
| Módulo | Acesso |
|---|---|
| Dashboard | ✅ |
| PDV / Nova Venda | ✅ |
| Histórico de Vendas | ✅ |
| Produtos / Estoque | ✅ |
| Clientes | ✅ |
| Ops Extras (Garantias, OS) | ✅ |
| Configurações | ✅ |
| Financeiro (DRE, Fiado, Despesas, Fechamento) | ❌ Pro |
| Relatórios | ❌ Pro |
| Painel "Como foi?" | ❌ Pro |
| CRM Clientes Sumidos | ❌ Pro |
| Comissões/Puxadores | ❌ Pro |

### Plano Pro — R$ 95/mês
Tudo do Start, mais todos os módulos Pro listados acima. Suporta até 5 usuários por empresa.

## 1.6 Arquitetura Multi-Tenant

- **Isolamento por `empresa_id`**: cada loja é uma empresa independente no banco
- **RLS (Row Level Security)** no Supabase garante que cada usuário só acessa dados da sua empresa
- **Função helper `minha_empresa_id()`**: retorna o `empresa_id` do usuário logado via `auth.uid()`
- **Um Supabase project para todos os tenants** — sem instâncias separadas

## 1.7 Stack Principal

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, CSS Vanilla |
| Backend/Auth | Supabase (PostgreSQL + Auth + RLS + Realtime) |
| Deploy | Vercel (frontend) |
| Storage | Supabase Storage (imagens de produtos) |
| Fonts | Google Fonts: Nunito, Nunito Sans |
| Icons | lucide-react |
| Scanner | Browser API (getUserMedia) |

## 1.8 Repositório

- **GitHub**: `github.com/kdlsystemofc-glitch/KDL-Store`
- **Branch principal**: `master`
- **Deploy automático**: Push em `master` → build na Vercel

## 1.9 Variáveis de Ambiente

| Variável | Onde | Finalidade |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + `.env.local` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel + `.env.local` | Chave pública Supabase |
