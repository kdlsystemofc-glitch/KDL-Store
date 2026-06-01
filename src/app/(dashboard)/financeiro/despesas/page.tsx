'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { formatCurrency } from '@/lib/utils'
import { ArrowLeft, Plus, Trash2, Loader2, Pencil, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { PageTabs } from '@/components/PageTabs'
import { AdminOnly } from '@/components/AdminOnly'
import { ProOnly } from '@/components/ProOnly'

type Despesa = {
  id: string
  descricao: string
  categoria: string
  tipo: string
  valor: number
  data: string
  recorrente: boolean
  status: string
  numero_base: number | null
  numero_parcela: number | null
  total_parcelas: number | null
  identificador: string | null
  parent_id: string | null
}

const CATEGORIAS = ['Aluguel','Energia','Internet','Fornecedor','Transporte','Funcionário','Marketing','Manutenção','Imposto','Outros']

function statusBadge(s: string) {
  if (s === 'pago')     return { label: '✓ Pago',     bg: 'var(--verde-claro)',    color: 'var(--verde)',    border: 'var(--verde)' }
  if (s === 'atrasado') return { label: '⚠ Atrasado', bg: '#fff0f0',               color: 'var(--vermelho)', border: 'var(--vermelho)' }
  return                       { label: '● Pendente', bg: 'var(--surface-alt)',    color: 'var(--amarelo)', border: 'var(--amarelo)' }
}

const EMPTY_FORM = () => ({
  descricao: '', categoria: 'Outros', tipo: 'variavel' as 'fixa'|'variavel',
  valor: '', data: new Date().toISOString().slice(0,10), recorrente: false,
  parcelado: false, numParcelas: 2,
})

export default function DespesasPage() {
  const { empresaId } = useEmpresaId()

  const [mesSel, setMesSel] = useState(() => {
    const n = new Date()
    return { ano: n.getFullYear(), mes: n.getMonth() }
  })

  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro,     setErro]     = useState<string|null>(null)
  const [form, setForm] = useState(EMPTY_FORM())

  const [editTarget, setEditTarget] = useState<Despesa|null>(null)
  const [editForm,   setEditForm]   = useState({ descricao:'', categoria:'Outros', valor:'', data:'', status:'pendente' })
  const [editSalvando, setEditSalvando] = useState(false)

  const [baixando, setBaixando] = useState<string|null>(null)

  useEffect(() => { if (empresaId) carregar(empresaId) }, [empresaId, mesSel])

  const mesStr = `${mesSel.ano}-${String(mesSel.mes + 1).padStart(2,'0')}`
  const mesLabel = new Date(mesSel.ano, mesSel.mes, 1).toLocaleDateString('pt-BR', { month:'long', year:'numeric' })

  function navMes(delta: number) {
    setMesSel(prev => {
      let m = prev.mes + delta
      let a = prev.ano
      if (m > 11) { m = 0; a++ }
      if (m < 0)  { m = 11; a-- }
      return { ano: a, mes: m }
    })
  }

  async function carregar(eid: string) {
    setLoading(true)
    const supabase = createClient()

    const { data: todas } = await supabase
      .from('despesas')
      .select('*')
      .eq('empresa_id', eid)
      .order('data', { ascending: false })

    const lista = (todas || []) as Despesa[]

    const hoje = new Date().toISOString().slice(0,10)
    const isCurrentMonth = mesStr === hoje.slice(0,7)

    if (isCurrentMonth) {
      const fixas = lista.filter(d => d.tipo === 'fixa' && d.recorrente && !d.parent_id && !d.numero_parcela)
      const instanciasDoMes = lista.filter(d => d.data.startsWith(mesStr))

      const gerarParaId = fixas.filter(fixa =>
        !instanciasDoMes.some(inst =>
          (inst.parent_id === fixa.id || inst.id === fixa.id) && inst.data.startsWith(mesStr)
        )
      )

      if (gerarParaId.length > 0) {
        const maxBase = Math.max(0, ...lista.map(d => d.numero_base ?? 0))
        let nextBase = maxBase + 1

        const inserir = gerarParaId.map(fixa => {
          const diaOriginal = fixa.data.slice(8,10)
          const novaData = `${mesStr}-${diaOriginal}`
          const row = {
            empresa_id: eid,
            descricao: fixa.descricao,
            categoria: fixa.categoria,
            tipo: fixa.tipo,
            valor: fixa.valor,
            data: novaData,
            recorrente: false,
            status: 'pendente',
            numero_base: nextBase,
            numero_parcela: null,
            total_parcelas: null,
            identificador: String(nextBase),
            parent_id: fixa.id,
          }
          nextBase++
          return row
        })

        await supabase.from('despesas').insert(inserir)
        const { data: atualizado } = await supabase
          .from('despesas').select('*').eq('empresa_id', eid).order('data', { ascending: false })
        setDespesas((atualizado || []) as Despesa[])
        setLoading(false)
        return
      }
    }

    setDespesas(lista)
    setLoading(false)
  }

  const despMes = despesas.filter(d => d.data.startsWith(mesStr))
  const totalMes   = despMes.reduce((a,d) => a+d.valor, 0)
  const totalPago  = despMes.filter(d => d.status === 'pago').reduce((a,d) => a+d.valor, 0)
  const totalFixas = despMes.filter(d => d.tipo === 'fixa').reduce((a,d) => a+d.valor, 0)
  const pendentes  = despMes.filter(d => d.status === 'pendente' || d.status === 'atrasado').length

  async function salvar() {
    if (!form.descricao || !form.valor) { setErro('Preencha descrição e valor.'); return }
    if (!empresaId) return
    setSalvando(true); setErro(null)

    const supabase = createClient()
    const valor = parseFloat(form.valor)

    const maxBase = Math.max(0, ...despesas.map(d => d.numero_base ?? 0))
    let nextBase = maxBase + 1

    if (form.parcelado && form.numParcelas > 1) {
      const linhas = Array.from({ length: form.numParcelas }, (_, i) => {
        const dt = new Date(form.data + 'T12:00:00')
        dt.setMonth(dt.getMonth() + i)
        const dataStr = dt.toISOString().slice(0,10)
        return {
          empresa_id: empresaId,
          descricao: form.descricao,
          categoria: form.categoria,
          tipo: form.tipo,
          valor: +(valor / form.numParcelas).toFixed(2),
          data: dataStr,
          recorrente: false,
          status: 'pendente',
          numero_base: nextBase,
          numero_parcela: i + 1,
          total_parcelas: form.numParcelas,
          identificador: `${nextBase}-${i+1}`,
          parent_id: null,
        }
      })
      const { error } = await supabase.from('despesas').insert(linhas)
      setSalvando(false)
      if (error) { setErro('Erro ao salvar: '+error.message); return }
    } else {
      const { error } = await supabase.from('despesas').insert({
        empresa_id: empresaId,
        descricao: form.descricao,
        categoria: form.categoria,
        tipo: form.tipo,
        valor,
        data: form.data,
        recorrente: form.recorrente,
        status: 'pendente',
        numero_base: nextBase,
        numero_parcela: null,
        total_parcelas: null,
        identificador: String(nextBase),
        parent_id: null,
      })
      setSalvando(false)
      if (error) { setErro('Erro ao salvar: '+error.message); return }
    }

    setShowForm(false)
    setForm(EMPTY_FORM())
    carregar(empresaId)
  }

  async function darBaixa(d: Despesa) {
    setBaixando(d.id)
    await createClient().from('despesas').update({ status: 'pago' }).eq('id', d.id)
    setDespesas(prev => prev.map(x => x.id === d.id ? { ...x, status: 'pago' } : x))
    setBaixando(null)
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta despesa?')) return
    await createClient().from('despesas').delete().eq('id', id)
    setDespesas(prev => prev.filter(d => d.id !== id))
  }

  function abrirEdit(d: Despesa) {
    setEditTarget(d)
    setEditForm({ descricao: d.descricao, categoria: d.categoria, valor: String(d.valor), data: d.data, status: d.status })
  }

  async function salvarEdit() {
    if (!editTarget) return
    setEditSalvando(true)
    const { error } = await createClient().from('despesas').update({
      descricao: editForm.descricao,
      categoria: editForm.categoria,
      valor: parseFloat(editForm.valor),
      data: editForm.data,
      status: editForm.status,
    }).eq('id', editTarget.id)
    setEditSalvando(false)
    if (error) return
    setDespesas(prev => prev.map(d => d.id === editTarget.id
      ? { ...d, descricao: editForm.descricao, categoria: editForm.categoria, valor: parseFloat(editForm.valor), data: editForm.data, status: editForm.status }
      : d
    ))
    setEditTarget(null)
  }

  return (
    <ProOnly>
    <div className="anim-fade" style={{display:'flex',flexDirection:'column',gap:'0.875rem',maxWidth:'900px'}}>

      <div className="pg-header">
        <div style={{display:'flex',alignItems:'center',gap:'0.625rem'}}>
          <Link href="/financeiro" className="btn btn-secondary" style={{padding:'0.4rem 0.625rem'}}><ArrowLeft size={15}/></Link>
          <div>
            <h1 className="pg-titulo">💸 Despesas</h1>
            <p className="pg-sub">{pendentes} pendente(s) · {formatCurrency(totalMes)} planejado</p>
          </div>
        </div>
        <button onClick={()=>setShowForm(v=>!v)} className="btn btn-primary" style={{display:'flex',alignItems:'center',gap:'0.375rem'}}>
          <Plus size={15}/> {showForm?'Cancelar':'Lançar Despesa'}
        </button>
      </div>

      <PageTabs tabs={[
        { label: 'Visão Geral (DRE)', href: '/financeiro' },
        { label: 'Despesas', href: '/financeiro/despesas' },
        { label: 'Fiados 📒', href: '/financeiro/fiado' },
        { label: 'Fechamento de Caixa', href: '/financeiro/fechamento' }
      ]} />

      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'0.75rem',padding:'0.625rem',background:'var(--surface)',border:'1px solid var(--borda)',borderRadius:'var(--radius)'}}>
        <button onClick={()=>navMes(-1)} className="btn btn-secondary" style={{padding:'0.3rem 0.6rem'}}><ChevronLeft size={16}/></button>
        <span style={{fontWeight:800,fontSize:'0.95rem',textTransform:'capitalize',minWidth:'180px',textAlign:'center',color:'var(--texto)'}}>{mesLabel}</span>
        <button onClick={()=>navMes(+1)} className="btn btn-secondary" style={{padding:'0.3rem 0.6rem'}}><ChevronRight size={16}/></button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'0.625rem'}}>
        {[
          { l:'Total planejado',   v: formatCurrency(totalMes),              c:'var(--vermelho)' },
          { l:'Já pago',          v: formatCurrency(totalPago),             c:'var(--verde)' },
          { l:'A pagar',          v: formatCurrency(totalMes - totalPago),  c:'var(--amarelo)' },
          { l:'Despesas fixas',   v: formatCurrency(totalFixas),            c:'var(--texto)' },
        ].map(k=>(
          <div key={k.l} className="card" style={{padding:'0.875rem'}}>
            <p style={{fontSize:'0.78rem',color:'var(--texto-desab)',marginBottom:'0.25rem'}}>{k.l}</p>
            <p style={{fontWeight:900,fontSize:'1.3rem',color:k.c,fontFamily:'monospace'}}>{k.v}</p>
          </div>
        ))}
      </div>

      {showForm&&(
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          <div className="sec-header"><span>➕ Nova Despesa</span></div>
          <div style={{padding:'0.875rem',display:'flex',flexDirection:'column',gap:'0.75rem'}}>
            {erro&&<div className="alerta alerta-perigo">{erro}</div>}

            <div>
              <label className="campo-label">Descrição *</label>
              <input className="campo" style={{marginTop:'0.375rem'}} placeholder="Ex: Conta de energia junho"
                value={form.descricao} onChange={e=>setForm(f=>({...f,descricao:e.target.value}))}/>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:'0.625rem'}}>
              <div>
                <label className="campo-label">Categoria</label>
                <select className="campo" style={{marginTop:'0.375rem'}} value={form.categoria} onChange={e=>setForm(f=>({...f,categoria:e.target.value}))}>
                  {CATEGORIAS.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="campo-label">Tipo</label>
                <select className="campo" style={{marginTop:'0.375rem'}} value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value as 'fixa'|'variavel'}))}>
                  <option value="fixa">🔒 Fixa (mensal)</option>
                  <option value="variavel">📊 Variável</option>
                </select>
              </div>
              <div>
                <label className="campo-label">Vencimento</label>
                <input className="campo" type="date" style={{marginTop:'0.375rem'}} value={form.data} onChange={e=>setForm(f=>({...f,data:e.target.value}))}/>
              </div>
            </div>

            {form.tipo==='fixa'&&(
              <label style={{display:'flex',alignItems:'center',gap:'0.5rem',cursor:'pointer',fontSize:'0.82rem',color:'var(--texto-sec)'}}>
                <input type="checkbox" checked={form.recorrente} onChange={e=>setForm(f=>({...f,recorrente:e.target.checked,parcelado:false}))} style={{width:'15px',height:'15px'}}/>
                Gerar automaticamente todo mês (planejamento recorrente)
              </label>
            )}

            {form.tipo!=='fixa'&&(
              <div style={{display:'flex',flexDirection:'column',gap:'0.375rem'}}>
                <label style={{display:'flex',alignItems:'center',gap:'0.5rem',cursor:'pointer',fontSize:'0.82rem',color:'var(--texto-sec)'}}>
                  <input type="checkbox" checked={form.parcelado} onChange={e=>setForm(f=>({...f,parcelado:e.target.checked,recorrente:false}))} style={{width:'15px',height:'15px'}}/>
                  Despesa parcelada
                </label>
                {form.parcelado&&(
                  <div style={{display:'flex',alignItems:'center',gap:'0.5rem',paddingLeft:'1.5rem'}}>
                    <label className="campo-label" style={{whiteSpace:'nowrap'}}>Nº de parcelas:</label>
                    <select className="campo" style={{width:'100px'}} value={form.numParcelas} onChange={e=>setForm(f=>({...f,numParcelas:parseInt(e.target.value)}))}>
                      {Array.from({length:23},(_,i)=>i+2).map(n=><option key={n} value={n}>{n}x</option>)}
                    </select>
                    {form.valor&&<span style={{fontSize:'0.78rem',color:'var(--texto-desab)',fontFamily:'monospace'}}>= {formatCurrency(parseFloat(form.valor||'0')/form.numParcelas)}/mês</span>}
                  </div>
                )}
              </div>
            )}

            <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:'0.625rem',alignItems:'flex-end'}}>
              <div>
                <label className="campo-label">Valor total (R$) *</label>
                <div style={{position:'relative',marginTop:'0.375rem'}}>
                  <span style={{position:'absolute',left:'0.625rem',top:'50%',transform:'translateY(-50%)',fontWeight:700,color:'var(--texto-desab)'}}>R$</span>
                  <input className="campo" type="number" step="0.01" min="0"
                    style={{paddingLeft:'2rem',fontWeight:800,fontSize:'1.1rem'}} placeholder="0,00"
                    value={form.valor} onChange={e=>setForm(f=>({...f,valor:e.target.value}))}/>
                </div>
              </div>
              <button onClick={salvar} disabled={salvando} className="btn btn-primary" style={{display:'flex',alignItems:'center',gap:'0.375rem',height:'42px'}}>
                {salvando?<><Loader2 size={14} style={{animation:'spin 1s linear infinite'}}/>Salvando...</>:'✓ Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:'2rem',gap:'0.75rem',color:'var(--texto-desab)'}}>
          <Loader2 size={18} style={{animation:'spin 1s linear infinite'}}/> Carregando...
        </div>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr style={{background:'#364a60'}}>
                <th style={{width:'70px'}}>#</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Tipo</th>
                <th>Vencimento</th>
                <th style={{textAlign:'right'}}>Valor</th>
                <th style={{textAlign:'center'}}>Status</th>
                <th style={{textAlign:'center'}}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {despMes.length===0 ? (
                <tr><td colSpan={8} style={{textAlign:'center',padding:'2rem',color:'var(--texto-desab)'}}>
                  Nenhuma despesa em {mesLabel}. Clique em &quot;Lançar Despesa&quot; para começar.
                </td></tr>
              ) : despMes.map(d => {
                const isVencida = d.status !== 'pago' && d.data < new Date().toISOString().slice(0,10)
                const displayBadge = isVencida ? statusBadge('atrasado') : statusBadge(d.status || 'pendente')
                return (
                  <tr key={d.id} style={{opacity: d.status==='pago' ? 0.65 : 1}}>
                    <td style={{fontFamily:'monospace',fontSize:'0.72rem',color:'var(--texto-desab)',fontWeight:700}}>
                      {d.identificador || d.id.slice(0,4)}
                    </td>
                    <td style={{fontWeight:600}}>
                      {d.descricao}
                      {d.parent_id&&<span style={{fontSize:'0.65rem',color:'var(--verde)',marginLeft:'0.4rem',opacity:0.8}}>↩ recorrente</span>}
                    </td>
                    <td style={{fontSize:'0.82rem'}}>{d.categoria}</td>
                    <td>
                      <span className={d.tipo==='fixa'?'status-neutro':'status-aviso'} style={{fontSize:'0.78rem'}}>
                        {d.tipo==='fixa'?'🔒 Fixa':'📊 Variável'}
                      </span>
                    </td>
                    <td style={{fontSize:'0.82rem',color:'var(--texto-desab)'}}>
                      {new Date(d.data+'T12:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td style={{textAlign:'right',fontWeight:800,color: d.status==='pago' ? 'var(--verde)' : 'var(--vermelho)',fontFamily:'monospace'}}>
                      {formatCurrency(d.valor)}
                    </td>
                    <td style={{textAlign:'center'}}>
                      <span style={{
                        display:'inline-block',fontSize:'0.7rem',fontWeight:700,padding:'0.2rem 0.5rem',
                        borderRadius:'999px',border:`1px solid ${displayBadge.border}`,
                        background:displayBadge.bg,color:displayBadge.color,whiteSpace:'nowrap'
                      }}>
                        {displayBadge.label}
                      </span>
                    </td>
                    <td style={{textAlign:'center'}}>
                      <div style={{display:'flex',gap:'0.25rem',justifyContent:'center',alignItems:'center'}}>
                        {d.status !== 'pago' && (
                          <button
                            onClick={()=>darBaixa(d)}
                            disabled={baixando===d.id}
                            className="btn btn-primary"
                            style={{fontSize:'0.65rem',padding:'0.2rem 0.5rem',display:'flex',alignItems:'center',gap:'0.2rem'}}
                            title="Dar baixa — marcar como pago"
                          >
                            {baixando===d.id ? <Loader2 size={11} style={{animation:'spin 1s linear infinite'}}/> : <CheckCircle size={11}/>}
                            Baixa
                          </button>
                        )}
                        <AdminOnly>
                          <button onClick={()=>abrirEdit(d)} className="btn btn-secondary" style={{fontSize:'0.65rem',padding:'0.2rem 0.45rem'}} title="Editar">
                            <Pencil size={11}/>
                          </button>
                          <button onClick={()=>excluir(d.id)} className="btn btn-secondary" style={{fontSize:'0.65rem',padding:'0.2rem 0.45rem',color:'var(--vermelho)'}} title="Excluir">
                            <Trash2 size={11}/>
                          </button>
                        </AdminOnly>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>

    {editTarget&&(
      <div style={{position:'fixed',inset:0,zIndex:200,background:'rgba(0,0,0,0.78)',display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}
        onClick={e=>{if(e.target===e.currentTarget)setEditTarget(null)}}>
        <div className="anim-pop" style={{width:'100%',maxWidth:'480px',background:'var(--surface)',border:'1px solid var(--borda-forte)',borderRadius:'var(--radius)'}}>
          <div style={{padding:'0.75rem 1rem',borderBottom:'2px solid var(--verde)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <p style={{fontWeight:700,fontSize:'0.82rem',color:'var(--verde)',textTransform:'uppercase',letterSpacing:'0.05em'}}>✏️ Editar Despesa</p>
            <button onClick={()=>setEditTarget(null)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--texto-desab)',fontSize:'1.2rem'}}>×</button>
          </div>
          <div style={{padding:'1rem',display:'flex',flexDirection:'column',gap:'0.75rem'}}>
            <div>
              <label className="campo-label">Descrição</label>
              <input className="campo" style={{marginTop:'0.375rem'}} value={editForm.descricao} onChange={e=>setEditForm(f=>({...f,descricao:e.target.value}))}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.625rem'}}>
              <div>
                <label className="campo-label">Categoria</label>
                <select className="campo" style={{marginTop:'0.375rem'}} value={editForm.categoria} onChange={e=>setEditForm(f=>({...f,categoria:e.target.value}))}>
                  {CATEGORIAS.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="campo-label">Vencimento</label>
                <input className="campo" type="date" style={{marginTop:'0.375rem'}} value={editForm.data} onChange={e=>setEditForm(f=>({...f,data:e.target.value}))}/>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.625rem'}}>
              <div>
                <label className="campo-label">Valor (R$)</label>
                <input className="campo" type="number" step="0.01" style={{marginTop:'0.375rem'}} value={editForm.valor} onChange={e=>setEditForm(f=>({...f,valor:e.target.value}))}/>
              </div>
              <div>
                <label className="campo-label">Status</label>
                <select className="campo" style={{marginTop:'0.375rem'}} value={editForm.status} onChange={e=>setEditForm(f=>({...f,status:e.target.value}))}>
                  <option value="pendente">● Pendente</option>
                  <option value="pago">✓ Pago</option>
                  <option value="atrasado">⚠ Atrasado</option>
                </select>
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:'0.5rem',marginTop:'0.25rem'}}>
              <button onClick={()=>setEditTarget(null)} className="btn btn-secondary">Cancelar</button>
              <button onClick={salvarEdit} disabled={editSalvando} className="btn btn-primary" style={{display:'flex',alignItems:'center',gap:'0.375rem'}}>
                {editSalvando?<><Loader2 size={14} style={{animation:'spin 1s linear infinite'}}/>Salvando...</>:'✓ Salvar alterações'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </ProOnly>
  )
}
