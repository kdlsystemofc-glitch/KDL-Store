'use client'

import { useSubscription } from '@/hooks/useSubscription'
import Link from 'next/link'
import { Crown, Sparkles, TrendingUp, Coins, Users2, ShieldAlert, CheckCircle2 } from 'lucide-react'

/**
 * Envolve features exclusivas do plano Pro.
 * Se o plano é Start, mostra um Locker Premium interativo com opção de upgrade em 1 clique.
 */
export function ProOnly({ children }: { children: React.ReactNode }) {
  const { plano, loading } = useSubscription()

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 2rem',
        gap: '0.75rem',
        minHeight: '400px'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid var(--borda-forte)',
          borderTopColor: 'var(--verde)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{
          color: 'var(--texto-desab)',
          fontSize: '0.78rem',
          letterSpacing: '0.04em',
          fontWeight: 600
        }}>VERIFICANDO LICENÇA...</p>
      </div>
    )
  }

  if (plano === 'pro') {
    return <>{children}</>
  }

  // Plano Start - Exibe Locker de Upgrade Premium
  return (
    <div className="anim-fade" style={{
      maxWidth: '820px',
      margin: '1rem auto',
      padding: '2rem 1.5rem',
      background: 'linear-gradient(135deg, var(--surface) 0%, rgba(30, 24, 45, 0.45) 100%)',
      border: '1px solid var(--borda-forte)',
      borderTop: '4px solid var(--amarelo)',
      borderRadius: '8px',
      boxShadow: 'var(--sombra-lg)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Blur Efeito Premium */}
      <div style={{
        position: 'absolute',
        top: '-150px',
        right: '-150px',
        width: '350px',
        height: '350px',
        borderRadius: '50%',
        background: 'rgba(234, 179, 8, 0.05)',
        filter: 'blur(80px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* Header do Locker */}
      <div style={{
        textAlign: 'center',
        marginBottom: '2rem',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(234, 179, 8, 0.1)',
          border: '1px solid rgba(234, 179, 8, 0.25)',
          padding: '0.35rem 0.875rem',
          borderRadius: '20px',
          color: 'var(--amarelo)',
          fontSize: '0.72rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '1rem'
        }}>
          <Crown size={13} style={{ fill: 'currentColor' }} />
          Recurso Plano PRO
        </div>

        <h2 style={{
          fontSize: '1.65rem',
          fontWeight: 800,
          color: 'var(--texto)',
          lineHeight: 1.2,
          marginBottom: '0.5rem',
          fontFamily: "'Nunito', sans-serif",
          letterSpacing: '-0.02em'
        }}>
          Desbloqueie Todo o Potencial da Sua Loja
        </h2>
        
        <p style={{
          fontSize: '0.88rem',
          color: 'var(--texto-sec)',
          maxWidth: '540px',
          margin: '0 auto',
          lineHeight: 1.5
        }}>
          Você está no plano <strong>Start</strong>. Esta funcionalidade é exclusiva do plano <strong>Pro ⭐</strong> e foi desenvolvida para ajudar sua empresa a faturar mais e gerenciar melhor.
        </p>
      </div>

      {/* Grid de Benefícios PRO */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '0.75rem',
        marginBottom: '2.25rem',
        position: 'relative',
        zIndex: 1
      }}>
        {[
          {
            icon: TrendingUp,
            color: 'var(--verde)',
            title: 'DRE & Fluxo de Caixa',
            desc: 'Acompanhe receita, despesas, CMV e saiba exatamente quanto sobrou no caixa de forma automática.'
          },
          {
            icon: Coins,
            color: 'var(--amarelo)',
            title: 'Fiados & Cobranças',
            desc: 'Gerencie dívidas de clientes e controle vencimentos com avisos e painéis de inadimplência.'
          },
          {
            icon: Users2,
            color: 'var(--verde-claro)',
            title: 'CRM Clientes Sumidos',
            desc: 'Identifique clientes que deixaram de comprar e envie mensagens personalizadas de recuperação.'
          },
          {
            icon: Sparkles,
            color: 'var(--amarelo)',
            title: 'Comissões de Equipe',
            desc: 'Cadastre puxadores/parceiros e calcule comissões automaticamente por venda concluída.'
          }
        ].map((item, index) => {
          const Icon = item.icon
          return (
            <div key={index} style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--borda)',
              borderRadius: '6px',
              padding: '1rem',
              transition: 'transform 0.2s, border-color 0.2s',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: `rgba(234, 179, 8, 0.08)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: item.color
              }}>
                <Icon size={16} />
              </div>
              <p style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--texto)'
              }}>{item.title}</p>
              <p style={{
                fontSize: '0.72rem',
                color: 'var(--texto-sec)',
                lineHeight: 1.4
              }}>{item.desc}</p>
            </div>
          )
        })}
      </div>

      {/* Box do CTA */}
      <div style={{
        background: 'rgba(234, 179, 8, 0.03)',
        border: '1px dashed rgba(234, 179, 8, 0.2)',
        borderRadius: '6px',
        padding: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <p style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            color: 'var(--texto)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}>
            <CheckCircle2 size={15} style={{ color: 'var(--verde)' }} />
            Upgrade imediato com 1 clique!
          </p>
          <p style={{
            fontSize: '0.75rem',
            color: 'var(--texto-sec)'
          }}>
            O valor atual já pago será recalculado proporcionalmente na fatura.
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <Link href="/dashboard" style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: 'var(--texto-sec)',
            textDecoration: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            border: '1px solid var(--borda)',
            transition: 'background 0.1s'
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            Voltar ao Início
          </Link>

          <Link href="/configuracoes/planos" style={{
            fontSize: '0.78rem',
            fontWeight: 800,
            background: 'var(--amarelo)',
            color: '#000',
            textDecoration: 'none',
            padding: '0.55rem 1.25rem',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(234, 179, 8, 0.25)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            transition: 'transform 0.12s'
          }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
          >
            Quero o Plano PRO ⭐
          </Link>
        </div>
      </div>
    </div>
  )
}
