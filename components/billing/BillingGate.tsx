'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { loadBillingUser } from '@/lib/billing/client-storage'
import { hasActiveBilling } from '@/lib/billing/session-payload'

function billingEnforced(): boolean {
  if (process.env.NEXT_PUBLIC_BILLING_SKIP === 'true') return false
  return process.env.NEXT_PUBLIC_REQUIRE_BILLING !== 'false'
}

export function BillingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [state, setState] = useState<'checking' | 'allowed' | 'blocked'>('checking')

  useEffect(() => {
    if (!billingEnforced()) {
      setState('allowed')
      return
    }

    const session = searchParams.get('session_id')
    if (session) {
      setState('checking')
      return
    }

    const user = loadBillingUser()
    if (hasActiveBilling(user)) {
      setState('allowed')
      return
    }

    router.replace('/signup?reason=subscription')
  }, [router, searchParams])

  if (state === 'checking') {
    return (
      <div style={{
        minHeight: '100vh', background: '#080b10', color: '#7a8fa8',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Inter',-apple-system,sans-serif", gap: 12,
      }}>
        <Spinner />
        <p style={{ fontSize: 14 }}>Vérification de l&apos;abonnement…</p>
      </div>
    )
  }

  if (state === 'blocked') return null

  return <>{children}</>
}

function Spinner() {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%',
      border: '2px solid rgba(240,180,41,.25)', borderTopColor: '#f0b429',
      animation: 't-spin .7s linear infinite',
    }} />
  )
}

export function SubscriptionRequiredBanner() {
  return (
    <div style={{
      padding: '12px 16px', borderRadius: 8, marginBottom: 16,
      background: 'rgba(239,68,68,.08)', border: '0.5px solid rgba(239,68,68,.25)',
    }}>
      <p style={{ fontSize: 13, color: '#fca5a5', margin: 0 }}>
        Accès terminal réservé aux abonnés.{' '}
        <Link href="/signup" style={{ color: '#f0b429', fontWeight: 600 }}>Activer l&apos;essai 3 jours</Link>
      </p>
    </div>
  )
}
