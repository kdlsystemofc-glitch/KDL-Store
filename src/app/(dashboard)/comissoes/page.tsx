'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { formatCurrency } from '@/lib/utils'
import { Plus, Loader2, Trash2, X, Save } from 'lucide-react'
import { PageTabs } from '@/components/PageTabs'
import { ProOnly } from '@/components/ProOnly'
import { useSubscription } from '@/hooks/useSubscription'

type Comissao = { id:string; nome:string; telefone:string|null; tipo:string; taxa:number; status:string; criado_em:string }
type VendaComissao = {
  id:string; numero:number; total:number; forma_pagamento:string; criado_em:string
  comissionado_nome:string; comissionado_id:string
  valor_comissao: number
  comissao_paga: boolean
  comissao_despesa_id?: string | null // ID da despesa gerada ao pagar a comissão
}

export default function ComissoesPage() {
  const { empresaId } = useEmpresaId()
  const { plano } = useSubscription()
  const [aba,      setAba]      = useState<'cadastro'|'por-venda'|'historico'>('cadastro')
  const [lista,    setLista]    = useState<Comissao[]>([])
  const [vendas,   setVendas]   = useState<VendaComissao[]>([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [nome,     setNome]     = useState('')
  const [tel,      setTel]      = useState('')
  const [tipo,     setTipo]     = useState<'percentual'|'fixo'>('percentual')
  const [taxa,     setTaxa]     = useState('')

  // Modal de pagamento (PDV de comissão)
  const [modalPagar, setModalPagar] = useState(false)
  const [comissionadoPagar, setComissionadoPagar] = useState<Comissao | null>(null)
  const [vendasPagar, setVendasPagar] = useState<Record<string, boolean>>({})
  const [formaPagSelected, setFormaPagSelected] = useState('Dinheiro')
  const [pagamentoEfetuado, setPagamentoEfetuado] = useState(false)
  const [vendasPagasNoRecibo, setVendasPagasNoRecibo] = useState<VendaComissao[]>([])
  const [reciboForma, setReciboForma] = useState('')
  const [reciboData, setReciboData] = useState('')
  const [reciboTotal, setReciboTotal] = useState(0)
  const [formasPag, setFormasPag] = useState<{ id: string; nome: string }[]>([])
  const [pagamentoComissaoId, setPagamentoComissaoId] = useState<string | null>(null)

  // Histórico de pagamentos
  type PagComissao = { id:string; comissionado_nome:string; forma_pagamento:string; total_pago:number; data_pagamento:string; criado_em:string; vendas_ids:string[] }
  const [historicoPag, setHistoricoPag] = useState<PagComissao[]>([])
  const [loadingHist,  setLoadingHist]  = useState(false)

  useEffect(() => { if (empresaId) carregar(empresaId) }, [empresaId])

  async function carregarHistorico(eid: string) {
    setLoadingHist(true)
    const { data } = await createClient()
      .from('pagamentos_comissao')
      .select('id,comissionado_nome,forma_pagamento,total_pago,data_pagamento,criado_em,vendas_ids')
      .eq('empresa_id', eid)
      .order('criado_em', { ascending: false })
      .limit(100)
    setHistoricoPag((data || []) as PagComissao[])
    setLoadingHist(false)
  }

  async function carregar(eid: string) {
    setLoading(true)
    const supabase = createClient()

    // Carrega comissionados, vendas comissionadas e formas de pagamento em paralelo
    const [{ data: comissoesData }, vendasData, { data: formasData }] = await Promise.all([
      supabase.from('comissoes').select('*').eq('empresa_id', eid).order('criado_em', { ascending: false }),
      supabase.from('vendas')
        .select('id,numero,total,forma_pagamento,criado_em,comissionado_id,comissionado_nome,valor_comissao,comissao_paga,comissao_despesa_id')
        .eq('empresa_id', eid)
        .eq('status', 'concluida')
        .not('comissionado_id', 'is', null)
        .order('criado_em', { ascending: false })
        .limit(200),
      supabase.from('formas_pagamento').select('id,nome').eq('empresa_id', eid).eq('ativo', true)
    ])

    setLista(comissoesData || [])
    setFormasPag(formasData || [])

    const vendasArr = vendasData.data || []
    if (vendasArr.length > 0) {
      // Busca taxas atuais para fallback (vendas sem valor_comissao gravado)
      const { data: taxasData } = await supabase.from('comissoes').select('id,taxa,tipo_comissao').eq('empresa_id', eid)
      const mapa = Object.fromEntries((taxasData || []).map(c => [c.id, c]))

      const result: VendaComissao[] = vendasArr.map((v: any) => {
        let valor_comissao = v.valor_comissao ?? 0
        if (!v.valor_comissao) {
          const com = mapa[v.comissionado_id]
          if (com) {
            valor_comissao = com.tipo_comissao === 'percentual'
              ? (v.total * com.taxa) / 100
              : com.taxa
          }
        }
        return {
          id:               v.id,
          numero:           v.numero,
          total:            v.total,
          forma_pagamento:  v.forma_pagamento,
          criado_em:        v.criado_em,
          comissionado_nome: v.comissionado_nome || '—',
          comissionado_id:  v.comissionado_id,
          valor_comissao,
          comissao_paga:    v.comissao_paga ?? false,
          comissao_despesa_id: v.comissao_despesa_id ?? null,
        }
      })
      setVendas(result)
    }

    setLoading(false)
  }

  async function marcarPago(venda: VendaComissao) {
    const supabase = createClient()
    const novoPago = !venda.comissao_paga

    if (!novoPago && !confirm('Deseja desmarcar o pagamento desta comissão? Isso excluirá a despesa vinculada.')) {
      return
    }

    // 1. Atualiza o status na venda
    await supabase.from('vendas').update({ comissao_paga: novoPago }).eq('id', venda.id)

    if (novoPago) {
      // 2a. PAGANDO → cria despesa no financeiro
      const { data: despesa } = await supabase.from('despesas').insert({
        empresa_id: empresaId,
        descricao: `Comissão paga — Venda #${String(venda.numero).padStart(4,'0')} (${venda.comissionado_nome})`,
        categoria: 'Comissões',
        tipo: 'variavel',
        valor: venda.valor_comissao,
        data: new Date().toISOString().slice(0, 10),
        recorrente: false,
        status: 'pago',
      }).select('id').single()

      // 3. Salva o ID da despesa na venda para poder excluir depois
      const despesaId = despesa?.id ?? null
      if (despesaId) {
        await supabase.from('vendas').update({ comissao_despesa_id: despesaId }).eq('id', venda.id)
      }

      setVendas(prev => prev.map(v => v.id === venda.id
        ? { ...v, comissao_paga: true, comissao_despesa_id: despesaId }
        : v
      ))
    } else {
      // 2b. DESMARCANDO → remove a despesa correspondente
      if (venda.comissao_despesa_id) {
        await supabase.from('despesas').delete().eq('id', venda.comissao_despesa_id)
        await supabase.from('vendas').update({ comissao_despesa_id: null }).eq('id', venda.id)
      }
      setVendas(prev => prev.map(v => v.id === venda.id
        ? { ...v, comissao_paga: false, comissao_despesa_id: null }
        : v
      ))
    }
  }

  function abrirPagarLote(c: Comissao) {
    const pendingSales = vendas.filter(v => v.comissionado_id === c.id && !v.comissao_paga)
    const initialChecked: Record<string, boolean> = {}
    pendingSales.forEach(v => {
      initialChecked[v.id] = true
    })
    setComissionadoPagar(c)
    setVendasPagar(initialChecked)
    setFormaPagSelected(formasPag[0]?.nome || 'Dinheiro')
    setPagamentoEfetuado(false)
    setModalPagar(true)
  }

  function abrirPagarIndividual(venda: VendaComissao) {
    const c = lista.find(x => x.id === venda.comissionado_id)
    if (!c) return
    setComissionadoPagar(c)
    setVendasPagar({ [venda.id]: true })
    setFormaPagSelected(formasPag[0]?.nome || 'Dinheiro')
    setPagamentoEfetuado(false)
    setModalPagar(true)
  }

  async function confirmarPagamentoLote() {
    if (!comissionadoPagar || !empresaId) return
    const selectedIds = Object.entries(vendasPagar).filter(([_, checked]) => checked).map(([id]) => id)
    if (selectedIds.length === 0) {
      alert('Selecione pelo menos uma comissão para pagar.')
      return
    }

    setSalvando(true)
    const supabase = createClient()
    const pagas: VendaComissao[] = []
    let totalPagoLote = 0

    try {
      for (const vId of selectedIds) {
        const v = vendas.find(x => x.id === vId)
        if (!v) continue

        // 1. Cria a despesa
        const { data: despesa } = await supabase.from('despesas').insert({
          empresa_id: empresaId,
          descricao: `Comissão paga — Venda #${String(v.numero).padStart(4,'0')} (${v.comissionado_nome})`,
          categoria: 'Comissões',
          tipo: 'variavel',
          valor: v.valor_comissao,
          data: new Date().toISOString().slice(0, 10),
          recorrente: false,
          status: 'pago',
          forma_pagamento: formaPagSelected || 'Dinheiro'
        }).select('id').single()

        const despesaId = despesa?.id ?? null

        // 2. Atualiza a venda
        await supabase.from('vendas').update({
          comissao_paga: true,
          comissao_despesa_id: despesaId
        }).eq('id', v.id)

        pagas.push({ ...v, comissao_despesa_id: despesaId })
        totalPagoLote += v.valor_comissao
      }

      // Salva o comprovante em pagamentos_comissao
      const { data: pagComissao } = await supabase.from('pagamentos_comissao').insert({
        empresa_id:       empresaId,
        comissionado_id:  comissionadoPagar.id,
        comissionado_nome: comissionadoPagar.nome,
        forma_pagamento:  formaPagSelected || 'Dinheiro',
        total_pago:       totalPagoLote,
        data_pagamento:   new Date().toISOString().slice(0, 10),
        vendas_ids:       selectedIds,
      }).select('id').single()
      setPagamentoComissaoId(pagComissao?.id ?? null)

      // Prepara o recibo
      setVendasPagasNoRecibo(pagas)
      setReciboForma(formaPagSelected || 'Dinheiro')
      setReciboData(new Date().toLocaleString('pt-BR'))
      setReciboTotal(totalPagoLote)
      setPagamentoEfetuado(true)

      // Atualiza estado local de vendas
      setVendas(prev => prev.map(v => {
        const p = pagas.find(x => x.id === v.id)
        return p ? { ...v, comissao_paga: true, comissao_despesa_id: p.comissao_despesa_id } : v
      }))
    } catch (e) {
      console.error(e)
      alert('Erro ao registrar pagamentos.')
    } finally {
      setSalvando(false)
    }
  }

  async function salvar() {
    if (!nome.trim() || !taxa || !empresaId) return
    setSalvando(true)
    const { data } = await createClient().from('comissoes')
      .insert({ empresa_id: empresaId, nome: nome.trim(), telefone: tel || null, tipo_comissao: tipo, taxa: parseFloat(taxa), status: 'ativo' })
      .select().single()
    if (data) setLista(prev => [data, ...prev])
    setModal(false); setNome(''); setTel(''); setTaxa(''); setSalvando(false)
  }

  async function alterarStatus(id: string, status: string) {
    const novo = status === 'ativo' ? 'inativo' : 'ativo'
    await createClient().from('comissoes').update({ status: novo }).eq('id', id)
    setLista(prev => prev.map(c => c.id === id ? { ...c, status: novo } : c))
  }

  async function excluir(id: string) {
    if (!confirm('Remover este comissionado?')) return
    await createClient().from('comissoes').delete().eq('id', id)
    setLista(prev => prev.filter(c => c.id !== id))
  }

  // ── Métricas derivadas (sempre calculadas) ─────────────────────
  const ativos        = lista.filter(c => c.status === 'ativo')
  const totalComissoes = vendas.reduce((a, v) => a + v.valor_comissao, 0)
  const totalPendente  = vendas.filter(v => !v.comissao_paga).reduce((a, v) => a + v.valor_comissao, 0)
  const totalPago      = vendas.filter(v => v.comissao_paga).reduce((a, v) => a + v.valor_comissao, 0)

  // Ranking por comissionado
  const ranking = Object.values(
    vendas.reduce((acc, v) => {
      if (!acc[v.comissionado_id]) acc[v.comissionado_id] = { nome: v.comissionado_nome, vendas: 0, total: 0, comissao: 0, pendente: 0 }
      acc[v.comissionado_id].vendas++
      acc[v.comissionado_id].total += v.total
      acc[v.comissionado_id].comissao += v.valor_comissao
      if (!v.comissao_paga) acc[v.comissionado_id].pendente += v.valor_comissao
      return acc
    }, {} as Record<string, { nome: string; vendas: number; total: number; comissao: number; pendente: number }>)
  ).sort((a, b) => b.comissao - a.comissao)

  return (
    <ProOnly>
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', maxWidth: '860px' }}>

      {/* Modal Novo Comissionado */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setModal(false) }}>
          <div className="card anim-pop" style={{ width: '100%', maxWidth: '420px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <p style={{ fontWeight: 900, fontSize: '1.1rem' }}>🎯 Cadastrar Comissionado</p>
              <button onClick={() => setModal(false)} className="btn-icon"><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <div><label className="campo-label">Nome *</label><input className="campo" style={{ marginTop: '0.375rem' }} value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Carlos Peixoto" /></div>
              <div><label className="campo-label">WhatsApp</label><input className="campo" style={{ marginTop: '0.375rem' }} value={tel} onChange={e => setTel(e.target.value)} placeholder="(11) 99999-0000" /></div>
              <div>
                <label className="campo-label">Tipo de comissão</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem', marginTop: '0.375rem' }}>
                  {(['percentual', 'fixo'] as const).map(t => (
                    <button key={t} onClick={() => setTipo(t)} type="button"
                      style={{ padding: '0.5rem', border: `2px solid ${tipo === t ? 'var(--verde)' : 'var(--borda)'}`, borderRadius: 'var(--radius-sm)', background: tipo === t ? 'var(--verde-claro)' : 'var(--surface)', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', fontFamily: 'inherit', color: tipo === t ? 'var(--verde-esc)' : 'var(--texto-sec)' }}>
                      {t === 'percentual' ? '% Percentual' : 'R$ Fixo/venda'}
                    </button>
                  ))}
                </div>
              </div>
              <div><label className="campo-label">{tipo === 'percentual' ? 'Percentual (%)' : 'Valor fixo por venda (R$)'} *</label>
                <input className="campo" type="number" min="0" step="0.01" style={{ marginTop: '0.375rem' }} value={taxa} onChange={e => setTaxa(e.target.value)} placeholder={tipo === 'percentual' ? 'Ex: 3' : 'Ex: 20,00'} /></div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(false)} className="btn btn-ghost">Cancelar</button>
              <button onClick={salvar} className="btn btn-primary" disabled={!nome.trim() || !taxa || salvando} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                {salvando ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />} Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">COMISSÕES</h1>
          <p className="pg-sub">{ativos.length} ATIVO(S) · {vendas.length} VENDAS COMISSIONADAS</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ CADASTRAR</button>
      </div>

      <PageTabs tabs={[
        { label: 'Garantias', href: '/garantias' },
        { label: 'Ordens de Serviço', href: '/ordens-de-servico' },
        { label: plano === 'pro' ? 'Comissões' : 'Comissões 🔒', href: '/comissoes' }
      ]} />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <p style={{ color: 'var(--verde)', fontSize: '0.75rem', letterSpacing: '0.08em' }}>CARREGANDO<span className="blink">_</span></p>
        </div>
      ) : (
        <>
          {/* ── KPIs GLOBAIS — sempre visíveis ─────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
            {[
              { l: 'TOTAL EM COMISSÕES', v: formatCurrency(totalComissoes), dot: 'var(--texto-sec)', c: 'var(--texto-mono)', sub: `${vendas.length} venda(s)` },
              { l: 'PENDENTE PAGAR', v: formatCurrency(totalPendente), dot: 'var(--amarelo)', c: 'var(--amarelo)', sub: `${vendas.filter(v => !v.comissao_paga).length} pendente(s)` },
              { l: 'JÁ PAGO', v: formatCurrency(totalPago), dot: 'var(--verde)', c: 'var(--verde)', sub: `${vendas.filter(v => v.comissao_paga).length} pago(s)` },
              { l: 'COMISSIONADOS ATIVOS', v: String(ativos.length), dot: '#60a5fa', c: '#60a5fa', sub: `${lista.filter(c => c.status === 'inativo').length} inativo(s)` },
            ].map(k => (
              <div key={k.l} className="kpi-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ color: k.dot, fontSize: '0.55rem' }}>●</span>
                  <p className="kpi-label">{k.l}</p>
                </div>
                <p className="kpi-valor" style={{ color: k.c, fontSize: '1rem' }}>{k.v}</p>
                <p className="kpi-sub">{k.sub}</p>
              </div>
            ))}
          </div>

          {/* ── Ranking sempre visível (se houver dados) ────────── */}
          {ranking.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="sec-header"><span>🏆 RANKING DE COMISSIONADOS</span></div>
              <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {ranking.map((r, i) => {
                  const com = lista.find(x => x.nome === r.nome)
                  return (
                    <div key={r.nome} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.35rem 0', borderBottom: '1px solid var(--borda-leve)' }}>
                      <span style={{ fontWeight: 900, fontSize: '0.9rem', width: '1.75rem', color: i === 0 ? 'var(--amarelo)' : 'var(--texto-desab)', flexShrink: 0 }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}°`}
                      </span>
                      <span style={{ flex: 1, fontWeight: 700, fontSize: '0.82rem' }}>{r.nome}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--texto-sec)' }}>{r.vendas} venda(s)</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontWeight: 800, color: 'var(--verde)', fontFamily: 'monospace', fontSize: '0.82rem' }}>{formatCurrency(r.comissao)}</p>
                          {r.pendente > 0 && <p style={{ fontSize: '0.65rem', color: 'var(--amarelo)' }}>pend: {formatCurrency(r.pendente)}</p>}
                        </div>
                        {r.pendente > 0 && com && (
                          <button onClick={() => abrirPagarLote(com)} className="btn btn-primary"
                            style={{ fontSize: '0.62rem', padding: '0.2rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.2rem', height: 'fit-content', fontWeight: 800 }}>
                            💰 PAGAR
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Sub-abas ─────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {([['cadastro', 'COMISSIONADOS'], ['por-venda', 'POR VENDA'], ['historico', '📜 HISTÓRICO']] as const).map(([v, l]) => (
              <button key={v} onClick={() => {
                setAba(v as any)
                if (v === 'historico' && empresaId) carregarHistorico(empresaId)
              }}
                className={aba === v ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{ fontSize: '0.65rem', padding: '0.3rem 0.75rem' }}>{l}</button>
            ))}
          </div>

          {/* ── ABA CADASTRO ─────────────────────────────────────── */}
          {aba === 'cadastro' && (
            <>
              <div style={{ padding: '0.625rem 0.75rem', background: 'var(--surface)', border: '1px solid var(--borda)', fontSize: '0.72rem', color: 'var(--texto-sec)' }}>
                ▶ COMISSIONADOS RECEBEM POR CADA VENDA ONDE FORAM INDICADORES.
              </div>
              {lista.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--texto-desab)', border: '1px solid var(--borda)', background: 'var(--surface)' }}>
                  <p style={{ fontSize: '0.7rem', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '0.5rem' }}>[ NENHUM COMISSIONADO ]</p>
                  <button onClick={() => setModal(true)} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>+ CADASTRAR PRIMEIRO</button>
                </div>
              ) : (
                <div className="tabela-wrap">
                  <table className="tabela">
                    <thead><tr>
                      <th>NOME</th><th>WHATSAPP</th><th style={{ textAlign: 'center' }}>TIPO</th>
                      <th style={{ textAlign: 'right' }}>TAXA</th>
                      <th style={{ textAlign: 'right' }}>COMISSÃO TOTAL</th>
                      <th style={{ textAlign: 'right' }}>PENDENTE</th>
                      <th style={{ textAlign: 'center' }}>STATUS</th><th style={{ textAlign: 'center' }}>AÇÕES</th>
                    </tr></thead>
                    <tbody>
                      {lista.map(c => {
                        const stats = ranking.find(r => r.nome === c.nome)
                        return (
                          <tr key={c.id} style={{ opacity: c.status === 'ativo' ? 1 : 0.55 }}>
                            <td style={{ fontWeight: 700 }}>{c.nome}</td>
                            <td style={{ fontSize: '0.72rem', color: 'var(--texto-sec)' }}>{c.telefone || '—'}</td>
                            <td style={{ textAlign: 'center' }}><span className={c.tipo === 'percentual' ? 'status-info' : 'status-neutro'} style={{ fontSize: '0.7rem' }}>{c.tipo === 'percentual' ? '% PCT' : 'R$ FIXO'}</span></td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{c.tipo === 'percentual' ? `${c.taxa}%` : formatCurrency(c.taxa) + '/VDA'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--verde)', fontFamily: 'monospace' }}>{stats ? formatCurrency(stats.comissao) : '—'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--amarelo)', fontFamily: 'monospace' }}>{stats?.pendente ? formatCurrency(stats.pendente) : '—'}</td>
                            <td style={{ textAlign: 'center' }}>
                              <button onClick={() => alterarStatus(c.id, c.status)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                <span className={c.status === 'ativo' ? 'status-ok' : 'status-neutro'} style={{ fontSize: '0.7rem' }}>{c.status === 'ativo' ? '● ATIVO' : '○ INATIVO'}</span>
                              </button>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                                {c.telefone && (<a href={`https://wa.me/55${c.telefone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ fontSize: '0.62rem', padding: '0.15rem 0.4rem' }}>WA</a>)}
                                <button onClick={() => excluir(c.id)} className="btn btn-secondary" style={{ fontSize: '0.62rem', padding: '0.15rem 0.4rem', color: 'var(--vermelho)' }}>DEL</button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ── ABA POR VENDA ─────────────────────────────────────── */}
          {aba === 'por-venda' && (
            <>
              {vendas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--texto-desab)', border: '1px solid var(--borda)', background: 'var(--surface)' }}>
                  <p style={{ fontSize: '0.7rem', letterSpacing: '0.1em', fontWeight: 700 }}>[ NENHUMA VENDA COM COMISSÃO ]</p>
                </div>
              ) : (
                <div className="tabela-wrap">
                  <table className="tabela">
                    <thead><tr>
                      <th>#VENDA</th><th>DATA</th><th>PAGAMENTO</th>
                      <th>INDICADOR</th>
                      <th style={{ textAlign: 'right' }}>TOTAL</th>
                      <th style={{ textAlign: 'right' }}>COMISSÃO</th>
                      <th style={{ textAlign: 'center' }}>STATUS</th>
                    </tr></thead>
                    <tbody>
                      {vendas.map(v => (
                        <tr key={v.id} style={{ opacity: v.comissao_paga ? 0.65 : 1 }}>
                          <td><span style={{ fontWeight: 700, color: 'var(--verde)', fontFamily: 'monospace' }}>#{String(v.numero).padStart(4, '0')}</span></td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--texto-desab)' }}>{new Date(v.criado_em).toLocaleDateString('pt-BR')}</td>
                          <td style={{ fontSize: '0.82rem' }}>{v.forma_pagamento}</td>
                          <td style={{ fontWeight: 600 }}>{v.comissionado_nome}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{formatCurrency(v.total)}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: v.comissao_paga ? 'var(--texto-desab)' : 'var(--amarelo)' }}>
                            {formatCurrency(v.valor_comissao)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button onClick={() => v.comissao_paga ? marcarPago(v) : abrirPagarIndividual(v)}
                              className="btn btn-secondary"
                              style={{ fontSize: '0.62rem', padding: '0.15rem 0.5rem', color: v.comissao_paga ? 'var(--verde)' : 'var(--amarelo)', border: `1px solid ${v.comissao_paga ? 'var(--verde)' : 'var(--amarelo)'}` }}>
                              {v.comissao_paga ? '✔ PAGO' : '○ PENDENTE'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: 'var(--surface-alt)' }}>
                        <td colSpan={4} style={{ fontWeight: 700, padding: '0.625rem 0.875rem' }}>TOTAL</td>
                        <td style={{ textAlign: 'right', fontWeight: 900, fontFamily: 'monospace', padding: '0.625rem 0.875rem', color: 'var(--verde)' }}>
                          {formatCurrency(vendas.reduce((a, v) => a + v.total, 0))}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 900, fontFamily: 'monospace', padding: '0.625rem 0.875rem', color: 'var(--amarelo)' }}>
                          {formatCurrency(totalComissoes)}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ── ABA HISTÓRICO ───────────────────────────────────── */}
          {aba === 'historico' && (
            <>
              {loadingHist ? (
                <div style={{display:'flex',justifyContent:'center',padding:'2rem',gap:'0.5rem',color:'var(--texto-desab)'}}>
                  <Loader2 size={16} style={{animation:'spin 1s linear infinite'}}/> Carregando...
                </div>
              ) : historicoPag.length === 0 ? (
                <div style={{textAlign:'center',padding:'3rem',color:'var(--texto-desab)',border:'1px solid var(--borda)',background:'var(--surface)'}}>
                  <p style={{fontSize:'0.7rem',letterSpacing:'0.1em',fontWeight:700}}>[ NENHUM PAGAMENTO REGISTRADO ]</p>
                  <p style={{fontSize:'0.75rem',marginTop:'0.5rem'}}>Os comprovantes aparecem aqui após pagar comissões em lote.</p>
                </div>
              ) : (
                <div className="tabela-wrap">
                  <table className="tabela">
                    <thead><tr>
                      <th>COMISSIONADO</th><th>DATA</th><th>FORMA PGTO</th>
                      <th style={{textAlign:'right'}}>TOTAL PAGO</th>
                      <th style={{textAlign:'center'}}>VENDAS</th>
                      <th style={{textAlign:'center'}}>AÇÕES</th>
                    </tr></thead>
                    <tbody>
                      {historicoPag.map(p => (
                        <tr key={p.id}>
                          <td style={{fontWeight:700}}>{p.comissionado_nome}</td>
                          <td style={{fontSize:'0.82rem',color:'var(--texto-desab)'}}>
                            {new Date(p.data_pagamento+'T12:00:00').toLocaleDateString('pt-BR')}
                          </td>
                          <td style={{fontSize:'0.82rem'}}>{p.forma_pagamento}</td>
                          <td style={{textAlign:'right',fontWeight:900,color:'var(--verde)',fontFamily:'monospace'}}>
                            {formatCurrency(p.total_pago)}
                          </td>
                          <td style={{textAlign:'center',fontFamily:'monospace',color:'var(--texto-sec)'}}>
                            {p.vendas_ids?.length ?? 0} venda(s)
                          </td>
                          <td style={{textAlign:'center'}}>
                            <a href={`/comissoes/comprovante/${p.id}`}
                              target="_blank" rel="noopener noreferrer"
                              className="btn btn-secondary"
                              style={{fontSize:'0.68rem',padding:'0.2rem 0.5rem'}}>
                              🧾 Ver Comprovante
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>

      {/* Modal PDV de Pagamento de Comissão */}
      {modalPagar && comissionadoPagar && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', overflowY: 'auto' }}
          onClick={e => { if (e.target === e.currentTarget && !pagamentoEfetuado) setModalPagar(false) }}>
          <div className="card anim-pop" style={{ width: '100%', maxWidth: '500px', padding: '1.5rem', background: '#fff', color: '#1a1a1a' }}>
            
            {!pagamentoEfetuado ? (
              // FASE 1: Form de Checkout
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--borda-leve)', paddingBottom: '0.5rem' }}>
                  <p style={{ fontWeight: 900, fontSize: '1.1rem', color: '#1e293b' }}>💰 Pagamento de Comissão</p>
                  <button onClick={() => setModalPagar(false)} className="btn-icon"><X size={18} /></button>
                </div>

                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <p style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>{comissionadoPagar.nome}</p>
                  {comissionadoPagar.telefone && <p style={{ fontSize: '0.75rem', color: '#64748b' }}>📞 {comissionadoPagar.telefone}</p>}
                </div>

                {/* Seleção de Vendas */}
                <p style={{ fontWeight: 700, fontSize: '0.8rem', color: '#475569', marginBottom: '0.5rem' }}>Selecione as comissões a pagar:</p>
                <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '1rem' }}>
                  {vendas.filter(v => v.comissionado_id === comissionadoPagar.id && !v.comissao_paga).map(v => (
                    <label key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer', padding: '4px', borderRadius: '4px', background: '#f8fafc' }}>
                      <input
                        type="checkbox"
                        checked={!!vendasPagar[v.id]}
                        onChange={e => setVendasPagar(prev => ({ ...prev, [v.id]: e.target.checked }))}
                        style={{ width: '15px', height: '15px' }}
                      />
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--verde)' }}>#{String(v.numero).padStart(4, '0')}</span>
                      <span style={{ color: '#64748b' }}>{new Date(v.criado_em).toLocaleDateString('pt-BR')}</span>
                      <span style={{ marginLeft: 'auto', fontWeight: 700, color: '#475569' }}>{formatCurrency(v.valor_comissao)}</span>
                    </label>
                  ))}
                  {vendas.filter(v => v.comissionado_id === comissionadoPagar.id && !v.comissao_paga).length === 0 && (
                    <p style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>Nenhuma comissão pendente</p>
                  )}
                </div>

                {/* Forma de Pagamento */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="campo-label" style={{ color: '#475569', fontWeight: 700 }}>Forma de Pagamento</label>
                  <select
                    className="campo"
                    style={{ marginTop: '0.375rem', borderColor: '#cbd5e1' }}
                    value={formaPagSelected}
                    onChange={e => setFormaPagSelected(e.target.value)}
                  >
                    {formasPag.length === 0 ? (
                      <option value="Dinheiro">Dinheiro</option>
                    ) : (
                      formasPag.map(f => <option key={f.id} value={f.nome}>{f.nome}</option>)
                    )}
                  </select>
                </div>

                {/* Resumo */}
                <div style={{ padding: '0.75rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: '#166534', fontSize: '0.85rem' }}>Total Selecionado:</span>
                  <span style={{ fontWeight: 900, fontSize: '1.25rem', color: '#15803d', fontFamily: 'monospace' }}>
                    {formatCurrency(
                      vendas.filter(v => vendasPagar[v.id]).reduce((s, v) => s + v.valor_comissao, 0)
                    )}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button onClick={() => setModalPagar(false)} className="btn btn-secondary">Cancelar</button>
                  <button
                    onClick={confirmarPagamentoLote}
                    disabled={salvando || vendas.filter(v => vendasPagar[v.id]).length === 0}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'var(--verde)', color: '#fff' }}
                  >
                    {salvando ? 'Processando...' : '✓ Confirmar Pagamento'}
                  </button>
                </div>
              </>
            ) : (
              // FASE 2: Recibo Térmico de Comprovante
              <>
                <div id="comprovante-print" style={{
                  padding: '1rem',
                  border: '2px dashed #000',
                  fontFamily: 'monospace',
                  fontSize: '0.82rem',
                  lineHeight: '1.4',
                  color: '#000',
                  background: '#fff'
                }}>
                  <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <p style={{ fontWeight: 'bold', fontSize: '1.1rem', margin: 0 }}>KDL STORE</p>
                    <p style={{ margin: '2px 0 0' }}>COMPROVANTE DE PAGAMENTO</p>
                    <p style={{ margin: '2px 0 0' }}>DE COMISSÃO</p>
                    <p style={{ fontSize: '0.75rem', color: '#555', margin: '4px 0 0' }}>------------------------------</p>
                  </div>

                  <p style={{ margin: '4px 0' }}><b>COMISSIONADO:</b> {comissionadoPagar.nome}</p>
                  <p style={{ margin: '4px 0' }}><b>DATA/HORA:</b> {reciboData}</p>
                  <p style={{ margin: '4px 0' }}><b>FORMA PGTO:</b> {reciboForma}</p>
                  <p style={{ fontSize: '0.75rem', color: '#555', margin: '4px 0' }}>------------------------------</p>

                  <p style={{ fontWeight: 'bold', margin: '6px 0 2px' }}>VENDAS INCLUÍDAS:</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {vendasPagasNoRecibo.map(v => (
                      <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Venda #{String(v.numero).padStart(4, '0')} ({new Date(v.criado_em).toLocaleDateString('pt-BR')})</span>
                        <span>{formatCurrency(v.valor_comissao)}</span>
                      </div>
                    ))}
                  </div>

                  <p style={{ fontSize: '0.75rem', color: '#555', margin: '6px 0' }}>------------------------------</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1rem' }}>
                    <span>TOTAL PAGO:</span>
                    <span>{formatCurrency(reciboTotal)}</span>
                  </div>
                  
                  <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
                    <div style={{ borderBottom: '1px solid #000', width: '200px', margin: '0 auto 4px' }} />
                    <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', margin: 0 }}>Assinatura do Recebedor</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', justifyContent: 'flex-end', flexWrap:'wrap' }} className="no-print">
                  <button onClick={() => window.print()} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    🖨️ Imprimir
                  </button>
                  {pagamentoComissaoId && (
                    <a href={`/comissoes/comprovante/${pagamentoComissaoId}`} target="_blank" rel="noopener noreferrer"
                      className="btn btn-secondary" style={{ display:'flex', alignItems:'center', gap:'0.25rem' }}>
                      🔗 Abrir Comprovante
                    </a>
                  )}
                  {comissionadoPagar?.telefone && (
                    <a href={`https://wa.me/55${comissionadoPagar.telefone.replace(/\D/g,'')}?text=${encodeURIComponent(`Olá ${comissionadoPagar.nome}! Segue comprovante do pagamento de comissão de ${formatCurrency(reciboTotal)} via ${reciboForma}. Data: ${reciboData}.`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="btn" style={{ background:'#25D366', color:'#fff', border:'none', display:'flex', alignItems:'center', gap:'0.25rem', fontSize:'0.78rem' }}>
                      💬 Enviar WA
                    </a>
                  )}
                  <button onClick={() => { setModalPagar(false); setPagamentoEfetuado(false); setPagamentoComissaoId(null); carregar(empresaId!) }} className="btn btn-primary">
                    Fechar
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {/* Estilos CSS para impressão */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #comprovante-print, #comprovante-print * { visibility: visible; }
          #comprovante-print {
            position: fixed;
            left: 0;
            top: 0;
            width: 80mm;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          @page { size: auto; margin: 0mm; }
        }
      `}</style>
    </ProOnly>
  )
}
