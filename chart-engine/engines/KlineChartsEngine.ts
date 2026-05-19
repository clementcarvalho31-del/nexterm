import type { IChartEngine, ChartConfig, ChartTheme, KLineBar, IndicatorConfig, Timeframe } from '../types'
import { themeToKlineStyles } from '../themes/chartThemes'

// Map our indicator types to KlineCharts names
const INDICATOR_MAP: Record<string, string> = {
  EMA:   'EMA',
  SMA:   'MA',
  VWAP:  'BOLL',   // KlineCharts doesn't have VWAP built-in, use BOLL as fallback
  BOLL:  'BOLL',
  RSI:   'RSI',
  MACD:  'MACD',
  STOCH: 'KDJ',
  ATR:   'ATR',
  VOL:   'VOL',
}

// Map our indicator types to KlineCharts params
function buildIndicatorParams(config: IndicatorConfig) {
  switch (config.type) {
    case 'EMA':   return { name: 'EMA',  calcParams: [config.params.period ?? 20] }
    case 'SMA':   return { name: 'MA',   calcParams: [config.params.period ?? 20] }
    case 'BOLL':  return { name: 'BOLL', calcParams: [config.params.period ?? 20, config.params.stdDev ?? 2] }
    case 'RSI':   return { name: 'RSI',  calcParams: [config.params.period ?? 14] }
    case 'MACD':  return { name: 'MACD', calcParams: [config.params.short ?? 12, config.params.long ?? 26, config.params.signal ?? 9] }
    case 'STOCH': return { name: 'KDJ',  calcParams: [config.params.kPeriod ?? 9, config.params.dPeriod ?? 3, 3] }
    case 'ATR':   return { name: 'ATR',  calcParams: [config.params.period ?? 14] }
    case 'VOL':   return { name: 'VOL',  calcParams: [] }
    default:      return { name: 'MA',   calcParams: [20] }
  }
}

export class KlineChartsEngine implements IChartEngine {
  private chart: any = null
  private container: HTMLElement | null = null
  private config: ChartConfig
  private indicatorPaneIds = new Map<string, string>()   // instanceId → paneId
  private resizeObserver: ResizeObserver | null = null

  constructor(config: ChartConfig) {
    this.config = config
  }

  async init(container: HTMLElement, config: ChartConfig) {
    this.container = container
    this.config = config

    // Dynamic import to avoid SSR
    const kc = await import('klinecharts')

    // Background color via container style
    container.style.background = '#0a0c0f'

    const chart = kc.init(container)

    if (!chart) throw new Error('KlineCharts init failed')
    this.chart = chart

    // Apply theme
    const { CHART_THEMES } = await import('../themes/chartThemes')
    const theme = CHART_THEMES[config.theme]
    chart.setStyles(themeToKlineStyles(theme) as any)

    // Set precision
    const dec = config.symbol.includes('JPY') || config.symbol === 'DXY' ? 3
              : config.symbol === 'GOLD' ? 2 : 5
    chart.setPriceVolumePrecision(dec, 0)

    // Enable zoom + scroll
    chart.setZoomEnabled(true)
    chart.setScrollEnabled(true)

    // Apply indicators from config
    for (const ind of config.indicators) {
      this._addIndicatorInternal(ind)
    }

    // ResizeObserver
    this.resizeObserver = new ResizeObserver(() => chart.resize())
    this.resizeObserver.observe(container)
  }

  dispose() {
    this.resizeObserver?.disconnect()
    if (this.chart && this.container) {
      import('klinecharts').then(kc => kc.dispose(this.container!))
    }
    this.chart = null
  }

  applyData(bars: KLineBar[]) {
    if (!this.chart) return
    const data = bars.map(b => ({
      timestamp: b.timestamp,
      open:      b.open,
      high:      b.high,
      low:       b.low,
      close:     b.close,
      volume:    b.volume,
    }))
    this.chart.applyNewData(data)
  }

  updateBar(bar: KLineBar) {
    if (!this.chart) return
    this.chart.updateData({
      timestamp: bar.timestamp,
      open:      bar.open,
      high:      bar.high,
      low:       bar.low,
      close:     bar.close,
      volume:    bar.volume,
    })
  }

  setTheme(theme: ChartTheme) {
    if (!this.chart) return
    this.chart.setStyles(themeToKlineStyles(theme) as any)
  }

  setSymbol(symbol: string) {
    this.config = { ...this.config, symbol }
    const dec = symbol.includes('JPY') || symbol === 'DXY' ? 3 : symbol === 'GOLD' ? 2 : 5
    this.chart?.setPriceVolumePrecision(dec, 0)
    this.chart?.clearData()
  }

  setTimeframe(tf: Timeframe) {
    this.config = { ...this.config, timeframe: tf }
    this.chart?.clearData()
  }

  addIndicator(config: IndicatorConfig): string | null {
    return this._addIndicatorInternal(config)
  }

  private _addIndicatorInternal(config: IndicatorConfig): string | null {
    if (!this.chart) return null
    const params = buildIndicatorParams(config)
    const paneId = config.pane === 'main' ? 'candle_pane' : undefined

    const newPaneId = this.chart.createIndicator(
      { name: params.name, calcParams: params.calcParams },
      config.pane === 'main',  // isStack
      paneId ? { id: paneId } : undefined,
    )

    if (newPaneId) {
      this.indicatorPaneIds.set(config.id, typeof newPaneId === 'string' ? newPaneId : 'candle_pane')
    }
    return newPaneId as string | null
  }

  removeIndicator(instanceId: string) {
    if (!this.chart) return
    const paneId = this.indicatorPaneIds.get(instanceId)
    if (paneId) {
      this.chart.removeIndicator(paneId)
      this.indicatorPaneIds.delete(instanceId)
    }
  }

  resize() {
    this.chart?.resize()
  }

  scrollToLatest() {
    this.chart?.scrollToRealTime(300)
  }

  getScreenshot(): string {
    if (!this.chart) return ''
    return this.chart.getConvertPictureUrl(true, 'png', this.config.theme === 'light-clean' ? '#fff' : '#0a0c0f')
  }

  // KlineCharts-specific: overlay drawing tools
  async addOverlay(overlayName: string) {
    if (!this.chart) return
    this.chart.createOverlay({ name: overlayName })
  }

  removeAllOverlays() {
    this.chart?.removeOverlay()
  }

  setOverlayMode(mode: 'normal' | 'weak_magnet' | 'strong_magnet') {
    // KlineCharts doesn't expose this directly — handled by overlay options
  }
}
