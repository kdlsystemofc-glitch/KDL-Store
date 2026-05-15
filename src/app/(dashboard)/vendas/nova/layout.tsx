import { OperadorOnly } from '@/components/OperadorOnly'
import { ReactNode } from 'react'

export default function NovaVendaLayout({ children }: { children: ReactNode }) {
  return (
    <OperadorOnly fallbackRedirect="/vendas">
      {children}
    </OperadorOnly>
  )
}
