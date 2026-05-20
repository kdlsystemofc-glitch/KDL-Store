# SEÇÃO 6 — MAPEAMENTO DE FORMULÁRIOS, BOTÕES E INTEGRAÇÕES

## 6.1 Mapeamento de Formulários Completos

### 1. Formulário de Produto (`FormProduto.tsx`)
**Finalidade**: Criar ou editar um produto no banco de dados.
**Campos**:
- **Nome do Produto** (Obrigatório): Texto livre.
- **SKU**: Texto alfanumérico, único por empresa. Botão com ícone para auto-gerar (`PRD-XXXX`).
- **Código de Barras (EAN)**: Texto (geralmente numérico). Botão de Câmera para preenchimento automático via scanner.
- **Categoria**: Dropdown dinâmico carregado da tabela `categorias_produto`. Permite criar nova categoria "inline".
- **Descrição**: Textarea, sem limite estrito.
- **Preço de Custo**: Moeda (Numérico R$).
- **Preço Varejo** (Obrigatório): Moeda (Numérico R$).
- **Preço Mínimo PDV**: Moeda. Usado no PDV para alertar se a venda estiver abaixo desse valor.
- **Preços Atacado / VIP**: Moedas alternativas.
- **Qtd Atual**: Numérico inteiro. Reflete estoque inicial.
- **Qtd Mínima**: Numérico inteiro. Aciona o alerta de estoque crítico no Dashboard.
- **Localização no estoque**: Texto livre (ex: "Prateleira A3").
- **Toggles (Switches booleanos)**:
  - `pode_ser_brinde`: Se true, pode ser dado como brinde com custo zero no PDV sem impactar o caixa.
  - `tem_serie`: Se true, o PDV obriga/solicita o preenchimento de Número de Série no momento da venda.
  - `ativo_catalogo`: Se true, exibe no catálogo público.
  - `destaque`: Exibe no topo do catálogo público.
- **Garantia**:
  - `tem_garantia`: Habilita blocos de garantia.
  - `dias_garantia`: Inteiro.
  - `texto_garantia`: Texto descritivo para o recibo.

**Validações**: `nome` não vazio, `varejoN > 0`, `sku` não duplicado na mesma empresa.
**Feedback visual**: Margem de lucro é calculada ao vivo (`varejo - custo`). Alerta vermelho para erro de salvamento. Loader no botão ao salvar.

### 2. Formulário de Cliente (`FormCliente.tsx`)
**Finalidade**: Cadastrar/editar dados do cliente, visível na aba de CRM e dentro do modal do PDV.
**Campos**:
- **Nome** (Obrigatório): Texto.
- **WhatsApp**: Texto (máscara implícita de telefone).
- **Email / CPF / Endereço / Observações**: Textos opcionais.
**Persistência**: Tabela `clientes`.

### 3. Formulário de Fornecedor (`FormFornecedor.tsx`)
**Finalidade**: Cadastrar um novo fornecedor.
**Campos**:
- **Nome da empresa** (Obrigatório): Texto livre.
- **Nome do contato**: Pessoa responsável pelo atendimento.
- **CNPJ**: Formato `00.000.000/0001-00`.
- **Telefone / WhatsApp**: Para botão WA direto na listagem.
- **E-mail**: Opcional.
- **Categoria**: Seleção entre `Eletrônicos`, `Acessórios`, `Autopeças`, `Serviços`, `Embalagens`, `Outros`.
- **Prazo de entrega**: Texto livre (ex: "3 dias úteis", "24h").
- **Pedido mínimo (R$)**: Valor numérico.
- **Endereço completo**: Rua, número, bairro.
- **Cidade / Estado**: Cidade texto + UF seleção.
- **Anotações**: Campo livre para observações.
**Persistência**: Tabela `fornecedores`.
**Modal de edição** (inline na página): Mesmo conjunto de campos. Adiciona campo **Status** (Ativo / Inativo).

### 4. Formulário de Cadastro Inicial (`/cadastro/page.tsx`)
**Finalidade**: Onboarding de novo lojista (Tenant).
**Campos**:
- **Nome Completo** (Obrigatório)
- **Nome da Loja** (Obrigatório)
- **Email** (Obrigatório, validação regex)
- **Senha** (Obrigatório, min 6 caracteres)
**Integração**: Chama `supabase.auth.signUp()`, envia nome da loja via `raw_user_meta_data`.

---

## 6.2 Mapeamento de Botões e Ações Críticas

### Botão "FINALIZAR VENDA" (PDV)
- **Texto exibido**: "▶ FINALIZAR VENDA — R$ [Total]" ou "▶ REGISTRAR NO FIADO"
- **Localização**: `/vendas/nova`, canto inferior direito.
- **Ação**: Executa batch de inserts e updates (cria `vendas`, `itens_venda`, abate `produtos.qtd_atual`, cria `garantias`, etc.).
- **Validações**: Carrinho não vazio, forma de pagamento selecionada, cliente obrigatoriamente preenchido se Fiado.
- **Mensagem**: Se houver Fiado em aberto para o mesmo cliente, alerta "🚨 O cliente já possui um Fiado em aberto".

