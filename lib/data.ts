import type {
  CurrencyPair, NewsItem, CalendarEvent, COTPosition, HedgeFundFlow,
  SentimentData, BankResearch, PairBias, PropIndicator, CountryMacro,
  NewsScenario, TradingSession, Tab, YieldItem, YieldSpread, YieldCurvePoint,
  InstitutionalFlow, OptionsFlow, DarkPoolPrint, MacroAsset, Correlation,
  SessionPrepData,
} from '@/types'

export const PAIRS: CurrencyPair[] = [
  { name: 'EUR/USD', price: 1.08432, bid: 1.08418, ask: 1.08446, pip: 0.0001, spread: 0.00014, change: 0.00023,  changePct:  0.21 },
  { name: 'GBP/USD', price: 1.26815, bid: 1.26797, ask: 1.26833, pip: 0.0001, spread: 0.00018, change: -0.00142, changePct: -0.11 },
  { name: 'USD/JPY', price: 149.284, bid: 149.272, ask: 149.296, pip: 0.01,   spread: 0.012,   change: 0.432,    changePct:  0.29  },
  { name: 'AUD/USD', price: 0.64892, bid: 0.64875, ask: 0.64909, pip: 0.0001, spread: 0.00017, change: -0.00089, changePct: -0.14 },
  { name: 'NZD/USD', price: 0.59341, bid: 0.59321, ask: 0.59361, pip: 0.0001, spread: 0.00020, change: 0.00051,  changePct:  0.09 },
  { name: 'USD/CAD', price: 1.36218, bid: 1.36200, ask: 1.36236, pip: 0.0001, spread: 0.00018, change: -0.00103, changePct: -0.08  },
  { name: 'USD/CHF', price: 0.89743, bid: 0.89727, ask: 0.89759, pip: 0.0001, spread: 0.00016, change: 0.00072,  changePct:  0.08  },
  { name: 'EUR/GBP', price: 0.85541, bid: 0.85526, ask: 0.85556, pip: 0.0001, spread: 0.00015, change: 0.00034,  changePct:  0.04 },
  { name: 'DXY',     price: 104.320, bid: 104.317, ask: 104.323, pip: 0.001,  spread: 0.003,   change: 0.042,    changePct:  0.04 },
  { name: 'GOLD',    price: 2318.40, bid: 2318.10, ask: 2318.70, pip: 0.1,    spread: 0.3,     change: 12.4,     changePct:  0.54 },
]

export const NEWS_FEED: NewsItem[] = [
  { id: 'n1',  source: 'Reuters',    time: '08:42', impact: 'high', tag: 'FED',  title: 'Fed Williams: inflation still too high — no cuts before Q3 confirmed' },
  { id: 'n2',  source: 'Bloomberg',  time: '08:31', impact: 'high', tag: 'ECB',  title: 'ECB Lagarde: June cut possible if data confirms — EUR/USD sold to 1.0840' },
  { id: 'n3',  source: 'Newsquawk', time: '08:19', impact: 'high', tag: 'NFP',  title: 'NFP Preview: Consensus 175K, whisper 185K — USD vulnerable on miss' },
  { id: 'n4',  source: 'FXStreet',  time: '08:05', impact: 'med',  tag: 'GBP',  title: 'GBP/USD holds 1.2680 — UK CPI beat supports hawkish BoE pricing' },
  { id: 'n5',  source: 'Reuters',    time: '07:58', impact: 'med',  tag: 'CNH',  title: 'PBoC keeps LPR unchanged at 3.45% — no stimulus signal, CNH stable' },
  { id: 'n6',  source: 'Bloomberg',  time: '07:44', impact: 'high', tag: 'GOLD', title: 'Gold breaks $2320 — geopolitical bid + real yields falling, CB accumulation' },
  { id: 'n7',  source: 'Reuters',    time: '07:30', impact: 'med',  tag: 'JPY',  title: 'BoJ minutes: heated debate on pace of normalisation — JPY bid on intervention risk' },
  { id: 'n8',  source: 'FT',         time: '07:12', impact: 'low',  tag: 'EUR',  title: 'Eurozone PMI composite 52.3 beats — expansion accelerates in services' },
  { id: 'n9',  source: 'BBG',        time: '06:55', impact: 'high', tag: 'CPI',  title: 'US CPI Preview: Core 3.4% exp — hot print risks 50bp delay in cuts' },
  { id: 'n10', source: 'Reuters',    time: '06:30', impact: 'med',  tag: 'OIL',  title: 'WTI holds $78 — OPEC+ compliance high, summer demand optimism' },
  { id: 'n11', source: 'Newsquawk', time: '06:10', impact: 'high', tag: 'FOMC', title: 'FOMC Minutes: "Several" members question cut timing — hawkish tone' },
  { id: 'n12', source: 'BBG',        time: '05:45', impact: 'med',  tag: 'CHF',  title: 'SNB: Not ruling out further FX interventions on CHF excessive strength' },
]

