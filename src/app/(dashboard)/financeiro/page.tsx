'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { formatCurrency } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { PageTabs } from '@/components/PageTabs'
import { ProOnly } from '@/components/ProOnly'

export default function FinanceiroPage() {
  const { empresaId } = useEmpresaId()
  const [loading, setLoading]       = useState(true)
  const [receitaVendas, setReceitaVendas] = useState(0)
  const [receitaOS,     setReceitaOS]     = useState(0)
  const [despesas,      setDespesas]      = useState(0)
  const [fiado,         setFiado]         = useState(0)
  const [brindes,       setBrindes]       = useState(0)
  const [cmv,           setCmv]           = useState(0)
  const [despLista,  setDespLista]  = useState<{categoria:string|null;tipo:string;valor:number}[]>([])
  const [formas,     setFormas]     = useState<{forma:string;total:number}[]>([])
  const [diasGraf,   setDiasGraf]   = useState<{dia:string;total:number}[]>([])

  useEffect(() => { if (empresaId) carregar(empresaId) }, [empresaId])

  async function carregar(eid: string) {
    setLoading(true)
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10)
    const inicio15d = new Date(Date.now()-14*86400000).toISOString().slice(0,10)
    const supabase  = createClient()

    const results = await Promise.allSettled([
      // [0] Vendas do mês
      supabase.from('vendas').select('total,forma_pagamento,criado_em').eq('empresa_id', eid).eq('status','concluida').gte('criado_em', inicioMes),
      // [1] Despesas do mês
      supabase.from('despesas').select('categoria,tipo,valor').eq('empresa_id', eid).gte('data', inicioMes),
      // [2] Fiados abertos
      supabase.from('fiados').select('valor_aberto').eq('empresa_id', eid).eq('status','aberto'),
      // [3] Vendas 15 dias para gráfico
      supabase.from('vendas').select('criado_em,total').eq('empresa_id', eid).eq('status','concluida').gte('criado_em', inicio15d),
      // [4] Brindes do mês
      supabase.from('estoque_movimentacoes').select('quantidade,produto_id,produtos(preco_custo)').eq('empresa_id', eid).eq('tipo','brinde').gte('criado_em', inicioMes),
      // [5] CMV — custo de mercadoria vendida no mês
      supabase.from('itens_venda').select('quantidade,produtos(preco_custo)').eq('empresa_id', eid).gte('criado_em', inicioMes),
      // [6] OS concluídas/entregues no mês (faturamento de serviços)
      supabase.from('ordens_servico').select('valor_servico,valor_pecas,criado_em').eq('empresa_id', eid).in('status',['concluido','entregue']).gte('criado_em', inicioMes),
      // [7] OS 15 dias para gráfico
      supabase.from('ordens_servico').select('valor_servico,valor_pecas,criado_em').eq('empresa_id', eid).in('status',['concluido','entregue']).gte('criado_em', inicio15d),
    ])

    const getRes = (i: number): any => results[i].status === 'fulfilled' ? (results[i] as PromiseFulfilledResult<any>).value || {} : {}
    const { data: vendas }     = getRes(0)
    const { data: desps }      = getRes(1)
    const { data: fiados }     = getRes(2)
    const { data: vendasMes }  = getRes(3)
    const { data: brindesMov } = getRes(4)
    const { data: itensMes }   = getRes(5)
    const { data: osMes }      = getRes(6)
    const { data: os15d }      = getRes(7)

    // ── Receita Vendas ──────────────────────────────────────────
    const totalReceitaVendas = (vendas||[]).reduce((a: number, v: any) => a + (v.total || 0), 0)

    // ── Receita OS = valor_servico + valor_pecas ─────────────────
    const totalReceitaOS = (osMes||[]).reduce((a: number, os: any) => {
      return a + (os.valor_servico || 0) + (os.valor_pecas || 0)
    }, 0)

    const totalDesp    = (desps||[]).reduce((a: number, d: any) => a + (d.valor || 0), 0)
    const totalFiado   = (fiados||[]).reduce((a: number, f: any) => a + (f.valor_aberto || 0), 0)

    // Custo dos brindes
    const totalBrindes = (brindesMov||[]).reduce((a: number, m: any) => {
      const prod = m.produtos as any
      const custo = Array.isArray(prod) ? (prod[0]?.preco_custo || 0) : (prod?.preco_custo || 0)
      return a + Math.abs(m.quantidade) * custo
    }, 0)

    // CMV = soma de (quantidade × preco_custo)
    const totalCMV = (itensMes||[]).reduce((a: number, iv: any) => {
      const prod = iv.produtos as any
      const custo = Array.isArray(prod) ? (prod[0]?.preco_custo || 0) : (prod?.preco_custo || 0)
      return a + (iv.quantidade || 0) * custo
    }, 0)

    setReceitaVendas(totalReceitaVendas)
    setReceitaOS(totalReceitaOS)
    setDespesas(totalDesp)
    setFiado(totalFiado)
    setBrindes(totalBrindes)
    setCmv(totalCMV)
    setDespLista(desps||[])

    // ── Formas de pagamento (apenas vendas) ─────────────────────
    const fMap: Record<string,number> = {}
    ;(vendas||[]).forEach((v: any)=>{ fMap[v.forma_pagamento]=(fMap[v.forma_pagamento]||0)+v.total })
    setFormas(Object.entries(fMap).sort((a,b)=>b[1]-a[1]).map(([forma,total])=>({forma,total})))

    // ── Gráfico 15 dias (Vendas + OS combinadas) ─────────────────
    const dMap: Record<string,number> = {}
    ;(vendasMes||[]).forEach((v: any)=>{ const d=v.criado_em.slice(0,10); dMap[d]=(dMap[d]||0)+v.total })
    ;(os15d||[]).forEach((os: any)=>{ const d=os.criado_em.slice(0,10); dMap[d]=(dMap[d]||0)+(os.valor_servico||0)+(os.valor_pecas||0) })

    const g = Array.from({length:15},(_,i)=>{
      const d = new Date(Date.now()-(14-i)*86400000).toISOString().slice(0,10)
      return { dia:new Date(d+'T12:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}), total:dMap[d]||0 }
    })
    setDiasGraf(g)
    setLoading(false)
  }

  const receita      = receitaVendas + receitaOS
  const lucroLiquido = receita - cmv - brindes - despesas
  const margem       = receita > 0 ? ((lucroLiquido/receita)*100).toFixed(1) : '0.0'
  const maxGraf      = Math.max(...diasGraf.map(d=>d.total), 1)

  return (
    <ProOnly>
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
          {/* KPIs — 5 cards (incluindo OS) */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'0.5rem'}}>
            {[
              {l:'RECEITA TOTAL',    v:formatCurrency(receita),          dot:'var(--verde)',    c:'var(--verde)'},
              {l:'VENDAS',          v:formatCurrency(receitaVendas),    dot:'var(--verde)',    c:'var(--texto-mono)'},
              {l:'SERVIÇOS (OS)',   v:formatCurrency(receitaOS),        dot:'#60a5fa',         c:'#60a5fa'},
              {l:'DESPESAS MÊS',   v:formatCurrency(despesas),         dot:'var(--vermelho)', c:'var(--vermelho)'},
              {l:'LUCRO ESTIM.',    v:formatCurrency(lucroLiquido),      dot:lucroLiquido>=0?'var(--verde)':'var(--vermelho)', c:lucroLiquido>=0?'var(--verde)':'var(--vermelho)'},
            ].map(k=>(
              <div key={k.l} className="kpi-card">
                <div style={{display:'flex',alignItems:'center',gap:'0.35rem'}}>
                  <span style={{color:k.dot,fontSize:'0.55rem'}}>●</span>
                  <p className="kpi-label">{k.l}</p>
                </div>
                <p className="kpi-valor" style={{color:k.c,fontSize:'1rem'}}>{k.v}</p>
                {k.l==='LUCRO ESTIM.'&&<p className="kpi-sub">MARGEM: {margem}%</p>}
                {k.l==='FIADO ABERTO'&&fiado>0&&<p className="kpi-sub" style={{color:'var(--amarelo)'}}>PENDENTE RECEBER</p>}
              </div>
            ))}
          </div>

          {/* Fiado separado como alerta */}
          {fiado > 0 && (
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0.5rem 0.75rem',background:'rgba(234,179,8,0.08)',border:'1px solid rgba(234,179,8,0.3)',borderRadius:'4px'}}>
              <span style={{fontSize:'0.72rem',color:'var(--amarelo)',letterSpacing:'0.06em',fontWeight:700}}>📒 FIADO ABERTO — PENDENTE RECEBER</span>
              <span style={{fontSize:'0.82rem',fontWeight:700,color:'var(--amarelo)',fontVariantNumeric:'tabular-nums'}}>{formatCurrency(fiado)}</span>
            </div>
          )}

          {/* Gráfico horizontal — Faturamento total (Vendas + OS) */}
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <div className="sec-header"><span>FATURAMENTO TOTAL (VENDAS + OS) — ÚLTIMOS 15 DIAS</span></div>
            <div style={{padding:'0.75rem'}}>
              {diasGraf.every(d=>d.total===0) ? (
                <p style={{color:'var(--texto-desab)',fontSize:'0.72rem',textAlign:'center',padding:'1rem',letterSpacing:'0.06em'}}>[ NENHUM FATURAMENTO NO PERÍODO ]</p>
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
                      <div style={{height:'100%',width:`${receitaVendas>0?(total/receitaVendas)*100:0}%`,background:'var(--verde)'}}/>
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

          {/* DRE simplificado — agora com Vendas e OS desdobradas */}
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <div className="sec-header"><span>DRE SIMPLIFICADO — {new Date().toLocaleDateString('pt-BR',{month:'long',year:'numeric'}).toUpperCase()}</span></div>
            <div style={{padding:'0.75rem'}}>
              {[
                {l:'(+) RECEITA DE VENDAS',          v:receitaVendas,   c:'var(--verde)',     neg:false, sub:true},
                {l:'(+) RECEITA DE SERVIÇOS (OS)',    v:receitaOS,       c:'#60a5fa',          neg:false, sub:true},
                {l:'(=) RECEITA BRUTA TOTAL',         v:receita,         c:'var(--verde)',     neg:false, sub:false},
                {l:'(-) CMV (CUSTO MERCADORIA)',       v:cmv,             c:'var(--vermelho)',  neg:true,  sub:true},
                {l:'(-) BRINDES CONCEDIDOS',           v:brindes,         c:'var(--amarelo)',  neg:true,  sub:true},
                {l:'(-) DESPESAS TOTAIS',              v:despesas,        c:'var(--vermelho)', neg:true,  sub:true},
                {l:'(=) LUCRO LÍQUIDO ESTIMADO',       v:lucroLiquido,    c:lucroLiquido>=0?'var(--verde)':'var(--vermelho)', neg:false, sub:false},
              ].map(r=>(
                <div key={r.l} style={{
                  display:'flex',justifyContent:'space-between',
                  padding:r.sub?'0.25rem 0':'0.4rem 0',
                  borderBottom:`1px ${r.l.startsWith('(=)')?'dashed':'solid'} var(--borda-leve)`,
                  ...(r.l==='(=) RECEITA BRUTA TOTAL'||r.l==='(=) LUCRO LÍQUIDO ESTIMADO' ? {background:'rgba(0,0,0,0.15)',padding:'0.4rem 0.5rem',margin:'0 -0.75rem'} : {})
                }}>
                  <span style={{
                    fontWeight:r.l.startsWith('(=)')?700:400,
                    fontSize:r.sub?'0.7rem':'0.75rem',
                    letterSpacing:'0.04em',
                    color:r.l.startsWith('(=)')?'var(--texto)':'var(--texto-sec)',
                    paddingLeft:r.sub&&!r.l.startsWith('(=)')?'0.75rem':'0'
                  }}>{r.l}</span>
                  <span style={{fontWeight:700,color:r.c,fontVariantNumeric:'tabular-nums',fontSize:r.l.startsWith('(=)')?'0.9rem':'0.8rem'}}>
                    {r.neg?'- ':''}{formatCurrency(r.v)}
                  </span>
                </div>
              ))}
              <p style={{fontSize:'0.62rem',color:'var(--texto-desab)',marginTop:'0.5rem',letterSpacing:'0.03em'}}>* Fiado não recebido e OS em aberto não estão incluídos na receita.</p>
            </div>
          </div>
        </>
      )}
    </div>
    </ProOnly>
  )
}
