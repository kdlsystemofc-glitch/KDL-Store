'use client'
import { useEffect, useState } from 'react'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import { Loader2, Crown, ExternalLink } from 'lucide-react'

export default function PlanosPage() {
  const { empresaId } = useEmpresaId()
  const [sub, setSub] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [btnLoading, setBtnLoading] = useState(false)

  useEffect(() => {
    if (empresaId) {
      createClient().from('subscriptions').select('*').eq('empresa_id', empresaId).single()
        .then(({ data }) => {
          setSub(data)
          setLoading(false)
        })
    }
  }, [empresaId])

  async function openPortal() {
    setBtnLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresaId })
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else toast.error('Erro ao abrir portal')
    } catch (err: any) {
      toast.error('Erro de rede ao abrir portal')
    }
    setBtnLoading(false)
  }

  async function fazerUpgrade() {
    setBtnLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plano: 'pro', empresaId })
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else toast.error('Erro ao iniciar checkout')
    } catch (err: any) {
      toast.error('Erro de rede ao iniciar checkout')
    }
    setBtnLoading(false)
  }

  async function fazerDowngrade() {
    if (window.confirm('Tem certeza? O downgrade será processado através do portal do cliente. Você perderá acesso às funções Pro.')) {
      openPortal()
    }
  }

  if (loading) return <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin" /></div>

  const isPro = sub?.plano === 'pro'
  const isStart = sub?.plano === 'start'
  const isCancelled = sub?.status === 'cancelled'
  const isPastDue = sub?.status === 'past_due'
  const isCancelScheduled = sub?.cancel_at_period_end

  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '680px' }}>
      <div>
        <h1 className="pg-titulo">ASSINATURA E PLANOS</h1>
        <p className="pg-sub">GERENCIE SUA ASSINATURA DA KDL STORE</p>
      </div>

      <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Crown size={24} style={{ color: isPro ? 'var(--verde)' : 'var(--amarelo)' }} />
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Plano Atual: {isPro ? 'Pro' : 'Start'}</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.9rem' }}>
          <p><strong>Status:</strong> <span style={{ color: isPastDue ? 'var(--vermelho)' : isCancelled ? 'var(--texto-sec)' : 'var(--verde)', fontWeight: 700 }}>
            {isPastDue ? 'Atrasado' : isCancelled ? 'Cancelado' : 'Ativo'}
          </span></p>
          
          {sub?.current_period_end && (
             <p><strong>Próximo vencimento:</strong> {new Date(sub.current_period_end).toLocaleDateString('pt-BR')}</p>
          )}

          {isCancelScheduled && (
            <p style={{ color: 'var(--amarelo)', marginTop: '0.5rem', fontWeight: 600 }}>
              Sua assinatura será cancelada no final do período ({new Date(sub.current_period_end).toLocaleDateString('pt-BR')}). Você ainda tem acesso até lá.
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <button onClick={openPortal} disabled={btnLoading} className="btn" style={{ background: 'var(--surface-alt)', color: 'var(--texto)' }}>
            Gerenciar Assinatura (Cartão/Faturas) <ExternalLink size={14} style={{ marginLeft: '4px' }} />
          </button>
          
          {isStart && !isCancelled && (
            <button onClick={fazerUpgrade} disabled={btnLoading} className="btn btn-primary">
              Fazer Upgrade para Pro (R$95/mês)
            </button>
          )}

          {isPro && !isCancelScheduled && (
            <button onClick={fazerDowngrade} disabled={btnLoading} className="btn btn-danger" style={{ background: 'transparent', border: '1px solid var(--vermelho)' }}>
              Fazer Downgrade para Start
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
