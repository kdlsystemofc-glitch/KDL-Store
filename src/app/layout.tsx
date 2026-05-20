import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'
import '@/styles/design-tokens.css'

export const metadata: Metadata = {
  title: {
    default: 'KDL Store — Sistema de Gestão para Comércio Brasileiro',
    template: '%s | KDL Store',
  },
  description: 'PDV, estoque, fiado, garantias e CRM em um só lugar. Feito para lojistas da 25 de Março e comércio popular. Comece por R$ 65/mês.',
  keywords: ['pdv', 'gestão de loja', 'controle de estoque', 'ponto de venda', 'comércio popular', '25 de março', 'fiado', 'garantia digital'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Nunito+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: "'Nunito Sans', sans-serif" }}>
        <Toaster
          position="top-right"
          gutter={10}
          toastOptions={{
            duration: 3500,
            style: {
              background: 'rgba(15, 20, 30, 0.92)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              color: '#f0f4f8',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 500,
              padding: '12px 16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
              maxWidth: '380px',
              lineHeight: '1.45',
            },
            success: {
              iconTheme: { primary: '#4ade80', secondary: 'rgba(15,20,30,0.92)' },
              style: {
                background: 'rgba(15, 20, 30, 0.92)',
                border: '1px solid rgba(74,222,128,0.35)',
                color: '#f0f4f8',
              },
            },
            error: {
              iconTheme: { primary: '#f87171', secondary: 'rgba(15,20,30,0.92)' },
              style: {
                background: 'rgba(15, 20, 30, 0.92)',
                border: '1px solid rgba(248,113,113,0.35)',
                color: '#f0f4f8',
              },
            },
          }}
        />
        {children}
      </body>
    </html>
  )
}