export const CALENDAR_EVENTS: CalendarEvent[] = [
  { id: 'c1', time: '08:30', flag: '🇬🇧', country: 'GBR', event: 'UK CPI m/m',              impact: 'high', previous: '0.5%',  forecast: '0.2%',  actual: '' },
  { id: 'c2', time: '10:00', flag: '🇪🇺', country: 'EUR', event: 'EZ Unemployment Rate',    impact: 'med',  previous: '6.5%',  forecast: '6.5%',  actual: '6.5%' },
  { id: 'c3', time: '12:30', flag: '🇺🇸', country: 'USD', event: 'Initial Jobless Claims',  impact: 'med',  previous: '215K',  forecast: '212K',  actual: '' },
  { id: 'c4', time: '14:30', flag: '🇺🇸', country: 'USD', event: 'NFP',                     impact: 'high', previous: '151K',  forecast: '175K',  actual: '' },
  { id: 'c5', time: '14:30', flag: '🇺🇸', country: 'USD', event: 'Unemployment Rate',       impact: 'high', previous: '4.1%',  forecast: '4.0%',  actual: '' },
  { id: 'c6', time: '14:30', flag: '🇺🇸', country: 'USD', event: 'Avg Hourly Earnings',     impact: 'high', previous: '0.3%',  forecast: '0.3%',  actual: '' },
  { id: 'c7', time: '16:00', flag: '🇺🇸', country: 'USD', event: 'Michigan Sentiment',      impact: 'med',  previous: '57.0',  forecast: '59.0',  actual: '' },
]

export const COT_DATA: COTPosition[] = [
  { pair: 'EUR/USD', net:  24300, max: 80000, direction: 'up', change: '+3.2K' },
  { pair: 'GBP/USD', net:  18700, max: 80000, direction: 'up', change: '+1.1K' },
  { pair: 'USD/JPY', net: -62400, max: 80000, direction: 'dn', change: '-4.8K' },
  { pair: 'AUD/USD', net:  -8200, max: 80000, direction: 'dn', change: '-0.9K' },
  { pair: 'NZD/USD', net:   4100, max: 80000, direction: 'up', change: '+0.3K' },
  { pair: 'USD/CAD', net: -15300, max: 80000, direction: 'dn', change: '-2.1K' },
]

export const HEDGE_FUND_FLOWS: HedgeFundFlow[] = [
  { name: 'Brevan Howard', pair: 'EUR/USD', direction: 'Long',  size: '$2.4B', confidence: 78 },
  { name: 'Bridgewater',   pair: 'USD/JPY', direction: 'Short', size: '$3.1B', confidence: 85 },
  { name: 'Tudor Jones',   pair: 'GBP/USD', direction: 'Long',  size: '$900M', confidence: 62 },
  { name: 'Soros Fund',    pair: 'AUD/USD', direction: 'Short', size: '$450M', confidence: 55 },
]

