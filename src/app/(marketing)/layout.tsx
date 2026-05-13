import type { Metadata } from 'next'
import './landing.css'

export const metadata: Metadata = {
  title: 'KDL Store — Sistema de Gestão para Lojistas',
  description: 'PDV, estoque, fiado, garantias e CRM em um só lugar. Feito para o comércio popular brasileiro. Comece por R$ 65/mês.',
  keywords: ['pdv','gestão de loja','controle de estoque','comércio popular','fiado','garantia digital','crm','puxador'],
  openGraph: {
    title: 'KDL Store — Sistema de Gestão para Lojistas',
    description: 'PDV, estoque, fiado, garantias e CRM em um só lugar. Feito para o comércio popular brasileiro.',
    type: 'website',
  }
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
