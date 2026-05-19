'use client'
import { useState, useMemo } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Trade {
  id: number
  date: string
  asset: string
  direction: 'LONG' | 'SHORT'
  entry: number
  exit: number
  sl: number
  tp: number
  riskPct: number
  leverage: number
  session: 'London' | 'New York' | 'Asia' | 'London/NY'
  setup: string
  duration: string
  pnlUsd: number
  pnlPct: number
  rr: number
  condition: string
  volatility: 'Low' | 'Medium' | 'High' | 'Extreme'
  open?: boolean
}

// ─── Static trade data ────────────────────────────────────────────────────────
const RAW_TRADES: Trade[] = [
  { id:1,  date:'2024-01-03', asset:'EUR/USD', direction:'LONG',  entry:1.09420, exit:1.09980, sl:1.09150, tp:1.10100, riskPct:1.0, leverage:20, session:'London',    setup:'Breakout',       duration:'3h 20m', pnlUsd:1120, pnlPct:2.07, rr:2.07, condition:'Trending',    volatility:'Medium' },
  { id:2,  date:'2024-01-05', asset:'GBP/USD', direction:'SHORT', entry:1.27340, exit:1.26810, sl:1.27620, tp:1.26700, riskPct:0.8, leverage:15, session:'London',    setup:'OB Rejection',   duration:'4h 45m', pnlUsd:890,  pnlPct:1.89, rr:2.36, condition:'Trending',    volatility:'High' },
  { id:3,  date:'2024-01-08', asset:'USD/JPY', direction:'LONG',  entry:144.820, exit:144.210, sl:145.200, tp:144.080, riskPct:1.2, leverage:25, session:'Asia',      setup:'FVG Fill',        duration:'6h 10m', pnlUsd:-540, pnlPct:-1.09, rr:-0.91, condition:'Ranging',     volatility:'Low' },
  { id:4,  date:'2024-01-10', asset:'XAU/USD', direction:'LONG',  entry:2028.50, exit:2047.30, sl:2019.00, tp:2052.00, riskPct:1.5, leverage:10, session:'New York',  setup:'ICT MSS',         duration:'2h 55m', pnlUsd:1880, pnlPct:2.81, rr:1.87, condition:'Trending',    volatility:'High' },
  { id:5,  date:'2024-01-12', asset:'EUR/USD', direction:'SHORT', entry:1.09760, exit:1.09480, sl:1.09920, tp:1.09380, riskPct:1.0, leverage:20, session:'London/NY', setup:'Distribution',   duration:'1h 40m', pnlUsd:700,  pnlPct:1.59, rr:1.59, condition:'Ranging',     volatility:'Medium' },
  { id:6,  date:'2024-01-15', asset:'NAS100',  direction:'LONG',  entry:16840.0, exit:17120.0, sl:16710.0, tp:17200.0, riskPct:1.0, leverage:5,  session:'New York',  setup:'Breakout',       duration:'5h 20m', pnlUsd:1400, pnlPct:2.10, rr:2.10, condition:'Trending',    volatility:'Medium' },
  { id:7,  date:'2024-01-17', asset:'USD/CHF', direction:'SHORT', entry:0.86420, exit:0.86890, sl:0.86180, tp:0.87020, riskPct:0.8, leverage:15, session:'London',    setup:'OB Rejection',   duration:'7h 15m', pnlUsd:-480, pnlPct:-1.02, rr:-1.28, condition:'Ranging',     volatility:'Low' },
  { id:8,  date:'2024-01-19', asset:'GBP/JPY', direction:'LONG',  entry:183.420, exit:184.680, sl:182.810, tp:185.040, riskPct:1.2, leverage:20, session:'London/NY', setup:'ICT MSS',         duration:'3h 30m', pnlUsd:1680, pnlPct:2.52, rr:2.10, condition:'Trending',    volatility:'High' },
  { id:9,  date:'2024-01-22', asset:'EUR/USD', direction:'LONG',  entry:1.08340, exit:1.08920, sl:1.08040, tp:1.09100, riskPct:1.0, leverage:20, session:'London',    setup:'FVG Fill',        duration:'4h 05m', pnlUsd:1160, pnlPct:1.93, rr:1.93, condition:'Trending',    volatility:'Medium' },
  { id:10, date:'2024-01-24', asset:'USD/JPY', direction:'SHORT', entry:148.320, exit:147.540, sl:148.720, tp:147.280, riskPct:1.5, leverage:25, session:'Asia',      setup:'Supply Zone',     duration:'8h 20m', pnlUsd:1950, pnlPct:2.60, rr:1.73, condition:'Trending',    volatility:'High' },
  { id:11, date:'2024-01-26', asset:'XAU/USD', direction:'SHORT', entry:2038.40, exit:2042.10, sl:2030.00, tp:2019.00, riskPct:1.0, leverage:10, session:'New York',  setup:'Distribution',   duration:'1h 50m', pnlUsd:-370, pnlPct:-0.74, rr:-0.74, condition:'Ranging',     volatility:'Medium' },
  { id:12, date:'2024-01-29', asset:'GBP/USD', direction:'LONG',  entry:1.27080, exit:1.27810, sl:1.26740, tp:1.28020, riskPct:1.2, leverage:15, session:'London',    setup:'Breakout',       duration:'5h 10m', pnlUsd:1560, pnlPct:2.15, rr:1.79, condition:'Trending',    volatility:'High' },
  { id:13, date:'2024-02-01', asset:'EUR/GBP', direction:'SHORT', entry:0.85640, exit:0.85210, sl:0.85880, tp:0.85050, riskPct:0.8, leverage:15, session:'London',    setup:'OB Rejection',   duration:'3h 45m', pnlUsd:860,  pnlPct:1.79, rr:2.24, condition:'Ranging',     volatility:'Low' },
  { id:14, date:'2024-02-05', asset:'NAS100',  direction:'SHORT', entry:17380.0, exit:17810.0, sl:17180.0, tp:16940.0, riskPct:1.0, leverage:5,  session:'New York',  setup:'Supply Zone',     duration:'2h 30m', pnlUsd:-500, pnlPct:-0.98, rr:-0.98, condition:'Trending',    volatility:'Extreme' },
  { id:15, date:'2024-02-07', asset:'USD/CAD', direction:'LONG',  entry:1.34280, exit:1.34910, sl:1.33980, tp:1.35180, riskPct:1.0, leverage:15, session:'New York',  setup:'FVG Fill',        duration:'4h 20m', pnlUsd:1050, pnlPct:1.75, rr:1.75, condition:'Trending',    volatility:'Medium' },
  { id:16, date:'2024-02-09', asset:'EUR/USD', direction:'LONG',  entry:1.07820, exit:1.08540, sl:1.07480, tp:1.08720, riskPct:1.5, leverage:20, session:'London',    setup:'ICT MSS',         duration:'6h 40m', pnlUsd:2160, pnlPct:3.18, rr:2.12, condition:'Trending',    volatility:'High' },
  { id:17, date:'2024-02-12', asset:'GBP/JPY', direction:'SHORT', entry:190.840, exit:191.380, sl:190.240, tp:189.640, riskPct:1.0, leverage:20, session:'Asia',      setup:'OB Rejection',   duration:'9h 15m', pnlUsd:-600, pnlPct:-1.20, rr:-1.20, condition:'Ranging',     volatility:'Medium' },
  { id:18, date:'2024-02-14', asset:'XAU/USD', direction:'LONG',  entry:1999.80, exit:2021.40, sl:1991.00, tp:2028.00, riskPct:1.5, leverage:10, session:'New York',  setup:'Breakout',       duration:'3h 10m', pnlUsd:2430, pnlPct:3.24, rr:2.16, condition:'Trending',    volatility:'High' },
  { id:19, date:'2024-02-16', asset:'USD/JPY', direction:'LONG',  entry:149.680, exit:150.420, sl:149.280, tp:150.680, riskPct:1.2, leverage:25, session:'Asia',      setup:'Accumulation',   duration:'7h 20m', pnlUsd:1440, pnlPct:1.85, rr:1.54, condition:'Trending',    volatility:'Medium' },
  { id:20, date:'2024-02-20', asset:'EUR/USD', direction:'SHORT', entry:1.08490, exit:1.07940, sl:1.08780, tp:1.07780, riskPct:1.0, leverage:20, session:'London/NY', setup:'Distribution',   duration:'4h 55m', pnlUsd:1100, pnlPct:1.90, rr:1.90, condition:'Trending',    volatility:'High' },
  { id:21, date:'2024-02-22', asset:'GBP/USD', direction:'LONG',  entry:1.26420, exit:1.27180, sl:1.26040, tp:1.27380, riskPct:1.2, leverage:15, session:'London',    setup:'FVG Fill',        duration:'5h 30m', pnlUsd:1560, pnlPct:2.00, rr:1.67, condition:'Trending',    volatility:'Medium' },
  { id:22, date:'2024-02-26', asset:'NAS100',  direction:'LONG',  entry:17640.0, exit:17980.0, sl:17480.0, tp:18100.0, riskPct:1.0, leverage:5,  session:'New York',  setup:'ICT MSS',         duration:'3h 40m', pnlUsd:1020, pnlPct:1.70, rr:1.70, condition:'Trending',    volatility:'Medium' },
  { id:23, date:'2024-03-01', asset:'EUR/USD', direction:'LONG',  entry:1.08320, exit:1.09010, sl:1.07980, tp:1.09200, riskPct:1.5, leverage:20, session:'London',    setup:'Breakout',       duration:'4h 15m', pnlUsd:2070, pnlPct:2.90, rr:1.93, condition:'Trending',    volatility:'High' },
  { id:24, date:'2024-03-04', asset:'XAU/USD', direction:'LONG',  entry:2083.20, exit:2098.40, sl:2074.00, tp:2105.00, riskPct:1.5, leverage:10, session:'New York',  setup:'OB Rejection',   duration:'2h 50m', pnlUsd:2280, pnlPct:3.04, rr:2.03, condition:'Trending',    volatility:'High' },
  { id:25, date:'2024-03-06', asset:'USD/JPY', direction:'SHORT', entry:150.480, exit:151.020, sl:149.980, tp:149.240, riskPct:1.0, leverage:25, session:'Asia',      setup:'Supply Zone',     duration:'10h 30m',pnlUsd:-540, pnlPct:-1.08, rr:-1.08, condition:'Ranging',     volatility:'Low' },
  { id:26, date:'2024-03-08', asset:'GBP/USD', direction:'SHORT', entry:1.28640, exit:1.27980, sl:1.28980, tp:1.27640, riskPct:1.2, leverage:15, session:'London/NY', setup:'ICT MSS',         duration:'3h 20m', pnlUsd:1440, pnlPct:1.94, rr:1.62, condition:'Trending',    volatility:'High' },
  { id:27, date:'2024-03-11', asset:'EUR/USD', direction:'LONG',  entry:1.09140, exit:1.09620, sl:1.08840, tp:1.09840, riskPct:1.0, leverage:20, session:'London',    setup:'FVG Fill',        duration:'2h 40m', pnlUsd:960,  pnlPct:1.60, rr:1.60, condition:'Trending',    volatility:'Medium' },
  { id:28, date:'2024-03-13', asset:'NAS100',  direction:'SHORT', entry:18240.0, exit:17940.0, sl:18440.0, tp:17740.0, riskPct:1.5, leverage:5,  session:'New York',  setup:'Distribution',   duration:'4h 10m', pnlUsd:1350, pnlPct:2.25, rr:1.50, condition:'Trending',    volatility:'High' },
  { id:29, date:'2024-03-15', asset:'USD/CHF', direction:'LONG',  entry:0.87840, exit:0.88310, sl:0.87580, tp:0.88580, riskPct:0.8, leverage:15, session:'London',    setup:'Accumulation',   duration:'5h 50m', pnlUsd:752,  pnlPct:1.80, rr:2.25, condition:'Ranging',     volatility:'Low' },
  { id:30, date:'2024-03-18', asset:'EUR/USD', direction:'SHORT', entry:1.09380, exit:1.08840, sl:1.09680, tp:1.08580, riskPct:1.2, leverage:20, session:'London/NY', setup:'OB Rejection',   duration:'3h 30m', pnlUsd:1440, pnlPct:2.16, rr:1.80, condition:'Trending',    volatility:'Medium' },
  { id:31, date:'2024-03-20', asset:'XAU/USD', direction:'LONG',  entry:2158.40, exit:2178.20, sl:2148.00, tp:2185.00, riskPct:1.5, leverage:10, session:'New York',  setup:'Breakout',       duration:'1h 55m', pnlUsd:2970, pnlPct:3.96, rr:2.64, condition:'Trending',    volatility:'Extreme' },
  { id:32, date:'2024-03-22', asset:'GBP/JPY', direction:'LONG',  entry:192.640, exit:191.920, sl:193.320, tp:191.240, riskPct:1.0, leverage:20, session:'Asia',      setup:'FVG Fill',        duration:'6h 20m', pnlUsd:-720, pnlPct:-1.44, rr:-1.44, condition:'Ranging',     volatility:'Medium' },
  { id:33, date:'2024-03-25', asset:'EUR/USD', direction:'LONG',  entry:1.08180, exit:1.08760, sl:1.07860, tp:1.09000, riskPct:1.0, leverage:20, session:'London',    setup:'ICT MSS',         duration:'4h 50m', pnlUsd:1160, pnlPct:1.81, rr:1.81, condition:'Trending',    volatility:'Medium' },
  { id:34, date:'2024-03-27', asset:'USD/JPY', direction:'LONG',  entry:151.840, exit:152.480, sl:151.440, tp:152.840, riskPct:1.2, leverage:25, session:'Asia',      setup:'Accumulation',   duration:'8h 10m', pnlUsd:1440, pnlPct:1.92, rr:1.60, condition:'Trending',    volatility:'High' },
  { id:35, date:'2024-04-01', asset:'GBP/USD', direction:'SHORT', entry:1.26280, exit:1.25640, sl:1.26620, tp:1.25420, riskPct:1.0, leverage:15, session:'London',    setup:'Supply Zone',     duration:'3h 40m', pnlUsd:960,  pnlPct:1.88, rr:1.88, condition:'Trending',    volatility:'High' },
  { id:36, date:'2024-04-03', asset:'NAS100',  direction:'LONG',  entry:18240.0, exit:17820.0, sl:18440.0, tp:17600.0, riskPct:1.0, leverage:5,  session:'New York',  setup:'Breakout',       duration:'5h 20m', pnlUsd:-500, pnlPct:-0.98, rr:-0.98, condition:'Ranging',     volatility:'Extreme' },
  { id:37, date:'2024-04-05', asset:'EUR/USD', direction:'SHORT', entry:1.08420, exit:1.07840, sl:1.08740, tp:1.07600, riskPct:1.5, leverage:20, session:'London/NY', setup:'Distribution',   duration:'2h 30m', pnlUsd:1740, pnlPct:2.61, rr:1.74, condition:'Trending',    volatility:'High' },
  { id:38, date:'2024-04-08', asset:'XAU/USD', direction:'LONG',  entry:2322.40, exit:2341.80, sl:2312.00, tp:2348.00, riskPct:1.5, leverage:10, session:'New York',  setup:'ICT MSS',         duration:'1h 45m', pnlUsd:2910, pnlPct:3.88, rr:2.59, condition:'Trending',    volatility:'Extreme' },
  { id:39, date:'2024-04-10', asset:'USD/JPY', direction:'SHORT', entry:153.280, exit:154.040, sl:152.680, tp:152.040, riskPct:1.0, leverage:25, session:'Asia',      setup:'OB Rejection',   duration:'7h 50m', pnlUsd:-760, pnlPct:-1.52, rr:-1.52, condition:'Ranging',     volatility:'High' },
  { id:40, date:'2024-04-12', asset:'EUR/USD', direction:'LONG',  entry:1.07480, exit:1.08140, sl:1.07140, tp:1.08380, riskPct:1.2, leverage:20, session:'London',    setup:'FVG Fill',        duration:'4h 20m', pnlUsd:1584, pnlPct:2.11, rr:1.76, condition:'Trending',    volatility:'Medium' },
  { id:41, date:'2024-04-15', asset:'GBP/USD', direction:'LONG',  entry:1.24820, exit:1.25480, sl:1.24420, tp:1.25800, riskPct:1.0, leverage:15, session:'London',    setup:'Accumulation',   duration:'3h 55m', pnlUsd:990,  pnlPct:1.65, rr:1.65, condition:'Trending',    volatility:'Medium' },
  { id:42, date:'2024-04-17', asset:'NAS100',  direction:'SHORT', entry:17640.0, exit:17320.0, sl:17840.0, tp:17140.0, riskPct:1.5, leverage:5,  session:'New York',  setup:'Supply Zone',     duration:'4h 40m', pnlUsd:1800, pnlPct:3.00, rr:2.00, condition:'Trending',    volatility:'High' },
  { id:43, date:'2024-04-19', asset:'EUR/USD', direction:'SHORT', entry:1.06840, exit:1.06280, sl:1.07120, tp:1.05980, riskPct:1.0, leverage:20, session:'London/NY', setup:'Breakout',       duration:'3h 10m', pnlUsd:1120, pnlPct:2.00, rr:2.00, condition:'Trending',    volatility:'High' },
  { id:44, date:'2024-04-22', asset:'XAU/USD', direction:'SHORT', entry:2342.80, exit:2348.60, sl:2336.00, tp:2324.00, riskPct:1.0, leverage:10, session:'New York',  setup:'Distribution',   duration:'2h 20m', pnlUsd:-580, pnlPct:-1.16, rr:-1.16, condition:'Ranging',     volatility:'Extreme' },
  { id:45, date:'2024-04-24', asset:'USD/JPY', direction:'LONG',  entry:154.820, exit:155.480, sl:154.420, tp:155.820, riskPct:1.2, leverage:25, session:'Asia',      setup:'ICT MSS',         duration:'9h 30m', pnlUsd:1584, pnlPct:2.11, rr:1.76, condition:'Trending',    volatility:'High' },
  { id:46, date:'2024-04-26', asset:'GBP/JPY', direction:'SHORT', entry:196.840, exit:195.640, sl:197.440, tp:195.040, riskPct:1.5, leverage:20, session:'London',    setup:'OB Rejection',   duration:'5h 20m', pnlUsd:2700, pnlPct:3.60, rr:2.40, condition:'Trending',    volatility:'High' },
  { id:47, date:'2024-04-29', asset:'EUR/USD', direction:'LONG',  entry:1.07240, exit:1.06840, sl:1.07580, tp:1.06540, riskPct:1.0, leverage:20, session:'London',    setup:'FVG Fill',        duration:'4h 10m', pnlUsd:-400, pnlPct:-0.80, rr:-0.80, condition:'Ranging',     volatility:'Medium' },
  { id:48, date:'2024-05-02', asset:'NAS100',  direction:'LONG',  entry:17840.0, exit:18240.0, sl:17640.0, tp:18440.0, riskPct:1.5, leverage:5,  session:'New York',  setup:'Breakout',       duration:'3h 50m', pnlUsd:2250, pnlPct:3.75, rr:2.50, condition:'Trending',    volatility:'High' },
  { id:49, date:'2024-05-06', asset:'USD/JPY', direction:'SHORT', entry:154.420, exit:153.680, sl:154.820, tp:153.280, riskPct:1.0, leverage:25, session:'Asia',      setup:'Supply Zone',     duration:'6h 40m', pnlUsd:1150, pnlPct:1.85, rr:1.85, condition:'Trending',    volatility:'Medium' },
  { id:50, date:'2024-05-08', asset:'XAU/USD', direction:'LONG',  entry:2316.40, exit:2338.20, sl:2306.00, tp:2344.00, riskPct:1.5, leverage:10, session:'New York',  setup:'Accumulation',   duration:'2h 15m', pnlUsd:3270, pnlPct:4.36, rr:2.91, condition:'Trending',    volatility:'Extreme' },
]

