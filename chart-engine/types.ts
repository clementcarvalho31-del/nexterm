// ─── Chart Engine ─────────────────────────────────────────────────────────────
export type ChartEngineType = 'tradingview' | 'klinecharts'

export type Timeframe = 'M1' | 'M5' | 'M15' | 'M30' | 'H1' | 'H2' | 'H4' | 'D1' | 'W1' | 'MN'

export const TIMEFRAME_SECONDS: Record<Timeframe, number> = {
  M1: 60, M5: 300, M15: 900, M30: 1800,
  H1: 3600, H2: 7200, H4: 14400,
  D1: 86400, W1: 604800, MN: 2592000,
}

export interface KLineBar {
  timestamp: number
  open:      number
  high:      number
  low:       number
  close:     number
  volume:    number
}

// ─── Chart Config ─────────────────────────────────────────────────────────────
export interface ChartConfig {
  instanceId:    string
  symbol:        string
  timeframe:     Timeframe
  engine:        ChartEngineType
  theme:         ChartThemeId
  showVolume:    boolean
  indicators:    IndicatorConfig[]
  drawings:      DrawingObject[]
  linked:        boolean        // sync with other charts
  linkedGroup:   string         // sync group id
}

// ─── Theme ────────────────────────────────────────────────────────────────────
export type ChartThemeId = 'dark-terminal' | 'dark-pro' | 'light-clean' | 'bloomberg'

export interface ChartTheme {
  id:             ChartThemeId
  name:           string
  bg:             string
  bgSecondary:    string
  grid:           string
  gridOpacity:    number
  text:           string
  textMuted:      string
  upColor:        string
  upBody:         string
  upWick:         string
  downColor:      string
  downBody:       string
  downWick:       string
  crosshair:      string
  crosshairLabel: string
  volumeUp:       string
  volumeDown:     string
  axisText:       string
  borderColor:    string
}

// ─── Indicators ───────────────────────────────────────────────────────────────
export type IndicatorId =
  | 'EMA' | 'SMA' | 'VWAP' | 'BOLL'
  | 'RSI' | 'MACD' | 'STOCH' | 'ATR'
  | 'VOL'

export interface IndicatorConfig {
  id:         string       // unique instance id
  type:       IndicatorId
  pane:       'main' | 'sub'  // overlay or separate pane
  params:     Record<string, number>
  color?:     string
  visible:    boolean
}

export const INDICATOR_DEFAULTS: Record<IndicatorId, Omit<IndicatorConfig, 'id'>> = {
  EMA:   { type:'EMA',   pane:'main', params:{ period:20 },                  visible:true },
  SMA:   { type:'SMA',   pane:'main', params:{ period:20 },                  visible:true },
  VWAP:  { type:'VWAP',  pane:'main', params:{},                             visible:true },
  BOLL:  { type:'BOLL',  pane:'main', params:{ period:20, stdDev:2 },        visible:true },
  RSI:   { type:'RSI',   pane:'sub',  params:{ period:14 },                  visible:true },
  MACD:  { type:'MACD',  pane:'sub',  params:{ short:12, long:26, signal:9 },visible:true },
  STOCH: { type:'STOCH', pane:'sub',  params:{ kPeriod:14, dPeriod:3 },      visible:true },
  ATR:   { type:'ATR',   pane:'sub',  params:{ period:14 },                  visible:true },
  VOL:   { type:'VOL',   pane:'sub',  params:{},                             visible:true },
}

// ─── Drawing Tools ─────────────────────────────────────────────────────────────
export type DrawingToolId =
  | 'cursor' | 'crosshair'
  | 'trendline' | 'ray' | 'infline'
  | 'hline' | 'vline' | 'hray'
  | 'rect' | 'circle' | 'triangle'
  | 'fibonacci' | 'fib_ext' | 'fib_fan' | 'pitchfork'
  | 'text' | 'callout'
  | 'longposition' | 'shortposition'
  | 'measure'

export interface DrawingObject {
  id:       string
  tool:     DrawingToolId
  points:   Array<{ time: number; price: number }>
  color?:   string
  text?:    string
  visible:  boolean
}

// ─── Sync ─────────────────────────────────────────────────────────────────────
export interface SyncEvent {
  type:     'symbol' | 'timeframe' | 'scroll' | 'zoom' | 'crosshair'
  source:   string    // instanceId
  group:    string
  payload:  unknown
}

// ─── Chart Templates ──────────────────────────────────────────────────────────
export interface ChartTemplate {
  id:         string
  name:       string
  createdAt:  number
  theme:      ChartThemeId
  indicators: Omit<IndicatorConfig, 'id'>[]
  showVolume: boolean
}

// ─── Multi-chart layout ───────────────────────────────────────────────────────
export type MultiChartLayoutId = '1' | '2h' | '2v' | '2+1' | '3h' | '4'

export interface MultiChartLayout {
  id:       MultiChartLayoutId
  label:    string
  icon:     string
  count:    number
  grid:     string   // CSS grid-template-columns
}

export const MULTI_CHART_LAYOUTS: MultiChartLayout[] = [
  { id:'1',   label:'Single',  icon:'▣',   count:1, grid:'1fr' },
  { id:'2h',  label:'2 Horiz',icon:'▣▣',  count:2, grid:'1fr 1fr' },
  { id:'2v',  label:'2 Vert', icon:'▤',   count:2, grid:'1fr' },
  { id:'2+1', label:'2+1',    icon:'▣▣▣', count:3, grid:'2fr 1fr' },
  { id:'3h',  label:'3 Horiz',icon:'▣▣▣', count:3, grid:'1fr 1fr 1fr' },
  { id:'4',   label:'4 Grid', icon:'⊞',   count:4, grid:'1fr 1fr' },
]

// ─── Engine adapter interface ──────────────────────────────────────────────────
export interface IChartEngine {
  init(container: HTMLElement, config: ChartConfig): void
  dispose(): void
  applyData(bars: KLineBar[]): void
  updateBar(bar: KLineBar): void
  setTheme(theme: ChartTheme): void
  setSymbol(symbol: string): void
  setTimeframe(tf: Timeframe): void
  addIndicator(indicator: IndicatorConfig): string | null
  removeIndicator(id: string): void
  resize(): void
  scrollToLatest(): void
  getScreenshot(): string
}
