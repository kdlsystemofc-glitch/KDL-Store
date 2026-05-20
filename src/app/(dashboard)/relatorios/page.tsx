'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { formatCurrency } from '@/lib/utils'
import { Loader2, Printer, Download } from 'lucide-react'
import { ProOnly } from '@/components/ProOnly'

type Venda = { id: string; total: number; desconto: number; forma_pagamento: string; status: string; criado_em: string; cliente_nome: string | null; comissionado_id?: string }
type ItemVenda = { produto_id: string; produto_nome: string; quantidade: number; preco_unitario: number; brinde: boolean }
type Despesa = { valor: number; data: string }
type Comissionado = { id: string; nome: string; tipo_comissao: string; taxa: number }

type PeriodoPreset = 'Essa semana' | 'Esse mês' | 'Mês anterior' | 'Esse ano' | 'Personalizado'

export default function RelatoriosPage() {
  const { empresaId } = useEmpresaId()
  const [loading, setLoading] = useState(true)
  
  const [preset, setPreset] = useState<PeriodoPreset>('Esse mês')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  const [vendas, setVendas] = useState<Venda[]>([])
  const [itens, setItens] = useState<ItemVenda[]>([])
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [comissionados, setComissionados] = useState<Comissionado[]>([])

  useEffect(() => {
    const hoje = new Date()
    let ini = new Date()
    let fim = new Date()

    if (preset === 'Essa semana') {
      const day = hoje.getDay()
      const diff = hoje.getDate() - day + (day === 0 ? -6 : 1) // segunda
      ini.setDate(diff)
      fim = new Date()
    } else if (preset === 'Esse mês') {
      ini = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
    } else if (preset === 'Mês anterior') {
      ini = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
      fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0)
    } else if (preset === 'Esse ano') {
      ini = new Date(hoje.getFullYear(), 0, 1)
      fim = new Date(hoje.getFullYear(), 11, 31)
    }
    
    if (preset !== 'Personalizado') {
      setDataInicio(ini.toISOString().slice(0,10))
      setDataFim(fim.toISOString().slice(0,10))
    }
  }, [preset])

  const carregar = useCallback(async (eid: string, ini: string, fim: string) => {
    if (!ini || !fim) return
    setLoading(true)

    const supabase = createClient()
    const results = await Promise.allSettled([
      supabase.from('vendas').select('id,total,desconto,forma_pagamento,status,criado_em,cliente_nome,comissionado_id')
        .eq('empresa_id', eid).eq('status', 'concluida')
        .gte('criado_em', `${ini}T00:00:00`).lte('criado_em', `${fim}T23:59:59`),
      supabase.from('despesas').select('valor,data')
        .eq('empresa_id', eid)
        .gte('data', ini).lte('data', fim),
      supabase.from('comissoes').select('id,nome,tipo_comissao,taxa').eq('empresa_id', eid)
    ])

    const getRes = (index: number): any => results[index].status === 'fulfilled' ? (results[index] as PromiseFulfilledResult<any>).value || {} : {}
    
    const { data: v } = getRes(0)
    const { data: d } = getRes(1)
    const { data: c } = getRes(2)

    const vendasIds = (v||[]).map((x: any) => x.id)
    
    let allItens: ItemVenda[] = []
    if (vendasIds.length > 0) {
      for (let i = 0; i < vendasIds.length; i += 100) {
        const chunk = vendasIds.slice(i, i + 100)
        const { data: iChunk } = await supabase.from('itens_venda')
          .select('produto_id,produto_nome,quantidade,preco_unitario,brinde')
          .in('venda_id', chunk)
        if (iChunk) allItens = allItens.concat(iChunk)
      }
    }

    setVendas(v || [])
    setItens(allItens)
    setDespesas(d || [])
    setComissionados(c || [])
    setLoading(false)
  }, [])

  useEffect(() => { 
    if (empresaId && dataInicio && dataFim) carregar(empresaId, dataInicio, dataFim) 
  }, [empresaId, dataInicio, dataFim, carregar])

  function exportCSV() {
    let csv = 'Data,Hora,Forma de Pagamento,Total,Desconto,Cliente\n'
    vendas.forEach(v => {
      const dataStr = new Date(v.criado_em).toLocaleDateString('pt-BR')
      const horaStr = new Date(v.criado_em).toLocaleTimeString('pt-BR')
      csv += `${dataStr},${horaStr},${v.forma_pagamento},${v.total},${v.desconto||0},${v.cliente_nome||'Anônimo'}\n`
    })
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio_vendas_${dataInicio}_a_${dataFim}.csv`
    a.click()
  }

  // ── SEÇÃO 2: Resumo Financeiro
  const faturamentoBruto = vendas.reduce((a,v) => a + v.total + (v.desconto||0), 0)
  const descontos        = vendas.reduce((a,v) => a + (v.desconto||0), 0)
  const faturamentoLiq   = faturamentoBruto - descontos
  const totalDespesas    = despesas.reduce((a,d) => a + d.valor, 0)
  const lucroEstimado    = faturamentoLiq - totalDespesas

  // ── SEÇÃO 3: Formas de Pagamento
  const fMap: Record<string, { qtd: number, valor: number }> = {}
  vendas.forEach(v => {
    if (!fMap[v.forma_pagamento]) fMap[v.forma_pagamento] = { qtd: 0, valor: 0 }
    fMap[v.forma_pagamento].qtd += 1
    fMap[v.forma_pagamento].valor += v.total
  })
  const formas = Object.entries(fMap).sort((a,b) => b[1].valor - a[1].valor)

  // ── SEÇÃO 4: Top Produtos
  const pMap: Record<string, { qtd: number, receita: number }> = {}
  itens.filter(i => !i.brinde).forEach(i => {
    if (!pMap[i.produto_nome]) pMap[i.produto_nome] = { qtd: 0, receita: 0 }
    pMap[i.produto_nome].qtd += i.quantidade
    pMap[i.produto_nome].receita += (i.preco_unitario * i.quantidade)
  })
  const topProdutos = Object.entries(pMap).sort((a,b) => b[1].receita - a[1].receita).slice(0, 10)

  // ── SEÇÃO 5: Desempenho por Dia
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const diaMap: number[] = [0,0,0,0,0,0,0]
  vendas.forEach(v => {
    const d = new Date(v.criado_em)
    diaMap[d.getDay()] += v.total
  })
  const maxDia = Math.max(...diaMap, 1)

  // ── SEÇÃO 6: Top Clientes
  const cMap: Record<string, { qtd: number, valor: number, ultima: string }> = {}
  vendas.forEach(v => {
    const nome = v.cliente_nome || 'Anônimo'
    if (!cMap[nome]) cMap[nome] = { qtd: 0, valor: 0, ultima: v.criado_em }
    cMap[nome].qtd += 1
    cMap[nome].valor += v.total
    if (v.criado_em > cMap[nome].ultima) cMap[nome].ultima = v.criado_em
  })
  const topClientes = Object.entries(cMap).sort((a,b) => b[1].valor - a[1].valor).slice(0, 5)

  // ── SEÇÃO 7: Comissões
  const comMap: Record<string, { nome: string, qtd: number, valorGerado: number, comissao: number }> = {}
  const configCom: Record<string, Comissionado> = {}
  comissionados.forEach(c => configCom[c.id] = c)

  vendas.forEach(v => {
    if (v.comissionado_id && configCom[v.comissionado_id]) {
      const cId = v.comissionado_id
      const cCfg = configCom[cId]
      if (!comMap[cId]) comMap[cId] = { nome: cCfg.nome, qtd: 0, valorGerado: 0, comissao: 0 }
      
      const comissao = cCfg.tipo_comissao === 'percentual' ? (v.total * cCfg.taxa) / 100 : cCfg.taxa
      comMap[cId].qtd += 1
      comMap[cId].valorGerado += v.total
      comMap[cId].comissao += comissao
    }
  })
  const topComissoes = Object.values(comMap).sort((a,b) => b.comissao - a.comissao)


  return (
    <ProOnly>
    <div className="anim-fade" style={{display:'flex',flexDirection:'column',gap:'0.875rem'}}>
      <style>{`
        @media print {
          aside, header, .no-print { display: none !important; }
          body, main { background: white !important; margin: 0 !important; padding: 0 !important; }
          .print-grid { display: block !important; }
          .print-grid > div { margin-bottom: 1rem; page-break-inside: avoid; }
          .card { border: 1px solid #ddd !important; box-shadow: none !important; }
        }
      `}</style>

      {/* HEADER + BOTÕES */}
      <div className="pg-header no-print">
        <div>
          <h1 className="pg-titulo">Relatórios Gerenciais</h1>
          <p className="pg-sub">Análise detalhada de performance</p>
        </div>
        <div style={{display:'flex',gap:'0.5rem',alignItems:'center'}}>
          <button onClick={exportCSV} className="btn btn-secondary" style={{fontSize:'0.72rem'}}>
            <Download size={14}/> Exportar CSV
          </button>
          <button onClick={()=>window.print()} className="btn btn-primary" style={{fontSize:'0.72rem'}}>
            <Printer size={14}/> Imprimir
          </button>
        </div>
      </div>

      <div className="print-only" style={{display:'none', marginBottom:'1.5rem', textAlign:'center'}}>
        <h2>Relatório Gerencial</h2>
        <p>Período: {dataInicio.split('-').reverse().join('/')} até {dataFim.split('-').reverse().join('/')}</p>
      </div>

      {/* SEÇÃO 1: Seletor de período */}
      <div className="card no-print" style={{padding:'0.875rem'}}>
        <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap',alignItems:'center'}}>
          {(['Essa semana','Esse mês','Mês anterior','Esse ano','Personalizado'] as PeriodoPreset[]).map(p=>(
            <button key={p} onClick={()=>setPreset(p)} className={preset===p?'btn btn-primary':'btn btn-secondary'} style={{fontSize:'0.75rem'}}>
              {p}
            </button>
          ))}
          {preset === 'Personalizado' && (
            <div style={{display:'flex',gap:'0.5rem',alignItems:'center',marginLeft:'auto'}}>
              <input type="date" className="campo" style={{padding:'0.4rem'}} value={dataInicio} onChange={e=>setDataInicio(e.target.value)} />
              <span style={{color:'var(--texto-desab)'}}>até</span>
              <input type="date" className="campo" style={{padding:'0.4rem'}} value={dataFim} onChange={e=>setDataFim(e.target.value)} />
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:'3rem',flexDirection:'column',alignItems:'center',gap:'0.5rem'}}>
          <Loader2 size={24} style={{animation:'spin 1s linear infinite', color:'var(--verde)'}}/>
          <p style={{color:'var(--verde)',fontSize:'0.75rem',letterSpacing:'0.08em'}}>GERANDO RELATÓRIO<span className="blink">_</span></p>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:'0.875rem'}}>
          
          {/* SEÇÃO 2: Resumo Financeiro (KPIs) */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:'0.625rem'}}>
            <div className="card" style={{padding:'1rem'}}>
              <p style={{fontSize:'0.78rem',color:'var(--texto-sec)',marginBottom:'0.25rem',fontWeight:700}}>Faturamento Bruto</p>
              <p style={{fontWeight:900,fontSize:'1.6rem',color:'var(--verde)'}}>{formatCurrency(faturamentoBruto)}</p>
            </div>
            <div className="card" style={{padding:'1rem'}}>
              <p style={{fontSize:'0.78rem',color:'var(--texto-sec)',marginBottom:'0.25rem',fontWeight:700}}>Descontos Concedidos</p>
              <p style={{fontWeight:900,fontSize:'1.6rem',color:'var(--vermelho)'}}>{formatCurrency(descontos)}</p>
            </div>
            <div className="card" style={{padding:'1rem'}}>
              <p style={{fontSize:'0.78rem',color:'var(--texto-sec)',marginBottom:'0.25rem',fontWeight:700}}>Total de Despesas</p>
              <p style={{fontWeight:900,fontSize:'1.6rem',color:'var(--vermelho)'}}>{formatCurrency(totalDespesas)}</p>
            </div>
            <div className="card" style={{padding:'1rem',background:'var(--verde-claro)',borderColor:'var(--verde)',boxShadow:'0 4px 12px rgba(0,191,165,0.1)'}}>
              <p style={{fontSize:'0.78rem',color:'var(--verde-esc)',marginBottom:'0.25rem',fontWeight:800}}>Lucro Estimado</p>
              <p style={{fontWeight:900,fontSize:'1.6rem',color:lucroEstimado>=0?'var(--verde-esc)':'#c0392b'}}>{formatCurrency(lucroEstimado)}</p>
            </div>
          </div>

          <div className="print-grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))',gap:'0.875rem'}}>
            
            {/* SEÇÃO 3: Vendas por forma de pagamento */}
            <div className="card" style={{padding:0,overflow:'hidden'}}>
              <div className="sec-header"><span>3. Formas de Pagamento</span></div>
              <table className="tabela">
                <thead><tr><th>Forma</th><th style={{textAlign:'center'}}>Qtd</th><th style={{textAlign:'right'}}>Valor</th><th>%</th></tr></thead>
                <tbody>
                  {formas.length===0 ? <tr><td colSpan={4} style={{textAlign:'center',padding:'1rem'}}>[ SEM DADOS ]</td></tr> :
                    formas.map(([forma, d])=>(
                      <tr key={forma}>
                        <td style={{fontWeight:700}}>{forma}</td>
                        <td style={{textAlign:'center'}}>{d.qtd}</td>
                        <td style={{textAlign:'right',fontWeight:700}}>{formatCurrency(d.valor)}</td>
                        <td style={{color:'var(--texto-desab)'}}>{faturamentoLiq>0?((d.valor/faturamentoLiq)*100).toFixed(1):0}%</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>

            {/* SEÇÃO 5: Desempenho por dia da semana */}
            <div className="card" style={{padding:0,overflow:'hidden',display:'flex',flexDirection:'column'}}>
              <div className="sec-header"><span>5. Desempenho por Dia da Semana</span></div>
              <div style={{padding:'1.25rem',flex:1,display:'flex',alignItems:'flex-end',gap:'8px',height:'180px',marginTop:'1rem'}}>
                {diaMap.map((val, i) => (
                  <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'0.5rem',height:'100%',justifyContent:'flex-end'}}>
                    <span style={{fontSize:'0.65rem',color:'var(--texto-desab)',fontWeight:700,fontFamily:'monospace'}}>{val>0?`R$${(val/1000).toFixed(1)}k`:''}</span>
                    <div style={{
                      width:'100%',maxWidth:'40px',background:'var(--verde)',borderRadius:'4px 4px 0 0',
                      height:`${val>0?Math.max((val/maxDia)*100,5):0}%`,
                      transition:'height 0.3s ease'
                    }} title={formatCurrency(val)} />
                    <span style={{fontSize:'0.75rem',fontWeight:700}}>{diasSemana[i]}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="print-grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))',gap:'0.875rem'}}>
            
            {/* SEÇÃO 4: Produtos mais vendidos */}
            <div className="card" style={{padding:0,overflow:'hidden'}}>
              <div className="sec-header"><span>4. Produtos Mais Vendidos (Top 10)</span></div>
              <table className="tabela">
                <thead><tr><th>Produto</th><th style={{textAlign:'center'}}>Qtd</th><th style={{textAlign:'right'}}>Receita</th><th>%</th></tr></thead>
                <tbody>
                  {topProdutos.length===0 ? <tr><td colSpan={4} style={{textAlign:'center',padding:'1rem'}}>[ SEM DADOS ]</td></tr> :
                    topProdutos.map(([nome, d])=>(
                      <tr key={nome}>
                        <td style={{fontWeight:600,maxWidth:'150px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{nome}</td>
                        <td style={{textAlign:'center'}}>{d.qtd}</td>
                        <td style={{textAlign:'right',fontWeight:700}}>{formatCurrency(d.receita)}</td>
                        <td style={{color:'var(--texto-desab)'}}>{faturamentoLiq>0?((d.receita/faturamentoLiq)*100).toFixed(1):0}%</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>

            {/* SEÇÃO 6: Clientes que mais compraram */}
            <div className="card" style={{padding:0,overflow:'hidden'}}>
              <div className="sec-header"><span>6. Melhores Clientes (Top 5)</span></div>
              <table className="tabela">
                <thead><tr><th>Cliente</th><th style={{textAlign:'center'}}>Compras</th><th style={{textAlign:'right'}}>Total</th><th>Última</th></tr></thead>
                <tbody>
                  {topClientes.length===0 ? <tr><td colSpan={4} style={{textAlign:'center',padding:'1rem'}}>[ SEM DADOS ]</td></tr> :
                    topClientes.map(([nome, d])=>(
                      <tr key={nome}>
                        <td style={{fontWeight:700}}>{nome}</td>
                        <td style={{textAlign:'center'}}>{d.qtd}</td>
                        <td style={{textAlign:'right',fontWeight:700,color:'var(--verde)'}}>{formatCurrency(d.valor)}</td>
                        <td style={{fontSize:'0.7rem',color:'var(--texto-desab)'}}>{new Date(d.ultima).toLocaleDateString('pt-BR')}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>

          </div>

          {/* SEÇÃO 7: Comissões */}
          {comissionados.length > 0 && (
            <div className="card" style={{padding:0,overflow:'hidden'}}>
              <div className="sec-header"><span>7. Comissões do Período</span></div>
              <table className="tabela">
                <thead><tr><th>Comissionado</th><th style={{textAlign:'center'}}>Vendas</th><th style={{textAlign:'right'}}>Valor Gerado</th><th style={{textAlign:'right'}}>Pagar</th></tr></thead>
                <tbody>
                  {topComissoes.length===0 ? <tr><td colSpan={4} style={{textAlign:'center',padding:'1rem'}}>[ NENHUMA COMISSÃO REGISTRADA ]</td></tr> :
                    topComissoes.map((c)=>(
                      <tr key={c.nome}>
                        <td style={{fontWeight:700}}>{c.nome}</td>
                        <td style={{textAlign:'center'}}>{c.qtd}</td>
                        <td style={{textAlign:'right'}}>{formatCurrency(c.valorGerado)}</td>
                        <td style={{textAlign:'right',fontWeight:900,color:'var(--amarelo)'}}>{formatCurrency(c.comissao)}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}
    </div>
    </ProOnly>
  )
}
