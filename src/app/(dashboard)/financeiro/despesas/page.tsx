'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { formatCurrency } from '@/lib/utils'
import { ArrowLeft, Plus, Trash2, Loader2, Pencil, CheckCircle, ChevronLeft, ChevronRight, FileText, RefreshCw, StopCircle } from 'lucide-react'
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
  forma_pagamento: string | null
  observacao: string | null
  numero_base: number | null
  numero_parcela: number | null
  total_parcelas: number | null
  identificador: string | null
  parent_id: string | null
}

const CATEGORIAS = ['Aluguel','Energia','Internet','Fornecedor','Transporte','Funcionário','Marketing','Manutenção','Imposto','Outros']
const FORMAS_PAGAMENTO = ['','Dinheiro','PIX','Cartão Débito','Cartão Crédito','Transferência','Boleto','Outros']

function statusBadge(s: string) {
  if (s === 'pago')     return { label: '✓ Pago',     bg: 'rgba(26,122,60,0.12)', color: 'var(--verde)',    border: 'var(--verde)' }
  if (s === 'atrasado') return { label: '⚠ Atrasado', bg: 'rgba(192,57,43,0.1)',  color: 'var(--vermelho)', border: 'var(--vermelho)' }
  return                       { label: '● Pendente', bg: 'rgba(183,134,11,0.1)', color: 'var(--amarelo)', border: 'var(--amarelo)' }
}

const EMPTY_FORM = () => ({
  descricao: '', categoria: 'Outros', tipo: 'variavel' as 'fixa'|'variavel',
  valor: '', data: new Date().toISOString().slice(0,10),
  recorrente: false, parcelado: false, numParcelas: 2,
  forma_pagamento: '', observacao: '',
})

