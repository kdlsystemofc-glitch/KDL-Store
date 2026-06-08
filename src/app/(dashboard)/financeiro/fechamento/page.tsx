'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { formatCurrency } from '@/lib/utils'
import { Loader2, Printer } from 'lucide-react'
import Link from 'next/link'
import { PageTabs } from '@/components/PageTabs'
import { AdminOnly } from '@/components/AdminOnly'
import { ProOnly } from '@/components/ProOnly'


type Venda = { total:number; forma_pagamento:string; criado_em:string }
type OsEntrada = { orcamento:number|null; valor_servico:number; valor_pecas:number; forma_pagamento:string|null; atualizado_em:string }
type Despesa = { descricao:string; categoria:string|null; valor:number }
type FechManual = { descricao:string; tipo:string; valor:number; forma_pagamento:string|null }

export default function FechamentoPage() {
  const { empresaId } = useEmpresaId()
  const [tipo,     setTipo]     = useState<'diario'|'mensal'>('diario')
  const [loading,  setLoading]  = useState(true)
  const [vendas,   setVendas]   = useState<Venda[]>([])
  const [osEntradas, setOsEntradas] = useState<OsEntrada[]>([])
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [fechManuais, setFechManuais] = useState<FechManual[]>([])
  const [saldoFisico,setSaldoFisico] = useState('')
  const [fechado,  setFechado]  = useState(false)

  useEffect(() => { if (empresaId) carregar(empresaId, tipo) }, [empresaId, tipo])

  async function carregar(eid: string, t: string) {
    setLoading(true)
    setFechado(false)
    const hoje      = new Date().toISOString().slice(0,10)
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10)
    const fimMes    = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0,10)
    const desde = t === 'diario' ? hoje : inicioMes
    const ate   = t === 'diario' ? hoje : fimMes
    const supabase = createClient()
    const results = await Promise.allSettled([
      supabase.from('vendas').select('total,forma_pagamento,criado_em').eq('empresa_id', eid).eq('status','concluida').gte('criado_em', desde).lte('criado_em', ate + 'T23:59:59'),
      // Despesas do período — filtra por data (sem status, pois a coluna não existe na tabela)
      supabase.from('despesas').select('descricao,categoria,valor').eq('empresa_id', eid).gte('data', desde).lte('data', ate),
      // OS entregues no período — entram no fechamento de caixa pelo atualizado_em
      supabase.from('ordens_servico').select('orcamento,valor_servico,valor_pecas,forma_pagamento,atualizado_em').eq('empresa_id', eid).eq('status','entregue').gte('atualizado_em', desde).lte('atualizado_em', ate + 'T23:59:59'),
      // Entradas/saídas manuais (recebimentos de fiado, ajustes, etc.)
      supabase.from('fechamentos_manuais').select('descricao,tipo,valor,forma_pagamento').eq('empresa_id', eid).gte('data', desde).lte('data', ate),
    ])
    const getRes = (i: number): any => results[i].status === 'fulfilled' ? (results[i] as PromiseFulfilledResult<any>).value || {} : {}
    const { data: v } = getRes(0)
    const { data: d } = getRes(1)
    const { data: os } = getRes(2)
    const { data: fm } = getRes(3)
    setVendas(v||[])
    setOsEntradas(os||[])
    setDespesas(d||[])
    setFechManuais(fm||[])
    setLoading(false)
  }

  const entradasManuais = fechManuais.filter(f => f.tipo === 'entrada').reduce((a,f) => a + f.valor, 0)
  const saidasManuais   = fechManuais.filter(f => f.tipo === 'saida').reduce((a,f) => a + f.valor, 0)

  // Fiado NÃO entra no saldo de caixa imediato (só entra quando recebido via amortização)
  const vendasCaixa = vendas.filter(v => v.forma_pagamento !== 'Fiado')
  const vendasFiado = vendas.filter(v => v.forma_pagamento === 'Fiado')
  const totalFiadoEmitido = vendasFiado.reduce((a,v) => a + v.total, 0)

  const totalReceita = vendasCaixa.reduce((a,v)=>a+v.total,0)
    + osEntradas.reduce((a,o)=>a+(o.orcamento ?? (o.valor_servico + o.valor_pecas)),0)
    + entradasManuais
  const totalDesp    = despesas.reduce((a,d)=>a+d.valor,0) + saidasManuais
  const saldoEsperado = totalReceita - totalDesp
  const saldoNum     = parseFloat(saldoFisico.replace(',','.')) || 0
  const diferenca    = saldoNum - saldoEsperado

  const porForma: Record<string,number> = {}
  // Apenas vendas que entram no caixa (sem Fiado)
  vendasCaixa.forEach(v=>{ porForma[v.forma_pagamento]=(porForma[v.forma_pagamento]||0)+v.total })
  osEntradas.forEach(o=>{
    const chave = o.forma_pagamento || 'Serviço OS'
    const valor = o.orcamento ?? (o.valor_servico + o.valor_pecas)
    porForma[chave] = (porForma[chave]||0) + valor
  })
  // Entradas manuais (fiados recebidos, ajustes) agrupadas por forma de pagamento
  fechManuais.filter(f => f.tipo === 'entrada').forEach(f => {
    const chave = f.forma_pagamento || 'Dinheiro'
    porForma[chave] = (porForma[chave] || 0) + f.valor
  })

  const labelPeriodo = tipo==='diario'
    ? `Hoje — ${new Date().toLocaleDateString('pt-BR')}`
    : `${new Date().toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}`

  return (
    <AdminOnly fallbackRedirect="/financeiro">
      <div className="anim-fade" style={{display:'flex',flexDirection:'column',gap:'0.875rem',maxWidth:'680px'}}>
      <div className="pg-header">
        <div><h1 className="pg-titulo">🔒 Fechamento de Caixa</h1>
          <p className="pg-sub">{labelPeriodo}</p></div>
        <div style={{display:'flex',gap:'0.5rem'}}>
          <button onClick={()=>window.print()} className="btn btn-secondary" style={{display:'flex',alignItems:'center',gap:'0.375rem'}}>
            <Printer size={14}/> Imprimir
          </button>
        </div>
      </div>

      <PageTabs tabs={[
        { label: 'Visão Geral (DRE)', href: '/financeiro' },
        { label: 'Despesas', href: '/financeiro/despesas' },
        { label: 'Fiados 📒', href: '/financeiro/fiado' },
        { label: 'Fechamento de Caixa', href: '/financeiro/fechamento' }
      ]} />

      <ProOnly>


        {/* Seletor de período */}
        <div style={{display:'flex',gap:'0.5rem'}}>
          {(['diario','mensal'] as const).map(t=>(
            <button key={t} onClick={()=>setTipo(t)} className={tipo===t?'btn btn-primary':'btn btn-secondary'}>
              {t==='diario'?'📅 Diário':'📆 Mensal'}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:'2rem',gap:'0.75rem',color:'var(--texto-desab)'}}>
            <Loader2 size={18} style={{animation:'spin 1s linear infinite'}}/> Carregando...
          </div>
        ) : fechado ? (
          <div style={{textAlign:'center',padding:'3rem',color:'var(--verde)'}}>
            <p style={{fontSize:'3rem',marginBottom:'0.5rem'}}>✅</p>
            <p style={{fontWeight:900,fontSize:'1.25rem'}}>Caixa fechado com sucesso!</p>
            <p style={{color:'var(--texto-desab)',marginTop:'0.25rem'}}>Período: {labelPeriodo}</p>
            <div style={{display:'flex',gap:'0.5rem',justifyContent:'center',marginTop:'1rem'}}>
              <button onClick={()=>setFechado(false)} className="btn btn-secondary">← Voltar</button>
              <Link href="/dashboard" className="btn btn-primary">Ir ao Dashboard</Link>
            </div>
          </div>
        ) : (
          <>
            {/* Entradas por forma */}
            <div className="card" style={{padding:0,overflow:'hidden'}}>
              <div className="sec-header"><span>💰 Entradas — {labelPeriodo}</span></div>
              <div style={{padding:'0.875rem',display:'flex',flexDirection:'column',gap:'0.375rem'}}>
                {Object.entries(porForma).length===0 && totalFiadoEmitido === 0 ? (
                  <p style={{color:'var(--texto-desab)',fontSize:'0.85rem'}}>Nenhuma venda no período</p>
                ) : Object.entries(porForma).map(([forma,val])=>(
                  <div key={forma} style={{display:'flex',justifyContent:'space-between',padding:'0.375rem 0',borderBottom:'1px solid var(--borda-leve)'}}>
                    <span>{forma}</span>
                    <span style={{fontWeight:800,fontFamily:'monospace',color:'var(--verde)'}}>{formatCurrency(val)}</span>
                  </div>
                ))}
                {/* Fiados emitidos: informativo, NÃO entra no saldo */}
                {totalFiadoEmitido > 0 && (
                  <div style={{display:'flex',justifyContent:'space-between',padding:'0.375rem 0',borderBottom:'1px solid var(--borda-leve)',opacity:0.65}}>
                    <span style={{display:'flex',alignItems:'center',gap:'0.35rem',fontSize:'0.82rem',color:'var(--texto-sec)'}}>
                      📒 Fiados Emitidos
                      <span style={{fontSize:'0.65rem',background:'var(--surface-alt)',border:'1px solid var(--borda)',padding:'0 4px',borderRadius:'3px',color:'var(--texto-desab)'}}>não entra no caixa</span>
                    </span>
                    <span style={{fontWeight:700,fontFamily:'monospace',color:'var(--texto-desab)',textDecoration:'line-through'}}>{formatCurrency(totalFiadoEmitido)}</span>
                  </div>
                )}
                <div style={{display:'flex',justifyContent:'space-between',padding:'0.5rem 0',borderTop:'2px solid var(--borda)',marginTop:'0.25rem'}}>
                  <span style={{fontWeight:800}}>Total Entradas</span>
                  <span style={{fontWeight:900,fontFamily:'monospace',fontSize:'1.1rem',color:'var(--verde)'}}>{formatCurrency(totalReceita)}</span>
                </div>
              </div>
            </div>

            {/* Saídas */}
            <div className="card" style={{padding:0,overflow:'hidden'}}>
              <div className="sec-header"><span>💸 Saídas (Despesas)</span></div>
              <div style={{padding:'0.875rem',display:'flex',flexDirection:'column',gap:'0.375rem'}}>
                {despesas.length === 0 && saidasManuais === 0 ? (
                  <p style={{color:'var(--texto-desab)',fontSize:'0.85rem'}}>Nenhuma despesa no período</p>
                ) : (
                  <>
                    {despesas.map((d,i)=>(
                      <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'0.375rem 0',borderBottom:'1px solid var(--borda-leve)'}}>
                        <span style={{fontSize:'0.85rem'}}>{d.descricao}{d.categoria&&<span style={{color:'var(--texto-desab)',fontSize:'0.75rem'}}> · {d.categoria}</span>}</span>
                        <span style={{fontWeight:700,fontFamily:'monospace',color:'var(--vermelho)'}}>{formatCurrency(d.valor)}</span>
                      </div>
                    ))}
                    {fechManuais.filter(f => f.tipo === 'saida').map((f,i)=>(
                      <div key={`sm-${i}`} style={{display:'flex',justifyContent:'space-between',padding:'0.375rem 0',borderBottom:'1px solid var(--borda-leve)'}}>
                        <span style={{fontSize:'0.85rem'}}>{f.descricao} <span style={{color:'var(--texto-desab)',fontSize:'0.75rem'}}>· Ajuste Manual</span></span>
                        <span style={{fontWeight:700,fontFamily:'monospace',color:'var(--vermelho)'}}>{formatCurrency(f.valor)}</span>
                      </div>
                    ))}
                  </>
                )}
                <div style={{display:'flex',justifyContent:'space-between',padding:'0.5rem 0',borderTop:'2px solid var(--borda)',marginTop:'0.25rem'}}>
                  <span style={{fontWeight:800}}>Total Saídas</span>
                  <span style={{fontWeight:900,fontFamily:'monospace',fontSize:'1.1rem',color:'var(--vermelho)'}}>{formatCurrency(totalDesp)}</span>
                </div>
              </div>
            </div>

            {/* Conferência */}
            <div className="card" style={{padding:0,overflow:'hidden'}}>
              <div className="sec-header"><span>🧮 Conferência do Caixa</span></div>
              <div style={{padding:'0.875rem',display:'flex',flexDirection:'column',gap:'0.75rem'}}>
                <div style={{display:'flex',justifyContent:'space-between',padding:'0.375rem 0'}}>
                  <span style={{fontWeight:600}}>Saldo esperado</span>
                  <span style={{fontWeight:900,fontFamily:'monospace',color:saldoEsperado>=0?'var(--verde)':'var(--vermelho)'}}>{formatCurrency(saldoEsperado)}</span>
                </div>
                <div>
                  <label className="campo-label">Saldo físico em caixa (R$)</label>
                  <div style={{position:'relative',marginTop:'0.375rem'}}>
                    <span style={{position:'absolute',left:'0.625rem',top:'50%',transform:'translateY(-50%)',fontWeight:700,color:'var(--texto-desab)'}}>R$</span>
                    <input className="campo" type="number" step="0.01" min="0" style={{paddingLeft:'2rem',fontFamily:'monospace'}}
                      placeholder="0,00" value={saldoFisico} onChange={e=>setSaldoFisico(e.target.value)}/>
                  </div>
                </div>
                {saldoFisico && (
                  <div style={{display:'flex',justifyContent:'space-between',padding:'0.625rem',background:Math.abs(diferenca)<0.01?'var(--verde-claro)':diferenca>0?'#dbeafe':'#fee2e2',borderRadius:'var(--radius-sm)'}}>
                    <span style={{fontWeight:700}}>Diferença</span>
                    <span style={{fontWeight:900,fontFamily:'monospace',color:Math.abs(diferenca)<0.01?'var(--verde)':diferenca>0?'var(--azul)':'var(--vermelho)'}}>
                      {diferenca>=0?'+':''}{formatCurrency(diferenca)}
                      {Math.abs(diferenca)<0.01?' ✓ Conferido':diferenca>0?' ↑ Sobra':' ↓ Falta'}
                    </span>
                  </div>
                )}
                <button onClick={()=>setFechado(true)} className="btn btn-primary" style={{marginTop:'0.25rem'}}>
                  🔒 Confirmar Fechamento
                </button>
              </div>
            </div>
          </>
        )}

      </ProOnly>
      </div>
    </AdminOnly>
  )
}
