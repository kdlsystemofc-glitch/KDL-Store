'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef, createContext, useCallback, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, ShoppingCart, Package, Users, BarChart3,
  Shield, FileBarChart2, Settings, Plus, LogOut, Menu, X, Lock, Bell,
} from 'lucide-react'
import { OperadorOnly } from '@/components/OperadorOnly'
import { useNotifications } from '@/hooks/useNotifications'

/* ─ Contexto de Permissões para operadores ─ */
export const PermissionsContext = createContext<{
  papel: string
  permissoes: Record<string, 'read' | 'write' | 'none'>
  temPermissao: (modulo: string, acao?: 'read' | 'write') => boolean
}>({
  papel: '',
  permissoes: {},
  temPermissao: () => true
})

/* ─ Itens de navegação por plano ─ */

// ── Módulos disponíveis para AMBOS os planos ──
const baseItems = [
  { href: '/dashboard',     label: 'Dashboard',           icon: LayoutDashboard, modulo: 'dashboard' },
  { href: '/vendas',        label: 'Histórico de Vendas', icon: ShoppingCart, modulo: 'vendas' },
  { href: '/produtos',      label: 'Produtos / Estoque',  icon: Package, modulo: 'produtos' },
  { href: '/clientes',      label: 'Clientes e Fornecedores', icon: Users, modulo: 'clientes' },
  { href: '/financeiro',    label: 'Financeiro',          icon: BarChart3, modulo: 'financeiro' },
  { href: '/garantias',     label: 'Ops Extras',          icon: Shield, modulo: 'garantias' },
]

// ── Módulos EXCLUSIVOS do plano Pro ──
const proItems = [
  { href: '/relatorios',    label: 'Relatórios',          icon: FileBarChart2, modulo: 'relatorios' },
]

