'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { Plus, Search, Loader2, X } from 'lucide-react'
import { PageTabs } from '@/components/PageTabs'
import { useSubscription } from '@/hooks/useSubscription'

type OS = {
  id: string; numero: number; cliente_nome: string; cliente_tel: string | null
  equipamento: string; defeito_relatado: string; status: string
  orcamento: number | null; tecnico: string | null; criado_em: string; previsao: string | null
}

const STATUS_LABEL: Record<string, string> = {
  aguardando:   'AGUARDANDO',
  aprovado:     'APROVADO',
  em_servico:   'EM SERVICO',
  concluido:    'CONCLUIDO',
  entregue:     'ENTREGUE',
  cancelado:    'CANCELADO',
}
const STATUS_CLS: Record<string, string> = {
  aguardando: 'status-neutro', aprovado: 'status-aviso',
  em_servico: 'status-aviso',  concluido: 'status-ok',
  entregue:   'status-ok',     cancelado: 'status-perigo',
}
const FLUXO: Record<string, string> = {
  aguardando:'aprovado', aprovado:'em_servico', em_servico:'concluido', concluido:'entregue'
}

export default function OrdensServicoPage() {
  const { empresaId } = useEmpresaId()
  const { plano } = useSubscription()
  const [ordens,   setOrdens]   = useState<OS[]>([])
  const [busca,    setBusca]    = useState('')
  const [filtro,   setFiltro]   = useState('todos')
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro,     setErro]     = useState<string | null>(null)
  const [form, setForm]         = useState({
    cliente_nome: '', cliente_tel: '', equipamento: '',
    defeito_relatado: '', orcamento: '', tecnico: '', previsao: ''
  })

  useEffect(() => { if (empresaId) carregar(empresaId) }, [empresaId])

  async function carregar(eid: string) {
    setLoading(true)
    const { data } = await createClient()
      .from('ordens_servico')
      .select('id,numero,cliente_nome,cliente_tel,equipamento,defeito_relatado,status,orcamento,tecnico,criado_em,previsao')
      .eq('empresa_id', eid)
      .order('criado_em', { ascending: false })
    setOrdens(data || [])
    setLoading(false)
  }

  async function salvar() {
    if (!form.cliente_nome || !form.equipamento || !form.defeito_relatado) {
      setErro('Preencha cliente, equipamento e defeito.'); return
    }
    if (!empresaId) return
    setSalvando(true); setErro(null)
    const { error } = await createClient().from('ordens_servico').insert({
      empresa_id:       empresaId,
      cliente_nome:     form.cliente_nome,
      cliente_tel:      form.cliente_tel || null,
      equipamento:      form.equipamento,
      defeito_relatado: form.defeito_relatado,
      orcamento:        form.orcamento ? parseFloat(form.orcamento) : null,
      tecnico:          form.tecnico || null,
      previsao:         form.previsao || null,
      status:           'aguardando',
    })
    setSalvando(false)
    if (error) { setErro('Erro: ' + error.message); return }
    setShowForm(false)
    setForm({ cliente_nome:'', cliente_tel:'', equipamento:'', defeito_relatado:'', orcamento:'', tecnico:'', previsao:'' })
    carregar(empresaId)
  }

  async function avancar(id: string, status: string) {
    const next = FLUXO[status]
    if (!next) return
    await createClient().from('ordens_servico').update({ status: next }).eq('id', id)
    setOrdens(prev => prev.map(o => o.id === id ? { ...o, status: next } : o))
  }

  async function cancelar(id: string) {
    if (!confirm('Cancelar esta Ordem de Serviço?')) return
    await createClient().from('ordens_servico').update({ status: 'cancelado' }).eq('id', id)
    setOrdens(prev => prev.map(o => o.id === id ? { ...o, status: 'cancelado' } : o))
  }

  const filtradas = ordens.filter(o => {
    const match = o.cliente_nome.toLowerCase().includes(busca.toLowerCase()) ||
      o.equipamento.toLowerCase().includes(busca.toLowerCase()) ||
      String(o.numero).includes(busca)
    return match && (filtro === 'todos' || o.status === filtro)
  })

  const abertas = ordens.filter(o => !['entregue','cancelado'].includes(o.status)).length

  return (
    <div className="anim-fade" style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">ORDENS DE SERVIÇO</h1>
          <p className="pg-sub">{ordens.length} OS REGISTRADAS · {abertas} EM ABERTO</p>
        </div>
        <button onClick={() => setShowForm(v=>!v)} className="btn btn-primary">
          {showForm ? '✕ CANCELAR' : '+ NOVA OS'}
        </button>
      </div>

      <PageTabs tabs={[
        { label: 'Garantias', href: '/garantias' },
        { label: 'Ordens de Serviço', href: '/ordens-de-servico' },
        { label: plano === 'pro' ? 'Comissões' : 'Comissões 🔒', href: '/comissoes' }
      ]} />

      {/* Formulário Modal */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
          onClick={e=>{if(e.target===e.currentTarget)setShowForm(false)}}>
          <div className="anim-pop" style={{ width:'100%', maxWidth:'600px', maxHeight:'90vh', overflowY:'auto', background:'var(--surface)', border:'1px solid var(--borda-forte)', borderRadius:'2px' }}>
            <div style={{ padding:'0.75rem 1rem', borderBottom:'2px solid var(--verde)', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:'var(--fundo-painel)', zIndex:10 }}>
              <div>
                <p style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--verde)', textTransform:'uppercase', letterSpacing:'0.06em' }}>NOVA ORDEM DE SERVIÇO</p>
                <p style={{ fontSize:'0.65rem', color:'var(--texto-desab)' }}>Preencha os dados do equipamento</p>
              </div>
              <button onClick={()=>setShowForm(false)} className="btn-icon"><X size={16}/></button>
            </div>
            <div style={{ padding:'1.25rem', display:'flex', flexDirection:'column', gap:'0.75rem' }}>
              {erro && <div className="alerta alerta-perigo">{erro}</div>}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.625rem' }}>
                <div>
                  <label className="campo-label">Cliente *</label>
                  <input className="campo" style={{ marginTop:'0.375rem' }} placeholder="Nome do cliente"
                    value={form.cliente_nome} onChange={e=>setForm(f=>({...f,cliente_nome:e.target.value}))}/>
                </div>
                <div>
                  <label className="campo-label">WhatsApp</label>
                  <input className="campo" style={{ marginTop:'0.375rem' }} placeholder="(11) 99999-0000"
                    value={form.cliente_tel} onChange={e=>setForm(f=>({...f,cliente_tel:e.target.value}))}/>
                </div>
              </div>
              <div>
                <label className="campo-label">Equipamento *</label>
                <input className="campo" style={{ marginTop:'0.375rem' }} placeholder="Ex: Som Pioneer DEH-S1253UB"
                  value={form.equipamento} onChange={e=>setForm(f=>({...f,equipamento:e.target.value}))}/>
              </div>
              <div>
                <label className="campo-label">Defeito relatado *</label>
                <textarea className="campo" rows={2} style={{ marginTop:'0.375rem', resize:'none' }}
                  placeholder="Descreva o problema..."
                  value={form.defeito_relatado} onChange={e=>setForm(f=>({...f,defeito_relatado:e.target.value}))}/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.625rem' }}>
                <div>
                  <label className="campo-label">Orçamento (R$)</label>
                  <input className="campo" type="number" step="0.01" style={{ marginTop:'0.375rem' }}
                    placeholder="0,00" value={form.orcamento} onChange={e=>setForm(f=>({...f,orcamento:e.target.value}))}/>
                </div>
                <div>
                  <label className="campo-label">Técnico responsável</label>
                  <input className="campo" style={{ marginTop:'0.375rem' }} placeholder="Nome do técnico"
                    value={form.tecnico} onChange={e=>setForm(f=>({...f,tecnico:e.target.value}))}/>
                </div>
                <div>
                  <label className="campo-label">Previsão de entrega</label>
                  <input className="campo" type="date" style={{ marginTop:'0.375rem' }}
                    value={form.previsao} onChange={e=>setForm(f=>({...f,previsao:e.target.value}))}/>
                </div>
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.5rem', marginTop:'0.5rem' }}>
                <button onClick={()=>setShowForm(false)} className="btn btn-secondary" style={{fontSize:'0.72rem'}}>CANCELAR</button>
                <button onClick={salvar} disabled={salvando} className="btn btn-primary" style={{fontSize:'0.72rem'}}>
                  {salvando ? 'SALVANDO...' : '▶ CRIAR OS'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div style={{ display:'flex', gap:'0.375rem', flexWrap:'wrap', alignItems:'center' }}>
        {[['todos','TODAS'],['aguardando','AGUARD.'],['em_servico','EM SERV.'],['concluido','CONCLUÍDA'],['entregue','ENTREGUE']].map(([v,l])=>(
          <button key={v} onClick={()=>setFiltro(v)}
            className={filtro===v?'btn btn-primary':'btn btn-secondary'}
            style={{fontSize:'0.65rem',padding:'0.3rem 0.625rem'}}>{l}</button>
        ))}
        <input className="campo" placeholder="BUSCAR OS, CLIENTE OU EQUIP._"
          style={{flex:1,maxWidth:'260px'}} value={busca} onChange={e=>setBusca(e.target.value)}/>
      </div>

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:'2rem',flexDirection:'column',alignItems:'center',gap:'0.5rem'}}>
          <p style={{color:'var(--verde)',fontSize:'0.75rem',letterSpacing:'0.08em'}}>CARREGANDO ORDENS<span className="blink">_</span></p>
        </div>
      ) : filtradas.length === 0 ? (
        <div style={{textAlign:'center',padding:'3rem',color:'var(--texto-desab)',border:'1px solid var(--borda)',background:'var(--surface)'}}>
          <p style={{fontSize:'0.7rem',letterSpacing:'0.1em',fontWeight:700,marginBottom:'0.375rem'}}>
            {busca||filtro!=='todos' ? '[ NENHUMA OS ENCONTRADA ]' : '[ NENHUMA OS REGISTRADA ]'}
          </p>
          {!busca&&filtro==='todos'&&(
            <button onClick={()=>setShowForm(true)} className="btn btn-primary" style={{marginTop:'0.5rem',fontSize:'0.72rem'}}>+ CRIAR PRIMEIRA OS</button>
          )}
        </div>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead><tr>
                <th>#</th><th>CLIENTE</th><th>EQUIPAMENTO</th>
                <th>DEFEITO</th><th>TÉCNICO</th>
                <th style={{textAlign:'right'}}>ORÇ.</th>
                <th>PREVISÃO</th>
                <th style={{textAlign:'center'}}>STATUS</th>
                <th style={{textAlign:'center'}}>AÇÃO</th>
            </tr></thead>
            <tbody>
              {filtradas.map(o => (
                <tr key={o.id}>
                  <td style={{color:'var(--texto-mono)',fontWeight:700,fontSize:'0.75rem'}}>#{String(o.numero||'').padStart(4,'0')}</td>
                  <td>
                    <p style={{fontWeight:700,fontSize:'0.82rem'}}>{o.cliente_nome}</p>
                    {o.cliente_tel && (
                      <a href={`https://wa.me/55${o.cliente_tel.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                        style={{fontSize:'0.65rem',color:'var(--verde)'}}>WA {o.cliente_tel}</a>
                    )}
                  </td>
                  <td style={{fontWeight:600,fontSize:'0.78rem'}}>{o.equipamento}</td>
                  <td style={{fontSize:'0.72rem',color:'var(--texto-desab)',maxWidth:'140px'}}>
                    <span title={o.defeito_relatado} style={{display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'140px'}}>{o.defeito_relatado}</span>
                  </td>
                  <td style={{fontSize:'0.72rem',color:'var(--texto-sec)'}}>{o.tecnico||'—'}</td>
                  <td style={{textAlign:'right',fontWeight:700,color:'var(--verde)',fontVariantNumeric:'tabular-nums'}}>
                    {o.orcamento ? `R$ ${o.orcamento.toFixed(2)}` : '—'}
                  </td>
                  <td style={{fontSize:'0.72rem',color:o.previsao&&o.previsao<new Date().toISOString().slice(0,10)?'var(--vermelho)':'var(--texto-desab)'}}>
                    {o.previsao ? new Date(o.previsao+'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td style={{textAlign:'center'}}>
                    <span className={STATUS_CLS[o.status]||'status-neutro'} style={{fontSize:'0.65rem',fontWeight:700}}>
                      {STATUS_LABEL[o.status]||o.status}
                    </span>
                  </td>
                  <td style={{textAlign:'center',display:'flex',gap:'0.25rem',justifyContent:'center'}}>
                    <a href={`/ordens-de-servico/${o.id}`} className="btn btn-secondary" style={{fontSize:'0.62rem',padding:'0.15rem 0.4rem'}}>VER</a>
                    {FLUXO[o.status] && (
                      <button onClick={()=>avancar(o.id,o.status)}
                        className="btn btn-secondary" style={{fontSize:'0.62rem',padding:'0.15rem 0.4rem'}}>
                        → {STATUS_LABEL[FLUXO[o.status]]}
                      </button>
                    )}
                    {!['entregue','cancelado'].includes(o.status) && (
                      <button onClick={()=>cancelar(o.id)}
                        className="btn btn-secondary" style={{fontSize:'0.62rem',padding:'0.15rem 0.4rem',color:'var(--vermelho)'}}>
                        ✕ CANCELAR
                      </button>
                    )}
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
