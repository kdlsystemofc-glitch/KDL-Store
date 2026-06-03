'use client'
import { toast } from 'react-hot-toast'
import { useEffect, useState } from 'react'
import {
  UserPlus, X, Loader2, Trash2, Lock, Users,
  ShieldCheck, Eye, EyeOff, CheckCircle2, XCircle, RefreshCw,
  Snowflake, Play
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'

/* ─── Tipos ─────────────────────────────────────────── */
type Usuario = {
  id: string
  nome: string
  papel: string
  status: string
  criado_em: string
}

/* ─── Constantes ─────────────────────────────────────── */
const PAPEL_LABEL: Record<string, { label: string; emoji: string; desc: string }> = {
  admin:    { label: 'Admin',    emoji: '👑', desc: 'Acesso total ao sistema, incluindo configurações e financeiro' },
  operador: { label: 'Operador', emoji: '🛠️', desc: 'Acesso ao PDV, vendas, clientes e estoque. Sem acesso ao financeiro ou configurações.' },
}

const MAP_DB_TO_UI: Record<string, string> = {
  admin: 'admin', operador: 'operador', visualizador: 'operador',
  vendedor: 'operador', estoquista: 'operador',
}

const MAP_UI_TO_DB: Record<string, string> = {
  admin: 'admin', operador: 'operador',
}

/* ─── Validação de senha ─────────────────────────────── */
function avaliarSenha(senha: string) {
  return {
    min8:     senha.length >= 8,
    maiuscula: /[A-Z]/.test(senha),
    numero:   /[0-9]/.test(senha),
    especial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(senha),
  }
}

function SenhaIndicador({ senha }: { senha: string }) {
  const r = avaliarSenha(senha)
  const itens = [
    { ok: r.min8,      txt: 'Mínimo 8 caracteres' },
    { ok: r.maiuscula, txt: 'Letra maiúscula' },
    { ok: r.numero,    txt: 'Número' },
    { ok: r.especial,  txt: 'Caractere especial (!@#...)' },
  ]
  if (!senha) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem' }}>
      {itens.map(item => (
        <div key={item.txt} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.72rem' }}>
          {item.ok
            ? <CheckCircle2 size={12} color="var(--verde)" />
            : <XCircle size={12} color="var(--vermelho)" />}
          <span style={{ color: item.ok ? 'var(--verde)' : 'var(--texto-desab)' }}>{item.txt}</span>
        </div>
      ))}
    </div>
  )
}

function senhaValida(senha: string) {
  const r = avaliarSenha(senha)
  return r.min8 && r.maiuscula && r.numero && r.especial
}

/* ─── Campo de senha com olho ─────────────────────────── */
function CampoSenha({
  value, onChange, placeholder = 'Nova senha segura', label, required,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; label: string; required?: boolean
}) {
  const [ver, setVer] = useState(false)
  return (
    <div>
      <label className="campo-label">
        {label} {required && <span style={{ color: 'var(--vermelho)' }}>*</span>}
      </label>
      <div style={{ position: 'relative', marginTop: '0.375rem' }}>
        <input
          className="campo"
          type={ver ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ paddingRight: '2.5rem', width: '100%' }}
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setVer(v => !v)}
          style={{
            position: 'absolute', right: '0.625rem', top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--texto-desab)', padding: 0,
          }}
        >
          {ver ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      <SenhaIndicador senha={value} />
    </div>
  )
}

