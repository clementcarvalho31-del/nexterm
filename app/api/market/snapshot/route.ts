import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const revalidate = 5

const SYMBOLS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'NZD/USD', 'USD/CAD', 'USD/CHF', 'EUR/GBP']

// Synthetic fallback prices (used when APIs are not configured)
const SYNTHETIC_BASE: Record<string, number> = {
  'EUR/USD': 1.08432, 'GBP/USD': 1.26815, 'USD/JPY': 149.284,
  'AUD/USD': 0.64892, 'NZD/USD': 0.59341, 'USD/CAD': 1.36218,
  'USD/CHF': 0.89743, 'EUR/GBP': 0.85541,
}

function syntheticSnapshot() {
  return SYMBOLS.reduce((acc, sym) => {
    const base = SYNTHETIC_BASE[sym] ?? 1
    const pip = sym.includes('JPY') ? 0.01 : 0.0001
    const spread = pip * 1.5
    const jitter = (Math.random() - 0.5) * pip * 10
    const price = base + jitter
    acc[sym] = {
      symbol: sym, price,
      bid: price - spread / 2,
      ask: price + spread / 2,
      change: jitter,
      changePct: (jitter / base) * 100,
      ts: Date.now(),
    }
    return acc
  }, {} as Record<string, object>)
}

export async function GET() {
  // Try real API if configured
  const finnhubKey = process.env.FINNHUB_API_KEY
  if (finnhubKey && finnhubKey !== 'your_key_here') {
    try {
      const results = await Promise.allSettled(
        SYMBOLS.map(async sym => {
          const fhSym = sym.replace('/', '')
          const url = `https://finnhub.io/api/v1/quote?symbol=OANDA:${fhSym}&token=${finnhubKey}`
          const res = await fetch(url, { next: { revalidate: 5 } })
          if (!res.ok) throw new Error(res.statusText)
          const d = await res.json()
          return {
            symbol: sym, price: d.c,
            bid: d.c - 0.00007, ask: d.c + 0.00007,
            change: d.d, changePct: d.dp, ts: d.t * 1000,
          }
        })
      )

      const snapshot: Record<string, object> = {}
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') snapshot[SYMBOLS[i]] = r.value
      })

      if (Object.keys(snapshot).length > 0) {
        return NextResponse.json(snapshot)
      }
    } catch { /* fall through */ }
  }

  return NextResponse.json(syntheticSnapshot())
}
