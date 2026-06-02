'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AssinarPageWrapper() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <AssinarPage />
    </Suspense>
  )
}

function AssinarPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const motivo = searchParams.get('motivo')
  // L6: pré-seleciona plano passado pela landing (?plano=pro ou ?plano=start)
  const planoParam = searchParams.get('plano') as 'start' | 'pro' | null
  const [loading, setLoading] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const assinar = async (plano: 'start' | 'pro') => {
    setLoading(plano); setErro(null)
    const supabase = createClient()

    // Buscar empresa_id do usuário
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setErro('Sessão expirada. Faça login novamente.'); setLoading(null); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('empresa_id')
      .eq('id', user.id)
      .single()

    if (!profile?.empresa_id) { setErro('Perfil não encontrado.'); setLoading(null); return }

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plano, empresaId: profile.empresa_id })
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else if (res.status === 400 && data.error?.includes('assinatura ativa')) {
        // A1: usuário já tem assinatura — redireciona para gerenciar plano
        router.push('/configuracoes/planos')
      } else {
        setErro(data.error || 'Erro ao processar pagamento.')
        setLoading(null)
      }
    } catch (err: any) {
      setErro('Erro de rede ao conectar com Stripe.')
      setLoading(null)
    }
  }


  const features = {
    start: [
      'PDV com leitor de código de barras',
      'Estoque em tempo real',
      'Garantias digitais',
      'Catálogo com QR Code',
      'Recibo imprimível',
      'Controle de Fiados 📒',
      '1 usuário',
    ],
    pro: [
      'Tudo do Start',
      'Painel "Como foi?" + WhatsApp',
      'CRM de Clientes Sumidos',
      'Comissões de puxadores',
      'DRE completo',
      'Fechamento de caixa',
      'Até 5 usuários',
    ],
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: '0.5rem' }}>
        <span style={{ color: 'var(--verde)', fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: '1.6rem', fontStyle: 'italic' }}>K</span>
        <span style={{ color: 'var(--texto)', fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: '1.05rem' }}>DL Store</span>
      </div>
      <h2 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: '1.5rem', color: 'var(--texto)', marginBottom: '0.375rem' }}>
        {planoParam ? `Você escolheu o plano ${planoParam === 'pro' ? 'Pro ⭐' : 'Start'}` : 'Escolha seu plano'}
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: '2rem' }}>
        Sem contrato. Cancele quando quiser.
      </p>


      {motivo === 'inadimplente' && (
        <div style={{
          background: '#FF4C4C', color: '#fff', padding: '0.75rem', marginBottom: '1.5rem',
          fontSize: '0.9rem', fontWeight: 700, borderRadius: 'var(--r-sm)', maxWidth: '720px', margin: '0 auto 1.5rem'
        }}>
          🚨 Seu pagamento falhou. Atualize seu cartão ou assine novamente para continuar.
        </div>
      )}

      {motivo === 'cancelado' && (
        <div style={{
          background: '#FFB800', color: '#111', padding: '0.75rem', marginBottom: '1.5rem',
          fontSize: '0.9rem', fontWeight: 700, borderRadius: 'var(--r-sm)', maxWidth: '720px', margin: '0 auto 1.5rem'
        }}>
          ⚠️ Sua assinatura foi cancelada. Assine novamente para recuperar seu acesso.
        </div>
      )}

      {erro && (
        <div style={{
          background: '#fdf2f1', border: '1px solid #f1a99e', borderLeft: '3px solid var(--laranja)',
          padding: '0.625rem 0.875rem', marginBottom: '1.5rem', color: 'var(--laranja)', maxWidth: '720px', margin: '0 auto 1.5rem',
          fontSize: '0.82rem', fontWeight: 600, borderRadius: 'var(--r-sm)', textAlign: 'left',
        }}>
          {erro}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', maxWidth: '720px', margin: '0 auto' }}>
        {/* PLANO START */}
        <div style={{
          background: 'var(--surface)', border: '2px solid var(--borda)', borderRadius: 'var(--r-2xl)',
          padding: '2rem 1.75rem', textAlign: 'left',
        }}>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: '1.1rem', color: 'var(--texto)' }}>Start</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Para lojistas que querem sair do caderno</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--muted)', fontStyle: 'italic', marginBottom: '1rem' }}>&quot;Comece com o essencial.&quot;</div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '2.5rem', fontWeight: 900, color: 'var(--texto)', lineHeight: 1 }}>
            R$ 65<sub style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--muted)' }}>/mês</sub>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.25rem', marginBottom: '1.25rem' }}>por loja · 1 usuário</div>
          <div style={{ height: '1px', background: 'var(--borda)', marginBottom: '1.25rem' }} />
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1.5rem' }}>
            {features.start.map(f => (
              <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--texto)' }}>
                <span style={{ color: 'var(--verde)', fontWeight: 800, flexShrink: 0 }}>✓</span> {f}
              </li>
            ))}
          </ul>
      <button onClick={() => assinar('start')} disabled={loading !== null}
            style={{
              width: '100%', padding: '0.75rem', borderRadius: 'var(--r-lg)',
              background: planoParam === 'start' ? 'var(--roxo)' : 'transparent',
              color: planoParam === 'start' ? '#fff' : 'var(--roxo)',
              border: '2px solid var(--roxo)',
              fontWeight: 700, fontSize: '0.88rem', cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', opacity: loading && loading !== 'start' ? 0.5 : 1,
              transition: 'background 0.15s, color 0.15s',
            }}>
            {loading === 'start' ? 'Ativando...' : planoParam === 'start' ? '▶ Confirmar plano Start' : 'Começar com Start'}
          </button>
        </div>

        {/* PLANO PRO */}
        <div style={{
          background: 'var(--roxo)', border: '2px solid var(--roxo)', borderRadius: 'var(--r-2xl)',
          padding: '2rem 1.75rem', textAlign: 'left', color: 'var(--sobre-escuro)',
          boxShadow: 'var(--sombra-lg)', position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
            background: 'var(--amarelo)', color: '#fff', fontSize: '0.65rem', fontWeight: 800,
            padding: '0.2rem 0.875rem', borderRadius: 'var(--r-sm)', textTransform: 'uppercase',
            letterSpacing: '0.04em', whiteSpace: 'nowrap',
          }}>⭐ MAIS ESCOLHIDO</div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: '1.1rem' }}>Pro</div>
          <div style={{ fontSize: '0.78rem', color: 'rgba(240,235,245,0.5)', marginBottom: '0.25rem' }}>Quem quer gestão completa</div>
          <div style={{ fontSize: '0.82rem', color: 'rgba(240,235,245,0.5)', fontStyle: 'italic', marginBottom: '1rem' }}>&quot;Tudo que sua loja precisa para crescer.&quot;</div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '2.5rem', fontWeight: 900, lineHeight: 1 }}>
            R$ 95<sub style={{ fontSize: '0.9rem', fontWeight: 500, color: 'rgba(240,235,245,0.5)' }}>/mês</sub>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(240,235,245,0.4)', marginTop: '0.25rem', marginBottom: '1.25rem' }}>por loja · até 5 usuários</div>
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.12)', marginBottom: '1.25rem' }} />
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1.5rem' }}>
            {features.pro.map(f => (
              <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--verde)', fontWeight: 800, flexShrink: 0 }}>✓</span> {f}
              </li>
            ))}
          </ul>
          <button onClick={() => assinar('pro')} disabled={loading !== null}
            style={{
              width: '100%', padding: '0.75rem', borderRadius: 'var(--r-lg)',
              background: 'var(--verde)', color: '#fff', border: 'none',
              fontWeight: 700, fontSize: '0.88rem', cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', boxShadow: 'var(--sombra-cta)',
              opacity: loading && loading !== 'pro' ? 0.5 : 1,
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}>
            {loading === 'pro' ? 'Ativando...' : planoParam === 'pro' ? '▶ Confirmar plano Pro' : 'Começar com Pro'}
          </button>
        </div>
      </div>

      <p style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: '1.5rem' }}>
        Sem contrato de fidelidade. Cancele quando quiser. Suporte via WhatsApp.
      </p>
    </div>
  )
}
