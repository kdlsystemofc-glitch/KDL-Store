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

type Venda    = { id:string; numero:number; cliente_nome:string|null; forma_pagamento:string; subtotal:number; desconto:number; total:number; status:string; criado_em:string; motivo_cancelamento?:string; registrado_nome?:string|null; cliente_id?:string|null; obs?:string|null }
type Item     = { id:string; produto_id:string; produto_nome:string; quantidade:number; preco_unitario:number; brinde:boolean; num_serie:string|null }
type Fornecedor = { id:string; nome:string; telefone:string|null }
type EmpresaInfo = { nome:string; cnpj:string|null; whatsapp:string|null; telefone:string|null; email:string|null; endereco:string|null; cidade:string|null; estado:string|null; logo_url:string|null }

const FORMA_ICON: Record<string,string> = { PIX:'📱', Dinheiro:'💵', Crédito:'💳', Débito:'💴', Fiado:'📒' }

function formatarEndereco(enderecoStr: string | null): string {
  if (!enderecoStr) return '—'
  if (enderecoStr.trim().startsWith('{')) {
    try {
      const obj = JSON.parse(enderecoStr)
      const partes = [
        obj.rua && `${obj.rua}${obj.numero ? `, ${obj.numero}` : ''}`,
        obj.complemento,
        obj.bairro,
        obj.cidade && `${obj.cidade}${obj.estado ? ` - ${obj.estado}` : ''}`,
        obj.cep && `CEP ${obj.cep}`
      ].filter(Boolean)
      return partes.join(', ')
    } catch (e) {
      return enderecoStr
    }
  }
  return enderecoStr
}

