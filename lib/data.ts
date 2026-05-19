import type {
  CurrencyPair,
  NewsItem,
  CalendarEvent,
  COTPosition,
  HedgeFundFlow,
  SentimentData,
  BankResearch,
  PairBias,
  PropIndicator,
  CountryMacro,
  NewsScenario,
  TradingSession,
  Tab,
} from '@/types'

export const PAIRS: CurrencyPair[] = [
  { name: 'EUR/USD', price: 1.08432, bid: 1.08418, ask: 1.08446, pip: 0.0001, spread: 0.00014, change: 0.00023, changePct: 0.21 },
  { name: 'GBP/USD', price: 1.26815, bid: 1.26797, ask: 1.26833, pip: 0.0001, spread: 0.00018, change: -0.00142, changePct: -0.11 },
  { name: 'USD/JPY', price: 149.284, bid: 149.272, ask: 149.296, pip: 0.01,   spread: 0.012,   change: 0.432,   changePct: 0.29 },
  { name: 'AUD/USD', price: 0.64892, bid: 0.64875, ask: 0.64909, pip: 0.0001, spread: 0.00017, change: -0.00089, changePct: -0.14 },
  { name: 'NZD/USD', price: 0.59341, bid: 0.59321, ask: 0.59361, pip: 0.0001, spread: 0.00020, change: 0.00051, changePct: 0.09 },
  { name: 'USD/CAD', price: 1.36218, bid: 1.36200, ask: 1.36236, pip: 0.0001, spread: 0.00018, change: -0.00103, changePct: -0.08 },
  { name: 'USD/CHF', price: 0.89743, bid: 0.89727, ask: 0.89759, pip: 0.0001, spread: 0.00016, change: 0.00072, changePct: 0.08 },
  { name: 'EUR/GBP', price: 0.85541, bid: 0.85526, ask: 0.85556, pip: 0.0001, spread: 0.00015, change: 0.00034, changePct: 0.04 },
]

export const NEWS_FEED: NewsItem[] = [
  { id: 'n1', source: 'Reuters',    time: '08:42', impact: 'high', tag: 'FED',  title: 'Fed Williams: inflation still too high, data-dependent approach confirmed' },
  { id: 'n2', source: 'Bloomberg',  time: '08:31', impact: 'high', tag: 'ECB',  title: 'ECB Lagarde confirms no rush to cut rates before June meeting' },
  { id: 'n3', source: 'FXStreet',   time: '08:19', impact: 'med',  tag: 'GBP',  title: 'GBP/USD holds above 1.2680 ahead of UK CPI data release' },
  { id: 'n4', source: 'Reuters',    time: '08:05', impact: 'med',  tag: 'CNH',  title: 'China PBoC keeps LPR unchanged at 3.45% — no stimulus signal' },
  { id: 'n5', source: 'Newsquawk',  time: '07:58', impact: 'high', tag: 'NFP',  title: 'NFP preview: consensus 175K, unemployment 3.9% — USD at risk' },
  { id: 'n6', source: 'Bloomberg',  time: '07:44', impact: 'low',  tag: 'OIL',  title: 'Oil steady as OPEC+ extension discussions continue behind closed doors' },
  { id: 'n7', source: 'Reuters',    time: '07:30', impact: 'med',  tag: 'JPY',  title: 'Japan BoJ minutes show heated debate on rate hike timing for H2' },
  { id: 'n8', source: 'FT',         time: '07:12', impact: 'low',  tag: 'EUR',  title: 'Eurozone PMI composite beats expectations at 52.3 vs 51.8 prior' },
  { id: 'n9', source: 'BBG',        time: '06:55', impact: 'high', tag: 'CPI',  title: 'US CPI preview: Core expected 3.4% YoY — hot print risks USD rally' },
  { id: 'n10', source: 'Reuters',   time: '06:30', impact: 'med',  tag: 'CHF',  title: 'SNB not ruling out further interventions on CHF excessive strength' },
]

