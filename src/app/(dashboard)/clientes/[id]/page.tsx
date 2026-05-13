'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { ArrowLeft, Loader2 } from 'lucide-react'

type Cliente = { id:string; nome:string; telefone:string|null; cpf:string|null; email:string|null; endereco:string|null; anotacoes:string|null; tipo:string; ativo:boolean; criado_em:string }
type Venda   = { id:string; numero:number; total:number; forma_pagamento:string; criado_em:string; status:string }
type Fiado   = { id:string; valor_aberto:number; status:string; criado_em:string }

export default function ClientePerfilPage() {
  const { id }   = useParams() as { id: string }
  const router   = useRouter()
  const [cliente,  setCliente]  = useState<Cliente|null>(null)
  const [vendas,   setVendas]   = useState<Venda[]>([])
  const [fiados,   setFiados]   = useState<Fiado[]>([])
  const [loading,  setLoading]  = useState(true)
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => { if (id) carregar(id) }, [id])

  async function carregar(cid: string) {
    setLoading(true)
    const supabase = createClient()
    const results = await Promise.allSettled([
      supabase.from('clientes').select('*').eq('id', cid).single(),
      supabase.from('vendas').select('id,numero,total,forma_pagamento,criado_em,status').eq('cliente_id', cid).order('criado_em', { ascending:false }).limit(20),
      supabase.from('fiados').select('id,valor_aberto,status,criado_em').eq('cliente_id', cid).order('criado_em', { ascending:false }),
    ])
    const getRes = (i: number): any => results[i].status === 'fulfilled' ? (results[i] as PromiseFulfilledResult<any>).value || {} : {}
    const { data: c } = getRes(0)
    const { data: v } = getRes(1)
    const { data: f } = getRes(2)
    setCliente(c)
    setVendas(v || [])
    setFiados(f || [])
    setLoading(false)
  }

  async function salvar() {
    if (!cliente) return
    setSalvando(true)
    await createClient().from('clientes').update({
      nome: cliente.nome, telefone: cliente.telefone||null, email: cliente.email||null,
      cpf: cliente.cpf||null, endereco: cliente.endereco||null,
      anotacoes: cliente.anotacoes||null, tipo: cliente.tipo, ativo: cliente.ativo,
    }).eq('id', cliente.id)
    setSalvando(false)
    setEditando(false)
  }

  async function excluir() {
    if (!cliente || !confirm(`Excluir o cliente "${cliente.nome}"?`)) return
    await createClient().from('clientes').delete().eq('id', cliente.id)
    router.push('/clientes')
  }

  const totalGasto  = vendas.filter(v=>v.status==='concluida').reduce((a,v)=>a+v.total,0)
  const fiadoAberto = fiados.filter(f=>f.status==='aberto').reduce((a,f)=>a+f.valor_aberto,0)

  if (loading) return (
    <div style={{display:'flex',justifyContent:'center',padding:'3rem',gap:'0.75rem',color:'var(--texto-desab)'}}>
      <Loader2 size={20} style={{animation:'spin 1s linear infinite'}}/> Carregando...
    </div>
  )
  if (!cliente) return <div className="alerta alerta-perigo">Cliente não encontrado.</div>

  const set = (k: keyof Cliente, v: unknown) => setCliente(c => c ? {...c,[k]:v} : c)

  return (
    <div className="anim-fade" style={{display:'flex',flexDirection:'column',gap:'0.875rem',maxWidth:'760px'}}>
      <div className="pg-header">
        <div style={{display:'flex',alignItems:'center',gap:'0.625rem'}}>
          <Link href="/clientes" className="btn btn-secondary" style={{padding:'0.4rem 0.625rem'}}><ArrowLeft size={15}/></Link>
          <div>
            <h1 className="pg-titulo">👤 {cliente.nome}</h1>
            <p className="pg-sub">
              <span className={cliente.tipo==='vip'?'status-alerta':cliente.tipo==='atacado'?'status-aviso':'status-neutro'} style={{fontSize:'0.78rem'}}>
                {cliente.tipo==='vip'?'⭐ VIP':cliente.tipo==='atacado'?'📦 Atacado':'🛒 Varejo'}
              </span>
              {' '}· Cliente desde {new Date(cliente.criado_em).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
        <div style={{display:'flex',gap:'0.5rem'}}>
          <button onClick={()=>setEditando(v=>!v)} className="btn btn-secondary">{editando?'Cancelar':'✏️ Editar'}</button>
          <button onClick={excluir} className="btn btn-secondary" style={{color:'var(--vermelho)'}}>Excluir</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.625rem'}}>
        {[
          {l:'Total gasto',     v:formatCurrency(totalGasto), c:'var(--verde)'},
          {l:'Compras',         v:String(vendas.length),      c:'var(--texto)'},
          {l:'Fiado em aberto', v:formatCurrency(fiadoAberto),c:fiadoAberto>0?'var(--vermelho)':'var(--verde)'},
        ].map(k=>(
          <div key={k.l} className="card" style={{padding:'0.875rem'}}>
            <p style={{fontSize:'0.78rem',color:'var(--texto-desab)',marginBottom:'0.25rem'}}>{k.l}</p>
            <p style={{fontWeight:900,fontSize:'1.4rem',color:k.c,fontFamily:'monospace'}}>{k.v}</p>
          </div>
        ))}
      </div>

      {/* Dados */}
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div className="sec-header"><span>📋 Dados do Cliente</span></div>
        <div style={{padding:'0.875rem',display:'flex',flexDirection:'column',gap:'0.75rem'}}>
          {editando ? (
            <>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.625rem'}}>
                <div>
                  <label className="campo-label">Nome</label>
                  <input className="campo" style={{marginTop:'0.375rem'}} value={cliente.nome} onChange={e=>set('nome',e.target.value)}/>
                </div>
                <div>
                  <label className="campo-label">Telefone</label>
                  <input className="campo" style={{marginTop:'0.375rem'}} value={cliente.telefone||''} onChange={e=>set('telefone',e.target.value)}/>
                </div>
                <div>
                  <label className="campo-label">E-mail</label>
                  <input className="campo" type="email" style={{marginTop:'0.375rem'}} value={cliente.email||''} onChange={e=>set('email',e.target.value)}/>
                </div>
                <div>
                  <label className="campo-label">CPF</label>
                  <input className="campo" style={{marginTop:'0.375rem',fontFamily:'monospace'}} value={cliente.cpf||''} onChange={e=>set('cpf',e.target.value)}/>
                </div>
              </div>
              <div>
                <label className="campo-label">Endereço</label>
                <input className="campo" style={{marginTop:'0.375rem'}} value={cliente.endereco||''} onChange={e=>set('endereco',e.target.value)}/>
              </div>
              <div>
                <label className="campo-label">Anotações</label>
                <textarea className="campo" rows={2} style={{marginTop:'0.375rem',resize:'none'}} value={cliente.anotacoes||''} onChange={e=>set('anotacoes',e.target.value)}/>
              </div>
              <div style={{display:'flex',gap:'0.5rem'}}>
                {(['varejo','atacado','vip'] as const).map(t=>(
                  <button key={t} onClick={()=>set('tipo',t)} style={{
                    flex:1,padding:'0.5rem',borderRadius:'var(--radius-sm)',border:`2px solid ${cliente.tipo===t?'var(--verde)':'var(--borda)'}`,
                    background:cliente.tipo===t?'var(--verde-claro)':'var(--surface)',cursor:'pointer',fontWeight:700,fontFamily:'inherit',
                    color:cliente.tipo===t?'var(--verde-esc)':'var(--texto-sec)',fontSize:'0.8rem'
                  }}>{t==='vip'?'⭐ VIP':t==='atacado'?'📦 Atacado':'🏪 Varejo'}</button>
                ))}
              </div>
              <div style={{display:'flex',justifyContent:'flex-end',gap:'0.5rem'}}>
                <button onClick={()=>setEditando(false)} className="btn btn-ghost">Cancelar</button>
                <button onClick={salvar} disabled={salvando} className="btn btn-primary">
                  {salvando?<><Loader2 size={14} style={{animation:'spin 1s linear infinite'}}/> Salvando...</>:'✓ Salvar'}
                </button>
              </div>
            </>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.625rem',fontSize:'0.875rem'}}>
              {[
                {l:'Telefone', v:cliente.telefone, link:cliente.telefone?`https://wa.me/55${cliente.telefone.replace(/\D/g,'')}`:null},
                {l:'E-mail',   v:cliente.email,     link:null},
                {l:'CPF',      v:cliente.cpf,        link:null},
                {l:'Endereço', v:cliente.endereco,   link:null},
              ].map(f=>(
                <div key={f.l}>
                  <p style={{color:'var(--texto-desab)',fontSize:'0.75rem',fontWeight:600}}>{f.l}</p>
                  {f.link
                    ? <a href={f.link} target="_blank" rel="noopener noreferrer" style={{color:'#25D366',fontWeight:700}}>💬 {f.v}</a>
                    : <p style={{fontWeight:600,marginTop:'2px'}}>{f.v||'—'}</p>
                  }
                </div>
              ))}
              {cliente.anotacoes&&(
                <div style={{gridColumn:'1/-1'}}>
                  <p style={{color:'var(--texto-desab)',fontSize:'0.75rem',fontWeight:600}}>Anotações</p>
                  <p style={{fontStyle:'italic',color:'var(--texto-sec)',marginTop:'2px'}}>{cliente.anotacoes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Histórico de compras */}
      <div>
        <p style={{fontWeight:800,marginBottom:'0.625rem'}}>🛒 Histórico de Compras</p>
        {vendas.length===0 ? (
          <p style={{color:'var(--texto-desab)',fontSize:'0.875rem'}}>Nenhuma compra registrada ainda.</p>
        ) : (
          <div className="tabela-wrap">
            <table className="tabela">
              <thead><tr style={{background:'#364a60'}}><th>#</th><th>Pagamento</th><th style={{textAlign:'right'}}>Total</th><th>Data</th><th style={{textAlign:'center'}}>Status</th></tr></thead>
              <tbody>
                {vendas.map(v=>(
                  <tr key={v.id}>
                    <td><Link href={`/vendas/${v.id}`} style={{fontWeight:700,color:'var(--verde)'}} >#{String(v.numero).padStart(4,'0')}</Link></td>
                    <td style={{fontSize:'0.82rem'}}>{v.forma_pagamento}</td>
                    <td style={{textAlign:'right',fontWeight:800,color:'var(--verde)',fontFamily:'monospace'}}>{formatCurrency(v.total)}</td>
                    <td style={{fontSize:'0.8rem',color:'var(--texto-desab)'}}>{new Date(v.criado_em).toLocaleDateString('pt-BR')}</td>
                    <td style={{textAlign:'center'}}><span className={v.status==='concluida'?'status-ok':'status-neutro'} style={{fontSize:'0.75rem'}}>{v.status==='concluida'?'● OK':'○ Cancelada'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Fiado */}
      {fiados.length>0&&(
        <div>
          <p style={{fontWeight:800,marginBottom:'0.625rem'}}>📒 Fiado</p>
          <div className="tabela-wrap">
            <table className="tabela">
              <thead><tr style={{background:'#364a60'}}><th style={{textAlign:'right'}}>Valor</th><th>Data</th><th style={{textAlign:'center'}}>Status</th></tr></thead>
              <tbody>
                {fiados.map(f=>(
                  <tr key={f.id}>
                    <td style={{textAlign:'right',fontWeight:800,color:f.status==='aberto'?'var(--vermelho)':'var(--verde)',fontFamily:'monospace'}}>{formatCurrency(f.valor_aberto)}</td>
                    <td style={{fontSize:'0.82rem',color:'var(--texto-desab)'}}>{new Date(f.criado_em).toLocaleDateString('pt-BR')}</td>
                    <td style={{textAlign:'center'}}><span className={f.status==='pago'?'status-ok':'status-perigo'} style={{fontSize:'0.75rem'}}>{f.status==='pago'?'● Pago':'● Aberto'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
