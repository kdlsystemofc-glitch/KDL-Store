export type TipoLoja = 'eletronicos' | 'moda' | 'varejo' | 'servicos' | 'multi'
export type PapelUsuario = 'admin' | 'operador' | 'visualizador' | 'vendedor' | 'estoquista'
export type StatusVenda = 'concluida' | 'cancelada'
export type StatusOS = 'aberta' | 'em_andamento' | 'concluida' | 'cancelada'
export type StatusGarantia = 'ativa' | 'vencida' | 'utilizada'
export type StatusPedido = 'aguardando' | 'parcial' | 'entregue' | 'cancelado'
export type TipoMovimentacao = 'entrada' | 'saida' | 'ajuste'
export type FormaPagamento = 'dinheiro' | 'pix' | 'credito' | 'debito' | 'fiado'

export interface Empresa {
  id: string
  nome_fantasia: string
  cnpj_cpf?: string
  telefone: string
  email?: string
  endereco?: EnderecoJSON
  tipo_loja: TipoLoja
  logo_url?: string
  configuracoes?: ConfiguracoesEmpresa
  plano: string
  created_at: string
}

export interface ConfiguracoesEmpresa {
  formas_pagamento: FormaPagamento[]
  prazo_garantia_padrao: number
  parcelas_maximas: number
  limite_desconto_vendedor: number
}

export interface EnderecoJSON {
  cep?: string
  rua?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
}

export interface Usuario {
  id: string
  empresa_id: string
  nome: string
  papel: PapelUsuario
  ativo: boolean
  limite_desconto_pct: number
  created_at: string
}

export interface Fornecedor {
  id: string
  empresa_id: string
  nome: string
  nome_fantasia?: string
  cnpj_cpf?: string
  telefone: string
  email?: string
  contato_nome?: string
  endereco?: EnderecoJSON
  prazo_entrega_dias?: number
  pedido_minimo?: number
  condicoes_pagamento?: string
  observacoes?: string
  ativo: boolean
  created_at: string
}

export interface Categoria {
  id: string
  empresa_id: string
  nome: string
  created_at: string
}

export interface Produto {
  id: string
  empresa_id: string
  nome: string
  sku: string
  codigo_barras?: string
  categoria_id?: string
  categoria?: Categoria
  fornecedor_id?: string
  fornecedor?: Fornecedor
  descricao?: string
  imagens?: string[]
  preco_custo: number
  preco_venda: number
  preco_minimo?: number
  estoque_atual: number
  estoque_minimo: number
  localizacao_estoque?: string
  rastrear_serie: boolean
  tem_garantia: boolean
  prazo_garantia_dias?: number
  texto_garantia?: string
  tem_variacoes: boolean
  ativo: boolean
  codigo_fornecedor?: string
  variacoes?: ProdutoVariacao[]
  created_at: string
}

export interface ProdutoVariacao {
  id: string
  produto_id: string
  atributo: string
  valor: string
  estoque: number
  preco_diferenciado?: number
  created_at: string
}

export interface Cliente {
  id: string
  empresa_id: string
  nome: string
  cpf?: string
  telefone: string
  email?: string
  data_nascimento?: string
  endereco?: EnderecoJSON
  observacoes?: string
  created_at: string
}

export interface ItemVenda {
  id?: string
  venda_id?: string
  produto_id: string
  produto?: Produto
  variacao_id?: string
  numero_serie?: string
  quantidade: number
  preco_unitario: number
  desconto_pct: number
  total: number
  eh_brinde: boolean
}

export interface PagamentoVenda {
  forma: FormaPagamento
  valor: number
  parcelas?: number
  vencimento?: string
}

export interface Venda {
  id: string
  empresa_id: string
  numero: number
  cliente_id?: string
  cliente?: Cliente
  vendedor_id: string
  vendedor?: Usuario
  subtotal: number
  desconto_total: number
  total: number
  motivo_desconto?: string
  formas_pagamento: PagamentoVenda[]
  status: StatusVenda
  motivo_cancelamento?: string
  observacoes?: string
  itens?: ItemVenda[]
  created_at: string
}

export interface Garantia {
  id: string
  empresa_id: string
  numero: number
  venda_id: string
  venda_item_id: string
  cliente_id?: string
  cliente?: Cliente
  produto_id: string
  produto?: Produto
  numero_serie?: string
  data_inicio: string
  data_vencimento: string
  status: StatusGarantia
  historico_uso?: HistoricoGarantia[]
  created_at: string
}

export interface HistoricoGarantia {
  data: string
  descricao: string
  usuario_id: string
}

export interface EstoqueMovimentacao {
  id: string
  empresa_id: string
  produto_id: string
  produto?: Produto
  tipo: TipoMovimentacao
  quantidade: number
  motivo: string
  referencia_id?: string
  referencia_tipo?: string
  usuario_id?: string
  usuario?: Usuario
  created_at: string
}

export interface OrdemServico {
  id: string
  empresa_id: string
  numero: number
  cliente_id: string
  cliente?: Cliente
  tecnico_id: string
  tecnico?: Usuario
  venda_id?: string
  equipamento: string
  marca_modelo?: string
  numero_serie?: string
  condicao_entrada: string
  fotos_entrada?: string[]
  descricao_servico: string
  pecas_utilizadas?: PecaOS[]
  valor_mao_obra: number
  valor_pecas: number
  total: number
  formas_pagamento?: PagamentoVenda[]
  status_pagamento: string
  status: StatusOS
  data_abertura: string
  previsao_conclusao?: string
  data_conclusao?: string
  condicao_saida?: string
  fotos_saida?: string[]
  observacoes_internas?: string
  observacoes_cliente?: string
  created_at: string
}

export interface PecaOS {
  produto_id: string
  nome: string
  quantidade: number
  valor: number
}

export interface KpiDashboard {
  faturamento_hoje: number
  vendas_hoje: number
  produtos_criticos: number
  os_abertas: number
  faturamento_semana: { data: string; valor: number }[]
}
