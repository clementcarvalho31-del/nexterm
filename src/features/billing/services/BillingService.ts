import type { BillingPlanId } from '@/lib/stripe'

export interface CheckoutRequest {
  userId?: string
  email: string
  name?: string
  plan?: BillingPlanId
}

export interface CheckoutResponse {
  url: string
  error?: string
}

class BillingService {
  async createCheckout(req: CheckoutRequest): Promise<CheckoutResponse> {
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      return data as CheckoutResponse
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return { url: '', error: message }
    }
  }

  async openCustomerPortal(email: string, stripeCustomerId?: string): Promise<CheckoutResponse> {
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, stripeCustomerId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      return data as CheckoutResponse
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return { url: '', error: message }
    }
  }
}

export const billingService = new BillingService()

// ─── Server-side Stripe helpers ───────────────────────────────────────────────
export async function createStripeCheckout(params: CheckoutRequest): Promise<string> {
  const { getStripe, getPriceIdForPlan, appBaseUrl } = await import('@/lib/stripe')
  const stripe = getStripe()
  const plan = params.plan ?? 'pro'
  const priceId = getPriceIdForPlan(plan)
  const appUrl = appBaseUrl()
  const userId = params.userId ?? `email:${params.email.toLowerCase()}`

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    payment_method_collection: 'if_required',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/billing/canceled`,
    client_reference_id: userId,
    customer_email: params.email,
    metadata: {
      userId,
      email: params.email.toLowerCase(),
      plan,
      ...(params.name ? { name: params.name } : {}),
    },
    subscription_data: {
      trial_period_days: 3,
      metadata: {
        userId,
        email: params.email.toLowerCase(),
        plan,
      },
      trial_settings: {
        end_behavior: { missing_payment_method: 'cancel' },
      },
    },
  })

  if (!session.url) throw new Error('Stripe returned no URL')
  return session.url
}

export async function createStripePortalSession(
  email: string,
  stripeCustomerId?: string,
): Promise<string> {
  const { getStripe, appBaseUrl } = await import('@/lib/stripe')
  const { getSubscriptionByEmail } = await import('@/lib/billing/subscription-repository')
  const stripe = getStripe()

  let customerId = stripeCustomerId
  if (!customerId) {
    const sub = await getSubscriptionByEmail(email)
    customerId = sub?.stripeCustomerId
  }
  if (!customerId) {
    const customers = await stripe.customers.list({ email: email.toLowerCase(), limit: 1 })
    customerId = customers.data[0]?.id
  }
  if (!customerId) {
    throw new Error('No Stripe customer found for this email. Complete checkout first.')
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appBaseUrl()}/terminal`,
  })

  if (!portal.url) throw new Error('Stripe returned no portal URL')
  return portal.url
}