export default function VendaReciboPage() {
  const { id }          = useParams() as { id: string }
  const { empresaId }   = useEmpresaId()
  const [venda,  setVenda]  = useState<Venda|null>(null)
  const [itens,  setItens]  = useState<Item[]>([])
  const [loading,setLoading]= useState(true)
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [empresa, setEmpresa] = useState<EmpresaInfo|null>(null)
  const [qrSrc, setQrSrc] = useState('')
  const [clienteInfo, setClienteInfo] = useState<{ nome:string; telefone:string|null; email:string|null; cpf:string|null; endereco:string|null }|null>(null)
  const [garantias, setGarantias] = useState<{ id:string; produto_nome:string; num_serie:string|null; data_vencimento:string; status:string }[]>([])

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
      if (v) {
        if (v.cliente_id) {
          const { data: cli } = await supabase.from('clientes').select('nome,telefone,email,cpf,endereco').eq('id', v.cliente_id).single()
          if (cli) setClienteInfo(cli)
        }
        if (v.empresa_id) {
          const { data: emp } = await supabase.from('empresas').select('nome,cnpj,whatsapp,telefone,email,endereco,cidade,estado,logo_url').eq('id', v.empresa_id).single()
          if (emp) {
            setNomeEmpresa(emp.nome || '')
            setEmpresa(emp as EmpresaInfo)
          }
          const url = typeof window !== 'undefined' ? `${window.location.origin}/recibo/${id}` : ''
          setQrSrc(`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(url)}&color=14532d&bgcolor=ffffff`)
        }
        // Buscar garantias vinculadas a esta venda
        const { data: gars } = await supabase.from('garantias').select('id,produto_nome,num_serie,data_vencimento,status').eq('venda_id', v.id)
        setGarantias(gars || [])
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


      {/* ══════════════════════════════════════════════
          RECIBO PREMIUM REDESENHADO
      ══════════════════════════════════════════════ */}
      <div id="recibo-print" style={{
        background: '#fff', color: '#1a1a1a',
        fontFamily: "'Inter','Segoe UI',sans-serif",
        border: '1px solid #e5e7eb', borderRadius: '8px',
        overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
        maxWidth: '680px',
        width: '100%',
      }}>

        {/* ── Cabeçalho Principal ── */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          padding: '1.5rem 2rem', position: 'relative',
          color: '#fff',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {empresa?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={empresa.logo_url} alt="Logo" style={{ maxHeight: '60px', maxWidth: '160px', borderRadius: '4px', objectFit: 'contain', background: '#fff', padding: '4px' }} />
              ) : (
                <div style={{ background: 'var(--verde)', color: '#000', width: '45px', height: '45px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.4rem' }}>
                  {(nomeEmpresa || 'N')[0].toUpperCase()}
                </div>
              )}
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', margin: 0, color: '#fff' }}>
                  {nomeEmpresa || 'Minha Loja'}
                </h2>
                {empresa?.cnpj && (
                  <p style={{ color: 'var(--verde)', fontSize: '0.72rem', margin: '3px 0 0', fontFamily: 'monospace', letterSpacing: '0.02em', fontWeight: 700 }}>
                    CNPJ: {empresa.cnpj}
                  </p>
                )}
                {(empresa?.endereco || empresa?.cidade) && (
                  <p style={{ color: '#94a3b8', fontSize: '0.7rem', margin: '2px 0 0' }}>
                    {[empresa.endereco, empresa.cidade, empresa.estado].filter(Boolean).join(', ')}
                  </p>
                )}
                {(empresa?.whatsapp || empresa?.telefone || empresa?.email) && (
                  <p style={{ color: '#94a3b8', fontSize: '0.7rem', margin: '2px 0 0' }}>
                    {empresa.whatsapp ? `Zap: ${empresa.whatsapp}` : empresa.telefone ? `Tel: ${empresa.telefone}` : ''}
                    {empresa.email ? `  ·  ${empresa.email}` : ''}
                  </p>
                )}
              </div>
            </div>

            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '6px', padding: '0.625rem 1rem', display: 'inline-block'
              }}>
                <p style={{ color: 'var(--verde)', fontSize: '0.58rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>COMPROVANTE DE VENDA</p>
                <p style={{ color: '#fff', fontWeight: 900, fontSize: '1.4rem', fontFamily: 'monospace', margin: '2px 0 0', letterSpacing: '0.04em' }}>
                  #{String(venda.numero).padStart(4, '0')}
                </p>
                <p style={{ color: '#94a3b8', fontSize: '0.65rem', margin: '2px 0 0' }}>
                  {new Date(venda.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Barra de status ── */}
        <div style={{
          background: venda.status === 'concluida' ? '#f0fdf4' : '#fef2f2',
          borderBottom: '1px solid',
          borderColor: venda.status === 'concluida' ? '#dcfce7' : '#fee2e2',
          padding: '0.625rem 2rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: '0.75rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: venda.status === 'concluida' ? '#22c55e' : '#ef4444', display: 'inline-block' }} />
            <strong style={{ color: venda.status === 'concluida' ? '#15803d' : '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {venda.status === 'concluida' ? 'Transação Concluída' : 'Transação Cancelada'}
            </strong>
          </div>
          <span style={{ color: '#64748b', fontWeight: 500 }}>
            Operador: {venda.registrado_nome || 'Sistema'}
          </span>
        </div>

        {/* ── Informações da Transação (Cliente & Pagamento) ── */}
        <div style={{ padding: '1.5rem 2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h3 style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.5rem' }}>Cliente</h3>
            {clienteInfo ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <p style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', margin: 0 }}>{clienteInfo.nome}</p>
                {clienteInfo.cpf && <p style={{ fontSize: '0.75rem', color: '#475569', margin: 0 }}>CPF/CNPJ: <span style={{ fontFamily: 'monospace' }}>{clienteInfo.cpf}</span></p>}
                {clienteInfo.telefone && <p style={{ fontSize: '0.75rem', color: '#475569', margin: 0 }}>WhatsApp: {clienteInfo.telefone}</p>}
                {clienteInfo.endereco && <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0 }}>Endereço: {formatarEndereco(clienteInfo.endereco)}</p>}
              </div>
            ) : (
              <div>
                <p style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', margin: 0 }}>{venda.cliente_nome || 'Consumidor Final'}</p>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '2px 0 0', fontStyle: 'italic' }}>Nenhum dado cadastrado</p>
              </div>
            )}
          </div>
          <div>
            <h3 style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.5rem' }}>Pagamento</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <p style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', margin: 0 }}>
                {FORMA_ICON[venda.forma_pagamento.split(' ')[0]] || '💳'} {venda.forma_pagamento}
              </p>
              <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0 }}>
                Status: <span style={{ color: '#15803d', fontWeight: 700 }}>PAGO</span>
              </p>
              {venda.obs && (
                <p style={{ fontSize: '0.68rem', background: '#f8fafc', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', color: '#475569', margin: '4px 0 0', fontStyle: 'italic' }}>
                  {venda.obs}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Itens da Venda ── */}
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.75rem' }}>Especificação dos Itens</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: '0 0 0.5rem', fontWeight: 700, color: '#475569', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descrição do Item</th>
                <th style={{ textAlign: 'center', padding: '0 0 0.5rem', fontWeight: 700, color: '#475569', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', width: '60px' }}>Qtd</th>
                <th style={{ textAlign: 'right', padding: '0 0 0.5rem', fontWeight: 700, color: '#475569', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', width: '100px' }}>Unitário</th>
                <th style={{ textAlign: 'right', padding: '0 0 0.5rem', fontWeight: 700, color: '#475569', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', width: '100px' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item, idx) => (
                <tr key={item.id} style={{ borderBottom: idx < itens.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <td style={{ padding: '0.625rem 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <span style={{ fontWeight: 700, color: '#1e293b' }}>{item.produto_nome}</span>
                      {item.brinde && (
                        <span style={{ fontSize: '0.58rem', background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '3px', fontWeight: 900, letterSpacing: '0.04em' }}>BRINDE</span>
                      )}
                    </div>
                    {item.num_serie && (
                      <p style={{ fontSize: '0.65rem', color: '#64748b', margin: '3px 0 0', fontFamily: 'monospace' }}>S/N: {item.num_serie}</p>
                    )}
                  </td>
                  <td style={{ textAlign: 'center', padding: '0.625rem 0', color: '#0f172a', fontWeight: 700 }}>{item.quantidade}</td>
                  <td style={{ textAlign: 'right', padding: '0.625rem 0', fontFamily: 'monospace', color: '#334155' }}>
                    {item.brinde ? 'R$ 0,00' : formatCurrency(item.preco_unitario)}
                  </td>
                  <td style={{ textAlign: 'right', padding: '0.625rem 0', fontFamily: 'monospace', fontWeight: 800, color: item.brinde ? '#16a34a' : '#0f172a' }}>
                    {item.brinde ? 'R$ 0,00' : formatCurrency(item.quantidade * item.preco_unitario)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Totais ── */}
        <div style={{ padding: '1.25rem 2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '3rem' }}>
            <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 500 }}>Subtotal dos itens</span>
            <span style={{ fontFamily: 'monospace', minWidth: '100px', textAlign: 'right', color: '#334155', fontSize: '0.82rem' }}>
              {formatCurrency(Number(venda.total) + Number(venda.desconto || 0))}
            </span>
          </div>
          {venda.desconto > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '3rem' }}>
              <span style={{ color: '#ef4444', fontSize: '0.78rem', fontWeight: 700 }}>Desconto aplicado</span>
              <span style={{ fontFamily: 'monospace', minWidth: '100px', textAlign: 'right', color: '#ef4444', fontWeight: 700, fontSize: '0.82rem' }}>
                − {formatCurrency(venda.desconto)}
              </span>
            </div>
          )}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: '3rem',
            borderTop: '1px solid #e2e8f0', paddingTop: '0.625rem', marginTop: '0.25rem',
          }}>
            <span style={{ fontWeight: 900, fontSize: '0.85rem', color: '#0f172a', letterSpacing: '0.04em' }}>TOTAL LIQUIDO PAGO</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1.4rem', color: '#16a34a', minWidth: '100px', textAlign: 'right', lineHeight: 1 }}>
              {formatCurrency(venda.total)}
            </span>
          </div>
        </div>

        {/* ── Certificado de Garantia dos Itens (Se houver) ── */}
        {garantias.length > 0 && (
          <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid #f1f5f9', background: 'rgba(0,191,165,0.02)' }}>
            <h3 style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--verde)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.625rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              🛡️ Certificado de Garantia dos Itens
            </h3>
            <div className="tabela-wrap">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(0,191,165,0.15)', color: '#475569' }}>
                    <th style={{ textAlign: 'left', paddingBottom: '4px', fontWeight: 700 }}>Produto</th>
                    <th style={{ textAlign: 'left', paddingBottom: '4px', fontWeight: 700, width: '140px' }}>Número de Série</th>
                    <th style={{ textAlign: 'center', paddingBottom: '4px', fontWeight: 700, width: '100px' }}>Vencimento</th>
                    <th style={{ textAlign: 'center', paddingBottom: '4px', fontWeight: 700, width: '80px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {garantias.map(g => (
                    <tr key={g.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px 0', color: '#1e293b', fontWeight: 600 }}>{g.produto_nome}</td>
                      <td style={{ padding: '6px 0', fontFamily: 'monospace', color: '#334155' }}>{g.num_serie || '—'}</td>
                      <td style={{ padding: '6px 0', textAlign: 'center', fontWeight: 700, color: 'var(--verde)' }}>
                        {new Date(g.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td style={{ padding: '6px 0', textAlign: 'center' }}>
                        <span style={{
                          fontSize: '0.58rem',
                          background: g.status === 'ativa' ? 'rgba(0,191,165,0.1)' : 'rgba(239,68,68,0.1)',
                          color: g.status === 'ativa' ? 'var(--verde)' : '#dc2626',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                        }}>
                          {g.status === 'ativa' ? 'Ativa' : g.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Assinaturas & Termo Legal ── */}
        <div style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', borderBottom: '1px solid #f1f5f9' }}>
          {/* Assinatura */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginTop: '0.5rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderBottom: '1px solid #cbd5e1', height: '30px', marginBottom: '4px' }} />
              <p style={{ fontSize: '0.62rem', color: '#64748b', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Responsável Comercial</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderBottom: '1px solid #cbd5e1', height: '30px', marginBottom: '4px' }} />
              <p style={{ fontSize: '0.62rem', color: '#64748b', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Assinatura do Cliente</p>
            </div>
          </div>

          {/* Termo de Garantia CDC */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.75rem 1rem' }}>
            <p style={{ fontSize: '0.65rem', color: '#475569', margin: 0, lineHeight: 1.6 }}>
              <strong style={{ color: '#0f172a' }}>Termo de Garantia Simplificado (Art. 26 do CDC - Lei 8.078/90):</strong>
              <br />
              Conforme a legislação brasileira, é assegurada a garantia legal de <strong>30 dias</strong> para produtos não duráveis e <strong>90 dias</strong> para produtos duráveis. Eventuais garantias contratuais adicionais concedidas pelo fabricante ou estabelecimento estão discriminadas por item no corpo deste recibo. Para acionamento, é obrigatória a apresentação deste documento contendo o número de série correspondente.
            </p>
          </div>
        </div>

        {/* ── Rodapé com QR Code ── */}
        <div style={{ background: '#f8fafc', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.7rem', color: '#475569', margin: 0, fontWeight: 700 }}>Obrigado pela preferência!</p>
            <p style={{ fontSize: '0.62rem', color: '#64748b', margin: '2px 0 0' }}>Volte sempre e confira as novidades em nosso catálogo.</p>
            <p style={{ fontSize: '0.55rem', color: '#94a3b8', margin: '4px 0 0', fontWeight: 600 }}>Nexocommerce — Desenvolvido por KDL Store</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.55rem', color: '#94a3b8', margin: 0, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>DOCUMENTO DIGITAL</p>
              <p style={{ fontSize: '0.62rem', color: '#64748b', margin: '1px 0 0' }}>Acesse pelo QR Code</p>
            </div>
            {qrSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrSrc} alt="QR Code" width={56} height={56} style={{ border: '1px solid #cbd5e1', borderRadius: '4px', background: '#fff', padding: '2px' }} />
            ) : (
              <div style={{ width: 56, height: 56, border: '1px solid #cbd5e1', borderRadius: '4px', background: '#f1f5f9' }} />
            )}
          </div>
        </div>

      </div>

      <div style={{display:'flex',gap:'0.5rem',justifyContent:'center'}} className="no-print">
        <Link href="/vendas" className="btn btn-ghost">← Voltar</Link>
        <button onClick={() => window.print()} className="btn btn-secondary" style={{display:'flex',alignItems:'center',gap:'0.375rem'}}>
          <Printer size={14}/> Imprimir Recibo
        </button>
        <Link href="/vendas/nova" className="btn btn-primary">+ Nova Venda</Link>
      </div>

      <style>{`
        @media print {
          .no-print, header, aside, button, nav, footer { display: none !important; }
          body {
            background: white !important;
            color: #000 !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #recibo-print {
            box-shadow: none !important;
            border: 1px solid #000 !important;
            max-width: 100% !important;
            width: 100% !important;
            border-radius: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            color: #000 !important;
          }
          /* Ensure header remains dark and text remains white during print */
          #recibo-print > div:first-child {
            background: #0f172a !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #recibo-print > div:first-child * {
            color: #ffffff !important;
          }
          #recibo-print > div:nth-child(2) {
            background: #f0fdf4 !important;
            color: #15803d !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page { margin: 1cm; size: A4; }
        }
      `}</style>
    </div>
  )
}
