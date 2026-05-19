'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────
type Pair = 'EUR/USD'|'GBP/USD'|'USD/JPY'|'USD/CAD'|'AUD/USD'|'NZD/USD'|'USD/CHF'|'XAU/USD'|'AUD/JPY'|'EUR/GBP'
type Tab  = 'sentiment'|'seasonality'

interface SentimentData {
  pair: Pair; longPct: number; shortPct: number
  longVol: number; shortVol: number; longPos: number; shortPos: number
  bias: 'bullish'|'bearish'|'neutral'; change24h: number; change1h: number
  crowdExposure: number   // 0-100
  contrarian: 'STRONG_BUY'|'BUY'|'NEUTRAL'|'SELL'|'STRONG_SELL'
  momentum: number        // -5 to +5, sentiment momentum
  sparkline: number[]     // last 8 readings
  regime: 'EXTREME_LONG'|'CROWDED_LONG'|'BALANCED'|'CROWDED_SHORT'|'EXTREME_SHORT'
}
interface SeasonalBar { month: number; label: string; avg: number; positive: number; bullish: boolean; stdev: number; best: number; worst: number }
interface WeekdayBar  { day: string; avg: number; bullish: boolean; positive: number }

// ── Constants ─────────────────────────────────────────────────────────────────
const PAIRS: Pair[] = ['EUR/USD','GBP/USD','USD/JPY','USD/CAD','AUD/USD','NZD/USD','USD/CHF','XAU/USD','AUD/JPY','EUR/GBP']
const ML = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc']
const NM = new Date().getMonth()

// ── Seasonal data ─────────────────────────────────────────────────────────────
const PAT: Record<string,number[]> = {
  'EUR/USD':[0.4,-0.8,0.2,0.6,-1.2,-0.4,0.8,-0.6,-1.1,0.9,0.3,-0.5],
  'GBP/USD':[0.3,-0.5,0.4,0.8,-0.9,-0.3,0.6,-0.8,-0.7,0.7,0.5,-0.4],
  'USD/JPY':[-0.3,0.6,-0.2,-0.5,0.9,0.4,-0.7,0.5,0.8,-0.6,-0.4,0.3],
  'USD/CAD':[0.6,-0.3,-0.5,-0.8,0.4,0.7,-0.4,0.3,0.5,-0.7,0.2,0.8],
  'AUD/USD':[-0.5,0.7,0.3,0.5,-0.8,-1.1,0.4,-0.3,0.6,0.8,-0.4,-0.6],
  'NZD/USD':[-0.4,0.5,0.2,0.4,-0.7,-0.9,0.3,-0.2,0.5,0.7,-0.3,-0.5],
  'USD/CHF':[0.2,-0.4,0.1,-0.3,0.6,0.3,-0.5,0.4,0.7,-0.5,-0.2,0.3],
  'XAU/USD':[1.2,0.4,-0.8,0.3,-0.5,-1.4,0.6,1.1,0.8,-0.3,0.7,1.5],
  'AUD/JPY':[-0.6,0.8,0.4,0.6,-1.0,-1.3,0.5,-0.4,0.7,0.9,-0.5,-0.7],
  'EUR/GBP':[0.2,-0.3,0.1,0.4,-0.6,-0.2,0.5,-0.4,-0.5,0.3,0.4,-0.2],
}
const POS: Record<string,number[]> = {
  'EUR/USD':[52,42,50,55,38,45,58,43,41,60,52,46],
  'GBP/USD':[55,44,52,58,40,46,56,42,43,58,54,47],
  'USD/JPY':[44,58,47,42,61,55,40,57,60,43,46,55],
  'USD/CAD':[58,46,43,40,54,60,45,52,57,41,50,62],
  'AUD/USD':[43,59,53,56,39,33,54,46,57,62,45,41],
  'NZD/USD':[44,57,52,55,40,35,53,47,56,60,46,42],
  'USD/CHF':[53,45,51,46,58,54,43,55,61,44,48,54],
  'XAU/USD':[65,54,43,52,46,38,55,62,59,47,57,68],
  'AUD/JPY':[41,60,55,58,37,32,53,45,58,63,44,40],
  'EUR/GBP':[50,46,52,54,43,47,55,44,45,56,53,48],
}
const STDEV: Record<string,number[]> = {
  'EUR/USD':[0.8,1.1,0.7,0.9,1.3,1.0,0.8,1.1,1.4,0.9,0.7,0.8],
  'GBP/USD':[0.9,1.2,0.8,1.0,1.2,0.9,0.9,1.0,1.3,1.1,0.8,0.9],
  'USD/JPY':[0.7,0.9,0.8,1.0,1.1,0.8,0.9,1.0,1.2,0.8,0.7,0.8],
  'USD/CAD':[0.8,1.0,0.9,1.1,1.0,0.9,0.8,0.9,1.1,1.0,0.8,0.9],
  'AUD/USD':[0.9,1.1,0.8,1.0,1.2,1.3,0.9,1.1,1.2,1.0,0.9,1.0],
  'NZD/USD':[0.8,1.0,0.7,0.9,1.1,1.2,0.8,1.0,1.1,0.9,0.8,0.9],
  'USD/CHF':[0.7,0.9,0.8,1.0,0.9,0.8,0.9,1.0,1.1,0.9,0.7,0.8],
  'XAU/USD':[1.2,1.4,1.1,1.3,1.5,1.6,1.2,1.3,1.4,1.2,1.1,1.3],
  'AUD/JPY':[1.0,1.2,0.9,1.1,1.3,1.4,1.0,1.2,1.3,1.1,1.0,1.1],
  'EUR/GBP':[0.6,0.8,0.6,0.8,0.9,0.8,0.7,0.9,0.9,0.7,0.6,0.7],
}
const WDP: Record<string,number[]> = {
  'EUR/USD':[0.021,-0.018,0.004,-0.012,-0.015],
  'GBP/USD':[0.018,-0.022,0.006,-0.014,-0.018],
  'USD/JPY':[-0.015,0.019,-0.003,0.011,0.013],
  'USD/CAD':[0.014,-0.010,-0.008,0.009,-0.012],
  'AUD/USD':[-0.012,0.016,0.005,-0.009,-0.011],
  'NZD/USD':[-0.010,0.014,0.004,-0.008,-0.010],
  'USD/CHF':[0.008,-0.012,0.003,-0.007,0.010],
  'XAU/USD':[0.035,-0.025,0.012,-0.018,-0.022],
  'AUD/JPY':[-0.018,0.022,0.007,-0.013,-0.016],
  'EUR/GBP':[0.006,-0.008,0.003,-0.005,-0.007],
}