export const SENTIMENT_DATA: SentimentData[] = [
  { pair: 'EUR/USD', longPct: 66, shortPct: 34, source: 'IG + OANDA' },
  { pair: 'GBP/USD', longPct: 72, shortPct: 28, source: 'IG + OANDA' },
  { pair: 'USD/JPY', longPct: 29, shortPct: 71, source: 'IG + OANDA' },
  { pair: 'AUD/USD', longPct: 45, shortPct: 55, source: 'Myfxbook'   },
  { pair: 'GOLD',    longPct: 71, shortPct: 29, source: 'IG + OANDA' },
]

export const BANK_RESEARCH: BankResearch[] = [
  { bank: 'Goldman Sachs',  pair: 'EUR/USD', direction: 'BUY',     view: 'Target 1.10 by Q3 — ECB-Fed divergence play', target: '1.1000', horizon: 'Q3 2024' },
  { bank: 'JPMorgan',       pair: 'USD/JPY', direction: 'SELL',    view: 'BoJ hike risk H2 — JPY undervalued 15%',        target: '142.00', horizon: 'H2 2024' },
  { bank: 'Deutsche Bank',  pair: 'GBP/USD', direction: 'BUY',     view: 'UK CPI stickiness — BoE last to cut rates',    target: '1.2900', horizon: 'Q2 2024' },
  { bank: 'Citi',           pair: 'AUD/USD', direction: 'SELL',    view: 'China slowdown risk, commodity headwinds',      target: '0.6300', horizon: 'Q3 2024' },
  { bank: 'BofA',           pair: 'EUR/USD', direction: 'NEUTRAL', view: 'Range 1.05–1.10 until Fed June clarity' },
  { bank: 'Morgan Stanley', pair: 'GOLD',    direction: 'BUY',     view: 'Target $2500 — CB accumulation + real yields', target: '2500',   horizon: 'Q4 2024' },
]

export const PAIR_BIASES: PairBias[] = [
  { pair: 'EUR/USD', direction: 'Bullish', confidence: 72 },
  { pair: 'GBP/USD', direction: 'Bullish', confidence: 65 },
  { pair: 'USD/JPY', direction: 'Bearish', confidence: 80 },
  { pair: 'AUD/USD', direction: 'Neutral', confidence: 48 },
  { pair: 'GOLD',    direction: 'Bullish', confidence: 78 },
  { pair: 'DXY',     direction: 'Bearish', confidence: 62 },
]

export const PROP_INDICATORS: PropIndicator[] = [
  { name: 'USD Strength Index', value: 67, max: 100, color: '#ef4444'  },
  { name: 'Risk Appetite',      value: 44, max: 100, color: '#f0b429' },
  { name: 'Carry Trade Signal', value: 72, max: 100, color: '#22c55e' },
  { name: 'EUR Trend Momentum', value: 58, max: 100, color: '#378add' },
  { name: 'Volatility Regime',  value: 31, max: 100, color: '#7f77dd' },
  { name: 'Gold Momentum',      value: 78, max: 100, color: '#f0b429' },
]

export const WORLDBOOK: CountryMacro[] = [
  { country: 'USA', flag: '🇺🇸', name: 'United States', gdp: '+2.8%', cpi: '3.4%', rate: '5.25%', bias: 'Neutral',  note: 'Data-dep.' },
  { country: 'EUR', flag: '🇪🇺', name: 'Eurozone',       gdp: '+0.4%', cpi: '2.6%', rate: '4.50%', bias: 'Dovish',   note: 'Jun cut?' },
  { country: 'GBR', flag: '🇬🇧', name: 'United Kingdom', gdp: '+0.1%', cpi: '3.2%', rate: '5.25%', bias: 'Neutral',  note: 'Late cut' },
  { country: 'JPN', flag: '🇯🇵', name: 'Japan',           gdp: '+0.1%', cpi: '2.7%', rate: '-0.10%',bias: 'Hawkish',  note: 'Hike risk' },
  { country: 'AUS', flag: '🇦🇺', name: 'Australia',       gdp: '+1.5%', cpi: '3.6%', rate: '4.35%', bias: 'Neutral',  note: 'On hold' },
  { country: 'CAD', flag: '🇨🇦', name: 'Canada',          gdp: '+1.2%', cpi: '2.9%', rate: '5.00%', bias: 'Dovish',   note: 'Jun cut' },
  { country: 'CHN', flag: '🇨🇳', name: 'China',           gdp: '+5.1%', cpi: '0.3%', rate: '3.45%', bias: 'Easing',   note: 'PBOC ease' },
  { country: 'CHE', flag: '🇨🇭', name: 'Switzerland',     gdp: '+1.1%', cpi: '1.4%', rate: '1.50%', bias: 'Neutral',  note: 'Cut done' },
]

