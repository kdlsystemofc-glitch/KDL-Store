import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature') as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  // Admin client para bypassar o RLS
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const subscriptionId = session.subscription as string
        const empresaId = session.metadata?.empresa_id
        const plano = session.metadata?.plano || 'start'

        if (empresaId && subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any
          const priceId = subscription?.items?.data?.[0]?.price?.id

          let endDate = new Date()
          endDate.setDate(endDate.getDate() + 30) // fallback de 30 dias

          if (subscription && subscription.current_period_end) {
            endDate = new Date(subscription.current_period_end * 1000)
          } else {
            console.error('ALERTA: current_period_end ausente no objeto subscription:', JSON.stringify(subscription))
          }

          const { data: existingSub } = await supabaseAdmin.from('subscriptions')
            .select('id').eq('empresa_id', empresaId).maybeSingle()

          const subData = {
            status: 'active',
            plano,
            stripe_subscription_id: subscriptionId,
            stripe_price_id: priceId,
            current_period_end: endDate.toISOString()
          }

          if (existingSub) {
            await supabaseAdmin.from('subscriptions').update(subData).eq('id', existingSub.id).throwOnError()
          } else {
            await supabaseAdmin.from('subscriptions').insert({
              empresa_id: empresaId,
              ...subData
            }).throwOnError()
          }

          await supabaseAdmin.from('empresas').update({ plano }).eq('id', empresaId).throwOnError()
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = (invoice as any).subscription as string

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any
          let endDate = new Date()
          endDate.setDate(endDate.getDate() + 30)
          if (subscription && subscription.current_period_end) {
            endDate = new Date(subscription.current_period_end * 1000)
          }

          await supabaseAdmin.from('subscriptions').update({
            status: 'active',
            current_period_end: endDate.toISOString()
          }).eq('stripe_subscription_id', subscriptionId).throwOnError()
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = (invoice as any).subscription as string

        if (subscriptionId) {
          await supabaseAdmin.from('subscriptions').update({
            status: 'past_due'
          }).eq('stripe_subscription_id', subscriptionId).throwOnError()
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any
        const priceId = subscription?.items?.data?.[0]?.price?.id
        
        let endDate = new Date()
        endDate.setDate(endDate.getDate() + 30)
        if (subscription && subscription.current_period_end) {
          endDate = new Date(subscription.current_period_end * 1000)
        }

        const updateData: any = {
          stripe_price_id: priceId,
          status: subscription.status,
          cancel_at_period_end: subscription.cancel_at_period_end,
          current_period_end: endDate.toISOString()
        }

        if (priceId === process.env.STRIPE_PRICE_PRO) {
          updateData.plano = 'pro'
        } else if (priceId === process.env.STRIPE_PRICE_START) {
          updateData.plano = 'start'
        }

        await supabaseAdmin.from('subscriptions').update(updateData).eq('stripe_subscription_id', subscription.id).throwOnError()

        // Atualizar empresa_id baseado na subscription
        const { data: subData } = await supabaseAdmin.from('subscriptions')
          .select('empresa_id').eq('stripe_subscription_id', subscription.id).single()
        
        if (subData?.empresa_id && updateData.plano) {
          await supabaseAdmin.from('empresas').update({ plano: updateData.plano }).eq('id', subData.empresa_id).throwOnError()
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        await supabaseAdmin.from('subscriptions').update({
          status: 'cancelled',
          plano: 'start',
          cancel_at_period_end: false
        }).eq('stripe_subscription_id', subscription.id).throwOnError()

        const { data: subData } = await supabaseAdmin.from('subscriptions')
          .select('empresa_id').eq('stripe_subscription_id', subscription.id).single()
        
        if (subData?.empresa_id) {
          await supabaseAdmin.from('empresas').update({ plano: 'start' }).eq('id', subData.empresa_id).throwOnError()
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Erro processando webhook:', err)
    return NextResponse.json({ error: err.message || 'Erro interno no webhook' }, { status: 500 })
  }
}
