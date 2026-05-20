import { AdminOnly } from '@/components/AdminOnly'
import { ReactNode } from 'react'
import { PageTabs } from '@/components/PageTabs'

export default function ConfiguracoesLayout({ children }: { children: ReactNode }) {
  return (
    <AdminOnly fallbackRedirect="/dashboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <PageTabs
          tabs={[
            { label: 'Geral', href: '/configuracoes' },
            { label: 'Empresa', href: '/configuracoes/empresa' },
            { label: 'Usuários', href: '/configuracoes/usuarios' },
            { label: 'Pagamentos', href: '/configuracoes/pagamentos' },
            { label: 'Categorias', href: '/configuracoes/categorias' },
            { label: 'Planos', href: '/configuracoes/planos' },
          ]}
        />
        <div>{children}</div>
      </div>
    </AdminOnly>
  )
}

