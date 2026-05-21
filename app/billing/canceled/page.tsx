import Link from 'next/link'

export default function BillingCanceledPage() {
  return (
    <div style={{
      minHeight: '100vh', background: '#080b10', color: '#c8d6e5',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter',-apple-system,sans-serif", padding: 24, textAlign: 'center',
    }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f0f4f8', marginBottom: 8 }}>Paiement annulé</h1>
      <p style={{ fontSize: 14, color: '#7a8fa8', maxWidth: 400, marginBottom: 24 }}>
        Aucun prélèvement n&apos;a été effectué. Vous pouvez reprendre l&apos;inscription quand vous voulez.
      </p>
      <Link href="/signup" style={{
        padding: '10px 20px', borderRadius: 8,
        background: 'linear-gradient(135deg,#f0b429,#d4780a)',
        color: '#000', fontWeight: 700, textDecoration: 'none', fontSize: 14,
      }}>
        Retour à l&apos;inscription
      </Link>
    </div>
  )
}
