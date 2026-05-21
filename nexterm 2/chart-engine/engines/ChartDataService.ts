import type { KLineBar, Timeframe } from '../types'
import { TIMEFRAME_SECONDS } from '../types'
import { getWSManager } from '@/lib/websocket/WSManager'
import { useTerminalStore } from '@/store/terminal'
import type { TickData } from '@/types'

const BASE_PRICES: Record<string, number> = {
  'EUR/USD': 1.08432, 'GBP/USD': 1.26815, 'USD/JPY': 149.284,
  'AUD/USD': 0.64892, 'NZD/USD': 0.59341, 'USD/CAD': 1.36218,
  'USD/CHF': 0.89743, 'EUR/GBP': 0.85541, 'DXY': 104.320, 'GOLD': 2318.4,
}

const VOLATILITY: Record<string, number> = {
  'EUR/USD': 0.0005, 'GBP/USD': 0.0007, 'USD/JPY': 0.08,
  'AUD/USD': 0.0006, 'NZD/USD': 0.0006, 'USD/CAD': 0.0006,
  'USD/CHF': 0.0005, 'EUR/GBP': 0.0004, 'DXY': 0.05, 'GOLD': 0.8,
}

// ─── Generate realistic OHLCV history ────────────────────────────────────────
export function generateHistory(symbol: string, timeframe: Timeframe, count = 300): KLineBar[] {
  const base = BASE_PRICES[symbol] ?? 1.0
  const vol  = VOLATILITY[symbol]  ?? 0.0005
  const ivSec = TIMEFRAME_SECONDS[timeframe] ?? 900
  const now   = Math.floor(Date.now() / 1000)
  const startTs = now - count * ivSec

  const bars: KLineBar[] = []
  let price = base * (0.991 + Math.random() * 0.018)
  let trend = (Math.random() - 0.5) * 0.08

  for (let i = 0; i < count; i++) {
    const ts = startTs + i * ivSec
    const reversion = (base - price) * 0.004
    trend = trend * 0.95 + (reversion + (Math.random() - 0.5) * 0.3) * 0.05

    const open  = price
    const move  = (trend + (Math.random() - 0.5)) * vol
    const close = Math.max(open + move, base * 0.75)

    const wickMult = Math.random() < 0.08 ? 2.8 : 1.0
    const high  = Math.max(open, close) + Math.abs(move) * wickMult * Math.random()
    const low   = Math.min(open, close) - Math.abs(move) * wickMult * Math.random()

    bars.push({
      timestamp: ts * 1000,  // KlineCharts uses milliseconds
      open, high, low, close,
      volume: Math.floor(500 + Math.random() * 5000),
    })

    price = close
  }

  return bars
}

// ─── Tick → bar update ────────────────────────────────────────────────────────
export function tickToBar(
  tick: TickData,
  timeframe: Timeframe,
  prevBar?: KLineBar,
): KLineBar {
  const ivMs    = TIMEFRAME_SECONDS[timeframe] * 1000
  const now     = Date.now()
  const barTs   = Math.floor(now / ivMs) * ivMs

  if (prevBar && prevBar.timestamp === barTs) {
    return {
      timestamp: barTs,
      open:   prevBar.open,
      high:   Math.max(prevBar.high, tick.price, tick.ask),
      low:    Math.min(prevBar.low,  tick.price, tick.bid),
      close:  tick.price,
      volume: prevBar.volume + 10,
    }
  }

  return {
    timestamp: barTs,
    open:   tick.price,
    high:   Math.max(tick.price, tick.ask),
    low:    Math.min(tick.price, tick.bid),
    close:  tick.price,
    volume: 50,
  }
}

// ─── Realtime feed subscriber ─────────────────────────────────────────────────
export class ChartDataFeed {
  private symbol:      string
  private timeframe:   Timeframe
  private lastBar:     KLineBar | null = null
  private unsubscribe: (() => void) | null = null
  private onUpdate:    (bar: KLineBar) => void
  private flushTimer:  ReturnType<typeof setInterval> | null = null
  private dirty = false

  constructor(symbol: string, timeframe: Timeframe, onUpdate: (bar: KLineBar) => void) {
    this.symbol    = symbol
    this.timeframe = timeframe
    this.onUpdate  = onUpdate
  }

  start() {
    const ws = getWSManager()
    ws.subscribeSymbol(this.symbol)

    const off = ws.on<TickData>('tick', (msg) => {
      if (msg.symbol !== this.symbol || !msg.data) return
      const bar = tickToBar(msg.data, this.timeframe, this.lastBar ?? undefined)
      this.lastBar = bar
      this.dirty = true
    })

    this.unsubscribe = off

    // Flush to chart at 4fps (250ms) for smooth rendering without excessive redraws
    this.flushTimer = setInterval(() => {
      if (this.dirty && this.lastBar) {
        this.onUpdate(this.lastBar)
        this.dirty = false
      }
    }, 250)
  }

  stop() {
    this.unsubscribe?.()
    if (this.flushTimer) clearInterval(this.flushTimer)
  }

  setSymbol(symbol: string) {
    this.stop()
    this.symbol   = symbol
    this.lastBar  = null
    this.dirty    = false
    this.start()
  }

  setTimeframe(tf: Timeframe) {
    this.timeframe = tf
    this.lastBar   = null
    this.dirty     = false
  }
}
