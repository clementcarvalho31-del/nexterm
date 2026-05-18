import { NextRequest, NextResponse } from 'next/server'
import { createStripeCheckout } from '@/src/features/billing/services/BillingService'

export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await req.json()
    const url = await createStripeCheckout(userId, email)
    return NextResponse.json({ url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Checkout failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
