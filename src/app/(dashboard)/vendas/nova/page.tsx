'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { X } from 'lucide-react'

type Preco = { varejo: number; atacado: number; vip: number }
type Produto = { id: string; emoji: string; nome: string; sku: string; preco: Preco; qtdMinAtacado: number; temSerie: boolean; temGarantia: string }
type ItemCarrinho = { produto: Produto; qty: number; serie: string; brinde: boolean; precoUsado: number; tabela: string }
type TipoCliente = 'varejo' | 'atacado' | 'vip'

const catalogo: Produto[] = [
  { id: '1', emoji: '🔊', nome: 'Som JBL Stage 200',         sku: 'JBL001', preco: { varejo: 450, atacado: 380, vip: 350 }, qtdMinAtacado: 3, temSerie: true,  temGarantia: '90 dias' },
  { id: '2', emoji: '📷', nome: 'Câmera de Ré Universal',     sku: 'CAM001', preco: { varejo: 120, atacado: 95,  vip: 85  }, qtdMinAtacado: 5, temSerie: false, temGarantia: '30 dias' },
  { id: '3', emoji: '📻', nome: 'Amplificador Taramps DS800', sku: 'AMP001', preco: { varejo: 780, atacado: 650, vip: 600 }, qtdMinAtacado: 2, temSerie: true,  temGarantia: '180 dias' },
  { id: '4', emoji: '🔌', nome: 'Cabo RCA 5m',                sku: 'CAB001', preco: { varejo: 25,  atacado: 18,  vip: 15  }, qtdMinAtacado: 10, temSerie: false, temGarantia: '' },
  { id: '5', emoji: '🚗', nome: 'Moldura Honda Civic 2019',   sku: 'MOL001', preco: { varejo: 89,  atacado: 70,  vip: 65  }, qtdMinAtacado: 5, temSerie: false, temGarantia: '' },
]

const puxadores = [{ id: '1', nome: 'Carlos' }, { id: '2', nome: 'Dona Marlene' }, { id: '3', nome: 'Seu Zé' }]
const formas = ['PIX', 'Dinheiro', 'Crédito', 'Débito', 'Fiado']

function getTabela(tipoCliente: TipoCliente, qty: number, p: Produto): TipoCliente {
  if (tipoCliente === 'vip') return 'vip'
  if (tipoCliente === 'atacado' || qty >= p.qtdMinAtacado) return 'atacado'
  return 'varejo'
}

