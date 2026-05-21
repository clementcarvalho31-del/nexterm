import { NextRequest, NextResponse } from 'next/server'
import { createStripeCheckout } from '@/src/features/billing/services/BillingService'
import { isStripeConfigured } from '@/lib/stripe'
import type { BillingPlanId } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: 'Stripe is not configured. Set STRIPE_SECRET_KEY and STRIPE_PRICE_ID in Vercel.' },
      { status: 501 },
    )
  }

  try {
    const body = await req.json()
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    const plan = (body.plan === 'team' ? 'team' : 'pro') as BillingPlanId
    const url = await createStripeCheckout({
      userId: typeof body.userId === 'string' ? body.userId : undefined,
      email,
      name: typeof body.name === 'string' ? body.name : undefined,
      plan,
    })

    return NextResponse.json({ url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Checkout failed'
    console.error('[stripe/checkout]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
