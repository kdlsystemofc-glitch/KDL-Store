import type { Metadata } from 'next'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export const metadata: Metadata = { title: 'Produtos' }

const produtos = [
  { id: '1', emoji: '🔊', nome: 'Som JBL Stage 200', sku: 'JBL001', categoria: 'Eletrônicos', custo: 280, venda: 450, margem: 37.8, estoque: 1, minimo: 5, status: 'critico' },
  { id: '2', emoji: '🚗', nome: 'Moldura Honda Civic 2019', sku: 'MOL001', categoria: 'Acessórios', custo: 35, venda: 89, margem: 60.7, estoque: 0, minimo: 3, status: 'zerado' },
  { id: '3', emoji: '📷', nome: 'Câmera de Ré Universal', sku: 'CAM001', categoria: 'Eletrônicos', custo: 55, venda: 120, margem: 54.2, estoque: 12, minimo: 10, status: 'normal' },
  { id: '4', emoji: '📻', nome: 'Amplificador Taramps DS800', sku: 'AMP001', categoria: 'Eletrônicos', custo: 420, venda: 780, margem: 46.2, estoque: 4, minimo: 3, status: 'normal' },
  { id: '5', emoji: '🔌', nome: 'Cabo RCA 5m', sku: 'CAB001', categoria: 'Acessórios', custo: 8, venda: 25, margem: 68, estoque: 35, minimo: 20, status: 'normal' },
]

const criticos = produtos.filter(p => p.status === 'critico' || p.status === 'zerado').length

export default function ProdutosPage() {
  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">📦 Produtos</h1>
          <p className="pg-sub">{produtos.length} produtos cadastrados · {criticos > 0 ? `${criticos} com estoque crítico` : 'estoque OK'}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary">⬇ Exportar</button>
          <Link href="/produtos/novo" className="btn btn-primary">+ Novo Produto</Link>
        </div>
      </div>

      {criticos > 0 && (
        <div className="alerta alerta-aviso">
          <span>⚠️</span>
          <span><strong>{criticos} produto(s)</strong> com estoque abaixo do mínimo precisam de reposição.</span>
          <Link href="/estoque" style={{ fontWeight: 700, fontSize: '0.82rem', color: 'inherit', textDecoration: 'underline' }}>Ver estoque →</Link>
        </div>
      )}

      {/* Filtros */}
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '0.75rem 0.875rem' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--texto-desab)' }} />
          <input className="campo" style={{ paddingLeft: '1.75rem' }} placeholder="Buscar por nome, SKU ou código de barras..." />
        </div>
        <select className="campo" style={{ width: 'auto' }}>
          <option>Todas categorias</option><option>Eletrônicos</option><option>Acessórios</option>
        </select>
        <select className="campo" style={{ width: 'auto' }}>
          <option>Todos status</option><option>Normal</option><option>Crítico</option><option>Zerado</option>
        </select>
        <button className="btn btn-secondary">Limpar filtros</button>
      </div>

      {/* Tabela */}
      <div className="tabela-wrap">
        <table className="tabela">
          <thead>
            <tr>
              <th>Produto</th>
              <th>SKU</th>
              <th>Categoria</th>
              <th style={{ textAlign: 'right' }}>Custo</th>
              <th style={{ textAlign: 'right' }}>Venda</th>
              <th style={{ textAlign: 'right' }}>Margem</th>
              <th style={{ textAlign: 'center' }}>Estoque</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtos.map(p => (
              <tr key={p.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>{p.emoji}</span>
                    <span style={{ fontWeight: 700 }}>{p.nome}</span>
                  </div>
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--texto-desab)' }}>{p.sku}</td>
                <td style={{ fontSize: '0.82rem', color: 'var(--azul)', fontWeight: 600 }}>{p.categoria}</td>
                <td style={{ textAlign: 'right', color: 'var(--texto-sec)' }}>{formatCurrency(p.custo)}</td>
                <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--verde)' }}>{formatCurrency(p.venda)}</td>
                <td style={{ textAlign: 'right' }}>
                  <span className={p.margem >= 50 ? 'status-ok' : p.margem >= 30 ? 'status-info' : 'status-alerta'} style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {p.margem.toFixed(0)}%
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span style={{ fontWeight: 900, fontSize: '1rem', color: p.estoque === 0 ? 'var(--vermelho)' : p.estoque <= p.minimo ? 'var(--amarelo)' : 'var(--texto)' }}>
                    {p.estoque}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--texto-desab)', marginLeft: '2px' }}>/ mín.{p.minimo}</span>
                </td>
                <td>
                  {p.status === 'zerado' && <span className="status-erro">✕ Sem estoque</span>}
                  {p.status === 'critico' && <span className="status-alerta">▼ Crítico</span>}
                  {p.status === 'normal' && <span className="status-ok">✓ Normal</span>}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                    <Link href={`/produtos/${p.id}/editar`} className="btn btn-secondary" style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }}>✏ Editar</Link>
                    <button className="btn btn-danger" style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }}>✕</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--texto-desab)', padding: '0 0.25rem' }}>
        <span>Exibindo {produtos.length} produtos</span>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.625rem' }}>← Anterior</button>
          <span style={{ padding: '0.3rem 0.625rem', fontWeight: 700, color: 'var(--texto)' }}>Página 1 de 1</span>
          <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.625rem' }}>Próxima →</button>
        </div>
      </div>
    </div>
  )
}
