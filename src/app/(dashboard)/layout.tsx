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
  isOpen, onClose, nomeLoja, inicialUsuario
}: {
  isOpen: boolean
  onClose: () => void
  nomeLoja: string
  inicialUsuario: string
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
          width: '220px',
          background: '#1a2535',
          borderRight: '1px solid #0f1720',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        {/* ── Logo / Nome do Sistema ── */}
        <div style={{
          padding: '1rem',
          borderBottom: '1px solid #0f1720',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Link href="/dashboard" style={{ textDecoration: 'none', display: 'block' }}>
            <p style={{
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '1rem',
              letterSpacing: '0.04em',
              lineHeight: 1.1,
              fontFamily: "'Inter', Arial, sans-serif",
            }}>
              NexoCommerce
            </p>
            <p style={{
              color: '#5a7a9a',
              fontSize: '0.68rem',
              marginTop: '2px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '160px',
            }}>
              {nomeLoja}
            </p>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden"
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#5a7a9a', padding: '4px',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Botão Nova Venda — destaque máximo ── */}
        <div style={{ padding: '0.75rem', borderBottom: '1px solid #0f1720' }}>
          <Link
            href="/vendas/nova"
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.6rem',
              background: '#1a7a3c',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.82rem',
              borderRadius: '4px',
              textDecoration: 'none',
              border: '1px solid #155f30',
              boxShadow: '0 2px 0 #0f4d25',
              transition: 'background 0.12s',
              fontFamily: "'Inter', Arial, sans-serif",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#155f30')}
            onMouseLeave={e => (e.currentTarget.style.background = '#1a7a3c')}
          >
            <Plus size={15} />
            Nova Venda
          </Link>
        </div>

        {/* ── Nav Items ── */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0' }}>
          {navItems.map(item => {
            const active = isActive(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={active ? 'nav-link-ativo' : 'nav-link'}
              >
                <Icon size={15} style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* ── Rodapé ── */}
        <div style={{
          padding: '0.75rem',
          borderTop: '1px solid #0f1720',
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
        }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '50%',
            background: '#1a7a3c', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#fff', fontWeight: 700,
            fontSize: '0.75rem', flexShrink: 0,
          }}>
            {inicialUsuario}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.72rem', color: '#b8c5d6', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {nomeLoja}
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#5a7a9a', padding: '4px', borderRadius: '3px',
              transition: 'color 0.1s',
            }}
            title="Sair"
            onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#5a7a9a')}
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
        background: '#1a2535', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '0.5rem',
      }}>
        <p style={{ color: '#ffffff', fontSize: '1rem', fontWeight: 800, fontFamily: 'Inter, Arial, sans-serif' }}>NexoCommerce</p>
        <p style={{ color: '#5a7a9a', fontSize: '0.78rem', fontFamily: 'Inter, Arial, sans-serif' }}>Iniciando sistema...</p>
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
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Header */}
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '44px',
          padding: '0 1rem',
          flexShrink: 0,
          background: '#1a2535',
          borderBottom: '1px solid #0f1720',
        }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#b8c5d6', padding: '4px' }}
          >
            <Menu size={18} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: 'auto' }}>
            <span style={{ fontSize: '0.75rem', color: '#5a7a9a', fontFamily: 'Inter, Arial, sans-serif' }} className="hidden sm:block">
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