export const CALENDAR_EVENTS: CalendarEvent[] = [
  { id: 'c1', time: '08:30', flag: '🇬🇧', country: 'GBR', event: 'UK CPI m/m',              impact: 'high', previous: '0.5%',  forecast: '0.2%',  actual: '' },
  { id: 'c2', time: '10:00', flag: '🇪🇺', country: 'EUR', event: 'EZ Unemployment Rate',    impact: 'med',  previous: '6.5%',  forecast: '6.5%',  actual: '6.5%' },
  { id: 'c3', time: '12:30', flag: '🇺🇸', country: 'USD', event: 'Initial Jobless Claims',  impact: 'med',  previous: '215K',  forecast: '212K',  actual: '' },
  { id: 'c4', time: '14:30', flag: '🇺🇸', country: 'USD', event: 'NFP',                      impact: 'high', previous: '151K',  forecast: '175K',  actual: '' },
  { id: 'c5', time: '14:30', flag: '🇺🇸', country: 'USD', event: 'Unemployment Rate',        impact: 'high', previous: '4.1%',  forecast: '4.0%',  actual: '' },
  { id: 'c6', time: '14:30', flag: '🇺🇸', country: 'USD', event: 'Avg Hourly Earnings',      impact: 'high', previous: '0.3%',  forecast: '0.3%',  actual: '' },
  { id: 'c7', time: '16:00', flag: '🇺🇸', country: 'USD', event: 'Michigan Sentiment',       impact: 'med',  previous: '57.0',  forecast: '59.0',  actual: '' },
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
  { pair: 'AUD/USD', longPct: 45, shortPct: 55, source: 'Myfxbook' },
]

export const BANK_RESEARCH: BankResearch[] = [
  { bank: 'Goldman Sachs',  pair: 'EUR/USD', direction: 'BUY',     view: 'Target 1.10 by Q3 — ECB-Fed divergence play', target: '1.1000', horizon: 'Q3 2024' },
  { bank: 'JPMorgan',       pair: 'USD/JPY', direction: 'SELL',    view: 'BoJ pivot expected H2 — JPY heavily undervalued', target: '142.00', horizon: 'H2 2024' },
  { bank: 'Deutsche Bank',  pair: 'GBP/USD', direction: 'BUY',     view: 'UK inflation stickiness supports GBP near-term', target: '1.2900', horizon: 'Q2 2024' },
  { bank: 'Citi',           pair: 'AUD/USD', direction: 'SELL',    view: 'China slowdown risk, commodity headwinds persist', target: '0.6300', horizon: 'Q3 2024' },
  { bank: 'BofA',           pair: 'EUR/USD', direction: 'NEUTRAL', view: 'Range-bound 1.05–1.10 until Fed clarity emerges' },
]

export const PAIR_BIASES: PairBias[] = [
  { pair: 'EUR/USD', direction: 'Bullish', confidence: 72 },
  { pair: 'GBP/USD', direction: 'Bullish', confidence: 65 },
  { pair: 'USD/JPY', direction: 'Bearish', confidence: 80 },
  { pair: 'AUD/USD', direction: 'Neutral', confidence: 48 },
]

export const PROP_INDICATORS: PropIndicator[] = [
  { name: 'USD Strength Index', value: 67, max: 100, color: '#ef4444' },
  { name: 'Risk Appetite',      value: 44, max: 100, color: '#f0b429' },
  { name: 'Carry Trade Signal', value: 72, max: 100, color: '#22c55e' },
  { name: 'EUR Trend Momentum', value: 58, max: 100, color: '#378add' },
  { name: 'Volatility Regime',  value: 31, max: 100, color: '#7f77dd' },
]

export const WORLDBOOK: CountryMacro[] = [
  { country: 'USA', flag: '🇺🇸', name: 'United States', gdp: '+2.8%', cpi: '3.4%', rate: '5.25%', bias: 'Neutral' },
  { country: 'EUR', flag: '🇪🇺', name: 'Eurozone',       gdp: '+0.4%', cpi: '2.6%', rate: '4.50%', bias: 'Dovish' },
  { country: 'GBR', flag: '🇬🇧', name: 'United Kingdom', gdp: '+0.1%', cpi: '3.2%', rate: '5.25%', bias: 'Neutral' },
  { country: 'JPN', flag: '🇯🇵', name: 'Japan',           gdp: '+0.1%', cpi: '2.7%', rate: '-0.10%', bias: 'Hawkish' },
  { country: 'AUS', flag: '🇦🇺', name: 'Australia',       gdp: '+1.5%', cpi: '3.6%', rate: '4.35%', bias: 'Neutral' },
  { country: 'CAD', flag: '🇨🇦', name: 'Canada',          gdp: '+1.2%', cpi: '2.9%', rate: '5.00%', bias: 'Dovish' },
]

