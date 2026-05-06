'use client'
import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'

const mockFiados = [
  { id: '1', nome: 'João Silva',    tel: '11988880001', valorAberto: 350,  ultimaCompra: '02/05/2026', diasAberto: 3  },
  { id: '2', nome: 'Ana Pereira',   tel: '11988880002', valorAberto: 120,  ultimaCompra: '28/04/2026', diasAberto: 7  },
  { id: '3', nome: 'Carlos Lima',   tel: '11988880003', valorAberto: 890,  ultimaCompra: '20/04/2026', diasAberto: 15 },
  { id: '4', nome: 'Maria Souza',   tel: '11988880004', valorAberto: 45,   ultimaCompra: '01/05/2026', diasAberto: 4  },
]

export default function FiadoPage() {
  const [fiados, setFiados] = useState(mockFiados)

  const totalAberto    = fiados.reduce((a, f) => a + f.valorAberto, 0)
  const recebidoMes    = 1240 // mock
  const nDevedores     = fiados.length

  function marcarPago(id: string) {
    setFiados(prev => prev.filter(f => f.id !== id))
  }

  function waMensagem(f: typeof mockFiados[0]) {
    return encodeURIComponent(
      `Oi ${f.nome}, tudo bem? Passando para lembrar que você tem ${formatCurrency(f.valorAberto)} em aberto aqui na loja. Quando puder aparecer ou me chama no zap!`
    )
  }

  const corDias = (d: number) => d >= 15 ? 'var(--vermelho)' : d >= 7 ? 'var(--amarelo)' : 'var(--texto-sec)'

  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">📒 Controle de Fiado</h1>
          <p className="pg-sub">Vendas pagas depois — acompanhe quem deve e cobre com 1 clique</p>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.625rem' }}>
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--vermelho)' }}>
          <p className="kpi-label">Total em Aberto</p>
          <p className="kpi-valor" style={{ color: 'var(--vermelho)' }}>{formatCurrency(totalAberto)}</p>
          <p className="kpi-sub">Aguardando recebimento</p>
        </div>
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--verde)' }}>
          <p className="kpi-label">Recebido este Mês</p>
          <p className="kpi-valor-verde">{formatCurrency(recebidoMes)}</p>
          <p className="kpi-sub">Fiados quitados em Maio</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Nº de Devedores</p>
          <p className="kpi-valor">{nDevedores}</p>
          <p className="kpi-sub">Clientes com saldo em aberto</p>
        </div>
      </div>

      {/* Alerta se houver devedores com +15 dias */}
      {fiados.some(f => f.diasAberto >= 15) && (
        <div className="alerta alerta-erro">
          <span>⚠️</span>
          <span><strong>{fiados.filter(f => f.diasAberto >= 15).length} cliente(s)</strong> com fiado há mais de 15 dias — atenção especial recomendada.</span>
        </div>
      )}

      {/* Tabela */}
      <div className="tabela-wrap">
        <table className="tabela">
          <thead>
            <tr>
              <th>Cliente</th>
              <th style={{ textAlign: 'right' }}>Valor em Aberto</th>
              <th>Última Compra Fiada</th>
              <th style={{ textAlign: 'center' }}>Dias em Aberto</th>
              <th style={{ textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {fiados.map(f => (
              <tr key={f.id}>
                <td style={{ fontWeight: 700 }}>{f.nome}</td>
                <td style={{ textAlign: 'right', fontWeight: 900, fontFamily: 'monospace', color: 'var(--vermelho)', fontSize: '1rem' }}>
                  {formatCurrency(f.valorAberto)}
                </td>
                <td style={{ fontSize: '0.82rem', color: 'var(--texto-sec)' }}>{f.ultimaCompra}</td>
                <td style={{ textAlign: 'center', fontWeight: 900, fontSize: '1.1rem', color: corDias(f.diasAberto) }}>
                  {f.diasAberto}d
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <a
                      href={`https://wa.me/55${f.tel.replace(/\D/g,'')}?text=${waMensagem(f)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="btn btn-primary"
                      style={{ fontSize: '0.72rem', padding: '0.25rem 0.625rem', background: '#25D366', border: 'none' }}
                    >
                      💬 Cobrar
                    </a>
                    <button
                      onClick={() => {
                        if (window.confirm(`Marcar o fiado de ${f.nome} (${formatCurrency(f.valorAberto)}) como pago?\n\nIsso não pode ser desfeito.`))
                          marcarPago(f.id)
                      }}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem', color: 'var(--verde)', borderColor: 'var(--verde)' }}
                    >
                      ✓ Pago
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {fiados.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--texto-desab)' }}>
                  <p style={{ fontSize: '2rem' }}>✅</p>
                  <p style={{ fontWeight: 600, marginTop: '0.5rem' }}>Nenhum fiado em aberto!</p>
                </td>
              </tr>
            )}
          </tbody>
          {fiados.length > 0 && (
            <tfoot>
              <tr>
                <td style={{ fontWeight: 900 }}>TOTAL</td>
                <td style={{ textAlign: 'right', fontWeight: 900, fontFamily: 'monospace', color: 'var(--vermelho)', fontSize: '1rem' }}>
                  {formatCurrency(totalAberto)}
                </td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
