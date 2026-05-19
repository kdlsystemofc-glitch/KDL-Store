'use client'
import { useEffect, useState } from 'react'
import { useEmpresaId } from '@/lib/useEmpresaId'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import { Loader2, Crown, ExternalLink, AlertTriangle, X } from 'lucide-react'

export default function PlanosPage() {
  const { empresaId } = useEmpresaId()
  const [sub, setSub] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [btnLoading, setBtnLoading] = useState(false)
  const [modalType, setModalType] = useState<'upgrade' | 'downgrade' | 'cancelar' | null>(null)

  const loadData = async () => {
    if (!empresaId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/stripe/status?empresaId=${empresaId}`, { cache: 'no-store' })
      const { sub: subData } = await res.json()
      setSub(subData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
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

  async function agendarMudancaPlano(planoDestino: 'pro' | 'start') {
    setBtnLoading(true)
    try {
      const res = await fetch('/api/stripe/mudar-plano', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plano_destino: planoDestino, empresaId })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'Mudança de plano agendada!')
  async function fazerUpgrade() {
    await agendarMudancaPlano('pro')
  }

  async function fazerDowngrade() {
    await agendarMudancaPlano('start')
  }

  async function fazerCancelamento() {
    setBtnLoading(true)
    try {
      const res = await fetch('/api/stripe/cancelar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresaId })
      })
      if (res.ok) {
        toast.success('Assinatura cancelada com sucesso.')
        setModalType(null)
        await loadData()
      } else {
        toast.error('Erro ao cancelar assinatura.')
      }
    } catch (err: any) {
      toast.error('Erro de rede ao processar solicitação')
    }
    setBtnLoading(false)
  }

  if (loading) return <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin" /></div>

  const isPro = sub?.plano === 'pro'
  const isStart = sub?.plano === 'start'
  const isCancelled = sub?.status === 'cancelled'
  const isPastDue = sub?.status === 'past_due'
  const isCancelScheduled = sub?.cancel_at_period_end
  const isPlanChangeScheduled = !!sub?.scheduled_plan

  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '680px' }}>
      
      {modalType && (
        <div style={{position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center'}}
          onClick={e=>{if(e.target===e.currentTarget)setModalType(null)}}>
          <div className="card anim-pop" style={{width:'100%',maxWidth:'420px',padding:'1.25rem'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
              <p style={{fontWeight:900,fontSize:'1.1rem',color: modalType === 'upgrade' ? 'var(--amarelo)' : 'var(--vermelho)',display:'flex',alignItems:'center',gap:'0.5rem'}}>
                <AlertTriangle size={18}/> 
                {modalType === 'upgrade' ? 'Mudar para Pro' : modalType === 'downgrade' ? 'Mudar para Start' : 'Cancelar Assinatura'}
              </p>
              <button onClick={()=>setModalType(null)} className="btn-icon"><X size={18}/></button>
            </div>
            
            <div style={{fontSize:'0.85rem',color:'var(--texto)'}}>
              {modalType === 'upgrade' && (
                <>
                  <p style={{marginBottom:'0.75rem'}}>Você será cobrado R$95/mês a partir de hoje.</p>
                  <div style={{ padding:'0.75rem', background:'rgba(234,179,8,0.1)', borderLeft:'4px solid var(--amarelo)', marginBottom:'1rem' }}>
                    <p style={{ color: 'var(--texto-sec)' }}>O valor proporcional dos dias restantes do plano atual será descontado automaticamente da fatura.</p>
                  </div>
                </>
              )}

              {modalType === 'downgrade' && (
                <>
                  <p style={{marginBottom:'0.75rem'}}>Seu plano Pro continuará ativo até <strong>{sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString('pt-BR') : 'o fim do ciclo'}</strong>.</p>
                  <p style={{marginBottom:'1rem'}}>A partir de <strong>{sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString('pt-BR') : 'então'}</strong>, você passará automaticamente para o plano Start (R$65/mês).</p>
                  <p style={{fontWeight:700,marginBottom:'0.5rem'}}>No próximo vencimento, você perderá acesso a:</p>
                  <ul style={{paddingLeft:'1.25rem',marginBottom:'1rem',color:'var(--texto-sec)',display:'flex',flexDirection:'column',gap:'0.25rem'}}>
                    <li>Financeiro</li>
                    <li>Relatórios</li>
                    <li>CRM Sumidos</li>
                    <li>Comissões</li>
                    <li>Fechamento de Caixa</li>
                  </ul>
                </>
              )}

              {modalType === 'cancelar' && (
                <>
                  <p style={{marginBottom:'0.75rem'}}>Seu acesso continuará ativo até <strong>{sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString('pt-BR') : 'o fim do ciclo'}</strong>.</p>
                  <div style={{ padding:'0.75rem', background:'rgba(255,76,76,0.1)', borderLeft:'4px solid var(--vermelho)', marginBottom:'1rem' }}>
                    <p style={{ color: 'var(--texto-sec)' }}>Após essa data, você não será cobrado novamente e perderá acesso ao sistema.</p>
                  </div>
                  <p style={{marginBottom:'1rem', color:'var(--texto-sec)'}}>Seus dados ficam salvos por 90 dias caso queira reativar.</p>
                </>
              )}
            </div>

            <div style={{display:'flex',gap:'0.5rem',justifyContent:'flex-end',marginTop:'1rem'}}>
              <button onClick={()=>setModalType(null)} className="btn btn-secondary" disabled={btnLoading}>Voltar</button>
              <button onClick={modalType === 'upgrade' ? fazerUpgrade : modalType === 'downgrade' ? fazerDowngrade : fazerCancelamento} 
                disabled={btnLoading} className="btn" 
                style={{background: modalType === 'upgrade' ? 'var(--amarelo)' : 'var(--vermelho)', color: modalType === 'upgrade' ? '#000' : '#fff',fontWeight:700}}>
                {btnLoading ? <Loader2 size={16} className="animate-spin" /> : `Confirmar ${modalType}`}
              </button>
            </div>
          </div>
        </div>
      )}

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
          
          {sub?.current_period_end && !isCancelScheduled && !isCancelled && (
             <p><strong>Próximo vencimento:</strong> {new Date(sub.current_period_end).toLocaleDateString('pt-BR')}</p>
          )}

          {isCancelScheduled && !isPlanChangeScheduled && (
            <div style={{ padding:'0.75rem', background:'rgba(234,179,8,0.1)', borderLeft:'4px solid var(--amarelo)', marginTop:'0.5rem' }}>
              <p style={{ color: 'var(--texto)', fontWeight: 700, fontSize:'0.9rem', marginBottom:'0.25rem' }}>
                Sua assinatura foi cancelada.
              </p>
              <p style={{ color: 'var(--texto-sec)', fontSize:'0.82rem', marginBottom:'0.5rem' }}>
                Você ainda tem acesso até <strong>{new Date(sub.current_period_end).toLocaleDateString('pt-BR')}</strong>. Após essa data, o sistema será bloqueado automaticamente.
              </p>
              <button onClick={openPortal} disabled={btnLoading} className="btn btn-primary" style={{fontSize:'0.72rem'}}>
                REATIVAR ASSINATURA
              </button>
            </div>
          )}

          {isPlanChangeScheduled && (
            <div style={{ padding:'0.75rem', background:'rgba(0,191,165,0.1)', borderLeft:'4px solid var(--verde)', marginTop:'0.5rem' }}>
              <p style={{ color: 'var(--verde)', fontWeight: 700, fontSize:'0.9rem', marginBottom:'0.25rem' }}>
                Mudança de plano agendada
              </p>
              <p style={{ color: 'var(--texto-sec)', fontSize:'0.82rem', marginBottom:'0.5rem' }}>
                Você agendou uma alteração para o plano <strong>{sub.scheduled_plan === 'pro' ? 'Pro' : 'Start'}</strong>.
                Esta mudança entrará em vigor e será cobrada apenas no próximo vencimento ({new Date(sub.current_period_end).toLocaleDateString('pt-BR')}).
              </p>
              <button onClick={openPortal} disabled={btnLoading} className="btn" style={{fontSize:'0.72rem', background: 'var(--surface-alt)', color: 'var(--texto)'}}>
                Cancelar Agendamento (Stripe) <ExternalLink size={12} style={{marginLeft:'4px'}}/>
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <button onClick={openPortal} disabled={btnLoading} className="btn" style={{ background: 'var(--surface-alt)', color: 'var(--texto)' }}>
            Gerenciar Assinatura (Cartão/Faturas) <ExternalLink size={14} style={{ marginLeft: '4px' }} />
          </button>
          
          {isStart && !isCancelled && !isCancelScheduled && !isPlanChangeScheduled && (
            <button onClick={() => setModalType('upgrade')} disabled={btnLoading} className="btn btn-primary" style={{ background: 'var(--amarelo)', color: '#000' }}>
              {btnLoading ? <Loader2 size={16} className="animate-spin" /> : 'Mudar para Pro (R$95)'}
            </button>
          )}

          {isPro && !isCancelScheduled && !isCancelled && !isPlanChangeScheduled && (
            <button onClick={() => setModalType('downgrade')} disabled={btnLoading} className="btn btn-danger" style={{ background: 'transparent', border: '1px solid var(--vermelho)', color: 'var(--vermelho)' }}>
              Mudar para Start (R$65 no próximo mês)
            </button>
          )}

          {!isCancelScheduled && !isCancelled && !isPlanChangeScheduled && (
            <button onClick={() => setModalType('cancelar')} disabled={btnLoading} className="btn" style={{ background: 'transparent', color: 'var(--texto-sec)', fontSize: '0.8rem', marginLeft: 'auto' }}>
              Cancelar assinatura
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
