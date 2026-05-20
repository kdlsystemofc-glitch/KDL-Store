# SIMULAÇÃO DE 30 DIAS — KDL STORE
**Versão:** 1.0  
**Gerado em:** 2026-05-20  
**Base:** `mapeamento_completo_sistema.md` (3261 linhas)  
**Objetivo:** Validação manual completa de todas as funcionalidades do sistema

---

> **LEIA ANTES DE COMEÇAR**
> Este guia simula a operação real de uma loja fictícia chamada **Ponto Digital** durante 30 dias corridos.
> Cada dia contém ações específicas com **dados exatos** a serem digitados, telas a serem visitadas, botões a serem clicados, e o resultado esperado de cada ação.
> Siga rigorosamente a ordem dos dias. Ao concluir cada etapa, marque o checkbox correspondente.
> Ao final dos 30 dias, todas as funcionalidades do sistema terão sido exercitadas ao menos uma vez.

---

## PERFIL DA LOJA FICTÍCIA

```
┌─────────────────────────────────────────────────────────────────────┐
│                       PONTO DIGITAL LTDA.                           │
├─────────────────┬───────────────────────────────────────────────────┤
│ Nome da Loja    │ Ponto Digital                                      │
│ Segmento        │ Eletrônicos / Acessórios para Celular             │
│ Cidade/Estado   │ São Paulo / SP                                     │
│ WhatsApp        │ (11) 91234-5678                                    │
│ Instagram       │ @pontodigital.sp                                   │
│ Plano Inicial   │ Start (R$ 65/mês)                                  │
│ Plano Final     │ Pro (R$ 95/mês) — upgrade no Dia 7                │
└─────────────────┴───────────────────────────────────────────────────┘
```

---

## EQUIPE FICTÍCIA

| # | Nome | E-mail | Papel | Status |
|---|------|--------|-------|--------|
| 1 | **Kauan Mendes** (Dono) | kauan@pontodigital.com | `admin` | Titular |
| 2 | **Lucas Ferreira** | lucas@pontodigital.com | `vendedor` | Convidado (Dia 5) |
| 3 | **Marina Santos** | marina@pontodigital.com | `estoquista` | Convidado (Dia 5) |

---

## FORNECEDORES FICTÍCIOS

| # | Nome | CNPJ | Telefone | E-mail | Endereço | Produtos Principais |
|---|------|------|----------|--------|----------|---------------------|
| 1 | TechBR Distribuidora | 12.345.678/0001-90 | (11) 3456-7890 | contato@techbr.com.br | Rua das Indústrias, 450 — SP | Fones, Carregadores, Cabos |
| 2 | InfoParts Ltda | 98.765.432/0001-11 | (11) 2222-3333 | pedidos@infoparts.com | Av. Comercial, 1200 — SP | Capas, Películas, Acessórios |
| 3 | Mega Eletrônicos | 55.444.333/0001-22 | (21) 9876-5432 | mega@megaeletronicos.com.br | Rua do Comércio, 77 — RJ | Fones Premium, Caixas de Som |

---

## PRODUTOS FICTÍCIOS (CATÁLOGO INICIAL)

| # | Nome | Código | Categoria | Preço Custo | Preço Varejo | Preço Atacado | Estoque | Mín | Fornecedor |
|---|------|--------|-----------|-------------|--------------|---------------|---------|-----|------------|
| 1 | Fone Bluetooth JBL T110 | 7891234567890 | Fones de Ouvido | R$ 45,00 | R$ 89,90 | R$ 75,00 | 15 | 3 | TechBR |
| 2 | Fone com Fio Sony MDR | 7892345678901 | Fones de Ouvido | R$ 28,00 | R$ 54,90 | R$ 45,00 | 20 | 5 | TechBR |
| 3 | Carregador Turbo 65W USB-C | 7893456789012 | Carregadores | R$ 32,00 | R$ 69,90 | R$ 55,00 | 25 | 5 | TechBR |
| 4 | Carregador Wireless 15W | 7894567890123 | Carregadores | R$ 40,00 | R$ 79,90 | R$ 65,00 | 10 | 3 | TechBR |
| 5 | Cabo USB-C 1m Reforçado | 7895678901234 | Cabos | R$ 8,00 | R$ 19,90 | R$ 15,00 | 50 | 10 | TechBR |
| 6 | Cabo Lightning 2m | 7896789012345 | Cabos | R$ 10,00 | R$ 24,90 | R$ 18,00 | 40 | 8 | TechBR |
| 7 | Capa Silicone iPhone 15 | 7897890123456 | Capas e Películas | R$ 12,00 | R$ 29,90 | R$ 22,00 | 30 | 5 | InfoParts |
| 8 | Capa Anti-Impacto Samsung A55 | 7898901234567 | Capas e Películas | R$ 18,00 | R$ 39,90 | R$ 32,00 | 25 | 5 | InfoParts |
| 9 | Película Vidro 3D iPhone 15 | 7899012345678 | Capas e Películas | R$ 6,00 | R$ 14,90 | R$ 11,00 | 60 | 15 | InfoParts |
| 10 | Película Hydrogel Samsung | 7890123456789 | Capas e Películas | R$ 5,00 | R$ 12,90 | R$ 9,00 | 80 | 20 | InfoParts |
| 11 | Caixa de Som JBL Go 4 | 7891357924680 | Caixas de Som | R$ 120,00 | R$ 229,90 | R$ 195,00 | 8 | 2 | Mega Eletrônicos |
| 12 | Caixa de Som Portátil XS | 7892468013579 | Caixas de Som | R$ 75,00 | R$ 149,90 | R$ 125,00 | 6 | 2 | Mega Eletrônicos |
| 13 | Suporte Veicular Magnético | 7893579124680 | Acessórios Veiculares | R$ 15,00 | R$ 34,90 | R$ 28,00 | 20 | 4 | InfoParts |
| 14 | Carregador Veicular 2x USB | 7894680235791 | Acessórios Veiculares | R$ 12,00 | R$ 27,90 | R$ 22,00 | 18 | 4 | TechBR |
| 15 | Power Bank 10000mAh | 7895791346802 | Carregadores | R$ 55,00 | R$ 109,90 | R$ 89,00 | 12 | 3 | TechBR |
| 16 | Headset Gamer RGB | 7896802457913 | Fones de Ouvido | R$ 88,00 | R$ 169,90 | R$ 145,00 | 5 | 2 | Mega Eletrônicos |
| 17 | Adaptador USB-C para P2 | 7897913568024 | Cabos | R$ 7,00 | R$ 16,90 | R$ 13,00 | 35 | 8 | TechBR |
| 18 | Hub USB 4 Portas | 7898024679135 | Acessórios | R$ 22,00 | R$ 49,90 | R$ 40,00 | 15 | 3 | InfoParts |
| 19 | Mouse Bluetooth Recarregável | 7899135780246 | Informática | R$ 65,00 | R$ 129,90 | R$ 109,00 | 8 | 2 | InfoParts |
| 20 | Teclado Bluetooth Slim | 7890246891357 | Informática | R$ 95,00 | R$ 189,90 | R$ 159,00 | 5 | 2 | InfoParts |

---

## CLIENTES FICTÍCIOS

| # | Nome | Telefone | Tipo | Profissão | CPF/CNPJ | Endereço | Cidade |
|---|------|----------|------|-----------|----------|----------|--------|
| 1 | Ana Paula Costa | (11) 98765-4321 | varejo | Professora | 111.222.333-44 | Rua das Flores, 123 | São Paulo |
| 2 | Bruno Lima | (11) 97654-3210 | varejo | Autônomo | 222.333.444-55 | Av. Brasil, 456 | São Paulo |
| 3 | Carla Souza | (11) 96543-2109 | atacado | Revendedora | 333.444.555-66 | Rua do Comércio, 789 | Guarulhos |
| 4 | Diego Alves | (11) 95432-1098 | varejo | Estudante | 444.555.666-77 | Rua Nova, 321 | São Paulo |
| 5 | Elisângela Martins | (11) 94321-0987 | varejo | Enfermeira | 555.666.777-88 | Av. São João, 654 | São Paulo |
| 6 | Fernando Rocha | (11) 93210-9876 | atacado | Comerciante | 12.345.678/0001-90 | Rua do Mercado, 987 | São Paulo |
| 7 | Gabriela Nunes | (11) 92109-8765 | varejo | Advogada | 666.777.888-99 | Alameda Santos, 147 | São Paulo |
| 8 | Hugo Pereira | (11) 91098-7654 | vip | Empresário | 777.888.999-00 | Rua Pamplona, 258 | São Paulo |
| 9 | Isabela Ferraz | (11) 90987-6543 | varejo | Médica | 888.999.000-11 | Av. Paulista, 369 | São Paulo |
| 10 | José Raimundo | (11) 89876-5432 | varejo | Aposentado | 999.000.111-22 | Rua Augusta, 741 | São Paulo |
| 11 | Kátia Borges | (11) 88765-4321 | atacado | Lojista | 11.222.333/0001-44 | Rua 25 de Março, 852 | São Paulo |
| 12 | Leonardo Faria | (11) 87654-3210 | varejo | Engenheiro | 000.111.222-33 | Rua Oscar Freire, 963 | São Paulo |

---

## CATEGORIAS DE PRODUTOS

| # | Nome | Cor |
|---|------|-----|
| 1 | Fones de Ouvido | Azul |
| 2 | Carregadores | Verde |
| 3 | Cabos | Amarelo |
| 4 | Capas e Películas | Rosa |
| 5 | Caixas de Som | Laranja |
| 6 | Acessórios Veiculares | Cinza |
| 7 | Informática | Roxo |
| 8 | Acessórios | Ciano |

---

## FORMAS DE PAGAMENTO

| # | Nome | Taxa | Ativo |
|---|------|------|-------|
| 1 | Dinheiro | 0% | ✅ |
| 2 | PIX | 0% | ✅ |
| 3 | Cartão Débito | 1.5% | ✅ |
| 4 | Cartão Crédito | 2.99% | ✅ |
| 5 | Fiado | 0% | ✅ (ativar no Dia 1) |
| 6 | Boleto | 0% | ❌ |
| 7 | Cheque | 0% | ❌ |

---

## COMISSIONADOS (PUXADORES)

| # | Nome | Percentual | Vínculo |
|---|------|-----------|---------|
| 1 | Lucas Ferreira | 3% | Usuário interno |
| 2 | Pedro Indicador | 2% | Externo (sem acesso) |

---

## CALENDÁRIO DE SIMULAÇÃO

```
MAIO/JUNHO 2026 — PONTO DIGITAL

SEG  TER  QUA  QUI  SEX  SAB  DOM
                          1    2    3
 4    5    6    7    8    9   10
11   12   13   14   15   16   17
18   19   20   21   22   23   24
25   26   27   28   29   30

Dias 01–07: Configuração e Setup
Dias 08–14: Operação de Vendas
Dias 15–21: Funcionalidades Avançadas
Dias 22–28: Edições, Exclusões e Edge Cases
Dias 29–30: Revisão Final e Planos
```

---

