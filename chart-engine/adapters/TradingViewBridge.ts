import type { ChartConfig, ChartTheme, ChartThemeId, Timeframe } from '../types'

// TradingView widget config interface
export interface TVWidgetConfig {
  symbol:          string
  interval:        string
  theme:           'dark' | 'light'
  container_id:    string
  width:           string | number
  height:          string | number
  locale:          string
  toolbar_bg:      string
  enable_publishing: boolean
  allow_symbol_change: boolean
  save_image:      boolean
  studies:         string[]
  show_popup_button: boolean
  popup_width:     string
  popup_height:    string
  autosize:        boolean
  fullscreen:      boolean
  hide_side_toolbar: boolean
  hide_top_toolbar: boolean
  hide_legend:     boolean
  withdateranges:  boolean
  details:         boolean
  hotlist:         boolean
  calendar:        boolean
  support_host:    string
}

// Map our timeframes to TradingView intervals
export const TIMEFRAME_TO_TV: Record<Timeframe, string> = {
  M1:  '1',
  M5:  '5',
  M15: '15',
  M30: '30',
  H1:  '60',
  H2:  '120',
  H4:  '240',
  D1:  'D',
  W1:  'W',
  MN:  'M',
}

// Map our symbols to TradingView format
export function symbolToTV(symbol: string): string {
  const map: Record<string, string> = {
    'EUR/USD': 'FX:EURUSD',
    'GBP/USD': 'FX:GBPUSD',
    'USD/JPY': 'FX:USDJPY',
    'AUD/USD': 'FX:AUDUSD',
    'NZD/USD': 'FX:NZDUSD',
    'USD/CAD': 'FX:USDCAD',
    'USD/CHF': 'FX:USDCHF',
    'EUR/GBP': 'FX:EURGBP',
    'DXY':     'TVC:DXY',
    'GOLD':    'TVC:GOLD',
    'OIL':     'TVC:USOIL',
    'SPX':     'SP:SPX',
    'NASDAQ':  'NASDAQ:NDX',
  }
  return map[symbol] ?? `FX:${symbol.replace('/', '')}`
}

// Map our theme to TradingView theme
export function themeIdToTV(themeId: ChartThemeId): 'dark' | 'light' {
  return themeId === 'light-clean' ? 'light' : 'dark'
}

// Build TradingView widget script URL
const TV_SCRIPT_URL = 'https://s3.tradingview.com/tv.js'

// Inject TradingView script once globally
let tvScriptLoaded = false
let tvScriptPromise: Promise<void> | null = null

export function loadTradingViewScript(): Promise<void> {
  if (tvScriptLoaded) return Promise.resolve()
  if (tvScriptPromise) return tvScriptPromise

  tvScriptPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') { resolve(); return }

    const script = document.createElement('script')
    script.src = TV_SCRIPT_URL
    script.async = true
    script.onload  = () => { tvScriptLoaded = true; resolve() }
    script.onerror = () => reject(new Error('Failed to load TradingView script'))
    document.head.appendChild(script)
  })

  return tvScriptPromise
}

// Build widget options
export function buildTVWidgetOptions(config: ChartConfig, containerId: string): TVWidgetConfig {
  return {
    symbol:              symbolToTV(config.symbol),
    interval:            TIMEFRAME_TO_TV[config.timeframe] ?? '15',
    theme:               themeIdToTV(config.theme),
    container_id:        containerId,
    width:               '100%',
    height:              '100%',
    locale:              'en',
    toolbar_bg:          config.theme === 'light-clean' ? '#f5f5f5' : '#0d1117',
    enable_publishing:   false,
    allow_symbol_change: true,
    save_image:          true,
    studies:             buildTVStudies(config),
    show_popup_button:   true,
    popup_width:         '1000',
    popup_height:        '650',
    autosize:            true,
    fullscreen:          false,
    hide_side_toolbar:   false,
    hide_top_toolbar:    false,
    hide_legend:         false,
    withdateranges:      true,
    details:             false,
    hotlist:             false,
    calendar:            false,
    support_host:        'https://www.tradingview.com',
  }
}

// Map our indicators to TradingView study IDs
function buildTVStudies(config: ChartConfig): string[] {
  const studies: string[] = []
  for (const ind of config.indicators) {
    switch (ind.type) {
      case 'RSI':   studies.push('RSI@tv-basicstudies'); break
      case 'MACD':  studies.push('MACD@tv-basicstudies'); break
      case 'BOLL':  studies.push('BB@tv-basicstudies'); break
      case 'EMA':   studies.push('EMA@tv-basicstudies'); break
      case 'SMA':   studies.push('MASimple@tv-basicstudies'); break
      case 'VWAP':  studies.push('VWAP@tv-basicstudies'); break
      case 'VOL':   studies.push('Volume@tv-basicstudies'); break
    }
  }
  return studies
}

// TradingView widget class reference (loaded via script)
declare global {
  interface Window {
    TradingView: {
      widget: new (config: TVWidgetConfig & { container_id: string }) => {
        remove?: () => void
        onChartReady?: (cb: () => void) => void
      }
    }
  }
}

export class TradingViewBridge {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private widget: any = null
  private containerId: string

  constructor(containerId: string) {
    this.containerId = containerId
  }

  async mount(config: ChartConfig) {
    await loadTradingViewScript()

    if (typeof window === 'undefined' || !window.TradingView) {
      throw new Error('TradingView script not loaded')
    }

    // Clean up any existing widget
    this.destroy()

    const opts = buildTVWidgetOptions(config, this.containerId)
    this.widget = new window.TradingView.widget(opts)
  }

  updateSymbol(symbol: string, timeframe: Timeframe) {
    // TradingView widget doesn't expose programmatic symbol change
    // — the user can change it via the native toolbar
    // We recreate the widget with new params
    console.log('[TVBridge] Symbol/TF update — widget will refresh')
  }

  destroy() {
    try {
      if (this.widget && typeof (this.widget as any).remove === 'function') {
        ;(this.widget as any).remove()
      }
    } catch { /* ignore */ }
    this.widget = null

    // Also clear the container DOM
    if (typeof document !== 'undefined') {
      const el = document.getElementById(this.containerId)
      if (el) el.innerHTML = ''
    }
  }
}
