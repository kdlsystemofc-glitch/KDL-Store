'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

/* ── SVG Icons ── */
const I = {
  pdv: <svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M7 8h.01M12 8h5M7 12h10"/></svg>,
  chart: <svg viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M7 16l4-4 4 4 4-6"/></svg>,
  crm: <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  commission: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  shield: <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  dre: <svg viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  catalog: <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>,
  fiado: <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M12 8v4M12 16h.01"/></svg>,
  os: <svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  cash: <svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 10h2M20 10h2M2 14h2M20 14h2"/></svg>,
  price: <svg viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none"/></svg>,
  gift: <svg viewBox="0 0 24 24"><path d="M20 12v10H4V12M22 7H2v5h20zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
}

const FEATURES = [
  { icon: I.pdv,        title: 'PDV com Leitor de Código de Barras', desc: 'Bipe pelo celular ou pistola física USB/Bluetooth. Produto vai ao carrinho instantaneamente. Alerta quando desconto passa do preço mínimo autorizado.' },
  { icon: I.chart,      title: 'Painel "Como Foi?"', desc: 'Resumo do negócio em 30 segundos: faturamento, lucro estimado, ticket médio, despesas e alertas operacionais. Compartilhe o extrato formatado via WhatsApp com 1 clique.' },
  { icon: I.crm,        title: 'CRM de Clientes Sumidos', desc: 'O sistema detecta clientes que pararam de comprar além de um prazo configurável. Você recebe um alerta e envia mensagem de reativação pelo WhatsApp sem sair da plataforma.' },
  { icon: I.commission, title: 'Comissões de Puxadores', desc: 'Cadastre indicadores externos com percentual por venda. O sistema calcula automaticamente o que cada um tem a receber. Puxador acompanha o próprio saldo em tempo real.' },
  { icon: I.shield,     title: 'Garantias Digitais', desc: 'Emita certificados de garantia com QR Code. Clientes consultam a qualquer momento pelo celular. Fim do papelzinho perdido. Registre modelo, série e prazo de cobertura.' },
  { icon: I.dre,        title: 'DRE Simplificado', desc: 'Demonstrativo de resultado real: receitas, despesas lançadas, custo de mercadoria, brindes e lucro líquido. Filtros por dia, semana, mês ou período customizado.' },
  { icon: I.catalog,    title: 'Catálogo Online com QR Code', desc: 'Vitrine digital gerada automaticamente com seus produtos cadastrados. QR Code pronto para imprimir ou compartilhar no WhatsApp e Instagram.' },
  { icon: I.fiado,      title: 'Fiado com Cobrança via WhatsApp', desc: 'Registre vendas no fiado vinculadas ao cliente. Controle saldo, vencimento e histórico. Envie cobrança formatada pelo WhatsApp com um clique, sem digitar nada.' },
  { icon: I.os,         title: 'Ordens de Serviço', desc: 'Abra OS vinculada a uma venda. Registre itens, prazo e técnico responsável. Histórico completo por cliente. Ideal para lojas com serviço de instalação ou manutenção.' },
  { icon: I.cash,       title: 'Fechamento de Caixa', desc: 'Conferência do caixa por turno ou período. Calcula diferença entre valor esperado e contado. Histórico de fechamentos com visão diária, quinzenal, mensal e anual.' },
  { icon: I.price,      title: 'Varejo / Atacado / VIP', desc: 'Cada produto tem 3 tabelas de preço independentes. O PDV aplica o preço certo automaticamente conforme o perfil do cliente, sem precisar fazer conta na hora.' },
  { icon: I.gift,       title: 'Brindes no PDV', desc: 'Adicione itens como brinde na venda. O brinde aparece no recibo imprimível e é deduzido corretamente do lucro no DRE, evitando falhas na contabilidade.' },
]

const TESTIMONIALS = [
  { text: '"Eu não sabia se estava lucrando ou só girando dinheiro. Com o KDL Store, fecho o caixa e vejo tudo em 30 segundos. Mudou minha relação com a loja."', name: 'Ricardo Moura', role: 'Loja de som automotivo, SP', i: 'R' },
  { text: '"O fiado estava me matando. Perdia dinheiro sem saber. Agora mando o WhatsApp de cobrança pra cada cliente direto do sistema. Zero stress."', name: 'Fátima Souza', role: 'Moda feminina, SP', i: 'F' },
  { text: '"Meus puxadores queriam saber o que iam receber todo mês. Agora eles mesmos consultam o saldo. Acabou a briga. É transparência total."', name: 'Alessandro Pinto', role: 'Eletrônicos e acessórios, SP', i: 'A' },
]