export const NEWS_SCENARIOS: NewsScenario[] = [
  {
    event: 'NFP — Non-Farm Payrolls', date: '14:30 UTC TODAY',
    assetImpact: { DXY: 'HIGH', 'EUR/USD': 'HIGH', GOLD: 'MED', SPX: 'MED' },
    bull: { label: 'BULL USD', condition: '>200K + wages ≥0.4%',     action: 'Sell EUR/USD • Short Gold • Long DXY', pairDirection: 'USD↑' },
    bear: { label: 'BEAR USD', condition: '<150K + wages ≤0.2%',     action: 'Buy EUR/USD • Long Gold • Short DXY',  pairDirection: 'USD↓' },
    base: { label: 'IN-LINE',  condition: '150-200K, wages 0.3%',    action: 'Fade initial spike • Watch DXY 104',   pairDirection: 'NEUT' },
  },
  {
    event: 'FOMC Rate Decision', date: '29 May 18:00 UTC',
    assetImpact: { DXY: 'HIGH', 'EUR/USD': 'HIGH', GOLD: 'HIGH', SPX: 'HIGH' },
    bull: { label: 'DOVISH',   condition: 'Cut signal + soft dots',   action: 'Buy EUR/USD • Long Gold • Short DXY',  pairDirection: 'USD↓' },
    bear: { label: 'HAWKISH',  condition: 'Higher for longer +75bp',  action: 'Long USD • Short Gold • Short SPX',    pairDirection: 'USD↑' },
    base: { label: 'NEUTRAL',  condition: 'Pause, data-dependent',    action: 'Watch Powell Q&A • Fade knee-jerk',    pairDirection: 'WAIT' },
  },
  {
    event: 'US CPI', date: '15 May 14:30 UTC',
    assetImpact: { DXY: 'HIGH', 'EUR/USD': 'HIGH', GOLD: 'MED', SPX: 'MED' },
    bull: { label: 'COOL CPI', condition: 'Core <3.2% YoY',           action: 'EUR/USD long • Gold long • Sell DXY', pairDirection: 'USD↓' },
    bear: { label: 'HOT CPI',  condition: 'Core >3.6% YoY',           action: 'DXY long • Short EUR/USD • Short XAU', pairDirection: 'USD↑' },
    base: { label: 'IN-LINE',  condition: '3.4% consensus',           action: 'Fade spike • 1.0843 key pivot',        pairDirection: 'NEUT' },
  },
]

export const TRADING_SESSIONS: TradingSession[] = [
  { name: 'ASIA',     startUTC: 0,  endUTC: 9,  color: '#7f77dd' },
  { name: 'LONDON',   startUTC: 7,  endUTC: 16, color: '#378add' },
  { name: 'NEW YORK', startUTC: 13, endUTC: 22, color: '#22c55e' },
]

