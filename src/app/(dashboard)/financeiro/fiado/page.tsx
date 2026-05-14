'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { formatCurrency } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { PageTabs } from '@/components/PageTabs'

type Fiado = { id:string; cliente_nome:string; cliente_tel:string|null; valor_aberto:number; criado_em:string; status:string }

export default function FiadoPage() {
  const { empresaId } = useEmpresaId()
  const [fiados,  setFiados]  = useState<Fiado[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (empresaId) carregar(empresaId) }, [empresaId])

  async function carregar(eid: string) {
    setLoading(true)
    const { data } = await createClient()
      .from('fiados')
      .select('id,cliente_nome,cliente_tel,valor_aberto,criado_em,status')
      .eq('empresa_id', eid)
      .order('criado_em', { ascending: false })
    setFiados(data||[])
    setLoading(false)
  }

  async function marcarPago(id: string, nome: string, valor: number) {
    if (!confirm(`Marcar R$${valor.toFixed(2)} de ${nome} como pago?`)) return
    await createClient().from('fiados').update({ status:'pago', pago_em: new Date().toISOString() }).eq('id', id)
    setFiados(prev => prev.map(f => f.id===id ? {...f, status:'pago'} : f))
  }

  const abertos     = fiados.filter(f=>f.status==='aberto')
  const pagos       = fiados.filter(f=>f.status==='pago')
  const totalAberto = abertos.reduce((a,f)=>a+f.valor_aberto,0)
  const totalPagoMes = pagos.filter(f=>{
    const d = new Date(f.criado_em)
    const n = new Date()
    return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear()
  }).reduce((a,f)=>a+f.valor_aberto,0)

  const diasAberto = (data: string) => Math.floor((Date.now()-new Date(data).getTime())/86400000)

  return (
    <div className="anim-fade" style={{display:'flex',flexDirection:'column',gap:'0.875rem'}}>
      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">📒 Controle de Fiado</h1>
          <p className="pg-sub">{abertos.length} devedor(es) · {formatCurrency(totalAberto)} em aberto</p>
        </div>
      </div>

      <PageTabs tabs={[
        { label: 'Visão Geral (DRE)', href: '/financeiro' },
        { label: 'Despesas', href: '/financeiro/despesas' },
        { label: 'Fiados 📒', href: '/financeiro/fiado' },
        { label: 'Fechamento de Caixa', href: '/financeiro/fechamento' }
      ]} />

      <ProOnly>
        {/* KPIs */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.625rem'}}>
          {[
            {l:'Total em Aberto',     v:formatCurrency(totalAberto), c:totalAberto>0?'var(--vermelho)':'var(--verde)'},
            {l:'Recebido este Mês',   v:formatCurrency(totalPagoMes),c:'var(--verde)'},
            {l:'Nº de Devedores',     v:String(abertos.length),      c:abertos.length>0?'var(--amarelo)':'var(--verde)'},
          ].map(k=>(
            <div key={k.l} className="card" style={{padding:'0.875rem'}}>
              <p style={{fontSize:'0.78rem',color:'var(--texto-desab)',marginBottom:'0.25rem'}}>{k.l}</p>
              <p style={{fontWeight:900,fontSize:'1.5rem',color:k.c,fontFamily:'monospace'}}>{k.v}</p>
            </div>
          ))}
        </div>

        {abertos.some(f=>diasAberto(f.criado_em)>=15)&&(
          <div className="alerta alerta-perigo" style={{display:'flex',gap:'0.5rem',alignItems:'center'}}>
            🚨 Há clientes com fiado em aberto há mais de 15 dias. Considere cobrar via WhatsApp.
          </div>
        )}

        {loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:'3rem',gap:'0.75rem',color:'var(--texto-desab)'}}>
            <Loader2 size={20} style={{animation:'spin 1s linear infinite'}}/> Carregando...
          </div>
        ) : abertos.length===0 ? (
          <div style={{textAlign:'center',padding:'3rem',color:'var(--texto-desab)'}}>
            <p style={{fontSize:'2rem',marginBottom:'0.5rem'}}>🎉</p>
            <p style={{fontWeight:700}}>Nenhum fiado em aberto!</p>
            <p style={{fontSize:'0.85rem',marginTop:'0.25rem'}}>Todos os clientes estão em dia.</p>
          </div>
        ) : (
          <div className="tabela-wrap">
            <table className="tabela">
              <thead>
                <tr style={{background:'#364a60'}}>
                  <th>Cliente</th><th style={{textAlign:'right'}}>Valor</th>
                  <th style={{textAlign:'center'}}>Dias em aberto</th>
                  <th>Desde</th><th style={{textAlign:'center'}}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {abertos.map(f=>{
                  const dias = diasAberto(f.criado_em)
                  return (
                    <tr key={f.id}>
                      <td style={{fontWeight:700}}>
                        {f.cliente_nome}
                        {dias>=15&&<span style={{fontSize:'0.68rem',fontWeight:800,color:'var(--vermelho)',marginLeft:'0.375rem',padding:'1px 4px',background:'#fee2e2',borderRadius:'3px'}}>URGENTE</span>}
                      </td>
                      <td style={{textAlign:'right',fontWeight:900,color:'var(--vermelho)',fontFamily:'monospace',fontSize:'1.1rem'}}>
                        {formatCurrency(f.valor_aberto)}
                      </td>
                      <td style={{textAlign:'center',fontWeight:700,color:dias>=15?'var(--vermelho)':dias>=7?'var(--amarelo)':'var(--verde)'}}>
                        {dias} dia{dias!==1?'s':''}
                      </td>
                      <td style={{fontSize:'0.82rem',color:'var(--texto-desab)'}}>
                        {new Date(f.criado_em).toLocaleDateString('pt-BR')}
                      </td>
                      <td style={{textAlign:'center'}}>
                        <div style={{display:'flex',gap:'0.375rem',justifyContent:'center'}}>
                          {f.cliente_tel&&(
                            <a href={`https://wa.me/55${f.cliente_tel.replace(/\D/g,'')}?text=${encodeURIComponent(`Oi ${f.cliente_nome}, tudo bem? Passando para lembrar que você tem ${formatCurrency(f.valor_aberto)} em aberto aqui na loja. Quando puder aparecer ou me chama no zap! 😊`)}`}
                              target="_blank" rel="noopener noreferrer"
                              className="btn btn-secondary" style={{fontSize:'0.72rem',padding:'0.2rem 0.5rem',background:'#25D366',color:'#fff',border:'none'}}>
                              💬 Cobrar
                            </a>
                          )}
                          <button onClick={()=>marcarPago(f.id,f.cliente_nome,f.valor_aberto)}
                            className="btn btn-secondary" style={{fontSize:'0.72rem',padding:'0.2rem 0.5rem'}}>
                            ✓ Pago
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </ProOnly>
    </div>
  )
}
