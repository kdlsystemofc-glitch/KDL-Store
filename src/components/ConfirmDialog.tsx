'use client'
import { useEffect, useRef } from 'react'
import { AlertTriangle, Trash2, X } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  // Foca no botão cancelar ao abrir (safe default)
  useEffect(() => {
    if (open) setTimeout(() => cancelRef.current?.focus(), 50)
  }, [open])

  // Fecha com ESC
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onCancel])

  if (!open) return null

  const accentColor = danger ? 'var(--vermelho, #e74c3c)' : 'var(--verde, #00bfa5)'
  const Icon = danger ? Trash2 : AlertTriangle

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div
        className="anim-pop"
        style={{
          background: 'var(--surface, #fff)',
          border: `1px solid var(--borda, #e0e0e0)`,
          borderTop: `3px solid ${accentColor}`,
          borderRadius: 'var(--radius, 8px)',
          padding: '1.5rem',
          width: '100%',
          maxWidth: '400px',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {/* Ícone + Título */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <div style={{
            flexShrink: 0,
            width: '40px', height: '40px', borderRadius: '50%',
            background: danger ? 'rgba(231,76,60,0.1)' : 'rgba(0,191,165,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: accentColor,
          }}>
            <Icon size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--texto, #111)', margin: 0 }}>
              {title}
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--texto-sec, #666)', marginTop: '0.375rem', lineHeight: '1.5' }}>
              {message}
            </p>
          </div>
          <button
            onClick={onCancel}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--texto-desab, #aaa)', padding: '2px', flexShrink: 0 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Botões */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            ref={cancelRef}
            onClick={onCancel}
            disabled={loading}
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem' }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="btn btn-primary"
            style={{
              fontSize: '0.82rem',
              background: danger ? accentColor : undefined,
              borderColor: danger ? accentColor : undefined,
              opacity: loading ? 0.7 : 1,
              display: 'flex', alignItems: 'center', gap: '0.375rem',
            }}
          >
            {loading ? (
              <>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                Aguarde...
              </>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