export const SESSION_PREP: Record<string, SessionPrepData> = {
  LONDON: {
    name: 'LONDON',
    focus: 'UK CPI + ECB speakers',
    biases: [
      { pair: 'EUR/USD', direction: 'Bullish', confidence: 72 },
      { pair: 'GBP/USD', direction: 'Bullish', confidence: 68 },
      { pair: 'USD/JPY', direction: 'Bearish', confidence: 75 },
      { pair: 'USD/CHF', direction: 'Bearish', confidence: 60 },
    ],
    levels: [['EUR/USD R1','1.0870'],['EUR/USD PP','1.0843'],['EUR/USD S1','1.0810'],['GBP/USD R1','1.2720']],
  },
  NY: {
    name: 'NY',
    focus: 'NFP 14:30 + Michigan 16:00',
    biases: [
      { pair: 'EUR/USD', direction: 'Bearish', confidence: 65 },
      { pair: 'USD/JPY', direction: 'Bullish', confidence: 70 },
      { pair: 'GOLD',    direction: 'Bullish', confidence: 80 },
      { pair: 'DXY',     direction: 'Bullish', confidence: 62 },
    ],
    levels: [['DXY R1','104.80'],['DXY S1','103.90'],['GOLD R1','2335'],['NFP Pivot','1.0843']],
  },
  ASIA: {
    name: 'ASIA',
    focus: 'BoJ speakers + PBoC data',
    biases: [
      { pair: 'USD/JPY', direction: 'Neutral', confidence: 50 },
      { pair: 'AUD/USD', direction: 'Bearish', confidence: 58 },
      { pair: 'NZD/USD', direction: 'Bearish', confidence: 55 },
      { pair: 'EUR/JPY', direction: 'Neutral', confidence: 48 },
    ],
    levels: [['USD/JPY R1','149.90'],['USD/JPY S1','148.50'],['AUD/USD S1','0.6450'],['NZD/USD S1','0.5880']],
  },
}

// ─── Yields ─────────────────────────────────────────────────────────────────
export const GLOBAL_YIELDS: YieldItem[] = [
  { name: 'US 2Y',   value: 4.87, change: -0.02, changeBps: -2  },
  { name: 'US 5Y',   value: 4.52, change:  0.03, changeBps:  3  },
  { name: 'US 10Y',  value: 4.41, change:  0.04, changeBps:  4  },
  { name: 'US 30Y',  value: 4.58, change:  0.02, changeBps:  2  },
  { name: 'DE 10Y',  value: 2.52, change: -0.01, changeBps: -1  },
  { name: 'UK 10Y',  value: 4.21, change:  0.03, changeBps:  3  },
  { name: 'JP 10Y',  value: 0.87, change:  0.05, changeBps:  5  },
  { name: 'IT 10Y',  value: 3.82, change: -0.02, changeBps: -2  },
]

export const YIELD_CURVE_POINTS: YieldCurvePoint[] = [
  { maturity: 0.5,  maturityLabel: '6M', yield: 5.21 },
  { maturity: 1,    maturityLabel: '1Y', yield: 5.15 },
  { maturity: 2,    maturityLabel: '2Y', yield: 4.87 },
  { maturity: 3,    maturityLabel: '3Y', yield: 4.71 },
  { maturity: 5,    maturityLabel: '5Y', yield: 4.52 },
  { maturity: 7,    maturityLabel: '7Y', yield: 4.46 },
  { maturity: 10,   maturityLabel: '10Y', yield: 4.41 },
  { maturity: 20,   maturityLabel: '20Y', yield: 4.53 },
  { maturity: 30,   maturityLabel: '30Y', yield: 4.58 },
]

export const YIELD_SPREADS: YieldSpread[] = [
  { name: 'US 2Y-10Y', value: -0.46, label: 'Inverted — recession signal',   signal: 'bearish'  },
  { name: 'US-DE 10Y', value:  1.89, label: 'Wide — USD rate advantage',     signal: 'neutral'  },
  { name: 'IT-DE 10Y', value:  1.30, label: 'Stable — ECB backstop holding', signal: 'bullish'  },
  { name: 'US 10Y Real', value: 2.11, label: 'High — gold headwind',         signal: 'bearish'  },
]

// ─── Flows ───────────────────────────────────────────────────────────────────
export const INSTITUTIONAL_FLOWS: InstitutionalFlow[] = [
  { pair: 'EUR/USD', description: 'Real money institutional buy',  size: '$2.1B', direction: 'buy'  },
  { pair: 'USD/JPY', description: 'Real money hedge sell',         size: '$1.4B', direction: 'sell' },
  { pair: 'GBP/USD', description: 'Retail buy (contrarian signal)',size: '$380M', direction: 'buy'  },
  { pair: 'GOLD',    description: 'Central bank accumulation',     size: '$890M', direction: 'buy'  },
  { pair: 'DXY',     description: 'Corporate hedging USD sell',    size: '$1.2B', direction: 'sell' },
]