# ════════════════════════════════════════════════
# SEMANA 1 — CONFIGURAÇÃO E SETUP (Dias 1–7)
# ════════════════════════════════════════════════

---

## DIA 1 — CRIAR CONTA E CONFIGURAR A LOJA
**Módulos:** Cadastro · Configurações Geral · Configurações Empresa · Formas de Pagamento

---

### ETAPA 1.1 — Acessar a Landing Page

- [ ] Abrir o navegador e acessar a URL do sistema.
- [ ] **Verificar:** O vídeo hero (`/Hero-oficial.mp4`) carrega e reproduz silenciosamente.
- [ ] **Verificar:** As stats animadas aparecem (500+ lojas, R$ 2M+, 98% satisfação, Zero papel).
- [ ] **Verificar:** A seção "Problema" com a tabela de comparação (😓 vs 🚀) está visível.
- [ ] **Verificar:** Os dois planos estão exibidos — Start (R$ 65/mês) e Pro (R$ 95/mês com badge ⭐ MAIS ESCOLHIDO).
- [ ] Clicar no botão **"Entrar no sistema"** (header) → deve ir para `/login`.

---

### ETAPA 1.2 — Criar Conta (Cadastro)

- [ ] Na tela de login, clicar em **"Criar conta"**.
- [ ] Preencher o formulário:

| Campo | Valor a digitar |
|-------|----------------|
| Nome da sua loja | `Ponto Digital` |
| Tipo de negócio | `🔊 Eletrônicos / Som Automotivo` |
| E-mail | `kauan@pontodigital.com` |
| Senha | `Ponto@2026` |
| Confirmar senha | `Ponto@2026` |

- [ ] **Verificar:** O indicador de força da senha mostra `✓ 8+ chars`, `✓ Maiúscula`, `✓ Número` em verde.
- [ ] Clicar em **"Criar minha conta"**.
- [ ] **Verificar:** A tela de sucesso exibe o emoji 📧 e a mensagem "Verifique seu e-mail!".
- [ ] Acessar o e-mail `kauan@pontodigital.com` e clicar no link de confirmação.
- [ ] **Verificar:** O sistema redireciona para `/dashboard`.

---

### ETAPA 1.3 — Verificar o Dashboard Inicial

- [ ] **Verificar:** A splash screen "Iniciando sistema..." aparece brevemente.
- [ ] **Verificar:** A sidebar exibe "Ponto Digital" como nome da loja.
- [ ] **Verificar:** O badge **"Plano Start"** (verde) aparece abaixo do nome da loja.
- [ ] **Verificar:** O avatar no rodapé da sidebar exibe a inicial "K" em verde.
- [ ] **Verificar:** Os cards do dashboard estão visíveis (Vendas Hoje, Produtos Ativos, Clientes, Estoque Crítico).

---

### ETAPA 1.4 — Configurar Dados da Empresa

- [ ] Na sidebar, clicar em **Configurações** (ícone Settings).
- [ ] Clicar na aba **"Empresa"**.
- [ ] Preencher os campos:

| Campo | Valor a digitar |
|-------|----------------|
| Nome da empresa | `Ponto Digital` |
| WhatsApp | `(11) 91234-5678` |
| Instagram | `@pontodigital.sp` |
| Estado | `SP` |
| Cidade | `São Paulo` |
| Endereço | `Av. Paulista, 1000 — Bela Vista` |

- [ ] Clicar em **"Salvar alterações"**.
- [ ] **Verificar:** Toast de sucesso aparece ("Dados salvos com sucesso!" ou similar).
- [ ] **Verificar:** O slug do catálogo gerado aparece no campo correspondente.

---

### ETAPA 1.5 — Configurar Formas de Pagamento

- [ ] Clicar na aba **"Formas de Pagamento"**.
- [ ] **Verificar:** As 4 formas padrão já estão ativas: Dinheiro, PIX, Cartão Débito (1.5%), Cartão Crédito (2.99%).
- [ ] **Verificar:** Boleto e Cheque estão inativos.
- [ ] Ativar o **Fiado**: clicar no toggle/botão de ativação ao lado de "Fiado".
- [ ] **Verificar:** Fiado aparece como ativo.
- [ ] Clicar em **"+ Adicionar forma de pagamento"** e cadastrar:

| Campo | Valor |
|-------|-------|
| Nome | `Transferência Bancária` |
| Taxa | `0` |
| Ativo | ✅ |

- [ ] **Verificar:** A nova forma de pagamento aparece na lista.
- [ ] Testar edição: clicar no ícone de editar de **"Cartão Crédito"** e alterar a taxa para `3.5%`. Salvar.
- [ ] **Verificar:** Taxa atualizada para 3.5%.
- [ ] Desfazer: editar novamente e voltar para `2.99%`. Salvar.

---

### ETAPA 1.6 — Verificar Configurações Gerais

- [ ] Clicar na aba **"Geral"**.
- [ ] **Verificar:** O plano atual exibido é **"Start"** com lista de features do plano.
- [ ] **Verificar:** O campo "Dias de inatividade de cliente" está presente (CRM).
- [ ] **Verificar:** A seção "Zona de Perigo" (cancelamento) está visível mas não clicar ainda.
- [ ] **Verificar:** O rodapé exibe "KDL STORE v1.2.0" *(inconsistência conhecida — hardcoded)*.

---

## DIA 2 — CADASTRAR CATEGORIAS E CONFIGURAR O SISTEMA

**Módulos:** Configurações Categorias · Configurações Geral

---

### ETAPA 2.1 — Cadastrar Categorias de Produtos

- [ ] Acessar **Configurações → aba "Categorias"**.
- [ ] Para cada categoria da lista abaixo, clicar em **"+ Nova Categoria"**, preencher e salvar:

| Nome | Cor a selecionar |
|------|-----------------|
| Fones de Ouvido | Azul |
| Carregadores | Verde |
| Cabos | Amarelo |
| Capas e Películas | Rosa |
| Caixas de Som | Laranja |
| Acessórios Veiculares | Cinza |
| Informática | Roxo |
| Acessórios | Ciano |

- [ ] **Verificar:** Todas as 8 categorias aparecem na lista com a cor correta.
- [ ] Testar edição: clicar no lápis de **"Informática"** e renomear para `Informática e Games`. Salvar.
- [ ] **Verificar:** Nome atualizado na lista.
- [ ] Renomear de volta para `Informática`. Salvar.
- [ ] Testar exclusão: clicar no ícone de lixeira de **"Acessórios"**.
- [ ] **Verificar:** Confirmação de exclusão aparece.
- [ ] Confirmar a exclusão.
- [ ] **Verificar:** A categoria sumiu da lista.
- [ ] Recriar a categoria **"Acessórios"** com cor **Ciano**.

---

### ETAPA 2.2 — Configurar Dias de Inatividade de Cliente

- [ ] Acessar **Configurações → aba "Geral"**.
- [ ] No campo **"Dias de inatividade"**, definir o valor para `45` dias.
- [ ] Salvar as configurações.
- [ ] **Verificar:** Valor salvo com sucesso.

---

## DIA 3 — CADASTRAR FORNECEDORES

**Módulos:** Fornecedores

---

### ETAPA 3.1 — Acessar o Módulo de Fornecedores

- [ ] Na sidebar, clicar em **Clientes** (ou navegar para `/fornecedores`).
- [ ] **Verificar:** A aba "Fornecedores" está disponível ou o link direto funciona.

---

### ETAPA 3.2 — Cadastrar Fornecedor 1 — TechBR

- [ ] Clicar em **"+ Novo Fornecedor"**.
- [ ] Preencher o formulário (`FormFornecedor`):

| Campo | Valor |
|-------|-------|
| Nome | `TechBR Distribuidora` |
| Nome do contato | `Sandro` |
| CNPJ | `12.345.678/0001-90` |
| Telefone | `(11) 3456-7890` |
| E-mail | `contato@techbr.com.br` |
| Categoria | `Eletrônicos` |
| Prazo de entrega | `3 dias` |
| Pedido mínimo (R$) | `100` |
| Endereço | `Rua das Indústrias, 450` |
| Cidade | `São Paulo` |
| Estado | `SP` |
| Observações | `Principal fornecedor. Entrega em 3 dias úteis.` |

- [ ] Clicar em **"Salvar"**.
- [ ] **Verificar:** TechBR Distribuidora aparece na lista de fornecedores.

---

### ETAPA 3.3 — Cadastrar Fornecedor 2 — InfoParts

- [ ] Clicar em **"+ Novo Fornecedor"** e preencher:

| Campo | Valor |
|-------|-------|
| Nome | `InfoParts Ltda` |
| Nome do contato | `Carla` |
| CNPJ | `98.765.432/0001-11` |
| Telefone | `(11) 2222-3333` |
| E-mail | `pedidos@infoparts.com` |
| Categoria | `Acessórios` |
| Prazo de entrega | `24h` |
| Pedido mínimo (R$) | `150` |
| Endereço | `Av. Comercial, 1200` |
| Cidade | `São Paulo` |
| Estado | `SP` |
| Observações | `Especialista em capas, películas e acessórios.` |

- [ ] Salvar e verificar na lista.

---

### ETAPA 3.4 — Cadastrar Fornecedor 3 — Mega Eletrônicos

- [ ] Clicar em **"+ Novo Fornecedor"** e preencher:

| Campo | Valor |
|-------|-------|
| Nome | `Mega Eletrônicos` |
| Nome do contato | `Marcos` |
| CNPJ | `55.444.333/0001-22` |
| Telefone | `(21) 9876-5432` |
| E-mail | `mega@megaeletronicos.com.br` |
| Categoria | `Outros` |
| Prazo de entrega | `5 dias` |
| Pedido mínimo (R$) | `500` |
| Endereço | `Rua do Comércio, 77` |
| Cidade | `Rio de Janeiro` |
| Estado | `RJ` |
| Observações | `Fones premium e caixas de som. Frete grátis acima de R$ 500.` |

- [ ] Salvar e verificar na lista.

---

### ETAPA 3.5 — Testar Edição de Fornecedor

- [ ] Clicar no ícone de editar de **"InfoParts Ltda"**.
- [ ] Alterar o telefone para `(11) 2222-4444`.
- [ ] Salvar.
- [ ] **Verificar:** Telefone atualizado na lista.
- [ ] Editar novamente e voltar para `(11) 2222-3333`. Salvar.

---

## DIA 4 — CADASTRAR TODOS OS PRODUTOS

**Módulos:** Produtos / Estoque

---

### ETAPA 4.1 — Acessar Módulo de Produtos

- [ ] Na sidebar, clicar em **Produtos / Estoque**.
- [ ] **Verificar:** A lista de produtos está vazia.

---

### ETAPA 4.2 — Cadastrar os 20 Produtos

Para cada produto da tabela do catálogo inicial, fazer:

- [ ] Clicar em **"+ Novo Produto"** (ou no botão equivalente).
- [ ] O modal `FormProduto` deve abrir.

**Produto 1 — Fone Bluetooth JBL T110:**

