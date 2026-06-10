'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { formatCurrency } from '@/lib/utils'
import { Loader2, Search } from 'lucide-react'
import { PageTabs } from '@/components/PageTabs'
import toast from 'react-hot-toast'

type Produto = {
  id:string; nome:string; sku:string|null; categoria:string|null
  qtd_atual:number; qtd_minima:number; preco_custo:number; pode_ser_brinde:boolean
}
type Mov = {
  id:string; tipo:string; quantidade:number; custo_unitario:number|null
  criado_em:string; obs:string|null; nota_fiscal:string|null
  produtos:{ nome:string }[] | { nome:string } | null
}

const MOTIVOS_AJUSTE = ['Avaria', 'Furto', 'Vencimento', 'Perda', 'Doação', 'Erro de contagem', 'Outro']
const FILTRO_TIPOS   = ['todos', 'entrada', 'ajuste', 'venda', 'brinde'] as const

export default function EstoquePage() {
  const { empresaId } = useEmpresaId()
  const [produtos,  setProdutos]  = useState<Produto[]>([])
  const [movs,      setMovs]      = useState<Mov[]>([])
  const [busca,     setBusca]     = useState('')
  const [filtro,    setFiltro]    = useState<'todos'|'criticos'|'brindes'>('todos')
  const [filtroMov, setFiltroMov] = useState<typeof FILTRO_TIPOS[number]>('todos')
  const [loading,   setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [tipoModal, setTipoModal] = useState<'entrada'|'ajuste'>('entrada')

  // Form do modal
  const [produtoId,    setProdutoId]    = useState('')
  const [produtoNome,  setProdutoNome]  = useState('')
  const [showSugs,     setShowSugs]     = useState(false)
  const [quantidade,   setQuantidade]   = useState(1)
  const [custoUnit,    setCustoUnit]    = useState('')
  const [notaFiscal,   setNotaFiscal]   = useState('')
  const [motivo,       setMotivo]       = useState(MOTIVOS_AJUSTE[0])
  const [obs,          setObs]          = useState('')
  const [salvando,     setSalvando]     = useState(false)

  const sugsRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (empresaId) carregar(empresaId) }, [empresaId])

  async function carregar(eid: string) {
    setLoading(true)
    const supabase = createClient()
    const results = await Promise.allSettled([
      supabase.from('produtos').select('id,nome,sku,categoria,qtd_atual,qtd_minima,preco_custo,pode_ser_brinde').eq('empresa_id',eid).order('nome'),
      supabase.from('estoque_movimentacoes').select('id,tipo,quantidade,custo_unitario,nota_fiscal,criado_em,obs,produtos(nome)').eq('empresa_id',eid).order('criado_em',{ascending:false}).limit(80),
    ])
    const getRes = (i: number): any => results[i].status === 'fulfilled' ? (results[i] as PromiseFulfilledResult<any>).value || {} : {}
    const { data: prods }      = getRes(0)
    const { data: movimentos } = getRes(1)
    setProdutos(prods||[])
    setMovs(movimentos||[])
    setLoading(false)
  }

  function abrirModal(tipo: 'entrada'|'ajuste') {
    setTipoModal(tipo)
    setProdutoId('')
    setProdutoNome('')
    setQuantidade(1)
    setCustoUnit('')
    setNotaFiscal('')
    setMotivo(MOTIVOS_AJUSTE[0])
    setObs('')
    setShowModal(true)
  }

  function selecionarProduto(p: Produto) {
    setProdutoId(p.id)
    setProdutoNome(p.nome)
    setCustoUnit(p.preco_custo > 0 ? String(p.preco_custo) : '')
    setShowSugs(false)
  }

  const produtoSelecionado = produtos.find(p => p.id === produtoId)
  const sugestoes = produtoNome.trim().length > 0
    ? produtos.filter(p => p.nome.toLowerCase().includes(produtoNome.toLowerCase()) || (p.sku||'').toLowerCase().includes(produtoNome.toLowerCase())).slice(0, 6)
    : []

  async function salvarAjuste() {
    if (!produtoId || !empresaId) { toast.error('Selecione um produto'); return }
    if (tipoModal === 'ajuste' && !motivo) { toast.error('Informe o motivo'); return }

    setSalvando(true)
    const supabase = createClient()
    const delta = tipoModal === 'entrada' ? Math.abs(quantidade) : -Math.abs(quantidade)
    const produto = produtos.find(p => p.id === produtoId)
    if (!produto) { setSalvando(false); return }

    const novaQtd = Math.max(0, produto.qtd_atual + delta)
    const custoNum = parseFloat(custoUnit) || null
    const obsTexto = tipoModal === 'ajuste'
      ? `${motivo}${obs ? ` — ${obs}` : ''}`
      : obs || null

    try {
      await Promise.all([
        supabase.from('estoque_movimentacoes').insert({
          empresa_id:    empresaId,
          produto_id:    produtoId,
          tipo:          tipoModal,
          quantidade:    delta,
          obs:           obsTexto,
          custo_unitario: custoNum,
          nota_fiscal:   notaFiscal || null,
        }),
        supabase.from('produtos').update({
          qtd_atual: novaQtd,
          // Se entrada com custo informado, atualiza preco_custo do produto
          ...(tipoModal === 'entrada' && custoNum ? { preco_custo: custoNum } : {}),
        }).eq('id', produtoId),
      ])
      toast.success(tipoModal === 'entrada'
        ? `✅ Entrada de ${quantidade} un. registrada${custoNum ? ` (custo: ${formatCurrency(custoNum)}/un)` : ''}`
        : `✅ Ajuste de −${quantidade} un. registrado (Motivo: ${motivo})`
      )
      setShowModal(false)
      carregar(empresaId)
    } catch (e) {
      console.error(e)
      toast.error('Erro ao registrar movimentação')
    } finally {
      setSalvando(false)
    }
  }

  const filtrados = produtos.filter(p => {
    const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase()) || (p.sku||'').toLowerCase().includes(busca.toLowerCase())
    const matchFiltro = filtro==='todos' ? true : filtro==='criticos' ? p.qtd_atual<=p.qtd_minima&&p.qtd_minima>0 : !!p.pode_ser_brinde
    return matchBusca && matchFiltro
  })

  const movsFiltradas = filtroMov === 'todos' ? movs : movs.filter(m => m.tipo === filtroMov)

  const criticos     = produtos.filter(p => p.qtd_atual<=p.qtd_minima&&p.qtd_minima>0).length
  const valorEstoque = produtos.reduce((a,p) => a+p.qtd_atual*p.preco_custo,0)
  const totalItens   = produtos.reduce((a,p) => a+p.qtd_atual,0)

  const tipoMov = { entrada:'ENTRADA', venda:'VENDA', brinde:'BRINDE', ajuste:'AJUSTE' } as Record<string,string>
  const corMov  = { entrada:'var(--verde)', venda:'var(--azul)', brinde:'var(--amarelo)', ajuste:'var(--texto-sec)' } as Record<string,string>

  return (
    <div className="anim-fade" style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">ESTOQUE — MOVIMENTAÇÕES</h1>
          <p className="pg-sub">VALOR EM ESTOQUE: {formatCurrency(valorEstoque)}</p>
        </div>
        <div style={{display:'flex',gap:'0.375rem'}}>
          <button onClick={() => abrirModal('ajuste')} className="btn btn-secondary">- AJUSTE</button>
          <button onClick={() => abrirModal('entrada')} className="btn btn-primary">+ ENTRADA</button>
        </div>
      </div>

      <PageTabs tabs={[
        { label: 'Produtos', href: '/produtos' },
        { label: 'Estoque e Movimentações', href: '/estoque' },
        { label: 'Catálogo Online', href: '/catalogo' }
      ]} />

      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.5rem'}}>
        {[
          {l:'VALOR ESTOQUE', v:formatCurrency(valorEstoque), dot:'var(--azul)',    c:'var(--texto-mono)'},
          {l:'TOTAL ITENS',   v:String(totalItens),           dot:'var(--verde)',   c:'var(--verde)'},
          {l:'ESTQ. CRÍTICO', v:String(criticos),             dot:criticos>0?'var(--vermelho)':'var(--verde)', c:criticos>0?'var(--vermelho)':'var(--verde)'},
        ].map(k=>(
          <div key={k.l} className="kpi-card">
            <div style={{display:'flex',alignItems:'center',gap:'0.35rem'}}>
              <span style={{color:k.dot,fontSize:'0.55rem'}}>●</span>
              <p className="kpi-label">{k.l}</p>
            </div>
            <p className="kpi-valor" style={{color:k.c,fontSize:'1.25rem'}}>{k.v}</p>
          </div>
        ))}
      </div>

      {criticos>0&&(
        <div className="alerta alerta-perigo">
          ⚠ <strong>{criticos} produto(s)</strong> abaixo do estoque mínimo
        </div>
      )}

      <div style={{display:'flex',gap:'0.375rem',flexWrap:'wrap',alignItems:'center'}}>
        {([['todos','TODOS'],['criticos','⚠ CRÍTICOS'],['brindes','★ BRINDES']] as const).map(([v,l])=>(
          <button key={v} onClick={()=>setFiltro(v)} className={filtro===v?'btn btn-primary':'btn btn-secondary'} style={{fontSize:'0.65rem',padding:'0.3rem 0.625rem'}}>{l}</button>
        ))}
        <input className="campo" placeholder="BUSCAR PRODUTO_" style={{flex:1,maxWidth:'280px'}} value={busca} onChange={e=>setBusca(e.target.value)}/>
      </div>

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:'2rem',flexDirection:'column',alignItems:'center',gap:'0.5rem'}}>
          <p style={{color:'var(--verde)',fontSize:'0.75rem',letterSpacing:'0.08em'}}>CARREGANDO ESTOQUE<span className="blink">_</span></p>
        </div>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>PRODUTO</th><th>SKU</th><th>CATEGORIA</th>
                <th style={{textAlign:'center'}}>ATUAL</th>
                <th style={{textAlign:'center'}}>MÍN.</th>
                <th style={{textAlign:'right'}}>CUSTO</th>
                <th style={{textAlign:'right'}}>TOTAL</th>
                <th style={{textAlign:'center'}}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(p=>{
                const critico = p.qtd_atual<=p.qtd_minima&&p.qtd_minima>0
                return (
                  <tr key={p.id}>
                    <td style={{fontWeight:700}}>{p.nome}</td>
                    <td style={{color:'var(--texto-mono)',fontSize:'0.72rem',letterSpacing:'0.04em'}}>{p.sku||'—'}</td>
                    <td style={{fontSize:'0.72rem',color:'var(--texto-sec)'}}>{p.categoria||'—'}</td>
                    <td style={{textAlign:'center',fontWeight:700,color:critico?'var(--vermelho)':'var(--verde)',fontVariantNumeric:'tabular-nums',fontSize:'1rem'}}>{p.qtd_atual}</td>
                    <td style={{textAlign:'center',color:'var(--texto-desab)',fontVariantNumeric:'tabular-nums'}}>{p.qtd_minima}</td>
                    <td style={{textAlign:'right',fontSize:'0.78rem',color:'var(--texto-sec)',fontVariantNumeric:'tabular-nums'}}>{formatCurrency(p.preco_custo)}</td>
                    <td style={{textAlign:'right',fontWeight:700,color:'var(--texto-mono)',fontVariantNumeric:'tabular-nums'}}>{formatCurrency(p.qtd_atual*p.preco_custo)}</td>
                    <td style={{textAlign:'center'}}>
                      <span className={critico?'status-erro':p.qtd_atual===0?'status-neutro':'status-ok'} style={{fontSize:'0.7rem'}}>
                        {critico?'⚠ CRÍTICO':p.qtd_atual===0?'ZERADO':'● OK'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Últimas movimentações */}
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div className="sec-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'0.5rem'}}>
          <span>ÚLTIMAS MOVIMENTAÇÕES</span>
          <div style={{display:'flex',gap:'0.25rem',padding:'0 0.5rem'}}>
            {FILTRO_TIPOS.map(t => (
              <button key={t} onClick={() => setFiltroMov(t)}
                className={filtroMov === t ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{fontSize:'0.6rem',padding:'0.15rem 0.5rem',textTransform:'uppercase'}}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <table className="tabela">
          <thead>
            <tr>
              <th>PRODUTO</th><th>TIPO</th>
              <th style={{textAlign:'center'}}>QTD</th>
              <th style={{textAlign:'right'}}>CUSTO UN.</th>
              <th>OBS.</th><th>DATA/HORA</th>
            </tr>
          </thead>
          <tbody>
            {movsFiltradas.length===0 ? (
              <tr><td colSpan={6} style={{textAlign:'center',color:'var(--texto-desab)',padding:'1.5rem',fontSize:'0.72rem',letterSpacing:'0.06em'}}>[ NENHUMA MOVIMENTAÇÃO REGISTRADA ]</td></tr>
            ) : movsFiltradas.map(m=>(
              <tr key={m.id}>
                <td style={{fontWeight:600}}>{(Array.isArray(m.produtos) ? m.produtos[0]?.nome : (m.produtos as any)?.nome) || '—'}</td>
                <td><span style={{fontSize:'0.68rem',fontWeight:700,color:corMov[m.tipo]||'var(--texto-sec)',letterSpacing:'0.06em'}}>{tipoMov[m.tipo]||m.tipo}</span></td>
                <td style={{textAlign:'center',fontWeight:700,color:m.quantidade>0?'var(--verde)':'var(--vermelho)',fontVariantNumeric:'tabular-nums'}}>
                  {m.quantidade>0?'+':''}{m.quantidade}
                </td>
                <td style={{textAlign:'right',fontFamily:'monospace',fontSize:'0.75rem',color:'var(--texto-sec)'}}>
                  {m.custo_unitario ? formatCurrency(m.custo_unitario) : '—'}
                </td>
                <td style={{fontSize:'0.72rem',color:'var(--texto-desab)'}}>{m.obs||'—'}{m.nota_fiscal ? ` | NF: ${m.nota_fiscal}` : ''}</td>
                <td style={{fontSize:'0.68rem',color:'var(--texto-desab)',fontVariantNumeric:'tabular-nums'}}>
                  {new Date(m.criado_em).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de ajuste / entrada */}
      {showModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:'1rem'}}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="anim-pop" style={{width:'100%',maxWidth:'440px',background:'var(--surface)',border:'1px solid var(--borda-forte)',borderRadius:'2px'}}>

            {/* Header */}
            <div style={{padding:'0.75rem 1rem',borderBottom:`2px solid ${tipoModal==='entrada'?'var(--verde)':'var(--amarelo)'}`,display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--fundo-painel)'}}>
              <p style={{fontWeight:700,fontSize:'0.78rem',color:tipoModal==='entrada'?'var(--verde)':'var(--amarelo)',textTransform:'uppercase',letterSpacing:'0.06em'}}>
                {tipoModal==='entrada' ? '+ ENTRADA DE ESTOQUE' : '- AJUSTE DE ESTOQUE'}
              </p>
              <button onClick={()=>setShowModal(false)} className="btn-icon" style={{fontSize:'0.8rem'}}>✕</button>
            </div>

            <div style={{padding:'1rem',display:'flex',flexDirection:'column',gap:'0.75rem'}}>

              {/* Autocomplete produto */}
              <div style={{position:'relative'}}>
                <label className="campo-label">PRODUTO *</label>
                <div style={{position:'relative',marginTop:'0.25rem'}}>
                  <Search size={14} style={{position:'absolute',left:'0.625rem',top:'50%',transform:'translateY(-50%)',color:'var(--texto-desab)',pointerEvents:'none'}}/>
                  <input
                    className="campo"
                    style={{paddingLeft:'2rem'}}
                    placeholder="Buscar produto por nome ou SKU..."
                    value={produtoNome}
                    onChange={e => {
                      setProdutoNome(e.target.value)
                      setProdutoId('')
                      setShowSugs(true)
                    }}
                    onFocus={() => setShowSugs(true)}
                    onBlur={() => setTimeout(() => setShowSugs(false), 150)}
                  />
                </div>
                {showSugs && sugestoes.length > 0 && (
                  <div ref={sugsRef} style={{
                    position:'absolute',top:'100%',left:0,right:0,zIndex:50,
                    background:'var(--surface)',border:'1px solid var(--borda)',
                    borderRadius:'var(--radius-sm)',maxHeight:'160px',overflowY:'auto',
                    boxShadow:'0 4px 12px rgba(0,0,0,0.25)',marginTop:'2px'
                  }}>
                    {sugestoes.map(s => (
                      <div key={s.id} onMouseDown={() => selecionarProduto(s)}
                        style={{padding:'0.5rem 0.75rem',cursor:'pointer',fontSize:'0.78rem',borderBottom:'1px solid var(--borda-leve)',display:'flex',justifyContent:'space-between',alignItems:'center'}}
                        onMouseEnter={e => e.currentTarget.style.background='var(--surface-alt)'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        <div>
                          <span style={{fontWeight:600}}>{s.nome}</span>
                          {s.sku && <span style={{fontSize:'0.68rem',color:'var(--texto-desab)',marginLeft:'0.5rem'}}>#{s.sku}</span>}
                        </div>
                        <span style={{fontSize:'0.72rem',color:s.qtd_atual<=s.qtd_minima&&s.qtd_minima>0?'var(--vermelho)':'var(--verde)',fontWeight:700}}>
                          {s.qtd_atual} un
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Info do produto selecionado */}
              {produtoSelecionado && (
                <div style={{padding:'0.5rem 0.75rem',background:'var(--surface-alt)',border:'1px solid var(--borda)',borderRadius:'var(--radius-sm)',display:'flex',gap:'1.5rem',fontSize:'0.75rem'}}>
                  <span>Estoque atual: <strong style={{color:'var(--verde)'}}>{produtoSelecionado.qtd_atual} un</strong></span>
                  <span>Custo atual: <strong style={{color:'var(--azul)'}}>{formatCurrency(produtoSelecionado.preco_custo)}</strong></span>
                </div>
              )}

              <div style={{display:'grid',gridTemplateColumns: tipoModal==='entrada' ? '1fr 1fr' : '1fr',gap:'0.5rem'}}>
                <div>
                  <label className="campo-label">QUANTIDADE</label>
                  <input className="campo" type="number" min="1" style={{marginTop:'0.25rem',textAlign:'center',fontWeight:700,fontSize:'1rem'}}
                    value={quantidade} onChange={e=>setQuantidade(parseInt(e.target.value)||1)}/>
                </div>
                {tipoModal === 'entrada' && (
                  <div>
                    <label className="campo-label">CUSTO UNITÁRIO (R$)</label>
                    <input className="campo" type="number" min="0" step="0.01" style={{marginTop:'0.25rem',fontWeight:700}}
                      placeholder="0,00" value={custoUnit} onChange={e=>setCustoUnit(e.target.value)}/>
                  </div>
                )}
              </div>

              {/* Campos específicos por tipo */}
              {tipoModal === 'entrada' && (
                <div>
                  <label className="campo-label">NOTA FISCAL (opcional)</label>
                  <input className="campo" style={{marginTop:'0.25rem'}} placeholder="Ex: NF-12345"
                    value={notaFiscal} onChange={e=>setNotaFiscal(e.target.value)}/>
                </div>
              )}

              {tipoModal === 'ajuste' && (
                <div>
                  <label className="campo-label">MOTIVO DA SAÍDA *</label>
                  <select className="campo" style={{marginTop:'0.25rem'}} value={motivo} onChange={e=>setMotivo(e.target.value)}>
                    {MOTIVOS_AJUSTE.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              )}

              {/* Resumo para entrada */}
              {tipoModal === 'entrada' && custoUnit && parseFloat(custoUnit) > 0 && (
                <div style={{padding:'0.5rem 0.75rem',background:'var(--surface-alt)',border:'1px solid var(--borda)',borderRadius:'var(--radius-sm)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:'0.78rem',color:'var(--texto-sec)',fontWeight:700}}>Total desta entrada:</span>
                  <span style={{fontSize:'0.9rem',fontWeight:900,color:'var(--verde)',fontFamily:'monospace'}}>
                    {formatCurrency(quantidade * parseFloat(custoUnit))}
                  </span>
                </div>
              )}

              {/* Aviso para entrada com novo custo */}
              {tipoModal === 'entrada' && custoUnit && produtoSelecionado && parseFloat(custoUnit) !== produtoSelecionado.preco_custo && parseFloat(custoUnit) > 0 && (
                <div className="alerta alerta-info" style={{fontSize:'0.72rem',padding:'0.375rem 0.625rem'}}>
                  ℹ️ O custo do produto será atualizado de {formatCurrency(produtoSelecionado.preco_custo)} → {formatCurrency(parseFloat(custoUnit))}
                </div>
              )}

              <div>
                <label className="campo-label">OBSERVAÇÃO ADICIONAL</label>
                <input className="campo" style={{marginTop:'0.25rem'}} placeholder="Ex: Compra do fornecedor ABC..."
                  value={obs} onChange={e=>setObs(e.target.value)}/>
              </div>

              <div style={{display:'flex',gap:'0.375rem',justifyContent:'flex-end'}}>
                <button onClick={()=>setShowModal(false)} className="btn btn-secondary">CANCELAR</button>
                <button onClick={salvarAjuste} className="btn btn-primary" disabled={!produtoId||salvando}
                  style={{display:'flex',alignItems:'center',gap:'0.375rem'}}>
                  {salvando ? <Loader2 size={14} style={{animation:'spin 1s linear infinite'}}/> : null}
                  ▶ CONFIRMAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
