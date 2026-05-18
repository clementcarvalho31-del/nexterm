import type { CandleData, Timeframe } from '@/types'
import { TIMEFRAME_SECONDS } from './chartTheme'

// ─── Types matching lightweight-charts data format ────────────────────────────
export interface OHLCBar {
  time:  number  // Unix seconds
  open:  number
  high:  number
  low:   number
  close: number
  volume?: number
}

export interface VolumeBar {
  time:  number
  value: number
  color: string
}

export interface ChartHistoryData {
  candles: OHLCBar[]
  volume:  VolumeBar[]
}

// ─── Base prices per symbol ───────────────────────────────────────────────────
const BASE_PRICES: Record<string, number> = {
  'EUR/USD': 1.08432,
  'GBP/USD': 1.26815,
  'USD/JPY': 149.284,
  'AUD/USD': 0.64892,
  'NZD/USD': 0.59341,
  'USD/CAD': 1.36218,
  'USD/CHF': 0.89743,
  'EUR/GBP': 0.85541,
  'DXY':     104.320,
}

const VOLATILITY: Record<string, number> = {
  'EUR/USD': 0.0005,
  'GBP/USD': 0.0007,
  'USD/JPY': 0.08,
  'AUD/USD': 0.0006,
  'NZD/USD': 0.0006,
  'USD/CAD': 0.0006,
  'USD/CHF': 0.0005,
  'EUR/GBP': 0.0004,
  'DXY':     0.08,
}

// ─── Synthetic history generator ─────────────────────────────────────────────
// Produces realistic-looking OHLCV data with trend bias and mean-reversion
export function generateHistory(
  symbol: string,
  timeframe: Timeframe,
  barCount = 200,
): ChartHistoryData {
  const base    = BASE_PRICES[symbol] ?? 1.0
  const vol     = VOLATILITY[symbol]  ?? 0.0005
  const ivSec   = TIMEFRAME_SECONDS[timeframe] ?? 900
  const now     = Math.floor(Date.now() / 1000)
  const startTs = now - barCount * ivSec

  const candles: OHLCBar[] = []
  const volume:  VolumeBar[] = []

  let price = base * (0.990 + Math.random() * 0.020) // start slightly off base
  let trend = (Math.random() - 0.5) * 0.1            // gentle trending

  for (let i = 0; i < barCount; i++) {
    const t = startTs + i * ivSec

    // Mean reversion + trend
    const reversion = (base - price) * 0.003
    const trendNoise = (Math.random() - 0.5) * 0.3
    trend = trend * 0.95 + (reversion + trendNoise) * 0.05

    const openPrice = price
    const move      = (trend + (Math.random() - 0.5)) * vol
    const closePrice = Math.max(openPrice + move, base * 0.80)

    // Wicks: occasionally spike
    const wickMult = Math.random() < 0.1 ? 2.5 : 1.0
    const highPrice = Math.max(openPrice, closePrice) + Math.abs(move) * wickMult * Math.random()
    const lowPrice  = Math.min(openPrice, closePrice) - Math.abs(move) * wickMult * Math.random()

    const isUp   = closePrice >= openPrice
    const volVal = 800 + Math.random() * 4200

    const barVol = 800 + Math.random() * 4200
    candles.push({ time: t, open: openPrice, high: highPrice, low: lowPrice, close: closePrice, volume: barVol })
    volume.push({
      time:  t,
      value: barVol,
      color: isUp ? 'rgba(34,197,94,0.30)' : 'rgba(239,68,68,0.30)',
    })

    price = closePrice
  }

  return { candles, volume }
}

// ─── Convert WS TickData → candle update ─────────────────────────────────────
export function tickToCandle(
  price: number,
  bid: number,
  ask: number,
  timeframe: Timeframe,
  prevCandle?: OHLCBar,
): OHLCBar {
  const ivSec      = TIMEFRAME_SECONDS[timeframe] ?? 900
  const nowSec     = Math.floor(Date.now() / 1000)
  const candleTime = Math.floor(nowSec / ivSec) * ivSec

  if (prevCandle && prevCandle.time === candleTime) {
    return {
      time:  candleTime,
      open:  prevCandle.open,
      high:  Math.max(prevCandle.high, price, ask),
      low:   Math.min(prevCandle.low,  price, bid),
      close: price,
    }
  }

  // New candle
  return {
    time:  candleTime,
    open:  price,
    high:  Math.max(price, ask),
    low:   Math.min(price, bid),
    close: price,
  }
}

// ─── Normalize candle from websocket CandleData ───────────────────────────────
export function normalizeCandleData(d: CandleData): OHLCBar {
  return { time: d.time, open: d.open, high: d.high, low: d.low, close: d.close }
}

// ─── Compute support/resistance levels from history ───────────────────────────
export function computeKeyLevels(candles: OHLCBar[], lookback = 50) {
  if (candles.length < 10) return []
  const recent = candles.slice(-lookback)
  const highs  = recent.map(c => c.high)
  const lows   = recent.map(c => c.low)

  const resistance = Math.max(...highs)
  const support    = Math.min(...lows)
  const pivot      = (resistance + support + recent[recent.length - 1].close) / 3

  return [
    { price: resistance, type: 'resist' as const, label: 'R1' },
    { price: pivot,      type: 'pivot'  as const, label: 'PP' },
    { price: support,    type: 'support' as const, label: 'S1' },
  ]
}

// ─── Get decimal precision for a symbol ──────────────────────────────────────
export function getSymbolDecimals(symbol: string): number {
  if (symbol.includes('JPY')) return 3
  if (symbol === 'DXY')       return 3
  return 5
}

export function getSymbolPip(symbol: string): number {
  if (symbol.includes('JPY')) return 0.01
  if (symbol === 'DXY')       return 0.001
  return 0.0001
}