| Campo | Valor |
|-------|-------|
| Nome | `Fone Bluetooth JBL T110` |
| Código de Barras | `7891234567890` |
| Categoria | `Fones de Ouvido` |
| Preço de Custo | `45,00` |
| Preço Varejo | `89,90` |
| Preço Atacado | `75,00` |
| Preço VIP | `82,00` |
| Qtd Atual | `15` |
| Qtd Mínima (alerta) | `3` |
| Qtd Máxima | `30` |
| Preço Mínimo PDV (R$) | `80,00` |
| Controle de Garantia | ✅ Ativo |
| Prazo de Garantia (dias) | `90` |
| Fornecedor Vinculado | `TechBR Distribuidora` |
| Descrição | `Fone bluetooth com autonomia de 6h, design compacto.` |

- [ ] Salvar.
- [ ] **Verificar:** Produto aparece na lista.

**Produto 2 — Fone com Fio Sony MDR:**

| Campo | Valor |
|-------|-------|
| Nome | `Fone com Fio Sony MDR` |
| Código de Barras | `7892345678901` |
| Categoria | `Fones de Ouvido` |
| Preço de Custo | `28,00` |
| Preço Varejo | `54,90` |
| Preço Atacado | `45,00` |
| Preço VIP | `50,00` |
| Qtd Atual | `20` |
| Qtd Mínima (alerta) | `5` |
| Qtd Máxima | `40` |
| Controle de Garantia | ✅ Ativo |
| Prazo de Garantia (dias) | `30` |
| Fornecedor Vinculado | `TechBR Distribuidora` |

- [ ] Salvar.

**Produto 3 — Carregador Turbo 65W USB-C:**

| Campo | Valor |
|-------|-------|
| Nome | `Carregador Turbo 65W USB-C` |
| Código de Barras | `7893456789012` |
| Categoria | `Carregadores` |
| Preço de Custo | `32,00` |
| Preço Varejo | `69,90` |
| Preço Atacado | `55,00` |
| Preço VIP | `62,00` |
| Qtd Atual | `25` |
| Qtd Mínima (alerta) | `5` |
| Qtd Máxima | `50` |
| Controle de Garantia | ✅ Ativo |
| Prazo de Garantia (dias) | `90` |
| Fornecedor Vinculado | `TechBR Distribuidora` |

- [ ] Salvar.

**Produto 4 — Carregador Wireless 15W:**

| Campo | Valor |
|-------|-------|
| Nome | `Carregador Wireless 15W` |
| Código de Barras | `7894567890123` |
| Categoria | `Carregadores` |
| Preço de Custo | `40,00` |
| Preço Varejo | `79,90` |
| Preço Atacado | `65,00` |
| Qtd Atual | `10` |
| Qtd Mínima (alerta) | `3` |
| Controle de Garantia | ✅ Ativo |
| Prazo de Garantia (dias) | `90` |
| Fornecedor Vinculado | `TechBR Distribuidora` |

- [ ] Salvar.

**Produto 5 — Cabo USB-C 1m Reforçado:**

| Campo | Valor |
|-------|-------|
| Nome | `Cabo USB-C 1m Reforçado` |
| Código de Barras | `7895678901234` |
| Categoria | `Cabos` |
| Preço de Custo | `8,00` |
| Preço Varejo | `19,90` |
| Preço Atacado | `15,00` |
| Qtd Atual | `50` |
| Qtd Mínima (alerta) | `10` |
| Controle de Garantia | ❌ |
| Fornecedor Vinculado | `TechBR Distribuidora` |

- [ ] Salvar.

**Produtos 6 a 20:** Repetir o processo para cada produto da tabela do catálogo, utilizando os dados exatos da tabela **"PRODUTOS FICTÍCIOS"** acima.

- [ ] **Verificar ao final:** 20 produtos aparecem na lista de produtos.
- [ ] **Verificar:** Os produtos com estoque próximo do mínimo mostram alerta visual.

---

### ETAPA 4.3 — Testar Scanner de Código de Barras

- [ ] Clicar em **"+ Novo Produto"**.
- [ ] Clicar no ícone da câmera (🎥) para abrir o `BarcodeScannerModal`.
- [ ] **Verificar:** A câmera do dispositivo é acionada.
- [ ] **Verificar:** O modal exibe a visualização em tempo real.
- [ ] Fechar o scanner sem escanear (botão Fechar/X).

---

### ETAPA 4.4 — Testar Busca de Produtos

- [ ] Na lista de produtos, usar o campo de busca.
- [ ] Digitar: `Fone`
- [ ] **Verificar:** Apenas os produtos com "Fone" no nome são exibidos (3 produtos: JBL, Sony MDR, Headset Gamer).
- [ ] Limpar a busca.
- [ ] Filtrar por categoria **"Carregadores"**.
- [ ] **Verificar:** Apenas os 3 carregadores são exibidos.
- [ ] Limpar o filtro.

---

## DIA 5 — CADASTRAR CLIENTES E CONVIDAR COLABORADORES

**Módulos:** Clientes · Configurações Usuários

---

### ETAPA 5.1 — Cadastrar Clientes

- [ ] Na sidebar, clicar em **Clientes**.
- [ ] Clicar em **"+ Novo Cliente"** e usar o formulário `FormCliente`.

**Cliente 1 — Ana Paula Costa:**

| Campo | Valor |
|-------|-------|
| Nome | `Ana Paula Costa` |
| Telefone | `(11) 98765-4321` |
| Tipo de Preço | `varejo` |
| CPF | `111.222.333-44` |
| Endereço | `Rua das Flores, 123` |
| Cidade | `São Paulo` |
| Estado | `SP` |

- [ ] Salvar.

**Cliente 2 — Bruno Lima:**

| Campo | Valor |
|-------|-------|
| Nome | `Bruno Lima` |
| Telefone | `(11) 97654-3210` |
| Tipo de Preço | `varejo` |
| CPF | `222.333.444-55` |
| Cidade | `São Paulo` |

- [ ] Salvar.

**Cliente 3 — Carla Souza:**

| Campo | Valor |
|-------|-------|
| Nome | `Carla Souza` |
| Telefone | `(11) 96543-2109` |
| Tipo de Preço | `atacado` |
| CPF | `333.444.555-66` |
| Endereço | `Rua do Comércio, 789` |
| Cidade | `Guarulhos` |

- [ ] Salvar.

**Cliente 4 — Diego Alves:**

| Campo | Valor |
|-------|-------|
| Nome | `Diego Alves` |
| Telefone | `(11) 95432-1098` |
| Tipo de Preço | `varejo` |
| Cidade | `São Paulo` |

- [ ] Salvar.

**Clientes 5 a 12:** Repetir para todos os clientes da tabela **"CLIENTES FICTÍCIOS"**, usando os dados exatos.

- [ ] **Verificar ao final:** 12 clientes na lista.
- [ ] **Verificar:** A busca por nome funciona (testar busca por "Ana").
- [ ] **Verificar:** O filtro por tipo (varejo / atacado / vip) funciona.

---

### ETAPA 5.2 — Convidar Colaboradores

- [ ] Acessar **Configurações → aba "Usuários"** (ou "Colaboradores").
- [ ] Clicar em **"Convidar Colaborador"** ou **"+ Novo Convite"**.
- [ ] Preencher para Lucas Ferreira:

| Campo | Valor |
|-------|-------|
| E-mail | `lucas@pontodigital.com` |
| Papel | `vendedor` |

- [ ] Confirmar/Enviar convite.
- [ ] **Verificar:** O convite aparece na lista com status `pendente`.
- [ ] **Verificar:** Um link de convite é gerado (copiar o link).
- [ ] Clicar em **"+ Novo Convite"** para Marina Santos:

| Campo | Valor |
|-------|-------|
| E-mail | `marina@pontodigital.com` |
| Papel | `estoquista` |

- [ ] Confirmar/Enviar convite.
- [ ] **Verificar:** Dois convites pendentes aparecem na lista.

---

### ETAPA 5.3 — Aceitar Convite (Simular como Lucas)

- [ ] Abrir o link de convite do Lucas em uma aba anônima/privada.
- [ ] **Verificar:** A página `/convite?token=...` carrega com a mensagem 🎉 "Você foi convidado!".
- [ ] **Verificar:** O e-mail e o papel (Vendedor) estão exibidos corretamente.
- [ ] Preencher:

| Campo | Valor |
|-------|-------|
| Senha | `Lucas@2026` |
| Confirmar senha | `Lucas@2026` |

- [ ] Clicar em **"Criar conta e entrar"**.
- [ ] **Verificar:** O sistema redireciona para `/dashboard` com a conta do Lucas logada.
- [ ] **Verificar:** A sidebar exibe "Ponto Digital" (mesma loja do Kauan).
- [ ] **Verificar:** Lucas vê o botão "Nova Venda" (pois é `vendedor` = `OperadorOnly`).
- [ ] **Verificar:** Lucas NÃO vê "Configurações" na sidebar (não é admin).
- [ ] Fazer logout da conta do Lucas.
- [ ] Voltar para a conta principal (Kauan).

---

## DIA 6 — EXPLORAR O CATÁLOGO ONLINE

**Módulos:** Catálogo Online

---

### ETAPA 6.1 — Acessar e Visualizar o Catálogo

- [ ] Na sidebar, clicar em **Produtos / Estoque**.
- [ ] Clicar na aba **"Catálogo Online"** (ou navegar para `/catalogo`).
- [ ] **Verificar:** O catálogo exibe os produtos cadastrados.
- [ ] **Verificar:** O link público do catálogo está disponível para copiar/compartilhar.
- [ ] **Verificar:** O QR Code do catálogo está visível.
- [ ] Abrir o link público do catálogo em nova aba.
- [ ] **Verificar:** O catálogo público exibe os produtos corretamente.
- [ ] Testar o filtro por categoria no catálogo.
- [ ] Testar a busca por produto.

---

### ETAPA 6.2 — Configurar o Catálogo

- [ ] Voltar ao painel administrativo.
- [ ] Verificar se o catálogo permite ativar/desativar produtos da exibição pública.
- [ ] Desativar o produto **"Headset Gamer RGB"** do catálogo (se houver opção).
- [ ] **Verificar:** O produto some do catálogo público.
- [ ] Reativar o produto.

---

## DIA 7 — UPGRADE PARA PLANO PRO

**Módulos:** Configurações Planos · Stripe

---

### ETAPA 7.1 — Testar Bloqueio do Plano Start

- [ ] Na sidebar, clicar em **Financeiro**.
- [ ] **Verificar:** O sistema bloqueia o acesso (middleware) — redireciona ou exibe aviso de plano.
- [ ] Na sidebar, clicar em **Relatórios**.
- [ ] **Verificar:** O sistema bloqueia o acesso (middleware Pro).

---

### ETAPA 7.2 — Fazer Upgrade para Pro

