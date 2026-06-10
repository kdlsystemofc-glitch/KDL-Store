'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { formatCurrency } from '@/lib/utils'
import { Loader2, Printer, History, ChevronDown, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { PageTabs } from '@/components/PageTabs'
import { AdminOnly } from '@/components/AdminOnly'
import { ProOnly } from '@/components/ProOnly'
import { toast } from 'react-hot-toast'

type Venda     = { total: number; forma_pagamento: string; criado_em: string }
type OsEntrada = { orcamento: number | null; valor_servico: number; valor_pecas: number; forma_pagamento: string | null; atualizado_em: string }
type Despesa   = { descricao: string; categoria: string | null; valor: number }
type FechManual = { descricao: string; tipo: string; valor: number; forma_pagamento: string | null }

type FechamentoHistorico = {
  id: string
  periodo: string
  tipo: string
  saldo_esperado: number
  saldo_fisico: number | null
  diferenca: number | null
  operador_nome: string | null
  criado_em: string
  total_entradas: number
  total_saidas: number
}

export default function FechamentoPage() {
  const { empresaId } = useEmpresaId()
  const [tipo,       setTipo]       = useState<'diario' | 'mensal'>('diario')
  const [loading,    setLoading]    = useState(true)
  const [vendas,     setVendas]     = useState<Venda[]>([])
  const [osEntradas, setOsEntradas] = useState<OsEntrada[]>([])
  const [despesas,   setDespesas]   = useState<Despesa[]>([])
  const [fechManuais, setFechManuais] = useState<FechManual[]>([])
  const [saldoFisico, setSaldoFisico] = useState('')
  const [fechado,    setFechado]    = useState(false)
  const [salvando,   setSalvando]   = useState(false)

  // Histórico
  const [abaAtiva, setAbaAtiva]   = useState<'atual' | 'historico'>('atual')
  const [historico, setHistorico] = useState<FechamentoHistorico[]>([])
  const [loadingHist, setLoadingHist] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => { if (empresaId) carregar(empresaId, tipo) }, [empresaId, tipo])

  async function carregar(eid: string, t: string) {
    setLoading(true)
    setFechado(false)
    const hoje      = new Date().toISOString().slice(0, 10)
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
    const fimMes    = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10)
    const desde = t === 'diario' ? hoje : inicioMes
    const ate   = t === 'diario' ? hoje : fimMes
    const supabase = createClient()
    const results = await Promise.allSettled([
      supabase.from('vendas').select('total,forma_pagamento,criado_em').eq('empresa_id', eid).eq('status', 'concluida').gte('criado_em', desde).lte('criado_em', ate + 'T23:59:59'),
      supabase.from('despesas').select('descricao,categoria,valor').eq('empresa_id', eid).gte('data', desde).lte('data', ate),
      supabase.from('ordens_servico').select('orcamento,valor_servico,valor_pecas,forma_pagamento,atualizado_em').eq('empresa_id', eid).eq('status', 'entregue').gte('atualizado_em', desde).lte('atualizado_em', ate + 'T23:59:59'),
      supabase.from('fechamentos_manuais').select('descricao,tipo,valor,forma_pagamento').eq('empresa_id', eid).gte('data', desde).lte('data', ate),
    ])
    const getRes = (i: number): any => results[i].status === 'fulfilled' ? (results[i] as PromiseFulfilledResult<any>).value || {} : {}
    const { data: v }  = getRes(0)
    const { data: d }  = getRes(1)
    const { data: os } = getRes(2)
    const { data: fm } = getRes(3)
    setVendas(v || [])
    setOsEntradas(os || [])
    setDespesas(d || [])
    setFechManuais(fm || [])
    setLoading(false)
  }

  async function carregarHistorico(eid: string) {
    setLoadingHist(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('fechamentos_caixa')
      .select('id,periodo,tipo,saldo_esperado,saldo_fisico,diferenca,operador_nome,criado_em,total_entradas,total_saidas')
      .eq('empresa_id', eid)
      .order('criado_em', { ascending: false })
      .limit(30)
    setHistorico(data || [])
    setLoadingHist(false)
  }

  async function confirmarFechamento() {
    if (!empresaId) return
    setSalvando(true)
    const saldoNum = parseFloat(saldoFisico.replace(',', '.')) || 0
    const dif      = saldoNum - saldoEsperado

    try {
      const supabase = createClient()
      const { data: profile } = await supabase.from('profiles').select('nome').single()
      const hoje      = new Date().toISOString().slice(0, 10)
      const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
      const periodo   = tipo === 'diario' ? hoje : inicioMes

      await supabase.from('fechamentos_caixa').insert({
        empresa_id:     empresaId,
        tipo,
        periodo,
        saldo_esperado: saldoEsperado,
        saldo_fisico:   saldoNum,
        diferenca:      dif,
        total_entradas: totalReceita,
        total_saidas:   totalDesp,
        operador_nome:  profile?.nome || null,
      })
      toast.success('Fechamento registrado com sucesso!')
      setFechado(true)
    } catch (err) {
      toast.error('Erro ao registrar fechamento.')
      console.error(err)
    } finally {
      setSalvando(false)
    }
  }

  const entradasManuais = fechManuais.filter(f => f.tipo === 'entrada').reduce((a, f) => a + f.valor, 0)
  const saidasManuais   = fechManuais.filter(f => f.tipo === 'saida').reduce((a, f) => a + f.valor, 0)
  const fiadoRecebimentos   = fechManuais.filter(f => f.tipo === 'entrada' && f.descricao.startsWith('Recebimento fiado'))
  const totalFiadoRecebido  = fiadoRecebimentos.reduce((a, f) => a + f.valor, 0)
  const vendasCaixa     = vendas.filter(v => v.forma_pagamento !== 'Fiado')
  const vendasFiado     = vendas.filter(v => v.forma_pagamento === 'Fiado')
  const totalFiadoEmitido   = vendasFiado.reduce((a, v) => a + v.total, 0)
  const totalReceita    = vendasCaixa.reduce((a, v) => a + v.total, 0) + osEntradas.reduce((a, o) => a + (o.orcamento ?? (o.valor_servico + o.valor_pecas)), 0) + entradasManuais
  const totalDesp       = despesas.reduce((a, d) => a + d.valor, 0) + saidasManuais
  const saldoEsperado   = totalReceita - totalDesp
  const saldoNum        = parseFloat(saldoFisico.replace(',', '.')) || 0
  const diferenca       = saldoNum - saldoEsperado

  const porForma: Record<string, number> = {}
  vendasCaixa.forEach(v => { porForma[v.forma_pagamento] = (porForma[v.forma_pagamento] || 0) + v.total })
  osEntradas.forEach(o => { const c = o.forma_pagamento || 'Serviço OS'; porForma[c] = (porForma[c] || 0) + (o.orcamento ?? (o.valor_servico + o.valor_pecas)) })
  fechManuais.filter(f => f.tipo === 'entrada').forEach(f => { const c = f.forma_pagamento || 'Dinheiro'; porForma[c] = (porForma[c] || 0) + f.valor })

  const labelPeriodo = tipo === 'diario'
    ? `Hoje — ${new Date().toLocaleDateString('pt-BR')}`
    : `${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`

  return (
    <AdminOnly fallbackRedirect="/financeiro">
      <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', maxWidth: '720px' }}>
        <div className="pg-header">
          <div>
            <h1 className="pg-titulo">🔒 Fechamento de Caixa</h1>
            <p className="pg-sub">{labelPeriodo}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => window.print()} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Printer size={14} /> Imprimir
            </button>
          </div>
        </div>

        <PageTabs tabs={[
          { label: 'Visão Geral (DRE)', href: '/financeiro' },
          { label: 'Despesas', href: '/financeiro/despesas' },
          { label: 'Fiados 📒', href: '/financeiro/fiado' },
          { label: 'Fechamento de Caixa', href: '/financeiro/fechamento' }
        ]} />

        <ProOnly>
          {/* Sub-abas: Atual / Histórico */}
          <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--borda)', marginBottom: '0.25rem' }}>
            {([
              { id: 'atual', label: '🔒 Fechar Caixa' },
              { id: 'historico', label: '📋 Histórico de Fechamentos' },
            ] as const).map(a => (
              <button
                key={a.id}
                onClick={() => {
                  setAbaAtiva(a.id)
                  if (a.id === 'historico' && empresaId) carregarHistorico(empresaId)
                }}
                style={{
                  padding: '0.5rem 0.875rem',
                  border: 'none',
                  background: 'transparent',
                  borderBottom: abaAtiva === a.id ? '2px solid var(--verde)' : '2px solid transparent',
                  color: abaAtiva === a.id ? 'var(--verde)' : 'var(--texto-desab)',
                  fontWeight: abaAtiva === a.id ? 800 : 500,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                }}
              >
                {a.label}
              </button>
            ))}
          </div>

          {/* ── ABA: Fechar Caixa ── */}
          {abaAtiva === 'atual' && (
            <>
              {/* Seletor de período */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(['diario', 'mensal'] as const).map(t => (
                  <button key={t} onClick={() => setTipo(t)} className={tipo === t ? 'btn btn-primary' : 'btn btn-secondary'}>
                    {t === 'diario' ? '📅 Diário' : '📆 Mensal'}
                  </button>
                ))}
              </div>

              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem', gap: '0.75rem', color: 'var(--texto-desab)' }}>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Carregando...
                </div>
              ) : fechado ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--verde)' }}>
                  <p style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</p>
                  <p style={{ fontWeight: 900, fontSize: '1.25rem' }}>Caixa fechado com sucesso!</p>
                  <p style={{ color: 'var(--texto-desab)', marginTop: '0.25rem' }}>Período: {labelPeriodo}</p>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
                    <button onClick={() => setFechado(false)} className="btn btn-secondary">← Novo Fechamento</button>
                    <button onClick={() => { setAbaAtiva('historico'); if (empresaId) carregarHistorico(empresaId) }} className="btn btn-secondary">
                      <History size={14} style={{ marginRight: '4px' }} /> Ver Histórico
                    </button>
                    <Link href="/dashboard" className="btn btn-primary">Ir ao Dashboard</Link>
                  </div>
                </div>
              ) : (
                <>
                  {/* Entradas */}
                  <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="sec-header"><span>💰 Entradas — {labelPeriodo}</span></div>
                    <div style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      {Object.entries(porForma).length === 0 && totalFiadoEmitido === 0 ? (
                        <p style={{ color: 'var(--texto-desab)', fontSize: '0.85rem' }}>Nenhuma venda no período</p>
                      ) : Object.entries(porForma).map(([forma, val]) => (
                        <div key={forma} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', borderBottom: '1px solid var(--borda-leve)' }}>
                          <span>{forma}</span>
                          <span style={{ fontWeight: 800, fontFamily: 'monospace', color: 'var(--verde)' }}>{formatCurrency(val)}</span>
                        </div>
                      ))}
                      {totalFiadoEmitido > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', borderBottom: '1px solid var(--borda-leve)', opacity: 0.65 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--texto-sec)' }}>
                            📒 Fiados Emitidos
                            <span style={{ fontSize: '0.65rem', background: 'var(--surface-alt)', border: '1px solid var(--borda)', padding: '0 4px', borderRadius: '3px', color: 'var(--texto-desab)' }}>não entra no caixa</span>
                          </span>
                          <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--texto-desab)', textDecoration: 'line-through' }}>{formatCurrency(totalFiadoEmitido)}</span>
                        </div>
                      )}
                      {fiadoRecebimentos.length > 0 && (
                        <div style={{ marginTop: '0.75rem', padding: '0.625rem', background: 'var(--surface-alt)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--borda)' }}>
                          <p style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.375rem', color: 'var(--texto-sec)' }}>📒 Detalhe de Fiados Recebidos:</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {fiadoRecebimentos.map((f, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', borderBottom: idx < fiadoRecebimentos.length - 1 ? '1px dashed var(--borda-leve)' : 'none', padding: '2px 0' }}>
                                <span>{f.descricao.replace('Recebimento fiado — ', '')} <span style={{ color: 'var(--texto-desab)', fontSize: '0.72rem' }}>({f.forma_pagamento || 'Dinheiro'})</span></span>
                                <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--verde)' }}>{formatCurrency(f.valor)}</span>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--borda)', marginTop: '0.375rem', paddingTop: '0.375rem', fontSize: '0.8rem', fontWeight: 700 }}>
                            <span>Subtotal Recebido</span>
                            <span style={{ fontFamily: 'monospace', color: 'var(--verde)' }}>{formatCurrency(totalFiadoRecebido)}</span>
                          </div>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderTop: '2px solid var(--borda)', marginTop: '0.25rem' }}>
                        <span style={{ fontWeight: 800 }}>Total Entradas</span>
                        <span style={{ fontWeight: 900, fontFamily: 'monospace', fontSize: '1.1rem', color: 'var(--verde)' }}>{formatCurrency(totalReceita)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Saídas */}
                  <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="sec-header"><span>💸 Saídas (Despesas)</span></div>
                    <div style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      {despesas.length === 0 && saidasManuais === 0 ? (
                        <p style={{ color: 'var(--texto-desab)', fontSize: '0.85rem' }}>Nenhuma despesa no período</p>
                      ) : (
                        <>
                          {despesas.map((d, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', borderBottom: '1px solid var(--borda-leve)' }}>
                              <span style={{ fontSize: '0.85rem' }}>{d.descricao}{d.categoria && <span style={{ color: 'var(--texto-desab)', fontSize: '0.75rem' }}> · {d.categoria}</span>}</span>
                              <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--vermelho)' }}>{formatCurrency(d.valor)}</span>
                            </div>
                          ))}
                          {fechManuais.filter(f => f.tipo === 'saida').map((f, i) => (
                            <div key={`sm-${i}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', borderBottom: '1px solid var(--borda-leve)' }}>
                              <span style={{ fontSize: '0.85rem' }}>{f.descricao} <span style={{ color: 'var(--texto-desab)', fontSize: '0.75rem' }}>· Ajuste Manual</span></span>
                              <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--vermelho)' }}>{formatCurrency(f.valor)}</span>
                            </div>
                          ))}
                        </>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderTop: '2px solid var(--borda)', marginTop: '0.25rem' }}>
                        <span style={{ fontWeight: 800 }}>Total Saídas</span>
                        <span style={{ fontWeight: 900, fontFamily: 'monospace', fontSize: '1.1rem', color: 'var(--vermelho)' }}>{formatCurrency(totalDesp)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Conferência */}
                  <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="sec-header"><span>🧮 Conferência do Caixa</span></div>
                    <div style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0' }}>
                        <span style={{ fontWeight: 600 }}>Saldo esperado</span>
                        <span style={{ fontWeight: 900, fontFamily: 'monospace', color: saldoEsperado >= 0 ? 'var(--verde)' : 'var(--vermelho)' }}>{formatCurrency(saldoEsperado)}</span>
                      </div>
                      <div>
                        <label className="campo-label">Saldo físico em caixa (R$)</label>
                        <div style={{ position: 'relative', marginTop: '0.375rem' }}>
                          <span style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--texto-desab)' }}>R$</span>
                          <input className="campo" type="number" step="0.01" min="0" style={{ paddingLeft: '2rem', fontFamily: 'monospace' }}
                            placeholder="0,00" value={saldoFisico} onChange={e => setSaldoFisico(e.target.value)} />
                        </div>
                      </div>
                      {saldoFisico && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem', background: Math.abs(diferenca) < 0.01 ? 'var(--verde-claro)' : diferenca > 0 ? '#dbeafe' : '#fee2e2', borderRadius: 'var(--radius-sm)' }}>
                          <span style={{ fontWeight: 700 }}>Diferença</span>
                          <span style={{ fontWeight: 900, fontFamily: 'monospace', color: Math.abs(diferenca) < 0.01 ? 'var(--verde)' : diferenca > 0 ? 'var(--azul)' : 'var(--vermelho)' }}>
                            {diferenca >= 0 ? '+' : ''}{formatCurrency(diferenca)}
                            {Math.abs(diferenca) < 0.01 ? ' ✓ Conferido' : diferenca > 0 ? ' ↑ Sobra' : ' ↓ Falta'}
                          </span>
                        </div>
                      )}
                      <button
                        onClick={confirmarFechamento}
                        disabled={salvando}
                        className="btn btn-primary"
                        style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                      >
                        {salvando ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</> : '🔒 Confirmar e Registrar Fechamento'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* ── ABA: Histórico ── */}
          {abaAtiva === 'historico' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="sec-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>📋 Histórico de Fechamentos</span>
                {empresaId && (
                  <button onClick={() => carregarHistorico(empresaId)} className="btn btn-secondary" style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem' }}>
                    Atualizar
                  </button>
                )}
              </div>
              {loadingHist ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem', gap: '0.5rem', color: 'var(--texto-desab)' }}>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Carregando histórico...
                </div>
              ) : historico.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--texto-desab)' }}>
                  <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</p>
                  <p style={{ fontSize: '0.82rem', fontWeight: 600 }}>Nenhum fechamento registrado ainda.</p>
                  <p style={{ fontSize: '0.72rem', marginTop: '0.25rem' }}>Realize o primeiro fechamento na aba "Fechar Caixa".</p>
                </div>
              ) : (
                <div>
                  {/* Cabeçalho da tabela */}
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 80px 110px 110px 100px 80px', gap: '0', padding: '0.375rem 0.75rem', background: 'var(--surface-alt)', borderBottom: '1px solid var(--borda)', fontSize: '0.62rem', fontWeight: 800, color: 'var(--texto-desab)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <span>DATA</span>
                    <span>TIPO</span>
                    <span style={{ textAlign: 'right' }}>ENTRADAS</span>
                    <span style={{ textAlign: 'right' }}>SAÍDAS</span>
                    <span style={{ textAlign: 'right' }}>DIFERENÇA</span>
                    <span style={{ textAlign: 'center' }}>OPERADOR</span>
                  </div>
                  {historico.map(h => {
                    const isExp = expandedId === h.id
                    const difColor = !h.diferenca || Math.abs(h.diferenca) < 0.01 ? 'var(--verde)' : h.diferenca > 0 ? '#60a5fa' : 'var(--vermelho)'
                    const difLabel = !h.diferenca || Math.abs(h.diferenca) < 0.01 ? '✓ OK' : h.diferenca > 0 ? `+${formatCurrency(h.diferenca)}` : formatCurrency(h.diferenca)
                    return (
                      <div key={h.id}>
                        <div
                          onClick={() => setExpandedId(isExp ? null : h.id)}
                          style={{ display: 'grid', gridTemplateColumns: '120px 80px 110px 110px 100px 80px', gap: '0', padding: '0.625rem 0.75rem', borderBottom: '1px solid var(--borda-leve)', cursor: 'pointer', transition: 'background 0.1s', alignItems: 'center' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-alt)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <span style={{ fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            {isExp ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            {new Date(h.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                          </span>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--texto-sec)' }}>
                            {h.tipo === 'diario' ? 'Diário' : 'Mensal'}
                          </span>
                          <span style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 700, color: 'var(--verde)' }}>{formatCurrency(h.total_entradas || 0)}</span>
                          <span style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 700, color: 'var(--vermelho)' }}>{formatCurrency(h.total_saidas || 0)}</span>
                          <span style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 800, color: difColor }}>{difLabel}</span>
                          <span style={{ textAlign: 'center', fontSize: '0.68rem', color: 'var(--texto-desab)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.operador_nome || '—'}</span>
                        </div>
                        {/* Detalhe expandido */}
                        {isExp && (
                          <div style={{ padding: '0.75rem 1.25rem', background: 'var(--surface-alt)', borderBottom: '1px solid var(--borda)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                            <div style={{ background: 'var(--surface)', padding: '0.625rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--borda)' }}>
                              <p style={{ fontSize: '0.62rem', color: 'var(--texto-desab)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Saldo Esperado</p>
                              <p style={{ fontWeight: 800, fontFamily: 'monospace', color: (h.saldo_esperado || 0) >= 0 ? 'var(--verde)' : 'var(--vermelho)' }}>{formatCurrency(h.saldo_esperado || 0)}</p>
                            </div>
                            <div style={{ background: 'var(--surface)', padding: '0.625rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--borda)' }}>
                              <p style={{ fontSize: '0.62rem', color: 'var(--texto-desab)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Saldo Físico</p>
                              <p style={{ fontWeight: 800, fontFamily: 'monospace' }}>{h.saldo_fisico != null ? formatCurrency(h.saldo_fisico) : '—'}</p>
                            </div>
                            <div style={{ background: 'var(--surface)', padding: '0.625rem', borderRadius: 'var(--radius-sm)', border: `1px solid ${difColor}` }}>
                              <p style={{ fontSize: '0.62rem', color: 'var(--texto-desab)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Diferença</p>
                              <p style={{ fontWeight: 800, fontFamily: 'monospace', color: difColor }}>{difLabel}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

        </ProOnly>
      </div>
    </AdminOnly>
  )
}
