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
      fontFamily: "'Inter', Arial, Helvetica, sans-serif",
      background: '#f0f2f5',
    }}>

      {/* LEFT — Branding */}
      <div style={{
        width: '420px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '2.5rem 2rem',
        background: '#1a2535',
      }}>
        {/* Logo */}
        <div>
          <p style={{ color: '#ffffff', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '0.02em', marginBottom: '4px' }}>
            NexoCommerce
          </p>
          <p style={{ color: '#5a7a9a', fontSize: '0.78rem' }}>
            Sistema de Gestão para Varejo
          </p>
        </div>

        {/* Features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <p style={{
              color: '#b8c5d6', fontSize: '0.72rem', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              marginBottom: '1rem', borderBottom: '1px solid #253347',
              paddingBottom: '0.5rem',
            }}>
              Módulos disponíveis
            </p>
            {[
              ['PDV',        'Frente de caixa — venda em 30s'],
              ['Estoque',    'Controle de entrada e saída'],
              ['Financeiro', 'Fiado, despesas e fechamento'],
              ['Garantias',  'Pós-venda digital'],
              ['Relatórios', 'Dashboard e analytics'],
            ].map(([mod, desc]) => (
              <div key={mod} style={{
                display: 'flex', gap: '0.875rem', alignItems: 'flex-start',
                padding: '0.55rem 0', borderBottom: '1px solid #1e2e40',
              }}>
                <span style={{ color: '#1a7a3c', fontSize: '0.75rem', fontWeight: 700, width: '80px', flexShrink: 0 }}>
                  {mod}
                </span>
                <span style={{ color: '#7a9ab8', fontSize: '0.75rem' }}>{desc}</span>
              </div>
            ))}
          </div>

          {/* Depoimento */}
          <div style={{
            border: '1px solid #253347',
            borderLeft: '3px solid #1a7a3c',
            padding: '0.875rem',
            background: '#1e2e40',
            borderRadius: '3px',
          }}>
            <p style={{ color: '#b8c5d6', fontSize: '0.78rem', lineHeight: 1.6, marginBottom: '0.5rem' }}>
              &quot;Antes eu perdia produto sem saber. Agora sei o estoque exato e quanto entrou no dia.&quot;
            </p>
            <p style={{ color: '#5a7a9a', fontSize: '0.72rem' }}>
              — José Aparecido · Loja de eletrônicos, SP
            </p>
          </div>
        </div>

        {/* Rodapé */}
        <div style={{ fontSize: '0.68rem', color: '#5a7a9a' }}>
          <p>NexoCommerce PDV © 2026</p>
          <p style={{ marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#1a7a3c', fontSize: '0.5rem' }}>●</span> Conexão segura
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
        background: '#f0f2f5',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '380px',
          background: '#ffffff',
          border: '1px solid #e0e0e0',
          borderRadius: '6px',
          padding: '2rem',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}>
          {children}
        </div>
      </div>
    </div>
  )
}
