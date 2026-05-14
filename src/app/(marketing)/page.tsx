'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

/* ── Hook: contador animado de 0 → target em `dur` ms ── */
function useCounter(target: number, dur = 2000) {
  const [val, setVal] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    const t0 = performance.now()

    const tick = (now: number) => {
      const elapsed = now - t0
      const progress = Math.min(elapsed / dur, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setVal(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, dur])

  return val
}

/* ── Componente ── */
export default function LandingPage() {
  const c1 = useCounter(500)   // lojas
  const c2 = useCounter(2)     // R$ 2M
  const c3 = useCounter(98)    // satisfação

  return (
    <>
      {/* ══ NAV ══ */}
      <nav className="kl-nav" aria-label="Navegação principal">
        <div className="kl-nav-logo" aria-label="KDL Store">
          <span className="kl-nav-logo-k" aria-hidden="true">K</span>
          <span className="kl-nav-logo-rest">DL Store</span>
        </div>
        <div className="kl-nav-links">
          <a href="#funcionalidades" className="kl-nav-link">Funcionalidades</a>
          <a href="#planos" className="kl-nav-link">Planos</a>
          <a href="#depoimentos" className="kl-nav-link">Depoimentos</a>
          <Link href="/login" className="kl-nav-cta">
            Entrar no sistema
          </Link>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section className="hero" aria-label="Apresentação do KDL Store">
        {/* Vídeo de fundo */}
        <video
          className="hero-video"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
          preload="auto"
        >
          <source src="/video_1362502_1778758950.mp4" type="video/mp4" />
        </video>

        {/* Overlay escuro */}
        <div className="hero-overlay" aria-hidden="true" />

        {/* Conteúdo */}
        <div className="hero-content">

          {/* Badge */}
          <div className="kl-hero-badge" role="note">
            🇧🇷 Feito para o comércio brasileiro
          </div>

          {/* H1 */}
          <h1 className="kl-hero-h1">
            <span className="line-white">Gerencie sua loja</span>
            <span className="line-green">como nunca antes</span>
          </h1>

          {/* Subtítulo */}
          <p className="kl-hero-sub">
            O sistema feito para o lojista da 25&nbsp;de&nbsp;Março.
            PDV, estoque, garantias e CRM&nbsp;—&nbsp;tudo no seu celular.
          </p>

          {/* CTAs */}
          <div className="kl-hero-btns">
            <Link href="/cadastro">
              <button className="kl-btn-hero-primary" type="button">
                Começar agora — R$&nbsp;65/mês
              </button>
            </Link>
            <a href="#funcionalidades">
              <button className="kl-btn-hero-secondary" type="button">
                Ver funcionalidades ↓
              </button>
            </a>
          </div>

          {/* Contadores */}
          <div className="kl-hero-stats" aria-label="Números do KDL Store">
            <div className="kl-stat">
              <div className="kl-stat-num" aria-live="polite">{c1}+</div>
              <div className="kl-stat-label">lojas ativas</div>
            </div>
            <div className="kl-stat">
              <div className="kl-stat-num" aria-live="polite">R$&nbsp;{c2}M+</div>
              <div className="kl-stat-label">processados</div>
            </div>
            <div className="kl-stat">
              <div className="kl-stat-num" aria-live="polite">{c3}%</div>
              <div className="kl-stat-label">satisfação</div>
            </div>
            <div className="kl-stat">
              <div className="kl-stat-num">Zero</div>
              <div className="kl-stat-label">papel</div>
            </div>
          </div>

        </div>
      </section>

      {/* Próximas seções serão adicionadas aqui após aprovação */}
    </>
  )
}
