import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'

// ─── Mapeia status do Stripe → enum status_plano do banco ────────────────────
// Stripe:  'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing' | ...
// Nosso enum: 'active' | 'inactive' | 'cancelled' | 'trialing'
function mapStripeStatus(s: string): 'active' | 'inactive' | 'cancelled' | 'trialing' {
  switch (s) {
    case 'active':    return 'active'
    case 'trialing':  return 'trialing'
    case 'canceled':  return 'cancelled'   // Stripe usa 1 'l', nosso enum usa 2
    case 'cancelled': return 'cancelled'
    default:          return 'inactive'    // past_due, unpaid, incomplete, paused, etc.
  }
}

// ─── Determina se a assinatura está agendada para cancelar ───────────────────
// O portal do Stripe usa "cancel_at" (timestamp absoluto) em vez de "cancel_at_period_end"
// Precisamos checar AMBOS para detectar corretamente o cancelamento agendado
function isScheduled(sub: any): boolean {
  return sub.cancel_at_period_end === true || sub.cancel_at != null
}

// ─── Data de fim de acesso efetiva ───────────────────────────────────────────
// Quando cancel_at está definido, ele É a data de corte. Senão usa current_period_end.
function accessEndDate(sub: any): Date {
  const ts = sub.cancel_at || sub.current_period_end
  if (ts) return new Date(ts * 1000)
  const fallback = new Date()
  fallback.setDate(fallback.getDate() + 30)
  return fallback
}

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature') as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('[WEBHOOK] Signature failed:', err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  console.log(`[WEBHOOK] ${event.type} | ${event.id}`)

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    switch (event.type) {

      // ── 1. CHECKOUT CONCLUÍDO ─────────────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const subscriptionId = session.subscription as string
        const empresaId = session.metadata?.empresa_id
        const plano = session.metadata?.plano || 'start'

        if (!empresaId) { console.error('[WEBHOOK] empresa_id ausente nos metadados'); break }
        if (!subscriptionId) { console.error('[WEBHOOK] subscription_id ausente na sessão'); break }

        const stripeSub = await stripe.subscriptions.retrieve(subscriptionId) as any
        const priceId = stripeSub?.items?.data?.[0]?.price?.id
        const endDate = accessEndDate(stripeSub)

        console.log(`[WEBHOOK] checkout | empresa=${empresaId} | sub=${subscriptionId} | end=${endDate.toISOString()}`)

        const { data: existing } = await supabaseAdmin
          .from('subscriptions').select('id').eq('empresa_id', empresaId).maybeSingle()

        const subData = {
          status: 'active' as const,
          plano,
          stripe_subscription_id: subscriptionId,
          stripe_price_id: priceId,
          cancel_at_period_end: isScheduled(stripeSub),
          current_period_end: endDate.toISOString()
        }

        if (existing) {
          const { error } = await supabaseAdmin.from('subscriptions').update(subData).eq('id', existing.id)
          if (error) console.error('[WEBHOOK] Erro update (checkout):', error.message)
          else console.log('[WEBHOOK] subscription atualizada (checkout)')
        } else {
          const { error } = await supabaseAdmin.from('subscriptions').insert({ empresa_id: empresaId, ...subData })
          if (error) console.error('[WEBHOOK] Erro insert (checkout):', error.message)
          else console.log('[WEBHOOK] subscription inserida (checkout)')
        }

        const { error: empErr } = await supabaseAdmin.from('empresas').update({ plano }).eq('id', empresaId)
        if (empErr) console.error('[WEBHOOK] Erro update empresa (checkout):', empErr.message)
        break
      }

      // ── 2. PAGAMENTO BEM-SUCEDIDO (RENOVAÇÃO) ────────────────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any
        // Stripe v2023+: invoice.parent.subscription_details.subscription ou invoice.subscription
        const subscriptionId = invoice.subscription
          || invoice.parent?.subscription_details?.subscription as string

        if (!subscriptionId) { console.error('[WEBHOOK] payment_succeeded sem subscription_id'); break }

        const stripeSub = await stripe.subscriptions.retrieve(subscriptionId) as any
        const endDate = accessEndDate(stripeSub)
        const scheduled = isScheduled(stripeSub)

        console.log(`[WEBHOOK] payment_succeeded | sub=${subscriptionId} | end=${endDate.toISOString()} | scheduled=${scheduled}`)

        const { error } = await supabaseAdmin.from('subscriptions').update({
          status: 'active',
          cancel_at_period_end: scheduled,
          current_period_end: endDate.toISOString()
        }).eq('stripe_subscription_id', subscriptionId)

        if (error) console.error('[WEBHOOK] Erro update (payment_succeeded):', error.message)
        else console.log('[WEBHOOK] Renovação registrada com sucesso')
        break
      }

      // ── 3. PAGAMENTO FALHOU ───────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription
          || invoice.parent?.subscription_details?.subscription as string

        if (!subscriptionId) break

        console.log(`[WEBHOOK] payment_failed | sub=${subscriptionId}`)

        // 'past_due' NÃO existe no enum → usamos 'inactive'
        const { error } = await supabaseAdmin.from('subscriptions').update({
          status: 'inactive'
        }).eq('stripe_subscription_id', subscriptionId)

        if (error) console.error('[WEBHOOK] Erro update (payment_failed):', error.message)
        break
      }

      // ── 4. ASSINATURA ATUALIZADA (cancelamento agendado, upgrade, etc.) ──
      case 'customer.subscription.updated': {
        const sub = event.data.object as any
        const priceId = sub?.items?.data?.[0]?.price?.id
        const scheduled = isScheduled(sub)
        const endDate = accessEndDate(sub)

        console.log(`[WEBHOOK] subscription.updated | sub=${sub.id} | status=${sub.status}`)
        console.log(`[WEBHOOK] cancel_at_period_end=${sub.cancel_at_period_end} | cancel_at=${sub.cancel_at} | → scheduled=${scheduled}`)
        console.log(`[WEBHOOK] endDate=${endDate.toISOString()}`)

        const updateData: any = {
          stripe_price_id: priceId,
          status: mapStripeStatus(sub.status),
          cancel_at_period_end: scheduled,
          current_period_end: endDate.toISOString()
        }
        if (priceId === process.env.STRIPE_PRICE_PRO) updateData.plano = 'pro'
        else if (priceId === process.env.STRIPE_PRICE_START) updateData.plano = 'start'

        const { data: row, error: findErr } = await supabaseAdmin
          .from('subscriptions').select('id, empresa_id')
          .eq('stripe_subscription_id', sub.id).maybeSingle()

        if (findErr) { console.error('[WEBHOOK] Erro ao buscar linha:', findErr.message); break }
        if (!row) { console.error(`[WEBHOOK] Nenhuma linha com stripe_subscription_id=${sub.id}`); break }

        const { error: updErr } = await supabaseAdmin.from('subscriptions').update(updateData).eq('id', row.id)
        if (updErr) console.error('[WEBHOOK] Erro ao gravar (subscription.updated):', updErr.message)
        else console.log(`[WEBHOOK] Gravado com sucesso → scheduled=${scheduled} para empresa ${row.empresa_id}`)

        if (row.empresa_id && updateData.plano) {
          await supabaseAdmin.from('empresas').update({ plano: updateData.plano }).eq('id', row.empresa_id)
        }
        break
      }

      // ── 5. ASSINATURA DELETADA (acesso expirou de fato) ──────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription

        console.log(`[WEBHOOK] subscription.deleted | sub=${sub.id}`)

        const { data: row } = await supabaseAdmin
          .from('subscriptions').select('empresa_id')
          .eq('stripe_subscription_id', sub.id).maybeSingle()

        if (!row) { console.error(`[WEBHOOK] Nenhuma linha com stripe_subscription_id=${sub.id}`); break }

        await supabaseAdmin.from('subscriptions').update({
          status: 'cancelled',
          plano: 'start',
          cancel_at_period_end: false
        }).eq('stripe_subscription_id', sub.id)

        if (row.empresa_id) {
          await supabaseAdmin.from('empresas').update({ plano: 'start' }).eq('id', row.empresa_id)
        }

        console.log(`[WEBHOOK] Assinatura encerrada definitivamente para empresa ${row.empresa_id}`)
        break
      }

      default:
        console.log(`[WEBHOOK] Evento ignorado: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('[WEBHOOK] Erro inesperado:', event.type, err)
    return NextResponse.json({ error: err.message || 'Erro interno no webhook' }, { status: 500 })
  }
}