- [ ] Acessar **Configurações → aba "Planos e Assinatura"**.
- [ ] **Verificar:** O plano atual exibido é Start (R$ 65/mês).
- [ ] Clicar em **"Fazer Upgrade para Pro"** (ou botão equivalente).
- [ ] **Verificar:** Redireciona para o Stripe Checkout.
- [ ] Completar o pagamento com cartão de teste Stripe: `4242 4242 4242 4242`, `12/30`, `123`.
- [ ] **Verificar:** Retorna ao sistema após pagamento.
- [ ] **Verificar:** O badge da sidebar muda para **"Plano Pro"** (fundo amarelo).
- [ ] **Verificar:** Agora é possível acessar **Financeiro** e **Relatórios**.

---

### ETAPA 7.3 — Verificar Banner de Assinatura

- [ ] **Verificar:** Nenhum banner de alerta aparece (pagamento em dia).
- [ ] (Nota: o banner vermelho aparece apenas se `status = 'past_due'` e o amarelo se `cancel_at_period_end = true`.)

---

# ════════════════════════════════════════════════
# SEMANA 2 — OPERAÇÃO DE VENDAS (Dias 8–14)
# ════════════════════════════════════════════════

---

## DIA 8 — PRIMEIRAS VENDAS NO PDV

**Módulos:** PDV (Nova Venda) · Histórico de Vendas

---

### ETAPA 8.1 — Acessar o PDV

- [ ] Na sidebar, clicar no botão verde **"Nova Venda"** (ou pressionar `F2` se implementado).
- [ ] **Verificar:** A interface do PDV abre em `/vendas/nova`.
- [ ] **Verificar:** O campo de busca de produtos está em foco.

---

### ETAPA 8.2 — Venda 1: Ana Paula — Dinheiro

**Cenário:** Ana Paula compra um fone JBL e um cabo USB-C.

- [ ] No PDV, no campo de busca, digitar: `Fone JBL`
- [ ] **Verificar:** O produto "Fone Bluetooth JBL T110" aparece no autocomplete.
- [ ] Selecionar o produto.
- [ ] **Verificar:** O produto aparece no carrinho com quantidade 1 e preço R$ 89,90.
- [ ] No campo de busca, digitar: `Cabo USB-C`
- [ ] Selecionar "Cabo USB-C 1m Reforçado".
- [ ] **Verificar:** Dois itens no carrinho. Total: R$ 89,90 + R$ 19,90 = R$ 109,80.
- [ ] Clicar em **"Selecionar Cliente"** (ou campo de cliente).
- [ ] Buscar e selecionar: `Ana Paula Costa`.
- [ ] **Verificar:** O preço não muda (ela é tipo `varejo`).
- [ ] No campo "Forma de Pagamento", selecionar: **Dinheiro**.
- [ ] **Verificar:** Nenhuma taxa de forma de pagamento aplicada.
- [ ] Clicar em **"Finalizar Venda"** (ou "Checkout").
- [ ] **Verificar:** Modal de sucesso da venda aparece.
- [ ] **Verificar:** O número da venda é exibido.
- [ ] Clicar em **"Imprimir Recibo"** (verificar se abre janela de impressão).
- [ ] Fechar o modal (permanecer no PDV para nova venda).

---

### ETAPA 8.3 — Venda 2: Bruno Lima — PIX

**Cenário:** Bruno compra um carregador wireless.

- [ ] No PDV, buscar: `Carregador Wireless`
- [ ] Selecionar e adicionar ao carrinho (quantidade: 1).
- [ ] Selecionar cliente: `Bruno Lima`.
- [ ] Forma de pagamento: **PIX**.
- [ ] Clicar em **"Finalizar Venda"**.
- [ ] **Verificar:** Venda registrada com sucesso.

---

### ETAPA 8.4 — Venda 3: Carla Souza — Cartão Crédito (Preço Atacado)

**Cenário:** Carla (tipo atacado) compra 10 capas para iPhone.

- [ ] No PDV, buscar: `Capa Silicone iPhone`
- [ ] Selecionar e definir quantidade: `10`.
- [ ] Selecionar cliente: `Carla Souza`.
- [ ] **Verificar:** O preço unitário muda para R$ 22,00 (preço atacado, pois Carla é tipo `atacado`).
- [ ] Total: R$ 22,00 × 10 = R$ 220,00.
- [ ] Forma de pagamento: **Cartão Crédito** (taxa 2.99%).
- [ ] **Verificar:** A taxa de R$ 6,58 é exibida (ou o total ajustado).
- [ ] Finalizar a venda.

---

### ETAPA 8.5 — Venda 4: Hugo Pereira — Preço VIP

**Cenário:** Hugo (tipo vip) compra a caixa de som JBL Go 4.

- [ ] No PDV, buscar: `Caixa de Som JBL Go 4`
- [ ] Selecionar e adicionar (quantidade: 1).
- [ ] Selecionar cliente: `Hugo Pereira`.
- [ ] **Verificar:** O preço muda para o VIP (se configurado para JBL Go 4).
- [ ] Forma de pagamento: **Cartão Débito** (taxa 1.5%).
- [ ] Finalizar a venda.

---

### ETAPA 8.6 — Verificar Histórico de Vendas

- [ ] Na sidebar, clicar em **Histórico de Vendas**.
- [ ] **Verificar:** As 4 vendas do dia aparecem na lista.
- [ ] **Verificar:** Cada venda exibe: número, cliente, valor, forma de pagamento, data.
- [ ] Clicar na venda da Ana Paula Costa para ver o **Detalhe da Venda**.
- [ ] **Verificar:** Os itens (Fone JBL + Cabo USB-C) estão listados.
- [ ] **Verificar:** O recibo pode ser impresso a partir do detalhe.
- [ ] Voltar para o histórico.

---

### ETAPA 8.7 — Verificar Dashboard Atualizado

- [ ] Acessar o Dashboard principal.
- [ ] **Verificar:** O card "Vendas Hoje" exibe o total das 4 vendas.
- [ ] **Verificar:** O card "Produtos Ativos" exibe os 20 produtos.
- [ ] **Verificar:** O painel "Como foi?" (PRO) mostra dados do dia.

---

## DIA 9 — MAIS VENDAS — EXPLORAR TODAS AS FORMAS DE PAGAMENTO

**Módulos:** PDV · Histórico

---

### ETAPA 9.1 — Venda 5: Diego Alves — Cartão Débito

- [ ] Abrir o PDV.
- [ ] Buscar e adicionar: `Película Vidro 3D iPhone 15` (quantidade: 2).
- [ ] Buscar e adicionar: `Adaptador USB-C para P2` (quantidade: 1).
- [ ] Selecionar cliente: `Diego Alves`.
- [ ] Forma de pagamento: **Cartão Débito**.
- [ ] Total aprox.: (R$ 14,90 × 2) + R$ 16,90 = R$ 46,70 + taxa 1.5%.
- [ ] Finalizar.

---

### ETAPA 9.2 — Venda 6: Sem Cliente — Dinheiro

- [ ] Abrir o PDV.
- [ ] Adicionar: `Cabo Lightning 2m` (quantidade: 1).
- [ ] **NÃO** selecionar cliente (venda anônima).
- [ ] Forma de pagamento: **Dinheiro**.
- [ ] Valor: R$ 24,90.
- [ ] Finalizar.
- [ ] **Verificar:** A venda sem cliente é registrada normalmente.

---

### ETAPA 9.3 — Venda 7: Elisângela — Transferência Bancária

- [ ] Abrir o PDV.
- [ ] Adicionar: `Power Bank 10000mAh` (quantidade: 1).
- [ ] Selecionar cliente: `Elisângela Martins`.
- [ ] Forma de pagamento: **Transferência Bancária**.
- [ ] Finalizar.

---

### ETAPA 9.4 — Venda 8: Fernando Rocha — PIX (Atacado)

**Cenário:** Fernando (atacado/CNPJ) compra em quantidade.

- [ ] Abrir o PDV.
- [ ] Adicionar: `Fone com Fio Sony MDR` (quantidade: 5).
- [ ] Adicionar: `Cabo USB-C 1m Reforçado` (quantidade: 10).
- [ ] Selecionar cliente: `Fernando Rocha`.
- [ ] **Verificar:** Preços no valor de atacado.
- [ ] Forma de pagamento: **PIX**.
- [ ] Finalizar.

---

### ETAPA 9.5 — Testar Brinde no PDV

- [ ] Abrir o PDV.
- [ ] Adicionar produto: `Película Hydrogel Samsung` (quantidade: 1).
- [ ] **Verificar se há opção de marcar como "brinde"** (verificar se o PDV tem esta opção).
- [ ] Se disponível: marcar o item como brinde.
- [ ] Selecionar cliente: `Gabriela Nunes`.
- [ ] Adicionar item pago: `Carregador Turbo 65W USB-C`.
- [ ] Forma de pagamento: **Dinheiro**.
- [ ] Finalizar.
- [ ] **Verificar:** O brinde está registrado com valor R$ 0,00 no recibo.

---

### ETAPA 9.6 — Testar Desconto no PDV

- [ ] Abrir o PDV.
- [ ] Adicionar: `Hub USB 4 Portas` (quantidade: 1). Preço: R$ 49,90.
- [ ] Verificar se o PDV tem campo de desconto por item ou desconto geral.
- [ ] Aplicar desconto de R$ 5,00 ou 10%.
- [ ] **Verificar:** O total reflete o desconto.
- [ ] Selecionar cliente: `José Raimundo`.
- [ ] Forma de pagamento: **Dinheiro**.
- [ ] Finalizar.

---

## DIA 10 — VENDAS COM FIADO

**Módulos:** PDV · Fiado

---

### ETAPA 10.1 — Venda com Fiado

**Cenário:** Isabela não tem dinheiro agora, vai pagar em 15 dias.

- [ ] Abrir o PDV.
- [ ] Adicionar: `Mouse Bluetooth Recarregável` (quantidade: 1). Preço: R$ 129,90.
- [ ] Selecionar cliente: `Isabela Ferraz`.
- [ ] Forma de pagamento: **Fiado**.
- [ ] **Verificar:** O campo de prazo em dias aparece (ou data de vencimento).
- [ ] Definir prazo: `15 dias`.
- [ ] Finalizar a venda.
- [ ] **Verificar:** A venda é registrada e o fiado é criado com data de vencimento = hoje + 15 dias.

---

### ETAPA 10.2 — Segunda Venda com Fiado

**Cenário:** Kátia (atacado) leva mercadoria e paga em 30 dias.

- [ ] Abrir o PDV.
- [ ] Adicionar: `Capa Anti-Impacto Samsung A55` (quantidade: 5). Preço atacado: R$ 32,00 × 5 = R$ 160,00.
- [ ] Adicionar: `Película Hydrogel Samsung` (quantidade: 10). Preço atacado: R$ 9,00 × 10 = R$ 90,00.
- [ ] Selecionar cliente: `Kátia Borges`.
- [ ] Forma de pagamento: **Fiado**.
- [ ] Prazo: `30 dias`.
- [ ] Finalizar.
- [ ] **Verificar:** Fiado de R$ 250,00 registrado para Kátia.

---

### ETAPA 10.3 — Visualizar e Gerenciar Fiados

