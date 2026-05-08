'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, ShoppingCart, Package, TrendingDown, Users, Truck,
  Shield, Wrench, BarChart3, Settings, LogOut, X, Menu, Bell,
  ChevronRight, Zap, DollarSign, UserX, Globe, Award, BookOpen
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const navGroups = [
  {
    label: 'Principal',
    items: [
      { href: '/dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
      { href: '/vendas',     label: 'Histórico de Vendas', icon: ShoppingCart },
      { href: '/produtos',   label: 'Produtos & Estoque', icon: Package },
    ]
  },
  {
    label: 'CRM & Parceiros',
    items: [
      { href: '/clientes',   label: 'Clientes',    icon: Users },
    ]
  },
  {
    label: 'Financeiro',
    items: [
      { href: '/financeiro', label: 'Financeiro',  icon: DollarSign },
    ]
  },
  {
    label: 'Operações Extras',
    items: [
      { href: '/garantias',  label: 'Operações Extras', icon: Wrench },
    ]
  }
]

function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname()
  const router   = useRouter()

  // Define which sub-routes belong to which top-level active state
  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    if (href === '/vendas') return pathname === '/vendas' || pathname.startsWith('/vendas/') && !pathname.includes('/nova')
    if (href === '/produtos') return pathname.startsWith('/produtos') || pathname.startsWith('/estoque') || pathname.startsWith('/catalogo')
    if (href === '/clientes') return pathname.startsWith('/clientes') || pathname.startsWith('/fornecedores')
    if (href === '/financeiro') return pathname.startsWith('/financeiro')
    if (href === '/garantias') return pathname.startsWith('/garantias') || pathname.startsWith('/ordens-de-servico') || pathname.startsWith('/comissoes')
    return pathname === href
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-full flex flex-col lg:static lg:z-auto transition-transform duration-250 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ width: '220px', background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-borda)', flexShrink: 0 }}
      >
        {/* Logo */}
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--sidebar-borda)' }}>
          <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: '34px', height: '34px', background: 'var(--verde)', borderRadius: '4px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: '1rem' }}>N</span>
            </div>
            <div>
              <p style={{ color: '#fff', fontWeight: 800, fontSize: '0.875rem', lineHeight: 1 }}>NexoCommerce</p>
              <p style={{ color: '#4ade80', fontSize: '0.625rem', marginTop: '2px', fontWeight: 600 }}>● Sistema ativo</p>
            </div>
          </Link>
          <button onClick={onClose} className="lg:hidden btn-icon absolute top-3 right-3" style={{ color: 'var(--sidebar-text)' }}>
            <X size={18} />
          </button>
        </div>

        {/* NOVA VENDA — destaque máximo */}
        <div style={{ padding: '0.75rem' }}>
          <Link
            href="/vendas/nova"
            onClick={onClose}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.03em', padding: '0.625rem' }}
          >
            <Zap size={15} fill="currentColor" />
            NOVA VENDA <span className="hidden sm:inline">(F2)</span>
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '0 0.5rem 0.5rem' }}>
          {navGroups.map(group => (
            <div key={group.label}>
              <p className="nav-grupo-label">{group.label}</p>
              {group.items.map(item => {
                const Icon   = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`}
                    href={item.href}
                    onClick={onClose}
                    className={active ? 'nav-link-ativo' : 'nav-link'}
                    style={{ display: 'flex', marginBottom: '2px' }}
                  >
                    <Icon size={15} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {active && <ChevronRight size={13} style={{ opacity: 0.6 }} />}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '0.5rem', borderTop: '1px solid var(--sidebar-borda)' }}>
          <Link
            href="/relatorios"
            className={isActive('/relatorios') ? 'nav-link-ativo' : 'nav-link'}
            style={{ display: 'flex', marginBottom: '2px' }}
          >
            <BarChart3 size={15} /> Relatórios
          </Link>
          <Link
            href="/configuracoes"
            className={isActive('/configuracoes') ? 'nav-link-ativo' : 'nav-link'}
            style={{ display: 'flex', marginBottom: '2px' }}
          >
            <Settings size={15} /> Configurações
          </Link>
          <button
            onClick={handleLogout}
            className="nav-link"
            style={{ display: 'flex', width: '100%', color: '#f87171', cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit' }}
          >
            <LogOut size={15} /> Sair da conta
          </button>
        </div>
      </aside>
    </>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [headerInfo, setHeaderInfo] = useState({ inicial: 'U', nomeLoja: 'Carregando...' })
  const router = useRouter()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Realtime: detecta congelamento ou exclusão e faz logout imediato
  useEffect(() => {
    const supabase = createClient()
    let userId = ''
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      userId = user.id

      // Busca o nome do profile e da empresa para o Header
      const { data: profile } = await supabase.from('profiles').select('nome, empresa_id').eq('id', userId).single()
      if (profile && profile.empresa_id) {
        const { data: empresa } = await supabase.from('empresas').select('nome').eq('id', profile.empresa_id).single()
        setHeaderInfo({
          inicial: (profile.nome || user.email || 'U').charAt(0).toUpperCase(),
          nomeLoja: empresa?.nome || 'Minha Loja'
        })
      }

      const channel = supabase
        .channel('profile-status-' + userId)
        .on('postgres_changes', {
          event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}`
        }, async (payload) => {
          const novo = payload.new as { status?: string; empresa_id?: string | null }
          if (novo.status === 'congelado' || novo.status === 'excluido' || !novo.empresa_id) {
            await supabase.auth.signOut()
            router.push('/login')
          }
        })
        .on('postgres_changes', {
          event: 'DELETE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}`
        }, async () => {
          await supabase.auth.signOut()
          router.push('/login')
        })
        .subscribe()
      return () => { supabase.removeChannel(channel) }
    })
  }, [])

  if (!isMounted) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', background: 'var(--fundo)', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--texto-desab)' }}>Carregando sistema...</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--fundo)' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Header */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: '48px', padding: '0 1rem', flexShrink: 0,
          background: 'var(--surface)', borderBottom: '2px solid var(--borda)',
        }}>
          <button onClick={() => setSidebarOpen(true)} className="btn-icon lg:hidden">
            <Menu size={20} style={{ color: 'var(--texto)' }} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' }}>
            <button className="btn-icon" style={{ position: 'relative' }} onClick={() => alert('Nenhuma nova notificação no momento.')}>
              <Bell size={18} style={{ color: 'var(--texto-sec)' }} />
              <span style={{
                position: 'absolute', top: '4px', right: '4px',
                width: '7px', height: '7px', borderRadius: '50%',
                background: 'var(--vermelho)', border: '1px solid var(--surface)'
              }} />
            </button>
            <div style={{ width: '1px', height: '20px', background: 'var(--borda)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <div style={{
                width: '30px', height: '30px', borderRadius: '50%',
                background: 'var(--verde)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.75rem'
              }}>
                {headerInfo.inicial}
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--texto-sec)' }} className="hidden sm:block">
                {headerInfo.nomeLoja}
              </span>
            </div>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: '1.125rem 1.25rem' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
