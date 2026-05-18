'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

type Pair = 'EUR/USD'|'GBP/USD'|'USD/JPY'|'USD/CAD'|'AUD/USD'|'NZD/USD'|'USD/CHF'|'XAU/USD'|'AUD/JPY'|'EUR/GBP'

interface SentimentData {
  pair: Pair; longPct: number; shortPct: number
  longVol: number; shortVol: number; longPos: number; shortPos: number
  bias: 'bullish'|'bearish'|'neutral'; change24h: number
}
interface SeasonalBar { month: number; label: string; avg: number; positive: number; bullish: boolean }
interface WeekdayBar  { day: string; avg: number; bullish: boolean }

// ── Data ──────────────────────────────────────────────────────────────────────
const PAIRS: Pair[] = ['EUR/USD','GBP/USD','USD/JPY','USD/CAD','AUD/USD','NZD/USD','USD/CHF','XAU/USD','AUD/JPY','EUR/GBP']
const MONTH_LABELS = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc']
const NOW_MONTH = new Date().getMonth()

const SENTIMENT_FALLBACK: SentimentData[] = [
  { pair:'EUR/USD', longPct:66, shortPct:34, longVol:2840, shortVol:1460, longPos:18420, shortPos:9480, bias:'bullish', change24h:+3.2 },
  { pair:'GBP/USD', longPct:72, shortPct:28, longVol:1920, shortVol:748,  longPos:12300, shortPos:4800, bias:'bullish', change24h:+1.8 },
  { pair:'USD/JPY', longPct:29, shortPct:71, longVol:880,  shortVol:2150, longPos:5640,  shortPos:13800, bias:'bearish', change24h:-2.4 },
  { pair:'USD/CAD', longPct:45, shortPct:55, longVol:1100, shortVol:1340, longPos:7200,  shortPos:8760, bias:'bearish', change24h:-0.8 },
  { pair:'AUD/USD', longPct:58, shortPct:42, longVol:960,  shortVol:695,  longPos:6180,  shortPos:4480, bias:'bullish', change24h:+0.5 },
  { pair:'NZD/USD', longPct:61, shortPct:39, longVol:420,  shortVol:268,  longPos:2700,  shortPos:1720, bias:'bullish', change24h:+1.1 },
  { pair:'USD/CHF', longPct:38, shortPct:62, longVol:520,  shortVol:850,  longPos:3340,  shortPos:5460, bias:'bearish', change24h:-1.6 },
  { pair:'XAU/USD', longPct:71, shortPct:29, longVol:3200, shortVol:1310, longPos:20600, shortPos:8420, bias:'bullish', change24h:+2.9 },
  { pair:'AUD/JPY', longPct:33, shortPct:67, longVol:321,  shortVol:157,  longPos:915,   shortPos:1540, bias:'bearish', change24h:-1.2 },
  { pair:'EUR/GBP', longPct:55, shortPct:45, longVol:680,  shortVol:556,  longPos:4380,  shortPos:3580, bias:'bullish', change24h:+0.7 },
]

const PATTERNS: Record<string,number[]> = {
  'EUR/USD': [0.4,-0.8, 0.2, 0.6,-1.2,-0.4, 0.8,-0.6,-1.1, 0.9, 0.3,-0.5],
  'GBP/USD': [0.3,-0.5, 0.4, 0.8,-0.9,-0.3, 0.6,-0.8,-0.7, 0.7, 0.5,-0.4],
  'USD/JPY': [-0.3,0.6,-0.2,-0.5, 0.9, 0.4,-0.7, 0.5, 0.8,-0.6,-0.4, 0.3],
  'USD/CAD': [0.6,-0.3,-0.5,-0.8, 0.4, 0.7,-0.4, 0.3, 0.5,-0.7, 0.2, 0.8],
  'AUD/USD': [-0.5,0.7, 0.3, 0.5,-0.8,-1.1, 0.4,-0.3, 0.6, 0.8,-0.4,-0.6],
  'NZD/USD': [-0.4,0.5, 0.2, 0.4,-0.7,-0.9, 0.3,-0.2, 0.5, 0.7,-0.3,-0.5],
  'USD/CHF': [0.2,-0.4, 0.1,-0.3, 0.6, 0.3,-0.5, 0.4, 0.7,-0.5,-0.2, 0.3],
  'XAU/USD': [1.2, 0.4,-0.8, 0.3,-0.5,-1.4, 0.6, 1.1, 0.8,-0.3, 0.7, 1.5],
  'AUD/JPY': [-0.6,0.8, 0.4, 0.6,-1.0,-1.3, 0.5,-0.4, 0.7, 0.9,-0.5,-0.7],
  'EUR/GBP': [0.2,-0.3, 0.1, 0.4,-0.6,-0.2, 0.5,-0.4,-0.5, 0.3, 0.4,-0.2],
}
const POS_RATES: Record<string,number[]> = {
  'EUR/USD': [52,42,50,55,38,45,58,43,41,60,52,46],
  'GBP/USD': [55,44,52,58,40,46,56,42,43,58,54,47],
  'USD/JPY': [44,58,47,42,61,55,40,57,60,43,46,55],
  'USD/CAD': [58,46,43,40,54,60,45,52,57,41,50,62],
  'AUD/USD': [43,59,53,56,39,33,54,46,57,62,45,41],
  'NZD/USD': [44,57,52,55,40,35,53,47,56,60,46,42],
  'USD/CHF': [53,45,51,46,58,54,43,55,61,44,48,54],
  'XAU/USD': [65,54,43,52,46,38,55,62,59,47,57,68],
  'AUD/JPY': [41,60,55,58,37,32,53,45,58,63,44,40],
  'EUR/GBP': [50,46,52,54,43,47,55,44,45,56,53,48],
}
const WEEKDAY_PATTERNS: Record<string,number[]> = {
  'EUR/USD': [0.021,-0.018, 0.004,-0.012,-0.015],
  'GBP/USD': [0.018,-0.022, 0.006,-0.014,-0.018],
  'USD/JPY': [-0.015, 0.019,-0.003, 0.011, 0.013],
  'USD/CAD': [0.014,-0.010,-0.008, 0.009,-0.012],
  'AUD/USD': [-0.012, 0.016, 0.005,-0.009,-0.011],
  'NZD/USD': [-0.010, 0.014, 0.004,-0.008,-0.010],
  'USD/CHF': [0.008,-0.012, 0.003,-0.007, 0.010],
  'XAU/USD': [0.035,-0.025, 0.012,-0.018,-0.022],
  'AUD/JPY': [-0.018, 0.022, 0.007,-0.013,-0.016],
  'EUR/GBP': [0.006,-0.008, 0.003,-0.005,-0.007],
}

