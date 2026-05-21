import type { TickData, CandleData, Timeframe } from '@/types'

// ─── Normalized response types ───────────────────────────────────────────────
interface MarketQuote {
  symbol: string
  price: number
  bid: number
  ask: number
  change: number
  changePct: number
  ts: number
}

interface ProviderConfig {
  name: string
  baseUrl: string
  apiKey: string
  rateLimit: number // req/min
}

// ─── Rate limiter ─────────────────────────────────────────────────────────────
class RateLimiter {
  private tokens: number
  private maxTokens: number
  private refillRate: number // tokens per ms
  private lastRefill: number

  constructor(requestsPerMin: number) {
    this.maxTokens = requestsPerMin
    this.tokens = requestsPerMin
    this.refillRate = requestsPerMin / 60000
    this.lastRefill = Date.now()
  }

  async acquire(): Promise<void> {
    const now = Date.now()
    const elapsed = now - this.lastRefill
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate)
    this.lastRefill = now

    if (this.tokens >= 1) {
      this.tokens -= 1
      return
    }
    const wait = (1 - this.tokens) / this.refillRate
    await new Promise(r => setTimeout(r, wait))
    this.tokens = 0
  }
}

// ─── Simple cache ────────────────────────────────────────────────────────────
class TTLCache<T> {
  private store = new Map<string, { value: T; expires: number }>()

  set(key: string, value: T, ttlMs: number) {
    this.store.set(key, { value, expires: Date.now() + ttlMs })
  }

  get(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry) return null
    if (Date.now() > entry.expires) { this.store.delete(key); return null }
    return entry.value
  }
}

// ─── Provider implementations ─────────────────────────────────────────────────
async function fetchFinnhub(symbol: string, apiKey: string): Promise<MarketQuote> {
  const fhSymbol = symbol.replace('/', '') // EUR/USD → EURUSD
  const url = `https://finnhub.io/api/v1/quote?symbol=OANDA:${fhSymbol}&token=${apiKey}`
  const res = await fetch(url, { next: { revalidate: 0 } })
  if (!res.ok) throw new Error(`Finnhub ${res.status}`)
  const d = await res.json()
  return {
    symbol,
    price: d.c,
    bid: d.c - 0.00007,
    ask: d.c + 0.00007,
    change: d.d,
    changePct: d.dp,
    ts: d.t * 1000,
  }
}

async function fetchTwelveData(symbol: string, apiKey: string): Promise<MarketQuote> {
  const url = `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${apiKey}`
  const res = await fetch(url, { next: { revalidate: 0 } })
  if (!res.ok) throw new Error(`TwelveData ${res.status}`)
  const d = await res.json()
  if (d.code) throw new Error(d.message)
  const price = parseFloat(d.close)
  return {
    symbol,
    price,
    bid: parseFloat(d.low),
    ask: parseFloat(d.high),
    change: parseFloat(d.change),
    changePct: parseFloat(d.percent_change),
    ts: new Date(d.datetime).getTime(),
  }
}

// ─── Main market service ─────────────────────────────────────────────────────
class MarketDataService {
  private cache = new TTLCache<MarketQuote>()
  private rateLimiters = new Map<string, RateLimiter>()
  private readonly CACHE_TTL = 5000 // 5s

  private getLimiter(provider: string, rpm: number): RateLimiter {
    if (!this.rateLimiters.has(provider)) {
      this.rateLimiters.set(provider, new RateLimiter(rpm))
    }
    return this.rateLimiters.get(provider)!
  }

  async getQuote(symbol: string): Promise<MarketQuote> {
    const cached = this.cache.get(symbol)
    if (cached) return cached

    const providers = [
      { name: 'finnhub',    fn: () => fetchFinnhub(symbol,    process.env.FINNHUB_API_KEY ?? ''),    rpm: 60 },
      { name: 'twelvedata', fn: () => fetchTwelveData(symbol, process.env.TWELVEDATA_API_KEY ?? ''), rpm: 8 },
    ]

    for (const provider of providers) {
      try {
        await this.getLimiter(provider.name, provider.rpm).acquire()
        const quote = await provider.fn()
        this.cache.set(symbol, quote, this.CACHE_TTL)
        return quote
      } catch (err) {
        console.warn(`[MarketData] ${provider.name} failed for ${symbol}:`, err)
      }
    }

    // Fallback: return last cached (even if stale) or synthetic
    const stale = this.cache.get(`stale_${symbol}`)
    if (stale) return stale
    throw new Error(`All providers failed for ${symbol}`)
  }

  async getMultipleQuotes(symbols: string[]): Promise<Map<string, MarketQuote>> {
    const results = new Map<string, MarketQuote>()
    await Promise.allSettled(
      symbols.map(async sym => {
        try {
          results.set(sym, await this.getQuote(sym))
        } catch { /* skip failed */ }
      })
    )
    return results
  }

  toTickData(quote: MarketQuote): TickData {
    return {
      symbol:    quote.symbol,
      bid:       quote.bid,
      ask:       quote.ask,
      price:     quote.price,
      change:    quote.change,
      changePct: quote.changePct,
      ts:        quote.ts,
    }
  }
}

export const marketDataService = new MarketDataService()
