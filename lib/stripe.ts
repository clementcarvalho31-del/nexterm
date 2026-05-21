import Stripe from 'stripe'

let stripeClient: Stripe | null = null

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured')
  if (!stripeClient) stripeClient = new Stripe(key)
  return stripeClient
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID)
}

export type BillingPlanId = 'pro' | 'team'

export function getPriceIdForPlan(plan: BillingPlanId): string {
  if (plan === 'team') {
    const teamPrice = process.env.STRIPE_PRICE_ID_TEAM
    if (!teamPrice) throw new Error('STRIPE_PRICE_ID_TEAM is not configured for Team plan')
    return teamPrice
  }
  const proPrice = process.env.STRIPE_PRICE_ID
  if (!proPrice) throw new Error('STRIPE_PRICE_ID is not configured')
  return proPrice
}

export function appBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
}
