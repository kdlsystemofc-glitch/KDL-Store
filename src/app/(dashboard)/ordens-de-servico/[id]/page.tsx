'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { formatCurrency } from '@/lib/utils'
import { Loader2, ArrowLeft, Printer, MessageCircle, CheckCircle } from 'lucide-react'

type OS = {
  id: string; numero: number; cliente_nome: string; cliente_tel: string | null
  equipamento: string; defeito_relatado: string; status: string
  orcamento: number | null; tecnico: string | null; criado_em: string; previsao: string | null
  venda_id: string | null; observacoes: string | null
}

const STATUS_LABEL: Record<string, string> = {
  aguardando:   '⏳ Aguardando',
  aprovado:     '✅ Aprovado',
  em_servico:   '🔧 Em Serviço',
  concluido:    '✔ Concluído',
  entregue:     '📦 Entregue',
  cancelado:    '✕ Cancelado',
}

const STATUS_CLS: Record<string, string> = {
  aguardando: 'status-neutro', aprovado: 'status-aviso',
  em_servico: 'status-aviso',  concluido: 'status-ok',
  entregue:   'status-ok',     cancelado: 'status-perigo',
}

export default function OSDetalhePage({ params }: { params: { id: string } }) {
  const { empresaId } = useEmpresaId()
  const [os, setOs] = useState<OS | null>(null)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (empresaId && params.id) carregar()
  }, [empresaId, params.id])

  async function carregar() {
    setLoading(true)
    const { data } = await createClient()
      .from('ordens_servico')
      .select('*')
      .eq('id', params.id)
      .eq('empresa_id', empresaId!)
      .single()
    setOs(data)
    setLoading(false)
  }

  async function concluir() {
    if (!os || !empresaId) return
    setSalvando(true)
    await createClient().from('ordens_servico').update({ status: 'concluido' }).eq('id', os.id)
    setOs({ ...os, status: 'concluido' })
    setSalvando(false)
  }

  if (loading) return (
    <div style={{display:'flex',justifyContent:'center',padding:'3rem',color:'var(--texto-desab)'}}>
      <Loader2 size={24} style={{animation:'spin 1s linear infinite'}}/>
    </div>
  )
  if (!os) return <div className="alerta alerta-perigo">OS não encontrada.</div>

  const printOS = () => window.print()

  const openZap = () => {
    if (!os.cliente_tel) return
    const msg = encodeURIComponent(`Olá ${os.cliente_nome}, sua ordem de serviço #${String(os.numero).padStart(4,'0')} foi concluída. Pode passar para retirar.`)
    window.open(`https://wa.me/55${os.cliente_tel.replace(/\D/g, '')}?text=${msg}`, '_blank')
  }

  return (
    <div className="anim-fade" style={{ display:'flex', flexDirection:'column', gap:'1.25rem', maxWidth:'680px' }}>
      <div className="no-print pg-header">
        <Link href="/ordens-de-servico" className="btn btn-secondary" style={{ display:'flex', alignItems:'center', gap:'0.375rem' }}>
          <ArrowLeft size={16}/> Voltar
        </Link>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          {os.cliente_tel && (
            <button onClick={openZap} className="btn btn-secondary" style={{ display:'flex', alignItems:'center', gap:'0.375rem', background:'#25D366', color:'#fff', borderColor:'#25D366' }}>
              <MessageCircle size={16}/> WhatsApp
            </button>
          )}
          <button onClick={printOS} className="btn btn-secondary" style={{ display:'flex', alignItems:'center', gap:'0.375rem' }}>
            <Printer size={16}/> Imprimir
          </button>
        </div>
      </div>

      <div className="card" id="print-area">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', borderBottom:'2px solid var(--borda)', paddingBottom:'1rem', marginBottom:'1rem' }}>
          <div>
            <h1 style={{ fontWeight:900, fontSize:'1.5rem' }}>OS #{String(os.numero).padStart(4,'0')}</h1>
            <p style={{ color:'var(--texto-desab)', fontSize:'0.85rem' }}>Abertura: {new Date(os.criado_em).toLocaleString('pt-BR')}</p>
          </div>
          <div style={{ textAlign:'right' }}>
            <span className={STATUS_CLS[os.status]} style={{ padding:'0.5rem 1rem', fontSize:'0.9rem' }}>
              {STATUS_LABEL[os.status]}
            </span>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', marginBottom:'1.5rem' }}>
          <div>
            <p style={{ fontWeight:800, fontSize:'0.85rem', color:'var(--texto-desab)', marginBottom:'0.25rem', textTransform:'uppercase' }}>Cliente</p>
            <p style={{ fontWeight:700, fontSize:'1.1rem' }}>{os.cliente_nome}</p>
            <p style={{ color:'var(--texto-sec)', fontSize:'0.9rem' }}>{os.cliente_tel || 'Sem telefone'}</p>
          </div>
          <div>
            <p style={{ fontWeight:800, fontSize:'0.85rem', color:'var(--texto-desab)', marginBottom:'0.25rem', textTransform:'uppercase' }}>Dados Adicionais</p>
            <p style={{ fontSize:'0.9rem' }}>Técnico: <span style={{ fontWeight:700 }}>{os.tecnico || 'Não informado'}</span></p>
            <p style={{ fontSize:'0.9rem' }}>Previsão: <span style={{ fontWeight:700 }}>{os.previsao ? new Date(os.previsao+'T12:00:00').toLocaleDateString('pt-BR') : 'Não informada'}</span></p>
            {os.orcamento && <p style={{ fontSize:'0.9rem' }}>Orçamento: <span style={{ fontWeight:700, color:'var(--verde)' }}>{formatCurrency(os.orcamento)}</span></p>}
          </div>
        </div>

        <div style={{ borderTop:'1px solid var(--borda-leve)', paddingTop:'1rem', marginBottom:'1.5rem' }}>
          <p style={{ fontWeight:800, fontSize:'0.85rem', color:'var(--texto-desab)', marginBottom:'0.25rem', textTransform:'uppercase' }}>Equipamento</p>
          <p style={{ fontWeight:700, fontSize:'1.1rem', marginBottom:'0.75rem' }}>{os.equipamento}</p>
          
          <p style={{ fontWeight:800, fontSize:'0.85rem', color:'var(--texto-desab)', marginBottom:'0.25rem', textTransform:'uppercase' }}>Defeito Relatado / Serviço</p>
          <p style={{ fontSize:'0.95rem', background:'var(--fundo)', padding:'0.75rem', borderRadius:'var(--radius-sm)' }}>
            {os.defeito_relatado}
          </p>
          
          {os.observacoes && (
            <div style={{ marginTop:'0.75rem' }}>
              <p style={{ fontWeight:800, fontSize:'0.85rem', color:'var(--texto-desab)', marginBottom:'0.25rem', textTransform:'uppercase' }}>Observações</p>
              <p style={{ fontSize:'0.9rem', color:'var(--texto-sec)' }}>{os.observacoes}</p>
            </div>
          )}
        </div>

        {os.venda_id && (
          <div className="alerta alerta-info no-print" style={{ marginBottom:'1.5rem' }}>
            <p style={{ fontWeight:700, marginBottom:'0.25rem' }}>🔗 Vinculada a uma venda</p>
            <p style={{ fontSize:'0.85rem' }}>Esta ordem de serviço foi gerada a partir de uma venda registrada no PDV.</p>
            <Link href={`/vendas/${os.venda_id}`} className="btn btn-secondary" style={{ marginTop:'0.5rem', fontSize:'0.8rem', padding:'0.25rem 0.5rem', display:'inline-block' }}>
              Ver Recibo da Venda
            </Link>
          </div>
        )}

        <div className="no-print" style={{ display:'flex', justifyContent:'flex-end', borderTop:'2px solid var(--borda)', paddingTop:'1.5rem' }}>
          {os.status !== 'concluido' && os.status !== 'entregue' && os.status !== 'cancelado' && (
            <button onClick={concluir} disabled={salvando} className="btn btn-primary" style={{ display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'1.1rem', padding:'0.75rem 1.5rem' }}>
              {salvando ? <Loader2 size={18} style={{animation:'spin 1s linear infinite'}}/> : <CheckCircle size={18}/>}
              Marcar como Concluída
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
