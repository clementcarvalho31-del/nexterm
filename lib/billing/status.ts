import type { SubscriptionStatus as DbStatus } from '@prisma/client'
import type Stripe from 'stripe'
import type { SubscriptionStatus } from '@/types/auth'

export function mapStripeSubscriptionStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case 'trialing':
      return 'TRIALING'
    case 'active':
      return 'ACTIVE'
    case 'canceled':
      return 'CANCELED'
    case 'past_due':
      return 'PAST_DUE'
    case 'unpaid':
      return 'UNPAID'
    case 'incomplete':
    case 'incomplete_expired':
      return 'INCOMPLETE'
    default:
      return 'CANCELED'
  }
}

export function toDbStatus(status: SubscriptionStatus): DbStatus {
  return status as DbStatus
}
