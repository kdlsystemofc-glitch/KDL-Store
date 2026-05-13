'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function PageTabs({ tabs }: { tabs: { label: string; href: string }[] }) {
  const pathname = usePathname()

  return (
    <div style={{ display: 'flex', borderBottom: '2px solid var(--borda)', marginBottom: '0.75rem', gap: '0' }}>
      {tabs.map(tab => {
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              padding: '0.45rem 0.875rem',
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: isActive ? 'var(--verde)' : 'var(--texto-desab)',
              background: isActive ? 'var(--surface)' : 'transparent',
              border: 'none',
              borderBottom: isActive ? '2px solid var(--verde)' : '2px solid transparent',
              textDecoration: 'none',
              transition: 'color 0.1s, border-color 0.1s',
              marginBottom: '-2px',
              whiteSpace: 'nowrap',
            }}
          >
            {isActive ? '▶ ' : ''}{tab.label.toUpperCase()}
          </Link>
        )
      })}
    </div>
  )
}
