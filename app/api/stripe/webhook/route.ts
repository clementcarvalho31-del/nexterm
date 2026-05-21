import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { syncSubscriptionFromStripe, upsertUserFromStripe } from '@/lib/billing/subscription-repository'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!process.env.STRIPE_SECRET_KEY || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 501 })
  }

  const stripe = getStripe()
  const sig = req.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    const body = await req.text()
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('[Stripe webhook] signature verification failed', err)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const email =
          session.customer_email ??
          session.customer_details?.email ??
          session.metadata?.email ??
          null
        const name = session.metadata?.name ?? session.customer_details?.name ?? null

        if (email) {
          await upsertUserFromStripe({
            email,
            name,
            stripeCustomerId:
              typeof session.customer === 'string' ? session.customer : session.customer?.id,
          })
        }

        if (session.subscription) {
          const subId =
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription.id
          const subscription = await stripe.subscriptions.retrieve(subId)
          await syncSubscriptionFromStripe(subscription, email)
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await syncSubscriptionFromStripe(
          subscription,
          subscription.metadata?.email ?? null,
        )
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subId =
          typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription?.id
        if (subId) {
          const subscription = await stripe.subscriptions.retrieve(subId)
          await syncSubscriptionFromStripe(subscription, invoice.customer_email)
        }
        break
      }

      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[Stripe webhook] handler error', event.type, err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
