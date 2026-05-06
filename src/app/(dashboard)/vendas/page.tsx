'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { formatCurrency } from '@/lib/utils'
import { Search, Loader2 } from 'lucide-react'

type Venda = {
  id: string; numero: number; cliente_nome: string | null
  forma_pagamento: string; total: number; status: string
  criado_em: string; registrado_nome: string | null
}

const FORMAS: Record<string, string> = { PIX:'📱 PIX', Dinheiro:'💵 Dinheiro', Crédito:'💳 Crédito', Débito:'💴 Débito', Fiado:'📒 Fiado' }

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
    <div className="anim-fade" style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>

      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">🛒 Vendas</h1>
          <p className="pg-sub">Hoje: {vendasHoje.length} vendas · {formatCurrency(faturamentoHoje)}</p>
        </div>
        <Link href="/vendas/nova" className="btn btn-primary">+ Nova Venda</Link>
      </div>

      {/* KPIs rápidos */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'0.625rem' }}>
        {[
          { l:'Total hoje', v: formatCurrency(faturamentoHoje), c:'var(--verde)' },
          { l:'Qtd. hoje',  v: String(vendasHoje.length),       c:'var(--verde)' },
          { l:'Período filtrado', v: formatCurrency(totalFiltrado), c:'var(--texto)' },
          { l:'Total registros', v: String(filtradas.length),   c:'var(--texto)' },
        ].map(k=>(
          <div key={k.l} className="card" style={{padding:'0.75rem'}}>
            <p style={{fontSize:'0.75rem',color:'var(--texto-desab)',marginBottom:'0.25rem'}}>{k.l}</p>
            <p style={{fontWeight:900,fontSize:'1.25rem',color:k.c,fontFamily:'monospace'}}>{k.v}</p>
          </div>
        ))}
      </div>

      {/* Filtros por forma de pagamento */}
      <div style={{ display:'flex', gap:'0.375rem', flexWrap:'wrap' }}>
        {['todos','PIX','Dinheiro','Crédito','Débito','Fiado'].map(f=>(
          <button key={f} onClick={()=>setFiltro(f)}
            className={filtro===f?'btn btn-primary':'btn btn-secondary'}
            style={{fontSize:'0.78rem',padding:'0.25rem 0.625rem'}}>
            {f==='todos'?'Todos':FORMAS[f]||f}
          </button>
        ))}
      </div>

      {/* Busca */}
      <div style={{ position:'relative', maxWidth:'340px' }}>
        <Search size={14} style={{position:'absolute',left:'0.75rem',top:'50%',transform:'translateY(-50%)',color:'var(--texto-desab)'}}/>
        <input className="campo" placeholder="Buscar por Nº ou cliente..."
          style={{paddingLeft:'2.25rem'}} value={busca} onChange={e=>setBusca(e.target.value)}/>
      </div>

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:'3rem',gap:'0.75rem',color:'var(--texto-desab)'}}>
          <Loader2 size={20} style={{animation:'spin 1s linear infinite'}}/> Carregando vendas...
        </div>
      ) : filtradas.length === 0 ? (
        <div style={{textAlign:'center',padding:'3rem',color:'var(--texto-desab)'}}>
          {busca || filtro !== 'todos' ? 'Nenhuma venda encontrada.' : (
            <div>
              <p style={{fontSize:'2rem',marginBottom:'0.5rem'}}>🛒</p>
              <p style={{fontWeight:700,marginBottom:'0.5rem'}}>Nenhuma venda registrada ainda</p>
              <Link href="/vendas/nova" className="btn btn-primary">Registrar primeira venda</Link>
            </div>
          )}
        </div>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr style={{background:'#364a60'}}>
                <th>#</th><th>Cliente</th><th>Pagamento</th>
                <th style={{textAlign:'right'}}>Total</th>
                <th>Data / Hora</th><th>Registrado por</th>
                <th style={{textAlign:'center'}}>Status</th>
                <th style={{textAlign:'center'}}>Recibo</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map(v=>(
                <tr key={v.id}>
                  <td><code style={{fontWeight:700}}>#{String(v.numero).padStart(4,'0')}</code></td>
                  <td style={{fontWeight:600}}>{v.cliente_nome||<span style={{color:'var(--texto-desab)'}}>Anônimo</span>}</td>
                  <td style={{fontSize:'0.82rem'}}>{FORMAS[v.forma_pagamento]||v.forma_pagamento}</td>
                  <td style={{textAlign:'right',fontWeight:900,color:'var(--verde)',fontFamily:'monospace'}}>{formatCurrency(v.total)}</td>
                  <td style={{fontSize:'0.82rem',color:'var(--texto-desab)'}}>
                    {new Date(v.criado_em).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}
                  </td>
                  <td style={{fontSize:'0.82rem'}}>{v.registrado_nome||'—'}</td>
                  <td style={{textAlign:'center'}}>
                    <span className={v.status==='concluida'?'status-ok':'status-neutro'} style={{fontSize:'0.78rem'}}>
                      {v.status==='concluida'?'● Concluída':'○ Cancelada'}
                    </span>
                  </td>
                  <td style={{textAlign:'center'}}>
                    <Link href={`/vendas/${v.id}`} className="btn btn-secondary" style={{fontSize:'0.72rem',padding:'0.2rem 0.5rem'}}>Ver</Link>
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
