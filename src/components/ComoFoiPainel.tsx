'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { formatCurrency } from '@/lib/utils'
import { Loader2, MessageCircle, X } from 'lucide-react'

type Aba = 'ontem' | 'semana' | 'mes' | 'ano'
interface Dados {
  faturamento: number; numVendas: number; despesas: number; lucro: number
  faturamentoPrev: number; numVendasPrev: number; melhorMes: boolean
  produtosZerados: string[]; fiadoAberto: number; comissoesPendentes: number
  // Listas reais para o modal interativo
  listaVendas: any[]; listaDespesas: any[];
}
const VAZIO: Dados = {
  faturamento:0,numVendas:0,despesas:0,lucro:0,faturamentoPrev:0,
  numVendasPrev:0,melhorMes:false,produtosZerados:[],fiadoAberto:0,comissoesPendentes:0,
  listaVendas:[], listaDespesas:[]
}
const ABAS: { id: Aba; label: string }[] = [
  { id:'ontem', label:'Ontem' }, { id:'semana', label:'Essa semana' },
  { id:'mes',   label:'Esse mês' }, { id:'ano',  label:'Esse ano' },
]

function getDates(aba: Aba) {
  const n = new Date()
  if (aba === 'ontem') {
    const hoje = new Date(n.getFullYear(), n.getMonth(), n.getDate())
    const ontem = new Date(hoje); ontem.setDate(hoje.getDate()-1)
    const ante  = new Date(hoje); ante.setDate(hoje.getDate()-2)
    return { i: ontem.toISOString(), f: hoje.toISOString(), pi: ante.toISOString(), pf: ontem.toISOString() }
  }
  if (aba === 'semana') {
    const d = n.getDay(); const m = d===0?6:d-1
    const seg = new Date(n); seg.setDate(n.getDate()-m); seg.setHours(0,0,0,0)
    const segAnt = new Date(seg); segAnt.setDate(seg.getDate()-7)
    return { i: seg.toISOString(), f: n.toISOString(), pi: segAnt.toISOString(), pf: seg.toISOString() }
  }
  if (aba === 'mes') {
    const im = new Date(n.getFullYear(), n.getMonth(), 1)
    const ima = new Date(n.getFullYear(), n.getMonth()-1, 1)
    const fma = new Date(n.getFullYear(), n.getMonth(), 0, 23, 59, 59)
    return { i: im.toISOString(), f: n.toISOString(), pi: ima.toISOString(), pf: fma.toISOString() }
  }
  const ia  = new Date(n.getFullYear(), 0, 1)
  const iaa = new Date(n.getFullYear()-1, 0, 1)
  const faa = new Date(n.getFullYear()-1, 11, 31, 23, 59, 59)
  return { i: ia.toISOString(), f: n.toISOString(), pi: iaa.toISOString(), pf: faa.toISOString() }
}

function getLabelPrev(aba: Aba) {
  if (aba==='ontem') return 'anteontem'
  if (aba==='semana') return 'semana passada'
  if (aba==='mes') return 'mês passado'
  return 'ano passado'
}

function gerarFrase(d: Dados, aba: Aba): string | null {
  if (d.numVendas === 0) return null
  if (d.produtosZerados.length > 0) return 'Você perdeu vendas por falta de estoque. Hora de repor.'
  const margem = d.faturamento > 0 ? d.lucro / d.faturamento : 0
  if (margem < 0.15 && d.despesas > 0) return 'Você vendeu bem mas os custos pesaram. Revise as despesas.'
  if (d.faturamentoPrev > 0 && d.faturamento < d.faturamentoPrev * 0.8) {
    if (aba==='ontem') return 'Dia fraco. Amanhã é uma nova chance.'
    if (aba==='semana') return 'Semana abaixo da média. Ainda dá tempo de recuperar.'
    return 'Período abaixo do esperado. Analise o que pode melhorar.'
  }
  if (d.lucro > 0 && d.faturamento >= d.faturamentoPrev) return aba==='ontem'?'Dia lucrativo. Continue assim.':'Resultado positivo. Continue assim.'
  if (d.lucro > 0) return 'Resultado positivo no período.'
  return null
}

