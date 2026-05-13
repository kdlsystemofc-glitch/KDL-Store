'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { formatCurrency } from '@/lib/utils'
import { ShoppingCart, TrendingUp, Package, AlertTriangle, BookOpen, FileText } from 'lucide-react'
import { ComoFoiPainel } from '@/components/ComoFoiPainel'

type KPIs = {
  vendasHoje: number; faturamentoHoje: number; ticketMedio: number
  produtosCriticos: number; fiadoAberto: number; despesasMes: number; comissoesPagar: number; clientesSumidos: number
  vendasSemana: { dia: string; total: number }[]
  totalProdutos: number; totalVendas: number
}

const EMPTY: KPIs = { vendasHoje:0, faturamentoHoje:0, ticketMedio:0, produtosCriticos:0, fiadoAberto:0, despesasMes:0, comissoesPagar:0, clientesSumidos:0, vendasSemana:[], totalProdutos:0, totalVendas:0 }

export default function DashboardPage() {
  const { empresaId, loading: loadingEmpresa } = useEmpresaId()
  const [kpis,    setKpis]    = useState<KPIs>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [hora,    setHora]    = useState('')

  useEffect(() => {
    setHora(new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' }))
    const t = setInterval(() => setHora(new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})), 60000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!empresaId) return
    carregar(empresaId)
  }, [empresaId])

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
      supabase.from('vendas').select('total,comissionado_id').eq('empresa_id', eid).eq('status','concluida').not('comissionado_id', 'is', null),
      supabase.from('clientes').select('ultima_compra').eq('empresa_id', eid).eq('ativo',true),
      supabase.from('empresas').select('crm_prazo_inatividade_dias').eq('id', eid).single(),
      supabase.from('produtos').select('*', { count: 'exact', head: true }).eq('empresa_id', eid),
      supabase.from('vendas').select('*', { count: 'exact', head: true }).eq('empresa_id', eid),
    ])

    const getRes = (index: number): any => results[index].status === 'fulfilled' ? (results[index] as PromiseFulfilledResult<any>).value || {} : {}

    const { data: vendasHoje } = getRes(0)
    const { data: todosProdutos } = getRes(1)
    const { data: fiados } = getRes(2)
    const { data: despesas } = getRes(3)
    const { data: vendasSemana } = getRes(4)
    const { data: comissoes } = getRes(5) // Unused but kept for structure
    const { data: clientes } = getRes(6)
    const { data: empresaData } = getRes(7)
    const { count: totalProdutos } = getRes(8)
    const { count: totalVendas } = getRes(9)

    // Filtra críticos em JS (PostgREST não suporta comparação coluna-vs-coluna)
    const criticos = (todosProdutos||[]).filter((p: any) => p.qtd_atual <= p.qtd_minima)

    const totalHoje = (vendasHoje||[]).reduce((a: number, v: any) => a + (v.total || 0), 0)
    const qtdHoje   = (vendasHoje||[]).length
    const fiadoTotal = (fiados||[]).reduce((a: number, f: any) => a + (f.valor_aberto || 0), 0)
    const despTotal  = (despesas||[]).reduce((a: number, d: any) => a + (d.valor || 0), 0)
    
    // Cálculo de comissões (simplificado para o dashboard)
    const comPagar = 0 // Precisaria cruzar vendas com as taxas configuradas na tabela comissoes
    
    const prazo = empresaData?.crm_prazo_inatividade_dias || 60
    const limiteData = new Date(Date.now() - prazo * 86400000).toISOString().slice(0,10)
    const sumidos = (clientes||[]).filter((c: any) => !c.ultima_compra || c.ultima_compra < limiteData).length

    // Agrupa vendas por dia
    const porDia: Record<string,number> = {}
    ;(vendasSemana||[]).forEach((v: any) => {
      const d = v.criado_em.slice(0,10)
      porDia[d] = (porDia[d]||0) + v.total
    })
    const dias = Array.from({length:7},(_,i)=>{
      const d = new Date(Date.now()-(6-i)*86400000).toISOString().slice(0,10)
      return { dia: new Date(d+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'short'}), total: porDia[d]||0 }
    })

    setKpis({
      vendasHoje: qtdHoje, faturamentoHoje: totalHoje,
      ticketMedio: qtdHoje > 0 ? totalHoje/qtdHoje : 0,
      produtosCriticos: (criticos||[]).length,
      fiadoAberto: fiadoTotal, despesasMes: despTotal, comissoesPagar: comPagar, clientesSumidos: sumidos,
      vendasSemana: dias,
      totalProdutos: totalProdutos || 0,
      totalVendas: totalVendas || 0,
    })
    setLoading(false)
  }

  const maxVenda = Math.max(...kpis.vendasSemana.map(d=>d.total), 1)
  const diaSemana = new Date().toLocaleDateString('pt-BR',{weekday:'long', day:'numeric', month:'long'})

  if (loadingEmpresa || loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',flexDirection:'column',gap:'1rem',color:'var(--texto-desab)'}}>
      <div style={{width:'40px',height:'40px',border:'3px solid var(--verde)',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <p>Carregando dados da sua loja...</p>
    </div>
  )

  return (
    <div className="anim-fade" style={{display:'flex',flexDirection:'column',gap:'1rem'}}>

      {/* ── ONBOARDING: primeiros passos ── */}
      {kpis.totalProdutos === 0 && (
        <div className="card" style={{padding:'1.5rem',border:'2px solid var(--verde)',background:'var(--verde-claro)'}}>
          <p style={{fontWeight:900,fontSize:'1.1rem',color:'var(--verde-esc)',marginBottom:'0.25rem'}}>👋 Bem-vindo ao NexoCommerce!</p>
          <p style={{fontSize:'0.85rem',color:'var(--verde-esc)',marginBottom:'1.25rem',opacity:0.85}}>Siga os 3 passos abaixo para começar a usar o sistema:</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.75rem'}}>
            {[
              { n:'1', titulo:'Cadastre um produto', desc:'Adicione o que você vende ao seu estoque', href:'/produtos', btn:'Cadastrar produto →' },
              { n:'2', titulo:'Faça sua primeira venda', desc:'Registre uma venda no PDV para testar o fluxo', href:'/vendas/nova', btn:'Abrir PDV →' },
              { n:'3', titulo:'Configure seus fornecedores', desc:'Cadastre de quem você compra para acionar rápido', href:'/fornecedores', btn:'Cadastrar fornecedor →' },
            ].map(p => (
              <div key={p.n} style={{background:'var(--surface)',borderRadius:'var(--radius)',padding:'1rem',border:'1px solid var(--verde-borda)'}}>
                <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.5rem'}}>
                  <div style={{width:'28px',height:'28px',borderRadius:'50%',background:'var(--verde)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:'0.9rem',flexShrink:0}}>{p.n}</div>
                  <p style={{fontWeight:800,fontSize:'0.875rem'}}>{p.titulo}</p>
                </div>
                <p style={{fontSize:'0.78rem',color:'var(--texto-desab)',marginBottom:'0.75rem'}}>{p.desc}</p>
                <Link href={p.href} className="btn btn-primary" style={{fontSize:'0.78rem',padding:'0.375rem 0.75rem',display:'inline-flex'}}>{p.btn}</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div>
          <h1 className="pg-titulo">📊 Dashboard</h1>
          <p className="pg-sub" style={{textTransform:'capitalize'}}>{diaSemana} · {hora}</p>
        </div>
        <Link href="/vendas/nova" className="btn btn-primary" style={{display:'flex',alignItems:'center',gap:'0.375rem',fontSize:'1rem',padding:'0.625rem 1.25rem'}}>
          <ShoppingCart size={16}/> Nova Venda
        </Link>
      </div>

      {/* ── PAINEL COMO FOI ── */}
      <ComoFoiPainel />

      {/* KPIs */}
      {/* KPIs Operacionais */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'0.75rem'}}>
        {[
          {icon:'⚠️', label:'Estoque Crítico',   valor:kpis.produtosCriticos, fmt:(v:number)=>String(v), suf:'produtos', cor:kpis.produtosCriticos>0?'var(--vermelho)':'var(--verde)', href:'/estoque'},
          {icon:'📒', label:'Fiados em Aberto',  valor:kpis.fiadoAberto,      fmt:formatCurrency,        suf:'a receber', cor:kpis.fiadoAberto>0?'var(--vermelho)':'var(--verde)', href:'/financeiro/fiado'},
          {icon:'💰', label:'Comissões a Pagar', valor:kpis.comissoesPagar,   fmt:formatCurrency,        suf:'pendentes', cor:kpis.comissoesPagar>0?'var(--amarelo)':'var(--verde)', href:'/comissoes'},
          {icon:'👻', label:'Clientes Sumidos',  valor:kpis.clientesSumidos,  fmt:(v:number)=>String(v), suf:'inativos', cor:kpis.clientesSumidos>0?'var(--amarelo)':'var(--verde)', href:'/clientes/inativos'},
        ].map(k=>(
          <Link key={k.label} href={k.href} className="card" style={{padding:'1rem', textDecoration:'none', color:'inherit', display:'block'}}>
            <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.375rem'}}>
              <span style={{fontSize:'1.25rem'}}>{k.icon}</span>
              <p style={{fontSize:'0.78rem',color:'var(--texto-desab)',fontWeight:600}}>{k.label}</p>
            </div>
            <p style={{fontWeight:900,fontSize:'1.625rem',color:k.cor,fontFamily:'monospace',lineHeight:1}}>{k.fmt(k.valor)}</p>
            <p style={{fontSize:'0.72rem',color:'var(--texto-desab)',marginTop:'0.25rem'}}>{k.suf}</p>
          </Link>
        ))}
      </div>

      {/* Gráfico de barras — últimos 7 dias */}
      <div className="card">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
          <p style={{fontWeight:800}}>📈 Vendas — últimos 7 dias</p>
          <Link href="/relatorios" style={{fontSize:'0.78rem',color:'var(--verde)',fontWeight:600,textDecoration:'none'}}>Ver relatório →</Link>
        </div>
        <div style={{display:'flex',gap:'0.5rem',alignItems:'flex-end',height:'120px'}}>
          {kpis.vendasSemana.map((d,i)=>(
            <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'0.25rem',height:'100%',justifyContent:'flex-end'}}>
              <p style={{fontSize:'0.65rem',fontWeight:700,color:'var(--verde)',opacity:d.total>0?1:0}}>
                {formatCurrency(d.total).replace('R$','').trim()}
              </p>
              <div style={{
                width:'100%',background: d.total>0 ? 'var(--verde)' : 'var(--surface-alt)',
                height:`${Math.max((d.total/maxVenda)*100,4)}%`,
                borderRadius:'4px 4px 0 0',transition:'height 0.3s ease'
              }}/>
              <p style={{fontSize:'0.68rem',color:'var(--texto-desab)',fontWeight:600,textTransform:'capitalize'}}>{d.dia}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Ações rápidas */}
      <div>
        <p style={{fontWeight:800,marginBottom:'0.625rem'}}>⚡ Ações Rápidas</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'0.625rem'}}>
          {[
            {href:'/vendas/nova',        icon:<ShoppingCart size={20}/>, label:'Nova Venda',     desc:'Registrar venda no PDV'},
            {href:'/financeiro/fiado',   icon:<BookOpen size={20}/>,     label:'Ver Fiado',      desc:`${formatCurrency(kpis.fiadoAberto)} em aberto`},
            {href:'/financeiro/despesas',icon:<TrendingUp size={20}/>,   label:'Lançar Despesa', desc:'Registrar saída de caixa'},
            {href:'/financeiro/fechamento',icon:<FileText size={20}/>,   label:'Fechar Caixa',  desc:'Conferência do período'},
          ].map(a=>(
            <Link key={a.href} href={a.href} style={{
              display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
              gap:'0.375rem',padding:'1rem',textDecoration:'none',textAlign:'center',
              background:'var(--surface)',border:'1px solid var(--borda)',borderRadius:'var(--radius)',
              color:'var(--texto)',transition:'border-color 0.15s, background 0.15s',cursor:'pointer'
            }}>
              <span style={{color:'var(--verde)'}}>{a.icon}</span>
              <p style={{fontWeight:700,fontSize:'0.85rem'}}>{a.label}</p>
              <p style={{fontSize:'0.72rem',color:'var(--texto-desab)'}}>{a.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Alertas */}
      {kpis.produtosCriticos > 0 && (
        <div className="alerta alerta-perigo" style={{display:'flex',gap:'0.625rem',alignItems:'center'}}>
          <AlertTriangle size={16}/>
          <span><strong>{kpis.produtosCriticos} produto(s)</strong> com estoque abaixo do mínimo.{' '}
            <Link href="/estoque" style={{color:'var(--vermelho)',fontWeight:700}}>Ver estoque →</Link>
          </span>
        </div>
      )}
      {kpis.fiadoAberto > 0 && (
        <div className="alerta alerta-aviso" style={{display:'flex',gap:'0.625rem',alignItems:'center'}}>
          <BookOpen size={16}/>
          <span>{formatCurrency(kpis.fiadoAberto)} em fiado pendente.{' '}
            <Link href="/financeiro/fiado" style={{color:'var(--amarelo)',fontWeight:700}}>Cobrar agora →</Link>
          </span>
        </div>
      )}
    </div>
  )
}
