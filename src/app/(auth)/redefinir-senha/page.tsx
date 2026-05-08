'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RedefinirSenhaPage() {
  const router = useRouter()
  const [senha, setSenha] = useState('')
  const [confirma, setConfirma] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  const redefinir = async (e: React.FormEvent) => {
    e.preventDefault()
    if (senha.length < 6) { setErro('A senha deve ter no mínimo 6 caracteres.'); return }
    if (senha !== confirma) { setErro('As senhas não conferem.'); return }
    
    setErro(null)
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: senha })
    
    setLoading(false)
    if (error) {
      setErro(error.message)
      return
    }
    
    setSucesso(true)
    setTimeout(() => {
      router.push('/dashboard')
      router.refresh()
    }, 2000)
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
        Nova Senha
      </h2>
      <p style={{ color: '#6b7280', marginBottom: '1.75rem', fontSize: '0.9rem' }}>
        Digite sua nova senha abaixo
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

      {sucesso ? (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</p>
          <p style={{ fontWeight: 800, fontSize: '1.1rem', color: '#15803d' }}>Senha atualizada com sucesso!</p>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem' }}>Redirecionando para o painel...</p>
        </div>
      ) : (
        <form onSubmit={redefinir} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: '#374151', marginBottom: '0.375rem' }}>
              Nova Senha
            </label>
            <input type="password" style={inp} placeholder="Mínimo de 6 caracteres"
              value={senha} onChange={e => setSenha(e.target.value)} required />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: '#374151', marginBottom: '0.375rem' }}>
              Confirme a Senha
            </label>
            <input type="password" style={inp} placeholder="Repita a senha"
              value={confirma} onChange={e => setConfirma(e.target.value)} required />
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '0.875rem', borderRadius: '8px', border: 'none',
            background: loading ? '#6b7280' : '#15803d', color: '#fff',
            fontWeight: 800, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', marginTop: '0.25rem', transition: 'background 0.15s'
          }}>
            {loading ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </form>
      )}
    </div>
  )
}
