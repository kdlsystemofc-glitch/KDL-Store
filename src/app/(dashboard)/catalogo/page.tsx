'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { formatCurrency } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { PageTabs } from '@/components/PageTabs'
import { QRCodeSVG } from 'qrcode.react'

type Produto = { id:string; nome:string; categoria:string|null; preco_varejo:number; preco_atacado:number|null; preco_vip:number|null; ativo_catalogo:boolean|null; destaque:boolean|null; preco_catalogo:string|null }

export default function CatalogoPage() {
  const { empresaId } = useEmpresaId()
  const [produtos,  setProdutos]  = useState<Produto[]>([])
  const [empresa,   setEmpresa]   = useState<{nome:string;telefone:string|null;cidade:string|null;slug:string|null}>({nome:'',telefone:null,cidade:null,slug:null})
  const [loading,   setLoading]   = useState(true)
  const [salvando,  setSalvando]  = useState<string|null>(null)

  useEffect(() => { if (empresaId) carregar(empresaId) }, [empresaId])

  async function carregar(eid: string) {
    setLoading(true)
    const supabase = createClient()
    const [{ data: prods }, { data: emp }] = await Promise.all([
      supabase.from('produtos').select('id,nome,categoria,preco_varejo,preco_atacado,preco_vip,ativo_catalogo,destaque,preco_catalogo').eq('empresa_id', eid).eq('ativo', true).order('nome'),
      supabase.from('empresas').select('nome,telefone,cidade,slug').eq('id', eid).single(),
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
  const host = typeof window !== 'undefined' ? window.location.host : 'nexocommerce.app'
  const urlCatalogo = empresa.slug ? `${host}/loja/${empresa.slug}` : null
  const msgWa = encodeURIComponent(`Olá! Veja nossos produtos no catálogo online: https://${urlCatalogo}`)

  return (
    <div className="anim-fade" style={{display:'flex',flexDirection:'column',gap:'0.75rem',maxWidth:'900px'}}>
      <div className="pg-header">
        <div><h1 className="pg-titulo">CATÁLOGO ONLINE</h1>
          <p className="pg-sub">{ativos} PRODUTO(S) VISÍVEIS NO CATÁLOGO PÚBLICO</p></div>
        <a href={`https://${urlCatalogo}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{fontSize:'0.72rem'}}>↗ VER CATÁLOGO</a>
      </div>

      <PageTabs tabs={[
        { label: 'Produtos', href: '/produtos' },
        { label: 'Estoque e Movimentações', href: '/estoque' },
        { label: 'Catálogo Online', href: '/catalogo' }
      ]} />

      {/* Link do catálogo */}
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div className="sec-header"><span>LINK DO SEU CATÁLOGO PÚBLICO</span></div>
        <div style={{padding:'1rem',display:'flex',flexDirection:'column',gap:'1rem'}}>
          {urlCatalogo ? (
            <div style={{display:'flex',gap:'1.5rem',alignItems:'flex-start',flexWrap:'wrap'}}>
              <div style={{background:'#fff',padding:'0.5rem',borderRadius:'8px',border:'1px solid var(--borda)',display:'inline-block'}}>
                <QRCodeSVG value={`https://${urlCatalogo}`} size={100} />
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:'0.5rem',flex:1}}>
                <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap',alignItems:'center'}}>
                  <code style={{flex:1,padding:'0.4rem 0.6rem',background:'var(--fundo-painel)',border:'1px solid var(--borda-forte)',fontSize:'0.78rem',color:'var(--verde)',wordBreak:'break-all',letterSpacing:'0.03em'}}>
                    https://{urlCatalogo}
                  </code>
                  <button className="btn btn-secondary" style={{fontSize:'0.65rem',padding:'0.25rem 0.5rem'}} onClick={()=>navigator.clipboard.writeText(`https://${urlCatalogo}`)}>📋 COPIAR</button>
                  <a href={`https://${urlCatalogo}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{fontSize:'0.65rem',padding:'0.25rem 0.5rem'}}>↗ ABRIR</a>
                </div>
                <div style={{display:'flex',gap:'0.375rem',flexWrap:'wrap'}}>
                  <a href={`https://wa.me/?text=${msgWa}`} target="_blank" rel="noopener noreferrer"
                    className="btn btn-secondary" style={{fontSize:'0.65rem',padding:'0.25rem 0.5rem'}}>💬 COMPARTILHAR WA</a>
                  <button className="btn btn-secondary" style={{fontSize:'0.65rem',padding:'0.25rem 0.5rem'}} onClick={()=>window.print()}>🖨 IMP. QR</button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{textAlign:'center',padding:'1rem',background:'var(--fundo-painel)',borderRadius:'8px'}}>
              <p style={{fontSize:'0.85rem',color:'var(--texto-sec)',marginBottom:'0.5rem'}}>Você precisa definir o Link do Catálogo (Slug) antes de compartilhar.</p>
              <Link href="/configuracoes/empresa" className="btn btn-primary" style={{fontSize:'0.75rem'}}>Configurar Link</Link>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:'3rem',flexDirection:'column',alignItems:'center',gap:'0.5rem'}}>
          <p style={{color:'var(--verde)',fontSize:'0.75rem',letterSpacing:'0.08em'}}>CARREGANDO CATÁLOGO<span className="blink">_</span></p>
        </div>
      ) : produtos.length===0 ? (
        <div style={{textAlign:'center',padding:'3rem',color:'var(--texto-desab)',border:'1px solid var(--borda)',background:'var(--surface)'}}>
          <p style={{fontSize:'0.7rem',letterSpacing:'0.1em',fontWeight:700,marginBottom:'0.5rem'}}>[ NENHUM PRODUTO CADASTRADO ]</p>
          <Link href="/produtos/novo" className="btn btn-primary" style={{marginTop:'0.5rem',display:'inline-flex',fontSize:'0.72rem'}}>+ CADASTRAR PRODUTO</Link>
        </div>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <thead><tr>
                <th>PRODUTO</th><th>CATEGORIA</th>
                <th style={{textAlign:'right'}}>PREÇO EXIBIDO</th>
                <th style={{textAlign:'center'}}>EXIBIÇÃO</th>
                <th style={{textAlign:'center'}}>VISÍVEL</th>
                <th style={{textAlign:'center'}}>DESTAQUE</th>
                <th style={{textAlign:'center'}}>AÇÃO</th>
            </tr></thead>
            <tbody>
              {produtos.map(p=>(
                <tr key={p.id} style={{opacity:p.ativo_catalogo?1:0.55}}>
                  <td style={{fontWeight:700,fontSize:'0.82rem'}}>{p.nome}</td>
                  <td style={{fontSize:'0.7rem',textTransform:'uppercase',letterSpacing:'0.04em',color:'var(--texto-sec)'}}>{p.categoria||'—'}</td>
                  <td style={{textAlign:'right',fontWeight:700,color:p.preco_catalogo==='ocultar'?'var(--texto-desab)':'var(--verde)',fontVariantNumeric:'tabular-nums'}}>
                    {precoExibido(p)}
                  </td>
                  <td style={{textAlign:'center'}}>
                    <select className="campo" style={{width:'auto',fontSize:'0.65rem',padding:'0.15rem 0.3rem'}}
                      value={p.preco_catalogo||'varejo'} onChange={e=>setPrecoTipo(p.id,e.target.value)}>
                      <option value="varejo">VAREJO</option>
                      <option value="atacado">ATACADO</option>
                      <option value="vip">VIP</option>
                      <option value="ocultar">OCULTAR</option>
                    </select>
                  </td>
                  <td style={{textAlign:'center'}}>
                    <button onClick={()=>toggleCatalogo(p.id,!!p.ativo_catalogo)} disabled={salvando===p.id}
                      style={{background:'none',border:'none',cursor:'pointer',padding:0}}>
                      <span className={p.ativo_catalogo?'status-ok':'status-neutro'} style={{fontSize:'0.7rem'}}>
                        {p.ativo_catalogo?'● VISÍVEL':'○ OCULTO'}
                      </span>
                    </button>
                  </td>
                  <td style={{textAlign:'center'}}>
                    <button onClick={()=>toggleDestaque(p.id,!!p.destaque)} disabled={salvando===p.id+'-d'}
                      style={{background:'none',border:'none',cursor:'pointer',padding:0}}>
                      <span className={p.destaque?'status-alerta':'status-neutro'} style={{fontSize:'0.7rem'}}>
                        {p.destaque?'★ DESTAQUE':'—'}
                      </span>
                    </button>
                  </td>
                  <td style={{textAlign:'center'}}>
                    <Link href={`/produtos/${p.id}/editar`} className="btn btn-secondary" style={{fontSize:'0.62rem',padding:'0.15rem 0.4rem'}}>EDITAR</Link>
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