export default function NovaPdvPage() {
  const [busca,      setBusca]      = useState('')
  const [itens,      setItens]      = useState<ItemCarrinho[]>([])
  const [tipoCliente,setTipoCliente]= useState<TipoCliente>('varejo')
  const [cliente,    setCliente]    = useState('')
  const [puxador,    setPuxador]    = useState('')
  const [pagamento,  setPagamento]  = useState('')
  const [desconto,   setDesconto]   = useState(0)
  const [troco,      setTroco]      = useState('')
  const [fase,       setFase]       = useState<'pdv'|'confirm'|'ok'>('pdv')
  const [numVenda,   setNumVenda]   = useState('')
  const [onboarding, setOnboarding] = useState(false)
  const [modalForn,  setModalForn]  = useState(false)
  const [pedProd,    setPedProd]    = useState('')
  const [pedForn,    setPedForn]    = useState('')
  const [pedQty,     setPedQty]     = useState('1')

  useEffect(() => {
    if (!localStorage.getItem('pdv_onboarding')) setOnboarding(true)
  }, [])

  function fecharOnboarding() {
    localStorage.setItem('pdv_onboarding', 'visto')
    setOnboarding(false)
  }

  const fornecedoresMock = [
    { id: '1', nome: 'JBL Distribuidora SP', tel: '11999990001' },
    { id: '2', nome: 'Auto Peças Central',   tel: '11999990002' },
    { id: '3', nome: 'Taramps Distribuidora', tel: '11999990003' },
  ]

  const resultados = busca.length >= 1
    ? catalogo.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()) || p.sku.toLowerCase().includes(busca.toLowerCase()))
    : []

  function addItem(p: Produto) {
    setBusca('')
    setItens(prev => {
      const idx = prev.findIndex(i => i.produto.id === p.id)
      if (idx >= 0) {
        const copy = [...prev]
        const newQty = copy[idx].qty + 1
        const tab = getTabela(tipoCliente, newQty, p)
        copy[idx] = { ...copy[idx], qty: newQty, tabela: tab, precoUsado: p.preco[tab] }
        return copy
      }
      const tab = getTabela(tipoCliente, 1, p)
      return [...prev, { produto: p, qty: 1, serie: '', brinde: false, precoUsado: p.preco[tab], tabela: tab }]
    })
  }

  function updateQty(idx: number, delta: number) {
    setItens(prev => {
      const copy = [...prev]
      const newQty = Math.max(1, copy[idx].qty + delta)
      const tab = getTabela(tipoCliente, newQty, copy[idx].produto)
      copy[idx] = { ...copy[idx], qty: newQty, tabela: tab, precoUsado: copy[idx].brinde ? 0 : copy[idx].produto.preco[tab] }
      return copy
    })
  }

  function toggleBrinde(idx: number) {
    setItens(prev => {
      const copy = [...prev]
      const brinde = !copy[idx].brinde
      const tab = getTabela(tipoCliente, copy[idx].qty, copy[idx].produto)
      copy[idx] = { ...copy[idx], brinde, precoUsado: brinde ? 0 : copy[idx].produto.preco[tab] }
      return copy
    })
  }

  function removeItem(idx: number) { setItens(prev => prev.filter((_,i) => i !== idx)) }

  const subtotal = itens.reduce((a,i) => a + i.precoUsado * i.qty, 0)
  const total    = Math.max(0, subtotal - desconto)
  const trcoNum  = pagamento === 'Dinheiro' && troco ? parseFloat(troco) - total : 0

  function finalizar() {
    const num = String(Math.floor(Math.random() * 9000) + 1000)
    setNumVenda(num)
    setFase('ok')
  }

  // Tela de sucesso
  if (fase === 'ok') return (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'60vh',gap:'1rem',textAlign:'center' }}>
      <div style={{ fontSize:'4rem' }}>✅</div>
      <h1 style={{ fontWeight:900,fontSize:'2rem',color:'var(--verde)' }}>Venda Concluída!</h1>
      <p style={{ fontSize:'1.25rem',color:'var(--texto-sec)' }}>Recibo <strong style={{color:'var(--verde)'}}>#{numVenda}</strong></p>
      <p style={{ fontWeight:800,fontSize:'1.5rem',color:'var(--verde)' }}>{formatCurrency(total)}</p>
      <div style={{ display:'flex',gap:'0.625rem',flexWrap:'wrap',justifyContent:'center',marginTop:'0.5rem' }}>
        <Link href={`/vendas/${numVenda}`} className="btn btn-secondary">🧾 Ver Recibo</Link>
        <button className="btn btn-primary" onClick={()=>{setItens([]);setFase('pdv');setPagamento('');setDesconto(0);setTroco('');setCliente('');setPuxador('')}}>
          + Nova Venda
        </button>
      </div>
    </div>
  )

  return (
    <div className="anim-fade" style={{ display:'flex',flexDirection:'column',gap:'0.875rem' }}>

      {/* Modal: Pedir ao Fornecedor */}
      {modalForn && (
        <div style={{ position:'fixed',inset:0,zIndex:200,background:'rgba(0,0,0,0.55)',display:'flex',alignItems:'center',justifyContent:'center' }}
          onClick={e=>{if(e.target===e.currentTarget)setModalForn(false)}}>
          <div className="card anim-pop" style={{ width:'100%',maxWidth:'400px',padding:'1.25rem' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem' }}>
              <p style={{ fontWeight:900 }}>📦 Pedir ao Fornecedor</p>
              <button onClick={()=>setModalForn(false)} style={{ background:'none',border:'none',cursor:'pointer' }}><X size={18}/></button>
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:'0.625rem' }}>
              <div><label className="campo-label">Produto / Item *</label>
                <input className="campo" value={pedProd} onChange={e=>setPedProd(e.target.value)} placeholder="Ex: Som JBL Stage 200"/>
              </div>
              <div><label className="campo-label">Fornecedor *</label>
                <select className="campo" value={pedForn} onChange={e=>setPedForn(e.target.value)}>
                  <option value="">Selecionar...</option>
                  {fornecedoresMock.map(f=><option key={f.id} value={`${f.nome}|${f.tel}`}>{f.nome}</option>)}
                </select>
              </div>
              <div><label className="campo-label">Quantidade *</label>
                <input className="campo" type="number" min="1" value={pedQty} onChange={e=>setPedQty(e.target.value)} style={{ width:'80px' }}/>
              </div>
            </div>
            <div style={{ marginTop:'1rem',display:'flex',gap:'0.5rem',justifyContent:'flex-end' }}>
              <button onClick={()=>setModalForn(false)} className="btn btn-secondary">Cancelar</button>
              <a href={pedForn ? `https://wa.me/55${pedForn.split('|')[1]}?text=${encodeURIComponent(`Oi ${pedForn.split('|')[0]}, preciso de ${pedQty}x ${pedProd} com urgência, cliente aguardando. Pode trazer?`)}` : '#'}
                target="_blank" rel="noopener noreferrer"
                className="btn" style={{ background:'#25D366',color:'#fff',border:'none',fontWeight:700,pointerEvents:!pedProd||!pedForn?'none':'auto',opacity:!pedProd||!pedForn?0.5:1 }}
                onClick={()=>{
                  const item = {id:String(Date.now()),produto:pedProd,fornecedor:pedForn.split('|')[0],qty:parseInt(pedQty),data:new Date().toLocaleDateString('pt-BR'),status:'aguardando'}
                  const saved = JSON.parse(localStorage.getItem('pedidosPendentes')||'[]')
                  localStorage.setItem('pedidosPendentes', JSON.stringify([...saved,item]))
                  setModalForn(false)
                }}
              >💬 Abrir WhatsApp</a>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding */}
      {onboarding && (
        <div style={{ background:'var(--verde)',color:'#fff',borderRadius:'var(--radius)',padding:'0.75rem 1rem',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'1rem' }}>
          <p style={{ fontWeight:700,fontSize:'0.875rem' }}>👋 Para começar: <strong>🔍 Busque um produto</strong> → <strong>💳 Escolha o pagamento</strong> → <strong>✅ Clique em Finalizar</strong></p>
          <button onClick={fecharOnboarding} style={{ background:'none',border:'none',cursor:'pointer',color:'#fff',flexShrink:0 }}><X size={18}/></button>
        </div>
      )}

      <div className="pg-header">
        <div><h1 className="pg-titulo">🛒 PDV — Nova Venda</h1><p className="pg-sub">Registre a venda rapidamente</p></div>
        <Link href="/vendas" className="btn btn-secondary">← Voltar</Link>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 340px',gap:'0.875rem',alignItems:'start' }}>

        {/* ── COLUNA ESQUERDA: busca + carrinho ── */}
        <div style={{ display:'flex',flexDirection:'column',gap:'0.75rem' }}>

          {/* Busca */}
          <div style={{ position:'relative' }}>
            <input
              id="pdv-busca"
              className="campo"
              style={{ fontSize:'1rem',padding:'0.75rem',paddingLeft:'2.5rem' }}
              placeholder="🔍  Buscar produto por nome ou SKU..."
              value={busca}
              onChange={e=>setBusca(e.target.value)}
              autoFocus
            />
            {resultados.length > 0 && (
              <div className="card anim-pop" style={{ position:'absolute',top:'100%',left:0,right:0,zIndex:50,padding:0,marginTop:'2px',overflow:'hidden' }}>
                {resultados.map(p => (
                  <button key={p.id} onClick={()=>addItem(p)} style={{
                    display:'flex',alignItems:'center',gap:'0.75rem',width:'100%',padding:'0.625rem 0.875rem',
                    border:'none',borderBottom:'1px solid var(--borda-leve)',background:'transparent',
                    cursor:'pointer',textAlign:'left',fontFamily:'inherit'
                  }}
                    onMouseEnter={e=>(e.currentTarget.style.background='var(--verde-claro)')}
                    onMouseLeave={e=>(e.currentTarget.style.background='transparent')}
                  >
                    <span style={{fontSize:'1.5rem'}}>{p.emoji}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontWeight:700,fontSize:'0.875rem'}}>{p.nome}</p>
                      <p style={{fontSize:'0.72rem',color:'var(--texto-desab)'}}>SKU: {p.sku}</p>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <p style={{fontWeight:900,color:'var(--verde)',fontFamily:'monospace'}}>{formatCurrency(p.preco[tipoCliente])}</p>
                      {tipoCliente !== 'varejo' && <p style={{fontSize:'0.68rem',color:'var(--texto-desab)',textDecoration:'line-through'}}>{formatCurrency(p.preco.varejo)}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {/* Pedir ao Fornecedor - aparece quando busca sem resultado */}
            {busca.length >= 2 && resultados.length === 0 && (
              <div style={{ marginTop:'0.5rem',display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.625rem 0.875rem',background:'var(--surface)',border:'1px solid var(--borda)',borderRadius:'var(--radius-sm)' }}>
                <span style={{ color:'var(--texto-desab)',fontSize:'0.82rem' }}>Produto não encontrado em estoque</span>
                <button onClick={()=>{setPedProd(busca);setModalForn(true)}} className="btn btn-secondary" style={{ fontSize:'0.78rem',padding:'0.3rem 0.625rem',marginLeft:'auto',flexShrink:0 }}>
                  📦 Pedir ao Fornecedor
                </button>
              </div>
            )}
          </div>

          {/* Indicador de tabela de preços ativa */}
          {tipoCliente !== 'varejo' && (
            <div className="alerta alerta-info">
              <span>{tipoCliente === 'vip' ? '⭐' : '📦'}</span>
              <span>
                Tabela <strong>{tipoCliente === 'vip' ? 'VIP' : 'Atacado'}</strong> ativa — preços especiais aplicados automaticamente
              </span>
            </div>
          )}

          {/* Carrinho */}
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <div className="sec-header"><span>🛒 Carrinho ({itens.length} {itens.length === 1 ? 'item':'itens'})</span></div>

            {itens.length === 0 ? (
              <div style={{padding:'2.5rem',textAlign:'center'}}>
                <p style={{fontSize:'2rem'}}>🛒</p>
                <p style={{fontWeight:600,color:'var(--texto-desab)',marginTop:'0.5rem'}}>Carrinho vazio</p>
                <p style={{fontSize:'0.8rem',color:'var(--texto-desab)'}}>Busque um produto acima</p>
              </div>
            ) : (
              <div>
                {itens.map((item, idx) => (
                  <div key={idx} style={{
                    padding:'0.75rem 0.875rem',borderBottom:'1px solid var(--borda-leve)',
                    background: item.brinde ? 'var(--verde-claro)' : idx%2===0 ? '#fff' : 'var(--surface-alt)'
                  }}>
                    <div style={{display:'flex',alignItems:'flex-start',gap:'0.625rem'}}>
                      <span style={{fontSize:'1.5rem',flexShrink:0}}>{item.produto.emoji}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'0.5rem'}}>
                          <div>
                            <p style={{fontWeight:700,fontSize:'0.875rem'}}>{item.produto.nome}</p>
                            <div style={{display:'flex',gap:'0.375rem',marginTop:'2px',flexWrap:'wrap'}}>
                              {item.brinde
                                ? <><span className="tag tag-verde">🎁 BRINDE</span><span style={{fontSize:'0.7rem',color:'var(--texto-desab)',marginLeft:'4px'}}>custo: {formatCurrency(item.produto.preco.varejo * item.qty)}</span></>
                                : <span style={{fontSize:'0.7rem',color:'var(--texto-desab)',fontWeight:600}}>
                                    Tabela: {item.tabela.toUpperCase()}
                                    {item.tabela !== 'varejo' && <span style={{color:'var(--verde)',marginLeft:'4px'}}>↓ {Math.round((1 - item.produto.preco[item.tabela as TipoCliente]/item.produto.preco.varejo)*100)}% desc.</span>}
                                  </span>
                              }
                            </div>
                          </div>
                          <button onClick={()=>removeItem(idx)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--vermelho)',fontSize:'1rem',padding:'0',flexShrink:0}}>✕</button>
                        </div>

                        {item.produto.temSerie && !item.brinde && (
                          <input
                            className="campo"
                            style={{fontSize:'0.78rem',padding:'0.25rem 0.5rem',marginTop:'0.375rem',width:'100%'}}
                            placeholder="Nº de série (opcional)"
                            value={item.serie}
                            onChange={e=>{const c=[...itens];c[idx]={...c[idx],serie:e.target.value};setItens(c)}}
                          />
                        )}

                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:'0.5rem'}}>
                          {/* Qty */}
                          <div style={{display:'flex',alignItems:'center',gap:'0.25rem'}}>
                            <button onClick={()=>updateQty(idx,-1)} className="btn btn-secondary" style={{padding:'0.2rem 0.5rem',fontWeight:900}}>−</button>
                            <span style={{width:'32px',textAlign:'center',fontWeight:800,fontSize:'1rem'}}>{item.qty}</span>
                            <button onClick={()=>updateQty(idx,+1)} className="btn btn-secondary" style={{padding:'0.2rem 0.5rem',fontWeight:900}}>+</button>
                            <span style={{fontSize:'0.7rem',color:'var(--texto-desab)',marginLeft:'4px'}}>
                              (Atacado: {item.produto.qtdMinAtacado}+)
                            </span>
                          </div>

                          <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                            {/* Brinde toggle */}
                            <button
                              onClick={()=>toggleBrinde(idx)}
                              className={item.brinde ? 'btn btn-primary' : 'btn btn-secondary'}
                              style={{fontSize:'0.7rem',padding:'0.25rem 0.5rem'}}
                            >
                              🎁 {item.brinde ? 'Brinde ON' : 'Brinde'}
                            </button>
                            <span style={{fontWeight:900,fontFamily:'monospace',fontSize:'0.95rem',color:item.brinde?'var(--verde)':'var(--texto)'}}>
                              {item.brinde ? 'R$ 0,00' : formatCurrency(item.precoUsado * item.qty)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Desconto geral */}
                <div style={{padding:'0.75rem 0.875rem',background:'var(--surface-alt)',borderTop:'1px solid var(--borda-leve)',display:'flex',gap:'0.5rem',alignItems:'center'}}>
                  <label style={{fontSize:'0.78rem',fontWeight:700,color:'var(--texto-sec)',whiteSpace:'nowrap'}}>Desconto (R$):</label>
                  <input className="campo" type="number" min="0" style={{width:'110px',fontSize:'0.875rem'}}
                    placeholder="0,00" value={desconto||''} onChange={e=>setDesconto(parseFloat(e.target.value)||0)} />
                  <span style={{fontSize:'0.78rem',color:'var(--texto-desab)'}}>no total</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── COLUNA DIREITA: cliente + pgto + total ── */}
        <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>

          {/* Tipo de cliente */}
          <div className="card" style={{padding:'0.75rem'}}>
            <label className="campo-label">Tipo de Cliente</label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.25rem',marginTop:'0.375rem'}}>
              {(['varejo','atacado','vip'] as TipoCliente[]).map(t => (
                <button key={t} onClick={()=>{
                  setTipoCliente(t)
                  setItens(prev=>prev.map(i=>{
                    if(i.brinde) return i
                    const tab = getTabela(t, i.qty, i.produto)
                    return {...i, tabela:tab, precoUsado: i.produto.preco[tab]}
                  }))
                }}
                  style={{
                    padding:'0.5rem 0.25rem',borderRadius:'var(--radius-sm)',border:'1px solid',
                    cursor:'pointer',fontWeight:700,fontSize:'0.75rem',
                    background: tipoCliente===t ? 'var(--verde)' : 'var(--surface)',
                    color: tipoCliente===t ? '#fff' : 'var(--texto-sec)',
                    borderColor: tipoCliente===t ? 'var(--verde-esc)' : 'var(--borda)',
                    fontFamily:'inherit'
                  }}>
                  {t === 'varejo' ? '🏪 Varejo' : t === 'atacado' ? '📦 Atacado' : '⭐ VIP'}
                </button>
              ))}
            </div>
          </div>

          {/* Cliente */}
          <div className="card" style={{padding:'0.75rem',borderColor:pagamento==='Fiado'&&!cliente?'var(--vermelho)':'var(--borda)',borderWidth:'1px',borderStyle:'solid',borderRadius:'var(--radius)'}}>
            <label className="campo-label">
              Cliente {pagamento==='Fiado' ? <span style={{color:'var(--vermelho)',fontWeight:900}}>* obrigatório para Fiado</span> : '(opcional)'}
            </label>
            <input id="pdv-cliente" className="campo" style={{marginTop:'0.25rem',borderColor:pagamento==='Fiado'&&!cliente?'var(--vermelho)':undefined}} placeholder="Nome ou telefone..." value={cliente} onChange={e=>setCliente(e.target.value)} />
            {pagamento==='Fiado' && !cliente && (
              <p style={{fontSize:'0.75rem',color:'var(--vermelho)',marginTop:'0.25rem',fontWeight:600}}>⚠ Para venda fiada, o cliente precisa estar cadastrado</p>
            )}
            <div style={{display:'flex',gap:'0.375rem',marginTop:'0.375rem'}}>
              <button className="btn btn-secondary" style={{fontSize:'0.72rem',flex:1}} onClick={()=>setCliente('Anônimo')} disabled={pagamento==='Fiado'}>Anônimo</button>
              <button className="btn btn-secondary" style={{fontSize:'0.72rem',flex:1}}>+ Novo</button>
            </div>
          </div>

          {/* Puxador */}
          <div className="card" style={{padding:'0.75rem'}}>
            <label className="campo-label">Comissionado (opcional)</label>
            <select id="pdv-puxador" className="campo" style={{marginTop:'0.25rem'}} value={puxador} onChange={e=>setPuxador(e.target.value)}>
              <option value="">— Nenhum —</option>
              {puxadores.map(p => <option key={p.id} value={p.nome}>{p.nome}</option>)}
            </select>
          </div>

          {/* Forma de pagamento */}
          <div className="card" style={{padding:'0.75rem'}}>
            <label className="campo-label">Forma de Pagamento</label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.375rem',marginTop:'0.375rem'}}>
              {formas.map(f => (
                <button key={f} onClick={()=>setPagamento(f)} style={{
                  padding:'0.625rem 0.5rem',borderRadius:'var(--radius-sm)',
                  border:`2px solid ${pagamento===f ? 'var(--verde)' : 'var(--borda)'}`,
                  background: pagamento===f ? 'var(--verde-claro)' : 'var(--surface)',
                  color: pagamento===f ? 'var(--verde-esc)' : 'var(--texto-sec)',
                  fontWeight:800,fontSize:'0.8rem',cursor:'pointer',fontFamily:'inherit',
                  display:'flex',alignItems:'center',justifyContent:'center',gap:'0.25rem'
                }}>
                  {f==='PIX'?'📱':f==='Dinheiro'?'💵':f==='Crédito'?'💳':f==='Débito'?'💴':'📒'} {f}
                </button>
              ))}
            </div>
            {pagamento==='Dinheiro' && (
              <div style={{marginTop:'0.5rem'}}>
                <label className="campo-label">Dinheiro recebido (R$)</label>
                <input className="campo" type="number" style={{marginTop:'0.25rem'}} placeholder="0,00" value={troco} onChange={e=>setTroco(e.target.value)} />
                {trco > 0 && <p style={{fontSize:'0.82rem',fontWeight:700,color:'var(--verde)',marginTop:'4px'}}>Troco: {formatCurrency(trco)}</p>}
              </div>
            )}
          </div>

          {/* Resumo */}
          <div className="card" style={{padding:'0.75rem'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.25rem'}}>
              <span style={{fontSize:'0.82rem',color:'var(--texto-sec)'}}>Subtotal</span>
              <span style={{fontFamily:'monospace',fontWeight:600}}>{formatCurrency(subtotal)}</span>
            </div>
            {desconto > 0 && (
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.25rem'}}>
                <span style={{fontSize:'0.82rem',color:'var(--vermelho)'}}>Desconto</span>
                <span style={{fontFamily:'monospace',color:'var(--vermelho)',fontWeight:600}}>- {formatCurrency(desconto)}</span>
              </div>
            )}
            {itens.some(i=>i.brinde) && (
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.25rem'}}>
                <span style={{fontSize:'0.82rem',color:'var(--verde)'}}>🎁 Brindes</span>
                <span style={{fontFamily:'monospace',color:'var(--verde)',fontWeight:600,fontSize:'0.82rem'}}>R$ 0,00</span>
              </div>
            )}
            <div style={{display:'flex',justifyContent:'space-between',borderTop:'2px solid var(--borda)',paddingTop:'0.5rem',marginTop:'0.375rem'}}>
              <span style={{fontWeight:900,fontSize:'1rem'}}>TOTAL</span>
              <span style={{fontFamily:'monospace',fontWeight:900,fontSize:'1.5rem',color:'var(--verde)',lineHeight:1}}>{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Botão finalizar */}
          <button
            id="btn-finalizar-venda"
            className="btn btn-primary"
            style={{width:'100%',padding:'1rem',fontSize:'1rem',fontWeight:900,letterSpacing:'0.03em',
              background: itens.length>0 && pagamento && !(pagamento==='Fiado'&&!cliente) ? 'var(--verde)' : '#aaa',
              cursor: itens.length>0 && pagamento && !(pagamento==='Fiado'&&!cliente) ? 'pointer' : 'not-allowed'
            }}
            disabled={itens.length===0 || !pagamento || (pagamento==='Fiado' && !cliente)}
            onClick={()=>{
              if(pagamento==='Fiado' && total>0 && cliente) {
                const reg = {id:String(Date.now()),nome:cliente,tel:'',valorAberto:total,ultimaCompra:new Date().toLocaleDateString('pt-BR'),diasAberto:0}
                const saved = JSON.parse(localStorage.getItem('fiadosAbertos')||'[]')
                localStorage.setItem('fiadosAbertos', JSON.stringify([...saved,reg]))
              }
              finalizar()
            }}
          >
            {pagamento==='Fiado' ? '📒 REGISTRAR NO FIADO — ' : '✓ FINALIZAR VENDA — '}{formatCurrency(total)}
          </button>
          {(!pagamento || itens.length===0 || (pagamento==='Fiado'&&!cliente)) && (
            <p style={{fontSize:'0.75rem',color:pagamento==='Fiado'&&!cliente?'var(--vermelho)':'var(--texto-desab)',textAlign:'center',marginTop:'-0.375rem',fontWeight:pagamento==='Fiado'&&!cliente?700:400}}>
              {itens.length===0 ? 'Adicione ao menos 1 produto' : pagamento==='Fiado'&&!cliente ? '⚠ Informe o cliente para registrar no fiado' : 'Selecione a forma de pagamento'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
