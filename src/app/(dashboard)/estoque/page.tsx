'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { formatCurrency } from '@/lib/utils'
import { Loader2, Search } from 'lucide-react'
import { PageTabs } from '@/components/PageTabs'

type Produto = { id:string; nome:string; sku:string|null; categoria:string|null; qtd_atual:number; qtd_minima:number; preco_custo:number }
type Mov     = { id:string; tipo:string; quantidade:number; criado_em:string; obs:string|null; produtos:{ nome:string }[]|null }

export default function EstoquePage() {
  const { empresaId } = useEmpresaId()
  const [produtos,  setProdutos]  = useState<Produto[]>([])
  const [movs,      setMovs]      = useState<Mov[]>([])
  const [busca,     setBusca]     = useState('')
  const [filtro,    setFiltro]    = useState<'todos'|'criticos'|'brindes'>('todos')
  const [loading,   setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [ajuste, setAjuste]       = useState({ produtoId:'', tipo:'entrada' as 'entrada'|'ajuste', quantidade:1, obs:'' })

  useEffect(() => { if (empresaId) carregar(empresaId) }, [empresaId])

  async function carregar(eid: string) {
    setLoading(true)
    const supabase = createClient()
    const results = await Promise.allSettled([
      supabase.from('produtos').select('id,nome,sku,categoria,qtd_atual,qtd_minima,preco_custo').eq('empresa_id',eid).order('nome'),
      supabase.from('estoque_movimentacoes').select('id,tipo,quantidade,criado_em,obs,produtos(nome)').eq('empresa_id',eid).order('criado_em',{ascending:false}).limit(50),
    ])
    const getRes = (i: number): any => results[i].status === 'fulfilled' ? (results[i] as PromiseFulfilledResult<any>).value || {} : {}
    const { data: prods }     = getRes(0)
    const { data: movimentos } = getRes(1)
    setProdutos(prods||[])
    setMovs(movimentos||[])
    setLoading(false)
  }

  async function salvarAjuste() {
    if (!ajuste.produtoId || !empresaId) return
    const supabase = createClient()
    const delta = ajuste.tipo === 'entrada' ? Math.abs(ajuste.quantidade) : -Math.abs(ajuste.quantidade)
    const produto = produtos.find(p => p.id === ajuste.produtoId)
    if (!produto) return
    const novaQtd = Math.max(0, produto.qtd_atual + delta)
    await Promise.all([
      supabase.from('estoque_movimentacoes').insert({
        empresa_id: empresaId, produto_id: ajuste.produtoId,
        tipo: ajuste.tipo, quantidade: delta, obs: ajuste.obs || null
      }),
      supabase.from('produtos').update({ qtd_atual: novaQtd }).eq('id', ajuste.produtoId),
    ])
    setShowModal(false)
    carregar(empresaId)
  }

  const filtrados = produtos.filter(p => {
    const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase()) || (p.sku||'').toLowerCase().includes(busca.toLowerCase())
    const matchFiltro = filtro==='todos' ? true : filtro==='criticos' ? p.qtd_atual<=p.qtd_minima&&p.qtd_minima>0 : filtro==='brindes'
    return matchBusca && matchFiltro
  })

  const criticos      = produtos.filter(p => p.qtd_atual<=p.qtd_minima&&p.qtd_minima>0).length
  const valorEstoque  = produtos.reduce((a,p)=>a+p.qtd_atual*p.preco_custo,0)
  const totalItens    = produtos.reduce((a,p)=>a+p.qtd_atual,0)

  const tipoMov = { entrada:'ENTRADA', venda:'VENDA', brinde:'BRINDE', ajuste:'AJUSTE' } as Record<string,string>
  const corMov  = { entrada:'var(--verde)', venda:'var(--azul)', brinde:'var(--amarelo)', ajuste:'var(--texto-sec)' } as Record<string,string>

  return (
    <div className="anim-fade" style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">ESTOQUE — MOVIMENTAÇÕES</h1>
          <p className="pg-sub">VALOR EM ESTOQUE: {formatCurrency(valorEstoque)}</p>
        </div>
        <div style={{display:'flex',gap:'0.375rem'}}>
          <button onClick={()=>{setAjuste(p=>({...p,tipo:'ajuste'}));setShowModal(true)}} className="btn btn-secondary">- AJUSTE</button>
          <button onClick={()=>{setAjuste(p=>({...p,tipo:'entrada'}));setShowModal(true)}} className="btn btn-primary">+ ENTRADA</button>
        </div>
      </div>

      <PageTabs tabs={[
        { label: 'Produtos', href: '/produtos' },
        { label: 'Estoque e Movimentações', href: '/estoque' },
        { label: 'Catálogo Online', href: '/catalogo' }
      ]} />

      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.5rem'}}>
        {[
          {l:'VALOR ESTOQUE', v:formatCurrency(valorEstoque), dot:'var(--azul)',    c:'var(--texto-mono)'},
          {l:'TOTAL ITENS',   v:String(totalItens),           dot:'var(--verde)',   c:'var(--verde)'},
          {l:'ESTQ. CRÍTICO', v:String(criticos),             dot:criticos>0?'var(--vermelho)':'var(--verde)', c:criticos>0?'var(--vermelho)':'var(--verde)'},
        ].map(k=>(
          <div key={k.l} className="kpi-card">
            <div style={{display:'flex',alignItems:'center',gap:'0.35rem'}}>
              <span style={{color:k.dot,fontSize:'0.55rem'}}>●</span>
              <p className="kpi-label">{k.l}</p>
            </div>
            <p className="kpi-valor" style={{color:k.c,fontSize:'1.25rem'}}>{k.v}</p>
          </div>
        ))}
      </div>

      {criticos>0&&(
        <div className="alerta alerta-perigo">
          ⚠ <strong>{criticos} produto(s)</strong> abaixo do estoque mínimo
        </div>
      )}

      <div style={{display:'flex',gap:'0.375rem',flexWrap:'wrap',alignItems:'center'}}>
        {([['todos','TODOS'],['criticos','⚠ CRÍTICOS'],['brindes','★ BRINDES']] as const).map(([v,l])=>(
          <button key={v} onClick={()=>setFiltro(v)} className={filtro===v?'btn btn-primary':'btn btn-secondary'} style={{fontSize:'0.65rem',padding:'0.3rem 0.625rem'}}>{l}</button>
        ))}
        <input className="campo" placeholder="BUSCAR PRODUTO_" style={{flex:1,maxWidth:'280px'}} value={busca} onChange={e=>setBusca(e.target.value)}/>
      </div>

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:'2rem',flexDirection:'column',alignItems:'center',gap:'0.5rem'}}>
          <p style={{color:'var(--verde)',fontSize:'0.75rem',letterSpacing:'0.08em'}}>CARREGANDO ESTOQUE<span className="blink">_</span></p>
        </div>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>PRODUTO</th><th>SKU</th><th>CATEGORIA</th>
                <th style={{textAlign:'center'}}>ATUAL</th>
                <th style={{textAlign:'center'}}>MÍN.</th>
                <th style={{textAlign:'right'}}>CUSTO</th>
                <th style={{textAlign:'right'}}>TOTAL</th>
                <th style={{textAlign:'center'}}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(p=>{
                const critico = p.qtd_atual<=p.qtd_minima&&p.qtd_minima>0
                return (
                  <tr key={p.id}>
                    <td style={{fontWeight:700}}>{p.nome}</td>
                    <td style={{color:'var(--texto-mono)',fontSize:'0.72rem',letterSpacing:'0.04em'}}>{p.sku||'—'}</td>
                    <td style={{fontSize:'0.72rem',color:'var(--texto-sec)'}}>{p.categoria||'—'}</td>
                    <td style={{textAlign:'center',fontWeight:700,color:critico?'var(--vermelho)':'var(--verde)',fontVariantNumeric:'tabular-nums',fontSize:'1rem'}}>{p.qtd_atual}</td>
                    <td style={{textAlign:'center',color:'var(--texto-desab)',fontVariantNumeric:'tabular-nums'}}>{p.qtd_minima}</td>
                    <td style={{textAlign:'right',fontSize:'0.78rem',color:'var(--texto-sec)',fontVariantNumeric:'tabular-nums'}}>{formatCurrency(p.preco_custo)}</td>
                    <td style={{textAlign:'right',fontWeight:700,color:'var(--texto-mono)',fontVariantNumeric:'tabular-nums'}}>{formatCurrency(p.qtd_atual*p.preco_custo)}</td>
                    <td style={{textAlign:'center'}}>
                      <span className={critico?'status-erro':p.qtd_atual===0?'status-neutro':'status-ok'} style={{fontSize:'0.7rem'}}>
                        {critico?'⚠ CRÍTICO':p.qtd_atual===0?'ZERADO':'● OK'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Últimas movimentações */}
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div className="sec-header"><span>ÚLTIMAS MOVIMENTAÇÕES</span></div>
        <table className="tabela">
          <thead>
            <tr><th>PRODUTO</th><th>TIPO</th><th style={{textAlign:'center'}}>QTD</th><th>OBS.</th><th>DATA/HORA</th></tr>
          </thead>
          <tbody>
            {movs.length===0 ? (
              <tr><td colSpan={5} style={{textAlign:'center',color:'var(--texto-desab)',padding:'1.5rem',fontSize:'0.72rem',letterSpacing:'0.06em'}}>[ NENHUMA MOVIMENTAÇÃO REGISTRADA ]</td></tr>
            ) : movs.map(m=>(
              <tr key={m.id}>
                <td style={{fontWeight:600}}>{m.produtos?.[0]?.nome||'—'}</td>
                <td><span style={{fontSize:'0.68rem',fontWeight:700,color:corMov[m.tipo]||'var(--texto-sec)',letterSpacing:'0.06em'}}>{tipoMov[m.tipo]||m.tipo}</span></td>
                <td style={{textAlign:'center',fontWeight:700,color:m.quantidade>0?'var(--verde)':'var(--vermelho)',fontVariantNumeric:'tabular-nums'}}>
                  {m.quantidade>0?'+':''}{m.quantidade}
                </td>
                <td style={{fontSize:'0.72rem',color:'var(--texto-desab)'}}>{m.obs||'—'}</td>
                <td style={{fontSize:'0.68rem',color:'var(--texto-desab)',fontVariantNumeric:'tabular-nums'}}>
                  {new Date(m.criado_em).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal ajuste de estoque */}
      {showModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:'1rem'}}>
          <div className="anim-pop" style={{width:'100%',maxWidth:'400px',background:'var(--surface)',border:'1px solid var(--borda-forte)',borderRadius:'2px'}}>
            <div style={{padding:'0.75rem 1rem',borderBottom:'2px solid var(--verde)',display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--fundo-painel)'}}>
              <p style={{fontWeight:700,fontSize:'0.78rem',color:'var(--verde)',textTransform:'uppercase',letterSpacing:'0.06em'}}>AJUSTAR ESTOQUE</p>
              <button onClick={()=>setShowModal(false)} className="btn-icon" style={{fontSize:'0.8rem'}}>✕</button>
            </div>
            <div style={{padding:'1rem',display:'flex',flexDirection:'column',gap:'0.75rem'}}>
              <div>
                <label className="campo-label">PRODUTO *</label>
                <select className="campo" style={{marginTop:'0.25rem'}} value={ajuste.produtoId} onChange={e=>setAjuste(a=>({...a,produtoId:e.target.value}))}>
                  <option value="">Selecionar produto...</option>
                  {produtos.map(p=><option key={p.id} value={p.id}>{p.nome} (atual: {p.qtd_atual})</option>)}
                </select>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem'}}>
                <div>
                  <label className="campo-label">TIPO</label>
                  <select className="campo" style={{marginTop:'0.25rem'}} value={ajuste.tipo} onChange={e=>setAjuste(a=>({...a,tipo:e.target.value as 'entrada'|'ajuste'}))}>
                    <option value="entrada">ENTRADA (+)</option>
                    <option value="ajuste">AJUSTE (-)</option>
                  </select>
                </div>
                <div>
                  <label className="campo-label">QUANTIDADE</label>
                  <input className="campo" type="number" min="1" style={{marginTop:'0.25rem',textAlign:'center',fontWeight:700}} value={ajuste.quantidade} onChange={e=>setAjuste(a=>({...a,quantidade:parseInt(e.target.value)||1}))}/>
                </div>
              </div>
              <div>
                <label className="campo-label">OBSERVAÇÃO (OPCIONAL)</label>
                <input className="campo" style={{marginTop:'0.25rem'}} placeholder="Ex: Compra do fornecedor..." value={ajuste.obs} onChange={e=>setAjuste(a=>({...a,obs:e.target.value}))}/>
              </div>
              <div style={{display:'flex',gap:'0.375rem',justifyContent:'flex-end'}}>
                <button onClick={()=>setShowModal(false)} className="btn btn-secondary">CANCELAR</button>
                <button onClick={salvarAjuste} className="btn btn-primary" disabled={!ajuste.produtoId}>▶ CONFIRMAR</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