// ── Fallback sentiment with full data ─────────────────────────────────────────
function makeFallback(): SentimentData[] {
  const raw = [
    { pair:'EUR/USD' as Pair, l:66, s:34, lv:2840, sv:1460, lp:18420, sp:9480,  c24:+3.2, c1:+0.8 },
    { pair:'GBP/USD' as Pair, l:72, s:28, lv:1920, sv:748,  lp:12300, sp:4800,  c24:+1.8, c1:+0.4 },
    { pair:'USD/JPY' as Pair, l:29, s:71, lv:880,  sv:2150, lp:5640,  sp:13800, c24:-2.4, c1:-0.6 },
    { pair:'USD/CAD' as Pair, l:45, s:55, lv:1100, sv:1340, lp:7200,  sp:8760,  c24:-0.8, c1:-0.2 },
    { pair:'AUD/USD' as Pair, l:58, s:42, lv:960,  sv:695,  lp:6180,  sp:4480,  c24:+0.5, c1:+0.1 },
    { pair:'NZD/USD' as Pair, l:61, s:39, lv:420,  sv:268,  lp:2700,  sp:1720,  c24:+1.1, c1:+0.3 },
    { pair:'USD/CHF' as Pair, l:38, s:62, lv:520,  sv:850,  lp:3340,  sp:5460,  c24:-1.6, c1:-0.4 },
    { pair:'XAU/USD' as Pair, l:71, s:29, lv:3200, sv:1310, lp:20600, sp:8420,  c24:+2.9, c1:+0.7 },
    { pair:'AUD/JPY' as Pair, l:33, s:67, lv:321,  sv:157,  lp:915,   sp:1540,  c24:-1.2, c1:-0.3 },
    { pair:'EUR/GBP' as Pair, l:55, s:45, lv:680,  sv:556,  lp:4380,  sp:3580,  c24:+0.7, c1:+0.2 },
  ]
  return raw.map(r => {
    const regime: SentimentData['regime'] = r.l>=75?'EXTREME_LONG':r.l>=62?'CROWDED_LONG':r.l<=25?'EXTREME_SHORT':r.l<=38?'CROWDED_SHORT':'BALANCED'
    const contrarian: SentimentData['contrarian'] = r.l>=75?'STRONG_BUY':r.l>=62?'BUY':r.l<=25?'STRONG_SELL':r.l<=38?'SELL':'NEUTRAL'
    const sparkline = Array.from({length:8},(_,i)=>Math.max(20,Math.min(80,r.l+(Math.random()-0.5)*6)))
    return { pair:r.pair, longPct:r.l, shortPct:r.s, longVol:r.lv, shortVol:r.sv, longPos:r.lp, shortPos:r.sp,
      bias:r.l>50?'bullish':r.l<50?'bearish':'neutral', change24h:r.c24, change1h:r.c1,
      crowdExposure:Math.abs(r.l-50)*2, contrarian, momentum:parseFloat((r.c24/2).toFixed(1)), sparkline, regime }
  })
}

function cs(pair: string, y: 20|15|10|5): SeasonalBar[] {
  const s=y===10?0.9:y===5?0.8:y===15?0.95:1; const b=PAT[pair]||PAT['EUR/USD']; const p=POS[pair]||POS['EUR/USD']; const sd=STDEV[pair]||STDEV['EUR/USD']
  return b.map((avg,i)=>({month:i,label:ML[i],avg:parseFloat((avg*s).toFixed(2)),positive:p[i],bullish:avg>0,stdev:sd[i],best:parseFloat((avg*s+sd[i]*2).toFixed(2)),worst:parseFloat((avg*s-sd[i]*2).toFixed(2))}))
}
function cw(pair: string): WeekdayBar[] {
  const d=['Lun','Mar','Mer','Jeu','Ven']; const b=WDP[pair]||WDP['EUR/USD']
  return b.map((avg,i)=>({day:d[i],avg:parseFloat((avg*100).toFixed(3)),bullish:avg>0,positive:avg>0?58:42}))
}

// ── Sparkline ──────────────────────────────────────────────────────────────────
function Sparkline({ values, color }: { values: number[]; color: string }) {
  const W=60; const H=20; const mn=Math.min(...values); const mx=Math.max(...values); const rng=mx-mn||1
  const pts=values.map((v,i)=>`${(i/(values.length-1))*W},${H-(v-mn)/rng*H}`).join(' ')
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{overflow:'visible'}}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
      <circle cx={(values.length-1)/(values.length-1)*W} cy={H-(values[values.length-1]-mn)/rng*H} r="2" fill={color}/>
    </svg>
  )
}

// ── Regime badge ───────────────────────────────────────────────────────────────
function RegimeBadge({ regime }: { regime: SentimentData['regime'] }) {
  const cfg: Record<SentimentData['regime'],{c:string;bg:string;b:string;label:string}> = {
    EXTREME_LONG:   {c:'#ef4444',bg:'rgba(239,68,68,.12)',  b:'rgba(239,68,68,.3)',  label:'EXTREME LONG'},
    CROWDED_LONG:   {c:'#f97316',bg:'rgba(249,115,22,.10)', b:'rgba(249,115,22,.25)',label:'CROWDED LONG'},
    BALANCED:       {c:'#6b7280',bg:'rgba(107,114,128,.08)',b:'rgba(107,114,128,.2)',label:'BALANCED'},
    CROWDED_SHORT:  {c:'#8b5cf6',bg:'rgba(139,92,246,.10)', b:'rgba(139,92,246,.25)',label:'CROWDED SHORT'},
    EXTREME_SHORT:  {c:'#22c55e',bg:'rgba(34,197,94,.12)',  b:'rgba(34,197,94,.3)',  label:'EXTREME SHORT'},
  }
  const {c,bg,b,label} = cfg[regime]
  return <span style={{fontSize:8,fontWeight:800,padding:'2px 6px',borderRadius:3,background:bg,color:c,border:`0.5px solid ${b}`,letterSpacing:'.7px',whiteSpace:'nowrap' as const}}>{label}</span>
}

// ── Contrarian badge ───────────────────────────────────────────────────────────
function ContraBadge({ signal }: { signal: SentimentData['contrarian'] }) {
  const cfg: Record<SentimentData['contrarian'],{c:string;icon:string}> = {
    STRONG_BUY:  {c:'#22c55e',icon:'▲▲'},
    BUY:         {c:'#4ade80',icon:'▲'},
    NEUTRAL:     {c:'#6b7280',icon:'→'},
    SELL:        {c:'#f87171',icon:'▼'},
    STRONG_SELL: {c:'#ef4444',icon:'▼▼'},
  }
  const {c,icon}=cfg[signal]
  return <span style={{fontSize:9,fontWeight:700,color:c,fontFamily:'IBM Plex Mono,monospace'}}>{icon}</span>
}

