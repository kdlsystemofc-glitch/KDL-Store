import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { default: 'NexoCommerce PDV', template: '%s | NexoCommerce' },
  description: 'Sistema PDV para pequeno comércio — NexoCommerce',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
      background: '#060A06',
      backgroundImage: `repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0,204,68,0.012) 2px,
        rgba(0,204,68,0.012) 4px
      )`,
    }}>

      {/* LEFT — Branding Terminal */}
      <div style={{
        width: '420px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '2.5rem 2rem',
        background: '#030605',
        borderRight: '1px solid #1A3D20',
      }}>
        {/* Logo */}
        <div>
          <p style={{ color: '#00CC44', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.12em', marginBottom: '4px' }}>
            ▓ NEXO PDV
          </p>
          <p style={{ color: '#3D6B44', fontSize: '0.65rem', letterSpacing: '0.06em' }}>
            SISTEMA DE GESTÃO COMERCIAL v2.0
          </p>
        </div>

        {/* Features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <p style={{
              color: '#00CC44', fontSize: '0.85rem', fontWeight: 700,
              letterSpacing: '0.05em', marginBottom: '1rem',
              borderBottom: '1px solid #1A3D20', paddingBottom: '0.5rem',
            }}>
              MÓDULOS DISPONÍVEIS
            </p>
            {[
              ['PDV', 'Frente de caixa — venda em 30s'],
              ['ESTOQUE', 'Controle de entrada e saída'],
              ['FINANCEIRO', 'Fiado, despesas e fechamento'],
              ['GARANTIAS', 'Pós-venda digital'],
              ['RELATÓRIOS', 'Dashboard e analytics'],
            ].map(([mod, desc]) => (
              <div key={mod} style={{
                display: 'flex', gap: '0.875rem', alignItems: 'flex-start',
                padding: '0.5rem 0', borderBottom: '1px solid #0F2614',
              }}>
                <span style={{ color: '#00CC44', fontSize: '0.7rem', fontWeight: 700, width: '80px', flexShrink: 0 }}>
                  {mod}
                </span>
                <span style={{ color: '#7EC882', fontSize: '0.7rem' }}>{desc}</span>
              </div>
            ))}
          </div>

          {/* Depoimento */}
          <div style={{
            border: '1px solid #1A3D20',
            borderLeft: '3px solid #00CC44',
            padding: '0.875rem',
            background: '#0D1F0D',
          }}>
            <p style={{ color: '#7EC882', fontSize: '0.72rem', lineHeight: 1.6, marginBottom: '0.625rem' }}>
              &quot;Antes eu perdia produto sem saber. Agora sei o estoque exato e quanto entrou no dia.&quot;
            </p>
            <p style={{ color: '#3D6B44', fontSize: '0.65rem' }}>
              — José Aparecido · Loja de eletrônicos, SP
            </p>
          </div>
        </div>

        {/* Rodapé */}
        <div style={{ fontSize: '0.6rem', color: '#3D6B44', letterSpacing: '0.06em' }}>
          <p>NexoCommerce PDV © 2026</p>
          <p style={{ marginTop: '2px' }}>● CONEXÃO SEGURA</p>
        </div>
      </div>

      {/* RIGHT — Formulário */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <div style={{ width: '100%', maxWidth: '360px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
