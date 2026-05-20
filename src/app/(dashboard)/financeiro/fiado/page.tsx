'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { formatCurrency } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { PageTabs } from '@/components/PageTabs'
import { OperadorOnly } from '@/components/OperadorOnly'
import { ProOnly } from '@/components/ProOnly'


type Fiado = { id:string; cliente_nome:string; cliente_tel:string|null; valor_aberto:number; criado_em:string; status:string; data_vencimento:string|null }

export default function FiadoPage() {
  const { empresaId } = useEmpresaId()
  const [fiados,  setFiados]  = useState<Fiado[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro,  setFiltro]  = useState<'todos'|'vencidos'|'hoje'|'avencer'>('todos')

  useEffect(() => { if (empresaId) carregar(empresaId) }, [empresaId])

  async function carregar(eid: string) {
    setLoading(true)
    const { data } = await createClient()
      .from('fiados')
      .select('id,cliente_nome,cliente_tel,valor_aberto,criado_em,status,data_vencimento')
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

  const hojeData = new Date().toISOString().slice(0,10)
  
  const abertosDb = fiados.filter(f=>f.status==='aberto')
  
  const abertosSorted = [...abertosDb].sort((a,b) => {
    if (!a.data_vencimento && !b.data_vencimento) return new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
    if (!a.data_vencimento) return 1
    if (!b.data_vencimento) return -1
    const aVencido = a.data_vencimento < hojeData
    const bVencido = b.data_vencimento < hojeData
    if (aVencido && !bVencido) return -1
    if (!aVencido && bVencido) return 1
    return new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime()
  })

  const abertos = abertosSorted.filter(f => {
    if (filtro === 'todos') return true
    if (!f.data_vencimento) return false
    if (filtro === 'vencidos') return f.data_vencimento < hojeData
    if (filtro === 'hoje') return f.data_vencimento === hojeData
    if (filtro === 'avencer') return f.data_vencimento > hojeData
    return true
  })

  const pagos       = fiados.filter(f=>f.status==='pago')
  const totalAberto = abertosDb.reduce((a,f)=>a+f.valor_aberto,0)
  const totalPagoMes = pagos.filter(f=>{
    const d = new Date(f.criado_em)
    const n = new Date()
    return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear()
  }).reduce((a,f)=>a+f.valor_aberto,0)

  const diasAberto = (data: string) => Math.floor((Date.now()-new Date(data).getTime())/86400000)
  
  function calcDiasRestantes(data_vencimento: string) {
    const v = new Date(data_vencimento + 'T12:00:00').getTime()
    const hoje = new Date(hojeData + 'T12:00:00').getTime()
    return Math.floor((v - hoje) / 86400000)
  }

  function getWaMsg(f: Fiado) {
    const val = formatCurrency(f.valor_aberto)
    if (!f.data_vencimento) {
      return encodeURIComponent(`Oi ${f.cliente_nome}, tudo bem? Passando para lembrar que você tem ${val} em aberto aqui na loja. Quando puder aparecer ou me chama no zap! 😊`)
    }
    const dias = calcDiasRestantes(f.data_vencimento)
    const dataStr = new Date(f.data_vencimento+'T12:00:00').toLocaleDateString('pt-BR')
    if (dias < 0) {
      return encodeURIComponent(`Oi ${f.cliente_nome}, seu fiado de ${val} venceu em ${dataStr}. Quando puder, vamos acertar?`)
    } else if (dias === 0) {
      return encodeURIComponent(`Oi ${f.cliente_nome}, seu fiado de ${val} vence hoje. Pode passar aqui ou me chamar para acertar!`)
    } else {
      return encodeURIComponent(`Oi ${f.cliente_nome}, lembrando que seu fiado de ${val} vence em ${dataStr}. Qualquer dúvida é só chamar!`)
    }
  }

  return (
    <ProOnly>
    <div className="anim-fade" style={{display:'flex',flexDirection:'column',gap:'0.875rem'}}>
      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">📒 Controle de Fiado</h1>
          <p className="pg-sub">{abertosDb.length} devedor(es) · {formatCurrency(totalAberto)} em aberto</p>
        </div>
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
            {l:'Total em Aberto',     v:formatCurrency(totalAberto), c:totalAberto>0?'var(--vermelho)':'var(--verde)'},
            {l:'Recebido este Mês',   v:formatCurrency(totalPagoMes),c:'var(--verde)'},
            {l:'Nº de Devedores',     v:String(abertosDb.length),      c:abertosDb.length>0?'var(--amarelo)':'var(--verde)'},
          ].map(k=>(
            <div key={k.l} className="card" style={{padding:'0.875rem'}}>
              <p style={{fontSize:'0.78rem',color:'var(--texto-desab)',marginBottom:'0.25rem'}}>{k.l}</p>
              <p style={{fontWeight:900,fontSize:'1.5rem',color:k.c,fontFamily:'monospace'}}>{k.v}</p>
            </div>
          ))}
        </div>

        {abertosDb.some(f => f.data_vencimento && f.data_vencimento < hojeData) && (
          <div className="alerta alerta-perigo" style={{display:'flex',gap:'0.5rem',alignItems:'center'}}>
            🚨 Há fiados vencidos! Considere cobrar via WhatsApp.
          </div>
        )}
        
        {/* Filtros */}
        <div style={{display:'flex',gap:'0.375rem',flexWrap:'wrap',alignItems:'center'}}>
          {([
            { v:'todos',    l:'TODOS' },
            { v:'vencidos', l:'VENCIDOS' },
            { v:'hoje',     l:'VENCENDO HOJE' },
            { v:'avencer',  l:'A VENCER' },
          ] as const).map(f => (
            <button key={f.v} onClick={() => setFiltro(f.v)}
              className={filtro === f.v ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ fontSize:'0.65rem', padding:'0.3rem 0.625rem' }}>
              {f.l}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:'3rem',gap:'0.75rem',color:'var(--texto-desab)'}}>
            <Loader2 size={20} style={{animation:'spin 1s linear infinite'}}/> Carregando...
          </div>
        ) : abertosDb.length===0 ? (
          <div style={{textAlign:'center',padding:'3rem',color:'var(--texto-desab)'}}>
            <p style={{fontSize:'2rem',marginBottom:'0.5rem'}}>🎉</p>
            <p style={{fontWeight:700}}>Nenhum fiado em aberto!</p>
            <p style={{fontSize:'0.85rem',marginTop:'0.25rem'}}>Todos os clientes estão em dia.</p>
          </div>
        ) : abertos.length===0 ? (
          <div style={{textAlign:'center',padding:'3rem',color:'var(--texto-desab)',background:'var(--surface)'}}>
            <p style={{fontSize:'0.78rem',letterSpacing:'0.04em'}}>[ NENHUM FIADO NESTE FILTRO ]</p>
          </div>
        ) : (
          <div className="tabela-wrap">
            <table className="tabela">
              <thead>
                <tr style={{background:'#364a60'}}>
                  <th>Cliente</th><th style={{textAlign:'right'}}>Valor</th>
                  <th style={{textAlign:'center'}}>Vencimento</th>
                  <th>Desde</th><th style={{textAlign:'center'}}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {abertos.map(f=>{
                  let vencText = 'S/ Prazo'
                  let vencColor = 'var(--texto-desab)'
                  
                  if (f.data_vencimento) {
                    const dias = calcDiasRestantes(f.data_vencimento)
                    vencText = new Date(f.data_vencimento+'T12:00:00').toLocaleDateString('pt-BR')
                    if (dias < 0) vencColor = 'var(--vermelho)'
                    else if (dias <= 7) vencColor = 'var(--amarelo)'
                    else vencColor = 'var(--verde)'
                    
                    if (dias < 0) vencText += ' (Vencido)'
                    else if (dias === 0) vencText += ' (Hoje)'
                    else vencText += ` (${dias}d)`
                  }

                  return (
                    <tr key={f.id}>
                      <td style={{fontWeight:700}}>
                        {f.cliente_nome}
                      </td>
                      <td style={{textAlign:'right',fontWeight:900,color:'var(--vermelho)',fontFamily:'monospace',fontSize:'1.1rem'}}>
                        {formatCurrency(f.valor_aberto)}
                      </td>
                      <td style={{textAlign:'center',fontWeight:700,color:vencColor}}>
                        {vencText}
                      </td>
                      <td style={{fontSize:'0.82rem',color:'var(--texto-desab)'}}>
                        {new Date(f.criado_em).toLocaleDateString('pt-BR')}
                      </td>
                      <td style={{textAlign:'center'}}>
                        <div style={{display:'flex',gap:'0.375rem',justifyContent:'center'}}>
                          {f.cliente_tel&&(
                            <a href={`https://wa.me/55${f.cliente_tel.replace(/\D/g,'')}?text=${getWaMsg(f)}`}
                              target="_blank" rel="noopener noreferrer"
                              className="btn btn-secondary" style={{fontSize:'0.72rem',padding:'0.2rem 0.5rem',background:'#25D366',color:'#fff',border:'none'}}>
                              💬 Cobrar
                            </a>
                          )}
                          <OperadorOnly>
                            <button onClick={()=>marcarPago(f.id,f.cliente_nome,f.valor_aberto)}
                              className="btn btn-secondary" style={{fontSize:'0.72rem',padding:'0.2rem 0.5rem'}}>
                              ✓ Pago
                            </button>
                          </OperadorOnly>
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
    </ProOnly>
  )
}