export default function DespesasPage() {
  const { empresaId } = useEmpresaId()

  const [mesSel, setMesSel] = useState(() => {
    const n = new Date()
    return { ano: n.getFullYear(), mes: n.getMonth() }
  })
  const [despesas,     setDespesas]     = useState<Despesa[]>([])
  const [loading,      setLoading]      = useState(true)
  const [showForm,     setShowForm]     = useState(false)
  const [salvando,     setSalvando]     = useState(false)
  const [erro,         setErro]         = useState<string|null>(null)
  const [form,         setForm]         = useState(EMPTY_FORM())
  const [editTarget,   setEditTarget]   = useState<Despesa|null>(null)
  const [editForm,     setEditForm]     = useState({
    descricao:'', categoria:'Outros', valor:'', data:'',
    status:'pendente', forma_pagamento:'', observacao:''
  })
  // 'unico' = só este mês, 'futuro' = este e futuros, 'encerrar' = encerrar recorrência
  const [editScope,    setEditScope]    = useState<'unico'|'futuro'|'encerrar'>('unico')
  const [editSalvando, setEditSalvando] = useState(false)
  const [baixando,     setBaixando]     = useState<string|null>(null)
  const [expandido,    setExpandido]    = useState<string|null>(null)

  const mesStr   = `${mesSel.ano}-${String(mesSel.mes + 1).padStart(2,'0')}`
  const mesLabel = new Date(mesSel.ano, mesSel.mes, 1)
    .toLocaleDateString('pt-BR', { month:'long', year:'numeric' })

  useEffect(() => { if (empresaId) carregar(empresaId) }, [empresaId, mesSel])

  function navMes(delta: number) {
    setMesSel(prev => {
      let m = prev.mes + delta, a = prev.ano
      if (m > 11) { m = 0; a++ }
      if (m < 0)  { m = 11; a-- }
      return { ano: a, mes: m }
    })
  }

  async function carregar(eid: string) {
    setLoading(true)
    const supabase = createClient()
    const { data: todas } = await supabase
      .from('despesas').select('*').eq('empresa_id', eid).order('data', { ascending: false })
    const lista = (todas || []) as Despesa[]

    // ── Geração automática para qualquer mês visualizado
    const fixasMestre = lista.filter(d =>
      d.tipo === 'fixa' && d.recorrente && !d.parent_id && !d.numero_parcela
    )
    if (fixasMestre.length > 0) {
      const instDoMes = lista.filter(d => d.data?.startsWith(mesStr))
      const gerarPara = fixasMestre.filter(fixa => {
        if (fixa.data?.startsWith(mesStr)) return false
        if ((fixa.data?.slice(0,7) ?? '') > mesStr) return false
        return !instDoMes.some(inst => inst.parent_id === fixa.id)
      })
      if (gerarPara.length > 0) {
        const maxBase = Math.max(0, ...lista.map(d => d.numero_base ?? 0))
        let nextBase = maxBase + 1
        const inserir = gerarPara.map(fixa => {
          const dia = fixa.data?.slice(8,10) ?? '01'
          const row = {
            empresa_id: eid, descricao: fixa.descricao, categoria: fixa.categoria,
            tipo: fixa.tipo, valor: fixa.valor, data: `${mesStr}-${dia}`,
            recorrente: false, status: 'pendente',
            forma_pagamento: fixa.forma_pagamento ?? null, observacao: null,
            numero_base: nextBase, numero_parcela: null, total_parcelas: null,
            identificador: String(nextBase), parent_id: fixa.id,
          }
          nextBase++
          return row
        })
        await supabase.from('despesas').insert(inserir)
        const { data: upd } = await supabase.from('despesas').select('*').eq('empresa_id', eid).order('data', { ascending: false })
        setDespesas((upd || []) as Despesa[])
        setLoading(false)
        return
      }
    }
    setDespesas(lista)
    setLoading(false)
  }

  const despMes    = despesas.filter(d => d.data?.startsWith(mesStr))
  const totalMes   = despMes.reduce((a,d) => a+d.valor, 0)
  const totalPago  = despMes.filter(d => d.status === 'pago').reduce((a,d) => a+d.valor, 0)
  const totalFixas = despMes.filter(d => d.tipo === 'fixa').reduce((a,d) => a+d.valor, 0)
  const pendentes  = despMes.filter(d => d.status !== 'pago').length

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
        return {
          empresa_id: empresaId, descricao: form.descricao, categoria: form.categoria,
          tipo: form.tipo, valor: +(valor / form.numParcelas).toFixed(2),
          data: dt.toISOString().slice(0,10), recorrente: false, status: 'pendente',
          forma_pagamento: form.forma_pagamento || null, observacao: form.observacao || null,
          numero_base: nextBase, numero_parcela: i + 1, total_parcelas: form.numParcelas,
          identificador: `${nextBase}-${i+1}`, parent_id: null,
        }
      })
      const { error } = await supabase.from('despesas').insert(linhas)
      setSalvando(false)
      if (error) { setErro('Erro: '+error.message); return }
    } else {
      const { error } = await supabase.from('despesas').insert({
        empresa_id: empresaId, descricao: form.descricao, categoria: form.categoria,
        tipo: form.tipo, valor, data: form.data, recorrente: form.recorrente, status: 'pendente',
        forma_pagamento: form.forma_pagamento || null, observacao: form.observacao || null,
        numero_base: nextBase, numero_parcela: null, total_parcelas: null,
        identificador: String(nextBase), parent_id: null,
      })
      setSalvando(false)
      if (error) { setErro('Erro: '+error.message); return }
    }
    setShowForm(false); setForm(EMPTY_FORM()); carregar(empresaId)
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
    setEditScope(d.recorrente ? 'futuro' : 'unico')
    setEditForm({
      descricao: d.descricao, categoria: d.categoria, valor: String(d.valor),
      data: d.data, status: d.status || 'pendente',
      forma_pagamento: d.forma_pagamento || '', observacao: d.observacao || '',
    })
  }

  async function salvarEdit() {
    if (!editTarget || !empresaId) return
    setEditSalvando(true)
    const supabase = createClient()
    const novosValores = {
      descricao: editForm.descricao, categoria: editForm.categoria,
      valor: parseFloat(editForm.valor), data: editForm.data, status: editForm.status,
      forma_pagamento: editForm.forma_pagamento || null,
      observacao: editForm.observacao || null,
    }
    const isMaster = editTarget.recorrente && !editTarget.parent_id
    const parentId = editTarget.parent_id || editTarget.id

    if (editScope === 'unico') {
      // Edita apenas este registro
      await supabase.from('despesas').update(novosValores).eq('id', editTarget.id)
    }

    else if (editScope === 'futuro') {
      // Atualiza o master e deleta instâncias filhas pendentes a partir do mês atual
      const masterId = isMaster ? editTarget.id : parentId
      // Atualiza master
      await supabase.from('despesas').update({
        descricao: novosValores.descricao, categoria: novosValores.categoria,
        valor: novosValores.valor, forma_pagamento: novosValores.forma_pagamento,
      }).eq('id', masterId)
      // Deleta filhas pendentes a partir do mesStr (serão regeradas com novos valores)
      const { data: filhas } = await supabase.from('despesas')
        .select('id,data').eq('parent_id', masterId).eq('status', 'pendente')
      const paraExcluir = (filhas || []).filter(f => (f.data || '') >= mesStr)
      if (paraExcluir.length > 0) {
        await supabase.from('despesas').delete()
          .in('id', paraExcluir.map(f => f.id))
      }
      // Se estava editando uma filha, também atualiza a filha do mês atual (cria com novos dados)
      if (!isMaster) {
        await supabase.from('despesas').update(novosValores).eq('id', editTarget.id)
      }
    }

    else if (editScope === 'encerrar') {
      // Marca master como não-recorrente e deleta filhas futuras pendentes
      const masterId = isMaster ? editTarget.id : parentId
      await supabase.from('despesas').update({ recorrente: false }).eq('id', masterId)
      const hoje = new Date().toISOString().slice(0,10)
      const { data: filhas } = await supabase.from('despesas')
        .select('id,data').eq('parent_id', masterId).eq('status', 'pendente')
      const paraExcluir = (filhas || []).filter(f => (f.data || '') > hoje)
      if (paraExcluir.length > 0) {
        await supabase.from('despesas').delete()
          .in('id', paraExcluir.map(f => f.id))
      }
    }

    setEditSalvando(false)
    setEditTarget(null)
    carregar(empresaId)
  }

  const isRecorrenteMaster = (d: Despesa) => d.tipo === 'fixa' && d.recorrente && !d.parent_id
  const isFilhaRecorrente  = (d: Despesa) => !!d.parent_id

  return (
    <ProOnly>
    <div className="anim-fade" style={{display:'flex',flexDirection:'column',gap:'0.875rem',maxWidth:'960px'}}>

      {/* ── HEADER ── */}
      <div className="pg-header">
        <div style={{display:'flex',alignItems:'center',gap:'0.625rem'}}>
          <Link href="/financeiro" className="btn btn-secondary" style={{padding:'0.4rem 0.625rem'}}><ArrowLeft size={15}/></Link>
          <div>
            <h1 className="pg-titulo">💸 Despesas</h1>
            <p className="pg-sub">{pendentes} a pagar · {formatCurrency(totalMes)} planejado em {mesLabel}</p>
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

      {/* ── SELETOR DE MÊS ── */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'0.75rem',padding:'0.5rem 1rem',background:'var(--surface)',border:'1px solid var(--borda)',borderRadius:'var(--radius)'}}>
        <button onClick={()=>navMes(-1)} className="btn btn-secondary" style={{padding:'0.3rem 0.625rem'}}><ChevronLeft size={16}/></button>
        <span style={{fontWeight:800,fontSize:'1rem',textTransform:'capitalize',minWidth:'200px',textAlign:'center',color:'var(--texto)'}}>{mesLabel}</span>
        <button onClick={()=>navMes(+1)} className="btn btn-secondary" style={{padding:'0.3rem 0.625rem'}}><ChevronRight size={16}/></button>
      </div>

      {/* ── KPIs ── */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:'0.625rem'}}>
        {[
          { l:'Total planejado', v: formatCurrency(totalMes),             c:'var(--vermelho)', icon:'📋' },
          { l:'Já pago',         v: formatCurrency(totalPago),            c:'var(--verde)',    icon:'✅' },
          { l:'A pagar',         v: formatCurrency(totalMes - totalPago), c:'var(--amarelo)',  icon:'⏳' },
          { l:'Fixas do mês',    v: formatCurrency(totalFixas),           c:'var(--texto)',    icon:'🔒' },
        ].map(k=>(
          <div key={k.l} className="card" style={{padding:'0.875rem'}}>
            <p style={{fontSize:'0.72rem',color:'var(--texto-desab)',marginBottom:'0.25rem'}}>{k.icon} {k.l}</p>
            <p style={{fontWeight:900,fontSize:'1.25rem',color:k.c,fontFamily:'monospace'}}>{k.v}</p>
          </div>
        ))}
      </div>

      {/* ── FORMULÁRIO ── */}
      {showForm&&(
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          <div className="sec-header"><span>➕ Nova Despesa</span></div>
          <div style={{padding:'1rem',display:'flex',flexDirection:'column',gap:'0.875rem'}}>
            {erro&&<div className="alerta alerta-perigo">{erro}</div>}
            <div>
              <label className="campo-label">Descrição *</label>
              <input className="campo" style={{marginTop:'0.375rem'}} placeholder="Ex: Conta de energia junho"
                value={form.descricao} onChange={e=>setForm(f=>({...f,descricao:e.target.value}))}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:'0.625rem'}}>
              <div>
                <label className="campo-label">Categoria</label>
                <select className="campo" style={{marginTop:'0.375rem'}} value={form.categoria} onChange={e=>setForm(f=>({...f,categoria:e.target.value}))}>
                  {CATEGORIAS.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="campo-label">Tipo</label>
                <select className="campo" style={{marginTop:'0.375rem'}} value={form.tipo}
                  onChange={e=>setForm(f=>({...f,tipo:e.target.value as 'fixa'|'variavel',recorrente:false,parcelado:false}))}>
                  <option value="fixa">🔒 Fixa (mensal)</option>
                  <option value="variavel">📊 Variável</option>
                </select>
              </div>
              <div>
                <label className="campo-label">Vencimento</label>
                <input className="campo" type="date" style={{marginTop:'0.375rem'}} value={form.data} onChange={e=>setForm(f=>({...f,data:e.target.value}))}/>
              </div>
              <div>
                <label className="campo-label">Forma de Pagamento</label>
                <select className="campo" style={{marginTop:'0.375rem'}} value={form.forma_pagamento} onChange={e=>setForm(f=>({...f,forma_pagamento:e.target.value}))}>
                  {FORMAS_PAGAMENTO.map(fp=><option key={fp} value={fp}>{fp||'— Selecionar —'}</option>)}
                </select>
              </div>
            </div>
            <div style={{padding:'0.75rem',background:'var(--surface-alt)',borderRadius:'var(--radius-sm)',border:'1px solid var(--borda)',display:'flex',flexDirection:'column',gap:'0.5rem'}}>
              {form.tipo==='fixa' ? (
                <label style={{display:'flex',alignItems:'center',gap:'0.5rem',cursor:'pointer',fontSize:'0.82rem',color:'var(--texto-sec)'}}>
                  <input type="checkbox" checked={form.recorrente}
                    onChange={e=>setForm(f=>({...f,recorrente:e.target.checked,parcelado:false}))} style={{width:'15px',height:'15px'}}/>
                  <span><strong>Gerar automaticamente todo mês</strong> — ao navegar para meses futuros, cópia pendente é criada automaticamente</span>
                </label>
              ) : (
                <label style={{display:'flex',alignItems:'center',gap:'0.5rem',cursor:'pointer',fontSize:'0.82rem',color:'var(--texto-sec)'}}>
                  <input type="checkbox" checked={form.parcelado}
                    onChange={e=>setForm(f=>({...f,parcelado:e.target.checked,recorrente:false}))} style={{width:'15px',height:'15px'}}/>
                  <span><strong>Despesa parcelada</strong> — divide em N parcelas mensais com identificadores únicos</span>
                </label>
              )}
              {form.parcelado&&(
                <div style={{display:'flex',alignItems:'center',gap:'0.625rem',paddingLeft:'1.5rem'}}>
                  <label className="campo-label" style={{whiteSpace:'nowrap'}}>Nº de parcelas:</label>
                  <select className="campo" style={{width:'80px'}} value={form.numParcelas}
                    onChange={e=>setForm(f=>({...f,numParcelas:parseInt(e.target.value)}))}>
                    {Array.from({length:23},(_,i)=>i+2).map(n=><option key={n} value={n}>{n}x</option>)}
                  </select>
                  {form.valor&&(
                    <span style={{fontSize:'0.8rem',color:'var(--verde)',fontFamily:'monospace',fontWeight:700}}>
                      = {formatCurrency(parseFloat(form.valor||'0')/form.numParcelas)}/mês
                    </span>
                  )}
                </div>
              )}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:'0.625rem'}}>
              <div>
                <label className="campo-label">Valor total (R$) *</label>
                <div style={{position:'relative',marginTop:'0.375rem'}}>
                  <span style={{position:'absolute',left:'0.625rem',top:'50%',transform:'translateY(-50%)',fontWeight:700,color:'var(--texto-desab)'}}>R$</span>
                  <input className="campo" type="number" step="0.01" min="0"
                    style={{paddingLeft:'2rem',fontWeight:800,fontSize:'1.05rem'}} placeholder="0,00"
                    value={form.valor} onChange={e=>setForm(f=>({...f,valor:e.target.value}))}/>
                </div>
              </div>
              <div>
                <label className="campo-label">Observação (opcional)</label>
                <input className="campo" style={{marginTop:'0.375rem'}} placeholder="Ex: NF 12345, referência, nota..."
                  value={form.observacao} onChange={e=>setForm(f=>({...f,observacao:e.target.value}))}/>
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:'0.5rem'}}>
              <button onClick={()=>{setShowForm(false);setForm(EMPTY_FORM())}} className="btn btn-secondary">Cancelar</button>
              <button onClick={salvar} disabled={salvando} className="btn btn-primary" style={{display:'flex',alignItems:'center',gap:'0.375rem',padding:'0.5rem 1.25rem'}}>
                {salvando?<><Loader2 size={14} style={{animation:'spin 1s linear infinite'}}/>Salvando...</>:'✓ Salvar Despesa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LISTA ── */}
      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:'2rem',gap:'0.75rem',color:'var(--texto-desab)'}}>
          <Loader2 size={18} style={{animation:'spin 1s linear infinite'}}/> Carregando...
        </div>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr style={{background:'#364a60'}}>
                <th style={{width:'68px'}}>#</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Tipo</th>
                <th>Pagamento</th>
                <th>Vencimento</th>
                <th style={{textAlign:'right'}}>Valor</th>
                <th style={{textAlign:'center'}}>Status</th>
                <th style={{textAlign:'center'}}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {despMes.length===0 ? (
                <tr><td colSpan={9} style={{textAlign:'center',padding:'2.5rem',color:'var(--texto-desab)'}}>
                  Nenhuma despesa em <strong>{mesLabel}</strong>. Clique em &quot;Lançar Despesa&quot; para começar.
                </td></tr>
              ) : despMes.map(d => {
                const isVencida = d.status !== 'pago' && d.data < new Date().toISOString().slice(0,10)
                const badge = isVencida ? statusBadge('atrasado') : statusBadge(d.status || 'pendente')
                return (
                  <>
                  <tr key={d.id} style={{opacity: d.status==='pago' ? 0.6 : 1}}>
                    <td style={{fontFamily:'monospace',fontSize:'0.72rem',color:'var(--texto-desab)',fontWeight:700}}>
                      {d.identificador || '—'}
                    </td>
                    <td style={{fontWeight:600}}>
                      <span style={{display:'flex',alignItems:'center',gap:'0.375rem',flexWrap:'wrap'}}>
                        {d.descricao}
                        {isRecorrenteMaster(d)&&<span title="Despesa fixa recorrente (modelo)" style={{fontSize:'0.62rem',color:'var(--verde)',opacity:0.9,display:'flex',alignItems:'center',gap:'0.15rem'}}><RefreshCw size={9}/> recorrente</span>}
                        {isFilhaRecorrente(d)&&<span style={{fontSize:'0.62rem',color:'var(--texto-desab)',fontWeight:400}}>↩ auto</span>}
                        {d.observacao&&(
                          <button onClick={()=>setExpandido(expandido===d.id?null:d.id)}
                            style={{background:'none',border:'none',cursor:'pointer',color:'var(--texto-desab)',padding:0,display:'flex',alignItems:'center'}}>
                            <FileText size={11}/>
                          </button>
                        )}
                      </span>
                    </td>
                    <td style={{fontSize:'0.8rem'}}>{d.categoria}</td>
                    <td>
                      <span className={d.tipo==='fixa'?'status-neutro':'status-aviso'} style={{fontSize:'0.75rem'}}>
                        {d.tipo==='fixa'?'🔒 Fixa':'📊 Variável'}
                      </span>
                    </td>
                    <td style={{fontSize:'0.78rem',color:'var(--texto-sec)'}}>{d.forma_pagamento||<span style={{color:'var(--texto-desab)'}}>—</span>}</td>
                    <td style={{fontSize:'0.8rem',color:'var(--texto-desab)'}}>
                      {new Date(d.data+'T12:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td style={{textAlign:'right',fontWeight:800,color:d.status==='pago'?'var(--verde)':'var(--vermelho)',fontFamily:'monospace'}}>
                      {formatCurrency(d.valor)}
                      {d.total_parcelas&&<div style={{fontSize:'0.62rem',fontWeight:400,color:'var(--texto-desab)',marginTop:'1px'}}>{d.numero_parcela}/{d.total_parcelas}x</div>}
                    </td>
                    <td style={{textAlign:'center'}}>
                      <span style={{display:'inline-block',fontSize:'0.7rem',fontWeight:700,padding:'0.18rem 0.5rem',
                        borderRadius:'999px',border:`1px solid ${badge.border}`,
                        background:badge.bg,color:badge.color,whiteSpace:'nowrap'}}>{badge.label}</span>
                    </td>
                    <td>
                      <div style={{display:'flex',gap:'0.2rem',justifyContent:'center',alignItems:'center'}}>
                        {d.status !== 'pago' && (
                          <button onClick={()=>darBaixa(d)} disabled={baixando===d.id}
                            className="btn btn-primary"
                            style={{fontSize:'0.62rem',padding:'0.2rem 0.45rem',display:'flex',alignItems:'center',gap:'0.15rem',whiteSpace:'nowrap'}}>
                            {baixando===d.id?<Loader2 size={10} style={{animation:'spin 1s linear infinite'}}/>:<CheckCircle size={10}/>}
                            Baixa
                          </button>
                        )}
                        <AdminOnly>
                          <button onClick={()=>abrirEdit(d)} className="btn btn-secondary"
                            style={{fontSize:'0.62rem',padding:'0.2rem 0.4rem'}} title="Editar">
                            <Pencil size={10}/>
                          </button>
                          <button onClick={()=>excluir(d.id)} className="btn btn-secondary"
                            style={{fontSize:'0.62rem',padding:'0.2rem 0.4rem',color:'var(--vermelho)'}} title="Excluir">
                            <Trash2 size={10}/>
                          </button>
                        </AdminOnly>
                      </div>
                    </td>
                  </tr>
                  {expandido===d.id&&d.observacao&&(
                    <tr key={d.id+'-obs'} style={{background:'var(--surface-alt)'}}>
                      <td colSpan={9} style={{padding:'0.375rem 0.75rem 0.625rem 1.5rem'}}>
                        <p style={{fontSize:'0.78rem',color:'var(--texto-sec)',fontStyle:'italic'}}>
                          📝 {d.observacao}
                        </p>
                      </td>
                    </tr>
                  )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>

    {/* ── MODAL EDITAR ── */}
    {editTarget&&(
      <div style={{position:'fixed',inset:0,zIndex:200,background:'rgba(0,0,0,0.82)',display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem',overflowY:'auto'}}
        onClick={e=>{if(e.target===e.currentTarget)setEditTarget(null)}}>
        <div className="anim-pop" style={{width:'100%',maxWidth:'560px',background:'var(--surface)',border:'1px solid var(--borda-forte)',borderRadius:'var(--radius)',overflow:'hidden',margin:'auto'}}>
          <div style={{padding:'0.75rem 1rem',borderBottom:'2px solid var(--verde)',display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--fundo-painel)'}}>
            <p style={{fontWeight:700,fontSize:'0.85rem',color:'var(--verde)',textTransform:'uppercase',letterSpacing:'0.05em'}}>✏️ Editar Despesa</p>
            <button onClick={()=>setEditTarget(null)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--texto-desab)',fontSize:'1.3rem',lineHeight:1}}>×</button>
          </div>
          <div style={{padding:'1.125rem',display:'flex',flexDirection:'column',gap:'0.875rem'}}>

            {/* ── Escopo da edição (para fixas recorrentes) ── */}
            {(isRecorrenteMaster(editTarget) || isFilhaRecorrente(editTarget)) && (
              <div style={{padding:'0.75rem',background:'var(--surface-alt)',borderRadius:'var(--radius-sm)',border:'1px solid var(--borda)',display:'flex',flexDirection:'column',gap:'0.5rem'}}>
                <p style={{fontSize:'0.72rem',fontWeight:700,color:'var(--amarelo)',textTransform:'uppercase',letterSpacing:'0.05em'}}>
                  🔄 Despesa Recorrente — Escolha o escopo da edição
                </p>
                {(['unico','futuro','encerrar'] as const).map(scope => {
                  const labels = {
                    unico:    { l:'Editar só este mês',        d:'Altera apenas esta instância, sem afetar o modelo ou meses futuros.' },
                    futuro:   { l:'Atualizar a partir daqui',  d:`Atualiza o modelo e apaga instâncias pendentes de ${mesLabel} em diante — elas serão regeradas com os novos valores.` },
                    encerrar: { l:'Encerrar recorrência',       d:'Para de gerar novas instâncias e exclui as futuras pendentes.' },
                  }
                  const ic = { unico:'📅', futuro:'📆', encerrar:'🛑' }
                  return (
                    <label key={scope} style={{display:'flex',alignItems:'flex-start',gap:'0.5rem',cursor:'pointer',padding:'0.5rem',borderRadius:'var(--radius-sm)',
                      background: editScope===scope ? 'rgba(26,122,60,0.12)' : 'transparent',
                      border: `1px solid ${editScope===scope ? 'var(--verde)' : 'var(--borda)'}`,
                      transition:'all 0.1s'}}>
                      <input type="radio" checked={editScope===scope} onChange={()=>setEditScope(scope)} style={{marginTop:'2px',flexShrink:0}}/>
                      <div>
                        <p style={{fontSize:'0.8rem',fontWeight:700,color: editScope===scope ? 'var(--verde)' : 'var(--texto)'}}>{ic[scope]} {labels[scope].l}</p>
                        <p style={{fontSize:'0.7rem',color:'var(--texto-desab)',marginTop:'0.1rem'}}>{labels[scope].d}</p>
                      </div>
                    </label>
                  )
                })}
              </div>
            )}

            {/* ── Campos de edição (escondidos no modo encerrar) ── */}
            {editScope !== 'encerrar' && (
              <>
                <div>
                  <label className="campo-label">Descrição</label>
                  <input className="campo" style={{marginTop:'0.375rem'}} value={editForm.descricao}
                    onChange={e=>setEditForm(f=>({...f,descricao:e.target.value}))}/>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.625rem'}}>
                  <div>
                    <label className="campo-label">Categoria</label>
                    <select className="campo" style={{marginTop:'0.375rem'}} value={editForm.categoria}
                      onChange={e=>setEditForm(f=>({...f,categoria:e.target.value}))}>
                      {CATEGORIAS.map(c=><option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="campo-label">Forma de Pagamento</label>
                    <select className="campo" style={{marginTop:'0.375rem'}} value={editForm.forma_pagamento}
                      onChange={e=>setEditForm(f=>({...f,forma_pagamento:e.target.value}))}>
                      {FORMAS_PAGAMENTO.map(fp=><option key={fp} value={fp}>{fp||'— Selecionar —'}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.625rem'}}>
                  <div>
                    <label className="campo-label">Valor (R$)</label>
                    <input className="campo" type="number" step="0.01" style={{marginTop:'0.375rem'}}
                      value={editForm.valor} onChange={e=>setEditForm(f=>({...f,valor:e.target.value}))}/>
                  </div>
                  <div>
                    <label className="campo-label">Vencimento</label>
                    <input className="campo" type="date" style={{marginTop:'0.375rem'}}
                      value={editForm.data} onChange={e=>setEditForm(f=>({...f,data:e.target.value}))}/>
                  </div>
                  <div>
                    <label className="campo-label">Status</label>
                    <select className="campo" style={{marginTop:'0.375rem'}} value={editForm.status}
                      onChange={e=>setEditForm(f=>({...f,status:e.target.value}))}>
                      <option value="pendente">● Pendente</option>
                      <option value="pago">✓ Pago</option>
                      <option value="atrasado">⚠ Atrasado</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="campo-label">Observação</label>
                  <input className="campo" style={{marginTop:'0.375rem'}} placeholder="Ex: NF 12345, comprovante..."
                    value={editForm.observacao} onChange={e=>setEditForm(f=>({...f,observacao:e.target.value}))}/>
                </div>
              </>
            )}

            {editScope === 'encerrar' && (
              <div style={{padding:'1rem',background:'rgba(192,57,43,0.08)',borderRadius:'var(--radius-sm)',border:'1px solid var(--vermelho)'}}>
                <p style={{fontSize:'0.85rem',fontWeight:700,color:'var(--vermelho)',marginBottom:'0.25rem'}}>🛑 Encerrar recorrência de &quot;{editTarget.descricao}&quot;</p>
                <p style={{fontSize:'0.78rem',color:'var(--texto-sec)'}}>
                  O modelo será marcado como não-recorrente e todas as instâncias pendentes após hoje serão excluídas automaticamente. Esta ação não pode ser desfeita.
                </p>
              </div>
            )}

            <div style={{display:'flex',justifyContent:'flex-end',gap:'0.5rem',paddingTop:'0.25rem',borderTop:'1px solid var(--borda)'}}>
              <button onClick={()=>setEditTarget(null)} className="btn btn-secondary">Cancelar</button>
              <button onClick={salvarEdit} disabled={editSalvando} className={`btn ${editScope==='encerrar'?'btn-danger':'btn-primary'}`}
                style={{display:'flex',alignItems:'center',gap:'0.375rem',
                  background: editScope==='encerrar' ? 'var(--vermelho)' : undefined,
                  color: editScope==='encerrar' ? '#fff' : undefined}}>
                {editSalvando ? <><Loader2 size={14} style={{animation:'spin 1s linear infinite'}}/>Aplicando...</> :
                  editScope==='encerrar' ? <><StopCircle size={14}/>Encerrar recorrência</> :
                  editScope==='futuro'   ? <><RefreshCw size={14}/>Atualizar modelo + futuros</> :
                  '✓ Salvar este mês'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </ProOnly>
  )
}
