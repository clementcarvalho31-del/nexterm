import { getDecimals } from '@/src/config'
import type { TickData } from '@/src/types'

// ─── Simple TTL cache ─────────────────────────────────────────────────────────
class TTLCache<T> {
  private store = new Map<string, { v: T; exp: number }>()

  set(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { v: value, exp: Date.now() + ttlMs })
  }

  get(key: string): T | null {
    const e = this.store.get(key)
    if (!e) return null
    if (Date.now() > e.exp) { this.store.delete(key); return null }
    return e.v
  }

  delete(key: string): void { this.store.delete(key) }
}

// ─── Rate limiter (token bucket) ──────────────────────────────────────────────
class RateLimiter {
  private tokens: number
  private lastRefill = Date.now()
  constructor(private readonly rpmLimit: number) { this.tokens = rpmLimit }

  async acquire(): Promise<void> {
    const now     = Date.now()
    const elapsed = now - this.lastRefill
    this.tokens   = Math.min(this.rpmLimit, this.tokens + (elapsed / 60_000) * this.rpmLimit)
    this.lastRefill = now

    if (this.tokens >= 1) { this.tokens -= 1; return }
    const waitMs = ((1 - this.tokens) / this.rpmLimit) * 60_000
    await new Promise(r => setTimeout(r, waitMs))
    this.tokens = 0
  }
}

// ─── Providers ────────────────────────────────────────────────────────────────
async function fetchFinnhub(symbol: string, key: string): Promise<TickData> {
  const fxSym = symbol.replace('/', '')
  const url   = `https://finnhub.io/api/v1/quote?symbol=OANDA:${fxSym}&token=${key}`
  const res   = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Finnhub ${res.status}`)
  const d = await res.json()
  if (!d.c) throw new Error('Finnhub: empty response')
  return {
    symbol, price: d.c,
    bid:       d.c - 0.00007,
    ask:       d.c + 0.00007,
    change:    d.d   ?? 0,
    changePct: d.dp  ?? 0,
    ts:        (d.t  ?? Date.now() / 1000) * 1000,
  }
}

async function fetchTwelveData(symbol: string, key: string): Promise<TickData> {
  const url = `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${key}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`TwelveData ${res.status}`)
  const d = await res.json()
  if (d.code) throw new Error(d.message)
  const price = parseFloat(d.close)
  return {
    symbol, price,
    bid:       parseFloat(d.low),
    ask:       parseFloat(d.high),
    change:    parseFloat(d.change),
    changePct: parseFloat(d.percent_change),
    ts:        new Date(d.datetime).getTime(),
  }
}

// ─── Synthetic fallback ───────────────────────────────────────────────────────
const BASE: Record<string, number> = {
  'EUR/USD': 1.08432, 'GBP/USD': 1.26815, 'USD/JPY': 149.284,
  'AUD/USD': 0.64892, 'NZD/USD': 0.59341, 'USD/CAD': 1.36218,
  'USD/CHF': 0.89743, 'EUR/GBP': 0.85541, 'DXY': 104.320, 'GOLD': 2318.4,
}

function syntheticTick(symbol: string): TickData {
  const base   = BASE[symbol] ?? 1.0
  const spread = symbol.includes('JPY') ? 0.012 : symbol === 'GOLD' ? 0.3 : 0.00014
  const jitter = (Math.random() - 0.5) * spread * 2
  const price  = base + jitter
  return {
    symbol, price,
    bid:       price - spread / 2,
    ask:       price + spread / 2,
    change:    jitter,
    changePct: (jitter / base) * 100,
    ts:        Date.now(),
  }
}

// ─── Market data service ──────────────────────────────────────────────────────
class MarketDataService {
  private cache      = new TTLCache<TickData>()
  private limiters   = new Map<string, RateLimiter>()
  private readonly TICK_TTL = 5_000

  private limiter(provider: string, rpm: number): RateLimiter {
    if (!this.limiters.has(provider)) this.limiters.set(provider, new RateLimiter(rpm))
    return this.limiters.get(provider)!
  }

  async getQuote(symbol: string): Promise<TickData> {
    const cached = this.cache.get(symbol)
    if (cached) return cached

    const providers = [
      {
        name: 'finnhub',
        fn:   () => fetchFinnhub(symbol, process.env.FINNHUB_API_KEY ?? ''),
        rpm:  60,
      },
      {
        name: 'twelvedata',
        fn:   () => fetchTwelveData(symbol, process.env.TWELVEDATA_API_KEY ?? ''),
        rpm:  8,
      },
    ]

    for (const p of providers) {
      if (!process.env[`${p.name.toUpperCase()}_API_KEY`]) continue
      try {
        await this.limiter(p.name, p.rpm).acquire()
        const tick = await p.fn()
        this.cache.set(symbol, tick, this.TICK_TTL)
        return tick
      } catch (err) {
        console.warn(`[MarketData] ${p.name} failed for ${symbol}:`, err)
      }
    }

    // Synthetic fallback
    const tick = syntheticTick(symbol)
    this.cache.set(symbol, tick, 2_000)
    return tick
  }

  async getMultiple(symbols: string[]): Promise<Map<string, TickData>> {
    const results = new Map<string, TickData>()
    await Promise.allSettled(
      symbols.map(async s => {
        try { results.set(s, await this.getQuote(s)) } catch { /* skip */ }
      })
    )
    return results
  }
}

export const marketDataService = new MarketDataService()
