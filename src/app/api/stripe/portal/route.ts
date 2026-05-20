import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const { empresaId, flow } = await request.json()
    if (!empresaId) {
      return NextResponse.json({ error: 'empresaId obrigatório' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('empresa_id', empresaId)
      .single()

    if (!sub || !sub.stripe_customer_id) {
      return NextResponse.json({ error: 'Customer não encontrado' }, { status: 404 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // CO3: se flow='cancel', abre direto na tela de cancelamento do portal
    const sessionParams: any = {
      customer: sub.stripe_customer_id,
      return_url: `${siteUrl}/configuracoes/planos`,
    }

    if (flow === 'cancel' && sub.stripe_subscription_id) {
      sessionParams.flow_data = {
        type: 'subscription_cancel',
        subscription_cancel: {
          subscription: sub.stripe_subscription_id,
        },
        after_completion: {
          type: 'redirect',
          redirect: { return_url: `${siteUrl}/configuracoes` },
        },
      }
    }

    const session = await stripe.billingPortal.sessions.create(sessionParams)

    return NextResponse.json({ url: session.url })

  } catch (err: any) {
    console.error('Erro no portal do Stripe:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
