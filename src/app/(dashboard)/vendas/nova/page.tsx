'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { formatCurrency } from '@/lib/utils'
import { X, Loader2 } from 'lucide-react'

type ProdDB = { id:string; nome:string; sku:string|null; preco_varejo:number; preco_atacado:number|null; preco_vip:number|null; qtd_atual:number; tem_garantia:boolean; dias_garantia:number|null; texto_garantia:string|null }
type TipoCliente = 'varejo'|'atacado'|'vip'
type Item = { produto:ProdDB; qty:number; serie:string; brinde:boolean; precoUsado:number }

const FORMAS = ['PIX','Dinheiro','Crédito','Débito','Fiado']

function getPreco(p: ProdDB, tipo: TipoCliente): number {
  if (tipo === 'vip'     && p.preco_vip)     return p.preco_vip
  if (tipo === 'atacado' && p.preco_atacado) return p.preco_atacado
  return p.preco_varejo
}

export default function NovaPdvPage() {
  const { empresaId } = useEmpresaId()
  const [catalogo,    setCatalogo]    = useState<ProdDB[]>([])
  const [busca,       setBusca]       = useState('')
  const [itens,       setItens]       = useState<Item[]>([])
  const [tipoCliente, setTipoCliente] = useState<TipoCliente>('varejo')
  const [cliente,     setCliente]     = useState('')
  const [pagamento,   setPagamento]   = useState('')
  const [desconto,    setDesconto]    = useState(0)
  const [troco,       setTroco]       = useState('')
  const [fase,        setFase]        = useState<'pdv'|'ok'>('pdv')
  const [vendaId,     setVendaId]     = useState('')
  const [vendaNum,    setVendaNum]    = useState(0)
  const [salvando,    setSalvando]    = useState(false)
  const [erro,        setErro]        = useState<string|null>(null)

  const carregar = useCallback(async (eid: string) => {
    const { data } = await createClient()
      .from('produtos')
      .select('id,nome,sku,preco_varejo,preco_atacado,preco_vip,qtd_atual,tem_garantia,dias_garantia,texto_garantia')
      .eq('empresa_id', eid)
      .eq('ativo', true)
      .order('nome')
    setCatalogo(data || [])
  }, [])

  useEffect(() => { if (empresaId) carregar(empresaId) }, [empresaId, carregar])

  const resultados = busca.length >= 1
    ? catalogo.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()) || (p.sku||'').toLowerCase().includes(busca.toLowerCase()))
    : []

  function addItem(p: ProdDB) {
    setBusca('')
    setItens(prev => {
      const idx = prev.findIndex(i => i.produto.id === p.id)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1, precoUsado: getPreco(p, tipoCliente) }
        return copy
      }
      return [...prev, { produto: p, qty: 1, serie: '', brinde: false, precoUsado: getPreco(p, tipoCliente) }]
    })
  }

  function updateQty(idx: number, delta: number) {
    setItens(prev => {
      const copy = [...prev]
      const qty  = Math.max(1, copy[idx].qty + delta)
      copy[idx]  = { ...copy[idx], qty, precoUsado: copy[idx].brinde ? 0 : getPreco(copy[idx].produto, tipoCliente) }
      return copy
    })
  }

  function toggleBrinde(idx: number) {
    setItens(prev => {
      const copy   = [...prev]
      const brinde = !copy[idx].brinde
      copy[idx]    = { ...copy[idx], brinde, precoUsado: brinde ? 0 : getPreco(copy[idx].produto, tipoCliente) }
      return copy
    })
  }

  const subtotal = itens.reduce((a,i) => a + i.precoUsado * i.qty, 0)
  const total    = Math.max(0, subtotal - desconto)

  async function finalizar() {
    if (!empresaId) return
    if (pagamento === 'Fiado' && !cliente) { setErro('Informe o cliente para registrar no fiado.'); return }
    setSalvando(true); setErro(null)
    const supabase = createClient()

    // 1. Inserir venda
    const { data: venda, error: eVenda } = await supabase
      .from('vendas')
      .insert({ empresa_id:empresaId, cliente_nome:cliente||'Anônimo', forma_pagamento:pagamento, subtotal, desconto, total, status:'concluida' })
      .select('id,numero')
      .single()
    if (eVenda || !venda) { setErro('Erro ao salvar venda: '+(eVenda?.message||'')); setSalvando(false); return }

    // 2. Inserir itens + atualizar estoque
    const itensInsert = itens.map(i => ({
      venda_id:       venda.id,
      empresa_id:     empresaId,
      produto_id:     i.produto.id,
      produto_nome:   i.produto.nome,
      quantidade:     i.qty,
      preco_unitario: i.precoUsado,
      brinde:         i.brinde,
      num_serie:      i.serie || null,
    }))
    await supabase.from('itens_venda').insert(itensInsert)

    // 3. Descontar estoque
    for (const i of itens) {
      const novaQtd = Math.max(0, i.produto.qtd_atual - i.qty)
      await supabase.from('produtos').update({ qtd_atual: novaQtd }).eq('id', i.produto.id)
      await supabase.from('estoque_movimentacoes').insert({
        empresa_id: empresaId, produto_id: i.produto.id,
        tipo: i.brinde ? 'brinde' : 'venda', quantidade: -i.qty,
        obs: `Venda #${venda.numero}`,
      })
    }

    // 4. Fiado
    if (pagamento === 'Fiado') {
      await supabase.from('fiados').insert({
        empresa_id: empresaId, venda_id: venda.id,
        cliente_nome: cliente, valor_aberto: total, status: 'aberto',
      })
    }

    // 5. Garantias para produtos com garantia
    const garantiaItems = itens.filter(i => i.produto.tem_garantia && i.produto.dias_garantia && !i.brinde)
    for (const i of garantiaItems) {
      const venc = new Date()
      venc.setDate(venc.getDate() + (i.produto.dias_garantia!))
      await supabase.from('garantias').insert({
        empresa_id:      empresaId,
        venda_id:        venda.id,
        produto_id:      i.produto.id,
        produto_nome:    i.produto.nome,
        num_serie:       i.serie || null,
        cliente_nome:    cliente || 'Anônimo',
        data_compra:     new Date().toISOString().slice(0,10),
        data_vencimento: venc.toISOString().slice(0,10),
        texto_garantia:  i.produto.texto_garantia || null,
        status:          'ativa',
      })
    }

    setSalvando(false)
    setVendaId(venda.id)
    setVendaNum(venda.numero)
    setFase('ok')
    // Recarrega estoque do catalogo
    carregar(empresaId)
  }

  // ── Tela de sucesso
  if (fase === 'ok') return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'60vh',gap:'1rem',textAlign:'center'}}>
      <div style={{fontSize:'4rem'}}>✅</div>
      <h1 style={{fontWeight:900,fontSize:'2rem',color:'var(--verde)'}}>Venda Concluída!</h1>
      <p style={{fontSize:'1.25rem',color:'var(--texto-sec)'}}>Recibo <strong style={{color:'var(--verde)'}}>#{String(vendaNum).padStart(4,'0')}</strong></p>
      <p style={{fontWeight:800,fontSize:'1.5rem',color:'var(--verde)'}}>{formatCurrency(total)}</p>
      {pagamento==='Fiado' && <p style={{color:'var(--amarelo)',fontWeight:700}}>📒 Registrado no fiado de {cliente}</p>}
      <div style={{display:'flex',gap:'0.625rem',flexWrap:'wrap',justifyContent:'center',marginTop:'0.5rem'}}>
        <Link href={`/vendas/${vendaId}`} className="btn btn-secondary">🧾 Ver Recibo</Link>
        <button className="btn btn-primary" onClick={()=>{setItens([]);setFase('pdv');setPagamento('');setDesconto(0);setTroco('');setCliente('')}}>
          + Nova Venda
        </button>
      </div>
    </div>
  )

  return (
    <div className="anim-fade" style={{display:'flex',flexDirection:'column',gap:'0.875rem'}}>
      <div className="pg-header">
        <div><h1 className="pg-titulo">🛒 PDV — Nova Venda</h1><p className="pg-sub">Registre a venda rapidamente</p></div>
        <Link href="/vendas" className="btn btn-secondary">← Voltar</Link>
      </div>

      {erro && <div className="alerta alerta-perigo">{erro}</div>}

      <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:'0.875rem',alignItems:'start'}}>

        {/* ── ESQUERDA: busca + carrinho */}
        <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>

          {/* Busca */}
          <div style={{position:'relative'}}>
            <input id="pdv-busca" className="campo"
              style={{fontSize:'1rem',padding:'0.75rem',paddingLeft:'2.5rem'}}
              placeholder="🔍  Buscar produto por nome ou SKU..."
              value={busca} onChange={e=>setBusca(e.target.value)} autoFocus/>
            {resultados.length > 0 && (
              <div className="card anim-pop" style={{position:'absolute',top:'100%',left:0,right:0,zIndex:50,padding:0,marginTop:'2px',overflow:'hidden'}}>
                {resultados.map(p => (
                  <button key={p.id} onClick={()=>addItem(p)} style={{
                    display:'flex',alignItems:'center',gap:'0.75rem',width:'100%',padding:'0.625rem 0.875rem',
                    border:'none',borderBottom:'1px solid var(--borda-leve)',background:'transparent',cursor:'pointer',textAlign:'left',fontFamily:'inherit'
                  }}
                    onMouseEnter={e=>(e.currentTarget.style.background='var(--verde-claro)')}
                    onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontWeight:700,fontSize:'0.875rem'}}>{p.nome}</p>
                      <p style={{fontSize:'0.72rem',color:'var(--texto-desab)'}}>SKU: {p.sku||'—'} · Estoque: {p.qtd_atual}</p>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <p style={{fontWeight:900,color:'var(--verde)',fontFamily:'monospace'}}>{formatCurrency(getPreco(p,tipoCliente))}</p>
                      {tipoCliente!=='varejo' && <p style={{fontSize:'0.68rem',color:'var(--texto-desab)',textDecoration:'line-through'}}>{formatCurrency(p.preco_varejo)}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {busca.length >= 2 && resultados.length === 0 && (
              <div style={{marginTop:'0.5rem',padding:'0.625rem',background:'var(--surface)',border:'1px solid var(--borda)',borderRadius:'var(--radius-sm)',fontSize:'0.82rem',color:'var(--texto-desab)'}}>
                Produto não encontrado no estoque.
              </div>
            )}
          </div>

          {tipoCliente !== 'varejo' && (
            <div className="alerta alerta-info">
              {tipoCliente==='vip'?'⭐':'📦'} Tabela <strong>{tipoCliente==='vip'?'VIP':'Atacado'}</strong> ativa
            </div>
          )}

          {/* Carrinho */}
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <div className="sec-header"><span>🛒 Carrinho ({itens.length} {itens.length===1?'item':'itens'})</span></div>
            {itens.length === 0 ? (
              <div style={{padding:'2.5rem',textAlign:'center'}}>
                <p style={{fontSize:'2rem'}}>🛒</p>
                <p style={{fontWeight:600,color:'var(--texto-desab)',marginTop:'0.5rem'}}>Carrinho vazio — busque um produto acima</p>
              </div>
            ) : (
              <div>
                {itens.map((item,idx) => (
                  <div key={idx} style={{padding:'0.75rem 0.875rem',borderBottom:'1px solid var(--borda-leve)',background:item.brinde?'var(--verde-claro)':idx%2===0?'#fff':'var(--surface-alt)'}}>
                    <div style={{display:'flex',alignItems:'flex-start',gap:'0.625rem'}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                          <div>
                            <p style={{fontWeight:700,fontSize:'0.875rem'}}>{item.produto.nome}</p>
                            {item.brinde && <span className="tag tag-verde">🎁 BRINDE</span>}
                          </div>
                          <button onClick={()=>setItens(prev=>prev.filter((_,i)=>i!==idx))}
                            style={{background:'none',border:'none',cursor:'pointer',color:'var(--vermelho)',fontSize:'1rem'}}>✕</button>
                        </div>

                        {item.produto.tem_garantia && !item.brinde && (
                          <input className="campo" style={{fontSize:'0.78rem',padding:'0.25rem 0.5rem',marginTop:'0.375rem',width:'100%'}}
                            placeholder={`Nº de série (garantia: ${item.produto.dias_garantia}d)`}
                            value={item.serie} onChange={e=>{const c=[...itens];c[idx]={...c[idx],serie:e.target.value};setItens(c)}}/>
                        )}

                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:'0.5rem'}}>
                          <div style={{display:'flex',alignItems:'center',gap:'0.25rem'}}>
                            <button onClick={()=>updateQty(idx,-1)} className="btn btn-secondary" style={{padding:'0.2rem 0.5rem',fontWeight:900}}>−</button>
                            <span style={{width:'32px',textAlign:'center',fontWeight:800}}>{item.qty}</span>
                            <button onClick={()=>updateQty(idx,+1)} className="btn btn-secondary" style={{padding:'0.2rem 0.5rem',fontWeight:900}}>+</button>
                          </div>
                          <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                            <button onClick={()=>toggleBrinde(idx)}
                              className={item.brinde?'btn btn-primary':'btn btn-secondary'}
                              style={{fontSize:'0.7rem',padding:'0.25rem 0.5rem'}}>
                              🎁 {item.brinde?'Brinde ON':'Brinde'}
                            </button>
                            <span style={{fontWeight:900,fontFamily:'monospace',fontSize:'0.95rem',color:item.brinde?'var(--verde)':'var(--texto)'}}>
                              {item.brinde?'R$ 0,00':formatCurrency(item.precoUsado*item.qty)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{padding:'0.75rem 0.875rem',background:'var(--surface-alt)',borderTop:'1px solid var(--borda-leve)',display:'flex',gap:'0.5rem',alignItems:'center'}}>
                  <label style={{fontSize:'0.78rem',fontWeight:700,color:'var(--texto-sec)',whiteSpace:'nowrap'}}>Desconto (R$):</label>
                  <input className="campo" type="number" min="0" style={{width:'110px',fontSize:'0.875rem'}}
                    placeholder="0,00" value={desconto||''} onChange={e=>setDesconto(parseFloat(e.target.value)||0)}/>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── DIREITA: cliente + pgto + total */}
        <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>

          {/* Tipo cliente */}
          <div className="card" style={{padding:'0.75rem'}}>
            <label className="campo-label">Tipo de Cliente</label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.25rem',marginTop:'0.375rem'}}>
              {(['varejo','atacado','vip'] as TipoCliente[]).map(t=>(
                <button key={t} onClick={()=>{
                  setTipoCliente(t)
                  setItens(prev=>prev.map(i=>i.brinde?i:{...i,precoUsado:getPreco(i.produto,t)}))
                }} style={{
                  padding:'0.5rem 0.25rem',borderRadius:'var(--radius-sm)',border:'1px solid',
                  cursor:'pointer',fontWeight:700,fontSize:'0.75rem',fontFamily:'inherit',
                  background:tipoCliente===t?'var(--verde)':'var(--surface)',
                  color:tipoCliente===t?'#fff':'var(--texto-sec)',
                  borderColor:tipoCliente===t?'var(--verde-esc)':'var(--borda)',
                }}>
                  {t==='varejo'?'🏪 Varejo':t==='atacado'?'📦 Atacado':'⭐ VIP'}
                </button>
              ))}
            </div>
          </div>

          {/* Cliente */}
          <div className="card" style={{padding:'0.75rem',border:`1px solid ${pagamento==='Fiado'&&!cliente?'var(--vermelho)':'var(--borda)'}`,borderRadius:'var(--radius)'}}>
            <label className="campo-label">
              Cliente {pagamento==='Fiado'?<span style={{color:'var(--vermelho)',fontWeight:900}}>* obrigatório</span>:'(opcional)'}
            </label>
            <input id="pdv-cliente" className="campo" style={{marginTop:'0.25rem'}} placeholder="Nome..." value={cliente} onChange={e=>setCliente(e.target.value)}/>
            <div style={{display:'flex',gap:'0.375rem',marginTop:'0.375rem'}}>
              <button className="btn btn-secondary" style={{fontSize:'0.72rem',flex:1}} onClick={()=>setCliente('Anônimo')} disabled={pagamento==='Fiado'}>Anônimo</button>
            </div>
          </div>

          {/* Pagamento */}
          <div className="card" style={{padding:'0.75rem'}}>
            <label className="campo-label">Forma de Pagamento</label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.375rem',marginTop:'0.375rem'}}>
              {FORMAS.map(f=>(
                <button key={f} onClick={()=>setPagamento(f)} style={{
                  padding:'0.625rem 0.5rem',borderRadius:'var(--radius-sm)',
                  border:`2px solid ${pagamento===f?'var(--verde)':'var(--borda)'}`,
                  background:pagamento===f?'var(--verde-claro)':'var(--surface)',
                  color:pagamento===f?'var(--verde-esc)':'var(--texto-sec)',
                  fontWeight:800,fontSize:'0.8rem',cursor:'pointer',fontFamily:'inherit',
                }}>
                  {f==='PIX'?'📱':f==='Dinheiro'?'💵':f==='Crédito'?'💳':f==='Débito'?'💴':'📒'} {f}
                </button>
              ))}
            </div>
            {pagamento==='Dinheiro'&&(
              <div style={{marginTop:'0.5rem'}}>
                <label className="campo-label">Dinheiro recebido</label>
                <input className="campo" type="number" style={{marginTop:'0.25rem'}} placeholder="0,00" value={troco} onChange={e=>setTroco(e.target.value)}/>
                {troco&&parseFloat(troco)>0&&<p style={{fontSize:'0.82rem',fontWeight:700,color:'var(--verde)',marginTop:'4px'}}>Troco: {formatCurrency(Math.max(0,parseFloat(troco)-total))}</p>}
              </div>
            )}
          </div>

          {/* Resumo */}
          <div className="card" style={{padding:'0.75rem'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.25rem'}}>
              <span style={{fontSize:'0.82rem',color:'var(--texto-sec)'}}>Subtotal</span>
              <span style={{fontFamily:'monospace',fontWeight:600}}>{formatCurrency(subtotal)}</span>
            </div>
            {desconto>0&&(
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.25rem'}}>
                <span style={{fontSize:'0.82rem',color:'var(--vermelho)'}}>Desconto</span>
                <span style={{fontFamily:'monospace',color:'var(--vermelho)',fontWeight:600}}>- {formatCurrency(desconto)}</span>
              </div>
            )}
            <div style={{display:'flex',justifyContent:'space-between',borderTop:'2px solid var(--borda)',paddingTop:'0.5rem',marginTop:'0.375rem'}}>
              <span style={{fontWeight:900,fontSize:'1rem'}}>TOTAL</span>
              <span style={{fontFamily:'monospace',fontWeight:900,fontSize:'1.5rem',color:'var(--verde)',lineHeight:1}}>{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Finalizar */}
          <button id="btn-finalizar-venda" className="btn btn-primary"
            style={{width:'100%',padding:'1rem',fontSize:'1rem',fontWeight:900,
              background:itens.length>0&&pagamento&&!(pagamento==='Fiado'&&!cliente)?'var(--verde)':'#aaa',
              cursor:itens.length>0&&pagamento&&!(pagamento==='Fiado'&&!cliente)?'pointer':'not-allowed'}}
            disabled={salvando||itens.length===0||!pagamento||(pagamento==='Fiado'&&!cliente)}
            onClick={finalizar}>
            {salvando?<><Loader2 size={16} style={{animation:'spin 1s linear infinite',display:'inline',marginRight:'0.5rem'}}/>Salvando...</>
              :`${pagamento==='Fiado'?'📒 REGISTRAR NO FIADO':'✓ FINALIZAR VENDA'} — ${formatCurrency(total)}`}
          </button>
          {(!pagamento||itens.length===0||(pagamento==='Fiado'&&!cliente))&&(
            <p style={{fontSize:'0.75rem',color:pagamento==='Fiado'&&!cliente?'var(--vermelho)':'var(--texto-desab)',textAlign:'center',fontWeight:pagamento==='Fiado'&&!cliente?700:400}}>
              {itens.length===0?'Adicione ao menos 1 produto':pagamento==='Fiado'&&!cliente?'⚠ Informe o cliente para o fiado':'Selecione a forma de pagamento'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