### Botões do Acesso Rápido (Dashboard)
- **Localização**: `/dashboard`, sob a seção "Acesso Rápido".
- **Comportamento**: Dinâmico por plano.
  - Plano Start: Apenas `Nova Venda`.
  - Plano Pro: `Nova Venda`, `Ver Fiado`, `Lançar Despesa`, `Fechar Caixa`.
- **Feedback**: Hover scale com sombra sutil para feedback tátil (UI).

### Botões de Modificação de Estoque (`/estoque`)
- **Texto**: "Novo Ajuste"
- **Ação**: Abre modal perguntando `quantidade` e `tipo` (entrada/saida/ajuste/devolucao).
- **Integração**: Cria `estoque_movimentacoes` e atualiza `produtos.qtd_atual`.

---

## 6.3 APIs e Requisições do Sistema

Por ser um sistema Next.js App Router conectado diretamente ao Supabase via SDK, as "APIs" são métodos expostos pelo SDK do Supabase, não havendo rotas `/api/` REST clássicas. Toda requisição é segura pelo Row Level Security (RLS) associado à sessão do usuário (`minha_empresa_id()`).

### Principais Chamadas de Mutação
1. **`supabase.from('produtos').insert()`** → Acionada no FormProduto.
2. **`supabase.from('vendas').insert()`** → Core do sistema (PDV).
3. **`supabase.from('fiados').update({ status:'pago' })`** → Baixa manual de fiado.
4. **`supabase.auth.signUp()`** → Registro no Auth, disparando trigger de DB para criação do tenant.

### Principais Chamadas de Leitura (Queries)
1. **`supabase.from('vendas').select('...').gte('criado_em', inicioMes)`** → Gera os KPIs e DRE no módulo Financeiro.
2. **`supabase.from('produtos').select('...').gt('qtd_minima', 0)`** → Identifica estoque crítico.

### Rate Limit e Paginação
- Supabase lida nativamente com Rate Limit em rotas Auth.
- Paginação no frontend usa limites na query (ex: `.limit(20)`) e lazy loading na aba de vendas.

---

## 6.4 Integrações Externas

1. **Supabase (BaaS)**:
   - Finalidade: Autenticação, Banco de Dados Relacional (PostgreSQL), Realtime e Storage.
   - Tratamento de falhas: Frontend exibe mensagem "Erro de conexão", fallback manual em hooks.
2. **Navegador do Usuário (WebRTC)**:
   - Finalidade: Integração com a câmera local para leitura de código de barras.
   - Componente: `BarcodeScannerModal` usa `@zxing/library` ou APIs nativas para detectar EAN-13 e QR.
3. **WhatsApp (Deep link)**:
   - Finalidade: CRM de Sumidos e Cobrança de Fiados.
   - API Usada: URI `wa.me/55[numero]?text=[mensagem]`. Não necessita chave, dispara o app local do lojista.

---

## 6.5 Responsividade e Decisões de UX

### Decisões Core
1. **Mobile First real**: O lojista de rua não tem notebook. Telas vitais (PDV, Dashboard, Clientes) foram otimizadas para stack vertical em telas `< 600px`.
2. **Sem reload de página (SPA feeling)**: Navegação via Abas (`PageTabs`) e remoção da animação `.anim-fade` evita "piscar" a tela, deixando o PDV com sensação nativa.
3. **Alto contraste e fontes grandes**: O lojista frequentemente usa o celular sob o sol ou em locais agitados. Fontes numéricas (totais, preços) usam estilo tabular monospaced e tamanhos absolutos maiores.

### Breakpoints Padrão (`globals.css`)
- `< 768px` (Mobile): Sidebar esconde atrás de hambúrguer, tabelas viram scroll horizontal (tabela-wrap), PDV colapsa para empilhado (carrinho acima dos pagamentos).
- `>= 768px` (Tablet/Desktop): Sidebar fixa à esquerda, layout em Grid fluído no PDV (2 colunas 1fr e 340px para resumo).

---

## 6.6 Pendências Técnicas Imediatas (Roadmap PO)

- [ ] **Integração de Pagamento Automatizada**: Criar webhook (ex: Stripe ou Pagar.me) para atualizar a tabela `subscriptions.status` quando o lojista pagar a mensalidade do sistema.
- [ ] **Testes E2E (Playwright/Cypress)**: Criar testes do core flow (Adicionar produto -> Passar no PDV -> Verificar se abateu estoque).
- [ ] **Storage e Imagens**: O botão de upload de imagem em produtos precisa ser ativado usando `supabase.storage`.
- [ ] **Emissão Fiscal (NFC-e)**: Avaliar integração com API externa (ex: Focus NFe) caso o sistema evolua para lojas formalizadas (atualmente atende informal/MEI sem nota).
