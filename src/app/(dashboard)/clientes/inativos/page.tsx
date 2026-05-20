'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { formatCurrency } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { PageTabs } from '@/components/PageTabs'
import { ProOnly } from '@/components/ProOnly'
import { useSubscription } from '@/hooks/useSubscription'


type ClienteInativo = {
  id: string; nome: string; telefone: string|null; ultima_compra: string|null
  diasSemComprar: number; totalGasto: number; numCompras: number; categoria: 'morno'|'frio'|'perdido'
}

const cats = {
  morno:   { emoji:'🟡', label:'Atenção',   desc:'Quase sumindo...',  cor:'var(--amarelo)' },
  frio:    { emoji:'🟠', label:'Sumido',    desc:'Passou do prazo',  cor:'#c05200' },
  perdido: { emoji:'🔴', label:'Perdido',   desc:'Muito tempo sumido',    cor:'var(--vermelho)' },
}

function msgWhatsApp(nome: string, categoria: string) {
  const first = nome.split(' ')[0]
  if (categoria==='perdido') return `Olá ${first}! Faz um tempo que não te vejo por aqui... Tenho novidades que você vai gostar. Passa na loja ou me chama aqui! 😊`
  if (categoria==='frio')    return `Olá ${first}! Tô com novidades aqui na loja e lembrei de você. Vem dar uma olhada! 💪`
  return `Oi ${first}! Novidade boa chegou aqui. Pode vir conferir? 🙌`
}

