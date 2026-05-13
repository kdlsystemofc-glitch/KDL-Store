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

  const [showRec,    setShowRec]    = useState(false)
  const [emailRec,   setEmailRec]   = useState('')
  const [loadingRec, setLoadingRec] = useState(false)
  const [msgRec,     setMsgRec]     = useState<{tipo:'ok'|'erro', texto:string}|null>(null)

  const recuperarSenha = async () => {
    if (!emailRec) { setMsgRec({tipo:'erro', texto:'Preencha o e-mail.'}); return }
    setLoadingRec(true); setMsgRec(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(emailRec, {
      redirectTo: `${window.location.origin}/auth/callback?next=/redefinir-senha`,
    })
    setLoadingRec(false)
    if (error) setMsgRec({tipo:'erro', texto:error.message})
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

  const labelStyle: React.CSSProperties = {
    display: 'block', fontWeight: 700, fontSize: '0.65rem',
    color: '#2E7D42', marginBottom: '0.25rem',
    textTransform: 'uppercase', letterSpacing: '0.07em',
  }

  const inpStyle: React.CSSProperties = {
    width: '100%', padding: '0.5rem 0.625rem',
    border: '1px solid #1A3D20', borderBottom: '2px solid #2D6B35',
    borderRadius: '2px', fontSize: '0.8rem', outline: 'none',
    background: '#0A0F0A', color: '#D4EDD4',
    fontFamily: "'IBM Plex Mono', monospace",
    boxSizing: 'border-box', transition: 'border-color 0.1s',
  }

  return (
    <div>
      <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#00CC44', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        ACESSO AO SISTEMA
      </h2>
      <p style={{ color: '#3D6B44', marginBottom: '1.5rem', fontSize: '0.72rem', letterSpacing: '0.04em' }}>
        Digite suas credenciais para continuar
      </p>

      {/* Linha separadora estilo terminal */}
      <div style={{ borderTop: '1px solid #1A3D20', marginBottom: '1.25rem', position: 'relative' }}>
        <span style={{
          position: 'absolute', top: '-9px', left: 0,
          background: '#060A06', paddingRight: '8px',
          fontSize: '0.6rem', color: '#1C4A28', letterSpacing: '0.06em',
        }}>LOGIN</span>
      </div>

      {erro && (
        <div style={{
          background: '#1A0505', border: '1px solid #FF4444', borderLeft: '3px solid #FF4444',
          padding: '0.5rem 0.75rem', marginBottom: '1rem', color: '#FF4444',
          fontSize: '0.75rem', fontWeight: 600,
        }}>
          ⚠ {erro}
        </div>
      )}

      <form onSubmit={entrar} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        <div>
          <label style={labelStyle}>E-MAIL</label>
          <input id="login-email" type="email" style={inpStyle}
            placeholder="usuario@loja.com"
            value={email} onChange={e => setEmail(e.target.value)}
            onFocus={e => { e.target.style.borderColor = '#00CC44'; e.target.style.borderBottomColor = '#00CC44'; e.target.style.background = '#0D1F0D' }}
            onBlur={e => { e.target.style.borderColor = '#1A3D20'; e.target.style.borderBottomColor = '#2D6B35'; e.target.style.background = '#0A0F0A' }}
            required />
        </div>

        <div>
          <label style={labelStyle}>SENHA</label>
          <div style={{ position: 'relative' }}>
            <input id="login-senha" type={showPwd ? 'text' : 'password'}
              style={{ ...inpStyle, paddingRight: '2.5rem' }}
              placeholder="••••••••" value={senha} onChange={e => setSenha(e.target.value)}
              onFocus={e => { e.target.style.borderColor = '#00CC44'; e.target.style.borderBottomColor = '#00CC44'; e.target.style.background = '#0D1F0D' }}
              onBlur={e => { e.target.style.borderColor = '#1A3D20'; e.target.style.borderBottomColor = '#2D6B35'; e.target.style.background = '#0A0F0A' }}
              required />
            <button type="button" onClick={() => setShowPwd(v => !v)} style={{
              position: 'absolute', right: '0.625rem', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: '#2E7D42', fontSize: '0.75rem',
              fontFamily: 'inherit',
            }}>
              {showPwd ? 'OCU' : 'VER'}
            </button>
          </div>
          <div style={{ textAlign: 'right', marginTop: '0.3rem' }}>
            <button type="button" id="link-forgot-password"
              onClick={() => { setShowRec(!showRec); setMsgRec(null) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2E7D42', fontSize: '0.65rem', fontFamily: 'inherit' }}>
              Esqueci minha senha
            </button>
          </div>
        </div>

        {/* Recuperação inline */}
        {showRec && (
          <div style={{ background: '#0A0F0A', padding: '0.875rem', border: '1px solid #1A3D20', borderLeft: '3px solid #00CC44', display:'flex', flexDirection:'column', gap:'0.5rem' }} className="anim-fade">
            <p style={{ fontWeight: 700, fontSize: '0.72rem', color: '#7EC882', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recuperar Acesso</p>
            {msgRec && (
              <div style={{ padding:'0.4rem 0.5rem', fontSize:'0.72rem', fontWeight:600, background: msgRec.tipo==='ok'?'#0D1F0D':'#1A0505', color: msgRec.tipo==='ok'?'#00CC44':'#FF4444', border: `1px solid ${msgRec.tipo==='ok'?'#1C4A28':'#3A0A0A'}` }}>
                {msgRec.tipo==='ok'?'OK: ':'ERRO: '}{msgRec.texto}
              </div>
            )}
            <input type="email" style={inpStyle} placeholder="Seu e-mail..." value={emailRec} onChange={e => setEmailRec(e.target.value)} />
            <button type="button" onClick={recuperarSenha} disabled={loadingRec} style={{
              width: '100%', padding: '0.4rem', border: '1px solid #1A3D20',
              background: '#0D1F0D', color: '#7EC882', fontWeight: 700, fontSize: '0.72rem',
              cursor: loadingRec ? 'not-allowed' : 'pointer', fontFamily: 'inherit', borderRadius: '2px',
            }}>
              {loadingRec ? 'Enviando...' : 'ENVIAR LINK'}
            </button>
          </div>
        )}

        <button id="btn-login-submit" type="submit" disabled={loading}
          className="btn btn-primary"
          style={{ width: '100%', fontSize: '0.82rem', padding: '0.625rem', marginTop: '0.25rem' }}>
          {loading ? 'Verificando...' : '▶ ENTRAR NO SISTEMA'}
        </button>
      </form>

      <div style={{ borderTop: '1px solid #0F2614', marginTop: '1.25rem', paddingTop: '1rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.72rem', color: '#3D6B44' }}>
          Não tem acesso?{' '}
          <Link id="link-go-to-register" href="/cadastro" style={{ color: '#00CC44', fontWeight: 700 }}>
            Criar conta grátis
          </Link>
        </p>
        <p style={{ fontSize: '0.62rem', color: '#1C4A28', marginTop: '0.5rem', letterSpacing: '0.04em' }}>
          30 dias grátis · Sem cartão de crédito
        </p>
      </div>
    </div>
  )
}
