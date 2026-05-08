'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email,      setEmail]      = useState('')
  const [senha,      setSenha]      = useState('')
  const [showPwd,    setShowPwd]    = useState(false)
  const [erro,       setErro]       = useState<string | null>(null)
  const [loading,    setLoading]    = useState(false)

  // Recuperação
  const [showRec,    setShowRec]    = useState(false)
  const [emailRec,   setEmailRec]   = useState('')
  const [loadingRec, setLoadingRec] = useState(false)
  const [msgRec,     setMsgRec]     = useState<{tipo:'ok'|'erro', texto:string}|null>(null)

  const recuperarSenha = async () => {
    if (!emailRec) { setMsgRec({tipo:'erro', texto:'Preencha o e-mail.'}); return }
    setLoadingRec(true)
    setMsgRec(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(emailRec, {
      redirectTo: `${window.location.origin}/auth/callback?next=/redefinir-senha`,
    })
    setLoadingRec(false)
    if (error) {
      setMsgRec({tipo:'erro', texto:error.message})
    } else {
      setMsgRec({tipo:'ok', texto:'Enviamos um link para o seu e-mail. Verifique sua caixa de entrada.'})
      setTimeout(() => setShowRec(false), 8000)
    }
  }

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !senha) { setErro('Preencha e-mail e senha.'); return }
    setErro(null)
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    setLoading(false)
    if (error) {
      if (error.message.includes('Email not confirmed'))
        setErro('Confirme seu e-mail antes de entrar. Verifique a caixa de entrada.')
      else
        setErro('E-mail ou senha incorretos.')
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '0.75rem 0.875rem', borderRadius: '8px',
    border: '1.5px solid #d1d5db', fontSize: '0.95rem', outline: 'none',
    background: '#fff', color: '#1a1a1a', fontFamily: 'inherit', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  }

  return (
    <div>
      <h2 style={{ fontWeight: 900, fontSize: '1.75rem', color: '#1a1a1a', marginBottom: '0.25rem' }}>
        Entrar no sistema
      </h2>
      <p style={{ color: '#6b7280', marginBottom: '1.75rem', fontSize: '0.9rem' }}>
        Acesse sua conta para continuar
      </p>

      {erro && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px',
          padding: '0.75rem 1rem', marginBottom: '1rem', color: '#dc2626',
          fontSize: '0.85rem', fontWeight: 600, display: 'flex', gap: '0.5rem', alignItems: 'center'
        }}>
          ⚠️ {erro}
        </div>
      )}

      <form onSubmit={entrar} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: '#374151', marginBottom: '0.375rem' }}>
            E-mail
          </label>
          <input id="login-email" type="email" style={inp} placeholder="seu@email.com"
            value={email} onChange={e => setEmail(e.target.value)} required />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: '#374151', marginBottom: '0.375rem' }}>
            Senha
          </label>
          <div style={{ position: 'relative' }}>
            <input id="login-senha" type={showPwd ? 'text' : 'password'} style={{ ...inp, paddingRight: '2.75rem' }}
              placeholder="••••••••" value={senha} onChange={e => setSenha(e.target.value)} required />
            <button type="button" onClick={() => setShowPwd(v => !v)} style={{
              position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '1rem', lineHeight: 1
            }}>
              {showPwd ? '🙈' : '👁'}
            </button>
          </div>
          <div style={{ textAlign: 'right', marginTop: '0.375rem' }}>
            <button type="button" id="link-forgot-password" onClick={() => {setShowRec(!showRec); setMsgRec(null)}}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#15803d', fontSize: '0.78rem', fontWeight: 600 }}>
              Esqueci minha senha
            </button>
          </div>
        </div>

        {/* Formulário Inline de Recuperação */}
        {showRec && (
          <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '8px', border: '1px solid #d1d5db', display:'flex', flexDirection:'column', gap:'0.5rem', animation:'fadeIn 0.2s ease-in-out' }}>
            <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#374151' }}>Recuperar Senha</p>
            <p style={{ fontSize: '0.78rem', color: '#6b7280' }}>Digite o e-mail da sua conta para receber o link de redefinição.</p>
            {msgRec && (
              <div style={{ padding:'0.5rem', borderRadius:'4px', fontSize:'0.8rem', fontWeight:600, background: msgRec.tipo==='ok'?'#dcfce7':'#fef2f2', color: msgRec.tipo==='ok'?'#166534':'#dc2626' }}>
                {msgRec.tipo==='ok'?'✅ ':'⚠️ '}{msgRec.texto}
              </div>
            )}
            <input type="email" style={inp} placeholder="Seu e-mail..." value={emailRec} onChange={e=>setEmailRec(e.target.value)} />
            <button type="button" onClick={recuperarSenha} disabled={loadingRec} style={{
              width: '100%', padding: '0.625rem', borderRadius: '6px', border: '1px solid #15803d',
              background: '#fff', color: '#15803d', fontWeight: 700, fontSize: '0.85rem', cursor: loadingRec ? 'not-allowed' : 'pointer'
            }}>
              {loadingRec ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>
          </div>
        )}

        <button id="btn-login-submit" type="submit" disabled={loading} style={{
          width: '100%', padding: '0.875rem', borderRadius: '8px', border: 'none',
          background: loading ? '#6b7280' : '#15803d', color: '#fff',
          fontWeight: 800, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit', marginTop: '0.25rem', transition: 'background 0.15s'
        }}>
          {loading ? 'Entrando...' : '→ Entrar'}
        </button>
      </form>

      <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '1.5rem', paddingTop: '1.25rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          Não tem conta?{' '}
          <Link id="link-go-to-register" href="/cadastro"
            style={{ color: '#15803d', fontWeight: 700, textDecoration: 'none' }}>
            Criar conta grátis
          </Link>
        </p>
        <p style={{ fontSize: '0.75rem', color: '#d1d5db', marginTop: '0.75rem' }}>
          30 dias grátis · Sem cartão de crédito
        </p>
      </div>
    </div>
  )
}
