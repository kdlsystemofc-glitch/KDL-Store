'use client'
import { toast } from 'react-hot-toast'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { Plus, Search, Loader2, X, Save, Pencil } from 'lucide-react'
import { PageTabs } from '@/components/PageTabs'
import { FormFornecedor } from '@/components/FormFornecedor'
import { useSubscription } from '@/hooks/useSubscription'
import { formatCurrency } from '@/lib/utils'

type Fornecedor = {
  id: string; nome: string; contato: string | null; telefone: string | null
  email: string | null; cnpj: string | null; categoria: string | null; endereco: string | null
  cep: string | null; rua: string | null; numero: string | null; bairro: string | null; complemento: string | null
  cidade: string | null; estado: string | null; prazo_entrega: string | null
  pedido_minimo: number | null; anotacoes: string | null; ativo: boolean
}
type Pedido = {
  id: string; fornecedor_id: string | null; produto: string; quantidade: number
  status: string; total: number; obs: string | null; criado_em: string
  fornecedores: { nome: string }[] | null
}

const CATEGORIAS_FORN = ['Eletrônicos','Acessórios','Autopeças','Serviços','Embalagens','Outros']
const ESTADOS_BR = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO']

const campo = { marginTop:'0.375rem' } as React.CSSProperties

export default function FornecedoresPage() {
  const { empresaId } = useEmpresaId()
  const { plano } = useSubscription()
  const [aba,          setAba]          = useState<'lista'|'pedidos'>('lista')
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [pedidos,      setPedidos]      = useState<Pedido[]>([])
  const [busca,        setBusca]        = useState('')
  const [loading,      setLoading]      = useState(true)
  const [showModal,    setShowModal]    = useState(false)
  const [editando,     setEditando]     = useState<Fornecedor | null>(null)
  const [salvando,     setSalvando]     = useState(false)
  const [erroEdit,     setErroEdit]     = useState<string | null>(null)
  // FO2: estado para novo pedido
  const [showPedido,   setShowPedido]   = useState(false)
  const [pedProduto,   setPedProduto]   = useState('')
  const [pedQtd,       setPedQtd]       = useState('1')
  const [pedPrecoUnitario, setPedPrecoUnitario] = useState('')
  const [pedPrevisao,  setPedPrevisao]  = useState('')
  const [pedObs,       setPedObs]       = useState('')
  const [pedFornId,    setPedFornId]    = useState('')
  const [salvandoPed,  setSalvandoPed]  = useState(false)
  const [abaModal,     setAbaModal]     = useState<'dados'|'produtos'|'pedidos'>('dados')
  const [selectedProdParaVincular, setSelectedProdParaVincular] = useState('')
  // Detalhe / edição de pedido
  const [pedidoDetalhe, setPedidoDetalhe] = useState<Pedido | null>(null)
  const [editandoPedido, setEditandoPedido] = useState(false)
  const [salvandoEditPed, setSalvandoEditPed] = useState(false)
  const [editPedProduto, setEditPedProduto] = useState('')
  const [editPedQtd, setEditPedQtd] = useState('')
  const [editPedPreco, setEditPedPreco] = useState('')
  const [editPedObs, setEditPedObs] = useState('')
  const [editPedFornId, setEditPedFornId] = useState('')
  const [avancarLoading, setAvancarLoading] = useState<string | null>(null)

  // Autocomplete de produtos em estoque
  const [produtosDB,   setProdutosDB]   = useState<{ id: string; nome: string; sku: string | null; qtd_atual: number; preco_varejo: number; fornecedor_id: string | null }[]>([])
  const [pedSugs,      setPedSugs]      = useState<{ id: string; nome: string }[]>([])
  const [showPedSugs,  setShowPedSugs]  = useState(false)

  useEffect(() => { if (empresaId) carregar(empresaId) }, [empresaId])

  async function carregar(eid: string) {
    setLoading(true)
    const supabase = createClient()
    const results = await Promise.allSettled([
      supabase.from('fornecedores')
        .select('id,nome,contato,telefone,email,cnpj,categoria,endereco,cep,rua,numero,bairro,complemento,cidade,estado,prazo_entrega,pedido_minimo,anotacoes,ativo')
        .eq('empresa_id', eid).order('nome'),
      supabase.from('pedidos_fornecedor')
        .select('id,fornecedor_id,produto,quantidade,status,total,obs,criado_em,fornecedores(nome)')
        .eq('empresa_id', eid).order('criado_em', { ascending: false }),
      supabase.from('produtos')
        .select('id,nome,sku,qtd_atual,preco_varejo,fornecedor_id')
        .eq('empresa_id', eid)
        .order('nome'),
    ])
    const getRes = (i: number): any => results[i].status === 'fulfilled' ? (results[i] as PromiseFulfilledResult<any>).value || {} : {}
    const { data: forn } = getRes(0)
    const { data: peds } = getRes(1)
    const { data: prods } = getRes(2)
    setFornecedores(forn || [])
    setPedidos(peds || [])
    setProdutosDB(prods || [])
    setLoading(false)
  }

  async function buscarCepEdicao(cepVal: string) {
    const limpo = cepVal.replace(/\D/g, '')
    if (limpo.length !== 8) return
    try {
      const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`)
      const data = await res.json()
      if (data.erro) return
      setEditando(prev => {
        if (!prev) return null
        return {
          ...prev,
          cep: cepVal,
          rua: data.logradouro || prev.rua || '',
          bairro: data.bairro || prev.bairro || '',
          cidade: data.localidade || prev.cidade || '',
          estado: data.uf || prev.estado || ''
        }
      })
    } catch (e) {
      console.error(e)
    }
  }

  async function salvarEdicao() {
    if (!editando || !editando.nome.trim()) { setErroEdit('Nome é obrigatório.'); return }
    setSalvando(true); setErroEdit(null)

    const partes = [editando.rua, editando.numero, editando.bairro, editando.complemento].filter(Boolean)
    const endereco = partes.join(', ')

    const { error } = await createClient().from('fornecedores').update({
      nome:          editando.nome,
      contato:       editando.contato || null,
      telefone:      editando.telefone || null,
      email:         editando.email || null,
      cnpj:          editando.cnpj || null,
      categoria:     editando.categoria || null,
      cep:           editando.cep || null,
      rua:           editando.rua || null,
      numero:        editando.numero || null,
      bairro:        editando.bairro || null,
      complemento:   editando.complemento || null,
      cidade:        editando.cidade || null,
      estado:        editando.estado || null,
      endereco:      endereco || null,
      prazo_entrega: editando.prazo_entrega || null,
      pedido_minimo: editando.pedido_minimo || null,
      anotacoes:     editando.anotacoes || null,
      ativo:         editando.ativo,
    }).eq('id', editando.id)
    setSalvando(false)
    if (error) { setErroEdit('Erro ao salvar: ' + error.message); return }

    toast.success('Fornecedor atualizado com sucesso!')
    setFornecedores(prev => prev.map(f => f.id === editando.id ? { ...editando, endereco } : f))
    setEditando(null)
  }

  async function avancarStatus(id: string, atual: string) {
    const fluxo: Record<string, string> = { rascunho: 'enviado', enviado: 'recebido' }
    const next = fluxo[atual]
    if (!next) return
    if (avancarLoading === id) return // evita duplo-click
    const p = pedidos.find(o => o.id === id)
    if (!p || !empresaId) return

    const supabase = createClient()
    setAvancarLoading(id)

    // 1. Atualiza status do pedido de fornecedor
    const { error } = await supabase.from('pedidos_fornecedor').update({ status: next }).eq('id', id)
    if (error) {
      toast.error('Erro ao atualizar status: ' + error.message)
      setAvancarLoading(null)
      return
    }

    // 2. Apenas ao receber: atualizar estoque e criar despesa
    if (next === 'recebido') {
      try {
        const fornNome = Array.isArray(p.fornecedores) ? p.fornecedores[0]?.nome : (p.fornecedores as any)?.nome || 'Fornecedor'

        // 2a. Estoque
        const { data: prod } = await supabase
          .from('produtos')
          .select('id,qtd_atual')
          .eq('empresa_id', empresaId)
          .eq('nome', p.produto)
          .maybeSingle()

        if (prod) {
          const qtdSomada = parseFloat(String(p.quantidade)) || 0
          await supabase.from('produtos').update({ qtd_atual: (prod.qtd_atual || 0) + qtdSomada }).eq('id', prod.id)
          await supabase.from('estoque_movimentacoes').insert({
            empresa_id: empresaId,
            produto_id: prod.id,
            tipo: 'entrada',
            quantidade: qtdSomada,
            obs: `Entrada via Pedido de Compra (Fornecedor: ${fornNome})`
          })
          toast.success(`Estoque de "${p.produto}" atualizado (+${qtdSomada})`)
        }

        // 2b. Despesa — guarda de idempotência: só cria se não existir despesa para este pedido
        if (p.total && p.total > 0) {
          const marcador = `PED-${p.id.substring(0, 8).toUpperCase()}`
          const { data: despExist } = await supabase
            .from('despesas')
            .select('id')
            .eq('empresa_id', empresaId)
            .ilike('descricao', `%${marcador}%`)
            .maybeSingle()

          if (!despExist) {
            await supabase.from('despesas').insert({
              empresa_id: empresaId,
              descricao: `[${marcador}] Compra de insumo - ${p.produto} (${fornNome})`,
              categoria: 'Fornecedor',
              tipo: 'variavel',
              valor: p.total,
              data: new Date().toISOString().slice(0, 10),
              recorrente: false,
            })
            toast.success('Despesa de compra lançada no financeiro!')
          }
        }

        toast.success('Pedido recebido! Estoque e financeiro atualizados.')
      } catch (err) {
        console.error('Erro ao processar recebimento:', err)
        toast.error('Pedido marcado como recebido, mas houve erro ao atualizar estoque/despesa.')
      }
    } else {
      toast.success('Pedido marcado como enviado!')
    }

    setPedidos(prev => prev.map(item => item.id === id ? { ...item, status: next } : item))
    if (pedidoDetalhe?.id === id) setPedidoDetalhe(prev => prev ? { ...prev, status: next } : null)
    setAvancarLoading(null)
  }

  async function salvarEdicaoPedido() {
    if (!pedidoDetalhe || !empresaId) return
    setSalvandoEditPed(true)
    const totalCalc = (parseFloat(editPedQtd) || 1) * (parseFloat(editPedPreco) || 0)
    const { error } = await createClient().from('pedidos_fornecedor').update({
      produto: editPedProduto.trim(),
      quantidade: parseFloat(editPedQtd) || 1,
      total: totalCalc,
      obs: editPedObs || null,
      fornecedor_id: editPedFornId || null,
    }).eq('id', pedidoDetalhe.id)
    setSalvandoEditPed(false)
    if (error) { toast.error('Erro ao salvar: ' + error.message); return }
    toast.success('Pedido atualizado!')
    const updated = { ...pedidoDetalhe, produto: editPedProduto.trim(), quantidade: parseFloat(editPedQtd) || 1, total: totalCalc, obs: editPedObs || null, fornecedor_id: editPedFornId || null }
    setPedidos(prev => prev.map(p => p.id === pedidoDetalhe.id ? updated : p))
    setPedidoDetalhe(updated)
    setEditandoPedido(false)
  }

  async function cancelarPedido(id: string) {
    if (!confirm('Cancelar este pedido de compra?')) return
    const { error } = await createClient().from('pedidos_fornecedor').update({ status: 'cancelado' }).eq('id', id)
    if (error) { toast.error('Erro: ' + error.message); return }
    toast.success('Pedido cancelado.')
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, status: 'cancelado' } : p))
    setPedidoDetalhe(null)
  }

  // FO2: cria novo pedido ao fornecedor
  async function criarPedido() {
    if (!pedProduto.trim() || !pedQtd || !empresaId) return
    setSalvandoPed(true)
    
    const totalCalculado = (parseInt(pedQtd) || 1) * (parseFloat(pedPrecoUnitario) || 0)
    const obsFinal = [
      pedPrevisao ? `Previsão: ${pedPrevisao}` : '',
      pedObs ? `Obs: ${pedObs}` : ''
    ].filter(Boolean).join(' | ')

    const { data, error } = await createClient().from('pedidos_fornecedor').insert({
      empresa_id: empresaId,
      fornecedor_id: pedFornId || null,
      produto: pedProduto.trim(),
      quantidade: parseInt(pedQtd) || 1,
      total: totalCalculado,
      obs: obsFinal || null,
      status: 'rascunho' // 'rascunho' | 'enviado' | 'recebido' | 'cancelado'
    }).select('id,fornecedor_id,produto,quantidade,status,total,obs,criado_em,fornecedores(nome)').single()
    
    setSalvandoPed(false)
    if (error) {
      toast.error('Erro ao criar pedido: ' + error.message)
    } else {
      toast.success('Pedido ao fornecedor criado com sucesso!')
      if (data) setPedidos(prev => [data as any, ...prev])
      setPedProduto('')
      setPedQtd('1')
      setPedPrecoUnitario('')
      setPedPrevisao('')
      setPedObs('')
      setPedFornId('')
      setShowPedido(false)
    }
  }

  async function vincularProduto(prodId: string) {
    if (!editando) return
    const supabase = createClient()
    const { error } = await supabase.from('produtos').update({ fornecedor_id: editando.id }).eq('id', prodId)
    if (error) {
      toast.error('Erro ao vincular produto: ' + error.message)
    } else {
      toast.success('Produto vinculado com sucesso!')
      setProdutosDB(prev => prev.map(p => p.id === prodId ? { ...p, fornecedor_id: editando.id } : p))
      setSelectedProdParaVincular('')
    }
  }

  async function desvincularProduto(prodId: string) {
    const supabase = createClient()
    const { error } = await supabase.from('produtos').update({ fornecedor_id: null }).eq('id', prodId)
    if (error) {
      toast.error('Erro ao desvincular produto: ' + error.message)
    } else {
      toast.success('Produto desvinculado!')
      setProdutosDB(prev => prev.map(p => p.id === prodId ? { ...p, fornecedor_id: null } : p))
    }
  }

  const handlePedProdutoChange = (val: string) => {
    setPedProduto(val)
    if (val.trim().length > 0) {
      const filtered = produtosDB.filter(p => p.nome.toLowerCase().includes(val.toLowerCase())).slice(0, 5)
      setPedSugs(filtered)
      setShowPedSugs(filtered.length > 0)
    } else {
      setPedSugs([])
      setShowPedSugs(false)
    }
  }

  const filtrados = fornecedores.filter(f => {
    const q = busca.toLowerCase().trim()
    if (!q) return true
    return (
      f.nome.toLowerCase().includes(q) ||
      (f.contato || '').toLowerCase().includes(q) ||
      (f.telefone || '').replace(/\D/g,'').includes(q.replace(/\D/g,'')) ||
      (f.email || '').toLowerCase().includes(q) ||
      (f.cnpj || '').replace(/\D/g,'').includes(q.replace(/\D/g,'')) ||
      (f.categoria || '').toLowerCase().includes(q) ||
      (f.cidade || '').toLowerCase().includes(q) ||
      (f.estado || '').toLowerCase().includes(q) ||
      (f.rua || '').toLowerCase().includes(q) ||
      (f.bairro || '').toLowerCase().includes(q) ||
      (f.anotacoes || '').toLowerCase().includes(q)
    )
  })
  const pendentes = pedidos.filter(p => p.status !== 'recebido' && p.status !== 'cancelado').length
  const kpiPedidos = {
    rascunho: pedidos.filter(p => p.status === 'rascunho').length,
    enviado: pedidos.filter(p => p.status === 'enviado').length,
    recebido: pedidos.filter(p => p.status === 'recebido').length,
    totalAberto: pedidos.filter(p => p.status !== 'recebido' && p.status !== 'cancelado').reduce((a,p) => a + (p.total || 0), 0),
  }
  const set = (k: keyof Fornecedor, v: unknown) => setEditando(e => e ? { ...e, [k]: v } : e)

  return (
    <div className="anim-fade" style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>

      {/* Modal Detalhe / Edição de Pedido */}
      {pedidoDetalhe && (
        <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
          onClick={e => { if(e.target===e.currentTarget) setPedidoDetalhe(null) }}>
          <div className="card anim-pop" style={{ width:'100%', maxWidth:'460px', padding:'1.5rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
              <p style={{ fontWeight:900, fontSize:'1rem' }}>
                📋 Pedido de Compra <span style={{ fontSize:'0.7rem', color:'var(--texto-desab)', fontFamily:'monospace' }}>#{pedidoDetalhe.id.substring(0,8).toUpperCase()}</span>
              </p>
              <button onClick={() => setPedidoDetalhe(null)} className="btn-icon"><X size={16}/></button>
            </div>

            {/* Status badge */}
            <div style={{ marginBottom:'1rem' }}>
              <span className={pedidoDetalhe.status === 'recebido' ? 'status-ok' : pedidoDetalhe.status === 'cancelado' ? 'status-neutro' : pedidoDetalhe.status === 'enviado' ? 'status-alerta' : 'status-aviso'}
                style={{ fontSize:'0.75rem' }}>
                {pedidoDetalhe.status === 'recebido' ? '● RECEBIDO' : pedidoDetalhe.status === 'cancelado' ? '✕ CANCELADO' : pedidoDetalhe.status === 'enviado' ? '◐ ENVIADO' : '○ RASCUNHO'}
              </span>
              <span style={{ marginLeft:'0.75rem', fontSize:'0.75rem', color:'var(--texto-desab)' }}>
                Criado em {new Date(pedidoDetalhe.criado_em).toLocaleDateString('pt-BR')}
              </span>
            </div>

            {editandoPedido ? (
              <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
                <div>
                  <label className="campo-label">Produto / Descrição *</label>
                  <input className="campo" style={{ marginTop:'0.25rem' }} value={editPedProduto} onChange={e=>setEditPedProduto(e.target.value)} />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem' }}>
                  <div>
                    <label className="campo-label">Quantidade</label>
                    <input className="campo" style={{ marginTop:'0.25rem' }} type="number" min="0.01" step="0.01" value={editPedQtd} onChange={e=>setEditPedQtd(e.target.value)} />
                  </div>
                  <div>
                    <label className="campo-label">Preço Unitário (R$)</label>
                    <input className="campo" style={{ marginTop:'0.25rem' }} type="number" min="0" step="0.01" value={editPedPreco} onChange={e=>setEditPedPreco(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="campo-label">Fornecedor</label>
                  <select className="campo" style={{ marginTop:'0.25rem' }} value={editPedFornId} onChange={e=>setEditPedFornId(e.target.value)}>
                    <option value="">— Selecionar —</option>
                    {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="campo-label">Observações / Previsão</label>
                  <textarea className="campo" style={{ marginTop:'0.25rem', minHeight:'64px', resize:'vertical' }} value={editPedObs} onChange={e=>setEditPedObs(e.target.value)} />
                </div>
                <div style={{ display:'flex', gap:'0.5rem', justifyContent:'flex-end', marginTop:'0.5rem' }}>
                  <button onClick={() => setEditandoPedido(false)} className="btn btn-secondary">Cancelar</button>
                  <button onClick={salvarEdicaoPedido} disabled={salvandoEditPed} className="btn btn-primary">
                    {salvandoEditPed ? 'Salvando...' : '💾 Salvar'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem' }}>
                  <div className="card" style={{ padding:'0.75rem', background:'var(--surface-2)' }}>
                    <p style={{ fontSize:'0.72rem', color:'var(--texto-desab)', marginBottom:'0.25rem' }}>Produto</p>
                    <p style={{ fontWeight:700 }}>{pedidoDetalhe.produto}</p>
                  </div>
                  <div className="card" style={{ padding:'0.75rem', background:'var(--surface-2)' }}>
                    <p style={{ fontSize:'0.72rem', color:'var(--texto-desab)', marginBottom:'0.25rem' }}>Fornecedor</p>
                    <p style={{ fontWeight:700 }}>{(Array.isArray(pedidoDetalhe.fornecedores) ? pedidoDetalhe.fornecedores[0]?.nome : (pedidoDetalhe.fornecedores as any)?.nome) || '—'}</p>
                  </div>
                  <div className="card" style={{ padding:'0.75rem', background:'var(--surface-2)' }}>
                    <p style={{ fontSize:'0.72rem', color:'var(--texto-desab)', marginBottom:'0.25rem' }}>Quantidade</p>
                    <p style={{ fontWeight:700, fontFamily:'monospace' }}>{pedidoDetalhe.quantidade}x</p>
                  </div>
                  <div className="card" style={{ padding:'0.75rem', background:'var(--surface-2)' }}>
                    <p style={{ fontSize:'0.72rem', color:'var(--texto-desab)', marginBottom:'0.25rem' }}>Valor Total</p>
                    <p style={{ fontWeight:900, fontFamily:'monospace', color:'var(--verde)', fontSize:'1.1rem' }}>{pedidoDetalhe.total ? formatCurrency(pedidoDetalhe.total) : '—'}</p>
                  </div>
                </div>
                {pedidoDetalhe.obs && (
                  <div className="card" style={{ padding:'0.75rem', background:'var(--surface-2)' }}>
                    <p style={{ fontSize:'0.72rem', color:'var(--texto-desab)', marginBottom:'0.25rem' }}>Obs / Previsão</p>
                    <p style={{ fontSize:'0.85rem' }}>{pedidoDetalhe.obs}</p>
                  </div>
                )}
                <div style={{ display:'flex', gap:'0.5rem', justifyContent:'flex-end', marginTop:'0.75rem', flexWrap:'wrap' }}>
                  {pedidoDetalhe.status === 'rascunho' && (
                    <button onClick={() => setEditandoPedido(true)} className="btn btn-secondary" style={{ fontSize:'0.8rem' }}>✏️ Editar</button>
                  )}
                  {pedidoDetalhe.status !== 'recebido' && pedidoDetalhe.status !== 'cancelado' && (
                    <>
                      <button
                        onClick={() => avancarStatus(pedidoDetalhe.id, pedidoDetalhe.status)}
                        disabled={avancarLoading === pedidoDetalhe.id}
                        className="btn btn-primary" style={{ fontSize:'0.8rem' }}>
                        {avancarLoading === pedidoDetalhe.id ? '...' : pedidoDetalhe.status === 'enviado' ? '📦 Dar Entrada' : '📤 Marcar como Enviado'}
                      </button>
                      <button onClick={() => cancelarPedido(pedidoDetalhe.id)} className="btn btn-secondary" style={{ fontSize:'0.8rem', color:'var(--vermelho)' }}>✕ Cancelar Pedido</button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FO2: Modal Novo Pedido */}
      {showPedido && (
        <div style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
          onClick={e=>{if(e.target===e.currentTarget)setShowPedido(false)}}>
          <div className="card anim-pop" style={{ width:'100%', maxWidth:'420px', padding:'1.25rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
              <p style={{ fontWeight:900, fontSize:'1rem' }}>📦 Novo Pedido ao Fornecedor</p>
              <button onClick={()=>setShowPedido(false)} className="btn-icon"><X size={16}/></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
              <div>
                <label className="campo-label">Produto / Descrição *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="campo"
                    style={{ marginTop: '0.375rem', width: '100%' }}
                    value={pedProduto}
                    onChange={e => handlePedProdutoChange(e.target.value)}
                    onFocus={() => {
                      if (pedProduto.trim().length > 0) {
                        const filtered = produtosDB.filter(p => p.nome.toLowerCase().includes(pedProduto.toLowerCase())).slice(0, 5)
                        setPedSugs(filtered)
                        setShowPedSugs(filtered.length > 0)
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowPedSugs(false), 200)
                    }}
                    placeholder="Ex: Cabo HDMI 2m"
                  />
                  {showPedSugs && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      zIndex: 50,
                      background: 'var(--surface)',
                      border: '1px solid var(--borda)',
                      borderRadius: 'var(--radius-sm)',
                      maxHeight: '150px',
                      overflowY: 'auto',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.15)',
                      marginTop: '2px'
                    }}>
                      {pedSugs.map(s => (
                        <div
                          key={s.id}
                          onClick={() => {
                            setPedProduto(s.nome)
                            setShowPedSugs(false)
                          }}
                          style={{
                            padding: '0.5rem 0.75rem',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            color: 'var(--texto)',
                            borderBottom: '1px solid var(--borda-leve)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'background 0.1s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-alt)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <span>{s.nome}</span>
                          <span style={{ fontSize: '0.58rem', background: 'var(--verde-claro)', color: 'var(--verde-esc)', padding: '2px 6px', borderRadius: '999px', fontWeight: 700 }}>Estoque</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label className="campo-label">Quantidade *</label>
                  <input className="campo" type="number" min="1" style={{marginTop:'0.375rem'}} value={pedQtd} onChange={e=>setPedQtd(e.target.value)}/>
                </div>
                <div>
                  <label className="campo-label">Preço Unitário (R$)</label>
                  <input className="campo" type="number" step="0.01" min="0" style={{marginTop:'0.375rem', fontWeight: 700}} value={pedPrecoUnitario} onChange={e=>setPedPrecoUnitario(e.target.value)} placeholder="0,00"/>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-alt)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--borda)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--texto-sec)' }}>Valor Total Estimado:</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--verde)', fontFamily: 'monospace' }}>
                  {formatCurrency((parseInt(pedQtd) || 1) * (parseFloat(pedPrecoUnitario) || 0))}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label className="campo-label">Previsão Entrega</label>
                  <input className="campo" style={{marginTop:'0.375rem'}} value={pedPrevisao} onChange={e=>setPedPrevisao(e.target.value)} placeholder="Ex: +5 dias, 10/06"/>
                </div>
                <div>
                  <label className="campo-label">Fornecedor (opcional)</label>
                  <select className="campo" style={{marginTop:'0.375rem'}} value={pedFornId} onChange={e=>setPedFornId(e.target.value)}>
                    <option value="">Selecionar...</option>
                    {fornecedores.filter(f=>f.ativo).map(f=><option key={f.id} value={f.id}>{f.nome}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="campo-label">Observações Adicionais</label>
                <input className="campo" style={{marginTop:'0.375rem'}} value={pedObs} onChange={e=>setPedObs(e.target.value)} placeholder="Ex: Observações do pedido..."/>
              </div>
            </div>
            <div style={{ display:'flex', gap:'0.5rem', justifyContent:'flex-end', marginTop:'1rem' }}>
              <button onClick={()=>setShowPedido(false)} className="btn btn-ghost">Cancelar</button>
              <button onClick={criarPedido} disabled={!pedProduto.trim()||salvandoPed} className="btn btn-primary"
                style={{ display:'flex', alignItems:'center', gap:'0.375rem' }}>
                {salvandoPed?<Loader2 size={14} style={{animation:'spin 1s linear infinite'}}/>:<Save size={14}/>} Criar Pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Fornecedor */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
          onClick={e=>{if(e.target===e.currentTarget)setShowModal(false)}}>
          <div className="anim-pop" style={{ width:'100%', maxWidth:'680px', maxHeight:'90vh', overflowY:'auto', background:'var(--surface)', border:'1px solid var(--borda-forte)', borderRadius:'2px' }}>
            <div style={{ padding:'0.75rem 1rem', borderBottom:'2px solid var(--verde)', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:'var(--fundo-painel)', zIndex:10 }}>
              <div>
                <p style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--verde)', textTransform:'uppercase', letterSpacing:'0.06em' }}>CADASTRAR NOVO FORNECEDOR</p>
                <p style={{ fontSize:'0.65rem', color:'var(--texto-desab)' }}>Preencha os dados do fornecedor</p>
              </div>
              <button onClick={()=>setShowModal(false)} className="btn-icon"><X size={16}/></button>
            </div>
            <div style={{ padding:'1rem' }}>
              <FormFornecedor onSuccess={() => { toast.success('Salvo com sucesso!'); setShowModal(false); if (empresaId) carregar(empresaId) }} onCancel={() => setShowModal(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Fornecedor */}
      {editando && (
        <div style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
          onClick={e=>{if(e.target===e.currentTarget)setEditando(null)}}>
          <div className="anim-pop" style={{ width:'100%', maxWidth:'680px', maxHeight:'90vh', overflowY:'auto', background:'var(--surface)', border:'1px solid var(--borda-forte)', borderRadius:'2px' }}>
            <div style={{ padding:'0.75rem 1rem', borderBottom:'2px solid var(--verde)', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:'var(--fundo-painel)', zIndex:10 }}>
              <div>
                <p style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--verde)', textTransform:'uppercase', letterSpacing:'0.06em' }}>EDITAR FORNECEDOR</p>
                <p style={{ fontSize:'0.65rem', color:'var(--texto-desab)' }}>{editando.nome}</p>
              </div>
              <button onClick={()=>setEditando(null)} className="btn-icon"><X size={16}/></button>
            </div>

            {/* Modal Tabs */}
            <div style={{ padding: '0.75rem 1.25rem 0', borderBottom: '1px solid var(--borda)', display: 'flex', gap: '0.75rem', background: 'var(--surface-alt)' }}>
              {[
                { id: 'dados', label: 'Dados Cadastrais' },
                { id: 'produtos', label: `Produtos Vinculados (${produtosDB.filter(p => p.fornecedor_id === editando.id).length})` },
                { id: 'pedidos', label: `Pedidos de Compra (${pedidos.filter(p => p.fornecedor_id === editando.id).length})` },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setAbaModal(t.id as any)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: 'none',
                    background: 'transparent',
                    borderBottom: abaModal === t.id ? '2px solid var(--verde)' : 'none',
                    color: abaModal === t.id ? 'var(--verde)' : 'var(--texto-desab)',
                    fontWeight: abaModal === t.id ? 700 : 500,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    transition: 'all 0.12s',
                    paddingBottom: '0.625rem',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ padding:'1.25rem', display:'flex', flexDirection:'column', gap:'0.875rem' }}>
              {abaModal === 'dados' && (
                <>
                  {erroEdit && <div className="alerta alerta-perigo">{erroEdit}</div>}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.625rem' }}>
                    <div>
                      <label className="campo-label">Nome da empresa *</label>
                      <input className="campo" style={campo} value={editando.nome} onChange={e=>set('nome',e.target.value)}/>
                    </div>
                    <div>
                      <label className="campo-label">Nome do contato</label>
                      <input className="campo" style={campo} value={editando.contato||''} onChange={e=>set('contato',e.target.value)}/>
                    </div>
                    <div>
                      <label className="campo-label">Telefone / WhatsApp</label>
                      <input className="campo" style={campo} value={editando.telefone||''} onChange={e=>set('telefone',e.target.value)}/>
                    </div>
                    <div>
                      <label className="campo-label">E-mail</label>
                      <input className="campo" type="email" style={campo} value={editando.email||''} onChange={e=>set('email',e.target.value)}/>
                    </div>
                    <div>
                      <label className="campo-label">CNPJ</label>
                      <input className="campo" style={{...campo,fontFamily:'monospace'}} value={editando.cnpj||''} onChange={e=>set('cnpj',e.target.value)}/>
                    </div>
                    <div>
                      <label className="campo-label">Categoria</label>
                      <select className="campo" style={campo} value={editando.categoria||''} onChange={e=>set('categoria',e.target.value)}>
                        <option value="">Selecionar...</option>
                        {CATEGORIAS_FORN.map(c=><option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="campo-label">CEP</label>
                      <input className="campo" style={{...campo,fontFamily:'monospace'}} maxLength={9} value={editando.cep||''} onChange={e=>set('cep',e.target.value)} onBlur={e=>buscarCepEdicao(e.target.value)}/>
                    </div>
                    <div>
                      <label className="campo-label">Rua / Logradouro</label>
                      <input className="campo" style={campo} value={editando.rua||''} onChange={e=>set('rua',e.target.value)}/>
                    </div>
                    <div>
                      <label className="campo-label">Número</label>
                      <input className="campo" style={campo} value={editando.numero||''} onChange={e=>set('numero',e.target.value)}/>
                    </div>
                    <div>
                      <label className="campo-label">Bairro</label>
                      <input className="campo" style={campo} value={editando.bairro||''} onChange={e=>set('bairro',e.target.value)}/>
                    </div>
                    <div>
                      <label className="campo-label">Complemento</label>
                      <input className="campo" style={campo} value={editando.complemento||''} onChange={e=>set('complemento',e.target.value)}/>
                    </div>
                    <div>
                      <label className="campo-label">Cidade</label>
                      <input className="campo" style={campo} value={editando.cidade||''} onChange={e=>set('cidade',e.target.value)}/>
                    </div>
                    <div>
                      <label className="campo-label">Estado</label>
                      <select className="campo" style={{...campo,maxWidth:'100%'}} value={editando.estado||''} onChange={e=>set('estado',e.target.value)}>
                        <option value="">UF</option>
                        {ESTADOS_BR.map(s=><option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="campo-label">Prazo de entrega</label>
                      <input className="campo" style={campo} value={editando.prazo_entrega||''} onChange={e=>set('prazo_entrega',e.target.value)} placeholder="Ex: 24h, 3 dias úteis"/>
                    </div>
                    <div>
                      <label className="campo-label">Pedido mínimo (R$)</label>
                      <input className="campo" type="number" style={campo} value={editando.pedido_minimo??''} onChange={e=>set('pedido_minimo',parseFloat(e.target.value)||null)}/>
                    </div>
                  </div>
                  <div>
                    <label className="campo-label">Anotações</label>
                    <textarea className="campo" rows={2} style={{...campo,resize:'none'}} value={editando.anotacoes||''} onChange={e=>set('anotacoes',e.target.value)}/>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                    <label className="campo-label" style={{ margin:0 }}>Status:</label>
                    {(['ativo','inativo'] as const).map(s=>(
                      <button key={s} type="button" onClick={()=>set('ativo', s==='ativo')}
                        style={{ padding:'0.3rem 0.875rem', border:`2px solid ${editando.ativo===(s==='ativo')?'var(--verde)':'var(--borda)'}`,
                          borderRadius:'var(--radius-sm)', background: editando.ativo===(s==='ativo')?'var(--verde-claro)':'var(--surface)',
                          cursor:'pointer', fontWeight:700, fontFamily:'inherit', fontSize:'0.82rem',
                          color: editando.ativo===(s==='ativo')?'var(--verde-esc)':'var(--texto-sec)' }}>
                        {s==='ativo'?'● Ativo':'○ Inativo'}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {abaModal === 'produtos' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', background: 'var(--surface-alt)', padding: '0.75rem', border: '1px solid var(--borda)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ flex: 1 }}>
                      <label className="campo-label">Vincular novo produto a este fornecedor</label>
                      <select
                        className="campo"
                        style={{ marginTop: '0.375rem', width: '100%' }}
                        value={selectedProdParaVincular}
                        onChange={e => setSelectedProdParaVincular(e.target.value)}
                      >
                        <option value="">— Selecione um produto —</option>
                        {produtosDB.filter(p => p.fornecedor_id !== editando.id).map(p => (
                          <option key={p.id} value={p.id}>
                            {p.nome} {p.sku ? `(SKU: ${p.sku})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedProdParaVincular) {
                          vincularProduto(selectedProdParaVincular)
                        }
                      }}
                      disabled={!selectedProdParaVincular}
                      className="btn btn-primary"
                      style={{ padding: '0.45rem 1rem', whiteSpace: 'nowrap' }}
                    >
                      + Vincular
                    </button>
                  </div>

                  <div style={{ marginTop: '0.5rem' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--texto-sec)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                      📋 Produtos Vinculados
                    </p>
                    {produtosDB.filter(p => p.fornecedor_id === editando.id).length === 0 ? (
                      <p style={{ fontSize: '0.72rem', color: 'var(--texto-desab)', fontStyle: 'italic', padding: '1rem', textAlign: 'center', border: '1px dashed var(--borda)', background: 'var(--surface-alt)' }}>
                        Nenhum produto vinculado a este fornecedor.
                      </p>
                    ) : (
                      <div className="tabela-wrap">
                        <table className="tabela" style={{ fontSize: '0.72rem' }}>
                          <thead>
                            <tr>
                              <th>PRODUTO</th>
                              <th>SKU</th>
                              <th style={{ textAlign: 'center' }}>ESTOQUE</th>
                              <th style={{ textAlign: 'right' }}>PREÇO</th>
                              <th style={{ textAlign: 'center' }}>AÇÃO</th>
                            </tr>
                          </thead>
                          <tbody>
                            {produtosDB
                              .filter(p => p.fornecedor_id === editando.id)
                              .map(p => (
                                <tr key={p.id}>
                                  <td style={{ fontWeight: 700 }}>{p.nome}</td>
                                  <td><code>{p.sku || '—'}</code></td>
                                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{p.qtd_atual}</td>
                                  <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'monospace' }}>
                                    {formatCurrency(p.preco_varejo)}
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    <button
                                      type="button"
                                      onClick={() => desvincularProduto(p.id)}
                                      className="btn btn-secondary"
                                      style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem', color: 'var(--vermelho)' }}
                                    >
                                      Desvincular
                                    </button>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {abaModal === 'pedidos' && (
                <div style={{ marginTop: '0.25rem' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--texto-sec)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                    📜 Histórico de Pedidos de Compra
                  </p>
                  {pedidos.filter(p => p.fornecedor_id === editando.id).length === 0 ? (
                    <p style={{ fontSize: '0.72rem', color: 'var(--texto-desab)', fontStyle: 'italic', padding: '1rem', textAlign: 'center', border: '1px dashed var(--borda)', background: 'var(--surface-alt)' }}>
                      Nenhum pedido registrado para este fornecedor.
                    </p>
                  ) : (
                    <div className="tabela-wrap" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                      <table className="tabela" style={{ fontSize: '0.7rem' }}>
                        <thead>
                          <tr>
                            <th>PRODUTO</th>
                            <th style={{ textAlign: 'center' }}>QTD</th>
                            <th style={{ textAlign: 'right' }}>VALOR TOTAL</th>
                            <th>DATA</th>
                            <th style={{ textAlign: 'center' }}>STATUS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pedidos
                            .filter(p => p.fornecedor_id === editando.id)
                            .map(p => (
                              <tr key={p.id}>
                                <td style={{ fontWeight: 600 }}>{p.produto}</td>
                                <td style={{ textAlign: 'center' }}>{p.quantidade}x</td>
                                <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', color: 'var(--verde)' }}>
                                  {p.total ? formatCurrency(p.total) : '—'}
                                </td>
                                <td>{new Date(p.criado_em).toLocaleDateString('pt-BR')}</td>
                                <td style={{ textAlign: 'center' }}>
                                  <span className={p.status === 'recebido' ? 'status-ok' : p.status === 'enviado' ? 'status-alerta' : 'status-neutro'} style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem' }}>
                                    {p.status === 'recebido' ? 'RECEBIDO' : p.status === 'enviado' ? 'ENVIADO' : 'PENDENTE'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.5rem', marginTop:'0.5rem' }}>
                {abaModal === 'dados' ? (
                  <>
                    <button onClick={()=>setEditando(null)} className="btn btn-ghost">Cancelar</button>
                    <button onClick={salvarEdicao} disabled={salvando} className="btn btn-primary" style={{ display:'flex', alignItems:'center', gap:'0.375rem' }}>
                      {salvando?<><Loader2 size={14} style={{animation:'spin 1s linear infinite'}}/>Salvando...</>:<><Save size={14}/>Salvar alterações</>}
                    </button>
                  </>
                ) : (
                  <button onClick={()=>setEditando(null)} className="btn btn-primary">Fechar</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">FORNECEDORES</h1>
          <p className="pg-sub">{fornecedores.length} CADASTRADOS · {pendentes} PEDIDO(S) PENDENTE(S)</p>
        </div>
        <div style={{display:'flex',gap:'0.375rem'}}>
          {aba === 'pedidos' && (
            <button onClick={() => setShowPedido(true)} className="btn btn-secondary">+ NOVO PEDIDO</button>
          )}
          <button onClick={() => setShowModal(true)} className="btn btn-primary">+ NOVO FORNECEDOR</button>
        </div>
      </div>

      <PageTabs tabs={[
        { label: 'Todos os Clientes', href: '/clientes' },
        { label: plano === 'pro' ? 'Sumidos ⚠' : 'Sumidos 🔒', href: '/clientes/inativos' },
        { label: 'Fornecedores', href: '/fornecedores' }
      ]} />

      {/* Abas internas */}
      <div style={{ display:'flex', gap:'0.25rem' }}>
        {([['lista','FORNECEDORES'],['pedidos',`PEDIDOS${pendentes>0?' ('+pendentes+')':''}`]] as const).map(([v,l])=>(
          <button key={v} onClick={()=>setAba(v)}
            className={aba===v?'btn btn-primary':'btn btn-secondary'}
            style={{ fontSize:'0.65rem', padding:'0.3rem 0.75rem' }}>{l}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'3rem', flexDirection:'column', alignItems:'center', gap:'0.5rem' }}>
          <p style={{ color:'var(--verde)', fontSize:'0.75rem', letterSpacing:'0.08em' }}>CARREGANDO FORNECEDORES<span className="blink">_</span></p>
        </div>
      ) : aba === 'lista' ? (
        <>
          <input className="campo" placeholder="BUSCAR: NOME, CNPJ, E-MAIL, CIDADE..."
            style={{ maxWidth:'360px' }} value={busca} onChange={e=>setBusca(e.target.value)}/>
          {filtrados.length === 0 ? (
            <div style={{ textAlign:'center', padding:'3rem', color:'var(--texto-desab)', border:'1px solid var(--borda)', background:'var(--surface)' }}>
              {busca ? (
                <p style={{ fontSize:'0.78rem', letterSpacing:'0.04em' }}>[ NENHUM FORNECEDOR ENCONTRADO ]</p>
              ) : (
                <div>
                  <p style={{ fontSize:'0.7rem', color:'var(--borda-forte)', letterSpacing:'0.1em', fontWeight:700, marginBottom:'0.5rem' }}>[ NENHUM FORNECEDOR CADASTRADO ]</p>
                  <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ marginTop:'0.5rem' }}>+ CADASTRAR FORNECEDOR</button>
                </div>
              )}
            </div>
          ) : (
            <div className="tabela-wrap">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>FORNECEDOR</th><th>CONTATO/WA</th><th>CATEGORIA</th>
                    <th>CIDADE/UF</th><th>PRAZO</th><th style={{ textAlign:'center' }}>STATUS</th>
                    <th style={{ textAlign:'center' }}>AÇÃO</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(f => (
                    <tr key={f.id}>
                      <td style={{ fontWeight:700, cursor:'pointer', color:'var(--verde)' }} onClick={() => { setEditando(f); setAbaModal('dados'); }}>{f.nome}</td>
                      <td>
                        {f.telefone
                          ? <a href={`https://wa.me/55${f.telefone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                              className="btn btn-secondary" style={{ fontSize:'0.65rem', padding:'0.2rem 0.5rem' }}>
                              WA {f.contato || f.telefone}
                            </a>
                          : <span style={{ color:'var(--texto-desab)' }}>{f.contato || '—'}</span>
                        }
                      </td>
                      <td style={{ fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.04em' }}>{f.categoria || '—'}</td>
                      <td style={{ fontSize:'0.72rem', color:'var(--texto-sec)' }}>{[f.cidade, f.estado].filter(Boolean).join('/') || '—'}</td>
                      <td style={{ fontSize:'0.72rem' }}>{f.prazo_entrega || '—'}</td>
                      <td style={{ textAlign:'center' }}>
                        <span className={f.ativo?'status-ok':'status-neutro'} style={{ fontSize:'0.7rem' }}>
                          {f.ativo?'● ATIVO':'○ INATIVO'}
                        </span>
                      </td>
                      <td style={{ textAlign:'center' }}>
                        <button onClick={() => { setEditando(f); setAbaModal('dados'); }} className="btn btn-secondary"
                          style={{ fontSize:'0.62rem', padding:'0.15rem 0.4rem' }}>VER/EDITAR</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <>
          {/* KPIs de Pedidos */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'0.5rem', marginBottom:'0.5rem' }}>
            {[
              { l:'Rascunho', v: kpiPedidos.rascunho, c:'var(--texto-desab)' },
              { l:'Enviado', v: kpiPedidos.enviado, c:'var(--amarelo)' },
              { l:'Recebido', v: kpiPedidos.recebido, c:'var(--verde)' },
              { l:'Valor em Aberto', v: formatCurrency(kpiPedidos.totalAberto), c: kpiPedidos.totalAberto > 0 ? 'var(--azul)' : 'var(--verde)' },
            ].map(k => (
              <div key={k.l} className="card" style={{ padding:'0.625rem' }}>
                <p style={{ fontSize:'0.68rem', color:'var(--texto-desab)', marginBottom:'0.2rem', textTransform:'uppercase', letterSpacing:'0.04em' }}>{k.l}</p>
                <p style={{ fontWeight:900, fontSize:'1.25rem', color:k.c, fontFamily:'monospace' }}>{k.v}</p>
              </div>
            ))}
          </div>
          <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>PRODUTO</th>
                <th>FORNECEDOR</th>
                <th style={{ textAlign:'center' }}>QTD</th>
                <th style={{ textAlign:'right' }}>VALOR TOTAL</th>
                <th>OBS / PREVISÃO</th>
                <th>DATA</th>
                <th style={{ textAlign:'center' }}>STATUS</th>
                <th style={{ textAlign:'center' }}>AÇÃO</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign:'center', padding:'2rem', color:'var(--texto-desab)', fontSize:'0.72rem', letterSpacing:'0.06em' }}>
                  [ NENHUM PEDIDO PENDENTE ]
                </td></tr>
              ) : pedidos.map(p => (
                <tr key={p.id} style={{ opacity: p.status === 'recebido' ? 0.6 : 1 }}>
                  <td style={{ fontWeight:700 }}>{p.produto}</td>
                  <td style={{ fontSize:'0.72rem', color:'var(--texto-sec)' }}>{(Array.isArray(p.fornecedores) ? p.fornecedores[0]?.nome : (p.fornecedores as any)?.nome) || '—'}</td>
                  <td style={{ textAlign:'center', fontWeight:700 }}>{p.quantidade}x</td>
                  <td style={{ textAlign:'right', fontWeight:700, fontFamily:'monospace', color:'var(--verde)' }}>{p.total ? formatCurrency(p.total) : '—'}</td>
                  <td style={{ fontSize:'0.72rem', color:'var(--texto-desab)', maxWidth:'200px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={p.obs || ''}>{p.obs || '—'}</td>
                  <td style={{ fontSize:'0.72rem', fontVariantNumeric:'tabular-nums' }}>{new Date(p.criado_em).toLocaleDateString('pt-BR')}</td>
                  <td style={{ textAlign:'center' }}>
                    <span className={p.status === 'recebido' ? 'status-ok' : p.status === 'cancelado' ? 'status-neutro' : p.status === 'enviado' ? 'status-alerta' : 'status-aviso'}
                      style={{ fontSize:'0.7rem' }}>
                      {p.status === 'recebido' ? '● RECEBIDO' : p.status === 'cancelado' ? '✕ CANCELADO' : p.status === 'enviado' ? '◐ ENVIADO' : '○ RASCUNHO'}
                    </span>
                  </td>
                  <td style={{ textAlign:'center', display:'flex', gap:'0.25rem', justifyContent:'center' }}>
                    <button
                      onClick={() => {
                        setPedidoDetalhe(p)
                        setEditandoPedido(false)
                        setEditPedProduto(p.produto)
                        setEditPedQtd(String(p.quantidade))
                        setEditPedPreco(p.total && p.quantidade ? String((p.total / p.quantidade).toFixed(2)) : '')
                        setEditPedObs(p.obs || '')
                        setEditPedFornId(p.fornecedor_id || '')
                      }}
                      className="btn btn-secondary" style={{ fontSize:'0.62rem', padding:'0.15rem 0.4rem' }}>
                      🔍 VER
                    </button>
                    {p.status !== 'recebido' && p.status !== 'cancelado' && (
                      <button
                        onClick={() => avancarStatus(p.id, p.status)}
                        disabled={avancarLoading === p.id}
                        className="btn btn-secondary" style={{ fontSize:'0.62rem', padding:'0.15rem 0.4rem', fontWeight:700 }}>
                        {avancarLoading === p.id ? '...' : p.status === 'enviado' ? '📦 DAR ENTRADA' : '📤 ENVIAR'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}
    </div>
  )
}
