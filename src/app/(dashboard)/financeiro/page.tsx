'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { PageTabs } from '@/components/PageTabs'
import { ProOnly } from '@/components/ProOnly'

type PrevMesData = {
  receitaVendas: number
  receitaOS: number
  receita: number
  cmv: number
  brindes: number
  despesas: number
  lucroLiquido: number
}

type DreRow = { l: string; v: number; prev?: number; c: string; neg: boolean; sub: boolean }

export default function FinanceiroPage() {
  const { empresaId } = useEmpresaId()
  const [loading, setLoading]             = useState(true)
  const [mesSel, setMesSel]               = useState(new Date().getMonth())
  const [anoSel, setAnoSel]               = useState(new Date().getFullYear())
  const [receitaVendas, setReceitaVendas] = useState(0)
  const [receitaOS,     setReceitaOS]     = useState(0)
  const [despesas,      setDespesas]      = useState(0)
  const [fiado,         setFiado]         = useState(0)
  const [brindes,       setBrindes]       = useState(0)
  const [cmv,           setCmv]           = useState(0)
  const [despLista,  setDespLista]  = useState<{categoria:string|null;tipo:string;valor:number}[]>([])
  const [formas,     setFormas]     = useState<{forma:string;total:number}[]>([])
  const [diasGraf,   setDiasGraf]   = useState<{dia:string;total:number}[]>([])
  const [prevMes, setPrevMes] = useState<PrevMesData>({
    receitaVendas: 0, receitaOS: 0, receita: 0,
    cmv: 0, brindes: 0, despesas: 0, lucroLiquido: 0
  })

  useEffect(() => { if (empresaId) carregar(empresaId, anoSel, mesSel) }, [empresaId, anoSel, mesSel])

  async function carregar(eid: string, year: number, month: number) {
    setLoading(true)
    const supabase = createClient()

    const inicioMes = new Date(year, month, 1).toISOString().slice(0, 10)
    const fimMes    = new Date(year, month + 1, 0).toISOString().slice(0, 10)

    // Previous month boundaries
    const prevDate   = new Date(year, month - 1, 1)
    const prevYear   = prevDate.getFullYear()
    const prevMonth  = prevDate.getMonth()
    const inicioPrev = new Date(prevYear, prevMonth, 1).toISOString().slice(0, 10)
    const fimPrev    = new Date(prevYear, prevMonth + 1, 0).toISOString().slice(0, 10)

    const inicio15d = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10)

    // Current month queries
    const results = await Promise.allSettled([
      // [0] Vendas do mês
      supabase.from('vendas').select('total,forma_pagamento,criado_em').eq('empresa_id', eid).eq('status','concluida').gte('criado_em', inicioMes).lte('criado_em', fimMes + 'T23:59:59'),
      // [1] Despesas do mês
      supabase.from('despesas').select('categoria,tipo,valor').eq('empresa_id', eid).eq('status','pago').gte('data', inicioMes).lte('data', fimMes),
      // [2] Fiados abertos
      supabase.from('fiados').select('valor_aberto').eq('empresa_id', eid).eq('status','aberto'),
      // [3] Vendas 15 dias para gráfico
      supabase.from('vendas').select('criado_em,total').eq('empresa_id', eid).eq('status','concluida').gte('criado_em', inicio15d),
      // [4] Brindes do mês
      supabase.from('estoque_movimentacoes').select('quantidade,produto_id,produtos(preco_custo)').eq('empresa_id', eid).eq('tipo','brinde').gte('criado_em', inicioMes).lte('criado_em', fimMes + 'T23:59:59'),
      // [5] CMV
      supabase.from('itens_venda').select('quantidade,produtos(preco_custo),vendas!inner(status,empresa_id)').eq('empresa_id', eid).gte('criado_em', inicioMes).lte('criado_em', fimMes + 'T23:59:59').eq('vendas.status','concluida').eq('vendas.empresa_id', eid),
      // [6] OS concluídas/entregues no mês
      supabase.from('ordens_servico').select('valor_servico,valor_pecas,custo_pecas,criado_em').eq('empresa_id', eid).in('status',['concluido','entregue']).gte('criado_em', inicioMes).lte('criado_em', fimMes + 'T23:59:59'),
      // [7] OS 15 dias para gráfico
      supabase.from('ordens_servico').select('valor_servico,valor_pecas,criado_em').eq('empresa_id', eid).in('status',['concluido','entregue']).gte('criado_em', inicio15d),
      // [8] Prev vendas
      supabase.from('vendas').select('total').eq('empresa_id', eid).eq('status','concluida').gte('criado_em', inicioPrev).lte('criado_em', fimPrev + 'T23:59:59'),
      // [9] Prev despesas
      supabase.from('despesas').select('valor').eq('empresa_id', eid).eq('status','pago').gte('data', inicioPrev).lte('data', fimPrev),
      // [10] Prev brindes
      supabase.from('estoque_movimentacoes').select('quantidade,produtos(preco_custo)').eq('empresa_id', eid).eq('tipo','brinde').gte('criado_em', inicioPrev).lte('criado_em', fimPrev + 'T23:59:59'),
      // [11] Prev CMV
      supabase.from('itens_venda').select('quantidade,produtos(preco_custo),vendas!inner(status,empresa_id)').eq('empresa_id', eid).gte('criado_em', inicioPrev).lte('criado_em', fimPrev + 'T23:59:59').eq('vendas.status','concluida').eq('vendas.empresa_id', eid),
      // [12] Prev OS
      supabase.from('ordens_servico').select('valor_servico,valor_pecas,custo_pecas').eq('empresa_id', eid).in('status',['concluido','entregue']).gte('criado_em', inicioPrev).lte('criado_em', fimPrev + 'T23:59:59'),
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
    const { data: prevVendas } = getRes(8)
    const { data: prevDesps }  = getRes(9)
    const { data: prevBrindes }= getRes(10)
    const { data: prevItens }  = getRes(11)
    const { data: prevOS }     = getRes(12)

    // ── Receita Vendas ──────────────────────────────────────────
    const totalReceitaVendas = (vendas||[]).reduce((a: number, v: any) => a + (v.total || 0), 0)

    // ── Receita OS ──────────────────────────────────────────────
    const totalReceitaOS = (osMes||[]).reduce((a: number, os: any) => a + (os.valor_servico || 0) + (os.valor_pecas || 0), 0)

    const totalDesp  = (desps||[]).reduce((a: number, d: any) => a + (d.valor || 0), 0)
    const totalFiado = (fiados||[]).reduce((a: number, f: any) => a + (f.valor_aberto || 0), 0)

    const totalBrindes = (brindesMov||[]).reduce((a: number, m: any) => {
      const prod = m.produtos as any
      const custo = Array.isArray(prod) ? (prod[0]?.preco_custo || 0) : (prod?.preco_custo || 0)
      return a + Math.abs(m.quantidade) * custo
    }, 0)

    const totalCMVVendas = (itensMes||[]).reduce((a: number, iv: any) => {
      const prod = iv.produtos as any
      const custo = Array.isArray(prod) ? (prod[0]?.preco_custo || 0) : (prod?.preco_custo || 0)
      return a + (iv.quantidade || 0) * custo
    }, 0)
    const totalCMVPecasOS = (osMes||[]).reduce((a: number, os: any) => a + (os.custo_pecas || 0), 0)
    const totalCMV = totalCMVVendas + totalCMVPecasOS

    // ── Prev month calculations ──────────────────────────────────
    const prevReceitaVendas = (prevVendas||[]).reduce((a: number, v: any) => a + (v.total || 0), 0)
    const prevReceitaOS     = (prevOS||[]).reduce((a: number, os: any) => a + (os.valor_servico || 0) + (os.valor_pecas || 0), 0)
    const prevReceita       = prevReceitaVendas + prevReceitaOS
    const prevTotalDesp     = (prevDesps||[]).reduce((a: number, d: any) => a + (d.valor || 0), 0)
    const prevTotalBrindes  = (prevBrindes||[]).reduce((a: number, m: any) => {
      const prod = m.produtos as any
      const custo = Array.isArray(prod) ? (prod[0]?.preco_custo || 0) : (prod?.preco_custo || 0)
      return a + Math.abs(m.quantidade) * custo
    }, 0)
    const prevCMVVendas = (prevItens||[]).reduce((a: number, iv: any) => {
      const prod = iv.produtos as any
      const custo = Array.isArray(prod) ? (prod[0]?.preco_custo || 0) : (prod?.preco_custo || 0)
      return a + (iv.quantidade || 0) * custo
    }, 0)
    const prevCMVPecas  = (prevOS||[]).reduce((a: number, os: any) => a + (os.custo_pecas || 0), 0)
    const prevCMV       = prevCMVVendas + prevCMVPecas
    const prevLucro     = prevReceita - prevCMV - prevTotalBrindes - prevTotalDesp

    setPrevMes({
      receitaVendas: prevReceitaVendas,
      receitaOS:     prevReceitaOS,
      receita:       prevReceita,
      cmv:           prevCMV,
      brindes:       prevTotalBrindes,
      despesas:      prevTotalDesp,
      lucroLiquido:  prevLucro,
    })

    setReceitaVendas(totalReceitaVendas)
    setReceitaOS(totalReceitaOS)
    setDespesas(totalDesp)
    setFiado(totalFiado)
    setBrindes(totalBrindes)
    setCmv(totalCMV)
    setDespLista(desps||[])

    // ── Formas de pagamento ─────────────────────────────────────
    const fMap: Record<string,number> = {}
    ;(vendas||[]).forEach((v: any) => { fMap[v.forma_pagamento]=(fMap[v.forma_pagamento]||0)+v.total })
    setFormas(Object.entries(fMap).sort((a,b)=>b[1]-a[1]).map(([forma,total])=>({forma,total})))

    // ── Gráfico 15 dias ─────────────────────────────────────────
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

  function varCalc(atual: number, anterior: number): string {
    if (anterior === 0) return '—'
    const pct = ((atual - anterior) / anterior) * 100
    return (pct > 0 ? '+' : '') + pct.toFixed(1) + '%'
  }
  function varColor(atual: number, anterior: number): string {
    if (anterior === 0) return 'var(--texto-desab)'
    if (atual > anterior) return 'var(--verde)'
    if (atual < anterior) return 'var(--vermelho)'
    return 'var(--texto-desab)'
  }

  const dreRows: DreRow[] = [
    { l: '(+) RECEITA DE VENDAS',        v: receitaVendas,  prev: prevMes.receitaVendas, c: 'var(--verde)',    neg: false, sub: true  },
    { l: '(+) RECEITA DE SERVIÇOS (OS)', v: receitaOS,      prev: prevMes.receitaOS,     c: '#60a5fa',         neg: false, sub: true  },
    { l: '(=) RECEITA BRUTA TOTAL',      v: receita,        prev: prevMes.receita,        c: 'var(--verde)',    neg: false, sub: false },
    { l: '(-) CMV + CUSTO PEÇAS (OS)',    v: cmv,            prev: prevMes.cmv,            c: 'var(--vermelho)', neg: true,  sub: true  },
    { l: '(-) BRINDES CONCEDIDOS',        v: brindes,        prev: prevMes.brindes,        c: 'var(--amarelo)', neg: true,  sub: true  },
    { l: '(-) DESPESAS TOTAIS',           v: despesas,       prev: prevMes.despesas,       c: 'var(--vermelho)', neg: true,  sub: true  },
    { l: '(=) LUCRO LÍQUIDO ESTIMADO',   v: lucroLiquido,   prev: prevMes.lucroLiquido,   c: lucroLiquido >= 0 ? 'var(--verde)' : 'var(--vermelho)', neg: false, sub: false },
  ]

  // Label for selected period
  const periodoLabel = new Date(anoSel, mesSel, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()

  return (
    <div className="anim-fade" style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">FINANCEIRO — VISÃO GERAL</h1>
          <p className="pg-sub">{periodoLabel} · TEMPO REAL</p>
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

      <ProOnly>
      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:'3rem',flexDirection:'column',alignItems:'center',gap:'0.5rem'}}>
          <p style={{color:'var(--verde)',fontSize:'0.75rem',letterSpacing:'0.08em'}}>CARREGANDO DADOS<span className="blink">_</span></p>
        </div>
      ) : (
        <>
          {/* KPIs — 5 cards */}
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

          {/* Gráfico horizontal */}
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

          {/* DRE simplificado — comparativo */}
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <div className="sec-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span>DRE SIMPLIFICADO — {periodoLabel}</span>
            </div>
            <div style={{padding:'0.75rem'}}>
              {/* Month selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--texto-sec)', fontWeight: 700 }}>PERÍODO:</label>
                <select
                  className="campo"
                  style={{ width: 'auto', fontSize: '0.78rem', padding: '0.25rem 0.5rem' }}
                  value={`${anoSel}-${String(mesSel + 1).padStart(2, '0')}`}
                  onChange={e => {
                    const [y, m] = e.target.value.split('-').map(Number)
                    setAnoSel(y)
                    setMesSel(m - 1)
                  }}
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const d = new Date()
                    d.setDate(1)
                    d.setMonth(d.getMonth() - i)
                    return (
                      <option key={i} value={`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`}>
                        {d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}
                      </option>
                    )
                  })}
                </select>
              </div>

              {/* Column headers */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', padding: '0.25rem 0', borderBottom: '1px solid var(--borda-leve)', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--texto-desab)', fontWeight: 700, minWidth: '100px', textAlign: 'right' }}>MÊS ATUAL</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--texto-desab)', fontWeight: 700, minWidth: '80px', textAlign: 'right' }}>MÊS ANT.</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--texto-desab)', fontWeight: 700, minWidth: '48px', textAlign: 'right' }}>VAR.</span>
              </div>

              {dreRows.map(r => (
                <div key={r.l} style={{
                  display:'flex',justifyContent:'space-between',
                  padding:r.sub?'0.25rem 0':'0.4rem 0',
                  borderBottom:`1px ${r.l.startsWith('(=')?'dashed':'solid'} var(--borda-leve)`,
                  ...(r.l==='(=) RECEITA BRUTA TOTAL'||r.l==='(=) LUCRO LÍQUIDO ESTIMADO' ? {background:'rgba(0,0,0,0.15)',padding:'0.4rem 0.5rem',margin:'0 -0.75rem'} : {})
                }}>
                  <span style={{
                    fontWeight:r.l.startsWith('(=')?700:400,
                    fontSize:r.sub?'0.7rem':'0.75rem',
                    letterSpacing:'0.04em',
                    color:r.l.startsWith('(=')?'var(--texto)':'var(--texto-sec)',
                    paddingLeft:r.sub&&!r.l.startsWith('(=')?'0.75rem':'0'
                  }}>{r.l}</span>

                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {/* Current month */}
                    <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: r.l.startsWith('(=)') ? '0.9rem' : '0.8rem', color: r.c, fontWeight: 700, minWidth: '100px', textAlign: 'right' }}>
                      {r.neg ? '- ' : ''}{formatCurrency(r.v)}
                    </span>
                    {/* Previous month */}
                    <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.72rem', color: 'var(--texto-desab)', minWidth: '80px', textAlign: 'right' }}>
                      {r.prev !== undefined ? formatCurrency(r.prev ?? 0) : '—'}
                    </span>
                    {/* Variation */}
                    {r.prev !== undefined && r.prev !== null ? (
                      <span style={{
                        fontSize: '0.65rem', fontWeight: 800, minWidth: '48px', textAlign: 'right',
                        color: varColor(r.v, r.prev)
                      }}>
                        {varCalc(r.v, r.prev)}
                      </span>
                    ) : (
                      <span style={{ minWidth: '48px' }} />
                    )}
                  </div>
                </div>
              ))}
              <p style={{fontSize:'0.62rem',color:'var(--texto-desab)',marginTop:'0.5rem',letterSpacing:'0.03em'}}>* Fiado não recebido e OS em aberto não estão incluídos na receita.</p>
            </div>
          </div>
        </>
      )}
      </ProOnly>
    </div>
  )
}
