'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function PageTabs({ tabs }: { tabs: { label: string; href: string }[] }) {
  const pathname = usePathname()

  return (
    <div style={{ display: 'flex', borderBottom: '2px solid var(--borda)', marginBottom: '1.25rem', gap: '0.25rem', padding: '0 0.25rem' }}>
      {tabs.map(tab => {
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              padding: '0.625rem 1.25rem',
              fontSize: '0.85rem',
              fontWeight: isActive ? 800 : 600,
              color: isActive ? 'var(--texto)' : 'var(--texto-sec)',
              background: isActive ? 'var(--surface)' : 'var(--fundo)',
              border: '2px solid var(--borda)',
              borderBottom: isActive ? '2px solid var(--surface)' : '2px solid var(--borda)',
              borderTopLeftRadius: '6px',
              borderTopRightRadius: '6px',
              textDecoration: 'none',
              transition: 'all 0.1s',
              marginBottom: '-2px', // Overlap bottom border
              zIndex: isActive ? 10 : 1,
              boxShadow: isActive ? 'none' : 'inset 0 -2px 5px rgba(0,0,0,0.02)'
            }}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
