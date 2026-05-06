import type { Metadata } from 'next'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export const metadata: Metadata = { title: 'Clientes' }

const clientes = [
  { id: '1', nome: 'João Silva',    telefone: '(11) 98888-0001', tipo: 'varejo',  ultimaCompra: '02/05/2026', totalGasto: 2350, numCompras: 4,  diasInativo: 3 },
  { id: '2', nome: 'Maria Souza',   telefone: '(11) 98888-0002', tipo: 'varejo',  ultimaCompra: '04/05/2026', totalGasto: 890,  numCompras: 2,  diasInativo: 1 },
  { id: '3', nome: 'Carlos Lima',   telefone: '(11) 98888-0003', tipo: 'atacado', ultimaCompra: '28/04/2026', totalGasto: 5200, numCompras: 8,  diasInativo: 7 },
  { id: '4', nome: 'Ana Pereira',   telefone: '(11) 98888-0004', tipo: 'vip',     ultimaCompra: '01/05/2026', totalGasto: 9800, numCompras: 15, diasInativo: 4 },
  { id: '5', nome: 'Rogério Alves', telefone: '(11) 97777-0001', tipo: 'varejo',  ultimaCompra: '15/02/2026', totalGasto: 3200, numCompras: 6,  diasInativo: 79 },
]

const totalFaturado = clientes.reduce((a,c) => a+c.totalGasto, 0)

function tipoLabel(tipo: string) {
  if (tipo === 'vip')     return { cls: 'status-ok',    label: '⭐ VIP' }
  if (tipo === 'atacado') return { cls: 'status-info',  label: '📦 Atacado' }
  return                         { cls: 'status-neutro', label: '🏪 Varejo' }
}

export default function ClientesPage() {
  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">👥 Clientes</h1>
          <p className="pg-sub">{clientes.length} clientes cadastrados</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link href="/clientes/inativos" className="btn btn-secondary">⚠ Sumidos ({clientes.filter(c=>c.diasInativo>30).length})</Link>
          <Link href="/clientes/novo" className="btn btn-primary">+ Novo Cliente</Link>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.625rem' }}>
        <div className="kpi-card"><p className="kpi-label">Total</p><p className="kpi-valor">{clientes.length}</p></div>
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--verde)' }}>
          <p className="kpi-label">Faturado Total</p>
          <p className="kpi-valor-verde" style={{ fontSize: '1.4rem' }}>{formatCurrency(totalFaturado)}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Ticket Médio</p>
          <p className="kpi-valor" style={{ fontSize: '1.4rem' }}>{formatCurrency(totalFaturado / clientes.length)}</p>
        </div>
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--vermelho)' }}>
          <p className="kpi-label">Sumidos (+30 dias)</p>
          <p className="kpi-valor" style={{ color: 'var(--vermelho)' }}>{clientes.filter(c=>c.diasInativo>30).length}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card" style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--texto-desab)' }} />
          <input className="campo" style={{ paddingLeft: '1.75rem' }} placeholder="Buscar por nome ou telefone..." />
        </div>
        <select className="campo" style={{ width: 'auto' }}>
          <option>Todos os tipos</option><option>Varejo</option><option>Atacado</option><option>VIP</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="tabela-wrap">
        <table className="tabela">
          <thead>
            <tr>
              <th>Cliente</th><th>Telefone</th><th>Tipo</th>
              <th style={{ textAlign:'right' }}>Compras</th>
              <th style={{ textAlign:'right' }}>Total Gasto</th>
              <th>Última Compra</th>
              <th>Atividade</th>
              <th style={{ textAlign:'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map(c => {
              const tp = tipoLabel(c.tipo)
              return (
                <tr key={c.id}>
                  <td style={{ fontWeight: 700 }}>{c.nome}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--texto-sec)' }}>{c.telefone}</td>
                  <td><span className={tp.cls} style={{ fontSize: '0.82rem' }}>{tp.label}</span></td>
                  <td style={{ textAlign:'right', fontWeight:700 }}>{c.numCompras}</td>
                  <td style={{ textAlign:'right', fontWeight:800, color:'var(--verde)', fontFamily:'monospace' }}>{formatCurrency(c.totalGasto)}</td>
                  <td style={{ fontSize:'0.82rem', color:'var(--texto-sec)' }}>{c.ultimaCompra}</td>
                  <td>
                    {c.diasInativo > 60
                      ? <span className="status-erro" style={{ fontSize:'0.8rem' }}>● {c.diasInativo}d sem comprar</span>
                      : c.diasInativo > 30
                      ? <span className="status-alerta" style={{ fontSize:'0.8rem' }}>● {c.diasInativo}d sem comprar</span>
                      : <span className="status-ok" style={{ fontSize:'0.8rem' }}>● Ativo</span>
                    }
                  </td>
                  <td style={{ textAlign:'center' }}>
                    <div style={{ display:'flex', gap:'0.25rem', justifyContent:'center' }}>
                      <Link href={`/vendas/nova?cliente=${c.id}`} className="btn btn-primary" style={{ fontSize:'0.7rem', padding:'0.25rem 0.5rem' }}>+ Venda</Link>
                      <a href={`https://wa.me/55${c.telefone.replace(/\D/g,'')}`} target="_blank" className="btn btn-secondary" style={{ fontSize:'0.7rem', padding:'0.25rem 0.5rem' }}>💬</a>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
