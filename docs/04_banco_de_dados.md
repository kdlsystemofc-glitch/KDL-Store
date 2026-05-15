# SEÇÃO 4 — BANCO DE DADOS COMPLETO

## 4.1 Diagrama de Relacionamentos

```
auth.users (Supabase)
    │
    └──► profiles (1:1)
              │
              └──► empresas (N:1)
                        │
                        ├──► subscriptions (1:1)
                        ├──► convites (1:N)
                        ├──► categorias_produto (1:N)
                        ├──► formas_pagamento (1:N)
                        ├──► comissoes (1:N)
                        ├──► clientes (1:N)
                        │        └──► fiados (1:N)
                        ├──► produtos (1:N)
                        │        └──► estoque_movimentacoes (1:N)
                        ├──► vendas (1:N)
                        │        ├──► itens_venda (1:N)
                        │        ├──► fiados (1:N)
                        │        ├──► garantias (1:N)
                        │        └──► devolucoes (1:N)
                        ├──► despesas (1:N)
                        ├──► fornecedores (1:N)
                        │        └──► pedidos_fornecedor (1:N)
                        ├──► garantias (1:N)
                        │        └──► devolucoes (1:N)
                        └──► ordens_servico (1:N)
```

---

## 4.2 Tabelas Detalhadas

### `empresas`
| Coluna | Tipo | Default | Obrigatório | Descrição |
|---|---|---|---|---|
| id | UUID | uuid_generate_v4() | ✅ | PK |
| nome | TEXT | — | ✅ | Nome da loja |
| telefone | TEXT | NULL | ❌ | Telefone da loja |
| cidade | TEXT | NULL | ❌ | Cidade |
| plano | tipo_plano | 'start' | ✅ | 'start' ou 'pro' |
| crm_prazo_inatividade_dias | INT | 60 | ✅ | Dias para cliente ser "sumido" |
| criado_em | TIMESTAMPTZ | NOW() | ✅ | Data de criação |

### `profiles`
| Coluna | Tipo | Default | Obrigatório | Descrição |
|---|---|---|---|---|
| id | UUID | — | ✅ | PK = auth.users.id |
| empresa_id | UUID | NULL | ❌ | FK empresas.id |
| nome | TEXT | NULL | ❌ | Nome do usuário |
| papel | papel_usuario | 'admin' | ✅ | admin / operador / visualizador |
| status | status_usuario | 'ativo' | ✅ | ativo / congelado / excluido |
| criado_em | TIMESTAMPTZ | NOW() | ✅ | Data de criação |

### `subscriptions`
| Coluna | Tipo | Default | Obrigatório | Descrição |
|---|---|---|---|---|
| id | UUID | uuid_generate_v4() | ✅ | PK |
| empresa_id | UUID | — | ✅ | FK empresas.id (UNIQUE) |
| plano | tipo_plano | 'start' | ✅ | 'start' ou 'pro' |
| status | status_plano | 'active' | ✅ | active/inactive/cancelled/trialing |
| preco | INT | 6500 | ✅ | Centavos (6500 = R$65) |
| inicio | TIMESTAMPTZ | NOW() | ✅ | Início da assinatura |
| proximo_pagamento | TIMESTAMPTZ | NULL | ❌ | Próximo vencimento |
| criado_em | TIMESTAMPTZ | NOW() | ✅ | |
| atualizado_em | TIMESTAMPTZ | NOW() | ✅ | |

### `convites`
| Coluna | Tipo | Descrição |
|---|---|---|
| id | UUID | PK |
| empresa_id | UUID | FK |
| email | TEXT | Email convidado |
| nome | TEXT | Nome sugerido |
| papel | papel_usuario | Papel que terá |
| status | status_convite | pendente/aceito/cancelado/expirado |
| token | TEXT | Token único (hex 64 chars) |
| expira_em | TIMESTAMPTZ | NOW() + 7 dias |
| criado_em | TIMESTAMPTZ | |

