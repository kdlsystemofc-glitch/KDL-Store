'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const inp: React.CSSProperties = {
  width: '100%', padding: '0.65rem 0.875rem',
  border: '1px solid var(--borda)', borderRadius: 'var(--r-lg)',
  fontSize: '0.88rem', outline: 'none', background: '#fff', color: 'var(--texto)',
  fontFamily: "'Nunito Sans', sans-serif", boxSizing: 'border-box',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}
const lbl: React.CSSProperties = {
  display: 'block', fontWeight: 600, fontSize: '0.78rem',
  color: 'var(--muted)', marginBottom: '0.3rem',
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showRec, setShowRec] = useState(false)
  const [emailRec, setEmailRec] = useState('')
  const [loadingRec, setLoadingRec] = useState(false)
  const [msgRec, setMsgRec] = useState<{tipo:'ok'|'erro', texto:string}|null>(null)

  const focus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'var(--verde)'
    e.target.style.boxShadow = '0 0 0 3px rgba(0,191,165,0.12)'
  }
  const blur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'var(--borda)'
    e.target.style.boxShadow = 'none'
  }

  const recuperarSenha = async () => {
    if (!emailRec) { setMsgRec({tipo:'erro', texto:'Preencha o e-mail.'}); return }
    setLoadingRec(true); setMsgRec(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(emailRec, {
      redirectTo: `${window.location.origin}/auth/callback?next=/redefinir-senha`,
    })
    setLoadingRec(false)
    if (error) setMsgRec({tipo:'erro', texto: error.message})
    else { setMsgRec({tipo:'ok', texto:'Link enviado. Verifique sua caixa de entrada.'}); setTimeout(() => setShowRec(false), 8000) }
  }

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !senha) { setErro('Preencha e-mail e senha.'); return }
    setErro(null); setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    setLoading(false)
    if (error) {
      setErro(error.message.includes('Email not confirmed')
        ? 'Confirme seu e-mail antes de entrar.'
        : 'E-mail ou senha incorretos.')
      return
    }
    router.push('/dashboard'); router.refresh()
  }

  return (
    <div>
      <h2 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: '1.3rem', color: 'var(--texto)', marginBottom: '0.25rem' }}>
        Entrar na plataforma
      </h2>
      <p style={{ color: 'var(--muted)', marginBottom: '1.75rem', fontSize: '0.85rem' }}>
        Digite suas credenciais para acessar o sistema
      </p>

      {erro && (
        <div style={{
          background: '#fdf2f1', border: '1px solid #f1a99e', borderLeft: '3px solid var(--laranja)',
          padding: '0.625rem 0.875rem', marginBottom: '1rem', color: 'var(--laranja)',
          fontSize: '0.82rem', fontWeight: 600, borderRadius: 'var(--r-sm)',
        }}>
          {erro}
        </div>
      )}

      <form onSubmit={entrar} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={lbl}>E-mail</label>
          <input id="login-email" type="email" style={inp}
            placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)}
            onFocus={focus} onBlur={blur} required />
        </div>

        <div>
          <label style={lbl}>Senha</label>
          <div style={{ position: 'relative' }}>
            <input id="login-senha" type={showPwd ? 'text' : 'password'}
              style={{ ...inp, paddingRight: '3rem' }}
              placeholder="••••••••" value={senha} onChange={e => setSenha(e.target.value)}
              onFocus={focus} onBlur={blur} required />
            <button type="button" onClick={() => setShowPwd(v => !v)} style={{
              position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '0.72rem',
              fontFamily: 'inherit', fontWeight: 600,
            }}>
              {showPwd ? 'Ocultar' : 'Ver'}
            </button>
          </div>
          <div style={{ textAlign: 'right', marginTop: '0.375rem' }}>
            <button type="button" id="link-forgot-password"
              onClick={() => { setShowRec(!showRec); setMsgRec(null) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--roxo)', fontSize: '0.78rem', fontFamily: 'inherit', fontWeight: 600 }}>
              Esqueci minha senha
            </button>
          </div>
        </div>

        {/* Recuperação inline */}
        {showRec && (
          <div style={{ background: 'var(--fundo)', padding: '1rem', border: '1px solid var(--borda)', borderLeft: '3px solid var(--verde)', display:'flex', flexDirection:'column', gap:'0.5rem', borderRadius: '0 var(--r-md) var(--r-md) 0' }}>
            <p style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--texto)' }}>Recuperar acesso</p>
            {msgRec && (
              <div style={{ padding:'0.4rem 0.625rem', fontSize:'0.78rem', fontWeight:600,
                background: msgRec.tipo==='ok'?'rgba(0,191,165,0.08)':'#fdf2f1',
                color: msgRec.tipo==='ok'?'var(--verde)':'var(--laranja)',
                border: `1px solid ${msgRec.tipo==='ok'?'rgba(0,191,165,0.2)':'#f1a99e'}`,
                borderRadius: 'var(--r-sm)',
              }}>
                {msgRec.texto}
              </div>
            )}
            <input type="email" style={inp} placeholder="Seu e-mail" value={emailRec} onChange={e => setEmailRec(e.target.value)}
              onFocus={focus} onBlur={blur} />
            <button type="button" onClick={recuperarSenha} disabled={loadingRec} style={{
              width: '100%', padding: '0.55rem', border: 'none',
              background: 'var(--verde)', color: '#fff', fontWeight: 700, fontSize: '0.82rem',
              cursor: loadingRec ? 'not-allowed' : 'pointer', fontFamily: 'inherit', borderRadius: 'var(--r-lg)',
              opacity: loadingRec ? 0.6 : 1,
            }}>
              {loadingRec ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>
          </div>
        )}

        <button id="btn-login-submit" type="submit" disabled={loading}
          style={{
            width: '100%', fontSize: '0.92rem', padding: '0.75rem', marginTop: '0.25rem', fontWeight: 700,
            background: 'var(--verde)', color: '#fff', border: 'none', borderRadius: 'var(--r-lg)',
            cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            boxShadow: 'var(--sombra-cta)', opacity: loading ? 0.7 : 1,
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}>
          {loading ? 'Verificando...' : 'Entrar no sistema'}
        </button>
      </form>

      <div style={{ borderTop: '1px solid var(--borda)', marginTop: '1.5rem', paddingTop: '1.25rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
          Não tem conta?{' '}
          <Link id="link-go-to-register" href="/cadastro" style={{ color: 'var(--roxo)', fontWeight: 700, textDecoration: 'none' }}>
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  )
}
