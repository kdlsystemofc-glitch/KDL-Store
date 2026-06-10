'use client'
import React from 'react'

interface EmptyStateProps {
  icon?: string            // emoji ou elemento
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  compact?: boolean        // versão menor para uso dentro de cards
}

export function EmptyState({ icon, title, description, actionLabel, onAction, compact }: EmptyStateProps) {
  if (compact) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '2rem 1rem', gap: '0.5rem', textAlign: 'center',
      }}>
        {icon && <span style={{ fontSize: '2rem', opacity: 0.5 }}>{icon}</span>}
        <p style={{ fontSize: '0.82rem', color: 'var(--texto-desab, #aaa)', margin: 0 }}>{title}</p>
        {actionLabel && onAction && (
          <button onClick={onAction} className="btn btn-secondary" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
            {actionLabel}
          </button>
        )}
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '3.5rem 2rem', gap: '1rem', textAlign: 'center',
      flex: 1, minHeight: '280px',
    }}>
      {icon && (
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: 'var(--surface-alt, #f5f5f5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2.25rem',
          boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.06)',
        }}>
          {icon}
        </div>
      )}
      <div style={{ maxWidth: '320px' }}>
        <p style={{
          fontWeight: 800, fontSize: '1rem', color: 'var(--texto, #111)',
          margin: '0 0 0.375rem',
        }}>{title}</p>
        {description && (
          <p style={{
            fontSize: '0.82rem', color: 'var(--texto-desab, #aaa)',
            lineHeight: '1.55', margin: 0,
          }}>{description}</p>
        )}
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn btn-primary"
          style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