### `produtos`
| Coluna | Tipo | Descrição |
|---|---|---|
| id | UUID | PK |
| empresa_id | UUID | FK |
| nome | TEXT | Obrigatório |
| sku | TEXT | Código interno |
| ean | TEXT | Código de barras EAN |
| categoria | TEXT | Categoria livre |
| preco_custo | NUMERIC(12,2) | Custo |
| preco_varejo | NUMERIC(12,2) | Preço padrão |
| preco_atacado | NUMERIC(12,2) | Tabela atacado |
| preco_vip | NUMERIC(12,2) | Tabela VIP |
| preco_catalogo | NUMERIC(12,2) | Preço no catálogo online |
| preco_minimo | NUMERIC(12,2) | Piso de venda (alerta no PDV) |
| qtd_atual | NUMERIC(12,3) | Estoque atual |
| qtd_minima | NUMERIC(12,3) | Estoque mínimo (alerta dashboard) |
| ativo | BOOLEAN | Aparece no PDV |
| ativo_catalogo | BOOLEAN | Aparece no catálogo online |
| destaque | BOOLEAN | Destaque no catálogo |
| tem_garantia | BOOLEAN | Gera garantia ao vender |
| dias_garantia | INT | Duração da garantia |
| texto_garantia | TEXT | Texto do certificado |
| obs | TEXT | Observações |
| imagem_url | TEXT | URL da imagem |
| criado_em | TIMESTAMPTZ | |
| atualizado_em | TIMESTAMPTZ | |

### `estoque_movimentacoes`
| Coluna | Tipo | Descrição |
|---|---|---|
| id | UUID | PK |
| empresa_id | UUID | FK |
| produto_id | UUID | FK produtos |
| tipo | tipo_movimentacao | entrada/saida/ajuste/brinde/devolucao |
| quantidade | NUMERIC(12,3) | Positivo=entrada, Negativo=saída |
| obs | TEXT | Observação (ex: "Venda #0042") |
| criado_em | TIMESTAMPTZ | |

### `clientes`
| Coluna | Tipo | Descrição |
|---|---|---|
| id | UUID | PK |
| empresa_id | UUID | FK |
| nome | TEXT | Obrigatório |
| telefone | TEXT | Para WhatsApp |
| email | TEXT | |
| cpf | TEXT | |
| endereco | TEXT | |
| obs | TEXT | |
| ultima_compra | DATE | Atualizado via trigger |
| ativo | BOOLEAN | Soft-delete |
| criado_em | TIMESTAMPTZ | |

### `formas_pagamento`
| Coluna | Tipo | Descrição |
|---|---|---|
| id | UUID | PK |
| empresa_id | UUID | FK |
| nome | TEXT | Ex: "PIX", "Cartão Crédito" |
| taxa | NUMERIC(5,2) | Taxa percentual (ex: 2.99) |
| ativo | BOOLEAN | Aparece no PDV |
| criado_em | TIMESTAMPTZ | |

> **Padrões inseridos automaticamente** ao criar empresa (trigger `trg_formas_padrao`):
> Dinheiro (0%), PIX (0%), Cartão Débito (1.5%), Cartão Crédito (2.99%), Boleto (1.5%, inativo), Cheque (0%, inativo)

### `comissoes`
| Coluna | Tipo | Descrição |
|---|---|---|
| id | UUID | PK |
| empresa_id | UUID | FK |
| nome | TEXT | Nome do comissionado |
| telefone | TEXT | WhatsApp |
| tipo_comissao | TEXT | 'percentual' ou 'fixo' |
| taxa | NUMERIC(10,2) | % ou R$ por venda |
| status | TEXT | 'ativo' ou 'inativo' |
| criado_em | TIMESTAMPTZ | |