function computeSeasonality(pair: string, years: 20|10|5): SeasonalBar[] {
  const scale = years===10?0.9:years===5?0.8:1
  const base = PATTERNS[pair]||PATTERNS['EUR/USD']
  const pos  = POS_RATES[pair]||POS_RATES['EUR/USD']
  return base.map((avg,i)=>({ month:i, label:MONTH_LABELS[i], avg:parseFloat((avg*scale).toFixed(2)), positive:pos[i], bullish:avg>0 }))
}
function computeWeekdays(pair: string): WeekdayBar[] {
  const days = ['Lun','Mar','Mer','Jeu','Ven']
  const base = WEEKDAY_PATTERNS[pair]||WEEKDAY_PATTERNS['EUR/USD']
  return base.map((avg,i)=>({ day:days[i], avg:parseFloat((avg*100).toFixed(3)), bullish:avg>0 }))
}

// ── Seasonax-style line chart (trend over year) ───────────────────────────────
function SeasonalTrendLine({ data, pair, years }: { data: SeasonalBar[]; pair: string; years: number }) {
  // Build cumulative line from monthly returns (indexed to 100)
  const points: number[] = [100]
  data.forEach(b => points.push(parseFloat((points[points.length-1]*(1+b.avg/100)).toFixed(4))))
  const allVals = points
  const minV = Math.min(...allVals); const maxV = Math.max(...allVals)
  const range = maxV - minV || 0.01
  const W = 700; const H = 220; const PAD = 32

  const x = (i: number) => PAD + (i/(points.length-1))*(W-2*PAD)
  const y = (v: number) => H - PAD - ((v-minV)/range)*(H-2*PAD)

  const path = points.map((v,i)=>`${i===0?'M':'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const area = path + ` L${x(points.length-1).toFixed(1)},${H-PAD} L${PAD},${H-PAD} Z`
  const nowX = x(NOW_MONTH+1)

  return (
    <div style={{padding:'0 4px 8px'}}>
      <div style={{fontSize:11,fontWeight:600,color:'#8a9db5',marginBottom:8,textAlign:'center' as const,letterSpacing:'.3px'}}>
        Seasonal Trend of {pair} Over {years} Years
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:H,display:'block'}}>
        <defs>
          <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25"/>
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.02"/>
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0,0.25,0.5,0.75,1].map(p=>{
          const yg = PAD + p*(H-2*PAD)
          const val = (maxV - p*range).toFixed(2)
          return <g key={p}>
            <line x1={PAD} y1={yg} x2={W-PAD} y2={yg} stroke="rgba(255,255,255,.05)" strokeWidth="1"/>
            <text x={PAD-4} y={yg+4} fontSize="8" fill="#2d3f50" textAnchor="end">{val}</text>
          </g>
        })}
        {/* Month dividers */}
        {data.map((_,i)=>{
          const xm = x(i+0.5)
          return <line key={i} x1={xm} y1={PAD} x2={xm} y2={H-PAD} stroke="rgba(255,255,255,.04)" strokeWidth="1"/>
        })}
        {/* Area fill */}
        <path d={area} fill="url(#area-grad)"/>
        {/* Line */}
        <path d={path} fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        {/* Current month marker */}
        <line x1={nowX} y1={PAD} x2={nowX} y2={H-PAD} stroke="rgba(240,180,41,.5)" strokeWidth="1.5" strokeDasharray="4 3"/>
        <text x={nowX} y={PAD-4} fontSize="8" fill="#f0b429" textAnchor="middle">Maintenant</text>
        {/* Month labels */}
        {data.map((b,i)=>(
          <text key={i} x={x(i+0.5)} y={H-6} fontSize="9" fill={i===NOW_MONTH?'#f0b429':'#3d5060'} textAnchor="middle" fontWeight={i===NOW_MONTH?'700':'400'}>{b.label}</text>
        ))}
      </svg>
    </div>
  )
}

// ── Monthly bars ──────────────────────────────────────────────────────────────
function MonthlyBars({ data }: { data: SeasonalBar[] }) {
  const maxAbs = Math.max(...data.map(d=>Math.abs(d.avg)), 0.01)
  const H = 80; const BAR_W = 28; const W = data.length*(BAR_W+4)+20; const zero = H/2

  return (
    <div>
      <div style={{fontSize:10,fontWeight:600,color:'#8a9db5',marginBottom:6,textAlign:'center' as const}}>Average Return by Month (%)</div>
      <svg viewBox={`0 0 ${W} ${H+20}`} style={{width:'100%',height:H+20,display:'block'}}>
        {/* Zero line */}
        <line x1="0" y1={zero} x2={W} y2={zero} stroke="rgba(255,255,255,.12)" strokeWidth="1"/>
        {data.map((bar,i)=>{
          const barH = (Math.abs(bar.avg)/maxAbs)*(H/2-4)
          const x = 10 + i*(BAR_W+4)
          const y = bar.bullish ? zero-barH : zero
          const isNow = i===NOW_MONTH
          return (
            <g key={i}>
              <rect x={x} y={y} width={BAR_W} height={Math.max(barH,2)} rx="2"
                fill={isNow?'#f0b429':bar.bullish?'#38bdf8':'#f87171'} opacity={isNow?1:0.8}/>
              <text x={x+BAR_W/2} y={H+14} fontSize="8" fill={isNow?'#f0b429':'#3d5060'} textAnchor="middle" fontWeight={isNow?'700':'400'}>{bar.label}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── Weekday bars ──────────────────────────────────────────────────────────────
function WeekdayBars({ data }: { data: WeekdayBar[] }) {
  const maxAbs = Math.max(...data.map(d=>Math.abs(d.avg)), 0.001)
  const H = 80; const BAR_W = 48; const W = data.length*(BAR_W+8)+20; const zero = H/2

  return (
    <div>
      <div style={{fontSize:10,fontWeight:600,color:'#8a9db5',marginBottom:6,textAlign:'center' as const}}>Average Return by Weekday (%)</div>
      <svg viewBox={`0 0 ${W} ${H+20}`} style={{width:'100%',height:H+20,display:'block'}}>
        <line x1="0" y1={zero} x2={W} y2={zero} stroke="rgba(255,255,255,.12)" strokeWidth="1"/>
        {data.map((bar,i)=>{
          const barH = (Math.abs(bar.avg)/maxAbs)*(H/2-4)
          const x = 10 + i*(BAR_W+8)
          const y = bar.bullish ? zero-barH : zero
          return (
            <g key={i}>
              <rect x={x} y={y} width={BAR_W} height={Math.max(barH,2)} rx="2"
                fill={bar.bullish?'#38bdf8':'#f87171'} opacity={0.85}/>
              <text x={x+BAR_W/2} y={H+14} fontSize="9" fill="#3d5060" textAnchor="middle">{bar.day}</text>
              <text x={x+BAR_W/2} y={bar.bullish?y-4:y+barH+10} fontSize="7" fill={bar.bullish?'#38bdf8':'#f87171'} textAnchor="middle">
                {bar.avg>0?'+':''}{bar.avg}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── Donut Chart ───────────────────────────────────────────────────────────────
function DonutChart({ longPct, shortPct }: { longPct: number; shortPct: number }) {
  const R = 48; const SW = 10; const CX = 65; const CY = 65
  const circ = 2 * Math.PI * R
  const gap = 0.03 * circ
  const longDash  = (longPct  / 100) * circ - gap
  const shortDash = (shortPct / 100) * circ - gap

  return (
    <div style={{display:'flex',flexDirection:'column' as const,alignItems:'center',gap:8}}>
      <svg width="130" height="130" viewBox="0 0 130 130">
        <defs>
          <filter id="dg"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="dr"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        {/* Track */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth={SW}/>
        {/* Short arc */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#ef4444" strokeWidth={SW} strokeLinecap="round"
          strokeDasharray={`${shortDash} ${circ - shortDash}`}
          strokeDashoffset={circ / 4} filter="url(#dr)"/>
        {/* Long arc — offset after short */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#22c55e" strokeWidth={SW} strokeLinecap="round"
          strokeDasharray={`${longDash} ${circ - longDash}`}
          strokeDashoffset={circ / 4 - (shortPct / 100) * circ} filter="url(#dg)"/>
        {/* Center */}
        <text x={CX} y={CY - 8}  textAnchor="middle" fontSize="11" fontWeight="700" fill="#22c55e" fontFamily="IBM Plex Mono,monospace">{longPct}%</text>
        <text x={CX} y={CY + 4}  textAnchor="middle" fontSize="8"  fill="#3d5060" fontFamily="IBM Plex Mono,monospace">Long</text>
        <text x={CX} y={CY + 18} textAnchor="middle" fontSize="11" fontWeight="700" fill="#ef4444" fontFamily="IBM Plex Mono,monospace">{shortPct}%</text>
      </svg>
      <div style={{display:'flex',gap:12}}>
        <div style={{display:'flex',alignItems:'center',gap:4}}>
          <span style={{width:7,height:7,borderRadius:'50%',background:'#22c55e',display:'inline-block',boxShadow:'0 0 4px rgba(34,197,94,.5)'}}/>
          <span style={{fontSize:9,color:'#5a7080'}}>Long</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:4}}>
          <span style={{width:7,height:7,borderRadius:'50%',background:'#ef4444',display:'inline-block',boxShadow:'0 0 4px rgba(239,68,68,.5)'}}/>
          <span style={{fontSize:9,color:'#5a7080'}}>Short</span>
        </div>
      </div>
    </div>
  )
}

// ── Gauge Chart ───────────────────────────────────────────────────────────────
function GaugeChart({ longPct, pair }: { longPct: number; pair: string }) {
  const CX = 150; const CY = 130; const R = 100; const SW = 14
  const score = longPct
  const label = score >= 70 ? 'Strong Buy' : score >= 55 ? 'Buy' : score >= 45 ? 'Neutral' : score >= 30 ? 'Sell' : 'Strong Sell'
  const labelColor = score >= 70 ? '#22c55e' : score >= 55 ? '#38bdf8' : score >= 45 ? '#f0b429' : score >= 30 ? '#f87171' : '#ef4444'
  const needleAngle = Math.PI - (score / 100) * Math.PI
  const nx = CX + (R - 18) * Math.cos(needleAngle)
  const ny = CY - (R - 18) * Math.sin(needleAngle)

  const seg = (s: number, e: number, color: string) => {
    const sa = (s * Math.PI) / 180; const ea = (e * Math.PI) / 180
    const x1 = CX + R * Math.cos(Math.PI - sa); const y1 = CY - R * Math.sin(Math.PI - sa)
    const x2 = CX + R * Math.cos(Math.PI - ea); const y2 = CY - R * Math.sin(Math.PI - ea)
    return <path d={`M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${R} ${R} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`} fill="none" stroke={color} strokeWidth={SW} strokeLinecap="round"/>
  }

  return (
    <div style={{display:'flex',flexDirection:'column' as const,alignItems:'center',gap:4}}>
      <svg width="300" height="165" viewBox="0 0 300 165">
        {/* Segments */}
        {seg(4,  38,  '#ef4444')}
        {seg(42, 76,  '#f87171')}
        {seg(80, 100, '#f0b429')}
        {seg(100,120, '#f0b429')}
        {seg(124,158, '#38bdf8')}
        {seg(162,176, '#22c55e')}
        {/* Track BG */}
        <path d={`M ${CX-R} ${CY} A ${R} ${R} 0 0 1 ${CX+R} ${CY}`} fill="none" stroke="rgba(255,255,255,.04)" strokeWidth={SW}/>
        {/* Segments on top */}
        {seg(4,  38,  '#ef4444')}
        {seg(42, 76,  '#f87171')}
        {seg(80, 100, '#f0b429')}
        {seg(100,120, '#f0b429')}
        {seg(124,158, '#38bdf8')}
        {seg(162,176, '#22c55e')}
        {/* Labels */}
        <text x="18"  y="128" fontSize="8" fill="#ef4444" textAnchor="middle">Strong</text>
        <text x="18"  y="138" fontSize="8" fill="#ef4444" textAnchor="middle">Sell</text>
        <text x="62"  y="72"  fontSize="8" fill="#f87171" textAnchor="middle">Sell</text>
        <text x="150" y="28"  fontSize="8" fill="#f0b429" textAnchor="middle">Neutral</text>
        <text x="238" y="72"  fontSize="8" fill="#38bdf8" textAnchor="middle">Buy</text>
        <text x="282" y="128" fontSize="8" fill="#22c55e" textAnchor="middle">Strong</text>
        <text x="282" y="138" fontSize="8" fill="#22c55e" textAnchor="middle">Buy</text>
        {/* Needle */}
        <line x1={CX} y1={CY} x2={nx.toFixed(1)} y2={ny.toFixed(1)} stroke={labelColor} strokeWidth="2" strokeLinecap="round" opacity="0.95"/>
        <circle cx={CX} cy={CY} r="4" fill={labelColor} opacity="0.9"/>
        {/* Label */}
        <text x={CX} y={CY + 20} textAnchor="middle" fontSize="13" fontWeight="700" fill={labelColor} fontFamily="IBM Plex Mono,monospace">{label}</text>
      </svg>
    </div>
  )
}

// ── Sentiment detail modal ────────────────────────────────────────────────────
function SentimentDetail({ data, onClose }: { data: SentimentData; onClose: ()=>void }) {
  const isBull = data.bias==='bullish'; const isBear = data.bias==='bearish'
  const bc = isBull?'#22c55e':isBear?'#ef4444':'#64748b'

  return (
    <div style={{position:'fixed' as const,inset:0,background:'rgba(0,0,0,.8)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(10px)'}}
      onClick={onClose}>
      <div style={{background:'#0a0e16',border:'1px solid rgba(255,255,255,.1)',borderRadius:16,padding:'28px 32px',maxWidth:700,width:'92%',boxShadow:'0 32px 100px rgba(0,0,0,.8)',maxHeight:'90vh',overflowY:'auto' as const}}
        onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <span style={{fontSize:24,fontWeight:800,color:'#f0f4f8',fontFamily:'IBM Plex Mono,monospace',letterSpacing:'-0.5px'}}>{data.pair}</span>
            <span style={{fontSize:10,fontWeight:700,padding:'4px 12px',borderRadius:5,background:`${bc}12`,color:bc,border:`1px solid ${bc}25`,letterSpacing:'.8px',textTransform:'uppercase' as const}}>
              {isBull?'▲ Majoritairement Long':isBear?'▼ Majoritairement Short':'→ Neutre'}
            </span>
          </div>
          <button onClick={onClose} style={{background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.08)',color:'#5a7080',cursor:'pointer',fontSize:14,lineHeight:1,width:30,height:30,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
        </div>

        {/* TABLE EN HAUT */}
        <div style={{marginBottom:24}}>
          <div style={{fontSize:11,fontWeight:700,color:'#8a9db5',marginBottom:10,letterSpacing:'1px',textTransform:'uppercase' as const}}>Mesures Actuelles</div>
          <div style={{borderRadius:8,overflow:'hidden',border:'1px solid rgba(255,255,255,.07)'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr',padding:'9px 18px',background:'rgba(255,255,255,.03)',borderBottom:'1px solid rgba(255,255,255,.06)'}}>
              {['Symbole','Action','Pourcentage','Volume','Positions'].map(h=>(
                <span key={h} style={{fontSize:9,fontWeight:700,color:'#3d5060',letterSpacing:'.8px',textTransform:'uppercase' as const,textAlign:'center' as const}}>{h}</span>
              ))}
            </div>
            {[
              { label:'Court', pct:data.shortPct, vol:data.shortVol, pos:data.shortPos, color:'#ef4444', bg:'rgba(239,68,68,.03)' },
              { label:'Long',  pct:data.longPct,  vol:data.longVol,  pos:data.longPos,  color:'#22c55e', bg:'rgba(34,197,94,.03)' },
            ].map((row,i)=>(
              <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr',padding:'13px 18px',background:row.bg,borderBottom:i===0?'0.5px solid rgba(255,255,255,.04)':'none',alignItems:'center'}}>
                <span style={{fontSize:12,fontWeight:700,color:'#c8d6e5',textAlign:'center' as const,fontFamily:'IBM Plex Mono,monospace'}}>{data.pair}</span>
                <span style={{fontSize:12,fontWeight:700,color:row.color,textAlign:'center' as const}}>{row.label}</span>
                <span style={{fontSize:16,fontWeight:800,color:row.color,textAlign:'center' as const,fontFamily:'IBM Plex Mono,monospace'}}>{row.pct} <span style={{fontSize:12}}>%</span></span>
                <span style={{fontSize:11,color:'#6a7d8f',textAlign:'center' as const,fontFamily:'IBM Plex Mono,monospace'}}>{row.vol.toLocaleString()} lots</span>
                <span style={{fontSize:11,color:'#6a7d8f',textAlign:'center' as const,fontFamily:'IBM Plex Mono,monospace'}}>{row.pos.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar */}
        <div style={{marginBottom:24}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
            <span style={{fontSize:11,fontWeight:700,color:'#22c55e'}}>Long {data.longPct}%</span>
            <span style={{fontSize:11,fontWeight:700,color:'#ef4444'}}>Short {data.shortPct}%</span>
          </div>
          <div style={{height:8,borderRadius:4,overflow:'hidden',background:'rgba(255,255,255,.05)',display:'flex'}}>
            <div style={{width:`${data.longPct}%`,background:'linear-gradient(90deg,#16a34a,#22c55e)',transition:'width 600ms ease'}}/>
            <div style={{width:`${data.shortPct}%`,background:'linear-gradient(90deg,#ef4444,#dc2626)',transition:'width 600ms ease'}}/>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',marginTop:4}}>
            <span style={{fontSize:9,color:'#3d5060'}}>{data.longPos.toLocaleString()} positions</span>
            <span style={{fontSize:9,color:'#3d5060'}}>{data.shortPos.toLocaleString()} positions</span>
          </div>
        </div>

        {/* DIAGRAMMES EN BAS */}
        <div style={{display:'grid',gridTemplateColumns:'140px 1fr',gap:24,alignItems:'center',padding:'20px',background:'rgba(255,255,255,.02)',borderRadius:10,border:'1px solid rgba(255,255,255,.06)'}}>
          <DonutChart longPct={data.longPct} shortPct={data.shortPct}/>
          <GaugeChart longPct={data.longPct} pair={data.pair}/>
        </div>

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginTop:16}}>
          {[['Total Long',`${data.longVol.toLocaleString()} lots`,'#22c55e'],['Total Short',`${data.shortVol.toLocaleString()} lots`,'#ef4444'],['Var 24h',`${data.change24h>0?'+':''}${data.change24h}%`,data.change24h>0?'#22c55e':'#ef4444']].map(([l,v,c])=>(
            <div key={l as string} style={{padding:'12px',borderRadius:7,background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.06)',textAlign:'center' as const}}>
              <div style={{fontSize:8,fontWeight:700,color:'#2d3f50',letterSpacing:'1px',marginBottom:5,textTransform:'uppercase' as const}}>{l}</div>
              <div style={{fontSize:15,fontWeight:800,color:c as string,fontFamily:'IBM Plex Mono,monospace'}}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{marginTop:16,fontSize:8,color:'#1e2a35',textAlign:'center' as const,letterSpacing:'.8px'}}>SOURCE: MYFXBOOK COMMUNITY OUTLOOK • DONNÉES EN TEMPS RÉEL</div>
      </div>
    </div>
  )
}


// ── Main ──────────────────────────────────────────────────────────────────────
export function SentimentPanel() {
  const [sentiment, setSentiment]     = useState<SentimentData[]>(SENTIMENT_FALLBACK)
  const [selectedPair, setSelectedPair] = useState<Pair>('EUR/USD')
  const [yearRange, setYearRange]     = useState<20|10|5>(10)
  const [seasonal, setSeasonal]       = useState<SeasonalBar[]>([])
  const [weekdays, setWeekdays]       = useState<WeekdayBar[]>([])
  const [refreshing, setRefreshing]   = useState(false)
  const [lastUpdate, setLastUpdate]   = useState('')
  const [tab, setTab]                 = useState<'combined'|'sentiment'|'seasonality'>('combined')
  const [detailPair, setDetailPair]   = useState<SentimentData|null>(null)

  const fetchData = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/sentiment', { cache:'no-store' })
      const json = await res.json()
      if (json.ok && json.data?.length > 0) setSentiment(json.data)
      setLastUpdate(new Date().toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit', second:'2-digit' }))
    } catch { setSentiment(SENTIMENT_FALLBACK) }
    finally { setRefreshing(false) }
  }, [])

  useEffect(() => { fetchData(); const id = setInterval(fetchData, 60000); return () => clearInterval(id) }, [fetchData])
  useEffect(() => { setSeasonal(computeSeasonality(selectedPair, yearRange)); setWeekdays(computeWeekdays(selectedPair)) }, [selectedPair, yearRange])

  const sel = sentiment.find(s => s.pair === selectedPair) || sentiment[0]
  const curSeas = seasonal[NOW_MONTH]
  const biasC = sel?.bias==='bullish'?'#22c55e':sel?.bias==='bearish'?'#ef4444':'#64748b'

  const pill = (active: boolean, color = '#a78bfa') => ({
    padding:'4px 12px', borderRadius:20, fontSize:10, fontWeight:600 as const, cursor:'pointer' as const,
    border:`1px solid ${active?color+'55':'rgba(255,255,255,.07)'}`,
    background:active?color+'12':'transparent',
    color:active?color:'#3d5060', transition:'all 150ms', fontFamily:'inherit',
  })

  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',background:'#06080d',fontFamily:"'Inter',-apple-system,sans-serif",overflow:'hidden'}}>

      {/* Detail modal */}
      {detailPair && <SentimentDetail data={detailPair} onClose={() => setDetailPair(null)} />}

      {/* HEADER */}
      <div style={{flexShrink:0,background:'linear-gradient(180deg,rgba(13,18,28,.95) 0%,rgba(6,8,13,.95) 100%)',borderBottom:'1px solid rgba(255,255,255,.06)',padding:'20px 48px 0'}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:16}}>
          <div>
            <div style={{fontSize:11,fontWeight:600,letterSpacing:'2px',color:'#3d5060',textTransform:'uppercase' as const,marginBottom:3}}>Institutional Trading Desk</div>
            <h1 style={{fontSize:26,fontWeight:800,letterSpacing:'-0.8px',color:'#f0f4f8',margin:0,lineHeight:1.1}}>
              Sentiment <span style={{color:'#a78bfa'}}>&</span> Saisonnalité
            </h1>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            {refreshing && <span style={{fontSize:10,color:'#a78bfa',fontWeight:600,animation:'t-pulse 1s infinite'}}>● LIVE</span>}
            {lastUpdate && <span style={{fontSize:10,color:'#2d3f50'}}>Mis à jour {lastUpdate}</span>}
            <button onClick={fetchData} style={{padding:'5px 12px',borderRadius:5,fontSize:10,fontWeight:600,cursor:'pointer',border:'1px solid rgba(255,255,255,.1)',background:'rgba(255,255,255,.04)',color:'#8a9db5',fontFamily:'inherit'}}>↻ Refresh</button>
          </div>
        </div>
        {/* Tabs */}
        <div style={{display:'flex',gap:0,borderBottom:'1px solid rgba(255,255,255,.06)'}}>
          {([['combined','⚡ Vue combinée'],['sentiment','👥 Sentiment Retail'],['seasonality','📈 Saisonnalité']] as const).map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:'11px 24px',fontSize:12,fontWeight:tab===t?700:400,cursor:'pointer',border:'none',borderBottom:tab===t?'2px solid #a78bfa':'2px solid transparent',background:'transparent',color:tab===t?'#f0f4f8':'#4a5e72',transition:'all 150ms',fontFamily:'inherit',marginBottom:-1}}>{l}</button>
          ))}
        </div>
      </div>

      {/* VUE COMBINÉE */}
      {tab==='combined' && (
        <div style={{flex:1,display:'flex',minHeight:0,overflow:'hidden'}}>
          {/* Left: sentiment list */}
          <div style={{width:300,flexShrink:0,borderRight:'1px solid rgba(255,255,255,.06)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
            <div style={{padding:'8px 16px',borderBottom:'0.5px solid rgba(255,255,255,.05)',flexShrink:0}}>
              <span style={{fontSize:8,fontWeight:700,letterSpacing:'1.5px',color:'#2d3f50',textTransform:'uppercase' as const}}>Cliquez pour détails</span>
            </div>
            <div style={{flex:1,overflowY:'auto' as const}}>
              {sentiment.map(s => {
                const isBull=s.bias==='bullish'; const isBear=s.bias==='bearish'
                const bc=isBull?'#22c55e':isBear?'#ef4444':'#64748b'
                const isSelected=selectedPair===s.pair
                return (
                  <div key={s.pair} style={{padding:'10px 16px',borderBottom:'0.5px solid rgba(255,255,255,.04)',cursor:'pointer',background:isSelected?'rgba(167,139,250,.05)':'transparent',borderLeft:isSelected?'3px solid #a78bfa':'3px solid transparent',transition:'all 80ms'}}
                    onClick={()=>{ setSelectedPair(s.pair as Pair) }}
                    onDoubleClick={()=>setDetailPair(s)}>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:5}}>
                      <span style={{fontSize:11,fontWeight:700,color:'#f0f4f8',width:64,flexShrink:0,fontFamily:'IBM Plex Mono,monospace'}}>{s.pair}</span>
                      <span style={{fontSize:7,fontWeight:800,padding:'1px 5px',borderRadius:2,background:`${bc}15`,color:bc,border:`0.5px solid ${bc}33`,letterSpacing:'.5px'}}>
                        {isBull?'▲':isBear?'▼':'→'}
                      </span>
                      <div style={{flex:1}}/>
                      <span style={{fontSize:9,fontWeight:700,color:'#22c55e',fontFamily:'IBM Plex Mono,monospace'}}>{s.longPct}%</span>
                      <span style={{fontSize:7,color:'#2d3f50'}}>/</span>
                      <span style={{fontSize:9,fontWeight:700,color:'#ef4444',fontFamily:'IBM Plex Mono,monospace'}}>{s.shortPct}%</span>
                    </div>
                    <div style={{height:4,borderRadius:2,background:'rgba(255,255,255,.06)',overflow:'hidden',position:'relative' as const,marginBottom:3}}>
                      <div style={{position:'absolute' as const,left:0,top:0,height:'100%',width:`${s.longPct}%`,background:'rgba(34,197,94,.6)',borderRadius:'2px 0 0 2px'}}/>
                      <div style={{position:'absolute' as const,right:0,top:0,height:'100%',width:`${s.shortPct}%`,background:'rgba(239,68,68,.6)',borderRadius:'0 2px 2px 0'}}/>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between'}}>
                      <span style={{fontSize:7,color:'#2d3f50'}}>{s.longVol.toLocaleString()} lots L</span>
                      <button onClick={e=>{e.stopPropagation();setDetailPair(s)}} style={{fontSize:7,color:'#a78bfa',background:'transparent',border:'none',cursor:'pointer',padding:0}}>Voir détails →</button>
                      <span style={{fontSize:7,color:'#2d3f50'}}>{s.shortVol.toLocaleString()} lots S</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{padding:'4px 16px',borderTop:'0.5px solid rgba(255,255,255,.04)',flexShrink:0}}>
              <span style={{fontSize:7,color:'#1e2a35',letterSpacing:'.4px'}}>MYFXBOOK • REFRESH 60S • DBL-CLIC POUR DÉTAILS</span>
            </div>
          </div>

          {/* Right: seasonality */}
          <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
            {/* Pair selector + year range */}
            <div style={{padding:'10px 24px',borderBottom:'0.5px solid rgba(255,255,255,.05)',flexShrink:0,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap' as const,background:'rgba(255,255,255,.01)'}}>
              <span style={{fontSize:10,fontWeight:700,color:'#f0f4f8',fontFamily:'IBM Plex Mono,monospace'}}>{selectedPair}</span>
              {curSeas && (
                <span style={{fontSize:10,padding:'2px 8px',borderRadius:3,background:curSeas.bullish?'rgba(34,197,94,.1)':'rgba(239,68,68,.1)',color:curSeas.bullish?'#22c55e':'#ef4444',border:`0.5px solid ${curSeas.bullish?'rgba(34,197,94,.25)':'rgba(239,68,68,.25)'}`,fontWeight:600}}>
                  {MONTH_LABELS[NOW_MONTH]}: {curSeas.avg>0?'+':''}{curSeas.avg}% · {curSeas.positive}% pos
                </span>
              )}
              <div style={{flex:1}}/>
              {([20,10,5] as const).map(y=><button key={y} onClick={()=>setYearRange(y)} style={pill(yearRange===y)}>{y} ans</button>)}
            </div>

            <div style={{flex:1,overflowY:'auto' as const,padding:'12px 24px'}}>
              {/* Trend line chart */}
              <SeasonalTrendLine data={seasonal} pair={selectedPair} years={yearRange}/>

              {/* Monthly + Weekday side by side */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginTop:16,padding:'16px',background:'rgba(255,255,255,.02)',borderRadius:8,border:'0.5px solid rgba(255,255,255,.06)'}}>
                <MonthlyBars data={seasonal}/>
                <WeekdayBars data={weekdays}/>
              </div>

              {/* Monthly detail grid */}
              <div style={{marginTop:12,display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:5,paddingBottom:16}}>
                {seasonal.map((bar,i)=>(
                  <div key={i} style={{padding:'7px 8px',borderRadius:4,background:i===NOW_MONTH?'rgba(240,180,41,.06)':'rgba(255,255,255,.02)',border:`1px solid ${i===NOW_MONTH?'rgba(240,180,41,.2)':'rgba(255,255,255,.05)'}`}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                      <span style={{fontSize:9,fontWeight:700,color:i===NOW_MONTH?'#f0b429':'#8a9db5'}}>{bar.label}</span>
                      <span style={{fontSize:9,fontWeight:700,color:bar.bullish?'#22c55e':'#ef4444',fontFamily:'IBM Plex Mono,monospace'}}>{bar.avg>0?'+':''}{bar.avg}%</span>
                    </div>
                    <div style={{height:2,borderRadius:1,background:'rgba(255,255,255,.06)',overflow:'hidden',marginBottom:2}}>
                      <div style={{height:'100%',width:`${bar.positive}%`,background:bar.bullish?'rgba(34,197,94,.6)':'rgba(239,68,68,.6)',borderRadius:1}}/>
                    </div>
                    <span style={{fontSize:7,color:'#3d5060'}}>{bar.positive}% positif</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SENTIMENT SEUL */}
      {tab==='sentiment' && (
        <>
          <div style={{padding:'10px 48px',borderBottom:'0.5px solid rgba(255,255,255,.05)',flexShrink:0,background:'rgba(255,255,255,.01)'}}>
            <span style={{fontSize:9,fontWeight:700,letterSpacing:'1.5px',color:'#2d3f50',textTransform:'uppercase' as const}}>Myfxbook Community Outlook — Cliquez sur une paire pour voir le détail</span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'100px 80px 1fr 70px 70px 80px 80px',padding:'6px 48px',background:'rgba(0,0,0,.3)',borderBottom:'0.5px solid rgba(255,255,255,.04)',flexShrink:0}}>
            {['PAIRE','BIAIS','RATIO','LONG %','SHORT %','VOL LONG','VAR 24H'].map((h,i)=>(
              <span key={i} style={{fontSize:8,fontWeight:700,color:'#2d3f50',letterSpacing:'1px',textTransform:'uppercase' as const,textAlign:i>2?'right' as const:'left' as const}}>{h}</span>
            ))}
          </div>
          <div style={{flex:1,overflowY:'auto' as const}}>
            {sentiment.map(s => {
              const isBull=s.bias==='bullish'; const isBear=s.bias==='bearish'
              const bc=isBull?'#22c55e':isBear?'#ef4444':'#64748b'
              return (
                <div key={s.pair} onClick={()=>setDetailPair(s)} style={{display:'grid',gridTemplateColumns:'100px 80px 1fr 70px 70px 80px 80px',alignItems:'center',padding:'12px 48px',borderBottom:'0.5px solid rgba(255,255,255,.04)',borderLeft:`3px solid ${bc}33`,transition:'background 80ms',cursor:'pointer'}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.025)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <span style={{fontSize:12,fontWeight:700,color:'#f0f4f8',fontFamily:'IBM Plex Mono,monospace'}}>{s.pair}</span>
                  <span style={{fontSize:9,fontWeight:800,padding:'2px 7px',borderRadius:3,background:`${bc}15`,color:bc,border:`0.5px solid ${bc}33`,letterSpacing:'.5px',width:'fit-content'}}>{isBull?'▲ LONG':isBear?'▼ SHORT':'→'}</span>
                  <div style={{paddingRight:20}}>
                    <div style={{height:6,borderRadius:3,background:'rgba(255,255,255,.05)',overflow:'hidden',position:'relative' as const}}>
                      <div style={{position:'absolute' as const,left:0,top:0,height:'100%',width:`${s.longPct}%`,background:'rgba(34,197,94,.65)',borderRadius:'3px 0 0 3px'}}/>
                      <div style={{position:'absolute' as const,right:0,top:0,height:'100%',width:`${s.shortPct}%`,background:'rgba(239,68,68,.65)',borderRadius:'0 3px 3px 0'}}/>
                    </div>
                  </div>
                  <span style={{fontSize:13,fontWeight:700,color:'#22c55e',textAlign:'right' as const,fontFamily:'IBM Plex Mono,monospace'}}>{s.longPct}%</span>
                  <span style={{fontSize:13,fontWeight:700,color:'#ef4444',textAlign:'right' as const,fontFamily:'IBM Plex Mono,monospace'}}>{s.shortPct}%</span>
                  <span style={{fontSize:10,color:'#8a9db5',textAlign:'right' as const,fontFamily:'IBM Plex Mono,monospace'}}>{s.longVol.toLocaleString()}</span>
                  <span style={{fontSize:11,fontWeight:600,color:s.change24h>0?'#22c55e':'#ef4444',textAlign:'right' as const,fontFamily:'IBM Plex Mono,monospace'}}>{s.change24h>0?'+':''}{s.change24h}%</span>
                </div>
              )
            })}
          </div>
          <div style={{padding:'5px 48px',borderTop:'0.5px solid rgba(255,255,255,.04)',flexShrink:0,background:'rgba(0,0,0,.2)'}}>
            <span style={{fontSize:7,color:'#1e2a35',letterSpacing:'.4px'}}>MYFXBOOK COMMUNITY OUTLOOK • REFRESH AUTO 60S • CLIQUEZ SUR UNE PAIRE POUR LE DÉTAIL</span>
          </div>
        </>
      )}

      {/* SAISONNALITÉ SEULE */}
      {tab==='seasonality' && (
        <>
          <div style={{padding:'10px 48px',borderBottom:'0.5px solid rgba(255,255,255,.05)',flexShrink:0,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap' as const,background:'rgba(255,255,255,.01)'}}>
            {PAIRS.map(p=><button key={p} onClick={()=>setSelectedPair(p)} style={pill(selectedPair===p)}>{p}</button>)}
            <div style={{width:1,height:18,background:'rgba(255,255,255,.07)',margin:'0 6px'}}/>
            {([20,10,5] as const).map(y=><button key={y} onClick={()=>setYearRange(y)} style={pill(yearRange===y)}>{y} ans</button>)}
          </div>
          <div style={{flex:1,overflowY:'auto' as const,padding:'16px 48px'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
              <span style={{fontSize:15,fontWeight:700,color:'#f0f4f8',fontFamily:'IBM Plex Mono,monospace'}}>{selectedPair}</span>
              {curSeas && <span style={{fontSize:11,padding:'3px 10px',borderRadius:4,background:curSeas.bullish?'rgba(34,197,94,.1)':'rgba(239,68,68,.1)',color:curSeas.bullish?'#22c55e':'#ef4444',border:`0.5px solid ${curSeas.bullish?'rgba(34,197,94,.25)':'rgba(239,68,68,.25)'}`,fontWeight:600}}>
                {MONTH_LABELS[NOW_MONTH]}: {curSeas.avg>0?'+':''}{curSeas.avg}% · {curSeas.positive}% années positives
              </span>}
            </div>
            <SeasonalTrendLine data={seasonal} pair={selectedPair} years={yearRange}/>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginTop:16,padding:'16px',background:'rgba(255,255,255,.02)',borderRadius:8,border:'0.5px solid rgba(255,255,255,.06)'}}>
              <MonthlyBars data={seasonal}/>
              <WeekdayBars data={weekdays}/>
            </div>
            <div style={{marginTop:12,display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:6,paddingBottom:24}}>
              {seasonal.map((bar,i)=>(
                <div key={i} style={{padding:'10px',borderRadius:5,background:i===NOW_MONTH?'rgba(240,180,41,.06)':'rgba(255,255,255,.02)',border:`1px solid ${i===NOW_MONTH?'rgba(240,180,41,.2)':'rgba(255,255,255,.05)'}`}}>
                  <div style={{fontSize:10,fontWeight:700,color:i===NOW_MONTH?'#f0b429':'#8a9db5',marginBottom:4}}>{bar.label}</div>
                  <div style={{fontSize:15,fontWeight:800,color:bar.bullish?'#22c55e':'#ef4444',fontFamily:'IBM Plex Mono,monospace',marginBottom:3}}>{bar.avg>0?'+':''}{bar.avg}%</div>
                  <div style={{height:2,borderRadius:1,background:'rgba(255,255,255,.06)',overflow:'hidden',marginBottom:3}}>
                    <div style={{height:'100%',width:`${bar.positive}%`,background:bar.bullish?'#22c55e':'#ef4444',opacity:.6,borderRadius:1}}/>
                  </div>
                  <div style={{fontSize:8,color:'#4a5e72'}}>{bar.positive}% pos</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{padding:'5px 48px',borderTop:'0.5px solid rgba(255,255,255,.04)',flexShrink:0,background:'rgba(0,0,0,.2)'}}>
            <span style={{fontSize:7,color:'#1e2a35',letterSpacing:'.4px'}}>SAISONNALITÉ CALCULÉE SUR {yearRange} ANS · INSPIRÉ DE SEASONAX · PATTERNS HISTORIQUES FX</span>
          </div>
        </>
      )}
    </div>
  )
}
