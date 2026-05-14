'use client'

import { useSubscription } from '@/hooks/useSubscription'
import Link from 'next/link'

/**
 * Envolve features exclusivas do plano Pro.
 * Se o plano é Start, mostra overlay com upsell.
 */
export function ProOnly({ children }: { children: React.ReactNode }) {
  const { plano, loading } = useSubscription()

  if (loading) return <>{children}</>
  if (plano === 'pro') return <>{children}</>

  return (
    <div style={{ position: 'relative', minHeight: '200px' }}>
      {/* Conteúdo borrado */}
      <div style={{ filter: 'blur(4px)', pointerEvents: 'none', opacity: 0.4 }}>
        {children}
      </div>

      {/* Overlay de upsell */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(245,243,247,0.85)', borderRadius: 'var(--r-xl)',
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔒</div>
        <p style={{
          fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: '1.1rem',
          color: 'var(--texto)', marginBottom: '0.375rem',
        }}>
          Recurso exclusivo do Plano Pro
        </p>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Faça upgrade para R$ 95/mês e desbloqueie
        </p>
        <Link href="/assinar" style={{
          display: 'inline-block', background: 'var(--verde)', color: '#fff',
          padding: '0.6rem 1.5rem', borderRadius: 'var(--r-lg)',
          fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none',
          boxShadow: 'var(--sombra-cta)',
        }}>
          Upgrade para Pro →
        </Link>
      </div>
    </div>
  )
}
