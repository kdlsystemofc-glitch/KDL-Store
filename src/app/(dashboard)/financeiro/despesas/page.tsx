'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { formatCurrency } from '@/lib/utils'
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react'
import { PageTabs } from '@/components/PageTabs'
import { AdminOnly } from '@/components/AdminOnly'
import { ProOnly } from '@/components/ProOnly'

type Despesa = { id:string; descricao:string; categoria:string; tipo:string; valor:number; data:string; recorrente:boolean }

const CATEGORIAS = ['Aluguel','Energia','Internet','Fornecedor','Transporte','Funcionário','Marketing','Manutenção','Imposto','Outros']

export default function DespesasPage() {
  const { empresaId } = useEmpresaId()
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro,     setErro]     = useState<string|null>(null)
  const [form, setForm] = useState({ descricao:'', categoria:'Outros', tipo:'variavel' as 'fixa'|'variavel', valor:'', data:new Date().toISOString().slice(0,10), recorrente:false })

  useEffect(() => { if (empresaId) carregar(empresaId) }, [empresaId])

  async function carregar(eid: string) {
    setLoading(true)
    const { data } = await createClient().from('despesas').select('*').eq('empresa_id',eid).order('data',{ascending:false})
    setDespesas(data||[])
    setLoading(false)
  }

  async function salvar() {
    if (!form.descricao || !form.valor) { setErro('Preencha descrição e valor.'); return }
    if (!empresaId) return
    setSalvando(true); setErro(null)
    const { error } = await createClient().from('despesas').insert({
      empresa_id: empresaId, descricao: form.descricao, categoria: form.categoria,
      tipo: form.tipo, valor: parseFloat(form.valor), data: form.data, recorrente: form.recorrente
    })
    setSalvando(false)
    if (error) { setErro('Erro ao salvar: '+error.message); return }
    setShowForm(false)
    setForm({ descricao:'', categoria:'Outros', tipo:'variavel', valor:'', data:new Date().toISOString().slice(0,10), recorrente:false })
    carregar(empresaId)
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta despesa?')) return
    await createClient().from('despesas').delete().eq('id',id)
    setDespesas(prev=>prev.filter(d=>d.id!==id))
  }

  const mesAtual = new Date().toISOString().slice(0,7)
  const despMes  = despesas.filter(d=>d.data.startsWith(mesAtual))
  const totalMes = despMes.reduce((a,d)=>a+d.valor,0)
  const totalFixas = despMes.filter(d=>d.tipo==='fixa').reduce((a,d)=>a+d.valor,0)

  return (
    <ProOnly>
    <div className="anim-fade" style={{display:'flex',flexDirection:'column',gap:'0.875rem',maxWidth:'820px'}}>
      <div className="pg-header">
        <div style={{display:'flex',alignItems:'center',gap:'0.625rem'}}>
          <Link href="/financeiro" className="btn btn-secondary" style={{padding:'0.4rem 0.625rem'}}><ArrowLeft size={15}/></Link>
          <div>
            <h1 className="pg-titulo">💸 Despesas</h1>
            <p className="pg-sub">Este mês: {formatCurrency(totalMes)}</p>
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

      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.625rem'}}>
        {[
          {l:'Total este mês',   v:formatCurrency(totalMes),   c:'var(--vermelho)'},
          {l:'Despesas fixas',   v:formatCurrency(totalFixas), c:'var(--amarelo)'},
          {l:'Despesas variáveis',v:formatCurrency(totalMes-totalFixas),c:'var(--texto)'},
        ].map(k=>(
          <div key={k.l} className="card" style={{padding:'0.875rem'}}>
            <p style={{fontSize:'0.78rem',color:'var(--texto-desab)',marginBottom:'0.25rem'}}>{k.l}</p>
            <p style={{fontWeight:900,fontSize:'1.4rem',color:k.c,fontFamily:'monospace'}}>{k.v}</p>
          </div>
        ))}
      </div>

      {/* Formulário inline */}
      {showForm&&(
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          <div className="sec-header"><span>➕ Nova Despesa</span></div>
          <div style={{padding:'0.875rem',display:'flex',flexDirection:'column',gap:'0.75rem'}}>
            {erro&&<div className="alerta alerta-perigo">{erro}</div>}
            <div>
              <label className="campo-label">Descrição *</label>
              <input className="campo" style={{marginTop:'0.375rem'}} placeholder="Ex: Conta de energia junho" value={form.descricao} onChange={e=>setForm(f=>({...f,descricao:e.target.value}))}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.625rem'}}>
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
                <label className="campo-label">Data</label>
                <input className="campo" type="date" style={{marginTop:'0.375rem'}} value={form.data} onChange={e=>setForm(f=>({...f,data:e.target.value}))}/>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:'0.625rem',alignItems:'flex-end'}}>
              <div>
                <label className="campo-label">Valor (R$) *</label>
                <div style={{position:'relative',marginTop:'0.375rem'}}>
                  <span style={{position:'absolute',left:'0.625rem',top:'50%',transform:'translateY(-50%)',fontWeight:700,color:'var(--texto-desab)'}}>R$</span>
                  <input className="campo" type="number" step="0.01" min="0" style={{paddingLeft:'2rem',fontWeight:800,fontSize:'1.1rem'}} placeholder="0,00" value={form.valor} onChange={e=>setForm(f=>({...f,valor:e.target.value}))}/>
                </div>
              </div>
              <button onClick={salvar} disabled={salvando} className="btn btn-primary" style={{display:'flex',alignItems:'center',gap:'0.375rem',height:'42px'}}>
                {salvando?<><Loader2 size={14} style={{animation:'spin 1s linear infinite'}}/>Salvando...</>:'✓ Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:'2rem',gap:'0.75rem',color:'var(--texto-desab)'}}>
          <Loader2 size={18} style={{animation:'spin 1s linear infinite'}}/> Carregando...
        </div>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr style={{background:'#364a60'}}>
                <th>Descrição</th><th>Categoria</th><th>Tipo</th>
                <th>Data</th><th style={{textAlign:'right'}}>Valor</th>
                <th style={{textAlign:'center'}}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {despesas.length===0 ? (
                <tr><td colSpan={6} style={{textAlign:'center',padding:'2rem',color:'var(--texto-desab)'}}>
                  Nenhuma despesa lançada ainda. Clique em "Lançar Despesa" para começar.
                </td></tr>
              ) : despesas.map(d=>(
                <tr key={d.id}>
                  <td style={{fontWeight:600}}>{d.descricao}</td>
                  <td style={{fontSize:'0.82rem'}}>{d.categoria}</td>
                  <td><span className={d.tipo==='fixa'?'status-neutro':'status-aviso'} style={{fontSize:'0.78rem'}}>{d.tipo==='fixa'?'🔒 Fixa':'📊 Variável'}</span></td>
                  <td style={{fontSize:'0.82rem',color:'var(--texto-desab)'}}>{new Date(d.data+'T12:00:00').toLocaleDateString('pt-BR')}</td>
                  <td style={{textAlign:'right',fontWeight:800,color:'var(--vermelho)',fontFamily:'monospace'}}>{formatCurrency(d.valor)}</td>
                  <td style={{textAlign:'center'}}>
                    <AdminOnly>
                      <button onClick={()=>excluir(d.id)} className="btn btn-secondary" style={{fontSize:'0.72rem',padding:'0.2rem 0.5rem',color:'var(--vermelho)'}}>
                        <Trash2 size={13}/>
                      </button>
                    </AdminOnly>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </ProOnly>
  )
}
