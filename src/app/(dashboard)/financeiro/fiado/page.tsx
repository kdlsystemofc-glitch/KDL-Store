'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { formatCurrency } from '@/lib/utils'
import { Loader2, X } from 'lucide-react'
import { PageTabs } from '@/components/PageTabs'
import { OperadorOnly } from '@/components/OperadorOnly'
import { ProOnly } from '@/components/ProOnly'
import toast from 'react-hot-toast'

type Fiado = { id:string; cliente_nome:string; cliente_tel:string|null; valor_aberto:number; criado_em:string; status:string; data_vencimento:string|null; pago_em:string|null; valor_original:number|null }
type FormaPag = { id: string; nome: string }

type PagtoItem = { forma: string; valor: string }

export default function FiadoPage() {
  const { empresaId } = useEmpresaId()
  const [fiados,  setFiados]  = useState<Fiado[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro,  setFiltro]  = useState<'todos'|'vencidos'|'hoje'|'avencer'|'historico'>('todos')

  // Modal amortização
  const [fiadoPagando, setFiadoPagando] = useState<Fiado | null>(null)
  const [formasPag,    setFormasPag]    = useState<FormaPag[]>([])
  const [pagamentos,   setPagamentos]   = useState<PagtoItem[]>([{ forma: '', valor: '' }])
  const [salvandoPag,  setSalvandoPag]  = useState(false)

  useEffect(() => { if (empresaId) { carregar(empresaId); carregarFormas(empresaId) } }, [empresaId])

  async function carregar(eid: string) {
    setLoading(true)
    const { data } = await createClient()
      .from('fiados')
      .select('id,cliente_nome,cliente_tel,valor_aberto,criado_em,status,data_vencimento,pago_em,valor_original')
      .eq('empresa_id', eid)
      .order('criado_em', { ascending: false })
    setFiados(data||[])
    setLoading(false)
  }

  async function carregarFormas(eid: string) {
    const { data } = await createClient()
      .from('formas_pagamento')
      .select('id,nome')
      .eq('empresa_id', eid)
      .eq('ativo', true)
    setFormasPag(data || [])
  }

  function abrirPagar(f: Fiado) {
    setFiadoPagando(f)
    setPagamentos([{ forma: formasPag[0]?.nome || '', valor: f.valor_aberto.toFixed(2) }])
  }

  function addPagamento() {
    setPagamentos(p => [...p, { forma: formasPag[0]?.nome || '', valor: '' }])
  }

  function removerPagamento(i: number) {
    setPagamentos(p => p.filter((_, idx) => idx !== i))
  }

  const totalPagamentos = pagamentos.reduce((s, p) => s + (parseFloat(p.valor) || 0), 0)

  async function confirmarPagamento() {
    if (!fiadoPagando || !empresaId) return
    if (totalPagamentos <= 0) { toast.error('Informe o valor do pagamento'); return }
    if (totalPagamentos > fiadoPagando.valor_aberto + 0.001) {
      toast.error(`Valor total (${formatCurrency(totalPagamentos)}) excede o saldo em aberto (${formatCurrency(fiadoPagando.valor_aberto)})`)
      return
    }

    setSalvandoPag(true)
    const supabase = createClient()
    const novoSaldo = fiadoPagando.valor_aberto - totalPagamentos
    const quitado = novoSaldo <= 0.009

    try {
      if (quitado) {
        await supabase.from('fiados').update({ status: 'pago', pago_em: new Date().toISOString(), valor_aberto: 0 }).eq('id', fiadoPagando.id)
      } else {
        await supabase.from('fiados').update({ valor_aberto: parseFloat(novoSaldo.toFixed(2)) }).eq('id', fiadoPagando.id)
      }

      // Registra no fechamento de caixa como entradas por forma de pagamento
      for (const pag of pagamentos) {
        if (!pag.valor || parseFloat(pag.valor) <= 0) continue
        await supabase.from('fechamentos_manuais').insert({
          empresa_id: empresaId,
          data: new Date().toISOString().slice(0, 10),
          descricao: `Recebimento fiado — ${fiadoPagando.cliente_nome}`,
          tipo: 'entrada',
          valor: parseFloat(pag.valor),
          forma_pagamento: pag.forma || 'Dinheiro',
        }).then(r => {
          if (r.error) console.warn('Aviso: fechamento_manual não salvo:', r.error.message)
        })
      }

      if (quitado) {
        setFiados(prev => prev.map(f => f.id === fiadoPagando.id ? { ...f, status: 'pago', valor_aberto: 0 } : f))
        toast.success(`✅ Fiado de ${fiadoPagando.cliente_nome} quitado!`)
      } else {
        setFiados(prev => prev.map(f => f.id === fiadoPagando.id ? { ...f, valor_aberto: parseFloat(novoSaldo.toFixed(2)) } : f))
        toast.success(`💰 Pagamento parcial registrado. Saldo restante: ${formatCurrency(novoSaldo)}`)
      }

      setFiadoPagando(null)
    } catch (e) {
      console.error(e)
      toast.error('Erro ao registrar pagamento')
    }
    setSalvandoPag(false)
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
    <div className="anim-fade" style={{display:'flex',flexDirection:'column',gap:'0.875rem'}}>

      {/* Modal de Amortização */}
      {fiadoPagando && (
        <div style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
          onClick={e => { if(e.target === e.currentTarget) setFiadoPagando(null) }}>
          <div className="card anim-pop" style={{ width:'100%', maxWidth:'420px', padding:'1.5rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
              <p style={{ fontWeight:900, fontSize:'1rem' }}>💰 Registrar Pagamento</p>
              <button onClick={() => setFiadoPagando(null)} className="btn-icon"><X size={16}/></button>
            </div>

            {/* Info do fiado */}
            <div style={{ marginBottom:'1rem', padding:'0.75rem', background:'var(--surface-2)', borderRadius:'0.5rem' }}>
              <p style={{ fontWeight:700, fontSize:'1rem' }}>{fiadoPagando.cliente_nome}</p>
              <p style={{ fontSize:'0.8rem', color:'var(--texto-desab)', marginTop:'0.25rem' }}>
                Saldo em aberto: <span style={{ fontWeight:900, color:'var(--vermelho)', fontFamily:'monospace' }}>{formatCurrency(fiadoPagando.valor_aberto)}</span>
              </p>
            </div>

            {/* Pagamentos parciais */}
            <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', marginBottom:'0.75rem' }}>
              <label className="campo-label">Formas de Pagamento</label>
              {pagamentos.map((pag, i) => (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:'0.375rem', alignItems:'center' }}>
                  <select
                    className="campo"
                    value={pag.forma}
                    onChange={e => setPagamentos(p => p.map((x, j) => j===i ? { ...x, forma: e.target.value } : x))}>
                    {formasPag.length === 0
                      ? <option value="Dinheiro">Dinheiro</option>
                      : formasPag.map(f => <option key={f.id} value={f.nome}>{f.nome}</option>)
                    }
                  </select>
                  <input
                    className="campo"
                    type="number" min="0.01" step="0.01"
                    placeholder="R$ 0,00"
                    value={pag.valor}
                    onChange={e => setPagamentos(p => p.map((x, j) => j===i ? { ...x, valor: e.target.value } : x))}
                  />
                  {pagamentos.length > 1 && (
                    <button onClick={() => removerPagamento(i)} className="btn-icon" style={{ color:'var(--vermelho)' }}><X size={14}/></button>
                  )}
                </div>
              ))}
              <button onClick={addPagamento} className="btn btn-secondary" style={{ fontSize:'0.75rem', alignSelf:'flex-start' }}>
                + Adicionar forma de pagamento
              </button>
            </div>

            {/* Totalizador */}
            <div style={{ padding:'0.75rem', background:'var(--surface-2)', borderRadius:'0.5rem', marginBottom:'1rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.85rem' }}>
                <span>Total pagando:</span>
                <span style={{ fontWeight:900, fontFamily:'monospace', color: totalPagamentos > fiadoPagando.valor_aberto + 0.001 ? 'var(--vermelho)' : 'var(--verde)' }}>
                  {formatCurrency(totalPagamentos)}
                </span>
              </div>
              {totalPagamentos < fiadoPagando.valor_aberto - 0.009 && totalPagamentos > 0 && (
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.8rem', marginTop:'0.25rem', color:'var(--texto-desab)' }}>
                  <span>Restará em aberto:</span>
                  <span style={{ fontFamily:'monospace', color:'var(--amarelo)' }}>{formatCurrency(fiadoPagando.valor_aberto - totalPagamentos)}</span>
                </div>
              )}
              {totalPagamentos >= fiadoPagando.valor_aberto - 0.009 && totalPagamentos > 0 && (
                <p style={{ fontSize:'0.78rem', color:'var(--verde)', marginTop:'0.25rem', fontWeight:700 }}>✅ Fiado será quitado!</p>
              )}
            </div>

            <div style={{ display:'flex', gap:'0.5rem', justifyContent:'flex-end' }}>
              <button onClick={() => setFiadoPagando(null)} className="btn btn-secondary">Cancelar</button>
              <button
                onClick={confirmarPagamento}
                disabled={salvandoPag || totalPagamentos <= 0 || totalPagamentos > fiadoPagando.valor_aberto + 0.001}
                className="btn btn-primary">
                {salvandoPag ? 'Salvando...' : '✓ Confirmar Pagamento'}
              </button>
            </div>
          </div>
        </div>
      )}

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

      <ProOnly>

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
            { v:'historico', l:'📜 HISTÓRICO' },
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
        ) : filtro === 'historico' ? (
          /* ── ABA HISTÓRICO DE FIADOS QUITADOS ─────────── */
          pagos.length === 0 ? (
            <div style={{textAlign:'center',padding:'3rem',color:'var(--texto-desab)'}}>
              <p style={{fontSize:'2rem',marginBottom:'0.5rem'}}>📜</p>
              <p style={{fontWeight:700}}>Nenhum fiado quitado ainda.</p>
            </div>
          ) : (
            <div className="tabela-wrap">
              <table className="tabela">
                <thead>
                  <tr style={{background:'#1e3a2e'}}>
                    <th>Cliente</th>
                    <th style={{textAlign:'right'}}>Valor Original</th>
                    <th style={{textAlign:'center'}}>Vencimento</th>
                    <th>Criado Em</th>
                    <th>Pago Em</th>
                    <th style={{textAlign:'center'}}>Dias p/ Pagar</th>
                  </tr>
                </thead>
                <tbody>
                  {[...pagos].sort((a,b) => {
                    if (!a.pago_em && !b.pago_em) return 0
                    if (!a.pago_em) return 1
                    if (!b.pago_em) return -1
                    return new Date(b.pago_em).getTime() - new Date(a.pago_em).getTime()
                  }).map(f => {
                    const diasParaPagar = f.pago_em
                      ? Math.max(0, Math.floor((new Date(f.pago_em).getTime() - new Date(f.criado_em).getTime()) / 86400000))
                      : null
                    return (
                      <tr key={f.id}>
                        <td style={{fontWeight:700}}>{f.cliente_nome}</td>
                        <td style={{textAlign:'right',fontWeight:700,fontFamily:'monospace',color:'var(--verde)'}}>
                          {f.valor_original ? formatCurrency(f.valor_original) : formatCurrency(f.valor_aberto)}
                        </td>
                        <td style={{textAlign:'center',fontSize:'0.78rem',color:'var(--texto-desab)'}}>
                          {f.data_vencimento ? new Date(f.data_vencimento+'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                        </td>
                        <td style={{fontSize:'0.78rem',color:'var(--texto-desab)'}}>{new Date(f.criado_em).toLocaleDateString('pt-BR')}</td>
                        <td style={{fontSize:'0.78rem',color:'var(--verde)',fontWeight:700}}>
                          {f.pago_em ? new Date(f.pago_em).toLocaleDateString('pt-BR') : '—'}
                        </td>
                        <td style={{textAlign:'center'}}>
                          {diasParaPagar !== null
                            ? <span style={{fontWeight:700,fontFamily:'monospace',fontSize:'0.85rem',color: diasParaPagar > 30 ? 'var(--vermelho)' : diasParaPagar > 7 ? 'var(--amarelo)' : 'var(--verde)'}}>{diasParaPagar}d</span>
                            : '—'
                          }
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
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
                            <button onClick={() => abrirPagar(f)}
                              className="btn btn-secondary" style={{fontSize:'0.72rem',padding:'0.2rem 0.5rem', fontWeight:700}}>
                              💰 Pagar
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

      </ProOnly>
    </div>
  )
}
