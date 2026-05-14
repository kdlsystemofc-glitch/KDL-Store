import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: { default: 'KDL Store', template: '%s | KDL Store' },
  description: 'Sistema de gestão para o comércio popular brasileiro.',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      fontFamily: "'Nunito Sans', sans-serif",
      background: 'var(--fundo)',
    }}>

      {/* LEFT — Branding roxo */}
      <div style={{
        width: '440px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '2.5rem 2.25rem',
        background: 'var(--roxo-escuro)',
      }}>
        {/* Logo */}
        <div>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'baseline', gap: '2px' }}>
            <span style={{ color: 'var(--verde)', fontWeight: 900, fontSize: '1.6rem', fontFamily: "'Nunito', sans-serif", fontStyle: 'italic' }}>K</span>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem', fontFamily: "'Nunito', sans-serif" }}>DL Store</span>
          </Link>
          <p style={{ color: 'rgba(240,235,245,0.4)', fontSize: '0.78rem', marginTop: '4px' }}>
            Gestão mais simples, negócios mais felizes.
          </p>
        </div>

        {/* Features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <p style={{
              color: 'rgba(240,235,245,0.5)', fontSize: '0.68rem', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.1em',
              marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)',
              paddingBottom: '0.5rem',
            }}>
              Módulos disponíveis
            </p>
            {[
              ['📦', 'PDV',        'Frente de caixa — venda em 30s'],
              ['📊', 'Estoque',    'Controle em tempo real'],
              ['💰', 'Financeiro', 'Fiado, despesas e fechamento'],
              ['🛡️', 'Garantias',  'Pós-venda digital com QR Code'],
              ['📱', 'Catálogo',   'Vitrine online compartilhável'],
            ].map(([icon, mod, desc]) => (
              <div key={mod} style={{
                display: 'flex', gap: '0.75rem', alignItems: 'center',
                padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}>
                <span style={{ fontSize: '1rem', width: '24px', textAlign: 'center' }}>{icon}</span>
                <div>
                  <span style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 700 }}>{mod}</span>
                  <span style={{ color: 'rgba(240,235,245,0.4)', fontSize: '0.75rem', marginLeft: '0.5rem' }}>{desc}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Depoimento */}
          <div style={{
            borderLeft: '3px solid var(--verde)',
            padding: '1rem',
            background: 'rgba(0,191,165,0.06)',
            borderRadius: '0 var(--r-lg) var(--r-lg) 0',
          }}>
            <p style={{ color: 'var(--sobre-escuro)', fontSize: '0.82rem', lineHeight: 1.7, marginBottom: '0.5rem' }}>
              &quot;Antes eu perdia produto sem saber. Agora sei o estoque exato e quanto entrou no dia.&quot;
            </p>
            <p style={{ color: 'rgba(240,235,245,0.4)', fontSize: '0.72rem' }}>
              — Carlos M. · Loja de Som Automotivo, SP
            </p>
          </div>
        </div>

        {/* Rodapé */}
        <div style={{ fontSize: '0.68rem', color: 'rgba(240,235,245,0.3)' }}>
          <p>KDL Store © 2026</p>
          <p style={{ marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: 'var(--verde)', fontSize: '0.5rem' }}>●</span> Conexão segura
          </p>
        </div>
      </div>

      {/* RIGHT — Formulário */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'var(--fundo)',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '400px',
          background: 'var(--surface)',
          border: '1px solid var(--borda)',
          borderRadius: 'var(--r-xl)',
          padding: '2.25rem',
          boxShadow: 'var(--sombra-sm)',
        }}>
          {children}
        </div>
      </div>
    </div>
  )
}
