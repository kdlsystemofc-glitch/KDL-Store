import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'NexoCommerce — Gestão para Pequeno Comércio',
    template: '%s | NexoCommerce',
  },
  description: 'Sistema completo de gestão para pequenas lojas: estoque, vendas, garantias, fornecedores e muito mais.',
  keywords: ['gestão de loja', 'controle de estoque', 'pdv', 'ponto de venda', 'pequeno comércio'],
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
