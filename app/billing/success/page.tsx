'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { saveBillingUser, clearSignupDraft } from '@/lib/billing/client-storage'
import type { BillingSessionPayload } from '@/lib/billing/session-payload'

const shell: React.CSSProperties = {
  minHeight: '100vh', background: '#080b10', color: '#c8d6e5',
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  fontFamily: "'Inter',-apple-system,sans-serif", padding: 24, textAlign: 'center',
}
const title: React.CSSProperties = { fontSize: 24, fontWeight: 800, color: '#f0f4f8', marginBottom: 8 }
const sub: React.CSSProperties = { fontSize: 14, color: '#7a8fa8', maxWidth: 420, lineHeight: 1.6, marginBottom: 20 }

function PageShell({ children }: { children: React.ReactNode }) {
  return <div style={shell}>{children}</div>
}

function Spinner() {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%', marginBottom: 20,
      border: '2px solid rgba(240,180,41,.25)', borderTopColor: '#f0b429',
      animation: 't-spin .7s linear infinite',
    }} />
  )
}

function BillingSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [error, setError] = useState<string | null>(null)
  const [payload, setPayload] = useState<BillingSessionPayload | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setError('Session de paiement introuvable.')
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/stripe/session?session_id=${encodeURIComponent(sessionId)}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Impossible de valider le paiement')
        if (cancelled) return
        saveBillingUser(data)
        clearSignupDraft()
        setPayload(data)
        setTimeout(() => router.replace('/terminal'), 2200)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur inconnue')
      }
    })()
    return () => { cancelled = true }
  }, [sessionId, router])

  if (error) {
    return (
      <PageShell>
        <h1 style={title}>Échec de validation</h1>
        <p style={sub}>{error}</p>
        <Link href="/signup" style={{ color: '#f0b429', fontWeight: 600, textDecoration: 'none' }}>Réessayer</Link>
      </PageShell>
    )
  }

  if (payload) {
    return (
      <PageShell>
        <h1 style={title}>Essai activé</h1>
        <p style={sub}>Bienvenue {payload.name ?? payload.email}. Essai 3 jours actif.</p>
        <p style={{ fontSize: 13, color: '#5a7080' }}>Redirection vers le terminal…</p>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <Spinner />
      <h1 style={title}>Activation en cours…</h1>
      <p style={sub}>Validation avec Stripe</p>
    </PageShell>
  )
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={<PageShell><Spinner /><h1 style={title}>Chargement…</h1></PageShell>}>
      <BillingSuccessContent />
    </Suspense>
  )
}
