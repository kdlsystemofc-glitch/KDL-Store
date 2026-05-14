import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Escolha seu plano | KDL Store',
}

export default function AssinarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Nunito Sans', sans-serif",
      background: 'var(--fundo)',
      padding: '2rem 1rem',
    }}>
      {children}
    </div>
  )
}
