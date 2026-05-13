'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

/* ── Dados ── */
const FEATURES = [
  { icon: '🏪', title: 'PDV com Código de Barras', desc: 'Bipe pelo celular ou pistola física. Adiciona ao carrinho em 1 segundo.' },
  { icon: '📊', title: 'Painel "Como Foi?"', desc: 'Faturamento, lucro e alertas em 30 segundos. Envie pelo WhatsApp.' },
  { icon: '🎯', title: 'CRM de Clientes Sumidos', desc: 'Alerta automático de clientes que pararam de comprar.' },
  { icon: '🤝', title: 'Comissões de Puxadores', desc: 'Controle comissão dos indicadores da rua. Tudo rastreado.' },
  { icon: '🛡️', title: 'Garantias Digitais', desc: 'Emita garantia com QR code. Fim do papelzinho de garantia.' },
  { icon: '💹', title: 'DRE Simplificado', desc: 'Lucro real, despesas e fiado em um painel sem jargões.' },
  { icon: '🌐', title: 'Catálogo Online + QR', desc: 'Vitrine digital pronta para WhatsApp e Instagram.' },
  { icon: '📒', title: 'Fiado com 1 Clique', desc: 'Registre fiado e cobre pelo WhatsApp direto do sistema.' },
  { icon: '🔧', title: 'Ordens de Serviço', desc: 'Abertura de OS vinculada à venda. Rastreamento técnico.' },
  { icon: '🏦', title: 'Fechamento de Caixa', desc: 'Diário, quinzenal ou mensal. Diferença calculada na hora.' },
  { icon: '💎', title: 'Varejo / Atacado / VIP', desc: '3 tabelas de preço por produto. Cobra certo em cada cliente.' },
  { icon: '🎁', title: 'Brindes no PDV', desc: 'Brinde aparece no recibo e abate do lucro corretamente.' },
]

const TESTIMONIALS = [
  {
    text: '"Antes eu não sabia se estava lucrando ou só girando dinheiro. Agora fecho o dia e vejo tudo na tela do celular. Essencial para a minha loja."',
    name: 'Ricardo Moura',
    role: 'Loja de som automotivo — 25 de Março, SP',
    initial: 'R',
  },
  {
    text: '"O fiado era tudo anotado em caderno. Perdia muito dinheiro. Com o KDL Store mando WhatsApp pro cliente direto do sistema. Simples demais."',
    name: 'Dona Fátima',
    role: 'Loja de roupas — Feira da Madrugada, SP',
    initial: 'F',
  },
  {
    text: '"Meus puxadores adoraram o sistema de comissão. Agora eles mesmos acompanham o que vão receber. Zero briga no fim do mês."',
    name: 'Alessandro Pinto',
    role: 'Eletrônicos e acessórios — Brás, SP',
    initial: 'A',
  },
]

const PLAN_START = [
  'PDV ilimitado', 'Cadastro de produtos', 'Controle de estoque',
  'Leitor de código de barras', 'Recibo imprimível',
  'Catálogo online com QR Code', 'Garantias digitais', '1 usuário',
]

const PLAN_PRO = [
  'Tudo do plano Start', 'Painel "Como Foi?" com WhatsApp',
  'CRM de Clientes Sumidos', 'Comissões de puxadores',
  'DRE completo', 'Fiado com cobrança via WhatsApp',
  'Ordens de serviço', 'Fechamento de caixa',
  'Relatórios avançados', 'Convite de funcionários',
  'Controle de acesso em tempo real', 'Até 5 usuários',
]

/* ── Counter hook ── */
function useCounter(target: number, duration = 1800) {
  const [value, setValue] = useState(0)
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(ease * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])
  return value
}

