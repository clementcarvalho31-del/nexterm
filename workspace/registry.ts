import type { WidgetDefinition, WidgetId, LayoutPreset } from './types'

// ─── All available widgets ────────────────────────────────────────────────────
export const WIDGET_REGISTRY: Record<WidgetId, WidgetDefinition> = {
  'chart':         { id:'chart',         label:'Chart',           description:'TradingView-style price chart with indicators',   defaultW:6,  defaultH:10, minW:4, minH:6,  category:'chart',    icon:'📈' },
  'news-feed':     { id:'news-feed',     label:'News Feed',       description:'Real-time macro news with impact filtering',       defaultW:3,  defaultH:10, minW:2, minH:5,  category:'data',     icon:'📰' },
  'cot':           { id:'cot',           label:'COT',             description:'CFTC commitments of traders positioning',          defaultW:4,  defaultH:8,  minW:3, minH:5,  category:'analysis', icon:'📊' },
  'calendar':      { id:'calendar',      label:'Eco Calendar',    description:'Economic events with forecasts and actuals',       defaultW:5,  defaultH:7,  minW:3, minH:4,  category:'data',     icon:'📅' },
  'newsplay':      { id:'newsplay',      label:'Event Trades',    description:'Bull/bear/base scenarios for news events',         defaultW:5,  defaultH:9,  minW:3, minH:5,  category:'analysis', icon:'⚡' },
  'seasonality':   { id:'seasonality',   label:'Seasonality',     description:'10-year seasonal return heatmaps',                 defaultW:4,  defaultH:7,  minW:3, minH:5,  category:'analysis', icon:'🗓' },
  'worldbook':     { id:'worldbook',     label:'Worldbook',       description:'Macro dashboard by country',                       defaultW:6,  defaultH:7,  minW:4, minH:5,  category:'analysis', icon:'🌍' },
  'liquidity':     { id:'liquidity',     label:'Liquidity',       description:'Smart money & institutional flow tracker',         defaultW:4,  defaultH:7,  minW:3, minH:4,  category:'data',     icon:'💧' },
  'yields':        { id:'yields',        label:'Yields',          description:'Global yield curve and bond spreads',              defaultW:4,  defaultH:8,  minW:3, minH:5,  category:'data',     icon:'📉' },
  'flows':         { id:'flows',         label:'Flows',           description:'Options flow, dark pools, institutional orders',   defaultW:4,  defaultH:8,  minW:3, minH:4,  category:'data',     icon:'🌊' },
  'copilot':       { id:'copilot',       label:'AI Copilot',      description:'Context-aware FX terminal assistant',              defaultW:4,  defaultH:8,  minW:3, minH:5,  category:'ai',       icon:'🤖' },
  'session-prep':  { id:'session-prep',  label:'Session Prep',    description:'London/NY/Asia bias, levels, focus',               defaultW:3,  defaultH:7,  minW:2, minH:4,  category:'analysis', icon:'🕐' },
  'bank-research': { id:'bank-research', label:'Bank Research',   description:'Goldman, JPM, DB research notes and targets',      defaultW:3,  defaultH:7,  minW:2, minH:4,  category:'analysis', icon:'🏦' },
  'sentiment':     { id:'sentiment',     label:'DXM Sentiment',   description:'Retail sentiment contrarian signals',              defaultW:3,  defaultH:5,  minW:2, minH:3,  category:'data',     icon:'🎯' },
  'bias':          { id:'bias',          label:'Bias',            description:'Directional bias per pair with confidence',        defaultW:3,  defaultH:5,  minW:2, minH:3,  category:'analysis', icon:'🧭' },
  'macro-radar':   { id:'macro-radar',   label:'Macro Radar',     description:'DXY, Gold, Oil, VIX, yields at a glance',         defaultW:3,  defaultH:5,  minW:2, minH:3,  category:'data',     icon:'📡' },
  'order-book':    { id:'order-book',    label:'Order Book',      description:'Simulated depth of market',                        defaultW:3,  defaultH:8,  minW:2, minH:5,  category:'data',     icon:'📖' },
}

