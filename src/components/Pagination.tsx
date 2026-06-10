'use client'

interface PaginationProps {
  page: number          // página atual (1-based)
  totalPages: number    // total de páginas
  total: number         // total de registros
  pageSize: number      // registros por página
  onPage: (p: number) => void
  loading?: boolean
}

export function Pagination({ page, totalPages, total, pageSize, onPage, loading }: PaginationProps) {
  if (totalPages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  // Gera array de páginas com elipses
  function buildPages(): (number | '...')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | '...')[] = [1]
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i)
    }
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
    return pages
  }

  const pages = buildPages()

  const btnStyle = (active: boolean, disabled?: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    minWidth: '32px', height: '32px', padding: '0 6px',
    border: active
      ? '1px solid var(--verde, #00bfa5)'
      : '1px solid var(--borda, #e0e0e0)',
    borderRadius: '6px',
    background: active ? 'var(--verde, #00bfa5)' : 'transparent',
    color: active ? '#fff' : disabled ? 'var(--texto-desab, #ccc)' : 'var(--texto, #333)',
    fontWeight: active ? 800 : 500,
    fontSize: '0.78rem',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'monospace',
    transition: 'all 0.1s',
    opacity: loading ? 0.6 : 1,
    pointerEvents: loading ? 'none' : undefined,
  })

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: '0.5rem',
      padding: '0.75rem 0',
      borderTop: '1px solid var(--borda, #e0e0e0)',
    }}>
      {/* Contador */}
      <span style={{ fontSize: '0.75rem', color: 'var(--texto-desab, #888)' }}>
        Exibindo {from}–{to} de <strong>{total}</strong> registro{total !== 1 ? 's' : ''}
      </span>

      {/* Botões */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
        {/* Anterior */}
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1 || loading}
          style={btnStyle(false, page === 1)}
        >
          ‹
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: 'var(--texto-desab, #aaa)', fontSize: '0.78rem' }}>…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p as number)}
              disabled={loading}
              style={btnStyle(p === page)}
            >
              {p}
            </button>
          )
        )}

        {/* Próxima */}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages || loading}
          style={btnStyle(false, page === totalPages)}
        >
          ›
        </button>
      </div>
    </div>
  )
}
