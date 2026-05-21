import { NextRequest, NextResponse } from 'next/server'
import { getSubscriptionByEmail } from '@/lib/billing/subscription-repository'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')?.trim().toLowerCase()
  if (!email) {
    return NextResponse.json({ error: 'email query param required' }, { status: 400 })
  }

  const dbSub = await getSubscriptionByEmail(email)
  if (dbSub) {
    return NextResponse.json({
      email,
      plan: dbSub.plan,
      status: dbSub.status,
      trialEndsAt: dbSub.trialEndsAt,
      currentPeriodEnd: dbSub.currentPeriodEnd,
      stripeCustomerId: dbSub.stripeCustomerId,
    })
  }

  return NextResponse.json({
    email,
    plan: 'free',
    status: 'INCOMPLETE',
  })
}