### `vendas`
| Coluna | Tipo | Descrição |
|---|---|---|
| id | UUID | PK |
| empresa_id | UUID | FK |
| numero | SERIAL | Número sequencial (#0001) |
| cliente_id | UUID | FK clientes (nullable) |
| cliente_nome | TEXT | Nome do cliente (desnormalizado) |
| forma_pagamento | TEXT | Ex: "PIX" |
| total | NUMERIC(12,2) | Valor final |
| desconto | NUMERIC(12,2) | Desconto aplicado |
| status | status_venda | concluida/cancelada/pendente |
| motivo_cancelamento | TEXT | Preenchido ao cancelar |
| comissionado_id | UUID | FK comissoes (nullable) |
| comissionado_nome | TEXT | Desnormalizado |
| obs | TEXT | |
| como_foi_nota | INT | NPS 1-5 [PRO] |
| como_foi_resposta | TEXT | Comentário NPS [PRO] |
| como_foi_respondido_em | TIMESTAMPTZ | |
| criado_em | TIMESTAMPTZ | |

### `itens_venda`
| Coluna | Tipo | Descrição |
|---|---|---|
| id | UUID | PK |
| venda_id | UUID | FK vendas |
| produto_id | UUID | FK produtos (nullable) |
| produto_nome | TEXT | Desnormalizado |
| quantidade | NUMERIC(12,3) | |
| preco_unitario | NUMERIC(12,2) | Preço no momento da venda |
| brinde | BOOLEAN | Se foi brinde (preço = 0) |
| num_serie | TEXT | Número de série para garantia |
| criado_em | TIMESTAMPTZ | |

### `fiados`
| Coluna | Tipo | Descrição |
|---|---|---|
| id | UUID | PK |
| empresa_id | UUID | FK |
| cliente_id | UUID | FK clientes (nullable) |
| cliente_nome | TEXT | Desnormalizado |
| cliente_tel | TEXT | Telefone para cobrança |
| valor_aberto | NUMERIC(12,2) | Saldo devedor |
| status | status_fiado | 'aberto' ou 'pago' |
| pago_em | TIMESTAMPTZ | Data do pagamento |
| criado_em | TIMESTAMPTZ | |

### `despesas`
| Coluna | Tipo | Descrição |
|---|---|---|
| id | UUID | PK |
| empresa_id | UUID | FK |
| descricao | TEXT | Obrigatório |
| categoria | TEXT | Aluguel, Fornecedor, Energia... |
| tipo | TEXT | Fixo / Variável |
| valor | NUMERIC(12,2) | Obrigatório |
| data | DATE | Data da despesa |
| criado_em | TIMESTAMPTZ | |

### `fornecedores`
| Coluna | Tipo | Descrição |
|---|---|---|
| id | UUID | PK |
| empresa_id | UUID | FK |
| nome | TEXT | Obrigatório |
| telefone | TEXT | |
| email | TEXT | |
| cnpj | TEXT | |
| endereco | TEXT | |
| obs | TEXT | |
| ativo | BOOLEAN | Soft-delete |
| criado_em | TIMESTAMPTZ | |

### `pedidos_fornecedor`
| Coluna | Tipo | Descrição |
|---|---|---|
| id | UUID | PK |
| empresa_id | UUID | FK |
| fornecedor_id | UUID | FK fornecedores |
| fornecedor_nome | TEXT | Desnormalizado |
| status | status_pedido | rascunho/enviado/recebido/cancelado |
| total | NUMERIC(12,2) | |
| obs | TEXT | |
| criado_em | TIMESTAMPTZ | |

### `garantias`
| Coluna | Tipo | Descrição |
|---|---|---|
| id | UUID | PK |
| empresa_id | UUID | FK |
| venda_id | UUID | FK vendas |
| cliente_nome | TEXT | |
| produto_nome | TEXT | |
| num_serie | TEXT | |
| status | status_garantia | ativa/em_analise/em_devolucao/finalizada |
| data_inicio | DATE | Data da venda |
| data_fim | DATE | Vencimento da garantia |
| obs | TEXT | |
| criado_em | TIMESTAMPTZ | |

### `devolucoes`
| Coluna | Tipo | Descrição |
|---|---|---|
| id | UUID | PK |
| empresa_id | UUID | FK |
| garantia_id | UUID | FK garantias |
| venda_id | UUID | FK vendas |
| motivo | TEXT | |
| valor | NUMERIC(12,2) | |
| criado_em | TIMESTAMPTZ | |

### `ordens_servico`
| Coluna | Tipo | Descrição |
|---|---|---|
| id | UUID | PK |
| empresa_id | UUID | FK |
| cliente_nome | TEXT | Obrigatório |
| cliente_tel | TEXT | |
| produto_desc | TEXT | Descrição do equipamento |
| problema | TEXT | Problema relatado |
| laudo | TEXT | Laudo técnico |
| status | status_os | aberto/em_andamento/concluido/cancelado |
| valor_servico | NUMERIC(12,2) | Mão de obra |
| valor_pecas | NUMERIC(12,2) | Peças |
| criado_em | TIMESTAMPTZ | |
| atualizado_em | TIMESTAMPTZ | |

---

## 4.3 Triggers e Automações SQL

### `handle_new_user` (AFTER INSERT ON auth.users)
**Fluxo**:
1. Verifica `raw_user_meta_data->>'invite_token'`
2. **Com convite válido**: associa à empresa do convite, cria profile com papel do convite, marca convite como `aceito`
3. **Sem convite**: cria nova `empresa`, cria `subscription` (start, active), cria `profile` como admin

### `atualizar_ultima_compra` (AFTER INSERT OR UPDATE OF status ON vendas)
- Quando venda é concluída e tem `cliente_id`, atualiza `clientes.ultima_compra = CURRENT_DATE`
- Mantém CRM atualizado automaticamente

### `decrementar_estoque_venda` (AFTER INSERT ON itens_venda)
- Para cada item não-brinde: `produtos.qtd_atual -= quantidade`
- Automação no banco garante consistência mesmo com falhas no frontend

### `inserir_formas_pagamento_padrao` (AFTER INSERT ON empresas)
- Insere 6 formas de pagamento padrão para cada nova empresa
- Garante que o PDV já funciona no primeiro acesso

---

## 4.4 Índices

```sql
-- Performance nas queries mais frequentes
idx_profiles_empresa       -- profiles.empresa_id
idx_produtos_empresa       -- produtos.empresa_id
idx_vendas_empresa         -- vendas.empresa_id
idx_vendas_criado          -- vendas.criado_em DESC
idx_vendas_cliente         -- vendas.cliente_id
idx_itens_venda            -- itens_venda.venda_id
idx_clientes_empresa       -- clientes.empresa_id
idx_fiados_empresa         -- fiados.empresa_id
idx_fiados_cliente         -- fiados.cliente_id
idx_despesas_empresa       -- despesas.empresa_id
idx_despesas_data          -- despesas.data DESC
idx_comissoes_empresa      -- comissoes.empresa_id
idx_garantias_empresa      -- garantias.empresa_id
idx_os_empresa             -- ordens_servico.empresa_id
idx_estoque_produto        -- estoque_movimentacoes.produto_id
idx_estoque_empresa        -- estoque_movimentacoes.empresa_id
idx_subscriptions_empresa  -- subscriptions.empresa_id
idx_convites_empresa       -- convites.empresa_id
idx_convites_token         -- convites.token
```

---

## 4.5 Row Level Security (RLS)

**Função helper**:
```sql
CREATE OR REPLACE FUNCTION minha_empresa_id()
RETURNS UUID AS $$
  SELECT empresa_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

**Política padrão** (aplicada a todas as tabelas):
```sql
USING (empresa_id = minha_empresa_id())
```

**Exceção — `itens_venda`** (não tem empresa_id direto):
```sql
USING (venda_id IN (
  SELECT id FROM vendas WHERE empresa_id = minha_empresa_id()
))
```

**Exceção — `profiles`**:
```sql
USING (empresa_id = minha_empresa_id() OR id = auth.uid())
```
