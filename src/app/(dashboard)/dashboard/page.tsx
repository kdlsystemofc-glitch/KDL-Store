'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { formatCurrency } from '@/lib/utils'
import { ComoFoiPainel } from '@/components/ComoFoiPainel'
import { useSubscription } from '@/hooks/useSubscription'
import { OperadorOnly } from '@/components/OperadorOnly'

type KPIs = {
  vendasHoje: number; faturamentoHoje: number; ticketMedio: number
  produtosCriticos: number; fiadoAberto: number; fiadosVencidos: number; despesasMes: number
  comissoesPagar: number; clientesSumidos: number
  vendasSemana: { dia: string; total: number }[]
  totalProdutos: number; totalVendas: number
}

const EMPTY: KPIs = {
  vendasHoje:0, faturamentoHoje:0, ticketMedio:0, produtosCriticos:0,
  fiadoAberto:0, fiadosVencidos:0, despesasMes:0, comissoesPagar:0, clientesSumidos:0,
  vendasSemana:[], totalProdutos:0, totalVendas:0,
}

export default function DashboardPage() {
  const { empresaId, loading: loadingEmpresa } = useEmpresaId()
  const [kpis,    setKpis]    = useState<KPIs>(EMPTY)
  const [loading, setLoading] = useState(true)
  const { plano } = useSubscription()
  const isPro = plano === 'pro'

  useEffect(() => { if (empresaId) carregar(empresaId) }, [empresaId])

  async function carregar(eid: string) {
    setLoading(true)
    const supabase = createClient()
    const hoje = new Date().toISOString().slice(0,10)
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

    const results = await Promise.allSettled([
      supabase.from('vendas').select('total').eq('empresa_id', eid).gte('criado_em', hoje).eq('status','concluida'),
      supabase.from('produtos').select('id,qtd_atual,qtd_minima').eq('empresa_id', eid).gt('qtd_minima',0),
      supabase.from('fiados').select('valor_aberto, data_vencimento').eq('empresa_id', eid).eq('status','aberto'),
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
    const fiadosVencidos = (fiados||[]).filter((f: any) => f.data_vencimento && f.data_vencimento < hoje).length
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
      fiadoAberto: fiadoTotal, fiadosVencidos, despesasMes: despTotal, comissoesPagar: 0, clientesSumidos: sumidos,
      vendasSemana: dias, totalProdutos: totalProdutos||0, totalVendas: totalVendas||0,
    })
    setLoading(false)
  }

  const maxVenda = Math.max(...kpis.vendasSemana.map(d=>d.total), 1)

  if (loadingEmpresa || loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',flexDirection:'column',gap:'1rem'}}>
      <div style={{width:'36px',height:'36px',border:'3px solid #e5e5e5',borderTopColor:'#1a7a3c',borderRadius:'50%',animation:'spin 0.8s linear infinite'}} />
      <p style={{color:'#555555',fontSize:'0.85rem'}}>Carregando dados...</p>
    </div>
  )


  return (
    <div className="anim-fade" style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
      {kpis.totalProdutos === 0 && (
        <div style={{border:'1px solid #a8d5ba',borderLeft:'4px solid #1a7a3c',background:'#e8f5ee',padding:'1rem',borderRadius:'4px'}}>
          <p style={{fontWeight:700,fontSize:'0.9rem',color:'#0f4d25',marginBottom:'0.75rem'}}>
            Bem-vindo! Configure sua loja nos primeiros passos:
          </p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.75rem'}}>
            {[
              {n:'1', titulo:'Cadastrar Produto', desc:'Adicione o que você vende ao estoque', href:'/produtos'},
              {n:'2', titulo:'Primeira Venda', desc:'Registre uma venda no PDV para testar', href:'/vendas/nova'},
              {n:'3', titulo:'Fornecedores', desc:'Cadastre de quem você compra', href:'/fornecedores'},
            ].map(p => (
              <Link key={p.n} href={p.href} style={{textDecoration:'none',display:'block',border:'1px solid #a8d5ba',padding:'0.75rem',background:'#ffffff',color:'#111111',borderRadius:'4px',transition:'box-shadow 0.1s'}}
                onMouseEnter={e=>(e.currentTarget.style.boxShadow='0 2px 8px rgba(26,122,60,0.15)')}
                onMouseLeave={e=>(e.currentTarget.style.boxShadow='none')}
              >
                <span style={{display:'inline-block',width:'22px',height:'22px',borderRadius:'50%',background:'#1a7a3c',color:'#fff',fontSize:'0.7rem',fontWeight:700,textAlign:'center',lineHeight:'22px',marginBottom:'6px'}}>{p.n}</span>
                <p style={{fontWeight:700,fontSize:'0.82rem',color:'#111111',marginBottom:'2px'}}>{p.titulo}</p>
                <p style={{fontSize:'0.72rem',color:'#555555'}}>{p.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── CABEÇALHO ── */}
      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">Dashboard</h1>
          <p className="pg-sub">{new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}</p>
        </div>
        <OperadorOnly>
          <Link href="/vendas/nova" className="btn btn-primary" style={{fontSize:'0.85rem',padding:'0.55rem 1.125rem',fontWeight:700}}>
            + Nova Venda
          </Link>
        </OperadorOnly>
      </div>

      {/* ── PAINEL COMO FOI (apenas Pro) ── */}
      {isPro && <ComoFoiPainel />}

      {/* ── KPIs OPERACIONAIS ── */}
      <div>
        <p style={{fontSize:'0.72rem',fontWeight:700,color:'#555555',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'0.625rem'}}>Alertas Operacionais</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'0.75rem'}}>
          {[
            {label:'Estoque Crítico',  valor:String(kpis.produtosCriticos), suf:'produto(s)', cor:kpis.produtosCriticos>0?'#c0392b':'#1a7a3c', top:kpis.produtosCriticos>0?'#c0392b':'#1a7a3c', href:'/estoque'},
            {label:'Fiado em Aberto',  valor:formatCurrency(kpis.fiadoAberto), suf:'pendente', cor:kpis.fiadoAberto>0?'#b7860b':'#1a7a3c', top:kpis.fiadoAberto>0?'#b7860b':'#cccccc', href:'/financeiro/fiado', extra: kpis.fiadosVencidos > 0 ? `⚠ ${kpis.fiadosVencidos} vencido(s)` : null},
            {label:'Despesas do Mês',  valor:formatCurrency(kpis.despesasMes), suf:'lançados', cor:'#111111', top:'#1a5fa8', href:'/financeiro/despesas'},
            {label:'Clientes Sumidos', valor:String(kpis.clientesSumidos), suf:'inativos', cor:kpis.clientesSumidos>0?'#b7860b':'#1a7a3c', top:kpis.clientesSumidos>0?'#b7860b':'#cccccc', href:'/clientes'},
          ].map((k: any) => (
            <Link key={k.label} href={k.href} style={{textDecoration:'none',display:'block',background:'#ffffff',border:'1px solid #cccccc',borderTop:`3px solid ${k.top}`,borderRadius:'4px',padding:'0.875rem',color:'inherit',transition:'box-shadow 0.12s',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}
              onMouseEnter={e=>(e.currentTarget.style.boxShadow='0 3px 10px rgba(0,0,0,0.1)')}
              onMouseLeave={e=>(e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,0.06)')}
            >
              <p style={{fontSize:'0.72rem',color:'#555555',fontWeight:600,marginBottom:'0.375rem',textTransform:'uppercase',letterSpacing:'0.04em'}}>{k.label}</p>
              <p style={{fontWeight:800,fontSize:'1.25rem',color:k.cor,lineHeight:1,fontFamily:"'JetBrains Mono', monospace",fontVariantNumeric:'tabular-nums'}}>{k.valor}</p>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
                <p style={{fontSize:'0.68rem',color:'#999999',marginTop:'3px'}}>{k.suf}</p>
                {k.extra && <p style={{fontSize:'0.65rem',color:'#c0392b',fontWeight:700,marginTop:'3px'}}>{k.extra}</p>}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── GRÁFICO BARRAS ── */}
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div className="sec-header">
          <span>Vendas — Últimos 7 dias</span>
          <Link href="/relatorios" style={{fontSize:'0.72rem',color:'#1a7a3c',textDecoration:'none',fontWeight:600}}>Ver relatório →</Link>
        </div>
        <div style={{padding:'1rem'}}>
          {kpis.vendasSemana.length === 0 ? (
            <p style={{fontSize:'0.82rem',color:'#999999',textAlign:'center',padding:'1rem 0'}}>Nenhuma venda nos últimos 7 dias.</p>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
              {[...kpis.vendasSemana].reverse().map((d,i) => {
                const pct = Math.max((d.total/maxVenda)*100, d.total>0?2:0)
                const isToday = i === 0
                return (
                  <div key={d.dia} style={{display:'flex',alignItems:'center',gap:'0.875rem'}}>
                    <p style={{width:'35px',fontSize:'0.72rem',fontWeight:600,color:isToday?'#1a7a3c':'#555555',flexShrink:0,textAlign:'right'}}>{d.dia}</p>
                    <div style={{flex:1,height:'20px',background:'#f0f0f0',border:'1px solid #e0e0e0',borderRadius:'2px',position:'relative',overflow:'hidden'}}>
                      <div style={{
                        position:'absolute',left:0,top:0,bottom:0,
                        width:`${pct}%`,
                        background: isToday ? '#1a7a3c' : '#2d8a4e',
                        borderRadius:'2px',
                        transition:'width 0.4s ease',
                      }}/>
                    </div>
                    <p style={{width:'90px',fontSize:'0.78rem',fontWeight:700,color:d.total>0?'#111111':'#cccccc',flexShrink:0,textAlign:'right',fontFamily:"'JetBrains Mono', monospace",fontVariantNumeric:'tabular-nums'}}>
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
        <p style={{fontSize:'0.72rem',fontWeight:700,color:'#555555',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'0.625rem'}}>Acesso Rápido</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'0.75rem'}}>
          {[
            {href:'/vendas/nova',           label:'Nova Venda',      desc:'Frente de caixa',      primary:true,  proOnly:false},
            {href:'/financeiro/fiado',       label:'Ver Fiado',       desc:formatCurrency(kpis.fiadoAberto)+' aberto', primary:false, proOnly:true},
            {href:'/financeiro/despesas',    label:'Lançar Despesa',  desc:'Registrar saída',      primary:false, proOnly:true},
            {href:'/financeiro/fechamento',  label:'Fechar Caixa',    desc:'Conferência do dia',   primary:false, proOnly:true},
          ].filter(a => !a.proOnly || isPro).map(a => (
            <Link key={a.href} href={a.href} style={{
              display:'block',padding:'0.875rem',textDecoration:'none',
              border: a.primary ? '2px solid #1a7a3c' : '1px solid #cccccc',
              background: a.primary ? '#1a7a3c' : '#ffffff',
              color: a.primary ? '#ffffff' : '#111111',
              borderRadius:'4px',
              transition:'box-shadow 0.12s',
              boxShadow:'0 1px 3px rgba(0,0,0,0.06)',
            }}
              onMouseEnter={e=>(e.currentTarget.style.boxShadow='0 3px 10px rgba(0,0,0,0.12)')}
              onMouseLeave={e=>(e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,0.06)')}
            >
              <p style={{fontWeight:700,fontSize:'0.82rem',marginBottom:'2px'}}>{a.label}</p>
              <p style={{fontSize:'0.72rem',opacity:0.7}}>{a.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* ── ALERTAS ── */}
      {kpis.produtosCriticos > 0 && (
        <div className="alerta alerta-perigo">
          <span>⚠</span>
          <span><strong>{kpis.produtosCriticos} produto(s)</strong> com estoque abaixo do mínimo.{' '}
            <Link href="/estoque" style={{color:'#c0392b',fontWeight:700}}>Ver estoque →</Link>
          </span>
        </div>
      )}
      {kpis.fiadoAberto > 0 && (
        <div className="alerta alerta-aviso">
          <span>●</span>
          <span>{formatCurrency(kpis.fiadoAberto)} em fiado pendente.{' '}
            <Link href="/financeiro/fiado" style={{color:'#7a5a00',fontWeight:700}}>Cobrar agora →</Link>
          </span>
        </div>
      )}
    </div>
  )
}