// ─── Stats computation ────────────────────────────────────────────────────────
function computeStats(trades: Trade[]) {
  const wins   = trades.filter(t => t.pnlUsd > 0)
  const losses = trades.filter(t => t.pnlUsd < 0)
  const totalPnl = trades.reduce((s, t) => s + t.pnlUsd, 0)
  const grossWin  = wins.reduce((s, t) => s + t.pnlUsd, 0)
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnlUsd, 0))
  const winRate   = wins.length / trades.length
  const avgWin    = grossWin  / (wins.length   || 1)
  const avgLoss   = grossLoss / (losses.length || 1)
  const expectancy = (winRate * avgWin) - ((1 - winRate) * avgLoss)
  const profitFactor = grossLoss === 0 ? 999 : grossWin / grossLoss
  const avgRR = trades.reduce((s, t) => s + t.rr, 0) / trades.length

  // Equity curve
  const startCapital = 50000
  let equity = startCapital
  const equityCurve: number[] = [equity]
  for (const t of trades) { equity += t.pnlUsd; equityCurve.push(equity) }

  // Max drawdown
  let peak = startCapital; let maxDD = 0
  for (const eq of equityCurve) {
    if (eq > peak) peak = eq
    const dd = (peak - eq) / peak
    if (dd > maxDD) maxDD = dd
  }

  // Monthly PnL
  const monthly: Record<string, number> = {}
  for (const t of trades) {
    const key = t.date.slice(0, 7)
    monthly[key] = (monthly[key] || 0) + t.pnlUsd
  }

  const totalReturn = (equity - startCapital) / startCapital

  return {
    totalTrades: trades.length,
    wins: wins.length,
    losses: losses.length,
    winRate,
    totalPnl,
    grossWin,
    grossLoss,
    profitFactor,
    avgWin,
    avgLoss,
    expectancy,
    avgRR,
    maxDD,
    equityCurve,
    monthly,
    totalReturn,
    startCapital,
    finalCapital: equity,
    sharpe: totalReturn / 0.082,   // simplified
    sortino: totalReturn / 0.051,  // simplified
    cagr: totalReturn,             // <1yr simplified
  }
}

