import type { Metadata } from 'next'
import { formatCurrency } from '@/lib/utils'

export const metadata: Metadata = { title: 'Clientes Sumidos — CRM' }

const inativos = [
  { id: '1', nome: 'Rogério Alves',  telefone: '(11) 97777-0001', ultimaCompra: '15/02/2026', diasSemComprar: 79, totalGasto: 3200, numCompras: 6, categoria: 'perdido' },
  { id: '2', nome: 'Fátima Costa',   telefone: '(11) 97777-0002', ultimaCompra: '10/03/2026', diasSemComprar: 56, totalGasto: 890, numCompras: 2, categoria: 'frio' },
  { id: '3', nome: 'Marcos Pereira', telefone: '(11) 97777-0003', ultimaCompra: '05/04/2026', diasSemComprar: 30, totalGasto: 1500, numCompras: 4, categoria: 'morno' },
  { id: '4', nome: 'Sandra Lima',    telefone: '(11) 97777-0004', ultimaCompra: '12/01/2026', diasSemComprar: 113, totalGasto: 4800, numCompras: 11, categoria: 'perdido' },
]

const cats: Record<string, { emoji: string; label: string; desc: string; cor: string }> = {
  morno:   { emoji: '🟡', label: 'Morno',   desc: '30–60 dias sem comprar',  cor: 'var(--amarelo)' },
  frio:    { emoji: '🟠', label: 'Frio',    desc: '60–90 dias sem comprar',  cor: '#c05200' },
  perdido: { emoji: '🔴', label: 'Perdido', desc: '90+ dias sem comprar',    cor: 'var(--vermelho)' },
}

function msgWhatsApp(nome: string, categoria: string) {
  const first = nome.split(' ')[0]
  if (categoria === 'perdido') return `Olá ${first}! Faz um tempo que não te vejo por aqui... Tenho novidades que você vai gostar. Passa na loja ou me chama aqui! 😊`
  if (categoria === 'frio')    return `Olá ${first}! Tô com novidades aqui na loja e lembrei de você. Vem dar uma olhada! 💪`
  return `Oi ${first}! Novidade boa chegou aqui. Pode vir conferir? 🙌`
}

export default function ClientesInativosPage() {
  const perdidos = inativos.filter(c => c.categoria === 'perdido').length
  const frios    = inativos.filter(c => c.categoria === 'frio').length
  const mornos   = inativos.filter(c => c.categoria === 'morno').length
  const potencial = inativos.filter(c => c.categoria === 'perdido' || c.categoria === 'frio')
    .reduce((a,c) => a + c.totalGasto / c.numCompras, 0)

  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">👤 Clientes Sumidos</h1>
          <p className="pg-sub">Clientes que pararam de comprar — recupere-os com 1 clique</p>
        </div>
      </div>

      <div className="alerta alerta-info">
        <span>💡</span>
        <span>Recuperar um cliente antigo custa <strong>5x menos</strong> que conquistar um novo. Mande uma mensagem agora.</span>
      </div>

      {/* KPIs por categoria */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.625rem' }}>
        {[
          { ...cats.morno,   qtd: mornos,   extra: 'Mandar mensagem leve' },
          { ...cats.frio,    qtd: frios,    extra: 'Ofereça algo especial' },
          { ...cats.perdido, qtd: perdidos, extra: 'Ação urgente!' },
        ].map(c => (
          <div key={c.label} className="kpi-card" style={{ borderLeft: `4px solid ${c.cor}` }}>
            <p className="kpi-label">{c.emoji} {c.label}</p>
            <p className="kpi-valor" style={{ color: c.cor }}>{c.qtd}</p>
            <p className="kpi-sub">{c.desc}</p>
            <p style={{ fontSize: '0.7rem', color: c.cor, fontWeight: 700, marginTop: '0.25rem' }}>{c.extra}</p>
          </div>
        ))}
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--verde)' }}>
          <p className="kpi-label">Ticket Médio dos Sumidos</p>
          <p className="kpi-valor-verde" style={{ fontSize: '1.4rem' }}>{formatCurrency(potencial / (perdidos + frios || 1))}</p>
          <p className="kpi-sub">Potencial de recuperação</p>
        </div>
      </div>

      {/* Tabela */}
      <div className="tabela-wrap">
        <table className="tabela">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Telefone</th>
              <th>Última Compra</th>
              <th style={{ textAlign:'right' }}>Dias Parado</th>
              <th style={{ textAlign:'right' }}>Total Gasto</th>
              <th style={{ textAlign:'right' }}>Compras</th>
              <th>Temperatura</th>
              <th style={{ textAlign:'center' }}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {[...inativos].sort((a,b) => b.diasSemComprar - a.diasSemComprar).map(c => {
              const cat = cats[c.categoria]
              const msg = encodeURIComponent(msgWhatsApp(c.nome, c.categoria))
              const waNum = `55${c.telefone.replace(/\D/g,'')}`
              return (
                <tr key={c.id}>
                  <td style={{ fontWeight: 700 }}>{c.nome}</td>
                  <td style={{ fontSize:'0.82rem', color:'var(--texto-sec)' }}>{c.telefone}</td>
                  <td style={{ fontSize:'0.82rem', color:'var(--texto-sec)' }}>{c.ultimaCompra}</td>
                  <td style={{ textAlign:'right', fontWeight: 900, color: cat.cor, fontSize:'1rem' }}>{c.diasSemComprar}d</td>
                  <td style={{ textAlign:'right', fontWeight:700, color:'var(--verde)', fontFamily:'monospace' }}>{formatCurrency(c.totalGasto)}</td>
                  <td style={{ textAlign:'right', fontWeight:700 }}>{c.numCompras}</td>
                  <td>
                    <span style={{ fontWeight:700, color: cat.cor, fontSize:'0.82rem' }}>{cat.emoji} {cat.label}</span>
                  </td>
                  <td style={{ textAlign:'center' }}>
                    <a href={`https://wa.me/${waNum}?text=${msg}`}
                      target="_blank" rel="noopener noreferrer"
                      className="btn btn-primary"
                      style={{ fontSize:'0.72rem', padding:'0.3rem 0.625rem', background:'#25D366', border:'none' }}>
                      💬 Chamar no WhatsApp
                    </a>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="card">
        <p style={{ fontWeight:800, marginBottom:'0.5rem' }}>📝 Mensagens pré-prontas (personalizadas por temperatura)</p>
        <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
          {Object.entries(cats).map(([key, cat]) => (
            <div key={key} style={{ padding:'0.625rem', background:'var(--surface-alt)', borderRadius:'var(--radius-sm)', borderLeft:`3px solid ${cat.cor}` }}>
              <p style={{ fontSize:'0.72rem', fontWeight:800, color: cat.cor, marginBottom:'0.25rem' }}>{cat.emoji} CLIENTES {cat.label.toUpperCase()}</p>
              <p style={{ fontSize:'0.82rem', color:'var(--texto-sec)', fontStyle:'italic' }}>"{msgWhatsApp('Cliente', key)}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
