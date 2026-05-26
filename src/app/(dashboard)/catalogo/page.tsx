'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { formatCurrency } from '@/lib/utils'
import { Loader2, Palette, Save, Eye, Layout, Type, ShoppingCart, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { PageTabs } from '@/components/PageTabs'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'react-hot-toast'

type Produto = {
  id: string; nome: string; categoria: string | null
  preco_varejo: number; preco_atacado: number | null; preco_vip: number | null
  ativo_catalogo: boolean | null; destaque: boolean | null; preco_catalogo: string | null
}

type EmpresaInfo = {
  nome: string; telefone: string | null; cidade: string | null; slug: string | null
  catalogo_cor_primaria: string | null; catalogo_cor_secundaria: string | null; catalogo_descricao: string | null
  catalogo_template: string | null; catalogo_fonte: string | null; catalogo_logo_url: string | null
  catalogo_mostrar_carrinho: boolean | null
}

const PALETAS = [
  { nome: 'Violeta', c1: '#6C63FF', c2: '#00BFA5' },
  { nome: 'Azul', c1: '#2563EB', c2: '#0EA5E9' },
  { nome: 'Verde', c1: '#059669', c2: '#10B981' },
  { nome: 'Vermelho', c1: '#DC2626', c2: '#F97316' },
  { nome: 'Rosa', c1: '#DB2777', c2: '#9333EA' },
  { nome: 'Âmbar', c1: '#D97706', c2: '#059669' },
  { nome: 'Slate', c1: '#475569', c2: '#6366F1' },
  { nome: 'Preto', c1: '#111827', c2: '#374151' },
]

const FONTES = [
  { id: 'Inter', nome: 'Inter (Moderna & Limpa)' },
  { id: 'Poppins', nome: 'Poppins (Geométrica & Jovem)' },
  { id: 'Outfit', nome: 'Outfit (Arredondada & Tech)' },
  { id: 'Playfair', nome: 'Playfair Display (Clássica Serifada)' },
]

const TEMPLATES = [
  { id: 'moderno', nome: 'Grid Moderno', desc: 'Gradientes modernos, bordas arredondadas e glassmorphism.' },
  { id: 'minimalista', nome: 'Minimalista Clean', desc: 'Preto no branco, bordas retas, alta costura e muito espaçamento.' },
  { id: 'luxo_escuro', nome: 'Luxo Escuro', desc: 'Tema escuro premium, bordas com brilho neon e contraste refinado.' },
]

function adjustColor(hex: string, amount: number) {
  const cleanHex = hex.replace('#', '')
  const num = parseInt(cleanHex, 16) || 0x6c63ff
  const r = Math.min(255, Math.max(0, (num >> 16) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount))
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount))
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

