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
    
    // Se for Upgrade (Start -> Pro), fazemos imediatamente com rateio (proration)
    if (plano_destino === 'pro') {
      // Se houver um schedule ativo, ele pode atrapalhar a atualização direta. Removemos se existir.
      if (stripeSub.schedule) {
        await stripe.subscriptionSchedules.release(stripeSub.schedule as string)
      }
      
      const subscriptionItem = stripeSub.items.data[0]
      await stripe.subscriptions.update(stripeSub.id, {
        items: [{
          id: subscriptionItem.id,
          price: priceId,
        }],
        proration_behavior: 'create_prorations'
      })

      return NextResponse.json({ success: true, message: 'Upgrade realizado com sucesso!' })
    }

    // Se for Downgrade (Pro -> Start), agendamos para o próximo ciclo
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

    const periodEnd = currentPhase.end_date || stripeSub.current_period_end
    
    if (!periodEnd) {
      return NextResponse.json({ error: 'Erro ao identificar o fim do ciclo atual.' }, { status: 500 })
    }

    // Atualiza o schedule:
    await stripe.subscriptionSchedules.update(scheduleId, {
      end_behavior: 'release',
      phases: [
        {
          start_date: currentPhase.start_date,
          end_date: Number(periodEnd),
          items: currentItems,
        },
        {
          items: [{ price: priceId, quantity: 1 }],
          proration_behavior: 'none'
        }
      ]
    })

    // Grava a intenção de agendamento na metadata da subscription para leitura super rápida no front
    await stripe.subscriptions.update(stripeSub.id, {
      metadata: { ...stripeSub.metadata, scheduled_plan: plano_destino }
    })

    return NextResponse.json({ success: true, message: 'Downgrade agendado para o próximo ciclo.' })

  } catch (err: any) {
    console.error('Erro ao agendar mudança de plano:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
