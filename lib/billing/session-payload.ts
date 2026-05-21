import type { SubscriptionStatus } from '@/types/auth'

export interface BillingSessionPayload {
  email: string
  name?: string
  userId: string
  plan: 'pro' | 'team' | 'trial' | 'free'
  status: SubscriptionStatus
  trialEndsAt?: string
  currentPeriodEnd?: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
}

export function trialDaysLeft(trialEndsAt?: string): number {
  if (!trialEndsAt) return 0
  const ms = new Date(trialEndsAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)))
}

export function hasActiveBilling(payload: BillingSessionPayload | null): boolean {
  if (!payload) return false
  if (payload.status === 'ACTIVE') return true
  if (payload.status === 'TRIALING') {
    if (!payload.trialEndsAt) return true
    return new Date(payload.trialEndsAt) > new Date()
  }
  return false
}
