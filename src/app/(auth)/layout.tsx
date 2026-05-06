import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: { default: 'KDL Store', template: '%s | KDL Store' },
  description: 'Sistema de gestão para pequeno comércio',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', sans-serif" }}>

      {/* LEFT — Branding */}
      <div style={{
        width: '42%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '3rem', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(160deg, #0d2218 0%, #14532d 50%, #15803d 100%)'
      }}>
        {/* Dots decorativos */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.06,
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '28px 28px'
        }} />

        {/* Logo */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '46px', height: '46px', background: '#fff', borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
          }}>
            <span style={{ color: '#15803d', fontWeight: 900, fontSize: '1.25rem' }}>K</span>
          </div>
          <div>
            <p style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem', lineHeight: 1 }}>KDL Store</p>
            <p style={{ color: '#86efac', fontSize: '0.72rem', marginTop: '2px' }}>Sistema de Gestão</p>
          </div>
        </div>

        {/* Centro */}
        <div style={{ position: 'relative' }}>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: '2rem', lineHeight: 1.25, marginBottom: '0.75rem' }}>
            Seu negócio<br />
            <span style={{ color: '#86efac' }}>organizado.</span>
          </h1>
          <p style={{ color: '#bbf7d0', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            Controle vendas, estoque, garantias e fornecedores em minutos.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { e: '🛒', t: 'Venda registrada em menos de 30 segundos' },
              { e: '📦', t: 'Estoque atualizado a cada venda' },
              { e: '🛡️', t: 'Garantia digital gerada na hora' },
              { e: '💸', t: 'Fiado, despesas e fechamento integrados' },
            ].map(f => (
              <div key={f.t} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '34px', height: '34px', background: 'rgba(255,255,255,0.15)',
                  borderRadius: '8px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '1rem', flexShrink: 0
                }}>{f.e}</div>
                <span style={{ color: '#dcfce7', fontSize: '0.83rem', fontWeight: 500 }}>{f.t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé depoimento */}
        <div style={{
          position: 'relative', background: 'rgba(255,255,255,0.1)',
          borderRadius: '10px', padding: '1rem', border: '1px solid rgba(255,255,255,0.15)'
        }}>
          <p style={{ color: '#d1fae5', fontSize: '0.82rem', fontStyle: 'italic', lineHeight: 1.5 }}>
            "Antes eu perdia produto sem saber. Agora sei o estoque exato e quanto entrou no dia."
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.625rem' }}>
            <div style={{
              width: '30px', height: '30px', background: '#fff', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 900, color: '#15803d', flexShrink: 0
            }}>J</div>
            <div>
              <p style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>José Aparecido</p>
              <p style={{ color: '#86efac', fontSize: '0.7rem' }}>Loja de eletrônicos — 25 de Março SP</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT — Formulário */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem', background: '#f8f9fa'
      }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>

          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '2rem' }}>
            <div style={{
              width: '36px', height: '36px', background: '#15803d', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: '1rem' }}>K</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1a1a1a' }}>KDL Store</span>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
