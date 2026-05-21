import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { mapStripeSubscriptionStatus } from '@/lib/billing/status'
import { syncSubscriptionFromStripe, upsertUserFromStripe } from '@/lib/billing/subscription-repository'
import type { BillingSessionPayload } from '@/lib/billing/session-payload'

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id')
  if (!sessionId) {
    return NextResponse.json({ error: 'session_id is required' }, { status: 400 })
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 501 })
  }

  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    })

    if (session.status !== 'complete') {
      return NextResponse.json({ error: 'Checkout session is not complete' }, { status: 400 })
    }

    const email =
      session.customer_email ??
      session.customer_details?.email ??
      session.metadata?.email ??
      ''
    if (!email) {
      return NextResponse.json({ error: 'No email on checkout session' }, { status: 400 })
    }

    const name = session.metadata?.name ?? session.customer_details?.name ?? undefined
    const userId = session.client_reference_id ?? `email:${email.toLowerCase()}`
    const planMeta = session.metadata?.plan === 'team' ? 'team' : 'pro'

    let subscription: Stripe.Subscription | null = null
    if (session.subscription) {
      subscription =
        typeof session.subscription === 'string'
          ? await stripe.subscriptions.retrieve(session.subscription)
          : session.subscription
      await syncSubscriptionFromStripe(subscription, email)
    }

    await upsertUserFromStripe({
      email,
      name,
      stripeCustomerId:
        typeof session.customer === 'string' ? session.customer : session.customer?.id,
    })

    const status = subscription
      ? mapStripeSubscriptionStatus(subscription.status)
      : 'TRIALING'

    const trialEndsAt = subscription?.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : undefined
    const currentPeriodEnd = subscription?.items.data[0]?.current_period_end
      ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString()
      : undefined

    const payload: BillingSessionPayload = {
      email: email.toLowerCase(),
      name,
      userId,
      plan: status === 'TRIALING' ? 'trial' : planMeta,
      status,
      trialEndsAt,
      currentPeriodEnd,
      stripeCustomerId:
        typeof session.customer === 'string' ? session.customer : session.customer?.id,
      stripeSubscriptionId: subscription?.id,
    }

    return NextResponse.json(payload)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to load session'
    console.error('[stripe/session]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
