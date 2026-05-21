export type UserRole = 'USER' | 'PREMIUM' | 'ADMIN'
export type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'UNPAID' | 'INCOMPLETE'

export interface TerminalUser {
  id: string
  clerkId: string
  email: string
  name?: string
  role: UserRole
  subscription?: {
    status: SubscriptionStatus
    trialEndsAt?: string
    currentPeriodEnd?: string
  }
}

export function hasAccess(user: TerminalUser | null): boolean {
  if (!user) return false
  if (user.role === 'ADMIN') return true
  if (user.role === 'PREMIUM') return true
  if (user.subscription?.status === 'TRIALING') {
    const trialEnd = user.subscription.trialEndsAt
    if (trialEnd && new Date(trialEnd) > new Date()) return true
  }
  if (user.subscription?.status === 'ACTIVE') return true
  return false
}
