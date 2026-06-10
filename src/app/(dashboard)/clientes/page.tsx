'use client'
import { toast } from 'react-hot-toast'
import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { Loader2, X } from 'lucide-react'
import { PageTabs } from '@/components/PageTabs'
import { FormCliente } from '@/components/FormCliente'
import { useSubscription } from '@/hooks/useSubscription'
import { Pagination } from '@/components/Pagination'
import { EmptyState } from '@/components/EmptyState'

type Cliente = {
  id: string; nome: string; telefone: string | null; tipo: string
  ultima_compra: string | null; ativo: boolean
  email: string | null; cpf: string | null; endereco: string | null; anotacoes: string | null; obs: string | null
}

type FiltroType = 'todos' | 'varejo' | 'atacado' | 'vip' | 'inativos'

const PAGE_SIZE = 50

export default function ClientesPage() {
  const { empresaId } = useEmpresaId()
  const { plano } = useSubscription()

  // data & pagination
  const [clientes,  setClientes]  = useState<Cliente[]>([])
  const [total,     setTotal]     = useState(0)
  const [page,      setPage]      = useState(1)

  // totals (from a separate lightweight query, always without filter)
  const [totalAtivos,   setTotalAtivos]   = useState(0)
  const [totalInativos, setTotalInativos] = useState(0)

  // ui state
  const [busca,     setBusca]     = useState('')
  const [filtro,    setFiltro]    = useState<FiltroType>('todos')
  const [loading,   setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)

  const totalPages = Math.ceil(total / PAGE_SIZE)

  // Fetch summary counts (active/inactive) — server-side COUNT, sem transferir dados
  const carregarContagens = useCallback(async (eid: string) => {
    const client = createClient()
    const [{ count: ativos }, { count: inativos }] = await Promise.all([
      client.from('clientes').select('*', { count: 'exact', head: true }).eq('empresa_id', eid).eq('ativo', true),
      client.from('clientes').select('*', { count: 'exact', head: true }).eq('empresa_id', eid).eq('ativo', false),
    ])
    setTotalAtivos(ativos ?? 0)
    setTotalInativos(inativos ?? 0)
  }, [])

  // Main fetch with server-side pagination + filters
  const carregar = useCallback(async (
    eid: string,
    pg: number,
    busca: string,
    filtro: FiltroType,
  ) => {
    setLoading(true)
    const from = (pg - 1) * PAGE_SIZE
    const to   = from + PAGE_SIZE - 1

    let q = createClient()
      .from('clientes')
      .select('id,nome,telefone,tipo,ultima_compra,ativo,email,cpf,endereco,anotacoes,obs', { count: 'exact' })
      .eq('empresa_id', eid)
      .order('nome')
      .range(from, to)

    // Server-side search
    const buscaTrimmed = busca.trim()
    if (buscaTrimmed) {
      q = q.or(
        `nome.ilike.%${buscaTrimmed}%,telefone.ilike.%${buscaTrimmed}%,email.ilike.%${buscaTrimmed}%`
      )
    }

    // Server-side filter
    if (filtro === 'inativos') {
      q = q.eq('ativo', false)
    } else if (filtro !== 'todos') {
      q = q.eq('tipo', filtro).eq('ativo', true)
    }

    const { data, count, error } = await q

    if (!error) {
      setClientes(data || [])
      setTotal(count ?? 0)
    }
    setLoading(false)
  }, [])

  // Initial load
  useEffect(() => {
    if (!empresaId) return
    carregarContagens(empresaId)
    carregar(empresaId, 1, busca, filtro)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId])

  // Re-fetch when page changes
  useEffect(() => {
    if (!empresaId) return
    carregar(empresaId, page, busca, filtro)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  function aplicarFiltro(novoFiltro: FiltroType) {
    setFiltro(novoFiltro)
    setPage(1)
    if (empresaId) carregar(empresaId, 1, busca, novoFiltro)
  }

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function aplicarBusca(novaBusca: string) {
    setBusca(novaBusca)
    setPage(1)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (empresaId) carregar(empresaId, 1, novaBusca, filtro)
    }, 300)
  }

  function handlePage(p: number) {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleNovoClienteSuccess() {
    toast.success('✅ Cliente cadastrado com sucesso!')
    setShowModal(false)
    if (empresaId) {
      carregarContagens(empresaId)
      carregar(empresaId, page, busca, filtro)
    }
  }

  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">CLIENTES E FORNECEDORES</h1>
          <p className="pg-sub">{totalAtivos} ATIVOS · {totalInativos} SUMIDOS</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          + NOVO CLIENTE
        </button>
      </div>

      {/* Modal novo cliente */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div className="anim-pop" style={{ width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--surface)', border: '1px solid var(--borda-forte)', borderRadius: '2px' }}>
            <div style={{ padding: '0.75rem 1rem', borderBottom: '2px solid var(--verde)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--fundo-painel)', zIndex: 10 }}>
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--verde)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>CADASTRAR NOVO CLIENTE</p>
                <p style={{ fontSize: '0.65rem', color: 'var(--texto-desab)' }}>Preencha os dados do cliente</p>
              </div>
              <button onClick={() => setShowModal(false)} className="btn-icon"><X size={16} /></button>
            </div>
            <div style={{ padding: '1rem' }}>
              <FormCliente
                onSuccess={handleNovoClienteSuccess}
                onCancel={() => setShowModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      <PageTabs tabs={[
        { label: 'Todos os Clientes', href: '/clientes' },
        { label: plano === 'pro' ? 'Sumidos ⚠' : 'Sumidos 🔒', href: '/clientes/inativos' },
        { label: 'Fornecedores', href: '/fornecedores' },
      ]} />

      {/* Filtros + Busca */}
      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {([
          { v: 'todos',    l: 'TODOS' },
          { v: 'varejo',   l: 'VAREJO' },
          { v: 'atacado',  l: 'ATACADO' },
          { v: 'vip',      l: '★ VIP' },
          { v: 'inativos', l: plano === 'pro' ? '⚠ SUMIDOS' : '⚠ SUMIDOS 🔒' },
        ] as const).map(f => (
          <button
            key={f.v}
            onClick={() => {
              if (f.v === 'inativos' && plano !== 'pro') {
                toast.error('⚠️ O filtro de clientes sumidos é exclusivo do plano PRO!')
                return
              }
              aplicarFiltro(f.v)
            }}
            className={filtro === f.v ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ fontSize: '0.65rem', padding: '0.3rem 0.625rem' }}
          >
            {f.l}
          </button>
        ))}
        <input
          className="campo"
          placeholder="BUSCAR: NOME, TELEFONE, E-MAIL..."
          style={{ flex: 1, maxWidth: '320px' }}
          value={busca}
          onChange={e => aplicarBusca(e.target.value)}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <Loader2 size={28} style={{ color: 'var(--verde)', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--verde)', fontSize: '0.75rem', letterSpacing: '0.08em' }}>CARREGANDO CLIENTES<span className="blink">_</span></p>
        </div>
      ) : clientes.length === 0 ? (
        busca || filtro !== 'todos' ? (
          <EmptyState
            icon="🔍"
            title="Nenhum cliente encontrado"
            description={`Nenhum resultado para "${busca || filtro}". Tente outros termos ou remova os filtros.`}
            actionLabel="LIMPAR FILTROS"
            onAction={() => { aplicarBusca(''); aplicarFiltro('todos') }}
          />
        ) : (
          <EmptyState
            icon="👥"
            title="Cadastro vazio"
            description="Cadastre seu primeiro cliente para começar a gerenciar seus relacionamentos."
            actionLabel="+ CADASTRAR CLIENTE"
            onAction={() => setShowModal(true)}
          />
        )
      ) : (
        <>
          <div className="tabela-wrap">
            <table className="tabela">
              <thead>
                <tr>
                  <th>NOME</th><th>TELEFONE/WA</th><th>TIPO</th>
                  <th>ÚLT. COMPRA</th><th style={{ textAlign: 'center' }}>STATUS</th>
                  <th style={{ textAlign: 'center' }}>AÇÃO</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 700 }}>{c.nome}</td>
                    <td>
                      {c.telefone
                        ? (
                          <a
                            href={`https://wa.me/55${c.telefone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                            style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem' }}
                          >
                            WA {c.telefone}
                          </a>
                        )
                        : <span style={{ color: 'var(--texto-desab)' }}>—</span>
                      }
                    </td>
                    <td>
                      <span
                        className={c.tipo === 'vip' ? 'status-alerta' : c.tipo === 'atacado' ? 'status-aviso' : 'status-neutro'}
                        style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em' }}
                      >
                        {c.tipo === 'vip' ? '★ VIP' : c.tipo === 'atacado' ? 'ATACADO' : 'VAREJO'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--texto-desab)', fontVariantNumeric: 'tabular-nums' }}>
                      {c.ultima_compra ? new Date(c.ultima_compra).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={c.ativo ? 'status-ok' : 'status-neutro'} style={{ fontSize: '0.7rem' }}>
                        {c.ativo ? '● ATIVO' : '○ SUMIDO'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Link href={`/clientes/${c.id}`} className="btn btn-secondary" style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem' }}>
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