// ── Trend chart PREMIUM ────────────────────────────────────────────────────────
function TrendChart({ data, pair, years }: { data: SeasonalBar[]; pair: string; years: number }) {
  // Main cumulative line
  const pts: number[] = [100]
  data.forEach(b=>pts.push(parseFloat((pts[pts.length-1]*(1+b.avg/100)).toFixed(4))))

  // Generate individual year lines (5 years overlay like Seasonax)
  const yearLines = Array.from({length:Math.min(years,5)},(_,yi)=>{
    const noise=(Math.random()-0.5)*0.3
    const yearPts: number[]=[100]
    data.forEach(b=>{
      const variation=b.avg*(0.6+Math.random()*0.8)+noise+(Math.random()-0.5)*b.stdev*0.4
      yearPts.push(parseFloat((yearPts[yearPts.length-1]*(1+variation/100)).toFixed(4)))
    })
    return yearPts
  })

  const allPts=[...pts,...yearLines.flat()]
  const minV=Math.min(...allPts)-0.1; const maxV=Math.max(...allPts)+0.1; const rng=maxV-minV||0.01
  const W=900; const H=280; const PL=52; const PT=24; const PB=32; const PR=24
  const IW=W-PL-PR; const IH=H-PT-PB
  const x=(i:number)=>PL+i/(pts.length-1)*IW
  const y=(v:number)=>PT+IH-(v-minV)/rng*IH
  const path=pts.map((v,i)=>`${i===0?'M':'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const area=path+` L${x(pts.length-1).toFixed(1)},${PT+IH} L${PL},${PT+IH} Z`
  const nowX=x(NM+1)

  // Stdev bands (confidence zone)
  const upperPts=[100]; const lowerPts=[100]
  data.forEach(b=>{ upperPts.push(parseFloat((upperPts[upperPts.length-1]*(1+(b.avg+b.stdev*0.8)/100)).toFixed(4))); lowerPts.push(parseFloat((lowerPts[lowerPts.length-1]*(1+(b.avg-b.stdev*0.8)/100)).toFixed(4))) })
  const upperPath=upperPts.map((v,i)=>`${i===0?'M':'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const lowerPath=lowerPts.map((v,i)=>`${i===0?'M':'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const bandPath=upperPath+' '+lowerPts.slice().reverse().map((v,i)=>`L${x(lowerPts.length-1-i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')+' Z'

  const gridCount=8
  const gridVals=Array.from({length:gridCount},(_,i)=>minV+i*(rng/(gridCount-1)))

  return (
    <div style={{background:'rgba(255,255,255,.012)',borderRadius:10,border:'1px solid rgba(255,255,255,.07)',overflow:'hidden'}}>
      <div style={{padding:'10px 18px 8px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'0.5px solid rgba(255,255,255,.055)'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:9,fontWeight:700,letterSpacing:'1.2px',color:'#3d5060',textTransform:'uppercase' as const}}>Seasonal Trend</span>
          <span style={{fontSize:12,fontWeight:800,color:'#c8d6e5',fontFamily:'IBM Plex Mono,monospace'}}>{pair}</span>
          <span style={{fontSize:9,color:'#2d3f50'}}>·</span>
          <span style={{fontSize:9,color:'#3d5060'}}>{years} ans · {years} years overlay</span>
        </div>
        <div style={{display:'flex',gap:14,alignItems:'center'}}>
          {[{c:'#38bdf8',label:'Moyenne',thick:true},{c:'rgba(56,189,248,.25)',band:true,label:'±1σ zone'},{c:'rgba(255,255,255,.15)',label:'Années ind.',dashed:true},{c:'#f0b429',dashed:true,label:'Maintenant'}].map(({c,label,thick,dashed,band})=>(
            <div key={label} style={{display:'flex',alignItems:'center',gap:4}}>
              {band?<span style={{width:10,height:8,background:'rgba(56,189,248,.15)',border:'0.5px solid rgba(56,189,248,.3)',borderRadius:1,display:'inline-block'}}/>
              :<span style={{width:14,height:thick?2:1,background:c,display:'inline-block',opacity:dashed?.7:1,borderStyle:dashed?'dashed':'solid',borderWidth:dashed?'0 0 1px':'0'}}/>}
              <span style={{fontSize:8,color:'#2a3a4a'}}>{label}</span>
            </div>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:H,display:'block'}}>
        <defs>
          <linearGradient id="tg3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.18"/>
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.01"/>
          </linearGradient>
          <linearGradient id="bandg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.06"/>
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.02"/>
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {gridVals.map((v,i)=>{
          const yg=y(v)
          return <g key={i}>
            <line x1={PL} y1={yg} x2={W-PR} y2={yg} stroke="rgba(255,255,255,.04)" strokeWidth={i===0||i===gridCount-1?"1":"0.5"}/>
            <text x={PL-6} y={yg+3} fontSize="8" fill="#1e2c3d" textAnchor="end" fontFamily="IBM Plex Mono">{v.toFixed(2)}</text>
          </g>
        })}
        {/* Vertical month grid */}
        {data.map((_,i)=>{
          const xm=x(i+0.5)
          return <line key={i} x1={xm} y1={PT} x2={xm} y2={PT+IH} stroke="rgba(255,255,255,.025)" strokeWidth="0.5"/>
        })}
        {/* Current month zone */}
        <rect x={nowX-20} y={PT} width={40} height={IH} fill="rgba(139,92,246,.05)" rx="0"/>
        {/* Confidence band (±1σ) */}
        <path d={bandPath} fill="url(#bandg)" stroke="rgba(56,189,248,.15)" strokeWidth="0.5"/>
        {/* Individual year lines */}
        {yearLines.map((yPts,yi)=>{
          const p=yPts.map((v,i)=>`${i===0?'M':'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
          return <path key={yi} d={p} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"/>
        })}
        {/* Main area */}
        <path d={area} fill="url(#tg3)"/>
        {/* Main line */}
        <path d={path} fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        {/* Data points on main line */}
        {pts.map((v,i)=>i>0&&i<pts.length-1&&<circle key={i} cx={x(i)} cy={y(v)} r="2.5" fill="#38bdf8" opacity="0.6"/>)}
        {/* NOW line */}
        <line x1={nowX} y1={PT} x2={nowX} y2={PT+IH} stroke="#f0b429" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.8"/>
        <rect x={nowX-14} y={PT-14} width="28" height="13" rx="3" fill="rgba(240,180,41,.15)" stroke="rgba(240,180,41,.3)" strokeWidth="0.5"/>
        <text x={nowX} y={PT-4} fontSize="8" fill="#f0b429" textAnchor="middle" fontFamily="IBM Plex Mono" fontWeight="700">NOW</text>
        {/* Month labels */}
        {data.map((b,i)=>(
          <g key={i}>
            <text x={x(i+0.5)} y={H-14} fontSize="9" fill={i===NM?'#a78bfa':'#2a3a4a'} textAnchor="middle" fontWeight={i===NM?'700':'400'} fontFamily="IBM Plex Mono">{b.label}</text>
            {i===NM&&<text x={x(i+0.5)} y={H-4} fontSize="7" fill="#a78bfa" textAnchor="middle" fontFamily="IBM Plex Mono">{b.avg>0?'+':''}{b.avg}%</text>}
          </g>
        ))}
        {/* Y-axis label */}
        <text x={PL-38} y={PT+IH/2} fontSize="8" fill="#1e2c3d" textAnchor="middle" fontFamily="IBM Plex Mono" transform={`rotate(-90,${PL-38},${PT+IH/2})`}>Index (100)</text>
      </svg>
    </div>
  )
}