function Sidebar({
  isOpen, onClose, nomeLoja, inicialUsuario, planoAtivo, papel, nomeUsuario, permissoes
}: {
  isOpen: boolean
  onClose: () => void
  nomeLoja: string
  inicialUsuario: string
  planoAtivo: string
  papel: string
  nomeUsuario: string
  permissoes: Record<string, 'read' | 'write' | 'none'>
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

  const configItem = { href: '/configuracoes', label: 'Configurações', icon: Settings, modulo: 'configuracoes' }

  const itensSidebar = [...baseItems, ...proItems, configItem].filter(item => {
    if (item.href === '/configuracoes' && papel !== 'admin') return false
    if (papel === 'operador' && item.modulo && permissoes[item.modulo] === 'none') return false
    return true
  })

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
        <OperadorOnly>
          {(!permissoes || permissoes['pdv'] !== 'none') && (
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
                  position: 'relative',
                }}
              >
                <Plus size={15} />
                Nova Venda
                <span style={{
                  position: 'absolute', right: '8px',
                  fontSize: '0.52rem', fontWeight: 900,
                  background: 'rgba(0,0,0,0.2)', color: 'rgba(255,255,255,0.85)',
                  padding: '1px 5px', borderRadius: '4px', letterSpacing: '0.04em',
                  fontFamily: 'monospace',
                }}>F2</span>
              </Link>
            </div>
          )}
        </OperadorOnly>

        {/* ── Nav Items ── */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '0.375rem 0' }}>
          {itensSidebar.map(item => {
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
            <p style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
              {nomeUsuario}
            </p>
            <p style={{ fontSize: '0.68rem', color: 'rgba(240,235,245,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '1px 0 0' }}>
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

function avaliarSenhaForte(s: string) {
  return {
    min8: s.length >= 8,
    maiuscula: /[A-Z]/.test(s),
    numero: /[0-9]/.test(s),
    especial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(s),
  }
}

function obterModuloDaRota(path: string): string | null {
  if (path.startsWith('/dashboard')) return 'dashboard'
  if (path.startsWith('/vendas/nova')) return 'pdv'
  if (path.startsWith('/vendas')) return 'vendas'
  if (path.startsWith('/produtos')) return 'produtos'
  if (path.startsWith('/estoque')) return 'estoque'
  if (path.startsWith('/catalogo')) return 'catalogo'
  if (path.startsWith('/clientes/inativos')) return 'clientes_inativos'
  if (path.startsWith('/clientes')) return 'clientes'
  if (path.startsWith('/fornecedores')) return 'fornecedores'
  if (path.startsWith('/financeiro/despesas')) return 'despesas'
  if (path.startsWith('/financeiro/fechamento')) return 'fechamento'
  if (path.startsWith('/financeiro/fiado')) return 'fiado'
  if (path.startsWith('/financeiro')) return 'financeiro'
  if (path.startsWith('/ordens-de-servico')) return 'ordens_servico'
  if (path.startsWith('/garantias')) return 'garantias'
  if (path.startsWith('/comissoes')) return 'comissoes'
  if (path.startsWith('/relatorios')) return 'relatorios'
  return null
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [headerInfo, setHeaderInfo] = useState({
    inicial: 'U',
    nomeLoja: 'Carregando...',
    plano: 'start',
    papel: '',
    nomeUsuario: 'Carregando...',
    permissoes: {} as Record<string, 'read' | 'write' | 'none'>,
    empresaId: '',
  })
  const [precisaTrocarSenha, setPrecisaTrocarSenha] = useState(false)
  const [novaSenha, setNovaSenha] = useState('')
  const [verNovaSenha, setVerNovaSenha] = useState(false)
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [verConfirmarSenha, setVerConfirmarSenha] = useState(false)
  const [atualizandoSenha, setAtualizandoSenha] = useState(false)
  const [erroSenha, setErroSenha] = useState('')
  const router = useRouter()

  useEffect(() => { setIsMounted(true) }, [])

  // Atalho global F2 → Nova Venda
  useEffect(() => {
    const handleF2 = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault()
        router.push('/vendas/nova')
      }
    }
    window.addEventListener('keydown', handleF2)
    return () => window.removeEventListener('keydown', handleF2)
  }, [router])

  /* Realtime: detecta congelamento ou exclusão */
  useEffect(() => {
    const supabase = createClient()
    let userId = ''
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      userId = user.id

      if (user.user_metadata?.forcar_troca_senha === true) {
        setPrecisaTrocarSenha(true)
      }

      const { data: profile } = await supabase.from('profiles').select('nome, empresa_id, papel, permissoes').eq('id', userId).single()
      if (profile?.empresa_id) {
        const { data: empresa } = await supabase.from('empresas').select('nome, plano').eq('id', profile.empresa_id).single()
        setHeaderInfo({
          inicial: (profile.nome || user.email || 'U').charAt(0).toUpperCase(),
          nomeLoja: empresa?.nome || 'Minha Loja',
          plano: empresa?.plano || 'start',
          papel: profile.papel || '',
          nomeUsuario: profile.nome || user.email || 'Usuário',
          permissoes: profile.permissoes || {},
          empresaId: profile.empresa_id,
        })
      }

      const channel = supabase
        .channel('profile-status-' + userId)
        .on('postgres_changes', {
          event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}`,
        }, async (payload) => {
          const novo = payload.new as { status?: string; empresa_id?: string | null; nome?: string; papel?: string; permissoes?: Record<string, 'read' | 'write' | 'none'> }
          if (novo.status === 'congelado' || novo.status === 'excluido' || !novo.empresa_id) {
            await supabase.auth.signOut()
            router.push('/login')
          } else {
            setHeaderInfo(prev => ({
              ...prev,
              papel: novo.papel || prev.papel,
              nomeUsuario: novo.nome || prev.nomeUsuario,
              inicial: (novo.nome || prev.nomeUsuario || 'U').charAt(0).toUpperCase(),
              permissoes: novo.permissoes || prev.permissoes || {},
            }))
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

  if (!isMounted || headerInfo.papel === '') {
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

  const temPermissao = (modulo: string, acao?: 'read' | 'write') => {
    if (headerInfo.papel === 'admin') return true
    const perm = headerInfo.permissoes?.[modulo]
    if (!perm || perm === 'none') return false
    if (acao === 'write' && perm !== 'write') return false
    return true
  }

  const pathname = usePathname()
  const moduloAtual = obterModuloDaRota(pathname)
  const temAcessoModulo = !moduloAtual || temPermissao(moduloAtual, 'read')

  return (
    <PermissionsContext.Provider value={{ papel: headerInfo.papel, permissoes: headerInfo.permissoes, temPermissao }}>
      <Suspense fallback={null}>
        <StripePollingListener setHeaderInfo={setHeaderInfo} />
      </Suspense>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--fundo)' }}>
      {/* Modal de Troca de Senha Obrigatória no Primeiro Acesso */}
      {precisaTrocarSenha && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="card anim-pop" style={{ width: '100%', maxWidth: '420px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>🔑</span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--verde)' }}>Primeiro Acesso</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--texto-desab)', marginTop: '6px', lineHeight: '1.5' }}>
                Por segurança, crie uma senha pessoal forte antes de continuar.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Nova senha */}
              <div>
                <label className="campo-label" style={{ fontSize: '0.78rem' }}>Nova Senha <span style={{ color: 'var(--vermelho)' }}>*</span></label>
                <div style={{ position: 'relative', marginTop: '0.25rem' }}>
                  <input
                    className="campo"
                    type={verNovaSenha ? 'text' : 'password'}
                    value={novaSenha}
                    onChange={e => { setNovaSenha(e.target.value); setErroSenha('') }}
                    placeholder="Crie uma senha forte"
                    style={{ width: '100%', paddingRight: '2.5rem' }}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setVerNovaSenha(v => !v)}
                    style={{ position: 'absolute', right: '0.625rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--texto-desab)', padding: 0 }}>
                    {verNovaSenha ? '🙈' : '👁️'}
                  </button>
                </div>
                {/* Indicadores de força */}
                {novaSenha && (() => {
                  const r = avaliarSenhaForte(novaSenha)
                  const itens = [
                    { ok: r.min8, txt: 'Mínimo 8 caracteres' },
                    { ok: r.maiuscula, txt: 'Letra maiúscula' },
                    { ok: r.numero, txt: 'Número' },
                    { ok: r.especial, txt: 'Caractere especial' },
                  ]
                  return (
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {itens.map(it => (
                        <div key={it.txt} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.72rem' }}>
                          <span style={{ color: it.ok ? 'var(--verde)' : 'var(--vermelho)' }}>{it.ok ? '✓' : '✗'}</span>
                          <span style={{ color: it.ok ? 'var(--verde)' : 'var(--texto-desab)' }}>{it.txt}</span>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>

              {/* Confirmar senha */}
              <div>
                <label className="campo-label" style={{ fontSize: '0.78rem' }}>Confirmar Senha <span style={{ color: 'var(--vermelho)' }}>*</span></label>
                <div style={{ position: 'relative', marginTop: '0.25rem' }}>
                  <input
                    className="campo"
                    type={verConfirmarSenha ? 'text' : 'password'}
                    value={confirmarSenha}
                    onChange={e => { setConfirmarSenha(e.target.value); setErroSenha('') }}
                    placeholder="Repita a nova senha"
                    style={{ width: '100%', paddingRight: '2.5rem' }}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setVerConfirmarSenha(v => !v)}
                    style={{ position: 'absolute', right: '0.625rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--texto-desab)', padding: 0 }}>
                    {verConfirmarSenha ? '🙈' : '👁️'}
                  </button>
                </div>
                {confirmarSenha && novaSenha !== confirmarSenha && (
                  <p style={{ fontSize: '0.72rem', color: 'var(--vermelho)', marginTop: '0.25rem' }}>✗ As senhas não coincidem</p>
                )}
                {confirmarSenha && novaSenha === confirmarSenha && (() => { const r = avaliarSenhaForte(novaSenha); return r.min8 && r.maiuscula && r.numero && r.especial })() && (
                  <p style={{ fontSize: '0.72rem', color: 'var(--verde)', marginTop: '0.25rem' }}>✓ Perfeito!</p>
                )}
              </div>

              {erroSenha && (
                <div className="alerta alerta-perigo" style={{ fontSize: '0.78rem', padding: '0.5rem' }}>{erroSenha}</div>
              )}

              <button
                onClick={async () => {
                  setErroSenha('')
                  const r = avaliarSenhaForte(novaSenha)
                  if (!r.min8) { setErroSenha('Mínimo 8 caracteres.'); return }
                  if (!r.maiuscula) { setErroSenha('Inclua ao menos uma letra maiúscula.'); return }
                  if (!r.numero) { setErroSenha('Inclua ao menos um número.'); return }
                  if (!r.especial) { setErroSenha('Inclua ao menos um caractere especial (!@#...).'); return }
                  if (novaSenha !== confirmarSenha) { setErroSenha('As senhas não coincidem.'); return }
                  setAtualizandoSenha(true)
                  try {
                    const supabase = createClient()
                    const { error } = await supabase.auth.updateUser({
                      password: novaSenha,
                      data: { forcar_troca_senha: false }
                    })
                    if (error) {
                      setErroSenha('Erro ao atualizar: ' + error.message)
                    } else {
                      setPrecisaTrocarSenha(false)
                    }
                  } catch (err: unknown) {
                    setErroSenha('Erro de conexão: ' + (err instanceof Error ? err.message : ''))
                  } finally {
                    setAtualizandoSenha(false)
                  }
                }}
                disabled={atualizandoSenha}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
              >
                {atualizandoSenha ? '⏳ Salvando...' : '🔐 Salvar Senha e Entrar'}
              </button>
            </div>
          </div>
        </div>
      )}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        nomeLoja={headerInfo.nomeLoja}
        inicialUsuario={headerInfo.inicial}
        planoAtivo={headerInfo.plano}
        papel={headerInfo.papel}
        nomeUsuario={headerInfo.nomeUsuario}
        permissoes={headerInfo.permissoes}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Header com sino de notificações */}
        <HeaderWithBell
          nomeLoja={headerInfo.nomeLoja}
          empresaId={headerInfo.empresaId}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <SubscriptionBanner />
        <main style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
          {temAcessoModulo ? children : (
            <div style={{
              display: 'flex', height: '80%',
              alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: '1rem',
              padding: '2rem', textAlign: 'center',
            }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'rgba(255, 76, 76, 0.1)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                color: 'var(--vermelho)', marginBottom: '0.5rem'
              }}>
                <Lock size={32} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--vermelho)' }}>Acesso Restrito</h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--texto-desab)', maxWidth: '400px', lineHeight: '1.5', margin: '0 0 1rem 0' }}>
                Seu usuário não possui permissão para acessar o módulo <strong>{
                  moduloAtual === 'pdv' ? 'PDV - Frente de Caixa' :
                  moduloAtual === 'vendas' ? 'Histórico de Vendas' :
                  moduloAtual === 'produtos' ? 'Produtos' :
                  moduloAtual === 'estoque' ? 'Estoque' :
                  moduloAtual === 'catalogo' ? 'Catálogo' :
                  moduloAtual === 'clientes_inativos' ? 'Clientes Sumidos' :
                  moduloAtual === 'clientes' ? 'Clientes' :
                  moduloAtual === 'fornecedores' ? 'Fornecedores' :
                  moduloAtual === 'despesas' ? 'Despesas' :
                  moduloAtual === 'fechamento' ? 'Fechamento de Caixa' :
                  moduloAtual === 'fiado' ? 'Fiados' :
                  moduloAtual === 'financeiro' ? 'Financeiro' :
                  moduloAtual === 'ordens_servico' ? 'Ordens de Serviço' :
                  moduloAtual === 'garantias' ? 'Garantias' :
                  moduloAtual === 'comissoes' ? 'Comissões' :
                  moduloAtual === 'relatorios' ? 'Relatórios' : moduloAtual
                }</strong>. Entre em contato com o administrador.
              </p>
              <button onClick={() => router.push('/dashboard')} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                Voltar para o Dashboard
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
    </PermissionsContext.Provider>
  )
}

function HeaderWithBell({ nomeLoja, empresaId, onMenuClick }: { nomeLoja: string; empresaId: string; onMenuClick?: () => void }) {
  const [bellOpen, setBellOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)
  const { notificacoes, naoLidas, marcarLida, marcarTodasLidas } = useNotifications(empresaId || null)
  const router = useRouter()

  // Fecha o painel ao clicar fora
  useEffect(() => {
    if (!bellOpen) return
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [bellOpen])

  const tipoIcon: Record<string, string> = {
    estoque_critico: '📦',
    garantia_expirando: '🛡️',
    fiado_vencido: '💸',
    os_vencida: '🔧',
    pedido_aguardando_entrada: '📥',
    geral: '🔔',
  }

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: '48px', padding: '0 1.25rem', flexShrink: 0,
      background: 'var(--surface)', borderBottom: '1px solid var(--borda)',
      position: 'relative', zIndex: 30,
    }}>
      {/* Menu burger (mobile) */}
      <button
        onClick={onMenuClick}
        className="lg:hidden"
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '4px' }}
      >
        <Menu size={18} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' }}>
        {/* PDV shortcut */}
        <Link href="/vendas/nova" style={{
          display: 'flex', alignItems: 'center', gap: '0.375rem',
          fontSize: '0.72rem', background: 'rgba(0,191,165,0.08)', color: 'var(--verde)',
          border: '1px solid rgba(0,191,165,0.2)', padding: '0.2rem 0.5rem',
          borderRadius: 'var(--radius-sm)', fontWeight: 700, textDecoration: 'none', transition: 'background 0.1s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,191,165,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,191,165,0.08)'}
          title="Ir para o PDV (Frente de Caixa)"
        >
          <span>PDV</span>
          <span style={{ fontSize: '0.58rem', background: 'var(--verde)', color: '#060a06', padding: '1px 3px', borderRadius: '2px', fontFamily: 'monospace', fontWeight: 900 }}>F2</span>
        </Link>

        <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 500 }} className="hidden sm:block">
          {nomeLoja}
        </span>

        {/* 🔔 Sino de Notificações */}
        <div ref={bellRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setBellOpen(v => !v)}
            style={{
              position: 'relative', background: 'transparent', border: 'none',
              cursor: 'pointer', color: naoLidas > 0 ? 'var(--amarelo, #f59e0b)' : 'var(--muted, #aaa)',
              padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center',
              transition: 'color 0.15s',
            }}
            title="Notificações"
          >
            <Bell size={18} />
            {naoLidas > 0 && (
              <span style={{
                position: 'absolute', top: '-2px', right: '-2px',
                minWidth: '16px', height: '16px',
                background: 'var(--vermelho, #e74c3c)', color: '#fff',
                borderRadius: '999px', fontSize: '0.55rem', fontWeight: 900,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 3px', lineHeight: 1,
                border: '1.5px solid var(--surface)',
                fontFamily: 'monospace',
              }}>
                {naoLidas > 99 ? '99+' : naoLidas}
              </span>
            )}
          </button>

          {/* Painel dropdown */}
          {bellOpen && (
            <div className="anim-pop" style={{
              position: 'absolute', top: '100%', right: 0,
              width: '340px', maxHeight: '420px',
              background: 'var(--surface)', border: '1px solid var(--borda)',
              borderRadius: 'var(--radius)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              overflow: 'hidden', display: 'flex', flexDirection: 'column',
              marginTop: '4px',
            }}>
              {/* Cabeçalho */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.75rem 1rem', borderBottom: '1px solid var(--borda)',
                background: 'var(--surface-alt)',
              }}>
                <p style={{ fontWeight: 800, fontSize: '0.82rem', margin: 0 }}>
                  🔔 Notificações
                  {naoLidas > 0 && <span style={{ marginLeft: '0.375rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--texto-desab)' }}>({naoLidas} nova{naoLidas !== 1 ? 's' : ''})</span>}
                </p>
                {naoLidas > 0 && (
                  <button
                    onClick={marcarTodasLidas}
                    style={{ fontSize: '0.7rem', color: 'var(--verde)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>

              {/* Lista */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {notificacoes.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--texto-desab)' }}>
                    <p style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>✅</p>
                    <p style={{ fontSize: '0.82rem', fontWeight: 600 }}>Tudo em dia!</p>
                    <p style={{ fontSize: '0.72rem', marginTop: '0.25rem' }}>Nenhuma notificação pendente.</p>
                  </div>
                ) : (
                  notificacoes.slice(0, 20).map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        marcarLida(n.id)
                        if (n.link) { router.push(n.link); setBellOpen(false) }
                      }}
                      style={{
                        display: 'flex', gap: '0.625rem', padding: '0.625rem 1rem',
                        borderBottom: '1px solid var(--borda-leve)',
                        background: n.lida ? 'transparent' : 'rgba(0,191,165,0.04)',
                        cursor: n.link ? 'pointer' : 'default',
                        transition: 'background 0.1s',
                        opacity: n.lida ? 0.6 : 1,
                      }}
                      onMouseEnter={e => { if (!n.lida || n.link) e.currentTarget.style.background = 'var(--surface-alt)' }}
                      onMouseLeave={e => e.currentTarget.style.background = n.lida ? 'transparent' : 'rgba(0,191,165,0.04)'}
                    >
                      <span style={{ fontSize: '1.25rem', flexShrink: 0, lineHeight: 1, marginTop: '1px' }}>{tipoIcon[n.tipo] || '🔔'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: '0.75rem', margin: 0, color: 'var(--texto)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.titulo}</p>
                        <p style={{ fontSize: '0.68rem', color: 'var(--texto-sec)', margin: '2px 0 0', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.descricao}</p>
                      </div>
                      {!n.lida && (
                        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--verde)', flexShrink: 0, marginTop: '5px' }} />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function SubscriptionBanner() {
  const { status, cancel_at_period_end, current_period_end } = require('@/hooks/useSubscription').useSubscription()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const openPortal = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: profile } = await supabase.from('profiles').select('empresa_id').single()
      if (!profile?.empresa_id) return
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresaId: profile.empresa_id })
      })
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'past_due') {
    return (
      <div style={{ background: '#FF4C4C', color: '#fff', padding: '0.75rem', textAlign: 'center', fontSize: '0.82rem', fontWeight: 700 }}>
        🚨 Pagamento recusado. Atualize seu cartão para não perder o acesso.
        <button onClick={openPortal} disabled={loading} style={{ marginLeft: '1rem', padding: '0.25rem 0.75rem', background: 'rgba(0,0,0,0.2)', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 800 }}>
          {loading ? 'Aguarde...' : 'Atualizar Cartão (Stripe)'}
        </button>
      </div>
    )
  }

  if (cancel_at_period_end && current_period_end) {
    const data = new Date(current_period_end).toLocaleDateString('pt-BR')
    return (
      <div style={{ background: '#FFB800', color: '#111', padding: '0.75rem', textAlign: 'center', fontSize: '0.82rem', fontWeight: 700 }}>
        ⚠️ Sua assinatura será encerrada em {data}. Clique aqui para reativar.
        <button onClick={openPortal} disabled={loading} style={{ marginLeft: '1rem', padding: '0.25rem 0.75rem', background: 'rgba(0,0,0,0.1)', border: 'none', color: '#111', borderRadius: '4px', cursor: 'pointer', fontWeight: 800 }}>
          {loading ? 'Aguarde...' : 'Reativar Assinatura (Stripe)'}
        </button>
      </div>
    )
  }

  return null
}

function StripePollingListener({ setHeaderInfo }: { setHeaderInfo: React.Dispatch<React.SetStateAction<any>> }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const sucesso = searchParams?.get('sucesso')
    if (sucesso !== '1') return
    try { localStorage.removeItem('kdl_subscription_cache') } catch {}
    let tentativas = 0
    const MAX = 15
    pollingRef.current = setInterval(async () => {
      tentativas++
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: profile } = await supabase.from('profiles').select('empresa_id').eq('id', user.id).single()
        if (!profile?.empresa_id) return
        const { data: empresa } = await supabase.from('empresas').select('plano').eq('id', profile.empresa_id).single()
        if (empresa?.plano === 'pro') {
          setHeaderInfo((prev: any) => ({ ...prev, plano: 'pro' }))
          try { localStorage.removeItem('kdl_subscription_cache') } catch {}
          if (pollingRef.current) clearInterval(pollingRef.current)
          router.replace(window.location.pathname)
        }
      } catch {}
      if (tentativas >= MAX && pollingRef.current) clearInterval(pollingRef.current)
    }, 2000)
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [searchParams, router, setHeaderInfo])

  return null
}
