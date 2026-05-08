'use client'
import { useEffect, useState } from 'react'
import { Save, Loader2, Plus, X } from 'lucide-react'
import { generateSKU } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'

type Categoria = { id: string; nome: string }

const SECAO = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
    <p style={{ fontWeight:800, fontSize:'0.85rem', color:'var(--texto-desab)', textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:'1px solid var(--borda)', paddingBottom:'0.375rem' }}>{titulo}</p>
    {children}
  </div>
)

const Campo = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:'0.375rem' }}>
    <label style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--texto-sec)' }}>
      {label}{required && <span style={{ color:'var(--vermelho)', marginLeft:'2px' }}>*</span>}
    </label>
    {children}
  </div>
)

export function FormProduto({ onSuccess, onCancel }: { onSuccess: () => void; onCancel?: () => void }) {
  const { empresaId } = useEmpresaId()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [salvando,   setSalvando]   = useState(false)
  const [erro,       setErro]       = useState<string|null>(null)

  // Criar Categoria Inline
  const [showNovaCat, setShowNovaCat] = useState(false)
  const [novaCatNome, setNovaCatNome] = useState('')
  const [salvandoCat, setSalvandoCat] = useState(false)

  // Campos controlados
  const [nome,         setNome]         = useState('')
  const [sku,          setSku]          = useState(generateSKU())
  const [codigoBarras, setCodigoBarras] = useState('')
  const [descricao,    setDescricao]    = useState('')
  const [categoria,    setCategoria]    = useState('')
  const [custo,        setCusto]        = useState('')
  const [varejo,       setVarejo]       = useState('')
  const [atacado,      setAtacado]      = useState('')
  const [vip,          setVip]          = useState('')
  const [minimo,       setMinimo]       = useState('')
  const [qtdAtual,     setQtdAtual]     = useState('0')
  const [qtdMin,       setQtdMin]       = useState('0')
  const [qtdMax,       setQtdMax]       = useState('')
  const [qtdMinAtacado,setQtdMinAtacado]= useState('')
  const [localizacao,  setLocalizacao]  = useState('')
  const [podeBrinde,   setPodeBrinde]   = useState(false)
  const [temSerie,     setTemSerie]     = useState(false)
  const [ativoCatalogo,setAtivoCatalogo]= useState(true)
  const [destaque,     setDestaque]     = useState(false)
  const [temGarantia,  setTemGarantia]  = useState(false)
  const [diasGarantia, setDiasGarantia] = useState('')
  const [textoGarantia,setTextoGarantia]= useState('')

  const custoN  = parseFloat(custo.replace(',','.'))  || 0
  const varejoN = parseFloat(varejo.replace(',','.')) || 0
  const margem  = varejoN > 0 ? ((varejoN - custoN) / varejoN * 100).toFixed(1) : '0.0'

  useEffect(() => {
    if (!empresaId) return
    carregarCategorias(empresaId)
  }, [empresaId])

  async function carregarCategorias(eid: string) {
    const { data } = await createClient()
      .from('categorias_produto')
      .select('id,nome')
      .eq('empresa_id', eid)
      .order('nome')
    setCategorias(data || [])
  }

  async function criarCategoria() {
    if (!novaCatNome.trim() || !empresaId) return
    setSalvandoCat(true)
    const { data, error } = await createClient()
      .from('categorias_produto')
      .insert({ empresa_id: empresaId, nome: novaCatNome.trim() })
      .select().single()
    setSalvandoCat(false)
    if (!error && data) {
      setCategorias(prev => [...prev, data].sort((a,b)=>a.nome.localeCompare(b.nome)))
      setCategoria(data.nome)
      setShowNovaCat(false)
      setNovaCatNome('')
    } else {
      alert('Erro ao criar categoria: ' + (error?.message || ''))
    }
  }

  async function salvar() {
    setErro(null)
    if (!nome.trim())  { setErro('O nome do produto é obrigatório.'); return }
    if (varejoN <= 0)  { setErro('Informe o preço de venda (varejo).'); return }
    if (!empresaId)    { setErro('Erro ao identificar sua empresa.'); return }
    setSalvando(true)
    const { error } = await createClient().from('produtos').insert({
      empresa_id:   empresaId,
      nome:         nome.trim(),
      sku:          sku || null,
      codigo_barras:codigoBarras || null,
      descricao:    descricao || null,
      categoria:    categoria || null,
      preco_custo:  custoN || null,
      preco_varejo: varejoN,
      preco_atacado:parseFloat(atacado.replace(',','.'))  || null,
      preco_vip:    parseFloat(vip.replace(',','.'))      || null,
      preco_minimo: parseFloat(minimo.replace(',','.'))   || null,
      qtd_atual:    parseInt(qtdAtual)   || 0,
      qtd_minima:   parseInt(qtdMin)     || 0,
      qtd_maxima:   parseInt(qtdMax)     || null,
      qtd_min_atacado: parseInt(qtdMinAtacado) || null,
      localizacao:  localizacao || null,
      pode_ser_brinde: podeBrinde,
      tem_serie:    temSerie,
      ativo_catalogo:  ativoCatalogo,
      destaque:     destaque,
      tem_garantia: temGarantia,
      dias_garantia:temGarantia ? parseInt(diasGarantia) || null : null,
      texto_garantia:temGarantia ? textoGarantia || null : null,
      ativo:        true,
    })
    setSalvando(false)
    if (error) { setErro('Erro ao salvar: ' + error.message); return }
    onSuccess()
  }

  const toggle = (val: boolean, setter: (v:boolean)=>void) => (
    <button type="button" onClick={() => setter(!val)}
      style={{ width:'44px', height:'24px', borderRadius:'12px', border:'none', cursor:'pointer',
        background: val ? 'var(--verde)' : 'var(--borda)', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
      <span style={{ position:'absolute', top:'2px', left: val?'22px':'2px', width:'20px', height:'20px',
        borderRadius:'50%', background:'#fff', transition:'left 0.2s', display:'block' }}/>
    </button>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
      {erro && <div className="alerta alerta-perigo">{erro}</div>}

      {/* Cálculo de margem */}
      {varejoN > 0 && custoN > 0 && (
        <div style={{ display:'flex', gap:'0.75rem', padding:'0.625rem 1rem', background:'var(--verde-claro)', border:'1px solid var(--verde-borda)', borderRadius:'var(--radius-sm)', alignItems:'center' }}>
          <span style={{ fontWeight:700, color:'var(--verde-esc)', fontSize:'0.82rem' }}>📊 Margem de lucro:</span>
          <span style={{ fontWeight:900, color:'var(--verde-esc)', fontFamily:'monospace', fontSize:'1rem' }}>{margem}%</span>
          <span style={{ fontSize:'0.75rem', color:'var(--verde-esc)' }}>sobre o preço de venda</span>
        </div>
      )}

      {/* ── Identificação ── */}
      <SECAO titulo="📦 Identificação">
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:'0.75rem' }}>
          <Campo label="Nome do Produto" required>
            <input className="campo" value={nome} onChange={e=>setNome(e.target.value)} placeholder="Ex: Som JBL Stage 200"/>
          </Campo>
          <Campo label="SKU (Código interno)">
            <input className="campo" value={sku} onChange={e=>setSku(e.target.value)} style={{ minWidth:'130px' }}/>
          </Campo>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
          <Campo label="Código de Barras (EAN/ISBN)">
            <input className="campo" value={codigoBarras} onChange={e=>setCodigoBarras(e.target.value)} placeholder="Ex: 7891234567890"/>
          </Campo>
          <Campo label="Categoria">
            {showNovaCat ? (
              <div style={{ display:'flex', gap:'0.375rem' }}>
                <input autoFocus className="campo" style={{ flex:1 }} placeholder="Nome da nova categoria" value={novaCatNome} onChange={e=>setNovaCatNome(e.target.value)} onKeyDown={e=>e.key==='Enter'&&criarCategoria()}/>
                <button type="button" onClick={criarCategoria} disabled={salvandoCat||!novaCatNome.trim()} className="btn btn-primary" style={{ padding:'0 0.75rem' }}>{salvandoCat?<Loader2 size={14} style={{animation:'spin 1s linear infinite'}}/>:'Salvar'}</button>
                <button type="button" onClick={()=>setShowNovaCat(false)} className="btn btn-secondary" style={{ padding:'0 0.5rem' }}><X size={14}/></button>
              </div>
            ) : (
              <div style={{ display:'flex', gap:'0.375rem' }}>
                <select className="campo" style={{ flex:1 }} value={categoria} onChange={e=>setCategoria(e.target.value)}>
                  <option value="">— Selecionar —</option>
                  {categorias.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                </select>
                <button type="button" onClick={()=>setShowNovaCat(true)} className="btn btn-secondary" style={{ padding:'0 0.625rem', display:'flex', alignItems:'center', gap:'0.25rem' }} title="Criar nova categoria">
                  <Plus size={14}/> Nova
                </button>
              </div>
            )}
          </Campo>
        </div>
        <Campo label="Descrição">
          <textarea className="campo" rows={3} value={descricao} onChange={e=>setDescricao(e.target.value)}
            placeholder="Descreva o produto, especificações, detalhes importantes..." style={{ resize:'vertical', minHeight:'80px' }}/>
        </Campo>
      </SECAO>

      {/* ── Preços ── */}
      <SECAO titulo="💰 Preços">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.75rem' }}>
          <Campo label="Preço de Custo (R$)">
            <input className="campo" type="number" min="0" step="0.01" value={custo} onChange={e=>setCusto(e.target.value)} placeholder="0,00"/>
          </Campo>
          <Campo label="Preço Varejo (R$)" required>
            <input className="campo" type="number" min="0" step="0.01" value={varejo} onChange={e=>setVarejo(e.target.value)} placeholder="0,00"/>
          </Campo>
          <Campo label="Preço Mínimo PDV (R$)">
            <input className="campo" type="number" min="0" step="0.01" value={minimo} onChange={e=>setMinimo(e.target.value)} placeholder="Piso de desconto"/>
          </Campo>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
          <Campo label="Preço Atacado (R$)">
            <input className="campo" type="number" min="0" step="0.01" value={atacado} onChange={e=>setAtacado(e.target.value)} placeholder="Para clientes atacado"/>
          </Campo>
          <Campo label="Preço VIP (R$)">
            <input className="campo" type="number" min="0" step="0.01" value={vip} onChange={e=>setVip(e.target.value)} placeholder="Para clientes VIP"/>
          </Campo>
        </div>
      </SECAO>

      {/* ── Estoque ── */}
      <SECAO titulo="📊 Estoque e Localização">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'0.75rem' }}>
          <Campo label="Qtd Atual">
            <input className="campo" type="number" min="0" value={qtdAtual} onChange={e=>setQtdAtual(e.target.value)} placeholder="0"/>
          </Campo>
          <Campo label="Qtd Mínima (alerta)">
            <input className="campo" type="number" min="0" value={qtdMin} onChange={e=>setQtdMin(e.target.value)} placeholder="0"/>
          </Campo>
          <Campo label="Qtd Máxima">
            <input className="campo" type="number" min="0" value={qtdMax} onChange={e=>setQtdMax(e.target.value)} placeholder="Opcional"/>
          </Campo>
          <Campo label="Qtd Mín p/ Atacado">
            <input className="campo" type="number" min="0" value={qtdMinAtacado} onChange={e=>setQtdMinAtacado(e.target.value)} placeholder="Ex: 5"/>
          </Campo>
        </div>
        <Campo label="Localização no estoque">
          <input className="campo" value={localizacao} onChange={e=>setLocalizacao(e.target.value)} placeholder="Ex: Prateleira A3, Gaveta 2..."/>
        </Campo>
      </SECAO>

      {/* ── Opções ── */}
      <SECAO titulo="⚙️ Opções do Produto">
        {[
          { label:'Pode ser usado como brinde', desc:'Permite dar como brinde em vendas', val:podeBrinde, setter:setPodeBrinde },
          { label:'Rastrear número de série', desc:'Solicita nº de série ao vender', val:temSerie, setter:setTemSerie },
          { label:'Visível no catálogo online', desc:'Aparece no link público da loja', val:ativoCatalogo, setter:setAtivoCatalogo },
          { label:'Produto em destaque', desc:'Aparece em primeiro no catálogo', val:destaque, setter:setDestaque },
        ].map(op => (
          <div key={op.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.5rem 0', borderBottom:'1px solid var(--borda-leve)' }}>
            <div>
              <p style={{ fontWeight:600, fontSize:'0.875rem' }}>{op.label}</p>
              <p style={{ fontSize:'0.75rem', color:'var(--texto-desab)', marginTop:'1px' }}>{op.desc}</p>
            </div>
            {toggle(op.val, op.setter)}
          </div>
        ))}
      </SECAO>

      {/* ── Garantia ── */}
      <SECAO titulo="🛡️ Garantia">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.5rem 0' }}>
          <div>
            <p style={{ fontWeight:600, fontSize:'0.875rem' }}>Este produto tem garantia</p>
            <p style={{ fontSize:'0.75rem', color:'var(--texto-desab)', marginTop:'1px' }}>Será gerado registro de garantia a cada venda</p>
          </div>
          {toggle(temGarantia, setTemGarantia)}
        </div>
        {temGarantia && (
          <div style={{ display:'grid', gridTemplateColumns:'120px 1fr', gap:'0.75rem', marginTop:'0.5rem', padding:'0.75rem', background:'var(--surface-alt)', borderRadius:'var(--radius-sm)', border:'1px solid var(--borda)' }}>
            <Campo label="Dias" required>
              <input className="campo" type="number" min="1" value={diasGarantia} onChange={e=>setDiasGarantia(e.target.value)} placeholder="Ex: 90"/>
            </Campo>
            <Campo label="Termos da garantia (opcional)">
              <input className="campo" value={textoGarantia} onChange={e=>setTextoGarantia(e.target.value)} placeholder="Ex: Cobre defeitos de fábrica, não cobre mau uso."/>
            </Campo>
          </div>
        )}
      </SECAO>

      {/* ── Botões Finais ── */}
      <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.5rem', marginTop:'1rem' }}>
        {onCancel && <button type="button" onClick={onCancel} className="btn btn-ghost">Cancelar</button>}
        <button type="button" onClick={salvar} disabled={salvando} className="btn btn-primary" style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
          {salvando ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> : <Save size={14}/>}
          Salvar Produto
        </button>
      </div>
    </div>
  )
}
