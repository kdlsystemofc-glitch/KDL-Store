'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const despesas = [
  { id: '1', descricao: 'Aluguel — Maio/2026', categoria: 'Aluguel', tipo: 'Fixa', valor: 1800, data: '01/05/2026', recorrente: true },
  { id: '2', descricao: 'Funcionário Pedro', categoria: 'Funcionários', tipo: 'Fixa', valor: 1200, data: '05/05/2026', recorrente: true },
  { id: '3', descricao: 'Energia elétrica', categoria: 'Energia/Internet', tipo: 'Fixa', valor: 280, data: '10/05/2026', recorrente: true },
  { id: '4', descricao: 'Compra: 10 unid. Câmera Ré', categoria: 'Compras', tipo: 'Variável', valor: 550, data: '03/05/2026', recorrente: false },
  { id: '5', descricao: 'Comissão Carlos (puxador)', categoria: 'Comissões', tipo: 'Variável', valor: 200, data: '05/05/2026', recorrente: false },
]

const categorias = ['Aluguel', 'Funcionários', 'Energia/Internet', 'Compras', 'Comissões', 'Outros']

export default function DespesasPage() {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ descricao: '', categoria: '', tipo: 'Variável', valor: '', data: '', recorrente: false })

  const totalMes = despesas.reduce((a, d) => a + d.valor, 0)

  const handleSave = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setLoading(false)
    setShowForm(false)
  }

  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', maxWidth: '900px' }}>

      <div className="pg-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <Link href="/financeiro" className="btn btn-secondary" style={{ padding: '0.4rem 0.625rem' }}>
            <ArrowLeft size={15} />
          </Link>
          <div>
            <h1 className="pg-titulo">💸 Despesas</h1>
            <p className="pg-sub">Lançamento e controle de despesas</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>+ Lançar Despesa</button>
      </div>

      {/* Formulário inline */}
      {showForm && (
        <div className="card anim-fade" style={{ border: '2px solid var(--verde)' }}>
          <p style={{ fontWeight: 800, marginBottom: '0.875rem', color: 'var(--verde)' }}>Nova Despesa</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="campo-label">Descrição *</label>
              <input className="campo" placeholder="Ex: Aluguel de Maio/2026"
                value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} />
            </div>
            <div>
              <label className="campo-label">Categoria *</label>
              <select className="campo" value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})}>
                <option value="">Selecionar...</option>
                {categorias.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="campo-label">Tipo</label>
              <select className="campo" value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}>
                <option>Fixa</option>
                <option>Variável</option>
              </select>
            </div>
            <div>
              <label className="campo-label">Valor (R$) *</label>
              <input className="campo" type="number" step="0.01" placeholder="0,00"
                value={form.valor} onChange={e => setForm({...form, valor: e.target.value})} />
            </div>
            <div>
              <label className="campo-label">Data *</label>
              <input className="campo" type="date"
                value={form.data} onChange={e => setForm({...form, data: e.target.value})} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
            <input type="checkbox" id="recorrente" checked={form.recorrente}
              onChange={e => setForm({...form, recorrente: e.target.checked})} />
            <label htmlFor="recorrente" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--texto-sec)', cursor: 'pointer' }}>
              Despesa recorrente (se repete todo mês)
            </label>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
              {loading ? <><Loader2 size={14} className="animate-spin" /> Salvando...</> : <><Save size={14} /> Salvar Despesa</>}
            </button>
          </div>
        </div>
      )}

      {/* Resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.625rem' }}>
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--vermelho)' }}>
          <p className="kpi-label">Total Mês</p>
          <p className="kpi-valor" style={{ color: 'var(--vermelho)', fontSize: '1.5rem' }}>{formatCurrency(totalMes)}</p>
        </div>
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--azul)' }}>
          <p className="kpi-label">Despesas Fixas</p>
          <p className="kpi-valor" style={{ color: 'var(--azul)', fontSize: '1.5rem' }}>
            {formatCurrency(despesas.filter(d=>d.tipo==='Fixa').reduce((a,d)=>a+d.valor,0))}
          </p>
        </div>
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--amarelo)' }}>
          <p className="kpi-label">Despesas Variáveis</p>
          <p className="kpi-valor" style={{ color: 'var(--amarelo)', fontSize: '1.5rem' }}>
            {formatCurrency(despesas.filter(d=>d.tipo==='Variável').reduce((a,d)=>a+d.valor,0))}
          </p>
        </div>
      </div>

      {/* Tabela */}
      <div className="tabela-wrap">
        <table className="tabela">
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Tipo</th>
              <th>Data</th>
              <th>Recorrente</th>
              <th style={{ textAlign: 'right' }}>Valor</th>
              <th style={{ textAlign: 'center' }}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {despesas.map(d => (
              <tr key={d.id}>
                <td style={{ fontWeight: 600 }}>{d.descricao}</td>
                <td style={{ fontSize: '0.8rem' }}>{d.categoria}</td>
                <td>
                  <span className={d.tipo === 'Fixa' ? 'status-info' : 'status-alerta'} style={{ fontSize: '0.8rem' }}>
                    ● {d.tipo}
                  </span>
                </td>
                <td style={{ fontSize: '0.8rem', color: 'var(--texto-sec)' }}>{d.data}</td>
                <td style={{ fontSize: '0.8rem', color: d.recorrente ? 'var(--verde)' : 'var(--texto-desab)' }}>
                  {d.recorrente ? '● Sim' : '— Não'}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--vermelho)', fontFamily: 'monospace' }}>
                  {formatCurrency(d.valor)}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button className="btn btn-danger" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>Excluir</button>
                </td>
              </tr>
            ))}
            <tr style={{ background: '#fef5f5', borderTop: '2px solid var(--borda)' }}>
              <td colSpan={5} style={{ fontWeight: 800, padding: '0.625rem 0.875rem' }}>TOTAL DO PERÍODO</td>
              <td style={{ textAlign: 'right', fontWeight: 900, color: 'var(--vermelho)', fontFamily: 'monospace', fontSize: '1rem', padding: '0.625rem 0.875rem' }}>
                {formatCurrency(totalMes)}
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
