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
    const [{ data: prods }, { data: movimentos }] = await Promise.all([
      supabase.from('produtos').select('id,nome,sku,categoria,qtd_atual,qtd_minima,preco_custo').eq('empresa_id',eid).order('nome'),
      supabase.from('estoque_movimentacoes').select('id,tipo,quantidade,criado_em,obs,produtos(nome)').eq('empresa_id',eid).order('criado_em',{ascending:false}).limit(50),
    ])
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

  const tipoMov = { entrada:'✅ Entrada', venda:'🛒 Venda', brinde:'🎁 Brinde', ajuste:'🔧 Ajuste' } as Record<string,string>

  return (
    <div className="anim-fade" style={{display:'flex',flexDirection:'column',gap:'0.875rem'}}>
      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">📉 Estoque</h1>
          <p className="pg-sub">Valor do estoque físico: {formatCurrency(valorEstoque)}</p>
        </div>
        <div style={{display:'flex',gap:'0.5rem'}}>
          <button onClick={()=>{setAjuste(p=>({...p,tipo:'ajuste'}));setShowModal(true)}} className="btn btn-secondary">Ajuste (-)</button>
          <button onClick={()=>{setAjuste(p=>({...p,tipo:'entrada'}));setShowModal(true)}} className="btn btn-primary">Entrada (+)</button>
        </div>
      </div>

      <PageTabs tabs={[
        { label: 'Produtos', href: '/produtos' },
        { label: 'Estoque e Movimentações', href: '/estoque' },
        { label: 'Catálogo Online', href: '/catalogo' }
      ]} />

      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.625rem'}}>
        {[
          {l:'Valor do estoque',  v:formatCurrency(valorEstoque), c:'var(--texto)'},
          {l:'Total de itens',    v:String(totalItens),           c:'var(--verde)'},
          {l:'Produtos críticos', v:String(criticos),             c:criticos>0?'var(--vermelho)':'var(--verde)'},
        ].map(k=>(
          <div key={k.l} className="card" style={{padding:'0.875rem'}}>
            <p style={{fontSize:'0.78rem',color:'var(--texto-desab)',marginBottom:'0.25rem'}}>{k.l}</p>
            <p style={{fontWeight:900,fontSize:'1.5rem',color:k.c,fontFamily:'monospace'}}>{k.v}</p>
          </div>
        ))}
      </div>

      {criticos>0&&(
        <div className="alerta alerta-perigo" style={{display:'flex',gap:'0.5rem',alignItems:'center'}}>
          ⚠️ <strong>{criticos} produto(s)</strong> abaixo do estoque mínimo
        </div>
      )}

      <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
        {([['todos','Todos'],['criticos','⚠ Críticos'],['brindes','🎁 Brindes']] as const).map(([v,l])=>(
          <button key={v} onClick={()=>setFiltro(v)} className={filtro===v?'btn btn-primary':'btn btn-secondary'} style={{fontSize:'0.78rem',padding:'0.25rem 0.625rem'}}>{l}</button>
        ))}
        <div style={{position:'relative',flex:1,maxWidth:'300px'}}>
          <Search size={13} style={{position:'absolute',left:'0.625rem',top:'50%',transform:'translateY(-50%)',color:'var(--texto-desab)'}}/>
          <input className="campo" placeholder="Buscar produto..." style={{paddingLeft:'2rem'}} value={busca} onChange={e=>setBusca(e.target.value)}/>
        </div>
      </div>

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:'2rem',gap:'0.75rem',color:'var(--texto-desab)'}}>
          <Loader2 size={18} style={{animation:'spin 1s linear infinite'}}/> Carregando...
        </div>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr style={{background:'#364a60'}}>
                <th>Produto</th><th>SKU</th><th>Categoria</th>
                <th style={{textAlign:'center'}}>Qtd. Atual</th>
                <th style={{textAlign:'center'}}>Mínimo</th>
                <th style={{textAlign:'right'}}>Custo unit.</th>
                <th style={{textAlign:'right'}}>Valor total</th>
                <th style={{textAlign:'center'}}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(p=>{
                const critico = p.qtd_atual<=p.qtd_minima&&p.qtd_minima>0
                return (
                  <tr key={p.id}>
                    <td style={{fontWeight:700}}>{p.nome}</td>
                    <td><code style={{fontSize:'0.78rem'}}>{p.sku||'—'}</code></td>
                    <td style={{fontSize:'0.82rem'}}>{p.categoria||'—'}</td>
                    <td style={{textAlign:'center',fontWeight:900,color:critico?'var(--vermelho)':'var(--verde)',fontFamily:'monospace',fontSize:'1.1rem'}}>{p.qtd_atual}</td>
                    <td style={{textAlign:'center',color:'var(--texto-desab)',fontFamily:'monospace'}}>{p.qtd_minima}</td>
                    <td style={{textAlign:'right',fontFamily:'monospace',fontSize:'0.85rem'}}>{formatCurrency(p.preco_custo)}</td>
                    <td style={{textAlign:'right',fontWeight:700,fontFamily:'monospace'}}>{formatCurrency(p.qtd_atual*p.preco_custo)}</td>
                    <td style={{textAlign:'center'}}>
                      <span className={critico?'status-perigo':p.qtd_atual===0?'status-neutro':'status-ok'} style={{fontSize:'0.78rem'}}>
                        {critico?'⚠ Crítico':p.qtd_atual===0?'Zerado':'OK'}
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
      <div>
        <p style={{fontWeight:800,marginBottom:'0.625rem'}}>📋 Últimas Movimentações</p>
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr style={{background:'#364a60'}}><th>Produto</th><th>Tipo</th><th style={{textAlign:'center'}}>Qtd</th><th>Observação</th><th>Data</th></tr>
            </thead>
            <tbody>
              {movs.length===0 ? (
                <tr><td colSpan={5} style={{textAlign:'center',color:'var(--texto-desab)',padding:'1.5rem'}}>Nenhuma movimentação registrada ainda</td></tr>
              ) : movs.map(m=>(
                <tr key={m.id}>
                  <td style={{fontWeight:600}}>{m.produtos?.[0]?.nome||'—'}</td>
                  <td><span style={{fontSize:'0.8rem'}}>{tipoMov[m.tipo]||m.tipo}</span></td>
                  <td style={{textAlign:'center',fontWeight:800,color:m.quantidade>0?'var(--verde)':'var(--vermelho)',fontFamily:'monospace'}}>
                    {m.quantidade>0?'+':''}{m.quantidade}
                  </td>
                  <td style={{fontSize:'0.8rem',color:'var(--texto-desab)'}}>{m.obs||'—'}</td>
                  <td style={{fontSize:'0.78rem',color:'var(--texto-desab)'}}>
                    {new Date(m.criado_em).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal ajuste de estoque */}
      {showModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div className="card" style={{width:'100%',maxWidth:'420px',margin:'1rem'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
              <h3 style={{fontWeight:800}}>Ajustar Estoque</h3>
              <button onClick={()=>setShowModal(false)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'1.25rem',color:'var(--texto-desab)'}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
              <div>
                <label className="campo-label">Produto *</label>
                <select className="campo" style={{marginTop:'0.375rem'}} value={ajuste.produtoId} onChange={e=>setAjuste(a=>({...a,produtoId:e.target.value}))}>
                  <option value="">Selecionar produto...</option>
                  {produtos.map(p=><option key={p.id} value={p.id}>{p.nome} (atual: {p.qtd_atual})</option>)}
                </select>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.625rem'}}>
                <div>
                  <label className="campo-label">Tipo</label>
                  <select className="campo" style={{marginTop:'0.375rem'}} value={ajuste.tipo} onChange={e=>setAjuste(a=>({...a,tipo:e.target.value as 'entrada'|'ajuste'}))}>
                    <option value="entrada">✅ Entrada</option>
                    <option value="ajuste">🔧 Ajuste</option>
                  </select>
                </div>
                <div>
                  <label className="campo-label">Quantidade</label>
                  <input className="campo" type="number" min="1" style={{marginTop:'0.375rem',textAlign:'center',fontWeight:800}} value={ajuste.quantidade} onChange={e=>setAjuste(a=>({...a,quantidade:parseInt(e.target.value)||1}))}/>
                </div>
              </div>
              <div>
                <label className="campo-label">Observação (opcional)</label>
                <input className="campo" style={{marginTop:'0.375rem'}} placeholder="Ex: Compra do fornecedor..." value={ajuste.obs} onChange={e=>setAjuste(a=>({...a,obs:e.target.value}))}/>
              </div>
              <div style={{display:'flex',gap:'0.5rem',justifyContent:'flex-end',marginTop:'0.5rem'}}>
                <button onClick={()=>setShowModal(false)} className="btn btn-ghost">Cancelar</button>
                <button onClick={salvarAjuste} className="btn btn-primary" disabled={!ajuste.produtoId}>Confirmar ajuste</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
