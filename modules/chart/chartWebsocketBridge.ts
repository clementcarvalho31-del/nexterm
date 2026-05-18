import { getWSManager } from '@/lib/websocket/WSManager'
import type { TickData } from '@/types'
import type { OHLCBar, VolumeBar } from './chartDataAdapter'
import { tickToCandle } from './chartDataAdapter'
import type { Timeframe } from '@/types'

// ─── Batched update queue ─────────────────────────────────────────────────────
// Collects ticks and flushes to chart at controlled intervals
// Prevents chart from re-rendering on every single tick (60+ fps cap)

type ChartUpdateCallback = (candle: OHLCBar, volume: VolumeBar) => void

interface BridgeOptions {
  symbol:        string
  timeframe:     Timeframe
  flushInterval: number   // ms between chart renders
  onUpdate:      ChartUpdateCallback
  onTick?:       (tick: TickData) => void  // raw tick (for price display)
}

export class ChartWebsocketBridge {
  private symbol:       string
  private timeframe:    Timeframe
  private onUpdate:     ChartUpdateCallback
  private onTick?:      (tick: TickData) => void
  private flushTimer:   ReturnType<typeof setInterval> | null = null
  private unsubscribe:  (() => void) | null = null
  private lastTick:     TickData | null = null
  private lastCandle:   OHLCBar | null = null
  private dirty = false

  constructor(opts: BridgeOptions) {
    this.symbol       = opts.symbol
    this.timeframe    = opts.timeframe
    this.onUpdate     = opts.onUpdate
    this.onTick       = opts.onTick

    // Start flush loop
    this.flushTimer = setInterval(() => this.flush(), opts.flushInterval)

    // Subscribe to WS ticks
    const ws = getWSManager()
    ws.subscribeSymbol(this.symbol)

    const off = ws.on<TickData>('tick', (msg) => {
      if (msg.symbol !== this.symbol || !msg.data) return
      this.handleTick(msg.data)
    })

    this.unsubscribe = () => {
      off()
    }
  }

  private handleTick(tick: TickData) {
    this.lastTick = tick
    this.onTick?.(tick)

    const candle = tickToCandle(tick.price, tick.bid, tick.ask, this.timeframe, this.lastCandle ?? undefined)

    // Only mark dirty if price actually moved
    if (!this.lastCandle || candle.close !== this.lastCandle.close || candle.time !== this.lastCandle.time) {
      this.lastCandle = candle
      this.dirty = true
    }
  }

  private flush() {
    if (!this.dirty || !this.lastCandle || !this.lastTick) return
    this.dirty = false

    const isUp = this.lastCandle.close >= this.lastCandle.open
    const volume: VolumeBar = {
      time:  this.lastCandle.time,
      value: 500 + Math.random() * 3500, // synthetic volume
      color: isUp ? 'rgba(34,197,94,0.30)' : 'rgba(239,68,68,0.30)',
    }

    this.onUpdate(this.lastCandle, volume)
  }

  updateTimeframe(tf: Timeframe) {
    this.timeframe = tf
    this.lastCandle = null
    this.dirty = false
  }

  getLastTick(): TickData | null {
    return this.lastTick
  }

  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
    this.unsubscribe?.()
  }
}
