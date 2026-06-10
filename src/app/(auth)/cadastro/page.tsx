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

export default function CadastroPage() {
  const [nomeLoja, setNomeLoja] = useState('')
  const [tipo, setTipo] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  const senhaForte = senha.length >= 8 && /[A-Z]/.test(senha) && /[0-9]/.test(senha) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(senha)

  const focus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = 'var(--verde)'
    e.target.style.boxShadow = '0 0 0 3px rgba(0,191,165,0.12)'
  }
  const blur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = 'var(--borda)'
    e.target.style.boxShadow = 'none'
  }

  const cadastrar = async (e: React.FormEvent) => {
    e.preventDefault(); setErro(null)
    if (!nomeLoja || !tipo || !email || !senha || !confirmar) { setErro('Preencha todos os campos.'); return }
    if (senha !== confirmar) { setErro('As senhas não coincidem.'); return }
    if (!senhaForte) { setErro('Senha fraca. Use 8+ caracteres, 1 maiúscula, 1 número e 1 caractere especial (!@#$...).'); return }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email, password: senha,
      options: { data: { nome_loja: nomeLoja, tipo_negocio: tipo } }
    })
    setLoading(false)
    if (error) { setErro(error.message); return }
    setSucesso(true)
  }

  if (sucesso) return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
      <h2 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: '1.3rem', color: 'var(--texto)', marginBottom: '0.5rem' }}>
        Verifique seu e-mail!
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
        Enviamos um link de confirmação para <strong style={{ color: 'var(--texto)' }}>{email}</strong>.
        <br />Clique no link para ativar sua conta.
      </p>
      <div style={{
        background: 'rgba(0,191,165,0.08)', border: '1px solid rgba(0,191,165,0.2)', borderRadius: 'var(--r-lg)',
        padding: '0.875rem', marginBottom: '1.5rem', fontSize: '0.82rem', color: 'var(--verde)', fontWeight: 600
      }}>
        ✉️ Verifique também a pasta de spam.
      </div>
      <Link href="/login" style={{
        display: 'block', width: '100%', padding: '0.75rem', borderRadius: 'var(--r-lg)',
        background: 'var(--verde)', color: '#fff', fontWeight: 700, fontSize: '0.92rem',
        textDecoration: 'none', textAlign: 'center', boxSizing: 'border-box',
        boxShadow: 'var(--sombra-cta)',
      }}>
        Ir para o Login →
      </Link>
    </div>
  )

  return (
    <div>
      <h2 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: '1.3rem', color: 'var(--texto)', marginBottom: '0.25rem' }}>
        Criar sua conta
      </h2>
      <p style={{ color: 'var(--muted)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
        Preencha os dados abaixo para começar
      </p>

      {/* Badges de features */}
      <div style={{
        background: 'rgba(0,191,165,0.06)', border: '1px solid rgba(0,191,165,0.15)', borderRadius: 'var(--r-lg)',
        padding: '0.5rem 0.875rem', marginBottom: '1.25rem',
        display: 'flex', flexWrap: 'wrap', gap: '0.5rem'
      }}>
        {['PDV completo', 'Estoque real-time', 'Garantias digitais', 'Suporte WhatsApp'].map(b => (
          <span key={b} style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--verde)' }}>✓ {b}</span>
        ))}
      </div>

      {erro && (
        <div style={{
          background: '#fdf2f1', border: '1px solid #f1a99e', borderLeft: '3px solid var(--laranja)',
          padding: '0.625rem 0.875rem', marginBottom: '1rem', color: 'var(--laranja)',
          fontSize: '0.82rem', fontWeight: 600, borderRadius: 'var(--r-sm)',
        }}>
          {erro}
        </div>
      )}

      <form onSubmit={cadastrar} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        <div>
          <label style={lbl}>Nome da sua loja *</label>
          <input id="cad-nome-loja" style={inp} placeholder="Ex: Eletrônicos do João"
            value={nomeLoja} onChange={e => setNomeLoja(e.target.value)} onFocus={focus} onBlur={blur} />
        </div>

        <div>
          <label style={lbl}>Tipo de negócio *</label>
          <select id="cad-tipo" style={{ ...inp, cursor: 'pointer' }}
            value={tipo} onChange={e => setTipo(e.target.value)} onFocus={focus as any} onBlur={blur as any}>
            {tiposNegocio.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
          </select>
        </div>

        <div>
          <label style={lbl}>E-mail *</label>
          <input id="cad-email" type="email" style={inp} placeholder="seu@email.com"
            value={email} onChange={e => setEmail(e.target.value)} onFocus={focus} onBlur={blur} />
        </div>

        <div>
          <label style={lbl}>
            Senha * <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '0.72rem' }}>(8+ chars, 1 maiúscula, 1 número, 1 especial)</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input id="cad-senha" type={showPwd ? 'text' : 'password'}
              style={{ ...inp, paddingRight: '3rem' }} placeholder="Mínimo 8 caracteres"
              value={senha} onChange={e => setSenha(e.target.value)} onFocus={focus} onBlur={blur} />
            <button type="button" onClick={() => setShowPwd(v => !v)} style={{
              position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '0.72rem',
              fontFamily: 'inherit', fontWeight: 600,
            }}>
              {showPwd ? 'Ocultar' : 'Ver'}
            </button>
          </div>
          {senha.length > 0 && (
            <div style={{ marginTop: '0.375rem', display: 'flex', gap: '0.5rem' }}>
              {[
                { ok: senha.length >= 8, l: '8+ chars' },
                { ok: /[A-Z]/.test(senha), l: 'Maiúscula' },
                { ok: /[0-9]/.test(senha), l: 'Número' },
                { ok: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(senha), l: 'Especial' },
              ].map(c => (
                <span key={c.l} style={{ fontSize: '0.72rem', fontWeight: 600, color: c.ok ? 'var(--verde)' : 'var(--muted)' }}>
                  {c.ok ? '✓' : '○'} {c.l}
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label style={lbl}>Confirmar senha *</label>
          <input id="cad-confirmar" type={showPwd ? 'text' : 'password'} style={{
            ...inp, borderColor: confirmar && confirmar !== senha ? 'var(--laranja)' : undefined
          }}
            placeholder="Repita a senha" value={confirmar} onChange={e => setConfirmar(e.target.value)}
            onFocus={focus} onBlur={blur} />
          {confirmar && confirmar !== senha && (
            <p style={{ fontSize: '0.75rem', color: 'var(--laranja)', marginTop: '0.25rem', fontWeight: 600 }}>
              As senhas não coincidem
            </p>
          )}
        </div>

        <button id="btn-register-submit" type="submit" disabled={loading} style={{
          width: '100%', padding: '0.75rem', borderRadius: 'var(--r-lg)', border: 'none',
          background: loading ? 'var(--muted)' : 'var(--verde)', color: '#fff',
          fontWeight: 700, fontSize: '0.92rem', cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit', marginTop: '0.25rem', boxShadow: 'var(--sombra-cta)',
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}>
          {loading ? 'Criando conta...' : 'Criar minha conta'}
        </button>

        <p style={{ fontSize: '0.72rem', color: 'var(--muted)', textAlign: 'center' }}>
          Ao criar sua conta você concorda com os{' '}
          <span style={{ color: 'var(--roxo)', fontWeight: 600, cursor: 'pointer' }}>Termos de Uso</span>
          {' '}e{' '}
          <span style={{ color: 'var(--roxo)', fontWeight: 600, cursor: 'pointer' }}>Política de Privacidade</span>
        </p>
      </form>

      <div style={{ borderTop: '1px solid var(--borda)', marginTop: '1.25rem', paddingTop: '1rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
          Já tem uma conta?{' '}
          <Link id="link-go-to-login" href="/login" style={{ color: 'var(--roxo)', fontWeight: 700, textDecoration: 'none' }}>
            Entrar no sistema
          </Link>
        </p>
      </div>
    </div>
  )
}
