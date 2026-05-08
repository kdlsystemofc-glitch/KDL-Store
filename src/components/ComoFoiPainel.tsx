'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { formatCurrency } from '@/lib/utils'
import { Loader2, MessageCircle } from 'lucide-react'

type Aba = 'ontem' | 'semana' | 'mes' | 'ano'
interface Dados {
  faturamento: number; numVendas: number; despesas: number; lucro: number
  faturamentoPrev: number; numVendasPrev: number; melhorMes: boolean
  produtosZerados: string[]; fiadoAberto: number; comissoesPendentes: number
}
const VAZIO: Dados = {
  faturamento:0,numVendas:0,despesas:0,lucro:0,faturamentoPrev:0,
  numVendasPrev:0,melhorMes:false,produtosZerados:[],fiadoAberto:0,comissoesPendentes:0
}
const ABAS: { id: Aba; label: string }[] = [
  { id:'ontem', label:'Ontem' }, { id:'semana', label:'Essa semana' },
  { id:'mes',   label:'Esse mÃªs' }, { id:'ano',  label:'Esse ano' },
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
  if (aba==='mes') return 'mÃªs passado'
  return 'ano passado'
}

function gerarFrase(d: Dados, aba: Aba): string | null {
  if (d.numVendas === 0) return null
  if (d.produtosZerados.length > 0) return 'VocÃª perdeu vendas por falta de estoque. Hora de repor.'
  const margem = d.faturamento > 0 ? d.lucro / d.faturamento : 0
  if (margem < 0.15 && d.despesas > 0) return 'VocÃª vendeu bem mas os custos pesaram. Revise as despesas.'
  if (d.faturamentoPrev > 0 && d.faturamento < d.faturamentoPrev * 0.8) {
    if (aba==='ontem') return 'Dia fraco. AmanhÃ£ Ã© uma nova chance.'
    if (aba==='semana') return 'Semana abaixo da mÃ©dia. Ainda dÃ¡ tempo de recuperar.'
    return 'PerÃ­odo abaixo do esperado. Analise o que pode melhorar.'
  }
  if (d.lucro > 0 && d.faturamento >= d.faturamentoPrev) return aba==='ontem'?'Dia lucrativo. Continue assim.':'Resultado positivo. Continue assim.'
  if (d.lucro > 0) return 'Resultado positivo no perÃ­odo.'
  return null
}

function gerarMsgWA(d: Dados, aba: Aba): string {
  const n = new Date()
  const labelData = aba==='ontem'
    ? new Date(n.getFullYear(),n.getMonth(),n.getDate()-1).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})
    : aba==='semana' ? 'semana atual'
    : aba==='mes' ? n.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})
    : String(n.getFullYear())
  const labelAba = aba==='ontem'?'ontem':aba==='semana'?'essa semana':aba==='mes'?'esse mÃªs':'esse ano'
  const ticket = d.numVendas > 0 ? d.faturamento/d.numVendas : 0
  const frase = gerarFrase(d, aba)
  let msg = `ðŸ“Š NexoCommerce â€” Resumo de ${labelAba} (${labelData})\n\n`
  msg += `ðŸ’° Faturamento: ${formatCurrency(d.faturamento)}\n`
  msg += `ðŸ›’ Vendas: ${d.numVendas}\n`
  msg += `ðŸŽ¯ Ticket mÃ©dio: ${formatCurrency(ticket)}\n`
  msg += `ðŸ“‰ Despesas: ${formatCurrency(d.despesas)}\n`
  msg += `âœ… Lucro estimado: ${formatCurrency(d.lucro)}\n`
  if (d.produtosZerados.length > 0) msg += `\nâš ï¸ ${d.produtosZerados.length} produto(s) zerado(s)\n`
  if (d.fiadoAberto > 0) msg += `ðŸ“’ ${formatCurrency(d.fiadoAberto)} em fiado aberto\n`
  if (frase) msg += `\n${frase}\n`
  msg += `\nâ€” Enviado pelo NexoCommerce`
  return msg
}

