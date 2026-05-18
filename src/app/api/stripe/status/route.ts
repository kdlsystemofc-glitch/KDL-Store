import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

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
    
    let scheduledPlan = null
    
    if (stripeSub.schedule) {
      const schedule = await stripe.subscriptionSchedules.retrieve(stripeSub.schedule as string)
      if (schedule.phases.length > 1) {
        const nextPhase = schedule.phases[1]
        // Extract price correctly if it's an object or string
        const priceObj: any = nextPhase.items[0]?.price
        const priceId = typeof priceObj === 'string' ? priceObj : priceObj?.id

        if (priceId === process.env.STRIPE_PRICE_PRO) scheduledPlan = 'pro'
        else if (priceId === process.env.STRIPE_PRICE_START) scheduledPlan = 'start'
      }
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
