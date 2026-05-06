'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const tiposNegocio = [
  { v: '', l: 'Selecione seu negócio...' },
  { v: 'eletronicos',  l: '🔊 Eletrônicos / Som Automotivo' },
  { v: 'acessorios',   l: '🚗 Acessórios para Veículos' },
  { v: 'roupas',       l: '👕 Roupas e Calçados' },
  { v: 'alimentacao',  l: '🍕 Alimentação' },
  { v: 'papelaria',    l: '📚 Papelaria / Livraria' },
  { v: 'geral',        l: '🏪 Comércio Geral' },
  { v: 'outro',        l: 'Outro' },
]

export default function CadastroPage() {
  const [nomeLoja,   setNomeLoja]   = useState('')
  const [tipo,       setTipo]       = useState('')
  const [email,      setEmail]      = useState('')
  const [senha,      setSenha]      = useState('')
  const [confirmar,  setConfirmar]  = useState('')
  const [showPwd,    setShowPwd]    = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [erro,       setErro]       = useState<string | null>(null)
  const [sucesso,    setSucesso]    = useState(false)

  const senhaForte = senha.length >= 8 && /[A-Z]/.test(senha) && /[0-9]/.test(senha)

  const cadastrar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)

    if (!nomeLoja || !tipo || !email || !senha || !confirmar) {
      setErro('Preencha todos os campos.'); return
    }
    if (senha !== confirmar) { setErro('As senhas não coincidem.'); return }
    if (!senhaForte) { setErro('Senha fraca. Use 8+ caracteres, 1 maiúscula e 1 número.'); return }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome_loja: nomeLoja, tipo_negocio: tipo } }
    })
    setLoading(false)

    if (error) { setErro(error.message); return }
    setSucesso(true)
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '0.75rem 0.875rem', borderRadius: '8px',
    border: '1.5px solid #d1d5db', fontSize: '0.9rem', outline: 'none',
    background: '#fff', color: '#1a1a1a', fontFamily: 'inherit',
    boxSizing: 'border-box', transition: 'border-color 0.15s',
  }

  if (sucesso) return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
      <h2 style={{ fontWeight: 900, fontSize: '1.5rem', color: '#1a1a1a', marginBottom: '0.5rem' }}>
        Verifique seu e-mail!
      </h2>
      <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
        Enviamos um link de confirmação para <strong>{email}</strong>.
        <br />Clique no link para ativar sua conta e entrar no sistema.
      </p>
      <div style={{
        background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px',
        padding: '0.875rem', marginBottom: '1.5rem', fontSize: '0.83rem', color: '#15803d', fontWeight: 600
      }}>
        ✉️ Verifique também a pasta de spam se não encontrar o e-mail.
      </div>
      <Link href="/login" style={{
        display: 'block', width: '100%', padding: '0.875rem', borderRadius: '8px',
        background: '#15803d', color: '#fff', fontWeight: 800, fontSize: '1rem',
        textDecoration: 'none', textAlign: 'center', boxSizing: 'border-box'
      }}>
        → Ir para o Login
      </Link>
    </div>
  )

  return (
    <div>
      <h2 style={{ fontWeight: 900, fontSize: '1.75rem', color: '#1a1a1a', marginBottom: '0.25rem' }}>
        Criar conta grátis
      </h2>
      <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>
        30 dias gratuitos · Sem cartão de crédito
      </p>

      <div style={{
        background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '8px',
        padding: '0.625rem 1rem', marginBottom: '1.25rem',
        display: 'flex', flexWrap: 'wrap', gap: '0.5rem'
      }}>
        {['✓ PDV ilimitado', '✓ Controle de estoque', '✓ Garantias digitais', '✓ Suporte grátis'].map(b => (
          <span key={b} style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803d' }}>{b}</span>
        ))}
      </div>

      {erro && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px',
          padding: '0.75rem 1rem', marginBottom: '1rem', color: '#dc2626',
          fontSize: '0.85rem', fontWeight: 600
        }}>
          ⚠️ {erro}
        </div>
      )}

      <form onSubmit={cadastrar} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: '#374151', marginBottom: '0.375rem' }}>
            Nome da sua loja *
          </label>
          <input id="cad-nome-loja" style={inp} placeholder="Ex: Eletrônicos do João"
            value={nomeLoja} onChange={e => setNomeLoja(e.target.value)} />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: '#374151', marginBottom: '0.375rem' }}>
            Tipo de negócio *
          </label>
          <select id="cad-tipo" style={{ ...inp, cursor: 'pointer' }}
            value={tipo} onChange={e => setTipo(e.target.value)}>
            {tiposNegocio.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: '#374151', marginBottom: '0.375rem' }}>
            E-mail *
          </label>
          <input id="cad-email" type="email" style={inp} placeholder="seu@email.com"
            value={email} onChange={e => setEmail(e.target.value)} />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: '#374151', marginBottom: '0.375rem' }}>
            Senha * <span style={{ fontWeight: 400, color: '#9ca3af' }}>(mín. 8 chars, 1 maiúscula, 1 número)</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input id="cad-senha" type={showPwd ? 'text' : 'password'}
              style={{ ...inp, paddingRight: '2.75rem' }}
              placeholder="Mínimo 8 caracteres"
              value={senha} onChange={e => setSenha(e.target.value)} />
            <button type="button" onClick={() => setShowPwd(v => !v)} style={{
              position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', lineHeight: 1
            }}>
              {showPwd ? '🙈' : '👁'}
            </button>
          </div>
          {senha.length > 0 && (
            <div style={{ marginTop: '0.375rem', display: 'flex', gap: '0.375rem' }}>
              {[
                { ok: senha.length >= 8, l: '8+ chars' },
                { ok: /[A-Z]/.test(senha), l: 'Maiúscula' },
                { ok: /[0-9]/.test(senha), l: 'Número' },
              ].map(c => (
                <span key={c.l} style={{
                  fontSize: '0.72rem', fontWeight: 600,
                  color: c.ok ? '#15803d' : '#9ca3af'
                }}>
                  {c.ok ? '✓' : '○'} {c.l}
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: '#374151', marginBottom: '0.375rem' }}>
            Confirmar senha *
          </label>
          <input id="cad-confirmar" type={showPwd ? 'text' : 'password'} style={{
            ...inp,
            borderColor: confirmar && confirmar !== senha ? '#ef4444' : '#d1d5db'
          }}
            placeholder="Repita a senha"
            value={confirmar} onChange={e => setConfirmar(e.target.value)} />
          {confirmar && confirmar !== senha && (
            <p style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: '0.25rem', fontWeight: 600 }}>
              As senhas não coincidem
            </p>
          )}
        </div>

        <button id="btn-register-submit" type="submit" disabled={loading} style={{
          width: '100%', padding: '0.875rem', borderRadius: '8px', border: 'none',
          background: loading ? '#6b7280' : '#15803d', color: '#fff',
          fontWeight: 800, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit', marginTop: '0.25rem'
        }}>
          {loading ? 'Criando conta...' : '🚀 Criar minha conta grátis'}
        </button>

        <p style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center' }}>
          Ao criar sua conta você concorda com os{' '}
          <span style={{ color: '#6b7280', fontWeight: 600, cursor: 'pointer' }}>Termos de Uso</span>
          {' '}e{' '}
          <span style={{ color: '#6b7280', fontWeight: 600, cursor: 'pointer' }}>Política de Privacidade</span>
        </p>
      </form>

      <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '1.25rem', paddingTop: '1rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          Já tem uma conta?{' '}
          <Link id="link-go-to-login" href="/login"
            style={{ color: '#15803d', fontWeight: 700, textDecoration: 'none' }}>
            Entrar no sistema
          </Link>
        </p>
      </div>
    </div>
  )
}