// ─── Layout presets ───────────────────────────────────────────────────────────
export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: 'focused-chart',
    name: 'Focused Chart',
    widgets: [
      { widgetId:'chart',       title:'EUR/USD', symbol:'EUR/USD', timeframe:'M15', x:0, y:0, w:9,  h:12, minW:4, minH:6,  visible:true, minimized:false, maximized:false, pinned:false, floating:false },
      { widgetId:'news-feed',   title:'News',    x:9, y:0, w:3,  h:12, minW:2, minH:5,  visible:true, minimized:false, maximized:false, pinned:false, floating:false },
    ],
  },
  {
    id: 'dual-chart',
    name: 'Dual Chart',
    widgets: [
      { widgetId:'chart',       title:'EUR/USD', symbol:'EUR/USD', timeframe:'H1',  x:0, y:0, w:6,  h:10, minW:4, minH:6,  visible:true, minimized:false, maximized:false, pinned:false, floating:false },
      { widgetId:'chart',       title:'GBP/USD', symbol:'GBP/USD', timeframe:'H1',  x:6, y:0, w:6,  h:10, minW:4, minH:6,  visible:true, minimized:false, maximized:false, pinned:false, floating:false },
      { widgetId:'calendar',    title:'Calendar',x:0, y:10,w:6,  h:6,  minW:3, minH:4,  visible:true, minimized:false, maximized:false, pinned:false, floating:false },
      { widgetId:'cot',         title:'COT',     x:6, y:10,w:6,  h:6,  minW:3, minH:4,  visible:true, minimized:false, maximized:false, pinned:false, floating:false },
    ],
  },
  {
    id: 'quad-chart',
    name: 'Quad Chart',
    widgets: [
      { widgetId:'chart', title:'EUR/USD', symbol:'EUR/USD', timeframe:'M15', x:0, y:0, w:6, h:8, minW:4, minH:6, visible:true, minimized:false, maximized:false, pinned:false, floating:false },
      { widgetId:'chart', title:'GBP/USD', symbol:'GBP/USD', timeframe:'M15', x:6, y:0, w:6, h:8, minW:4, minH:6, visible:true, minimized:false, maximized:false, pinned:false, floating:false },
      { widgetId:'chart', title:'USD/JPY', symbol:'USD/JPY', timeframe:'H1',  x:0, y:8, w:6, h:8, minW:4, minH:6, visible:true, minimized:false, maximized:false, pinned:false, floating:false },
      { widgetId:'chart', title:'DXY',     symbol:'DXY',     timeframe:'H1',  x:6, y:8, w:6, h:8, minW:4, minH:6, visible:true, minimized:false, maximized:false, pinned:false, floating:false },
    ],
  },
  {
    id: 'news-trading',
    name: 'News Trading',
    widgets: [
      { widgetId:'chart',      title:'EUR/USD', symbol:'EUR/USD', timeframe:'M5', x:0, y:0, w:6,  h:10, minW:4, minH:6,  visible:true, minimized:false, maximized:false, pinned:false, floating:false },
      { widgetId:'news-feed',  title:'News',    x:6, y:0, w:3,  h:10, minW:2, minH:5,  visible:true, minimized:false, maximized:false, pinned:false, floating:false },
      { widgetId:'newsplay',   title:'Scenarios',x:9, y:0, w:3, h:10, minW:3, minH:5,  visible:true, minimized:false, maximized:false, pinned:false, floating:false },
      { widgetId:'calendar',   title:'Calendar', x:0, y:10,w:6, h:6,  minW:3, minH:4,  visible:true, minimized:false, maximized:false, pinned:false, floating:false },
      { widgetId:'copilot',    title:'AI',       x:6, y:10,w:6, h:6,  minW:3, minH:4,  visible:true, minimized:false, maximized:false, pinned:false, floating:false },
    ],
  },
  {
    id: 'macro-analysis',
    name: 'Macro Analysis',
    widgets: [
      { widgetId:'chart',        title:'EUR/USD', symbol:'EUR/USD', timeframe:'D1', x:0, y:0, w:6, h:9,  minW:4, minH:6, visible:true, minimized:false, maximized:false, pinned:false, floating:false },
      { widgetId:'worldbook',    title:'Worldbook',  x:6, y:0, w:6, h:9,  minW:4, minH:5, visible:true, minimized:false, maximized:false, pinned:false, floating:false },
      { widgetId:'cot',          title:'COT',        x:0, y:9, w:4, h:7,  minW:3, minH:4, visible:true, minimized:false, maximized:false, pinned:false, floating:false },
      { widgetId:'yields',       title:'Yields',     x:4, y:9, w:4, h:7,  minW:3, minH:4, visible:true, minimized:false, maximized:false, pinned:false, floating:false },
      { widgetId:'seasonality',  title:'Seasonality',x:8, y:9, w:4, h:7,  minW:3, minH:4, visible:true, minimized:false, maximized:false, pinned:false, floating:false },
    ],
  },
]

// ─── Default layout ───────────────────────────────────────────────────────────
export const DEFAULT_LAYOUT: LayoutPreset = LAYOUT_PRESETS[0]

// ─── Hotkeys ──────────────────────────────────────────────────────────────────
export const HOTKEYS = [
  { key: 'Cmd+K',      description: 'Command palette',           action: 'command-palette' },
  { key: 'Cmd+\\',    description: 'Toggle sidebar',             action: 'toggle-sidebar' },
  { key: 'Cmd+F',      description: 'Fullscreen chart',          action: 'fullscreen-chart' },
  { key: 'Cmd+1..5',   description: 'Load layout preset',        action: 'load-preset' },
  { key: 'Cmd+S',      description: 'Save current layout',       action: 'save-layout' },
  { key: 'Cmd+Z',      description: 'Reset to default layout',   action: 'reset-layout' },
  { key: 'Cmd+N',      description: 'Add new widget',            action: 'add-widget' },
  { key: 'Alt+1',      description: 'M1 timeframe',              action: 'tf-m1' },
  { key: 'Alt+5',      description: 'M5 timeframe',              action: 'tf-m5' },
  { key: 'Alt+F',      description: 'M15 timeframe',             action: 'tf-m15' },
  { key: 'Alt+H',      description: 'H1 timeframe',              action: 'tf-h1' },
  { key: 'Alt+4',      description: 'H4 timeframe',              action: 'tf-h4' },
  { key: 'Alt+D',      description: 'D1 timeframe',              action: 'tf-d1' },
]