- [ ] Na sidebar, navegar para **Financeiro → Fiado** (ou menu correspondente).
- [ ] **Verificar:** Os 2 fiados aparecem na lista (Isabela e Kátia).
- [ ] **Verificar:** Cada fiado exibe cliente, valor, data de vencimento e status `em aberto`.
- [ ] Simular pagamento do fiado da Isabela:
  - Clicar no fiado de Isabela.
  - Clicar em **"Marcar como Pago"** (ou botão equivalente).
  - **Verificar:** O fiado muda para status `pago`.
- [ ] **Verificar:** O fiado da Kátia ainda está `em aberto`.

---

## DIA 11 — REGISTRAR DESPESAS

**Módulos:** Financeiro → Despesas

---

### ETAPA 11.1 — Acessar Módulo de Despesas

- [ ] Na sidebar, clicar em **Financeiro**.
- [ ] Clicar na aba **"Despesas"** (ou submenu).

---

### ETAPA 11.2 — Registrar Despesas do Mês

Registrar cada despesa abaixo clicando em **"+ Nova Despesa"**:

| Descrição | Categoria | Valor | Data | Tipo |
|-----------|-----------|-------|------|------|
| Aluguel do ponto | Fixo | R$ 2.500,00 | Dia 1 do mês | fixo |
| Internet fibra | Fixo | R$ 99,90 | Dia 5 do mês | fixo |
| Conta de energia | Variável | R$ 340,00 | Dia 8 do mês | variavel |
| Material de limpeza | Variável | R$ 45,00 | Hoje | variavel |
| Embalagens e sacolas | Variável | R$ 120,00 | Hoje | variavel |
| Contador | Fixo | R$ 450,00 | Dia 10 do mês | fixo |

- [ ] Para cada despesa: preencher descrição, valor, data e categoria. Salvar.
- [ ] **Verificar:** Todas as 6 despesas aparecem na lista.
- [ ] **Verificar:** O total de despesas do mês é exibido.

---

### ETAPA 11.3 — Editar e Excluir Despesa

- [ ] Editar a despesa **"Material de limpeza"**: alterar valor para R$ 52,00. Salvar.
- [ ] **Verificar:** Valor atualizado na lista.
- [ ] Excluir a despesa **"Embalagens e sacolas"**.
- [ ] **Verificar:** Despesa removida da lista.
- [ ] Recriar: **"Embalagens e sacolas"**, R$ 120,00. Salvar.

---

## DIA 12 — ORDENS DE SERVIÇO

**Módulos:** Ordens de Serviço

---

### ETAPA 12.1 — Acessar Módulo de OS

- [ ] Na sidebar, clicar em **Ops Extras** → **Ordens de Serviço** (ou navegar para `/ordens-de-servico`).
- [ ] **Verificar:** A listagem de OS está vazia (nenhuma OS criada ainda).

---

### ETAPA 12.2 — Criar OS 1 — Celular com Tela Quebrada

- [ ] Clicar em **"+ Nova OS"** ou no botão de criar.
- [ ] **Atenção:** Se o sistema exibir um spinner infinito (inconsistência conhecida da seção 38), registrar o bug e tentar via modal na listagem.
- [ ] Preencher o formulário:

| Campo | Valor |
|-------|-------|
| Nome do Cliente | `Leonardo Faria` |
| Telefone do Cliente | `(11) 87654-3210` |
| Equipamento | `iPhone 14 Pro Max` |
| Descrição do Produto | `Preto, 256GB` |
| Defeito Relatado | `Tela com linhas e touch não funciona no canto inferior` |
| Orçamento | `R$ 380,00` |
| Técnico Responsável | `Lucas Ferreira` |
| Previsão | `+5 dias` |
| Status | `aguardando` |

