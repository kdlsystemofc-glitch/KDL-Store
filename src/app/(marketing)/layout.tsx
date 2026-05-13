import type { Metadata } from 'next'
import './landing.css'

export const metadata: Metadata = {
  title: 'KDL Store — Sistema de Gestão para Comércio Brasileiro',
  description: 'PDV, estoque, fiado, garantias e CRM em um só lugar. Feito para lojistas da 25 de Março e comércio popular. Comece por R$ 65/mês.',
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
