'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Menu } from 'lucide-react'

/* ─ Dados de navegação ─ */
const navItems = [
  { href: '/dashboard',       label: 'DASHBOARD',       prefix: '▶' },
  { href: '/vendas',          label: 'HISTÓRICO',        prefix: '■' },
  { href: '/produtos',        label: 'PRODUTOS/ESTOQUE', prefix: '■' },
  { href: '/clientes',        label: 'CLIENTES',         prefix: '■' },
  { href: '/financeiro',      label: 'FINANCEIRO',       prefix: '■' },
  { href: '/garantias',       label: 'OPS EXTRAS',       prefix: '■' },
  { href: '/relatorios',      label: 'RELATÓRIOS',       prefix: '■' },
  { href: '/configuracoes',   label: 'CONFIGURAÇÕES',    prefix: '■' },
]

function Clock() {
  const [now, setNow] = useState('')
  useEffect(() => {
    const fmt = () => {
      const d = new Date()
      const dd = String(d.getDate()).padStart(2,'0')
      const mm = String(d.getMonth()+1).padStart(2,'0')
      const yyyy = d.getFullYear()
      const hh = String(d.getHours()).padStart(2,'0')
      const min = String(d.getMinutes()).padStart(2,'0')
      const ss = String(d.getSeconds()).padStart(2,'0')
      setNow(`${dd}/${mm}/${yyyy}  ${hh}:${min}:${ss}`)
    }
    fmt()
    const id = setInterval(fmt, 1000)
    return () => clearInterval(id)
  }, [])
  return <span style={{ fontVariantNumeric:'tabular-nums', letterSpacing:'0.04em' }}>{now}</span>
}

