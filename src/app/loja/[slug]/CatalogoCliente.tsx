'use client'
import { useState, useMemo, useEffect, useCallback, memo, useRef } from 'react'

type Produto = {
  id: string
  nome: string
  descricao: string | null
  preco_catalogo: string | null
  preco_varejo: number | null
  preco_atacado: number | null
  preco_vip: number | null
  destaque: boolean | null
  imagem_url: string | null
  categoria: string | null
}

type Empresa = {
  nome: string
  telefone: string | null
  whatsapp: string | null
  instagram: string | null
  cidade: string | null
  estado: string | null
  catalogo_cor_primaria: string | null
  catalogo_cor_secundaria: string | null
  catalogo_descricao: string | null
  catalogo_template: string | null
  catalogo_fonte: string | null
  catalogo_logo_url: string | null
  catalogo_mostrar_carrinho: boolean
  catalogo_formas_envio: string | null
}

type ItemCarrinho = {
  produto: Produto
  quantidade: number
}

type LocalToast = {
  id: number
  mensagem: string
  tipo: 'sucesso' | 'info'
}

function getPreco(p: Produto): number | null {
  const tipo = p.preco_catalogo || 'varejo'
  if (tipo === 'ocultar') return null
  if (tipo === 'atacado') return p.preco_atacado ?? p.preco_varejo
  if (tipo === 'vip') return p.preco_vip ?? p.preco_varejo
  return p.preco_varejo
}

function formatBRL(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

function hexToRgb(hex: string) {
  // Safe hex parser
  const cleanHex = hex.replace('#', '')
  const r = parseInt(cleanHex.substring(0, 2), 16) || 108
  const g = parseInt(cleanHex.substring(2, 4), 16) || 99
  const b = parseInt(cleanHex.substring(4, 6), 16) || 255
  return `${r}, ${g}, ${b}`
}

function adjustColor(hex: string, amount: number) {
  const cleanHex = hex.replace('#', '')
  const num = parseInt(cleanHex, 16) || 0x6c63ff
  const r = Math.min(255, Math.max(0, (num >> 16) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount))
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount))
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

