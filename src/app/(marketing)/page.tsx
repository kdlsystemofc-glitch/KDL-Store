'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

/* ── Dados ── */
const FEATURES = [
  { icon:'🧾', title:'PDV Inteligente',         desc:'Leitor de código de barras via câmera ou pistola USB/Bluetooth. Adiciona produto ao carrinho instantaneamente.',                                        pro:false },
  { icon:'📊', title:'Painel "Como foi?"',       desc:'Saiba em 30 segundos se o dia foi bom. Faturamento, lucro estimado e alertas direto no WhatsApp.',                                                   pro:true  },
  { icon:'👥', title:'CRM de Sumição',           desc:'Clientes que pararam de comprar ficam marcados como Morno, Frio ou Perdido. Mande WhatsApp com 1 clique.',                                          pro:true  },
  { icon:'💰', title:'Comissões de Puxadores',   desc:'Registre quem indicou o cliente e calcule a comissão automaticamente por venda. Puxador vê o próprio saldo.',                                       pro:true  },
  { icon:'🛡', title:'Garantias Digitais',       desc:'Certificado de garantia imprimível com QR Code de verificação. Nº de série e prazo vinculados ao produto.',                                         pro:false },
  { icon:'📒', title:'Fiado com Cobrança',       desc:'Registre compras a prazo e acione o cliente no WhatsApp na hora certa. Histórico completo por cliente.',                                            pro:true  },
  { icon:'📱', title:'Catálogo com QR Code',     desc:'Vitrine digital do seu estoque. Compartilhe o link ou imprima o QR Code para o cliente escanear.',                                                  pro:false },
  { icon:'💹', title:'DRE Simplificado',         desc:'Demonstrativo de Resultados real: receita, custo, despesas, lucro líquido. Sem contador, sem enrolação.',                                           pro:true  },
  { icon:'🔧', title:'Ordens de Serviço',        desc:'Vincule OS à venda. Rastreie instalação, reparo ou qualquer serviço pós-venda. Histórico por cliente.',                                             pro:true  },
  { icon:'🏷', title:'3 Tabelas de Preço',       desc:'Varejo, Atacado e VIP. O PDV aplica o preço certo automaticamente pelo perfil do cliente selecionado.',                                             pro:false },
  { icon:'🎁', title:'Brindes no PDV',           desc:'Item dado de cortesia aparece no recibo como BRINDE. Sai do lucro líquido corretamente no DRE.',                                                    pro:false },
  { icon:'🔒', title:'Fechamento de Caixa',      desc:'Feche o dia, quinzena ou mês. Compare caixa físico com o sistema e detecte diferenças na hora.',                                                    pro:true  },
]

const TESTIMONIALS = [
  { i:'C', name:'Carlos M.',  role:'Loja de Som Automotivo, 25 de Março', text:'"Antes eu controlava tudo em caderno. Hoje sei exatamente quanto lucrei essa semana. O painel \'Como foi?\' mudou minha vida."' },
  { i:'J', name:'Juliana P.', role:'Roupas Femininas, Feira da Madrugada', text:'"Meus clientes sumidos voltaram depois que comecei a mandar WhatsApp pelo sistema. Recuperei R$ 4.000 em um mês."' },
  { i:'R', name:'Roberto S.', role:'Eletrônicos e Acessórios, Centro de SP', text:'"O leitor de código de barras no celular é incrível. Bipo o produto e já vai pro carrinho. Economizo meia hora por dia."' },
]

const PLAN_START = [
  'PDV com leitor de código de barras (câmera + físico)',
  'Cadastro ilimitado de produtos (3 preços: Varejo/Atacado/VIP)',
  'Controle de estoque com alertas de mínimo',
  'Histórico de vendas completo',
  'Recibo imprimível + envio por WhatsApp',
  'Catálogo online com QR Code compartilhável',
  'Garantias digitais com certificado imprimível',
  'Cadastro de clientes e fornecedores',
  'Brindes no PDV (aparecem no recibo como BRINDE)',
  'Alerta de preço mínimo no PDV',
  '1 usuário',
]

