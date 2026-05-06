'use client'
import { useState } from 'react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

const url = 'nexocommerce.app/catalogo/minha-loja'

const produtosIniciais = [
  { id: '1', emoji: '🔊', nome: 'Som JBL Stage 200',          categoria: 'Eletrônicos', preco: { varejo: 450, atacado: 380, vip: 350 }, ativo: true,  destaque: true,  precoCatalogo: 'varejo' },
  { id: '3', emoji: '📷', nome: 'Câmera de Ré Universal',      categoria: 'Eletrônicos', preco: { varejo: 120, atacado: 95,  vip: 85  }, ativo: true,  destaque: false, precoCatalogo: 'varejo' },
  { id: '4', emoji: '📻', nome: 'Amplificador Taramps DS800',  categoria: 'Eletrônicos', preco: { varejo: 780, atacado: 650, vip: 600 }, ativo: true,  destaque: true,  precoCatalogo: 'varejo' },
  { id: '5', emoji: '🔌', nome: 'Cabo RCA 5m',                 categoria: 'Acessórios',  preco: { varejo: 25,  atacado: 18,  vip: 15  }, ativo: true,  destaque: false, precoCatalogo: 'ocultar' },
  { id: '2', emoji: '🚗', nome: 'Moldura Honda Civic 2019',    categoria: 'Acessórios',  preco: { varejo: 89,  atacado: 70,  vip: 65  }, ativo: false, destaque: false, precoCatalogo: 'varejo' },
]

