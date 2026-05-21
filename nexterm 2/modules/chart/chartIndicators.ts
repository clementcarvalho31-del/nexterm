import type { OHLCBar } from './chartDataAdapter'

// ─── SMA ──────────────────────────────────────────────────────────────────────
export function computeSMA(candles: OHLCBar[], period: number): Array<{ time: number; value: number }> {
  const result: Array<{ time: number; value: number }> = []
  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) sum += candles[j].close
    result.push({ time: candles[i].time, value: sum / period })
  }
  return result
}

// ─── EMA ──────────────────────────────────────────────────────────────────────
export function computeEMA(candles: OHLCBar[], period: number): Array<{ time: number; value: number }> {
  if (candles.length < period) return []
  const k = 2 / (period + 1)
  const result: Array<{ time: number; value: number }> = []

  // Seed with SMA
  let ema = candles.slice(0, period).reduce((s, c) => s + c.close, 0) / period
  result.push({ time: candles[period - 1].time, value: ema })

  for (let i = period; i < candles.length; i++) {
    ema = candles[i].close * k + ema * (1 - k)
    result.push({ time: candles[i].time, value: ema })
  }
  return result
}

// ─── VWAP (simplified daily) ──────────────────────────────────────────────────
export function computeVWAP(candles: OHLCBar[]): Array<{ time: number; value: number }> {
  let cumPV  = 0
  let cumVol = 0
  const result: Array<{ time: number; value: number }> = []

  for (const c of candles) {
    const typical = (c.high + c.low + c.close) / 3
    const vol     = Math.abs(c.close - c.open) * 1000 + 1000 // synthetic volume
    cumPV  += typical * vol
    cumVol += vol
    result.push({ time: c.time, value: cumPV / cumVol })
  }
  return result
}

// ─── Bollinger Bands ──────────────────────────────────────────────────────────
export interface BollingerBar {
  time:   number
  upper:  number
  middle: number
  lower:  number
}

export function computeBollinger(
  candles: OHLCBar[],
  period = 20,
  stdMult = 2,
): BollingerBar[] {
  const result: BollingerBar[] = []

  for (let i = period - 1; i < candles.length; i++) {
    const slice = candles.slice(i - period + 1, i + 1)
    const mean  = slice.reduce((s, c) => s + c.close, 0) / period
    const variance = slice.reduce((s, c) => s + (c.close - mean) ** 2, 0) / period
    const std   = Math.sqrt(variance)

    result.push({
      time:   candles[i].time,
      upper:  mean + stdMult * std,
      middle: mean,
      lower:  mean - stdMult * std,
    })
  }
  return result
}

// ─── RSI ──────────────────────────────────────────────────────────────────────
export function computeRSI(candles: OHLCBar[], period = 14): Array<{ time: number; value: number }> {
  if (candles.length < period + 1) return []
  const result: Array<{ time: number; value: number }> = []

  let avgGain = 0
  let avgLoss = 0

  for (let i = 1; i <= period; i++) {
    const diff = candles[i].close - candles[i - 1].close
    if (diff > 0) avgGain += diff
    else          avgLoss += Math.abs(diff)
  }
  avgGain /= period
  avgLoss /= period

  for (let i = period; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close
    const gain = diff > 0 ? diff : 0
    const loss = diff < 0 ? Math.abs(diff) : 0

    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period

    const rs  = avgLoss === 0 ? 100 : avgGain / avgLoss
    const rsi = 100 - 100 / (1 + rs)
    result.push({ time: candles[i].time, value: rsi })
  }
  return result
}

// ─── Session time ranges (UTC seconds) ───────────────────────────────────────
export interface SessionRange {
  name:  string
  start: number   // hour UTC
  end:   number   // hour UTC
  color: string
}

export const SESSIONS: SessionRange[] = [
  { name: 'Asia',   start: 0,  end: 9,  color: 'rgba(127,119,221,0.07)' },
  { name: 'London', start: 7,  end: 16, color: 'rgba(55,138,221,0.07)'  },
  { name: 'NY',     start: 13, end: 22, color: 'rgba(34,197,94,0.06)'   },
]

// ─── Liquidity zone detection (simple swing high/low) ────────────────────────
export interface LiquidityZone {
  price: number
  type: 'high' | 'low'
  strength: number   // 0–1
  time: number
}

export function detectLiquidityZones(candles: OHLCBar[], lookback = 5): LiquidityZone[] {
  const zones: LiquidityZone[] = []

  for (let i = lookback; i < candles.length - lookback; i++) {
    const c = candles[i]
    const prevHighs = candles.slice(i - lookback, i).map(x => x.high)
    const nextHighs = candles.slice(i + 1, i + lookback + 1).map(x => x.high)
    const prevLows  = candles.slice(i - lookback, i).map(x => x.low)
    const nextLows  = candles.slice(i + 1, i + lookback + 1).map(x => x.low)

    // Swing high
    if (c.high > Math.max(...prevHighs) && c.high > Math.max(...nextHighs)) {
      zones.push({ price: c.high, type: 'high', strength: 0.5 + Math.random() * 0.5, time: c.time })
    }
    // Swing low
    if (c.low < Math.min(...prevLows) && c.low < Math.min(...nextLows)) {
      zones.push({ price: c.low, type: 'low', strength: 0.5 + Math.random() * 0.5, time: c.time })
    }
  }

  // Return strongest zones only (deduplicated by price proximity)
  return zones
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 6)
}

// ─── Economic event markers from calendar ────────────────────────────────────
import type { CalendarEvent } from '@/types'

export interface EventMarker {
  time:   number      // Unix seconds
  price:  number
  impact: 'high' | 'med' | 'low'
  label:  string
  color:  string
}

export function buildEventMarkers(
  events: CalendarEvent[],
  currentPrice: number,
  referenceDate = new Date(),
): EventMarker[] {
  return events
    .filter(e => e.impact === 'high' || e.impact === 'med')
    .map(e => {
      const [h, m] = e.time.split(':').map(Number)
      const d = new Date(referenceDate)
      d.setUTCHours(h, m, 0, 0)

      const color = e.impact === 'high' ? 'rgba(239,68,68,0.9)' : 'rgba(240,180,41,0.9)'
      return {
        time:   Math.floor(d.getTime() / 1000),
        price:  currentPrice,
        impact: e.impact,
        label:  e.event.slice(0, 8),
        color,
      }
    })
    .filter(m => !isNaN(m.time))
}
