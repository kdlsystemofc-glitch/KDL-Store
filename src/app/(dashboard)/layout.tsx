'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, ShoppingCart, Package, Users, BarChart3,
  Shield, FileBarChart2, Settings, Plus, LogOut, Menu, X
} from 'lucide-react'

/* ─ Itens de navegação ─ */
const navItems = [
  { href: '/dashboard',     label: 'Dashboard',        icon: LayoutDashboard },
  { href: '/vendas',        label: 'Histórico de Vendas', icon: ShoppingCart },
  { href: '/produtos',      label: 'Produtos / Estoque',  icon: Package },
  { href: '/clientes',      label: 'Clientes',          icon: Users },
  { href: '/financeiro',    label: 'Financeiro',         icon: BarChart3 },
  { href: '/garantias',     label: 'Ops Extras',         icon: Shield },
  { href: '/relatorios',    label: 'Relatórios',         icon: FileBarChart2 },
  { href: '/configuracoes', label: 'Configurações',      icon: Settings },
]

function Sidebar({
  isOpen, onClose, nomeLoja, inicialUsuario, planoAtivo
}: {
  isOpen: boolean
  onClose: () => void
  nomeLoja: string
  inicialUsuario: string
  planoAtivo: string
}) {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    if (href === '/vendas')    return (pathname === '/vendas' || pathname.startsWith('/vendas/')) && !pathname.includes('/nova')
    if (href === '/produtos')  return pathname.startsWith('/produtos') || pathname.startsWith('/estoque') || pathname.startsWith('/catalogo')
    if (href === '/clientes')  return pathname.startsWith('/clientes') || pathname.startsWith('/fornecedores')
    if (href === '/financeiro') return pathname.startsWith('/financeiro')
    if (href === '/garantias') return pathname.startsWith('/garantias') || pathname.startsWith('/ordens-de-servico') || pathname.startsWith('/comissoes')
    if (href === '/relatorios')    return pathname.startsWith('/relatorios')
    if (href === '/configuracoes') return pathname.startsWith('/configuracoes')
    return pathname === href
  }

  async function handleLogout() {
    await createClient().auth.signOut()
    router.push('/login')
  }

  const linkBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '0.625rem',
    padding: '0.5rem 0.875rem', margin: '1px 0.5rem',
    borderRadius: '10px', textDecoration: 'none',
    fontSize: '0.82rem', fontWeight: 600,
    fontFamily: "'Nunito Sans', sans-serif",
    transition: 'background 0.12s, color 0.12s',
  }

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.5)' }}
          className="lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 lg:static lg:z-auto transition-transform duration-200 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{
          width: '230px',
          background: 'var(--roxo-escuro)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        {/* ── Logo ── */}
        <div style={{
          padding: '1rem 1rem 0.75rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: '2px' }}>
            <span style={{ color: 'var(--verde)', fontWeight: 900, fontSize: '1.4rem', fontFamily: "'Nunito', sans-serif", fontStyle: 'italic' }}>K</span>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', fontFamily: "'Nunito', sans-serif" }}>DL Store</span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(240,235,245,0.4)', padding: '4px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Nome da loja + Plano ── */}
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {nomeLoja}
          </p>
          <span style={{
            display: 'inline-block', marginTop: '4px',
            fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
            padding: '2px 8px', borderRadius: '4px',
            background: planoAtivo === 'pro' ? 'var(--amarelo)' : 'rgba(0,191,165,0.2)',
            color: planoAtivo === 'pro' ? '#fff' : 'var(--verde)',
          }}>
            Plano {planoAtivo === 'pro' ? 'Pro' : 'Start'}
          </span>
        </div>

        {/* ── Botão Nova Venda ── */}
        <div style={{ padding: '0.75rem 0.625rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Link
            href="/vendas/nova"
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              width: '100%', padding: '0.6rem',
              background: 'var(--verde)', color: '#fff',
              fontWeight: 700, fontSize: '0.82rem', borderRadius: 'var(--r-lg)',
              textDecoration: 'none', border: 'none',
              boxShadow: 'var(--sombra-cta)',
              fontFamily: "'Nunito Sans', sans-serif",
              transition: 'transform 0.12s',
            }}
          >
            <Plus size={15} />
            Nova Venda
          </Link>
        </div>

        {/* ── Nav Items ── */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '0.375rem 0' }}>
          {navItems.map(item => {
            const active = isActive(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                style={{
                  ...linkBase,
                  background: active ? 'rgba(0,191,165,0.15)' : 'transparent',
                  color: active ? 'var(--verde)' : 'rgba(240,235,245,0.55)',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                <Icon size={15} style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* ── Rodapé ── */}
        <div style={{
          padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: '0.625rem',
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'var(--verde)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#fff', fontWeight: 800,
            fontSize: '0.78rem', flexShrink: 0, fontFamily: "'Nunito', sans-serif",
          }}>
            {inicialUsuario}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.72rem', color: 'rgba(240,235,245,0.5)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {nomeLoja}
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'rgba(240,235,245,0.3)', padding: '4px', borderRadius: '6px',
              transition: 'color 0.1s',
            }}
            title="Sair"
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(240,235,245,0.3)')}
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>
    </>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [headerInfo, setHeaderInfo] = useState({ inicial: 'U', nomeLoja: 'Carregando...', plano: 'start' })
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
        const { data: empresa } = await supabase.from('empresas').select('nome, plano').eq('id', profile.empresa_id).single()
        setHeaderInfo({
          inicial: (profile.nome || user.email || 'U').charAt(0).toUpperCase(),
          nomeLoja: empresa?.nome || 'Minha Loja',
          plano: empresa?.plano || 'start',
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
        background: 'var(--roxo-escuro)', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '0.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
          <span style={{ color: 'var(--verde)', fontWeight: 900, fontSize: '1.8rem', fontFamily: "'Nunito', sans-serif", fontStyle: 'italic' }}>K</span>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', fontFamily: "'Nunito', sans-serif" }}>DL Store</span>
        </div>
        <p style={{ color: 'rgba(240,235,245,0.4)', fontSize: '0.78rem' }}>Iniciando sistema...</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--fundo)' }}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        nomeLoja={headerInfo.nomeLoja}
        inicialUsuario={headerInfo.inicial}
        planoAtivo={headerInfo.plano}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Header */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: '48px', padding: '0 1.25rem', flexShrink: 0,
          background: 'var(--surface)', borderBottom: '1px solid var(--borda)',
        }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '4px' }}
          >
            <Menu size={18} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: 'auto' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 500 }} className="hidden sm:block">
              {headerInfo.nomeLoja}
            </span>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