export default function ClientesInativosPage() {
  const { empresaId } = useEmpresaId()
  const { plano } = useSubscription()
  const [inativos, setInativos] = useState<ClienteInativo[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => { if (empresaId) carregar(empresaId) }, [empresaId])

  async function carregar(eid: string) {
    setLoading(true)
    const supabase = createClient()

    // Busca empresa para pegar o prazo
    const { data: emp } = await supabase.from('empresas').select('crm_prazo_inatividade_dias').eq('id', eid).single()
    const prazo = emp?.crm_prazo_inatividade_dias || 60

    // Busca todos os clientes ativos com última compra registrada
    const { data: clientes } = await supabase
      .from('clientes')
      .select('id,nome,telefone,ultima_compra')
      .eq('empresa_id', eid)
      .eq('ativo', true)
      .not('ultima_compra', 'is', null)

    if (!clientes || clientes.length === 0) { setInativos([]); setLoading(false); return }

    // Para cada cliente, busca total gasto e número de compras
    const agora = Date.now()
    const inatArray: ClienteInativo[] = []

    await Promise.all(clientes.map(async (c) => {
      const ultimaData = new Date(c.ultima_compra!).getTime()
      const dias = Math.floor((agora - ultimaData) / 86400000)
      if (dias < Math.max(15, prazo / 2)) return // Ativo, não está nem perto de sumir

      const { data: vendas } = await supabase
        .from('vendas')
        .select('total')
        .eq('empresa_id', eid)
        .eq('cliente_id', c.id)
        .eq('status', 'concluida')

      const totalGasto = (vendas||[]).reduce((a,v)=>a+v.total,0)
      const numCompras = (vendas||[]).length

      const categoria: 'morno'|'frio'|'perdido' =
        dias >= prazo * 1.5 ? 'perdido' : dias >= prazo ? 'frio' : 'morno'

      inatArray.push({ id:c.id, nome:c.nome, telefone:c.telefone, ultima_compra:c.ultima_compra, diasSemComprar:dias, totalGasto, numCompras, categoria })
    }))

    setInativos(inatArray.sort((a,b) => b.diasSemComprar - a.diasSemComprar))
    setLoading(false)
  }

  const perdidos = inativos.filter(c=>c.categoria==='perdido').length
  const frios    = inativos.filter(c=>c.categoria==='frio').length
  const mornos   = inativos.filter(c=>c.categoria==='morno').length
  const potencial = inativos.filter(c=>c.categoria!=='morno')
    .reduce((a,c) => a + (c.numCompras>0 ? c.totalGasto/c.numCompras : 0), 0)

  return (
    <ProOnly>
    <div className="anim-fade" style={{display:'flex',flexDirection:'column',gap:'0.875rem'}}>
      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">👤 Clientes Sumidos</h1>
          <p className="pg-sub">Clientes que pararam de comprar — recupere-os com 1 clique</p>
        </div>
      </div>

      <PageTabs tabs={[
        { label: 'Todos os Clientes', href: '/clientes' },
        { label: plano === 'pro' ? 'Sumidos ⚠' : 'Sumidos 🔒', href: '/clientes/inativos' },
        { label: 'Fornecedores', href: '/fornecedores' }
      ]} />


        <div className="alerta alerta-info">
          <span>💡</span>
          <span>Recuperar um cliente antigo custa <strong>5x menos</strong> que conquistar um novo. Mande uma mensagem agora.</span>
        </div>

        {loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:'3rem',gap:'0.75rem',color:'var(--texto-desab)'}}>
            <Loader2 size={20} style={{animation:'spin 1s linear infinite'}}/> Analisando clientes...
          </div>
        ) : inativos.length === 0 ? (
          <div style={{textAlign:'center',padding:'3rem',color:'var(--texto-desab)'}}>
            <p style={{fontSize:'2rem',marginBottom:'0.5rem'}}>🎉</p>
            <p style={{fontWeight:700}}>Nenhum cliente sumido!</p>
            <p style={{fontSize:'0.85rem',marginTop:'0.25rem'}}>Todos os seus clientes compraram nos últimos 30 dias.</p>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:'0.625rem'}}>
              {[
                {...cats.morno,   qtd:mornos,   extra:'Mandar mensagem leve'},
                {...cats.frio,    qtd:frios,    extra:'Ofereça algo especial'},
                {...cats.perdido, qtd:perdidos, extra:'Ação urgente!'},
              ].map(c=>(
                <div key={c.label} className="card" style={{padding:'0.875rem',borderLeft:`4px solid ${c.cor}`}}>
                  <p style={{fontSize:'0.78rem',color:'var(--texto-desab)',marginBottom:'0.25rem'}}>{c.emoji} {c.label}</p>
                  <p style={{fontWeight:900,fontSize:'1.75rem',color:c.cor,fontFamily:'monospace'}}>{c.qtd}</p>
                  <p style={{fontSize:'0.72rem',color:'var(--texto-desab)'}}>{c.desc}</p>
                  <p style={{fontSize:'0.7rem',color:c.cor,fontWeight:700,marginTop:'0.25rem'}}>{c.extra}</p>
                </div>
              ))}
              <div className="card" style={{padding:'0.875rem',borderLeft:'4px solid var(--verde)'}}>
                <p style={{fontSize:'0.78rem',color:'var(--texto-desab)',marginBottom:'0.25rem'}}>Ticket Médio dos Sumidos</p>
                <p style={{fontWeight:900,fontSize:'1.4rem',color:'var(--verde)',fontFamily:'monospace'}}>
                  {formatCurrency(potencial / ((perdidos + frios) || 1))}
                </p>
                <p style={{fontSize:'0.72rem',color:'var(--texto-desab)'}}>Potencial de recuperação</p>
              </div>
            </div>

            {/* Tabela */}
            <div className="tabela-wrap">
              <table className="tabela">
                <thead>
                  <tr style={{background:'#364a60'}}>
                    <th>Cliente</th><th>Telefone</th><th>Última Compra</th>
                    <th style={{textAlign:'right'}}>Dias Parado</th>
                    <th style={{textAlign:'right'}}>Total Gasto</th>
                    <th style={{textAlign:'right'}}>Compras</th>
                    <th>Temperatura</th>
                    <th style={{textAlign:'center'}}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {inativos.map(c=>{
                    const cat = cats[c.categoria]
                    const msg = encodeURIComponent(msgWhatsApp(c.nome, c.categoria))
                    const waNum = `55${(c.telefone||'').replace(/\D/g,'')}`
                    const dataFormatada = c.ultima_compra
                      ? new Date(c.ultima_compra).toLocaleDateString('pt-BR')
                      : '—'
                    return (
                      <tr key={c.id}>
                        <td style={{fontWeight:700}}>{c.nome}</td>
                        <td style={{fontSize:'0.82rem',color:'var(--texto-sec)'}}>{c.telefone||'—'}</td>
                        <td style={{fontSize:'0.82rem',color:'var(--texto-sec)'}}>{dataFormatada}</td>
                        <td style={{textAlign:'right',fontWeight:900,color:cat.cor,fontSize:'1rem'}}>{c.diasSemComprar}d</td>
                        <td style={{textAlign:'right',fontWeight:700,color:'var(--verde)',fontFamily:'monospace'}}>{formatCurrency(c.totalGasto)}</td>
                        <td style={{textAlign:'right',fontWeight:700}}>{c.numCompras}</td>
                        <td><span style={{fontWeight:700,color:cat.cor,fontSize:'0.82rem'}}>{cat.emoji} {cat.label}</span></td>
                        <td style={{textAlign:'center'}}>
                          {c.telefone ? (
                            <a href={`https://wa.me/${waNum}?text=${msg}`} target="_blank" rel="noopener noreferrer"
                              className="btn btn-primary" style={{fontSize:'0.72rem',padding:'0.3rem 0.625rem',background:'#25D366',border:'none'}}>
                              💬 Chamar no WhatsApp
                            </a>
                          ) : <span style={{color:'var(--texto-desab)',fontSize:'0.78rem'}}>Sem telefone</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mensagens pré-prontas */}
            <div className="card">
              <p style={{fontWeight:800,marginBottom:'0.5rem'}}>📝 Mensagens pré-prontas (personalizadas por temperatura)</p>
              <div style={{display:'flex',flexDirection:'column',gap:'0.625rem'}}>
                {Object.entries(cats).map(([key,cat])=>(
                  <div key={key} style={{padding:'0.625rem',background:'var(--surface-alt)',borderRadius:'var(--radius-sm)',borderLeft:`3px solid ${cat.cor}`}}>
                    <p style={{fontSize:'0.72rem',fontWeight:800,color:cat.cor,marginBottom:'0.25rem'}}>{cat.emoji} CLIENTES {cat.label.toUpperCase()}</p>
                    <p style={{fontSize:'0.82rem',color:'var(--texto-sec)',fontStyle:'italic'}}>"{msgWhatsApp('Cliente', key)}"</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

    </div>
    </ProOnly>
  )
}
