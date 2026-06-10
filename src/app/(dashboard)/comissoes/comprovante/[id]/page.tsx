'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { formatCurrency } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

type PagComissao = {
  id: string
  comissionado_nome: string
  forma_pagamento: string
  total_pago: number
  data_pagamento: string
  criado_em: string
  vendas_ids: string[]
  comissoes?: { nome: string; telefone: string | null } | null
}
type VendaDetalhada = {
  id: string; numero: number; total: number; valor_comissao: number; criado_em: string; forma_pagamento: string
}

export default function ComprovantePage({ params }: { params: { id: string } }) {
  const { empresaId } = useEmpresaId()
  const [pagamento,  setPagamento]  = useState<PagComissao | null>(null)
  const [vendas,     setVendas]     = useState<VendaDetalhada[]>([])
  const [nomeEmpresa, setNomeEmpresa] = useState('KDL Store')
  const [loading,    setLoading]    = useState(true)
  const [erro,       setErro]       = useState('')

  useEffect(() => {
    if (!params.id) return
    carregar()
  }, [params.id])

  async function carregar() {
    setLoading(true)
    const supabase = createClient()

    const { data: pag, error } = await supabase
      .from('pagamentos_comissao')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !pag) { setErro('Comprovante não encontrado.'); setLoading(false); return }
    setPagamento(pag as PagComissao)

    // Busca nome da empresa
    if (pag.empresa_id) {
      const { data: emp } = await supabase.from('empresas').select('nome').eq('id', pag.empresa_id).single()
      if (emp?.nome) setNomeEmpresa(emp.nome)
    }

    // Busca detalhes das vendas do lote
    if (pag.vendas_ids && pag.vendas_ids.length > 0) {
      const { data: vendasData } = await supabase
        .from('vendas')
        .select('id,numero,total,valor_comissao,criado_em,forma_pagamento')
        .in('id', pag.vendas_ids)
        .order('numero')
      setVendas((vendasData || []) as VendaDetalhada[])
    }

    setLoading(false)
  }

  function compartilharWA() {
    if (!pagamento) return
    const msg = encodeURIComponent(
      `Comprovante de Comissão — ${nomeEmpresa}\n\n` +
      `Comissionado: ${pagamento.comissionado_nome}\n` +
      `Data: ${new Date(pagamento.data_pagamento+'T12:00:00').toLocaleDateString('pt-BR')}\n` +
      `Forma: ${pagamento.forma_pagamento}\n` +
      `Total: ${formatCurrency(pagamento.total_pago)}\n` +
      `Vendas: ${vendas.map(v => `#${String(v.numero).padStart(4,'0')}`).join(', ')}`
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  if (loading) return (
    <div style={{display:'flex',justifyContent:'center',padding:'4rem',gap:'0.75rem',color:'var(--texto-desab)'}}>
      <Loader2 size={20} style={{animation:'spin 1s linear infinite'}}/> Carregando comprovante...
    </div>
  )

  if (erro || !pagamento) return (
    <div style={{textAlign:'center',padding:'4rem'}}>
      <p style={{fontSize:'2rem',marginBottom:'0.5rem'}}>❌</p>
      <p style={{fontWeight:700,color:'var(--vermelho)'}}>{erro || 'Comprovante não encontrado.'}</p>
      <a href="/comissoes" style={{color:'var(--verde)',textDecoration:'underline',marginTop:'0.5rem',display:'block'}}>← Voltar</a>
    </div>
  )

  const dataFormatada = new Date(pagamento.data_pagamento + 'T12:00:00').toLocaleDateString('pt-BR')
  const horaFormatada = new Date(pagamento.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const idCurto = pagamento.id.substring(0, 8).toUpperCase()

  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>

      {/* Ações (não imprime) */}
      <div className="no-print" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <a href="/comissoes" style={{ fontSize: '0.78rem', color: 'var(--verde)', textDecoration: 'underline' }}>
          ← Voltar para Comissões
        </a>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={compartilharWA}
            className="btn"
            style={{ background: '#25D366', color: '#fff', border: 'none', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            💬 Compartilhar WA
          </button>
          <button onClick={() => window.print()}
            className="btn btn-secondary"
            style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            🖨️ Imprimir / PDF
          </button>
        </div>
      </div>

      {/* Comprovante térmico */}
      <div id="comprovante-print" style={{
        padding: '1.5rem',
        border: '2px dashed #000',
        fontFamily: 'monospace',
        fontSize: '0.82rem',
        lineHeight: '1.5',
        color: '#000',
        background: '#fff',
        maxWidth: '320px',
        margin: '0 auto',
      }}>
        {/* Cabeçalho */}
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <p style={{ fontWeight: 'bold', fontSize: '1.1rem', margin: 0, letterSpacing: '0.06em' }}>{nomeEmpresa.toUpperCase()}</p>
          <p style={{ margin: '4px 0 0', fontWeight: 'bold' }}>COMPROVANTE DE PAGAMENTO</p>
          <p style={{ margin: '2px 0 0' }}>DE COMISSÃO</p>
          <p style={{ fontSize: '0.72rem', color: '#555', margin: '8px 0 0' }}>{'—'.repeat(30)}</p>
        </div>

        <p style={{ margin: '4px 0' }}><b>Nº:</b> {idCurto}</p>
        <p style={{ margin: '4px 0' }}><b>COMISSIONADO:</b> {pagamento.comissionado_nome}</p>
        <p style={{ margin: '4px 0' }}><b>DATA:</b> {dataFormatada} às {horaFormatada}</p>
        <p style={{ margin: '4px 0' }}><b>FORMA PGTO:</b> {pagamento.forma_pagamento}</p>
        <p style={{ fontSize: '0.72rem', color: '#555', margin: '8px 0' }}>{'—'.repeat(30)}</p>

        <p style={{ fontWeight: 'bold', margin: '6px 0 4px' }}>VENDAS INCLUÍDAS:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '6px' }}>
          {vendas.length > 0 ? vendas.map(v => (
            <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>#{String(v.numero).padStart(4,'0')} ({new Date(v.criado_em).toLocaleDateString('pt-BR')})</span>
              <span>{formatCurrency(v.valor_comissao)}</span>
            </div>
          )) : (
            <p style={{ color: '#777', fontSize: '0.75rem' }}>
              {pagamento.vendas_ids.length} venda(s) incluída(s)
            </p>
          )}
        </div>

        <p style={{ fontSize: '0.72rem', color: '#555', margin: '6px 0' }}>{'—'.repeat(30)}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1rem' }}>
          <span>TOTAL PAGO:</span>
          <span>{formatCurrency(pagamento.total_pago)}</span>
        </div>

        {/* Assinatura */}
        <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          <div style={{ borderBottom: '1px solid #000', width: '200px', margin: '0 auto 4px' }} />
          <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', margin: 0 }}>Assinatura do Recebedor</p>
        </div>

        <p style={{ fontSize: '0.68rem', color: '#777', textAlign: 'center', marginTop: '1rem' }}>
          Documento gerado em {new Date().toLocaleDateString('pt-BR')}
        </p>
      </div>

      {/* CSS de impressão */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #comprovante-print, #comprovante-print * { visibility: visible; }
          #comprovante-print {
            position: fixed; left: 0; top: 0;
            width: 80mm; border: none !important;
            padding: 4mm !important; margin: 0 !important;
            max-width: none !important;
          }
          @page { size: auto; margin: 0mm; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  )
}
