'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { Loader2 } from 'lucide-react'

type Usuario = { id:string; nome:string; email:string|null; papel:string; criado_em:string }

const PAPEL_LABEL: Record<string,string> = { admin:'👑 Admin', vendedor:'🛒 Vendedor', estoquista:'📦 Estoquista' }
const PAPEL_CLS:  Record<string,string> = { admin:'status-alerta', vendedor:'status-ok', estoquista:'status-aviso' }

export default function UsuariosPage() {
  const { empresaId } = useEmpresaId()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading,  setLoading]  = useState(true)
  const [meuId,    setMeuId]    = useState<string|null>(null)
  const [salvando, setSalvando] = useState<string|null>(null)

  useEffect(() => { if (empresaId) carregar(empresaId) }, [empresaId])

  async function carregar(eid: string) {
    setLoading(true)
    const supabase = createClient()
    const [{ data: users }, { data: { user } }] = await Promise.all([
      supabase.from('profiles').select('id,nome,papel,criado_em').eq('empresa_id', eid).order('criado_em'),
      supabase.auth.getUser(),
    ])
    setMeuId(user?.id || null)
    // Busca emails separado (auth.users não é acessível direto pelo client)
    setUsuarios((users || []).map(u => ({ ...u, email: null })))
    setLoading(false)
  }

  async function alterarPapel(uid: string, papel: string) {
    if (uid === meuId) return // não deixa se remover admin
    setSalvando(uid)
    await createClient().from('profiles').update({ papel }).eq('id', uid)
    setUsuarios(prev => prev.map(u => u.id===uid ? {...u, papel} : u))
    setSalvando(null)
  }

  return (
    <div className="anim-fade" style={{ display:'flex', flexDirection:'column', gap:'0.875rem', maxWidth:'680px' }}>
      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">👥 Usuários</h1>
          <p className="pg-sub">{usuarios.length} usuário(s) nesta empresa</p>
        </div>
      </div>

      <div className="alerta alerta-info" style={{ fontSize:'0.82rem' }}>
        💡 Para adicionar um novo usuário, compartilhe o link de cadastro. Ao criar a conta com o mesmo e-mail de domínio, ele será vinculado automaticamente à sua empresa.
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'2rem', gap:'0.75rem', color:'var(--texto-desab)' }}>
          <Loader2 size={18} style={{ animation:'spin 1s linear infinite' }}/> Carregando...
        </div>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr style={{ background:'#364a60' }}>
                <th>Usuário</th><th>Papel</th><th>Membro desde</th><th style={{ textAlign:'center' }}>Alterar Papel</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id}>
                  <td>
                    <p style={{ fontWeight:700 }}>{u.nome}</p>
                    {u.id===meuId && <span style={{ fontSize:'0.7rem', color:'var(--verde)', fontWeight:700 }}>← você</span>}
                  </td>
                  <td>
                    <span className={PAPEL_CLS[u.papel]||'status-neutro'} style={{ fontSize:'0.78rem' }}>
                      {PAPEL_LABEL[u.papel]||u.papel}
                    </span>
                  </td>
                  <td style={{ fontSize:'0.82rem', color:'var(--texto-desab)' }}>
                    {new Date(u.criado_em).toLocaleDateString('pt-BR')}
                  </td>
                  <td style={{ textAlign:'center' }}>
                    {u.id === meuId ? (
                      <span style={{ fontSize:'0.75rem', color:'var(--texto-desab)' }}>—</span>
                    ) : (
                      <div style={{ display:'flex', gap:'0.25rem', justifyContent:'center' }}>
                        {(['vendedor','estoquista','admin'] as const).filter(p => p !== u.papel).map(p => (
                          <button key={p} onClick={() => alterarPapel(u.id, p)}
                            disabled={salvando===u.id}
                            className="btn btn-secondary"
                            style={{ fontSize:'0.68rem', padding:'0.2rem 0.5rem' }}>
                            {salvando===u.id ? <Loader2 size={11} style={{ animation:'spin 1s linear infinite' }}/> : `→ ${p}`}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Plano */}
      <div className="card" style={{ padding:'1rem' }}>
        <p style={{ fontWeight:800, marginBottom:'0.5rem' }}>📋 Seu Plano</p>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <p style={{ fontWeight:700, fontSize:'1.1rem', color:'var(--verde)' }}>Plano Essencial</p>
            <p style={{ fontSize:'0.82rem', color:'var(--texto-desab)', marginTop:'2px' }}>
              Usuários ilimitados · Todos os módulos ativos
            </p>
          </div>
          <span className="status-ok" style={{ fontSize:'0.82rem' }}>● Ativo</span>
        </div>
      </div>
    </div>
  )
}
