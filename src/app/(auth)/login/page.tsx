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

  // Estilos limpos sem efeito terminal
  const labelStyle: React.CSSProperties = {
    display: 'block', fontWeight: 600, fontSize: '0.78rem',
    color: '#555555', marginBottom: '0.25rem',
  }
  const inpStyle: React.CSSProperties = {
    width: '100%', padding: '0.5rem 0.75rem',
    border: '1px solid #cccccc', borderRadius: '4px',
    fontSize: '0.85rem', outline: 'none',
    background: '#ffffff', color: '#111111',
    fontFamily: "'Inter', Arial, sans-serif",
    boxSizing: 'border-box', transition: 'border-color 0.12s, box-shadow 0.12s',
  }

  return (
    <div>
      <h2 style={{ fontWeight: 800, fontSize: '1.25rem', color: '#111111', marginBottom: '0.25rem' }}>
        Entrar na plataforma
      </h2>
      <p style={{ color: '#555555', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
        Digite suas credenciais para acessar o sistema
      </p>

      {erro && (
        <div style={{
          background: '#fdf2f1', border: '1px solid #f1a99e', borderLeft: '3px solid #c0392b',
          padding: '0.625rem 0.75rem', marginBottom: '1rem', color: '#c0392b',
          fontSize: '0.82rem', fontWeight: 500, borderRadius: '3px',
        }}>
          {erro}
        </div>
      )}

      <form onSubmit={entrar} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={labelStyle}>E-mail</label>
          <input id="login-email" type="email" style={inpStyle}
            placeholder="usuario@suporte.com"
            value={email} onChange={e => setEmail(e.target.value)}
            onFocus={e => { e.target.style.borderColor = '#1a7a3c'; e.target.style.boxShadow = '0 0 0 2px rgba(26,122,60,0.15)' }}
            onBlur={e  => { e.target.style.borderColor = '#cccccc'; e.target.style.boxShadow = 'none' }}
            required />
        </div>

        <div>
          <label style={labelStyle}>Senha</label>
          <div style={{ position: 'relative' }}>
            <input id="login-senha" type={showPwd ? 'text' : 'password'}
              style={{ ...inpStyle, paddingRight: '2.75rem' }}
              placeholder="••••••••" value={senha} onChange={e => setSenha(e.target.value)}
              onFocus={e => { e.target.style.borderColor = '#1a7a3c'; e.target.style.boxShadow = '0 0 0 2px rgba(26,122,60,0.15)' }}
              onBlur={e  => { e.target.style.borderColor = '#cccccc'; e.target.style.boxShadow = 'none' }}
              required />
            <button type="button" onClick={() => setShowPwd(v => !v)} style={{
              position: 'absolute', right: '0.625rem', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: '#999999', fontSize: '0.75rem',
              fontFamily: 'inherit',
            }}>
              {showPwd ? 'Ocultar' : 'Ver'}
            </button>
          </div>
          <div style={{ textAlign: 'right', marginTop: '0.375rem' }}>
            <button type="button" id="link-forgot-password"
              onClick={() => { setShowRec(!showRec); setMsgRec(null) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1a7a3c', fontSize: '0.78rem', fontFamily: 'inherit', fontWeight: 500 }}>
              Esqueci minha senha
            </button>
          </div>
        </div>

        {/* Recuperação inline */}
        {showRec && (
          <div style={{ background: '#f5f5f5', padding: '0.875rem', border: '1px solid #cccccc', borderLeft: '3px solid #1a7a3c', display:'flex', flexDirection:'column', gap:'0.5rem', borderRadius: '3px' }} className="anim-fade">
            <p style={{ fontWeight: 700, fontSize: '0.82rem', color: '#111111' }}>Recuperar acesso</p>
            {msgRec && (
              <div style={{ padding:'0.4rem 0.625rem', fontSize:'0.78rem', fontWeight:500,
                background: msgRec.tipo==='ok'?'#e8f5ee':'#fdf2f1',
                color: msgRec.tipo==='ok'?'#1a7a3c':'#c0392b',
                border: `1px solid ${msgRec.tipo==='ok'?'#a8d5ba':'#f1a99e'}`,
                borderRadius: '3px',
              }}>
                {msgRec.texto}
              </div>
            )}
            <input type="email" style={inpStyle} placeholder="Seu e-mail" value={emailRec} onChange={e => setEmailRec(e.target.value)}
              onFocus={e => { e.target.style.borderColor = '#1a7a3c'; e.target.style.boxShadow = '0 0 0 2px rgba(26,122,60,0.15)' }}
              onBlur={e  => { e.target.style.borderColor = '#cccccc'; e.target.style.boxShadow = 'none' }}
            />
            <button type="button" onClick={recuperarSenha} disabled={loadingRec} style={{
              width: '100%', padding: '0.45rem', border: '1px solid #1a7a3c',
              background: '#1a7a3c', color: '#fff', fontWeight: 600, fontSize: '0.82rem',
              cursor: loadingRec ? 'not-allowed' : 'pointer', fontFamily: 'Inter, Arial, sans-serif', borderRadius: '3px',
              opacity: loadingRec ? 0.6 : 1,
            }}>
              {loadingRec ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>
          </div>
        )}

        <button id="btn-login-submit" type="submit" disabled={loading}
          className="btn btn-primary"
          style={{ width: '100%', fontSize: '0.9rem', padding: '0.7rem', marginTop: '0.25rem', fontWeight: 700 }}>
          {loading ? 'Verificando...' : 'Entrar no sistema'}
        </button>
      </form>

      <div style={{ borderTop: '1px solid #e5e5e5', marginTop: '1.25rem', paddingTop: '1rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.82rem', color: '#555555' }}>
          Não tem acesso?{' '}
          <Link id="link-go-to-register" href="/cadastro" style={{ color: '#1a7a3c', fontWeight: 700, textDecoration: 'none' }}>
            Criar conta grátis
          </Link>
        </p>
        <p style={{ fontSize: '0.72rem', color: '#999999', marginTop: '0.375rem' }}>
          30 dias grátis · Sem cartão de crédito
        </p>
      </div>
    </div>
  )
}
