import type { Metadata } from 'next'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

export const metadata: Metadata = { title: 'Financeiro — Visão Geral' }

const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']
const receitas  = [9200, 11400, 8700, 13200, 15800, 13150]
const despesas  = [4100, 4800, 4200, 5100, 4800, 4200]
const lucros    = receitas.map((r, i) => r - despesas[i])
const maxVal    = Math.max(...receitas)

const dreAtual = {
  periodoLabel: 'Maio 2026',
  receitaVendas: 15800,
  cmv: 6900,
  brindes: 320,
  lucroBruto: 8580,
  despesasOp: 4200,
  lucroLiquido: 4380,
  margem: 27.7,
}

const categoriasDespesa = [
  { nome: 'Aluguel', valor: 1800, tipo: 'Fixa' },
  { nome: 'Funcionários', valor: 1200, tipo: 'Fixa' },
  { nome: 'Energia / Internet', valor: 420, tipo: 'Fixa' },
  { nome: 'Compra de mercadoria extra', valor: 580, tipo: 'Variável' },
  { nome: 'Comissões (puxadores)', valor: 200, tipo: 'Variável' },
]

export default function FinanceiroPage() {
  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">💸 Financeiro</h1>
          <p className="pg-sub">DRE simplificado — saúde financeira do negócio</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link href="/financeiro/despesas" className="btn btn-secondary">+ Lançar Despesa</Link>
          <Link href="/financeiro/fechamento" className="btn btn-primary">🔒 Fechar Período</Link>
        </div>
      </div>

      {/* Seletor de período */}
      <div style={{ display: 'flex', gap: '0.375rem', padding: '0.375rem', background: 'var(--surface)', border: '1px solid var(--borda)', borderRadius: 'var(--radius)', width: 'fit-content' }}>
        {['Hoje', 'Semana', 'Quinzena', 'Mês', 'Ano'].map((p, i) => (
          <button key={p} style={{
            padding: '0.3rem 0.875rem', borderRadius: 'var(--radius-sm)',
            fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', border: 'none',
            background: i === 3 ? 'var(--verde)' : 'transparent',
            color: i === 3 ? '#fff' : 'var(--texto-sec)',
          }}>{p}</button>
        ))}
      </div>

      {/* DRE — mês atual */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '0.875rem' }}>
        <div>
          <div className="sec-header">
            <span>📋 DRE — {dreAtual.periodoLabel}</span>
            <span style={{ color: '#8fa3bf', fontWeight: 400 }}>Demonstrativo de Resultado</span>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--borda)', borderTop: 'none', borderRadius: '0 0 5px 5px' }}>
            {[
              { label: 'Receita Total de Vendas', valor: dreAtual.receitaVendas, cor: 'var(--verde)', bold: false, indent: false },
              { label: '(-) Custo das Mercadorias (CMV)', valor: -dreAtual.cmv, cor: 'var(--vermelho)', bold: false, indent: true },
              { label: '(-) Brindes concedidos', valor: -dreAtual.brindes, cor: 'var(--amarelo)', bold: false, indent: true },
              { label: '= Lucro Bruto', valor: dreAtual.lucroBruto, cor: 'var(--verde)', bold: true, indent: false, sep: true },
              { label: '(-) Despesas Operacionais', valor: -dreAtual.despesasOp, cor: 'var(--vermelho)', bold: false, indent: true },
              { label: '= Lucro Líquido', valor: dreAtual.lucroLiquido, cor: 'var(--verde)', bold: true, indent: false, sep: true, big: true },
            ].map((row, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: `${row.big ? '1rem' : '0.625rem'} 1rem`,
                borderTop: row.sep ? '2px solid var(--borda)' : '1px solid var(--borda-leve)',
                background: row.big ? 'var(--verde-claro)' : 'transparent',
                paddingLeft: row.indent ? '1.75rem' : '1rem',
              }}>
                <span style={{ fontSize: row.big ? '1rem' : '0.875rem', fontWeight: row.bold ? 800 : 500, color: 'var(--texto)' }}>
                  {row.label}
                </span>
                <span style={{ fontSize: row.big ? '1.5rem' : '0.95rem', fontWeight: row.bold ? 900 : 600, color: row.cor, fontFamily: 'monospace' }}>
                  {formatCurrency(Math.abs(row.valor))}
                </span>
              </div>
            ))}
            <div style={{ padding: '0.5rem 1rem', background: '#f7f7f7', borderTop: '1px solid var(--borda-leve)', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--texto-sec)', fontWeight: 600 }}>Margem de Lucro</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: dreAtual.margem >= 20 ? 'var(--verde)' : 'var(--vermelho)' }}>
                {dreAtual.margem.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Despesas por categoria */}
        <div>
          <div className="sec-header">
            <span>💸 Despesas por Categoria</span>
            <Link href="/financeiro/despesas" style={{ color: '#8fa3bf', fontSize: '0.7rem', textDecoration: 'none' }}>Ver tudo</Link>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--borda)', borderTop: 'none', borderRadius: '0 0 5px 5px' }}>
            {categoriasDespesa.map((c, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.625rem 0.875rem',
                borderBottom: i < categoriasDespesa.length - 1 ? '1px solid var(--borda-leve)' : 'none',
              }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.nome}</p>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: c.tipo === 'Fixa' ? 'var(--azul)' : 'var(--amarelo)' }}>
                    {c.tipo}
                  </span>
                </div>
                <span style={{ fontWeight: 800, color: 'var(--vermelho)', fontFamily: 'monospace' }}>
                  {formatCurrency(c.valor)}
                </span>
              </div>
            ))}
            <div style={{ padding: '0.625rem 0.875rem', borderTop: '2px solid var(--borda)', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 800 }}>Total Despesas</span>
              <span style={{ fontWeight: 900, color: 'var(--vermelho)', fontFamily: 'monospace' }}>
                {formatCurrency(categoriasDespesa.reduce((a,c)=>a+c.valor,0))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico histórico */}
      <div className="card">
        <div className="sec-header" style={{ borderRadius: '5px 5px 0 0', margin: '-1rem -1.125rem 1rem' }}>
          <span>📊 Histórico — Receita × Despesa × Lucro</span>
          <span style={{ color: '#8fa3bf', fontWeight: 400, fontSize: '0.7rem' }}>Últimos 6 meses</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
          {[['var(--verde)', 'Receita'], ['var(--vermelho)', 'Despesa'], ['var(--azul)', 'Lucro']].map(([c,l]) => (
            <span key={l} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--texto-sec)' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: c as string, display: 'inline-block' }} />
              {l}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5rem', height: '140px' }}>
          {meses.map((m, i) => (
            <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '120px' }}>
                {[
                  { val: receitas[i], cor: 'var(--verde)' },
                  { val: despesas[i], cor: 'var(--vermelho)' },
                  { val: lucros[i],   cor: 'var(--azul)' },
                ].map((bar, j) => (
                  <div key={j} style={{
                    width: '16px', borderRadius: '2px 2px 0 0',
                    height: `${(bar.val/maxVal)*100}%`,
                    background: bar.cor, minHeight: '4px'
                  }} />
                ))}
              </div>
              <span style={{ fontSize: '0.65rem', color: 'var(--texto-desab)', fontWeight: 700 }}>{m}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
