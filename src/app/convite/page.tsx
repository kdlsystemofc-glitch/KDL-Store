'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

export default function ConvitePage() {
  const router = useRouter()
  const [token,    setToken]    = useState('')
  const [convite,  setConvite]  = useState<{email:string;nome:string|null;papel:string}|null>(null)
  const [invalid,  setInvalid]  = useState(false)
  const [step,     setStep]     = useState<'loading'|'form'|'success'|'error'>('loading')
  const [nome,     setNome]     = useState('')
  const [senha,    setSenha]    = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro,     setErro]     = useState('')

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('token') || ''
    setToken(t)

    if (!t) {
      setInvalid(true)
      setStep('form')
      return
    }

    // Valida o token via API server-side (service role bypassa o RLS).
    // Necessário porque o usuário convidado ainda não tem sessão/profile.
    fetch(`/api/convite?token=${encodeURIComponent(t)}`)
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok || !json.convite) {
          setInvalid(true)
          setStep('form')
        } else {
          setConvite(json.convite)
          setNome(json.convite.nome || '')
          setStep('form')
        }
      })
      .catch(() => {
        setInvalid(true)
        setStep('form')
      })
  }, [])

  async function criarConta() {
    setErro('')
    if (!nome.trim())             { setErro('Informe seu nome.'); return }
    if (senha.length < 6)         { setErro('A senha deve ter pelo menos 6 caracteres.'); return }
    if (senha !== confirm)         { setErro('As senhas não coincidem.'); return }
    if (!convite)                  { setErro('Convite inválido.'); return }
    setSalvando(true)

    const supabase = createClient()

    // Verifica se o usuário já está autenticado (veio pelo link do e-mail Supabase)
    const { data: { session } } = await supabase.auth.getSession()

    if (session?.user) {
      // Usuário já autenticado via magic link do e-mail — atualiza o nome e redireciona
      await supabase.auth.updateUser({ data: { nome: nome.trim() } })
      setStep('success')
      setTimeout(() => router.push('/dashboard'), 2500)
      return
    }

    // Fluxo de link copiado (sem autenticação prévia): tenta criar conta
    const { data, error } = await supabase.auth.signUp({
      email:    convite.email,
      password: senha,
      options:  { data: { invite_token: token, nome: nome.trim() } }  // CHAVE CORRETA: invite_token
    })

    if (error) {
      // E-mail já cadastrado no Supabase (de um convite anterior)
      if (error.message.toLowerCase().includes('already registered') ||
          error.message.toLowerCase().includes('already been registered')) {
        setErro(
          'Este e-mail já possui uma conta. Use o link enviado por e-mail ou faça login normalmente.'
        )
      } else {
        setErro(error.message)
      }
      setSalvando(false)
      return
    }

    if (!data.session) {
      // Supabase pediu confirmação por e-mail (autoconfirm desativado)
      setErro(
        'Verifique seu e-mail e clique no link de confirmação para ativar sua conta.'
      )
      setSalvando(false)
      return
    }

    setStep('success')
    setTimeout(() => router.push('/dashboard'), 2500)
  }

  const PAPEL_DESC: Record<string,string> = {
    admin:      'Administrador — acesso total',
    vendedor:   'Vendedor — vendas e clientes',
    estoquista: 'Estoquista — produtos e estoque',
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--fundo)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ width:'100%', maxWidth:'420px' }}>

        {/* Logo KDL Store */}
        <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
          <Link href="/" style={{ textDecoration:'none', display:'inline-flex', alignItems:'baseline', gap:'2px', justifyContent:'center' }}>
            <span style={{ color:'var(--verde)', fontWeight:900, fontSize:'1.8rem', fontFamily:"'Nunito', sans-serif", fontStyle:'italic' }}>K</span>
            <span style={{ color:'var(--texto)', fontWeight:700, fontSize:'1.1rem', fontFamily:"'Nunito', sans-serif" }}>DL Store</span>
          </Link>
          <p style={{ fontSize:'0.85rem', color:'var(--texto-desab)', marginTop:'4px' }}>Sistema de Gestão para Lojas</p>
        </div>

        <div className="card" style={{ padding:'1.75rem' }}>
          {step === 'loading' && (
            <div style={{ display:'flex', justifyContent:'center', padding:'2rem', gap:'0.75rem', color:'var(--texto-desab)' }}>
              <Loader2 size={20} style={{ animation:'spin 1s linear infinite' }}/> Verificando convite...
            </div>
          )}

          {step === 'form' && invalid && (
            <div style={{ textAlign:'center', padding:'1rem' }}>
              <XCircle size={48} style={{ color:'var(--vermelho)', margin:'0 auto 1rem' }}/>
              <p style={{ fontWeight:800, fontSize:'1.1rem', marginBottom:'0.5rem' }}>Convite inválido ou expirado</p>
              <p style={{ color:'var(--texto-desab)', fontSize:'0.85rem', marginBottom:'1.25rem' }}>
                Este link de convite não existe ou já foi utilizado. Solicite um novo convite ao administrador da loja.
              </p>
              <Link href="/login" className="btn btn-primary">Ir para o Login</Link>
            </div>
          )}

          {step === 'form' && !invalid && convite && (
            <>
              <div style={{ textAlign:'center', marginBottom:'1.25rem' }}>
                <p style={{ fontWeight:900, fontSize:'1.1rem' }}>🎉 Você foi convidado!</p>
                <p style={{ fontSize:'0.82rem', color:'var(--texto-desab)', marginTop:'4px' }}>
                  Crie sua senha para acessar o sistema
                </p>
              </div>

              {/* Info do convite */}
              <div style={{ padding:'0.75rem', background:'var(--verde-claro)', border:'1px solid var(--verde-borda)', borderRadius:'var(--radius-sm)', marginBottom:'1.25rem' }}>
                <p style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--verde-esc)' }}>📧 {convite.email}</p>
                <p style={{ fontSize:'0.75rem', color:'var(--verde-esc)', marginTop:'2px' }}>
                  {PAPEL_DESC[convite.papel] || convite.papel}
                </p>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
                <div>
                  <label className="campo-label">Seu Nome Completo</label>
                  <input className="campo" style={{ marginTop:'0.375rem' }} value={nome} onChange={e=>setNome(e.target.value)} placeholder="Ex: João da Silva"/>
                </div>
                <div>
                  <label className="campo-label">Criar Senha <span style={{ color:'var(--vermelho)' }}>*</span></label>
                  <input className="campo" type="password" style={{ marginTop:'0.375rem' }} value={senha} onChange={e=>setSenha(e.target.value)} placeholder="Mínimo 6 caracteres"/>
                </div>
                <div>
                  <label className="campo-label">Confirmar Senha <span style={{ color:'var(--vermelho)' }}>*</span></label>
                  <input className="campo" type="password" style={{ marginTop:'0.375rem' }} value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Repita a senha"/>
                </div>
                {erro && <div className="alerta alerta-perigo" style={{ fontSize:'0.82rem' }}>{erro}</div>}
                <button onClick={criarConta} disabled={salvando} className="btn btn-primary"
                  style={{ width:'100%', justifyContent:'center', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                  {salvando ? <><Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> Criando conta...</> : '🔓 Criar Conta e Entrar'}
                </button>
              </div>
            </>
          )}

          {step === 'success' && (
            <div style={{ textAlign:'center', padding:'1rem' }}>
              <CheckCircle size={48} style={{ color:'var(--verde)', margin:'0 auto 1rem' }}/>
              <p style={{ fontWeight:800, fontSize:'1.1rem', marginBottom:'0.5rem' }}>Conta criada com sucesso!</p>
              <p style={{ color:'var(--texto-desab)', fontSize:'0.85rem' }}>
                Redirecionando para o sistema...
              </p>
              <Loader2 size={18} style={{ animation:'spin 1s linear infinite', color:'var(--verde)', margin:'1rem auto 0', display:'block' }}/>
            </div>
          )}
        </div>

        <p style={{ textAlign:'center', fontSize:'0.75rem', color:'var(--texto-desab)', marginTop:'1rem' }}>
          Já tem conta? <Link href="/login" style={{ color:'var(--verde)', fontWeight:600 }}>Fazer login</Link>
        </p>
      </div>
    </div>
  )
}
