import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 501 })
  }

  try {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(stripeKey)

    const sig = req.headers.get('stripe-signature')!
    const body = await req.text()

    const event = stripe.webhooks.constructEvent(body, sig, webhookSecret)

    // Handle events
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as import('stripe').Stripe.Subscription
        console.log('[Stripe] Subscription updated:', sub.id, sub.status)
        // TODO: Update Prisma subscription record
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as import('stripe').Stripe.Subscription
        console.log('[Stripe] Subscription cancelled:', sub.id)
        break
      }
      case 'invoice.payment_succeeded': {
        console.log('[Stripe] Payment succeeded')
        break
      }
      case 'invoice.payment_failed': {
        console.log('[Stripe] Payment failed')
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[Stripe webhook]', err)
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }
}
