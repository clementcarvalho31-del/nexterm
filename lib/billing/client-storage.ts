'use client'

import type { BillingSessionPayload } from '@/lib/billing/session-payload'

const USER_KEY = 'nexterm_user_v1'

export function loadBillingUser(): BillingSessionPayload | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    return JSON.parse(raw) as BillingSessionPayload
  } catch {
    return null
  }
}

export function saveBillingUser(payload: BillingSessionPayload): void {
  localStorage.setItem(USER_KEY, JSON.stringify(payload))
}

export function clearBillingUser(): void {
  localStorage.removeItem(USER_KEY)
}

export function stashSignupDraft(draft: { email: string; name: string; plan: 'pro' | 'team' }): void {
  sessionStorage.setItem('nexterm_signup_draft', JSON.stringify(draft))
}

export function readSignupDraft(): { email: string; name: string; plan: 'pro' | 'team' } | null {
  try {
    const raw = sessionStorage.getItem('nexterm_signup_draft')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearSignupDraft(): void {
  sessionStorage.removeItem('nexterm_signup_draft')
}