const PLAN_PRO = [
  'Tudo do plano Start, mais:',
  'Painel "Como foi?" com envio por WhatsApp',
  'CRM de Clientes Sumidos (30/60/90 dias)',
  'Comissões de Puxadores/Indicadores',
  'DRE completo (Demonstrativo de Resultados)',
  'Fiado com cobrança 1-clique via WhatsApp',
  'Ordens de Serviço vinculadas a vendas',
  'Fechamento de caixa (diário/quinzenal/mensal/anual)',
  'Relatórios avançados por período',
  'Controle de acesso por usuário',
  'Até 5 usuários simultâneos',
]

/* ── Hook: contador animado ── */
function useCounter(target: number, dur = 2000) {
  const [v, setV] = useState(0)
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return; started.current = true
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setV(Math.round(ease * target))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, dur])
  return v
}

/* ── Componente Principal ── */
export default function LandingPage() {
  const c1 = useCounter(500)
  const c2 = useCounter(2)
  const c3 = useCounter(98)

  useEffect(() => {
    const els = document.querySelectorAll('.k-reveal')
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('k-visible'); obs.unobserve(e.target) }
      })
    }, { threshold: 0.08 })
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return (
    <>
      {/* ── NAV ── */}
      <nav className="k-nav">
        <div className="k-nav-logo">
          <span className="k-nav-logo-k">K</span>
          <span className="k-nav-logo-text">DL Store</span>
        </div>
        <div className="k-nav-links">
          <a href="#funcionalidades">Funcionalidades</a>
          <a href="#planos">Planos</a>
          <a href="#depoimentos">Depoimentos</a>
          <Link href="/login" className="k-nav-cta">Entrar no sistema</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="k-hero">
        <div className="k-hero-bg" />
        <div className="k-hero-overlay" />
        <div className="k-hero-scanlines" />
        <div className="k-hero-content">
          <div className="k-hero-badge">🇧🇷 Feito para o comércio brasileiro</div>
          <h1 className="k-hero-h1">
            Gerencie sua loja<br />
            <em>como nunca antes</em>
          </h1>
          <p className="k-hero-sub">
            O sistema feito para o lojista da 25 de Março e do comércio popular de SP.
            PDV, estoque, fiado, garantias e CRM — tudo no seu celular.
          </p>
          <div className="k-hero-btns">
            <Link href="/cadastro">
              <button className="k-btn-primary">Começar agora — R$ 65/mês</button>
            </Link>
            <a href="#funcionalidades">
              <button className="k-btn-secondary">Ver funcionalidades ↓</button>
            </a>
          </div>
          <div className="k-hero-stats">
            <div className="k-stat">
              <div className="k-stat-num">{c1}+</div>
              <div className="k-stat-label">lojas ativas</div>
            </div>
            <div className="k-stat">
              <div className="k-stat-num">R$ {c2}M+</div>
              <div className="k-stat-label">em vendas processadas</div>
            </div>
            <div className="k-stat">
              <div className="k-stat-num">{c3}%</div>
              <div className="k-stat-label">de satisfação</div>
            </div>
            <div className="k-stat">
              <div className="k-stat-num">Zero</div>
              <div className="k-stat-label">papel necessário</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CREDIBILIDADE ── */}
      <div className="k-cred">
        <span className="k-cred-label">Usado por lojistas de:</span>
        <div className="k-cred-items">
          {[['🔊','Som Automotivo'],['👗','Roupas'],['📱','Eletrônicos'],['👟','Calçados'],['🔧','Utilidades']].map(([e,l])=>(
            <span key={l} className="k-cred-item">{e} {l}</span>
          ))}
        </div>
      </div>

      {/* ── PROBLEMA vs SOLUÇÃO ── */}
      <section className="k-section k-section-light">
        <span className="k-eyebrow k-reveal">Diagnóstico honesto</span>
        <h2 className="k-heading k-reveal">Você se reconhece aqui?</h2>
        <p className="k-subtext k-reveal">A maioria dos lojistas vive assim. O KDL Store resolve cada um desses pontos.</p>
        <div className="k-pvs k-reveal">
          <div className="k-pvs-col k-pvs-bad">
            <h3>😓 Como é hoje</h3>
            {[
              ['✕','Controla estoque em caderno ou papelzinho'],
              ['✕','Emite garantia escrita à mão, perde no fundo da gaveta'],
              ['✕','Não sabe se o mês foi lucrativo ou só movimentado'],
              ['✕','Cliente some e você não tem como chamar de volta'],
              ['✕','Puxador trouxe cliente mas você esqueceu de pagar a comissão'],
              ['✕','Produto zerou no meio da semana e você não percebeu'],
            ].map(([d,t])=>(
              <div key={t} className="k-pvs-row">
                <div className="k-pvs-dot">{d}</div>
                <p>{t}</p>
              </div>
            ))}
          </div>
          <div className="k-pvs-col k-pvs-good">
            <h3>✅ Com o KDL Store</h3>
            {[
              ['✓','Estoque em tempo real com alerta automático de mínimo'],
              ['✓','Garantia digital com QR Code + certificado imprimível'],
              ["✓","Painel 'Como foi?' — lucro em 30 segundos"],
              ['✓','CRM de Sumição avisa e manda WhatsApp automático'],
              ['✓','Comissões calculadas automaticamente por venda'],
              ['✓','Alerta imediato + pedido direto ao fornecedor via WhatsApp'],
            ].map(([d,t])=>(
              <div key={t} className="k-pvs-row">
                <div className="k-pvs-dot">{d}</div>
                <p>{t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FUNCIONALIDADES ── */}
      <section id="funcionalidades" className="k-section k-section-white">
        <span className="k-eyebrow k-reveal">12 módulos integrados</span>
        <h2 className="k-heading k-reveal">Tudo que sua loja precisa</h2>
        <p className="k-subtext k-reveal">Sem precisar de outro sistema. Sem integração complicada. Funciona no celular.</p>
        <div className="k-features-grid k-reveal">
          {FEATURES.map((f)=>(
            <div key={f.title} className="k-feat">
              {f.pro && <span className="k-feat-badge">PRO</span>}
              <span className="k-feat-icon">{f.icon}</span>
              <div className="k-feat-title">{f.title}</div>
              <div className="k-feat-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMO FOI ── */}
      <section className="k-como-foi">
        <div className="k-como-foi-inner">
          <div className="k-como-foi-text k-reveal">
            <span className="k-eyebrow" style={{textAlign:'left',display:'block',marginBottom:'.875rem'}}>Diferencial exclusivo</span>
            <h2>Saiba em 30 segundos se o dia foi bom ou ruim.</h2>
            <p>O painel mais importante do KDL Store. Sem jargão, sem planilha.</p>
            <ul className="k-como-foi-list">
              <li>Faturamento total com variação vs. período anterior</li>
              <li>Lucro estimado, ticket médio e total de vendas</li>
              <li>Alertas: produtos zerados, fiado em aberto, comissões pendentes</li>
              <li>Insight automático baseado nos dados reais do dia</li>
              <li>Extrato completo compartilhável via WhatsApp com 1 toque</li>
              <li>Filtros: ontem, essa semana, esse mês, esse ano</li>
            </ul>
            <span className="k-cf-badge">⭐ Exclusivo do Plano PRO</span>
          </div>
          <div className="k-reveal k-d2">
            <div className="k-mockup">
              <div className="k-mockup-header">📊 COMO FOI? — Ontem</div>
              <div className="k-mockup-row"><span>Faturamento:</span><span className="k-mockup-highlight">R$ 1.847,00 ▲</span></div>
              <hr className="k-mockup-sep"/>
              <div className="k-mockup-row"><span>Vendas:</span><span>23</span></div>
              <div className="k-mockup-row"><span>Ticket médio:</span><span>R$ 80</span></div>
              <div className="k-mockup-row"><span>Despesas:</span><span>R$ 320</span></div>
              <div className="k-mockup-row"><span>Lucro est.:</span><span className="k-mockup-highlight">R$ 497 ✓</span></div>
              <hr className="k-mockup-sep"/>
              <div className="k-mockup-row k-mockup-alert"><span>⚠</span><span>2 produtos zerados</span></div>
              <div className="k-mockup-row k-mockup-alert"><span>📒</span><span>R$ 150 de fiado</span></div>
              <div className="k-mockup-insight">&quot;Dia lucrativo. Continue assim.&quot;</div>
              <button className="k-mockup-btn">💬 Compartilhar via WhatsApp</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── PLANOS ── */}
      <section id="planos" className="k-section k-section-light">
        <span className="k-eyebrow k-reveal">Preços</span>
        <h2 className="k-heading k-reveal">Simples e sem surpresa</h2>
        <p className="k-subtext k-reveal">Cancele quando quiser. Sem multa, sem contrato.</p>
        <div className="k-plans">
          <div className="k-plan k-reveal">
            <div className="k-plan-name">Start</div>
            <div className="k-plan-tagline">Para começar com o pé direito</div>
            <div className="k-plan-price">R$ 65<sub>/mês</sub></div>
            <div className="k-plan-period">por loja · 1 usuário</div>
            <div className="k-plan-divider"/>
            <ul className="k-plan-feats">{PLAN_START.map(f=><li key={f}>{f}</li>)}</ul>
            <Link href="/cadastro"><button className="k-plan-cta k-plan-cta-out">Começar com Start</button></Link>
          </div>
          <div className="k-plan k-plan-pro k-reveal k-d2">
            <div className="k-plan-badge">⭐ MAIS ESCOLHIDO</div>
            <div className="k-plan-name">Pro</div>
            <div className="k-plan-tagline">Gestão completa para crescer de verdade</div>
            <div className="k-plan-price">R$ 95<sub>/mês</sub></div>
            <div className="k-plan-period">por loja · até 5 usuários</div>
            <div className="k-plan-divider"/>
            <ul className="k-plan-feats">{PLAN_PRO.map(f=><li key={f}>{f}</li>)}</ul>
            <Link href="/cadastro"><button className="k-plan-cta">Começar com Pro</button></Link>
          </div>
        </div>
        <p className="k-plans-note k-reveal">Sem contrato de fidelidade. Cancele quando quiser. Suporte via WhatsApp.</p>
      </section>

      {/* ── COMO COMEÇAR ── */}
      <section className="k-section k-section-white">
        <span className="k-eyebrow k-reveal">Onboarding</span>
        <h2 className="k-heading k-reveal">Do zero ao PDV em 5 minutos</h2>
        <p className="k-subtext k-reveal">Sem instalação. Funciona no navegador do celular ou computador.</p>
        <div className="k-steps">
          {[
            ['1','Crie sua conta em 2 minutos','Sem cartão de crédito no início. Sua loja é configurada automaticamente.'],
            ['2','Cadastre seus produtos','Bipe o código de barras ou adicione pelo nome. Foto e preço opcionais.'],
            ['3','Comece a vender','PDV pronto imediatamente. Primeira venda em menos de 1 minuto.'],
          ].map(([n,t,d],i)=>(
            <div key={n} className={`k-step k-reveal k-d${i+1}`}>
              <div className="k-step-num">{n}</div>
              <div className="k-step-title">{t}</div>
              <div className="k-step-desc">{d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DEPOIMENTOS ── */}
      <section id="depoimentos" className="k-section k-section-light">
        <span className="k-eyebrow k-reveal">Clientes</span>
        <h2 className="k-heading k-reveal">Quem usa, não volta atrás</h2>
        <div className="k-testimonials">
          {TESTIMONIALS.map((t,i)=>(
            <div key={t.name} className={`k-testimony k-reveal k-d${i+1}`}>
              <div className="k-stars">★★★★★</div>
              <p className="k-testimony-text">{t.text}</p>
              <div className="k-testimony-author">
                <div className="k-avatar">{t.i}</div>
                <div>
                  <div className="k-author-name">{t.name}</div>
                  <div className="k-author-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="k-cta-final">
        <div className="k-cta-bg"/><div className="k-cta-overlay"/><div className="k-cta-scanlines"/>
        <div className="k-cta-inner k-reveal">
          <h2>Sua loja merece um sistema de verdade.</h2>
          <p>Comece hoje por R$ 65/mês. Sem contrato, sem complicação.</p>
          <Link href="/cadastro"><button className="k-cta-btn">Criar minha conta grátis →</button></Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="k-footer">
        <div className="k-footer-inner">
          <div>
            <div className="k-footer-logo">
              <span className="k-footer-logo-k">K</span>
              <span className="k-footer-logo-text">DL Store</span>
            </div>
            <div className="k-footer-tagline">Feito para o comércio brasileiro 🇧🇷</div>
          </div>
          <div className="k-footer-links">
            <a href="#planos">Planos</a>
            <a href="#funcionalidades">Funcionalidades</a>
            <a href="https://wa.me/5511999999999">Suporte via WhatsApp</a>
            <Link href="/login">Entrar</Link>
          </div>
          <div className="k-footer-copy">© 2026 KDL Store. Todos os direitos reservados.</div>
        </div>
      </footer>
    </>
  )
}
