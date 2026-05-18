interface CheckoutRequest {
  userId: string
  email:  string
}

interface CheckoutResponse {
  url:    string
  error?: string
}

class BillingService {
  async createCheckout(req: CheckoutRequest): Promise<CheckoutResponse> {
    try {
      const res = await fetch('/api/stripe/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(req),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return { url: '', error: message }
    }
  }
}

export const billingService = new BillingService()

// ─── Server-side Stripe helpers ───────────────────────────────────────────────
export async function createStripeCheckout(userId: string, email: string): Promise<string> {
  const { default: Stripe } = await import('stripe')
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const priceId  = process.env.STRIPE_PRICE_ID!
  const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    mode:                'subscription',
    payment_method_types: ['card'],
    line_items:          [{ price: priceId, quantity: 1 }],
    success_url:         `${appUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:          `${appUrl}/pricing`,
    client_reference_id: userId,
    customer_email:      email,
    subscription_data:   { trial_period_days: 3, metadata: { userId } },
  })

  if (!session.url) throw new Error('Stripe returned no URL')
  return session.url
}
