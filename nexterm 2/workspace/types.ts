// ─── Widget IDs ──────────────────────────────────────────────────────────────
export type WidgetId =
  | 'chart'
  | 'news-feed'
  | 'cot'
  | 'calendar'
  | 'newsplay'
  | 'seasonality'
  | 'worldbook'
  | 'liquidity'
  | 'yields'
  | 'flows'
  | 'copilot'
  | 'session-prep'
  | 'bank-research'
  | 'sentiment'
  | 'bias'
  | 'macro-radar'
  | 'order-book'

// ─── Widget instance (one per panel on screen) ────────────────────────────────
export interface WidgetInstance {
  instanceId: string          // unique per panel (uuid)
  widgetId:   WidgetId        // which widget type
  title:      string
  symbol?:    string          // for chart widgets
  timeframe?: string          // for chart widgets

  // Grid layout
  x: number
  y: number
  w: number
  h: number
  minW: number
  minH: number

  // State
  visible:    boolean
  minimized:  boolean
  maximized:  boolean
  pinned:     boolean         // cannot be moved/resized when pinned
  floating:   boolean         // detached from grid, free-floating
  floatX?:    number
  floatY?:    number
  floatW?:    number
  floatH?:    number
}

// ─── Saved layout ─────────────────────────────────────────────────────────────
export interface SavedLayout {
  id:        string
  name:      string
  createdAt: number
  widgets:   WidgetInstance[]
  cols:      number
  rowHeight: number
}

// ─── Chart layout modes ───────────────────────────────────────────────────────
export type ChartLayoutMode = '1' | '2h' | '2v' | '3' | '4' | '2+1'

export interface ChartConfig {
  symbol:      string
  timeframe:   string
  indicators:  string[]
  showVolume:  boolean
  showEMA20:   boolean
  showEMA50:   boolean
  showEMA200:  boolean
  showBB:      boolean
  showVWAP:    boolean
  showLevels:  boolean
  theme:       'dark' | 'light'
}

// ─── Widget registry entry ────────────────────────────────────────────────────
export interface WidgetDefinition {
  id:          WidgetId
  label:       string
  description: string
  defaultW:    number
  defaultH:    number
  minW:        number
  minH:        number
  category:    'chart' | 'data' | 'analysis' | 'ai'
  icon:        string
}

// ─── Preset layouts ───────────────────────────────────────────────────────────
export interface LayoutPreset {
  id:      string
  name:    string
  widgets: Omit<WidgetInstance, 'instanceId'>[]
}

// ─── Hotkeys ─────────────────────────────────────────────────────────────────
export interface HotkeyAction {
  key:         string
  description: string
  action:      string
}
