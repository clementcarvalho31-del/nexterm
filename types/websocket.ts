// ─── WebSocket Protocol ───────────────────────────────────────────────────────
export type WSMessageType =
  | 'subscribe'
  | 'unsubscribe'
  | 'tick'
  | 'candle'
  | 'news'
  | 'heartbeat'
  | 'error'
  | 'connected'
  | 'batch'

export interface WSMessage<T = unknown> {
  type: WSMessageType
  symbol?: string
  data?: T
  ts: number
}

export interface TickData {
  symbol: string
  bid: number
  ask: number
  price: number
  change: number
  changePct: number
  volume?: number
  ts: number
}

export interface CandleData {
  symbol: string
  timeframe: Timeframe
  open: number
  high: number
  low: number
  close: number
  volume: number
  time: number
}

export type Timeframe = 'M1' | 'M5' | 'M15' | 'H1' | 'H4' | 'D1'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface SubscriptionRequest {
  type: 'subscribe' | 'unsubscribe'
  symbols: string[]
  channel: 'ticks' | 'candles' | 'news'
}
