import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle, TrendingUp, ShoppingCart, Wrench, ArrowRight, PhoneCall, UserX, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export const metadata: Metadata = { title: 'Dashboard' }

// Dados mock — serão substituídos por Supabase
const kpis = {
  faturamentoHoje: 3840,
  vendasHoje:      14,
  despesasMes:     4200,
  lucroMes:        8950,
}

const alertas = [
  { tipo: 'perigo', icon: '🚫', msg: 'Moldura Honda Civic ZERADO — estoque acabou', acao: 'Chamar fornecedor', href: '/fornecedores' },
  { tipo: 'aviso',  icon: '⚠️', msg: '3 clientes não compram há mais de 60 dias', acao: 'Ver lista', href: '/clientes/inativos' },
  { tipo: 'aviso',  icon: '⚠️', msg: 'Som JBL Stage 200 — apenas 1 unidade em estoque', acao: 'Repor', href: '/estoque' },
  { tipo: 'info',   icon: '💰', msg: 'Puxador Carlos tem R$ 340,00 a receber este mês', acao: 'Ver comissões', href: '/puxadores' },
]

const ultimasVendas = [
  { num: '#0042', hora: '13:45', cliente: 'João Silva', pgto: 'PIX', total: 850, status: 'concluida' },
  { num: '#0041', hora: '12:20', cliente: 'Maria Souza', pgto: 'Crédito', total: 350, status: 'concluida' },
  { num: '#0040', hora: '11:05', cliente: 'Anônimo', pgto: 'Dinheiro', total: 120, status: 'concluida' },
  { num: '#0039', hora: '10:30', cliente: 'Carlos Lima', pgto: 'PIX', total: 2100, status: 'concluida' },
  { num: '#0038', hora: '09:15', cliente: 'Ana Pereira', pgto: 'Débito', total: 420, status: 'cancelada' },
]

const estoquesCriticos = [
  { nome: 'Moldura Honda Civic', atual: 0, minimo: 3, fornecedor: '(11) 99999-0002' },
  { nome: 'Som JBL Stage 200',   atual: 1, minimo: 5, fornecedor: '(11) 99999-0001' },
  { nome: 'Câmera de Ré Universal', atual: 2, minimo: 10, fornecedor: '(11) 99999-0003' },
]

const weekData = [820, 1450, 980, 2100, 1760, 3840, 2200]
const days     = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const maxW     = Math.max(...weekData)

