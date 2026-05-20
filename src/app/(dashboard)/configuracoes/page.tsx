'use client'
import { toast } from 'react-hot-toast'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { useSubscription } from '@/hooks/useSubscription'
import { ChevronRight, Crown, Check, AlertTriangle, Loader2 } from 'lucide-react'

const sections = [
  { href: '/configuracoes/empresa',    icon: '[EMP]', title: 'DADOS DA EMPRESA',       desc: 'Nome, logo, CNPJ, telefone e endereço' },
  { href: '/configuracoes/usuarios',   icon: '[USR]', title: 'USUÁRIOS E ACESSOS',      desc: 'Gerenciar vendedores e técnicos com permissões' },
  { href: '/configuracoes/pagamentos', icon: '[PAG]', title: 'FORMAS DE PAGAMENTO',     desc: 'PIX, Dinheiro, Crédito, Débito, Fiado' },
  { href: '/configuracoes/categorias', icon: '[CAT]', title: 'CATEGORIAS DE PRODUTOS',  desc: 'Criar e organizar categorias' },
  { href: '/catalogo',                 icon: '[WWW]', title: 'CATÁLOGO ONLINE',          desc: 'Configurar e visualizar seu catálogo público' },
  { href: '/configuracoes/planos',     icon: '[PLN]', title: 'ASSINATURA E PLANOS',      desc: 'Gerencie sua assinatura e histórico de faturas' },
]

const START_FEATURES = ['PDV ilimitado', 'Controle de estoque', 'Emissão de garantias', 'Ordens de serviço', 'Módulo Financeiro']
const PRO_FEATURES   = ['PDV ilimitado', 'Controle de estoque', 'Emissão de garantias', 'Ordens de serviço', 'Módulo Financeiro', 'CRM de Sumição', 'Comissões', 'Relatórios avançados']