export const OPTIONS_FLOW: OptionsFlow[] = [
  { instrument: 'EUR/USD 1.09 Call', expiry: '1W', openInterest: 'High OI',   bias: 'Bullish' },
  { instrument: 'EUR/USD 1.07 Put',  expiry: '1W', openInterest: 'High OI',   bias: 'Bearish' },
  { instrument: 'USD/JPY 150 Call',  expiry: '2W', openInterest: 'Large prem', bias: 'Bullish' },
  { instrument: 'Gold 2400 Call',    expiry: '1M', openInterest: 'Rolling up', bias: 'Bullish' },
]

export const DARK_POOL_PRINTS: DarkPoolPrint[] = [
  { pair: 'EUR/USD', price: '1.08427', size: '$450M', type: 'Accum.' },
  { pair: 'GBP/USD', price: '1.26790', size: '$280M', type: 'Dist.'  },
  { pair: 'GOLD',    price: '2314.5',  size: '$190M', type: 'Accum.' },
]

// ─── Macro assets & correlations ─────────────────────────────────────────────
export const MACRO_ASSETS: MacroAsset[] = [
  { name: 'DXY',   value: '104.32', change: '+0.04', changePct: '+0.04%', direction: 'up' },
  { name: 'GOLD',  value: '2318.4', change: '+12.4', changePct: '+0.54%', direction: 'up' },
  { name: 'WTI',   value: '78.20',  change: '-0.24', changePct: '-0.31%', direction: 'dn' },
  { name: 'US10Y', value: '4.41%',  change: '+4bp',  changePct: '+0.92%', direction: 'up' },
  { name: 'SPX',   value: '5234',   change: '+21',   changePct: '+0.40%', direction: 'up' },
  { name: 'VIX',   value: '13.2',   change: '-0.8',  changePct: '-5.7%',  direction: 'dn' },
]

export const CORRELATIONS: Correlation[] = [
  { pair: 'EUR/USD vs DXY',  coefficient: -0.97, description: 'Strong inverse'           },
  { pair: 'Gold vs US10Y',   coefficient: -0.82, description: 'Inverse (real yields)'    },
  { pair: 'Oil vs CAD',      coefficient:  0.78, description: 'Positive commodity link'  },
  { pair: 'VIX vs SPX',      coefficient: -0.91, description: 'Fear gauge inverse'       },
  { pair: 'Gold vs DXY',     coefficient: -0.74, description: 'USD inverse hedge'        },
  { pair: 'JPY vs Risk',     coefficient: -0.68, description: 'Safe haven in risk-off'   },
]

// ─── Seasonality ─────────────────────────────────────────────────────────────
export const SEASONALITY_EUR  = [0.2, 0.1, -0.1, -0.2, 0.3, 0.4, 0.2, -0.1, -0.3, -0.1, 0.1, 0.2]
export const SEASONALITY_GBP  = [0.1, 0.2,  0.3, -0.1,-0.2, 0.1, 0.2,  0.3, -0.2, -0.1, 0.0, 0.1]
export const SEASONALITY_JPY  = [-0.2,-0.1,  0.0,  0.1, 0.2, 0.3, 0.1, -0.1, -0.2, -0.3,-0.1, 0.0]
export const SEASONALITY_GOLD = [0.3, 0.2,  0.1,  0.2, 0.4, 0.1,-0.1,  0.2,  0.3,  0.2, 0.1, 0.4]
export const MONTHS = ['J','F','M','A','M','J','J','A','S','O','N','D']