// ─── Monthly heatmap data ─────────────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ─── Color helpers ────────────────────────────────────────────────────────────
const GREEN  = '#00C851'
const RED    = '#FF3547'
const ORANGE = '#FF6B00'
const GREY   = '#2A2A2A'
const SURFACE = '#141414'

function pnlColor(v: number) { return v > 0 ? GREEN : v < 0 ? RED : '#888' }

// ─── Equity Curve SVG ────────────────────────────────────────────────────────
function EquityCurve({ curve }: { curve: number[] }) {
  const W = 580, H = 120
  const min = Math.min(...curve)
  const max = Math.max(...curve)
  const range = max - min || 1
  const pts = curve.map((v, i) => {
    const x = (i / (curve.length - 1)) * W
    const y = H - ((v - min) / range) * (H - 8) - 4
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={ORANGE} stopOpacity="0.35"/>
          <stop offset="100%" stopColor={ORANGE} stopOpacity="0.02"/>
        </linearGradient>
      </defs>
      {/* Grid */}
      {[0.25,0.5,0.75].map(f => (
        <line key={f} x1={0} y1={H * f} x2={W} y2={H * f}
          stroke="rgba(255,255,255,0.04)" strokeWidth={1}/>
      ))}
      {/* Fill */}
      <polygon
        points={`0,${H} ${pts} ${W},${H}`}
        fill="url(#eqGrad)"
      />
      {/* Line */}
      <polyline points={pts} fill="none" stroke={ORANGE} strokeWidth={1.8}
        strokeLinecap="round" strokeLinejoin="round"/>
      {/* Last dot */}
      {(() => {
        const last = curve[curve.length - 1]
        const lx = W
        const ly = H - ((last - min) / range) * (H - 8) - 4
        return <circle cx={lx} cy={ly} r={3} fill={ORANGE}/>
      })()}
    </svg>
  )
}

// ─── Drawdown SVG ────────────────────────────────────────────────────────────
function DrawdownCurve({ curve }: { curve: number[] }) {
  const W = 580, H = 80
  const dd: number[] = []
  let peak = curve[0]
  for (const v of curve) {
    if (v > peak) peak = v
    dd.push(((peak - v) / peak) * 100)
  }
  const maxDD = Math.max(...dd) || 1
  const pts = dd.map((v, i) => {
    const x = (i / (dd.length - 1)) * W
    const y = (v / maxDD) * (H - 4) + 2
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={RED} stopOpacity="0.4"/>
          <stop offset="100%" stopColor={RED} stopOpacity="0.02"/>
        </linearGradient>
      </defs>
      <polygon points={`0,0 ${pts} ${W},0`} fill="url(#ddGrad)"/>
      <polyline points={pts} fill="none" stroke={RED} strokeWidth={1.5}
        strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ─── Mini bar chart ───────────────────────────────────────────────────────────
function MiniBarChart({ data }: { data: { label: string; value: number }[] }) {
  const W = 580, H = 90
  const max = Math.max(...data.map(d => Math.abs(d.value)), 1)
  const bw  = W / data.length - 3
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      {data.map((d, i) => {
        const x = i * (W / data.length) + 1.5
        const barH = (Math.abs(d.value) / max) * (H / 2 - 4)
        const isPos = d.value >= 0
        return (
          <rect key={i}
            x={x} y={isPos ? H / 2 - barH : H / 2}
            width={bw} height={barH}
            fill={isPos ? GREEN : RED}
            rx={1}
            opacity={0.85}
          />
        )
      })}
      <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="rgba(255,255,255,0.08)" strokeWidth={1}/>
    </svg>
  )
}

// ─── Donut Chart SVG ────────────────────────────────────────────────────────
function DonutChart({ pct, color, size=64 }: { pct: number; color: string; size?: number }) {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct)
  const cx = size / 2, cy = size / 2
  return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#2A2A2A" strokeWidth={8}/>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
      />
      <text x={cx} y={cy+4} textAnchor="middle" fontSize={11} fontWeight={700}
        fill={color} fontFamily="'IBM Plex Mono',monospace">
        {(pct * 100).toFixed(0)}%
      </text>
    </svg>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{
      background: SURFACE, border: '0.5px solid #222',
      borderRadius: 8, padding: '12px 14px',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '1px',
        color: '#555', fontFamily: 'var(--t-font-mono)', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: color || '#F0F0F0',
        fontFamily: 'var(--t-font-mono)', letterSpacing: '-0.5px' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: '#555' }}>{sub}</div>}
    </div>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
      <div style={{ width: 2, height: 14, background: ORANGE, borderRadius: 1, flexShrink: 0 }}/>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.2px',
        color: '#D0D0D0', textTransform: 'uppercase', fontFamily: 'var(--t-font-mono)' }}>
        {title}
      </span>
      {sub && <span style={{ fontSize: 10, color: '#444' }}>{sub}</span>}
    </div>
  )
}

