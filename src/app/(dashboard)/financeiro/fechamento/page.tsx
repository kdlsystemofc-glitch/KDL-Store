'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Printer, Lock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const periodos = ['Diário', 'Quinzenal', 'Mensal', 'Anual']

const dados = {
  Diário: {
    label: 'Hoje — 05/05/2026',
    entradas: [
      { forma: 'PIX',      valor: 2600 },
      { forma: 'Dinheiro', valor: 820 },
      { forma: 'Crédito',  valor: 350 },
      { forma: 'Débito',   valor: 70 },
    ],
    saidasRegistradas: 120,
    saldoEsperado: 3840,
    saldoFisico: 0,
  },
  Mensal: {
    label: 'Maio/2026 (1–5)',
    entradas: [
      { forma: 'PIX',      valor: 8200 },
      { forma: 'Dinheiro', valor: 3100 },
      { forma: 'Crédito',  valor: 2800 },
      { forma: 'Débito',   valor: 1650 },
    ],
    saidasRegistradas: 4200,
    saldoEsperado: 11550,
    saldoFisico: 0,
  },
}

export default function FechamentoPage() {
  const [periodo, setPeriodo]       = useState('Diário')
  const [saldoFisico, setSaldoFisico] = useState('')
  const [fechado, setFechado]       = useState(false)
  const [instrucaoFechada, setInstrucaoFechada] = useState(false)

  const d = dados[periodo as keyof typeof dados] ?? dados['Diário']
  const totalEntradas = d.entradas.reduce((a,e) => a+e.valor, 0)
  const saldoEsp = totalEntradas - d.saidasRegistradas
  const diferenca = saldoFisico ? parseFloat(saldoFisico) - saldoEsp : null

  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', maxWidth: '720px' }}>

      <div className="pg-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <Link href="/financeiro" className="btn btn-secondary" style={{ padding: '0.4rem 0.625rem' }}>
            <ArrowLeft size={15} />
          </Link>
          <div>
            <h1 className="pg-titulo">🔒 Fechamento de Caixa</h1>
            <p className="pg-sub">Confira o dinheiro e feche o caixa</p>
          </div>
        </div>
      </div>

      {/* Card de instrução */}
      {!instrucaoFechada && (
        <div style={{ background: '#dbeafe', border: '1px solid #93c5fd', borderRadius: 'var(--radius)', padding: '0.875rem 1rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>💡</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 800, color: '#1e40af', marginBottom: '0.375rem' }}>Como fechar o caixa:</p>
            <p style={{ fontSize: '0.875rem', color: '#1e3a8a' }}>
              <strong>1.</strong> Conte o dinheiro físico que está no caixa &nbsp;→&nbsp;
              <strong>2.</strong> Digite o valor abaixo &nbsp;→&nbsp;
              <strong>3.</strong> Clique em <em>Confirmar e fechar o caixa</em>
            </p>
          </div>
          <button onClick={() => setInstrucaoFechada(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', flexShrink: 0, fontSize: '1rem', lineHeight: 1 }}>✕</button>
        </div>
      )}

      {/* Seletor de período */}
      <div style={{ display: 'flex', gap: '0.375rem', padding: '0.375rem', background: 'var(--surface)', border: '1px solid var(--borda)', borderRadius: 'var(--radius)', width: 'fit-content' }}>
        {periodos.map(p => (
          <button key={p} onClick={() => { setPeriodo(p); setSaldoFisico(''); setFechado(false); }} style={{
            padding: '0.375rem 1rem', borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', border: 'none',
            background: p === periodo ? 'var(--verde)' : 'transparent',
            color: p === periodo ? '#fff' : 'var(--texto-sec)',
          }}>{p}</button>
        ))}
      </div>

      {/* Cabeçalho do período */}
      <div style={{ padding: '0.75rem 1rem', background: '#2c3e50', borderRadius: 'var(--radius)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontWeight: 800, fontSize: '1rem' }}>Fechamento — {d.label}</p>
          <p style={{ fontSize: '0.78rem', color: '#8fa3bf', marginTop: '2px' }}>Período: {periodo}</p>
        </div>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, background: fechado ? 'var(--verde)' : 'var(--amarelo)', color: '#fff', padding: '0.25rem 0.625rem', borderRadius: '3px' }}>
          {fechado ? '● FECHADO' : '● ABERTO'}
        </span>
      </div>

      {/* Entradas por forma de pagamento */}
      <div>
        <div className="sec-header">
          <span>💵 Entradas por Forma de Pagamento</span>
        </div>
        <div className="tabela-wrap" style={{ borderRadius: '0 0 5px 5px', borderTop: 'none' }}>
          <table className="tabela">
            <thead>
              <tr style={{ background: '#364a60' }}>
                <th>Forma de Pagamento</th>
                <th style={{ textAlign: 'right' }}>Valor Esperado</th>
                <th style={{ textAlign: 'right' }}>% do Total</th>
              </tr>
            </thead>
            <tbody>
              {d.entradas.map(e => (
                <tr key={e.forma}>
                  <td style={{ fontWeight: 600 }}>{e.forma}</td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--verde)', fontFamily: 'monospace' }}>{formatCurrency(e.valor)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--texto-sec)', fontSize: '0.85rem' }}>
                    {((e.valor/totalEntradas)*100).toFixed(1)}%
                  </td>
                </tr>
              ))}
              <tr style={{ background: '#f0f0f0', borderTop: '2px solid var(--borda)' }}>
                <td style={{ fontWeight: 800, padding: '0.75rem 0.875rem' }}>TOTAL ENTRADAS</td>
                <td style={{ textAlign: 'right', fontWeight: 900, color: 'var(--verde)', fontFamily: 'monospace', fontSize: '1.1rem', padding: '0.75rem 0.875rem' }}>{formatCurrency(totalEntradas)}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Saídas e conferência */}
      <div className="card">
        <p style={{ fontWeight: 800, marginBottom: '0.875rem', fontSize: '0.9rem' }}>📋 Conferência Final</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
          {[
            { label: 'Total de Entradas', valor: formatCurrency(totalEntradas), cor: 'var(--verde)' },
            { label: 'Dinheiro que você tirou do caixa', valor: `- ${formatCurrency(d.saidasRegistradas)}`, cor: 'var(--vermelho)' },
            { label: 'O sistema diz que você deveria ter', valor: formatCurrency(saldoEsp), cor: 'var(--texto)', bold: true },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--borda-leve)' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: row.bold ? 700 : 500 }}>{row.label}</span>
              <span style={{ fontWeight: row.bold ? 900 : 700, color: row.cor, fontFamily: 'monospace' }}>{row.valor}</span>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label className="campo-label">Quanto de dinheiro tem no caixa agora?</label>
          <div style={{ position: 'relative', maxWidth: '280px' }}>
            <span style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--texto-sec)' }}>R$</span>
            <input className="campo" type="number" step="0.01"
              placeholder="Ex: 350,00 — o quanto de dinheiro tem no caixa agora"
              style={{ paddingLeft: '2rem', fontSize: '1rem', fontWeight: 700 }}
              value={saldoFisico} onChange={e => setSaldoFisico(e.target.value)} />
          </div>
        </div>

        {diferenca !== null && (
          <div className={`alerta ${diferenca === 0 ? 'alerta-ok' : diferenca > 0 ? 'alerta-aviso' : 'alerta-perigo'} anim-fade`} style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.5rem' }}>{diferenca === 0 ? '✅' : diferenca > 0 ? '⚠️' : '❌'}</span>
            <div>
              <p style={{ fontWeight: 900, fontSize: '1rem' }}>
                {diferenca === 0
                  ? '✓ Zerado! Caixa bate certinho.'
                  : diferenca > 0
                    ? `Sobrou ${formatCurrency(diferenca)} no caixa`
                    : `Faltou ${formatCurrency(Math.abs(diferenca))} no caixa`}
              </p>
              <p style={{ fontSize: '0.82rem', marginTop: '2px' }}>
                {diferenca === 0 ? 'Tudo certo, pode fechar.' : diferenca > 0 ? 'Tem dinheiro a mais — troco não contabilizado?' : 'Tem dinheiro faltando — alguma despesa não foi registrada?'}
              </p>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.625rem' }}>
          <button className="btn btn-secondary" style={{ gap: '0.375rem' }}>
            <Printer size={15} /> Imprimir Relatório
          </button>
          <button
            className="btn btn-primary"
            style={{ gap: '0.375rem' }}
            disabled={!saldoFisico}
            onClick={() => setFechado(true)}
          >
            <Lock size={15} /> Confirmar e fechar o caixa de hoje
          </button>
        </div>
      </div>

      {/* Histórico */}
      <div>
        <div className="sec-header">
          <span>📁 Histórico de Fechamentos</span>
        </div>
        <div className="tabela-wrap" style={{ borderRadius: '0 0 5px 5px', borderTop: 'none' }}>
          <table className="tabela">
            <thead>
              <tr style={{ background: '#364a60' }}>
                <th>Data</th><th>Período</th><th style={{ textAlign:'right' }}>Entradas</th><th style={{ textAlign:'right' }}>Saídas</th><th style={{ textAlign:'right' }}>Saldo</th><th>Diferença</th>
              </tr>
            </thead>
            <tbody>
              {[
                { data: '04/05/2026', periodo: 'Diário', ent: 2900, sai: 80, saldo: 2820, dif: 0 },
                { data: '03/05/2026', periodo: 'Diário', ent: 3200, sai: 120, saldo: 3080, dif: -50 },
                { data: '30/04/2026', periodo: 'Mensal', ent: 28400, sai: 4100, saldo: 24300, dif: 0 },
              ].map((h, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{h.data}</td>
                  <td><span className="tag tag-azul">{h.periodo}</span></td>
                  <td style={{ textAlign:'right', color:'var(--verde)', fontWeight:700, fontFamily:'monospace' }}>{formatCurrency(h.ent)}</td>
                  <td style={{ textAlign:'right', color:'var(--vermelho)', fontWeight:700, fontFamily:'monospace' }}>{formatCurrency(h.sai)}</td>
                  <td style={{ textAlign:'right', fontWeight:800, fontFamily:'monospace' }}>{formatCurrency(h.saldo)}</td>
                  <td className={h.dif === 0 ? 'status-ok' : 'status-erro'} style={{ fontSize: '0.82rem' }}>
                    {h.dif === 0 ? '● OK' : `● ${formatCurrency(h.dif)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
