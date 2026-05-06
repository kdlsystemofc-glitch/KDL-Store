'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { formatCurrency } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

type VendaDia = { criado_em: string; total: number; forma_pagamento: string }
type ItemVenda = { produto_nome: string; quantidade: number; preco_unitario: number }

export default function RelatoriosPage() {
  const { empresaId } = useEmpresaId()
  const [vendas,    setVendas]    = useState<VendaDia[]>([])
  const [itens,     setItens]     = useState<ItemVenda[]>([])
  const [despTotal, setDespTotal] = useState(0)
  const [loading,   setLoading]   = useState(true)
  const [periodo,   setPeriodo]   = useState<'7'|'30'|'90'>('30')

  useEffect(() => { if (empresaId) carregar(empresaId, periodo) }, [empresaId, periodo])

  async function carregar(eid: string, dias: string) {
    setLoading(true)
    const desde = new Date(Date.now() - parseInt(dias) * 86400000).toISOString()
    const supabase = createClient()
    const [{ data: v }, { data: i }, { data: d }] = await Promise.all([
      supabase.from('vendas').select('criado_em,total,forma_pagamento').eq('empresa_id', eid).eq('status','concluida').gte('criado_em', desde).order('criado_em'),
      supabase.from('itens_venda').select('produto_nome,quantidade,preco_unitario').eq('empresa_id', eid).gte('criado_em', desde),
      supabase.from('despesas').select('valor').eq('empresa_id', eid).gte('criado_em', desde),
    ])
    setVendas(v || [])
    setItens(i || [])
    setDespTotal((d||[]).reduce((a,x)=>a+x.valor,0))
    setLoading(false)
  }

  const faturamento  = vendas.reduce((a,v)=>a+v.total,0)
  const qtdVendas    = vendas.length
  const ticket       = qtdVendas > 0 ? faturamento / qtdVendas : 0
  const lucroEstim   = faturamento - despTotal

  // Agrupamento por forma de pagamento
  const porForma: Record<string,number> = {}
  vendas.forEach(v => { porForma[v.forma_pagamento] = (porForma[v.forma_pagamento]||0) + v.total })
  const formas = Object.entries(porForma).sort((a,b)=>b[1]-a[1])

  // Top produtos
  const porProduto: Record<string,{ qtd:number; fat:number }> = {}
  itens.forEach(i => {
    if (!porProduto[i.produto_nome]) porProduto[i.produto_nome] = { qtd:0, fat:0 }
    porProduto[i.produto_nome].qtd += i.quantidade
    porProduto[i.produto_nome].fat += i.quantidade * i.preco_unitario
  })
  const topProdutos = Object.entries(porProduto).sort((a,b)=>b[1].fat-a[1].fat).slice(0,5)

  // Gráfico últimos 7 dias
  const porDia: Record<string,number> = {}
  vendas.forEach(v => {
    const d = v.criado_em.slice(0,10)
    porDia[d] = (porDia[d]||0) + v.total
  })
  const dias7 = Array.from({length:7},(_,i)=>{
    const d = new Date(Date.now()-(6-i)*86400000).toISOString().slice(0,10)
    return { dia: new Date(d+'T12:00').toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit'}), total: porDia[d]||0 }
  })
  const maxDia = Math.max(...dias7.map(d=>d.total), 1)

  return (
    <div className="anim-fade" style={{display:'flex',flexDirection:'column',gap:'0.875rem'}}>
      <div className="pg-header">
        <div><h1 className="pg-titulo">📊 Relatórios</h1>
          <p className="pg-sub">Análise real das suas vendas</p></div>
        <div style={{display:'flex',gap:'0.5rem'}}>
          {(['7','30','90'] as const).map(p=>(
            <button key={p} onClick={()=>setPeriodo(p)} className={periodo===p?'btn btn-primary':'btn btn-secondary'}>
              {p === '7' ? '7 dias' : p === '30' ? '30 dias' : '90 dias'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:'3rem',gap:'0.75rem',color:'var(--texto-desab)'}}>
          <Loader2 size={20} style={{animation:'spin 1s linear infinite'}}/> Carregando dados reais...
        </div>
      ) : vendas.length === 0 ? (
        <div style={{textAlign:'center',padding:'3rem',color:'var(--texto-desab)'}}>
          <p style={{fontSize:'2rem',marginBottom:'0.5rem'}}>📊</p>
          <p style={{fontWeight:700}}>Nenhuma venda no período</p>
          <p style={{fontSize:'0.85rem',marginTop:'0.25rem'}}>Registre vendas no PDV para ver os relatórios</p>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'0.625rem'}}>
            {[
              {l:'Faturamento',  v:formatCurrency(faturamento), c:'var(--verde)'},
              {l:'Nº de Vendas', v:String(qtdVendas),           c:'var(--texto)'},
              {l:'Ticket Médio', v:formatCurrency(ticket),      c:'var(--texto)'},
              {l:'Lucro Estimado',v:formatCurrency(lucroEstim), c:lucroEstim>=0?'var(--verde)':'var(--vermelho)'},
            ].map(k=>(
              <div key={k.l} className="card" style={{padding:'0.875rem'}}>
                <p style={{fontSize:'0.78rem',color:'var(--texto-desab)',marginBottom:'0.25rem'}}>{k.l}</p>
                <p style={{fontWeight:900,fontSize:'1.4rem',color:k.c,fontFamily:'monospace'}}>{k.v}</p>
              </div>
            ))}
          </div>

          {/* Gráfico 7 dias */}
          <div className="card">
            <p style={{fontWeight:800,marginBottom:'0.875rem'}}>📈 Faturamento — Últimos 7 dias</p>
            <div style={{display:'flex',gap:'0.375rem',alignItems:'flex-end',height:'100px'}}>
              {dias7.map((d,i)=>(
                <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'0.25rem',height:'100%',justifyContent:'flex-end'}}>
                  {d.total>0&&<p style={{fontSize:'0.6rem',fontWeight:700,color:'var(--verde)'}}>{(d.total/1000).toFixed(1)}k</p>}
                  <div style={{width:'100%',background:d.total>0?'var(--verde)':'var(--surface-alt)',height:`${Math.max((d.total/maxDia)*85,4)}%`,borderRadius:'3px 3px 0 0'}}/>
                  <p style={{fontSize:'0.65rem',color:'var(--texto-desab)',fontWeight:600}}>{d.dia}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.875rem'}}>
            {/* Formas de pagamento */}
            <div className="card">
              <p style={{fontWeight:800,marginBottom:'0.875rem'}}>💳 Por Forma de Pagamento</p>
              {formas.map(([forma,valor])=>(
                <div key={forma} style={{marginBottom:'0.625rem'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'3px'}}>
                    <span style={{fontWeight:600,fontSize:'0.85rem'}}>{forma}</span>
                    <span style={{fontWeight:800,fontFamily:'monospace',color:'var(--verde)'}}>{formatCurrency(valor)}</span>
                  </div>
                  <div style={{height:'8px',background:'var(--surface-alt)',borderRadius:'2px',overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${(valor/faturamento)*100}%`,background:'var(--verde)',borderRadius:'2px'}}/>
                  </div>
                  <p style={{fontSize:'0.7rem',color:'var(--texto-desab)',marginTop:'2px'}}>{((valor/faturamento)*100).toFixed(1)}%</p>
                </div>
              ))}
            </div>

            {/* Top Produtos */}
            <div className="card">
              <p style={{fontWeight:800,marginBottom:'0.875rem'}}>🏆 Produtos Mais Vendidos</p>
              {topProdutos.length===0 ? (
                <p style={{color:'var(--texto-desab)',fontSize:'0.85rem'}}>Nenhum item registrado</p>
              ) : topProdutos.map(([nome,{qtd,fat}],i)=>(
                <div key={nome} style={{display:'flex',alignItems:'center',gap:'0.625rem',padding:'0.5rem 0',borderBottom:i<topProdutos.length-1?'1px solid var(--borda-leve)':'none'}}>
                  <span style={{fontWeight:900,fontSize:'1.1rem',width:'24px',textAlign:'center'}}>
                    {i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}.`}
                  </span>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontWeight:700,fontSize:'0.82rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{nome}</p>
                    <p style={{fontSize:'0.72rem',color:'var(--texto-desab)'}}>{qtd} unidades</p>
                  </div>
                  <span style={{fontWeight:900,color:'var(--verde)',fontFamily:'monospace',fontSize:'0.85rem',flexShrink:0}}>{formatCurrency(fat)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
