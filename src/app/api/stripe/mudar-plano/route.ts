import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const { plano_destino, empresaId } = await request.json()
    
    if (!plano_destino || !empresaId) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Busca a assinatura atual
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id, plano')
      .eq('empresa_id', empresaId)
      .single()

    if (!sub || !sub.stripe_subscription_id) {
      return NextResponse.json({ error: 'Nenhuma assinatura ativa encontrada.' }, { status: 404 })
    }

    if (sub.plano === plano_destino) {
      return NextResponse.json({ error: 'Você já está neste plano.' }, { status: 400 })
    }

    const priceId = plano_destino === 'pro' 
      ? process.env.STRIPE_PRICE_PRO 
      : process.env.STRIPE_PRICE_START

    if (!priceId) {
      return NextResponse.json({ error: 'Preço não configurado no servidor.' }, { status: 500 })
    }

    // Pega os dados atuais da assinatura no Stripe
    const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id) as any
    
    let scheduleId = stripeSub.schedule as string

    // Se já não tiver um schedule, criamos um a partir da assinatura atual
    if (!scheduleId) {
      const schedule = await stripe.subscriptionSchedules.create({
        from_subscription: stripeSub.id,
      })
      scheduleId = schedule.id
    }

    // Recupera o schedule para ler a fase atual
    const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId)
    const currentPhase = schedule.phases[0]

    if (!currentPhase) {
      return NextResponse.json({ error: 'Erro ao processar fases da assinatura.' }, { status: 500 })
    }

    const currentItems = currentPhase.items.map((i: any) => ({
      price: typeof i.price === 'string' ? i.price : i.price.id,
      quantity: i.quantity || 1
    }))

    const periodEnd = stripeSub.current_period_end ? Number(stripeSub.current_period_end) : null

    const phase0: any = {
      start_date: currentPhase.start_date,
      items: currentItems,
    }

    if (periodEnd && !isNaN(periodEnd)) {
      phase0.end_date = periodEnd
    } else {
      // Fallback robusto se o Stripe não enviar o current_period_end
      phase0.iterations = 1
    }

    // Atualiza o schedule:
    // 1. A fase atual continua exatamente como está até o final do período (current_period_end)
    // 2. Cria uma nova fase após o período atual usando o novo preço
    await stripe.subscriptionSchedules.update(scheduleId, {
      phases: [
        phase0,
        {
          items: [{ price: priceId, quantity: 1 }],
          proration_behavior: 'none'
        }
      ]
    })

    return NextResponse.json({ success: true, message: 'Plano agendado com sucesso para o próximo ciclo.' })

  } catch (err: any) {
    console.error('Erro ao agendar mudança de plano:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