export default function DashboardPage() {
  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Saudação */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 className="pg-titulo">Bom dia! 👋</h1>
          <p className="pg-sub">Terça-feira, 05 de Maio de 2026 · resumo do seu negócio</p>
        </div>
        <Link href="/vendas/nova" className="btn btn-primary" style={{ fontSize: '0.9rem', padding: '0.625rem 1.25rem' }}>
          <ShoppingCart size={17} fill="currentColor" /> Registrar Venda
        </Link>
      </div>

      {/* ── ALERTAS INTELIGENTES ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        {alertas.map((a, i) => (
          <div key={i} className={`alerta alerta-${a.tipo === 'perigo' ? 'perigo' : a.tipo === 'info' ? 'info' : 'aviso'}`}>
            <span>{a.icon}</span>
            <span style={{ flex: 1 }}>{a.msg}</span>
            <Link href={a.href} style={{ fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap', color: 'inherit', textDecoration: 'underline' }}>
              {a.acao} →
            </Link>
          </div>
        ))}
      </div>

      {/* ── KPI CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
        <Link href="/relatorios" className="card-click">
          <p className="kpi-label">Faturamento Hoje</p>
          <p className="kpi-valor-verde">{formatCurrency(kpis.faturamentoHoje)}</p>
          <p className="kpi-sub">+12% vs. ontem ↑</p>
        </Link>
        <Link href="/vendas" className="card-click">
          <p className="kpi-label">Vendas Hoje</p>
          <p className="kpi-valor">{kpis.vendasHoje}</p>
          <p className="kpi-sub">+3 vs. ontem</p>
        </Link>
        <Link href="/financeiro" className="card-click">
          <p className="kpi-label">Despesas (mês)</p>
          <p className="kpi-valor" style={{ color: 'var(--vermelho)' }}>{formatCurrency(kpis.despesasMes)}</p>
          <p className="kpi-sub">Aluguel + funcionários</p>
        </Link>
        <Link href="/financeiro" className="card-click">
          <p className="kpi-label">Lucro Líquido (mês)</p>
          <p className="kpi-valor-verde">{formatCurrency(kpis.lucroMes)}</p>
          <p className="kpi-sub">↑ Acima da meta</p>
        </Link>
      </div>

      {/* ── GRID PRINCIPAL ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '0.875rem' }}>

        {/* ESQUERDA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', minWidth: 0 }}>

          {/* Gráfico semanal */}
          <div className="card">
            <div className="sec-header" style={{ borderRadius: '5px 5px 0 0', margin: '-1rem -1.125rem 1rem' }}>
              <span>📊 Faturamento — Últimos 7 dias</span>
              <span style={{ fontWeight: 400, color: '#8fa3bf' }}>Total: {formatCurrency(weekData.reduce((a,b)=>a+b,0))}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '120px' }}>
              {weekData.map((v, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--verde)' }}>
                    {(v/1000).toFixed(1)}k
                  </span>
                  <div style={{
                    width: '100%', borderRadius: '3px 3px 0 0',
                    height: `${(v/maxW)*100}%`,
                    background: i === 5 ? 'var(--verde)' : 'var(--verde-claro)',
                    border: `1px solid ${i === 5 ? 'var(--verde-esc)' : 'var(--verde-borda)'}`,
                    minHeight: '4px'
                  }} />
                  <span style={{ fontSize: '0.65rem', color: 'var(--texto-desab)', fontWeight: 600 }}>{days[i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Últimas vendas */}
          <div>
            <div className="sec-header">
              <span>🛒 Últimas Vendas</span>
              <Link href="/vendas" style={{ color: '#8fa3bf', fontSize: '0.7rem', fontWeight: 600, textDecoration: 'none' }}>
                Ver todas →
              </Link>
            </div>
            <div className="tabela-wrap" style={{ borderRadius: '0 0 5px 5px', borderTop: 'none' }}>
              <table className="tabela">
                <thead>
                  <tr style={{ background: '#364a60' }}>
                    <th>#</th><th>Hora</th><th>Cliente</th><th>Pagamento</th><th style={{textAlign:'right'}}>Total</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimasVendas.map(v => (
                    <tr key={v.num}>
                      <td><Link href={`/vendas/${v.num.replace('#','')}`} style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8rem', color: 'var(--verde)' }}>{v.num}</Link></td>
                      <td className="txt-desab" style={{ fontSize: '0.8rem' }}>{v.hora}</td>
                      <td style={{ fontWeight: 600 }}>{v.cliente}</td>
                      <td style={{ fontSize: '0.8rem' }}>{v.pgto}</td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--verde)' }}>{formatCurrency(v.total)}</td>
                      <td className={v.status === 'concluida' ? 'status-ok' : 'status-erro'} style={{ fontSize: '0.8rem' }}>
                        {v.status === 'concluida' ? '● Concluída' : '● Cancelada'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* DIREITA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

          {/* Estoque crítico com botão ligar */}
          <div>
            <div className="sec-header">
              <span>🚫 Estoque Crítico</span>
              <Link href="/estoque" style={{ color: '#8fa3bf', fontSize: '0.7rem', textDecoration: 'none' }}>Gerenciar</Link>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--borda)', borderTop: 'none', borderRadius: '0 0 5px 5px' }}>
              {estoquesCriticos.map((e, i) => (
                <div key={e.nome} style={{
                  padding: '0.625rem 0.875rem', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', gap: '0.5rem',
                  borderBottom: i < estoquesCriticos.length - 1 ? '1px solid var(--borda-leve)' : 'none'
                }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.8rem', color: e.atual === 0 ? 'var(--vermelho)' : 'var(--amarelo)' }}>
                      {e.atual === 0 ? '✕ ZERADO' : `▼ ${e.atual} un.`}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--texto-sec)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.nome}</p>
                  </div>
                  <a
                    href={`https://wa.me/55${e.fornecedor.replace(/\D/g,'')}`}
                    target="_blank" rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.7rem', padding: '0.3rem 0.5rem', flexShrink: 0 }}
                  >
                    <PhoneCall size={12} /> Ligar
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Acesso rápido */}
          <div className="card">
            <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--texto-desab)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.625rem' }}>Acesso Rápido</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem' }}>
              {[
                { href: '/vendas/nova',           emoji: '🛒', label: 'Nova Venda' },
                { href: '/produtos/novo',          emoji: '📦', label: 'Produto' },
                { href: '/financeiro/despesas',    emoji: '💸', label: 'Despesa' },
                { href: '/financeiro/fechamento',  emoji: '🔒', label: 'Fechar Caixa' },
                { href: '/garantias',              emoji: '🛡️', label: 'Garantias' },
                { href: '/clientes/inativos',      emoji: '👤', label: 'Sumidos' },
              ].map(item => (
                <Link key={item.href} href={item.href} className="btn-pdv">
                  <span style={{ fontSize: '1.375rem' }}>{item.emoji}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
