// ─── Market Data ────────────────────────────────────────────────────────────
export interface CurrencyPair {
  name: string
  price: number
  bid: number
  ask: number
  pip: number
  spread: number
  change: number
  changePct: number
}

export interface Candle {
  open: number
  high: number
  low: number
  close: number
  volume: number
  timestamp: number
}

export interface OrderBookLevel {
  price: number
  size: number
  total: number
  side: 'ask' | 'bid'
}

// ─── News ───────────────────────────────────────────────────────────────────
export type NewsImpact = 'high' | 'med' | 'low'

export interface NewsItem {
  id: string
  source: string
  time: string
  title: string
  tag: string
  impact: NewsImpact
  body?: string
}

// ─── Calendar ───────────────────────────────────────────────────────────────
export interface CalendarEvent {
  id: string
  time: string
  flag: string
  country: string
  event: string
  impact: NewsImpact
  previous: string
  forecast: string
  actual?: string
}

// ─── COT ────────────────────────────────────────────────────────────────────
export interface COTPosition {
  pair: string
  net: number
  max: number
  direction: 'up' | 'dn'
  change: string
}

export interface HedgeFundFlow {
  name: string
  pair: string
  direction: 'Long' | 'Short'
  size: string
  confidence: number
}

// ─── Sentiment ───────────────────────────────────────────────────────────────
export interface SentimentData {
  pair: string
  longPct: number
  shortPct: number
  source: string
}

// ─── Analysis ───────────────────────────────────────────────────────────────
export type BankBias = 'BUY' | 'SELL' | 'NEUTRAL'

export interface BankResearch {
  bank: string
  pair: string
  direction: BankBias
  view: string
  target?: string
  horizon?: string
}

export type DirectionalBias = 'Bullish' | 'Bearish' | 'Neutral'

export interface PairBias {
  pair: string
  direction: DirectionalBias
  confidence: number
}

export interface PropIndicator {
  name: string
  value: number
  max: number
  color: string
}

// ─── Worldbook ───────────────────────────────────────────────────────────────
export type CentralBankBias = 'Hawkish' | 'Neutral' | 'Dovish'

export interface CountryMacro {
  country: string
  name: string
  gdp: string
  cpi: string
  rate: string
  bias: CentralBankBias
  flag: string
}

// ─── News Trading ────────────────────────────────────────────────────────────
export interface NewsScenarioCase {
  label: string
  condition: string
  action: string
}

export interface NewsScenario {
  event: string
  date: string
  bull: NewsScenarioCase
  bear: NewsScenarioCase
  base: NewsScenarioCase
}

// ─── Sessions ────────────────────────────────────────────────────────────────
export type SessionName = 'ASIA' | 'LONDON' | 'NEW YORK'

export interface TradingSession {
  name: SessionName
  startUTC: number
  endUTC: number
  color: string
}

// ─── UI State ────────────────────────────────────────────────────────────────
export type TabId =
  | 'dashboard'
  | 'cot'
  | 'calendar'
  | 'newsplay'
  | 'seasonality'
  | 'worldbook'
  | 'liquidity'

export interface Tab {
  id: TabId
  label: string
}
