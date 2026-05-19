import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const { empresaId } = await request.json()
    if (!empresaId) return NextResponse.json({ error: 'empresaId ausente' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('empresa_id', empresaId)
      .single()

    if (!sub || !sub.stripe_subscription_id) {
      return NextResponse.json({ error: 'Nenhuma assinatura ativa encontrada.' }, { status: 404 })
    }

    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: true
    })

    return NextResponse.json({ success: true, message: 'Assinatura cancelada com sucesso.' })

  } catch (err: any) {
    console.error('Erro ao cancelar:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
