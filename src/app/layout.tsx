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
        <Toaster position="top-right" toastOptions={{ style: { background: 'var(--surface-alt)', color: '#fff', border: '1px solid var(--borda-leve)', fontSize: '0.85rem' } }} />
        {children}
      </body>
    </html>
  )
}
