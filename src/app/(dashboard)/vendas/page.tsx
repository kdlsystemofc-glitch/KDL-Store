'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { formatCurrency } from '@/lib/utils'
import { Search, Loader2 } from 'lucide-react'
import { OperadorOnly } from '@/components/OperadorOnly'

type Venda = {
  id: string; numero: number; cliente_nome: string | null
  forma_pagamento: string; total: number; status: string
  criado_em: string; registrado_nome: string | null
}

const FORMAS: Record<string, string> = { PIX:'PIX', Dinheiro:'DINHEIRO', 'Crédito':'CREDITO', 'Débito':'DEBITO', Fiado:'FIADO' }

export default function VendasPage() {
  const { empresaId } = useEmpresaId()
  const [vendas,   setVendas]   = useState<Venda[]>([])
  const [busca,    setBusca]    = useState('')
  const [filtro,   setFiltro]   = useState('todos')
  const [loading,  setLoading]  = useState(true)

  useEffect(() => { if (empresaId) carregar(empresaId) }, [empresaId])

  async function carregar(eid: string) {
    setLoading(true)
    const { data } = await createClient()
      .from('vendas')
      .select('id,numero,cliente_nome,forma_pagamento,total,status,criado_em,registrado_nome')
      .eq('empresa_id', eid)
      .order('criado_em', { ascending: false })
      .limit(200)
    setVendas(data || [])
    setLoading(false)
  }

  const filtradas = vendas.filter(v => {
    const matchBusca = String(v.numero).includes(busca) ||
      (v.cliente_nome||'').toLowerCase().includes(busca.toLowerCase())
    const matchFiltro = filtro === 'todos' ? true : v.forma_pagamento === filtro
    return matchBusca && matchFiltro
  })

  const totalFiltrado = filtradas.reduce((a,v) => a + v.total, 0)
  const hoje = new Date().toISOString().slice(0,10)
  const vendasHoje = vendas.filter(v => v.criado_em.startsWith(hoje) && v.status === 'concluida')
  const faturamentoHoje = vendasHoje.reduce((a,v) => a + v.total, 0)

  return (
    <div className="anim-fade" style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>

      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">HISTÓRICO DE VENDAS</h1>
          <p className="pg-sub">HOJE: {vendasHoje.length} VENDAS · {formatCurrency(faturamentoHoje)}</p>
        </div>
        <OperadorOnly>
          <Link href="/vendas/nova" className="btn btn-primary">▶ NOVA VENDA</Link>
        </OperadorOnly>
      </div>

      {/* KPIs rápidos */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'0.5rem' }}>
        {[
          { l:'FATURAMENTO HOJE', v: formatCurrency(faturamentoHoje), dot:'var(--verde)',   c:'var(--verde)' },
          { l:'VENDAS HOJE',     v: String(vendasHoje.length),       dot:'var(--verde)',   c:'var(--verde)' },
          { l:'TOTAL PERÍODO',  v: formatCurrency(totalFiltrado),   dot:'var(--azul)',    c:'var(--texto-mono)' },
          { l:'REGISTROS',       v: String(filtradas.length),        dot:'var(--texto-sec)', c:'var(--texto-sec)' },
        ].map(k=>(
          <div key={k.l} className="kpi-card">
            <div style={{display:'flex',alignItems:'center',gap:'0.35rem'}}>
              <span style={{color:k.dot,fontSize:'0.55rem'}}>●</span>
              <p className="kpi-label">{k.l}</p>
            </div>
            <p className="kpi-valor" style={{color:k.c,fontSize:'1.1rem'}}>{k.v}</p>
          </div>
        ))}
      </div>

      {/* Filtros + Busca */}
      <div style={{ display:'flex', gap:'0.375rem', flexWrap:'wrap', alignItems:'center' }}>
        {['todos','PIX','Dinheiro','Crédito','Débito','Fiado'].map(f=>(
          <button key={f} onClick={()=>setFiltro(f)}
            className={filtro===f?'btn btn-primary':'btn btn-secondary'}
            style={{fontSize:'0.65rem',padding:'0.3rem 0.625rem'}}>
            {f==='todos'?'TODOS':(FORMAS[f]||f)}
          </button>
        ))}
        <input className="campo" placeholder="BUSCAR POR Nº OU CLIENTE_"
          style={{flex:1,maxWidth:'260px'}} value={busca} onChange={e=>setBusca(e.target.value)}/>
      </div>

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:'3rem',flexDirection:'column',alignItems:'center',gap:'0.5rem'}}>
          <p style={{color:'var(--verde)',fontSize:'0.75rem',letterSpacing:'0.08em'}}>CARREGANDO VENDAS<span className="blink">_</span></p>
        </div>
      ) : filtradas.length === 0 ? (
        <div style={{textAlign:'center',padding:'3rem',color:'var(--texto-desab)',border:'1px solid var(--borda)',background:'var(--surface)'}}>
          {busca || filtro !== 'todos' ? (
            <p style={{fontSize:'0.78rem',letterSpacing:'0.04em'}}>[ NENHUMA VENDA ENCONTRADA ]</p>
          ) : (
            <div>
              <p style={{fontSize:'0.7rem',color:'var(--borda-forte)',letterSpacing:'0.1em',fontWeight:700,marginBottom:'0.5rem'}}>[ NENHUMA VENDA REGISTRADA ]</p>
              <OperadorOnly>
                <Link href="/vendas/nova" className="btn btn-primary">▶ REGISTRAR VENDA</Link>
              </OperadorOnly>
            </div>
          )}
        </div>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>#</th><th>CLIENTE</th><th>PAGAMENTO</th>
                <th style={{textAlign:'right'}}>TOTAL</th>
                <th>DATA/HORA</th><th>OPERADOR</th>
                <th style={{textAlign:'center'}}>STATUS</th>
                <th style={{textAlign:'center'}}>REC.</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map(v=>(
                <tr key={v.id}>
                  <td style={{color:'var(--texto-mono)',fontWeight:700,fontSize:'0.75rem',letterSpacing:'0.04em'}}>#{String(v.numero).padStart(4,'0')}</td>
                  <td style={{fontWeight:600}}>{v.cliente_nome||<span style={{color:'var(--texto-desab)'}}>ANÔNIMO</span>}</td>
                  <td style={{fontSize:'0.72rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.04em'}}>{FORMAS[v.forma_pagamento]||v.forma_pagamento}</td>
                  <td style={{textAlign:'right',fontWeight:700,color:'var(--verde)',fontVariantNumeric:'tabular-nums'}}>{formatCurrency(v.total)}</td>
                  <td style={{fontSize:'0.72rem',color:'var(--texto-desab)',fontVariantNumeric:'tabular-nums'}}>
                    {new Date(v.criado_em).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}
                  </td>
                  <td style={{fontSize:'0.72rem',color:'var(--texto-sec)'}}>{v.registrado_nome||'—'}</td>
                  <td style={{textAlign:'center'}}>
                    <span className={v.status==='concluida'?'status-ok':'status-neutro'} style={{fontSize:'0.7rem'}}>
                      {v.status==='concluida'?'● OK':'○ CANC.'}
                    </span>
                  </td>
                  <td style={{textAlign:'center'}}>
                    <Link href={`/vendas/${v.id}`} className="btn btn-secondary" style={{fontSize:'0.62rem',padding:'0.15rem 0.4rem'}}>VER</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
