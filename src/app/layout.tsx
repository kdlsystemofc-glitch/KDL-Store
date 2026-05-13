import type { Metadata } from 'next'
import './globals.css'

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
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
