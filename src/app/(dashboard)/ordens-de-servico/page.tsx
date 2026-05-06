import type { Metadata } from 'next'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export const metadata: Metadata = { title: 'Ordens de Serviço' }

const ordens = [
  { id: '1', num: 1, cliente: 'João Silva',  servico: 'Instalação de som automotivo', tecnico: 'Pedro Souza', abertura: '03/05/2026', previsao: '06/05/2026', valor: 250, status: 'em_andamento' },
  { id: '2', num: 2, cliente: 'Carlos Lima', servico: 'Calibração de amplificador',   tecnico: 'Pedro Souza', abertura: '04/05/2026', previsao: '05/05/2026', valor: 80,  status: 'aberta' },
  { id: '3', num: 3, cliente: 'Ana Pereira', servico: 'Instalação câmera de ré',      tecnico: 'Pedro Souza', abertura: '01/05/2026', previsao: '01/05/2026', valor: 120, status: 'concluida' },
]

const abertasQtd = ordens.filter(o => o.status !== 'concluida').length

export default function OrdensServicoPage() {
  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">🔧 Ordens de Serviço</h1>
          <p className="pg-sub">{ordens.length} ordens registradas · {abertasQtd} em aberto</p>
        </div>
        <Link href="/ordens-de-servico/nova" className="btn btn-primary">+ Nova OS</Link>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.625rem' }}>
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--amarelo)' }}>
          <p className="kpi-label">Em Aberto</p>
          <p className="kpi-valor" style={{ color: 'var(--amarelo)' }}>{abertasQtd}</p>
        </div>
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--verde)' }}>
          <p className="kpi-label">Concluídas</p>
          <p className="kpi-valor" style={{ color: 'var(--verde)' }}>{ordens.filter(o=>o.status==='concluida').length}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Faturado em OS</p>
          <p className="kpi-valor-verde" style={{ fontSize: '1.4rem' }}>{formatCurrency(ordens.reduce((a,o)=>a+o.valor,0))}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card" style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--texto-desab)' }} />
          <input className="campo" style={{ paddingLeft: '1.75rem' }} placeholder="Buscar por cliente, nº OS ou serviço..." />
        </div>
        <select className="campo" style={{ width: 'auto' }}>
          <option>Todos os status</option><option>Aberta</option><option>Em andamento</option><option>Concluída</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="tabela-wrap">
        <table className="tabela">
          <thead>
            <tr>
              <th># OS</th><th>Cliente</th><th>Serviço</th><th>Técnico</th>
              <th>Abertura</th><th>Previsão</th>
              <th style={{ textAlign:'right' }}>Valor</th>
              <th>Status</th>
              <th style={{ textAlign:'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {ordens.map(o => (
              <tr key={o.id}>
                <td style={{ fontFamily:'monospace', fontWeight:800, color:'var(--verde)', fontSize:'0.88rem' }}>
                  #{String(o.num).padStart(4,'0')}
                </td>
                <td style={{ fontWeight:700 }}>{o.cliente}</td>
                <td style={{ color:'var(--texto-sec)', maxWidth:'200px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{o.servico}</td>
                <td style={{ fontSize:'0.82rem', color:'var(--texto-sec)' }}>{o.tecnico}</td>
                <td style={{ fontSize:'0.82rem', color:'var(--texto-desab)' }}>{o.abertura}</td>
                <td style={{ fontSize:'0.82rem', fontWeight:600 }}>{o.previsao}</td>
                <td style={{ textAlign:'right', fontWeight:800, color:'var(--verde)', fontFamily:'monospace' }}>{formatCurrency(o.valor)}</td>
                <td>
                  {o.status === 'aberta'       && <span className="status-info" style={{ fontSize:'0.82rem' }}>● Aberta</span>}
                  {o.status === 'em_andamento' && <span className="status-alerta" style={{ fontSize:'0.82rem' }}>● Em andamento</span>}
                  {o.status === 'concluida'    && <span className="status-ok" style={{ fontSize:'0.82rem' }}>● Concluída</span>}
                </td>
                <td style={{ textAlign:'center' }}>
                  <div style={{ display:'flex', gap:'0.25rem', justifyContent:'center' }}>
                    <button className="btn btn-secondary" style={{ fontSize:'0.7rem', padding:'0.25rem 0.5rem' }}>Ver OS</button>
                    {o.status !== 'concluida' && (
                      <button className="btn btn-primary" style={{ fontSize:'0.7rem', padding:'0.25rem 0.5rem' }}>✓ Concluir</button>
                    )}
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