- [ ] Salvar a OS.
- [ ] **Verificar:** A OS aparece na listagem com número gerado automaticamente (ex: OS #1).

---

### ETAPA 12.3 — Criar OS 2 — Notebook com Problema de Bateria

- [ ] Clicar em **"+ Nova OS"**.
- [ ] Preencher:

| Campo | Valor |
|-------|-------|
| Nome do Cliente | `Hugo Pereira` |
| Telefone | `(11) 91098-7654` |
| Equipamento | `Notebook Dell Inspiron 15` |
| Defeito Relatado | `Bateria não carrega. Fica só na tomada` |
| Orçamento | `R$ 250,00` |
| Técnico | `Marina Santos` |
| Previsão | `+3 dias` |

- [ ] Salvar.

---

### ETAPA 12.4 — Avançar Status das OS

- [ ] Acessar o detalhe da **OS #1 (Leonardo — iPhone)**.
- [ ] Verificar o fluxo de status: `aguardando → aprovado → em_servico → concluido → entregue`.
- [ ] Clicar em **"Avançar Status"** → muda para `aprovado`.
- [ ] **Verificar:** Status atualizado e data/hora do avanço registrada.
- [ ] Clicar novamente em **"Avançar Status"** → muda para `em_servico`.
- [ ] Preencher o campo **"Laudo Técnico"**:
  `Tela principal com falha de backlight. Necessária troca do display original.`
- [ ] Preencher **"Valor do Serviço"**: `R$ 280,00`
- [ ] Preencher **"Valor de Peças"**: `R$ 100,00`
- [ ] Salvar o laudo.

---

### ETAPA 12.5 — Testar Envio por WhatsApp

- [ ] No detalhe da OS, clicar em **"Enviar WhatsApp"** (se disponível).
- [ ] **Verificar:** O sistema abre o WhatsApp Web com uma mensagem parametrizada com nome do cliente e status da OS.

---

## DIA 13 — GARANTIAS

**Módulos:** Garantias

---

### ETAPA 13.1 — Verificar Garantias Geradas Automaticamente

- [ ] Na sidebar, clicar em **Ops Extras → Garantias** (ou `/garantias`).
- [ ] **Verificar:** As garantias dos produtos vendidos (Fone JBL, Carregadores) aparecem listadas automaticamente (criadas pelo RPC `checkout_venda_transaction`).
- [ ] **Verificar:** Cada garantia exibe: produto, cliente, data de compra, data de vencimento, status `ativa`.

---

### ETAPA 13.2 — Visualizar Detalhe de Garantia

- [ ] Clicar em uma das garantias ativas (ex: Fone JBL — Ana Paula).
- [ ] **Verificar:** A página `/garantias/[id]` carrega.
- [ ] **ATENÇÃO:** Verificar se os dados exibidos são reais (do banco) ou estáticos (mock data — inconsistência conhecida da Seção 38). Registrar o resultado.
- [ ] Verificar a seção `#certificado` (Termo de Garantia Digital).
- [ ] Testar o botão de impressão do certificado.

---

### ETAPA 13.3 — Registrar Devolução

- [ ] Na listagem de garantias, encontrar a garantia da venda do **Carregador Turbo**.
- [ ] Clicar em **"Registrar Devolução"** (ou ícone correspondente).
- [ ] Preencher o formulário de devolução:

| Campo | Valor |
|-------|-------|
| Motivo | `Cliente relata que o produto esquenta demais` |
| Resolução | `Substituição do produto por novo` |
| Valor da Devolução | `R$ 69,90` |

- [ ] Confirmar a devolução.
- [ ] **Verificar:** A devolução é registrada na tabela `devolucoes`.
- [ ] **Verificar:** O status da garantia muda (se o sistema alterar o status automaticamente).

---

## DIA 14 — FECHAMENTO DE CAIXA

**Módulos:** Financeiro → Fechamento de Caixa

---

### ETAPA 14.1 — Acessar o Fechamento de Caixa

- [ ] Na sidebar, clicar em **Financeiro**.
- [ ] Clicar na aba ou submenu **"Fechamento de Caixa"** (ou navegar para `/financeiro/fechamento-caixa`).
- [ ] **Verificar:** O relatório do dia/período atual está carregado.

---

### ETAPA 14.2 — Verificar KPIs do Fechamento

- [ ] **Verificar:** Total de vendas do período está correto (somar todas as vendas dos dias 8–13).
- [ ] **Verificar:** Total por forma de pagamento (Dinheiro, PIX, Cartão, Fiado) está discriminado.
- [ ] **Verificar:** Total de despesas do período está correto.
- [ ] **Verificar:** O painel de conferência exibe o saldo esperado em caixa.

---

### ETAPA 14.3 — Simular Conferência de Caixa

- [ ] Inserir o valor contado fisicamente no caixa (ex: R$ 1.200,00 em dinheiro).
- [ ] **Verificar:** O sistema calcula se há sobra ou falta.
- [ ] Se houver sobra: exibe mensagem de sobra (ex: "Sobra de R$ 50,00").
- [ ] Se houver falta: exibe mensagem de falta com valor.
- [ ] Verificar o botão de **"Imprimir Relatório"** ou exportar.

---

# ════════════════════════════════════════════════
# SEMANA 3 — FUNCIONALIDADES AVANÇADAS (Dias 15–21)
# ════════════════════════════════════════════════

---

## DIA 15 — GESTÃO DE ESTOQUE E MOVIMENTAÇÕES

**Módulos:** Produtos / Estoque

---

### ETAPA 15.1 — Verificar Alertas de Estoque Crítico

- [ ] Acessar **Produtos / Estoque**.
- [ ] **Verificar:** Produtos com estoque abaixo do mínimo exibem alerta visual.
- [ ] Verificar quais produtos ficaram com estoque baixo após as vendas dos dias anteriores.

---

### ETAPA 15.2 — Ajuste Manual de Estoque

- [ ] Selecionar um produto (ex: Fone Bluetooth JBL T110).
- [ ] Verificar se há botão de **"Ajuste de Estoque"** ou entrada de movimentação.
- [ ] Registrar entrada de estoque:

| Campo | Valor |
|-------|-------|
| Tipo | Entrada |
| Quantidade | `10` |
| Motivo | `Reposição via TechBR` |

- [ ] Confirmar.
- [ ] **Verificar:** O estoque do produto aumenta de acordo.
- [ ] **Verificar:** O histórico de movimentações registra a entrada com tipo `entrada`.

---

### ETAPA 15.3 — Visualizar Histórico de Movimentações

- [ ] Verificar se há aba/seção de histórico de estoque.
- [ ] **Verificar:** As movimentações de `venda` (decrementos automáticos das vendas dos dias 8–13) estão listadas.
- [ ] **Verificar:** A movimentação de entrada manual também aparece.

---

### ETAPA 15.4 — Registrar Pedido de Fornecedor

- [ ] Acessar **Clientes → Fornecedores**.
- [ ] Clicar em **TechBR Distribuidora**.
- [ ] Verificar se há aba/opção de **"Pedidos"** ao fornecedor.
- [ ] Registrar pedido:

| Campo | Valor |
|-------|-------|
| Produto | Fone Bluetooth JBL T110 |
| Quantidade | `20` |
| Preço Unitário | `R$ 45,00` |
| Total | `R$ 900,00` |
| Previsão de Entrega | `+5 dias` |
| Status | `pendente` |

- [ ] Salvar o pedido.
- [ ] **Verificar:** O pedido aparece no histórico do fornecedor.

---

## DIA 16 — COMISSÕES

**Módulos:** Comissões

---

### ETAPA 16.1 — Cadastrar Comissionados

- [ ] Na sidebar, clicar em **Ops Extras → Comissões**.
- [ ] Clicar na aba **"Comissionados"**.
- [ ] Clicar em **"+ Novo Comissionado"**.
- [ ] Preencher:

| Campo | Valor |
|-------|-------|
| Nome | `Lucas Ferreira` |
| Percentual | `3%` |
| Tipo | Vinculado a usuário do sistema |

- [ ] Salvar.
- [ ] Cadastrar segundo comissionado:

| Campo | Valor |
|-------|-------|
| Nome | `Pedro Indicador` |
| Percentual | `2%` |
| Tipo | Externo (sem acesso) |

- [ ] Salvar.
- [ ] **Verificar:** Dois comissionados aparecem na lista.

---

### ETAPA 16.2 — Verificar Comissões Geradas

- [ ] Clicar na aba **"Por Venda"** ou **"Histórico de Comissões"**.
- [ ] **Verificar:** As vendas dos dias anteriores aparecem com o cálculo de comissão.
- [ ] **Verificar:** A coluna de comissão exibe o valor calculado (% × valor da venda).

---

### ETAPA 16.3 — Marcar Comissão como Paga

- [ ] Selecionar uma comissão em aberto de Lucas Ferreira.
- [ ] Clicar em **"Marcar como Pago"** (ou botão equivalente).
- [ ] **Verificar:** Status da comissão muda para `pago`.
- [ ] **Verificar:** O histórico de pagamentos de comissão é atualizado.

---

### ETAPA 16.4 — Verificar KPIs de Comissões

- [ ] **Verificar:** KPI "Total em Comissões" do período está correto.
- [ ] **Verificar:** Ranking de comissionados (quem mais comissionou no mês).

---

## DIA 17 — RELATÓRIOS (PRO)

**Módulos:** Relatórios

---

### ETAPA 17.1 — Acessar Relatórios

- [ ] Na sidebar, clicar em **Relatórios**.
- [ ] **Verificar:** A tela carrega sem bloqueio (plano Pro ativo).

---

### ETAPA 17.2 — Testar Seletor de Período

- [ ] Testar o filtro de período para **"Esta semana"**.
- [ ] **Verificar:** Os KPIs atualizam para o período selecionado.
- [ ] Testar o filtro **"Este mês"**.
- [ ] Testar período **personalizado**: selecionar data de início e fim manualmente.

---

### ETAPA 17.3 — Verificar KPIs dos Relatórios

- [ ] **Verificar KPI:** Faturamento Total (soma de todas as vendas do período).
- [ ] **Verificar KPI:** Total de Descontos Aplicados.
- [ ] **Verificar KPI:** Custo dos Produtos Vendidos (CMV).
- [ ] **Verificar KPI:** Lucro Real (Faturamento - Despesas - CMV).

---

### ETAPA 17.4 — Verificar Seções de Análise

- [ ] **Seção Formas de Pagamento:** Verificar a distribuição % de cada forma de pagamento.
- [ ] **Seção Top 10 Produtos Mais Vendidos:** Verificar ranking de produtos.
- [ ] **Seção Por Dia da Semana:** Verificar o gráfico de vendas por dia (gráfico CSS).
- [ ] **Seção Melhores Clientes:** Verificar os clientes com maior volume de compra.
- [ ] **Seção Comissões Geradas:** Verificar o total de comissões no período.

---

### ETAPA 17.5 — Exportar Relatório

- [ ] Clicar em **"Exportar CSV"** (se disponível).
- [ ] **Verificar:** O arquivo é baixado corretamente.
- [ ] Clicar em **"Imprimir"**.
- [ ] **Verificar:** A janela de impressão abre com o relatório formatado.

---

## DIA 18 — CRM E CLIENTES INATIVOS (PRO)

**Módulos:** Clientes Inativos

---

### ETAPA 18.1 — Acessar Clientes Inativos

- [ ] Na sidebar, clicar em **Clientes**.
- [ ] Verificar se há aba **"Inativos"** ou link para clientes inativos.
- [ ] Navegar para a lista de clientes inativos.

---

### ETAPA 18.2 — Verificar Lógica de Inatividade

- [ ] **Verificar:** A tela exibe clientes que não compram há mais de `45 dias` (configurado no Dia 2).
- [ ] **Nota:** Como estamos simulando o início de operação, pode não haver clientes inativos ainda. Se houver, verificar os dados.
- [ ] Para simular: verificar se a tela exibe a lista corretamente mesmo que vazia.

---

### ETAPA 18.3 — Enviar WhatsApp para Cliente Inativo

- [ ] Se houver algum cliente inativo, selecionar.
- [ ] Clicar no botão de **"Enviar WhatsApp"**.
- [ ] **Verificar:** O sistema abre o WhatsApp Web com uma mensagem de reengajamento parametrizada com o nome do cliente.
- [ ] Fechar sem enviar.

---

### ETAPA 18.4 — Verificar Painel "Como foi?" no Dashboard

- [ ] Acessar o Dashboard principal.
- [ ] Verificar o componente **"Como foi?"** (ComoFoiPainel).
- [ ] **Verificar:** Exibe métricas do dia: faturamento, custo, lucro.
- [ ] Verificar o botão de **"Compartilhar via WhatsApp"**.
- [ ] Clicar para ver como é formatada a mensagem de compartilhamento.

---

## DIA 19 — EDITAR CADASTROS EXISTENTES

**Módulos:** Produtos · Clientes · Fornecedores

---

### ETAPA 19.1 — Editar Produto

- [ ] Acessar **Produtos / Estoque**.
- [ ] Encontrar o produto **"Teclado Bluetooth Slim"**.
- [ ] Clicar em editar (ícone de lápis ou clique no produto).
- [ ] Alterar:

| Campo | Novo Valor |
|-------|-----------|
| Preço Varejo | `R$ 199,90` |
| Estoque Mínimo | `3` |
| Descrição | `Teclado bluetooth slim com bateria de longa duração. Compatível com Windows e Mac.` |

- [ ] Salvar.
- [ ] **Verificar:** As alterações foram aplicadas no produto.

---

### ETAPA 19.2 — Editar Cliente

- [ ] Acessar **Clientes**.
- [ ] Encontrar **"Leonardo Faria"**.
- [ ] Clicar em editar.
- [ ] Alterar:

| Campo | Novo Valor |
|-------|-----------|
| Tipo de Preço | `vip` |
| Observação | `Cliente fiel, atendimento prioritário.` |

- [ ] Salvar.
- [ ] **Verificar:** Tipo atualizado para VIP na lista.

---

### ETAPA 19.3 — Editar Fornecedor

- [ ] Acessar **Fornecedores**.
- [ ] Encontrar **"Mega Eletrônicos"**.
- [ ] Editar:

| Campo | Novo Valor |
|-------|-----------|
| Observações | `Frete grátis acima de R$ 500. Prazo: 5 dias úteis. Contato: Sandro (21) 99999-1234.` |

- [ ] Salvar.

---

### ETAPA 19.4 — Excluir Produto

- [ ] Criar um produto de teste:

| Campo | Valor |
|-------|-------|
| Nome | `PRODUTO TESTE — EXCLUIR` |
| Preço Varejo | `R$ 1,00` |
| Estoque | `1` |

- [ ] Salvar.
- [ ] **Verificar:** Produto aparece na lista.
- [ ] Clicar em excluir/deletar o produto.
- [ ] **Verificar:** Confirmação de exclusão aparece.
- [ ] Confirmar exclusão.
- [ ] **Verificar:** Produto removido da lista.

---

## DIA 20 — GESTÃO AVANÇADA DE GARANTIAS E OS

**Módulos:** Garantias · Ordens de Serviço

---

### ETAPA 20.1 — Concluir OS #2 (Notebook Dell)

- [ ] Acessar **Ordens de Serviço**.
- [ ] Abrir o detalhe da **OS #2 (Hugo — Notebook Dell)**.
- [ ] Avançar o status: `aguardando → aprovado`.
- [ ] Preencher laudo: `Bateria com células danificadas. Substituição por bateria original Dell.`
- [ ] Avançar: `aprovado → em_servico`.
- [ ] Preencher **Valor do Serviço**: `R$ 80,00` / **Valor de Peças**: `R$ 170,00`.
- [ ] Avançar: `em_servico → concluido`.
- [ ] **Verificar:** Status atualizado para `concluido`.
- [ ] Avançar: `concluido → entregue`.
- [ ] **Verificar:** OS marcada como `entregue`.

---

### ETAPA 20.2 — Verificar Impressão da OS

- [ ] No detalhe da OS concluída, clicar em **"Imprimir"**.
- [ ] **Verificar:** A OS abre em formato de impressão.

---

### ETAPA 20.3 — Cancelar OS #1 (iPhone de Leonardo)

- [ ] Voltar para a OS #1 (iPhone).
- [ ] Verificar se há botão de **"Cancelar OS"**.
- [ ] Clicar em cancelar.
- [ ] **Verificar:** Confirmação aparece.
- [ ] Confirmar cancelamento.
- [ ] **Verificar:** Status da OS muda para `cancelado`.

---

### ETAPA 20.4 — Criar OS para Nova Venda (OS #3)

- [ ] Criar nova OS:

| Campo | Valor |
|-------|-------|
| Cliente | `Ana Paula Costa` |
| Telefone | `(11) 98765-4321` |
| Equipamento | `Fone JBL T110` |
| Defeito | `Fone com barulho no canal direito` |
| Orçamento | `R$ 0,00 (em garantia)` |
| Observação | `Produto dentro do prazo de garantia (90 dias)` |

- [ ] Salvar.

---

## DIA 21 — GERENCIAR USUÁRIOS E PAPÉIS

**Módulos:** Configurações Usuários

---

### ETAPA 21.1 — Verificar Lista de Usuários

- [ ] Acessar **Configurações → aba "Usuários"**.
- [ ] **Verificar:** Três registros aparecem: Kauan (admin), Lucas (vendedor), Marina (estoquista).
- [ ] **Verificar:** O status de cada usuário (ativo, congelado, etc.).

---

### ETAPA 21.2 — Testar Congelamento de Usuário

- [ ] Clicar em **"Congelar"** no usuário de Lucas Ferreira.
- [ ] **Verificar:** Confirmação aparece.
- [ ] Confirmar o congelamento.
- [ ] **Verificar:** Status de Lucas muda para `congelado`.
- [ ] Em outra aba (ou navegador), tentar acessar o sistema como Lucas.
- [ ] **Verificar:** O sistema faz logout automático do Lucas via Realtime e redireciona para `/login`.
- [ ] Voltar para Kauan e **descongelar** o Lucas.
- [ ] **Verificar:** Status volta para `ativo`.

---

### ETAPA 21.3 — Alterar Papel de Usuário

- [ ] Editar o usuário **Marina Santos**.
- [ ] Alterar o papel de `estoquista` para `vendedor`.
- [ ] Salvar.
- [ ] **Verificar:** Papel atualizado na lista.
- [ ] Alterar de volta para `estoquista`. Salvar.

---

### ETAPA 21.4 — Excluir Usuário

- [ ] Criar um convite de teste:
  - E-mail: `teste.excluir@pontodigital.com`
  - Papel: `vendedor`
- [ ] Após criar o convite, **não aceitar** — excluir diretamente da lista.
- [ ] **Verificar:** Convite/usuário removido da lista.

---

# ════════════════════════════════════════════════
# SEMANA 4 — EDIÇÕES, EXCLUSÕES E EDGE CASES (Dias 22–28)
# ════════════════════════════════════════════════

---

## DIA 22 — MAIS VENDAS E CASOS ESPECIAIS NO PDV

**Módulos:** PDV

---

### ETAPA 22.1 — Venda com Múltiplos Itens e Desconto Global

- [ ] Abrir o PDV.
- [ ] Adicionar os seguintes itens:
  - `Fone Bluetooth JBL T110` × 2 → R$ 89,90 × 2 = R$ 179,80
  - `Carregador Turbo 65W` × 1 → R$ 69,90
  - `Cabo USB-C 1m` × 3 → R$ 19,90 × 3 = R$ 59,70
- [ ] Total bruto: R$ 309,40.
- [ ] Selecionar cliente: `Fernando Rocha` (atacado).
- [ ] Aplicar desconto geral de R$ 20,00.
- [ ] Total líquido: R$ 289,40.
- [ ] Forma de pagamento: **PIX**.
- [ ] Finalizar.
- [ ] **Verificar:** Venda registrada com o desconto.

---

### ETAPA 22.2 — Venda com Garantia (Verificar Criação Automática)

- [ ] Abrir o PDV.
- [ ] Adicionar: `Caixa de Som JBL Go 4` (garantia configurada).
- [ ] Selecionar cliente: `Gabriela Nunes`.
- [ ] Forma de pagamento: **Dinheiro**.
- [ ] Finalizar.
- [ ] **Verificar:** A venda é concluída.
- [ ] Acessar **Garantias** e verificar se uma nova garantia foi criada automaticamente para Gabriela (Caixa de Som JBL Go 4).

---

### ETAPA 22.3 — Venda com Fiado + Garantia (Transação Atômica)

**Cenário:** Testa o RPC `checkout_venda_transaction` com múltiplas operações simultâneas.

- [ ] Abrir o PDV.
- [ ] Adicionar: `Headset Gamer RGB` (com garantia) × 1 → R$ 169,90.
- [ ] Selecionar cliente: `Diego Alves`.
- [ ] Forma de pagamento: **Fiado**.
- [ ] Prazo: `20 dias`.
- [ ] Finalizar.
- [ ] **Verificar:** A venda é registrada (tabela `vendas`).
- [ ] **Verificar:** O fiado é criado (tabela `fiados`).
- [ ] **Verificar:** A garantia é criada (tabela `garantias`).
- [ ] **Verificar:** O estoque decrementou corretamente.
- [ ] *(Isso testa a atomicidade do RPC: se qualquer etapa falhar, tudo deve ser revertido.)*

---

## DIA 23 — TESTES DE FILTROS E BUSCAS

**Módulos:** Histórico Vendas · Clientes · Produtos · Garantias · OS

---

### ETAPA 23.1 — Filtros no Histórico de Vendas

- [ ] Acessar **Histórico de Vendas**.
- [ ] Usar filtro de **data** para ver apenas as vendas de hoje.
- [ ] Usar filtro de **forma de pagamento**: selecionar "PIX". Verificar resultado.
- [ ] Usar filtro de **cliente**: buscar por "Ana Paula". Verificar.
- [ ] Limpar filtros. Verificar que todas as vendas voltam.

---

### ETAPA 23.2 — Filtros em Clientes

- [ ] Acessar **Clientes**.
- [ ] Filtrar por tipo `atacado`.
- [ ] **Verificar:** Apenas Carla Souza, Fernando Rocha e Kátia Borges aparecem.
- [ ] Filtrar por tipo `vip`.
- [ ] **Verificar:** Hugo Pereira e Leonardo Faria (alterado no Dia 19) aparecem.
- [ ] Buscar por nome: `Souza`.
- [ ] **Verificar:** Carla Souza aparece.

---

### ETAPA 23.3 — Filtros em Produtos

- [ ] Acessar **Produtos**.
- [ ] Filtrar pela categoria **"Caixas de Som"**.
- [ ] **Verificar:** Apenas JBL Go 4 e Portátil XS aparecem.
- [ ] Filtrar por **"Estoque Crítico"** (se houver esse filtro).
- [ ] Ordenar por **"Preço (maior → menor)"** (se disponível).

---

### ETAPA 23.4 — Filtros em Garantias

- [ ] Acessar **Garantias**.
- [ ] Filtrar por status **"ativa"**.
- [ ] Filtrar por status **"expirada"** (se houver).
- [ ] Buscar pelo nome do produto.

---

## DIA 24 — FINANCEIRO — DRE COMPLETO

**Módulos:** Financeiro (DRE)

---

### ETAPA 24.1 — Acessar o Financeiro

- [ ] Na sidebar, clicar em **Financeiro**.
- [ ] **Verificar:** A tela carrega sem bloqueio (Plano Pro).

---

### ETAPA 24.2 — Verificar o DRE

- [ ] **Verificar KPI:** Receita Bruta (total de vendas do período).
- [ ] **Verificar KPI:** Custo dos Produtos Vendidos (CMV).
- [ ] **Verificar KPI:** Lucro Bruto (Receita - CMV).
- [ ] **Verificar KPI:** Total de Despesas.
- [ ] **Verificar KPI:** Lucro Líquido (Lucro Bruto - Despesas).

---

### ETAPA 24.3 — Navegar entre Abas do Financeiro

- [ ] Verificar se há abas no módulo Financeiro (ex: DRE · Fiado · Despesas).
- [ ] Navegar para a aba **"Fiado"**.
- [ ] **Verificar:** Os fiados em aberto (Kátia Borges e Diego Alves) estão listados.
- [ ] Navegar para a aba **"Despesas"**.
- [ ] **Verificar:** As despesas cadastradas no Dia 11 estão listadas.

---

### ETAPA 24.4 — Registrar Nova Despesa Variável

- [ ] Na aba Despesas, clicar em **"+ Nova Despesa"**.
- [ ] Preencher:

| Campo | Valor |
|-------|-------|
| Descrição | `Manutenção ar-condicionado` |
| Valor | `R$ 280,00` |
| Categoria | `Variável` |
| Data | Hoje |

- [ ] Salvar.
- [ ] **Verificar:** Total de despesas atualiza.

---

## DIA 25 — RECUPERAÇÃO DE SENHA E EDGE CASES DE AUTH

**Módulos:** Autenticação

---

### ETAPA 25.1 — Testar Recuperação de Senha

- [ ] Fazer logout da conta do Kauan.
- [ ] Na tela de login, clicar em **"Esqueci minha senha"**.
- [ ] **Verificar:** O painel de recuperação inline aparece.
- [ ] Digitar: `kauan@pontodigital.com`
- [ ] Clicar em **"Enviar link de recuperação"**.
- [ ] **Verificar:** Mensagem de sucesso aparece: "Link enviado. Verifique sua caixa de entrada."
- [ ] Acessar o e-mail e clicar no link.
- [ ] **Verificar:** Redireciona para `/redefinir-senha`.
- [ ] Preencher:

| Campo | Valor |
|-------|-------|
| Nova Senha | `Ponto@2027` |
| Confirmar | `Ponto@2027` |

- [ ] Salvar.
- [ ] **Verificar:** Mensagem de sucesso e redirecionamento para `/dashboard`.
- [ ] Verificar que o login funciona com a nova senha.
- [ ] **Opcional:** Alterar de volta para `Ponto@2026` via recuperação ou configurações.

---

### ETAPA 25.2 — Testar Erros de Login

- [ ] Tentar login com e-mail errado: `errado@pontodigital.com` + qualquer senha.
- [ ] **Verificar:** Mensagem de erro "E-mail ou senha incorretos.".
- [ ] Tentar login com senha errada.
- [ ] **Verificar:** Mesma mensagem de erro.
- [ ] Tentar login com campos vazios.
- [ ] **Verificar:** Mensagem "Preencha e-mail e senha."

---

## DIA 26 — MAIS FIADOS E COBRANÇAS

**Módulos:** Fiado · WhatsApp

---

### ETAPA 26.1 — Registrar Novos Fiados

- [ ] Criar 2 fiados adicionais via PDV:

**Fiado 3 — Venda para José Raimundo:**
- Item: `Fone com Fio Sony MDR` × 1 (R$ 54,90)
- Forma: Fiado
- Prazo: 10 dias

**Fiado 4 — Venda para Bruno Lima:**
- Item: `Suporte Veicular Magnético` × 1 (R$ 34,90)
- Forma: Fiado
- Prazo: 7 dias

---

### ETAPA 26.2 — Gerenciar Fiados Vencidos (Edge Case)

- [ ] Acessar o módulo de **Fiado**.
- [ ] Verificar se há filtro para fiados **"vencidos"** (prazo expirado).
- [ ] Verificar se há alertas visuais para fiados vencidos.
- [ ] Testar o envio de mensagem de cobrança via WhatsApp para o fiado da Kátia Borges:
  - Clicar no fiado → botão WhatsApp.
  - **Verificar:** Mensagem de cobrança parametrizada com nome e valor.

---

### ETAPA 26.3 — Quitar Fiado da Kátia Borges

- [ ] Selecionar o fiado de Kátia Borges (R$ 250,00).
- [ ] Clicar em **"Marcar como Pago"**.
- [ ] Confirmar.
- [ ] **Verificar:** Status muda para `pago`.
- [ ] **Verificar:** O total de fiados em aberto atualiza.

---

## DIA 27 — CONFIGURAÇÕES AVANÇADAS DO STRIPE

**Módulos:** Configurações Planos

---

### ETAPA 27.1 — Acessar Configurações de Plano

- [ ] Acessar **Configurações → aba "Planos e Assinatura"**.
- [ ] **Verificar:** Exibe "Plano Pro" como ativo.
- [ ] **Verificar:** Data de renovação visível.

---

### ETAPA 27.2 — Agendar Downgrade para Start

- [ ] Clicar em **"Mudar para Start"** ou **"Fazer Downgrade"**.
- [ ] **Verificar:** Mensagem explicando que o downgrade será efetivo na próxima renovação.
- [ ] Confirmar o agendamento.
- [ ] **Verificar:** O sistema exibe que o downgrade está **agendado** para o final do período.
- [ ] **Verificar:** Banner amarelo ⚠️ aparece no header (cancel_at_period_end = true).

---

### ETAPA 27.3 — Cancelar o Downgrade (Reativar Pro)

- [ ] No banner amarelo, clicar em **"Reativar Assinatura"**.
- [ ] Ou: Acessar Configurações → Planos → clicar em **"Cancelar downgrade"** / **"Reativar"**.
- [ ] **Verificar:** O downgrade agendado é cancelado.
- [ ] **Verificar:** O banner amarelo desaparece.

---

### ETAPA 27.4 — Acessar o Portal do Stripe

- [ ] Clicar em **"Gerenciar Assinatura"** ou botão que chama `POST /api/stripe/portal`.
- [ ] **Verificar:** Redireciona para o Stripe Customer Portal.
- [ ] No portal do Stripe, verificar: histórico de faturas, método de pagamento cadastrado.
- [ ] Retornar ao sistema.

---

## DIA 28 — TESTES DE EXCLUSÃO EM MASSA E VERIFICAÇÃO GERAL

**Módulos:** Todos

---

### ETAPA 28.1 — Excluir Clientes de Teste

- [ ] Se houver clientes criados apenas para teste, excluir agora.
- [ ] **Verificar:** Confirmação de exclusão funciona.
- [ ] **Verificar:** Clientes com histórico de compras mostram aviso ou impedem exclusão.

---

### ETAPA 28.2 — Excluir Fornecedor (Teste)

- [ ] Criar um fornecedor de teste:
  - Nome: `FORNECEDOR TESTE`
  - CNPJ: `00.000.000/0001-00`
- [ ] Excluir imediatamente.
- [ ] **Verificar:** Excluído da lista.

---

### ETAPA 28.3 — Verificar Integridade dos Dados

- [ ] Acessar o **Dashboard Principal**.
- [ ] Verificar os KPIs estão coerentes com as operações realizadas nos dias anteriores:
  - [ ] Número de clientes: deve ser ~12 (ou mais, dependendo de criações extras).
  - [ ] Número de produtos: deve ser ~20.
  - [ ] Número de vendas: deve ser >20 vendas acumuladas.
  - [ ] Fiados em aberto: deve refletir os não pagos.
  - [ ] Estoque crítico: conferir se produtos com baixo estoque estão alertando.

---

# ════════════════════════════════════════════════
# DIAS 29–30 — REVISÃO FINAL E FECHAMENTO DO MÊS
# ════════════════════════════════════════════════

---

## DIA 29 — RELATÓRIO FINAL DO MÊS

**Módulos:** Relatórios · Financeiro · Fechamento de Caixa

---

### ETAPA 29.1 — Relatório Mensal Completo

- [ ] Acessar **Relatórios**.
- [ ] Selecionar o período: **"Este mês"** (ou o período completo da simulação).
- [ ] Registrar (anotar) os seguintes valores para conferência:

| KPI | Valor Esperado (estimado) | Valor Real (sistema) |
|-----|--------------------------|----------------------|
| Faturamento Total | > R$ 3.000,00 | _____ |
| Total Descontos | > R$ 20,00 | _____ |
| CMV (Custo) | > R$ 1.500,00 | _____ |
| Lucro Bruto | > R$ 1.500,00 | _____ |
| Total Despesas | ~R$ 3.634,90 | _____ |
| Lucro Líquido | Positivo ou negativo | _____ |

- [ ] **Verificar:** Os valores são matematicamente coerentes entre si.

---

### ETAPA 29.2 — Fechamento Mensal de Caixa

- [ ] Acessar **Financeiro → Fechamento de Caixa**.
- [ ] Selecionar o período completo.
- [ ] **Verificar:** Breakdown por forma de pagamento (Dinheiro, PIX, Cartão, Fiado).
- [ ] Simular conferência: inserir valor contado no caixa.
- [ ] **Verificar:** Cálculo de sobra/falta.
- [ ] Exportar/imprimir o relatório de fechamento.

---

### ETAPA 29.3 — Verificar Painel "Como Foi?" Final

- [ ] No Dashboard, verificar o painel **"Como foi?"** para o período completo.
- [ ] Clicar em **"Compartilhar no WhatsApp"**.
- [ ] **Verificar:** A mensagem de resumo é formatada e abre o WhatsApp Web.

---

## DIA 30 — VERIFICAÇÃO FINAL E CANCELAMENTO TESTE

**Módulos:** Todos · Stripe

---

### ETAPA 30.1 — Checklist Final — Telas Visitadas

Confirmar que cada tela abaixo foi acessada e testada ao menos uma vez:

| Tela / Rota | Visitada | Funcional |
|---|---|---|
| Landing Page (`/`) | [ ] | [ ] |
| Login (`/login`) | [ ] | [ ] |
| Cadastro (`/cadastro`) | [ ] | [ ] |
| Redefinir Senha (`/redefinir-senha`) | [ ] | [ ] |
| Convite (`/convite`) | [ ] | [ ] |
| Dashboard (`/dashboard`) | [ ] | [ ] |
| PDV - Nova Venda (`/vendas/nova`) | [ ] | [ ] |
| Histórico de Vendas (`/vendas`) | [ ] | [ ] |
| Detalhe da Venda (`/vendas/[id]`) | [ ] | [ ] |
| Produtos (`/produtos`) | [ ] | [ ] |
| Estoque (`/estoque`) | [ ] | [ ] |
| Catálogo Online (`/catalogo`) | [ ] | [ ] |
| Clientes (`/clientes`) | [ ] | [ ] |
| Clientes Inativos (PRO) | [ ] | [ ] |
| Fornecedores (`/fornecedores`) | [ ] | [ ] |
| Financeiro — DRE (`/financeiro`) | [ ] | [ ] |
| Fiado (`/financeiro` → Fiado) | [ ] | [ ] |
| Despesas (`/financeiro` → Despesas) | [ ] | [ ] |
| Fechamento de Caixa (`/financeiro/fechamento-caixa`) | [ ] | [ ] |
| Garantias (`/garantias`) | [ ] | [ ] |
| Detalhe de Garantia (`/garantias/[id]`) | [ ] | [ ] |
| Ordens de Serviço (`/ordens-de-servico`) | [ ] | [ ] |
| Detalhe OS (`/ordens-de-servico/[id]`) | [ ] | [ ] |
| Comissões (`/comissoes`) | [ ] | [ ] |
| Relatórios (`/relatorios`) | [ ] | [ ] |
| Config. Geral (`/configuracoes`) | [ ] | [ ] |
| Config. Empresa (`/configuracoes/empresa`) | [ ] | [ ] |
| Config. Usuários (`/configuracoes/usuarios`) | [ ] | [ ] |
| Config. Pagamentos (`/configuracoes/pagamentos`) | [ ] | [ ] |
| Config. Categorias (`/configuracoes/categorias`) | [ ] | [ ] |
| Config. Planos (`/configuracoes/planos`) | [ ] | [ ] |

---

### ETAPA 30.2 — Checklist Final — Ações CRUD

| Ação | Módulo | Testado |
|------|--------|---------|
| Criar produto | Produtos | [ ] |
| Editar produto | Produtos | [ ] |
| Excluir produto | Produtos | [ ] |
| Criar cliente | Clientes | [ ] |
| Editar cliente | Clientes | [ ] |
| Excluir cliente | Clientes | [ ] |
| Criar fornecedor | Fornecedores | [ ] |
| Editar fornecedor | Fornecedores | [ ] |
| Excluir fornecedor | Fornecedores | [ ] |
| Criar venda (PDV) | PDV | [ ] |
| Venda com desconto | PDV | [ ] |
| Venda com fiado | PDV | [ ] |
| Venda com garantia | PDV | [ ] |
| Criar despesa | Financeiro | [ ] |
| Editar despesa | Financeiro | [ ] |
| Excluir despesa | Financeiro | [ ] |
| Pagar fiado | Fiado | [ ] |
| Criar OS | Ordens de Serviço | [ ] |
| Avançar status OS | Ordens de Serviço | [ ] |
| Cancelar OS | Ordens de Serviço | [ ] |
| Registrar devolução | Garantias | [ ] |
| Criar categoria | Config. Categorias | [ ] |
| Editar categoria | Config. Categorias | [ ] |
| Excluir categoria | Config. Categorias | [ ] |
| Convidar usuário | Config. Usuários | [ ] |
| Congelar usuário | Config. Usuários | [ ] |
| Excluir usuário | Config. Usuários | [ ] |
| Fazer upgrade de plano | Config. Planos | [ ] |
| Agendar downgrade | Config. Planos | [ ] |
| Cancelar downgrade | Config. Planos | [ ] |

---

### ETAPA 30.3 — Registrar Bugs e Inconsistências Encontradas

Usar a tabela abaixo para registrar qualquer comportamento inesperado:

| # | Data | Tela / Rota | Descrição do Bug | Severidade | Resolvido? |
|---|------|-------------|-----------------|------------|------------|
| 1 | Dia 1 | `/garantias/[id]` | Mock data hardcoded em vez de dados reais | Alta | [ ] |
| 2 | Dia 1 | `ProOnly.tsx` | Retorno `null` silencioso sem overlay de upsell | Média | [ ] |
| 3 | Dia 12 | `/ordens-de-servico/nova` | Spinner infinito ao tentar acessar a rota diretamente | Alta | [ ] |
| 4 | Dia 7 | `/configuracoes` | Versão "v1.2.0" hardcoded no rodapé | Baixa | [ ] |
| 5 | | | | | |
| 6 | | | | | |
| 7 | | | | | |

---

### ETAPA 30.4 — Teste de Cancelamento de Assinatura

- [ ] Acessar **Configurações → Planos e Assinatura**.
- [ ] Clicar em **"Cancelar Assinatura"** (Zona de Perigo).
- [ ] **Verificar:** Confirmação de cancelamento com aviso de data.
- [ ] **NÃO CONFIRMAR** (apenas verificar o fluxo visual).
- [ ] Fechar/cancelar a ação sem confirmar.
- [ ] **Verificar:** Assinatura continua ativa.

---

### ETAPA 30.5 — Logout Final

- [ ] Clicar no botão de **Logout** no rodapé da sidebar.
- [ ] **Verificar:** Redireciona para `/login`.
- [ ] **Verificar:** Não é possível acessar `/dashboard` sem autenticação (middleware redireciona).

---

# RESUMO DO TESTE — SCORECARD FINAL

```
┌──────────────────────────────────────────────────────────────────┐
│              SCORECARD FINAL — PONTO DIGITAL (30 DIAS)           │
├─────────────────────────────┬────────────────────────────────────┤
│ Total de Etapas             │ ___ / ~140                         │
│ Etapas Concluídas           │ ___                                │
│ Etapas com Erros            │ ___                                │
│ Bugs Críticos (Alta)        │ ___                                │
│ Bugs Médios                 │ ___                                │
│ Bugs Baixos                 │ ___                                │
├─────────────────────────────┼────────────────────────────────────┤
│ Módulos 100% Funcionais     │ ___                                │
│ Módulos com Pendências      │ ___                                │
├─────────────────────────────┼────────────────────────────────────┤
│ Aprovação Geral             │ ___% (Etapas OK / Total)           │
└─────────────────────────────┴────────────────────────────────────┘
```

---

> **IMPORTANTE:** Após concluir esta simulação, atualize o arquivo `mapeamento_completo_sistema.md` com qualquer nova inconsistência ou comportamento não documentado que tenha sido descoberto durante os testes.

---

*Simulação gerada com base no `mapeamento_completo_sistema.md` v1.0 — KDL Store (NexoCommerce)*  
*Data de geração: 2026-05-20*
