'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { Search, Loader2, Printer, X } from 'lucide-react'
import { PageTabs } from '@/components/PageTabs'
import { useSubscription } from '@/hooks/useSubscription'

type Garantia = { id:string; produto_nome:string; num_serie:string|null; cliente_nome:string|null; cliente_tel:string|null; data_compra:string; data_vencimento:string; status:string; texto_garantia:string|null }

export default function GarantiasPage() {
  const { empresaId } = useEmpresaId()
  const { plano } = useSubscription()
  const [garantias, setGarantias] = useState<Garantia[]>([])
  const [busca,     setBusca]     = useState('')
  const [filtro,    setFiltro]    = useState<'todas'|'ativas'|'vencidas'>('todas')
  const [loading,   setLoading]   = useState(true)
  const [selecionada, setSelecionada] = useState<Garantia|null>(null)
  
  // Modal Devolução
  const [showDev, setShowDev] = useState(false)
  const [devGarantia, setDevGarantia] = useState<Garantia|null>(null)
  const [devMotivo, setDevMotivo] = useState('')
  const [devRes, setDevRes] = useState('Troca de produto')
  const [salvandoDev, setSalvandoDev] = useState(false)

  useEffect(() => { if (empresaId) carregar(empresaId) }, [empresaId])

  async function carregar(eid: string) {
    setLoading(true)
    const { data } = await createClient()
      .from('garantias')
      .select('id,produto_nome,num_serie,cliente_nome,cliente_tel,data_compra,data_vencimento,status,texto_garantia')
      .eq('empresa_id', eid)
      .order('data_vencimento', { ascending: false })
    // Atualiza status baseado na data
    const hoje = new Date().toISOString().slice(0,10)
    const atualizadas = (data||[]).map(g => ({ ...g, status: g.data_vencimento < hoje ? 'vencida' : 'ativa' }))
    setGarantias(atualizadas)
    setLoading(false)
  }

  const diasRestantes = (data: string) => Math.ceil((new Date(data).getTime()-Date.now())/86400000)

  async function registrarDevolucao() {
    if (!devGarantia || !devMotivo.trim() || !empresaId) return
    setSalvandoDev(true)
    const supabase = createClient()
    
    // Insere na tabela devolucoes
    await supabase.from('devolucoes').insert({
      empresa_id: empresaId,
      garantia_id: devGarantia.id,
      motivo: devMotivo.trim(),
      resolucao: devRes
    })
    
    // Atualiza status da garantia
    await supabase.from('garantias').update({ status: 'em devolução' }).eq('id', devGarantia.id)
    
    // Se for troca, credita o item no estoque
    if (devRes === 'Troca de produto') {
      const { data: gData } = await supabase.from('garantias').select('produto_id, venda_id').eq('id', devGarantia.id).single()
      if (gData && gData.produto_id) {
        const { data: pData } = await supabase.from('produtos').select('qtd_atual').eq('id', gData.produto_id).single()
        if (pData) {
          await supabase.from('produtos').update({ qtd_atual: pData.qtd_atual + 1 }).eq('id', gData.produto_id)
          await supabase.from('estoque_movimentacoes').insert({
            empresa_id: empresaId, produto_id: gData.produto_id,
            tipo: 'entrada', quantidade: 1, obs: `Retorno por troca de garantia (Venda #${gData.venda_id||'?'})`
          })
        }
      }
    }
    
    setGarantias(prev => prev.map(g => g.id === devGarantia.id ? { ...g, status: 'em devolução' } : g))
    setSalvandoDev(false)
    setShowDev(false)
  }

  const filtradas = garantias.filter(g => {
    const matchBusca = (g.produto_nome||'').toLowerCase().includes(busca.toLowerCase())||
      (g.cliente_nome||'').toLowerCase().includes(busca.toLowerCase())||
      (g.num_serie||'').toLowerCase().includes(busca.toLowerCase())
    const matchFiltro = filtro==='todas' ? true : g.status===filtro.slice(0,-1)
    return matchBusca && matchFiltro
  })

  const ativas   = garantias.filter(g=>g.status==='ativa').length
  const vencidas = garantias.filter(g=>g.status==='vencida').length
  const vencendo = garantias.filter(g=>{ const d=diasRestantes(g.data_vencimento); return d>0&&d<=30 }).length

  return (
    <div className="anim-fade" style={{display:'flex',flexDirection:'column',gap:'0.875rem'}}>
      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">GARANTIAS</h1>
          <p className="pg-sub">{ativas} ATIVAS · {vencendo} VENCENDO EM 30D · {vencidas} VENCIDAS</p>
        </div>
      </div>

      <PageTabs tabs={[
        { label: 'Garantias', href: '/garantias' },
        { label: 'Ordens de Serviço', href: '/ordens-de-servico' },
        { label: 'Comissões', href: '/comissoes' }
      ]} />

      {/* Modal Devolução */}
      {showDev && devGarantia && (
        <div style={{position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}
          onClick={e=>{if(e.target===e.currentTarget)setShowDev(false)}}>
          <div className="card anim-pop" style={{width:'100%',maxWidth:'400px',padding:0}}>
            <div style={{padding:'1.25rem',borderBottom:'1px solid var(--borda)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h2 style={{fontWeight:800,fontSize:'1.1rem'}}>↩ Registrar Devolução</h2>
              <button onClick={()=>setShowDev(false)} className="btn-icon"><X size={18}/></button>
            </div>
            <div style={{padding:'1.25rem',display:'flex',flexDirection:'column',gap:'0.875rem'}}>
              <div>
                <p style={{fontWeight:700}}>{devGarantia.produto_nome}</p>
                <p style={{fontSize:'0.85rem',color:'var(--texto-sec)'}}>Cliente: {devGarantia.cliente_nome||'—'}</p>
              </div>
              <div>
                <label className="campo-label">Motivo da devolução *</label>
                <textarea className="campo" rows={2} style={{marginTop:'0.375rem',resize:'none'}} value={devMotivo} onChange={e=>setDevMotivo(e.target.value)} placeholder="Defeito relatado..."/>
              </div>
              <div>
                <label className="campo-label">Resolução</label>
                <select className="campo" style={{marginTop:'0.375rem'}} value={devRes} onChange={e=>setDevRes(e.target.value)}>
                  <option>Troca de produto</option>
                  <option>Reembolso</option>
                  <option>Envio para reparo</option>
                  <option>Sem resolução por ora</option>
                </select>
                {devRes === 'Troca de produto' && <p style={{fontSize:'0.75rem',color:'var(--verde)',marginTop:'0.25rem'}}>O produto devolvido será reinserido no estoque (+1) como defeituoso/retorno.</p>}
              </div>
              <div style={{display:'flex',gap:'0.5rem',justifyContent:'flex-end',marginTop:'0.5rem'}}>
                <button onClick={()=>setShowDev(false)} className="btn btn-ghost">Cancelar</button>
                <button onClick={registrarDevolucao} disabled={!devMotivo.trim()||salvandoDev} className="btn btn-primary" style={{display:'flex',alignItems:'center',gap:'0.375rem'}}>
                  {salvandoDev?<Loader2 size={14} style={{animation:'spin 1s linear infinite'}}/>:null}
                  Confirmar Devolução
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.625rem'}}>
        {[
          {l:'Garantias ativas',      v:String(ativas),   c:'var(--verde)'},
          {l:'Vencendo em 30 dias',   v:String(vencendo), c:vencendo>0?'var(--amarelo)':'var(--verde)'},
          {l:'Garantias vencidas',    v:String(vencidas), c:vencidas>0?'var(--vermelho)':'var(--verde)'},
        ].map(k=>(
          <div key={k.l} className="card" style={{padding:'0.875rem'}}>
            <p style={{fontSize:'0.78rem',color:'var(--texto-desab)',marginBottom:'0.25rem'}}>{k.l}</p>
            <p style={{fontWeight:900,fontSize:'1.5rem',color:k.c,fontFamily:'monospace'}}>{k.v}</p>
          </div>
        ))}
      </div>

      {vencendo>0&&(
        <div style={{padding:'0.5rem 0.75rem',background:'rgba(255,170,0,0.08)',border:'1px solid var(--amarelo)',fontSize:'0.72rem',color:'var(--amarelo)',letterSpacing:'0.03em'}}>
          ⚠ <strong>{vencendo} GARANTIA(S)</strong> VENCEM NOS PRÓXIMOS 30 DIAS.
        </div>
      )}

      <div style={{display:'flex',gap:'0.375rem',flexWrap:'wrap',alignItems:'center'}}>
        {([['todas','TODAS'],['ativas','ATIVAS'],['vencidas','VENCIDAS']] as const).map(([v,l])=>(
          <button key={v} onClick={()=>setFiltro(v)} className={filtro===v?'btn btn-primary':'btn btn-secondary'} style={{fontSize:'0.65rem',padding:'0.3rem 0.625rem'}}>{l}</button>
        ))}
        <input className="campo" placeholder="BUSCAR PRODUTO, CLIENTE OU SÉRIE_" style={{flex:1,maxWidth:'280px'}} value={busca} onChange={e=>setBusca(e.target.value)}/>
      </div>

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:'2rem',flexDirection:'column',alignItems:'center',gap:'0.5rem'}}>
          <p style={{color:'var(--verde)',fontSize:'0.75rem',letterSpacing:'0.08em'}}>CARREGANDO GARANTIAS<span className="blink">_</span></p>
        </div>
      ) : filtradas.length===0 ? (
        <div style={{textAlign:'center',padding:'3rem',color:'var(--texto-desab)',border:'1px solid var(--borda)',background:'var(--surface)'}}>
          <p style={{fontSize:'0.7rem',letterSpacing:'0.1em',fontWeight:700,marginBottom:'0.375rem'}}>{busca?'[ NENHUMA GARANTIA ENCONTRADA ]':'[ NENHUMA GARANTIA CADASTRADA ]'}</p>
          <p style={{fontSize:'0.72rem',color:'var(--texto-sec)'}}>Garantias são geradas automaticamente ao finalizar uma venda com produto com garantia configurada.</p>
        </div>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead><tr>
                <th>PRODUTO</th><th>Nº SÉRIE</th><th>CLIENTE</th>
                <th>COMPRA</th><th>VENCIM.</th><th style={{textAlign:'center'}}>RESTANTE</th>
                <th style={{textAlign:'center'}}>STATUS</th><th style={{textAlign:'center'}}>AÇÕES</th>
            </tr></thead>
            <tbody>
              {filtradas.map(g=>{
                const dias  = diasRestantes(g.data_vencimento)
                const ativa = g.status==='ativa'
                return (
                  <tr key={g.id}>
                    <td style={{fontWeight:700}}>{g.produto_nome}</td>
                    <td><code style={{fontSize:'0.7rem',letterSpacing:'0.05em'}}>{g.num_serie||'—'}</code></td>
                    <td>
                      {g.cliente_nome||'—'}
                      {g.cliente_tel&&(
                        <a href={`https://wa.me/55${g.cliente_tel.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                          style={{marginLeft:'0.375rem',fontSize:'0.65rem',color:'var(--verde)'}}>WA</a>
                      )}
                    </td>
                    <td style={{fontSize:'0.72rem',color:'var(--texto-desab)',fontVariantNumeric:'tabular-nums'}}>{new Date(g.data_compra+'T12:00:00').toLocaleDateString('pt-BR')}</td>
                    <td style={{fontSize:'0.72rem',fontWeight:700,color:ativa&&dias<=30?'var(--amarelo)':ativa?'var(--verde)':'var(--vermelho)'}}>
                      {new Date(g.data_vencimento+'T12:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td style={{textAlign:'center',fontWeight:700,color:!ativa?'var(--vermelho)':dias<=30?'var(--amarelo)':'var(--verde)'}}>
                      {!ativa ? 'VENCIDA' : `${dias}d`}
                    </td>
                    <td style={{textAlign:'center'}}>
                      <span className={ativa?'status-ok':'status-neutro'} style={{fontSize:'0.7rem'}}>
                        {ativa?'● ATIVA':'○ VENCIDA'}
                      </span>
                    </td>
                    <td style={{textAlign:'center',display:'flex',gap:'0.25rem',justifyContent:'center',flexWrap:'wrap'}}>
                      <button onClick={()=>setSelecionada(g)} className="btn btn-secondary" style={{fontSize:'0.62rem',padding:'0.15rem 0.4rem'}}>TERMO</button>
                      {ativa && (
                        <button onClick={()=>{setDevGarantia(g);setShowDev(true);setDevMotivo('')}} className="btn btn-secondary" style={{fontSize:'0.62rem',padding:'0.15rem 0.4rem',color:'var(--amarelo)'}}>DEVOL.</button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal termo de garantia */}
      {selecionada&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div className="anim-pop" style={{width:'100%',maxWidth:'480px',margin:'1rem',background:'var(--surface)',border:'1px solid var(--borda-forte)',borderRadius:'2px'}}>
            <div style={{padding:'0.75rem 1rem',borderBottom:'2px solid var(--verde)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <p style={{fontWeight:700,fontSize:'0.78rem',color:'var(--verde)',letterSpacing:'0.06em',textTransform:'uppercase'}}>CERTIFICADO DE GARANTIA</p>
              <button onClick={()=>setSelecionada(null)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'1rem',color:'var(--texto-desab)'}}>✕</button>
            </div>
            <div style={{padding:'1rem'}}>
              <div style={{border:'1px solid var(--borda-forte)',padding:'1rem',background:'var(--fundo-painel)'}}>
                <p style={{fontWeight:900,fontSize:'0.82rem',marginBottom:'0.75rem',textAlign:'center',letterSpacing:'0.12em',color:'var(--verde)'}}>▶ CERTIFICADO DE GARANTIA ◀</p>
                <div style={{display:'flex',flexDirection:'column',gap:'0.4rem',fontSize:'0.78rem',fontVariantNumeric:'tabular-nums'}}>
                  <p><span style={{color:'var(--texto-sec)'}}>PRODUTO........</span> {selecionada.produto_nome}</p>
                  {selecionada.num_serie&&<p><span style={{color:'var(--texto-sec)'}}>Nº SÉRIE......</span> {selecionada.num_serie}</p>}
                  {selecionada.cliente_nome&&<p><span style={{color:'var(--texto-sec)'}}>CLIENTE........</span> {selecionada.cliente_nome}</p>}
                  <p><span style={{color:'var(--texto-sec)'}}>COMPRA.........</span> {new Date(selecionada.data_compra+'T12:00:00').toLocaleDateString('pt-BR')}</p>
                  <p><span style={{color:'var(--verde)'}}>VÁLIDA ATÉ.....</span> {new Date(selecionada.data_vencimento+'T12:00:00').toLocaleDateString('pt-BR')}</p>
                  {selecionada.texto_garantia&&<p style={{marginTop:'0.5rem',fontSize:'0.72rem',color:'var(--texto-sec)'}}>{selecionada.texto_garantia}</p>}
                </div>
              </div>
              <div style={{display:'flex',justifyContent:'flex-end',gap:'0.375rem',marginTop:'0.75rem'}}>
                <button onClick={()=>setSelecionada(null)} className="btn btn-secondary" style={{fontSize:'0.72rem'}}>FECHAR</button>
                <button onClick={()=>window.print()} className="btn btn-primary" style={{fontSize:'0.72rem'}}>IMPRIMIR</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
