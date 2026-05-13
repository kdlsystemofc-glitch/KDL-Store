'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { formatCurrency } from '@/lib/utils'
import { ComoFoiPainel } from '@/components/ComoFoiPainel'

type KPIs = {
  vendasHoje: number; faturamentoHoje: number; ticketMedio: number
  produtosCriticos: number; fiadoAberto: number; despesasMes: number
  comissoesPagar: number; clientesSumidos: number
  vendasSemana: { dia: string; total: number }[]
  totalProdutos: number; totalVendas: number
}

const EMPTY: KPIs = {
  vendasHoje:0, faturamentoHoje:0, ticketMedio:0, produtosCriticos:0,
  fiadoAberto:0, despesasMes:0, comissoesPagar:0, clientesSumidos:0,
  vendasSemana:[], totalProdutos:0, totalVendas:0,
}

export default function DashboardPage() {
  const { empresaId, loading: loadingEmpresa } = useEmpresaId()
  const [kpis,    setKpis]    = useState<KPIs>(EMPTY)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (empresaId) carregar(empresaId) }, [empresaId])

  async function carregar(eid: string) {
    setLoading(true)
    const supabase = createClient()
    const hoje = new Date().toISOString().slice(0,10)
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

    const results = await Promise.allSettled([
      supabase.from('vendas').select('total').eq('empresa_id', eid).gte('criado_em', hoje).eq('status','concluida'),
      supabase.from('produtos').select('id,qtd_atual,qtd_minima').eq('empresa_id', eid).gt('qtd_minima',0),
      supabase.from('fiados').select('valor_aberto').eq('empresa_id', eid).eq('status','aberto'),
      supabase.from('despesas').select('valor').eq('empresa_id', eid).gte('data', inicioMes.slice(0,10)),
      supabase.from('vendas').select('criado_em,total').eq('empresa_id', eid).eq('status','concluida')
        .gte('criado_em', new Date(Date.now()-6*86400000).toISOString()).order('criado_em'),
      supabase.from('clientes').select('ultima_compra').eq('empresa_id', eid).eq('ativo',true),
      supabase.from('empresas').select('crm_prazo_inatividade_dias').eq('id', eid).single(),
      supabase.from('produtos').select('*', { count: 'exact', head: true }).eq('empresa_id', eid),
      supabase.from('vendas').select('*', { count: 'exact', head: true }).eq('empresa_id', eid),
    ])

    const getRes = (i: number): any => results[i].status === 'fulfilled' ? (results[i] as PromiseFulfilledResult<any>).value || {} : {}

    const { data: vendasHoje }    = getRes(0)
    const { data: todosProdutos } = getRes(1)
    const { data: fiados }        = getRes(2)
    const { data: despesas }      = getRes(3)
    const { data: vendasSemana }  = getRes(4)
    const { data: clientes }      = getRes(5)
    const { data: empresaData }   = getRes(6)
    const { count: totalProdutos} = getRes(7)
    const { count: totalVendas }  = getRes(8)

    const criticos   = (todosProdutos||[]).filter((p: any) => p.qtd_atual <= p.qtd_minima)
    const totalHoje  = (vendasHoje||[]).reduce((a: number, v: any) => a + (v.total||0), 0)
    const qtdHoje    = (vendasHoje||[]).length
    const fiadoTotal = (fiados||[]).reduce((a: number, f: any) => a + (f.valor_aberto||0), 0)
    const despTotal  = (despesas||[]).reduce((a: number, d: any) => a + (d.valor||0), 0)
    const prazo      = empresaData?.crm_prazo_inatividade_dias || 60
    const limiteData = new Date(Date.now() - prazo * 86400000).toISOString().slice(0,10)
    const sumidos    = (clientes||[]).filter((c: any) => !c.ultima_compra || c.ultima_compra < limiteData).length

    const porDia: Record<string,number> = {}
    ;(vendasSemana||[]).forEach((v: any) => { const d = v.criado_em.slice(0,10); porDia[d]=(porDia[d]||0)+v.total })
    const dias = Array.from({length:7},(_,i)=>{
      const d = new Date(Date.now()-(6-i)*86400000).toISOString().slice(0,10)
      return { dia: new Date(d+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'short'}).toUpperCase().replace('.',''), total: porDia[d]||0 }
    })

    setKpis({
      vendasHoje: qtdHoje, faturamentoHoje: totalHoje,
      ticketMedio: qtdHoje > 0 ? totalHoje/qtdHoje : 0,
      produtosCriticos: (criticos||[]).length,
      fiadoAberto: fiadoTotal, despesasMes: despTotal, comissoesPagar: 0, clientesSumidos: sumidos,
      vendasSemana: dias, totalProdutos: totalProdutos||0, totalVendas: totalVendas||0,
    })
    setLoading(false)
  }

  const maxVenda = Math.max(...kpis.vendasSemana.map(d=>d.total), 1)

  if (loadingEmpresa || loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',flexDirection:'column',gap:'0.75rem'}}>
      <div style={{fontFamily:'monospace',color:'var(--verde)',fontSize:'0.8rem',letterSpacing:'0.08em'}}>
        CARREGANDO DADOS<span className="blink">_</span>
      </div>
      <div style={{width:'180px',height:'2px',background:'var(--borda)',borderRadius:'1px',overflow:'hidden'}}>
        <div style={{height:'100%',background:'var(--verde)',animation:'slideIn 1.2s ease-in-out infinite alternate',width:'60%'}}/>
      </div>
    </div>
  )

  return (
    <div className="anim-fade" style={{display:'flex',flexDirection:'column',gap:'0.875rem'}}>

      {/* ── ONBOARDING ── */}
      {kpis.totalProdutos === 0 && (
        <div style={{border:'1px solid var(--borda-forte)',borderLeft:'3px solid var(--verde)',background:'var(--surface)',padding:'1rem'}}>
          <p style={{fontWeight:700,fontSize:'0.82rem',color:'var(--verde)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'0.625rem'}}>
            ▶ CONFIGURAÇÃO INICIAL — PRIMEIROS PASSOS
          </p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.625rem'}}>
            {[
              {n:'01', titulo:'CADASTRAR PRODUTO', desc:'Adicione o que você vende ao estoque', href:'/produtos'},
              {n:'02', titulo:'PRIMEIRA VENDA', desc:'Registre uma venda no PDV para testar', href:'/vendas/nova'},
              {n:'03', titulo:'FORNECEDORES', desc:'Cadastre de quem você compra', href:'/fornecedores'},
            ].map(p => (
              <Link key={p.n} href={p.href} style={{textDecoration:'none',display:'block',border:'1px solid var(--borda)',padding:'0.75rem',background:'var(--surface-alt)',color:'var(--texto)',transition:'border-color 0.1s'}}>
                <p style={{color:'var(--verde-muted)',fontSize:'0.65rem',fontWeight:700,letterSpacing:'0.1em',marginBottom:'4px'}}>PASSO {p.n}</p>
                <p style={{fontWeight:700,fontSize:'0.78rem',color:'var(--verde)',marginBottom:'3px'}}>{p.titulo}</p>
                <p style={{fontSize:'0.7rem',color:'var(--texto-desab)'}}>{p.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── CABEÇALHO ── */}
      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">DASHBOARD — PAINEL GERAL</h1>
          <p className="pg-sub">{new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'}).toUpperCase()}</p>
        </div>
        <Link href="/vendas/nova" className="btn btn-primary" style={{fontSize:'0.78rem'}}>
          ⚡ NOVA VENDA
        </Link>
      </div>

      {/* ── PAINEL COMO FOI ── */}
      <ComoFoiPainel />

      {/* ── KPIs OPERACIONAIS ── */}
      <div>
        <p style={{fontSize:'0.65rem',fontWeight:700,color:'var(--texto-desab)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'0.5rem'}}>
          ══ ALERTAS OPERACIONAIS ══
        </p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'0.5rem'}}>
          {[
            {label:'ESTQ. CRÍTICO',  valor:String(kpis.produtosCriticos), suf:'produtos', cor:kpis.produtosCriticos>0?'var(--vermelho)':'var(--verde)', dot:kpis.produtosCriticos>0?'var(--vermelho)':'var(--verde)', href:'/estoque'},
            {label:'FIADO ABERTO',   valor:formatCurrency(kpis.fiadoAberto), suf:'pendente', cor:kpis.fiadoAberto>0?'var(--amarelo)':'var(--verde)', dot:kpis.fiadoAberto>0?'var(--amarelo)':'var(--verde)', href:'/financeiro/fiado'},
            {label:'DESP. MÊS',      valor:formatCurrency(kpis.despesasMes), suf:'este mês', cor:'var(--texto)', dot:'var(--azul)', href:'/financeiro/despesas'},
            {label:'CLI. SUMIDOS',   valor:String(kpis.clientesSumidos), suf:'inativos', cor:kpis.clientesSumidos>0?'var(--amarelo)':'var(--verde)', dot:kpis.clientesSumidos>0?'var(--amarelo)':'var(--verde)', href:'/clientes'},
          ].map(k => (
            <Link key={k.label} href={k.href} style={{textDecoration:'none',display:'block',border:'1px solid var(--borda)',borderTop:'2px solid var(--borda-forte)',background:'var(--surface)',padding:'0.75rem',color:'inherit',transition:'border-color 0.1s'}}>
              <div style={{display:'flex',alignItems:'center',gap:'0.35rem',marginBottom:'0.35rem'}}>
                <span style={{color:k.dot,fontSize:'0.55rem'}}>●</span>
                <p style={{fontSize:'0.6rem',color:'var(--texto-desab)',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em'}}>{k.label}</p>
              </div>
              <p style={{fontWeight:700,fontSize:'1.1rem',color:k.cor,lineHeight:1,fontVariantNumeric:'tabular-nums'}}>{k.valor}</p>
              <p style={{fontSize:'0.62rem',color:'var(--texto-desab)',marginTop:'2px'}}>{k.suf}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* ── GRÁFICO BARRAS — ASCII style ── */}
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div className="sec-header">
          <span>VENDAS — ÚLTIMOS 7 DIAS</span>
          <Link href="/relatorios" style={{fontSize:'0.65rem',color:'var(--verde-muted)',textDecoration:'none'}}>VER RELATÓRIO ▶</Link>
        </div>
        <div style={{padding:'0.875rem'}}>
          {kpis.vendasSemana.length === 0 ? (
            <p style={{fontSize:'0.72rem',color:'var(--texto-desab)',textAlign:'center',padding:'1rem 0'}}>Nenhuma venda nos últimos 7 dias.</p>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:'0.375rem'}}>
              {[...kpis.vendasSemana].reverse().map((d,i) => {
                const pct = Math.max((d.total/maxVenda)*100, d.total>0?2:0)
                const isToday = i === 0
                return (
                  <div key={d.dia} style={{display:'flex',alignItems:'center',gap:'0.625rem'}}>
                    <p style={{width:'30px',fontSize:'0.65rem',fontWeight:700,color:isToday?'var(--verde)':'var(--texto-desab)',flexShrink:0,textAlign:'right'}}>{d.dia}</p>
                    <div style={{flex:1,height:'16px',background:'var(--surface-alt)',border:'1px solid var(--borda-leve)',position:'relative',borderRadius:'1px',overflow:'hidden'}}>
                      <div style={{
                        position:'absolute',left:0,top:0,bottom:0,
                        width:`${pct}%`,
                        background: isToday ? 'var(--verde)' : 'var(--verde-muted)',
                        transition:'width 0.4s ease',
                        borderRight: pct > 0 ? '2px solid var(--verde-brilho)' : 'none',
                      }}/>
                      {/* ASCII fill for empty */}
                      {d.total === 0 && (
                        <p style={{position:'absolute',left:'4px',top:0,bottom:0,display:'flex',alignItems:'center',fontSize:'0.55rem',color:'var(--borda-forte)',letterSpacing:'2px'}}>
                          {'░'.repeat(20)}
                        </p>
                      )}
                    </div>
                    <p style={{width:'90px',fontSize:'0.68rem',fontWeight:700,color:d.total>0?'var(--texto-mono)':'var(--texto-desab)',flexShrink:0,textAlign:'right',fontVariantNumeric:'tabular-nums'}}>
                      {d.total > 0 ? formatCurrency(d.total) : '—'}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── AÇÕES RÁPIDAS ── */}
      <div>
        <p style={{fontSize:'0.65rem',fontWeight:700,color:'var(--texto-desab)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'0.5rem'}}>
          ══ ACESSO RÁPIDO ══
        </p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'0.5rem'}}>
          {[
            {href:'/vendas/nova',            label:'NOVA VENDA',     desc:'Frente de caixa',      prefix:'[F2]'},
            {href:'/financeiro/fiado',       label:'VER FIADO',      desc:formatCurrency(kpis.fiadoAberto)+' aberto', prefix:'[  ]'},
            {href:'/financeiro/despesas',    label:'LANÇAR DESP.',   desc:'Registrar saída',      prefix:'[  ]'},
            {href:'/financeiro/fechamento',  label:'FECHAR CAIXA',   desc:'Conferência do dia',   prefix:'[  ]'},
          ].map(a => (
            <Link key={a.href} href={a.href} style={{
              display:'block',padding:'0.625rem 0.75rem',textDecoration:'none',
              border:'1px solid var(--borda)',borderBottom:'2px solid var(--borda-forte)',
              background:'var(--surface-alt)',color:'var(--texto)',
              transition:'border-color 0.08s, background 0.08s',
            }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--verde)';(e.currentTarget as HTMLElement).style.background='var(--verde-claro)'}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--borda)';(e.currentTarget as HTMLElement).style.background='var(--surface-alt)'}}
            >
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <p style={{fontWeight:700,fontSize:'0.72rem',color:'var(--verde)',letterSpacing:'0.04em'}}>{a.label}</p>
                <span style={{fontSize:'0.6rem',color:'var(--texto-desab)'}}>{a.prefix}</span>
              </div>
              <p style={{fontSize:'0.65rem',color:'var(--texto-desab)',marginTop:'2px'}}>{a.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* ── ALERTAS ── */}
      {kpis.produtosCriticos > 0 && (
        <div className="alerta alerta-perigo">
          <span>⚠</span>
          <span><strong>{kpis.produtosCriticos} produto(s)</strong> com estoque abaixo do mínimo.{' '}
            <Link href="/estoque" style={{color:'var(--vermelho)',fontWeight:700}}>VER ESTOQUE ▶</Link>
          </span>
        </div>
      )}
      {kpis.fiadoAberto > 0 && (
        <div className="alerta alerta-aviso">
          <span>●</span>
          <span>{formatCurrency(kpis.fiadoAberto)} em fiado pendente.{' '}
            <Link href="/financeiro/fiado" style={{color:'var(--amarelo)',fontWeight:700}}>COBRAR AGORA ▶</Link>
          </span>
        </div>
      )}
    </div>
  )
}