const PLAN_START = ['PDV ilimitado + leitor de código de barras','Cadastro de produtos com foto e EAN','Controle de estoque em tempo real','Catálogo online com QR Code','Garantias digitais por produto','Recibo imprimível por venda','Cadastro de clientes e fornecedores','1 usuário']
const PLAN_PRO   = ['Tudo do plano Start, mais:','Painel "Como Foi?" com envio por WhatsApp','CRM de Clientes Sumidos','Comissões de puxadores','DRE com lucro real','Fiado com cobrança via WhatsApp','Ordens de serviço','Fechamento de caixa multi-período','Relatórios avançados e histórico','Múltiplos usuários com controle de acesso','Até 5 funcionários no mesmo sistema']

function useCounter(target: number, dur = 1800) {
  const [v, setV] = useState(0)
  const done = useRef(false)
  useEffect(() => {
    if (done.current) return; done.current = true
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1)
      setV(Math.round((1 - Math.pow(1 - p, 3)) * target))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, dur])
  return v
}

export default function LandingPage() {
  const c1 = useCounter(500)
  const c2 = useCounter(2)
  const c3 = useCounter(98)

  useEffect(() => {
    const els = document.querySelectorAll('.lr')
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); obs.unobserve(e.target) } })
    }, { threshold: 0.1 })
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return (
    <>
      {/* NAV */}
      <nav className="ln">
        <div className="ln-logo">KDL <em>Store</em></div>
        <div className="ln-links">
          <a href="#funcionalidades">Funcionalidades</a>
          <a href="#planos">Planos</a>
          <a href="#depoimentos">Depoimentos</a>
          <Link href="/login" className="ln-cta">Entrar no sistema</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="lh">
        <video className="lh-video" autoPlay muted loop playsInline preload="auto" src="/hero-video.mp4" />
        <div className="lh-overlay" />
        <div className="lh-content">
          <div className="lh-label"><span />Sistema de gestão para comércio</div>
          <h1 className="lh-title">
            Sua loja no controle.<br />
            <em>Seu lucro visível.</em>
          </h1>
          <p className="lh-sub">
            PDV, estoque, fiado, garantias e CRM integrados em uma plataforma construída para o ritmo do comércio popular brasileiro. Tudo pelo celular.
          </p>
          <div className="lh-btns">
            <Link href="/cadastro"><button className="lh-btn-p">Começar agora — R$ 65/mês</button></Link>
            <a href="#funcionalidades"><button className="lh-btn-s">Explorar funcionalidades →</button></a>
          </div>
          <div className="lh-stats">
            {[
              [c1 + '+', 'lojas ativas'],
              ['R$ ' + c2 + 'M+', 'em vendas processadas'],
              [c3 + '%', 'de satisfação'],
              ['Zero', 'papel necessário'],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="lh-stat-num">{n}</div>
                <div className="lh-stat-label">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEMA vs SOLUÇÃO */}
      <section className="ls ls-dark2">
        <div className="ls-eyebrow lr">Diagnóstico honesto</div>
        <h2 className="ls-heading lr">Você se reconhece aqui?</h2>
        <p className="ls-sub lr">A maioria dos lojistas vive assim. O KDL Store resolve cada um desses pontos.</p>
        <div className="lpvs">
          <div className="lpvs-col lpvs-bad lr">
            <h3>✕ Sem sistema</h3>
            {[
              ['✕','Estoque no caderno','Sem visibilidade real do que tem na prateleira. Só descobre que acabou quando o cliente pergunta.'],
              ['✕','Garantia em papel','Cliente perde o papel, você não tem comprovante. Reclamação vira dor de cabeça.'],
              ['✕','Não sabe o lucro real','O dinheiro da gaveta parece muito, mas no fim do mês sobra pouco ou nada.'],
              ['✕','Cliente some e você não sabe','Bons clientes param de aparecer e você não tem como identificar nem reativar.'],
              ['✕','Comissão no improviso','Puxador cobra o que acha que é certo. Vira conflito todo fim de mês.'],
              ['✕','Catálogo só no WhatsApp','Manda foto por foto. Sem preço, sem padronização, sem vitrine profissional.'],
            ].map(([dot, title, desc]) => (
              <div key={title} className="lpvs-item">
                <div className="lpvs-dot">{dot}</div>
                <div><strong>{title}</strong><p>{desc}</p></div>
              </div>
            ))}
          </div>
          <div className="lpvs-col lpvs-good lr lr-d2">
            <h3>✓ Com o KDL Store</h3>
            {[
              ['✓','Estoque em tempo real','Cada venda e entrada atualiza o saldo automaticamente. Alerta quando está acabando.'],
              ['✓','Garantia digital com QR Code','Cliente escaneia e consulta. Você tem histórico completo com número de série e prazo.'],
              ['✓','DRE do dia em 30 segundos','Faturamento, custo, despesas e lucro líquido num painel sem jargões.'],
              ['✓','CRM de Clientes Sumidos','Sistema detecta quem parou de comprar. Você manda WhatsApp de reativação com 1 clique.'],
              ['✓','Comissão automática e transparente','Puxador acessa o próprio saldo. Sem chute, sem conflito, sem surpresa.'],
              ['✓','Catálogo online com QR Code','Vitrine profissional gerada automaticamente. Compartilhe no WhatsApp e Instagram.'],
            ].map(([dot, title, desc]) => (
              <div key={title} className="lpvs-item">
                <div className="lpvs-dot">{dot}</div>
                <div><strong>{title}</strong><p>{desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="funcionalidades" className="ls ls-dark">
        <div className="ls-eyebrow lr">12 módulos integrados</div>
        <h2 className="ls-heading lr">Tudo que sua loja precisa</h2>
        <p className="ls-sub lr">Sem precisar de outro sistema. Sem integração complicada. Funciona do celular.</p>
        <div className="lf-grid">
          {FEATURES.map((f, i) => (
            <div key={f.title} className={`lf-card lr lr-d${(i % 4) + 1}`}>
              <div className="lf-icon">{f.icon}</div>
              <div className="lf-title">{f.title}</div>
              <div className="lf-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* DESTAQUE COMO FOI */}
      <section className="ls ls-dark2">
        <div className="lhlt">
          <div className="lhlt-text lr">
            <div className="ls-eyebrow" style={{textAlign:'left',marginBottom:'.875rem'}}>Diferencial exclusivo</div>
            <h2>Saiba em 30 segundos se o dia foi bom ou ruim.</h2>
            <p>O Painel "Como Foi?" é o primeiro que você vê ao abrir o sistema. Projetado para quem não tem tempo para planilha e precisa de uma resposta direta sobre o negócio.</p>
            <ul className="lhlt-list">
              <li>Faturamento do período com variação vs. período anterior</li>
              <li>Lucro estimado, ticket médio e total de vendas</li>
              <li>Alertas: produtos zerados, fiado em aberto, comissões pendentes</li>
              <li>Insight automático baseado nos dados reais do dia</li>
              <li>Extrato completo compartilhável via WhatsApp com 1 toque</li>
              <li>Filtros por ontem, semana, mês ou ano</li>
            </ul>
          </div>
          <div className="lr lr-d2">
            <div className="lmk">
              <div className="lmk-topbar">
                <div className="lmk-dot" style={{background:'#ff5f57'}}/>
                <div className="lmk-dot" style={{background:'#ffbd2e'}}/>
                <div className="lmk-dot" style={{background:'#28ca41'}}/>
                <span className="lmk-title">Como foi? — KDL Store</span>
                <div className="lmk-period">
                  {['Ontem','Semana','Mês'].map((t,i) => <span key={t} className={`lmk-tab${i===0?' active':''}`}>{t}</span>)}
                </div>
              </div>
              <div className="lmk-kpi">R$ 3.840</div>
              <div className="lmk-kpi-var">▲ R$ 620 a mais que ontem</div>
              <div className="lmk-kpi-label">Faturamento total do período</div>
              {[['Vendas realizadas','14 pedidos'],['Ticket médio','R$ 274'],['Despesas lançadas','R$ 380'],['Lucro estimado','R$ 1.240'],['📒 Fiado gerado','R$ 520']].map(([k,v]) => (
                <div className="lmk-row" key={k}><span>{k}</span><span style={v.includes('1.240')?{color:'#34d399'}:undefined}>{v}</span></div>
              ))}
              <div className="lmk-insight">💡 Dia lucrativo. Margem acima da média da semana. Continue assim.</div>
              <button className="lmk-wa">💬 Compartilhar resumo via WhatsApp</button>
            </div>
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="ls ls-dark">
        <div className="ls-eyebrow lr">Preços</div>
        <h2 className="ls-heading lr">Simples e sem surpresa</h2>
        <p className="ls-sub lr">Cancele quando quiser. Sem multa, sem contrato, sem burocracia.</p>
        <div className="lp-grid">
          <div className="lp-card lr">
            <div className="lp-name">Start</div>
            <div className="lp-tagline">Para quem está começando com gestão</div>
            <div className="lp-price">R$ 65<sub>/mês</sub></div>
            <div className="lp-period">por loja · 1 usuário</div>
            <div className="lp-divider"/>
            <ul className="lp-feats">{PLAN_START.map(f=><li key={f}>{f}</li>)}</ul>
            <Link href="/cadastro"><button className="lp-btn lp-btn-out">Começar com Start</button></Link>
          </div>
          <div className="lp-card lp-featured lr lr-d2">
            <div className="lp-badge">⭐ Mais escolhido</div>
            <div className="lp-name">Pro</div>
            <div className="lp-tagline">Gestão completa para crescer de verdade</div>
            <div className="lp-price">R$ 95<sub>/mês</sub></div>
            <div className="lp-period">por loja · até 5 usuários</div>
            <div className="lp-divider"/>
            <ul className="lp-feats">{PLAN_PRO.map(f=><li key={f}>{f}</li>)}</ul>
            <Link href="/cadastro"><button className="lp-btn lp-btn-main">Começar com Pro</button></Link>
          </div>
        </div>
        <p className="lp-note lr">🔒 Sem contrato de fidelidade · Cancele quando quiser · Suporte incluso</p>
      </section>

      {/* COMO COMEÇAR */}
      <section className="ls ls-dark2">
        <div className="ls-eyebrow lr">Onboarding</div>
        <h2 className="ls-heading lr">Do zero ao PDV em menos de 5 minutos</h2>
        <p className="ls-sub lr">Sem instalação. Funciona no navegador do celular.</p>
        <div className="lst-wrap">
          {[
            ['1','Crie sua conta','E-mail e senha. Sem cartão no início. Loja configurada automaticamente.'],
            ['2','Cadastre seus produtos','Bipe o código de barras ou adicione pelo nome. Foto e preço opcionais no começo.'],
            ['3','Comece a vender','PDV pronto. Registre sua primeira venda em menos de 1 minuto.'],
          ].map(([n,t,d],i)=>(
            <div key={n} className={`lst lr lr-d${i+1}`}>
              <div className="lst-num">{n}</div>
              <div className="lst-title">{t}</div>
              <div className="lst-desc">{d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section id="depoimentos" className="ls ls-dark">
        <div className="ls-eyebrow lr">Clientes</div>
        <h2 className="ls-heading lr">Quem usa, não volta atrás</h2>
        <div className="ltd-grid">
          {TESTIMONIALS.map((t,i)=>(
            <div key={t.name} className={`ltd-card lr lr-d${i+1}`}>
              <div className="ltd-stars">★★★★★</div>
              <p className="ltd-text">{t.text}</p>
              <div className="ltd-author">
                <div className="ltd-avatar">{t.i}</div>
                <div><div className="ltd-name">{t.name}</div><div className="ltd-role">{t.role}</div></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="lcta">
        <div className="lcta-grid"/>
        <div className="lcta-glow"/>
        <div className="lcta-inner lr">
          <h2>Sua loja merece um sistema de verdade.</h2>
          <p>Comece hoje por R$ 65/mês. Sem contrato, sem complicação. Cancele quando quiser.</p>
          <Link href="/cadastro"><button className="lcta-btn">Criar minha conta grátis →</button></Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lft">
        <div className="lft-inner">
          <div>
            <div className="lft-logo">KDL <em>Store</em></div>
            <div className="lft-tag">Feito para o comércio brasileiro 🇧🇷</div>
          </div>
          <div className="lft-links">
            <a href="#planos">Planos</a>
            <a href="#funcionalidades">Funcionalidades</a>
            <a href="#depoimentos">Depoimentos</a>
            <Link href="/login">Entrar</Link>
            <Link href="/cadastro">Criar conta</Link>
          </div>
          <div className="lft-copy">© 2026 KDL Store. Todos os direitos reservados.</div>
        </div>
      </footer>
    </>
  )
}
