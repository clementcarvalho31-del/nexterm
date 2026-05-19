// ─── Primitives ───────────────────────────────────────────────────────────────
export type Nullable<T> = T | null

// ─── Market ───────────────────────────────────────────────────────────────────
export interface TickData {
  symbol: string; bid: number; ask: number; price: number
  change: number; changePct: number; volume?: number; ts: number
}

export interface CurrencyPair {
  name: string; price: number; bid: number; ask: number
  pip: number; spread: number; change: number; changePct: number
}

export interface OHLCBar {
  timestamp: number; open: number; high: number; low: number; close: number; volume?: number
}

// ─── WebSocket ────────────────────────────────────────────────────────────────
export type WSMessageType = 'subscribe'|'unsubscribe'|'tick'|'candle'|'news'|'heartbeat'|'error'|'connected'|'batch'
export interface WSMessage<T = unknown> { type: WSMessageType; symbol?: string; data?: T; ts: number }
export type ConnectionStatus = 'connecting'|'connected'|'disconnected'|'error'

// ─── UI ───────────────────────────────────────────────────────────────────────
export type TabId = 'dashboard'|'cot'|'calendar'|'newsplay'|'seasonality'|'worldbook'|'liquidity'|'yields'|'flows'|'copilot'|'livefeed'|'trackrecord'
export interface Tab { id: TabId; label: string }

// ─── News ─────────────────────────────────────────────────────────────────────
export type NewsImpact = 'high'|'med'|'low'
export interface NewsItem { id: string; source: string; time: string; title: string; tag: string; impact: NewsImpact; body?: string }

// ─── Calendar ─────────────────────────────────────────────────────────────────
export interface CalendarEvent { id: string; time: string; flag: string; country: string; event: string; impact: NewsImpact; previous: string; forecast: string; actual?: string }

// ─── COT ─────────────────────────────────────────────────────────────────────
export interface COTPosition { pair: string; net: number; max: number; direction: 'up'|'dn'; change: string }

// ─── Auth ─────────────────────────────────────────────────────────────────────
export type UserRole = 'USER'|'PREMIUM'|'ADMIN'
export type SubscriptionStatus = 'TRIALING'|'ACTIVE'|'CANCELED'|'PAST_DUE'|'UNPAID'|'INCOMPLETE'
export interface TerminalUser {
  id: string; clerkId: string; email: string; name?: string; role: UserRole
  subscription?: { status: SubscriptionStatus; trialEndsAt?: string; currentPeriodEnd?: string }
}
export function hasAccess(user: TerminalUser | null): boolean {
  if (!user) return false
  if (user.role === 'ADMIN' || user.role === 'PREMIUM') return true
  const s = user.subscription
  if (s?.status === 'TRIALING' && s.trialEndsAt && new Date(s.trialEndsAt) > new Date()) return true
  return s?.status === 'ACTIVE'
}

// ─── Workspace ────────────────────────────────────────────────────────────────
export type PanelId = 'chart'|'news-feed'|'cot'|'calendar'|'newsplay'|'seasonality'|'worldbook'|'liquidity'|'yields'|'flows'|'copilot'|'session-prep'|'bank-research'|'sentiment'|'bias'|'macro-radar'|'order-book'
export interface GridPosition { x: number; y: number; w: number; h: number; minW?: number; minH?: number }
export interface PanelConfig { id: PanelId; title: string; position: GridPosition; visible: boolean; minimized: boolean }
export interface WorkspaceLayout { id: string; name: string; panels: PanelConfig[] }

// ─── Charts ───────────────────────────────────────────────────────────────────
export type Timeframe = 'M1'|'M5'|'M15'|'M30'|'H1'|'H2'|'H4'|'D1'|'W1'|'MN'
export type ChartEngineType = 'klinecharts'|'tradingview'
export type ChartThemeId = 'dark-terminal'|'dark-pro'|'light-clean'|'bloomberg'
export interface IndicatorConfig { id: string; type: string; pane: 'main'|'sub'; params: Record<string, number>; visible: boolean }
export interface ChartInstanceConfig {
  instanceId: string; symbol: string; timeframe: Timeframe; engine: ChartEngineType
  themeId: ChartThemeId; showVolume: boolean; indicators: IndicatorConfig[]; linked: boolean; linkedGroup: string
}

// ─── AI ───────────────────────────────────────────────────────────────────────
export interface ChatMessage { role: 'user'|'assistant'; content: string; ts: number }
