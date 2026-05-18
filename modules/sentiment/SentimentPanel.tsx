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

const PAIRS: Pair[] = ['EUR/USD','GBP/USD','USD/JPY','USD/CAD','AUD/USD','NZD/USD','USD/CHF','XAU/USD','AUD/JPY','EUR/GBP']
const ML = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc']
const NM = new Date().getMonth()

const SF: SentimentData[] = [
  { pair:'EUR/USD', longPct:66, shortPct:34, longVol:2840, shortVol:1460, longPos:18420, shortPos:9480,  bias:'bullish', change24h:+3.2 },
  { pair:'GBP/USD', longPct:72, shortPct:28, longVol:1920, shortVol:748,  longPos:12300, shortPos:4800,  bias:'bullish', change24h:+1.8 },
  { pair:'USD/JPY', longPct:29, shortPct:71, longVol:880,  shortVol:2150, longPos:5640,  shortPos:13800, bias:'bearish', change24h:-2.4 },
  { pair:'USD/CAD', longPct:45, shortPct:55, longVol:1100, shortVol:1340, longPos:7200,  shortPos:8760,  bias:'bearish', change24h:-0.8 },
  { pair:'AUD/USD', longPct:58, shortPct:42, longVol:960,  shortVol:695,  longPos:6180,  shortPos:4480,  bias:'bullish', change24h:+0.5 },
  { pair:'NZD/USD', longPct:61, shortPct:39, longVol:420,  shortVol:268,  longPos:2700,  shortPos:1720,  bias:'bullish', change24h:+1.1 },
  { pair:'USD/CHF', longPct:38, shortPct:62, longVol:520,  shortVol:850,  longPos:3340,  shortPos:5460,  bias:'bearish', change24h:-1.6 },
  { pair:'XAU/USD', longPct:71, shortPct:29, longVol:3200, shortVol:1310, longPos:20600, shortPos:8420,  bias:'bullish', change24h:+2.9 },
  { pair:'AUD/JPY', longPct:33, shortPct:67, longVol:321,  shortVol:157,  longPos:915,   shortPos:1540,  bias:'bearish', change24h:-1.2 },
  { pair:'EUR/GBP', longPct:55, shortPct:45, longVol:680,  shortVol:556,  longPos:4380,  shortPos:3580,  bias:'bullish', change24h:+0.7 },
]
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

function cs(pair: string, y: 20|10|5): SeasonalBar[] {
  const s=y===10?0.9:y===5?0.8:1; const b=PAT[pair]||PAT['EUR/USD']; const p=POS[pair]||POS['EUR/USD']
  return b.map((avg,i)=>({month:i,label:ML[i],avg:parseFloat((avg*s).toFixed(2)),positive:p[i],bullish:avg>0}))
}
function cw(pair: string): WeekdayBar[] {
  const d=['Lun','Mar','Mer','Jeu','Ven']; const b=WDP[pair]||WDP['EUR/USD']
  return b.map((avg,i)=>({day:d[i],avg:parseFloat((avg*100).toFixed(3)),bullish:avg>0}))
}

// ── Mini donut inline ────────────────────────────────────────────────────────
function MiniDonut({ long, short }: { long: number; short: number }) {
  const R=14; const SW=4; const CX=18; const CY=18; const circ=2*Math.PI*R
  const gap=0.04*circ; const ld=(long/100)*circ-gap; const sd=(short/100)*circ-gap
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" style={{flexShrink:0}}>
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth={SW}/>
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#ef4444" strokeWidth={SW} strokeLinecap="round"
        strokeDasharray={`${sd} ${circ-sd}`} strokeDashoffset={circ/4}/>
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#22c55e" strokeWidth={SW} strokeLinecap="round"
        strokeDasharray={`${ld} ${circ-ld}`} strokeDashoffset={circ/4-(short/100)*circ}/>
    </svg>
  )
}

