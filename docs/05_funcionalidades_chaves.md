# NexoCommerce — Funcionalidades Chaves v2.3

> **Versão:** 2.3.0 | **Atualizado:** 08/05/2026

Este documento lista as funcionalidades chave implementadas recentemente no NexoCommerce.

## 1. Painel "Como Foi?"

O painel **"Como foi?"** é a primeira coisa que o lojista vê ao acessar o Dashboard, criado para ser o **principal diferencial de venda do sistema**.

**Problema que resolve:** O lojista de rua raramente sabe o estado atual de seu negócio. O dinheiro da gaveta se mistura e ele só percebe se o mês foi ruim quando é tarde demais.
**Solução:** Um painel universal, prático e em formato "leitura em 30 segundos" sem jargões.

### Componentes do Painel
*   **Abas de Tempo:** 'Ontem' (padrão), 'Essa semana', 'Esse mês', 'Esse ano'.
*   **Número Principal (Destaque):** Exibe o Faturamento total no período, com cor dinâmica e indicativo de variação (`▲ a mais` ou `▼ a menos` que o período anterior).
*   **Indicadores em Linha:**
    *   Vendas realizadas
    *   Ticket médio
    *   Despesas
    *   Lucro estimado
*   **Alertas Dinâmicos:**
    *   `⚠️ Produtos zerados` — Exibe produtos que acabaram o estoque durante o período, mas geraram vendas.
    *   `📒 Fiado em aberto` — Valor de compras a prazo (fiado) geradas.
    *   `🎯 Comissões pendentes` — Vendas atreladas a comissionados que precisam ser calculadas.
*   **Insight / Frase de Fechamento:** Lógica sem IA que exibe frases diretas:
    *   "Dia lucrativo. Continue assim."
    *   "Você vendeu bem mas os custos pesaram. Revise as despesas."
    *   "Dia fraco. Amanhã é uma nova chance."
*   **Botão de Compartilhar (WhatsApp):** O painel converte os dados da tela em um extrato limpo (texto puro) e abre a API do WhatsApp `wa.me` com a mensagem pré-formatada. 

**Localização Técnica:** `src/components/ComoFoiPainel.tsx` importado em `src/app/(dashboard)/dashboard/page.tsx`.

## 2. Pós-venda e Operações Extras
Foram inseridas ações rápidas logo após finalizar a venda (`/vendas/[id]`):

1.  **📦 Acionar Fornecedor:**
    Modal na tela de sucesso da venda onde o usuário vincula um Fornecedor a um item faltante. Isso gera um Pedido no banco de dados e abre o WhatsApp do Fornecedor com os dados completos da venda, garantindo que nenhum complemento seja esquecido.
2.  **🔧 Abrir Ordem de Serviço:**
    Modal rápido para registrar OS associada a uma venda recém-criada. Vincula o `venda_id` na OS permitindo o rastreamento técnico (ex: "Instalação da película e capinha" em uma loja de capas).

## 3. Gestão e UX
*   **DRE Integrado com Brindes:**
    Agora as movimentações do tipo `brinde` abatem do Lucro Líquido no cálculo do DRE, evitando contabilidade furada na entrega de "cortesias".
*   **Alerta de Preço Mínimo no PDV:**
    Se um vendedor conceder muito desconto via edição manual no item do carrinho, o campo exibe borda vermelha `Abaixo do preço mínimo`. Não bloqueia a venda (pois o patrão pode autorizar), mas adverte o vendedor ativamente.
*   **Onboarding Simples:**
    Quando o banco de produtos está zerado, exibe os 3 passos de onboarding (`Cadastrar produto`, `Testar PDV`, `Fornecedores`) direto no Dashboard. Desaparece na primeira interação real.