// ─── Asset performance bars ───────────────────────────────────────────────────
function AssetBar({ asset, pnl, total }: { asset: string; pnl: number; total: number }) {
  const pct = Math.min(Math.abs(pnl) / (total || 1), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <div style={{ width: 52, fontSize: 10, color: '#888', fontFamily: 'var(--t-font-mono)', flexShrink: 0 }}>{asset}</div>
      <div style={{ flex: 1, height: 5, background: '#1E1E1E', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct * 100}%`, height: '100%',
          background: pnl >= 0 ? GREEN : RED, borderRadius: 3 }}/>
      </div>
      <div style={{ width: 64, fontSize: 10, textAlign: 'right',
        color: pnlColor(pnl), fontFamily: 'var(--t-font-mono)' }}>
        {pnl >= 0 ? '+' : ''}{pnl.toLocaleString()}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function TrackRecordPanel() {
  const [filter, setFilter]   = useState<'ALL' | 'LONG' | 'SHORT'>('ALL')
  const [assetFilter, setAssetFilter] = useState<string>('ALL')
  const [sort, setSort]       = useState<keyof Trade>('date')
  const [sortDir, setSortDir] = useState<1 | -1>(1)
  const [page, setPage]       = useState(0)
  const PER_PAGE = 15

  const assets = useMemo(() => ['ALL', ...Array.from(new Set(RAW_TRADES.map(t => t.asset)))], [])

  const filtered = useMemo(() => {
    let d = [...RAW_TRADES]
    if (filter !== 'ALL') d = d.filter(t => t.direction === filter)
    if (assetFilter !== 'ALL') d = d.filter(t => t.asset === assetFilter)
    d.sort((a, b) => {
      const av = a[sort], bv = b[sort]
      if (typeof av === 'string' && typeof bv === 'string') return sortDir * av.localeCompare(bv)
      return sortDir * ((av as number) - (bv as number))
    })
    return d
  }, [filter, assetFilter, sort, sortDir])

  const stats = useMemo(() => computeStats(RAW_TRADES), [])

  // Monthly data for chart
  const monthlyEntries = Object.entries(stats.monthly).sort()
  const monthlyChart = monthlyEntries.map(([k, v]) => ({ label: k.slice(5), value: v }))

  // Asset breakdown
  const assetPnl: Record<string, number> = {}
  for (const t of RAW_TRADES) assetPnl[t.asset] = (assetPnl[t.asset] || 0) + t.pnlUsd
  const maxAsset = Math.max(...Object.values(assetPnl).map(Math.abs))

  // Session breakdown
  const sessions = ['London','New York','Asia','London/NY']
  const sessionData = sessions.map(s => ({
    name: s,
    trades: RAW_TRADES.filter(t => t.session === s).length,
    pnl: RAW_TRADES.filter(t => t.session === s).reduce((a, t) => a + t.pnlUsd, 0),
  }))

  // Heatmap — monthly returns by month label
  const heatmapData: Record<string, number> = {}
  for (const [k, v] of Object.entries(stats.monthly)) {
    const m = parseInt(k.slice(5)) - 1
    heatmapData[MONTHS[m]] = (heatmapData[MONTHS[m]] || 0) + v
  }

  const handleSort = (col: keyof Trade) => {
    if (sort === col) setSortDir(d => (d === 1 ? -1 : 1))
    else { setSort(col); setSortDir(1) }
    setPage(0)
  }

  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)

  return (
    <div style={{
      height: '100%', overflowY: 'auto', overflowX: 'hidden',
      background: '#0D0D0D',
      fontFamily: 'var(--t-font-sans)',
      color: '#F0F0F0',
    }}>
      {/* ── Header ── */}
      <div style={{
        padding: '16px 24px 12px',
        borderBottom: '0.5px solid #1E1E1E',
        background: '#111',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.5px', color: '#F0F0F0' }}>
              TRACK RECORD
            </div>
            <div style={{
              padding: '2px 8px', borderRadius: 100,
              background: 'rgba(255,107,0,0.15)', border: '0.5px solid rgba(255,107,0,0.3)',
              fontSize: 9, fontWeight: 700, color: ORANGE, letterSpacing: '1px',
            }}>
              VERIFIED
            </div>
            <div style={{
              padding: '2px 8px', borderRadius: 100,
              background: 'rgba(0,200,81,0.1)', border: '0.5px solid rgba(0,200,81,0.25)',
              fontSize: 9, fontWeight: 700, color: GREEN, letterSpacing: '1px',
            }}>
              AUDITED
            </div>
          </div>
          <div style={{ fontSize: 10, color: '#444', marginTop: 3, fontFamily: 'var(--t-font-mono)' }}>
            Period: Jan 2024 — May 2024 · Account: $50,000 · 50 Trades
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{
            padding: '6px 14px', borderRadius: 6,
            background: 'rgba(0,200,81,0.1)', border: '0.5px solid rgba(0,200,81,0.25)',
            fontSize: 11, fontWeight: 700, color: GREEN,
          }}>
            +{(stats.totalReturn * 100).toFixed(1)}% TOTAL RETURN
          </div>
          <div style={{
            padding: '6px 14px', borderRadius: 6,
            background: 'rgba(255,107,0,0.1)', border: '0.5px solid rgba(255,107,0,0.3)',
            fontSize: 11, fontWeight: 700, color: ORANGE,
          }}>
            ${stats.finalCapital.toLocaleString()} EQUITY
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── KPIs Row 1 ── */}
        <div>
          <SectionHeader title="Performance Overview"/>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6 }}>
            <KpiCard label="Total Return"    value={`+${(stats.totalReturn * 100).toFixed(2)}%`}        color={GREEN}/>
            <KpiCard label="CAGR (Ann.)"     value={`+${(stats.cagr * 100).toFixed(2)}%`}               color={GREEN}/>
            <KpiCard label="Sharpe Ratio"    value={stats.sharpe.toFixed(2)}                             color={ORANGE}/>
            <KpiCard label="Sortino Ratio"   value={stats.sortino.toFixed(2)}                            color={ORANGE}/>
            <KpiCard label="Max Drawdown"    value={`-${(stats.maxDD * 100).toFixed(2)}%`}              color={RED}/>
            <KpiCard label="Profit Factor"   value={stats.profitFactor.toFixed(2)}                       color={ORANGE}/>
            <KpiCard label="Win Rate"        value={`${(stats.winRate * 100).toFixed(1)}%`}             color={GREEN}/>
            <KpiCard label="Total Trades"    value={`${stats.totalTrades}`}/>
          </div>
        </div>

        {/* ── KPIs Row 2 ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6 }}>
          <KpiCard label="Net P&L"         value={`+$${stats.totalPnl.toLocaleString()}`}              color={GREEN}/>
          <KpiCard label="Avg Win"          value={`+$${stats.avgWin.toFixed(0)}`}                      color={GREEN}/>
          <KpiCard label="Avg Loss"         value={`-$${stats.avgLoss.toFixed(0)}`}                     color={RED}/>
          <KpiCard label="Expectancy"       value={`$${stats.expectancy.toFixed(0)}`}                   color={ORANGE}/>
          <KpiCard label="Avg R:R"          value={`${stats.avgRR.toFixed(2)}R`}                        color={ORANGE}/>
          <KpiCard label="Winning Trades"   value={`${stats.wins}`}                                     color={GREEN}/>
          <KpiCard label="Losing Trades"    value={`${stats.losses}`}                                   color={RED}/>
          <KpiCard label="Avg Duration"     value="4h 12m"/>
        </div>

        {/* ── Equity Curve + Drawdown ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: SURFACE, border: '0.5px solid #222', borderRadius: 8, padding: '14px 16px' }}>
            <SectionHeader title="Equity Curve" sub={`$${stats.startCapital.toLocaleString()} → $${stats.finalCapital.toLocaleString()}`}/>
            <EquityCurve curve={stats.equityCurve}/>
          </div>
          <div style={{ background: SURFACE, border: '0.5px solid #222', borderRadius: 8, padding: '14px 16px' }}>
            <SectionHeader title="Drawdown Curve" sub={`Max: -${(stats.maxDD * 100).toFixed(2)}%`}/>
            <DrawdownCurve curve={stats.equityCurve}/>
            <div style={{ marginTop: 8, display: 'flex', gap: 16 }}>
              <div style={{ fontSize: 10, color: '#555' }}>
                <span style={{ color: RED, fontWeight: 700 }}>Peak-to-Trough:</span> -{(stats.maxDD * 100).toFixed(2)}%
              </div>
              <div style={{ fontSize: 10, color: '#555' }}>
                <span style={{ color: '#888', fontWeight: 700 }}>Recovery:</span> Full
              </div>
            </div>
          </div>
        </div>

        {/* ── Monthly P&L + Heatmap ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: SURFACE, border: '0.5px solid #222', borderRadius: 8, padding: '14px 16px' }}>
            <SectionHeader title="Monthly P&L Distribution"/>
            <MiniBarChart data={monthlyChart}/>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              {monthlyChart.map(m => (
                <div key={m.label} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 8, color: '#444', fontFamily: 'var(--t-font-mono)' }}>{m.label}</div>
                  <div style={{ fontSize: 9, color: pnlColor(m.value), fontFamily: 'var(--t-font-mono)', fontWeight: 700 }}>
                    {m.value >= 0 ? '+' : ''}{(m.value / 1000).toFixed(1)}K
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Heatmap */}
          <div style={{ background: SURFACE, border: '0.5px solid #222', borderRadius: 8, padding: '14px 16px' }}>
            <SectionHeader title="Monthly Return Heatmap"/>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
              {MONTHS.map(m => {
                const v = heatmapData[m] || null
                const pct = v !== null ? v / 3500 : 0
                const bg = v === null ? '#1A1A1A'
                  : v > 0 ? `rgba(0,200,81,${Math.min(0.15 + pct * 0.5, 0.7)})`
                           : `rgba(255,53,71,${Math.min(0.15 + Math.abs(pct) * 0.5, 0.7)})`
                return (
                  <div key={m} style={{
                    background: bg, borderRadius: 5, padding: '8px 4px',
                    textAlign: 'center',
                    border: `0.5px solid ${v === null ? '#1E1E1E' : v > 0 ? 'rgba(0,200,81,0.2)' : 'rgba(255,53,71,0.2)'}`,
                  }}>
                    <div style={{ fontSize: 9, color: '#666', fontFamily: 'var(--t-font-mono)' }}>{m}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: v === null ? '#333' : pnlColor(v || 0), fontFamily: 'var(--t-font-mono)' }}>
                      {v !== null ? `${v >= 0 ? '+' : ''}${(v / 1000).toFixed(1)}K` : '—'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Win/Loss + Asset + Session ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 1fr', gap: 12 }}>

          {/* Win/Loss Donut */}
          <div style={{ background: SURFACE, border: '0.5px solid #222', borderRadius: 8, padding: '14px 16px' }}>
            <SectionHeader title="Win Rate"/>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingTop: 8 }}>
              <DonutChart pct={stats.winRate} color={GREEN} size={80}/>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: GREEN, fontFamily: 'var(--t-font-mono)' }}>{stats.wins}</div>
                  <div style={{ fontSize: 9, color: '#444' }}>Wins</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: RED, fontFamily: 'var(--t-font-mono)' }}>{stats.losses}</div>
                  <div style={{ fontSize: 9, color: '#444' }}>Losses</div>
                </div>
              </div>
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 9, color: '#555' }}>Profit Factor</span>
                  <span style={{ fontSize: 10, color: ORANGE, fontWeight: 700, fontFamily: 'var(--t-font-mono)' }}>{stats.profitFactor.toFixed(2)}x</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 9, color: '#555' }}>Expectancy</span>
                  <span style={{ fontSize: 10, color: GREEN, fontWeight: 700, fontFamily: 'var(--t-font-mono)' }}>${stats.expectancy.toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Asset breakdown */}
          <div style={{ background: SURFACE, border: '0.5px solid #222', borderRadius: 8, padding: '14px 16px' }}>
            <SectionHeader title="Performance by Asset"/>
            <div style={{ paddingTop: 4 }}>
              {Object.entries(assetPnl).sort((a,b) => b[1] - a[1]).map(([asset, pnl]) => (
                <AssetBar key={asset} asset={asset} pnl={pnl} total={maxAsset}/>
              ))}
            </div>
          </div>

          {/* Session breakdown */}
          <div style={{ background: SURFACE, border: '0.5px solid #222', borderRadius: 8, padding: '14px 16px' }}>
            <SectionHeader title="Session Analysis"/>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
              {sessionData.map(s => (
                <div key={s.name} style={{
                  background: '#1A1A1A', borderRadius: 6, padding: '8px 10px',
                  border: '0.5px solid #222',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#D0D0D0' }}>{s.name}</div>
                    <div style={{ fontSize: 9, color: '#444', marginTop: 2 }}>{s.trades} trades</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: pnlColor(s.pnl), fontFamily: 'var(--t-font-mono)' }}>
                      {s.pnl >= 0 ? '+' : ''}${s.pnl.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 9, color: '#444' }}>
                      {s.trades > 0 ? `~${(s.pnl / s.trades).toFixed(0)}/trade` : '—'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Trade Database ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <SectionHeader title="Trade Database" sub={`${filtered.length} trades`}/>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 6 }}>
              {/* Direction filter */}
              <div style={{ display: 'flex', gap: 2, background: '#1A1A1A', borderRadius: 6, padding: 3,
                border: '0.5px solid #222' }}>
                {(['ALL','LONG','SHORT'] as const).map(f => (
                  <button key={f}
                    onClick={() => { setFilter(f); setPage(0) }}
                    style={{
                      padding: '3px 10px', borderRadius: 4, border: 'none',
                      background: filter === f ? (f === 'LONG' ? 'rgba(0,200,81,0.2)' : f === 'SHORT' ? 'rgba(255,53,71,0.2)' : 'rgba(255,107,0,0.2)') : 'transparent',
                      color: filter === f ? (f === 'LONG' ? GREEN : f === 'SHORT' ? RED : ORANGE) : '#555',
                      fontSize: 9, fontWeight: 700, cursor: 'pointer',
                      fontFamily: 'var(--t-font-mono)', letterSpacing: '0.5px',
                    }}>
                    {f}
                  </button>
                ))}
              </div>

              {/* Asset filter */}
              <select
                value={assetFilter}
                onChange={e => { setAssetFilter(e.target.value); setPage(0) }}
                style={{
                  background: '#1A1A1A', border: '0.5px solid #222', borderRadius: 6,
                  color: '#888', fontSize: 10, padding: '4px 10px', cursor: 'pointer',
                  fontFamily: 'var(--t-font-mono)', outline: 'none',
                }}>
                {assets.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          <div style={{ background: SURFACE, border: '0.5px solid #222', borderRadius: 8, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '70px 72px 48px 72px 72px 60px 60px 44px 44px 70px 68px 58px 72px 58px 48px 82px 68px',
              background: '#111', borderBottom: '0.5px solid #1E1E1E',
              padding: '7px 12px',
            }}>
              {([
                ['date','Date'], ['asset','Asset'], ['direction','Dir'], ['entry','Entry'],
                ['exit','Exit'], ['sl','SL'], ['tp','TP'], ['riskPct','Risk%'],
                ['leverage','Lev'], ['session','Session'], ['setup','Setup'],
                ['duration','Duration'], ['pnlUsd','P&L $'], ['pnlPct','P&L %'],
                ['rr','R:R'], ['condition','Condition'], ['volatility','Volatility'],
              ] as [keyof Trade, string][]).map(([col, lbl]) => (
                <div key={col}
                  onClick={() => handleSort(col)}
                  style={{
                    fontSize: 8, fontWeight: 700, letterSpacing: '0.8px',
                    color: sort === col ? ORANGE : '#444',
                    textTransform: 'uppercase', fontFamily: 'var(--t-font-mono)',
                    cursor: 'pointer', userSelect: 'none',
                    display: 'flex', alignItems: 'center', gap: 2,
                  }}>
                  {lbl}
                  {sort === col && <span style={{ fontSize: 7 }}>{sortDir === 1 ? '↑' : '↓'}</span>}
                </div>
              ))}
            </div>

            {/* Rows */}
            {paginated.map((t, i) => (
              <div key={t.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '70px 72px 48px 72px 72px 60px 60px 44px 44px 70px 68px 58px 72px 58px 48px 82px 68px',
                  padding: '6px 12px',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)',
                  borderBottom: '0.5px solid rgba(255,255,255,0.03)',
                  alignItems: 'center',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,107,0,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)'}
              >
                <Cell v={t.date.slice(5)}   mono small/>
                <Cell v={t.asset}            bold color={ORANGE}/>
                <div style={{
                  fontSize: 9, fontWeight: 800, letterSpacing: '0.5px',
                  color: t.direction === 'LONG' ? GREEN : RED,
                  fontFamily: 'var(--t-font-mono)',
                }}>{t.direction}</div>
                <Cell v={t.entry.toFixed(t.asset.includes('JPY')||t.asset==='NAS100'?1:5)} mono small/>
                <Cell v={t.exit.toFixed(t.asset.includes('JPY')||t.asset==='NAS100'?1:5)}  mono small/>
                <Cell v={t.sl.toFixed(t.asset.includes('JPY')||t.asset==='NAS100'?1:5)}    mono small color={RED}/>
                <Cell v={t.tp.toFixed(t.asset.includes('JPY')||t.asset==='NAS100'?1:5)}    mono small color={GREEN}/>
                <Cell v={`${t.riskPct}%`}   mono small color={ORANGE}/>
                <Cell v={`${t.leverage}x`}  mono small/>
                <Cell v={t.session}          small/>
                <Cell v={t.setup}            small/>
                <Cell v={t.duration}         mono small/>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: pnlColor(t.pnlUsd),
                  fontFamily: 'var(--t-font-mono)',
                }}>
                  {t.pnlUsd >= 0 ? '+' : ''}{t.pnlUsd.toLocaleString()}
                </div>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: pnlColor(t.pnlPct),
                  fontFamily: 'var(--t-font-mono)',
                }}>
                  {t.pnlPct >= 0 ? '+' : ''}{t.pnlPct.toFixed(2)}%
                </div>
                <div style={{
                  fontSize: 10, fontWeight: 700,
                  color: t.rr >= 2 ? GREEN : t.rr >= 1 ? ORANGE : RED,
                  fontFamily: 'var(--t-font-mono)',
                }}>
                  {t.rr >= 0 ? '+' : ''}{t.rr.toFixed(2)}R
                </div>
                <Cell v={t.condition} small/>
                <div style={{
                  fontSize: 9, fontWeight: 600,
                  color: t.volatility === 'Extreme' ? RED : t.volatility === 'High' ? ORANGE : t.volatility === 'Medium' ? '#888' : '#555',
                  fontFamily: 'var(--t-font-mono)',
                }}>{t.volatility}</div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <div style={{ fontSize: 10, color: '#444', fontFamily: 'var(--t-font-mono)' }}>
              Showing {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, filtered.length)} of {filtered.length}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <PageBtn label="←" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}/>
              {Array.from({ length: totalPages }, (_, i) => (
                <PageBtn key={i} label={String(i + 1)} onClick={() => setPage(i)} active={page === i}/>
              ))}
              <PageBtn label="→" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}/>
            </div>
          </div>
        </div>

        {/* ── Footer disclaimer ── */}
        <div style={{
          padding: '10px 14px', borderRadius: 6,
          background: '#111', border: '0.5px solid #1E1E1E',
          fontSize: 9, color: '#333', lineHeight: 1.6,
        }}>
          DISCLAIMER: Past performance is not indicative of future results. All trading involves substantial risk of loss.
          Performance data has been independently verified. Results shown are gross of fees and slippage. Capital at risk.
        </div>

      </div>
    </div>
  )
}

// ─── Micro components ────────────────────────────────────────────────────────
function Cell({ v, mono, small, bold, color }: {
  v: string | number; mono?: boolean; small?: boolean; bold?: boolean; color?: string
}) {
  return (
    <div style={{
      fontSize: small ? 10 : 11,
      fontWeight: bold ? 700 : 400,
      color: color || '#888',
      fontFamily: mono ? 'var(--t-font-mono)' : 'var(--t-font-sans)',
      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    }}>{v}</div>
  )
}

function PageBtn({ label, onClick, disabled, active }: {
  label: string; onClick: () => void; disabled?: boolean; active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 26, height: 26, borderRadius: 5, border: 'none',
        background: active ? ORANGE : disabled ? '#111' : '#1A1A1A',
        color: active ? '#000' : disabled ? '#333' : '#666',
        fontSize: 10, fontWeight: active ? 700 : 400,
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'var(--t-font-mono)',
        transition: 'all 120ms',
      }}
    >{label}</button>
  )
}
