import type { Metadata } from 'next'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export const metadata: Metadata = { title: 'Estoque' }

const itens = [
  { id: '1', emoji: '🔊', nome: 'Som JBL Stage 200', sku: 'JBL001', local: 'Prateleira A1', atual: 1, minimo: 5, maximo: 20, custo: 280, status: 'critico' },
  { id: '2', emoji: '🚗', nome: 'Moldura Honda Civic 2019', sku: 'MOL001', local: 'Prateleira B3', atual: 0, minimo: 3, maximo: 10, custo: 35, status: 'zerado' },
  { id: '3', emoji: '📷', nome: 'Câmera de Ré Universal', sku: 'CAM001', local: 'Gaveta C2', atual: 12, minimo: 10, maximo: 40, custo: 55, status: 'normal' },
  { id: '4', emoji: '📻', nome: 'Amplificador Taramps DS800', sku: 'AMP001', local: 'Prateleira A3', atual: 4, minimo: 3, maximo: 12, custo: 420, status: 'normal' },
  { id: '5', emoji: '🔌', nome: 'Cabo RCA 5m', sku: 'CAB001', local: 'Caixa D1', atual: 35, minimo: 20, maximo: 100, custo: 8, status: 'normal' },
]

const zerado  = itens.filter(i => i.status === 'zerado').length
const critico = itens.filter(i => i.status === 'critico').length
const normal  = itens.filter(i => i.status === 'normal').length
const custoTotal = itens.reduce((a,i) => a + i.atual * i.custo, 0)

export default function EstoquePage() {
  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">📉 Controle de Estoque</h1>
          <p className="pg-sub">{itens.length} produtos rastreados</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary">⬇ Exportar</button>
          <Link href="/produtos/novo" className="btn btn-primary">+ Entrada de Estoque</Link>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.625rem' }}>
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--vermelho)' }}>
          <p className="kpi-label">Zerados</p>
          <p className="kpi-valor" style={{ color: 'var(--vermelho)' }}>{zerado}</p>
          <p className="kpi-sub">Sem nenhuma unidade</p>
        </div>
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--amarelo)' }}>
          <p className="kpi-label">Críticos</p>
          <p className="kpi-valor" style={{ color: 'var(--amarelo)' }}>{critico}</p>
          <p className="kpi-sub">Abaixo do mínimo</p>
        </div>
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--verde)' }}>
          <p className="kpi-label">Normais</p>
          <p className="kpi-valor" style={{ color: 'var(--verde)' }}>{normal}</p>
          <p className="kpi-sub">Nível adequado</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Valor em Estoque</p>
          <p className="kpi-valor" style={{ fontSize: '1.4rem', color: 'var(--verde)' }}>{formatCurrency(custoTotal)}</p>
          <p className="kpi-sub">Custo total</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card" style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem 0.875rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--texto-desab)' }} />
          <input className="campo" style={{ paddingLeft: '1.75rem' }} placeholder="Buscar produto..." />
        </div>
        <select className="campo" style={{ width: 'auto' }}>
          <option>Todos os status</option>
          <option>Zerado</option><option>Crítico</option><option>Normal</option>
        </select>
        <select className="campo" style={{ width: 'auto' }}>
          <option>Todas as saídas</option>
          <option>Vendas normais</option>
          <option>🎁 Saídas como Brinde</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="tabela-wrap">
        <table className="tabela">
          <thead>
            <tr>
              <th>Produto</th>
              <th>SKU</th>
              <th>Localização</th>
              <th style={{ textAlign: 'center' }}>Atual</th>
              <th style={{ textAlign: 'center' }}>Mínimo</th>
              <th style={{ textAlign: 'center' }}>Máximo</th>
              <th>Nível</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {itens.map(item => {
              const pct = item.maximo > 0 ? Math.min((item.atual / item.maximo) * 100, 100) : 0
              const cor = item.status === 'zerado' ? 'var(--vermelho)' : item.status === 'critico' ? 'var(--amarelo)' : 'var(--verde)'
              return (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>{item.emoji}</span>
                      <span style={{ fontWeight: 700 }}>{item.nome}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--texto-desab)' }}>{item.sku}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--texto-sec)' }}>{item.local}</td>
                  <td style={{ textAlign: 'center', fontWeight: 900, fontSize: '1.1rem', color: cor }}>{item.atual}</td>
                  <td style={{ textAlign: 'center', color: 'var(--texto-desab)' }}>{item.minimo}</td>
                  <td style={{ textAlign: 'center', color: 'var(--texto-desab)' }}>{item.maximo}</td>
                  <td style={{ minWidth: '100px' }}>
                    <div style={{ height: '8px', background: '#e0e0e0', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: cor, borderRadius: '2px', transition: 'width 0.3s' }} />
                    </div>
                    <p style={{ fontSize: '0.65rem', color: 'var(--texto-desab)', marginTop: '2px' }}>{pct.toFixed(0)}%</p>
                  </td>
                  <td>
                    {item.status === 'zerado'  && <span className="status-erro">✕ Zerado</span>}
                    {item.status === 'critico' && <span className="status-alerta">▼ Crítico</span>}
                    {item.status === 'normal'  && <span className="status-ok">✓ Normal</span>}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                      <button className="btn btn-secondary" style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }}>+ Entrada</button>
                      <button className="btn btn-secondary" style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }}>- Saída</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {/* Histórico de Movimentações */}
      <div>
        <div className="sec-header"><span>📋 Últimas Movimentações</span></div>
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>Produto</th><th>Data</th><th>Qtd</th>
                <th>Tipo</th><th>Obs</th>
              </tr>
            </thead>
            <tbody>
              {[
                { prod:'Som JBL Stage 200', data:'05/05/2026', qty:-1, tipo:'venda',   obs:'Venda #0042' },
                { prod:'Cabo RCA 5m',       data:'05/05/2026', qty:-2, tipo:'brinde',  obs:'Brinde — custo R$16,00' },
                { prod:'Câmera de Ré',      data:'04/05/2026', qty:+10, tipo:'entrada', obs:'NF 00123' },
                { prod:'Moldura Honda',     data:'04/05/2026', qty:-1, tipo:'venda',   obs:'Venda #0041' },
              ].map((m,i)=>(
                <tr key={i}>
                  <td style={{fontWeight:700}}>{m.prod}</td>
                  <td style={{fontSize:'0.82rem',color:'var(--texto-desab)'}}>{m.data}</td>
                  <td style={{fontWeight:900,color:m.qty>0?'var(--verde)':'var(--vermelho)',fontFamily:'monospace',textAlign:'center'}}>
                    {m.qty>0?`+${m.qty}`:m.qty}
                  </td>
                  <td>
                    {m.tipo==='venda'   && <span className="status-ok"    style={{fontSize:'0.78rem'}}>● Venda</span>}
                    {m.tipo==='brinde'  && <span className="status-alerta" style={{fontSize:'0.78rem'}}>🎁 Brinde</span>}
                    {m.tipo==='entrada' && <span className="status-info"   style={{fontSize:'0.78rem'}}>↑ Entrada</span>}
                  </td>
                  <td style={{fontSize:'0.8rem',color:'var(--texto-sec)'}}>{m.obs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
