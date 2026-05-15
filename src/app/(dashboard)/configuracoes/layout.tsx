import { AdminOnly } from '@/components/AdminOnly'
import { ReactNode } from 'react'

export default function ConfiguracoesLayout({ children }: { children: ReactNode }) {
  return (
    <AdminOnly fallbackRedirect="/dashboard">
      {children}
    </AdminOnly>
  )
}
