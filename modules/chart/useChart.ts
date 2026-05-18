'use client'
import { useEffect, useRef, useCallback, useState } from 'react'
import type { IChartApi, ISeriesApi, SeriesType, Time } from 'lightweight-charts'
import type { Timeframe } from '@/types'
import type { OHLCBar, VolumeBar } from './chartDataAdapter'
import { generateHistory, computeKeyLevels, getSymbolDecimals } from './chartDataAdapter'
import { ChartWebsocketBridge } from './chartWebsocketBridge'
import { buildChartOptions, CANDLE_OPTIONS, VOLUME_OPTIONS, PRICE_LINE_PRESETS } from './chartTheme'
import { computeEMA, computeSMA, detectLiquidityZones } from './chartIndicators'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface UseChartOptions {
  symbol:       string
  timeframe:    Timeframe
  showVolume:   boolean
  showEMA20:    boolean
  showEMA50:    boolean
  showLevels:   boolean
  showSessions: boolean
}

export interface UseChartResult {
  containerRef: React.RefObject<HTMLDivElement | null>
  lastPrice:    number | null
  lastChange:   number | null
  isLoading:    boolean
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useChart(opts: UseChartOptions): UseChartResult {
  const containerRef  = useRef<HTMLDivElement>(null)

  // Chart API refs — not state (no rerender needed)
  const chartRef      = useRef<IChartApi | null>(null)
  const candleRef     = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeRef     = useRef<ISeriesApi<'Histogram'> | null>(null)
  const ema20Ref      = useRef<ISeriesApi<'Line'> | null>(null)
  const ema50Ref      = useRef<ISeriesApi<'Line'> | null>(null)
  const bridgeRef     = useRef<ChartWebsocketBridge | null>(null)
  const resizeRef     = useRef<ResizeObserver | null>(null)
  const historyRef    = useRef<OHLCBar[]>([])
  const priceLineRefs = useRef<ReturnType<ISeriesApi<SeriesType>['createPriceLine']>[]>([])

  const [lastPrice,  setLastPrice]  = useState<number | null>(null)
  const [lastChange, setLastChange] = useState<number | null>(null)
  const [isLoading,  setIsLoading]  = useState(true)

  // ── Candle / volume update callback (called from bridge flush) ───────────────
  const onChartUpdate = useCallback((candle: OHLCBar, vol: VolumeBar) => {
    if (!candleRef.current) return
    try {
      candleRef.current.update({ ...candle, time: candle.time as Time })
      volumeRef.current?.update({ ...vol,   time: vol.time   as Time })

      // Update history tail for indicator recalc
      const hist = historyRef.current
      if (hist.length && hist[hist.length - 1].time === candle.time) {
        hist[hist.length - 1] = candle
      } else {
        hist.push(candle)
      }
    } catch { /* ignore out-of-order ticks during TF switch */ }
  }, [])

  const onTickRaw = useCallback((tick: { price: number; changePct: number; change: number }) => {
    setLastPrice(tick.price)
    setLastChange(tick.changePct)
  }, [])

  // ── Initialize chart ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return

    let mounted = true
    setIsLoading(true)

    // Lazy import lightweight-charts (keeps bundle split clean)
    import('lightweight-charts').then(lc => {
      if (!mounted || !containerRef.current) return

      const { createChart, ColorType, CrosshairMode, CandlestickSeries, HistogramSeries, LineSeries } = lc

      // Create chart
      const chart = createChart(containerRef.current, buildChartOptions(ColorType, CrosshairMode))
      chartRef.current = chart

      // ── Candlestick series ──
      const candleSeries = chart.addSeries(CandlestickSeries, CANDLE_OPTIONS)
      candleRef.current = candleSeries

      // ── Volume series (separate scale) ──
      if (opts.showVolume) {
        const volSeries = chart.addSeries(HistogramSeries, {
          ...VOLUME_OPTIONS,
          priceScaleId: 'volume',
        })
        chart.priceScale('volume').applyOptions({
          scaleMargins: { top: 0.82, bottom: 0 },
          visible:      false,
        })
        volumeRef.current = volSeries
      }

      // ── Generate history ──
      const { candles, volume } = generateHistory(opts.symbol, opts.timeframe, 250)
      historyRef.current = [...candles]

      candleSeries.setData(candles.map(c => ({ ...c, time: c.time as Time })))
      volumeRef.current?.setData(volume.map(v => ({ ...v, time: v.time as Time })))

      // ── EMA overlays ──
      if (opts.showEMA20) {
        const ema20 = chart.addSeries(LineSeries, {
          color:            'rgba(240,180,41,0.7)',
          lineWidth:        1,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        })
        const ema20Data = computeEMA(candles, 20)
        ema20.setData(ema20Data.map(d => ({ time: d.time as Time, value: d.value })))
        ema20Ref.current = ema20
      }

      if (opts.showEMA50) {
        const ema50 = chart.addSeries(LineSeries, {
          color:            'rgba(55,138,221,0.7)',
          lineWidth:        1,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        })
        const ema50Data = computeEMA(candles, 50)
        ema50.setData(ema50Data.map(d => ({ time: d.time as Time, value: d.value })))
        ema50Ref.current = ema50
      }

      // ── Key levels (price lines) ──
      if (opts.showLevels) {
        const levels = computeKeyLevels(candles)
        priceLineRefs.current = levels.map(l => {
          const preset = PRICE_LINE_PRESETS[l.type as keyof typeof PRICE_LINE_PRESETS] ?? PRICE_LINE_PRESETS.pivot
          return candleSeries.createPriceLine({ ...preset, price: l.price, title: l.label })
        })
      }

      chart.timeScale().fitContent()

      // ── WS Bridge ──
      const bridge = new ChartWebsocketBridge({
        symbol:        opts.symbol,
        timeframe:     opts.timeframe,
        flushInterval: 250,           // flush chart at 4fps max — smooth but not wasteful
        onUpdate:      onChartUpdate,
        onTick:        onTickRaw as any,
      })
      bridgeRef.current = bridge

      // ── ResizeObserver ──
      const ro = new ResizeObserver(entries => {
        const { width, height } = entries[0].contentRect
        if (width > 0 && height > 0) chart.resize(width, height)
      })
      ro.observe(containerRef.current!)
      resizeRef.current = ro

      setIsLoading(false)
    })

    return () => {
      mounted = false
      bridgeRef.current?.destroy()
      resizeRef.current?.disconnect()
      chartRef.current?.remove()
      chartRef.current  = null
      candleRef.current = null
      volumeRef.current = null
      ema20Ref.current  = null
      ema50Ref.current  = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.symbol, opts.timeframe]) // Re-init on symbol/TF change

  // ── Update bridge timeframe without re-creating chart ──────────────────────
  // (already handled by deps above — re-init is the cleanest approach)

  return { containerRef, lastPrice, lastChange, isLoading }
}
