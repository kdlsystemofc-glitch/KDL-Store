'use client'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { ArrowLeft, Save, Loader2, Trash2, X } from 'lucide-react'

type Categoria = { id: string; nome: string }

type Produto = {
  id:string; nome:string; sku:string|null; codigo_barras:string|null; categoria:string|null; descricao:string|null
  preco_custo:number|null; preco_varejo:number; preco_atacado:number|null; preco_vip:number|null; preco_minimo:number|null
  qtd_atual:number; qtd_minima:number; qtd_maxima:number|null; qtd_min_atacado:number|null; localizacao:string|null
  pode_ser_brinde:boolean; tem_serie:boolean; ativo_catalogo:boolean; destaque:boolean
  tem_garantia:boolean; dias_garantia:number|null; texto_garantia:string|null; ativo:boolean; imagem_url:string|null; fornecedor_id:string|null
}

const SECAO = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
    <p style={{ fontWeight:800, fontSize:'0.85rem', color:'var(--texto-desab)', textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:'1px solid var(--borda)', paddingBottom:'0.375rem' }}>{titulo}</p>
    {children}
  </div>
)

const Campo = ({ label, required, dica, children }: { label: string; required?: boolean; dica?: string; children: React.ReactNode }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:'0.25rem' }}>
    <label style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--texto-sec)' }}>
      {label}{required && <span style={{ color:'var(--vermelho)', marginLeft:'2px' }}>*</span>}
    </label>
    {children}
    {dica && <span style={{ fontSize:'0.7rem', color:'var(--texto-desab)', fontWeight:400, lineHeight:1.25, marginTop:'1px' }}>{dica}</span>}
  </div>
)

