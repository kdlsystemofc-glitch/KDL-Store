'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { formatCurrency } from '@/lib/utils'
import { Search, Loader2 } from 'lucide-react'
import { OperadorOnly } from '@/components/OperadorOnly'
import { Pagination } from '@/components/Pagination'
import { EmptyState } from '@/components/EmptyState'

type Venda = {
  id: string; numero: number; cliente_nome: string | null
  forma_pagamento: string; total: number; status: string
  criado_em: string; registrado_nome: string | null
}

type KPIHoje = {
  count: number
  faturamento: number
}

const PAGE_SIZE = 50
const FORMAS: Record<string, string> = {
  PIX: 'PIX', Dinheiro: 'DINHEIRO', 'Crédito': 'CREDITO', 'Débito': 'DEBITO', Fiado: 'FIADO',
}

export default function VendasPage() {
  const { empresaId } = useEmpresaId()

  // pagination & data
  const [vendas,      setVendas]      = useState<Venda[]>([])
  const [total,       setTotal]       = useState(0)
  const [page,        setPage]        = useState(1)

  // filters
  const [busca,       setBusca]       = useState('')
  const [filtro,      setFiltro]      = useState('todos')

  // kpis (fetched separately, no filters)
  const [kpiHoje,     setKpiHoje]     = useState<KPIHoje>({ count: 0, faturamento: 0 })
  const [totalPeriodo,setTotalPeriodo]= useState(0)
  const [canceladas,  setCanceladas]  = useState(0)

  const [loading,     setLoading]     = useState(true)

  const totalPages = Math.ceil(total / PAGE_SIZE)

  // Fetch KPIs for today (no filter dependency)
  const carregarKpis = useCallback(async (eid: string) => {
    const hoje = new Date().toISOString().slice(0, 10)
    const { data } = await createClient()
      .from('vendas')
      .select('total,status,criado_em')
      .eq('empresa_id', eid)
      .eq('status', 'concluida')
    if (!data) return
    const vendasHoje = data.filter(v => v.criado_em.startsWith(hoje))
    setKpiHoje({
      count: vendasHoje.length,
      faturamento: vendasHoje.reduce((a, v) => a + v.total, 0),
    })
  }, [])

  // Main fetch with server-side pagination + filters
  const carregar = useCallback(async (eid: string, pg: number, busca: string, filtro: string) => {
    setLoading(true)
    const from = (pg - 1) * PAGE_SIZE
    const to   = from + PAGE_SIZE - 1

    let q = createClient()
      .from('vendas')
      .select('id,numero,cliente_nome,forma_pagamento,total,status,criado_em,registrado_nome', { count: 'exact' })
      .eq('empresa_id', eid)
      .order('criado_em', { ascending: false })
      .range(from, to)

    // Server-side search
    if (busca.trim()) {
      const num = parseInt(busca.trim(), 10)
      if (!isNaN(num)) {
        q = q.or(`cliente_nome.ilike.%${busca.trim()}%,numero.eq.${num}`)
      } else {
        q = q.ilike('cliente_nome', `%${busca.trim()}%`)
      }
    }

    // Server-side filter by forma_pagamento
    if (filtro !== 'todos') {
      q = q.eq('forma_pagamento', filtro)
    }

    const { data, count, error } = await q

    if (!error) {
      setVendas(data || [])
      const c = count ?? 0
      setTotal(c)
      // compute period totals from current page (approximate; KPIs always from separate query)
      const concluidas = (data || []).filter(v => v.status === 'concluida')
      setTotalPeriodo(concluidas.reduce((a, v) => a + v.total, 0))
      setCanceladas((data || []).filter(v => v.status === 'cancelada').length)
    }
    setLoading(false)
  }, [])

  // On empresaId ready: load KPIs + first page
  useEffect(() => {
    if (!empresaId) return
    carregarKpis(empresaId)
    carregar(empresaId, 1, busca, filtro)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId])

  // Re-fetch when page changes (preserving current filters)
  useEffect(() => {
    if (!empresaId) return
    carregar(empresaId, page, busca, filtro)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  // When filter or search changes: reset to page 1 and re-fetch
  function aplicarFiltro(novoFiltro: string) {
    setFiltro(novoFiltro)
    setPage(1)
    if (empresaId) carregar(empresaId, 1, busca, novoFiltro)
  }

  function aplicarBusca(novaBusca: string) {
    setBusca(novaBusca)
    setPage(1)
    if (empresaId) carregar(empresaId, 1, novaBusca, filtro)
  }

  function handlePage(p: number) {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">HISTÓRICO DE VENDAS</h1>
          <p className="pg-sub">HOJE: {kpiHoje.count} VENDAS · {formatCurrency(kpiHoje.faturamento)}</p>
        </div>
        <OperadorOnly>
          <Link href="/vendas/nova" className="btn btn-primary">▶ NOVA VENDA</Link>
        </OperadorOnly>
      </div>

      {/* KPIs rápidos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.5rem' }}>
        {[
          { l: 'FATURAMENTO HOJE', v: formatCurrency(kpiHoje.faturamento), dot: 'var(--verde)',    c: 'var(--verde)' },
          { l: 'VENDAS HOJE',      v: String(kpiHoje.count),               dot: 'var(--verde)',    c: 'var(--verde)' },
          { l: 'TOTAL PERÍODO',   v: formatCurrency(totalPeriodo),        dot: 'var(--azul)',     c: 'var(--texto-mono)' },
          { l: 'REGISTROS',        v: `${total} (${canceladas} canc.)`,   dot: 'var(--texto-sec)', c: 'var(--texto-sec)' },
        ].map(k => (
          <div key={k.l} className="kpi-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ color: k.dot, fontSize: '0.55rem' }}>●</span>
              <p className="kpi-label">{k.l}</p>
            </div>
            <p className="kpi-valor" style={{ color: k.c, fontSize: '1.1rem' }}>{k.v}</p>
          </div>
        ))}
      </div>

      {/* Filtros + Busca */}
      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {['todos', 'PIX', 'Dinheiro', 'Crédito', 'Débito', 'Fiado'].map(f => (
          <button key={f} onClick={() => aplicarFiltro(f)}
            className={filtro === f ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ fontSize: '0.65rem', padding: '0.3rem 0.625rem' }}>
            {f === 'todos' ? 'TODOS' : (FORMAS[f] || f)}
          </button>
        ))}
        <div style={{ position: 'relative', flex: 1, maxWidth: '260px' }}>
          <Search size={13} style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--texto-desab)', pointerEvents: 'none' }} />
          <input
            className="campo"
            placeholder="BUSCAR POR Nº OU CLIENTE_"
            style={{ width: '100%', paddingLeft: '1.75rem' }}
            value={busca}
            onChange={e => aplicarBusca(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <Loader2 size={28} style={{ color: 'var(--verde)', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--verde)', fontSize: '0.75rem', letterSpacing: '0.08em' }}>CARREGANDO VENDAS<span className="blink">_</span></p>
        </div>
      ) : vendas.length === 0 ? (
        busca || filtro !== 'todos' ? (
          <EmptyState
            icon="🔍"
            title="Nenhuma venda encontrada"
            description={`Nenhum resultado para "${busca || filtro}". Tente outros termos ou remova os filtros.`}
            actionLabel="LIMPAR FILTROS"
            onAction={() => { aplicarBusca(''); aplicarFiltro('todos') }}
          />
        ) : (
          <EmptyState
            icon="🧾"
            title="Nenhuma venda registrada"
            description="Registre sua primeira venda para começar a acompanhar seu faturamento."
            actionLabel="▶ REGISTRAR VENDA"
            onAction={() => window.location.assign('/vendas/nova')}
          />
        )
      ) : (
        <>
          <div className="tabela-wrap">
            <table className="tabela">
              <thead>
                <tr>
                  <th>#</th><th>CLIENTE</th><th>PAGAMENTO</th>
                  <th style={{ textAlign: 'right' }}>TOTAL</th>
                  <th>DATA/HORA</th><th>OPERADOR</th>
                  <th style={{ textAlign: 'center' }}>STATUS</th>
                  <th style={{ textAlign: 'center' }}>REC.</th>
                </tr>
              </thead>
              <tbody>
                {vendas.map(v => (
                  <tr key={v.id}>
                    <td style={{ color: 'var(--texto-mono)', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.04em' }}>
                      #{String(v.numero).padStart(4, '0')}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {v.cliente_nome || <span style={{ color: 'var(--texto-desab)' }}>ANÔNIMO</span>}
                    </td>
                    <td style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {FORMAS[v.forma_pagamento] || v.forma_pagamento}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--verde)', fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(v.total)}
                    </td>
                    <td style={{ fontSize: '0.72rem', color: 'var(--texto-desab)', fontVariantNumeric: 'tabular-nums' }}>
                      {new Date(v.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ fontSize: '0.72rem', color: 'var(--texto-sec)' }}>{v.registrado_nome || '—'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={v.status === 'concluida' ? 'status-ok' : 'status-neutro'} style={{ fontSize: '0.7rem' }}>
                        {v.status === 'concluida' ? '● OK' : '○ CANC.'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Link href={`/vendas/${v.id}`} className="btn btn-secondary" style={{ fontSize: '0.62rem', padding: '0.15rem 0.4rem' }}>
                        VER
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={PAGE_SIZE}
            onPage={handlePage}
            loading={loading}
          />
        </>
      )}
    </div>
  )
}
