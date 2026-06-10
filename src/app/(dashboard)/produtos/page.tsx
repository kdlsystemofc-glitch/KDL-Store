'use client'
import { toast } from 'react-hot-toast'
import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { formatCurrency } from '@/lib/utils'
import { X } from 'lucide-react'
import { PageTabs } from '@/components/PageTabs'
import { FormProduto } from '@/components/FormProduto'
import { Pagination } from '@/components/Pagination'
import { EmptyState } from '@/components/EmptyState'

type Produto = {
  id: string; nome: string; sku: string | null; categoria: string | null
  preco_varejo: number; preco_custo: number; qtd_atual: number; qtd_minima: number; ativo: boolean; imagem_url: string | null
  ativo_catalogo: boolean | null; destaque: boolean | null
}

type KpiProduto = { qtd_atual: number; qtd_minima: number; preco_custo: number }

const PAGE_SIZE = 50

export default function ProdutosPage() {
  const { empresaId } = useEmpresaId()
  // Paginated table data
  const [produtos,   setProdutos]   = useState<Produto[]>([])
  const [total,      setTotal]      = useState(0)
  const [page,       setPage]       = useState(1)
  // KPI data (lightweight — só 3 colunas, todos os produtos)
  const [kpis,       setKpis]       = useState<KpiProduto[]>([])
  const [busca,      setBusca]      = useState('')
  const [loading,    setLoading]    = useState(true)
  const [erro,       setErro]       = useState<string | null>(null)
  const [showModal,  setShowModal]  = useState(false)
  const [toggling,   setToggling]   = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Carrega KPIs (lightweight: 3 colunas de todos os produtos para totais e alertas)
  const carregarKpis = useCallback(async (eid: string) => {
    const { data } = await createClient()
      .from('produtos')
      .select('qtd_atual,qtd_minima,preco_custo')
      .eq('empresa_id', eid)
    setKpis(data || [])
  }, [])

  // Carrega página paginada com busca server-side
  const carregar = useCallback(async (eid: string, pg: number, buscaTxt: string) => {
    setLoading(true)
    setErro(null)
    const from = (pg - 1) * PAGE_SIZE
    const to   = from + PAGE_SIZE - 1
    let q = createClient()
      .from('produtos')
      .select('id,nome,sku,categoria,preco_varejo,preco_custo,qtd_atual,qtd_minima,ativo,imagem_url,ativo_catalogo,destaque', { count: 'exact' })
      .eq('empresa_id', eid)
      .order('nome')
      .range(from, to)
    if (buscaTxt.trim()) {
      q = q.or(`nome.ilike.%${buscaTxt.trim()}%,sku.ilike.%${buscaTxt.trim()}%,categoria.ilike.%${buscaTxt.trim()}%`)
    }
    const { data, count, error } = await q
    if (error) { setErro('Erro ao carregar produtos.'); setLoading(false); return }
    setProdutos(data || [])
    setTotal(count ?? 0)
    setLoading(false)
  }, [])

  useEffect(() => { if (empresaId) { carregarKpis(empresaId); carregar(empresaId, 1, '') } }, [empresaId, carregarKpis, carregar])

  function aplicarBusca(novaBusca: string) {
    setBusca(novaBusca)
    setPage(1)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (empresaId) carregar(empresaId, 1, novaBusca)
    }, 300)
  }

  function handlePage(p: number) {
    setPage(p)
    if (empresaId) carregar(empresaId, p, busca)
  }

  async function toggleCampo(id: string, campo: 'ativo_catalogo' | 'destaque', valorAtual: boolean | null) {
    const novoValor = !valorAtual
    setToggling(id + campo)
    const { error } = await createClient().from('produtos').update({ [campo]: novoValor }).eq('id', id)
    if (error) {
      toast.error('Erro ao atualizar: ' + error.message)
    } else {
      setProdutos(prev => prev.map(p => p.id === id ? { ...p, [campo]: novoValor } : p))
      setKpis(prev => prev.map(p => p)) // KPIs não mudam com toggle de catálogo
      const label = campo === 'ativo_catalogo' ? 'Catálogo' : 'Destaque'
      toast.success(`${label} ${novoValor ? 'ativado' : 'desativado'} com sucesso!`)
    }
    setToggling(null)
  }

  const totalPages  = Math.ceil(total / PAGE_SIZE)
  const criticos    = kpis.filter(p => p.qtd_atual <= p.qtd_minima && p.qtd_minima > 0)
  const totalItens  = kpis.reduce((a, p) => a + p.qtd_atual, 0)
  const valorEstoque = kpis.reduce((a, p) => a + p.qtd_atual * p.preco_custo, 0)
  const totalCadastros = kpis.length

  return (
    <div className="anim-fade" style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>

      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">PRODUTOS &amp; ESTOQUE</h1>
          <p className="pg-sub">{totalCadastros} CADASTROS · {totalItens} ITENS EM ESTOQUE</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          + NOVO PRODUTO
        </button>
      </div>

      {showModal && (
        <div style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
          onClick={e=>{if(e.target===e.currentTarget)setShowModal(false)}}>
          <div className="anim-pop" style={{ width:'100%', maxWidth:'800px', maxHeight:'90vh', overflowY:'auto', background:'var(--surface)', border:'1px solid var(--borda-forte)', borderRadius:'2px' }}>
            <div style={{ padding:'0.75rem 1rem', borderBottom:'2px solid var(--verde)', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:'var(--fundo-painel)', zIndex:10 }}>
              <div>
                <p style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--verde)', textTransform:'uppercase', letterSpacing:'0.06em' }}>CADASTRAR NOVO PRODUTO</p>
                <p style={{ fontSize:'0.65rem', color:'var(--texto-desab)' }}>Preencha os dados do item</p>
              </div>
              <button onClick={()=>setShowModal(false)} className="btn-icon"><X size={16}/></button>
            </div>
            <div style={{ padding:'1rem' }}>
              <FormProduto onSuccess={() => { toast.success('Salvo com sucesso!'); setShowModal(false); if (empresaId) carregar(empresaId, 1, ''); }} onCancel={() => setShowModal(false)} />
            </div>
          </div>
        </div>
      )}

      <PageTabs tabs={[
        { label: 'Produtos', href: '/produtos' },
        { label: 'Estoque e Movimentações', href: '/estoque' },
        { label: 'Catálogo Online', href: '/catalogo' }
      ]} />

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.5rem' }}>
        {[{
          label:'TOTAL PRODUTOS', valor: String(totalCadastros), suf:'cadastros', dot:'var(--verde)', cor:'var(--verde)' },
          { label:'VALOR ESTOQUE',  valor: formatCurrency(valorEstoque), suf:'preço de custo', dot:'var(--azul)', cor:'var(--texto-mono)' },
          { label:'ESTQ. CRÍTICO',  valor: String(criticos.length), suf:'abaixo do mínimo', dot: criticos.length > 0 ? 'var(--vermelho)' : 'var(--verde)', cor: criticos.length > 0 ? 'var(--vermelho)' : 'var(--verde)' },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div style={{ display:'flex', alignItems:'center', gap:'0.35rem' }}>
              <span style={{ color:k.dot, fontSize:'0.55rem' }}>●</span>
              <p className="kpi-label">{k.label}</p>
            </div>
            <p className="kpi-valor" style={{ color:k.cor, fontSize:'1.25rem' }}>{k.valor}</p>
            <p className="kpi-sub">{k.suf}</p>
          </div>
        ))}
      </div>

      {/* Alerta críticos */}
      {criticos.length > 0 && (
        <div className="alerta alerta-perigo">
          ⚠ <strong>{criticos.length} produto(s)</strong> abaixo do estoque mínimo
        </div>
      )}

      {/* Busca */}
      <div style={{ maxWidth:'360px' }}>
        <input className="campo" placeholder="BUSCAR POR NOME, SKU OU CATEGORIA_"
          value={busca} onChange={e => aplicarBusca(e.target.value)} />
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'3rem', flexDirection:'column', gap:'0.5rem' }}>
          <p style={{ color:'var(--verde)', fontSize:'0.75rem', letterSpacing:'0.08em' }}>CARREGANDO PRODUTOS<span className="blink">_</span></p>
        </div>
      ) : erro ? (
        <div className="alerta alerta-perigo">{erro}</div>
      ) : total === 0 ? (
        busca ? (
          <EmptyState
            icon="🔍"
            title="Nenhum produto encontrado"
            description="Tente ajustar os filtros ou a busca."
          />
        ) : (
          <EmptyState
            icon="📦"
            title="Nenhum produto cadastrado"
            description="Cadastre seu primeiro produto para começar a controlar seu estoque."
            actionLabel="+ Cadastrar Produto"
            onAction={() => setShowModal(true)}
          />
        )
      ) : (
        <>
          <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>PRODUTO</th><th>SKU</th><th>CATEGORIA</th>
                <th style={{ textAlign:'right' }}>CUSTO</th>
                <th style={{ textAlign:'right' }}>VENDA</th>
                <th style={{ textAlign:'center' }}>ESTQ.</th>
                <th style={{ textAlign:'center' }}>STATUS</th>
                <th style={{ textAlign:'center' }}>CATÁLOGO</th>
                <th style={{ textAlign:'center' }}>DESTAQUE</th>
                <th style={{ textAlign:'center' }}>AÇÃO</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map(p => {
                const critico = p.qtd_atual <= p.qtd_minima && p.qtd_minima > 0
                const isTogglingCatalogo = toggling === p.id + 'ativo_catalogo'
                const isTogglingDestaque = toggling === p.id + 'destaque'
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight:700, maxWidth:'240px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                        <div style={{ width:'40px', height:'40px', flexShrink:0, background:'var(--surface-alt)', border:'1px solid var(--borda)', borderRadius:'4px', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {p.imagem_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.imagem_url} alt={p.nome} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                          ) : (
                            <span style={{ fontSize:'1.25rem', opacity:0.3 }}>📦</span>
                          )}
                        </div>
                        <span style={{ overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{p.nome}</span>
                      </div>
                    </td>
                    <td style={{ color:'var(--texto-mono)', fontSize:'0.75rem', letterSpacing:'0.04em' }}>{p.sku || '—'}</td>
                    <td style={{ fontSize:'0.75rem', color:'var(--texto-sec)' }}>{p.categoria || '—'}</td>
                    <td style={{ textAlign:'right', fontSize:'0.78rem', color:'var(--texto-sec)', fontVariantNumeric:'tabular-nums' }}>{formatCurrency(p.preco_custo)}</td>
                    <td style={{ textAlign:'right', fontWeight:700, color:'var(--verde)', fontVariantNumeric:'tabular-nums' }}>{formatCurrency(p.preco_varejo)}</td>
                    <td style={{ textAlign:'center' }}>
                      <span style={{ fontWeight:700, color: critico ? 'var(--vermelho)' : 'var(--texto)', fontVariantNumeric:'tabular-nums' }}>{p.qtd_atual}</span>
                      {critico && <span style={{ fontSize:'0.62rem', color:'var(--vermelho)', display:'block', letterSpacing:'0.04em' }}>⚠ MÍNIMO</span>}
                    </td>
                    <td style={{ textAlign:'center' }}>
                      <span className={p.ativo ? 'status-ok' : 'status-neutro'} style={{ fontSize:'0.72rem' }}>
                        {p.ativo ? '● ATIVO' : '○ INATIVO'}
                      </span>
                    </td>
                    {/* Toggle Catálogo */}
                    <td style={{ textAlign:'center' }}>
                      <button
                        onClick={() => toggleCampo(p.id, 'ativo_catalogo', p.ativo_catalogo)}
                        disabled={isTogglingCatalogo}
                        title={p.ativo_catalogo ? 'Remover do catálogo' : 'Publicar no catálogo'}
                        style={{
                          background: p.ativo_catalogo ? 'rgba(0,191,165,0.15)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${p.ativo_catalogo ? 'var(--verde)' : 'var(--borda)'}`,
                          color: p.ativo_catalogo ? 'var(--verde)' : 'var(--texto-desab)',
                          borderRadius: '999px', padding: '0.15rem 0.5rem',
                          fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
                          transition: 'all 0.15s', letterSpacing: '0.04em',
                          opacity: isTogglingCatalogo ? 0.5 : 1,
                        }}
                      >
                        {isTogglingCatalogo ? '...' : p.ativo_catalogo ? '● ON' : '○ OFF'}
                      </button>
                    </td>
                    {/* Toggle Destaque */}
                    <td style={{ textAlign:'center' }}>
                      <button
                        onClick={() => toggleCampo(p.id, 'destaque', p.destaque)}
                        disabled={isTogglingDestaque}
                        title={p.destaque ? 'Remover destaque' : 'Marcar como destaque'}
                        style={{
                          background: p.destaque ? 'rgba(255,170,0,0.15)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${p.destaque ? 'var(--amarelo)' : 'var(--borda)'}`,
                          color: p.destaque ? 'var(--amarelo)' : 'var(--texto-desab)',
                          borderRadius: '999px', padding: '0.15rem 0.5rem',
                          fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
                          transition: 'all 0.15s', letterSpacing: '0.04em',
                          opacity: isTogglingDestaque ? 0.5 : 1,
                        }}
                      >
                        {isTogglingDestaque ? '...' : p.destaque ? '★ SIM' : '☆ NÃO'}
                      </button>
                    </td>
                    <td style={{ textAlign:'center' }}>
                      <Link href={`/produtos/${p.id}/editar`} className="btn btn-secondary" style={{ fontSize:'0.65rem', padding:'0.2rem 0.5rem' }}>
                        EDITAR
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} onPage={handlePage} />
      </>
      )}
      {/* Modal novo produto (inline, sem navegação) */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
          onClick={e=>{if(e.target===e.currentTarget)setShowModal(false)}}>
          <div className="anim-pop" style={{ width:'100%', maxWidth:'800px', maxHeight:'90vh', overflowY:'auto', background:'var(--surface)', border:'1px solid var(--borda-forte)', borderRadius:'2px' }}>
            <div style={{ padding:'0.75rem 1rem', borderBottom:'2px solid var(--verde)', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:'var(--fundo-painel)', zIndex:10 }}>
              <div>
                <p style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--verde)', textTransform:'uppercase', letterSpacing:'0.06em' }}>CADASTRAR NOVO PRODUTO</p>
                <p style={{ fontSize:'0.65rem', color:'var(--texto-desab)' }}>Preencha os dados do item</p>
              </div>
              <button onClick={()=>setShowModal(false)} className="btn-icon" aria-label="Fechar modal"><X size={16}/></button>
            </div>
            <div style={{ padding:'1rem' }}>
              <FormProduto onSuccess={() => { toast.success('Salvo com sucesso!'); setShowModal(false); if (empresaId) { carregarKpis(empresaId); carregar(empresaId, page, busca) } }} onCancel={() => setShowModal(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
