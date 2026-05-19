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
  const [showDowngradeModal, setShowDowngradeModal] = useState(false)

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
        setShowDowngradeModal(false)
        // Recarrega apenas os dados para mostrar o agendamento
        await loadData()
      } else {
        toast.error(data.error || 'Erro ao agendar mudança de plano')
      }
    } catch (err: any) {
      toast.error('Erro de rede ao processar solicitação')
    }
    setBtnLoading(false)
  }

  async function fazerUpgrade() {
    await agendarMudancaPlano('pro')
  }

  async function fazerDowngrade() {
    await agendarMudancaPlano('start')
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
      
      {showDowngradeModal && (
        <div style={{position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center'}}
          onClick={e=>{if(e.target===e.currentTarget)setShowDowngradeModal(false)}}>
          <div className="card anim-pop" style={{width:'100%',maxWidth:'420px',padding:'1.25rem'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
              <p style={{fontWeight:900,fontSize:'1.1rem',color:'var(--vermelho)',display:'flex',alignItems:'center',gap:'0.5rem'}}>
                <AlertTriangle size={18}/> Mudar para Start
              </p>
              <button onClick={()=>setShowDowngradeModal(false)} className="btn-icon"><X size={18}/></button>
            </div>
            <div style={{fontSize:'0.85rem',color:'var(--texto)'}}>
              <p style={{marginBottom:'0.75rem'}}>Você está prestes a agendar um downgrade para o plano Start.</p>
              <div style={{ padding:'0.75rem', background:'rgba(0,191,165,0.1)', borderLeft:'4px solid var(--verde)', marginBottom:'1rem' }}>
                <p style={{ color: 'var(--verde)', fontWeight: 700, marginBottom:'0.25rem' }}>Acesso mantido até o próximo pagamento</p>
                <p style={{ color: 'var(--texto-sec)' }}>Você continuará com todos os benefícios do plano Pro até <strong>{sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString('pt-BR') : 'o fim do ciclo'}</strong>. Apenas no próximo vencimento o valor será reduzido para R$65/mês e as ferramentas abaixo serão bloqueadas.</p>
              </div>
              <p style={{fontWeight:700,marginBottom:'0.5rem'}}>No próximo vencimento, você perderá acesso a:</p>
              <ul style={{paddingLeft:'1.25rem',marginBottom:'1rem',color:'var(--texto-sec)',display:'flex',flexDirection:'column',gap:'0.25rem'}}>
                <li>Módulo Financeiro e DRE</li>
                <li>Relatórios Avançados e Gráficos</li>
                <li>CRM de Clientes Sumidos</li>
                <li>Gestão de Comissões e Indicadores</li>
                <li>Controle de Fiados</li>
                <li>Fechamento de Caixa</li>
                <li>Painel "Como foi?" (NPS)</li>
              </ul>
            </div>
            <div style={{display:'flex',gap:'0.5rem',justifyContent:'flex-end'}}>
              <button onClick={()=>setShowDowngradeModal(false)} className="btn btn-secondary" disabled={btnLoading}>Cancelar</button>
              <button onClick={fazerDowngrade} disabled={btnLoading} className="btn" style={{background:'var(--vermelho)',color:'#fff',fontWeight:700}}>
                {btnLoading ? <Loader2 size={16} className="animate-spin" /> : 'Confirmar Downgrade Agendado'}
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
            <button onClick={fazerUpgrade} disabled={btnLoading} className="btn btn-primary" style={{ background: 'var(--amarelo)', color: '#000' }}>
              {btnLoading ? <Loader2 size={16} className="animate-spin" /> : 'Agendar Upgrade para Pro (R$95 no próximo mês)'}
            </button>
          )}

          {isPro && !isCancelScheduled && !isCancelled && !isPlanChangeScheduled && (
            <button onClick={() => setShowDowngradeModal(true)} disabled={btnLoading} className="btn btn-danger" style={{ background: 'transparent', border: '1px solid var(--vermelho)', color: 'var(--vermelho)' }}>
              Mudar para Start (R$65 no próximo mês)
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
