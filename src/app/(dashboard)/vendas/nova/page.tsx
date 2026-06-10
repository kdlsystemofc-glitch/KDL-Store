'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { formatCurrency } from '@/lib/utils'
import { X, Loader2, Plus, Camera, UserPlus, Package } from 'lucide-react'
import { BarcodeScannerModal, useHasCamera } from '@/components/BarcodeScannerModal'
import { toast } from 'react-hot-toast'
import { useSubscription } from '@/hooks/useSubscription'

type ProdDB = { id:string; nome:string; sku:string|null; ean:string|null; preco_varejo:number; preco_atacado:number|null; preco_vip:number|null; preco_minimo:number|null; qtd_atual:number; tem_garantia:boolean; dias_garantia:number|null; texto_garantia:string|null }
// CL1+P1: tipo para cliente vinculado
type ClienteDB = { id: string; nome: string; telefone: string | null; tipo: string }
type TipoCliente = 'varejo'|'atacado'|'vip'
type Item = { produto:ProdDB; qty:number; serie:string; brinde:boolean; precoUsado:number }
type FormaPagto = { id: string; nome: string; taxa: number; ativo: boolean }

const FALLBACK_FORMAS: FormaPagto[] = [
  { id: '1', nome: 'Dinheiro', taxa: 0, ativo: true },
  { id: '2', nome: 'PIX', taxa: 0, ativo: true },
  { id: '3', nome: 'Cartão Débito', taxa: 1.5, ativo: true },
  { id: '4', nome: 'Cartão Crédito', taxa: 2.99, ativo: true },
]

function getPreco(p: ProdDB, tipo: TipoCliente): number {
  if (tipo === 'vip'     && p.preco_vip)     return p.preco_vip
  if (tipo === 'atacado' && p.preco_atacado) return p.preco_atacado
  return p.preco_varejo
}