function Sidebar({ isOpen, onClose, nomeLoja }: { isOpen: boolean; onClose: () => void; nomeLoja: string }) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    if (href === '/vendas')    return (pathname === '/vendas' || pathname.startsWith('/vendas/')) && !pathname.includes('/nova')
    if (href === '/produtos')  return pathname.startsWith('/produtos') || pathname.startsWith('/estoque') || pathname.startsWith('/catalogo')
    if (href === '/clientes')  return pathname.startsWith('/clientes') || pathname.startsWith('/fornecedores')
    if (href === '/financeiro')return pathname.startsWith('/financeiro')
    if (href === '/garantias') return pathname.startsWith('/garantias') || pathname.startsWith('/ordens-de-servico') || pathname.startsWith('/comissoes')
    if (href === '/relatorios')    return pathname.startsWith('/relatorios')
    if (href === '/configuracoes') return pathname.startsWith('/configuracoes')
    return pathname === href
  }

  const sidebarStyle: React.CSSProperties = {
    width: '220px',
    background: 'var(--fundo-painel)',
    borderRight: '1px solid var(--borda-forte)',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  }

  return (
    <>
      {/* overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 lg:static lg:z-auto transition-transform duration-200 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={sidebarStyle}
      >
        {/* ─ LOGO / NOME DO SISTEMA ─ */}
        <div style={{
          padding: '0.875rem 1rem 0.75rem',
          borderBottom: '1px solid var(--borda-forte)',
          background: '#030605',
        }}>
          <Link href="/dashboard" style={{ textDecoration: 'none', display: 'block' }}>
            <p style={{
              color: 'var(--verde)',
              fontWeight: 700,
              fontSize: '0.95rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              lineHeight: 1.1,
            }}>
              ▓ NEXO PDV
            </p>
            <p style={{
              color: 'var(--texto-desab)',
              fontSize: '0.65rem',
              marginTop: '3px',
              letterSpacing: '0.04em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {nomeLoja}
            </p>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden btn-icon"
            style={{ position: 'absolute', top: '10px', right: '10px', color: 'var(--texto-desab)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ─ BOTÃO NOVA VENDA — F2 ─ */}
        <div style={{ padding: '0.625rem 0.75rem', borderBottom: '1px solid var(--borda)' }}>
          <Link
            href="/vendas/nova"
            onClick={onClose}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem', padding: '0.5rem' }}
          >
            ⚡ NOVA VENDA
          </Link>
        </div>

        {/* ─ NAV ITEMS ─ */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '0.375rem 0' }}>
          {navItems.map(item => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={active ? 'nav-link-ativo' : 'nav-link'}
                style={{ display: 'flex', marginBottom: '1px' }}
              >
                <span style={{ opacity: active ? 1 : 0.5, fontSize: '0.65rem', flexShrink: 0, width: '14px' }}>
                  {active ? '▶' : item.prefix}
                </span>
                <span style={{ flex: 1, fontSize: '0.73rem' }}>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* ─ RODAPÉ — clock + status ─ */}
        <div style={{
          padding: '0.625rem 0.875rem',
          borderTop: '1px solid var(--borda-forte)',
          background: '#030605',
          fontSize: '0.65rem',
          color: 'var(--texto-desab)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          <div style={{ marginBottom: '3px' }}>
            <Clock />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ color: 'var(--verde)', fontSize: '0.55rem' }}>●</span>
            <span style={{ color: 'var(--verde)', fontWeight: 700 }}>SISTEMA ATIVO</span>
          </div>
        </div>
      </aside>
    </>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMounted,   setIsMounted]   = useState(false)
  const [headerInfo,  setHeaderInfo]  = useState({ inicial: 'U', nomeLoja: 'Carregando...' })
  const router = useRouter()

  useEffect(() => { setIsMounted(true) }, [])

  /* Realtime: detecta congelamento ou exclusão */
  useEffect(() => {
    const supabase = createClient()
    let userId = ''
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      userId = user.id

      const { data: profile } = await supabase.from('profiles').select('nome, empresa_id').eq('id', userId).single()
      if (profile?.empresa_id) {
        const { data: empresa } = await supabase.from('empresas').select('nome').eq('id', profile.empresa_id).single()
        setHeaderInfo({
          inicial:  (profile.nome || user.email || 'U').charAt(0).toUpperCase(),
          nomeLoja: empresa?.nome || 'Minha Loja',
        })
      }

      const channel = supabase
        .channel('profile-status-' + userId)
        .on('postgres_changes', {
          event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}`,
        }, async (payload) => {
          const novo = payload.new as { status?: string; empresa_id?: string | null }
          if (novo.status === 'congelado' || novo.status === 'excluido' || !novo.empresa_id) {
            await supabase.auth.signOut()
            router.push('/login')
          }
        })
        .on('postgres_changes', {
          event: 'DELETE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}`,
        }, async () => {
          await supabase.auth.signOut()
          router.push('/login')
        })
        .subscribe()
      return () => { supabase.removeChannel(channel) }
    })
  }, [])  // eslint-disable-line

  if (!isMounted) {
    return (
      <div style={{
        display: 'flex', height: '100vh', width: '100vw',
        background: 'var(--fundo)', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '0.5rem',
      }}>
        <p style={{ color: 'var(--verde)', fontSize: '0.8rem', letterSpacing: '0.08em' }}>NEXO PDV</p>
        <p style={{ color: 'var(--texto-desab)', fontSize: '0.7rem' }}>Iniciando sistema<span className="blink">_</span></p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--fundo)' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} nomeLoja={headerInfo.nomeLoja} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Header */}
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '40px',
          padding: '0 1rem',
          flexShrink: 0,
          background: '#030605',
          borderBottom: '1px solid var(--borda-forte)',
        }}>
          <button onClick={() => setSidebarOpen(true)} className="btn-icon lg:hidden">
            <Menu size={18} style={{ color: 'var(--verde)' }} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: 'auto' }}>
            {/* nome da loja */}
            <span style={{ fontSize: '0.7rem', color: 'var(--texto-desab)', letterSpacing: '0.04em' }} className="hidden sm:block">
              {headerInfo.nomeLoja}
            </span>
            <div style={{ width: '1px', height: '16px', background: 'var(--borda)' }} />
            {/* Avatar */}
            <div style={{
              width: '26px', height: '26px', borderRadius: '1px',
              background: 'var(--verde)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#060A06', fontWeight: 800, fontSize: '0.7rem',
            }}>
              {headerInfo.inicial}
            </div>
            {/* Logout */}
            <button
              onClick={async () => {
                const s = createClient()
                await s.auth.signOut()
                router.push('/login')
              }}
              className="btn-ghost"
              style={{ fontSize: '0.65rem', padding: '0.25rem 0.5rem', color: 'var(--texto-desab)' }}
            >
              SAIR
            </button>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.125rem' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
