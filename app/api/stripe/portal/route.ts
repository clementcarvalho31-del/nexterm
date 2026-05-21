import { NextRequest, NextResponse } from 'next/server'
import { createStripePortalSession } from '@/src/features/billing/services/BillingService'
import { isStripeConfigured } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 501 })
  }

  try {
    const { email, stripeCustomerId } = await req.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }
    const url = await createStripePortalSession(
      email.trim(),
      typeof stripeCustomerId === 'string' ? stripeCustomerId : undefined,
    )
    return NextResponse.json({ url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Portal session failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
