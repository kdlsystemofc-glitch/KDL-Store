'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { formatCurrency } from '@/lib/utils'
import { Plus, Loader2, Trash2, X, Save } from 'lucide-react'
import { PageTabs } from '@/components/PageTabs'

type Comissao = { id:string; nome:string; telefone:string|null; tipo:string; taxa:number; status:string; criado_em:string }
type VendaComissao = {
  id:string; numero:number; total:number; forma_pagamento:string; criado_em:string
  comissionado_nome:string; comissionado_id:string
  valor_comissao: number
}

export default function ComissoesPage() {
  const { empresaId } = useEmpresaId()
  const [aba,      setAba]      = useState<'cadastro'|'por-venda'>('cadastro')
  const [lista,    setLista]    = useState<Comissao[]>([])
  const [vendas,   setVendas]   = useState<VendaComissao[]>([])
  const [loading,  setLoading]  = useState(true)
  const [loadingV, setLoadingV] = useState(false)
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

  async function carregarVendas(eid: string) {
    setLoadingV(true)
    const { data: vendasData } = await createClient()
      .from('vendas')
      .select('id,numero,total,forma_pagamento,criado_em,comissionado_id,comissionado_nome')
      .eq('empresa_id', eid)
      .eq('status', 'concluida')
      .not('comissionado_id', 'is', null)
      .order('criado_em', { ascending: false })
      .limit(100)

    if (!vendasData || vendasData.length === 0) { setVendas([]); setLoadingV(false); return }

    // Calcula comissão usando a taxa do comissionado
    const { data: comissoes } = await createClient()
      .from('comissoes')
      .select('id,taxa,tipo_comissao')
      .eq('empresa_id', eid)

    const mapa = Object.fromEntries((comissoes||[]).map(c => [c.id, c]))

    const result: VendaComissao[] = vendasData.map(v => {
      const com = mapa[v.comissionado_id]
      let valor_comissao = 0
      if (com) {
        valor_comissao = com.tipo_comissao === 'percentual'
          ? (v.total * com.taxa) / 100
          : com.taxa
      }
      return {
        id:               v.id,
        numero:           v.numero,
        total:            v.total,
        forma_pagamento:  v.forma_pagamento,
        criado_em:        v.criado_em,
        comissionado_nome: v.comissionado_nome || '—',
        comissionado_id:  v.comissionado_id,
        valor_comissao,
      }
    })
    setVendas(result)
    setLoadingV(false)
  }

  function handleAba(a: 'cadastro'|'por-venda') {
    setAba(a)
    if (a === 'por-venda' && empresaId && vendas.length === 0) carregarVendas(empresaId)
  }

  async function salvar() {
    if (!nome.trim()||!taxa||!empresaId) return
    setSalvando(true)
    const { data } = await createClient().from('comissoes')
      .insert({ empresa_id:empresaId, nome:nome.trim(), telefone:tel||null, tipo_comissao:tipo, taxa:parseFloat(taxa), status:'ativo' })
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
  const totalComissoes = vendas.reduce((a,v)=>a+v.valor_comissao, 0)

  // Agrupa por comissionado para ranking
  const ranking = Object.values(
    vendas.reduce((acc, v) => {
      if (!acc[v.comissionado_id]) acc[v.comissionado_id] = { nome: v.comissionado_nome, vendas: 0, total: 0, comissao: 0 }
      acc[v.comissionado_id].vendas++
      acc[v.comissionado_id].total += v.total
      acc[v.comissionado_id].comissao += v.valor_comissao
      return acc
    }, {} as Record<string,{nome:string;vendas:number;total:number;comissao:number}>)
  ).sort((a,b) => b.comissao - a.comissao)

  return (
    <div className="anim-fade" style={{display:'flex',flexDirection:'column',gap:'0.875rem',maxWidth:'860px'}}>

      {/* Modal Novo Comissionado */}
      {modal&&(
        <div style={{position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center'}}
          onClick={e=>{if(e.target===e.currentTarget)setModal(false)}}>
          <div className="card anim-pop" style={{width:'100%',maxWidth:'420px',padding:'1.25rem'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
              <p style={{fontWeight:900,fontSize:'1.1rem'}}>🎯 Cadastrar Comissionado</p>
              <button onClick={()=>setModal(false)} className="btn-icon"><X size={18}/></button>
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
          <p className="pg-sub">{ativos.length} comissionado(s) ativo(s) · {vendas.length > 0 ? `${vendas.length} vendas comissionadas` : ''}</p></div>
        <button className="btn btn-primary" onClick={()=>setModal(true)} style={{display:'flex',alignItems:'center',gap:'0.375rem'}}>
          <Plus size={14}/> Cadastrar
        </button>
      </div>

      <PageTabs tabs={[
        { label: 'Garantias', href: '/garantias' },
        { label: 'Ordens de Serviço', href: '/ordens-de-servico' },
        { label: 'Comissões', href: '/comissoes' }
      ]} />

      {/* Sub-abas da página */}
      <div style={{display:'flex',gap:'0.25rem',background:'var(--surface)',border:'1px solid var(--borda)',borderRadius:'var(--radius)',padding:'0.25rem',width:'fit-content'}}>
        {([['cadastro','👥 Comissionados'],['por-venda','💰 Por Venda']] as const).map(([v,l])=>(
          <button key={v} onClick={()=>handleAba(v)}
            className={aba===v?'btn btn-primary':'btn btn-ghost'}
            style={{fontSize:'0.82rem',padding:'0.3rem 0.75rem'}}>{l}</button>
        ))}
      </div>

      {/* ── ABA CADASTRO ── */}
      {aba === 'cadastro' && (
        <>
          <div className="alerta alerta-info" style={{fontSize:'0.82rem'}}>
            💡 Comissionados recebem por cada venda onde foram indicadores. Configure % sobre a venda ou valor fixo por pedido. O campo "Indicador" aparece no PDV ao registrar uma venda.
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
        </>
      )}

      {/* ── ABA POR VENDA ── */}
      {aba === 'por-venda' && (
        <>
          {loadingV ? (
            <div style={{display:'flex',justifyContent:'center',padding:'2rem',gap:'0.75rem',color:'var(--texto-desab)'}}>
              <Loader2 size={18} style={{animation:'spin 1s linear infinite'}}/> Carregando vendas...
            </div>
          ) : vendas.length === 0 ? (
            <div style={{textAlign:'center',padding:'3rem',color:'var(--texto-desab)'}}>
              <p style={{fontSize:'2rem',marginBottom:'0.5rem'}}>💰</p>
              <p style={{fontWeight:700}}>Nenhuma venda com comissão registrada</p>
              <p style={{fontSize:'0.85rem',marginTop:'0.25rem'}}>Ao registrar uma venda no PDV, selecione o indicador no campo "Comissionado"</p>
            </div>
          ) : (
            <>
              {/* KPIs */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.625rem'}}>
                {[
                  {l:'Vendas comissionadas', v:vendas.length, suf:'vendas', c:'var(--texto)'},
                  {l:'Total vendido',        v:formatCurrency(vendas.reduce((a,v)=>a+v.total,0)), suf:'em vendas com comissão', c:'var(--verde)'},
                  {l:'Total a pagar',        v:formatCurrency(totalComissoes), suf:'em comissões', c:'var(--amarelo)'},
                ].map(k=>(
                  <div key={k.l} className="card" style={{padding:'0.875rem'}}>
                    <p style={{fontSize:'0.78rem',color:'var(--texto-desab)',marginBottom:'0.25rem'}}>{k.l}</p>
                    <p style={{fontWeight:900,fontSize:'1.4rem',color:k.c,fontFamily:'monospace'}}>{k.v}</p>
                    <p style={{fontSize:'0.72rem',color:'var(--texto-desab)'}}>{k.suf}</p>
                  </div>
                ))}
              </div>

              {/* Ranking */}
              {ranking.length > 1 && (
                <div className="card" style={{padding:'0.875rem'}}>
                  <p style={{fontWeight:800,fontSize:'0.85rem',marginBottom:'0.625rem'}}>🏆 Ranking de Indicadores</p>
                  <div style={{display:'flex',flexDirection:'column',gap:'0.375rem'}}>
                    {ranking.map((r,i)=>(
                      <div key={r.nome} style={{display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.375rem 0',borderBottom:'1px solid var(--borda-leve)'}}>
                        <span style={{fontWeight:900,fontSize:'1rem',width:'1.5rem',color:'var(--texto-desab)'}}>{i+1}°</span>
                        <span style={{flex:1,fontWeight:700}}>{r.nome}</span>
                        <span style={{fontSize:'0.82rem',color:'var(--texto-sec)'}}>{r.vendas} venda(s)</span>
                        <span style={{fontWeight:800,color:'var(--verde)',fontFamily:'monospace',minWidth:'80px',textAlign:'right'}}>{formatCurrency(r.comissao)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabela detalhada */}
              <div className="tabela-wrap">
                <table className="tabela">
                  <thead>
                    <tr style={{background:'#364a60'}}>
                      <th>#Venda</th><th>Data</th><th>Pagamento</th>
                      <th>Indicador</th>
                      <th style={{textAlign:'right'}}>Total Venda</th>
                      <th style={{textAlign:'right'}}>Comissão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendas.map(v=>(
                      <tr key={v.id}>
                        <td><span style={{fontWeight:700,color:'var(--verde)',fontFamily:'monospace'}}>#{String(v.numero).padStart(4,'0')}</span></td>
                        <td style={{fontSize:'0.82rem',color:'var(--texto-desab)'}}>{new Date(v.criado_em).toLocaleDateString('pt-BR')}</td>
                        <td style={{fontSize:'0.82rem'}}>{v.forma_pagamento}</td>
                        <td style={{fontWeight:600}}>{v.comissionado_nome}</td>
                        <td style={{textAlign:'right',fontFamily:'monospace',fontWeight:700}}>{formatCurrency(v.total)}</td>
                        <td style={{textAlign:'right',fontFamily:'monospace',fontWeight:800,color:'var(--amarelo)'}}>
                          {formatCurrency(v.valor_comissao)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{background:'var(--surface-alt)'}}>
                      <td colSpan={4} style={{fontWeight:700,padding:'0.625rem 0.875rem'}}>TOTAL</td>
                      <td style={{textAlign:'right',fontWeight:900,fontFamily:'monospace',padding:'0.625rem 0.875rem',color:'var(--verde)'}}>
                        {formatCurrency(vendas.reduce((a,v)=>a+v.total,0))}
                      </td>
                      <td style={{textAlign:'right',fontWeight:900,fontFamily:'monospace',padding:'0.625rem 0.875rem',color:'var(--amarelo)'}}>
                        {formatCurrency(totalComissoes)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