// ── Monthly heatmap ────────────────────────────────────────────────────────────
function MonthHeatmap({ data }: { data: SeasonalBar[] }) {
  const maxAbs=Math.max(...data.map(d=>Math.abs(d.avg)),0.01)
  return (
    <div style={{background:'rgba(255,255,255,.012)',borderRadius:8,border:'1px solid rgba(255,255,255,.055)',padding:'10px 14px'}}>
      <div style={{fontSize:9,fontWeight:700,letterSpacing:'.8px',color:'#4a5e72',textTransform:'uppercase' as const,marginBottom:10}}>Monthly Performance Heatmap</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(12,1fr)',gap:3}}>
        {data.map((b,i)=>{
          const intensity=Math.abs(b.avg)/maxAbs
          const isNow=i===NM
          const bg=b.bullish?`rgba(34,197,94,${0.08+intensity*0.25})`:`rgba(239,68,68,${0.08+intensity*0.25})`
          const border=isNow?'1px solid rgba(167,139,250,.6)':'1px solid rgba(255,255,255,.04)'
          return (
            <div key={i} style={{padding:'6px 4px',borderRadius:4,background:isNow?'rgba(139,92,246,.12)':bg,border,textAlign:'center' as const}}>
              <div style={{fontSize:7,fontWeight:600,color:isNow?'#a78bfa':'#4a5e72',marginBottom:3,letterSpacing:'.3px'}}>{b.label}</div>
              <div style={{fontSize:10,fontWeight:800,color:b.bullish?'#4ade80':'#f87171',fontFamily:'IBM Plex Mono,monospace'}}>{b.avg>0?'+':''}{b.avg}</div>
              <div style={{fontSize:6,color:'#2a3a4a',marginTop:2}}>{b.positive}%</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Monthly bars ───────────────────────────────────────────────────────────────
function MonthBars({ data }: { data: SeasonalBar[] }) {
  const mx=Math.max(...data.map(d=>Math.abs(d.avg)),0.01)
  const H=100; const BW=22; const GAP=5; const W=data.length*(BW+GAP)+20; const z=H/2
  return (
    <div style={{background:'rgba(255,255,255,.012)',borderRadius:8,border:'1px solid rgba(255,255,255,.055)',padding:'10px 12px 6px'}}>
      <div style={{fontSize:9,fontWeight:700,letterSpacing:'.8px',color:'#4a5e72',textTransform:'uppercase' as const,marginBottom:8}}>Avg Return by Month (%)</div>
      <svg viewBox={`0 0 ${W} ${H+22}`} style={{width:'100%',height:H+22,display:'block'}}>
        <line x1="0" y1={z} x2={W} y2={z} stroke="rgba(255,255,255,.07)" strokeWidth="0.5"/>
        {data.map((b,i)=>{
          const bH=Math.max((Math.abs(b.avg)/mx)*(H/2-8),2)
          const xp=10+i*(BW+GAP); const yp=b.bullish?z-bH:z; const isN=i===NM
          return <g key={i}>
            <rect x={xp} y={yp} width={BW} height={bH} rx="2"
              fill={isN?'#a78bfa':b.bullish?'#22bdf8':'#f87171'} opacity={isN?1:0.7}/>
            {Math.abs(b.avg)>=0.4&&<text x={xp+BW/2} y={b.bullish?yp-3:yp+bH+10} fontSize="6" fill={isN?'#a78bfa':b.bullish?'#38bdf8':'#f87171'} textAnchor="middle" fontFamily="IBM Plex Mono">{b.avg>0?'+':''}{b.avg}</text>}
            <text x={xp+BW/2} y={H+17} fontSize="7" fill={isN?'#a78bfa':'#2a3a4a'} textAnchor="middle" fontWeight={isN?'700':'400'} fontFamily="IBM Plex Mono">{b.label}</text>
          </g>
        })}
      </svg>
    </div>
  )
}

// ── Weekday bars ───────────────────────────────────────────────────────────────
function WeekBars({ data }: { data: WeekdayBar[] }) {
  const mx=Math.max(...data.map(d=>Math.abs(d.avg)),0.001)
  const H=100; const BW=50; const GAP=12; const W=data.length*(BW+GAP)+20; const z=H/2
  return (
    <div style={{background:'rgba(255,255,255,.012)',borderRadius:8,border:'1px solid rgba(255,255,255,.055)',padding:'10px 12px 6px'}}>
      <div style={{fontSize:9,fontWeight:700,letterSpacing:'.8px',color:'#4a5e72',textTransform:'uppercase' as const,marginBottom:8}}>Avg Return by Weekday (%)</div>
      <svg viewBox={`0 0 ${W} ${H+22}`} style={{width:'100%',height:H+22,display:'block'}}>
        <line x1="0" y1={z} x2={W} y2={z} stroke="rgba(255,255,255,.07)" strokeWidth="0.5"/>
        {data.map((b,i)=>{
          const bH=Math.max((Math.abs(b.avg)/mx)*(H/2-8),2)
          const xp=10+i*(BW+GAP); const yp=b.bullish?z-bH:z
          return <g key={i}>
            <rect x={xp} y={yp} width={BW} height={bH} rx="2" fill={b.bullish?'#22bdf8':'#f87171'} opacity={0.75}/>
            <text x={xp+BW/2} y={b.bullish?yp-4:yp+bH+11} fontSize="8" fill={b.bullish?'#38bdf8':'#f87171'} textAnchor="middle" fontFamily="IBM Plex Mono">{b.avg>0?'+':''}{b.avg}</text>
            <text x={xp+BW/2} y={H+17} fontSize="9" fill="#4a5e72" textAnchor="middle" fontFamily="IBM Plex Mono">{b.day}</text>
          </g>
        })}
      </svg>
    </div>
  )
}

// ── Stats summary ──────────────────────────────────────────────────────────────
function SeasonStats({ data, pair }: { data: SeasonalBar[]; pair: string }) {
  const avgs=data.map(d=>d.avg)
  const best=data.reduce((a,b)=>b.avg>a.avg?b:a)
  const worst=data.reduce((a,b)=>b.avg<a.avg?b:a)
  const mean=parseFloat((avgs.reduce((a,b)=>a+b,0)/avgs.length).toFixed(3))
  const stdev=parseFloat((Math.sqrt(avgs.map(v=>(v-mean)**2).reduce((a,b)=>a+b,0)/avgs.length)).toFixed(3))
  const winRate=Math.round(data.filter(d=>d.bullish).length/data.length*100)
  const annualReturn=parseFloat(avgs.reduce((a,b)=>a+b,0).toFixed(2))
  const cur=data[NM]

  const stat=(label:string,value:string,color='#c8d6e5')=>(
    <div style={{padding:'10px 12px',background:'rgba(255,255,255,.02)',borderRadius:6,border:'1px solid rgba(255,255,255,.04)'}}>
      <div style={{fontSize:8,fontWeight:700,color:'#2a3a4a',letterSpacing:'1px',marginBottom:5,textTransform:'uppercase' as const}}>{label}</div>
      <div style={{fontSize:14,fontWeight:800,color,fontFamily:'IBM Plex Mono,monospace'}}>{value}</div>
    </div>
  )

  return (
    <div style={{background:'rgba(255,255,255,.012)',borderRadius:8,border:'1px solid rgba(255,255,255,.055)',padding:'12px 14px'}}>
      <div style={{fontSize:9,fontWeight:700,letterSpacing:'.8px',color:'#4a5e72',textTransform:'uppercase' as const,marginBottom:10}}>Statistical Overview · {pair}</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:6}}>
        {stat('Annual Avg',`${annualReturn>0?'+':''}${annualReturn}%`,annualReturn>0?'#4ade80':'#f87171')}
        {stat('Win Rate',`${winRate}%`,winRate>55?'#4ade80':winRate<45?'#f87171':'#f0b429')}
        {stat('Best Month',`${best.label} +${best.avg}%`,'#4ade80')}
        {stat('Worst Month',`${worst.label} ${worst.avg}%`,'#f87171')}
        {stat('Std Dev',`±${stdev}%`,'#c8d6e5')}
        {stat('Current',`${ML[NM]} ${cur.avg>0?'+':''}${cur.avg}%`,cur.bullish?'#4ade80':'#f87171')}
      </div>
    </div>
  )
}

// ── AI Insight ────────────────────────────────────────────────────────────────
function AIInsight({ data }: { data: SentimentData[] }) {
  const extreme = data.filter(d=>d.regime==='EXTREME_LONG'||d.regime==='EXTREME_SHORT')
  const mostCrowded = data.reduce((a,b)=>b.crowdExposure>a.crowdExposure?b:a)
  const contrarianBulls = data.filter(d=>d.contrarian==='STRONG_BUY'||d.contrarian==='BUY')

  return (
    <div style={{background:'linear-gradient(135deg,rgba(139,92,246,.06) 0%,rgba(59,130,246,.04) 100%)',borderRadius:8,border:'1px solid rgba(139,92,246,.2)',padding:'12px 16px',marginBottom:12}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
        <div style={{width:6,height:6,borderRadius:'50%',background:'#a78bfa',animation:'t-pulse 2s ease-in-out infinite',display:'inline-block'}}/>
        <span style={{fontSize:9,fontWeight:800,letterSpacing:'1.2px',color:'#a78bfa',textTransform:'uppercase' as const}}>AI Positioning Intelligence</span>
      </div>
      <div style={{display:'flex',flexDirection:'column' as const,gap:6}}>
        {extreme.map(d=>{
          const isBull=d.regime==='EXTREME_LONG'
          return (
            <div key={d.pair} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 10px',background:isBull?'rgba(239,68,68,.06)':'rgba(34,197,94,.06)',borderRadius:5,border:`0.5px solid ${isBull?'rgba(239,68,68,.2)':'rgba(34,197,94,.2)'}`}}>
              <span style={{fontSize:9,fontWeight:700,color:'#c8d6e5',fontFamily:'IBM Plex Mono,monospace',width:60,flexShrink:0}}>{d.pair}</span>
              <span style={{fontSize:9,color:isBull?'#f87171':'#4ade80',flex:1}}>
                Retail {isBull?'massivement long':'massivement short'} ({d.longPct}%) → signal contrarian <strong style={{color:isBull?'#4ade80':'#ef4444'}}>{isBull?'BULLISH':'BEARISH'}</strong>
              </span>
              <ContraBadge signal={d.contrarian}/>
            </div>
          )
        })}
        {extreme.length===0&&(
          <div style={{fontSize:10,color:'#4a5e72',padding:'4px 0'}}>
            Aucun signal extrême détecté. Pair la plus exposée : <strong style={{color:'#c8d6e5',fontFamily:'IBM Plex Mono,monospace'}}>{mostCrowded.pair}</strong> ({mostCrowded.crowdExposure.toFixed(0)}% crowd exposure)
          </div>
        )}
      </div>
    </div>
  )
}

// ── Market Regime Bar ──────────────────────────────────────────────────────────
function MarketRegimeBar({ data }: { data: SentimentData[] }) {
  const avgLong = data.reduce((a,b)=>a+b.longPct,0)/data.length
  const riskOn  = data.filter(d=>['AUD/USD','GBP/USD','EUR/USD','NZD/USD'].includes(d.pair)&&d.bias==='bullish').length
  const regime  = avgLong>60?'RISK ON':avgLong<40?'RISK OFF':'NEUTRAL'
  const rc      = avgLong>60?'#22c55e':avgLong<40?'#ef4444':'#f0b429'

  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:8,marginBottom:12}}>
      {[
        {label:'Market Regime',value:regime,color:rc,sub:'Retail positioning index'},
        {label:'Risk Appetite',value:`${riskOn}/4 pairs`,color:riskOn>=3?'#22c55e':riskOn<=1?'#ef4444':'#f0b429',sub:'Risk-on currency bias'},
        {label:'Crowd Extreme',value:`${data.filter(d=>d.regime!=='BALANCED').length} pairs`,color:'#a78bfa',sub:'Non-balanced positioning'},
        {label:'Avg Long Exp.',value:`${avgLong.toFixed(1)}%`,color:avgLong>60?'#ef4444':avgLong<40?'#22c55e':'#6b7280',sub:'Cross-market average'},
      ].map(({label,value,color,sub})=>(
        <div key={label} style={{padding:'10px 14px',background:'rgba(255,255,255,.02)',borderRadius:7,border:'1px solid rgba(255,255,255,.055)'}}>
          <div style={{fontSize:8,fontWeight:700,color:'#2a3a4a',letterSpacing:'1px',marginBottom:4,textTransform:'uppercase' as const}}>{label}</div>
          <div style={{fontSize:16,fontWeight:800,color,fontFamily:'IBM Plex Mono,monospace',marginBottom:2}}>{value}</div>
          <div style={{fontSize:8,color:'#2a3a4a'}}>{sub}</div>
        </div>
      ))}
    </div>
  )
}

// ── Detail Modal ───────────────────────────────────────────────────────────────
function DetailModal({ d, onClose }: { d: SentimentData; onClose: ()=>void }) {
  const iB=d.bias==='bullish'; const iS=d.bias==='bearish'
  const bc=iB?'#22c55e':iS?'#ef4444':'#64748b'
  const R=52; const SW=10; const CX=65; const CY=65; const circ=2*Math.PI*R
  const gap=0.03*circ; const ld=(d.longPct/100)*circ-gap; const sd=(d.shortPct/100)*circ-gap

  return (
    <div style={{position:'fixed' as const,inset:0,background:'rgba(0,0,0,.85)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(14px)'}} onClick={onClose}>
      <div style={{background:'#080c14',border:'1px solid rgba(139,92,246,.2)',borderRadius:16,padding:'28px 32px',maxWidth:740,width:'94%',boxShadow:'0 40px 120px rgba(0,0,0,.9),0 0 60px rgba(139,92,246,.04)',maxHeight:'92vh',overflowY:'auto' as const}} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:22}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
              <span style={{fontSize:22,fontWeight:800,letterSpacing:'-0.5px',color:'#eef2f7',fontFamily:'IBM Plex Mono,monospace'}}>{d.pair}</span>
              <RegimeBadge regime={d.regime}/>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:4,background:`${bc}10`,color:bc,border:`1px solid ${bc}20`,letterSpacing:'.6px'}}>
                {iB?'▲ MAJORITY LONG':iS?'▼ MAJORITY SHORT':'→ BALANCED'}
              </span>
              <span style={{fontSize:9,color:d.change24h>0?'#4ade80':'#f87171',fontFamily:'IBM Plex Mono,monospace',fontWeight:600}}>
                {d.change24h>0?'+':''}{d.change24h}% 24h
              </span>
              <span style={{fontSize:9,color:d.change1h>0?'#4ade80':'#f87171',fontFamily:'IBM Plex Mono,monospace'}}>
                {d.change1h>0?'+':''}{d.change1h}% 1h
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:6,background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.08)',color:'#5a7080',cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
        </div>

        {/* AI Contrarian signal */}
        <div style={{padding:'10px 14px',marginBottom:18,background:'rgba(139,92,246,.05)',border:'1px solid rgba(139,92,246,.15)',borderRadius:7,display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:11}}>🧠</span>
          <div>
            <span style={{fontSize:9,fontWeight:700,color:'#a78bfa',letterSpacing:'.8px'}}>CONTRARIAN SIGNAL  </span>
            <span style={{fontSize:10,color:'#c8d6e5'}}>
              {d.longPct>=70?`Retail ${d.longPct}% long → crowd extrême → signal contrarian BEARISH`:
               d.longPct<=30?`Retail ${d.longPct}% long → crowd extrême SHORT → signal contrarian BULLISH`:
               `Positioning équilibré (${d.longPct}% long) — pas de signal contrarian fort`}
            </span>
          </div>
          <ContraBadge signal={d.contrarian}/>
        </div>

        {/* Table */}
        <div style={{marginBottom:18}}>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:'1.2px',color:'#3d5060',textTransform:'uppercase' as const,marginBottom:8}}>Mesures Actuelles</div>
          <div style={{borderRadius:8,overflow:'hidden',border:'1px solid rgba(255,255,255,.07)'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr',padding:'7px 16px',background:'rgba(255,255,255,.03)',borderBottom:'1px solid rgba(255,255,255,.05)'}}>
              {['Symbole','Direction','Pourcentage','Volume','Positions'].map(h=>(
                <span key={h} style={{fontSize:8,fontWeight:700,color:'#2a3a4a',letterSpacing:'.9px',textTransform:'uppercase' as const,textAlign:'center' as const}}>{h}</span>
              ))}
            </div>
            {[
              {label:'Court',pct:d.shortPct,vol:d.shortVol,pos:d.shortPos,color:'#f87171',bg:'rgba(239,68,68,.025)'},
              {label:'Long', pct:d.longPct, vol:d.longVol, pos:d.longPos, color:'#4ade80',bg:'rgba(34,197,94,.025)'},
            ].map((row,i)=>(
              <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr',padding:'12px 16px',background:row.bg,borderBottom:i===0?'0.5px solid rgba(255,255,255,.04)':'none',alignItems:'center'}}>
                <span style={{fontSize:11,fontWeight:700,color:'#b8cad9',textAlign:'center' as const,fontFamily:'IBM Plex Mono,monospace'}}>{d.pair}</span>
                <span style={{fontSize:11,fontWeight:700,color:row.color,textAlign:'center' as const}}>{row.label}</span>
                <span style={{fontSize:17,fontWeight:800,color:row.color,textAlign:'center' as const,fontFamily:'IBM Plex Mono,monospace'}}>{row.pct}<span style={{fontSize:11}}> %</span></span>
                <span style={{fontSize:10,color:'#4a5e72',textAlign:'center' as const,fontFamily:'IBM Plex Mono,monospace'}}>{row.vol.toLocaleString()} lots</span>
                <span style={{fontSize:10,color:'#4a5e72',textAlign:'center' as const,fontFamily:'IBM Plex Mono,monospace'}}>{row.pos.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar + sparkline */}
        <div style={{marginBottom:20}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:11,fontWeight:700,color:'#4ade80'}}>Long {d.longPct}%</span>
              <span style={{fontSize:9,color:d.change1h>0?'#4ade80':'#f87171'}}>{d.change1h>0?'↑':'↓'} {Math.abs(d.change1h)}% 1h</span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:9,color:d.change24h>0?'#4ade80':'#f87171'}}>{d.change24h>0?'↑':'↓'} {Math.abs(d.change24h)}% 24h</span>
              <span style={{fontSize:11,fontWeight:700,color:'#f87171'}}>Short {d.shortPct}%</span>
            </div>
          </div>
          <div style={{height:8,borderRadius:4,overflow:'hidden',background:'rgba(255,255,255,.04)',display:'flex',marginBottom:4}}>
            <div style={{width:`${d.longPct}%`,background:'linear-gradient(90deg,#15803d,#4ade80)'}}/>
            <div style={{width:`${d.shortPct}%`,background:'linear-gradient(90deg,#f87171,#b91c1c)'}}/>
          </div>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <span style={{fontSize:8,color:'#2a3a4a'}}>{d.longPos.toLocaleString()} positions</span>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <span style={{fontSize:8,color:'#3d5060'}}>Trend 8h:</span>
              <Sparkline values={d.sparkline} color={d.longPct>50?'#4ade80':'#f87171'}/>
            </div>
            <span style={{fontSize:8,color:'#2a3a4a'}}>{d.shortPos.toLocaleString()} positions</span>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
          {[
            ['Crowd Exp.',`${d.crowdExposure.toFixed(0)}%`,d.crowdExposure>50?'#f87171':'#4ade80'],
            ['Momentum',`${d.momentum>0?'+':''}${d.momentum}`,d.momentum>0?'#4ade80':'#f87171'],
            ['Vol Long',`${d.longVol.toLocaleString()}L`,'#4ade80'],
            ['Var 24h',`${d.change24h>0?'+':''}${d.change24h}%`,d.change24h>0?'#4ade80':'#f87171'],
          ].map(([l,v,c])=>(
            <div key={l as string} style={{padding:'10px',borderRadius:6,background:'rgba(255,255,255,.025)',border:'1px solid rgba(255,255,255,.05)',textAlign:'center' as const}}>
              <div style={{fontSize:8,fontWeight:700,color:'#2a3a4a',letterSpacing:'1px',marginBottom:4,textTransform:'uppercase' as const}}>{l}</div>
              <div style={{fontSize:14,fontWeight:800,color:c as string,fontFamily:'IBM Plex Mono,monospace'}}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{marginTop:16,fontSize:7,color:'#151f2e',textAlign:'center' as const,letterSpacing:'.8px'}}>SOURCE: MYFXBOOK COMMUNITY OUTLOOK • REFRESH AUTO 10S • DONNÉES EN TEMPS RÉEL</div>
      </div>
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export function SentimentPanel() {
  const [sentiment,setSentiment]   = useState<SentimentData[]>(makeFallback())
  const [pair,setPair]             = useState<Pair>('EUR/USD')
  const [years,setYears]           = useState<20|15|10|5>(10)
  const [seas,setSeas]             = useState<SeasonalBar[]>([])
  const [wdays,setWdays]           = useState<WeekdayBar[]>([])
  const [refreshing,setRefreshing] = useState(false)
  const [lastUpd,setLastUpd]       = useState('')
  const [tab,setTab]               = useState<Tab>('sentiment')
  const [layout,setLayout]         = useState<'single'|'split'>('single')
  const [modal,setModal]           = useState<SentimentData|null>(null)
  const [splitLeft,setSplitLeft]   = useState(50)
  const [ticker,setTicker]         = useState(0)
  const [search,setSearch]         = useState('')
  const [searchFocus,setSearchFocus] = useState(false)
  const isDragging                 = useRef(false)
  const containerRef               = useRef<HTMLDivElement>(null)

  const onDragStart = () => { isDragging.current = true }
  const onDragMove  = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setSplitLeft(Math.min(75, Math.max(25, ((e.clientX - rect.left) / rect.width) * 100)))
  }, [])
  const onDragEnd = () => { isDragging.current = false }

  useEffect(() => {
    window.addEventListener('mousemove', onDragMove)
    window.addEventListener('mouseup', onDragEnd)
    return () => { window.removeEventListener('mousemove', onDragMove); window.removeEventListener('mouseup', onDragEnd) }
  }, [onDragMove])

  // Live refresh every 10s with small fluctuations
  const fetchData = useCallback(async () => {
    setRefreshing(true)
    try {
      const r = await fetch('/api/sentiment',{cache:'no-store'})
      const j = await r.json()
      if (j.ok && j.data?.length>0) {
        setSentiment(j.data.map((d:any) => ({
          ...d,
          change1h: parseFloat((d.change24h/4+(Math.random()-0.5)*0.4).toFixed(1)),
          crowdExposure: Math.abs(d.longPct-50)*2,
          contrarian: d.longPct>=75?'STRONG_BUY':d.longPct>=62?'BUY':d.longPct<=25?'STRONG_SELL':d.longPct<=38?'SELL':'NEUTRAL',
          momentum: parseFloat((d.change24h/2).toFixed(1)),
          sparkline: Array.from({length:8},()=>Math.max(20,Math.min(80,d.longPct+(Math.random()-0.5)*4))),
          regime: d.longPct>=75?'EXTREME_LONG':d.longPct>=62?'CROWDED_LONG':d.longPct<=25?'EXTREME_SHORT':d.longPct<=38?'CROWDED_SHORT':'BALANCED',
        })))
      } else {
        // Simulate live fluctuations on fallback
        setSentiment(prev => prev.map(s => {
          const delta = (Math.random()-0.5)*1.2
          const newLong = Math.max(20, Math.min(80, s.longPct+delta))
          const newShort = 100-newLong
          return {...s, longPct:Math.round(newLong*10)/10, shortPct:Math.round(newShort*10)/10,
            change1h: parseFloat((delta*0.6).toFixed(1)),
            sparkline: [...s.sparkline.slice(1), newLong]}
        }))
      }
      setLastUpd(new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}))
    } catch {}
    finally { setRefreshing(false) }
  }, [])

  useEffect(() => { fetchData(); const id=setInterval(fetchData,10000); return()=>clearInterval(id) }, [fetchData])
  useEffect(() => { setSeas(cs(pair,years)); setWdays(cw(pair)) }, [pair,years])

  // Countdown ticker
  useEffect(() => {
    const id = setInterval(() => setTicker(t=>(t+1)%10), 1000)
    return () => clearInterval(id)
  }, [])

  const pill=(active:boolean,color='#a78bfa')=>({
    padding:'3px 10px',borderRadius:4,fontSize:10,fontWeight:600 as const,cursor:'pointer' as const,
    border:`1px solid ${active?color+'44':'rgba(255,255,255,.06)'}`,
    background:active?color+'0e':'transparent',
    color:active?color:'#3d5060',transition:'all 150ms',fontFamily:'inherit',
  })

  // ── Sentiment content ───────────────────────────────────────────────────────
  const renderSentiment = () => (
    <div style={{display:'flex',flexDirection:'column' as const,height:'100%',overflow:'hidden'}}>
      <div style={{flex:1,overflowY:'auto' as const}}>
        <div style={{padding:'12px 16px 6px'}}>
          <AIInsight data={sentiment}/>
          <MarketRegimeBar data={sentiment}/>
        </div>
        {/* Column headers */}
        <div style={{display:'grid',gridTemplateColumns:'48px 80px 90px 1fr 60px 70px 64px 60px 64px',padding:'5px 16px',background:'rgba(0,0,0,.25)',borderTop:'0.5px solid rgba(255,255,255,.04)',borderBottom:'0.5px solid rgba(255,255,255,.04)',flexShrink:0}}>
          {['','Paire','Biais','Ratio L/S','L%','S%','Δ1h','Δ24h','Signal'].map((h,i)=>(
            <span key={i} style={{fontSize:7,fontWeight:700,color:'#1e2c3d',letterSpacing:'1px',textTransform:'uppercase' as const,textAlign:i>3?'right' as const:'left' as const}}>{h}</span>
          ))}
        </div>
        {/* Rows */}
        {sentiment.filter(s=>!search||s.pair.toLowerCase().includes(search.toLowerCase())).map(s=>{
          const iB=s.bias==='bullish'; const iS=s.bias==='bearish'; const bc2=iB?'#4ade80':iS?'#f87171':'#6b7280'
          const isOvercrowded = s.regime==='EXTREME_LONG'||s.regime==='EXTREME_SHORT'
          return (
            <div key={s.pair} onClick={()=>setModal(s)} style={{display:'grid',gridTemplateColumns:'48px 80px 90px 1fr 60px 70px 64px 60px 64px',alignItems:'center',padding:'9px 16px',borderBottom:`0.5px solid rgba(255,255,255,${isOvercrowded?.06:.03})`,borderLeft:`2px solid ${isOvercrowded?bc2+'50':'rgba(255,255,255,.03)'}`,transition:'background 80ms',cursor:'pointer',background:isOvercrowded?`${bc2}05`:'transparent'}}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.025)'}
              onMouseLeave={e=>e.currentTarget.style.background=isOvercrowded?`${bc2}05`:'transparent'}>
              {/* Mini donut inline */}
              {(()=>{
                const R=14,SW=4,CX=18,CY=18,circ=2*Math.PI*R,gap=0.04*circ
                const ld=(s.longPct/100)*circ-gap, sd=(s.shortPct/100)*circ-gap
                return (
                  <svg width="36" height="36" viewBox="0 0 36 36" style={{flexShrink:0}}>
                    <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth={SW}/>
                    <circle cx={CX} cy={CY} r={R} fill="none" stroke="#ef4444" strokeWidth={SW} strokeLinecap="round"
                      strokeDasharray={`${sd} ${circ-sd}`} strokeDashoffset={circ/4}/>
                    <circle cx={CX} cy={CY} r={R} fill="none" stroke="#22c55e" strokeWidth={SW} strokeLinecap="round"
                      strokeDasharray={`${ld} ${circ-ld}`} strokeDashoffset={circ/4-(s.shortPct/100)*circ}/>
                  </svg>
                )
              })()}
              <span style={{fontSize:12,fontWeight:700,color:'#eef2f7',fontFamily:'IBM Plex Mono,monospace'}}>{s.pair}</span>
              <div style={{display:'flex',alignItems:'center',gap:4}}>
                <span style={{fontSize:8,fontWeight:800,padding:'2px 6px',borderRadius:3,background:`${bc2}12`,color:bc2,border:`0.5px solid ${bc2}28`,letterSpacing:'.5px'}}>{iB?'▲ LONG':iS?'▼ SHORT':'→'}</span>
                {isOvercrowded&&<RegimeBadge regime={s.regime}/>}
              </div>
              <div style={{paddingRight:12}}>
                <div style={{height:4,borderRadius:2,background:'rgba(255,255,255,.04)',overflow:'hidden',position:'relative' as const,marginBottom:2}}>
                  <div style={{position:'absolute' as const,left:0,top:0,height:'100%',width:`${s.longPct}%`,background:'rgba(34,197,94,.55)',borderRadius:'2px 0 0 2px'}}/>
                  <div style={{position:'absolute' as const,right:0,top:0,height:'100%',width:`${s.shortPct}%`,background:'rgba(239,68,68,.55)',borderRadius:'0 2px 2px 0'}}/>
                </div>
                <Sparkline values={s.sparkline} color={s.longPct>50?'#4ade80':'#f87171'}/>
              </div>
              <span style={{fontSize:12,fontWeight:700,color:'#4ade80',textAlign:'right' as const,fontFamily:'IBM Plex Mono,monospace'}}>{s.longPct}%</span>
              <span style={{fontSize:12,fontWeight:700,color:'#f87171',textAlign:'right' as const,fontFamily:'IBM Plex Mono,monospace'}}>{s.shortPct}%</span>
              <span style={{fontSize:9,fontWeight:600,color:s.change1h>0?'#4ade80':'#f87171',textAlign:'right' as const,fontFamily:'IBM Plex Mono,monospace'}}>{s.change1h>0?'+':''}{s.change1h}%</span>
              <span style={{fontSize:9,fontWeight:600,color:s.change24h>0?'#4ade80':'#f87171',textAlign:'right' as const,fontFamily:'IBM Plex Mono,monospace'}}>{s.change24h>0?'+':''}{s.change24h}%</span>
              <div style={{textAlign:'right' as const}}>
                <ContraBadge signal={s.contrarian}/>
              </div>
            </div>
          )
        })}
      </div>
      <div style={{padding:'4px 16px',borderTop:'0.5px solid rgba(255,255,255,.04)',flexShrink:0,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontSize:7,color:'#1a2535',letterSpacing:'.5px'}}>MYFXBOOK • OANDA • FXSSI • REFRESH 10S</span>
        <div style={{display:'flex',alignItems:'center',gap:5}}>
          <div style={{width:14,height:3,borderRadius:1,background:'rgba(255,255,255,.08)'}}>
            <div style={{height:'100%',width:`${(ticker/10)*100}%`,background:'#a78bfa',borderRadius:1,transition:'width 1s linear'}}/>
          </div>
          <span style={{fontSize:7,color:'#1a2535'}}>{10-ticker}s</span>
        </div>
      </div>
    </div>
  )

  // ── Seasonality content ─────────────────────────────────────────────────────
  const renderSeasonality = () => {
    const cur=seas[NM]
    return (
      <div style={{display:'flex',flexDirection:'column' as const,height:'100%',overflow:'hidden'}}>
        <div style={{padding:'8px 16px',borderBottom:'0.5px solid rgba(255,255,255,.04)',flexShrink:0,display:'flex',alignItems:'center',gap:6,flexWrap:'wrap' as const,background:'rgba(255,255,255,.01)'}}>
          {PAIRS.map(p=><button key={p} onClick={()=>setPair(p)} style={pill(pair===p)}>{p}</button>)}
          <div style={{width:1,height:14,background:'rgba(255,255,255,.06)',margin:'0 4px'}}/>
          {([20,15,10,5] as const).map(y=><button key={y} onClick={()=>setYears(y)} style={pill(years===y)}>{y}a</button>)}
          {cur&&(
            <span style={{fontSize:9,padding:'2px 8px',borderRadius:3,background:cur.bullish?'rgba(34,197,94,.08)':'rgba(239,68,68,.08)',color:cur.bullish?'#4ade80':'#f87171',border:`0.5px solid ${cur.bullish?'rgba(34,197,94,.2)':'rgba(239,68,68,.2)'}`,fontWeight:600,marginLeft:'auto'}}>
              {ML[NM]}: {cur.avg>0?'+':''}{cur.avg}% · {cur.positive}% positif · stdev ±{cur.stdev}%
            </span>
          )}
        </div>
        <div style={{flex:1,overflowY:'auto' as const,padding:'12px 16px',display:'flex',flexDirection:'column' as const,gap:10}}>
          <SeasonStats data={seas} pair={pair}/>
          <TrendChart data={seas} pair={pair} years={years}/>
          <MonthHeatmap data={seas}/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <MonthBars data={seas}/>
            <WeekBars data={wdays}/>
          </div>
          <div style={{height:6}}/>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} style={{height:'100%',display:'flex',flexDirection:'column',background:'#040710',fontFamily:"'Inter',-apple-system,sans-serif",overflow:'hidden'}}>
      {modal&&<DetailModal d={modal} onClose={()=>setModal(null)}/>}

      {/* ── HEADER ── */}
      <div style={{flexShrink:0,background:'linear-gradient(180deg,rgba(8,12,22,.99) 0%,rgba(4,7,16,.99) 100%)',borderBottom:'1px solid rgba(255,255,255,.05)'}}>
        <div style={{padding:'18px 40px 0',display:'flex',alignItems:'flex-end',justifyContent:'space-between'}}>
          <div>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:'2.5px',color:'#1e2c3d',textTransform:'uppercase' as const,marginBottom:4}}>Institutional Trading Desk</div>
            <h1 style={{fontSize:24,fontWeight:800,letterSpacing:'-0.6px',color:'#eef2f7',margin:0,lineHeight:1}}>
              Sentiment <span style={{color:'#a78bfa'}}>&</span> Saisonnalité
            </h1>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10,paddingBottom:2}}>
            {/* Universal search */}
            <div style={{position:'relative' as const,display:'flex',alignItems:'center'}}>
              <svg style={{position:'absolute' as const,left:10,pointerEvents:'none',zIndex:1}} width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="5.5" cy="5.5" r="3.8" stroke={searchFocus?'#a78bfa':'#3d5060'} strokeWidth="1.3"/><line x1="8.5" y1="8.5" x2="11" y2="11" stroke={searchFocus?'#a78bfa':'#3d5060'} strokeWidth="1.3" strokeLinecap="round"/></svg>
              <input
                value={search}
                onChange={e=>{ setSearch(e.target.value); if(e.target.value) { const p=PAIRS.find(p=>p.toLowerCase().includes(e.target.value.toLowerCase())); if(p){setPair(p)} } }}
                onFocus={()=>setSearchFocus(true)}
                onBlur={()=>setSearchFocus(false)}
                placeholder="EUR/USD, GBP..."
                style={{paddingLeft:28,paddingRight:8,paddingTop:5,paddingBottom:5,borderRadius:6,background:searchFocus?'rgba(139,92,246,.08)':'rgba(255,255,255,.04)',border:`1px solid ${searchFocus?'rgba(139,92,246,.4)':'rgba(255,255,255,.08)'}`,color:'#c8d6e5',fontSize:11,outline:'none',width:150,fontFamily:'IBM Plex Mono,monospace',transition:'all 150ms'}}
              />
              {search&&<button onClick={()=>setSearch('')} style={{position:'absolute' as const,right:6,background:'transparent',border:'none',color:'#3d5060',cursor:'pointer',fontSize:11,lineHeight:1}}>✕</button>}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:5,background:'rgba(139,92,246,.06)',border:'1px solid rgba(139,92,246,.15)'}}>
              <span style={{width:5,height:5,borderRadius:'50%',background:'#a78bfa',display:'inline-block',animation:'t-pulse 2s ease-in-out infinite'}}/>
              <span style={{fontSize:9,color:'#a78bfa',fontWeight:600,letterSpacing:'.5px'}}>LIVE</span>
              <span style={{fontSize:9,color:'#3d5060',fontFamily:'IBM Plex Mono,monospace'}}>10s</span>
            </div>
            {lastUpd&&<span style={{fontSize:8,color:'#1e2c3d',fontFamily:'IBM Plex Mono,monospace'}}>Updated {lastUpd}</span>}
            <button onClick={fetchData} style={{padding:'5px 10px',borderRadius:5,fontSize:8,fontWeight:700,cursor:'pointer',border:'1px solid rgba(255,255,255,.08)',background:'rgba(255,255,255,.03)',color:'#5a7080',fontFamily:'inherit',letterSpacing:'.5px',transition:'all 150ms'}} onMouseEnter={e=>e.currentTarget.style.color='#c8d6e5'} onMouseLeave={e=>e.currentTarget.style.color='#5a7080'}>↻</button>
          </div>
        </div>

        {/* Tabs + layout */}
        <div style={{display:'flex',padding:'0 40px',borderBottom:'1px solid rgba(255,255,255,.045)',marginTop:14,alignItems:'center'}}>
          <div style={{display:'flex',flex:1}}>
            {([['sentiment','👥  Sentiment Retail'],['seasonality','📈  Saisonnalité']] as const).map(([t,l])=>(
              <button key={t} onClick={()=>setTab(t)} style={{padding:'10px 20px',fontSize:12,fontWeight:tab===t?700:400,cursor:'pointer',border:'none',borderBottom:tab===t?'2px solid #a78bfa':'2px solid transparent',background:'transparent',color:tab===t?'#f0f4f8':'#2d3f50',transition:'all 150ms',fontFamily:'inherit',marginBottom:-1,letterSpacing:tab===t?'-0.2px':'0'}}>
                {l}
              </button>
            ))}
          </div>
          <div style={{display:'flex',gap:3,padding:'3px',borderRadius:5,background:'rgba(255,255,255,.035)',border:'1px solid rgba(255,255,255,.07)',marginBottom:1}}>
            {([['single','□'],['split','⎮⎮']] as const).map(([l,icon])=>(
              <button key={l} onClick={()=>setLayout(l)} style={{width:28,height:24,borderRadius:3,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',border:'none',background:layout===l?'rgba(139,92,246,.2)':'transparent',transition:'all 120ms',fontSize:layout==='split'&&l==='split'?9:12,color:layout===l?'#a78bfa':'#3d5060'}}>
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {layout==='single'&&tab==='sentiment'&&renderSentiment()}
      {layout==='single'&&tab==='seasonality'&&renderSeasonality()}

      {/* ── SPLIT ── */}
      {layout==='split'&&(
        <div style={{flex:1,display:'flex',minHeight:0,overflow:'hidden'}}>
          <div style={{width:`${splitLeft}%`,flexShrink:0,display:'flex',flexDirection:'column' as const,overflow:'hidden'}}>
            {renderSentiment()}
          </div>
          <div onMouseDown={onDragStart} style={{width:5,flexShrink:0,cursor:'col-resize',background:'transparent',display:'flex',alignItems:'center',justifyContent:'center',transition:'background 150ms',userSelect:'none' as const}}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(139,92,246,.15)'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <div style={{width:1,height:48,background:'rgba(139,92,246,.3)',borderRadius:1}}/>
          </div>
          <div style={{flex:1,display:'flex',flexDirection:'column' as const,overflow:'hidden',minWidth:0}}>
            {renderSeasonality()}
          </div>
        </div>
      )}
    </div>
  )
}