export default function CatalogoCliente({
  empresa,
  produtos,
}: {
  empresa: Empresa
  produtos: Produto[]
}) {
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([])
  const [carrinhoAberto, setCarrinhoAberto] = useState(false)
  const [produtoDetalhado, setProdutoDetalhado] = useState<Produto | null>(null)
  const [detalheQtd, setDetalheQtd] = useState(1)
  const [toasts, setToasts] = useState<LocalToast[]>([])
  const catsRef = useRef<HTMLDivElement>(null)
  
  // Custom delivery options list
  const formasEnvio = useMemo(() => {
    if (!empresa.catalogo_formas_envio || !empresa.catalogo_formas_envio.trim()) {
      return [
        { id: 'retirar', label: 'Retirar na Loja' },
        { id: 'entrega', label: 'Entrega a Domicílio' },
        { id: 'combinar', label: 'A Combinar com o Vendedor' }
      ]
    }
    return empresa.catalogo_formas_envio.split(',').map((item, idx) => {
      const trimmed = item.trim()
      return { id: `opcao_${idx}`, label: trimmed }
    })
  }, [empresa.catalogo_formas_envio])

  // Checkout form states
  const [nomeCliente, setNomeCliente] = useState('')
  const [formaEntrega, setFormaEntrega] = useState('')
  const [obsPedido, setObsPedido] = useState('')

  // Set default shipping method once list is loaded
  useEffect(() => {
    if (formasEnvio.length > 0 && !formaEntrega) {
      setFormaEntrega(formasEnvio[0].label)
    }
  }, [formasEnvio, formaEntrega])

  const cor1 = empresa.catalogo_cor_primaria || '#6C63FF'
  const cor2 = empresa.catalogo_cor_secundaria || '#00BFA5'
  const cor1Rgb = hexToRgb(cor1)
  const cor2Rgb = hexToRgb(cor2)
  const cor1Dark = adjustColor(cor1, -40)
  const whatsappNumber = (empresa.whatsapp || empresa.telefone || '').replace(/\D/g, '')

  const template = empresa.catalogo_template || 'moderno'
  const fonte = empresa.catalogo_fonte || 'Inter'
  const mostrarCarrinho = empresa.catalogo_mostrar_carrinho !== false

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`kdl_cart_${whatsappNumber}`)
      if (stored) {
        setCarrinho(JSON.parse(stored))
      }
    } catch (e) {
      console.error(e)
    }
  }, [whatsappNumber])

  // Save cart to localStorage
  const atualizarCarrinho = useCallback((novo: ItemCarrinho[]) => {
    setCarrinho(novo)
    try {
      localStorage.setItem(`kdl_cart_${whatsappNumber}`, JSON.stringify(novo))
    } catch (e) {
      console.error(e)
    }
  }, [whatsappNumber])

  // Toast helper
  const showToast = useCallback((mensagem: string, tipo: 'sucesso' | 'info' = 'sucesso') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, mensagem, tipo }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  const categorias = useMemo(() => {
    const set = new Set<string>()
    produtos.forEach(p => { if (p.categoria) set.add(p.categoria) })
    return Array.from(set).sort()
  }, [produtos])

  const destaques = useMemo(() => produtos.filter(p => p.destaque), [produtos])
  
  const produtosFiltrados = useMemo(() => {
    return produtos.filter(p => {
      const matchCat = !categoriaAtiva || p.categoria === categoriaAtiva
      const matchBusca = (() => {
        if (!busca) return true
        const query = busca.toLowerCase().trim()
        const words = query.split(/\s+/).filter(Boolean)
        if (words.length === 0) return true
        return words.every(word =>
          p.nome.toLowerCase().includes(word) ||
          (p.descricao || '').toLowerCase().includes(word)
        )
      })()
      return matchCat && matchBusca
    })
  }, [produtos, categoriaAtiva, busca])

  // Cart actions
  const adicionarAoCarrinho = useCallback((p: Produto, qtd: number) => {
    const preco = getPreco(p)
    if (preco === null) return

    const index = carrinho.findIndex(item => item.produto.id === p.id)
    let novoCarrinho = [...carrinho]
    if (index > -1) {
      novoCarrinho[index].quantidade += qtd
    } else {
      novoCarrinho.push({ produto: p, quantidade: qtd })
    }
    atualizarCarrinho(novoCarrinho)
    showToast(`Adicionado: ${qtd}x ${p.nome}`)
  }, [carrinho, atualizarCarrinho, showToast])

  const handleAdicionarCarrinhoCard = useCallback((p: Produto) => {
    adicionarAoCarrinho(p, 1)
  }, [adicionarAoCarrinho])

  const alterarQuantidade = useCallback((produtoId: string, delta: number) => {
    const index = carrinho.findIndex(item => item.produto.id === produtoId)
    if (index === -1) return
    let novoCarrinho = [...carrinho]
    const novaQtd = novoCarrinho[index].quantidade + delta
    if (novaQtd <= 0) {
      novoCarrinho.splice(index, 1)
      showToast('Produto removido do carrinho', 'info')
    } else {
      novoCarrinho[index].quantidade = novaQtd
    }
    atualizarCarrinho(novoCarrinho)
  }, [carrinho, atualizarCarrinho, showToast])

  const removerDoCarrinho = useCallback((produtoId: string) => {
    const novoCarrinho = carrinho.filter(item => item.produto.id !== produtoId)
    atualizarCarrinho(novoCarrinho)
    showToast('Produto removido do carrinho', 'info')
  }, [carrinho, atualizarCarrinho, showToast])

  const totalItens = useMemo(() => carrinho.reduce((sum, item) => sum + item.quantidade, 0), [carrinho])
  const valorTotal = useMemo(() => {
    return carrinho.reduce((sum, item) => {
      const preco = getPreco(item.produto) || 0
      return sum + (preco * item.quantidade)
    }, 0)
  }, [carrinho])

  // Font Family String
  const getFontFamily = (f: string) => {
    if (f === 'Poppins') return "'Poppins', sans-serif"
    if (f === 'Outfit') return "'Outfit', sans-serif"
    if (f === 'Playfair') return "'Playfair Display', serif"
    return "'Inter', sans-serif"
  }

  const handleEnviarPedido = useCallback(() => {
    if (carrinho.length === 0) return
    
    let msg = `Olá! Gostaria de fazer um pedido pelo catálogo:\n\n`
    msg += `*📄 ITENS DO PEDIDO:*\n`
    msg += `─────────────────────────\n`
    
    carrinho.forEach(item => {
      const preco = getPreco(item.produto) || 0
      msg += `• *${item.quantidade}x* ${item.produto.nome} — _${formatBRL(preco * item.quantidade)}_\n`
    })
    msg += `─────────────────────────\n`
    msg += `*💰 TOTAL:* *${formatBRL(valorTotal)}*\n\n`

    if (nomeCliente.trim()) {
      msg += `*👤 Nome do Cliente:* ${nomeCliente.trim()}\n`
    }
    
    msg += `*📍 Forma de Envio:* ${formaEntrega}\n`

    if (obsPedido.trim()) {
      msg += `*💬 Observações:* ${obsPedido.trim()}\n`
    }

    const waText = encodeURIComponent(msg)
    window.open(`https://wa.me/55${whatsappNumber}?text=${waText}`, '_blank')
    
    // Clear cart on checkout
    atualizarCarrinho([])
    setCarrinhoAberto(false)
    setNomeCliente('')
    setObsPedido('')
    showToast('Pedido enviado com sucesso!', 'sucesso')
  }, [carrinho, valorTotal, nomeCliente, formaEntrega, obsPedido, whatsappNumber, atualizarCarrinho, showToast])

  // Drag-scroll de categorias com o mouse no Desktop
  const [isGrabbing, setIsGrabbing] = useState(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsGrabbing(true)
    startX.current = e.pageX - (catsRef.current?.offsetLeft || 0)
    scrollLeft.current = catsRef.current?.scrollLeft || 0
  }

  const handleMouseLeave = () => {
    setIsGrabbing(false)
  }

  const handleMouseUp = () => {
    setIsGrabbing(false)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isGrabbing) return
    e.preventDefault()
    const x = e.pageX - (catsRef.current?.offsetLeft || 0)
    const walk = (x - startX.current) * 1.5
    if (catsRef.current) {
      catsRef.current.scrollLeft = scrollLeft.current - walk
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400&family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
        
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        
        :root {
          --c1: ${cor1};
          --c1-rgb: ${cor1Rgb};
          --c2: ${cor2};
          --c2-rgb: ${cor2Rgb};
          --c1-dark: ${cor1Dark};
          --font-family: ${getFontFamily(fonte)};
        }

        body {
          font-family: var(--font-family);
          transition: background 0.3s, color 0.3s;
        }

        /* ──── THEMES ──── */
        
        /* MODERN THEME */
        .theme-moderno {
          background: #f4f5f7;
          color: #1f2937;
        }
        .theme-moderno .card-produto {
          background: #fff;
          border-radius: 18px;
          border: 1px solid #eef0f3;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.02);
        }
        .theme-moderno .hero {
          background: linear-gradient(135deg, var(--c1-dark) 0%, var(--c1) 50%, var(--c2) 100%);
          border-bottom-left-radius: 40px;
          border-bottom-right-radius: 40px;
          color: #fff;
        }

        /* MINIMALIST THEME */
        .theme-minimalista {
          background: #fafafa;
          color: #111;
        }
        .theme-minimalista .card-produto {
          background: #fff;
          border-radius: 0px;
          border: 1px solid #e5e5e5;
          box-shadow: none;
        }
        .theme-minimalista .card-produto:hover {
          border-color: #111;
        }
        .theme-minimalista .hero {
          background: #fff;
          border-bottom: 1px solid #e5e5e5;
          color: #111;
          padding: 5rem 1.5rem 4rem !important;
        }
        .theme-minimalista .hero-nome {
          color: #111 !important;
          font-weight: 300 !important;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .theme-minimalista .hero-desc {
          color: #666 !important;
          font-weight: 300 !important;
        }
        .theme-minimalista .hero-chip {
          background: #f4f4f4 !important;
          border: 1px solid #ddd !important;
          color: #333 !important;
          border-radius: 0px !important;
        }
        .theme-minimalista .cat-pill {
          border-radius: 0px !important;
          border-color: #ddd !important;
        }
        .theme-minimalista .cat-pill.ativa {
          background: #111 !important;
          border-color: #111 !important;
          color: #fff !important;
        }
        .theme-minimalista .search-input {
          border-radius: 0px !important;
          border-color: #ddd !important;
        }
        .theme-minimalista .wa-btn, .theme-minimalista .btn-primary-action {
          border-radius: 0px !important;
          text-transform: uppercase;
          font-weight: 500 !important;
          letter-spacing: 0.05em;
        }
        .theme-minimalista .badge-dest {
          border-radius: 0px !important;
          background: #111 !important;
        }
        .theme-minimalista .sticky-nav {
          background: rgba(250,250,250,0.95) !important;
          border-bottom: 1px solid #e5e5e5;
        }

        /* DARK LUXURY THEME */
        .theme-luxo_escuro {
          background: #090a0f;
          color: #f3f4f6;
        }
        .theme-luxo_escuro .card-produto {
          background: #12131a;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.06);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }
        .theme-luxo_escuro .card-produto:hover {
          border-color: rgba(var(--c1-rgb), 0.4);
          box-shadow: 0 10px 30px rgba(var(--c1-rgb), 0.15);
        }
        .theme-luxo_escuro .hero {
          background: radial-gradient(circle at top right, rgba(var(--c2-rgb), 0.15) 0%, rgba(var(--c1-rgb), 0.1) 50%, #090a0f 100%), #111218;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          color: #fff;
          position: relative;
        }
        .theme-luxo_escuro .hero::after {
          background: #090a0f !important;
        }
        .theme-luxo_escuro .hero-logo {
          background: rgba(255,255,255,0.04) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
        }
        .theme-luxo_escuro .hero-chip {
          background: rgba(255,255,255,0.05) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          color: rgba(255,255,255,0.8) !important;
        }
        .theme-luxo_escuro .sticky-nav {
          background: rgba(9, 10, 15, 0.9) !important;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .theme-luxo_escuro .search-input {
          background: #14151f !important;
          border-color: rgba(255,255,255,0.1) !important;
          color: #fff;
        }
        .theme-luxo_escuro .cat-pill {
          background: #14151f !important;
          border-color: rgba(255,255,255,0.08) !important;
          color: #9ca3af !important;
        }
        .theme-luxo_escuro .cat-pill.ativa {
          background: var(--c1) !important;
          border-color: var(--c1) !important;
          color: #fff !important;
        }
        .theme-luxo_escuro .card-nome {
          color: #fff !important;
        }
        .theme-luxo_escuro .card-desc {
          color: #9ca3af !important;
        }
        .theme-luxo_escuro .card-img {
          background: #191a24 !important;
        }
        .theme-luxo_escuro .section-title::after {
          background: rgba(255,255,255,0.08) !important;
        }
        .theme-luxo_escuro .catalogo-footer {
          background: #0d0e14 !important;
          border-top: 1px solid rgba(255,255,255,0.05) !important;
        }

        /* ──── CORE INTERACTIVE PARTS ──── */

        /* HERO COMMON */
        .hero {
          padding: 4.5rem 1.5rem 5rem;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .hero-banner {
          display: none; /* Removed stretched blurry logo background for high-end aesthetics */
        }
        .hero-banner img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .hero-content { position: relative; z-index: 1; }
        .hero-logo-img {
          width: 110px;
          height: 110px;
          border-radius: 20px; /* Rounded square — fits any logo shape */
          object-fit: contain;
          background: rgba(255,255,255,0.95);
          padding: 10px;
          border: 2px solid rgba(255,255,255,0.7);
          box-shadow: 0 12px 30px rgba(0,0,0,0.18), 0 4px 10px rgba(0,0,0,0.08);
          margin: 0 auto 1.25rem;
          display: block;
          transition: transform 0.3s ease;
        }
        .hero-logo-img:hover {
          transform: scale(1.05);
        }
        .hero-logo-placeholder {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          background: rgba(255,255,255,0.18);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255,255,255,0.3);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1.25rem;
          font-size: 2.5rem;
          box-shadow: 0 10px 25px rgba(0,0,0,0.12);
        }
        .hero-nome {
          font-size: clamp(2rem, 6vw, 3.2rem);
          font-weight: 900;
          letter-spacing: -0.03em;
          line-height: 1.1;
          margin-bottom: 0.75rem;
          color: #ffffff !important; /* Force high-contrast white to avoid camouflage */
          text-shadow: 0 2px 10px rgba(0,0,0,0.15); /* Premium soft drop shadow */
        }
        .hero-desc {
          font-size: 1.05rem;
          opacity: 0.85;
          max-width: 520px;
          margin: 0 auto 1.75rem;
          line-height: 1.5;
        }
        .hero-chips {
          display: flex; gap: 0.625rem; justify-content: center; flex-wrap: wrap;
        }
        .hero-chip {
          display: inline-flex; align-items: center; gap: 0.4rem;
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.25);
          border-radius: 99px;
          padding: 0.45rem 1rem;
          font-size: 0.82rem;
          color: rgba(255,255,255,0.95);
          font-weight: 500;
          text-decoration: none;
          transition: all 0.2s;
        }
        .hero-chip:hover {
          background: rgba(255,255,255,0.25);
          transform: translateY(-2px);
        }

        /* STICKY NAV */
        .sticky-nav {
          position: sticky; top: 0; z-index: 50;
          background: rgba(244,245,247,0.92);
          backdrop-filter: blur(16px) saturate(180%);
          border-bottom: 1px solid rgba(0,0,0,0.06);
          padding: 0.9rem 1.25rem;
          transition: all 0.2s;
        }
        .sticky-inner {
          max-width: 1100px; margin: 0 auto;
          display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
        }
        .search-wrap {
          position: relative; flex: 1; min-width: 200px;
        }
        .search-icon {
          position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%);
          color: #9ca3af; pointer-events: none;
        }
        .search-input {
          width: 100%;
          padding: 0.6rem 0.75rem 0.6rem 2.5rem;
          border: 1.5px solid #e5e7eb;
          border-radius: 12px;
          font-size: 0.9rem;
          background: #fff;
          outline: none;
          font-family: var(--font-family);
          transition: all 0.2s;
        }
        .search-input:focus { border-color: var(--c1); box-shadow: 0 0 0 3px rgba(var(--c1-rgb), 0.15); }
        .cats-wrap {
          display: flex; gap: 0.45rem; overflow-x: auto; padding-bottom: 2px;
          scrollbar-width: none; flex: 1; min-width: 0;
        }
        .cats-wrap::-webkit-scrollbar { display: none; }
        /* Botões de navegação das categorias */
        .cats-scroll-btn {
          flex-shrink: 0; width: 30px; height: 30px; border-radius: 50%;
          border: 1.5px solid #e5e7eb; background: #fff; font-size: 1.15rem;
          font-weight: 900; cursor: pointer; display: flex; align-items: center;
          justify-content: center; color: #6b7280; transition: all 0.2s;
          line-height: 1; padding: 0; user-select: none;
        }
        .cats-scroll-btn:hover { border-color: var(--c1); color: var(--c1); background: rgba(var(--c1-rgb), 0.06); }
        .theme-luxo_escuro .cats-scroll-btn {
          background: #14151f; border-color: rgba(255,255,255,0.1); color: #9ca3af;
        }
        .theme-minimalista .cats-scroll-btn { border-radius: 0; }
        .cat-pill {
          white-space: nowrap;
          padding: 0.45rem 1rem;
          border-radius: 99px;
          border: 1.5px solid #e5e7eb;
          background: #fff;
          font-size: 0.82rem;
          font-weight: 600;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
          font-family: var(--font-family);
        }
        .cat-pill:hover { border-color: var(--c1); color: var(--c1); }
        .cat-pill.ativa {
          background: var(--c1);
          border-color: var(--c1);
          color: #fff;
        }

        /* GRID CONTENT */
        .main-content { max-width: 1100px; margin: 0 auto; padding: 2.5rem 1.25rem 4rem; }
        .section-title {
          font-size: 0.75rem; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.12em; color: #9ca3af; margin-bottom: 1.25rem;
          display: flex; align-items: center; gap: 0.6rem;
        }
        .section-title::after {
          content: ''; flex: 1; height: 1px; background: #e5e7eb;
        }

        .grid-destaque {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3.5rem;
        }
        .grid-normal {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 1.25rem;
        }
        @media (max-width: 580px) {
          .grid-destaque, .grid-normal {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.75rem;
          }
        }

        /* CARDS */
        .card-produto {
          display: flex; flex-direction: column;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(.25,.8,.25,1);
          cursor: pointer;
          position: relative;
        }
        .card-produto:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 30px rgba(var(--c1-rgb), 0.18), 0 2px 10px rgba(0,0,0,0.04);
        }
        .card-img {
          width: 100%; aspect-ratio: 1/1;
          background: #f8f9fa;
          position: relative; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
        }
        .card-img img {
          width: 100%; height: 100%; object-fit: cover;
          transition: transform 0.5s ease;
        }
        .card-produto:hover .card-img img {
          transform: scale(1.06);
        }
        .card-img-placeholder {
          font-size: 3.5rem; opacity: 0.12; user-select: none;
        }
        .badge-dest {
          position: absolute; top: 0.75rem; left: 0.75rem;
          background: var(--c1);
          color: #fff;
          padding: 0.25rem 0.75rem;
          border-radius: 99px;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          z-index: 10;
        }
        .card-body {
          padding: 1.15rem;
          flex: 1; display: flex; flex-direction: column; gap: 0.45rem;
        }
        .card-nome {
          font-size: 0.95rem; font-weight: 700; color: #111827; line-height: 1.35;
          transition: color 0.2s;
        }
        .card-produto:hover .card-nome {
          color: var(--c1);
        }
        .card-desc {
          font-size: 0.78rem; color: #6b7280; line-height: 1.45;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .card-preco {
          font-size: 1.35rem; font-weight: 900; color: var(--c1);
          margin-top: auto; padding-top: 0.5rem;
        }
        .card-preco-consulta {
          font-size: 0.8rem; color: #9ca3af; font-style: italic;
          margin-top: auto; padding-top: 0.5rem;
        }
        .card-cta {
          margin: 0 1.15rem 1.15rem;
        }
        .btn-add-carrinho {
          display: flex; align-items: center; justify-content: center; gap: 0.4rem;
          width: 100%;
          padding: 0.7rem;
          background: var(--c1);
          color: #fff;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.85rem;
          border: none;
          cursor: pointer;
          font-family: var(--font-family);
          transition: all 0.2s;
        }
        .btn-add-carrinho:hover {
          filter: brightness(1.1);
          transform: scale(1.02);
        }
        .wa-btn-direct {
          display: flex; align-items: center; justify-content: center; gap: 0.4rem;
          width: 100%;
          padding: 0.7rem;
          background: #25D366;
          color: #fff;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.85rem;
          text-decoration: none;
          border: none;
          font-family: var(--font-family);
          transition: all 0.2s;
        }
        .wa-btn-direct:hover {
          filter: brightness(1.08);
          transform: scale(1.02);
        }

        /* ──── FLOATING CART BUBBLE ──── */
        .cart-bubble {
          position: fixed; bottom: 2rem; right: 2rem;
          z-index: 100;
          background: linear-gradient(135deg, var(--c1) 0%, var(--c2) 100%);
          color: #fff;
          border: none;
          border-radius: 99px;
          padding: 1rem 1.75rem;
          display: flex; align-items: center; gap: 0.75rem;
          font-weight: 800;
          font-size: 1rem;
          box-shadow: 0 10px 25px rgba(var(--c1-rgb), 0.35), 0 4px 10px rgba(0,0,0,0.1);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          font-family: var(--font-family);
        }
        .cart-bubble:hover {
          transform: translateY(-4px) scale(1.05);
          box-shadow: 0 14px 30px rgba(var(--c1-rgb), 0.45);
        }
        .cart-badge {
          background: #fff;
          color: var(--c1);
          width: 24px; height: 24px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.8rem; font-weight: 900;
        }

        /* ──── DRAWER SLIDE OUT ──── */
        .drawer-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          z-index: 200;
          opacity: 0; pointer-events: none;
          transition: opacity 0.3s ease;
        }
        .drawer-overlay.aberto {
          opacity: 1; pointer-events: auto;
        }
        .drawer {
          position: fixed; top: 0; right: 0; bottom: 0;
          width: 100%; max-width: 480px;
          background: #fff;
          box-shadow: -10px 0 40px rgba(0,0,0,0.15);
          z-index: 210;
          transform: translateX(100%);
          transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          display: flex; flex-direction: column;
        }
        .theme-luxo_escuro .drawer {
          background: #111218;
          color: #f3f4f6;
          box-shadow: -10px 0 40px rgba(0,0,0,0.6);
        }
        .drawer.aberto {
          transform: translateX(0);
        }
        .drawer-header {
          padding: 1.5rem;
          border-bottom: 1px solid #f0f0f0;
          display: flex; align-items: center; justify-content: space-between;
        }
        .theme-luxo_escuro .drawer-header {
          border-color: rgba(255,255,255,0.06);
        }
        .drawer-titulo { font-size: 1.2rem; font-weight: 800; }
        .drawer-close {
          background: none; border: none; font-size: 1.5rem; cursor: pointer; color: inherit;
        }
        
        .drawer-body {
          flex: 1; overflow-y: scroll; padding: 1.5rem;
          display: flex; flex-direction: column; gap: 1.25rem;
          /* overflow-y: scroll ensures scrollbar space is always reserved,
             preventing layout shift when content grows */
        }
        .cart-item {
          display: flex; gap: 1rem; align-items: center;
          padding-bottom: 1rem;
          border-bottom: 1px solid #f3f4f6;
        }
        .theme-luxo_escuro .cart-item {
          border-color: rgba(255,255,255,0.05);
        }
        .cart-item-img {
          width: 50px; height: 50px; border-radius: 8px; object-fit: cover;
          background: #fafafa;
        }
        .theme-luxo_escuro .cart-item-img {
          background: #1e1f26;
        }
        .cart-item-info { flex: 1; }
        .cart-item-nome { font-weight: 700; font-size: 0.88rem; margin-bottom: 0.2rem; }
        .cart-item-preco { font-size: 0.82rem; font-weight: 600; color: var(--c1); }
        .cart-item-controles {
          display: flex; align-items: center; gap: 0.5rem;
        }
        .btn-qty {
          width: 24px; height: 24px; border-radius: 50%;
          border: 1px solid #ddd;
          background: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.8rem; font-weight: 800; cursor: pointer;
        }
        .theme-luxo_escuro .btn-qty {
          background: #1c1d24; border-color: rgba(255,255,255,0.1); color: #fff;
        }
        .qty-val { font-size: 0.85rem; font-weight: 700; min-width: 20px; text-align: center; }

        .btn-remove {
          background: none; border: none; color: #ef4444; font-size: 0.75rem; font-weight: 600; cursor: pointer;
        }

        /* Form checkout styles */
        .checkout-secao {
          background: #f8fafc;
          border-radius: 12px;
          padding: 1.15rem;
          display: flex; flex-direction: column; gap: 0.85rem;
        }
        .theme-luxo_escuro .checkout-secao {
          background: #171822;
        }
        .secao-titulo { font-size: 0.85rem; font-weight: 800; text-transform: uppercase; color: var(--c1); letter-spacing: 0.05em; }
        .campo-label { font-size: 0.78rem; font-weight: 600; color: inherit; }
        .campo-input, .campo-select, .campo-textarea {
          width: 100%; padding: 0.6rem 0.75rem; border: 1.5px solid #e2e8f0; border-radius: 8px;
          font-family: var(--font-family); font-size: 0.85rem; outline: none; background: #fff;
          transition: border 0.2s;
        }
        .theme-luxo_escuro .campo-input, .theme-luxo_escuro .campo-select, .theme-luxo_escuro .campo-textarea {
          background: #1e1f26; border-color: rgba(255,255,255,0.1); color: #fff;
        }
        .campo-input:focus, .campo-select:focus, .campo-textarea:focus {
          border-color: var(--c1);
        }

        .drawer-footer {
          padding: 1.5rem;
          border-top: 1px solid #f0f0f0;
          display: flex; flex-direction: column; gap: 1rem;
        }
        .theme-luxo_escuro .drawer-footer {
          border-color: rgba(255,255,255,0.06);
        }
        .total-row { display: flex; justify-content: space-between; align-items: center; font-size: 1.15rem; font-weight: 900; }
        
        .btn-enviar-pedido {
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          width: 100%; padding: 0.85rem; background: #25D366; color: #fff;
          border: none; border-radius: 12px; font-weight: 800; font-size: 0.95rem;
          cursor: pointer; font-family: var(--font-family); transition: all 0.2s;
        }
        .btn-enviar-pedido:hover { filter: brightness(1.08); transform: translateY(-2px); }

        /* ──── PRODUCT DETAIL MODAL ──── */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
          z-index: 300; display: flex; align-items: center; justify-content: center; padding: 1.5rem;
          opacity: 0; pointer-events: none; transition: opacity 0.25s ease;
        }
        .modal-overlay.aberto { opacity: 1; pointer-events: auto; }
        .modal-box {
          background: #fff; border-radius: 24px; overflow: hidden; width: 100%; max-width: 640px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.2); transform: scale(0.9); transition: transform 0.25s cubic-bezier(0.25, 0.8, 0.25, 1.1);
          max-height: 90vh; display: flex; flex-direction: column;
        }
        .theme-luxo_escuro .modal-box {
          background: #111218; color: #f3f4f6; box-shadow: 0 20px 50px rgba(0,0,0,0.6);
        }
        .modal-overlay.aberto .modal-box { transform: scale(1); }
        .modal-body { overflow-y: auto; flex: 1; }
        .modal-img {
          width: 100%; aspect-ratio: 16/10; object-fit: cover; background: #f8f9fa;
        }
        .theme-luxo_escuro .modal-img { background: #1e1f26; }
        .modal-info { padding: 2rem; display: flex; flex-direction: column; gap: 1rem; }
        .modal-nome { font-size: 1.4rem; font-weight: 900; line-height: 1.25; }
        .modal-desc { font-size: 0.9rem; color: #6b7280; line-height: 1.6; }
        .theme-luxo_escuro .modal-desc { color: #9ca3af; }
        
        .modal-price-row { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f0f0f0; border-bottom: 1px solid #f0f0f0; padding: 1rem 0; margin-top: 0.5rem; }
        .theme-luxo_escuro .modal-price-row { border-color: rgba(255,255,255,0.06); }
        .modal-label { font-size: 0.85rem; font-weight: 700; color: #9ca3af; }
        .modal-preco { font-size: 1.8rem; font-weight: 900; color: var(--c1); }

        .modal-qty-row { display: flex; align-items: center; justify-content: space-between; margin-top: 0.5rem; }
        .modal-qty-picker { display: flex; align-items: center; gap: 0.75rem; }
        .btn-qty-large {
          width: 32px; height: 32px; border-radius: 50%; border: 1.5px solid #cbd5e1; background: #fff;
          display: flex; align-items: center; justify-content: center; font-size: 1rem; font-weight: 800; cursor: pointer;
        }
        .theme-luxo_escuro .btn-qty-large {
          background: #1e1f26; border-color: rgba(255,255,255,0.15); color: #fff;
        }
        .qty-val-large { font-size: 1.05rem; font-weight: 800; min-width: 30px; text-align: center; }

        .modal-footer { padding: 1.5rem 2rem 2rem; display: flex; gap: 1rem; }
        .btn-modal-close {
          padding: 0.85rem 1.5rem; border-radius: 12px; border: 1.5px solid #cbd5e1; background: #fff;
          font-weight: 700; cursor: pointer; font-family: var(--font-family); transition: all 0.2s;
        }
        .theme-luxo_escuro .btn-modal-close {
          background: #181920; border-color: rgba(255,255,255,0.15); color: #fff;
        }
        .btn-modal-action {
          flex: 1; padding: 0.85rem; background: var(--c1); color: #fff; border: none; border-radius: 12px;
          font-weight: 800; cursor: pointer; font-family: var(--font-family); transition: all 0.2s;
        }
        .btn-modal-action:hover { filter: brightness(1.1); }

        /* ──── CUSTOM TOASTS ──── */
        .toast-container {
          position: fixed; top: 1.5rem; left: 50%; transform: translateX(-50%);
          z-index: 500; display: flex; flex-direction: column; gap: 0.5rem;
          pointer-events: none;
        }
        .toast-item {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid #e2e8f0;
          box-shadow: 0 10px 25px rgba(0,0,0,0.08);
          padding: 0.75rem 1.5rem;
          border-radius: 99px;
          font-size: 0.85rem; font-weight: 700;
          color: #0f172a;
          display: flex; align-items: center; gap: 0.5rem;
          animation: slideDownToast 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
        }
        .theme-luxo_escuro .toast-item {
          background: rgba(20, 21, 28, 0.95);
          border-color: rgba(255,255,255,0.08);
          color: #f3f4f6;
        }
        @keyframes slideDownToast {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ──── VAZIO ──── */
        .vazio { text-align: center; padding: 5rem 1rem; grid-column: 1 / -1; }
        .vazio p { color: #9ca3af; font-size: 0.95rem; margin-top: 0.75rem; }

        /* ──── FOOTER ──── */
        .catalogo-footer {
          text-align: center; padding: 2.5rem 1.25rem; border-top: 1px solid #eef0f3; background: #fff; margin-top: 4rem;
        }
        .catalogo-footer p { font-size: 0.75rem; color: #9ca3af; }
        .catalogo-footer a { color: var(--c1); text-decoration: none; font-weight: 700; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .card-produto { animation: fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }
      `}</style>

      {/* TOAST NOTIFICATIONS */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast-item">
            {t.tipo === 'sucesso' ? '✨' : 'ℹ️'} {t.mensagem}
          </div>
        ))}
      </div>

      <div className={`theme-${template}`} style={{ minHeight: '100vh' }}>
        {/* HERO */}
        <div className="hero">
          {empresa.catalogo_logo_url && (
            <div className="hero-banner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={empresa.catalogo_logo_url} alt="Cover Banner" />
            </div>
          )}
          <div className="hero-content">
            {empresa.catalogo_logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="hero-logo-img" src={empresa.catalogo_logo_url} alt="Logo da Empresa" />
            ) : (
              <div className="hero-logo-placeholder">🏪</div>
            )}
            <h1 className="hero-nome">{empresa.nome}</h1>
            {empresa.catalogo_descricao && (
              <p className="hero-desc">{empresa.catalogo_descricao}</p>
            )}
            <div className="hero-chips">
              {whatsappNumber && (
                <a
                  href={`https://wa.me/55${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hero-chip"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </a>
              )}
              {empresa.instagram && (
                <a
                  href={`https://www.instagram.com/${empresa.instagram.replace('@', '')}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hero-chip"
                >
                  📸 @{empresa.instagram}
                </a>
              )}
              {empresa.cidade && (
                <span className="hero-chip">
                  📍 {empresa.cidade}{empresa.estado ? `, ${empresa.estado}` : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* STICKY NAV com busca + categorias */}
        <div className="sticky-nav">
          <div className="sticky-inner">
            <div className="search-wrap">
              <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                className="search-input"
                type="text"
                placeholder="Buscar produto..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
              />
            </div>
            {categorias.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', minWidth: 0, flex: 1 }}>
                <button
                  className="cats-scroll-btn"
                  onClick={() => catsRef.current?.scrollBy({ left: -220, behavior: 'smooth' })}
                  aria-label="Categorias anteriores"
                >&#8249;</button>
                <div
                  className="cats-wrap"
                  ref={catsRef}
                  onMouseDown={handleMouseDown}
                  onMouseLeave={handleMouseLeave}
                  onMouseUp={handleMouseUp}
                  onMouseMove={handleMouseMove}
                  style={{ cursor: isGrabbing ? 'grabbing' : 'grab', userSelect: 'none' }}
                >
                  <button
                    className={`cat-pill${!categoriaAtiva ? ' ativa' : ''}`}
                    onClick={() => setCategoriaAtiva(null)}
                  >
                    Todos
                  </button>
                  {categorias.map(cat => (
                    <button
                      key={cat}
                      className={`cat-pill${categoriaAtiva === cat ? ' ativa' : ''}`}
                      onClick={() => setCategoriaAtiva(cat === categoriaAtiva ? null : cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <button
                  className="cats-scroll-btn"
                  onClick={() => catsRef.current?.scrollBy({ left: 220, behavior: 'smooth' })}
                  aria-label="Próximas categorias"
                >&#8250;</button>
              </div>
            )}
          </div>
        </div>

        {/* CONTEÚDO */}
        <div className="main-content">
          {/* Destaques (só quando sem filtro e sem busca) */}
          {destaques.length > 0 && !categoriaAtiva && !busca && (
            <div style={{ marginBottom: '3.5rem' }}>
              <p className="section-title">⭐ Destaques</p>
              <div className="grid-destaque">
                {destaques.map((p, i) => (
                  <ProdutoCard
                    key={p.id}
                    produto={p}
                    onVerDetalhes={setProdutoDetalhado}
                    onAdicionarCarrinho={handleAdicionarCarrinhoCard}
                    mostrarCarrinho={mostrarCarrinho}
                    whatsappNumber={whatsappNumber}
                    delay={i * 50}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Todos os produtos */}
          {produtosFiltrados.length > 0 && (
            <>
              {(categoriaAtiva || busca) ? null : (
                <p className="section-title">📦 Todos os Produtos</p>
              )}
              {(categoriaAtiva || busca) && (
                <p className="result-count">
                  {produtosFiltrados.length} resultado{produtosFiltrados.length !== 1 ? 's' : ''}
                  {busca ? ` para "${busca}"` : ''}
                  {categoriaAtiva ? ` em ${categoriaAtiva}` : ''}
                </p>
              )}
              <div className="grid-normal">
                {produtosFiltrados
                  .filter(p => !p.destaque || categoriaAtiva || busca)
                  .map((p, i) => (
                    <ProdutoCard
                      key={p.id}
                      produto={p}
                      onVerDetalhes={setProdutoDetalhado}
                      onAdicionarCarrinho={handleAdicionarCarrinhoCard}
                      mostrarCarrinho={mostrarCarrinho}
                      whatsappNumber={whatsappNumber}
                      delay={i * 40}
                    />
                  ))}
              </div>
            </>
          )}

          {produtosFiltrados.length === 0 && (
            <div className="vazio">
              <span style={{ fontSize: '3.5rem' }}>🔍</span>
              <p>Nenhum produto encontrado com estes termos.</p>
            </div>
          )}

          {produtos.length === 0 && (
            <div className="vazio">
              <span style={{ fontSize: '3.5rem' }}>📦</span>
              <p>Nenhum produto disponível no catálogo no momento.</p>
            </div>
          )}
        </div>

        {/* FLOATING CART BUBBLE */}
        {mostrarCarrinho && totalItens > 0 && (
          <button className="cart-bubble" onClick={() => setCarrinhoAberto(true)}>
            <span>🛒 Carrinho</span>
            <span className="cart-badge">{totalItens}</span>
          </button>
        )}

        {/* CART DRAWER */}
        <div className={`drawer-overlay${carrinhoAberto ? ' aberto' : ''}`} onClick={() => setCarrinhoAberto(false)} />
        <div className={`drawer${carrinhoAberto ? ' aberto' : ''}`}>
          <div className="drawer-header">
            <span className="drawer-titulo">🛒 Seu Carrinho</span>
            <button className="drawer-close" onClick={() => setCarrinhoAberto(false)}>×</button>
          </div>
          
          <div className="drawer-body">
            {carrinho.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#9ca3af' }}>
                <span style={{ fontSize: '3rem' }}>🛒</span>
                <p style={{ marginTop: '1rem', fontWeight: 600 }}>Seu carrinho está vazio</p>
                <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Adicione produtos para fazer um pedido.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {carrinho.map(item => {
                    const preco = getPreco(item.produto) || 0
                    return (
                      <div key={item.produto.id} className="cart-item">
                        {item.produto.imagem_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img className="cart-item-img" src={item.produto.imagem_url} alt={item.produto.nome} />
                        ) : (
                          <div className="cart-item-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📦</div>
                        )}
                        <div className="cart-item-info">
                          <p className="cart-item-nome">{item.produto.nome}</p>
                          <p className="cart-item-preco">{formatBRL(preco * item.quantidade)}</p>
                          <button className="btn-remove" onClick={() => removerDoCarrinho(item.produto.id)}>Remover</button>
                        </div>
                        <div className="cart-item-controles">
                          <button className="btn-qty" onClick={() => alterarQuantidade(item.produto.id, -1)}>-</button>
                          <span className="qty-val">{item.quantidade}</span>
                          <button className="btn-qty" onClick={() => alterarQuantidade(item.produto.id, 1)}>+</button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="checkout-secao">
                  <p className="secao-titulo">📝 Detalhes do Pedido</p>
                  <div>
                    <label className="campo-label">Seu Nome *</label>
                    <input
                      type="text"
                      className="campo-input"
                      placeholder="Como podemos te chamar?"
                      value={nomeCliente}
                      onChange={e => setNomeCliente(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="campo-label">Forma de Envio</label>
                    <select
                      className="campo-select"
                      value={formaEntrega}
                      onChange={e => setFormaEntrega(e.target.value)}
                    >
                      {formasEnvio.map(opt => (
                        <option key={opt.id} value={opt.label}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="campo-label">Observações adicionais</label>
                    <textarea
                      className="campo-textarea"
                      placeholder="Ex: Tamanho M, cor preta, preferência para entrega à tarde..."
                      rows={3}
                      value={obsPedido}
                      onChange={e => setObsPedido(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer is always in the DOM — display:none avoids layout shift when cart fills up */}
          <div className="drawer-footer" style={{ display: carrinho.length > 0 ? 'flex' : 'none' }}>
            <div className="total-row">
              <span>Subtotal:</span>
              <span style={{ color: 'var(--c1)' }}>{formatBRL(valorTotal)}</span>
            </div>
            <button className="btn-enviar-pedido" onClick={handleEnviarPedido}>
              💬 Enviar Pedido pelo WhatsApp
            </button>
          </div>
        </div>

        {/* PRODUCT DETAILS MODAL */}
        <div className={`modal-overlay${produtoDetalhado ? ' aberto' : ''}`} onClick={() => setProdutoDetalhado(null)}>
          {produtoDetalhado && (
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <div className="modal-body">
                {produtoDetalhado.imagem_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="modal-img" src={produtoDetalhado.imagem_url} alt={produtoDetalhado.nome} />
                ) : (
                  <div className="modal-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', background: 'var(--c1-dark)', color: '#fff' }}>📦</div>
                )}
                
                <div className="modal-info">
                  <span className="section-title">{produtoDetalhado.categoria || 'Geral'}</span>
                  <h2 className="modal-nome">{produtoDetalhado.nome}</h2>
                  {produtoDetalhado.descricao && (
                    <p className="modal-desc">{produtoDetalhado.descricao}</p>
                  )}
                  
                  <div className="modal-price-row">
                    <span className="modal-label">Preço</span>
                    {getPreco(produtoDetalhado) !== null ? (
                      <span className="modal-preco">{formatBRL(getPreco(produtoDetalhado) || 0)}</span>
                    ) : (
                      <span className="card-preco-consulta">Preço sob consulta</span>
                    )}
                  </div>

                  {mostrarCarrinho && getPreco(produtoDetalhado) !== null && (
                    <div className="modal-qty-row">
                      <span className="modal-label" style={{ color: 'inherit', fontWeight: 800 }}>Quantidade</span>
                      <div className="modal-qty-picker">
                        <button className="btn-qty-large" onClick={() => setDetalheQtd(q => Math.max(1, q - 1))}>-</button>
                        <span className="qty-val-large">{detalheQtd}</span>
                        <button className="btn-qty-large" onClick={() => setDetalheQtd(q => q + 1)}>+</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="modal-footer">
                <button className="btn-modal-close" onClick={() => setProdutoDetalhado(null)}>Fechar</button>
                {getPreco(produtoDetalhado) !== null ? (
                  mostrarCarrinho ? (
                    <button
                      className="btn-modal-action"
                      onClick={() => {
                        adicionarAoCarrinho(produtoDetalhado, detalheQtd)
                        setProdutoDetalhado(null)
                        setDetalheQtd(1)
                      }}
                    >
                      🛒 Adicionar {detalheQtd}x ao Carrinho
                    </button>
                  ) : (
                    <a
                      className="btn-modal-action"
                      style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#25D366' }}
                      href={`https://wa.me/55${whatsappNumber}?text=${encodeURIComponent(`Olá! Tenho interesse no produto: *${produtoDetalhado.nome}*`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      💬 Negociar pelo WhatsApp
                    </a>
                  )
                ) : (
                  <a
                    className="btn-modal-action"
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#25D366' }}
                    href={`https://wa.me/55${whatsappNumber}?text=${encodeURIComponent(`Olá! Gostaria de consultar o preço de: *${produtoDetalhado.nome}*`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    💬 Consultar Preço no WhatsApp
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <footer className="catalogo-footer">
          <p>
            Catálogo criado com{' '}
            <a href="https://kdl-store.vercel.app" target="_blank" rel="noopener noreferrer">
              KDL Store
            </a>
          </p>
        </footer>
      </div>
    </>
  )
}

const ProdutoCard = memo(function ProdutoCard({
  produto: p,
  onVerDetalhes,
  onAdicionarCarrinho,
  mostrarCarrinho,
  whatsappNumber,
  delay,
}: {
  produto: Produto
  onVerDetalhes: (prod: Produto) => void
  onAdicionarCarrinho: (prod: Produto) => void
  mostrarCarrinho: boolean
  whatsappNumber: string
  delay: number
}) {
  const preco = getPreco(p)
  const waText = encodeURIComponent(`Olá! Tenho interesse no produto: *${p.nome}*`)

  return (
    <div className="card-produto" style={{ animationDelay: `${delay}ms` }} onClick={() => onVerDetalhes(p)}>
      <div className="card-img">
        {p.imagem_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.imagem_url} alt={p.nome} />
        ) : (
          <span className="card-img-placeholder">📦</span>
        )}
        {p.destaque && <span className="badge-dest">★ Destaque</span>}
      </div>
      <div className="card-body">
        <p className="card-nome">{p.nome}</p>
        {p.descricao && <p className="card-desc">{p.descricao}</p>}
        {preco !== null ? (
          <p className="card-preco">{formatBRL(preco)}</p>
        ) : (
          <p className="card-preco-consulta">Preço sob consulta</p>
        )}
      </div>
      
      {/* Action buttons inside the card */}
      <div className="card-cta" onClick={e => e.stopPropagation()}>
        {preco !== null ? (
          mostrarCarrinho ? (
            <button className="btn-add-carrinho" onClick={() => onAdicionarCarrinho(p)}>
              🛒 Adicionar ao Carrinho
            </button>
          ) : (
            whatsappNumber && (
              <a
                href={`https://wa.me/55${whatsappNumber}?text=${waText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="wa-btn-direct"
              >
                Pedir pelo WhatsApp
              </a>
            )
          )
        ) : (
          whatsappNumber && (
            <a
              href={`https://wa.me/55${whatsappNumber}?text=${encodeURIComponent(`Olá! Gostaria de consultar o preço de: *${p.nome}*`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="wa-btn-direct"
              style={{ background: '#64748b' }}
            >
              Consultar Preço
            </a>
          )
        )}
      </div>
    </div>
  )
})