export default function ConfiguracoesPage() {
  const { empresaId } = useEmpresaId()
  const { plano, ativo, cancel_at_period_end, current_period_end, scheduled_plan, loading: loadingSub } = useSubscription()
  const [prazoCrm,    setPrazoCrm]    = useState<number>(60)
  const [salvandoCrm, setSalvandoCrm] = useState(false)
  const [abrindoPortal, setAbrindoPortal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deletando, setDeletando] = useState(false)

  useEffect(() => {
    if (empresaId) {
      createClient().from('empresas').select('crm_prazo_inatividade_dias').eq('id', empresaId).single()
        .then(({data}) => { if (data?.crm_prazo_inatividade_dias) setPrazoCrm(data.crm_prazo_inatividade_dias) })
    }
  }, [empresaId])

  async function salvarPrazo() {
    if (!empresaId) return
    setSalvandoCrm(true)
    const val = Math.max(7, Math.min(365, Number(prazoCrm)))
    await createClient().from('empresas').update({ crm_prazo_inatividade_dias: val }).eq('id', empresaId)
    setPrazoCrm(val)
    setSalvandoCrm(false)
    toast.success('Configurações salvas!')
  }

  async function abrirPortal() {
    if (!empresaId) return
    setAbrindoPortal(true)
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresaId })
      })
      const json = await res.json()
      if (json.url) window.location.href = json.url
      else toast.error('Erro ao abrir portal: ' + (json.error || 'Tente novamente'))
    } catch {
      toast.error('Erro de rede ao abrir portal.')
    } finally {
      setAbrindoPortal(false)
    }
  }

  async function cancelarAssinatura() {
    if (!empresaId) return
    setDeletando(true)
    try {
      // CO3: abre portal direto no fluxo de cancelamento (não na tela de cartões)
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresaId, flow: 'cancel' })
      })
      const json = await res.json()
      if (json.url) window.location.href = json.url
      else toast.error('Erro ao abrir portal de cancelamento.')
    } catch {
      toast.error('Erro de rede.')
    } finally {
      setDeletando(false)
    }
  }

  const isPro = plano === 'pro'
  const features = isPro ? PRO_FEATURES : START_FEATURES

  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '680px' }}>

      <div>
        <h1 className="pg-titulo">CONFIGURAÇÕES</h1>
        <p className="pg-sub">CONTA · USUÁRIOS · PREFERÊNCIAS</p>
      </div>

      {/* Plano atual — dinâmico */}
      {loadingSub ? (
        <div className="skeleton-card" style={{
          padding: '0.875rem 1rem', position: 'relative', overflow: 'hidden',
          background: 'var(--fundo-painel)',
          border: '1px solid var(--borda)',
          borderLeft: '4px solid var(--borda-forte)',
          display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', minHeight: '120px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
            <div className="skeleton-line" style={{ width: '120px', height: '14px' }} />
            <div className="skeleton-line" style={{ width: '80px', height: '24px' }} />
            <div className="skeleton-line" style={{ width: '220px', height: '12px' }} />
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <div className="skeleton-line" style={{ width: '90px', height: '10px' }} />
              <div className="skeleton-line" style={{ width: '95px', height: '10px' }} />
              <div className="skeleton-line" style={{ width: '85px', height: '10px' }} />
            </div>
          </div>
          <div style={{ width: '100%', maxWidth: '200px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className="skeleton-line" style={{ height: '32px', borderRadius: 'var(--radius-sm)' }} />
            <div className="skeleton-line" style={{ height: '28px', borderRadius: 'var(--radius-sm)' }} />
          </div>
        </div>
      ) : (
        <div style={{
          padding: '0.875rem 1rem', position: 'relative', overflow: 'hidden',
          background: 'var(--fundo-painel)',
          border: `1px solid ${isPro ? 'var(--amarelo)' : 'var(--verde)'}`,
          borderLeft: `4px solid ${isPro ? 'var(--amarelo)' : 'var(--verde)'}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                <span style={{ color: isPro ? 'var(--amarelo)' : 'var(--verde)', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  ● PLANO ATUAL
                </span>
                {!ativo && <span style={{ fontSize: '0.62rem', color: 'var(--vermelho)', fontWeight: 700, letterSpacing: '0.06em' }}>⚠ INATIVO</span>}
              </div>
              <p style={{ color: isPro ? 'var(--amarelo)' : 'var(--verde)', fontWeight: 900, fontSize: '1.5rem', lineHeight: 1, letterSpacing: '0.06em' }}>
                {isPro ? 'PRO' : 'START'}
              </p>
              <p style={{ color: 'var(--texto-sec)', fontSize: '0.72rem', marginTop: '0.25rem', letterSpacing: '0.04em' }}>
                {isPro ? 'R$ 95/MÊS' : 'R$ 65/MÊS'} · {ativo ? (cancel_at_period_end ? `CANCELADA (ACESSO ATÉ ${current_period_end ? new Date(current_period_end).toLocaleDateString('pt-BR') : ''})` : (scheduled_plan ? `MUDANÇA PARA ${scheduled_plan.toUpperCase()} AGENDADA` : 'ASSINATURA ATIVA')) : 'SEM ASSINATURA ATIVA'}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem', marginTop: '0.5rem' }}>
                {features.map(f => (
                  <span key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', fontWeight: 700, color: 'var(--texto-sec)', letterSpacing: '0.04em' }}>
                    <Check size={10} style={{ color: isPro ? 'var(--amarelo)' : 'var(--verde)' }} /> {f.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end', width: '100%', maxWidth: '200px' }}>
              {ativo ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', alignItems: 'flex-end', width: '100%' }}>
                  <Link href="/configuracoes/planos" className="btn btn-secondary"
                    style={{ fontWeight: 800, width: '100%', fontSize: '0.72rem', background: cancel_at_period_end ? 'var(--verde)' : 'var(--fundo-destaque)', color: '#fff', justifyContent: 'center' }}>
                    {cancel_at_period_end ? '♻ REATIVAR ASSINATURA' : '⚙ GERENCIAR ASSINATURA'}
                  </Link>
                  <button onClick={abrirPortal} disabled={abrindoPortal} className="btn"
                    style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--texto-sec)', fontSize: '0.65rem', padding: '0.4rem 0.75rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                    {abrindoPortal ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : '💳'} CARTÕES E FATURAS (STRIPE)
                  </button>
                </div>
              ) : (
                <Link href="/assinar" className="btn btn-primary"
                  style={{ fontWeight: 800, flexShrink: 0, fontSize: '0.72rem' }}>
                  ▶ ASSINAR AGORA
                </Link>
              )}
              {!isPro && ativo && !scheduled_plan && (
                <Link href="/configuracoes/planos" className="btn btn-primary"
                  style={{ fontWeight: 800, flexShrink: 0, fontSize: '0.72rem', width: '100%', justifyContent: 'center', marginTop: '0.25rem' }}>
                  <Crown size={13} fill="currentColor" /> UPGRADE PARA PRO
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Menu de configurações */}
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div className="sec-header"><span>MENU DE CONFIGURAÇÕES</span></div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {sections.map((s, i) => (
            <Link key={s.href} href={s.href} style={{
              display: 'flex', alignItems: 'center', gap: '0.875rem',
              padding: '0.6rem 0.875rem',
              borderBottom: i < sections.length-1 ? '1px solid var(--borda-leve)' : 'none',
              textDecoration: 'none',
              transition: 'background 0.12s'
            }}
              onMouseEnter={e=>(e.currentTarget.style.background='var(--surface-alt)')}
              onMouseLeave={e=>(e.currentTarget.style.background='transparent')}
            >
              <span style={{ fontFamily:'monospace', fontSize:'0.65rem', color:'var(--verde)', fontWeight:700, flexShrink:0 }}>{s.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, color: 'var(--texto)', fontSize:'0.78rem', letterSpacing:'0.04em' }}>{s.title}</p>
                <p style={{ fontSize: '0.68rem', color: 'var(--texto-desab)', marginTop: '1px' }}>{s.desc}</p>
              </div>
              <ChevronRight size={14} style={{ color: 'var(--texto-desab)', flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      </div>

      {/* Preferências do CRM */}
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div className="sec-header"><span>PREFERÊNCIAS DO CRM</span></div>
        <div style={{padding:'0.75rem'}}>
          <p style={{ fontSize: '0.72rem', color: 'var(--texto-desab)', marginBottom: '0.75rem', letterSpacing:'0.03em' }}>CONFIGURE QUANDO OS CLIENTES DEVEM SER CONSIDERADOS SUMIDOS.</p>
          <div style={{ display:'flex', gap:'0.5rem', alignItems:'flex-end' }}>
            <div style={{ flex: 1, maxWidth:'250px' }}>
              <label className="campo-label" style={{fontSize:'0.65rem'}}>ALERTAR CLIENTES INATIVOS APÓS (DIAS)</label>
              <input type="number" min={7} max={365} className="campo" style={{marginTop:'0.375rem',fontSize:'0.78rem'}} value={prazoCrm} onChange={e=>setPrazoCrm(Number(e.target.value))} />
            </div>
            <button onClick={salvarPrazo} disabled={salvandoCrm} className="btn btn-primary" style={{height:'36px',fontSize:'0.72rem'}}>
              {salvandoCrm ? 'SALVANDO...' : '▶ SALVAR'}
            </button>
          </div>
        </div>
      </div>

      {/* CO1: só exibe Zona de Perigo após dados do plano carregarem */}
      {!loadingSub && (!cancel_at_period_end) && (
        <div className="card" style={{padding:0,overflow:'hidden',border:'1px solid var(--vermelho)'}}>
          <div className="sec-header" style={{borderBottom:'1px solid var(--vermelho)'}}><span style={{color:'var(--vermelho)'}}>⚠ ZONA DE PERIGO</span></div>
          <div style={{padding:'0.875rem 1rem'}}>
            <p style={{ fontSize: '0.72rem', color: 'var(--texto-desab)', marginBottom: '0.75rem', letterSpacing:'0.03em' }}>
              AÇÕES IRREVERSÍVEIS. PROCEDAM COM EXTREMO CUIDADO.
            </p>

            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)}
                className="btn"
                style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--vermelho)', border:'1px solid var(--vermelho)', background:'transparent', padding:'0.4rem 0.875rem' }}>
                <AlertTriangle size={13} /> CANCELAR MINHA ASSINATURA
              </button>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:'0.625rem'}}>
                <div style={{padding:'0.625rem',background:'rgba(239,68,68,0.08)',border:'1px solid var(--vermelho)',fontSize:'0.72rem',color:'var(--vermelho)',letterSpacing:'0.03em'}}>
                  ⚠ VOCÊ SERÁ REDIRECIONADO PARA O PORTAL DO STRIPE PARA CANCELAR SUA ASSINATURA. SEUS DADOS SERÃO MANTIDOS MAS O ACESSO SERÁ RESTRITO.
                </div>
                <div style={{display:'flex',gap:'0.5rem'}}>
                  <button onClick={() => setConfirmDelete(false)} className="btn btn-secondary" style={{fontSize:'0.72rem'}}>
                    VOLTAR
                  </button>
                  <button onClick={cancelarAssinatura} disabled={deletando}
                    className="btn"
                    style={{ fontSize:'0.72rem', fontWeight:700, color:'#fff', background:'var(--vermelho)', border:'none', padding:'0.4rem 0.875rem', cursor:'pointer' }}>
                    {deletando ? <><Loader2 size={12} style={{animation:'spin 1s linear infinite'}}/> REDIRECIONANDO...</> : 'SIM, QUERO CANCELAR'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <p style={{ fontSize: '0.65rem', color: 'var(--texto-desab)', textAlign: 'center', marginTop: '0.5rem', letterSpacing:'0.06em' }}>
        KDL STORE v1.2.0 · FEITO PARA O PEQUENO COMÉRCIO BRASILEIRO
      </p>
    </div>
  )
}