function gerarMsgWA(d: Dados, aba: Aba): string {
  const n = new Date()
  const labelData = aba==='ontem'
    ? new Date(n.getFullYear(),n.getMonth(),n.getDate()-1).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})
    : aba==='semana' ? 'semana atual'
    : aba==='mes' ? n.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})
    : String(n.getFullYear())
  const labelAba = aba==='ontem'?'ontem':aba==='semana'?'essa semana':aba==='mes'?'esse mês':'esse ano'
  const ticket = d.numVendas > 0 ? d.faturamento/d.numVendas : 0
  const frase = gerarFrase(d, aba)
  let msg = `📊 NexoCommerce — Resumo de ${labelAba} (${labelData})\n\n`
  msg += `💰 Faturamento: ${formatCurrency(d.faturamento)}\n`
  msg += `🛒 Vendas: ${d.numVendas}\n`
  msg += `🎯 Ticket médio: ${formatCurrency(ticket)}\n`
  msg += `📉 Despesas: ${formatCurrency(d.despesas)}\n`
  msg += `✅ Lucro estimado: ${formatCurrency(d.lucro)}\n`
  if (d.produtosZerados.length > 0) msg += `\n⚠️ ${d.produtosZerados.length} produto(s) zerado(s)\n`
  if (d.fiadoAberto > 0) msg += `📒 ${formatCurrency(d.fiadoAberto)} em fiado aberto\n`
  if (frase) msg += `\n${frase}\n`
  msg += `\n— Enviado pelo NexoCommerce`
  return msg
}