/* ─── Modal Criar Usuário ─────────────────────────────── */
function ModalCriar({
  onClose, onSuccess, empresaId, plano, totalUsuarios,
}: {
  onClose: () => void; onSuccess: () => void; empresaId: string; plano: string; totalUsuarios: number
}) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [papel, setPapel] = useState<'operador' | 'admin'>('operador')
  const [criando, setCriando] = useState(false)
  const limit = plano === 'pro' ? 5 : 1
  const atingiuLimite = totalUsuarios >= limit

  async function criar() {
    if (!nome.trim()) { toast.error('Informe o nome.'); return }
    if (!email.trim()) { toast.error('Informe o e-mail.'); return }
    if (!senhaValida(senha)) { toast.error('Senha não atende os requisitos de segurança.'); return }
    setCriando(true)
    try {
      const res = await fetch('/api/usuario/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), nome: nome.trim(), senha, papel, empresaId }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error || 'Erro ao cadastrar'); return }
      toast.success('Usuário cadastrado com sucesso!')
      onSuccess()
    } catch (err: unknown) {
      toast.error('Erro de conexão: ' + (err instanceof Error ? err.message : ''))
    } finally { setCriando(false) }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card anim-pop" style={{ width: '100%', maxWidth: '460px', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Cabeçalho */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'var(--verde-claro)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserPlus size={18} color="var(--verde)" />
            </div>
            <div>
              <p style={{ fontWeight: 900, fontSize: '1rem' }}>Novo Colaborador</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--texto-desab)' }}>{totalUsuarios}/{limit} usuário{limit > 1 ? 's' : ''} usado{limit > 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--texto-desab)', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Alerta de limite */}
        {atingiuLimite && (
          <div className="alerta alerta-aviso" style={{ marginBottom: '1rem', fontSize: '0.8rem' }}>
            ⚠️ Limite do plano {plano === 'pro' ? 'Pro' : 'Start'} atingido ({limit} usuário{limit > 1 ? 's' : ''}). Faça upgrade para adicionar mais.
          </div>
        )}

        {!atingiuLimite && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="campo-label">Nome Completo <span style={{ color: 'var(--vermelho)' }}>*</span></label>
              <input className="campo" style={{ marginTop: '0.375rem' }} value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Maria Souza" />
            </div>
            <div>
              <label className="campo-label">E-mail <span style={{ color: 'var(--vermelho)' }}>*</span></label>
              <input className="campo" type="email" style={{ marginTop: '0.375rem' }} value={email} onChange={e => setEmail(e.target.value)} placeholder="colaborador@exemplo.com" />
            </div>

            <CampoSenha label="Senha Temporária" required value={senha} onChange={setSenha} placeholder="Crie uma senha forte" />

            {/* Selector de papel */}
            <div>
              <label className="campo-label">Papel no sistema</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.375rem' }}>
                {(['operador', 'admin'] as const).map(p => {
                  const info = PAPEL_LABEL[p]
                  const ativo = papel === p
                  return (
                    <button key={p} type="button" onClick={() => setPapel(p)}
                      style={{
                        padding: '0.75rem 0.5rem', border: `2px solid ${ativo ? 'var(--verde)' : 'var(--borda)'}`,
                        borderRadius: 'var(--radius-sm)', background: ativo ? 'var(--verde-claro)' : 'var(--surface)',
                        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', transition: 'all 0.12s',
                      }}>
                      <p style={{ fontSize: '1.25rem', marginBottom: '4px' }}>{info.emoji}</p>
                      <p style={{ fontSize: '0.78rem', fontWeight: 800, color: ativo ? 'var(--verde-esc)' : 'var(--texto)' }}>{info.label}</p>
                      <p style={{ fontSize: '0.68rem', color: 'var(--texto-desab)', marginTop: '2px', lineHeight: 1.3 }}>{info.desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Aviso de primeiro login */}
            <div style={{ background: 'rgba(0,191,165,0.08)', border: '1px solid rgba(0,191,165,0.2)', borderRadius: '8px', padding: '0.625rem 0.75rem', fontSize: '0.75rem', color: 'var(--verde)', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <ShieldCheck size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>No primeiro acesso, o colaborador será obrigado a criar uma nova senha pessoal.</span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button onClick={onClose} className="btn btn-ghost">Cancelar</button>
              <button
                onClick={criar}
                disabled={!email.trim() || !nome.trim() || !senhaValida(senha) || criando}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
              >
                {criando ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <UserPlus size={14} />}
                Cadastrar e Ativar
              </button>
            </div>
          </div>
        )}

        {atingiuLimite && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button onClick={onClose} className="btn btn-ghost">Fechar</button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Modal Reset de Senha ───────────────────────────── */
function ModalResetSenha({
  usuario, onClose, onSuccess, empresaId,
}: {
  usuario: Usuario; onClose: () => void; onSuccess: () => void; empresaId: string
}) {
  const [senha, setSenha] = useState('')
  const [confirmSenha, setConfirmSenha] = useState('')
  const [resetando, setResetando] = useState(false)
  const [verConfirm, setVerConfirm] = useState(false)

  async function resetar() {
    if (!senhaValida(senha)) { toast.error('Senha não atende os requisitos.'); return }
    if (senha !== confirmSenha) { toast.error('As senhas não coincidem.'); return }
    setResetando(true)
    try {
      const res = await fetch('/api/usuario/resetar-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId: usuario.id, novaSenha: senha, empresaId }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error || 'Erro ao resetar senha'); return }
      toast.success(`Senha de ${usuario.nome} redefinida! Eles precisarão criar uma nova senha no próximo login.`)
      onSuccess()
    } catch (err: unknown) {
      toast.error('Erro: ' + (err instanceof Error ? err.message : ''))
    } finally { setResetando(false) }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card anim-pop" style={{ width: '100%', maxWidth: '420px', padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(251,191,36,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={18} color="#fbbf24" />
            </div>
            <div>
              <p style={{ fontWeight: 900, fontSize: '1rem' }}>Redefinir Senha</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--texto-desab)' }}>{usuario.nome}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--texto-desab)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <CampoSenha label="Nova Senha Temporária" required value={senha} onChange={setSenha} />

          <div>
            <label className="campo-label">Confirmar Senha <span style={{ color: 'var(--vermelho)' }}>*</span></label>
            <div style={{ position: 'relative', marginTop: '0.375rem' }}>
              <input
                className="campo"
                type={verConfirm ? 'text' : 'password'}
                value={confirmSenha}
                onChange={e => setConfirmSenha(e.target.value)}
                placeholder="Repita a nova senha"
                style={{ paddingRight: '2.5rem', width: '100%' }}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setVerConfirm(v => !v)}
                style={{ position: 'absolute', right: '0.625rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--texto-desab)', padding: 0 }}>
                {verConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {confirmSenha && senha !== confirmSenha && (
              <p style={{ fontSize: '0.72rem', color: 'var(--vermelho)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <XCircle size={11} /> As senhas não coincidem
              </p>
            )}
            {confirmSenha && senha === confirmSenha && senhaValida(senha) && (
              <p style={{ fontSize: '0.72rem', color: 'var(--verde)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle2 size={11} /> Senhas coincidem
              </p>
            )}
          </div>

          <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '8px', padding: '0.625rem 0.75rem', fontSize: '0.75rem', color: '#b45309', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <RefreshCw size={13} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>O colaborador será obrigado a criar uma nova senha pessoal no próximo login.</span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button onClick={onClose} className="btn btn-ghost">Cancelar</button>
            <button
              onClick={resetar}
              disabled={!senhaValida(senha) || senha !== confirmSenha || resetando}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: '#fbbf24', color: '#78350f' }}
            >
              {resetando ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Lock size={14} />}
              Redefinir Senha
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Página Principal ──────────────────────────────── */
export default function UsuariosPage() {
  const { empresaId } = useEmpresaId()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [meuId, setMeuId] = useState<string | null>(null)
  const [plano, setPlano] = useState('start')
  const [modalCriar, setModalCriar] = useState(false)
  const [modalReset, setModalReset] = useState<Usuario | null>(null)
  const [salvando, setSalvando] = useState<string | null>(null)

  useEffect(() => { if (empresaId) carregar(empresaId) }, [empresaId])

  async function carregar(eid: string) {
    setLoading(true)
    const supabase = createClient()
    const [profilesRes, userRes, subRes] = await Promise.all([
      supabase.from('profiles').select('id,nome,papel,status,criado_em').eq('empresa_id', eid).order('criado_em'),
      supabase.auth.getUser(),
      supabase.from('subscriptions').select('plano').eq('empresa_id', eid).maybeSingle(),
    ])
    setMeuId(userRes.data.user?.id || null)
    setPlano(subRes.data?.plano || 'start')
    setUsuarios(
      (profilesRes.data || []).map((u: Record<string, unknown>) => ({
        ...u,
        papel: MAP_DB_TO_UI[u.papel as string] || (u.papel as string),
      })) as Usuario[]
    )
    setLoading(false)
  }

  async function alterarPapel(uid: string, novoPapel: string) {
    if (uid === meuId) return
    setSalvando(uid + '-papel')
    await createClient().from('profiles').update({ papel: MAP_UI_TO_DB[novoPapel] || 'operador' }).eq('id', uid)
    setUsuarios(prev => prev.map(u => u.id === uid ? { ...u, papel: novoPapel } : u))
    setSalvando(null)
    toast.success('Papel atualizado.')
  }

  async function toggleFreeze(uid: string, statusAtual: string) {
    if (uid === meuId) return
    const novoStatus = statusAtual === 'ativo' ? 'congelado' : 'ativo'
    setSalvando(uid + '-freeze')
    await createClient().from('profiles').update({ status: novoStatus }).eq('id', uid)
    setUsuarios(prev => prev.map(u => u.id === uid ? { ...u, status: novoStatus } : u))
    setSalvando(null)
    toast.success(novoStatus === 'congelado' ? 'Acesso congelado.' : 'Acesso reativado.')
  }

  async function excluir(uid: string, nome: string) {
    if (uid === meuId) return
    if (!confirm(`Excluir "${nome}"? O usuário perderá o acesso imediatamente.`)) return
    setSalvando(uid + '-del')
    await createClient().from('profiles').update({ empresa_id: null, status: 'excluido' }).eq('id', uid)
    setUsuarios(prev => prev.filter(u => u.id !== uid))
    setSalvando(null)
    toast.success(`${nome} foi removido.`)
  }

  const totalAtivos = usuarios.filter(u => u.status !== 'excluido').length
  const limit = plano === 'pro' ? 5 : 1

  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '820px' }}>

      {/* Modais */}
      {modalCriar && empresaId && (
        <ModalCriar
          onClose={() => setModalCriar(false)}
          onSuccess={() => { setModalCriar(false); if (empresaId) carregar(empresaId) }}
          empresaId={empresaId}
          plano={plano}
          totalUsuarios={totalAtivos}
        />
      )}
      {modalReset && empresaId && (
        <ModalResetSenha
          usuario={modalReset}
          onClose={() => setModalReset(null)}
          onSuccess={() => setModalReset(null)}
          empresaId={empresaId}
        />
      )}

      {/* Header da página */}
      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">👥 Usuários & Acessos</h1>
          <p className="pg-sub">{totalAtivos} / {limit} colaborador{limit > 1 ? 'es' : ''} — Plano {plano === 'pro' ? 'Pro' : 'Start'}</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setModalCriar(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
        >
          <UserPlus size={14} /> Novo Colaborador
        </button>
      </div>

      {/* Barra de capacidade */}
      <div className="card" style={{ padding: '0.875rem 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Users size={14} /> Capacidade do Plano
          </span>
          <span style={{ fontSize: '0.78rem', color: totalAtivos >= limit ? 'var(--vermelho)' : 'var(--verde)', fontWeight: 700 }}>
            {totalAtivos}/{limit}
          </span>
        </div>
        <div style={{ height: '6px', background: 'var(--borda)', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: '99px', transition: 'width 0.5s ease',
            width: `${Math.min((totalAtivos / limit) * 100, 100)}%`,
            background: totalAtivos >= limit ? 'var(--vermelho)' : 'var(--verde)',
          }} />
        </div>
        {totalAtivos >= limit && (
          <p style={{ fontSize: '0.72rem', color: 'var(--vermelho)', marginTop: '0.375rem' }}>
            Limite atingido. <a href="/configuracoes/planos" style={{ color: 'var(--verde)', fontWeight: 700 }}>Fazer upgrade →</a>
          </p>
        )}
      </div>

      {/* Lista de usuários */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: 'var(--texto-desab)', gap: '0.75rem' }}>
          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Carregando...
        </div>
      ) : usuarios.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Users size={32} style={{ opacity: 0.3, margin: '0 auto 0.75rem' }} />
          <p style={{ color: 'var(--texto-desab)' }}>Nenhum colaborador cadastrado ainda.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {usuarios.map(u => {
            const eVoce = u.id === meuId
            const congelado = u.status === 'congelado'
            const papelInfo = PAPEL_LABEL[u.papel] || PAPEL_LABEL.vendedor

            return (
              <div key={u.id} className="card" style={{
                padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
                opacity: congelado ? 0.65 : 1,
                border: eVoce ? '1px solid rgba(0,191,165,0.3)' : undefined,
                transition: 'opacity 0.2s',
              }}>
                {/* Avatar */}
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  background: eVoce ? 'var(--verde)' : congelado ? 'var(--borda)' : 'var(--roxo-escuro)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 900, fontSize: '0.9rem',
                }}>
                  {u.nome.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <p style={{ fontWeight: 800, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.nome}
                    </p>
                    {eVoce && (
                      <span style={{ fontSize: '0.65rem', background: 'var(--verde-claro)', color: 'var(--verde)', padding: '1px 6px', borderRadius: '99px', fontWeight: 800 }}>
                        VOCÊ
                      </span>
                    )}
                    {congelado && (
                      <span style={{ fontSize: '0.65rem', background: 'rgba(100,149,237,0.15)', color: '#6495ed', padding: '1px 6px', borderRadius: '99px', fontWeight: 800 }}>
                        ❄️ CONGELADO
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--texto-desab)', marginTop: '1px' }}>
                    {papelInfo.emoji} {papelInfo.label} · Desde {new Date(u.criado_em).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                {/* Selector de papel */}
                {!eVoce && (
                    <select
                    className="campo"
                    value={u.papel}
                    disabled={salvando === u.id + '-papel'}
                    onChange={e => alterarPapel(u.id, e.target.value)}
                    style={{ width: 'auto', fontSize: '0.78rem', padding: '0.3rem 0.5rem', minWidth: '120px' }}
                  >
                    <option value="admin">👑 Admin</option>
                    <option value="operador">🛠️ Operador</option>
                  </select>
                )}

                {/* Ações */}
                {!eVoce && (
                  <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                    {/* Congelar/Descongelar */}
                    <button
                      onClick={() => toggleFreeze(u.id, u.status)}
                      disabled={salvando === u.id + '-freeze'}
                      className="btn btn-secondary"
                      title={congelado ? 'Descongelar acesso' : 'Congelar acesso'}
                      style={{ padding: '0.375rem 0.625rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      {salvando === u.id + '-freeze'
                        ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                        : congelado ? <Play size={12} /> : <Snowflake size={12} />}
                      <span className="hidden sm:inline">{congelado ? 'Ativar' : 'Congelar'}</span>
                    </button>

                    {/* Reset senha */}
                    <button
                      onClick={() => setModalReset(u)}
                      className="btn btn-secondary"
                      title="Redefinir senha"
                      style={{ padding: '0.375rem 0.625rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <Lock size={12} />
                      <span className="hidden sm:inline">Senha</span>
                    </button>

                    {/* Excluir */}
                    <button
                      onClick={() => excluir(u.id, u.nome)}
                      disabled={salvando === u.id + '-del'}
                      className="btn btn-secondary"
                      title="Remover usuário"
                      style={{ padding: '0.375rem 0.625rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--vermelho)' }}
                    >
                      {salvando === u.id + '-del'
                        ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                        : <Trash2 size={12} />}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Legenda de papéis */}
      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <p style={{ fontWeight: 800, marginBottom: '0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <ShieldCheck size={15} /> Papéis e Permissões
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.625rem' }}>
          {Object.entries(PAPEL_LABEL).map(([key, info]) => (
            <div key={key} style={{ background: 'var(--fundo)', borderRadius: '8px', padding: '0.625rem 0.75rem' }}>
              <p style={{ fontWeight: 800, fontSize: '0.82rem', marginBottom: '2px' }}>{info.emoji} {info.label}</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--texto-desab)' }}>{info.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Requisitos de senha */}
      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <p style={{ fontWeight: 800, marginBottom: '0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <Lock size={15} /> Política de Senhas
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.375rem', fontSize: '0.78rem', color: 'var(--texto-sec)' }}>
          {[
            'Mínimo 8 caracteres',
            'Ao menos 1 letra maiúscula',
            'Ao menos 1 número',
            'Ao menos 1 caractere especial',
          ].map(req => (
            <div key={req} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <CheckCircle2 size={12} color="var(--verde)" />
              {req}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
