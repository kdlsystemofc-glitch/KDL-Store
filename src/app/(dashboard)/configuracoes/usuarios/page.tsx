'use client'
import { toast } from 'react-hot-toast'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, Trash2, SnowflakeIcon, UserPlus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'

type Usuario = { id:string; nome:string; papel:string; status:string; criado_em:string }

const PAPEL_LABEL: Record<string,string> = { admin:'👑 Admin', vendedor:'🛒 Vendedor', estoquista:'📦 Estoquista' }
const PAPEL_CLS:  Record<string,string>  = { admin:'status-alerta', vendedor:'status-ok', estoquista:'status-aviso' }

export default function UsuariosPage() {
  const { empresaId } = useEmpresaId()
  const [usuarios,  setUsuarios]  = useState<Usuario[]>([])
  const [loading,   setLoading]   = useState(true)
  const [meuId,     setMeuId]     = useState<string|null>(null)
  const [modal,     setModal]     = useState(false)
  const [salvando,  setSalvando]  = useState<string|null>(null)

  // Campos de cadastro de usuário
  const [cNome,  setCNome]  = useState('')
  const [cEmail, setCEmail] = useState('')
  const [cSenha, setCSenha] = useState('')
  const [cPapel, setCPapel] = useState<'vendedor'|'estoquista'|'admin'>('vendedor')
  const [criando,setCriando]= useState(false)

  useEffect(() => { if (empresaId) carregar(empresaId) }, [empresaId])

  async function carregar(eid: string) {
    setLoading(true)
    const supabase = createClient()
    const results = await Promise.allSettled([
      supabase.from('profiles').select('id,nome,papel,status,criado_em').eq('empresa_id', eid).order('criado_em'),
      supabase.auth.getUser()
    ])
    const getRes = (i: number): any => results[i].status === 'fulfilled' ? (results[i] as PromiseFulfilledResult<any>).value || {} : {}
    const { data: users }   = getRes(0)
    const { data: userObj } = getRes(1)
    const user = userObj?.user
    setMeuId(user?.id || null)

    const MAP_DB_TO_UI: Record<string, string> = {
      admin: 'admin',
      operador: 'vendedor',
      visualizador: 'estoquista',
      vendedor: 'vendedor',
      estoquista: 'estoquista'
    }

    const mappedUsers = (users || []).map((u: any) => ({
      ...u,
      papel: MAP_DB_TO_UI[u.papel] || u.papel
    }))

    setUsuarios(mappedUsers)
    setLoading(false)
  }

  async function criarUsuario() {
    if (!cNome.trim()) { toast.error('Informe o nome completo.'); return }
    if (!cEmail.trim()) { toast.error('Informe o e-mail.'); return }
    if (cSenha.length < 6) { toast.error('A senha deve ter pelo menos 6 caracteres.'); return }
    if (!empresaId) return
    setCriando(true)
    
    try {
      const res = await fetch('/api/usuario/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cEmail.trim(),
          nome: cNome.trim(),
          senha: cSenha,
          papel: cPapel,
          empresaId
        })
      })
      
      const json = await res.json()
      setCriando(false)
      
      if (!res.ok) {
        toast.error(json.error || 'Erro ao cadastrar usuário')
        return
      }

      toast.success('Usuário cadastrado com sucesso!')
      setModal(false)
      setCNome('')
      setCEmail('')
      setCSenha('')
      setCPapel('vendedor')
      carregar(empresaId)
    } catch (err: any) {
      setCriando(false)
      toast.error('Erro de conexão ao cadastrar: ' + err.message)
    }
  }

  async function alterarPapel(uid: string, papel: string) {
    if (uid === meuId) return
    setSalvando(uid + '-papel')
    
    // Mapeia papel da UI para o banco de dados
    const MAP_UI_TO_DB: Record<string, string> = {
      admin: 'admin',
      vendedor: 'operador',
      estoquista: 'visualizador',
      operador: 'operador',
      visualizador: 'visualizador'
    }
    const dbPapel = MAP_UI_TO_DB[papel] || 'operador'

    await createClient().from('profiles').update({ papel: dbPapel }).eq('id', uid)
    setUsuarios(prev => prev.map(u => u.id===uid ? {...u, papel} : u))
    setSalvando(null)
  }

  async function toggleFreeze(uid: string, statusAtual: string) {
    if (uid === meuId) return
    const novoStatus = statusAtual === 'ativo' ? 'congelado' : 'ativo'
    setSalvando(uid + '-freeze')
    await createClient().from('profiles').update({ status: novoStatus }).eq('id', uid)
    setUsuarios(prev => prev.map(u => u.id===uid ? {...u, status: novoStatus} : u))
    setSalvando(null)
  }

  async function excluirUsuario(uid: string, nome: string) {
    if (uid === meuId) return
    if (!confirm(`Excluir "${nome}"? O usuário perderá acesso imediatamente.`)) return
    setSalvando(uid + '-del')
    // Soft delete: remove empresa_id e muda status
    await createClient().from('profiles').update({ empresa_id: null, status: 'excluido' }).eq('id', uid)
    setUsuarios(prev => prev.filter(u => u.id !== uid))
    setSalvando(null)
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div className="anim-fade" style={{ display:'flex', flexDirection:'column', gap:'1rem', maxWidth:'780px' }}>

      {/* Modal criar convite */}
      {modal && (
        <div style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={e => { if(e.target===e.currentTarget) setModal(false) }}>
          <div className="card anim-pop" style={{ width:'100%', maxWidth:'440px', padding:'1.5rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
              <p style={{ fontWeight:900, fontSize:'1rem' }}>👤 Convidar Usuário</p>
              <button onClick={() => setModal(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--texto-desab)' }}><X size={18}/></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
              <div>
                <label className="campo-label">Nome Completo <span style={{ color:'var(--vermelho)' }}>*</span></label>
                <input className="campo" style={{ marginTop:'0.375rem' }} value={cNome} onChange={e=>setCNome(e.target.value)} placeholder="Ex: João da Silva"/>
              </div>
              <div>
                <label className="campo-label">E-mail <span style={{ color:'var(--vermelho)' }}>*</span></label>
                <input className="campo" type="email" style={{ marginTop:'0.375rem' }} value={cEmail} onChange={e=>setCEmail(e.target.value)} placeholder="joao@exemplo.com"/>
              </div>
              <div>
                <label className="campo-label">Senha Temporária <span style={{ color:'var(--vermelho)' }}>*</span></label>
                <input className="campo" type="password" style={{ marginTop:'0.375rem' }} value={cSenha} onChange={e=>setCSenha(e.target.value)} placeholder="Mínimo 6 caracteres"/>
              </div>
              <div>
                <label className="campo-label">Papel no sistema</label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.375rem', marginTop:'0.375rem' }}>
                  {(['vendedor','estoquista','admin'] as const).map(p => (
                    <button key={p} onClick={() => setCPapel(p)} type="button"
                      style={{ padding:'0.5rem 0.25rem', border:`2px solid ${cPapel===p?'var(--verde)':'var(--borda)'}`, borderRadius:'var(--radius-sm)',
                        background: cPapel===p ? 'var(--verde-claro)' : 'var(--surface)', cursor:'pointer', fontWeight:700,
                        fontSize:'0.78rem', fontFamily:'inherit', color: cPapel===p ? 'var(--verde-esc)' : 'var(--texto-sec)' }}>
                      {PAPEL_LABEL[p]}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize:'0.72rem', color:'var(--texto-desab)', marginTop:'0.375rem' }}>
                  {cPapel==='admin'?'Acesso total ao sistema.':cPapel==='vendedor'?'Pode vender, ver clientes e produtos.':'Acesso ao estoque, sem vendas.'}
                </p>
              </div>
            </div>
            <div style={{ display:'flex', gap:'0.5rem', marginTop:'1.25rem', justifyContent:'flex-end' }}>
              <button onClick={() => setModal(false)} className="btn btn-ghost">Cancelar</button>
              <button onClick={criarUsuario} disabled={!cEmail.trim() || !cNome.trim() || cSenha.length < 6 || criando} className="btn btn-primary"
                style={{ display:'flex', alignItems:'center', gap:'0.375rem' }}>
                {criando ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> : <UserPlus size={14}/>}
                🔓 Cadastrar e Ativar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">👥 Usuários & Acessos</h1>
          <p className="pg-sub">{usuarios.length} usuário(s) ativo(s) na empresa</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}
          style={{ display:'flex', alignItems:'center', gap:'0.375rem' }}>
          <UserPlus size={14}/> Novo Colaborador
        </button>
      </div>

      {/* Lista de usuários */}
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'2rem', gap:'0.75rem', color:'var(--texto-desab)' }}>
          <Loader2 size={18} style={{ animation:'spin 1s linear infinite' }}/> Carregando...
        </div>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr style={{ background:'#364a60' }}>
                <th>Usuário</th>
                <th>Papel</th>
                <th style={{ textAlign:'center' }}>Status</th>
                <th>Membro desde</th>
                <th style={{ textAlign:'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id} style={{ opacity: u.status==='congelado' ? 0.6 : 1 }}>
                  <td>
                    <p style={{ fontWeight:700 }}>{u.nome}</p>
                    {u.id===meuId && <span style={{ fontSize:'0.7rem', color:'var(--verde)', fontWeight:700 }}>← você</span>}
                  </td>
                  <td>
                    <select
                      className="campo"
                      style={{ width:'auto', fontSize:'0.78rem', padding:'0.2rem 0.4rem' }}
                      value={u.papel}
                      disabled={u.id===meuId || salvando===u.id+'-papel'}
                      onChange={e => alterarPapel(u.id, e.target.value)}>
                      <option value="admin">👑 Admin</option>
                      <option value="vendedor">🛒 Vendedor</option>
                      <option value="estoquista">📦 Estoquista</option>
                    </select>
                  </td>
                  <td style={{ textAlign:'center' }}>
                    <span className={u.status==='ativo'?'status-ok':u.status==='congelado'?'status-info':'status-neutro'}
                      style={{ fontSize:'0.78rem' }}>
                      {u.status==='ativo'?'● Ativo':u.status==='congelado'?'❄️ Congelado':'○ Inativo'}
                    </span>
                  </td>
                  <td style={{ fontSize:'0.82rem', color:'var(--texto-desab)' }}>
                    {new Date(u.criado_em).toLocaleDateString('pt-BR')}
                  </td>
                  <td style={{ textAlign:'center' }}>
                    {u.id === meuId ? (
                      <span style={{ fontSize:'0.72rem', color:'var(--texto-desab)' }}>—</span>
                    ) : (
                      <div style={{ display:'flex', gap:'0.25rem', justifyContent:'center' }}>
                        <button
                          onClick={() => toggleFreeze(u.id, u.status)}
                          disabled={salvando===u.id+'-freeze'}
                          className="btn btn-secondary"
                          title={u.status==='ativo'?'Congelar acesso':'Descongelar'}
                          style={{ fontSize:'0.72rem', padding:'0.25rem 0.5rem' }}>
                          {salvando===u.id+'-freeze' ? <Loader2 size={11} style={{ animation:'spin 1s linear infinite' }}/>
                            : u.status==='ativo' ? '❄️' : '✅'}
                        </button>
                        <button
                          onClick={() => excluirUsuario(u.id, u.nome)}
                          disabled={salvando===u.id+'-del'}
                          className="btn btn-secondary"
                          title="Excluir usuário"
                          style={{ fontSize:'0.72rem', padding:'0.25rem 0.5rem', color:'var(--vermelho)' }}>
                          {salvando===u.id+'-del' ? <Loader2 size={11} style={{ animation:'spin 1s linear infinite' }}/> : <Trash2 size={12}/>}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card" style={{ padding:'0.875rem' }}>
        <p style={{ fontWeight:800, marginBottom:'0.375rem' }}>ℹ️ Sobre os papéis</p>
        <div style={{ display:'flex', flexDirection:'column', gap:'0.25rem', fontSize:'0.82rem', color:'var(--texto-sec)' }}>
          <p><strong>👑 Admin</strong> — Acesso total: vendas, produtos, financeiro, configurações e usuários</p>
          <p><strong>🛒 Vendedor</strong> — Pode fazer vendas, ver clientes e produtos, lançar OS</p>
          <p><strong>📦 Estoquista</strong> — Acesso ao estoque e produtos, sem módulo financeiro</p>
        </div>
      </div>
    </div>
  )
}
