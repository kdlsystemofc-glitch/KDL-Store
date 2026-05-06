import type { Metadata } from 'next'
import Link from 'next/link'
import { Search, Printer } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export const metadata: Metadata = { title: 'Vendas' }

const vendas = [
  { id: '42', num: '#0042', data: '05/05/2026', hora: '13:45', cliente: 'João Silva', pgto: 'PIX', vendedor: 'Admin', puxador: 'Carlos', total: 850, status: 'concluida' },
  { id: '41', num: '#0041', data: '05/05/2026', hora: '12:20', cliente: 'Maria Souza', pgto: 'Crédito', vendedor: 'Admin', puxador: '—', total: 350, status: 'concluida' },
  { id: '40', num: '#0040', data: '05/05/2026', hora: '11:05', cliente: 'Anônimo', pgto: 'Dinheiro', vendedor: 'Admin', puxador: '—', total: 120, status: 'concluida' },
  { id: '39', num: '#0039', data: '05/05/2026', hora: '10:30', cliente: 'Carlos Lima', pgto: 'PIX', vendedor: 'Admin', puxador: 'Carlos', total: 2100, status: 'concluida' },
  { id: '38', num: '#0038', data: '04/05/2026', hora: '15:20', cliente: 'Ana Pereira', pgto: 'Débito', vendedor: 'Admin', puxador: '—', total: 420, status: 'cancelada' },
]

const totalHoje   = vendas.filter(v => v.data === '05/05/2026' && v.status === 'concluida').reduce((a,v) => a+v.total, 0)
const qtdHoje     = vendas.filter(v => v.data === '05/05/2026' && v.status === 'concluida').length
const ticketMedio = qtdHoje > 0 ? totalHoje / qtdHoje : 0

export default function VendasPage() {
  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">🛒 Vendas</h1>
          <p className="pg-sub">Histórico de transações</p>
        </div>
        <Link href="/vendas/nova" className="btn btn-primary">+ Registrar Nova Venda</Link>
      </div>

      {/* KPIs do dia */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.625rem' }}>
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--verde)' }}>
          <p className="kpi-label">Faturado Hoje</p>
          <p className="kpi-valor-verde">{formatCurrency(totalHoje)}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Vendas Hoje</p>
          <p className="kpi-valor">{qtdHoje}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Ticket Médio</p>
          <p className="kpi-valor">{formatCurrency(ticketMedio)}</p>
        </div>
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--vermelho)' }}>
          <p className="kpi-label">Canceladas</p>
          <p className="kpi-valor" style={{ color: 'var(--vermelho)' }}>
            {vendas.filter(v => v.status === 'cancelada').length}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '0.75rem 0.875rem' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--texto-desab)' }} />
          <input className="campo" style={{ paddingLeft: '1.75rem' }} placeholder="Buscar por cliente, nº da venda..." />
        </div>
        <select className="campo" style={{ width: 'auto' }}>
          <option>Hoje</option><option>Essa semana</option><option>Esse mês</option>
        </select>
        <select className="campo" style={{ width: 'auto' }}>
          <option>Todas formas</option><option>PIX</option><option>Dinheiro</option><option>Crédito</option><option>Débito</option>
        </select>
        <select className="campo" style={{ width: 'auto' }}>
          <option>Todos status</option><option>Concluída</option><option>Cancelada</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="tabela-wrap">
        <table className="tabela">
          <thead>
            <tr>
              <th># Venda</th>
              <th>Data</th>
              <th>Hora</th>
              <th>Cliente</th>
              <th>Pagamento</th>
              <th>Registrado por</th>
              <th>Puxador</th>
              <th style={{ textAlign: 'right' }}>Total</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {vendas.map(v => (
              <tr key={v.id}>
                <td>
                  <Link href={`/vendas/${v.id}`} style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.85rem', color: 'var(--verde)' }}>
                    {v.num}
                  </Link>
                </td>
                <td style={{ fontSize: '0.8rem', color: 'var(--texto-sec)' }}>{v.data}</td>
                <td style={{ fontSize: '0.8rem', color: 'var(--texto-desab)' }}>{v.hora}</td>
                <td style={{ fontWeight: 600 }}>{v.cliente}</td>
                <td style={{ fontSize: '0.8rem' }}>{v.pgto}</td>
                <td style={{ fontSize: '0.8rem', color: 'var(--texto-sec)' }} title="Usuário logado que registrou a venda">{v.vendedor}</td>
                <td style={{ fontSize: '0.8rem', color: v.puxador !== '—' ? 'var(--azul)' : 'var(--texto-desab)', fontWeight: v.puxador !== '—' ? 700 : 400 }}>
                  {v.puxador}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '0.95rem', color: 'var(--verde)' }}>
                  {formatCurrency(v.total)}
                </td>
                <td className={v.status === 'concluida' ? 'status-ok' : 'status-erro'} style={{ fontSize: '0.82rem' }}>
                  {v.status === 'concluida' ? '● Concluída' : '● Cancelada'}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                    <Link href={`/vendas/${v.id}`} className="btn btn-secondary" style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }}>
                      Ver
                    </Link>
                    <button className="btn btn-secondary" style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }}>
                      <Printer size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--texto-desab)', padding: '0 0.25rem' }}>
        <span>Exibindo {vendas.length} registros</span>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.625rem' }}>← Anterior</button>
          <span style={{ padding: '0.3rem 0.625rem', fontWeight: 700, color: 'var(--texto)' }}>1 de 1</span>
          <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.625rem' }}>Próxima →</button>
        </div>
      </div>
    </div>
  )
}