export default function CatalogoPage() {
  const [produtos, setProdutos] = useState(produtosIniciais)

  const ativos = produtos.filter(p => p.ativo).length

  function toggleAtivo(id: string) {
    setProdutos(prev => prev.map(p => p.id === id ? { ...p, ativo: !p.ativo } : p))
  }

  function setPreco(id: string, val: string) {
    setProdutos(prev => prev.map(p => p.id === id ? { ...p, precoCatalogo: val } : p))
  }

  function precoExibido(p: typeof produtosIniciais[0]) {
    if (p.precoCatalogo === 'ocultar') return '—'
    return formatCurrency(p.preco[p.precoCatalogo as 'varejo'|'atacado'|'vip'])
  }

  const msgWa = encodeURIComponent(`Olá! Veja nossos produtos disponíveis: https://${url}. Para fazer seu pedido é só chamar aqui no zap!`)

  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', maxWidth: '860px' }}>

      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">🌐 Catálogo Online</h1>
          <p className="pg-sub">{ativos} produtos visíveis · Link único da sua loja</p>
        </div>
        <a href={`https://${url}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
          ↗ Ver Catálogo Público
        </a>
      </div>

      {/* URL e QR */}
      <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1.5rem', alignItems: 'center' }}>
        <div>
          <p style={{ fontWeight: 800, marginBottom: '0.5rem' }}>🔗 Link do seu catálogo</p>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <code style={{
              flex: 1, padding: '0.5rem 0.75rem', background: 'var(--surface-alt)', border: '1px solid var(--borda)',
              borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--verde)',
              wordBreak: 'break-all', display: 'block'
            }}>
              https://{url}
            </code>
            <button className="btn btn-secondary" style={{ flexShrink: 0 }}
              onClick={() => navigator.clipboard.writeText(`https://${url}`)}>
              📋 Copiar
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            <a href={`https://wa.me/?text=${msgWa}`} target="_blank" rel="noopener noreferrer"
              className="btn btn-secondary" style={{ background: '#25D366', color: '#fff', border: 'none' }}>
              💬 Compartilhar no WhatsApp
            </a>
            <button className="btn btn-secondary" onClick={() => window.print()}>🖨 Imprimir QR Code</button>
          </div>
        </div>

        {/* QR Code simulado */}
        <div style={{ flexShrink: 0, textAlign: 'center' }}>
          <div style={{
            width: '120px', height: '120px', border: '3px solid var(--verde)',
            borderRadius: '8px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', background: '#fff',
            padding: '8px', gap: '4px'
          }}>
            {Array.from({ length: 7 }).map((_, row) => (
              <div key={row} style={{ display: 'flex', gap: '3px' }}>
                {Array.from({ length: 7 }).map((_, col) => {
                  const isBlack = (row < 3 && col < 3) || (row < 3 && col > 3) || (row > 3 && col < 3) || ((row + col) % 2 === 0)
                  return <div key={col} style={{ width: '11px', height: '11px', borderRadius: '1px', background: isBlack ? 'var(--texto)' : '#fff' }} />
                })}
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.65rem', color: 'var(--texto-desab)', marginTop: '4px', fontWeight: 600 }}>QR Code</p>
        </div>
      </div>

      {/* Tabela de controle */}
      <div>
        <div className="sec-header">
          <span>📋 Controle de Produtos no Catálogo</span>
        </div>
        <div className="tabela-wrap" style={{ borderTop: 'none', borderRadius: '0 0 5px 5px' }}>
          <table className="tabela">
            <thead>
              <tr style={{ background: '#364a60' }}>
                <th>Produto</th>
                <th>Categoria</th>
                <th style={{ textAlign: 'right' }}>Preço exibido</th>
                <th style={{ textAlign: 'center' }}>Exibição de preço</th>
                <th style={{ textAlign: 'center' }}>Visível</th>
                <th style={{ textAlign: 'center' }}>Destaque</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>{p.emoji}</span>
                      <span style={{ fontWeight: 700 }}>{p.nome}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.82rem' }}>{p.categoria}</td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: p.precoCatalogo === 'ocultar' ? 'var(--texto-desab)' : 'var(--verde)', fontFamily: 'monospace' }}>
                    {precoExibido(p)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <select
                      className="campo"
                      style={{ width: 'auto', fontSize: '0.75rem', padding: '0.2rem 0.4rem' }}
                      value={p.precoCatalogo}
                      onChange={e => setPreco(p.id, e.target.value)}
                    >
                      <option value="varejo">Varejo</option>
                      <option value="atacado">Atacado</option>
                      <option value="vip">VIP</option>
                      <option value="ocultar">Ocultar preço</option>
                    </select>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={p.ativo ? 'status-ok' : 'status-neutro'} style={{ fontSize: '0.8rem' }}>
                      {p.ativo ? '● Visível' : '○ Oculto'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={p.destaque ? 'status-alerta' : 'status-neutro'} style={{ fontSize: '0.8rem' }}>
                      {p.destaque ? '★ Sim' : '—'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                      <Link
                        href={`/vendas/nova?produto=${p.id}`}
                        className="btn btn-primary"
                        style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}
                      >
                        🛒 Vender
                      </Link>
                      <button
                        onClick={() => toggleAtivo(p.id)}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}
                      >
                        {p.ativo ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview */}
      <div className="card">
        <p style={{ fontWeight: 800, marginBottom: '0.875rem' }}>👁 Prévia — Como os clientes veem</p>
        <div style={{ border: '1px solid var(--borda)', borderRadius: '6px', overflow: 'hidden', background: '#fafafa' }}>
          <div style={{ padding: '1rem', background: 'var(--verde)', color: '#fff', textAlign: 'center' }}>
            <h3 style={{ fontWeight: 900, fontSize: '1.25rem', color: '#fff' }}>Minha Loja</h3>
            <p style={{ fontSize: '0.78rem', opacity: 0.85, marginTop: '2px' }}>São Paulo, SP · (11) 99999-0000</p>
          </div>
          <div style={{ padding: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.625rem' }}>
            {produtos.filter(p => p.ativo).slice(0, 4).map(p => (
              <div key={p.id} style={{ border: '1px solid var(--borda)', borderRadius: '5px', padding: '0.625rem', background: '#fff', position: 'relative' }}>
                {p.destaque && (
                  <span style={{ position: 'absolute', top: '4px', right: '4px', fontSize: '0.6rem', fontWeight: 800, background: 'var(--amarelo)', color: '#fff', padding: '1px 4px', borderRadius: '2px' }}>DESTAQUE</span>
                )}
                <div style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '0.375rem' }}>{p.emoji}</div>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--texto)', lineHeight: 1.2 }}>{p.nome}</p>
                <p style={{ fontSize: '0.68rem', color: 'var(--texto-desab)', marginTop: '2px' }}>{p.categoria}</p>
                {p.precoCatalogo !== 'ocultar'
                  ? <p style={{ fontWeight: 900, color: 'var(--verde)', marginTop: '0.375rem', fontSize: '0.875rem' }}>{formatCurrency(p.preco[p.precoCatalogo as 'varejo'|'atacado'|'vip'])}</p>
                  : <p style={{ fontSize: '0.72rem', color: 'var(--texto-desab)', marginTop: '0.375rem' }}>Consultar preço</p>
                }
              </div>
            ))}
          </div>
          <div style={{ padding: '0.625rem', background: '#f0f0f0', textAlign: 'center', borderTop: '1px solid var(--borda)' }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--texto-sec)' }}>Gostou? Mande mensagem via WhatsApp</p>
          </div>
        </div>
      </div>
    </div>
  )
}
