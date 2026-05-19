import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const empresaId = searchParams.get('empresaId')

  if (!empresaId) return NextResponse.json({ error: 'empresaId missing' }, { status: 400 })

  const supabase = await createClient()
  const { data: sub } = await supabase.from('subscriptions').select('*').eq('empresa_id', empresaId).single()

  if (!sub || !sub.stripe_subscription_id) {
    return NextResponse.json({ sub })
  }

  try {
    const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id) as any
    
    let scheduledPlan = stripeSub.metadata?.scheduled_plan || null

    // Fallback apenas se metadata não estiver lá por algum motivo
    if (!scheduledPlan) {
      try {
        let scheduleId = stripeSub.schedule as string | undefined

        if (!scheduleId && sub.stripe_customer_id) {
          const schedules = await stripe.subscriptionSchedules.list({ customer: sub.stripe_customer_id })
          const activeSchedule = schedules.data.find(s => s.subscription === stripeSub.id && s.status === 'active')
          if (activeSchedule) scheduleId = activeSchedule.id
        }

        if (scheduleId) {
          const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId)
          if (schedule.phases && schedule.phases.length > 1) {
            const nextPhase = schedule.phases[1]
            const priceObj: any = nextPhase.items?.[0]?.price
            const priceId = typeof priceObj === 'string' ? priceObj : priceObj?.id

            if (priceId && priceId === process.env.STRIPE_PRICE_PRO) scheduledPlan = 'pro'
            else if (priceId && priceId === process.env.STRIPE_PRICE_START) scheduledPlan = 'start'
          }
        }
      } catch (scheduleErr) {
        console.error('Erro ao processar schedule fallback:', scheduleErr)
      }
    }

    // Se a mudança já entrou em vigor, limpa a exibição
    if (scheduledPlan === sub.plano) {
      scheduledPlan = null
    }

    return NextResponse.json({
      sub: {
        ...sub,
        scheduled_plan: scheduledPlan,
        status: stripeSub.status,
        cancel_at_period_end: stripeSub.cancel_at_period_end,
        current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString()
      }
    })
  } catch (e) {
    console.error('Erro ao buscar status no Stripe:', e)
    return NextResponse.json({ sub })
  }
}
