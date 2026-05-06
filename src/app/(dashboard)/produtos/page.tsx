'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { formatCurrency } from '@/lib/utils'
import { Plus, Search, AlertTriangle, Loader2 } from 'lucide-react'

type Produto = {
  id: string; nome: string; sku: string | null; categoria: string | null
  preco_varejo: number; preco_custo: number; qtd_atual: number; qtd_minima: number; ativo: boolean
}

export default function ProdutosPage() {
  const { empresaId } = useEmpresaId()
  const [produtos,   setProdutos]   = useState<Produto[]>([])
  const [busca,      setBusca]      = useState('')
  const [loading,    setLoading]    = useState(true)
  const [erro,       setErro]       = useState<string | null>(null)

  useEffect(() => { if (empresaId) carregar(empresaId) }, [empresaId])

  async function carregar(eid: string) {
    setLoading(true)
    setErro(null)
    const { data, error } = await createClient()
      .from('produtos')
      .select('id,nome,sku,categoria,preco_varejo,preco_custo,qtd_atual,qtd_minima,ativo')
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
    <div className="anim-fade" style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>

      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">📦 Produtos</h1>
          <p className="pg-sub">{produtos.length} produtos cadastrados · {totalItens} itens em estoque</p>
        </div>
        <Link href="/produtos/novo" className="btn btn-primary" style={{ display:'flex', alignItems:'center', gap:'0.375rem' }}>
          <Plus size={15}/> Novo Produto
        </Link>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.625rem' }}>
        {[
          { label:'Total de produtos', valor: produtos.length, suf:'cadastros', cor:'var(--verde)' },
          { label:'Valor do estoque',  valor: formatCurrency(valorEstoque), suf:'(preço de custo)', cor:'var(--texto)' },
          { label:'Abaixo do mínimo', valor: criticos.length, suf:'produtos críticos', cor: criticos.length > 0 ? 'var(--vermelho)' : 'var(--verde)' },
        ].map(k => (
          <div key={k.label} className="card" style={{ padding:'0.875rem' }}>
            <p style={{ fontSize:'0.78rem', color:'var(--texto-desab)', marginBottom:'0.25rem' }}>{k.label}</p>
            <p style={{ fontWeight:900, fontSize:'1.5rem', color:k.cor, fontFamily:'monospace' }}>{k.valor}</p>
            <p style={{ fontSize:'0.72rem', color:'var(--texto-desab)' }}>{k.suf}</p>
          </div>
        ))}
      </div>

      {/* Alerta críticos */}
      {criticos.length > 0 && (
        <div className="alerta alerta-perigo" style={{ display:'flex', gap:'0.625rem', alignItems:'center' }}>
          <AlertTriangle size={16}/>
          <span><strong>{criticos.length} produto(s)</strong> abaixo do estoque mínimo: {criticos.map(p=>p.nome).join(', ')}</span>
        </div>
      )}

      {/* Busca */}
      <div style={{ position:'relative', maxWidth:'380px' }}>
        <Search size={14} style={{ position:'absolute', left:'0.75rem', top:'50%', transform:'translateY(-50%)', color:'var(--texto-desab)' }}/>
        <input className="campo" placeholder="Buscar por nome, SKU ou categoria..."
          style={{ paddingLeft:'2.25rem' }}
          value={busca} onChange={e => setBusca(e.target.value)} />
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'3rem', gap:'0.75rem', color:'var(--texto-desab)' }}>
          <Loader2 size={20} style={{ animation:'spin 1s linear infinite' }}/> Carregando produtos...
        </div>
      ) : erro ? (
        <div className="alerta alerta-perigo">{erro}</div>
      ) : filtrados.length === 0 ? (
        <div style={{ textAlign:'center', padding:'3rem', color:'var(--texto-desab)' }}>
          {busca ? `Nenhum produto encontrado para "${busca}"` : (
            <div>
              <p style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>📦</p>
              <p style={{ fontWeight:700, marginBottom:'0.25rem' }}>Nenhum produto cadastrado ainda</p>
              <p style={{ fontSize:'0.85rem', marginBottom:'1rem' }}>Comece cadastrando seu primeiro produto</p>
              <Link href="/produtos/novo" className="btn btn-primary">+ Cadastrar primeiro produto</Link>
            </div>
          )}
        </div>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr style={{ background:'#364a60' }}>
                <th>Produto</th><th>SKU</th><th>Categoria</th>
                <th style={{ textAlign:'right' }}>Custo</th>
                <th style={{ textAlign:'right' }}>Venda</th>
                <th style={{ textAlign:'center' }}>Estoque</th>
                <th style={{ textAlign:'center' }}>Status</th>
                <th style={{ textAlign:'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(p => {
                const critico = p.qtd_atual <= p.qtd_minima && p.qtd_minima > 0
                const margem  = p.preco_varejo > 0 ? ((p.preco_varejo - p.preco_custo) / p.preco_varejo * 100) : 0
                return (
                  <tr key={p.id}>
                    <td><span style={{ fontWeight:700 }}>{p.nome}</span></td>
                    <td><code style={{ fontSize:'0.78rem' }}>{p.sku || '—'}</code></td>
                    <td style={{ fontSize:'0.82rem' }}>{p.categoria || '—'}</td>
                    <td style={{ textAlign:'right', fontFamily:'monospace', fontSize:'0.85rem' }}>{formatCurrency(p.preco_custo)}</td>
                    <td style={{ textAlign:'right', fontWeight:800, color:'var(--verde)', fontFamily:'monospace' }}>{formatCurrency(p.preco_varejo)}</td>
                    <td style={{ textAlign:'center' }}>
                      <span style={{ fontWeight:800, color: critico ? 'var(--vermelho)' : 'var(--verde)', fontFamily:'monospace' }}>
                        {p.qtd_atual}
                      </span>
                      {critico && <span style={{ fontSize:'0.7rem', color:'var(--vermelho)', display:'block' }}>⚠ mínimo</span>}
                    </td>
                    <td style={{ textAlign:'center' }}>
                      <span className={p.ativo ? 'status-ok' : 'status-neutro'} style={{ fontSize:'0.8rem' }}>
                        {p.ativo ? '● Ativo' : '○ Inativo'}
                      </span>
                    </td>
                    <td style={{ textAlign:'center' }}>
                      <Link href={`/produtos/${p.id}/editar`} className="btn btn-secondary" style={{ fontSize:'0.75rem', padding:'0.25rem 0.625rem' }}>
                        Editar
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
