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
  id: string; fornecedor_id: string; produto: string; quantidade: number
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

  // Autocomplete de produtos em estoque
  const [produtosDB,   setProdutosDB]   = useState<{ id: string; nome: string }[]>([])
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
        .select('id,nome')
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
    const next = 'recebido'
    const p = pedidos.find(o => o.id === id)
    if (!p || !empresaId) return

    const supabase = createClient()
    setLoading(true)

    // 1. Atualiza status do pedido de fornecedor
    const { error } = await supabase.from('pedidos_fornecedor').update({ status: next }).eq('id', id)
    if (error) {
      toast.error('Erro ao atualizar status do pedido: ' + error.message)
      setLoading(false)
      return
    }

    // 2. Tenta encontrar o produto no estoque para dar entrada
    try {
      const { data: prod } = await supabase
        .from('produtos')
        .select('id,qtd_atual')
        .eq('empresa_id', empresaId)
        .eq('nome', p.produto)
        .maybeSingle()

      if (prod) {
        const quantidadeSomada = parseFloat(String(p.quantidade)) || 0
        const novaQtd = (prod.qtd_atual || 0) + quantidadeSomada
        // Atualiza a quantidade do produto
        await supabase.from('produtos').update({ qtd_atual: novaQtd }).eq('id', prod.id)

        // Registra a movimentação de entrada no estoque
        const fornNome = Array.isArray(p.fornecedores) ? p.fornecedores[0]?.nome : (p.fornecedores as any)?.nome || 'Fornecedor'
        await supabase.from('estoque_movimentacoes').insert({
          empresa_id: empresaId,
          produto_id: prod.id,
          tipo: 'entrada',
          quantidade: quantidadeSomada,
          obs: `Entrada via Pedido de Compra (Fornecedor: ${fornNome})`
        })
        toast.success(`Estoque do produto "${p.produto}" atualizado (+${quantidadeSomada})`)
      }
    } catch (err) {
      console.error('Erro ao atualizar estoque:', err)
    }

    // 3. Lança a despesa correspondente se o valor total do pedido for > 0
    if (p.total && p.total > 0) {
      try {
        const fornNome = Array.isArray(p.fornecedores) ? p.fornecedores[0]?.nome : (p.fornecedores as any)?.nome || 'Fornecedor'
        const { data: desps } = await supabase.from('despesas').select('numero_base').eq('empresa_id', empresaId)
        const maxBase = Math.max(0, ...(desps || []).map(d => d.numero_base ?? 0))
        const nextBase = maxBase + 1

        await supabase.from('despesas').insert({
          empresa_id: empresaId,
          descricao: `Compra de insumo/produto - ${p.produto} (${fornNome})`,
          categoria: 'Fornecedor',
          tipo: 'variavel',
          valor: p.total,
          data: new Date().toISOString().slice(0, 10),
          recorrente: false,
          status: 'pago',
          forma_pagamento: 'Boleto',
          observacao: `Lançado automaticamente ao receber o Pedido de Compra #${p.id.substring(0,8).toUpperCase()}. ${p.obs || ''}`,
          numero_base: nextBase,
          identificador: String(nextBase)
        })
        toast.success('Despesa de compra gerada no financeiro!')
      } catch (e) {
        console.error('Erro ao gerar despesa de compra:', e)
      }
    }

    toast.success('Pedido recebido e finalizado com sucesso!')
    setPedidos(prev => prev.map(item => item.id === id ? { ...item, status: next } : item))
    setLoading(false)
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
      status: 'enviado' // 'rascunho' | 'enviado' | 'recebido' | 'cancelado'
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

  const filtrados = fornecedores.filter(f =>
    f.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (f.categoria || '').toLowerCase().includes(busca.toLowerCase())
  )
  const pendentes = pedidos.filter(p => p.status !== 'entregue').length
  const set = (k: keyof Fornecedor, v: unknown) => setEditando(e => e ? { ...e, [k]: v } : e)

  return (
    <div className="anim-fade" style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>

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
            <div style={{ padding:'1.25rem', display:'flex', flexDirection:'column', gap:'0.875rem' }}>
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
              {/* Histórico de Pedidos de Compra */}
              <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--borda)', paddingTop: '0.75rem' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--texto-sec)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  📜 Histórico de Pedidos de Compra
                </p>
                {pedidos.filter(p => p.fornecedor_id === editando.id).length === 0 ? (
                  <p style={{ fontSize: '0.72rem', color: 'var(--texto-desab)', fontStyle: 'italic', padding: '0.25rem 0' }}>
                    Nenhum pedido registrado para este fornecedor.
                  </p>
                ) : (
                  <div className="tabela-wrap" style={{ maxHeight: '180px', overflowY: 'auto' }}>
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
                                  {p.status === 'recebido' ? 'RECEBIDO' : p.status === 'enviado' ? 'ENVIADO' : p.status?.toUpperCase()}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.5rem', marginTop:'0.5rem' }}>
                <button onClick={()=>setEditando(null)} className="btn btn-ghost">Cancelar</button>
                <button onClick={salvarEdicao} disabled={salvando} className="btn btn-primary" style={{ display:'flex', alignItems:'center', gap:'0.375rem' }}>
                  {salvando?<><Loader2 size={14} style={{animation:'spin 1s linear infinite'}}/>Salvando...</>:<><Save size={14}/>Salvar alterações</>}
                </button>
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
          <input className="campo" placeholder="BUSCAR FORNECEDOR_"
            style={{ maxWidth:'320px' }} value={busca} onChange={e=>setBusca(e.target.value)}/>
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
                      <td style={{ fontWeight:700 }}>{f.nome}</td>
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
                        <button onClick={() => setEditando(f)} className="btn btn-secondary"
                          style={{ fontSize:'0.62rem', padding:'0.15rem 0.4rem' }}>EDITAR</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
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
                    <span className={p.status === 'recebido' ? 'status-ok' : p.status === 'enviado' ? 'status-alerta' : 'status-neutro'}
                      style={{ fontSize:'0.7rem' }}>
                      {p.status === 'recebido' ? '● RECEBIDO' : p.status === 'enviado' ? '◐ ENVIADO' : `○ ${p.status?.toUpperCase()}`}
                    </span>
                  </td>
                  <td style={{ textAlign:'center' }}>
                    {p.status !== 'recebido' && (
                      <button onClick={() => avancarStatus(p.id, p.status)}
                        className="btn btn-secondary" style={{ fontSize:'0.62rem', padding:'0.15rem 0.4rem', fontWeight:700 }}>
                        ✓ RECEBIDO
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
