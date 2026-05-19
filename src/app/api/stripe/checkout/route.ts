import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const { plano, empresaId } = await request.json()
    if (!plano || !empresaId) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar customer id e estado atual da assinatura no banco
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id, status, plano')
      .eq('empresa_id', empresaId)
      .single()

    // Bloqueia criação de nova sessão se já existe assinatura ativa no mesmo plano
    if (sub?.stripe_subscription_id && (sub.status === 'active' || sub.status === 'trialing')) {
      if (sub.plano === plano) {
        return NextResponse.json({ error: 'Você já possui uma assinatura ativa neste plano.' }, { status: 400 })
      }
      // Se quer mudar de plano com assinatura ativa, deve usar /api/stripe/mudar-plano
      return NextResponse.json({ error: 'Para mudar de plano use a rota de mudança de plano.' }, { status: 400 })
    }

    let customerId = sub?.stripe_customer_id

    if (!customerId) {
      // Criar novo customer no Stripe
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { empresa_id: empresaId }
      })
      customerId = customer.id

      // Salvar customerId no banco
      await supabase
        .from('subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('empresa_id', empresaId)
    }

    const priceId = plano === 'pro' 
      ? process.env.STRIPE_PRICE_PRO 
      : process.env.STRIPE_PRICE_START

    if (!priceId) {
      return NextResponse.json({ error: 'Preço não configurado' }, { status: 500 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/dashboard?sucesso=1`,
      cancel_url: `${siteUrl}/assinar`,
      metadata: { empresa_id: empresaId, plano },
      subscription_data: {
        metadata: { empresa_id: empresaId }
      },
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })

  } catch (err: any) {
    console.error('Erro no checkout:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
