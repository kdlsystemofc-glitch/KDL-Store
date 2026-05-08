'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { formatCurrency } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { PageTabs } from '@/components/PageTabs'

export default function FinanceiroPage() {
  const { empresaId } = useEmpresaId()
  const [loading, setLoading] = useState(true)
  const [receita,    setReceita]    = useState(0)
  const [despesas,   setDespesas]   = useState(0)
  const [fiado,      setFiado]      = useState(0)
  const [brindes,    setBrindes]    = useState(0)
  const [despLista,  setDespLista]  = useState<{categoria:string|null;tipo:string;valor:number}[]>([])
  const [formas,     setFormas]     = useState<{forma:string;total:number}[]>([])
  const [diasGraf,   setDiasGraf]   = useState<{dia:string;total:number}[]>([])

  useEffect(() => { if (empresaId) carregar(empresaId) }, [empresaId])

  async function carregar(eid: string) {
    setLoading(true)
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10)
    const supabase  = createClient()
    const [{ data: vendas }, { data: desps }, { data: fiados }, { data: vendasMes }, { data: brindesMov }] = await Promise.all([
      supabase.from('vendas').select('total,forma_pagamento,criado_em').eq('empresa_id', eid).eq('status','concluida').gte('criado_em', inicioMes),
      supabase.from('despesas').select('categoria,tipo,valor').eq('empresa_id', eid).gte('data', inicioMes),
      supabase.from('fiados').select('valor_aberto').eq('empresa_id', eid).eq('status','aberto'),
      supabase.from('vendas').select('criado_em,total').eq('empresa_id', eid).eq('status','concluida').gte('criado_em', new Date(Date.now()-29*86400000).toISOString()),
      supabase.from('estoque_movimentacoes').select('quantidade,produto_id,produtos(preco_custo)').eq('empresa_id', eid).eq('tipo','brinde').gte('criado_em', inicioMes),
    ])

    const totalReceita = (vendas||[]).reduce((a,v)=>a+v.total,0)
    const totalDesp    = (desps||[]).reduce((a,d)=>a+d.valor,0)
    const totalFiado   = (fiados||[]).reduce((a,f)=>a+f.valor_aberto,0)
    // Custo dos brindes = quantidade * preco_custo do produto
    const totalBrindes = (brindesMov||[]).reduce((a, m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prod = m.produtos as any
      const custo = Array.isArray(prod) ? (prod[0]?.preco_custo || 0) : (prod?.preco_custo || 0)
      return a + Math.abs(m.quantidade) * custo
    }, 0)
    setReceita(totalReceita); setDespesas(totalDesp); setFiado(totalFiado); setBrindes(totalBrindes)
    setDespLista(desps||[])

    // Formas
    const fMap: Record<string,number> = {}
    ;(vendas||[]).forEach(v=>{ fMap[v.forma_pagamento]=(fMap[v.forma_pagamento]||0)+v.total })
    setFormas(Object.entries(fMap).sort((a,b)=>b[1]-a[1]).map(([forma,total])=>({forma,total})))

    // Gráfico 30 dias
    const dMap: Record<string,number> = {}
    ;(vendasMes||[]).forEach(v=>{ const d=v.criado_em.slice(0,10); dMap[d]=(dMap[d]||0)+v.total })
    const g = Array.from({length:15},(_,i)=>{
      const d = new Date(Date.now()-(14-i)*86400000).toISOString().slice(0,10)
      return { dia:new Date(d+'T12:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}), total:dMap[d]||0 }
    })
    setDiasGraf(g)
    setLoading(false)
  }

  const lucro = receita - despesas
  const margem = receita > 0 ? ((lucro/receita)*100).toFixed(1) : '0.0'
  const maxGraf = Math.max(...diasGraf.map(d=>d.total), 1)

  return (
    <div className="anim-fade" style={{display:'flex',flexDirection:'column',gap:'0.875rem'}}>
      <div className="pg-header">
        <div><h1 className="pg-titulo">💹 Financeiro — Visão Geral</h1>
          <p className="pg-sub">{new Date().toLocaleDateString('pt-BR',{month:'long',year:'numeric'})} · dados em tempo real</p></div>
        <div style={{display:'flex',gap:'0.5rem'}}>
          <Link href="/financeiro/despesas"  className="btn btn-secondary">+ Despesa</Link>
          <Link href="/financeiro/fechamento" className="btn btn-primary">🔒 Fechar Período</Link>
        </div>
      </div>

      <PageTabs tabs={[
        { label: 'Visão Geral (DRE)', href: '/financeiro' },
        { label: 'Despesas', href: '/financeiro/despesas' },
        { label: 'Fiados 📒', href: '/financeiro/fiado' },
        { label: 'Fechamento de Caixa', href: '/financeiro/fechamento' }
      ]} />

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:'3rem',gap:'0.75rem',color:'var(--texto-desab)'}}>
          <Loader2 size={20} style={{animation:'spin 1s linear infinite'}}/> Carregando...
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'0.625rem'}}>
            {[
              {l:'Receita do Mês',    v:formatCurrency(receita),  c:'var(--verde)'},
              {l:'Despesas do Mês',   v:formatCurrency(despesas), c:'var(--vermelho)'},
              {l:'Lucro Estimado',    v:formatCurrency(lucro),    c:lucro>=0?'var(--verde)':'var(--vermelho)'},
              {l:'Fiado em Aberto',   v:formatCurrency(fiado),    c:fiado>0?'var(--amarelo)':'var(--verde)'},
            ].map(k=>(
              <div key={k.l} className="card" style={{padding:'0.875rem'}}>
                <p style={{fontSize:'0.78rem',color:'var(--texto-desab)',marginBottom:'0.25rem'}}>{k.l}</p>
                <p style={{fontWeight:900,fontSize:'1.4rem',color:k.c,fontFamily:'monospace'}}>{k.v}</p>
                {k.l==='Lucro Estimado'&&<p style={{fontSize:'0.72rem',color:'var(--texto-desab)',marginTop:'2px'}}>Margem: {margem}%</p>}
              </div>
            ))}
          </div>

          {/* Gráfico */}
          <div className="card">
            <p style={{fontWeight:800,marginBottom:'0.875rem'}}>📈 Faturamento — Últimos 15 dias</p>
            {diasGraf.every(d=>d.total===0) ? (
              <p style={{color:'var(--texto-desab)',fontSize:'0.85rem',textAlign:'center',padding:'1rem'}}>Nenhuma venda no período</p>
            ) : (
              <div style={{display:'flex',gap:'3px',alignItems:'flex-end',height:'100px'}}>
                {diasGraf.map((d,i)=>(
                  <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'2px',height:'100%',justifyContent:'flex-end'}}>
                    <div style={{width:'100%',background:d.total>0?'var(--verde)':'var(--surface-alt)',height:`${Math.max((d.total/maxGraf)*88,4)}%`,borderRadius:'2px 2px 0 0'}}/>
                    <p style={{fontSize:'0.55rem',color:'var(--texto-desab)',fontWeight:600,textAlign:'center'}}>{d.dia}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.875rem'}}>
            {/* Formas de pagamento */}
            <div className="card">
              <p style={{fontWeight:800,marginBottom:'0.875rem'}}>💳 Por Forma de Pagamento</p>
              {formas.length===0 ? <p style={{color:'var(--texto-desab)',fontSize:'0.85rem'}}>Nenhuma venda este mês</p> : formas.map(({forma,total})=>(
                <div key={forma} style={{marginBottom:'0.625rem'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'3px'}}>
                    <span style={{fontWeight:600,fontSize:'0.85rem'}}>{forma}</span>
                    <span style={{fontWeight:800,fontFamily:'monospace',color:'var(--verde)'}}>{formatCurrency(total)}</span>
                  </div>
                  <div style={{height:'8px',background:'var(--surface-alt)',borderRadius:'2px',overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${(total/receita)*100}%`,background:'var(--verde)',borderRadius:'2px'}}/>
                  </div>
                </div>
              ))}
            </div>

            {/* Despesas por categoria */}
            <div className="card">
              <p style={{fontWeight:800,marginBottom:'0.875rem'}}>💸 Despesas por Categoria</p>
              {despLista.length===0 ? (
                <div>
                  <p style={{color:'var(--texto-desab)',fontSize:'0.85rem',marginBottom:'0.5rem'}}>Nenhuma despesa este mês</p>
                  <Link href="/financeiro/despesas" className="btn btn-primary" style={{fontSize:'0.8rem'}}>+ Lançar despesa</Link>
                </div>
              ) : Object.entries(despLista.reduce((acc,d)=>{
                  const k=d.categoria||'Outros'; acc[k]=(acc[k]||0)+d.valor; return acc
                },{} as Record<string,number>)).sort((a,b)=>b[1]-a[1]).map(([cat,val])=>(
                <div key={cat} style={{display:'flex',justifyContent:'space-between',padding:'0.375rem 0',borderBottom:'1px solid var(--borda-leve)'}}>
                  <span style={{fontSize:'0.85rem'}}>{cat}</span>
                  <span style={{fontWeight:800,fontFamily:'monospace',color:'var(--vermelho)'}}>{formatCurrency(val)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* DRE simplificado */}
          <div className="card">
            <p style={{fontWeight:800,marginBottom:'0.875rem'}}>📋 DRE Simplificado — {new Date().toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</p>
            {[
              {l:'(+) Receita de Vendas',       v:receita,  c:'var(--verde)',    neg:false},
              {l:'(-) Brindes Concedidos',       v:brindes,  c:'var(--amarelo)', neg:true},
              {l:'(-) Despesas Totais',          v:despesas, c:'var(--vermelho)', neg:true},
              {l:'(=) Lucro Líquido Estimado',   v:receita - brindes - despesas, c:(receita-brindes-despesas)>=0?'var(--verde)':'var(--vermelho)', neg:false},
            ].map(r=>(
              <div key={r.l} style={{display:'flex',justifyContent:'space-between',padding:'0.5rem 0',borderBottom:'1px solid var(--borda-leve)'}}>
                <span style={{fontWeight:r.l.startsWith('(=)')?800:400,fontSize:'0.9rem'}}>{r.l}</span>
                <span style={{fontWeight:r.l.startsWith('(=)')?900:700,fontFamily:'monospace',color:r.c,fontSize:r.l.startsWith('(=)')?'1.1rem':'0.95rem'}}>
                  {r.neg?'- ':''}{formatCurrency(r.v)}
                </span>
              </div>
            ))}
            <p style={{fontSize:'0.75rem',color:'var(--texto-desab)',marginTop:'0.5rem'}}>* Baseado em dados reais do sistema. Fiado não recebido não está incluído na receita.</p>
          </div>
        </>
      )}
    </div>
  )
}
