'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { ArrowLeft, Printer } from 'lucide-react'

type Venda = { id:string; numero:number; cliente_nome:string|null; forma_pagamento:string; subtotal:number; desconto:number; total:number; status:string; criado_em:string }
type Item  = { id:string; produto_nome:string; quantidade:number; preco_unitario:number; brinde:boolean; num_serie:string|null }

const FORMA_ICON: Record<string,string> = { PIX:'📱', Dinheiro:'💵', Crédito:'💳', Débito:'💴', Fiado:'📒' }

export default function VendaReciboPage() {
  const { id }   = useParams() as { id: string }
  const [venda,  setVenda]  = useState<Venda|null>(null)
  const [itens,  setItens]  = useState<Item[]>([])
  const [loading,setLoading]= useState(true)

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    Promise.all([
      supabase.from('vendas').select('*').eq('id', id).single(),
      supabase.from('itens_venda').select('id,produto_nome,quantidade,preco_unitario,brinde,num_serie').eq('venda_id', id),
    ]).then(([{ data: v }, { data: i }]) => {
      setVenda(v)
      setItens(i || [])
      setLoading(false)
    })
  }, [id])

  if (loading) return (
    <div style={{display:'flex',justifyContent:'center',padding:'3rem',color:'var(--texto-desab)'}}>Carregando recibo...</div>
  )
  if (!venda) return <div className="alerta alerta-perigo">Venda não encontrada.</div>

  return (
    <div className="anim-fade" style={{display:'flex',flexDirection:'column',gap:'0.875rem',maxWidth:'560px'}}>
      <div className="pg-header">
        <div style={{display:'flex',alignItems:'center',gap:'0.625rem'}}>
          <Link href="/vendas" className="btn btn-secondary" style={{padding:'0.4rem 0.625rem'}}><ArrowLeft size={15}/></Link>
          <div>
            <h1 className="pg-titulo">🧾 Recibo #{String(venda.numero).padStart(4,'0')}</h1>
            <p className="pg-sub">{new Date(venda.criado_em).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}</p>
          </div>
        </div>
        <button onClick={()=>window.print()} className="btn btn-secondary" style={{display:'flex',alignItems:'center',gap:'0.375rem'}}>
          <Printer size={14}/> Imprimir
        </button>
      </div>

      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div style={{padding:'1.25rem',textAlign:'center',borderBottom:'2px dashed var(--borda)'}}>
          <p style={{fontWeight:900,fontSize:'1.25rem'}}>KDL Store</p>
          <p style={{color:'var(--texto-desab)',fontSize:'0.82rem'}}>Sistema de Gestão</p>
        </div>

        <div style={{padding:'1rem',display:'flex',flexDirection:'column',gap:'0.5rem',borderBottom:'1px solid var(--borda)'}}>
          {[
            {l:'Cliente',   v:venda.cliente_nome||'Anônimo'},
            {l:'Pagamento', v:`${FORMA_ICON[venda.forma_pagamento]||''} ${venda.forma_pagamento}`},
          ].map(r=>(
            <div key={r.l} style={{display:'flex',justifyContent:'space-between'}}>
              <span style={{color:'var(--texto-desab)',fontSize:'0.82rem'}}>{r.l}</span>
              <span style={{fontWeight:700}}>{r.v}</span>
            </div>
          ))}
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <span style={{color:'var(--texto-desab)',fontSize:'0.82rem'}}>Status</span>
            <span className={venda.status==='concluida'?'status-ok':'status-neutro'} style={{fontSize:'0.82rem'}}>
              {venda.status==='concluida'?'● Concluída':'○ Cancelada'}
            </span>
          </div>
        </div>

        <div style={{padding:'1rem',borderBottom:'1px solid var(--borda)'}}>
          <p style={{fontWeight:800,marginBottom:'0.625rem',fontSize:'0.875rem'}}>ITENS</p>
          <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
            {itens.map(item=>(
              <div key={item.id} style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'0.5rem'}}>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontWeight:600,fontSize:'0.875rem'}}>
                    {item.produto_nome}
                    {item.brinde&&<span style={{marginLeft:'0.375rem',fontSize:'0.7rem',background:'var(--verde-claro)',color:'var(--verde-esc)',padding:'1px 5px',borderRadius:'3px',fontWeight:700}}>BRINDE</span>}
                  </p>
                  {item.num_serie&&<p style={{fontSize:'0.72rem',color:'var(--texto-desab)',fontFamily:'monospace'}}>Série: {item.num_serie}</p>}
                  <p style={{fontSize:'0.75rem',color:'var(--texto-desab)'}}>{item.quantidade}x {item.brinde?'R$ 0,00':formatCurrency(item.preco_unitario)}</p>
                </div>
                <span style={{fontWeight:800,fontFamily:'monospace',flexShrink:0,color:item.brinde?'var(--verde)':'var(--texto)'}}>
                  {item.brinde?'R$ 0,00':formatCurrency(item.quantidade*item.preco_unitario)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{padding:'1rem',display:'flex',flexDirection:'column',gap:'0.375rem'}}>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <span style={{color:'var(--texto-sec)',fontSize:'0.875rem'}}>Subtotal</span>
            <span style={{fontFamily:'monospace'}}>{formatCurrency(venda.subtotal)}</span>
          </div>
          {venda.desconto>0&&(
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <span style={{color:'var(--vermelho)',fontSize:'0.875rem'}}>Desconto</span>
              <span style={{fontFamily:'monospace',color:'var(--vermelho)'}}>- {formatCurrency(venda.desconto)}</span>
            </div>
          )}
          <div style={{display:'flex',justifyContent:'space-between',borderTop:'2px solid var(--borda)',paddingTop:'0.5rem',marginTop:'0.25rem'}}>
            <span style={{fontWeight:900,fontSize:'1.1rem'}}>TOTAL</span>
            <span style={{fontFamily:'monospace',fontWeight:900,fontSize:'1.5rem',color:'var(--verde)'}}>{formatCurrency(venda.total)}</span>
          </div>
        </div>

        <div style={{padding:'1rem',textAlign:'center',borderTop:'2px dashed var(--borda)',color:'var(--texto-desab)',fontSize:'0.78rem'}}>
          <p>Obrigado pela preferência! 🙏</p>
          <p style={{marginTop:'4px'}}>Guarde este recibo para a garantia.</p>
        </div>
      </div>

      <div style={{display:'flex',gap:'0.5rem',justifyContent:'center'}}>
        <Link href="/vendas" className="btn btn-ghost">← Voltar</Link>
        <Link href="/vendas/nova" className="btn btn-primary">+ Nova Venda</Link>
      </div>
    </div>
  )
}
