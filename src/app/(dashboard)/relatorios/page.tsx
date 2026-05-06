import type { Metadata } from 'next'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

export const metadata: Metadata = { title: 'Relatórios' }

const dias = ['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15']
const faturDia = [320,850,0,1200,3840,2100,980,450,1600,2900,760,0,1100,3200,4500]
const maxFat = Math.max(...faturDia)

const pgtos = [
  { forma: 'PIX',      valor: 6200, cor: 'var(--verde)' },
  { forma: 'Dinheiro', valor: 3100, cor: '#2ecc71' },
  { forma: 'Crédito',  valor: 2800, cor: 'var(--azul)' },
  { forma: 'Débito',   valor: 1650, cor: 'var(--roxo)' },
]
const totalPgto = pgtos.reduce((a,p)=>a+p.valor,0)

const topProdutos = [
  { pos:1, emoji:'🏅', nome:'Som JBL Stage 200',          qtd:12, fat:5400 },
  { pos:2, emoji:'🥈', nome:'Amplificador Taramps DS800', qtd:8,  fat:6240 },
  { pos:3, emoji:'🥉', nome:'Câmera de Ré Universal',     qtd:22, fat:2640 },
  { pos:4, emoji:'4️⃣', nome:'Cabo RCA 5m',                qtd:55, fat:1375 },
]

const kpis = { faturamento: 15800, vendas: 87, ticket: 181.6, margem: 42.3 }

