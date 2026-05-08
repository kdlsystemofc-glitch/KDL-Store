'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { formatCurrency } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { PageTabs } from '@/components/PageTabs'

type Produto = { id:string; nome:string; categoria:string|null; preco_varejo:number; preco_atacado:number|null; preco_vip:number|null; ativo_catalogo:boolean|null; destaque:boolean|null; preco_catalogo:string|null }

export default function CatalogoPage() {
  const { empresaId } = useEmpresaId()
  const [produtos,  setProdutos]  = useState<Produto[]>([])
  const [empresa,   setEmpresa]   = useState<{nome:string;whatsapp:string|null;cidade:string|null}>({nome:'',whatsapp:null,cidade:null})
  const [loading,   setLoading]   = useState(true)
  const [salvando,  setSalvando]  = useState<string|null>(null)

  useEffect(() => { if (empresaId) carregar(empresaId) }, [empresaId])

  async function carregar(eid: string) {
    setLoading(true)
    const supabase = createClient()
    const [{ data: prods }, { data: emp }] = await Promise.all([
      supabase.from('produtos').select('id,nome,categoria,preco_varejo,preco_atacado,preco_vip,ativo_catalogo,destaque,preco_catalogo').eq('empresa_id', eid).eq('ativo', true).order('nome'),
      supabase.from('empresas').select('nome,whatsapp,cidade').eq('id', eid).single(),
    ])
    setProdutos(prods||[])
    if (emp) setEmpresa(emp)
    setLoading(false)
  }

  async function toggleCatalogo(id: string, atual: boolean) {
    setSalvando(id)
    await createClient().from('produtos').update({ ativo_catalogo: !atual }).eq('id', id)
    setProdutos(prev => prev.map(p => p.id===id ? {...p, ativo_catalogo: !atual} : p))
    setSalvando(null)
  }

  async function toggleDestaque(id: string, atual: boolean) {
    setSalvando(id+'-d')
    await createClient().from('produtos').update({ destaque: !atual }).eq('id', id)
    setProdutos(prev => prev.map(p => p.id===id ? {...p, destaque: !atual} : p))
    setSalvando(null)
  }

  async function setPrecoTipo(id: string, val: string) {
    await createClient().from('produtos').update({ preco_catalogo: val }).eq('id', id)
    setProdutos(prev => prev.map(p => p.id===id ? {...p, preco_catalogo: val} : p))
  }

  function precoExibido(p: Produto) {
    const tipo = p.preco_catalogo || 'varejo'
    if (tipo==='ocultar') return '—'
    if (tipo==='atacado') return formatCurrency(p.preco_atacado||p.preco_varejo)
    if (tipo==='vip')     return formatCurrency(p.preco_vip||p.preco_varejo)
    return formatCurrency(p.preco_varejo)
  }

  const ativos = produtos.filter(p=>p.ativo_catalogo).length
  const urlCatalogo = empresa.nome ? `nexocommerce.app/catalogo/${empresa.nome.toLowerCase().replace(/\s+/g,'-')}` : 'nexocommerce.app/catalogo/sua-loja'
  const msgWa = encodeURIComponent(`Olá! Veja nossos produtos: https://${urlCatalogo}`)

  return (
    <div className="anim-fade" style={{display:'flex',flexDirection:'column',gap:'0.875rem',maxWidth:'900px'}}>
      <div className="pg-header">
        <div><h1 className="pg-titulo">🌐 Catálogo Online</h1>
          <p className="pg-sub">{ativos} produto(s) visíveis no catálogo público</p></div>
        <a href={`https://${urlCatalogo}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary">↗ Ver Catálogo</a>
      </div>

      <PageTabs tabs={[
        { label: 'Produtos', href: '/produtos' },
        { label: 'Estoque e Movimentações', href: '/estoque' },
        { label: 'Catálogo Online', href: '/catalogo' }
      ]} />

      {/* Link */}
      <div className="card" style={{display:'grid',gridTemplateColumns:'1fr auto',gap:'1.5rem',alignItems:'center'}}>
        <div>
          <p style={{fontWeight:800,marginBottom:'0.5rem'}}>🔗 Link do seu catálogo</p>
          <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
            <code style={{flex:1,padding:'0.5rem 0.75rem',background:'var(--surface-alt)',border:'1px solid var(--borda)',borderRadius:'var(--radius-sm)',fontSize:'0.875rem',color:'var(--verde)',wordBreak:'break-all'}}>
              https://{urlCatalogo}
            </code>
            <button className="btn btn-secondary" onClick={()=>navigator.clipboard.writeText(`https://${urlCatalogo}`)}>📋 Copiar</button>
          </div>
          <div style={{display:'flex',gap:'0.5rem',marginTop:'0.625rem',flexWrap:'wrap'}}>
            <a href={`https://wa.me/?text=${msgWa}`} target="_blank" rel="noopener noreferrer"
              className="btn btn-secondary" style={{background:'#25D366',color:'#fff',border:'none'}}>
              💬 Compartilhar via WhatsApp
            </a>
            <button className="btn btn-secondary" onClick={()=>window.print()}>🖨 Imprimir QR</button>
          </div>
        </div>
        {/* QR simulado */}
        <div style={{flexShrink:0,textAlign:'center'}}>
          <div style={{width:'100px',height:'100px',border:'3px solid var(--verde)',borderRadius:'8px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'#fff',padding:'8px',gap:'3px'}}>
            {Array.from({length:7}).map((_,row)=>(
              <div key={row} style={{display:'flex',gap:'3px'}}>
                {Array.from({length:7}).map((_,col)=>{
                  const b=(row<3&&col<3)||(row<3&&col>3)||(row>3&&col<3)||((row+col)%2===0)
                  return <div key={col} style={{width:'9px',height:'9px',borderRadius:'1px',background:b?'#1a2a3a':'#fff'}}/>
                })}
              </div>
            ))}
          </div>
          <p style={{fontSize:'0.65rem',color:'var(--texto-desab)',marginTop:'4px'}}>QR Code</p>
        </div>
      </div>

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:'2rem',gap:'0.75rem',color:'var(--texto-desab)'}}>
          <Loader2 size={18} style={{animation:'spin 1s linear infinite'}}/> Carregando...
        </div>
      ) : produtos.length===0 ? (
        <div style={{textAlign:'center',padding:'2rem',color:'var(--texto-desab)'}}>
          <p>Nenhum produto cadastrado ainda.</p>
          <Link href="/produtos/novo" className="btn btn-primary" style={{marginTop:'0.75rem',display:'inline-flex'}}>+ Cadastrar Produto</Link>
        </div>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr style={{background:'#364a60'}}>
                <th>Produto</th><th>Categoria</th>
                <th style={{textAlign:'right'}}>Preço exibido</th>
                <th style={{textAlign:'center'}}>Exibição</th>
                <th style={{textAlign:'center'}}>Visível</th>
                <th style={{textAlign:'center'}}>Destaque</th>
                <th style={{textAlign:'center'}}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map(p=>(
                <tr key={p.id} style={{opacity:p.ativo_catalogo?1:0.55}}>
                  <td style={{fontWeight:700}}>{p.nome}</td>
                  <td style={{fontSize:'0.82rem'}}>{p.categoria||'—'}</td>
                  <td style={{textAlign:'right',fontWeight:800,color:p.preco_catalogo==='ocultar'?'var(--texto-desab)':'var(--verde)',fontFamily:'monospace'}}>
                    {precoExibido(p)}
                  </td>
                  <td style={{textAlign:'center'}}>
                    <select className="campo" style={{width:'auto',fontSize:'0.75rem',padding:'0.2rem 0.4rem'}}
                      value={p.preco_catalogo||'varejo'} onChange={e=>setPrecoTipo(p.id,e.target.value)}>
                      <option value="varejo">Varejo</option>
                      <option value="atacado">Atacado</option>
                      <option value="vip">VIP</option>
                      <option value="ocultar">Ocultar preço</option>
                    </select>
                  </td>
                  <td style={{textAlign:'center'}}>
                    <button onClick={()=>toggleCatalogo(p.id,!!p.ativo_catalogo)} disabled={salvando===p.id}
                      style={{background:'none',border:'none',cursor:'pointer',padding:0}}>
                      <span className={p.ativo_catalogo?'status-ok':'status-neutro'} style={{fontSize:'0.8rem'}}>
                        {p.ativo_catalogo?'● Visível':'○ Oculto'}
                      </span>
                    </button>
                  </td>
                  <td style={{textAlign:'center'}}>
                    <button onClick={()=>toggleDestaque(p.id,!!p.destaque)} disabled={salvando===p.id+'-d'}
                      style={{background:'none',border:'none',cursor:'pointer',padding:0}}>
                      <span className={p.destaque?'status-alerta':'status-neutro'} style={{fontSize:'0.8rem'}}>
                        {p.destaque?'★ Destaque':'—'}
                      </span>
                    </button>
                  </td>
                  <td style={{textAlign:'center'}}>
                    <Link href={`/produtos/${p.id}/editar`} className="btn btn-secondary" style={{fontSize:'0.72rem',padding:'0.2rem 0.5rem'}}>Editar</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
