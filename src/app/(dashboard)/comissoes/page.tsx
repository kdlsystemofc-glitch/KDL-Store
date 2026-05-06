'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { formatCurrency } from '@/lib/utils'
import { Plus, Loader2, Trash2, X, Save } from 'lucide-react'

type Comissao = { id:string; nome:string; telefone:string|null; tipo:string; taxa:number; status:string; criado_em:string }

export default function ComissoesPage() {
  const { empresaId } = useEmpresaId()
  const [lista,    setLista]    = useState<Comissao[]>([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [nome,     setNome]     = useState('')
  const [tel,      setTel]      = useState('')
  const [tipo,     setTipo]     = useState<'percentual'|'fixo'>('percentual')
  const [taxa,     setTaxa]     = useState('')

  useEffect(() => { if (empresaId) carregar(empresaId) }, [empresaId])

  async function carregar(eid: string) {
    setLoading(true)
    const { data } = await createClient().from('comissoes').select('*').eq('empresa_id', eid).order('criado_em', { ascending: false })
    setLista(data||[])
    setLoading(false)
  }

  async function salvar() {
    if (!nome.trim()||!taxa||!empresaId) return
    setSalvando(true)
    const { data } = await createClient().from('comissoes')
      .insert({ empresa_id:empresaId, nome:nome.trim(), telefone:tel||null, tipo, taxa:parseFloat(taxa), status:'ativo' })
      .select().single()
    if (data) setLista(prev=>[data,...prev])
    setModal(false); setNome(''); setTel(''); setTaxa(''); setSalvando(false)
  }

  async function alterarStatus(id: string, status: string) {
    const novo = status==='ativo'?'inativo':'ativo'
    await createClient().from('comissoes').update({ status:novo }).eq('id', id)
    setLista(prev=>prev.map(c=>c.id===id?{...c,status:novo}:c))
  }

  async function excluir(id: string) {
    if (!confirm('Remover este comissionado?')) return
    await createClient().from('comissoes').delete().eq('id', id)
    setLista(prev=>prev.filter(c=>c.id!==id))
  }

  const ativos   = lista.filter(c=>c.status==='ativo')
  const inativos = lista.filter(c=>c.status!=='ativo')

  return (
    <div className="anim-fade" style={{display:'flex',flexDirection:'column',gap:'0.875rem',maxWidth:'780px'}}>
      {modal&&(
        <div style={{position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center'}}
          onClick={e=>{if(e.target===e.currentTarget)setModal(false)}}>
          <div className="card anim-pop" style={{width:'100%',maxWidth:'420px',padding:'1.25rem'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
              <p style={{fontWeight:900}}>+ Cadastrar Comissionado</p>
              <button onClick={()=>setModal(false)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--texto-desab)'}}><X size={18}/></button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'0.625rem'}}>
              <div><label className="campo-label">Nome *</label><input className="campo" style={{marginTop:'0.375rem'}} value={nome} onChange={e=>setNome(e.target.value)} placeholder="Ex: Carlos Peixoto"/></div>
              <div><label className="campo-label">WhatsApp</label><input className="campo" style={{marginTop:'0.375rem'}} value={tel} onChange={e=>setTel(e.target.value)} placeholder="(11) 99999-0000"/></div>
              <div>
                <label className="campo-label">Tipo de comissão</label>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.375rem',marginTop:'0.375rem'}}>
                  {(['percentual','fixo'] as const).map(t=>(
                    <button key={t} onClick={()=>setTipo(t)} type="button" style={{padding:'0.5rem',border:`2px solid ${tipo===t?'var(--verde)':'var(--borda)'}`,borderRadius:'var(--radius-sm)',background:tipo===t?'var(--verde-claro)':'var(--surface)',cursor:'pointer',fontWeight:700,fontSize:'0.8rem',fontFamily:'inherit',color:tipo===t?'var(--verde-esc)':'var(--texto-sec)'}}>
                      {t==='percentual'?'% Percentual':'R$ Fixo/venda'}
                    </button>
                  ))}
                </div>
              </div>
              <div><label className="campo-label">{tipo==='percentual'?'Percentual (%)':'Valor fixo por venda (R$)'} *</label>
                <input className="campo" type="number" min="0" step="0.01" style={{marginTop:'0.375rem'}} value={taxa} onChange={e=>setTaxa(e.target.value)} placeholder={tipo==='percentual'?'Ex: 3':'Ex: 20,00'}/></div>
            </div>
            <div style={{display:'flex',gap:'0.5rem',marginTop:'1rem',justifyContent:'flex-end'}}>
              <button onClick={()=>setModal(false)} className="btn btn-ghost">Cancelar</button>
              <button onClick={salvar} className="btn btn-primary" disabled={!nome.trim()||!taxa||salvando} style={{display:'flex',alignItems:'center',gap:'0.375rem'}}>
                {salvando?<Loader2 size={14} style={{animation:'spin 1s linear infinite'}}/>:<Save size={14}/>} Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pg-header">
        <div><h1 className="pg-titulo">🎯 Comissões</h1>
          <p className="pg-sub">{ativos.length} comissionado(s) ativo(s)</p></div>
        <button className="btn btn-primary" onClick={()=>setModal(true)} style={{display:'flex',alignItems:'center',gap:'0.375rem'}}>
          <Plus size={14}/> Cadastrar
        </button>
      </div>

      <div className="alerta alerta-info" style={{fontSize:'0.82rem'}}>
        💡 Comissionados recebem por cada venda onde foram indicadores. Configure % sobre a venda ou valor fixo por pedido.
      </div>

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:'2rem',gap:'0.75rem',color:'var(--texto-desab)'}}>
          <Loader2 size={18} style={{animation:'spin 1s linear infinite'}}/> Carregando...
        </div>
      ) : lista.length===0 ? (
        <div style={{textAlign:'center',padding:'3rem',color:'var(--texto-desab)'}}>
          <p style={{fontSize:'2rem',marginBottom:'0.5rem'}}>🎯</p>
          <p style={{fontWeight:700}}>Nenhum comissionado cadastrado</p>
          <p style={{fontSize:'0.85rem',marginTop:'0.25rem'}}>Cadastre pessoas que indicam clientes para sua loja</p>
          <button onClick={()=>setModal(true)} className="btn btn-primary" style={{marginTop:'0.75rem'}}>+ Cadastrar primeiro</button>
        </div>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr style={{background:'#364a60'}}>
                <th>Nome</th><th>WhatsApp</th><th style={{textAlign:'center'}}>Tipo</th>
                <th style={{textAlign:'right'}}>Taxa</th><th style={{textAlign:'center'}}>Status</th><th style={{textAlign:'center'}}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {lista.map(c=>(
                <tr key={c.id} style={{opacity:c.status==='ativo'?1:0.5}}>
                  <td style={{fontWeight:700}}>{c.nome}</td>
                  <td style={{fontSize:'0.82rem',color:'var(--texto-sec)'}}>{c.telefone||'—'}</td>
                  <td style={{textAlign:'center'}}>
                    <span className={c.tipo==='percentual'?'status-info':'status-neutro'} style={{fontSize:'0.78rem'}}>
                      {c.tipo==='percentual'?'% Percentual':'R$ Fixo'}
                    </span>
                  </td>
                  <td style={{textAlign:'right',fontWeight:700}}>
                    {c.tipo==='percentual'?`${c.taxa}%`:formatCurrency(c.taxa)+'/venda'}
                  </td>
                  <td style={{textAlign:'center'}}>
                    <button onClick={()=>alterarStatus(c.id,c.status)} style={{background:'none',border:'none',cursor:'pointer',padding:0}}>
                      <span className={c.status==='ativo'?'status-ok':'status-neutro'} style={{fontSize:'0.78rem'}}>
                        {c.status==='ativo'?'● Ativo':'○ Inativo'}
                      </span>
                    </button>
                  </td>
                  <td style={{textAlign:'center'}}>
                    <div style={{display:'flex',gap:'0.25rem',justifyContent:'center'}}>
                      {c.telefone&&(
                        <a href={`https://wa.me/55${c.telefone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                          className="btn btn-secondary" style={{fontSize:'0.7rem',padding:'0.25rem 0.5rem',background:'#25D366',color:'#fff',border:'none'}}>
                          💬
                        </a>
                      )}
                      <button onClick={()=>excluir(c.id)} className="btn btn-secondary" style={{fontSize:'0.7rem',padding:'0.25rem 0.5rem',color:'var(--vermelho)'}}>
                        <Trash2 size={12}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