export default function NovaPdvPage() {
  const { empresaId } = useEmpresaId()
  const { plano } = useSubscription()
  const [catalogo,    setCatalogo]    = useState<ProdDB[]>([])
  const [fiadosAtivos, setFiadosAtivos] = useState<string[]>([])
  // CL1+P1: lista de clientes cadastrados para autocomplete
  const [clientesDB,  setClientesDB]  = useState<ClienteDB[]>([])
  const [busca,       setBusca]       = useState('')
  const [itens,       setItens]       = useState<Item[]>([])
  const [tipoCliente, setTipoCliente] = useState<TipoCliente>('varejo')
  const [cliente,     setCliente]     = useState('')
  // CL1+P1: id do cliente selecionado (null = cliente anônimo/não cadastrado)
  const [clienteId,   setClienteId]   = useState<string | null>(null)
  const [clienteSugs, setClienteSugs] = useState<ClienteDB[]>([])
  const [pagamento,   setPagamento]   = useState('')
  const [desconto,    setDesconto]    = useState(0)
  const [descontoTipo, setDescontoTipo] = useState<'R$' | '%'>('R$')
  const [troco,       setTroco]       = useState('')
  const [prazoDias,   setPrazoDias]   = useState<number|null>(null)
  const [fase,        setFase]        = useState<'pdv'|'ok'>('pdv')
  const [vendaId,     setVendaId]     = useState('')
  const [vendaNum,    setVendaNum]    = useState(0)
  const [salvando,    setSalvando]    = useState(false)
  const [erro,        setErro]        = useState<string|null>(null)
  const [showModalCliente, setShowModalCliente] = useState(false)
  const [showCadastroRapido, setShowCadastroRapido] = useState(false)
  const [cadastroRapido, setCadastroRapido] = useState({ nome:'', cpf:'', telefone:'' })
  const [salvandoCadastro, setSalvandoCadastro] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [nomeOperador, setNomeOperador] = useState('Operador')
  const [formas,      setFormas]      = useState<FormaPagto[]>(FALLBACK_FORMAS)
  const [repassarTaxa, setRepassarTaxa] = useState(false)
  const [parcelas,    setParcelas]    = useState(1)
  const [jurosCredito, setJurosCredito] = useState(false)
  const hasCamera = useHasCamera()
  const [comissionados, setComissionados] = useState<{ id: string; nome: string }[]>([])
  const [comissionadoId, setComissionadoId] = useState<string | null>(null)
  // Feedback visual ao adicionar produto
  const [lastAddedId, setLastAddedId] = useState<string | null>(null)
  const lastAddedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Progresso de carga do catálogo
  const [catalogoTotal, setCatalogoTotal] = useState<number | null>(null)
  const [catalogoCarregados, setCatalogoCarregados] = useState(0)

  const CHUNK_SIZE = 200

  const carregar = useCallback(async (eid: string) => {
    const supabase = createClient()

    // — Carrega dados auxiliares em paralelo (leve)
    const [fAbertosRes, clisRes, fPagtosRes, comsRes, countRes] = await Promise.all([
      supabase.from('fiados').select('cliente_nome').eq('empresa_id', eid).eq('status', 'aberto'),
      supabase.from('clientes').select('id,nome,telefone,tipo').eq('empresa_id', eid).eq('ativo', true).order('nome'),
      supabase.from('formas_pagamento').select('id,nome,taxa,ativo').eq('empresa_id', eid).eq('ativo', true).order('nome'),
      supabase.from('comissoes').select('id,nome').eq('empresa_id', eid).eq('status', 'ativo').order('nome'),
      supabase.from('produtos').select('id', { count: 'exact', head: true }).eq('empresa_id', eid).eq('ativo', true),
    ])

    const total = countRes.count ?? 0
    setCatalogoTotal(total)
    setCatalogoCarregados(0)

    const list = fPagtosRes.data && fPagtosRes.data.length > 0 ? fPagtosRes.data : FALLBACK_FORMAS
    const finalPagtos = [...list]
    if (!finalPagtos.some(f => f.nome.toLowerCase() === 'fiado')) {
      finalPagtos.push({ id: 'fiado-id', nome: 'Fiado', taxa: 0, ativo: true })
    }

    setFiadosAtivos((fAbertosRes.data || []).map(f => f.cliente_nome.toLowerCase().trim()))
    setClientesDB(clisRes.data || [])
    setFormas(finalPagtos)
    setComissionados(comsRes.data || [])

    // — Carregamento do catálogo em chunks para não travar com catálogos grandes
    let offset = 0
    let acumulado: ProdDB[] = []
    while (offset < total || total === 0) {
      const { data: chunk } = await supabase
        .from('produtos')
        .select('id,nome,sku,ean,preco_varejo,preco_atacado,preco_vip,preco_minimo,qtd_atual,tem_garantia,dias_garantia,texto_garantia')
        .eq('empresa_id', eid)
        .eq('ativo', true)
        .order('nome')
        .range(offset, offset + CHUNK_SIZE - 1)

      if (!chunk || chunk.length === 0) break
      acumulado = [...acumulado, ...chunk]
      setCatalogo([...acumulado])
      setCatalogoCarregados(acumulado.length)
      offset += chunk.length
      if (chunk.length < CHUNK_SIZE) break
    }
    setCatalogoTotal(acumulado.length)
  }, [])

  useEffect(() => { if (empresaId) carregar(empresaId) }, [empresaId, carregar])

  // Busca o nome do operador logado para registrar na venda
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('nome').eq('id', user.id).single()
        .then(({ data: p }) => { if (p?.nome) setNomeOperador(p.nome) })
    })
  }, [])



  const resultados = busca.length >= 1
    ? catalogo.filter(p => {
        const query = busca.toLowerCase().trim()
        if (p.ean && p.ean.toLowerCase() === query) return true
        if (p.sku && p.sku.toLowerCase() === query) return true

        const words = query.split(/\s+/).filter(Boolean)
        if (words.length === 0) return false

        return words.every(word =>
          p.nome.toLowerCase().includes(word) ||
          (p.sku || '').toLowerCase().includes(word)
        )
      })
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
    // Feedback visual: flash no item + toast rápido
    if (lastAddedTimer.current) clearTimeout(lastAddedTimer.current)
    setLastAddedId(p.id)
    lastAddedTimer.current = setTimeout(() => setLastAddedId(null), 800)
    toast.success(`${p.nome} adicionado`, { duration: 1200, position: 'bottom-right',
      style: { fontSize: '0.78rem', padding: '6px 12px', background: 'var(--verde)', color: '#fff' } })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (resultados.length === 1) {
        addItem(resultados[0])
      }
    }
  }

  function handleScan(code: string) {
    setShowScanner(false)
    setBusca(code)
    const exato = catalogo.find(p => p.ean === code || p.sku === code)
    if (exato) {
      addItem(exato)
    }
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

  function getValorComJuros(principal: number, pQty: number, comJuros: boolean): number {
    if (!comJuros || pQty <= 1) return principal
    const taxaMensal = 0.0199 // 1.99% a.m.
    const pmt = principal * (taxaMensal * Math.pow(1 + taxaMensal, pQty)) / (Math.pow(1 + taxaMensal, pQty) - 1)
    return pmt * pQty
  }

  const subtotal = itens.reduce((a,i) => a + i.precoUsado * i.qty, 0)
  const descontoValor = descontoTipo === '%' ? subtotal * (desconto / 100) : desconto
  const totalSemTaxa = Math.max(0, subtotal - descontoValor)
  const formaSelecionada = formas.find(f => f.nome === pagamento)
  const taxaAplicada = formaSelecionada ? formaSelecionada.taxa : 0
  const valorTaxa = repassarTaxa ? (totalSemTaxa * (taxaAplicada / 100)) : 0
  
  const principal = totalSemTaxa + valorTaxa
  const isCredito = pagamento.toLowerCase().includes('crédito') || pagamento.toLowerCase().includes('credito')
  const total = isCredito ? getValorComJuros(principal, parcelas, jurosCredito) : principal

  async function finalizar() {
    if (!empresaId) return
    if (pagamento === 'Fiado' && !cliente) { setErro('Informe o cliente para registrar no fiado.'); return }
    if (pagamento === 'Fiado' && fiadosAtivos.includes((cliente||'').toLowerCase().trim())) {
      setErro(`🚨 O cliente "${cliente}" já possui um Fiado em aberto. Por favor, quite-o antes de abrir um novo.`)
      return
    }
    setSalvando(true); setErro(null)
    const supabase = createClient()
    
    // Preparar payload para o RPC
    const payloadItens = itens.map(i => ({
      produto_id: i.produto.id,
      produto_nome: i.produto.nome,
      quantidade: i.qty,
      preco_unitario: i.precoUsado,
      brinde: i.brinde,
      num_serie: i.serie || null,
      tem_garantia: i.produto.tem_garantia,
      dias_garantia: i.produto.dias_garantia,
      texto_garantia: i.produto.texto_garantia
    }))

    const isCredito = pagamento.toLowerCase().includes('crédito') || pagamento.toLowerCase().includes('credito')

    let finalObs = repassarTaxa 
      ? `Taxa de ${taxaAplicada}% repassada ao cliente (+${formatCurrency(valorTaxa)})` 
      : (taxaAplicada > 0 ? `Taxa de ${taxaAplicada}% absorvida pelo estabelecimento (-${formatCurrency(totalSemTaxa * (taxaAplicada / 100))})` : '')

    if (isCredito && jurosCredito && parcelas > 1) {
      finalObs += (finalObs ? ' | ' : '') + `Com juros de 1.99% a.m. (+${formatCurrency(total - principal)})`
    }

    const selectedComissionado = comissionados.find(c => c.id === comissionadoId)
    const comissionadoNome = selectedComissionado ? selectedComissionado.nome : null

    const { data: vendaId, error } = await supabase.rpc('checkout_venda_transaction', {
      p_empresa_id: empresaId,
      // CL1+P1: passa o UUID real do cliente quando selecionado
      p_cliente_id: clienteId,
      p_cliente_nome: cliente || 'Anônimo',
      p_forma_pagamento: pagamento + (isCredito ? ` (${parcelas}x)` : ''),
      p_total: total,
      p_desconto: descontoValor,
      p_comissionado_id: comissionadoId,
      p_comissionado_nome: comissionadoNome,
      p_registrado_nome: nomeOperador,
      p_obs: finalObs || null,
      p_itens: payloadItens,
      p_prazo_dias: prazoDias
    })

    if (error) {
      console.error('Erro na transação de venda:', error)
      setErro('Erro crítico ao processar a venda. Nenhuma cobrança ou baixa foi feita. Detalhes: ' + error.message)
      setSalvando(false)
      return
    }

    // CL1+P1: atualiza ultima_compra do cliente vinculado
    if (clienteId) {
      await supabase
        .from('clientes')
        .update({ ultima_compra: new Date().toISOString().slice(0, 10) })
        .eq('id', clienteId)
    }

    setSalvando(false)
    setVendaId(vendaId)
    // Para pegar o número sequencial gerado, faremos um fetch rápido
    const { data: fetchVenda } = await supabase.from('vendas').select('numero').eq('id', vendaId).single()
    if (fetchVenda) setVendaNum(fetchVenda.numero)
    
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
        <button className="btn btn-primary" onClick={()=>{setItens([]);setFase('pdv');setPagamento('');setDesconto(0);setDescontoTipo('R$');setTroco('');setCliente('');setClienteId(null);setClienteSugs([]);setPrazoDias(null);setRepassarTaxa(false);setParcelas(1);setJurosCredito(false);setTipoCliente('varejo');setComissionadoId(null)}}>
          + Nova Venda
        </button>
      </div>
    </div>
  )

  return (
    <div className="anim-fade" style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">PDV — FRENTE DE CAIXA</h1>
          <p className="pg-sub">REGISTRE A VENDA · ENTER ADICIONA PRODUTO</p>
        </div>
        <Link href="/vendas" className="btn btn-secondary">◀ VOLTAR</Link>
      </div>

      {erro && <div className="alerta alerta-perigo">{erro}</div>}

      <div className="pdv-grid">

        {/* ── ESQUERDA: busca + carrinho */}
        <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>

          {/* Busca */}
          <div style={{position:'relative', display:'flex', gap:'0.375rem'}}>
            <input id="pdv-busca" className="campo"
              style={{flex:1, fontSize:'0.9rem',padding:'0.625rem 0.75rem',letterSpacing:'0.02em'}}
              placeholder="BUSCAR POR NOME, SKU OU EAN_"
              value={busca} onChange={e=>setBusca(e.target.value)} onKeyDown={handleKeyDown} autoFocus/>
            {hasCamera && (
              <button type="button" onClick={() => setShowScanner(true)} className="btn btn-secondary" style={{ padding:'0 0.75rem' }} title="Ler código de barras">
                <Camera size={20}/>
              </button>
            )}
            
            {resultados.length > 0 && (
              <div className="anim-pop" style={{position:'absolute',top:'100%',left:0,right:0,zIndex:50,marginTop:'2px',overflow:'hidden',border:'1px solid var(--verde)',borderTop:'2px solid var(--verde)',background:'var(--surface)'}}>
                {resultados.map(p => (
                  <button key={p.id} onClick={()=>addItem(p)} style={{
                    display:'flex',alignItems:'center',gap:'0.75rem',width:'100%',padding:'0.5rem 0.75rem',
                    border:'none',borderBottom:'1px solid var(--borda-leve)',background:'transparent',cursor:'pointer',textAlign:'left',fontFamily:'inherit'
                  }}
                    onMouseEnter={e=>(e.currentTarget.style.background='var(--verde-claro)')}
                    onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontWeight:700,fontSize:'0.78rem',color:'var(--texto)'}}>{p.nome}</p>
                      <p style={{fontSize:'0.65rem',color:'var(--texto-desab)',letterSpacing:'0.02em'}}>SKU: {p.sku||'—'} · ESTQ: {p.qtd_atual}</p>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <p style={{fontWeight:700,color:'var(--verde)',fontVariantNumeric:'tabular-nums',fontSize:'0.82rem'}}>{formatCurrency(getPreco(p,tipoCliente))}</p>
                      {tipoCliente!=='varejo' && <p style={{fontSize:'0.65rem',color:'var(--texto-desab)',textDecoration:'line-through'}}>{formatCurrency(p.preco_varejo)}</p>}
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

          {/* Catálogo: barra de progresso de carga */}
          {catalogoTotal !== null && catalogoCarregados < catalogoTotal && (
            <div style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.375rem 0.625rem',background:'var(--azul-claro)',border:'1px solid var(--azul)',borderRadius:'var(--radius-sm)',fontSize:'0.72rem',color:'var(--azul)'}}>
              <Loader2 size={12} style={{animation:'spin 1s linear infinite',flexShrink:0}}/>
              <span>Carregando catálogo... <strong>{catalogoCarregados}</strong> de <strong>{catalogoTotal}</strong> produtos</span>
              <div style={{flex:1,height:'4px',background:'#c5d9f1',borderRadius:'2px',overflow:'hidden'}}>
                <div style={{height:'100%',background:'var(--azul)',width:`${Math.round((catalogoCarregados/catalogoTotal)*100)}%`,transition:'width 0.3s'}}/>
              </div>
            </div>
          )}

          {/* Carrinho */}
          <div style={{border:'1px solid var(--borda-forte)',borderTop:'2px solid var(--verde)',overflow:'hidden',background:'var(--surface)'}}>
            <div className="sec-header"><span>CARRINHO — {itens.length} {itens.length===1?'ITEM':'ITENS'}</span></div>
            {itens.length === 0 ? (
              <div style={{padding:'2rem',textAlign:'center'}}>
                <Package size={28} style={{color:'var(--borda-forte)',marginBottom:'0.5rem'}}/>
                <p style={{fontSize:'0.7rem',color:'var(--borda-forte)',letterSpacing:'0.1em',fontWeight:700}}>[ CARRINHO VAZIO ]</p>
                <p style={{fontSize:'0.7rem',color:'var(--texto-desab)',marginTop:'0.375rem'}}>Busque um produto acima ou leia um código de barras</p>
              </div>
            ) : (
              <div style={{maxHeight:'50vh',overflowY:'auto'}}>
                {itens.map((item,idx) => (
                  <div key={item.produto.id}
                    className={lastAddedId === item.produto.id ? 'pdv-item-flash' : ''}
                    style={{padding:'0.5rem 0.75rem',borderBottom:'1px solid var(--borda-leve)',background:item.brinde?'var(--verde-claro)':idx%2===0?'var(--surface)':'var(--surface-alt)',transition:'background 0.3s'}}>
                    <div style={{display:'flex',alignItems:'flex-start',gap:'0.625rem'}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                          <div>
                            <p style={{fontWeight:700,fontSize:'0.78rem',color:'var(--texto)'}}>{item.produto.nome}</p>
                            {item.brinde && <span className="tag tag-verde">★ BRINDE</span>}
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
                          <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'2px'}}>
                            <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                              <button onClick={()=>toggleBrinde(idx)}
                                className={item.brinde?'btn btn-primary':'btn btn-secondary'}
                                style={{fontSize:'0.7rem',padding:'0.25rem 0.5rem'}}>
                                🎁 {item.brinde?'Brinde ON':'Brinde'}
                              </button>
                              {item.brinde ? (
                                <span style={{fontWeight:900,fontFamily:'monospace',fontSize:'0.95rem',color:'var(--verde)'}}>R$ 0,00</span>
                              ) : (
                                <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end'}}>
                                  <div style={{display:'flex',alignItems:'center',gap:'0.25rem'}}>
                                    <span style={{fontSize:'0.72rem',color:'var(--texto-desab)'}}>R$</span>
                                    <input
                                      type="number" step="0.01" min="0"
                                      value={item.precoUsado}
                                      onChange={e => {
                                        const novo = parseFloat(e.target.value) || 0
                                        const copy = [...itens]; copy[idx] = {...copy[idx], precoUsado: novo}; setItens(copy)
                                      }}
                                      style={{
                                        width:'80px', padding:'0.2rem 0.4rem', fontFamily:'monospace', fontWeight:800, fontSize:'0.875rem',
                                        border:`1.5px solid ${item.produto.preco_minimo && item.precoUsado < item.produto.preco_minimo ? 'var(--vermelho)' : 'var(--borda)'}`,
                                        borderRadius:'var(--radius-sm)', background:'var(--surface)', color:'var(--texto)', textAlign:'right'
                                      }}
                                    />
                                  </div>
                                  {item.produto.preco_minimo && item.precoUsado < item.produto.preco_minimo && (
                                    <span style={{fontSize:'0.65rem',color:'var(--vermelho)',fontWeight:700,marginTop:'1px'}}>⚠ Abaixo do preço mínimo</span>
                                  )}
                                </div>
                              )}
                            </div>
                            {!item.brinde && (
                              <span style={{fontSize:'0.75rem',color:'var(--texto-desab)',fontFamily:'monospace'}}>
                                = {formatCurrency(item.precoUsado * item.qty)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{padding:'0.5rem 0.75rem',background:'var(--fundo-painel)',borderTop:'1px solid var(--borda-forte)',display:'flex',gap:'0.5rem',alignItems:'center',flexWrap:'wrap'}}>
                  <label style={{fontSize:'0.65rem',fontWeight:700,color:'var(--verde-muted)',whiteSpace:'nowrap',textTransform:'uppercase',letterSpacing:'0.06em'}}>DESCONTO:</label>
                  <div style={{display:'flex',gap:'0',border:'1px solid var(--borda)',borderRadius:'var(--radius-sm)',overflow:'hidden',flexShrink:0}}>
                    {(['R$','%'] as const).map(t => (
                      <button key={t} onClick={()=>{ setDescontoTipo(t); setDesconto(0) }}
                        style={{padding:'0.25rem 0.5rem',fontSize:'0.7rem',fontWeight:700,border:'none',cursor:'pointer',
                          background: descontoTipo===t ? 'var(--verde)' : 'var(--surface)',
                          color: descontoTipo===t ? '#060A06' : 'var(--texto-desab)',
                          transition:'all 0.12s'}}>{t}
                      </button>
                    ))}
                  </div>
                  <input className="campo" type="number" min="0" max={descontoTipo==='%'?100:undefined} style={{width:'90px',fontSize:'0.8rem'}}
                    placeholder={descontoTipo==='%'?'0%':'0,00'} value={desconto||''} onChange={e=>setDesconto(parseFloat(e.target.value)||0)}/>
                  {descontoTipo==='%' && desconto>0 && subtotal>0 && (
                    <span style={{fontSize:'0.72rem',color:'var(--verde)',fontWeight:700,fontFamily:'monospace'}}>= −{new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(subtotal*(desconto/100))}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── DIREITA: cliente + pgto + total */}
        <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>

          {/* Tipo cliente */}
          <div style={{border:'1px solid var(--borda-forte)',borderTop:'2px solid var(--borda-forte)',background:'var(--surface)',padding:'0.625rem'}}>
            <label className="campo-label">TABELA DE PREÇO</label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.25rem',marginTop:'0.375rem'}}>
              {(['varejo','atacado','vip'] as TipoCliente[]).map(t=>(
                <button key={t} onClick={()=>{
                  setTipoCliente(t)
                  setItens(prev=>prev.map(i=>i.brinde?i:{...i,precoUsado:getPreco(i.produto,t)}))
                }} className={tipoCliente===t ? 'btn btn-primary' : 'btn btn-secondary'}
                  style={{fontSize:'0.65rem',padding:'0.4rem 0.25rem',textTransform:'uppercase'}}>
                  {t==='varejo'?'VAREJO':t==='atacado'?'ATACADO':'VIP'}
                </button>
              ))}
            </div>
          </div>

          {/* Cliente com autocomplete */}
          <div className="card" style={{padding:'0.75rem',border:`1px solid ${pagamento==='Fiado'&&!cliente?'var(--vermelho)':'var(--borda)'}`,borderRadius:'var(--radius)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <label className="campo-label">
                Cliente {pagamento==='Fiado'?<span style={{color:'var(--vermelho)',fontWeight:900}}>* obrigatório</span>:'(opcional)'}
              </label>
              <button
                className={showCadastroRapido ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{fontSize:'0.62rem',padding:'0.15rem 0.45rem',display:'flex',alignItems:'center',gap:'0.2rem'}}
                onClick={()=>setShowCadastroRapido(v=>!v)}>
                <UserPlus size={11}/> {showCadastroRapido ? 'Cancelar' : 'Cadastro Rápido'}
              </button>
            </div>

            {/* Formulário de cadastro rápido inline */}
            {showCadastroRapido && (
              <div style={{marginTop:'0.625rem',padding:'0.75rem',background:'var(--surface-alt)',borderRadius:'var(--radius-sm)',border:'1px solid var(--borda)',display:'flex',flexDirection:'column',gap:'0.5rem'}}>
                <p style={{fontSize:'0.7rem',fontWeight:700,color:'var(--verde)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'0.125rem'}}>⚡ Venda Rápida — Cadastro Simplificado</p>
                <input className="campo" placeholder="Nome completo *" value={cadastroRapido.nome}
                  onChange={e=>setCadastroRapido(f=>({...f,nome:e.target.value}))}
                  style={{fontSize:'0.85rem'}}/>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.375rem'}}>
                  <input className="campo" placeholder="CPF (opcional)" value={cadastroRapido.cpf}
                    onChange={e=>setCadastroRapido(f=>({...f,cpf:e.target.value}))}
                    style={{fontSize:'0.82rem',fontFamily:'monospace'}}/>
                  <input className="campo" placeholder="Telefone (opcional)" value={cadastroRapido.telefone}
                    onChange={e=>setCadastroRapido(f=>({...f,telefone:e.target.value}))}
                    style={{fontSize:'0.82rem'}}/>
                </div>
                <button
                  className="btn btn-primary"
                  disabled={salvandoCadastro || !cadastroRapido.nome.trim()}
                  style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'0.375rem',fontSize:'0.8rem'}}
                  onClick={async () => {
                    if (!cadastroRapido.nome.trim() || !empresaId) return
                    setSalvandoCadastro(true)
                    const supabase = createClient()
                    const { data: novo, error } = await supabase.from('clientes').insert({
                      empresa_id: empresaId,
                      nome: cadastroRapido.nome.trim(),
                      cpf: cadastroRapido.cpf || null,
                      telefone: cadastroRapido.telefone || null,
                      tipo: 'varejo',
                    }).select('id,nome,tipo').single()
                    setSalvandoCadastro(false)
                    if (error || !novo) return
                    setCliente(novo.nome)
                    setClienteId(novo.id)
                    setShowCadastroRapido(false)
                    setCadastroRapido({ nome:'', cpf:'', telefone:'' })
                    carregar(empresaId)
                  }}>
                  {salvandoCadastro ? <><Loader2 size={13} style={{animation:'spin 1s linear infinite'}}/>Salvando...</> : '✓ Cadastrar e Selecionar'}
                </button>
              </div>
            )}

            {/* Autocomplete de busca */}
            <div style={{position:'relative',marginTop:'0.375rem'}}>
              <input
                id="pdv-cliente"
                className="campo"
                placeholder="Buscar cliente cadastrado..."
                value={cliente}
                autoComplete="off"
                onFocus={() => {
                  if (clienteSugs.length === 0) {
                    const q = cliente.toLowerCase()
                    const filtrados = q.length >= 2
                      ? clientesDB.filter(c => c.nome.toLowerCase().includes(q))
                      : clientesDB
                    setClienteSugs(filtrados.slice(0, 8))
                  }
                }}
                onBlur={() => setTimeout(() => setClienteSugs([]), 180)}
                onChange={e => {
                  const v = e.target.value
                  setCliente(v)
                  setClienteId(null)
                  const q = v.toLowerCase()
                  const filtrados = q.length >= 1
                    ? clientesDB.filter(c => c.nome.toLowerCase().includes(q))
                    : clientesDB
                  setClienteSugs(filtrados.slice(0, 8))
                }}
              />
              {clienteSugs.length > 0 && (
                <div style={{position:'absolute',top:'100%',left:0,right:0,zIndex:50,background:'var(--fundo-painel)',border:'1px solid var(--verde)',borderTop:'none',maxHeight:'180px',overflowY:'auto'}}>
                  {clienteSugs.map(c => (
                    <button key={c.id} type="button"
                      style={{width:'100%',textAlign:'left',padding:'0.4rem 0.625rem',background:'none',border:'none',cursor:'pointer',borderBottom:'1px solid var(--borda-leve)',fontFamily:'inherit'}}
                      onMouseEnter={e=>(e.currentTarget.style.background='var(--surface-alt)')}
                      onMouseLeave={e=>(e.currentTarget.style.background='none')}
                      onMouseDown={e => {
                        e.preventDefault() // evita que o onBlur do input feche o dropdown antes do clique
                        setCliente(c.nome)
                        setClienteId(c.id)
                        setClienteSugs([])
                        if (c.tipo === 'atacado' || c.tipo === 'vip') {
                          setTipoCliente(c.tipo as TipoCliente)
                          setItens(prev => prev.map(i => i.brinde ? i : {...i, precoUsado: getPreco(i.produto, c.tipo as TipoCliente)}))
                        }
                      }}>
                      <span style={{fontWeight:700,fontSize:'0.82rem',color:'var(--texto)'}}>{c.nome}</span>
                      {c.tipo !== 'varejo' && <span style={{fontSize:'0.65rem',color:'var(--verde)',marginLeft:'0.5rem',textTransform:'uppercase'}}>{c.tipo}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {clienteId && (
              <div style={{marginTop:'0.375rem',fontSize:'0.65rem',color:'var(--verde)',fontWeight:700,letterSpacing:'0.04em'}}>
                ● CLIENTE VINCULADO — HISTÓRICO SERÁ ATUALIZADO
              </div>
            )}
          </div>

          {/* Comissionado / Indicador (opcional) */}
          <div className="card" style={{padding:'0.75rem',border:'1px solid var(--borda)',borderRadius:'var(--radius)'}}>
            <label className="campo-label">Indicador / Comissionado (opcional)</label>
            <select
              className="campo"
              style={{marginTop:'0.375rem', width:'100%'}}
              value={comissionadoId || ''}
              onChange={e => setComissionadoId(e.target.value || null)}
            >
              <option value="">— Sem comissionado —</option>
              {comissionados.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>

          {/* Pagamento */}
          <div style={{border:'1px solid var(--borda-forte)',borderTop:'2px solid var(--borda-forte)',background:'var(--surface)',padding:'0.625rem'}}>
            <label className="campo-label">FORMA DE PAGAMENTO</label>
            <div className="pdv-formas-pagamento-grid">
              {formas.map(f=>(
                <button key={f.id} onClick={()=>{
                  if (f.nome.toLowerCase() === 'fiado' && plano !== 'pro') {
                    toast.error('O Fiado é exclusivo do plano PRO! Faça upgrade em Configurações > Assinatura.')
                    return
                  }
                  setPagamento(f.nome)
                  setRepassarTaxa(f.taxa > 0) // Repassar por padrão se houver taxa
                  setParcelas(1)
                  setJurosCredito(false)
                }}
                  className={pagamento===f.nome ? 'btn btn-primary' : 'btn btn-secondary'}
                  style={{
                    fontSize:'0.68rem',
                    padding:'0.55rem 0.25rem',
                    textTransform:'uppercase',
                    letterSpacing:'0.02em',
                    whiteSpace:'normal',
                    wordBreak:'break-word',
                    lineHeight:'1.2',
                    minHeight:'54px',
                    display:'flex',
                    flexDirection:'column',
                    alignItems:'center',
                    justifyContent:'center'
                  }}>
                  <span>{f.nome} {f.nome.toLowerCase() === 'fiado' && plano !== 'pro' && '🔒'}</span>
                  {f.taxa > 0 && <span style={{fontSize:'0.58rem',opacity:0.8,marginTop:'2px'}}>({f.taxa}%)</span>}
                </button>
              ))}
            </div>

            {/* Repasse de taxa */}
            {taxaAplicada > 0 && (
              <div style={{marginTop:'0.75rem',padding:'0.5rem 0.625rem',background:'var(--surface-alt)',border:'1px solid var(--borda)',borderRadius:'var(--radius-sm)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <label htmlFor="repassarTaxaCheckbox" style={{fontSize:'0.75rem',fontWeight:700,color:'var(--texto-sec)',cursor:'pointer'}}>
                  Repassar taxa de {taxaAplicada}% ao cliente?
                </label>
                <input
                  id="repassarTaxaCheckbox"
                  type="checkbox"
                  checked={repassarTaxa}
                  onChange={e=>setRepassarTaxa(e.target.checked)}
                  style={{width:'16px',height:'16px',cursor:'pointer'}}
                />
              </div>
            )}

            {/* Opções de Parcelamento */}
            {(pagamento.toLowerCase().includes('crédito') || pagamento.toLowerCase().includes('credito')) && (
              <div style={{marginTop:'0.75rem',paddingTop:'0.75rem',borderTop:'1px dashed var(--borda)',display:'flex',flexDirection:'column',gap:'0.5rem'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <label className="campo-label" style={{marginBottom:0}}>PARCELAMENTO</label>
                  <div style={{display:'flex',alignItems:'center',gap:'0.375rem'}}>
                    <input type="checkbox" id="jurosCreditoCheckbox" checked={jurosCredito} onChange={e=>{
                      setJurosCredito(e.target.checked)
                    }} style={{width:'14px',height:'14px',cursor:'pointer'}}/>
                    <label htmlFor="jurosCreditoCheckbox" style={{fontSize:'0.7rem',fontWeight:700,color:'var(--texto-sec)',cursor:'pointer'}}>Cobrar Juros (1.99% a.m.)</label>
                  </div>
                </div>
                <select className="campo" style={{fontFamily:'monospace'}} value={parcelas} onChange={e=>setParcelas(parseInt(e.target.value))}>
                  {Array.from({length:12},(_,i)=>i+1).map(n=>(
                    <option key={n} value={n}>
                      {n}x de {formatCurrency(getValorComJuros(principal, n, jurosCredito) / n)} {jurosCredito && n > 1 ? `(c/ juros de 1.99% a.m.)` : 'Sem juros'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {pagamento==='Dinheiro'&&(
              <div style={{marginTop:'0.5rem'}}>
                <label className="campo-label">DINHEIRO RECEBIDO</label>
                <input className="campo" type="text" style={{marginTop:'0.25rem'}} placeholder="0,00" value={troco} onChange={e=>setTroco(e.target.value)}/>
                {troco&&parseFloat(troco.replace(',', '.'))>0&&<p style={{fontSize:'0.78rem',fontWeight:700,color:'var(--verde)',marginTop:'4px',fontVariantNumeric:'tabular-nums'}}>TROCO: {formatCurrency(Math.max(0,parseFloat(troco.replace(',', '.'))-total))}</p>}
              </div>
            )}
            {pagamento==='Fiado'&&(
              <div style={{marginTop:'0.625rem',paddingTop:'0.625rem',borderTop:'1px solid var(--borda-leve)'}}>
                <label className="campo-label">PRAZO PARA PAGAMENTO</label>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:'0.375rem',marginTop:'0.375rem'}}>
                  {[
                    { l:'7 D', v:7 },
                    { l:'15 D', v:15 },
                    { l:'30 D', v:30 },
                    { l:'S/ PRAZO', v:null }
                  ].map(p=>(
                    <button key={p.l} onClick={()=>setPrazoDias(p.v)}
                      className={prazoDias===p.v ? 'btn btn-primary' : 'btn btn-secondary'}
                      style={{fontSize:'0.6rem',padding:'0.4rem 0.2rem',textTransform:'uppercase',letterSpacing:'0.04em'}}>
                      {p.l}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Resumo — recibo térmico */}
          <div style={{border:'1px solid var(--borda-forte)',background:'var(--surface-alt)',padding:'0.75rem',fontVariantNumeric:'tabular-nums'}}>
            <p style={{fontSize:'0.6rem',color:'var(--texto-desab)',letterSpacing:'0.1em',textAlign:'center',marginBottom:'0.5rem',borderBottom:'1px dashed var(--borda-forte)',paddingBottom:'0.375rem'}}>── RESUMO ──────────────────</p>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.2rem'}}>
              <span style={{fontSize:'0.72rem',color:'var(--texto-sec)'}}>SUBTOTAL</span>
              <span style={{fontSize:'0.78rem',fontWeight:600,color:'var(--texto-mono)'}}>{formatCurrency(subtotal)}</span>
            </div>
            {descontoValor>0&&(
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.2rem'}}>
                <span style={{fontSize:'0.72rem',color:'var(--vermelho)'}}>DESCONTO{descontoTipo==='%'?` (${desconto}%)`:''}</span>
                <span style={{fontSize:'0.78rem',color:'var(--vermelho)',fontWeight:600}}>- {formatCurrency(descontoValor)}</span>
              </div>
            )}
            {taxaAplicada > 0 && repassarTaxa && (
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.2rem'}}>
                <span style={{fontSize:'0.72rem',color:'var(--verde)'}}>TAXA DE {pagamento} ({taxaAplicada}%)</span>
                <span style={{fontSize:'0.78rem',color:'var(--verde)',fontWeight:600}}>+ {formatCurrency(valorTaxa)}</span>
              </div>
            )}
            {taxaAplicada > 0 && !repassarTaxa && (
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.2rem'}}>
                <span style={{fontSize:'0.72rem',color:'var(--texto-desab)'}}>TAXA ABSORVIDA ({taxaAplicada}%)</span>
                <span style={{fontSize:'0.78rem',color:'var(--texto-desab)',fontWeight:600}}>- {formatCurrency(totalSemTaxa * (taxaAplicada / 100))}</span>
              </div>
            )}
            <div style={{display:'flex',justifyContent:'space-between',borderTop:'1px dashed var(--borda-forte)',paddingTop:'0.5rem',marginTop:'0.375rem'}}>
              <span style={{fontWeight:700,fontSize:'0.78rem',color:'var(--texto)',letterSpacing:'0.06em'}}>TOTAL A PAGAR</span>
              <span style={{fontWeight:700,fontSize:'1.75rem',color:'var(--verde)',lineHeight:1}}>{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Finalizar */}
          <button id="btn-finalizar-venda"
            style={{width:'100%',padding:'0.875rem',fontSize:'0.85rem',fontWeight:700,
              background:itens.length>0&&pagamento&&!(pagamento==='Fiado'&&!cliente)?'var(--verde)':'var(--surface-alt)',
              color:itens.length>0&&pagamento&&!(pagamento==='Fiado'&&!cliente)?'#060A06':'var(--texto-desab)',
              border:`1px solid ${itens.length>0&&pagamento?'var(--verde-escuro)':'var(--borda)'}`,
              borderBottom:`3px solid ${itens.length>0&&pagamento?'var(--verde-terminal)':'var(--borda-leve)'}`,
              cursor:itens.length>0&&pagamento&&!(pagamento==='Fiado'&&!cliente)?'pointer':'not-allowed',
              fontFamily:'inherit',letterSpacing:'0.06em',textTransform:'uppercase',transition:'all 0.08s',borderRadius:'2px'}}
            disabled={salvando||itens.length===0||!pagamento||(pagamento==='Fiado'&&!cliente)}
            onClick={finalizar}>
            {salvando
              ? <>PROCESSANDO<span className="blink">_</span></>
              : `${pagamento==='Fiado'?'▶ REGISTRAR NO FIADO':'▶ FINALIZAR VENDA'} — ${formatCurrency(total)}`}
          </button>
          {(!pagamento||itens.length===0||(pagamento==='Fiado'&&!cliente))&&(
            <p style={{fontSize:'0.65rem',color:pagamento==='Fiado'&&!cliente?'var(--vermelho)':'var(--texto-desab)',textAlign:'center',fontWeight:700,letterSpacing:'0.04em',textTransform:'uppercase'}}>
              {itens.length===0?'ADICIONE AO MENOS 1 PRODUTO':pagamento==='Fiado'&&!cliente?'⚠ INFORME O CLIENTE PARA O FIADO':'SELECIONE A FORMA DE PAGAMENTO'}
            </p>
          )}
        </div>
      </div>



      {showScanner && (
        <BarcodeScannerModal
          onClose={() => setShowScanner(false)}
          onScan={handleScan}
        />
      )}

    </div>
  )
}
