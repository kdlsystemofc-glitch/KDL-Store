'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { Plus, Trash2, Loader2 } from 'lucide-react'

type Categoria = { id: string; nome: string; cor: string; criado_em: string }

const CORES = ['#22c55e','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899']

export default function CategoriasPage() {
  const { empresaId } = useEmpresaId()
  const [cats,     setCats]     = useState<Categoria[]>([])
  const [loading,  setLoading]  = useState(true)
  const [nome,     setNome]     = useState('')
  const [cor,      setCor]      = useState(CORES[0])
  const [salvando, setSalvando] = useState(false)
  const [erro,     setErro]     = useState<string|null>(null)

  useEffect(() => { if (empresaId) carregar(empresaId) }, [empresaId])

  async function carregar(eid: string) {
    setLoading(true)
    const { data } = await createClient().from('categorias_produto').select('*').eq('empresa_id', eid).order('nome')
    setCats(data || [])
    setLoading(false)
  }

  async function salvar() {
    if (!nome.trim()) { setErro('Digite o nome da categoria.'); return }
    if (!empresaId) return
    setSalvando(true); setErro(null)
    const { error } = await createClient().from('categorias_produto').insert({ empresa_id: empresaId, nome: nome.trim(), cor })
    setSalvando(false)
    if (error) { setErro('Erro: ' + error.message); return }
    setNome(''); setCor(CORES[0])
    carregar(empresaId)
  }

  async function excluir(id: string, nomeC: string) {
    if (!confirm(`Excluir a categoria "${nomeC}"?`)) return
    await createClient().from('categorias_produto').delete().eq('id', id)
    setCats(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="anim-fade" style={{ display:'flex', flexDirection:'column', gap:'0.875rem', maxWidth:'560px' }}>
      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">🏷️ Categorias de Produto</h1>
          <p className="pg-sub">{cats.length} categoria(s) cadastrada(s)</p>
        </div>
      </div>

      {/* Formulário de nova categoria */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div className="sec-header"><span>➕ Nova Categoria</span></div>
        <div style={{ padding:'0.875rem', display:'flex', flexDirection:'column', gap:'0.75rem' }}>
          {erro && <div className="alerta alerta-perigo">{erro}</div>}
          <div style={{ display:'flex', gap:'0.625rem', alignItems:'flex-end' }}>
            <div style={{ flex:1 }}>
              <label className="campo-label">Nome</label>
              <input className="campo" style={{ marginTop:'0.375rem' }} placeholder="Ex: Eletrônicos"
                value={nome} onChange={e => setNome(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && salvar()}/>
            </div>
            <button onClick={salvar} disabled={salvando} className="btn btn-primary"
              style={{ display:'flex', alignItems:'center', gap:'0.375rem', height:'42px' }}>
              {salvando ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> : <Plus size={14}/>}
              Adicionar
            </button>
          </div>
          {/* Seletor de cor */}
          <div>
            <label className="campo-label">Cor</label>
            <div style={{ display:'flex', gap:'0.5rem', marginTop:'0.375rem', flexWrap:'wrap' }}>
              {CORES.map(c => (
                <button key={c} onClick={() => setCor(c)} style={{
                  width:'32px', height:'32px', borderRadius:'50%', background:c, border:'none', cursor:'pointer',
                  outline: cor===c ? `3px solid ${c}` : 'none',
                  outlineOffset: '2px', transform: cor===c ? 'scale(1.2)' : 'scale(1)',
                  transition: 'transform 0.15s'
                }}/>
              ))}
              {/* Preview */}
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginLeft:'0.5rem' }}>
                <span style={{ background:cor, color:'#fff', padding:'3px 10px', borderRadius:'12px', fontSize:'0.78rem', fontWeight:700 }}>
                  {nome || 'Prévia'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'2rem', gap:'0.75rem', color:'var(--texto-desab)' }}>
          <Loader2 size={18} style={{ animation:'spin 1s linear infinite' }}/> Carregando...
        </div>
      ) : cats.length === 0 ? (
        <div style={{ textAlign:'center', padding:'2rem', color:'var(--texto-desab)' }}>
          <p>Nenhuma categoria cadastrada ainda. As categorias ajudam a organizar seus produtos.</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.375rem' }}>
          {cats.map(c => (
            <div key={c.id} style={{
              display:'flex', alignItems:'center', gap:'0.75rem',
              padding:'0.75rem', background:'var(--surface)', border:'1px solid var(--borda)', borderRadius:'var(--radius)'
            }}>
              <div style={{ width:'14px', height:'14px', borderRadius:'50%', background:c.cor, flexShrink:0 }}/>
              <span style={{ flex:1, fontWeight:700 }}>{c.nome}</span>
              <span style={{ fontSize:'0.75rem', color:'var(--texto-desab)' }}>
                {new Date(c.criado_em).toLocaleDateString('pt-BR')}
              </span>
              <button onClick={() => excluir(c.id, c.nome)} className="btn btn-secondary"
                style={{ padding:'0.25rem 0.5rem', color:'var(--vermelho)' }}>
                <Trash2 size={13}/>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