// ─── AI Copilot preset responses ─────────────────────────────────────────────
export const COPILOT_PRESETS: Record<string, string> = {
  'Summarize macro session': 'SESSION BRIEF 08:42 UTC — USD mixed ahead of NFP. EUR/USD holding 1.0843 support. GBP outperforms on CPI beat. Gold bid on geopolitical risk + real yields falling. COT: net long EUR +24K, net short JPY extreme at -62K. Key risk in 2h14m: NFP 14:30. DXY 104.32 — watch 104.80 resistance.',
  'EUR/USD outlook': 'EUR/USD OUTLOOK — Bias: Bullish 72% confidence. Support: 1.0810 (S1), 1.0780 (FVG D1). Resistance: 1.0870 (R1), 1.0905 (weekly high). EMA20 > EMA50 — uptrend intact. COT net long +24K institutional positioning supportive. ECB Jun cut priced — not fully hawkish. Risk: NFP beat >200K + wages flips bias bearish to 1.0780-1.0810.',
  'NFP scenarios': 'NFP SCENARIOS (14:30 UTC):\n\nBULL USD (>200K + wages ≥0.4%): DXY rallies to 105.20. EUR/USD sells to 1.0780-1.0810. Gold -$15 to $2300. Short EUR/USD on spike.\n\nBEAR USD (<150K): EUR/USD squeeze to 1.0870-1.0900. Gold +$15-20. Retail 66% long EUR — adds fuel.\n\nBASE (150-200K in-line): 20-30 pip whipsaw both ways. Fade initial move. DXY 104.00 key.',
  'COT signals': 'COT WEEK OF MAY 7 — EUR net long +24,300 (+3.2K week). GBP net long +18,700 (+1.1K). USD/JPY net short -62,400 — EXTREME, squeeze risk. AUD net short -8,200 (-0.9K). USD/CAD net short -15,300 (-2.1K).\n\nINST. BIAS: Long EUR, long GBP, bearish USD/JPY (squeeze risk above 150.00), bearish AUD. Aligned with DXY weakness thesis if NFP disappoints.',
  'Gold analysis': 'GOLD $2318 ANALYSIS — Bullish 78% confidence. CB accumulation confirmed (China, India, Turkey). Real yield US10Y at 2.11% = headwind but offset by geo-premium. Seasonal May avg +0.4%. COT not at extreme longs = room to rally. Key levels: $2350 R1, $2290 support. If NFP miss → Gold targets $2350-2380. DXY inverse correlation -0.74 key driver.',
}

// ─── Workspace tabs ───────────────────────────────────────────────────────────
export const WORKSPACE_TABS: Tab[] = [
  { id: 'dashboard',   label: 'DASHBOARD' },
  { id: 'cot',         label: 'COT' },
  { id: 'calendar',    label: 'CALENDAR' },
  { id: 'livefeed',    label: 'LIVE FEED' },
  { id: 'newsplay',    label: 'EVENT TRADES' },
  { id: 'seasonality', label: 'SEASONALITY' },
  { id: 'worldbook',   label: 'WORLDBOOK' },
  { id: 'liquidity',   label: 'LIQUIDITY' },
  { id: 'yields',      label: 'YIELDS' },
  { id: 'flows',       label: 'FLOWS' },
  { id: 'copilot',     label: 'AI COPILOT' },
]

export const TICKER_ITEMS = [
  { tag: 'NFP',  cls: 'high', text: 'NFP 14:30 — Cons: 175K | Prior: 151K' },
  { tag: 'FED',  cls: 'high', text: 'Williams: No rush to cut | USD bid' },
  { tag: 'EUR',  cls: 'info', text: 'EUR/USD 1.0843 | ECB June cut possible' },
  { tag: 'GOLD', cls: 'high', text: 'Gold $2318 | CB accumulation + geopolitical bid' },
  { tag: 'COT',  cls: 'med',  text: 'Net long EUR +24K | JPY extreme short -62K' },
  { tag: 'CPI',  cls: 'high', text: 'US CPI 14:30 | Core 3.4% exp — hot risk' },
  { tag: 'GBP',  cls: 'info', text: 'GBP session bias: Bullish | London open 1.2681' },
  { tag: 'OIL',  cls: 'med',  text: 'WTI $78.20 | OPEC+ compliance high' },
  { tag: 'JPY',  cls: 'high', text: 'BoJ normalisation risk | Intervention watch 150' },
]