export default function CatalogoPage() {
  const { empresaId } = useEmpresaId()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [empresa, setEmpresa] = useState<EmpresaInfo>({
    nome: '', telefone: null, cidade: null, slug: null,
    catalogo_cor_primaria: '#6C63FF', catalogo_cor_secundaria: '#00BFA5', catalogo_descricao: null,
    catalogo_template: 'moderno', catalogo_fonte: 'Inter', catalogo_logo_url: null, catalogo_mostrar_carrinho: true
  })
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState<string | null>(null)
  const [salvandoCores, setSalvandoCores] = useState(false)

  useEffect(() => { if (empresaId) carregar(empresaId) }, [empresaId])

  async function carregar(eid: string) {
    setLoading(true)
    const supabase = createClient()
    const [{ data: prods }, { data: emp }] = await Promise.all([
      supabase.from('produtos')
        .select('id,nome,categoria,preco_varejo,preco_atacado,preco_vip,ativo_catalogo,destaque,preco_catalogo')
        .eq('empresa_id', eid).eq('ativo', true).order('nome'),
      supabase.from('empresas')
        .select('nome,telefone,cidade,slug,catalogo_cor_primaria,catalogo_cor_secundaria,catalogo_descricao,catalogo_template,catalogo_fonte,catalogo_logo_url,catalogo_mostrar_carrinho')
        .eq('id', eid).single(),
    ])
    setProdutos(prods || [])
    if (emp) {
      setEmpresa({
        nome: emp.nome,
        telefone: emp.telefone,
        cidade: emp.cidade,
        slug: emp.slug,
        catalogo_cor_primaria: emp.catalogo_cor_primaria || '#6C63FF',
        catalogo_cor_secundaria: emp.catalogo_cor_secundaria || '#00BFA5',
        catalogo_descricao: emp.catalogo_descricao,
        catalogo_template: emp.catalogo_template || 'moderno',
        catalogo_fonte: emp.catalogo_fonte || 'Inter',
        catalogo_logo_url: emp.catalogo_logo_url,
        catalogo_mostrar_carrinho: emp.catalogo_mostrar_carrinho !== false
      })
    }
    setLoading(false)
  }

  async function salvarPersonalizacao() {
    if (!empresaId) return
    setSalvandoCores(true)
    const { error } = await createClient().from('empresas').update({
      catalogo_cor_primaria: empresa.catalogo_cor_primaria || '#6C63FF',
      catalogo_cor_secundaria: empresa.catalogo_cor_secundaria || '#00BFA5',
      catalogo_descricao: empresa.catalogo_descricao || null,
      catalogo_template: empresa.catalogo_template || 'moderno',
      catalogo_fonte: empresa.catalogo_fonte || 'Inter',
      catalogo_logo_url: empresa.catalogo_logo_url || null,
      catalogo_mostrar_carrinho: empresa.catalogo_mostrar_carrinho !== false,
    }).eq('id', empresaId)
    setSalvandoCores(false)
    if (error) { toast.error('Erro ao salvar: ' + error.message); return }
    toast.success('Aparência do catálogo atualizada!')
  }

  async function toggleCatalogo(id: string, atual: boolean) {
    setSalvando(id)
    await createClient().from('produtos').update({ ativo_catalogo: !atual }).eq('id', id)
    setProdutos(prev => prev.map(p => p.id === id ? { ...p, ativo_catalogo: !atual } : p))
    setSalvando(null)
  }

  async function toggleDestaque(id: string, atual: boolean) {
    setSalvando(id + '-d')
    await createClient().from('produtos').update({ destaque: !atual }).eq('id', id)
    setProdutos(prev => prev.map(p => p.id === id ? { ...p, destaque: !atual } : p))
    setSalvando(null)
  }

  async function setPrecoTipo(id: string, val: string) {
    await createClient().from('produtos').update({ preco_catalogo: val }).eq('id', id)
    setProdutos(prev => prev.map(p => p.id === id ? { ...p, preco_catalogo: val } : p))
  }

  function precoExibido(p: Produto) {
    const tipo = p.preco_catalogo || 'varejo'
    if (tipo === 'ocultar') return '—'
    if (tipo === 'atacado') return formatCurrency(p.preco_atacado || p.preco_varejo)
    if (tipo === 'vip') return formatCurrency(p.preco_vip || p.preco_varejo)
    return formatCurrency(p.preco_varejo)
  }

  const ativos = produtos.filter(p => p.ativo_catalogo).length
  const host = typeof window !== 'undefined' ? window.location.host : 'kdl-store.vercel.app'
  const urlCatalogo = empresa.slug ? `${host}/loja/${empresa.slug}` : null
  const msgWa = encodeURIComponent(`Veja nosso catálogo: https://${urlCatalogo}`)

  const cor1 = empresa.catalogo_cor_primaria || '#6C63FF'
  const cor2 = empresa.catalogo_cor_secundaria || '#00BFA5'
  const temp = empresa.catalogo_template || 'moderno'
  const font = empresa.catalogo_fonte || 'Inter'
  const temCarrinho = empresa.catalogo_mostrar_carrinho !== false

  const getFontFamily = (f: string) => {
    if (f === 'Poppins') return "'Poppins', sans-serif"
    if (f === 'Outfit') return "'Outfit', sans-serif"
    if (f === 'Playfair') return "'Playfair Display', serif"
    return "'Inter', sans-serif"
  }

  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '960px' }}>
      
      {/* Dynamic Font Loader for Admin Preview */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&family=Outfit:wght@400;600;800;900&family=Playfair+Display:wght@400;600;800&family=Poppins:wght@400;600;800;900&display=swap');
      `}</style>

      {/* Header */}
      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">🛍️ Catálogo Online</h1>
          <p className="pg-sub">{ativos} produto{ativos !== 1 ? 's' : ''} visível{ativos !== 1 ? 'eis' : ''} no catálogo público</p>
        </div>
        {urlCatalogo && (
          <a href={`https://${urlCatalogo}`} target="_blank" rel="noopener noreferrer"
            className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.82rem' }}>
            <Eye size={14} /> Ver Catálogo
          </a>
        )}
      </div>

      <PageTabs tabs={[
        { label: 'Produtos', href: '/produtos' },
        { label: 'Estoque e Movimentações', href: '/estoque' },
        { label: 'Catálogo Online', href: '/catalogo' },
      ]} />

      {/* ─── Link público ─────────────────── */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <p style={{ fontWeight: 800, fontSize: '0.88rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          🔗 Link Público do Catálogo
        </p>
        {urlCatalogo ? (
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ background: '#fff', padding: '0.5rem', borderRadius: '10px', border: '1px solid var(--borda)' }}>
              <QRCodeSVG value={`https://${urlCatalogo}`} size={96} fgColor={cor1} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <code style={{
                  flex: 1, padding: '0.5rem 0.75rem', background: 'var(--fundo)',
                  border: '1px solid var(--borda)', borderRadius: '8px',
                  fontSize: '0.8rem', color: cor1, wordBreak: 'break-all', fontFamily: 'monospace'
                }}>
                  https://{urlCatalogo}
                </code>
                <button className="btn btn-secondary" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                  onClick={() => { navigator.clipboard.writeText(`https://${urlCatalogo}`); toast.success('Link copiado!') }}>
                  📋 Copiar
                </button>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <a href={`https://wa.me/?text=${msgWa}`} target="_blank" rel="noopener noreferrer"
                  className="btn btn-secondary" style={{ fontSize: '0.75rem' }}>
                  💬 Compartilhar no WhatsApp
                </a>
                <button className="btn btn-secondary" style={{ fontSize: '0.75rem' }} onClick={() => window.print()}>
                  🖨️ Imprimir QR Code
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ background: 'var(--fundo)', borderRadius: '10px', padding: '1.25rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--texto-sec)', marginBottom: '0.75rem' }}>
              Defina o link (slug) do catálogo para compartilhar com clientes.
            </p>
            <Link href="/configuracoes/empresa" className="btn btn-primary" style={{ fontSize: '0.8rem' }}>
              Configurar Link
            </Link>
          </div>
        )}
      </div>

      {/* ─── Personalização visual ──────────── */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <p style={{ fontWeight: 800, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Palette size={16} /> Aparência e Identidade Visual
          </p>
          <button onClick={salvarPersonalizacao} disabled={salvandoCores}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.78rem', padding: '0.4rem 0.875rem' }}>
            {salvandoCores ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={13} />}
            Salvar aparência
          </button>
        </div>

        {/* Real-time Dynamic Preview Block */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label className="campo-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
            ✨ Preview Interativo em Tempo Real
          </label>
          <div style={{
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1.5px solid var(--borda)',
            background: temp === 'luxo_escuro' ? '#090a0f' : '#f8f9fa',
            fontFamily: getFontFamily(font),
            color: temp === 'luxo_escuro' ? '#f3f4f6' : '#1f2937',
            transition: 'all 0.3s ease'
          }}>
            {/* Header portion */}
            <div style={{
              background: temp === 'luxo_escuro' ? 'radial-gradient(circle at top right, rgba(0, 191, 165, 0.15), #111218)' : temp === 'minimalista' ? '#fff' : `linear-gradient(135deg, ${adjustColor(cor1, -40)} 0%, ${cor1} 50%, ${cor2} 100%)`,
              borderBottom: temp === 'minimalista' ? '1px solid #e5e5e5' : temp === 'luxo_escuro' ? '1px solid rgba(255,255,255,0.05)' : 'none',
              padding: '1.5rem',
              textAlign: temp === 'minimalista' ? 'left' : 'center',
              color: temp === 'minimalista' ? '#111' : '#fff',
              position: 'relative'
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: temp === 'minimalista' ? '0' : '14px',
                background: empresa.catalogo_logo_url ? 'none' : 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: temp === 'minimalista' ? '0 0 0.5rem' : '0 auto 0.75rem',
                fontSize: '1.5rem', overflow: 'hidden'
              }}>
                {empresa.catalogo_logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={empresa.catalogo_logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : '🏪'}
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: temp === 'minimalista' ? 300 : 900,
                letterSpacing: temp === 'minimalista' ? '0.05em' : '-0.02em',
                textTransform: temp === 'minimalista' ? 'uppercase' : 'none'
              }}>{empresa.nome || 'Minha Loja'}</h3>
              <p style={{ fontSize: '0.72rem', opacity: 0.8, marginTop: '0.25rem' }}>
                {empresa.catalogo_descricao || 'Minha tagline de vendas e slogan'}
              </p>
            </div>
            {/* Products mock portion */}
            <div style={{ padding: '1rem', display: 'flex', gap: '0.75rem' }}>
              <div style={{
                flex: 1,
                background: temp === 'luxo_escuro' ? '#12131a' : '#fff',
                borderRadius: temp === 'minimalista' ? '0' : '12px',
                border: temp === 'luxo_escuro' ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e2e8f0',
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.375rem',
                boxShadow: temp === 'minimalista' ? 'none' : '0 4px 12px rgba(0,0,0,0.02)'
              }}>
                <div style={{ width: '100%', aspectRatio: '16/10', background: '#e2e8f0', borderRadius: temp === 'minimalista' ? '0' : '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>📱</div>
                <p style={{ fontSize: '0.8rem', fontWeight: 700 }}>Smartphone Pro</p>
                <p style={{ fontSize: '0.95rem', fontWeight: 900, color: cor1 }}>R$ 4.999,00</p>
                <button style={{
                  background: cor1, color: '#fff', border: 'none',
                  borderRadius: temp === 'minimalista' ? '0' : '8px',
                  padding: '0.35rem', fontSize: '0.7rem', fontWeight: 700, cursor: 'default'
                }}>
                  {temCarrinho ? '🛒 Adicionar' : 'Pedir pelo WhatsApp'}
                </button>
              </div>
              <div style={{
                flex: 1,
                background: temp === 'luxo_escuro' ? '#12131a' : '#fff',
                borderRadius: temp === 'minimalista' ? '0' : '12px',
                border: temp === 'luxo_escuro' ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e2e8f0',
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.375rem',
                boxShadow: temp === 'minimalista' ? 'none' : '0 4px 12px rgba(0,0,0,0.02)'
              }}>
                <div style={{ width: '100%', aspectRatio: '16/10', background: '#e2e8f0', borderRadius: temp === 'minimalista' ? '0' : '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>🎧</div>
                <p style={{ fontSize: '0.8rem', fontWeight: 700 }}>Headphone Noise</p>
                <p style={{ fontSize: '0.95rem', fontWeight: 900, color: cor1 }}>R$ 799,00</p>
                <button style={{
                  background: cor1, color: '#fff', border: 'none',
                  borderRadius: temp === 'minimalista' ? '0' : '8px',
                  padding: '0.35rem', fontSize: '0.7rem', fontWeight: 700, cursor: 'default'
                }}>
                  {temCarrinho ? '🛒 Adicionar' : 'Pedir pelo WhatsApp'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 1. Escolha do Template */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label className="campo-label" style={{ marginBottom: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Layout size={15} /> 1. Escolha o Layout/Template
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            {TEMPLATES.map(t => (
              <button key={t.id}
                onClick={() => setEmpresa(e => ({ ...e, catalogo_template: t.id }))}
                style={{
                  background: temp === t.id ? 'var(--fundo)' : '#fff',
                  border: temp === t.id ? `2px solid ${cor1}` : '1.5px solid var(--borda)',
                  borderRadius: '12px', padding: '0.85rem', cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.2s ease',
                  boxShadow: temp === t.id ? '0 4px 12px rgba(0,0,0,0.04)' : 'none'
                }}>
                <p style={{ fontWeight: 800, fontSize: '0.82rem', color: temp === t.id ? cor1 : 'inherit' }}>{t.nome}</p>
                <p style={{ fontSize: '0.68rem', color: 'var(--texto-sec)', marginTop: '0.25rem', lineHeight: 1.3 }}>{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Seleção de Fontes */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label className="campo-label" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Type size={15} /> 2. Estilo de Tipografia (Fonte)
          </label>
          <select className="campo" style={{ width: '100%' }}
            value={font}
            onChange={e => setEmpresa(em => ({ ...em, catalogo_fonte: e.target.value }))}>
            {FONTES.map(f => (
              <option key={f.id} value={f.id}>{f.nome}</option>
            ))}
          </select>
        </div>

        {/* Paletas prontas */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label className="campo-label" style={{ marginBottom: '0.625rem', display: 'block' }}>
            🎨 Paletas de Cores sugeridas
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {PALETAS.map(p => (
              <button key={p.nome}
                onClick={() => setEmpresa(e => ({ ...e, catalogo_cor_primaria: p.c1, catalogo_cor_secundaria: p.c2 }))}
                title={p.nome}
                style={{
                  width: 36, height: 36, borderRadius: '8px', border: 'none', cursor: 'pointer',
                  background: `linear-gradient(135deg, ${p.c1}, ${p.c2})`,
                  outline: (cor1 === p.c1 && cor2 === p.c2) ? `3px solid ${p.c1}` : '2px solid transparent',
                  outlineOffset: '2px',
                  transition: 'outline 0.15s, transform 0.12s',
                  transform: (cor1 === p.c1 && cor2 === p.c2) ? 'scale(1.08)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Cores customizadas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label className="campo-label" style={{ marginBottom: '0.375rem', display: 'block' }}>Cor principal da sua marca</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input type="color" value={cor1}
                onChange={e => setEmpresa(em => ({ ...em, catalogo_cor_primaria: e.target.value }))}
                style={{ width: 44, height: 36, border: 'none', borderRadius: '8px', cursor: 'pointer', padding: 0 }}
              />
              <input className="campo" value={cor1}
                onChange={e => setEmpresa(em => ({ ...em, catalogo_cor_primaria: e.target.value }))}
                style={{ fontFamily: 'monospace', fontSize: '0.85rem', flex: 1 }}
                maxLength={7}
              />
            </div>
          </div>
          <div>
            <label className="campo-label" style={{ marginBottom: '0.375rem', display: 'block' }}>Cor de destaque / Destaques</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input type="color" value={cor2}
                onChange={e => setEmpresa(em => ({ ...em, catalogo_cor_secundaria: e.target.value }))}
                style={{ width: 44, height: 36, border: 'none', borderRadius: '8px', cursor: 'pointer', padding: 0 }}
              />
              <input className="campo" value={cor2}
                onChange={e => setEmpresa(em => ({ ...em, catalogo_cor_secundaria: e.target.value }))}
                style={{ fontFamily: 'monospace', fontSize: '0.85rem', flex: 1 }}
                maxLength={7}
              />
            </div>
          </div>
        </div>

        {/* 3. Logomarca e Banner */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label className="campo-label" style={{ marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <ImageIcon size={15} /> Link da Logomarca (URL da Imagem)
            </label>
            <input className="campo" style={{ width: '100%' }}
              value={empresa.catalogo_logo_url || ''}
              onChange={e => setEmpresa(em => ({ ...em, catalogo_logo_url: e.target.value }))}
              placeholder="Ex: https://imgur.com/meulogo.png"
            />
            <p style={{ fontSize: '0.7rem', color: 'var(--texto-desab)', marginTop: '0.25rem' }}>
              Insira uma URL pública da logomarca da sua empresa (de preferência quadrada).
            </p>
          </div>
        </div>

        {/* 4. Carrinho de compras */}
        <div style={{ marginBottom: '1.5rem', background: 'var(--fundo)', borderRadius: '12px', padding: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingCart size={18} style={{ color: cor1 }} />
              <div>
                <p style={{ fontWeight: 800, fontSize: '0.82rem' }}>Ativar Carrinho de Compras integrado</p>
                <p style={{ fontSize: '0.68rem', color: 'var(--texto-sec)' }}>Permite aos clientes agrupar múltiplos itens e enviar um único pedido.</p>
              </div>
            </div>
            <div>
              <input
                type="checkbox"
                checked={temCarrinho}
                onChange={e => setEmpresa(em => ({ ...em, catalogo_mostrar_carrinho: e.target.checked }))}
                style={{
                  width: '40px',
                  height: '20px',
                  cursor: 'pointer',
                  accentColor: cor1
                }}
              />
            </div>
          </div>
        </div>

        {/* Descrição/tagline */}
        <div>
          <label className="campo-label" style={{ marginBottom: '0.375rem', display: 'block' }}>
            Descrição / Slogan da loja <span style={{ color: 'var(--texto-desab)', fontWeight: 400 }}>(opcional)</span>
          </label>
          <input className="campo"
            value={empresa.catalogo_descricao || ''}
            onChange={e => setEmpresa(em => ({ ...em, catalogo_descricao: e.target.value }))}
            placeholder="Ex: Os melhores eletrônicos com os melhores preços 🔥"
            style={{ width: '100%' }}
            maxLength={120}
          />
          <p style={{ fontSize: '0.7rem', color: 'var(--texto-desab)', marginTop: '0.25rem' }}>
            Aparece como subtítulo no cabeçalho do catálogo. Máx. 120 caracteres.
          </p>
        </div>
      </div>

      {/* ─── Tabela de produtos ─────────────── */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', gap: '0.75rem', color: 'var(--texto-desab)' }}>
          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Carregando...
        </div>
      ) : produtos.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--texto-desab)', marginBottom: '0.75rem' }}>Nenhum produto cadastrado ainda.</p>
          <Link href="/produtos/novo" className="btn btn-primary" style={{ fontSize: '0.82rem', display: 'inline-flex' }}>
            + Cadastrar Produto
          </Link>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--borda)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontWeight: 800, fontSize: '0.88rem' }}>📋 Gerenciar Produtos no Catálogo</p>
            <span className="status-ok" style={{ fontSize: '0.72rem' }}>{ativos} visíveis</span>
          </div>
          <div className="tabela-wrap">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th style={{ textAlign: 'right' }}>Preço Exibido</th>
                  <th style={{ textAlign: 'center' }}>Exibição do Preço</th>
                  <th style={{ textAlign: 'center' }}>Visível</th>
                  <th style={{ textAlign: 'center' }}>Destaque</th>
                  <th style={{ textAlign: 'center' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map(p => (
                  <tr key={p.id} style={{ opacity: p.ativo_catalogo ? 1 : 0.5 }}>
                    <td style={{ fontWeight: 700, fontSize: '0.82rem' }}>{p.nome}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--texto-sec)' }}>{p.categoria || '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: p.preco_catalogo === 'ocultar' ? 'var(--texto-desab)' : 'var(--verde)', fontVariantNumeric: 'tabular-nums' }}>
                      {precoExibido(p)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <select className="campo" style={{ width: 'auto', fontSize: '0.72rem', padding: '0.2rem 0.4rem' }}
                        value={p.preco_catalogo || 'varejo'}
                        onChange={e => setPrecoTipo(p.id, e.target.value)}>
                        <option value="varejo">Varejo</option>
                        <option value="atacado">Atacado</option>
                        <option value="vip">VIP</option>
                        <option value="ocultar">Ocultar</option>
                      </select>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button onClick={() => toggleCatalogo(p.id, !!p.ativo_catalogo)} disabled={salvando === p.id}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <span className={p.ativo_catalogo ? 'status-ok' : 'status-neutro'} style={{ fontSize: '0.72rem' }}>
                          {salvando === p.id ? '...' : p.ativo_catalogo ? '● Visível' : '○ Oculto'}
                        </span>
                      </button>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button onClick={() => toggleDestaque(p.id, !!p.destaque)} disabled={salvando === p.id + '-d'}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <span className={p.destaque ? 'status-alerta' : 'status-neutro'} style={{ fontSize: '0.72rem' }}>
                          {p.destaque ? '★ Destaque' : '—'}
                        </span>
                      </button>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Link href={`/produtos/${p.id}/editar`}
                        className="btn btn-secondary" style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}>
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
