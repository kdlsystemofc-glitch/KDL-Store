import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const { empresaId } = await request.json()
    if (!empresaId) return NextResponse.json({ error: 'empresaId missing' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Busca a subscription local para pegar o stripe_subscription_id
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('empresa_id', empresaId)
      .single()

    if (!sub || !sub.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active stripe subscription found' }, { status: 404 })
    }

    // Busca o dado fresco do Stripe
    const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id)
    
    const priceId = stripeSub.items.data[0]?.price?.id
    let plano = 'start'
    if (priceId === process.env.STRIPE_PRICE_PRO) plano = 'pro'

    let endDate = new Date()
    endDate.setDate(endDate.getDate() + 30)
    if (stripeSub.current_period_end) {
      endDate = new Date(stripeSub.current_period_end * 1000)
    }

    const updateData = {
      plano,
      status: stripeSub.status,
      cancel_at_period_end: stripeSub.cancel_at_period_end,
      current_period_end: endDate.toISOString(),
      stripe_price_id: priceId
    }

    // Usamos admin bypass para garantir que o RLS nao atrapalhe
    const supabaseAdmin = createClient()
    await supabaseAdmin
      .from('subscriptions')
      .update(updateData)
      .eq('stripe_subscription_id', stripeSub.id)

    // Atualiza empresa plano
    await supabaseAdmin
      .from('empresas')
      .update({ plano })
      .eq('id', empresaId)

    return NextResponse.json({ synced: true, updateData })
  } catch (err: any) {
    console.error('Error syncing stripe sub:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
