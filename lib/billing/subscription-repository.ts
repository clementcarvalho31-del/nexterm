import type Stripe from 'stripe'
import { prisma, isDatabaseConfigured } from '@/lib/prisma'
import { mapStripeSubscriptionStatus, toDbStatus } from '@/lib/billing/status'
import type { SubscriptionStatus } from '@/types/auth'

function pendingClerkId(email: string): string {
  return `pending:${email.toLowerCase()}`
}

export async function upsertUserFromStripe(params: {
  email: string
  name?: string | null
  stripeCustomerId?: string | null
}): Promise<string | null> {
  if (!isDatabaseConfigured()) return null

  const email = params.email.toLowerCase()
  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: params.name ?? undefined,
      clerkId: pendingClerkId(email),
    },
    update: {
      ...(params.name ? { name: params.name } : {}),
    },
  })

  return user.id
}

export async function syncSubscriptionFromStripe(
  subscription: Stripe.Subscription,
  emailHint?: string | null,
): Promise<void> {
  if (!isDatabaseConfigured()) return

  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id

  const metaUserId = subscription.metadata?.userId
  const metaEmail = subscription.metadata?.email ?? emailHint ?? undefined

  let userId = metaUserId

  if (!userId && metaEmail) {
    userId = (await upsertUserFromStripe({ email: metaEmail, stripeCustomerId: customerId })) ?? undefined
  }

  if (!userId) {
    console.warn('[billing] Could not resolve user for subscription', subscription.id)
    return
  }

  const status = mapStripeSubscriptionStatus(subscription.status)
  const trialEndsAt = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
  const currentPeriodEnd = subscription.items.data[0]?.current_period_end
    ? new Date(subscription.items.data[0].current_period_end * 1000)
    : null
  const priceId = subscription.items.data[0]?.price?.id ?? null

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      status: toDbStatus(status),
      trialEndsAt,
      currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    update: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      status: toDbStatus(status),
      trialEndsAt,
      currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  })

  if (status === 'ACTIVE' || status === 'TRIALING') {
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'PREMIUM' },
    })
  }
}

export async function getSubscriptionByEmail(email: string): Promise<{
  status: SubscriptionStatus
  trialEndsAt?: string
  currentPeriodEnd?: string
  stripeCustomerId?: string
  plan: 'pro' | 'team' | 'trial' | 'free'
} | null> {
  if (!isDatabaseConfigured()) return null

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { subscription: true },
  })

  if (!user?.subscription) return null

  const sub = user.subscription
  const teamPrice = process.env.STRIPE_PRICE_ID_TEAM
  const plan =
    sub.stripePriceId && teamPrice && sub.stripePriceId === teamPrice
      ? 'team'
      : sub.status === 'TRIALING'
        ? 'trial'
        : 'pro'

  return {
    status: sub.status as SubscriptionStatus,
    trialEndsAt: sub.trialEndsAt?.toISOString(),
    currentPeriodEnd: sub.currentPeriodEnd?.toISOString(),
    stripeCustomerId: sub.stripeCustomerId ?? undefined,
    plan,
  }
}
