import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { ReciboPublicoCliente } from './ReciboPublicoCliente'

export default async function PublicReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  try {
    const supabase = createAdminClient()

    // 1. Fetch venda
    const { data: venda, error: errorVenda } = await supabase
      .from('vendas')
      .select('*')
      .eq('id', id)
      .single()

    if (errorVenda || !venda) {
      return notFound()
    }

    // 2. Fetch items
    const { data: itens, error: errorItens } = await supabase
      .from('itens_venda')
      .select('id,produto_id,produto_nome,quantidade,preco_unitario,brinde,num_serie')
      .eq('venda_id', id)

    // 3. Fetch client info if present
    let clienteInfo = null
    if (venda.cliente_id) {
      const { data: cli } = await supabase
        .from('clientes')
        .select('nome,telefone,email,cpf,endereco')
        .eq('id', venda.cliente_id)
        .single()
      clienteInfo = cli
    }

    // 4. Fetch company info
    let empresa = null
    if (venda.empresa_id) {
      const { data: emp } = await supabase
        .from('empresas')
        .select('nome,cnpj,whatsapp,telefone,email,endereco,cidade,estado,logo_url')
        .eq('id', venda.empresa_id)
        .single()
      empresa = emp
    }

    // 5. Fetch warranties
    const { data: garantias } = await supabase
      .from('garantias')
      .select('id,produto_nome,num_serie,data_vencimento,status')
      .eq('venda_id', id)

    return (
      <ReciboPublicoCliente
        venda={venda}
        itens={itens || []}
        clienteInfo={clienteInfo}
        empresa={empresa}
        garantias={garantias || []}
      />
    )
  } catch (e) {
    console.error(e)
    return notFound()
  }
}
