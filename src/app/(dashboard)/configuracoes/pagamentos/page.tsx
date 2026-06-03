'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { Plus, Trash2, Loader2, Pencil, Save } from 'lucide-react'
import { toast } from 'react-hot-toast'

type Forma = { id:string; nome:string; taxa:number|null; ativo:boolean }

const PADROES = [
  { nome:'PIX',     taxa:0    },
  { nome:'Dinheiro',taxa:0    },
  { nome:'Crédito', taxa:3.5  },
  { nome:'Débito',  taxa:1.8  },
]

export default function PagamentosPage() {
  const { empresaId } = useEmpresaId()
  const [formas,   setFormas]   = useState<Forma[]>([])
  const [loading,  setLoading]  = useState(true)
  const [nome,     setNome]     = useState('')
  const [taxa,     setTaxa]     = useState('')
  const [salvando, setSalvando] = useState(false)
  const [editando, setEditando] = useState<Forma|null>(null)

  useEffect(() => { if (empresaId) carregar(empresaId) }, [empresaId])

  async function carregar(eid: string) {
    setLoading(true)
    const { data } = await createClient().from('formas_pagamento').select('*').eq('empresa_id', eid).order('nome')
    if (!data || data.length === 0) await popularPadroes(eid)
    else { setFormas(data); setLoading(false) }
  }

  async function popularPadroes(eid: string) {
    const supabase = createClient()
    await supabase.from('formas_pagamento').insert(PADROES.map(p => ({ empresa_id:eid, nome:p.nome, taxa:p.taxa, ativo:true })))
    const { data } = await supabase.from('formas_pagamento').select('*').eq('empresa_id', eid).order('nome')
    setFormas(data || [])
    setLoading(false)
  }

  async function toggleAtivo(id: string, atual: boolean) {
    await createClient().from('formas_pagamento').update({ ativo: !atual }).eq('id', id)
    setFormas(prev => prev.map(f => f.id===id ? {...f, ativo:!atual} : f))
    toast.success('Status da forma de pagamento atualizado!')
  }

  function iniciarEdicao(f: Forma) {
    setEditando(f)
    setNome(f.nome)
    setTaxa(f.taxa !== null ? f.taxa.toString() : '')
  }

  function cancelarEdicao() {
    setEditando(null)
    setNome('')
    setTaxa('')
  }

  async function salvarEdicao() {
    if (!nome.trim() || !editando || !empresaId) return
    setSalvando(true)
    const tx = parseFloat(taxa)
    const finalTaxa = isNaN(tx) ? null : tx
    const { error } = await createClient().from('formas_pagamento')
      .update({ nome: nome.trim(), taxa: finalTaxa })
      .eq('id', editando.id)
    setSalvando(false)
    if (error) {
      toast.error('Erro ao editar: ' + error.message)
      return
    }
    setFormas(prev => prev.map(f => f.id === editando.id ? { ...f, nome: nome.trim(), taxa: finalTaxa } : f))
    toast.success('Forma de pagamento atualizada!')
    cancelarEdicao()
  }

  async function adicionar() {
    if (!nome.trim() || !empresaId) return
    setSalvando(true)
    const { data, error } = await createClient().from('formas_pagamento')
      .insert({ empresa_id:empresaId, nome:nome.trim(), taxa:parseFloat(taxa)||0, ativo:true })
      .select().single()
    setSalvando(false)
    if (error) {
      toast.error('Erro ao adicionar: ' + error.message)
      return
    }
    if (data) setFormas(prev => [...prev, data])
    setNome(''); setTaxa('')
    toast.success('Forma de pagamento adicionada!')
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta forma de pagamento?')) return
    const { error } = await createClient().from('formas_pagamento').delete().eq('id', id)
    if (error) {
      toast.error('Erro ao excluir: ' + error.message)
      return
    }
    setFormas(prev => prev.filter(f => f.id !== id))
    toast.success('Forma de pagamento excluída!')
  }

  const ICONS: Record<string,string> = { PIX:'📱', Dinheiro:'💵', Crédito:'💳', Débito:'💴', Fiado:'📒' }

  return (
    <div className="anim-fade" style={{ display:'flex', flexDirection:'column', gap:'0.875rem', maxWidth:'560px' }}>
      <div className="pg-header">
        <div><h1 className="pg-titulo">💳 Formas de Pagamento</h1>
          <p className="pg-sub">Ative, desative ou adicione formas de pagamento</p></div>
      </div>

      {/* Add / Edit Form */}
      <div className="card" style={{ padding:'0.875rem', display:'flex', gap:'0.625rem', alignItems:'flex-end' }}>
        <div style={{ flex:1 }}>
          <label className="campo-label">{editando ? 'Editar forma' : 'Nova forma'}</label>
          <input className="campo" style={{ marginTop:'0.375rem' }} placeholder="Ex: Transferência" value={nome} onChange={e=>setNome(e.target.value)}/>
        </div>
        <div style={{ width:'120px' }}>
          <label className="campo-label">Taxa (%)</label>
          <input className="campo" type="number" step="0.1" min="0" style={{ marginTop:'0.375rem' }} placeholder="0,0" value={taxa} onChange={e=>setTaxa(e.target.value)}/>
        </div>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          {editando && (
            <button onClick={cancelarEdicao} className="btn btn-ghost" style={{ height:'42px' }}>
              Cancelar
            </button>
          )}
          <button onClick={editando ? salvarEdicao : adicionar} disabled={salvando||!nome.trim()} className="btn btn-primary"
            style={{ display:'flex', alignItems:'center', gap:'0.375rem', height:'42px' }}>
            {salvando ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> : (editando ? <Save size={14}/> : <Plus size={14}/>)}
            {editando ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'2rem', gap:'0.75rem', color:'var(--texto-desab)' }}>
          <Loader2 size={18} style={{ animation:'spin 1s linear infinite' }}/> Carregando...
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.375rem' }}>
          {formas.map(f => (
            <div key={f.id} style={{
              display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.75rem 1rem',
              background:'var(--surface)', border:`1px solid ${f.ativo?'var(--borda)':'var(--borda-leve)'}`,
              borderRadius:'var(--radius)', opacity: f.ativo ? 1 : 0.55, transition:'opacity 0.2s'
            }}>
              <span style={{ fontSize:'1.25rem' }}>{ICONS[f.nome]||'💰'}</span>
              <div style={{ flex:1 }}>
                <p style={{ fontWeight:700 }}>{f.nome}</p>
                {(f.taxa||0) > 0 && <p style={{ fontSize:'0.75rem', color:'var(--texto-desab)' }}>Taxa: {f.taxa}%</p>}
              </div>
              {/* Toggle ativo */}
              <button onClick={() => toggleAtivo(f.id, f.ativo)} style={{
                position:'relative', width:'44px', height:'24px', borderRadius:'12px',
                border:'none', cursor:'pointer', background:f.ativo?'var(--verde)':'#666', transition:'background 0.2s'
              }}>
                <span style={{
                  position:'absolute', top:'2px', width:'20px', height:'20px', borderRadius:'50%',
                  background:'#fff', boxShadow:'0 1px 3px rgba(0,0,0,0.3)',
                  left: f.ativo?'22px':'2px', transition:'left 0.2s'
                }}/>
              </button>
              <button onClick={() => iniciarEdicao(f)} className="btn btn-secondary"
                style={{ padding:'0.25rem 0.5rem', color:'var(--texto)' }}>
                <Pencil size={13}/>
              </button>
              <button onClick={() => excluir(f.id)} className="btn btn-secondary"
                style={{ padding:'0.25rem 0.5rem', color:'var(--vermelho)' }}>
                <Trash2 size={13}/>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="alerta alerta-info" style={{ fontSize:'0.82rem' }}>
        💡 Formas desativadas não aparecem no PDV. As taxas são apenas informativas.
        <br/><span style={{fontSize:'0.75rem',color:'var(--texto-desab)',marginTop:'0.25rem',display:'block'}}>ℹ️ A forma de pagamento <strong>Fiado</strong> é exclusiva do plano <strong>PRO</strong>. Adicione-a manualmente caso tenha o plano PRO.</span>
      </div>
    </div>
  )
}
