'use client'
import { toast } from 'react-hot-toast'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { formatCurrency } from '@/lib/utils'
import { Plus, Search, AlertTriangle, Loader2, X } from 'lucide-react'
import { PageTabs } from '@/components/PageTabs'
import { FormProduto } from '@/components/FormProduto'

type Produto = {
  id: string; nome: string; sku: string | null; categoria: string | null
  preco_varejo: number; preco_custo: number; qtd_atual: number; qtd_minima: number; ativo: boolean; imagem_url: string | null
}

export default function ProdutosPage() {
  const { empresaId } = useEmpresaId()
  const [produtos,   setProdutos]   = useState<Produto[]>([])
  const [busca,      setBusca]      = useState('')
  const [loading,    setLoading]    = useState(true)
  const [erro,       setErro]       = useState<string | null>(null)
  const [showModal,  setShowModal]  = useState(false)

  useEffect(() => { if (empresaId) carregar(empresaId) }, [empresaId])

  async function carregar(eid: string) {
    setLoading(true)
    setErro(null)
    const { data, error } = await createClient()
      .from('produtos')
      .select('id,nome,sku,categoria,preco_varejo,preco_custo,qtd_atual,qtd_minima,ativo,imagem_url')
      .eq('empresa_id', eid)
      .order('nome')
    if (error) { setErro('Erro ao carregar produtos.'); setLoading(false); return }
    setProdutos(data || [])
    setLoading(false)
  }

  const filtrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(busca.toLowerCase()) ||
    (p.categoria || '').toLowerCase().includes(busca.toLowerCase())
  )

  const criticos   = produtos.filter(p => p.qtd_atual <= p.qtd_minima && p.qtd_minima > 0)
  const totalItens = produtos.reduce((a, p) => a + p.qtd_atual, 0)
  const valorEstoque = produtos.reduce((a, p) => a + p.qtd_atual * p.preco_custo, 0)

  return (
    <div className="anim-fade" style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>

      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">PRODUTOS &amp; ESTOQUE</h1>
          <p className="pg-sub">{produtos.length} CADASTROS · {totalItens} ITENS EM ESTOQUE</p>
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
              <FormProduto onSuccess={() => { toast.success('Salvo com sucesso!'); setShowModal(false); if (empresaId) carregar(empresaId); }} onCancel={() => setShowModal(false)} />
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
        {[
          { label:'TOTAL PRODUTOS', valor: String(produtos.length), suf:'cadastros', dot:'var(--verde)', cor:'var(--verde)' },
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
          ⚠ <strong>{criticos.length} produto(s)</strong> abaixo do estoque mínimo: {criticos.map(p=>p.nome).join(', ')}
        </div>
      )}

      {/* Busca */}
      <div style={{ maxWidth:'360px' }}>
        <input className="campo" placeholder="BUSCAR POR NOME, SKU OU CATEGORIA_"
          value={busca} onChange={e => setBusca(e.target.value)} />
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'3rem', flexDirection:'column', gap:'0.5rem' }}>
          <p style={{ color:'var(--verde)', fontSize:'0.75rem', letterSpacing:'0.08em' }}>CARREGANDO PRODUTOS<span className="blink">_</span></p>
        </div>
      ) : erro ? (
        <div className="alerta alerta-perigo">{erro}</div>
      ) : filtrados.length === 0 ? (
        <div style={{ textAlign:'center', padding:'3rem', color:'var(--texto-desab)', border:'1px solid var(--borda)', background:'var(--surface)' }}>
          {busca ? (
            <p style={{ fontSize:'0.78rem', letterSpacing:'0.04em' }}>[ NENHUM PRODUTO ENCONTRADO PARA &quot;{busca}&quot; ]</p>
          ) : (
            <div>
              <p style={{ fontSize:'0.7rem', color:'var(--borda-forte)', letterSpacing:'0.1em', fontWeight:700, marginBottom:'0.5rem' }}>[ ESTOQUE VAZIO ]</p>
              <p style={{ fontSize:'0.72rem', marginBottom:'1rem' }}>Cadastre seu primeiro produto para começar</p>
              <button onClick={() => setShowModal(true)} className="btn btn-primary">+ CADASTRAR PRODUTO</button>
            </div>
          )}
        </div>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>PRODUTO</th><th>SKU</th><th>CATEGORIA</th>
                <th style={{ textAlign:'right' }}>CUSTO</th>
                <th style={{ textAlign:'right' }}>VENDA</th>
                <th style={{ textAlign:'center' }}>ESTQ.</th>
                <th style={{ textAlign:'center' }}>STATUS</th>
                <th style={{ textAlign:'center' }}>AÇÃO</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(p => {
                const critico = p.qtd_atual <= p.qtd_minima && p.qtd_minima > 0
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight:700, maxWidth:'240px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                        <div style={{ width:'40px', height:'40px', flexShrink:0, background:'var(--surface-alt)', border:'1px solid var(--borda)', borderRadius:'4px', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {p.imagem_url ? (
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
      )}
    </div>
  )
}
