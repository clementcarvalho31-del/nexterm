// ─── Environment ─────────────────────────────────────────────────────────────
export const ENV = {
  WS_URL:           process.env.NEXT_PUBLIC_WS_URL     ?? 'ws://localhost:3001/ws',
  APP_URL:          process.env.NEXT_PUBLIC_APP_URL    ?? 'http://localhost:3000',
  ANTHROPIC_KEY:    process.env.ANTHROPIC_API_KEY      ?? '',
  FINNHUB_KEY:      process.env.FINNHUB_API_KEY        ?? '',
  TWELVEDATA_KEY:   process.env.TWELVEDATA_API_KEY     ?? '',
  STRIPE_KEY:       process.env.STRIPE_SECRET_KEY      ?? '',
  STRIPE_PRICE_ID:  process.env.STRIPE_PRICE_ID        ?? '',
  STRIPE_WEBHOOK:   process.env.STRIPE_WEBHOOK_SECRET  ?? '',
  CLERK_SECRET:     process.env.CLERK_SECRET_KEY       ?? '',
} as const

// ─── Market constants ─────────────────────────────────────────────────────────
export const SUPPORTED_SYMBOLS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD',
  'NZD/USD', 'USD/CAD', 'USD/CHF', 'EUR/GBP',
  'DXY', 'GOLD',
] as const

export type SupportedSymbol = typeof SUPPORTED_SYMBOLS[number]

export const SYMBOL_DECIMALS: Record<string, number> = {
  'USD/JPY': 3, 'DXY': 3, 'GOLD': 2,
}

export const SYMBOL_PIPS: Record<string, number> = {
  'USD/JPY': 0.01, 'DXY': 0.001, 'GOLD': 0.1,
}

export function getDecimals(symbol: string): number {
  return SYMBOL_DECIMALS[symbol] ?? 5
}

export function getPip(symbol: string): number {
  return SYMBOL_PIPS[symbol] ?? 0.0001
}

// ─── Timeframe constants ──────────────────────────────────────────────────────
export const TIMEFRAME_SECONDS: Record<string, number> = {
  M1: 60, M5: 300, M15: 900, M30: 1800,
  H1: 3600, H2: 7200, H4: 14400,
  D1: 86400, W1: 604800, MN: 2592000,
}

// ─── Cache TTLs ───────────────────────────────────────────────────────────────
export const CACHE_TTL = {
  TICK:     5_000,
  HISTORY:  60_000,
  CALENDAR: 300_000,
  NEWS:     30_000,
} as const

// ─── UI constants ─────────────────────────────────────────────────────────────
export const WS_FLUSH_INTERVAL_MS = 250
export const CLOCK_INTERVAL_MS    = 1_000
export const CHART_HISTORY_BARS   = 350
