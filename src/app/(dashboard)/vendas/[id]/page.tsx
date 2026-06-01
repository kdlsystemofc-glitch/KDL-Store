'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { formatCurrency } from '@/lib/utils'
import { ArrowLeft, Printer, X, Loader2, Package, Wrench } from 'lucide-react'
import { AdminOnly } from '@/components/AdminOnly'
import { OperadorOnly } from '@/components/OperadorOnly'

type Venda    = { id:string; numero:number; cliente_nome:string|null; forma_pagamento:string; subtotal:number; desconto:number; total:number; status:string; criado_em:string; motivo_cancelamento?:string; registrado_nome?:string|null; cliente_id?:string|null }
type Item     = { id:string; produto_id:string; produto_nome:string; quantidade:number; preco_unitario:number; brinde:boolean; num_serie:string|null }
type Fornecedor = { id:string; nome:string; telefone:string|null }

const FORMA_ICON: Record<string,string> = { PIX:'📱', Dinheiro:'💵', Crédito:'💳', Débito:'💴', Fiado:'📒' }

export default function VendaReciboPage() {
  const { id }          = useParams() as { id: string }
  const { empresaId }   = useEmpresaId()
  const [venda,  setVenda]  = useState<Venda|null>(null)
  const [itens,  setItens]  = useState<Item[]>([])
  const [loading,setLoading]= useState(true)
  const [nomeEmpresa, setNomeEmpresa] = useState('')

  // Modal Acionar Fornecedor
  const [showForn,    setShowForn]    = useState(false)
  const [fornecedores,setFornecedores]= useState<Fornecedor[]>([])
  const [fornSel,     setFornSel]     = useState('')
  const [fornItem,    setFornItem]    = useState('')
  const [salvandoForn,setSalvandoForn]= useState(false)
  const [fornCusto,   setFornCusto]   = useState('')
  const [fornQty,     setFornQty]     = useState('1')
  const [fornGarantia,setFornGarantia]= useState(false)

  // Modal Abrir OS
  const [showOS,    setShowOS]    = useState(false)
  const [osEquip,   setOsEquip]   = useState('')
  const [osDefeito, setOsDefeito] = useState('')
  const [osTecnico, setOsTecnico] = useState('')
  const [osObs,     setOsObs]     = useState('')
  const [salvandoOS,setSalvandoOS]= useState(false)
  const [osSucesso, setOsSucesso] = useState<string|null>(null)
  const [osClienteTel,  setOsClienteTel]  = useState('')
  const [osOrcamento,   setOsOrcamento]   = useState('')
  const [osValorServico,setOsValorServico]= useState('')
  const [osValorPecas,  setOsValorPecas]  = useState('')
  const [osGarantia,    setOsGarantia]    = useState(false)

  // Modal Cancelar Venda
  const [showCanc,    setShowCanc]    = useState(false)
  const [cancMotivo,  setCancMotivo]  = useState('')
  const [salvandoCanc,setSalvandoCanc]= useState(false)

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    Promise.all([
      supabase.from('vendas').select('*').eq('id', id).single(),
      supabase.from('itens_venda').select('id,produto_id,produto_nome,quantidade,preco_unitario,brinde,num_serie').eq('venda_id', id),
    ]).then(async ([{ data: v }, { data: i }]) => {
      setVenda(v)
      setItens(i || [])
      if (v?.empresa_id) {
        const { data: emp } = await supabase.from('empresas').select('nome').eq('id', v.empresa_id).single()
        if (emp?.nome) setNomeEmpresa(emp.nome)
      }
      setLoading(false)
    })
  }, [id])

  useEffect(() => {
    if (showOS && venda?.cliente_id) {
      createClient().from('clientes').select('telefone').eq('id', venda.cliente_id).single()
        .then(({ data }) => {
          if (data?.telefone) setOsClienteTel(data.telefone)
        })
    }
  }, [showOS, venda])

  async function abrirModalForn() {
    setShowForn(true)
    if (!empresaId || fornecedores.length > 0) return
    const { data } = await createClient().from('fornecedores').select('id,nome,telefone').eq('empresa_id', empresaId).eq('ativo', true).order('nome')
    setFornecedores(data || [])
  }

  async function acionarFornecedor() {
    if (!venda || !fornSel || !fornItem.trim() || !empresaId) return
    setSalvandoForn(true)
    const forn = fornecedores.find(f => f.id === fornSel)

    const finalCusto = fornGarantia ? 0 : (parseFloat(fornCusto) || 0)
    const finalQty = parseFloat(fornQty) || 1

    // Salva pedido vinculado à venda
    await createClient().from('pedidos_fornecedor').insert({
      empresa_id:    empresaId,
      fornecedor_id: fornSel,
      produto:       fornItem.trim(),
      quantidade:    finalQty,
      status:        'aguardando',
      venda_id:      venda.id,
      total:         finalCusto,
      obs:           `Venda #${String(venda.numero).padStart(4,'0')} — ${venda.cliente_nome || 'Anônimo'}${fornGarantia ? ' [GARANTIA]' : ''}`,
    })

    // Abre WhatsApp com contexto completo
    if (forn?.telefone) {
      const produtosList = itens.filter(i => !i.brinde).map(i => `• ${i.produto_nome} (${i.quantidade}x)`).join('\n')
      const msg = encodeURIComponent(
        `Olá ${forn.nome}! 👋\n\n` +
        `Preciso de um item com urgência para complementar uma venda que acabei de fechar:\n\n` +
        `📦 *Item necessário:* ${fornItem.trim()}\n` +
        `🔢 *Quantidade:* ${finalQty}\n` +
        `💵 *Custo combinado:* ${fornGarantia ? 'Em garantia / Sem custo' : formatCurrency(finalCusto)}\n\n` +
        `🧾 *Contexto da venda:*\n` +
        `• Venda #${String(venda.numero).padStart(4,'0')}\n` +
        `• Cliente: ${venda.cliente_nome || 'Anônimo'}\n` +
        `• Produtos vendidos:\n${produtosList}\n\n` +
        `Por favor confirmar disponibilidade e prazo! 🙏`
      )
      window.open(`https://wa.me/55${forn.telefone.replace(/\D/g, '')}?text=${msg}`, '_blank')
    }

    setSalvandoForn(false)
    setShowForn(false)
    setFornItem('')
    setFornSel('')
    setFornCusto('')
    setFornQty('1')
    setFornGarantia(false)
  }

  async function abrirOS() {
    if (!venda || !osEquip.trim() || !empresaId) return
    setSalvandoOS(true)
    const { data } = await createClient().from('ordens_servico').insert({
      empresa_id:       empresaId,
      cliente_nome:     venda.cliente_nome || 'Anônimo',
      cliente_tel:      osClienteTel.trim() || null,
      equipamento:      osEquip.trim(),
      defeito_relatado: osDefeito.trim() || null,
      tecnico:          osTecnico.trim() || null,
      observacoes:      osObs.trim() || null,
      venda_id:         venda.id,
      status:           'aguardando',
      orcamento:        osGarantia ? 0 : (parseFloat(osOrcamento) || null),
      valor_servico:    osGarantia ? 0 : (parseFloat(osValorServico) || 0),
      valor_pecas:      osGarantia ? 0 : (parseFloat(osValorPecas) || 0),
    }).select('id, numero').single()
    setSalvandoOS(false)
    if (data) {
      setOsSucesso(`OS #${String(data.numero).padStart(4,'0')} criada com sucesso! Vinculada à Venda #${String(venda.numero).padStart(4,'0')}.`)
      setShowOS(false)
      setOsEquip('')
      setOsDefeito('')
      setOsTecnico('')
      setOsObs('')
      setOsClienteTel('')
      setOsOrcamento('')
      setOsValorServico('')
      setOsValorPecas('')
      setOsGarantia(false)
    }
  }

  async function cancelarVenda() {
    if (!venda || !cancMotivo.trim() || !empresaId) return
    setSalvandoCanc(true)
    const supabase = createClient()
    
    // Atualiza status da venda
    await supabase.from('vendas').update({ status: 'cancelada', motivo_cancelamento: cancMotivo.trim() }).eq('id', venda.id)
    
    // Devolve o estoque de cada item (se não for brinde? Não, devolve tudo)
    // Para cada item da venda, somar de volta no qtd_atual do produto
    for (const item of itens) {
      if (!item.produto_id) continue
      // Pega o qtd_atual, e soma a quantidade
      const { data: p } = await supabase.from('produtos').select('qtd_atual').eq('id', item.produto_id).single()
      if (p) {
        const novaQtd = p.qtd_atual + item.quantidade
        await supabase.from('produtos').update({ qtd_atual: novaQtd }).eq('id', item.produto_id)
        // Registra a movimentação de estorno
        await supabase.from('estoque_movimentacoes').insert({
          empresa_id: empresaId, produto_id: item.produto_id,
          tipo: 'entrada', quantidade: item.quantidade, obs: `Estorno de venda cancelada #${venda.numero}`
        })
      }
    }
    
    // Cancela o fiado se houver
    if (venda.forma_pagamento === 'Fiado') {
      await supabase.from('fiados').update({ status: 'cancelado' }).eq('venda_id', venda.id)
    }
    
    setVenda({ ...venda, status: 'cancelada', motivo_cancelamento: cancMotivo.trim() })
    setSalvandoCanc(false)
    setShowCanc(false)
  }

  if (loading) return (
    <div style={{display:'flex',justifyContent:'center',padding:'3rem',color:'var(--texto-desab)'}}>Carregando recibo...</div>
  )
  if (!venda) return <div className="alerta alerta-perigo">Venda não encontrada.</div>

  return (
    <div className="anim-fade" style={{display:'flex',flexDirection:'column',gap:'0.875rem',maxWidth:'560px'}}>
      {venda.status === 'cancelada' && (
        <div className="alerta alerta-perigo" style={{ fontWeight:900, textAlign:'center', fontSize:'1.1rem', textTransform:'uppercase' }}>
          ● Venda Cancelada
          {venda.motivo_cancelamento && <div style={{ fontSize:'0.85rem', fontWeight:400, marginTop:'4px', textTransform:'none' }}>Motivo: {venda.motivo_cancelamento}</div>}
        </div>
      )}

      {/* Modal Cancelar Venda */}
      {showCanc && (
        <div style={{position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}
          onClick={e=>{if(e.target===e.currentTarget)setShowCanc(false)}}>
          <div className="card anim-pop" style={{width:'100%',maxWidth:'400px',padding:0}}>
            <div style={{padding:'1.25rem',borderBottom:'1px solid var(--borda)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <p style={{fontWeight:900,fontSize:'1.1rem',color:'var(--vermelho)'}}>✕ Cancelar Venda</p>
              </div>
              <button onClick={()=>setShowCanc(false)} className="btn-icon"><X size={18}/></button>
            </div>
            <div style={{padding:'1.25rem',display:'flex',flexDirection:'column',gap:'0.875rem'}}>
              <div className="alerta alerta-perigo" style={{fontSize:'0.82rem'}}>
                Atenção: Os produtos serão devolvidos ao estoque. Esta ação não pode ser desfeita.
              </div>
              <div>
                <label className="campo-label">Motivo do cancelamento *</label>
                <textarea className="campo" rows={3} style={{marginTop:'0.375rem',resize:'none'}} value={cancMotivo} onChange={e=>setCancMotivo(e.target.value)} placeholder="Ex: Cliente desistiu..."/>
              </div>
              <div style={{display:'flex',gap:'0.5rem',justifyContent:'flex-end'}}>
                <button onClick={()=>setShowCanc(false)} className="btn btn-ghost">Voltar</button>
                <button onClick={cancelarVenda} disabled={!cancMotivo.trim()||salvandoCanc} className="btn btn-primary"
                  style={{display:'flex',alignItems:'center',gap:'0.375rem',background:'var(--vermelho)',borderColor:'var(--vermelho)'}}>
                  {salvandoCanc?<Loader2 size={14} style={{animation:'spin 1s linear infinite'}}/>:<X size={14}/>}
                  Confirmar Cancelamento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Acionar Fornecedor */}
      {showForn && (
        <div style={{position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}
          onClick={e=>{if(e.target===e.currentTarget)setShowForn(false)}}>
          <div className="card anim-pop" style={{width:'100%',maxWidth:'460px',padding:0}}>
            <div style={{padding:'1.25rem',borderBottom:'1px solid var(--borda)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <p style={{fontWeight:900,fontSize:'1.1rem'}}>📦 Acionar Fornecedor</p>
                <p style={{fontSize:'0.82rem',color:'var(--texto-desab)'}}>Venda #{String(venda.numero).padStart(4,'0')} · {venda.cliente_nome || 'Anônimo'}</p>
              </div>
              <button onClick={()=>setShowForn(false)} className="btn-icon"><X size={18}/></button>
            </div>
            <div style={{padding:'1.25rem',display:'flex',flexDirection:'column',gap:'0.875rem'}}>
              <div>
                <label className="campo-label">Fornecedor *</label>
                <select className="campo" style={{marginTop:'0.375rem'}} value={fornSel} onChange={e=>setFornSel(e.target.value)}>
                  <option value="">— Selecionar fornecedor —</option>
                  {fornecedores.map(f=><option key={f.id} value={f.id}>{f.nome}{f.telefone?` · ${f.telefone}`:''}</option>)}
                </select>
                {fornecedores.length === 0 && <p style={{fontSize:'0.75rem',color:'var(--texto-desab)',marginTop:'4px'}}>Nenhum fornecedor ativo cadastrado.</p>}
              </div>
              <div>
                <label className="campo-label">Item necessário *</label>
                <input className="campo" style={{marginTop:'0.375rem'}} value={fornItem} onChange={e=>setFornItem(e.target.value)}
                  placeholder="Ex: Moldura para Palio 2010 preta"/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.625rem'}}>
                <div>
                  <label className="campo-label">Quantidade</label>
                  <input className="campo" type="number" style={{marginTop:'0.375rem'}} value={fornQty} onChange={e=>setFornQty(e.target.value)}/>
                </div>
                <div>
                  <label className="campo-label">Custo Estimado (R$)</label>
                  <input className="campo" type="number" step="0.01" style={{marginTop:'0.375rem'}} value={fornCusto} onChange={e=>setFornCusto(e.target.value)} placeholder="0,00" disabled={fornGarantia}/>
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginTop:'0.25rem'}}>
                <input type="checkbox" id="fornGarantia" checked={fornGarantia} onChange={e=>setFornGarantia(e.target.checked)}/>
                <label htmlFor="fornGarantia" style={{fontWeight:600,cursor:'pointer'}}>Acionado em garantia (Custo zero)</label>
              </div>
              <div className="alerta alerta-info" style={{fontSize:'0.78rem'}}>
                💬 Será aberto o WhatsApp do fornecedor com a mensagem já preenchida, incluindo o custo e o contexto da venda.
              </div>
              <div style={{display:'flex',gap:'0.5rem',justifyContent:'flex-end'}}>
                <button onClick={()=>setShowForn(false)} className="btn btn-ghost">Cancelar</button>
                <button onClick={acionarFornecedor} disabled={!fornSel||!fornItem.trim()||salvandoForn} className="btn btn-primary"
                  style={{display:'flex',alignItems:'center',gap:'0.375rem'}}>
                  {salvandoForn?<Loader2 size={14} style={{animation:'spin 1s linear infinite'}}/>:<Package size={14}/>}
                  Acionar via WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Abrir OS */}
      {showOS && (
        <div style={{position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}
          onClick={e=>{if(e.target===e.currentTarget)setShowOS(false)}}>
          <div className="card anim-pop" style={{width:'100%',maxWidth:'540px',padding:0}}>
            <div style={{padding:'1.25rem',borderBottom:'1px solid var(--borda)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <p style={{fontWeight:900,fontSize:'1.1rem'}}>🔧 Abrir Ordem de Serviço</p>
                <p style={{fontSize:'0.82rem',color:'var(--texto-desab)'}}>Vinculada à Venda #{String(venda.numero).padStart(4,'0')}</p>
              </div>
              <button onClick={()=>setShowOS(false)} className="btn-icon"><X size={18}/></button>
            </div>
            <div style={{padding:'1.25rem',display:'flex',flexDirection:'column',gap:'0.75rem'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.625rem'}}>
                <div>
                  <label className="campo-label">Cliente</label>
                  <input className="campo" value={venda.cliente_nome||'Consumidor Final'} readOnly
                    style={{marginTop:'0.375rem',opacity:0.7,cursor:'not-allowed'}}/>
                </div>
                <div>
                  <label className="campo-label">WhatsApp de Contato</label>
                  <input className="campo" style={{marginTop:'0.375rem'}} value={osClienteTel} onChange={e=>setOsClienteTel(e.target.value)}
                    placeholder="(00) 00000-0000"/>
                </div>
              </div>
              <div>
                <label className="campo-label">Equipamento / Produto *</label>
                <input className="campo" style={{marginTop:'0.375rem'}} value={osEquip} onChange={e=>setOsEquip(e.target.value)}
                  placeholder={itens.filter(i=>!i.brinde)[0]?.produto_nome || 'Ex: Som JBL Stage 200'}/>
              </div>
              <div>
                <label className="campo-label">Defeito / Serviço Solicitado</label>
                <textarea className="campo" rows={2} style={{marginTop:'0.375rem',resize:'none'}} value={osDefeito} onChange={e=>setOsDefeito(e.target.value)}
                  placeholder="Ex: Instalação do equipamento no veículo"/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.625rem'}}>
                <div>
                  <label className="campo-label">Orçamento Total (R$)</label>
                  <input className="campo" type="number" step="0.01" style={{marginTop:'0.375rem'}} value={osOrcamento} onChange={e=>setOsOrcamento(e.target.value)} placeholder="0,00" disabled={osGarantia}/>
                </div>
                <div>
                  <label className="campo-label">Valor Serviço (R$)</label>
                  <input className="campo" type="number" step="0.01" style={{marginTop:'0.375rem'}} value={osValorServico} onChange={e=>setOsValorServico(e.target.value)} placeholder="0,00" disabled={osGarantia}/>
                </div>
                <div>
                  <label className="campo-label">Valor Peças (R$)</label>
                  <input className="campo" type="number" step="0.01" style={{marginTop:'0.375rem'}} value={osValorPecas} onChange={e=>setOsValorPecas(e.target.value)} placeholder="0,00" disabled={osGarantia}/>
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginTop:'0.25rem'}}>
                <input type="checkbox" id="osGarantia" checked={osGarantia} onChange={e=>setOsGarantia(e.target.checked)}/>
                <label htmlFor="osGarantia" style={{fontWeight:600,cursor:'pointer'}}>Serviço em Garantia (Sem custo)</label>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.625rem'}}>
                <div>
                  <label className="campo-label">Técnico responsável</label>
                  <input className="campo" style={{marginTop:'0.375rem'}} value={osTecnico} onChange={e=>setOsTecnico(e.target.value)} placeholder="Nome do técnico"/>
                </div>
                <div>
                  <label className="campo-label">Observações</label>
                  <input className="campo" style={{marginTop:'0.375rem'}} value={osObs} onChange={e=>setOsObs(e.target.value)} placeholder="Opcional"/>
                </div>
              </div>
              <div style={{display:'flex',gap:'0.5rem',justifyContent:'flex-end',marginTop:'0.25rem'}}>
                <button onClick={()=>setShowOS(false)} className="btn btn-ghost">Cancelar</button>
                <button onClick={abrirOS} disabled={!osEquip.trim()||salvandoOS} className="btn btn-primary"
                  style={{display:'flex',alignItems:'center',gap:'0.375rem'}}>
                  {salvandoOS?<Loader2 size={14} style={{animation:'spin 1s linear infinite'}}/>:<Wrench size={14}/>}
                  Criar OS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="pg-header no-print">
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

      {/* Sucesso OS */}
      {osSucesso && (
        <div className="alerta alerta-ok no-print" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span>✅ {osSucesso}</span>
          <Link href="/ordens-de-servico" style={{fontWeight:700,color:'var(--verde)',fontSize:'0.82rem'}}>Ver OS →</Link>
        </div>
      )}

      {/* Botões de ação pós-venda */}
      <OperadorOnly>
        <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}} className="no-print">
          <button onClick={abrirModalForn} disabled={venda.status === 'cancelada'} className="btn btn-secondary" style={{display:'flex',alignItems:'center',gap:'0.375rem',fontSize:'0.82rem'}}>
            <Package size={14}/> Acionar Fornecedor
          </button>
          <button onClick={()=>{setShowOS(true);setOsEquip(itens.filter(i=>!i.brinde)[0]?.produto_nome||'')}} disabled={venda.status === 'cancelada'} className="btn btn-secondary"
            style={{display:'flex',alignItems:'center',gap:'0.375rem',fontSize:'0.82rem'}}>
            <Wrench size={14}/> Abrir Ordem de Serviço
          </button>
          <AdminOnly>
            {venda.status === 'concluida' && (
              <button onClick={() => setShowCanc(true)} className="btn btn-secondary" style={{display:'flex',alignItems:'center',gap:'0.375rem',fontSize:'0.82rem',color:'var(--vermelho)'}}>
                <X size={14}/> Cancelar Venda
              </button>
            )}
          </AdminOnly>
        </div>
      </OperadorOnly>

      <div className="card printable-receipt-card" style={{padding:0,overflow:'hidden'}}>
        <div style={{padding:'1.25rem',textAlign:'center',borderBottom:'2px dashed var(--borda)'}}>
          <p style={{fontWeight:900,fontSize:'1.4rem',color:'var(--texto)',textTransform:'uppercase',letterSpacing:'0.04em'}}>{nomeEmpresa || 'Minha Loja'}</p>
          <p style={{color:'var(--texto-sec)',fontSize:'0.78rem',fontWeight:600,marginTop:'2px'}}>RECIBO DE VENDA · KDL STORE</p>
        </div>

        <div style={{padding:'1rem',display:'flex',flexDirection:'column',gap:'0.5rem',borderBottom:'1px solid var(--borda)'}}>
          <div style={{display:'flex',justifyContent: 'space-between'}}>
            <span style={{color:'var(--texto-sec)',fontSize:'0.82rem'}}>Cliente</span>
            <span style={{fontWeight:800}}>{venda.cliente_nome || 'Consumidor Final (Anônimo)'}</span>
          </div>
          <div style={{display:'flex',justifyContent: 'space-between'}}>
            <span style={{color:'var(--texto-sec)',fontSize:'0.82rem'}}>Operador</span>
            <span style={{fontWeight:700}}>{venda.registrado_nome || 'Operador Padrão'}</span>
          </div>
          <div style={{display:'flex',justifyContent: 'space-between'}}>
            <span style={{color:'var(--texto-sec)',fontSize:'0.82rem'}}>Pagamento</span>
            <span style={{fontWeight:700}}>{`${FORMA_ICON[venda.forma_pagamento]||''} ${venda.forma_pagamento}`}</span>
          </div>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <span style={{color:'var(--texto-sec)',fontSize:'0.82rem'}}>Status</span>
            <span className={venda.status==='concluida'?'status-ok':'status-neutro'} style={{fontSize:'0.82rem',fontWeight:700}}>
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
            <span style={{fontFamily:'monospace'}}>{formatCurrency(Number(venda.total) + Number(venda.desconto || 0))}</span>
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

      <div style={{display:'flex',gap:'0.5rem',justifyContent:'center'}} className="no-print">
        <Link href="/vendas" className="btn btn-ghost">← Voltar</Link>
        <Link href="/vendas/nova" className="btn btn-primary">+ Nova Venda</Link>
      </div>
    </div>
  )
}