export default function RelatoriosPage() {
  return (
    <div className="anim-fade" style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>

      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">📊 Relatórios</h1>
          <p className="pg-sub">Maio/2026 · análise de performance</p>
        </div>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          <select className="campo" style={{ width:'auto' }}>
            <option>Maio/2026</option><option>Abril/2026</option><option>Março/2026</option>
          </select>
          <button className="btn btn-secondary">⬇ Exportar PDF</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:'0.625rem' }}>
        <div className="kpi-card" style={{ borderLeft:'4px solid var(--verde)' }}>
          <p className="kpi-label">Faturamento</p>
          <p className="kpi-valor-verde">{formatCurrency(kpis.faturamento)}</p>
          <p className="kpi-sub">+18% vs. mês anterior</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Total de Vendas</p>
          <p className="kpi-valor">{kpis.vendas}</p>
          <p className="kpi-sub">+11 vs. mês anterior</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Ticket Médio</p>
          <p className="kpi-valor">{formatCurrency(kpis.ticket)}</p>
          <p className="kpi-sub">+6% vs. mês anterior</p>
        </div>
        <div className="kpi-card" style={{ borderLeft:'4px solid var(--azul)' }}>
          <p className="kpi-label">Margem Média</p>
          <p className="kpi-valor" style={{ color:'var(--azul)' }}>{kpis.margem}%</p>
          <p className="kpi-sub">Bom desempenho ↑</p>
        </div>
      </div>

      {/* Faturamento diário */}
      <div className="card">
        <div className="sec-header" style={{ borderRadius:'5px 5px 0 0', margin:'-1rem -1.125rem 1rem' }}>
          <span>📅 Faturamento Diário — Maio/2026</span>
          <span style={{ color:'#8fa3bf', fontWeight:400, fontSize:'0.72rem' }}>Total: {formatCurrency(faturDia.reduce((a,b)=>a+b,0))}</span>
        </div>
        <div style={{ display:'flex', alignItems:'flex-end', gap:'4px', height:'120px' }}>
          {faturDia.map((v,i) => (
            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'3px' }}>
              {v > 0 && <span style={{ fontSize:'0.55rem', fontWeight:700, color:'var(--verde)', writingMode:'vertical-rl', transform:'rotate(180deg)' }}>
                {v>=1000?`${(v/1000).toFixed(1)}k`:v}
              </span>}
              <div style={{
                width:'100%', borderRadius:'2px 2px 0 0', minHeight:'4px',
                height: v > 0 ? `${(v/maxFat)*90}%` : '4px',
                background: v===0 ? '#e0e0e0' : i===4?'var(--verde)':'var(--verde-claro)',
                border: v===0 ? 'none' : `1px solid ${i===4?'var(--verde-esc)':'var(--verde-borda)'}`,
              }} />
              <span style={{ fontSize:'0.55rem', color:'var(--texto-desab)', fontWeight:600 }}>{dias[i]}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.875rem' }}>

        {/* Formas de pagamento */}
        <div>
          <div className="sec-header"><span>💳 Formas de Pagamento</span></div>
          <div style={{ background:'var(--surface)', border:'1px solid var(--borda)', borderTop:'none', borderRadius:'0 0 5px 5px', padding:'0.875rem' }}>
            {pgtos.map(p => (
              <div key={p.forma} style={{ marginBottom:'0.75rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                  <span style={{ fontWeight:700, fontSize:'0.875rem' }}>{p.forma}</span>
                  <span style={{ fontWeight:800, fontFamily:'monospace', color:p.cor }}>{formatCurrency(p.valor)}</span>
                </div>
                <div style={{ height:'10px', background:'#e8e8e8', borderRadius:'2px', overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${(p.valor/totalPgto)*100}%`, background:p.cor, borderRadius:'2px', transition:'width 0.5s' }} />
                </div>
                <p style={{ fontSize:'0.7rem', color:'var(--texto-desab)', marginTop:'2px' }}>{((p.valor/totalPgto)*100).toFixed(1)}% do total</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top produtos */}
        <div>
          <div className="sec-header"><span>🏆 Produtos Mais Vendidos</span></div>
          <div style={{ background:'var(--surface)', border:'1px solid var(--borda)', borderTop:'none', borderRadius:'0 0 5px 5px' }}>
            {topProdutos.map((p,i) => (
              <div key={p.pos} style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.625rem 0.875rem', borderBottom: i<topProdutos.length-1?'1px solid var(--borda-leve)':'none' }}>
                <span style={{ fontSize:'1.25rem', flexShrink:0, width:'28px', textAlign:'center' }}>{p.emoji}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontWeight:700, fontSize:'0.875rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.nome}</p>
                  <p style={{ fontSize:'0.72rem', color:'var(--texto-desab)' }}>{p.qtd} unidades vendidas</p>
                </div>
                <span style={{ fontWeight:900, color:'var(--verde)', fontFamily:'monospace', flexShrink:0 }}>{formatCurrency(p.fat)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabela de vendas por dia */}
      <div>
        <div className="sec-header"><span>📋 Resumo Diário</span></div>
        <div className="tabela-wrap" style={{ borderTop:'none', borderRadius:'0 0 5px 5px' }}>
          <table className="tabela">
            <thead>
              <tr style={{ background:'#364a60' }}>
                <th>Dia</th>
                <th style={{ textAlign:'right' }}>Faturamento</th>
                <th style={{ textAlign:'center' }}>Vendas</th>
                <th style={{ textAlign:'right' }}>Ticket Médio</th>
                <th>Melhor Pgto</th>
              </tr>
            </thead>
            <tbody>
              {[
                { dia:'05/05', fat:3840, qtd:14, pgto:'PIX' },
                { dia:'04/05', fat:2900, qtd:10, pgto:'Dinheiro' },
                { dia:'03/05', fat:1100, qtd:5,  pgto:'PIX' },
                { dia:'01/05', fat:1200, qtd:6,  pgto:'Crédito' },
              ].map((r,i) => (
                <tr key={i}>
                  <td style={{ fontWeight:700 }}>{r.dia}</td>
                  <td style={{ textAlign:'right', fontWeight:800, color:'var(--verde)', fontFamily:'monospace' }}>{formatCurrency(r.fat)}</td>
                  <td style={{ textAlign:'center', fontWeight:700 }}>{r.qtd}</td>
                  <td style={{ textAlign:'right', fontFamily:'monospace' }}>{formatCurrency(r.fat/r.qtd)}</td>
                  <td style={{ fontSize:'0.82rem' }}>{r.pgto}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display:'flex', gap:'0.5rem', justifyContent:'flex-end' }}>
        <Link href="/financeiro" className="btn btn-secondary">Ver DRE completo →</Link>
        <Link href="/financeiro/fechamento" className="btn btn-primary">🔒 Fechar Período</Link>
      </div>
    </div>
  )
}