export const NEWS_SCENARIOS: NewsScenario[] = [
  {
    event: 'NFP — Non-Farm Payrolls', date: '14:30 UTC TODAY',
    bull: { label: 'BULL CASE', condition: '>200K + wages low',       action: 'Short USD / buy risk assets' },
    bear: { label: 'BEAR CASE', condition: '<150K + wages high',      action: 'Long USD / sell EUR/USD' },
    base: { label: 'BASE CASE', condition: '150–200K in-line',        action: 'Fade initial spike, follow-through' },
  },
  {
    event: 'FOMC Rate Decision', date: '29 May 18:00 UTC',
    bull: { label: 'DOVISH',    condition: 'Rate cut signal',          action: 'EUR/USD long, DXY short' },
    bear: { label: 'HAWKISH',   condition: 'Higher for longer',        action: 'USD longs, JPY shorts' },
    base: { label: 'NEUTRAL',   condition: 'On-hold, data-dependent',  action: 'Watch Powell presser' },
  },
  {
    event: 'US CPI', date: '15 May 14:30 UTC',
    bull: { label: 'COOL CPI',  condition: '<3.2% core YoY',          action: 'Risk-on, DXY sell' },
    bear: { label: 'HOT CPI',   condition: '>3.6% core YoY',          action: 'Rate hike fears, USD rally' },
    base: { label: 'IN-LINE',   condition: '3.4% consensus',          action: 'Fade initial reaction' },
  },
]

export const TRADING_SESSIONS: TradingSession[] = [
  { name: 'ASIA',     startUTC: 0,  endUTC: 9,  color: '#7f77dd' },
  { name: 'LONDON',   startUTC: 7,  endUTC: 16, color: '#378add' },
  { name: 'NEW YORK', startUTC: 13, endUTC: 22, color: '#22c55e' },
]

export const SEASONALITY_EUR = [0.2, 0.1, -0.1, -0.2, 0.3, 0.4, 0.2, -0.1, -0.3, -0.1, 0.1, 0.2]
export const SEASONALITY_GBP = [0.1, 0.2,  0.3, -0.1,-0.2, 0.1, 0.2,  0.3, -0.2, -0.1, 0.0, 0.1]
export const SEASONALITY_JPY = [-0.2,-0.1,  0.0,  0.1, 0.2, 0.3, 0.1, -0.1, -0.2, -0.3,-0.1, 0.0]
export const MONTHS = ['J','F','M','A','M','J','J','A','S','O','N','D']

export const WORKSPACE_TABS: Tab[] = [
  { id: 'dashboard',   label: 'DASHBOARD' },
  { id: 'cot',         label: 'COT & POSITIONING' },
  { id: 'calendar',    label: 'ECO CALENDAR' },
  { id: 'newsplay',    label: 'NEWS TRADING' },
  { id: 'seasonality', label: 'SEASONALITY' },
  { id: 'worldbook',   label: 'WORLDBOOK' },
  { id: 'liquidity',   label: 'LIQUIDITY' },
]

export const TICKER_ITEMS = [
  { tag: 'NFP',  cls: 'high', text: 'NFP 14:30 — Cons: 175K | Prior: 151K' },
  { tag: 'FED',  cls: 'high', text: 'Williams: No rush to cut | USD bid' },
  { tag: 'EUR',  cls: 'info', text: 'EUR/USD 1.0843 | ECB June hold confirmed' },
  { tag: 'COT',  cls: 'med',  text: 'Speculative net long EUR +24K contracts' },
  { tag: 'CPI',  cls: 'high', text: 'US CPI 14:30 | Core 3.4% exp — hot risk' },
  { tag: 'GBP',  cls: 'info', text: 'GBP session bias: Bullish | London open 1.2681' },
]