/* ── Reveal hook ── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.ld-reveal')
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target) } })
    }, { threshold: 0.12 })
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}

/* ── Componente Principal ── */
export default function LandingPage() {
  useReveal()
  const lojas     = useCounter(500)
  const vendas    = useCounter(2)
  const satisf    = useCounter(98)

  return (
    <>
      {/* ── NAV ── */}
      <nav className="ld-nav">
        <div className="ld-nav-logo">KDL <span>Store</span></div>
        <div className="ld-nav-links">
          <a href="#funcionalidades">Funcionalidades</a>
          <a href="#planos">Planos</a>
          <a href="#depoimentos">Depoimentos</a>
          <Link href="/login" className="ld-nav-cta">Entrar</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="ld-hero">
        <div className="ld-hero-bg" />
        <div className="ld-hero-overlay" />
        <div className="ld-hero-content">
          <div className="ld-hero-badge">
            <span />
            Sistema feito para o comércio brasileiro
          </div>
          <h1 className="ld-hero-title">
            Gerencie sua loja<br />como <em>nunca antes</em>
          </h1>
          <p className="ld-hero-sub">
            O sistema feito para o comércio de rua brasileiro. PDV, estoque, fiado, garantias e CRM — tudo no celular.
          </p>
          <div className="ld-hero-ctas">
            <Link href="/cadastro">
              <button className="ld-btn-primary">Começar agora — R$ 65/mês</button>
            </Link>
            <a href="#funcionalidades">
              <button className="ld-btn-secondary">Ver demonstração</button>
            </a>
          </div>
          <div className="ld-hero-stats">
            <div className="ld-stat">
              <div className="ld-stat-num">{lojas}+</div>
              <div className="ld-stat-label">lojas ativas</div>
            </div>
            <div className="ld-stat">
              <div className="ld-stat-num">R$ {vendas}M+</div>
              <div className="ld-stat-label">em vendas processadas</div>
            </div>
            <div className="ld-stat">
              <div className="ld-stat-num">{satisf}%</div>
              <div className="ld-stat-label">de satisfação</div>
            </div>
            <div className="ld-stat">
              <div className="ld-stat-num">Zero</div>
              <div className="ld-stat-label">papel necessário</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CREDIBILITY BAR ── */}
      <div className="ld-credbar">
        <p className="ld-credbar-text">Usado por lojistas da 25 de Março, Feira da Madrugada e comércio popular de SP</p>
        <div className="ld-credbar-icons">
          {[['🔊','Som Automotivo'],['👗','Roupas'],['📱','Eletrônicos'],['👟','Calçados'],['🏠','Utilidades']].map(([icon, label]) => (
            <div key={label} className="ld-credbar-item">
              <span>{icon}</span><span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── PROBLEMA vs SOLUÇÃO ── */}
      <section className="ld-section ld-section-light">
        <h2 className="ld-section-title ld-reveal">Reconhece essa realidade?</h2>
        <p className="ld-section-sub ld-reveal">Milhares de lojistas vivem assim todo dia. O KDL Store resolve cada um desses problemas.</p>
        <div className="ld-pvs-grid">
          <div className="ld-pvs-col ld-pvs-col-bad ld-reveal">
            <h3>😓 Como é hoje</h3>
            {[
              ['📓','Estoque no caderno','Nunca sabe o que tem de verdade.'],
              ['📝','Garantia em papelzinho','Cliente perde, você perde também.'],
              ['❓','Não sabe se lucra','O dinheiro some sem explicação.'],
              ['👻','Cliente sumido','Para de comprar e você nem sabe.'],
              ['📊','Comissão no chute','Briga com puxador todo mês.'],
              ['📵','Sem catálogo digital','Cliente pede foto, você manda WhatsApp.'],
            ].map(([icon, title, desc]) => (
              <div key={title} className="ld-pvs-item">
                <span className="ld-pvs-icon">{icon}</span>
                <p><strong>{title}</strong>{desc}</p>
              </div>
            ))}
          </div>
          <div className="ld-pvs-col ld-pvs-col-good ld-reveal ld-reveal-delay-2">
            <h3>✅ Com o KDL Store</h3>
            {[
              ['📦','Estoque em tempo real','Cada entrada e saída registrada automaticamente.'],
              ['🛡️','Garantia digital com QR','Cliente consulta pelo celular. Sem papel.'],
              ['💹','DRE do dia em 30s','Faturamento, lucro e despesas na palma da mão.'],
              ['🎯','CRM de Clientes Sumidos','Alerta quando cliente some. Manda WhatsApp.'],
              ['🤝','Comissão automática','Puxador vê o próprio saldo. Zero conflito.'],
              ['🌐','Catálogo online + QR','Vitrine digital pronta para compartilhar.'],
            ].map(([icon, title, desc]) => (
              <div key={title} className="ld-pvs-item">
                <span className="ld-pvs-icon">{icon}</span>
                <p><strong>{title}</strong>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="funcionalidades" className="ld-section ld-section-white">
        <h2 className="ld-section-title ld-reveal">Tudo que sua loja precisa</h2>
        <p className="ld-section-sub ld-reveal">12 módulos integrados. Sem precisar de outro sistema.</p>
        <div className="ld-features-grid">
          {FEATURES.map((f, i) => (
            <div key={f.title} className={`ld-feature-card ld-reveal ld-reveal-delay-${(i % 4) + 1}`}>
              <span className="ld-feature-icon">{f.icon}</span>
              <div className="ld-feature-title">{f.title}</div>
              <div className="ld-feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DESTAQUE "COMO FOI?" ── */}
      <section className="ld-highlight">
        <div className="ld-highlight-bg" />
        <div className="ld-highlight-inner">
          <div className="ld-reveal">
            <h2>Saiba em 30 segundos se o dia foi bom ou ruim.</h2>
            <p>
              O Painel "Como Foi?" é o primeiro que você vê ao abrir o sistema. Feito para lojistas que não têm tempo para ficar analisando planilha.
            </p>
            <ul className="ld-highlight-bullets">
              <li>Faturamento total do dia com variação vs. ontem</li>
              <li>Lucro estimado, ticket médio e despesas</li>
              <li>Alertas de produtos zerados e fiado em aberto</li>
              <li>Insight automático: "Dia lucrativo. Continue assim."</li>
              <li>Botão de compartilhar resumo pelo WhatsApp</li>
            </ul>
          </div>
          <div className="ld-reveal ld-reveal-delay-2">
            <div className="ld-mockup">
              <div className="ld-mockup-header">📊 Como foi? — Hoje</div>
              <div className="ld-mockup-value">R$ 3.840</div>
              <div className="ld-mockup-label">▲ R$ 620 a mais que ontem</div>
              <div className="ld-mockup-row"><span>Vendas</span><span>14 pedidos</span></div>
              <div className="ld-mockup-row"><span>Ticket médio</span><span>R$ 274</span></div>
              <div className="ld-mockup-row"><span>Despesas</span><span>R$ 380</span></div>
              <div className="ld-mockup-row"><span>Lucro estimado</span><span style={{color:'#34d399'}}>R$ 1.240</span></div>
              <div className="ld-mockup-row"><span>📒 Fiado em aberto</span><span style={{color:'#fbbf24'}}>R$ 520</span></div>
              <div className="ld-mockup-insight">💡 Dia lucrativo. Continue assim.</div>
              <button className="ld-mockup-wa">💬 Compartilhar via WhatsApp</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── PLANOS ── */}
      <section id="planos" className="ld-section ld-section-light">
        <h2 className="ld-section-title ld-reveal">Planos simples e sem surpresa</h2>
        <p className="ld-section-sub ld-reveal">Sem contrato de fidelidade. Cancele quando quiser.</p>
        <div className="ld-plans-grid">
          {/* Start */}
          <div className="ld-plan-card ld-reveal">
            <div className="ld-plan-name">Start</div>
            <div className="ld-plan-price">R$ 65<span>/mês</span></div>
            <div className="ld-plan-period">Para começar com o pé direito</div>
            <ul className="ld-plan-features">
              {PLAN_START.map(f => <li key={f}>{f}</li>)}
            </ul>
            <Link href="/cadastro">
              <button className="ld-plan-cta ld-plan-cta-secondary">Começar com Start</button>
            </Link>
          </div>
          {/* Pro */}
          <div className="ld-plan-card ld-plan-card-featured ld-reveal ld-reveal-delay-2">
            <div className="ld-plan-badge">⭐ Mais escolhido</div>
            <div className="ld-plan-name">Pro</div>
            <div className="ld-plan-price">R$ 95<span>/mês</span></div>
            <div className="ld-plan-period">Para lojistas que querem crescer</div>
            <ul className="ld-plan-features">
              {PLAN_PRO.map(f => <li key={f}>{f}</li>)}
            </ul>
            <Link href="/cadastro">
              <button className="ld-plan-cta">Começar com Pro</button>
            </Link>
          </div>
        </div>
        <p className="ld-plans-note ld-reveal">🔒 Sem contrato de fidelidade. Cancele quando quiser. Sem burocracia.</p>
      </section>

      {/* ── COMO COMEÇAR ── */}
      <section className="ld-section ld-section-white">
        <h2 className="ld-section-title ld-reveal">Como começar</h2>
        <p className="ld-section-sub ld-reveal">Três passos. Sem instalação. Direto do celular.</p>
        <div className="ld-steps">
          {[
            ['1', 'Crie sua conta em 2 minutos', 'E-mail e senha. Sem cartão de crédito no começo.'],
            ['2', 'Cadastre seus produtos', 'Bipe o código de barras ou cadastre pelo nome.'],
            ['3', 'Comece a vender', 'PDV pronto pra uso. Primeira venda em menos de 5 minutos.'],
          ].map(([n, title, desc]) => (
            <div key={n} className={`ld-step ld-reveal ld-reveal-delay-${n}`}>
              <div className="ld-step-num">{n}</div>
              <div className="ld-step-title">{title}</div>
              <div className="ld-step-desc">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DEPOIMENTOS ── */}
      <section id="depoimentos" className="ld-section ld-section-light">
        <h2 className="ld-section-title ld-reveal">O que os lojistas dizem</h2>
        <p className="ld-section-sub ld-reveal">Resultados reais de quem usa no dia a dia.</p>
        <div className="ld-testimonials">
          {TESTIMONIALS.map((t, i) => (
            <div key={t.name} className={`ld-testimonial ld-reveal ld-reveal-delay-${i + 1}`}>
              <div className="ld-stars">★★★★★</div>
              <p className="ld-testimonial-text">{t.text}</p>
              <div className="ld-testimonial-author">
                <div className="ld-testimonial-avatar">{t.initial}</div>
                <div>
                  <div className="ld-testimonial-name">{t.name}</div>
                  <div className="ld-testimonial-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="ld-cta-final">
        <div className="ld-cta-bg" />
        <div className="ld-cta-final-inner">
          <h2>Sua loja merece um sistema de verdade.</h2>
          <p>Comece hoje por R$ 65/mês. Sem contrato, sem complicação.</p>
          <Link href="/cadastro">
            <button className="ld-btn-cta-final">Criar minha conta grátis →</button>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="ld-footer">
        <div className="ld-footer-inner">
          <div>
            <div className="ld-footer-logo">KDL <span>Store</span></div>
            <div className="ld-footer-tagline">Feito para o comércio brasileiro 🇧🇷</div>
          </div>
          <div className="ld-footer-links">
            <a href="#planos">Planos</a>
            <a href="#funcionalidades">Funcionalidades</a>
            <a href="#depoimentos">Depoimentos</a>
            <Link href="/login">Entrar</Link>
            <Link href="/cadastro">Criar conta</Link>
          </div>
          <div className="ld-footer-copy">© 2026 KDL Store. Todos os direitos reservados.</div>
        </div>
      </footer>
    </>
  )
}