export function ComoFoiPainel() {
  const { empresaId } = useEmpresaId()
  const [aba,     setAba]     = useState<Aba>('ontem')
  const [loading, setLoading] = useState(true)
  const [dados,   setDados]   = useState<Dados>(VAZIO)
  const cacheRef = useRef({} as Partial<Record<Aba,Dados>>)

  // Estado do Modal Interativo
  const [modalKPI, setModalKPI] = useState<'vendas'|'despesas'|null>(null)

  const carregar = useCallback(async (a: Aba, eid: string) => {
    if (cacheRef.current[a]) { setDados(cacheRef.current[a]!); setLoading(false); return }
    setLoading(true)
    const { i, f, pi, pf } = getDates(a)
    const sb = createClient()

    const [
      { data: vendas },
      { data: vendasPrev },
      { data: desps },
      { data: fiados },
      { data: comissoes },
    ] = await Promise.all([
      sb.from('vendas').select('id, criado_em, total, cliente_nome, status, itens_venda(produto_id,quantidade,preco_unitario,brinde)').eq('empresa_id',eid).eq('status','concluida').gte('criado_em',i).lt('criado_em',f).order('criado_em', { ascending: false }),
      sb.from('vendas').select('total').eq('empresa_id',eid).eq('status','concluida').gte('criado_em',pi).lt('criado_em',pf),
      sb.from('despesas').select('id, criado_em, descricao, valor').eq('empresa_id',eid).gte('criado_em',i).lt('criado_em',f).order('criado_em', { ascending: false }),
      sb.from('fiados').select('valor_aberto').eq('empresa_id',eid).eq('status','aberto').gte('criado_em',i).lt('criado_em',f),
      sb.from('vendas').select('id').eq('empresa_id',eid).eq('status','concluida').not('comissionado_id','is',null).gte('criado_em',i).lt('criado_em',f),
    ])

    const itensVendas = (vendas||[]).flatMap(v => v.itens_venda || [])
    const fat     = (vendas||[]).reduce((s,v)=>s+v.total,0)
    const fatPrev = (vendasPrev||[]).reduce((s,v)=>s+v.total,0)
    const desp    = (desps||[]).reduce((s,d)=>s+d.valor,0)
    const fiadoAb = (fiados||[]).reduce((s,f)=>s+f.valor_aberto,0)

    const prodIds = [...new Set((itensVendas||[]).filter(iv=>!iv.brinde).map(iv=>iv.produto_id))]
    let zerados: string[] = []
    if (prodIds.length > 0) {
      const { data: prods } = await sb.from('produtos').select('id,nome,qtd_atual').in('id', prodIds)
      zerados = (prods||[]).filter(p=>p.qtd_atual<=0).map(p=>p.nome)
    }

    let melhorMes = false
    if (a === 'mes') {
      const inicioAno = new Date(new Date().getFullYear(),0,1).toISOString()
      const { data: todosMeses } = await sb.from('vendas').select('criado_em,total').eq('empresa_id',eid).eq('status','concluida').gte('criado_em',inicioAno)
      if (todosMeses && todosMeses.length > 0) {
        const porMes: Record<string,number> = {}
        todosMeses.forEach(v => {
          const k = v.criado_em.slice(0,7)
          porMes[k] = (porMes[k]||0) + v.total
        })
        const maxMes = Math.max(...Object.values(porMes))
        melhorMes = fat > 0 && fat >= maxMes
      }
    }

    const d: Dados = {
      faturamento: fat, numVendas: (vendas||[]).length,
      despesas: desp, lucro: fat - desp,
      faturamentoPrev: fatPrev, numVendasPrev: (vendasPrev||[]).length,
      melhorMes, produtosZerados: zerados,
      fiadoAberto: fiadoAb, comissoesPendentes: (comissoes||[]).length,
      listaVendas: vendas || [], listaDespesas: desps || []
    }
    cacheRef.current[a] = d
    setDados(d)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (empresaId) carregar(aba, empresaId)
  }, [aba, empresaId, carregar])

  const ticket = dados.numVendas > 0 ? dados.faturamento / dados.numVendas : 0
  const diff   = dados.faturamento - dados.faturamentoPrev
  const frase  = gerarFrase(dados, aba)

  return (
    <div className="card" style={{padding:0,overflow:'hidden',border:'2px solid var(--borda)',boxShadow:'4px 4px 0px var(--borda)',borderRadius:'var(--radius-lg)'}}>
      {/* Header */}
      <div style={{padding:'1rem 1.25rem',borderBottom:'2px solid var(--borda)',display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--surface-alt)'}}>
        <div>
          <p style={{fontWeight:900,fontSize:'1.1rem',color:'var(--texto)'}}>📊 Como foi?</p>
          <p style={{fontSize:'0.8rem',color:'var(--texto-sec)',marginTop:'2px',fontWeight:500}}>Resumo do seu negócio por período</p>
        </div>
        {!loading && dados.numVendas > 0 && (
          <button
            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(gerarMsgWA(dados,aba))}`, '_blank')}
            className="btn btn-pdv"
            style={{minHeight:'auto',flexDirection:'row',padding:'0.5rem 1rem',background:'#25D366',color:'#fff',borderColor:'#128C7E',boxShadow:'2px 2px 0px #128C7E'}}
          >
            <MessageCircle size={16}/> Compartilhar
          </button>
        )}
      </div>

      {/* Abas Estilo Pasta */}
      <div style={{display:'flex',borderBottom:'2px solid var(--borda)',background:'var(--fundo)',padding:'0.5rem 0.5rem 0 0.5rem',gap:'0.25rem'}}>
        {ABAS.map(t => {
          const ativo = aba === t.id
          return (
            <button key={t.id} onClick={()=>setAba(t.id)}
              style={{
                padding:'0.625rem 1.25rem', fontSize:'0.85rem', fontWeight:ativo?800:600,
                border:'2px solid var(--borda)', borderBottom:ativo?'2px solid var(--surface)':'2px solid var(--borda)',
                background:ativo?'var(--surface)':'var(--surface-alt)', cursor:'pointer', fontFamily:'inherit',
                color: ativo?'var(--texto)':'var(--texto-sec)',
                borderTopLeftRadius:'6px', borderTopRightRadius:'6px',
                marginBottom:'-2px', zIndex:ativo?10:1, transition:'all 0.1s',
                boxShadow: ativo ? 'none' : 'inset 0 -2px 5px rgba(0,0,0,0.02)'
              }}>
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Conteúdo */}
      <div style={{padding:'1.25rem', background:'var(--surface)'}}>
        {loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:'3rem',gap:'0.75rem',color:'var(--texto-desab)',fontWeight:600}}>
            <Loader2 size={18} style={{animation:'spin 1s linear infinite'}}/> Carregando métricas...
          </div>
        ) : dados.numVendas === 0 ? (
          <div style={{textAlign:'center',padding:'3rem',color:'var(--texto-desab)'}}>
            <p style={{fontSize:'2.5rem',marginBottom:'0.75rem'}}>😴</p>
            <p style={{fontWeight:800,fontSize:'1.1rem',color:'var(--texto)'}}>Nenhuma venda registrada nesse período</p>
            <p style={{fontSize:'0.85rem',marginTop:'0.5rem'}}>Se a loja esteve aberta, lembre de registrar as vendas no PDV.</p>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:'1.25rem'}}>

            {/* Bloco 1 — Faturamento (Clicável) */}
            <div 
              onClick={() => setModalKPI('vendas')}
              style={{textAlign:'center',padding:'1.25rem',background:'var(--verde-claro)',borderRadius:'var(--radius-lg)',border:'2px solid var(--verde)',boxShadow:'3px 3px 0px var(--verde)',cursor:'pointer',transition:'transform 0.1s'}}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translate(-1px, -1px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translate(0px, 0px)'}
            >
              <p style={{fontSize:'0.85rem',fontWeight:800,color:'var(--verde-esc)',marginBottom:'0.25rem',textTransform:'uppercase',letterSpacing:'0.06em'}}>
                Faturamento {aba==='ontem'?'de ontem':aba==='semana'?'da semana':aba==='mes'?'do mês':'do ano'} <span style={{fontSize:'0.7rem',opacity:0.7}}>(Clique para ver detalhes)</span>
              </p>
              <p style={{fontWeight:900,fontSize:'3rem',color:'var(--verde-esc)',fontFamily:'monospace',lineHeight:1,textShadow:'1px 1px 0px rgba(0,0,0,0.1)'}}>
                {formatCurrency(dados.faturamento)}
              </p>

              {dados.faturamentoPrev > 0 ? (
                dados.melhorMes && aba==='mes' ? (
                  <p style={{marginTop:'0.75rem',fontSize:'0.9rem',fontWeight:800,color:'var(--verde-esc)'}}>
                    🏆 Seu melhor mês do ano até agora!
                  </p>
                ) : diff !== 0 ? (
                  <p style={{marginTop:'0.75rem',fontSize:'0.9rem',fontWeight:800,color: diff>0?'var(--verde-esc)':'var(--vermelho)'}}>
                    {diff>0?'▲':'▼'} {formatCurrency(Math.abs(diff))} {diff>0?'a mais':'a menos'} que {getLabelPrev(aba)}
                  </p>
                ) : (
                  <p style={{marginTop:'0.75rem',fontSize:'0.85rem',fontWeight:600,color:'var(--verde-esc)',opacity:0.8}}>Igual a {getLabelPrev(aba)}</p>
                )
              ) : null}
            </div>

            {/* Bloco 2 — KPIs Menores Interativos */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.75rem'}}>
              {/* Box Vendas */}
              <div onClick={() => setModalKPI('vendas')} style={{background:'var(--surface)',borderRadius:'var(--radius)',padding:'1rem',border:'2px solid var(--borda)',boxShadow:'2px 2px 0px var(--borda)',cursor:'pointer',transition:'transform 0.1s'}} onMouseOver={(e) => e.currentTarget.style.transform = 'translate(-1px, -1px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translate(0px, 0px)'}>
                <p style={{fontSize:'0.75rem',color:'var(--texto-sec)',fontWeight:800,textTransform:'uppercase',marginBottom:'0.25rem'}}>Vendas realizadas</p>
                <p style={{fontWeight:900,fontSize:'1.25rem',color:'var(--texto)',fontFamily:'monospace',lineHeight:1}}>{dados.numVendas}</p>
                <p style={{fontSize:'0.7rem',color:'var(--texto-desab)',marginTop:'4px',fontWeight:600}}>ver lista →</p>
              </div>
              
              {/* Box Despesas */}
              <div onClick={() => setModalKPI('despesas')} style={{background:'var(--surface)',borderRadius:'var(--radius)',padding:'1rem',border:'2px solid var(--borda)',boxShadow:'2px 2px 0px var(--borda)',cursor:'pointer',transition:'transform 0.1s'}} onMouseOver={(e) => e.currentTarget.style.transform = 'translate(-1px, -1px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translate(0px, 0px)'}>
                <p style={{fontSize:'0.75rem',color:'var(--texto-sec)',fontWeight:800,textTransform:'uppercase',marginBottom:'0.25rem'}}>Despesas</p>
                <p style={{fontWeight:900,fontSize:'1.25rem',color:dados.despesas>0?'var(--vermelho)':'var(--texto)',fontFamily:'monospace',lineHeight:1}}>{formatCurrency(dados.despesas)}</p>
                <p style={{fontSize:'0.7rem',color:'var(--texto-desab)',marginTop:'4px',fontWeight:600}}>ver lista →</p>
              </div>

              {/* Box Lucro (Não clicável, derivado) */}
              <div style={{background:'var(--surface)',borderRadius:'var(--radius)',padding:'1rem',border:'2px solid var(--borda)',boxShadow:'2px 2px 0px var(--borda)'}}>
                <p style={{fontSize:'0.75rem',color:'var(--texto-sec)',fontWeight:800,textTransform:'uppercase',marginBottom:'0.25rem'}}>Lucro Estimado</p>
                <p style={{fontWeight:900,fontSize:'1.25rem',color:dados.lucro>=0?'var(--verde)':'var(--vermelho)',fontFamily:'monospace',lineHeight:1}}>{formatCurrency(dados.lucro)}</p>
                <p style={{fontSize:'0.7rem',color:'var(--texto-desab)',marginTop:'4px',fontWeight:600}}>líquido</p>
                {dados.despesas === 0 && dados.faturamento > 0 && (
                  <div style={{marginTop:'0.75rem',paddingTop:'0.75rem',borderTop:'1px dashed var(--borda)',fontSize:'0.7rem',color:'var(--amarelo)',fontWeight:600}}>
                    ⚠️ Você não registrou despesas nesse período. O lucro pode estar incorreto.{' '}
                    <a href="/financeiro/despesas" style={{color:'inherit',textDecoration:'underline'}}>+ Lançar Despesa</a>
                  </div>
                )}
              </div>
            </div>

            {/* Bloco 3 — Alertas */}
            {(dados.produtosZerados.length > 0 || dados.fiadoAberto > 0 || dados.comissoesPendentes > 0) && (
              <div style={{display:'flex',flexDirection:'column',gap:'0.5rem',marginTop:'0.5rem'}}>
                {dados.produtosZerados.length > 0 && (
                  <div style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.75rem 1rem',background:'#fffbeb',border:'2px solid #fcd34d',boxShadow:'2px 2px 0px #fcd34d',borderRadius:'var(--radius)',fontSize:'0.85rem'}}>
                    <span style={{fontSize:'1.2rem'}}>⚠️</span>
                    <span style={{color:'#92400e',fontWeight:600}}>
                      <strong style={{fontWeight:900}}>{dados.produtosZerados.length} produto(s) zerado(s)</strong> que venderam nesse período: {dados.produtosZerados.slice(0,2).join(', ')}{dados.produtosZerados.length>2?` +${dados.produtosZerados.length-2}`:''}
                    </span>
                  </div>
                )}
                {dados.fiadoAberto > 0 && (
                  <div style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.75rem 1rem',background:'#fef3c7',border:'2px solid #fbbf24',boxShadow:'2px 2px 0px #fbbf24',borderRadius:'var(--radius)',fontSize:'0.85rem'}}>
                    <span style={{fontSize:'1.2rem'}}>📒</span>
                    <span style={{color:'#92400e',fontWeight:600}}>
                      <strong style={{fontWeight:900}}>{formatCurrency(dados.fiadoAberto)}</strong> em fiado aberto gerado nesse período
                    </span>
                  </div>
                )}
                {dados.comissoesPendentes > 0 && (
                  <div style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.75rem 1rem',background:'#f0fdf4',border:'2px solid #86efac',boxShadow:'2px 2px 0px #86efac',borderRadius:'var(--radius)',fontSize:'0.85rem'}}>
                    <span style={{fontSize:'1.2rem'}}>🎯</span>
                    <span style={{color:'#166534',fontWeight:600}}>
                      <strong style={{fontWeight:900}}>{dados.comissoesPendentes} venda(s)</strong> com comissão a calcular
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Bloco 4 — Frase de encerramento */}
            {frase && (
              <div style={{padding:'1rem 1.25rem',background:'var(--surface-alt)',borderLeft:'4px solid var(--verde)',borderTop:'2px solid var(--borda)',borderRight:'2px solid var(--borda)',borderBottom:'2px solid var(--borda)',boxShadow:'2px 2px 0px var(--borda)',borderRadius:'0 var(--radius) var(--radius) 0',fontSize:'0.95rem',fontWeight:700,color:'var(--texto-sec)'}}>
                💡 {frase}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL INTERATIVO (KPIs Detalhados) */}
      {modalKPI && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:'1.25rem'}} onClick={()=>setModalKPI(null)}>
          <div style={{background:'var(--surface)',border:'3px solid var(--borda)',boxShadow:'8px 8px 0px rgba(0,0,0,1)',borderRadius:'var(--radius-lg)',width:'100%',maxWidth:'700px',maxHeight:'85vh',display:'flex',flexDirection:'column'}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:'1rem 1.25rem',borderBottom:'2px solid var(--borda)',display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--surface-alt)'}}>
              <h2 style={{fontSize:'1.2rem',fontWeight:900,color:'var(--texto)',textTransform:'uppercase'}}>
                {modalKPI === 'vendas' ? '🛒 Detalhamento de Vendas' : '📉 Detalhamento de Despesas'}
              </h2>
              <button onClick={()=>setModalKPI(null)} className="btn-icon" style={{border:'2px solid var(--borda)'}}><X size={18}/></button>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'1.25rem'}}>
              {modalKPI === 'vendas' ? (
                <div className="tabela-wrap" style={{border:'2px solid var(--borda)',boxShadow:'none'}}>
                  <table className="tabela" style={{width:'100%',textAlign:'left',borderCollapse:'collapse'}}>
                    <thead>
                      <tr style={{background:'var(--sidebar-bg)'}}>
                        <th style={{padding:'0.75rem',color:'#fff',fontWeight:800,fontSize:'0.75rem',textTransform:'uppercase'}}>Data</th>
                        <th style={{padding:'0.75rem',color:'#fff',fontWeight:800,fontSize:'0.75rem',textTransform:'uppercase'}}>Cliente</th>
                        <th style={{padding:'0.75rem',color:'#fff',fontWeight:800,fontSize:'0.75rem',textTransform:'uppercase',textAlign:'right'}}>Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dados.listaVendas.length===0 && <tr><td colSpan={3} style={{padding:'1rem',textAlign:'center'}}>Nenhuma venda</td></tr>}
                      {dados.listaVendas.map((v:any) => (
                        <tr key={v.id} style={{borderBottom:'1px solid var(--borda-leve)'}}>
                          <td style={{padding:'0.75rem',fontSize:'0.85rem',fontWeight:600}}>{new Date(v.criado_em).toLocaleDateString('pt-BR')} {new Date(v.criado_em).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</td>
                          <td style={{padding:'0.75rem',fontSize:'0.85rem'}}>{v.cliente_nome || 'Cliente Balcão'}</td>
                          <td style={{padding:'0.75rem',fontSize:'0.9rem',fontWeight:800,fontFamily:'monospace',textAlign:'right',color:'var(--verde)'}}>{formatCurrency(v.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="tabela-wrap" style={{border:'2px solid var(--borda)',boxShadow:'none'}}>
                  <table className="tabela" style={{width:'100%',textAlign:'left',borderCollapse:'collapse'}}>
                    <thead>
                      <tr style={{background:'var(--sidebar-bg)'}}>
                        <th style={{padding:'0.75rem',color:'#fff',fontWeight:800,fontSize:'0.75rem',textTransform:'uppercase'}}>Data</th>
                        <th style={{padding:'0.75rem',color:'#fff',fontWeight:800,fontSize:'0.75rem',textTransform:'uppercase'}}>Descrição</th>
                        <th style={{padding:'0.75rem',color:'#fff',fontWeight:800,fontSize:'0.75rem',textTransform:'uppercase',textAlign:'right'}}>Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dados.listaDespesas.length===0 && <tr><td colSpan={3} style={{padding:'1rem',textAlign:'center'}}>Nenhuma despesa</td></tr>}
                      {dados.listaDespesas.map((d:any) => (
                        <tr key={d.id} style={{borderBottom:'1px solid var(--borda-leve)'}}>
                          <td style={{padding:'0.75rem',fontSize:'0.85rem',fontWeight:600}}>{new Date(d.criado_em).toLocaleDateString('pt-BR')}</td>
                          <td style={{padding:'0.75rem',fontSize:'0.85rem'}}>{d.descricao}</td>
                          <td style={{padding:'0.75rem',fontSize:'0.9rem',fontWeight:800,fontFamily:'monospace',textAlign:'right',color:'var(--vermelho)'}}>{formatCurrency(d.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