export default function EditarProdutoPage() {
  const router = useRouter()
  const params = useParams()
  const id     = params.id as string
  const { empresaId } = useEmpresaId()

  const [produto,    setProduto]    = useState<Produto|null>(null)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [fornecedores, setFornecedores] = useState<{ id: string; nome: string }[]>([])
  const [loading,    setLoading]    = useState(true)
  const [salvando,   setSalvando]   = useState(false)
  const [erro,       setErro]       = useState<string|null>(null)
  const [imagemFile, setImagemFile] = useState<File|null>(null)
  const [imagemPreview, setImagemPreview] = useState<string|null>(null)

  useEffect(() => {
    if (id && empresaId) carregar(id, empresaId)
  }, [id, empresaId])

  async function carregar(pid: string, eid: string) {
    const supabase = createClient()
    const results = await Promise.allSettled([
      supabase.from('produtos').select('*').eq('id', pid).single(),
      supabase.from('categorias_produto').select('id,nome').eq('empresa_id', eid).order('nome'),
      supabase.from('fornecedores').select('id,nome').eq('empresa_id', eid).eq('ativo', true).order('nome')
    ])
    const getRes = (i: number): any => results[i].status === 'fulfilled' ? (results[i] as PromiseFulfilledResult<any>).value || {} : {}
    const { data: prod, error } = getRes(0)
    const { data: cats }        = getRes(1)
    const { data: forns }       = getRes(2)
    if (error || !prod) { setErro('Produto não encontrado.'); setLoading(false); return }
    setProduto(prod)
    if (prod.imagem_url) setImagemPreview(prod.imagem_url)
    setCategorias(cats || [])
    setFornecedores(forns || [])
    setLoading(false)
  }

  async function salvar() {
    if (!produto) return
    setErro(null)
    if (!produto.nome.trim()) { setErro('O nome é obrigatório.'); return }
    if (produto.preco_varejo <= 0) { setErro('Informe o preço de venda (varejo).'); return }
    setSalvando(true)

    if (produto.sku && produto.sku.trim() !== '') {
      const { data: skuExistente } = await createClient()
        .from('produtos')
        .select('id')
        .eq('empresa_id', empresaId)
        .eq('sku', produto.sku.trim())
        .neq('id', produto.id)
        .maybeSingle()
      if (skuExistente) {
        setErro('Esse SKU já está em uso por outro produto na sua loja.')
        setSalvando(false)
        return
      }
    }

    let final_imagem_url = produto.imagem_url || null
    if (imagemFile) {
      if (imagemFile.size > 2 * 1024 * 1024) { setErro('A imagem não pode ter mais que 2MB.'); setSalvando(false); return }
      const ext = imagemFile.name.split('.').pop()
      const path = `${empresaId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`
      const supabase = createClient()
      const { error: upErr } = await supabase.storage.from('produtos').upload(path, imagemFile, { upsert: true })
      if (upErr) { setErro('Erro no upload: ' + upErr.message); setSalvando(false); return }
      const { data: urlData } = supabase.storage.from('produtos').getPublicUrl(path)
      final_imagem_url = urlData.publicUrl
      
      if (produto.imagem_url && produto.imagem_url.includes('produtos/')) {
        const oldPath = produto.imagem_url.split('/produtos/')[1]
        if (oldPath) await supabase.storage.from('produtos').remove([oldPath])
      }
    } else if (imagemPreview === null && produto.imagem_url) {
      final_imagem_url = null
      const supabase = createClient()
      if (produto.imagem_url.includes('produtos/')) {
        const oldPath = produto.imagem_url.split('/produtos/')[1]
        if (oldPath) await supabase.storage.from('produtos').remove([oldPath])
      }
    }

    const { error } = await createClient().from('produtos').update({
      nome: produto.nome.trim(),
      sku: produto.sku || null,
      codigo_barras: produto.codigo_barras || null,
      descricao: produto.descricao || null,
      categoria: produto.categoria || null,
      fornecedor_id: produto.fornecedor_id || null,
      preco_custo: produto.preco_custo || null,
      preco_varejo: produto.preco_varejo,
      preco_atacado: produto.preco_atacado || null,
      preco_vip: produto.preco_vip || null,
      preco_minimo: produto.preco_minimo || null,
      qtd_minima: produto.qtd_minima || 0,
      qtd_maxima: produto.qtd_maxima || null,
      qtd_min_atacado: produto.qtd_min_atacado || null,
      localizacao: produto.localizacao || null,
      pode_ser_brinde: produto.pode_ser_brinde,
      tem_serie: produto.tem_serie,
      ativo_catalogo: produto.ativo_catalogo,
      destaque: produto.destaque,
      tem_garantia: produto.tem_garantia,
      dias_garantia: produto.tem_garantia ? produto.dias_garantia || null : null,
      texto_garantia: produto.tem_garantia ? produto.texto_garantia || null : null,
      imagem_url: final_imagem_url,
      ativo: produto.ativo,
    }).eq('id', id)
    setSalvando(false)
    if (error) { setErro('Erro ao salvar: ' + error.message); return }
    toast.success('Produto atualizado com sucesso!')
    router.push('/produtos')
  }

  async function excluir() {
    if (!confirm(`Excluir o produto "${produto?.nome}"? Esta ação não pode ser desfeita.`)) return
    const { error } = await createClient().from('produtos').delete().eq('id', id)
    if (error) {
      toast.error('Erro ao excluir produto: ' + error.message)
    } else {
      toast.success('Produto excluído com sucesso!')
      router.push('/produtos')
    }
  }

  const set = (field: keyof Produto, val: unknown) => setProduto(p => p ? { ...p, [field]: val } : p)
  const margem = produto && produto.preco_varejo > 0 && (produto.preco_custo||0) > 0
    ? (((produto.preco_varejo - produto.preco_custo!) / produto.preco_varejo) * 100).toFixed(1)
    : '0.0'

  const toggle = (val: boolean, setter: (v:boolean)=>void) => (
    <button type="button" onClick={() => setter(!val)}
      style={{ width:'44px', height:'24px', borderRadius:'12px', border:'none', cursor:'pointer',
        background: val ? 'var(--verde)' : 'var(--borda)', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
      <span style={{ position:'absolute', top:'2px', left: val?'22px':'2px', width:'20px', height:'20px',
        borderRadius:'50%', background:'#fff', transition:'left 0.2s', display:'block' }}/>
    </button>
  )

  if (loading) return (
    <div className="anim-fade" style={{ display:'flex', flexDirection:'column', gap:'1rem', maxWidth:'800px' }}>
      <div className="pg-header">
        <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
          <div style={{ width:'24px', height:'24px', borderRadius:'4px' }} className="skeleton" />
          <div>
            <div style={{ width:'140px', height:'20px', marginBottom:'6px', borderRadius:'4px' }} className="skeleton" />
            <div style={{ width:'220px', height:'12px', borderRadius:'4px' }} className="skeleton" />
          </div>
        </div>
      </div>

      <div className="card" style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
        {/* Imagem do Produto Skeleton */}
        <div>
          <div style={{ width:'120px', height:'14px', marginBottom:'0.75rem', borderRadius:'4px' }} className="skeleton" />
          <div style={{ display:'flex', gap:'1rem', alignItems:'center' }}>
            <div style={{ width:'100px', height:'100px', borderRadius:'8px' }} className="skeleton" />
            <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
              <div style={{ width:'120px', height:'32px', borderRadius:'4px' }} className="skeleton" />
              <div style={{ width:'200px', height:'12px', borderRadius:'4px' }} className="skeleton" />
            </div>
          </div>
        </div>

        {/* Identificação Skeleton */}
        <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', marginTop:'0.5rem' }}>
          <div style={{ width:'100px', height:'14px', marginBottom:'0.25rem', borderRadius:'4px' }} className="skeleton" />
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:'0.75rem' }}>
            <div style={{ height:'36px', borderRadius:'4px' }} className="skeleton" />
            <div style={{ width:'130px', height:'36px', borderRadius:'4px' }} className="skeleton" />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            <div style={{ height:'36px', borderRadius:'4px' }} className="skeleton" />
            <div style={{ height:'36px', borderRadius:'4px' }} className="skeleton" />
          </div>
        </div>

        {/* Preços Skeleton */}
        <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', marginTop:'0.5rem' }}>
          <div style={{ width:'80px', height:'14px', marginBottom:'0.25rem', borderRadius:'4px' }} className="skeleton" />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'0.75rem' }}>
            <div style={{ height:'36px', borderRadius:'4px' }} className="skeleton" />
            <div style={{ height:'36px', borderRadius:'4px' }} className="skeleton" />
            <div style={{ height:'36px', borderRadius:'4px' }} className="skeleton" />
          </div>
        </div>
      </div>
    </div>
  )
  if (!produto) return <div className="alerta alerta-perigo">{erro||'Produto não encontrado.'}</div>

  return (
    <div className="anim-fade" style={{ display:'flex', flexDirection:'column', gap:'1rem', maxWidth:'800px' }}>
      <div className="pg-header">
        <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
          <Link href="/produtos" style={{ color:'var(--texto-desab)', display:'flex' }}><ArrowLeft size={18}/></Link>
          <div>
            <h1 className="pg-titulo">✏️ Editar Produto</h1>
            <p className="pg-sub">{produto.nome}</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          <button onClick={excluir} className="btn btn-secondary" style={{ color:'var(--vermelho)', display:'flex', alignItems:'center', gap:'0.375rem' }}>
            <Trash2 size={14}/> Excluir
          </button>
          <button onClick={salvar} disabled={salvando} className="btn btn-primary" style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
            {salvando ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> : <Save size={14}/>}
            Salvar
          </button>
        </div>
      </div>

      {erro && <div className="alerta alerta-perigo">{erro}</div>}

      <label style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.75rem', background:'var(--surface)', border:'1px solid var(--borda)', borderRadius:'var(--radius)', cursor:'pointer' }}>
        <input type="checkbox" checked={produto.ativo} onChange={e=>set('ativo', e.target.checked)} style={{ width:'16px', height:'16px', accentColor:'var(--verde)' }}/>
        <div>
          <p style={{ fontWeight:700 }}>Produto ativo no sistema</p>
          <p style={{ fontSize:'0.75rem', color:'var(--texto-desab)' }}>Se inativo, não aparecerá para venda no PDV</p>
        </div>
      </label>

      {/* Cálculo de margem */}
      {produto.preco_varejo > 0 && (produto.preco_custo||0) > 0 && (
        <div style={{ display:'flex', gap:'0.75rem', padding:'0.625rem 1rem', background:'var(--verde-claro)', border:'1px solid var(--verde-borda)', borderRadius:'var(--radius-sm)', alignItems:'center' }}>
          <span style={{ fontWeight:700, color:'var(--verde-esc)', fontSize:'0.82rem' }}>📊 Margem de lucro atual:</span>
          <span style={{ fontWeight:900, color:'var(--verde-esc)', fontFamily:'monospace', fontSize:'1rem' }}>{margem}%</span>
          <span style={{ fontSize:'0.75rem', color:'var(--verde-esc)' }}>sobre o preço de venda</span>
        </div>
      )}

      <div className="card" style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>

        <SECAO titulo="📸 Imagem do Produto">
          <div style={{ display:'flex', gap:'1rem', alignItems:'flex-start' }}>
            <div style={{ width:'100px', height:'100px', border:'1px dashed var(--borda-forte)', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', background:'var(--surface-alt)', position:'relative' }}>
              {imagemPreview ? (
                <>
                  <img src={imagemPreview} alt="Preview" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  <button type="button" onClick={()=>{setImagemFile(null);setImagemPreview(null)}} style={{ position:'absolute', top:'4px', right:'4px', background:'rgba(0,0,0,0.6)', color:'#fff', border:'none', borderRadius:'50%', padding:'4px', cursor:'pointer' }}><X size={12}/></button>
                </>
              ) : (
                <span style={{ fontSize:'2rem', opacity:0.3 }}>📦</span>
              )}
            </div>
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'0.5rem' }}>
              <label className="btn btn-secondary" style={{ alignSelf:'flex-start', cursor:'pointer', padding:'0.5rem 1rem', fontSize:'0.78rem' }}>
                Selecionar Imagem
                <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display:'none' }} onChange={e=>{
                  const f = e.target.files?.[0]
                  if (!f) return
                  if (f.size > 2 * 1024 * 1024) { toast.error('A imagem deve ter no máximo 2MB.'); return }
                  setImagemFile(f)
                  const reader = new FileReader()
                  reader.onload = ev => setImagemPreview(ev.target?.result as string)
                  reader.readAsDataURL(f)
                  e.target.value = ''
                }}/>
              </label>
              <p style={{ fontSize:'0.75rem', color:'var(--texto-desab)' }}>Formatos: JPG, PNG, WEBP. Máx 2MB.<br/>Aparece no catálogo público e pdv.</p>
            </div>
          </div>
        </SECAO>

        {/* ── Identificação ── */}
        <SECAO titulo="📦 Identificação">
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:'0.75rem' }}>
            <Campo label="Nome do Produto" required>
              <input className="campo" value={produto.nome} onChange={e=>set('nome', e.target.value)}/>
            </Campo>
            <Campo label="SKU (Código interno)" dica="Código único de controle interno (ex: CAM-VER-G).">
              <input className="campo" value={produto.sku || ''} onChange={e=>set('sku', e.target.value)} style={{ minWidth:'130px' }}/>
            </Campo>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            <Campo label="Código de Barras (EAN/ISBN)" dica="Código de barras numérico para leitura rápida no PDV.">
              <input className="campo" value={produto.codigo_barras || ''} onChange={e=>set('codigo_barras', e.target.value)}/>
            </Campo>
            <Campo label="Categoria">
              <select className="campo" value={produto.categoria || ''} onChange={e=>set('categoria', e.target.value)}>
                <option value="">— Selecionar —</option>
                {categorias.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
              </select>
            </Campo>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            <Campo label="Fornecedor Vinculado">
              <select className="campo" value={produto.fornecedor_id || ''} onChange={e=>set('fornecedor_id', e.target.value || null)}>
                <option value="">— Nenhum —</option>
                {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
            </Campo>
            <div style={{}} />
          </div>
          <Campo label="Descrição">
            <textarea className="campo" rows={3} value={produto.descricao || ''} onChange={e=>set('descricao', e.target.value)}
              style={{ resize:'vertical', minHeight:'80px' }}/>
          </Campo>
        </SECAO>

        {/* ── Preços ── */}
        <SECAO titulo="💰 Preços">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.75rem' }}>
            <Campo label="Preço de Custo (R$)">
              <input className="campo" type="number" min="0" step="0.01" value={produto.preco_custo || ''} onChange={e=>set('preco_custo', parseFloat(e.target.value))} placeholder="0,00"/>
            </Campo>
            <Campo label="Preço Varejo (R$)" required>
              <input className="campo" type="number" min="0" step="0.01" value={produto.preco_varejo || ''} onChange={e=>set('preco_varejo', parseFloat(e.target.value))} placeholder="0,00"/>
            </Campo>
            <Campo label="Preço Mínimo PDV (R$)" dica="Menor preço que o vendedor pode praticar após descontos.">
              <input className="campo" type="number" min="0" step="0.01" value={produto.preco_minimo || ''} onChange={e=>set('preco_minimo', parseFloat(e.target.value))} placeholder="0,00"/>
            </Campo>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            <Campo label="Preço Atacado (R$)" dica="Preço aplicado para compras em grandes volumes.">
              <input className="campo" type="number" min="0" step="0.01" value={produto.preco_atacado || ''} onChange={e=>set('preco_atacado', parseFloat(e.target.value))} placeholder="0,00"/>
            </Campo>
            <Campo label="Preço VIP (R$)" dica="Preço especial voltado para clientes cadastrados como VIP.">
              <input className="campo" type="number" min="0" step="0.01" value={produto.preco_vip || ''} onChange={e=>set('preco_vip', parseFloat(e.target.value))} placeholder="0,00"/>
            </Campo>
          </div>
        </SECAO>

        {/* ── Estoque ── */}
        <SECAO titulo="📊 Estoque e Localização">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'0.75rem' }}>
            <Campo label="Qtd Atual (Somente leitura)">
              <input
                className="campo"
                type="text"
                readOnly
                disabled
                value={produto.qtd_atual}
                style={{
                  textAlign: 'center',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  cursor: 'not-allowed',
                  background: 'var(--surface-alt)',
                  color: 'var(--texto-sec)'
                }}
              />
            </Campo>
            <Campo label="Qtd Mínima (alerta)" dica="Nível mínimo para disparar alertas de reposição de estoque.">
              <input className="campo" type="number" min="0" value={produto.qtd_minima} onChange={e=>set('qtd_minima', parseInt(e.target.value))}/>
            </Campo>
            <Campo label="Qtd Máxima" dica="Quantidade máxima ideal sugerida para armazenamento.">
              <input className="campo" type="number" min="0" value={produto.qtd_maxima || ''} onChange={e=>set('qtd_maxima', parseInt(e.target.value))}/>
            </Campo>
            <Campo label="Qtd Mín p/ Atacado" dica="Mínimo de itens no carrinho para ativar o Preço de Atacado.">
              <input className="campo" type="number" min="0" value={produto.qtd_min_atacado || ''} onChange={e=>set('qtd_min_atacado', parseInt(e.target.value))}/>
            </Campo>
          </div>
          <Campo label="Localização no estoque">
            <input className="campo" value={produto.localizacao || ''} onChange={e=>set('localizacao', e.target.value)}/>
          </Campo>
        </SECAO>

        {/* ── Opções ── */}
        <SECAO titulo="⚙️ Opções do Produto">
          {[
            { label:'Pode ser usado como brinde', desc:'Permite dar como brinde em vendas', val:produto.pode_ser_brinde, setter:(v:boolean)=>set('pode_ser_brinde',v) },
            { label:'Rastrear número de série', desc:'Solicita nº de série ao vender', val:produto.tem_serie, setter:(v:boolean)=>set('tem_serie',v) },
            { label:'Visível no catálogo online', desc:'Aparece no link público da loja', val:produto.ativo_catalogo, setter:(v:boolean)=>set('ativo_catalogo',v) },
            { label:'Produto em destaque', desc:'Aparece em primeiro no catálogo', val:produto.destaque, setter:(v:boolean)=>set('destaque',v) },
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
            {toggle(produto.tem_garantia, (v)=>set('tem_garantia',v))}
          </div>
          {produto.tem_garantia && (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', padding:'0.875rem', background:'var(--surface-alt)', borderRadius:'var(--radius-sm)', border:'1px solid var(--borda-leve)' }}>
              <Campo label="Prazo da garantia (dias)" required>
                <input className="campo" type="number" min="1" value={produto.dias_garantia || ''} onChange={e=>set('dias_garantia', parseInt(e.target.value))} placeholder="Ex: 90"/>
              </Campo>
              <Campo label="Texto da garantia (impresso no recibo)">
                <textarea className="campo" rows={2} value={produto.texto_garantia || ''} onChange={e=>set('texto_garantia', e.target.value)}
                  style={{ resize:'vertical' }}/>
              </Campo>
            </div>
          )}
        </SECAO>

      </div>

      <div style={{ display:'flex', gap:'0.5rem', justifyContent:'flex-end' }}>
        <Link href="/produtos" className="btn btn-ghost">Cancelar</Link>
        <button onClick={salvar} disabled={salvando} className="btn btn-primary" style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
          {salvando ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> : <Save size={14}/>}
          Salvar Alterações
        </button>
      </div>
    </div>
  )
}
