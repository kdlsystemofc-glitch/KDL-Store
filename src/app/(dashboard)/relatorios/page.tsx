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
    const [ { data: v }, { data: i }, { data: d }, { data: c } ] = await Promise.all([
      supabase.from('vendas').select('id,total,desconto,forma_pagamento,status,comissionado_id,comissionado_nome').eq('empresa_id', eid).eq('status', 'concluida').gte('criado_em', inicioMes).lte('criado_em', fimMes),
      supabase.from('itens_venda').select('venda_id,produto_id,produto_nome,quantidade,preco_unitario,preco_custo,brinde').eq('empresa_id', eid).gte('criado_em', inicioMes).lte('criado_em', fimMes),
      supabase.from('despesas').select('valor').eq('empresa_id', eid).gte('data', inicioMes.slice(0,10)).lte('data', fimMes.slice(0,10)),
      supabase.from('comissoes').select('id,nome,tipo_comissao,taxa').eq('empresa_id', eid)
    ])

    // Filtra itens para considerar apenas os de vendas concluídas
    const vendasIds = new Set((v||[]).map(x => x.id))
    const itensConcluidos = (i||[]).filter(x => vendasIds.has(x.venda_id))

    setVendas(v || [])
    setItens(itensConcluidos)
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
    <div className="anim-fade" style={{display:'flex',flexDirection:'column',gap:'1.25rem'}}>
      <div className="pg-header no-print">
        <div>
          <h1 className="pg-titulo">📊 Relatório Consolidado</h1>
          <p className="pg-sub">DRE, Vendas e Comissões</p>
        </div>
        <div style={{display:'flex',gap:'0.5rem',alignItems:'center'}}>
          <input type="month" className="campo" style={{width:'auto'}} value={mesAno} onChange={e=>setMesAno(e.target.value)} />
          <button onClick={()=>window.print()} className="btn btn-secondary" style={{display:'flex',gap:'0.375rem',alignItems:'center'}}>
            <Printer size={15}/> Imprimir
          </button>
          <button onClick={()=>alert('Exportação em PDF será disponibilizada na próxima atualização!')} className="btn btn-primary" style={{display:'flex',gap:'0.375rem',alignItems:'center'}}>
            <Download size={15}/> Exportar PDF
          </button>
        </div>
      </div>

      <div className="print-only" style={{display:'none', marginBottom:'1rem'}}>
        <h2>Relatório Consolidado — {mesAno.split('-').reverse().join('/')}</h2>
      </div>

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:'3rem',color:'var(--texto-desab)'}}>
          <Loader2 size={24} style={{animation:'spin 1s linear infinite'}}/>
        </div>
      ) : vendas.length === 0 && despesas.length === 0 ? (
        <div style={{textAlign:'center',padding:'3rem',color:'var(--texto-desab)'}}>
          <p style={{fontSize:'2rem',marginBottom:'0.5rem'}}>👻</p>
          <p style={{fontWeight:700}}>Nenhum dado no período selecionado</p>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:'1.25rem'}}>
          
          {/* Seção 1: DRE */}
          <div className="card">
            <h2 style={{fontWeight:900,fontSize:'1.1rem',marginBottom:'1rem',borderBottom:'2px solid var(--borda)',paddingBottom:'0.5rem'}}>1. Resumo Financeiro (DRE Estimado)</h2>
            <div style={{display:'flex',flexDirection:'column',gap:'0.375rem',fontFamily:'monospace',fontSize:'0.9rem'}}>
              <div style={{display:'flex',justifyContent:'space-between',fontWeight:800}}><span>Faturamento Bruto</span><span>{formatCurrency(faturamentoBruto)} (100%)</span></div>
              <div style={{display:'flex',justifyContent:'space-between',color:'var(--vermelho)'}}><span>(-) Descontos Concedidos</span><span>{formatCurrency(totalDescontos)} ({pct(totalDescontos)})</span></div>
              <div style={{display:'flex',justifyContent:'space-between',color:'var(--vermelho)'}}><span>(-) Custo dos Produtos (CPV)</span><span>{formatCurrency(custoProdutos)} ({pct(custoProdutos)})</span></div>
              <div style={{display:'flex',justifyContent:'space-between',color:'var(--vermelho)'}}><span>(-) Custo de Brindes</span><span>{formatCurrency(custoBrindes)} ({pct(custoBrindes)})</span></div>
              <div style={{display:'flex',justifyContent:'space-between',color:'var(--vermelho)'}}><span>(-) Despesas Operacionais</span><span>{formatCurrency(despesasOp)} ({pct(despesasOp)})</span></div>
              <div style={{display:'flex',justifyContent:'space-between',fontWeight:900,fontSize:'1.1rem',marginTop:'0.5rem',paddingTop:'0.5rem',borderTop:'2px dashed var(--borda)',color:lucroLiquido>=0?'var(--verde)':'var(--vermelho)'}}>
                <span>(=) Lucro Líquido Estimado</span><span>{formatCurrency(lucroLiquido)} ({pct(Math.abs(lucroLiquido))})</span>
              </div>
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))',gap:'1.25rem'}}>
            
            {/* Seção 2: Top Produtos */}
            <div className="card">
              <h2 style={{fontWeight:900,fontSize:'1.1rem',marginBottom:'1rem'}}>2. Produtos Mais Vendidos</h2>
              {topProdutos.length === 0 ? <p style={{color:'var(--texto-desab)',fontSize:'0.85rem'}}>Nenhuma venda</p> : (
                <table className="tabela" style={{fontSize:'0.8rem'}}>
                  <thead><tr><th>Produto</th><th>Qtd</th><th>Receita</th><th>Margem</th></tr></thead>
                  <tbody>
                    {topProdutos.map(([nome, dados], i) => {
                      const margem = dados.receita > 0 ? ((dados.receita - dados.custo) / dados.receita) * 100 : 0
                      return (
                        <tr key={nome}>
                          <td style={{fontWeight:700,maxWidth:'150px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{i+1}. {nome}</td>
                          <td>{dados.qtd}</td>
                          <td style={{color:'var(--verde)',fontWeight:800}}>{formatCurrency(dados.receita)}</td>
                          <td>{margem.toFixed(1)}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:'1.25rem'}}>
              {/* Seção 3: Formas de Pagamento */}
              <div className="card">
                <h2 style={{fontWeight:900,fontSize:'1.1rem',marginBottom:'1rem'}}>3. Formas de Pagamento</h2>
                {formas.length === 0 ? <p style={{color:'var(--texto-desab)',fontSize:'0.85rem'}}>Nenhum pagamento</p> : (
                  <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
                    {formas.map(([forma, valor]) => (
                      <div key={forma}>
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.85rem',fontWeight:700,marginBottom:'2px'}}>
                          <span>{forma}</span><span>{formatCurrency(valor)} ({((valor/faturamentoLiquido)*100).toFixed(1)}%)</span>
                        </div>
                        <div style={{width:'100%',height:'6px',background:'var(--surface-alt)',borderRadius:'3px'}}>
                          <div style={{width:`${(valor/faturamentoLiquido)*100}%`,height:'100%',background:'var(--verde)',borderRadius:'3px'}}/>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Seção 4: Comissões */}
              <div className="card">
                <h2 style={{fontWeight:900,fontSize:'1.1rem',marginBottom:'1rem'}}>4. Comissões Geradas no Período</h2>
                <div style={{display:'flex',gap:'1rem',marginBottom:'1rem'}}>
                  <div><p style={{fontSize:'0.75rem',color:'var(--texto-desab)'}}>Total a Pagar</p><p style={{fontWeight:800,color:'var(--amarelo)'}}>{formatCurrency(totalComissoes)}</p></div>
                </div>
                {listaComissoes.length > 0 && (
                  <table className="tabela" style={{fontSize:'0.8rem'}}>
                    <thead><tr><th>Vendedor</th><th>Valor Total</th></tr></thead>
                    <tbody>
                      {listaComissoes.map((c) => (
                        <tr key={c.nome}>
                          <td style={{fontWeight:700}}>{c.nome}</td>
                          <td style={{color:c.valor>0?'var(--amarelo)':'var(--texto-desab)'}}>{formatCurrency(c.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
