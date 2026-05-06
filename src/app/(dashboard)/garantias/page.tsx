import type { Metadata } from 'next'
import Link from 'next/link'
import { Search, AlertTriangle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Garantias' }

const garantias = [
  { id: '1', num: 1, produto: 'Som JBL Stage 200', cliente: 'João Silva', serie: 'SN-123456', inicio: '2026-05-02', vencimento: '2026-08-02', status: 'ativa', dias: 89 },
  { id: '2', num: 2, produto: 'Amplificador Taramps DS800', cliente: 'Carlos Lima', serie: 'SN-654321', inicio: '2026-04-10', vencimento: '2026-07-10', status: 'ativa', dias: 66 },
  { id: '3', num: 3, produto: 'Som Pioneer MVH', cliente: 'Maria Souza', serie: 'SN-999001', inicio: '2025-12-01', vencimento: '2026-03-01', status: 'vencida', dias: 0 },
]

const vencendo = garantias.filter(g => g.status === 'ativa' && g.dias <= 30).length

export default function GarantiasPage() {
  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">🛡️ Garantias</h1>
          <p className="pg-sub">{garantias.length} garantias emitidas</p>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.625rem' }}>
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--verde)' }}>
          <p className="kpi-label">Ativas</p>
          <p className="kpi-valor" style={{ color: 'var(--verde)' }}>{garantias.filter(g=>g.status==='ativa').length}</p>
        </div>
        <div className="kpi-card" style={{ borderLeft: `4px solid ${vencendo > 0 ? 'var(--amarelo)' : 'var(--borda)'}` }}>
          <p className="kpi-label">Vencendo em 30 dias</p>
          <p className="kpi-valor" style={{ color: 'var(--amarelo)' }}>{vencendo}</p>
        </div>
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--vermelho)' }}>
          <p className="kpi-label">Vencidas</p>
          <p className="kpi-valor" style={{ color: 'var(--vermelho)' }}>{garantias.filter(g=>g.status==='vencida').length}</p>
        </div>
      </div>

      {vencendo > 0 && (
        <div className="alerta alerta-aviso">
          <AlertTriangle size={16} />
          <span><strong>{vencendo} garantia(s)</strong> vencem nos próximos 30 dias. Avise os clientes pelo WhatsApp.</span>
        </div>
      )}

      {/* Filtros */}
      <div className="card" style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--texto-desab)' }} />
          <input className="campo" style={{ paddingLeft: '1.75rem' }} placeholder="Buscar por cliente, produto ou nº de série..." />
        </div>
        <select className="campo" style={{ width: 'auto' }}>
          <option>Todos status</option><option>Ativas</option><option>Vencidas</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="tabela-wrap">
        <table className="tabela">
          <thead>
            <tr>
              <th># Garantia</th><th>Produto</th><th>Cliente</th>
              <th>Nº Série</th><th>Início</th><th>Vencimento</th>
              <th style={{ textAlign:'center' }}>Dias Restantes</th>
              <th>Status</th><th style={{ textAlign:'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {garantias.map(g => (
              <tr key={g.id}>
                <td style={{ fontFamily:'monospace', fontWeight:800, color:'var(--verde)', fontSize:'0.88rem' }}>#{String(g.num).padStart(4,'0')}</td>
                <td style={{ fontWeight:700 }}>{g.produto}</td>
                <td style={{ color:'var(--texto-sec)' }}>{g.cliente}</td>
                <td style={{ fontFamily:'monospace', fontSize:'0.78rem', color:'var(--texto-desab)' }}>{g.serie}</td>
                <td style={{ fontSize:'0.82rem', color:'var(--texto-sec)' }}>{formatDate(g.inicio)}</td>
                <td style={{ fontSize:'0.82rem', fontWeight:600 }}>{formatDate(g.vencimento)}</td>
                <td style={{ textAlign:'center' }}>
                  {g.status === 'ativa'
                    ? <span style={{ fontWeight:900, color: g.dias <= 30 ? 'var(--amarelo)' : 'var(--verde)' }}>{g.dias}d</span>
                    : <span className="status-erro">—</span>
                  }
                </td>
                <td>
                  <span className={g.status === 'ativa' ? 'status-ok' : 'status-erro'} style={{ fontSize:'0.82rem' }}>
                    {g.status === 'ativa' ? '● Ativa' : '● Vencida'}
                  </span>
                </td>
                <td style={{ textAlign:'center' }}>
                  <div style={{ display:'flex', gap:'0.25rem', justifyContent:'center' }}>
                    <Link href={`/garantias/${g.id}`} className="btn btn-secondary" style={{ fontSize:'0.7rem', padding:'0.25rem 0.5rem' }}>🖨 Imprimir</Link>
                    <a href={`https://wa.me/`} target="_blank" className="btn btn-secondary" style={{ fontSize:'0.7rem', padding:'0.25rem 0.5rem' }}>💬</a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
