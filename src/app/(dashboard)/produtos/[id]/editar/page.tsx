'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { ArrowLeft, Save, Loader2, Trash2 } from 'lucide-react'

const CATEGORIAS = ['Eletrônicos','Acessórios','Serviços','Vestuário','Papelaria','Outros']

type Produto = {
  id:string; nome:string; sku:string|null; categoria:string|null; descricao:string|null
  preco_custo:number; preco_varejo:number; preco_atacado:number|null; preco_vip:number|null; preco_minimo:number|null
  qtd_atual:number; qtd_minima:number; localizacao:string|null
  pode_ser_brinde:boolean; tem_garantia:boolean; dias_garantia:number|null; texto_garantia:string|null; ativo:boolean
}

export default function EditarProdutoPage() {
  const router  = useRouter()
  const params  = useParams()
  const id      = params.id as string
  const [produto,  setProduto]  = useState<Produto|null>(null)
  const [loading,  setLoading]  = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro,     setErro]     = useState<string|null>(null)

  useEffect(() => { if (id) carregar(id) }, [id])

  async function carregar(pid: string) {
    const { data, error } = await createClient().from('produtos').select('*').eq('id',pid).single()
    if (error || !data) { setErro('Produto não encontrado.'); setLoading(false); return }
    setProduto(data)
    setLoading(false)
  }

  async function salvar() {
    if (!produto) return
    if (!produto.nome.trim()) { setErro('O nome é obrigatório.'); return }
    if (produto.preco_varejo <= 0) { setErro('Informe o preço de venda.'); return }
    setSalvando(true); setErro(null)
    const { error } = await createClient().from('produtos').update({
      nome: produto.nome, sku: produto.sku||null, categoria: produto.categoria||null,
      descricao: produto.descricao||null,
      preco_custo: produto.preco_custo, preco_varejo: produto.preco_varejo,
      preco_atacado: produto.preco_atacado||null, preco_vip: produto.preco_vip||null, preco_minimo: produto.preco_minimo||null,
      qtd_minima: produto.qtd_minima, localizacao: produto.localizacao||null,
      pode_ser_brinde: produto.pode_ser_brinde, tem_garantia: produto.tem_garantia,
      dias_garantia: produto.tem_garantia ? produto.dias_garantia||null : null,
      texto_garantia: produto.tem_garantia ? produto.texto_garantia||null : null,
      ativo: produto.ativo,
    }).eq('id', id)
    setSalvando(false)
    if (error) { setErro('Erro ao salvar: '+error.message); return }
    router.push('/produtos')
  }

  async function excluir() {
    if (!confirm(`Excluir o produto "${produto?.nome}"? Esta ação não pode ser desfeita.`)) return
    await createClient().from('produtos').delete().eq('id',id)
    router.push('/produtos')
  }

  const set = (field: keyof Produto, val: unknown) => setProduto(p => p ? {...p,[field]:val} : p)
  const margem = produto && produto.preco_varejo > 0 ? ((produto.preco_varejo - produto.preco_custo)/produto.preco_varejo*100) : 0

  if (loading) return (
    <div style={{display:'flex',justifyContent:'center',padding:'3rem',gap:'0.75rem',color:'var(--texto-desab)'}}>
      <Loader2 size={20} style={{animation:'spin 1s linear infinite'}}/> Carregando produto...
    </div>
  )
  if (!produto) return <div className="alerta alerta-perigo">{erro||'Produto não encontrado.'}</div>

  return (
    <div className="anim-fade" style={{display:'flex',flexDirection:'column',gap:'0.875rem',maxWidth:'780px'}}>
      <div className="pg-header">
        <div style={{display:'flex',alignItems:'center',gap:'0.625rem'}}>
          <Link href="/produtos" className="btn btn-secondary" style={{padding:'0.4rem 0.625rem'}}><ArrowLeft size={15}/></Link>
          <div>
            <h1 className="pg-titulo">✏️ Editar Produto</h1>
            <p className="pg-sub">{produto.nome}</p>
          </div>
        </div>
        <div style={{display:'flex',gap:'0.5rem'}}>
          <button onClick={excluir} className="btn btn-secondary" style={{color:'var(--vermelho)',display:'flex',alignItems:'center',gap:'0.375rem'}}>
            <Trash2 size={14}/> Excluir
          </button>
        </div>
      </div>

      {erro&&<div className="alerta alerta-perigo">{erro}</div>}

      {/* Toggle ativo */}
      <label style={{display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.75rem',background:'var(--surface)',border:'1px solid var(--borda)',borderRadius:'var(--radius)',cursor:'pointer'}}>
        <input type="checkbox" checked={produto.ativo} onChange={e=>set('ativo',e.target.checked)} style={{width:'16px',height:'16px',accentColor:'var(--verde)'}}/>
        <div>
          <p style={{fontWeight:700}}>Produto ativo</p>
          <p style={{fontSize:'0.75rem',color:'var(--texto-desab)'}}>Produtos inativos não aparecem no PDV</p>
        </div>
      </label>

      {/* Identificação */}
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div className="sec-header"><span>🏷️ Identificação</span></div>
        <div style={{padding:'0.875rem',display:'flex',flexDirection:'column',gap:'0.75rem'}}>
          <div>
            <label className="campo-label">Nome *</label>
            <input className="campo" style={{marginTop:'0.375rem'}} value={produto.nome} onChange={e=>set('nome',e.target.value)}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.625rem'}}>
            <div>
              <label className="campo-label">SKU</label>
              <input className="campo" style={{marginTop:'0.375rem',fontFamily:'monospace'}} value={produto.sku||''} onChange={e=>set('sku',e.target.value)}/>
            </div>
            <div>
              <label className="campo-label">Categoria</label>
              <select className="campo" style={{marginTop:'0.375rem'}} value={produto.categoria||''} onChange={e=>set('categoria',e.target.value)}>
                <option value="">Selecionar...</option>
                {CATEGORIAS.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="campo-label">Localização</label>
              <input className="campo" style={{marginTop:'0.375rem'}} value={produto.localizacao||''} onChange={e=>set('localizacao',e.target.value)} placeholder="Ex: Prateleira A3"/>
            </div>
          </div>
          <div>
            <label className="campo-label">Descrição</label>
            <textarea className="campo" rows={2} style={{marginTop:'0.375rem',resize:'none'}} value={produto.descricao||''} onChange={e=>set('descricao',e.target.value)}/>
          </div>
        </div>
      </div>

      {/* Preços */}
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div className="sec-header"><span>💰 Preços</span></div>
        <div style={{padding:'0.875rem',display:'flex',flexDirection:'column',gap:'0.75rem'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.625rem'}}>
            {[
              {l:'Custo',  k:'preco_custo',  v:produto.preco_custo,  ph:'0,00'},
              {l:'Varejo *',k:'preco_varejo',v:produto.preco_varejo, ph:'0,00'},
            ].map(f=>(
              <div key={f.k}>
                <label className="campo-label">{f.l}</label>
                <div style={{position:'relative',marginTop:'0.375rem'}}>
                  <span style={{position:'absolute',left:'0.625rem',top:'50%',transform:'translateY(-50%)',fontWeight:700,color:'var(--texto-desab)',fontSize:'0.875rem'}}>R$</span>
                  <input className="campo" type="number" step="0.01" min="0" style={{paddingLeft:'2rem',fontWeight:800}}
                    value={f.v} onChange={e=>set(f.k as keyof Produto,parseFloat(e.target.value)||0)} placeholder={f.ph}/>
                </div>
              </div>
            ))}
            <div>
              <label className="campo-label">Margem</label>
              <div className="campo" style={{marginTop:'0.375rem',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:'1.25rem',
                color:margem>=30?'var(--verde)':margem>0?'var(--amarelo)':'var(--texto-desab)',cursor:'default'}}>
                {margem>0?`${margem.toFixed(1)}%`:'—'}
              </div>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.625rem'}}>
            {[
              {l:'Atacado',k:'preco_atacado',v:produto.preco_atacado},
              {l:'VIP',    k:'preco_vip',    v:produto.preco_vip},
              {l:'Mínimo', k:'preco_minimo', v:produto.preco_minimo},
            ].map(f=>(
              <div key={f.k}>
                <label className="campo-label">{f.l}</label>
                <div style={{position:'relative',marginTop:'0.375rem'}}>
                  <span style={{position:'absolute',left:'0.625rem',top:'50%',transform:'translateY(-50%)',fontWeight:700,color:'var(--texto-desab)',fontSize:'0.875rem'}}>R$</span>
                  <input className="campo" type="number" step="0.01" min="0" style={{paddingLeft:'2rem'}}
                    value={f.v||''} onChange={e=>set(f.k as keyof Produto,parseFloat(e.target.value)||null)} placeholder="—"/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Estoque */}
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div className="sec-header"><span>📉 Estoque</span></div>
        <div style={{padding:'0.875rem',display:'flex',flexDirection:'column',gap:'0.75rem'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.625rem'}}>
            <div>
              <label className="campo-label">Quantidade atual (somente leitura)</label>
              <div className="campo" style={{marginTop:'0.375rem',textAlign:'center',fontWeight:900,fontSize:'1.5rem',
                color:produto.qtd_atual<=produto.qtd_minima&&produto.qtd_minima>0?'var(--vermelho)':'var(--verde)',cursor:'default',fontFamily:'monospace'}}>
                {produto.qtd_atual}
              </div>
              <p style={{fontSize:'0.72rem',color:'var(--texto-desab)',marginTop:'3px'}}>Para alterar use o módulo Estoque</p>
            </div>
            <div>
              <label className="campo-label">Estoque mínimo</label>
              <input className="campo" type="number" min="0"
                style={{marginTop:'0.375rem',textAlign:'center',fontWeight:700}}
                value={produto.qtd_minima} onChange={e=>set('qtd_minima',parseInt(e.target.value)||0)}/>
              <p style={{fontSize:'0.72rem',color:'var(--amarelo)',marginTop:'3px'}}>⚠ Alerta abaixo deste valor</p>
            </div>
          </div>
          <label style={{display:'flex',alignItems:'center',gap:'0.625rem',cursor:'pointer'}}>
            <input type="checkbox" checked={produto.pode_ser_brinde} onChange={e=>set('pode_ser_brinde',e.target.checked)} style={{width:'16px',height:'16px',accentColor:'var(--verde)'}}/>
            <div>
              <p style={{fontWeight:700,fontSize:'0.875rem'}}>🎁 Pode ser brinde</p>
              <p style={{fontSize:'0.75rem',color:'var(--texto-desab)'}}>Aparece primeiro na busca de brindes no PDV</p>
            </div>
          </label>
        </div>
      </div>

      {/* Garantia */}
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div className="sec-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span>🛡️ Garantia</span>
          <button type="button" onClick={()=>set('tem_garantia',!produto.tem_garantia)}
            style={{position:'relative',width:'44px',height:'24px',borderRadius:'12px',border:'none',cursor:'pointer',
              background:produto.tem_garantia?'var(--verde)':'#666',transition:'background 0.2s'}}>
            <span style={{position:'absolute',top:'2px',width:'20px',height:'20px',borderRadius:'50%',background:'#fff',
              boxShadow:'0 1px 3px rgba(0,0,0,0.3)',left:produto.tem_garantia?'22px':'2px',transition:'left 0.2s'}}/>
          </button>
        </div>
        <div style={{padding:'0.875rem'}}>
          {!produto.tem_garantia ? (
            <p style={{fontSize:'0.82rem',color:'var(--texto-desab)'}}>Ative para configurar garantia automática.</p>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
              <div>
                <label className="campo-label">Prazo (dias)</label>
                <input className="campo" type="number" min="1" style={{marginTop:'0.375rem',maxWidth:'160px',textAlign:'center',fontWeight:700}}
                  value={produto.dias_garantia||''} onChange={e=>set('dias_garantia',parseInt(e.target.value)||null)} placeholder="90"/>
              </div>
              <div>
                <label className="campo-label">Texto do termo</label>
                <textarea className="campo" rows={3} style={{marginTop:'0.375rem',resize:'none'}}
                  value={produto.texto_garantia||''} onChange={e=>set('texto_garantia',e.target.value)}
                  placeholder="Ex: Garantia contra defeitos de fabricação..."/>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{display:'flex',justifyContent:'space-between',paddingBottom:'1rem'}}>
        <Link href="/produtos" className="btn btn-ghost">Cancelar</Link>
        <button onClick={salvar} disabled={salvando} className="btn btn-primary"
          style={{display:'flex',alignItems:'center',gap:'0.375rem',padding:'0.75rem 1.5rem'}}>
          {salvando?<><Loader2 size={15} style={{animation:'spin 1s linear infinite'}}/>Salvando...</>:<><Save size={15}/>Salvar alterações</>}
        </button>
      </div>
    </div>
  )
}
