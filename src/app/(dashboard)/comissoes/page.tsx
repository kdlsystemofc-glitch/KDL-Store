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
  const [aba,      setAba]      = useState<'cadastro'|'por-venda'>('cadastro')
  const [lista,    setLista]    = useState<Comissao[]>([])
  const [vendas,   setVendas]   = useState<VendaComissao[]>([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [nome,     setNome]     = useState('')
  const [tel,      setTel]      = useState('')
  const [tipo,     setTipo]     = useState<'percentual'|'fixo'>('percentual')
  const [taxa,     setTaxa]     = useState('')

  useEffect(() => { if (empresaId) carregar(empresaId) }, [empresaId])

  async function carregar(eid: string) {
    setLoading(true)
    const supabase = createClient()

    // Carrega comissionados e vendas comissionadas em paralelo
    const [{ data: comissoesData }, vendasData] = await Promise.all([
      supabase.from('comissoes').select('*').eq('empresa_id', eid).order('criado_em', { ascending: false }),
      supabase.from('vendas')
        .select('id,numero,total,forma_pagamento,criado_em,comissionado_id,comissionado_nome,valor_comissao,comissao_paga,comissao_despesa_id')
        .eq('empresa_id', eid)
        .eq('status', 'concluida')
        .not('comissionado_id', 'is', null)
        .order('criado_em', { ascending: false })
        .limit(200),
    ])

    setLista(comissoesData || [])

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
                {ranking.map((r, i) => (
                  <div key={r.nome} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.35rem 0', borderBottom: '1px solid var(--borda-leve)' }}>
                    <span style={{ fontWeight: 900, fontSize: '0.9rem', width: '1.75rem', color: i === 0 ? 'var(--amarelo)' : 'var(--texto-desab)', flexShrink: 0 }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}°`}
                    </span>
                    <span style={{ flex: 1, fontWeight: 700, fontSize: '0.82rem' }}>{r.nome}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--texto-sec)' }}>{r.vendas} venda(s)</span>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 800, color: 'var(--verde)', fontFamily: 'monospace', fontSize: '0.82rem' }}>{formatCurrency(r.comissao)}</p>
                      {r.pendente > 0 && <p style={{ fontSize: '0.65rem', color: 'var(--amarelo)' }}>pend: {formatCurrency(r.pendente)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Sub-abas ─────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {([['cadastro', 'COMISSIONADOS'], ['por-venda', 'POR VENDA']] as const).map(([v, l]) => (
              <button key={v} onClick={() => setAba(v)}
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
                            <button onClick={() => marcarPago(v)}
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
        </>
      )}
    </div>
    </ProOnly>
  )
}
