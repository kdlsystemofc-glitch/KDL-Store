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
    const results = await Promise.allSettled([
      supabase.from('vendas').select('total,forma_pagamento,criado_em').eq('empresa_id', eid).eq('status','concluida').gte('criado_em', inicioMes),
      supabase.from('despesas').select('categoria,tipo,valor').eq('empresa_id', eid).gte('data', inicioMes),
      supabase.from('fiados').select('valor_aberto').eq('empresa_id', eid).eq('status','aberto'),
      supabase.from('vendas').select('criado_em,total').eq('empresa_id', eid).eq('status','concluida').gte('criado_em', new Date(Date.now()-29*86400000).toISOString()),
      supabase.from('estoque_movimentacoes').select('quantidade,produto_id,produtos(preco_custo)').eq('empresa_id', eid).eq('tipo','brinde').gte('criado_em', inicioMes),
    ])
    const getRes = (i: number): any => results[i].status === 'fulfilled' ? (results[i] as PromiseFulfilledResult<any>).value || {} : {}
    const { data: vendas }     = getRes(0)
    const { data: desps }      = getRes(1)
    const { data: fiados }     = getRes(2)
    const { data: vendasMes }  = getRes(3)
    const { data: brindesMov } = getRes(4)

    const totalReceita = (vendas||[]).reduce((a: number, v: any) => a + (v.total || 0), 0)
    const totalDesp    = (desps||[]).reduce((a: number, d: any) => a + (d.valor || 0), 0)
    const totalFiado   = (fiados||[]).reduce((a: number, f: any) => a + (f.valor_aberto || 0), 0)
    
    // Custo dos brindes = quantidade * preco_custo do produto
    const totalBrindes = (brindesMov||[]).reduce((a: number, m: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prod = m.produtos as any
      const custo = Array.isArray(prod) ? (prod[0]?.preco_custo || 0) : (prod?.preco_custo || 0)
      return a + Math.abs(m.quantidade) * custo
    }, 0)
    setReceita(totalReceita); setDespesas(totalDesp); setFiado(totalFiado); setBrindes(totalBrindes)
    setDespLista(desps||[])

    // Formas
    const fMap: Record<string,number> = {}
    ;(vendas||[]).forEach((v: any)=>{ fMap[v.forma_pagamento]=(fMap[v.forma_pagamento]||0)+v.total })
    setFormas(Object.entries(fMap).sort((a,b)=>b[1]-a[1]).map(([forma,total])=>({forma,total})))

    // Gráfico 30 dias
    const dMap: Record<string,number> = {}
    ;(vendasMes||[]).forEach((v: any)=>{ const d=v.criado_em.slice(0,10); dMap[d]=(dMap[d]||0)+v.total })
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
    <div className="anim-fade" style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">FINANCEIRO — VISÃO GERAL</h1>
          <p className="pg-sub">{new Date().toLocaleDateString('pt-BR',{month:'long',year:'numeric'}).toUpperCase()} · TEMPO REAL</p>
        </div>
        <div style={{display:'flex',gap:'0.375rem'}}>
          <Link href="/financeiro/despesas"  className="btn btn-secondary">+ DESPESA</Link>
          <Link href="/financeiro/fechamento" className="btn btn-primary">■ FECHAR CAIXA</Link>
        </div>
      </div>

      <PageTabs tabs={[
        { label: 'Visão Geral (DRE)', href: '/financeiro' },
        { label: 'Despesas', href: '/financeiro/despesas' },
        { label: 'Fiados 📒', href: '/financeiro/fiado' },
        { label: 'Fechamento de Caixa', href: '/financeiro/fechamento' }
      ]} />

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:'3rem',flexDirection:'column',alignItems:'center',gap:'0.5rem'}}>
          <p style={{color:'var(--verde)',fontSize:'0.75rem',letterSpacing:'0.08em'}}>CARREGANDO DADOS<span className="blink">_</span></p>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'0.5rem'}}>
            {[
              {l:'RECEITA MÊS',   v:formatCurrency(receita),  dot:'var(--verde)',    c:'var(--verde)'},
              {l:'DESPESAS MÊS',  v:formatCurrency(despesas), dot:'var(--vermelho)', c:'var(--vermelho)'},
              {l:'LUCRO ESTIM.',   v:formatCurrency(lucro),    dot:lucro>=0?'var(--verde)':'var(--vermelho)', c:lucro>=0?'var(--verde)':'var(--vermelho)'},
              {l:'FIADO ABERTO',   v:formatCurrency(fiado),    dot:fiado>0?'var(--amarelo)':'var(--verde)', c:fiado>0?'var(--amarelo)':'var(--verde)'},
            ].map(k=>(
              <div key={k.l} className="kpi-card">
                <div style={{display:'flex',alignItems:'center',gap:'0.35rem'}}>
                  <span style={{color:k.dot,fontSize:'0.55rem'}}>●</span>
                  <p className="kpi-label">{k.l}</p>
                </div>
                <p className="kpi-valor" style={{color:k.c,fontSize:'1.1rem'}}>{k.v}</p>
                {k.l==='LUCRO ESTIM.'&&<p className="kpi-sub">MARGEM: {margem}%</p>}
              </div>
            ))}
          </div>

          {/* Gráfico horizontal ASCII */}
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <div className="sec-header"><span>FATURAMENTO — ÚLTIMOS 15 DIAS</span></div>
            <div style={{padding:'0.75rem'}}>
              {diasGraf.every(d=>d.total===0) ? (
                <p style={{color:'var(--texto-desab)',fontSize:'0.72rem',textAlign:'center',padding:'1rem',letterSpacing:'0.06em'}}>[ NENHUMA VENDA NO PERÍODO ]</p>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:'0.3rem'}}>
                  {[...diasGraf].reverse().slice(0,8).map((d,i)=>(
                    <div key={d.dia} style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                      <p style={{width:'36px',fontSize:'0.6rem',color:i===0?'var(--verde)':'var(--texto-desab)',flexShrink:0,textAlign:'right',fontVariantNumeric:'tabular-nums'}}>{d.dia}</p>
                      <div style={{flex:1,height:'14px',background:'var(--surface-alt)',border:'1px solid var(--borda-leve)',position:'relative',overflow:'hidden'}}>
                        <div style={{position:'absolute',left:0,top:0,bottom:0,width:`${Math.max((d.total/maxGraf)*100,d.total>0?2:0)}%`,background:i===0?'var(--verde)':'var(--verde-muted)',borderRight:d.total>0?'2px solid var(--verde-brilho)':'none'}}/>
                      </div>
                      <p style={{width:'80px',fontSize:'0.65rem',fontWeight:700,color:d.total>0?'var(--texto-mono)':'var(--texto-desab)',textAlign:'right',flexShrink:0,fontVariantNumeric:'tabular-nums'}}>
                        {d.total>0?formatCurrency(d.total):'—'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.625rem'}}>
            {/* Formas de pagamento */}
            <div className="card" style={{padding:0,overflow:'hidden'}}>
              <div className="sec-header"><span>POR FORMA DE PAGAMENTO</span></div>
              <div style={{padding:'0.625rem'}}>
                {formas.length===0 ? <p style={{color:'var(--texto-desab)',fontSize:'0.72rem',padding:'0.5rem 0',letterSpacing:'0.04em'}}>[ NENHUMA VENDA ESTE MÊS ]</p> : formas.map(({forma,total})=>(
                  <div key={forma} style={{marginBottom:'0.5rem'}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'3px'}}>
                      <span style={{fontWeight:700,fontSize:'0.72rem',color:'var(--texto)',textTransform:'uppercase',letterSpacing:'0.04em'}}>{forma}</span>
                      <span style={{fontWeight:700,fontSize:'0.72rem',color:'var(--verde)',fontVariantNumeric:'tabular-nums'}}>{formatCurrency(total)}</span>
                    </div>
                    <div style={{height:'6px',background:'var(--surface-alt)',border:'1px solid var(--borda-leve)',overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${(total/receita)*100}%`,background:'var(--verde)'}}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Despesas por categoria */}
            <div className="card" style={{padding:0,overflow:'hidden'}}>
              <div className="sec-header"><span>DESPESAS POR CATEGORIA</span></div>
              <div style={{padding:'0.625rem'}}>
                {despLista.length===0 ? (
                  <div style={{padding:'0.5rem 0'}}>
                    <p style={{color:'var(--texto-desab)',fontSize:'0.72rem',marginBottom:'0.5rem',letterSpacing:'0.04em'}}>[ NENHUMA DESPESA ESTE MÊS ]</p>
                    <Link href="/financeiro/despesas" className="btn btn-secondary" style={{fontSize:'0.65rem'}}>+ LANÇAR DESPESA</Link>
                  </div>
                ) : Object.entries(despLista.reduce((acc,d)=>{
                    const k=d.categoria||'Outros'; acc[k]=(acc[k]||0)+d.valor; return acc
                  },{} as Record<string,number>)).sort((a,b)=>b[1]-a[1]).map(([cat,val])=>(
                  <div key={cat} style={{display:'flex',justifyContent:'space-between',padding:'0.3rem 0',borderBottom:'1px solid var(--borda-leve)'}}>
                    <span style={{fontSize:'0.72rem',textTransform:'uppercase',letterSpacing:'0.04em'}}>{cat}</span>
                    <span style={{fontWeight:700,fontSize:'0.72rem',color:'var(--vermelho)',fontVariantNumeric:'tabular-nums'}}>{formatCurrency(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* DRE simplificado */}
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <div className="sec-header"><span>DRE SIMPLIFICADO — {new Date().toLocaleDateString('pt-BR',{month:'long',year:'numeric'}).toUpperCase()}</span></div>
            <div style={{padding:'0.75rem'}}>
              {[
                {l:'(+) RECEITA DE VENDAS',      v:receita,                   c:'var(--verde)',    neg:false},
                {l:'(-) BRINDES CONCEDIDOS',      v:brindes,                   c:'var(--amarelo)', neg:true},
                {l:'(-) DESPESAS TOTAIS',         v:despesas,                  c:'var(--vermelho)',neg:true},
                {l:'(=) LUCRO LÍQUIDO ESTIMADO',  v:receita-brindes-despesas, c:(receita-brindes-despesas)>=0?'var(--verde)':'var(--vermelho)', neg:false},
              ].map(r=>(
                <div key={r.l} style={{display:'flex',justifyContent:'space-between',padding:'0.375rem 0',borderBottom:`1px ${r.l.startsWith('(=)')?'dashed':'solid'} var(--borda-leve)`}}>
                  <span style={{fontWeight:r.l.startsWith('(=)')?700:400,fontSize:'0.72rem',letterSpacing:'0.04em',color:r.l.startsWith('(=)')?'var(--texto)':'var(--texto-sec)'}}>{r.l}</span>
                  <span style={{fontWeight:700,color:r.c,fontVariantNumeric:'tabular-nums',fontSize:r.l.startsWith('(=)')?'1rem':'0.82rem'}}>
                    {r.neg?'- ':''}{formatCurrency(r.v)}
                  </span>
                </div>
              ))}
              <p style={{fontSize:'0.62rem',color:'var(--texto-desab)',marginTop:'0.5rem',letterSpacing:'0.03em'}}>* Fiado não recebido não está incluído na receita.</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