// ── Trend chart premium ───────────────────────────────────────────────────────
function TrendChart({ data, pair, years }: { data: SeasonalBar[]; pair: string; years: number }) {
  const pts: number[] = [100]
  data.forEach(b=>pts.push(parseFloat((pts[pts.length-1]*(1+b.avg/100)).toFixed(4))))
  const minV=Math.min(...pts); const maxV=Math.max(...pts); const rng=maxV-minV||0.01
  const W=800; const H=200; const PL=40; const PT=16; const PB=24; const PR=16
  const IW=W-PL-PR; const IH=H-PT-PB
  const x=(i:number)=>PL+i/(pts.length-1)*IW
  const y=(v:number)=>PT+IH-(v-minV)/rng*IH
  const path=pts.map((v,i)=>`${i===0?'M':'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const area=path+` L${x(pts.length-1).toFixed(1)},${PT+IH} L${PL},${PT+IH} Z`
  const nowX=x(NM+1)
  const gridVals=[minV,minV+rng*0.25,minV+rng*0.5,minV+rng*0.75,maxV]

  return (
    <div style={{background:'rgba(255,255,255,.015)',borderRadius:8,border:'1px solid rgba(255,255,255,.06)',overflow:'hidden'}}>
      <div style={{padding:'12px 16px 4px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span style={{fontSize:11,fontWeight:600,color:'#6a7d8f',letterSpacing:'.4px'}}>Seasonal Trend · {pair} · {years} Years</span>
        <div style={{display:'flex',gap:12}}>
          {[{c:'#38bdf8',l:'Trend'},{c:'#f0b429',l:'Maintenant'}].map(({c,l})=>(
            <div key={l} style={{display:'flex',alignItems:'center',gap:4}}>
              <span style={{width:12,height:2,background:c,display:'inline-block',borderRadius:1}}/>
              <span style={{fontSize:9,color:'#3d5060'}}>{l}</span>
            </div>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:H,display:'block'}}>
        <defs>
          <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.18"/>
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {gridVals.map((v,i)=>{
          const yg=y(v)
          return <g key={i}>
            <line x1={PL} y1={yg} x2={W-PR} y2={yg} stroke="rgba(255,255,255,.04)" strokeWidth="1"/>
            <text x={PL-5} y={yg+3} fontSize="7" fill="#2a3a4a" textAnchor="end" fontFamily="IBM Plex Mono">{v.toFixed(2)}</text>
          </g>
        })}
        {data.map((_,i)=>{
          const xm=x(i+0.5)
          return <line key={i} x1={xm} y1={PT} x2={xm} y2={PT+IH} stroke="rgba(255,255,255,.025)" strokeWidth="1"/>
        })}
        <path d={area} fill="url(#tg)"/>
        <path d={path} fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1={nowX} y1={PT} x2={nowX} y2={PT+IH} stroke="#f0b429" strokeWidth="1" strokeDasharray="3 3" opacity="0.7"/>
        {data.map((b,i)=>(
          <text key={i} x={x(i+0.5)} y={H-6} fontSize="8" fill={i===NM?'#f0b429':'#2a3a4a'} textAnchor="middle" fontWeight={i===NM?'700':'400'} fontFamily="IBM Plex Mono">{b.label}</text>
        ))}
      </svg>
    </div>
  )
}

// ── Monthly bars premium ──────────────────────────────────────────────────────
function MonthChart({ data }: { data: SeasonalBar[] }) {
  const mx=Math.max(...data.map(d=>Math.abs(d.avg)),0.01)
  const H=90; const BW=24; const W=data.length*(BW+5)+24; const z=H/2
  return (
    <div style={{background:'rgba(255,255,255,.015)',borderRadius:8,border:'1px solid rgba(255,255,255,.06)',padding:'12px 12px 4px'}}>
      <div style={{fontSize:10,fontWeight:600,color:'#6a7d8f',marginBottom:8,letterSpacing:'.4px'}}>Avg Return by Month (%)</div>
      <svg viewBox={`0 0 ${W} ${H+18}`} style={{width:'100%',height:H+18,display:'block'}}>
        <line x1="0" y1={z} x2={W} y2={z} stroke="rgba(255,255,255,.08)" strokeWidth="0.5"/>
        {data.map((b,i)=>{
          const bH=Math.max((Math.abs(b.avg)/mx)*(H/2-6),2)
          const x=12+i*(BW+5); const y=b.bullish?z-bH:z; const isN=i===NM
          return <g key={i}>
            <rect x={x} y={y} width={BW} height={bH} rx="2" fill={isN?'#f0b429':b.bullish?'#22bdf8':'#f87171'} opacity={isN?1:0.75}/>
            {Math.abs(b.avg)>0.3&&<text x={x+BW/2} y={b.bullish?y-3:y+bH+10} fontSize="7" fill={isN?'#f0b429':b.bullish?'#22bdf8':'#f87171'} textAnchor="middle" fontFamily="IBM Plex Mono">{b.avg>0?'+':''}{b.avg}</text>}
            <text x={x+BW/2} y={H+14} fontSize="8" fill={isN?'#f0b429':'#2a3a4a'} textAnchor="middle" fontWeight={isN?'700':'400'} fontFamily="IBM Plex Mono">{b.label}</text>
          </g>
        })}
      </svg>
    </div>
  )
}

// ── Weekday bars premium ──────────────────────────────────────────────────────
function WeekChart({ data }: { data: WeekdayBar[] }) {
  const mx=Math.max(...data.map(d=>Math.abs(d.avg)),0.001)
  const H=90; const BW=44; const W=data.length*(BW+12)+24; const z=H/2
  return (
    <div style={{background:'rgba(255,255,255,.015)',borderRadius:8,border:'1px solid rgba(255,255,255,.06)',padding:'12px 12px 4px'}}>
      <div style={{fontSize:10,fontWeight:600,color:'#6a7d8f',marginBottom:8,letterSpacing:'.4px'}}>Avg Return by Weekday (%)</div>
      <svg viewBox={`0 0 ${W} ${H+18}`} style={{width:'100%',height:H+18,display:'block'}}>
        <line x1="0" y1={z} x2={W} y2={z} stroke="rgba(255,255,255,.08)" strokeWidth="0.5"/>
        {data.map((b,i)=>{
          const bH=Math.max((Math.abs(b.avg)/mx)*(H/2-6),2)
          const x=12+i*(BW+12); const y=b.bullish?z-bH:z
          return <g key={i}>
            <rect x={x} y={y} width={BW} height={bH} rx="2" fill={b.bullish?'#22bdf8':'#f87171'} opacity={0.8}/>
            <text x={x+BW/2} y={b.bullish?y-4:y+bH+11} fontSize="8" fill={b.bullish?'#38bdf8':'#f87171'} textAnchor="middle" fontFamily="IBM Plex Mono">{b.avg>0?'+':''}{b.avg}</text>
            <text x={x+BW/2} y={H+14} fontSize="9" fill="#4a5e72" textAnchor="middle" fontFamily="IBM Plex Mono">{b.day}</text>
          </g>
        })}
      </svg>
    </div>
  )
}

// ── Gauge SVG ────────────────────────────────────────────────────────────────
function Gauge({ score }: { score: number }) {
  const CX=120; const CY=110; const R=88; const SW=11
  const lbl=score>=70?'Strong Buy':score>=55?'Buy':score>=45?'Neutral':score>=30?'Sell':'Strong Sell'
  const lc=score>=70?'#22c55e':score>=55?'#38bdf8':score>=45?'#f0b429':score>=30?'#f87171':'#ef4444'
  const na=Math.PI-(score/100)*Math.PI
  const nx=CX+(R-16)*Math.cos(na); const ny=CY-(R-16)*Math.sin(na)
  const seg=(s:number,e:number,c:string)=>{
    const sa=s*Math.PI/180; const ea=e*Math.PI/180
    const x1=CX+R*Math.cos(Math.PI-sa); const y1=CY-R*Math.sin(Math.PI-sa)
    const x2=CX+R*Math.cos(Math.PI-ea); const y2=CY-R*Math.sin(Math.PI-ea)
    return <path d={`M${x1.toFixed(1)} ${y1.toFixed(1)} A${R} ${R} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`} fill="none" stroke={c} strokeWidth={SW} strokeLinecap="round"/>
  }
  return (
    <svg width="240" height="130" viewBox="0 0 240 130">
      {/* Track */}
      <path d={`M${CX-R} ${CY} A${R} ${R} 0 0 1 ${CX+R} ${CY}`} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth={SW}/>
      {seg(4,  38,  '#ef4444')}
      {seg(42, 76,  '#f87171')}
      {seg(80, 100, '#f0b429')}
      {seg(100,120, '#f0b429')}
      {seg(124,158, '#38bdf8')}
      {seg(162,176, '#22c55e')}
      {/* Labels */}
      <text x="14"  y="115" fontSize="7" fill="#ef4444" textAnchor="middle">Strong</text>
      <text x="14"  y="124" fontSize="7" fill="#ef4444" textAnchor="middle">Sell</text>
      <text x="55"  y="68"  fontSize="7" fill="#f87171" textAnchor="middle">Sell</text>
      <text x="120" y="26"  fontSize="7" fill="#f0b429" textAnchor="middle">Neutral</text>
      <text x="185" y="68"  fontSize="7" fill="#38bdf8" textAnchor="middle">Buy</text>
      <text x="226" y="115" fontSize="7" fill="#22c55e" textAnchor="middle">Strong</text>
      <text x="226" y="124" fontSize="7" fill="#22c55e" textAnchor="middle">Buy</text>
      {/* Needle */}
      <line x1={CX} y1={CY} x2={nx.toFixed(1)} y2={ny.toFixed(1)} stroke={lc} strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx={CX} cy={CY} r="4" fill={lc}/>
      <text x={CX} y={CY+20} textAnchor="middle" fontSize="12" fontWeight="700" fill={lc} fontFamily="IBM Plex Mono">{lbl}</text>
    </svg>
  )
}

// ── Widget wrapper ────────────────────────────────────────────────────────────
type WidgetSize = 'normal' | 'large' | 'small'
function Widget({ title, children, onClose, size, onSize }: {
  title: string; children: React.ReactNode
  onClose: ()=>void; size: WidgetSize; onSize: (s: WidgetSize)=>void
}) {
  return (
    <div style={{background:'rgba(255,255,255,.015)',borderRadius:8,border:'1px solid rgba(255,255,255,.06)',overflow:'hidden',display:'flex',flexDirection:'column' as const}}>
      {/* Widget header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 12px',borderBottom:'0.5px solid rgba(255,255,255,.05)',background:'rgba(255,255,255,.02)',flexShrink:0}}>
        <span style={{fontSize:9,fontWeight:700,color:'#4a5e72',letterSpacing:'.8px',textTransform:'uppercase' as const}}>{title}</span>
        <div style={{display:'flex',gap:4}}>
          <button onClick={()=>onSize('small')} title="Réduire" style={{width:18,height:18,borderRadius:3,background:size==='small'?'rgba(240,180,41,.15)':'rgba(255,255,255,.04)',border:`0.5px solid ${size==='small'?'rgba(240,180,41,.3)':'rgba(255,255,255,.08)'}`,cursor:'pointer',color:size==='small'?'#f0b429':'#4a5e72',fontSize:9,display:'flex',alignItems:'center',justifyContent:'center',transition:'all 100ms'}} onMouseEnter={e=>e.currentTarget.style.color='#f0b429'} onMouseLeave={e=>e.currentTarget.style.color=size==='small'?'#f0b429':'#4a5e72'}>−</button>
          <button onClick={()=>onSize('normal')} title="Normal" style={{width:18,height:18,borderRadius:3,background:size==='normal'?'rgba(240,180,41,.15)':'rgba(255,255,255,.04)',border:`0.5px solid ${size==='normal'?'rgba(240,180,41,.3)':'rgba(255,255,255,.08)'}`,cursor:'pointer',color:size==='normal'?'#f0b429':'#4a5e72',fontSize:9,display:'flex',alignItems:'center',justifyContent:'center',transition:'all 100ms'}}>◼</button>
          <button onClick={()=>onSize('large')} title="Agrandir" style={{width:18,height:18,borderRadius:3,background:size==='large'?'rgba(240,180,41,.15)':'rgba(255,255,255,.04)',border:`0.5px solid ${size==='large'?'rgba(240,180,41,.3)':'rgba(255,255,255,.08)'}`,cursor:'pointer',color:size==='large'?'#f0b429':'#4a5e72',fontSize:9,display:'flex',alignItems:'center',justifyContent:'center',transition:'all 100ms'}} onMouseEnter={e=>e.currentTarget.style.color='#f0b429'} onMouseLeave={e=>e.currentTarget.style.color=size==='large'?'#f0b429':'#4a5e72'}>+</button>
          <div style={{width:'0.5px',height:14,background:'rgba(255,255,255,.08)',margin:'0 2px'}}/>
          <button onClick={onClose} title="Fermer" style={{width:18,height:18,borderRadius:3,background:'rgba(255,255,255,.04)',border:'0.5px solid rgba(255,255,255,.08)',cursor:'pointer',color:'#4a5e72',fontSize:9,display:'flex',alignItems:'center',justifyContent:'center',transition:'all 100ms'}} onMouseEnter={e=>e.currentTarget.style.color='#ef4444'} onMouseLeave={e=>e.currentTarget.style.color='#4a5e72'}>✕</button>
        </div>
      </div>
      <div style={{flex:1,overflow:'hidden'}}>
        {children}
      </div>
    </div>
  )
}
function DetailModal({ d, onClose }: { d: SentimentData; onClose: ()=>void }) {
  const iB=d.bias==='bullish'; const iS=d.bias==='bearish'
  const bc=iB?'#22c55e':iS?'#ef4444':'#64748b'
  const R=52; const SW=10; const CX=65; const CY=65; const circ=2*Math.PI*R
  const gap=0.03*circ; const ld=(d.longPct/100)*circ-gap; const sd=(d.shortPct/100)*circ-gap

  return (
    <div style={{position:'fixed' as const,inset:0,background:'rgba(0,0,0,.82)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(12px)'}} onClick={onClose}>
      <div style={{background:'#080c14',border:'1px solid rgba(255,255,255,.1)',borderRadius:16,padding:'28px 32px',maxWidth:720,width:'94%',boxShadow:'0 40px 120px rgba(0,0,0,.9)',maxHeight:'92vh',overflowY:'auto' as const}} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:22}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <span style={{fontSize:22,fontWeight:800,letterSpacing:'-0.5px',color:'#f0f4f8',fontFamily:'IBM Plex Mono,monospace'}}>{d.pair}</span>
            <span style={{fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:4,background:`${bc}12`,color:bc,border:`1px solid ${bc}22`,letterSpacing:'.8px',textTransform:'uppercase' as const}}>
              {iB?'▲ Majoritairement Long':iS?'▼ Majoritairement Short':'→ Neutre'}
            </span>
          </div>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:6,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.09)',color:'#5a7080',cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
        </div>

        {/* Table */}
        <div style={{marginBottom:20}}>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:'1.2px',color:'#4a5e72',textTransform:'uppercase' as const,marginBottom:8}}>Mesures Actuelles</div>
          <div style={{borderRadius:8,overflow:'hidden',border:'1px solid rgba(255,255,255,.07)'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr',padding:'8px 16px',background:'rgba(255,255,255,.03)',borderBottom:'1px solid rgba(255,255,255,.06)'}}>
              {['Symbole','Action','Pourcentage','Volume','Positions'].map(h=>(
                <span key={h} style={{fontSize:8,fontWeight:700,color:'#2d3f50',letterSpacing:'1px',textTransform:'uppercase' as const,textAlign:'center' as const}}>{h}</span>
              ))}
            </div>
            {[
              {label:'Court',pct:d.shortPct,vol:d.shortVol,pos:d.shortPos,color:'#ef4444',bg:'rgba(239,68,68,.025)'},
              {label:'Long', pct:d.longPct, vol:d.longVol, pos:d.longPos, color:'#22c55e',bg:'rgba(34,197,94,.025)'},
            ].map((row,i)=>(
              <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr',padding:'13px 16px',background:row.bg,borderBottom:i===0?'0.5px solid rgba(255,255,255,.04)':'none',alignItems:'center'}}>
                <span style={{fontSize:11,fontWeight:700,color:'#b8cad9',textAlign:'center' as const,fontFamily:'IBM Plex Mono,monospace'}}>{d.pair}</span>
                <span style={{fontSize:11,fontWeight:700,color:row.color,textAlign:'center' as const}}>{row.label}</span>
                <span style={{fontSize:16,fontWeight:800,color:row.color,textAlign:'center' as const,fontFamily:'IBM Plex Mono,monospace'}}>{row.pct}<span style={{fontSize:11}}> %</span></span>
                <span style={{fontSize:10,color:'#5a7080',textAlign:'center' as const,fontFamily:'IBM Plex Mono,monospace'}}>{row.vol.toLocaleString()} lots</span>
                <span style={{fontSize:10,color:'#5a7080',textAlign:'center' as const,fontFamily:'IBM Plex Mono,monospace'}}>{row.pos.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar */}
        <div style={{marginBottom:22}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
            <span style={{fontSize:11,fontWeight:700,color:'#22c55e'}}>Long {d.longPct}%</span>
            <span style={{fontSize:11,fontWeight:700,color:'#ef4444'}}>Short {d.shortPct}%</span>
          </div>
          <div style={{height:8,borderRadius:4,overflow:'hidden',background:'rgba(255,255,255,.05)',display:'flex'}}>
            <div style={{width:`${d.longPct}%`,background:'linear-gradient(90deg,#15803d,#22c55e)'}}/>
            <div style={{width:`${d.shortPct}%`,background:'linear-gradient(90deg,#ef4444,#b91c1c)'}}/>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',marginTop:4}}>
            <span style={{fontSize:8,color:'#2d3f50'}}>{d.longPos.toLocaleString()} positions</span>
            <span style={{fontSize:8,color:'#2d3f50'}}>{d.shortPos.toLocaleString()} positions</span>
          </div>
        </div>

        {/* Donut + Gauge */}
        <div style={{display:'grid',gridTemplateColumns:'160px 1fr',gap:20,padding:'18px 20px',background:'rgba(255,255,255,.02)',borderRadius:10,border:'1px solid rgba(255,255,255,.06)',marginBottom:18}}>
          <div style={{display:'flex',flexDirection:'column' as const,alignItems:'center',gap:10}}>
            <svg width="130" height="130" viewBox="0 0 130 130">
              <defs>
                <filter id="gG"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                <filter id="gR"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              </defs>
              <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth={SW}/>
              <circle cx={CX} cy={CY} r={R} fill="none" stroke="#ef4444" strokeWidth={SW} strokeLinecap="round"
                strokeDasharray={`${sd} ${circ-sd}`} strokeDashoffset={circ/4} filter="url(#gR)"/>
              <circle cx={CX} cy={CY} r={R} fill="none" stroke="#22c55e" strokeWidth={SW} strokeLinecap="round"
                strokeDasharray={`${ld} ${circ-ld}`} strokeDashoffset={circ/4-(d.shortPct/100)*circ} filter="url(#gG)"/>
              <text x={CX} y={CY-9} textAnchor="middle" fontSize="12" fontWeight="800" fill="#22c55e" fontFamily="IBM Plex Mono">{d.longPct}%</text>
              <text x={CX} y={CY+4} textAnchor="middle" fontSize="8" fill="#3d5060">Long / Short</text>
              <text x={CX} y={CY+20} textAnchor="middle" fontSize="12" fontWeight="800" fill="#ef4444" fontFamily="IBM Plex Mono">{d.shortPct}%</text>
            </svg>
            <div style={{display:'flex',gap:12}}>
              {[['#22c55e','Long'],['#ef4444','Short']].map(([c,l])=>(
                <div key={l} style={{display:'flex',alignItems:'center',gap:4}}>
                  <span style={{width:7,height:7,borderRadius:'50%',background:c,display:'inline-block'}}/>
                  <span style={{fontSize:9,color:'#5a7080'}}>{l}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column' as const,alignItems:'center',justifyContent:'center'}}>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:'1px',color:'#4a5e72',textTransform:'uppercase' as const,marginBottom:4}}>{d.pair} · Technical Analysis</div>
            <Gauge score={d.longPct}/>
          </div>
        </div>

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
          {[['Total Long',`${d.longVol.toLocaleString()} lots`,'#22c55e'],['Total Short',`${d.shortVol.toLocaleString()} lots`,'#ef4444'],['Var 24h',`${d.change24h>0?'+':''}${d.change24h}%`,d.change24h>0?'#22c55e':'#ef4444']].map(([l,v,c])=>(
            <div key={l as string} style={{padding:'11px 12px',borderRadius:7,background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.06)',textAlign:'center' as const}}>
              <div style={{fontSize:8,fontWeight:700,color:'#2a3a4a',letterSpacing:'1px',marginBottom:4,textTransform:'uppercase' as const}}>{l}</div>
              <div style={{fontSize:15,fontWeight:800,color:c as string,fontFamily:'IBM Plex Mono,monospace'}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:14,fontSize:7,color:'#1a2535',textAlign:'center' as const,letterSpacing:'.8px'}}>SOURCE: MYFXBOOK COMMUNITY OUTLOOK • DONNÉES EN TEMPS RÉEL</div>
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export function SentimentPanel() {
  const [sentiment,setSentiment]   = useState<SentimentData[]>(SF)
  const [pair,setPair]             = useState<Pair>('EUR/USD')
  const [years,setYears]           = useState<20|10|5>(10)
  const [seas,setSeas]             = useState<SeasonalBar[]>([])
  const [wdays,setWdays]           = useState<WeekdayBar[]>([])
  const [refreshing,setRefreshing] = useState(false)
  const [lastUpd,setLastUpd]       = useState('')
  const [tab,setTab]               = useState<'combined'|'sentiment'|'seasonality'>('combined')
  const [modal,setModal]           = useState<SentimentData|null>(null)

  // Widget states
  type WState = { visible: boolean; size: WidgetSize }
  const [wTrend,setWTrend]     = useState<WState>({visible:true,size:'normal'})
  const [wMonths,setWMonths]   = useState<WState>({visible:true,size:'normal'})
  const [wWeek,setWWeek]       = useState<WState>({visible:true,size:'normal'})
  const [wGrid,setWGrid]       = useState<WState>({visible:true,size:'normal'})

  const sizeH: Record<WidgetSize,string> = { small:'120px', normal:'auto', large:'400px' }

  const fetch_ = useCallback(async()=>{
    setRefreshing(true)
    try {
      const r=await fetch('/api/sentiment',{cache:'no-store'})
      const j=await r.json()
      if(j.ok&&j.data?.length>0) setSentiment(j.data)
      setLastUpd(new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}))
    } catch { setSentiment(SF) }
    finally { setRefreshing(false) }
  },[])

  useEffect(()=>{ fetch_(); const id=setInterval(fetch_,60000); return()=>clearInterval(id) },[fetch_])
  useEffect(()=>{ setSeas(cs(pair,years)); setWdays(cw(pair)) },[pair,years])

  const sel=sentiment.find(s=>s.pair===pair)||sentiment[0]
  const cur=seas[NM]
  const bc=sel?.bias==='bullish'?'#22c55e':sel?.bias==='bearish'?'#ef4444':'#64748b'

  const pill=(active:boolean,color='#a78bfa')=>({
    padding:'4px 12px',borderRadius:20,fontSize:10,fontWeight:600 as const,cursor:'pointer' as const,
    border:`1px solid ${active?color+'55':'rgba(255,255,255,.07)'}`,
    background:active?color+'10':'transparent',
    color:active?color:'#3d5060',transition:'all 150ms',fontFamily:'inherit',
  })

  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',background:'#050810',fontFamily:"'Inter',-apple-system,sans-serif",overflow:'hidden'}}>
      {modal&&<DetailModal d={modal} onClose={()=>setModal(null)}/>}

      {/* ── HEADER ── */}
      <div style={{flexShrink:0,background:'linear-gradient(180deg,rgba(10,14,24,.98) 0%,rgba(5,8,16,.98) 100%)',borderBottom:'1px solid rgba(255,255,255,.055)'}}>
        <div style={{padding:'20px 40px 0',display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:0}}>
          <div>
            <div style={{fontSize:10,fontWeight:600,letterSpacing:'2.5px',color:'#2d3f50',textTransform:'uppercase' as const,marginBottom:4}}>Institutional Trading Desk</div>
            <h1 style={{fontSize:26,fontWeight:800,letterSpacing:'-0.7px',color:'#eef2f7',margin:0,lineHeight:1}}>
              Sentiment <span style={{color:'#a78bfa'}}>&</span> Saisonnalité
            </h1>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10,paddingBottom:2}}>
            {refreshing&&<span style={{fontSize:9,color:'#a78bfa',fontWeight:700,letterSpacing:'.5px',animation:'t-pulse 1s infinite'}}>● LIVE</span>}
            {lastUpd&&<span style={{fontSize:9,color:'#1e2c3d',letterSpacing:'.4px',fontFamily:'IBM Plex Mono,monospace'}}>Updated {lastUpd}</span>}
            <button onClick={fetch_} style={{padding:'5px 12px',borderRadius:5,fontSize:9,fontWeight:700,cursor:'pointer',border:'1px solid rgba(255,255,255,.09)',background:'rgba(255,255,255,.04)',color:'#6a7d8f',fontFamily:'inherit',letterSpacing:'.5px',transition:'all 150ms'}} onMouseEnter={e=>e.currentTarget.style.color='#c8d6e5'} onMouseLeave={e=>e.currentTarget.style.color='#6a7d8f'}>↻ REFRESH</button>
          </div>
        </div>
        {/* Tabs */}
        <div style={{display:'flex',padding:'0 40px',borderBottom:'1px solid rgba(255,255,255,.05)',marginTop:16}}>
          {([['combined','⚡ Vue combinée'],['sentiment','👥 Sentiment Retail'],['seasonality','📈 Saisonnalité']] as const).map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:'11px 22px',fontSize:12,fontWeight:tab===t?700:400,cursor:'pointer',border:'none',borderBottom:tab===t?'2px solid #a78bfa':'2px solid transparent',background:'transparent',color:tab===t?'#f0f4f8':'#3d5060',transition:'all 150ms',fontFamily:'inherit',marginBottom:-1,letterSpacing:tab===t?'-0.2px':'0'}}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* ══ VUE COMBINÉE ══ */}
      {tab==='combined'&&(
        <div style={{flex:1,display:'flex',minHeight:0,overflow:'hidden'}}>

          {/* Left panel — sentiment list */}
          <div style={{width:280,flexShrink:0,borderRight:'1px solid rgba(255,255,255,.05)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
            <div style={{padding:'8px 16px',borderBottom:'0.5px solid rgba(255,255,255,.04)',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span style={{fontSize:8,fontWeight:700,letterSpacing:'1.5px',color:'#2d3f50',textTransform:'uppercase' as const}}>Myfxbook Sentiment</span>
              <span style={{fontSize:8,color:'#1e2c3d',letterSpacing:'.4px'}}>Cliquez pour détails</span>
            </div>
            <div style={{flex:1,overflowY:'auto' as const}}>
              {sentiment.map(s=>{
                const iB=s.bias==='bullish'; const iS=s.bias==='bearish'
                const bc2=iB?'#22c55e':iS?'#ef4444':'#64748b'
                const isSel=pair===s.pair
                return (
                  <div key={s.pair} onClick={()=>setPair(s.pair as Pair)} style={{padding:'10px 14px',borderBottom:'0.5px solid rgba(255,255,255,.03)',cursor:'pointer',background:isSel?'rgba(167,139,250,.04)':'transparent',borderLeft:isSel?'2px solid #a78bfa':'2px solid transparent',transition:'all 80ms'}}
                    onMouseEnter={e=>{if(!isSel)(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,.02)'}}
                    onMouseLeave={e=>{if(!isSel)(e.currentTarget as HTMLElement).style.background='transparent'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                      <MiniDonut long={s.longPct} short={s.shortPct}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
                          <span style={{fontSize:12,fontWeight:700,color:'#eef2f7',fontFamily:'IBM Plex Mono,monospace'}}>{s.pair}</span>
                          <span style={{fontSize:7,fontWeight:800,padding:'1px 5px',borderRadius:2,background:`${bc2}14`,color:bc2,border:`0.5px solid ${bc2}30`,letterSpacing:'.5px'}}>{iB?'▲ LONG':iS?'▼ SHORT':'→'}</span>
                          <span style={{marginLeft:'auto',fontSize:9,fontWeight:600,color:s.change24h>0?'#22c55e':'#ef4444',fontFamily:'IBM Plex Mono,monospace'}}>{s.change24h>0?'+':''}{s.change24h}%</span>
                        </div>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                          <span style={{fontSize:9,fontWeight:700,color:'#22c55e',fontFamily:'IBM Plex Mono,monospace'}}>{s.longPct}%</span>
                          <span style={{fontSize:9,fontWeight:700,color:'#ef4444',fontFamily:'IBM Plex Mono,monospace'}}>{s.shortPct}%</span>
                        </div>
                        <div style={{height:3,borderRadius:2,background:'rgba(255,255,255,.05)',overflow:'hidden',position:'relative' as const}}>
                          <div style={{position:'absolute' as const,left:0,top:0,height:'100%',width:`${s.longPct}%`,background:'rgba(34,197,94,.55)',borderRadius:'2px 0 0 2px'}}/>
                          <div style={{position:'absolute' as const,right:0,top:0,height:'100%',width:`${s.shortPct}%`,background:'rgba(239,68,68,.55)',borderRadius:'0 2px 2px 0'}}/>
                        </div>
                      </div>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',paddingLeft:44}}>
                      <span style={{fontSize:7,color:'#2a3a4a',fontFamily:'IBM Plex Mono,monospace'}}>{s.longVol.toLocaleString()} L</span>
                      <button onClick={e=>{e.stopPropagation();setModal(s)}} style={{fontSize:7,color:'#a78bfa',background:'transparent',border:'none',cursor:'pointer',padding:0,letterSpacing:'.3px'}}>Voir détails →</button>
                      <span style={{fontSize:7,color:'#2a3a4a',fontFamily:'IBM Plex Mono,monospace'}}>{s.shortVol.toLocaleString()} S</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{padding:'4px 14px',borderTop:'0.5px solid rgba(255,255,255,.03)',flexShrink:0}}>
              <span style={{fontSize:7,color:'#1a2535',letterSpacing:'.5px'}}>MYFXBOOK • REFRESH 60S</span>
            </div>
          </div>

          {/* Right — seasonality */}
          <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
            {/* Subheader */}
            <div style={{padding:'8px 20px',borderBottom:'0.5px solid rgba(255,255,255,.04)',flexShrink:0,display:'flex',alignItems:'center',gap:10,background:'rgba(255,255,255,.01)'}}>
              <span style={{fontSize:13,fontWeight:700,color:'#eef2f7',fontFamily:'IBM Plex Mono,monospace'}}>{pair}</span>
              {cur&&(
                <span style={{fontSize:9,padding:'2px 8px',borderRadius:3,background:cur.bullish?'rgba(34,197,94,.08)':'rgba(239,68,68,.08)',color:cur.bullish?'#22c55e':'#ef4444',border:`0.5px solid ${cur.bullish?'rgba(34,197,94,.2)':'rgba(239,68,68,.2)'}`,fontWeight:600,letterSpacing:'.3px'}}>
                  {ML[NM]}: {cur.avg>0?'+':''}{cur.avg}% · {cur.positive}% pos
                </span>
              )}
              <div style={{flex:1}}/>
              {([20,10,5] as const).map(y=><button key={y} onClick={()=>setYears(y)} style={pill(years===y)}>{y} ans</button>)}
            </div>

            <div style={{flex:1,overflowY:'auto' as const,padding:'14px 20px',display:'flex',flexDirection:'column',gap:10}}>

              {/* Bouton réafficher widgets masqués */}
              {(!wTrend.visible||!wMonths.visible||!wWeek.visible||!wGrid.visible)&&(
                <div style={{display:'flex',gap:6,flexWrap:'wrap' as const,padding:'4px 0'}}>
                  {!wTrend.visible&&<button onClick={()=>setWTrend(w=>({...w,visible:true}))} style={{fontSize:9,padding:'3px 10px',borderRadius:3,border:'0.5px solid rgba(240,180,41,.3)',background:'rgba(240,180,41,.06)',color:'#f0b429',cursor:'pointer',fontFamily:'inherit'}}>+ Trend</button>}
                  {!wMonths.visible&&<button onClick={()=>setWMonths(w=>({...w,visible:true}))} style={{fontSize:9,padding:'3px 10px',borderRadius:3,border:'0.5px solid rgba(240,180,41,.3)',background:'rgba(240,180,41,.06)',color:'#f0b429',cursor:'pointer',fontFamily:'inherit'}}>+ Monthly</button>}
                  {!wWeek.visible&&<button onClick={()=>setWWeek(w=>({...w,visible:true}))} style={{fontSize:9,padding:'3px 10px',borderRadius:3,border:'0.5px solid rgba(240,180,41,.3)',background:'rgba(240,180,41,.06)',color:'#f0b429',cursor:'pointer',fontFamily:'inherit'}}>+ Weekday</button>}
                  {!wGrid.visible&&<button onClick={()=>setWGrid(w=>({...w,visible:true}))} style={{fontSize:9,padding:'3px 10px',borderRadius:3,border:'0.5px solid rgba(240,180,41,.3)',background:'rgba(240,180,41,.06)',color:'#f0b429',cursor:'pointer',fontFamily:'inherit'}}>+ Grille mensuelle</button>}
                </div>
              )}

              {wTrend.visible&&(
                <div style={{maxHeight:wTrend.size==='small'?140:wTrend.size==='large'?440:'none',overflow:'hidden',transition:'max-height 200ms ease'}}>
                  <Widget title={`Seasonal Trend · ${pair} · ${years} ans`} size={wTrend.size} onSize={s=>setWTrend(w=>({...w,size:s}))} onClose={()=>setWTrend(w=>({...w,visible:false}))}>
                    <TrendChart data={seas} pair={pair} years={years}/>
                  </Widget>
                </div>
              )}

              <div style={{display:'grid',gridTemplateColumns:`${wMonths.visible&&wWeek.visible?'1fr 1fr':wMonths.visible||wWeek.visible?'1fr':'none'}`,gap:10}}>
                {wMonths.visible&&(
                  <div style={{maxHeight:wMonths.size==='small'?100:wMonths.size==='large'?320:'none',overflow:'hidden'}}>
                    <Widget title="Avg Return by Month (%)" size={wMonths.size} onSize={s=>setWMonths(w=>({...w,size:s}))} onClose={()=>setWMonths(w=>({...w,visible:false}))}>
                      <div style={{padding:'8px 12px 4px'}}><MonthChart data={seas}/></div>
                    </Widget>
                  </div>
                )}
                {wWeek.visible&&(
                  <div style={{maxHeight:wWeek.size==='small'?100:wWeek.size==='large'?320:'none',overflow:'hidden'}}>
                    <Widget title="Avg Return by Weekday (%)" size={wWeek.size} onSize={s=>setWWeek(w=>({...w,size:s}))} onClose={()=>setWWeek(w=>({...w,visible:false}))}>
                      <div style={{padding:'8px 12px 4px'}}><WeekChart data={wdays}/></div>
                    </Widget>
                  </div>
                )}
              </div>

              {wGrid.visible&&(
                <Widget title="Grille mensuelle" size={wGrid.size} onSize={s=>setWGrid(w=>({...w,size:s}))} onClose={()=>setWGrid(w=>({...w,visible:false}))}>
                  <div style={{padding:'10px 12px',maxHeight:wGrid.size==='small'?80:wGrid.size==='large'?400:'none',overflow:'hidden'}}>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:5}}>
                      {seas.map((b,i)=>(
                        <div key={i} style={{padding:'7px 8px',borderRadius:5,background:i===NM?'rgba(240,180,41,.05)':'rgba(255,255,255,.015)',border:`1px solid ${i===NM?'rgba(240,180,41,.18)':'rgba(255,255,255,.04)'}`}}>
                          <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                            <span style={{fontSize:9,fontWeight:700,color:i===NM?'#f0b429':'#6a7d8f'}}>{b.label}</span>
                            <span style={{fontSize:9,fontWeight:700,color:b.bullish?'#22c55e':'#ef4444',fontFamily:'IBM Plex Mono,monospace'}}>{b.avg>0?'+':''}{b.avg}%</span>
                          </div>
                          <div style={{height:2,borderRadius:1,background:'rgba(255,255,255,.05)',overflow:'hidden',marginBottom:2}}>
                            <div style={{height:'100%',width:`${b.positive}%`,background:b.bullish?'rgba(34,197,94,.5)':'rgba(239,68,68,.5)',borderRadius:1}}/>
                          </div>
                          <span style={{fontSize:7,color:'#2a3a4a'}}>{b.positive}% positif</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Widget>
              )}
              <div style={{height:8}}/>
            </div>
          </div>
        </div>
      )}

      {/* ══ SENTIMENT SEUL ══ */}
      {tab==='sentiment'&&(
        <>
          <div style={{padding:'8px 40px',borderBottom:'0.5px solid rgba(255,255,255,.04)',flexShrink:0,background:'rgba(255,255,255,.01)'}}>
            <span style={{fontSize:8,fontWeight:700,letterSpacing:'1.8px',color:'#2a3a4a',textTransform:'uppercase' as const}}>Myfxbook Community Outlook — Cliquez pour le détail</span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'110px 90px 1fr 72px 72px 88px 82px',padding:'7px 40px',background:'rgba(0,0,0,.3)',borderBottom:'0.5px solid rgba(255,255,255,.04)',flexShrink:0}}>
            {['Paire','Biais','Ratio Long / Short','Long %','Short %','Vol. Long','Var 24h'].map((h,i)=>(
              <span key={i} style={{fontSize:8,fontWeight:700,color:'#2a3a4a',letterSpacing:'1px',textTransform:'uppercase' as const,textAlign:i>2?'right' as const:'left' as const}}>{h}</span>
            ))}
          </div>
          <div style={{flex:1,overflowY:'auto' as const}}>
            {sentiment.map(s=>{
              const iB=s.bias==='bullish'; const iS=s.bias==='bearish'; const bc2=iB?'#22c55e':iS?'#ef4444':'#64748b'
              return (
                <div key={s.pair} onClick={()=>setModal(s)} style={{display:'grid',gridTemplateColumns:'110px 90px 1fr 72px 72px 88px 82px',alignItems:'center',padding:'13px 40px',borderBottom:'0.5px solid rgba(255,255,255,.035)',borderLeft:`2px solid ${bc2}28`,transition:'background 80ms',cursor:'pointer'}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.02)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <span style={{fontSize:13,fontWeight:700,color:'#eef2f7',fontFamily:'IBM Plex Mono,monospace'}}>{s.pair}</span>
                  <span style={{fontSize:9,fontWeight:800,padding:'2px 8px',borderRadius:3,background:`${bc2}12`,color:bc2,border:`0.5px solid ${bc2}30`,letterSpacing:'.6px',width:'fit-content'}}>{iB?'▲ LONG':iS?'▼ SHORT':'→'}</span>
                  <div style={{paddingRight:20}}>
                    <div style={{height:5,borderRadius:3,background:'rgba(255,255,255,.04)',overflow:'hidden',position:'relative' as const}}>
                      <div style={{position:'absolute' as const,left:0,top:0,height:'100%',width:`${s.longPct}%`,background:'rgba(34,197,94,.6)',borderRadius:'3px 0 0 3px'}}/>
                      <div style={{position:'absolute' as const,right:0,top:0,height:'100%',width:`${s.shortPct}%`,background:'rgba(239,68,68,.6)',borderRadius:'0 3px 3px 0'}}/>
                    </div>
                  </div>
                  <span style={{fontSize:13,fontWeight:700,color:'#22c55e',textAlign:'right' as const,fontFamily:'IBM Plex Mono,monospace'}}>{s.longPct}%</span>
                  <span style={{fontSize:13,fontWeight:700,color:'#ef4444',textAlign:'right' as const,fontFamily:'IBM Plex Mono,monospace'}}>{s.shortPct}%</span>
                  <span style={{fontSize:10,color:'#5a7080',textAlign:'right' as const,fontFamily:'IBM Plex Mono,monospace'}}>{s.longVol.toLocaleString()}</span>
                  <span style={{fontSize:11,fontWeight:600,color:s.change24h>0?'#22c55e':'#ef4444',textAlign:'right' as const,fontFamily:'IBM Plex Mono,monospace'}}>{s.change24h>0?'+':''}{s.change24h}%</span>
                </div>
              )
            })}
          </div>
          <div style={{padding:'5px 40px',borderTop:'0.5px solid rgba(255,255,255,.04)',flexShrink:0,background:'rgba(0,0,0,.18)'}}>
            <span style={{fontSize:7,color:'#1a2535',letterSpacing:'.5px'}}>MYFXBOOK COMMUNITY OUTLOOK • REFRESH AUTO 60S • CLIQUEZ SUR UNE PAIRE POUR LE DÉTAIL</span>
          </div>
        </>
      )}

      {/* ══ SAISONNALITÉ SEULE ══ */}
      {tab==='seasonality'&&(
        <>
          <div style={{padding:'8px 40px',borderBottom:'0.5px solid rgba(255,255,255,.04)',flexShrink:0,display:'flex',alignItems:'center',gap:6,flexWrap:'wrap' as const,background:'rgba(255,255,255,.01)'}}>
            {PAIRS.map(p=><button key={p} onClick={()=>setPair(p)} style={pill(pair===p)}>{p}</button>)}
            <div style={{width:1,height:16,background:'rgba(255,255,255,.07)',margin:'0 6px'}}/>
            {([20,10,5] as const).map(y=><button key={y} onClick={()=>setYears(y)} style={pill(years===y)}>{y} ans</button>)}
          </div>
          <div style={{flex:1,overflowY:'auto' as const,padding:'16px 40px',display:'flex',flexDirection:'column',gap:12}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:15,fontWeight:700,color:'#eef2f7',fontFamily:'IBM Plex Mono,monospace'}}>{pair}</span>
              {cur&&<span style={{fontSize:10,padding:'3px 10px',borderRadius:4,background:cur.bullish?'rgba(34,197,94,.08)':'rgba(239,68,68,.08)',color:cur.bullish?'#22c55e':'#ef4444',border:`0.5px solid ${cur.bullish?'rgba(34,197,94,.2)':'rgba(239,68,68,.2)'}`,fontWeight:600}}>
                {ML[NM]}: {cur.avg>0?'+':''}{cur.avg}% · {cur.positive}% années positives
              </span>}
            </div>
            <TrendChart data={seas} pair={pair} years={years}/>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <MonthChart data={seas}/>
              <WeekChart data={wdays}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:6,paddingBottom:16}}>
              {seas.map((b,i)=>(
                <div key={i} style={{padding:'11px 10px',borderRadius:6,background:i===NM?'rgba(240,180,41,.05)':'rgba(255,255,255,.015)',border:`1px solid ${i===NM?'rgba(240,180,41,.18)':'rgba(255,255,255,.04)'}`}}>
                  <div style={{fontSize:10,fontWeight:700,color:i===NM?'#f0b429':'#6a7d8f',marginBottom:5}}>{b.label}</div>
                  <div style={{fontSize:16,fontWeight:800,color:b.bullish?'#22c55e':'#ef4444',fontFamily:'IBM Plex Mono,monospace',marginBottom:4}}>{b.avg>0?'+':''}{b.avg}%</div>
                  <div style={{height:2,borderRadius:1,background:'rgba(255,255,255,.05)',overflow:'hidden',marginBottom:3}}>
                    <div style={{height:'100%',width:`${b.positive}%`,background:b.bullish?'rgba(34,197,94,.5)':'rgba(239,68,68,.5)',borderRadius:1}}/>
                  </div>
                  <div style={{fontSize:8,color:'#3d5060'}}>{b.positive}% pos</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{padding:'5px 40px',borderTop:'0.5px solid rgba(255,255,255,.04)',flexShrink:0,background:'rgba(0,0,0,.18)'}}>
            <span style={{fontSize:7,color:'#1a2535',letterSpacing:'.5px'}}>SAISONNALITÉ CALCULÉE SUR {years} ANS · INSPIRÉ DE SEASONAX · PATTERNS HISTORIQUES FX</span>
          </div>
        </>
      )}
    </div>
  )
}
