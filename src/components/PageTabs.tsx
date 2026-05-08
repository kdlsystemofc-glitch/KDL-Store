'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function PageTabs({ tabs }: { tabs: { label: string; href: string }[] }) {
  const pathname = usePathname()

  return (
    <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--borda)', marginBottom: '1.25rem' }}>
      {tabs.map(tab => {
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              padding: '0.625rem 1rem',
              fontSize: '0.875rem',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? 'var(--verde)' : 'var(--texto-sec)',
              borderBottom: isActive ? '2px solid var(--verde)' : '2px solid transparent',
              textDecoration: 'none',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
