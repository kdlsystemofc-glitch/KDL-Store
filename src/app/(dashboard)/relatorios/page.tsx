'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { formatCurrency } from '@/lib/utils'
import { Loader2, Printer, Download } from 'lucide-react'

type Venda = { id: string; total: number; desconto: number; forma_pagamento: string; status: string; comissionado_id?: string; comissionado_nome?: string }
type ItemVenda = { produto_id: string; produto_nome: string; quantidade: number; preco_unitario: number; preco_custo: number; brinde: boolean }
type Despesa = { valor: number }
type Comissionado = { id: string; nome: string; tipo_comissao: string; taxa: number }

export default function RelatoriosPage() {
  const { empresaId } = useEmpresaId()
  const [loading, setLoading] = useState(true)
  
  // O input type="month" usa "YYYY-MM"
  const [mesAno, setMesAno] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
  })

  const [vendas, setVendas] = useState<Venda[]>([])
  const [itens, setItens] = useState<ItemVenda[]>([])
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [comissionados, setComissionados] = useState<Comissionado[]>([])

  useEffect(() => { if (empresaId) carregar(empresaId, mesAno) }, [empresaId, mesAno])

  async function carregar(eid: string, ma: string) {
    setLoading(true)
    const [ano, mes] = ma.split('-').map(Number)
    const inicioMes = new Date(ano, mes - 1, 1).toISOString()
    const fimMes    = new Date(ano, mes, 0, 23, 59, 59).toISOString()

    const supabase = createClient()
    const results = await Promise.allSettled([
      supabase.from('vendas').select('id,total,desconto,forma_pagamento,status,comissionado_id,comissionado_nome').eq('empresa_id', eid).eq('status', 'concluida').gte('criado_em', inicioMes).lte('criado_em', fimMes),
      supabase.from('despesas').select('valor').eq('empresa_id', eid).gte('data', inicioMes.slice(0,10)).lte('data', fimMes.slice(0,10)),
      supabase.from('comissoes').select('id,nome,tipo_comissao,taxa').eq('empresa_id', eid)
    ])

    const getRes = (index: number): any => results[index].status === 'fulfilled' ? (results[index] as PromiseFulfilledResult<any>).value || {} : {}
    
    const { data: v } = getRes(0)
    const { data: d } = getRes(1)
    const { data: c } = getRes(2)

    const vendasIds = (v||[]).map((x: any) => x.id)
    
    let allItens: ItemVenda[] = []
    if (vendasIds.length > 0) {
      // Chunk requests to avoid URL too long error
      for (let i = 0; i < vendasIds.length; i += 100) {
        const chunk = vendasIds.slice(i, i + 100)
        const { data: iChunk } = await supabase.from('itens_venda')
          .select('venda_id,produto_id,produto_nome,quantidade,preco_unitario,preco_custo,brinde')
          .in('venda_id', chunk)
        if (iChunk) allItens = allItens.concat(iChunk)
      }
    }

    setVendas(v || [])
    setItens(allItens)
    setDespesas(d || [])
    setComissionados(c || [])
    setLoading(false)
  }

  // Seção 1: Resumo Financeiro
  const faturamentoBruto = vendas.reduce((a,v) => a + (v.total + (v.desconto||0)), 0)
  const totalDescontos   = vendas.reduce((a,v) => a + (v.desconto||0), 0)
  const custoProdutos    = itens.filter(i => !i.brinde).reduce((a,i) => a + ((i.preco_custo||0) * i.quantidade), 0)
  const custoBrindes     = itens.filter(i => i.brinde).reduce((a,i) => a + ((i.preco_custo||0) * i.quantidade), 0)
  const despesasOp       = despesas.reduce((a,d) => a + d.valor, 0)
  const lucroLiquido     = faturamentoBruto - totalDescontos - custoProdutos - custoBrindes - despesasOp
  
  const pct = (val: number) => faturamentoBruto > 0 ? ((val / faturamentoBruto) * 100).toFixed(1) + '%' : '0.0%'

  // Seção 2: Produtos mais vendidos
  const pMap: Record<string, { qtd:number; receita:number; custo:number }> = {}
  itens.filter(i => !i.brinde).forEach(i => {
    if (!pMap[i.produto_nome]) pMap[i.produto_nome] = { qtd:0, receita:0, custo:0 }
    pMap[i.produto_nome].qtd += i.quantidade
    pMap[i.produto_nome].receita += (i.preco_unitario * i.quantidade)
    pMap[i.produto_nome].custo += ((i.preco_custo||0) * i.quantidade)
  })
  const topProdutos = Object.entries(pMap).sort((a,b) => b[1].receita - a[1].receita).slice(0, 10)

  // Seção 3: Formas de Pagamento
  const fMap: Record<string, number> = {}
  let faturamentoLiquido = 0
  vendas.forEach(v => {
    fMap[v.forma_pagamento] = (fMap[v.forma_pagamento]||0) + v.total
    faturamentoLiquido += v.total
  })
  const formas = Object.entries(fMap).sort((a,b) => b[1] - a[1])

  // Seção 4: Comissões
  const cMap: Record<string, { nome:string; valor:number }> = {}
  let totalComissoes = 0
  
  const mapCom = Object.fromEntries(comissionados.map(c => [c.id, c]))
  
  // Como não há tabela separada de status de pagamento por venda no DB ainda,
  // somamos o valor gerado pelas vendas comissionadas do mês.
  vendas.forEach(v => {
    if (v.comissionado_id && mapCom[v.comissionado_id]) {
      const c = mapCom[v.comissionado_id]
      const valor = c.tipo_comissao === 'percentual' ? (v.total * c.taxa) / 100 : c.taxa
      if (!cMap[c.id]) cMap[c.id] = { nome: c.nome, valor: 0 }
      cMap[c.id].valor += valor
      totalComissoes += valor
    }
  })
  
  const listaComissoes = Object.values(cMap).sort((a,b) => b.valor - a.valor)

  return (
    <div className="anim-fade" style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
      <div className="pg-header no-print">
        <div>
          <h1 className="pg-titulo">RELATÓRIO CONSOLIDADO</h1>
          <p className="pg-sub">DRE · TOP PRODUTOS · COMISSÕES</p>
        </div>
        <div style={{display:'flex',gap:'0.375rem',alignItems:'center'}}>
          <input type="month" className="campo" style={{width:'auto',fontSize:'0.75rem'}} value={mesAno} onChange={e=>setMesAno(e.target.value)} />
          <button onClick={()=>window.print()} className="btn btn-secondary" style={{fontSize:'0.72rem'}}>IMP.</button>
          <button onClick={()=>alert('Exportação em PDF será disponibilizada na próxima atualização!')} className="btn btn-primary" style={{fontSize:'0.72rem'}}>PDF</button>
        </div>
      </div>

      <div className="print-only" style={{display:'none', marginBottom:'1rem'}}>
        <h2>Relatório Consolidado — {mesAno.split('-').reverse().join('/')}</h2>
      </div>

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:'3rem',flexDirection:'column',alignItems:'center',gap:'0.5rem'}}>
          <p style={{color:'var(--verde)',fontSize:'0.75rem',letterSpacing:'0.08em'}}>GERANDO RELATÓRIO<span className="blink">_</span></p>
        </div>
      ) : vendas.length === 0 && despesas.length === 0 ? (
        <div style={{textAlign:'center',padding:'3rem',color:'var(--texto-desab)',border:'1px solid var(--borda)',background:'var(--surface)'}}>
          <p style={{fontSize:'0.7rem',letterSpacing:'0.1em',fontWeight:700,marginBottom:'0.375rem'}}>[ NENHUM DADO NO PERÍODO ]</p>
          <p style={{fontSize:'0.72rem'}}>Selecione outro mês ou registre vendas.</p>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>

          {/* Seção 1: DRE */}
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <div className="sec-header"><span>1. DRE ESTIMADO — RESUMO FINANCEIRO</span></div>
            <div style={{padding:'0.75rem',display:'flex',flexDirection:'column',gap:'0.25rem',fontVariantNumeric:'tabular-nums'}}>
              {[
                {l:'(+) FATURAMENTO BRUTO',      v:faturamentoBruto, pct:'100%',    c:'var(--verde)',    neg:false, bold:true},
                {l:'(-) DESCONTOS CONCEDIDOS',   v:totalDescontos,   pct:pct(totalDescontos),   c:'var(--vermelho)', neg:true,  bold:false},
                {l:'(-) CUSTO DOS PRODUTOS CPV', v:custoProdutos,    pct:pct(custoProdutos),    c:'var(--vermelho)', neg:true,  bold:false},
                {l:'(-) CUSTO DE BRINDES',       v:custoBrindes,     pct:pct(custoBrindes),     c:'var(--vermelho)', neg:true,  bold:false},
                {l:'(-) DESPESAS OPERACIONAIS',  v:despesasOp,       pct:pct(despesasOp),       c:'var(--vermelho)', neg:true,  bold:false},
              ].map(r=>(
                <div key={r.l} style={{display:'flex',justifyContent:'space-between',padding:'0.25rem 0',borderBottom:'1px solid var(--borda-leve)'}}>
                  <span style={{fontSize:'0.72rem',letterSpacing:'0.04em',color:r.bold?'var(--texto)':'var(--texto-sec)',fontWeight:r.bold?700:400}}>{r.l}</span>
                  <span style={{fontSize:'0.78rem',fontWeight:700,color:r.c}}>{r.neg?'- ':''}{formatCurrency(r.v)} <span style={{fontSize:'0.65rem',opacity:.7}}>({r.pct})</span></span>
                </div>
              ))}
              <div style={{display:'flex',justifyContent:'space-between',padding:'0.5rem 0',borderTop:'1px dashed var(--borda-forte)',marginTop:'0.25rem'}}>
                <span style={{fontWeight:700,fontSize:'0.75rem',letterSpacing:'0.06em'}}>{'(=) LUCRO LÍQUIDO ESTIMADO'}</span>
                <span style={{fontWeight:700,fontSize:'1rem',color:lucroLiquido>=0?'var(--verde)':'var(--vermelho)'}}>{formatCurrency(lucroLiquido)} <span style={{fontSize:'0.65rem'}}>({pct(Math.abs(lucroLiquido))})</span></span>
              </div>
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))',gap:'0.625rem'}}>

            {/* Seção 2: Top Produtos */}
            <div className="card" style={{padding:0,overflow:'hidden'}}>
              <div className="sec-header"><span>2. TOP 10 PRODUTOS MAIS VENDIDOS</span></div>
              {topProdutos.length === 0 ? <p style={{color:'var(--texto-desab)',fontSize:'0.72rem',padding:'1rem',letterSpacing:'0.04em'}}>[ NENHUMA VENDA ]</p> : (
                <table className="tabela" style={{fontSize:'0.72rem'}}>
                  <thead><tr><th>#</th><th>PRODUTO</th><th>QTD</th><th style={{textAlign:'right'}}>RECEITA</th><th>MRG</th></tr></thead>
                  <tbody>
                    {topProdutos.map(([nome, dados], i) => {
                      const margem = dados.receita > 0 ? ((dados.receita - dados.custo) / dados.receita) * 100 : 0
                      return (
                        <tr key={nome}>
                          <td style={{color:'var(--texto-desab)',width:'24px'}}>{i+1}</td>
                          <td style={{fontWeight:700,maxWidth:'130px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{nome}</td>
                          <td style={{fontVariantNumeric:'tabular-nums'}}>{dados.qtd}</td>
                          <td style={{textAlign:'right',color:'var(--verde)',fontWeight:700,fontVariantNumeric:'tabular-nums'}}>{formatCurrency(dados.receita)}</td>
                          <td style={{color:margem>20?'var(--verde)':'var(--texto-desab)'}}>{margem.toFixed(1)}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:'0.625rem'}}>
              {/* Seção 3: Formas de Pagamento */}
              <div className="card" style={{padding:0,overflow:'hidden'}}>
                <div className="sec-header"><span>3. FORMAS DE PAGAMENTO</span></div>
                <div style={{padding:'0.625rem'}}>
                  {formas.length === 0 ? <p style={{color:'var(--texto-desab)',fontSize:'0.72rem',letterSpacing:'0.04em'}}>[ NENHUM PAGAMENTO ]</p> : (
                    <div style={{display:'flex',flexDirection:'column',gap:'0.4rem'}}>
                      {formas.map(([forma, valor]) => (
                        <div key={forma}>
                          <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.7rem',fontWeight:700,marginBottom:'2px',textTransform:'uppercase',letterSpacing:'0.04em'}}>
                            <span>{forma}</span><span style={{color:'var(--verde)',fontVariantNumeric:'tabular-nums'}}>{formatCurrency(valor)} ({((valor/faturamentoLiquido)*100).toFixed(1)}%)</span>
                          </div>
                          <div style={{width:'100%',height:'5px',background:'var(--surface-alt)',border:'1px solid var(--borda-leve)'}}>
                            <div style={{width:`${(valor/faturamentoLiquido)*100}%`,height:'100%',background:'var(--verde)'}}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Seção 4: Comissões */}
              <div className="card" style={{padding:0,overflow:'hidden'}}>
                <div className="sec-header"><span>4. COMISSÕES GERADAS</span></div>
                <div style={{padding:'0.625rem'}}>
                  <div style={{display:'flex',gap:'0.5rem',marginBottom:'0.5rem'}}>
                    <div><p style={{fontSize:'0.65rem',color:'var(--texto-desab)',letterSpacing:'0.04em'}}>TOTAL A PAGAR</p><p style={{fontWeight:700,color:'var(--amarelo)',fontVariantNumeric:'tabular-nums'}}>{formatCurrency(totalComissoes)}</p></div>
                  </div>
                  {listaComissoes.length > 0 && (
                    <table className="tabela" style={{fontSize:'0.72rem'}}>
                      <thead><tr><th>VENDEDOR</th><th style={{textAlign:'right'}}>VALOR</th></tr></thead>
                      <tbody>
                        {listaComissoes.map((c) => (
                          <tr key={c.nome}>
                            <td style={{fontWeight:700}}>{c.nome}</td>
                            <td style={{textAlign:'right',color:c.valor>0?'var(--amarelo)':'var(--texto-desab)',fontWeight:700,fontVariantNumeric:'tabular-nums'}}>{formatCurrency(c.valor)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