export function ComoFoiPainel() {
  const { empresaId } = useEmpresaId()
  const [aba,     setAba]     = useState<Aba>('ontem')
  const [loading, setLoading] = useState(true)
  const [dados,   setDados]   = useState<Dados>(VAZIO)
  const cacheRef = useRef({} as Partial<Record<Aba,Dados>>)

  const carregar = useCallback(async (a: Aba, eid: string) => {
    if (cacheRef.current[a]) { setDados(cacheRef.current[a]!); setLoading(false); return }
    setLoading(true)
    const { i, f, pi, pf } = getDates(a)
    const sb = createClient()

    const [
      { data: vendas },
      { data: vendasPrev },
      { data: desps },
      { data: itensVendas },
      { data: fiados },
      { data: comissoes },
    ] = await Promise.all([
      sb.from('vendas').select('total').eq('empresa_id',eid).eq('status','concluida').gte('criado_em',i).lt('criado_em',f),
      sb.from('vendas').select('total').eq('empresa_id',eid).eq('status','concluida').gte('criado_em',pi).lt('criado_em',pf),
      sb.from('despesas').select('valor').eq('empresa_id',eid).gte('criado_em',i).lt('criado_em',f),
      sb.from('itens_venda').select('produto_id,quantidade,preco_unitario,brinde').eq('empresa_id',eid).gte('criado_em',i).lt('criado_em',f),
      sb.from('fiados').select('valor_aberto').eq('empresa_id',eid).eq('status','aberto').gte('criado_em',i).lt('criado_em',f),
      sb.from('vendas').select('id').eq('empresa_id',eid).eq('status','concluida').not('comissionado_id','is',null).gte('criado_em',i).lt('criado_em',f),
    ])

    const fat     = (vendas||[]).reduce((s,v)=>s+v.total,0)
    const fatPrev = (vendasPrev||[]).reduce((s,v)=>s+v.total,0)
    const desp    = (desps||[]).reduce((s,d)=>s+d.valor,0)
    const fiadoAb = (fiados||[]).reduce((s,f)=>s+f.valor_aberto,0)

    // Produtos zerados que venderam no perÃ­odo
    const prodIds = [...new Set((itensVendas||[]).filter(iv=>!iv.brinde).map(iv=>iv.produto_id))]
    let zerados: string[] = []
    if (prodIds.length > 0) {
      const { data: prods } = await sb.from('produtos').select('id,nome,qtd_atual').in('id', prodIds)
      zerados = (prods||[]).filter(p=>p.qtd_atual<=0).map(p=>p.nome)
    }

    // Melhor mÃªs do ano (sÃ³ para aba 'mes')
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
    <div className="card" style={{padding:0,overflow:'hidden',border:'1px solid var(--borda)'}}>
      {/* Header */}
      <div style={{padding:'0.875rem 1.125rem',borderBottom:'1px solid var(--borda)',display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--surface)'}}>
        <div>
          <p style={{fontWeight:900,fontSize:'1.05rem'}}>ðŸ“Š Como foi?</p>
          <p style={{fontSize:'0.75rem',color:'var(--texto-desab)',marginTop:'1px'}}>Resumo do seu negÃ³cio por perÃ­odo</p>
        </div>
        {!loading && dados.numVendas > 0 && (
          <button
            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(gerarMsgWA(dados,aba))}`, '_blank')}
            className="btn btn-secondary"
            style={{display:'flex',alignItems:'center',gap:'0.375rem',fontSize:'0.78rem',padding:'0.35rem 0.75rem',background:'#25D366',color:'#fff',border:'none'}}
          >
            <MessageCircle size={13}/> Compartilhar resumo
          </button>
        )}
      </div>

      {/* Abas */}
      <div style={{display:'flex',borderBottom:'1px solid var(--borda)',background:'var(--surface-alt)'}}>
        {ABAS.map(t => (
          <button key={t.id} onClick={()=>setAba(t.id)}
            style={{
              flex:1, padding:'0.625rem 0.5rem', fontSize:'0.82rem', fontWeight:700,
              border:'none', borderBottom: aba===t.id?'2px solid var(--verde)':'2px solid transparent',
              background:'transparent', cursor:'pointer', fontFamily:'inherit',
              color: aba===t.id?'var(--verde)':'var(--texto-sec)',
              transition:'color 0.15s',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ConteÃºdo */}
      <div style={{padding:'1.125rem'}}>
        {loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:'2rem',gap:'0.625rem',color:'var(--texto-desab)'}}>
            <Loader2 size={16} style={{animation:'spin 1s linear infinite'}}/> Carregando...
          </div>
        ) : dados.numVendas === 0 ? (
          <div style={{textAlign:'center',padding:'2rem',color:'var(--texto-desab)'}}>
            <p style={{fontSize:'1.75rem',marginBottom:'0.5rem'}}>ðŸ˜´</p>
            <p style={{fontWeight:700}}>Nenhuma venda registrada nesse perÃ­odo</p>
            <p style={{fontSize:'0.82rem',marginTop:'0.25rem',opacity:0.7}}>Se a loja esteve aberta, lembre de registrar as vendas no PDV.</p>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>

            {/* Bloco 1 â€” NÃºmero principal */}
            <div style={{textAlign:'center',padding:'0.75rem 1rem',background:'var(--verde-claro)',borderRadius:'var(--radius)',border:'1px solid var(--verde-borda)'}}>
              <p style={{fontSize:'0.8rem',fontWeight:700,color:'var(--verde-esc)',marginBottom:'0.25rem',textTransform:'uppercase',letterSpacing:'0.04em'}}>
                Faturamento {aba==='ontem'?'de ontem':aba==='semana'?'da semana':aba==='mes'?'do mÃªs':'do ano'}
              </p>
              <p style={{fontWeight:900,fontSize:'2.5rem',color:'var(--verde-esc)',fontFamily:'monospace',lineHeight:1}}>
                {formatCurrency(dados.faturamento)}
              </p>

              {/* ComparaÃ§Ã£o */}
              {dados.faturamentoPrev > 0 ? (
                dados.melhorMes && aba==='mes' ? (
                  <p style={{marginTop:'0.5rem',fontSize:'0.85rem',fontWeight:800,color:'var(--verde-esc)'}}>
                    ðŸ† Seu melhor mÃªs do ano atÃ© agora!
                  </p>
                ) : diff !== 0 ? (
                  <p style={{marginTop:'0.5rem',fontSize:'0.85rem',fontWeight:700,color: diff>0?'var(--verde-esc)':'var(--vermelho)'}}>
                    {diff>0?'â–²':'â–¼'} {formatCurrency(Math.abs(diff))} {diff>0?'a mais':'a menos'} que {getLabelPrev(aba)}
                  </p>
                ) : (
                  <p style={{marginTop:'0.5rem',fontSize:'0.82rem',color:'var(--texto-desab)'}}>Igual a {getLabelPrev(aba)}</p>
                )
              ) : null}
            </div>

            {/* Bloco 2 â€” 4 KPIs em linha */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'0.5rem'}}>
              {[
                { l:'Vendas',        v:String(dados.numVendas),          suf:'realizadas',   c:'var(--texto)' },
                { l:'Ticket mÃ©dio',  v:formatCurrency(ticket),           suf:'por venda',    c:'var(--verde)' },
                { l:'Despesas',      v:formatCurrency(dados.despesas),   suf:'no perÃ­odo',   c: dados.despesas>0?'var(--vermelho)':'var(--texto-desab)' },
                { l:'Lucro estimado',v:formatCurrency(dados.lucro),      suf:'lÃ­quido',      c: dados.lucro>=0?'var(--verde)':'var(--vermelho)' },
              ].map(k=>(
                <div key={k.l} style={{background:'var(--surface-alt)',borderRadius:'var(--radius-sm)',padding:'0.625rem 0.75rem',border:'1px solid var(--borda-leve)'}}>
                  <p style={{fontSize:'0.7rem',color:'var(--texto-desab)',fontWeight:600,marginBottom:'0.25rem'}}>{k.l}</p>
                  <p style={{fontWeight:900,fontSize:'1rem',color:k.c,fontFamily:'monospace',lineHeight:1}}>{k.v}</p>
                  <p style={{fontSize:'0.65rem',color:'var(--texto-desab)',marginTop:'2px'}}>{k.suf}</p>
                </div>
              ))}
            </div>

            {/* Bloco 3 â€” Alertas */}
            {(dados.produtosZerados.length > 0 || dados.fiadoAberto > 0 || dados.comissoesPendentes > 0) && (
              <div style={{display:'flex',flexDirection:'column',gap:'0.375rem'}}>
                {dados.produtosZerados.length > 0 && (
                  <div style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.5rem 0.75rem',background:'#fffbeb',border:'1px solid #fcd34d',borderRadius:'var(--radius-sm)',fontSize:'0.82rem'}}>
                    <span>âš ï¸</span>
                    <span style={{color:'#92400e',fontWeight:600}}>
                      <strong>{dados.produtosZerados.length} produto(s) zerado(s)</strong> que venderam nesse perÃ­odo: {dados.produtosZerados.slice(0,2).join(', ')}{dados.produtosZerados.length>2?` +${dados.produtosZerados.length-2}`:''}
                    </span>
                  </div>
                )}
                {dados.fiadoAberto > 0 && (
                  <div style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.5rem 0.75rem',background:'#fef3c7',border:'1px solid #fbbf24',borderRadius:'var(--radius-sm)',fontSize:'0.82rem'}}>
                    <span>ðŸ“’</span>
                    <span style={{color:'#92400e',fontWeight:600}}>
                      <strong>{formatCurrency(dados.fiadoAberto)}</strong> em fiado aberto gerado nesse perÃ­odo
                    </span>
                  </div>
                )}
                {dados.comissoesPendentes > 0 && (
                  <div style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.5rem 0.75rem',background:'#f0fdf4',border:'1px solid #86efac',borderRadius:'var(--radius-sm)',fontSize:'0.82rem'}}>
                    <span>ðŸŽ¯</span>
                    <span style={{color:'#166534',fontWeight:600}}>
                      <strong>{dados.comissoesPendentes} venda(s)</strong> com comissÃ£o a calcular
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Bloco 4 â€” Frase de encerramento */}
            {frase && (
              <div style={{padding:'0.625rem 1rem',background:'var(--surface-alt)',borderLeft:'3px solid var(--verde)',borderRadius:'0 var(--radius-sm) var(--radius-sm) 0',fontSize:'0.875rem',fontWeight:600,color:'var(--texto-sec)',fontStyle:'italic'}}>
                {frase}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

