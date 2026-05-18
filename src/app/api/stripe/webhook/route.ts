import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'

// ─── helper: mapeia status do Stripe para o enum status_plano do banco ───────
// O enum aceita: 'active' | 'inactive' | 'cancelled' | 'trialing'
// O Stripe pode enviar: 'active' | 'past_due' | 'canceled' | 'incomplete' | etc.
function mapStripeStatus(stripeStatus: string): 'active' | 'inactive' | 'cancelled' | 'trialing' {
  switch (stripeStatus) {
    case 'active':    return 'active'
    case 'trialing':  return 'trialing'
    case 'canceled':  return 'cancelled'   // Stripe usa 1 'l', nosso enum usa 2
    case 'cancelled': return 'cancelled'
    case 'past_due':
    case 'unpaid':
    case 'incomplete':
    case 'incomplete_expired':
    case 'paused':
    default:          return 'inactive'    // fallback seguro
  }
}

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature') as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('[WEBHOOK] Signature verification failed:', err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  console.log(`[WEBHOOK] Received event: ${event.type} | id: ${event.id}`)

  // Admin client para bypassar o RLS
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    switch (event.type) {

      // ─── CHECKOUT CONCLUÍDO ──────────────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const subscriptionId = session.subscription as string
        const empresaId = session.metadata?.empresa_id
        const plano = session.metadata?.plano || 'start'

        console.log(`[WEBHOOK] checkout.session.completed | empresa_id=${empresaId} | sub_id=${subscriptionId} | plano=${plano}`)

        if (!empresaId) { console.error('[WEBHOOK] ERRO: empresa_id ausente nos metadados'); break }
        if (!subscriptionId) { console.error('[WEBHOOK] ERRO: subscription_id ausente na sessão'); break }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any
        const priceId = subscription?.items?.data?.[0]?.price?.id
        const endDate = subscription?.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d })()

        console.log(`[WEBHOOK] checkout → stripe_subscription_id=${subscriptionId} | current_period_end=${endDate.toISOString()}`)

        const { data: existingSub, error: findErr } = await supabaseAdmin
          .from('subscriptions')
          .select('id')
          .eq('empresa_id', empresaId)
          .maybeSingle()

        console.log(`[WEBHOOK] existingSub encontrado: ${existingSub?.id ?? 'NENHUM'} | findErr: ${findErr?.message ?? 'none'}`)

        const subData = {
          status: 'active' as const,
          plano,
          stripe_subscription_id: subscriptionId,
          stripe_price_id: priceId,
          cancel_at_period_end: false,
          current_period_end: endDate.toISOString()
        }

        if (existingSub) {
          const { error: updErr } = await supabaseAdmin
            .from('subscriptions').update(subData).eq('id', existingSub.id)
          if (updErr) console.error('[WEBHOOK] Erro ao atualizar subscription (checkout):', updErr.message)
          else console.log('[WEBHOOK] subscription atualizada com sucesso (checkout)')
        } else {
          const { error: insErr } = await supabaseAdmin
            .from('subscriptions').insert({ empresa_id: empresaId, ...subData })
          if (insErr) console.error('[WEBHOOK] Erro ao inserir subscription (checkout):', insErr.message)
          else console.log('[WEBHOOK] subscription inserida com sucesso (checkout)')
        }

        const { error: empErr } = await supabaseAdmin
          .from('empresas').update({ plano }).eq('id', empresaId)
        if (empErr) console.error('[WEBHOOK] Erro ao atualizar empresa (checkout):', empErr.message)
        break
      }

      // ─── PAGAMENTO BEM-SUCEDIDO (RENOVAÇÃO) ─────────────────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = (invoice as any).subscription as string

        console.log(`[WEBHOOK] invoice.payment_succeeded | sub_id=${subscriptionId}`)

        if (!subscriptionId) break

        const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any
        const endDate = subscription?.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d })()

        const { error } = await supabaseAdmin.from('subscriptions').update({
          status: 'active',
          cancel_at_period_end: subscription.cancel_at_period_end ?? false,
          current_period_end: endDate.toISOString()
        }).eq('stripe_subscription_id', subscriptionId)

        if (error) console.error('[WEBHOOK] Erro ao atualizar (payment_succeeded):', error.message)
        else console.log('[WEBHOOK] Renovação registrada com sucesso')
        break
      }

      // ─── PAGAMENTO FALHOU ────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = (invoice as any).subscription as string

        console.log(`[WEBHOOK] invoice.payment_failed | sub_id=${subscriptionId}`)

        if (!subscriptionId) break

        // IMPORTANTE: 'past_due' NÃO está no enum status_plano → usamos 'inactive'
        const { error } = await supabaseAdmin.from('subscriptions').update({
          status: 'inactive'
        }).eq('stripe_subscription_id', subscriptionId)

        if (error) console.error('[WEBHOOK] Erro ao atualizar (payment_failed):', error.message)
        break
      }

      // ─── ASSINATURA ATUALIZADA (inclui cancelamento agendado) ────────────
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any
        const priceId = subscription?.items?.data?.[0]?.price?.id

        console.log(`[WEBHOOK] customer.subscription.updated | sub_id=${subscription.id} | status=${subscription.status} | cancel_at_period_end=${subscription.cancel_at_period_end}`)

        const endDate = subscription?.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d })()

        const updateData: any = {
          stripe_price_id: priceId,
          status: mapStripeStatus(subscription.status),
          cancel_at_period_end: subscription.cancel_at_period_end ?? false,
          current_period_end: endDate.toISOString()
        }

        if (priceId === process.env.STRIPE_PRICE_PRO) updateData.plano = 'pro'
        else if (priceId === process.env.STRIPE_PRICE_START) updateData.plano = 'start'

        console.log(`[WEBHOOK] Dados a gravar:`, JSON.stringify(updateData))

        // Verifica se existe uma linha com esse stripe_subscription_id antes de atualizar
        const { data: checkRow, error: checkErr } = await supabaseAdmin
          .from('subscriptions')
          .select('id, empresa_id, stripe_subscription_id')
          .eq('stripe_subscription_id', subscription.id)
          .maybeSingle()

        console.log(`[WEBHOOK] Linha encontrada: ${JSON.stringify(checkRow)} | erro: ${checkErr?.message ?? 'none'}`)

        if (!checkRow) {
          console.error(`[WEBHOOK] CAUSA RAIZ: Nenhuma linha com stripe_subscription_id=${subscription.id}. O checkout.session.completed não salvou o stripe_subscription_id corretamente.`)
          break
        }

        const { error: updErr } = await supabaseAdmin
          .from('subscriptions').update(updateData).eq('stripe_subscription_id', subscription.id)

        if (updErr) console.error('[WEBHOOK] Erro ao atualizar (subscription.updated):', updErr.message)
        else console.log(`[WEBHOOK] cancel_at_period_end=${subscription.cancel_at_period_end} gravado com sucesso para empresa ${checkRow.empresa_id}`)

        if (checkRow.empresa_id && updateData.plano) {
          await supabaseAdmin.from('empresas').update({ plano: updateData.plano }).eq('id', checkRow.empresa_id)
        }
        break
      }

      // ─── ASSINATURA DELETADA DEFINITIVAMENTE ─────────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        console.log(`[WEBHOOK] customer.subscription.deleted | sub_id=${subscription.id}`)

        const { data: checkRow } = await supabaseAdmin
          .from('subscriptions')
          .select('empresa_id')
          .eq('stripe_subscription_id', subscription.id)
          .maybeSingle()

        if (!checkRow) {
          console.error(`[WEBHOOK] CAUSA RAIZ: Nenhuma linha com stripe_subscription_id=${subscription.id} para deletar`)
          break
        }

        await supabaseAdmin.from('subscriptions').update({
          status: 'cancelled',
          plano: 'start',
          cancel_at_period_end: false
        }).eq('stripe_subscription_id', subscription.id)

        if (checkRow.empresa_id) {
          await supabaseAdmin.from('empresas').update({ plano: 'start' }).eq('id', checkRow.empresa_id)
        }
        break
      }

      default:
        console.log(`[WEBHOOK] Evento ignorado: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('[WEBHOOK] Erro inesperado processando evento:', event.type, err)
    return NextResponse.json({ error: err.message || 'Erro interno no webhook' }, { status: 500 })
  }
}
