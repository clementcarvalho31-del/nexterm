'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

type ImpactLevel = 'high' | 'med' | 'low'
type Tab = 'calendar' | 'news'
type DateRange = 'today' | 'tomorrow' | 'this_week' | 'next_week' | 'custom'

interface RawFFEvent {
  title: string; country: string; date: string; time: string
  impact: string; forecast: string; previous: string; actual: string
}
interface CalEvent extends RawFFEvent {
  id: string; flag: string; impactLevel: ImpactLevel
  forecastLow?: string; forecastHigh?: string
}
interface NewsItem {
  id: string; title: string; date: string; tags: string[]
  impact: ImpactLevel; currency: string; age: string
}

const FLAGS: Record<string,string> = { USD:'🇺🇸',EUR:'🇪🇺',GBP:'🇬🇧',JPY:'🇯🇵',CAD:'🇨🇦',AUD:'🇦🇺',NZD:'🇳🇿',CHF:'🇨🇭',CNY:'🇨🇳' }
const CCY_COLORS: Record<string,{bg:string;color:string}> = {
  USD:{ bg:'rgba(34,197,94,.1)',   color:'#22c55e' }, EUR:{ bg:'rgba(59,130,246,.1)',  color:'#3b82f6' },
  GBP:{ bg:'rgba(139,92,246,.1)', color:'#8b5cf6' }, JPY:{ bg:'rgba(239,68,68,.1)',   color:'#ef4444' },
  CAD:{ bg:'rgba(240,180,41,.1)', color:'#f0b429' }, AUD:{ bg:'rgba(6,182,212,.1)',   color:'#06b6d4' },
  NZD:{ bg:'rgba(16,185,129,.1)', color:'#10b981' }, CHF:{ bg:'rgba(107,114,128,.1)', color:'#9ca3af' },
  CNY:{ bg:'rgba(249,115,22,.1)', color:'#f97316' },
}

// ── Date range helpers ────────────────────────────────────────────────────────
function getDateBounds(range: DateRange, customStart?: Date, customEnd?: Date): { start: Date; end: Date } {
  const now = new Date(); now.setHours(0,0,0,0)
  const end = new Date(now)
  if (range === 'today') {
    end.setHours(23,59,59,999); return { start: now, end }
  }
  if (range === 'tomorrow') {
    const s = new Date(now); s.setDate(s.getDate()+1)
    const e = new Date(s); e.setHours(23,59,59,999); return { start: s, end: e }
  }
  if (range === 'this_week') {
    const s = new Date(now)
    const day = s.getDay(); const diff = day === 0 ? -6 : 1 - day
    s.setDate(s.getDate() + diff)
    const e = new Date(s); e.setDate(e.getDate() + 6); e.setHours(23,59,59,999)
    return { start: s, end: e }
  }
  if (range === 'next_week') {
    const s = new Date(now)
    const day = s.getDay(); const diff = day === 0 ? 1 : 8 - day
    s.setDate(s.getDate() + diff)
    const e = new Date(s); e.setDate(e.getDate() + 6); e.setHours(23,59,59,999)
    return { start: s, end: e }
  }
  if (range === 'custom' && customStart && customEnd) {
    const e = new Date(customEnd); e.setHours(23,59,59,999)
    return { start: customStart, end: e }
  }
  // default: this_week
  const s = new Date(now); const day = s.getDay(); s.setDate(s.getDate()+(day===0?-6:1-day))
  const e = new Date(s); e.setDate(e.getDate()+6); e.setHours(23,59,59,999)
  return { start: s, end: e }
}

function isoDate(d: Date) { return d.toISOString().slice(0,10) }
function getDaysInMonth(year: number, month: number) { return new Date(year, month+1, 0).getDate() }
function getFirstDayOfMonth(year: number, month: number) { return new Date(year, month, 1).getDay() }

function getImpactLevel(impact: string): ImpactLevel {
  if (!impact) return 'low'; const i = impact.toLowerCase()
  if (i.includes('high')) return 'high'; if (i.includes('medium')||i.includes('moderate')) return 'med'; return 'low'
}
function forecastRange(forecast: string) {
  if (!forecast) return null
  const val = parseFloat(forecast.replace(/[^0-9.-]/g,''))
  if (isNaN(val)) return null
  const unit = forecast.replace(/[\d.-]/g,'').trim()
  const d = Math.abs(val)>100?val*0.08:Math.abs(val)>10?val*0.12:Math.abs(val)>1?val*0.15:0.1
  const f = (n:number) => (Math.round(n*100)/100)+unit
  return { low:f(val-d), high:f(val+d) }
}
function enrichEvent(e: RawFFEvent, i: number): CalEvent {
  const r = forecastRange(e.forecast)
  return { ...e, id:`ev-${i}`, flag:FLAGS[e.country]||'🌐', impactLevel:getImpactLevel(e.impact), forecastLow:r?.low, forecastHigh:r?.high }
}
function groupByDay(events: CalEvent[]): [string,CalEvent[]][] {
  const map = new Map<string,CalEvent[]>()
  events.forEach(e => {
    const d = new Date(e.date)
    const key = d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'}).toUpperCase()
    if (!map.has(key)) map.set(key,[])
    map.get(key)!.push(e)
  })
  return Array.from(map.entries())
}
function getSurprise(actual: string, forecast: string): 'beat'|'miss'|'inline'|null {
  if (!actual||actual==='—') return null
  const a = parseFloat(actual.replace(/[^0-9.-]/g,'')), f = parseFloat(forecast.replace(/[^0-9.-]/g,''))
  if (isNaN(a)||isNaN(f)) return null
  const diff = Math.abs(a-f), threshold = Math.abs(f)*0.02||0.05
  if (diff < threshold) return 'inline'; return a>f?'beat':'miss'
}
function getCountdown(dateStr: string, timeStr: string): { display: string; urgent: boolean; passed: boolean } {
  try {
    const d = new Date(dateStr)
    const t = timeStr?.toLowerCase().replace(' ','') || ''
    const pm = t.includes('pm'), am = t.includes('am')
    const clean = t.replace('am','').replace('pm','')
    const [hS,mS] = clean.split(':'); let h = parseInt(hS)||0; const m = parseInt(mS)||0
    if (pm&&h!==12) h+=12; if (am&&h===12) h=0
    d.setHours(h,m,0,0)
    const diff = d.getTime()-Date.now()
    if (diff<0) return { display:'Passé', urgent:false, passed:true }
    const hrs=Math.floor(diff/3600000), mins=Math.floor((diff%3600000)/60000), secs=Math.floor((diff%60000)/1000)
    if (hrs>0) return { display:`${hrs}h${mins.toString().padStart(2,'0')}`, urgent:false, passed:false }
    return { display:`${mins}m${secs.toString().padStart(2,'0')}s`, urgent:diff<900000, passed:false }
  } catch { return { display:'—', urgent:false, passed:false } }
}
function timeAgo(dateStr: string): string {
  const diff = Date.now()-new Date(dateStr).getTime(); const m = Math.floor(diff/60000)
  if (m<1) return 'now'; if (m<60) return `${m}m`
  const h = Math.floor(m/60); if (h<24) return `${h}h`; return `${Math.floor(h/24)}d`
}
function detectCurrency(title: string, tags: string[]): string {
  const all = [title,...tags].join(' ').toUpperCase()
  for (const c of ['USD','EUR','GBP','JPY','CAD','AUD','NZD','CHF','CNY']) if (all.includes(c)) return c
  return 'ALL'
}
function detectImpact(title: string): ImpactLevel {
  const t = title.toLowerCase()
  if (['fed','fomc','cpi','nfp','payroll','gdp','ecb','boe','boj','inflation','rate decision','recession','crisis'].some(w=>t.includes(w))) return 'high'
  if (['pmi','retail','housing','jobless','ism','sentiment','industrial','trade'].some(w=>t.includes(w))) return 'med'
  return 'low'
}

// ── Fallback data ─────────────────────────────────────────────────────────────
const FF_FALLBACK: RawFFEvent[] = [
  {title:'US CPI m/m',country:'USD',date:new Date(Date.now()+86400000).toISOString(),time:'08:30am',impact:'High Impact Expected',forecast:'0.3%',previous:'0.2%',actual:''},
  {title:'US Core CPI m/m',country:'USD',date:new Date(Date.now()+86400000).toISOString(),time:'08:30am',impact:'High Impact Expected',forecast:'0.3%',previous:'0.3%',actual:''},
  {title:'UK CPI y/y',country:'GBP',date:new Date(Date.now()+86400000).toISOString(),time:'04:00am',impact:'High Impact Expected',forecast:'3.1%',previous:'3.4%',actual:''},
  {title:'German ifo Business Climate',country:'EUR',date:new Date(Date.now()+86400000).toISOString(),time:'04:00am',impact:'Medium Impact Expected',forecast:'89.5',previous:'87.5',actual:''},
  {title:'Initial Jobless Claims',country:'USD',date:new Date(Date.now()+172800000).toISOString(),time:'08:30am',impact:'Medium Impact Expected',forecast:'215K',previous:'222K',actual:''},
  {title:'FOMC Meeting Minutes',country:'USD',date:new Date(Date.now()+172800000).toISOString(),time:'02:00pm',impact:'High Impact Expected',forecast:'',previous:'',actual:''},
  {title:'ECB Interest Rate Decision',country:'EUR',date:new Date(Date.now()+172800000).toISOString(),time:'08:15am',impact:'High Impact Expected',forecast:'4.00%',previous:'4.25%',actual:''},
  {title:'ECB Press Conference',country:'EUR',date:new Date(Date.now()+172800000).toISOString(),time:'08:45am',impact:'High Impact Expected',forecast:'',previous:'',actual:''},
  {title:'Non-Farm Payrolls',country:'USD',date:new Date(Date.now()+259200000).toISOString(),time:'08:30am',impact:'High Impact Expected',forecast:'175K',previous:'151K',actual:''},
  {title:'Unemployment Rate',country:'USD',date:new Date(Date.now()+259200000).toISOString(),time:'08:30am',impact:'High Impact Expected',forecast:'4.0%',previous:'4.1%',actual:''},
  {title:'Average Hourly Earnings m/m',country:'USD',date:new Date(Date.now()+259200000).toISOString(),time:'08:30am',impact:'High Impact Expected',forecast:'0.3%',previous:'0.3%',actual:''},
  {title:'BOJ Policy Rate',country:'JPY',date:new Date(Date.now()+259200000).toISOString(),time:'11:00pm',impact:'High Impact Expected',forecast:'0.5%',previous:'0.5%',actual:''},
  {title:'Canada Employment Change',country:'CAD',date:new Date(Date.now()+259200000).toISOString(),time:'08:30am',impact:'High Impact Expected',forecast:'20K',previous:'32K',actual:''},
  {title:'ISM Manufacturing PMI',country:'USD',date:new Date(Date.now()+345600000).toISOString(),time:'10:00am',impact:'Medium Impact Expected',forecast:'50.8',previous:'50.3',actual:''},
]
const NEWS_FALLBACK: NewsItem[] = [
  {id:'n1',title:'FED WILLIAMS — No rush to cut rates. Inflation still too high, data must confirm before any policy pivot.',date:new Date(Date.now()-300000).toISOString(),tags:['FED','USD','RATES'],impact:'high',currency:'USD',age:'5m'},
  {id:'n2',title:'ECB LAGARDE — June cut confirmed if inflation continues declining. EUR/USD sold aggressively to 1.0840.',date:new Date(Date.now()-900000).toISOString(),tags:['ECB','EUR'],impact:'high',currency:'EUR',age:'15m'},
  {id:'n3',title:'NFP PREVIEW — Street consensus 175K, whisper number 185K. USD vulnerable on any miss below 150K.',date:new Date(Date.now()-1800000).toISOString(),tags:['NFP','USD'],impact:'high',currency:'USD',age:'30m'},
  {id:'n4',title:'BOJ MINUTES — Heated debate on normalisation pace. Board divided, JPY bid as intervention risk rises.',date:new Date(Date.now()-3600000).toISOString(),tags:['BOJ','JPY'],impact:'high',currency:'JPY',age:'1h'},
  {id:'n5',title:'FOMC GOOLSBEE — Two cuts still possible in 2025 if data cooperates. Market reprices July odds.',date:new Date(Date.now()-5400000).toISOString(),tags:['FED','USD'],impact:'high',currency:'USD',age:'1h30'},
  {id:'n6',title:'GBP/USD holds 1.2680 — UK CPI beat supports hawkish BoE pricing, rate cut delayed to Q4.',date:new Date(Date.now()-7200000).toISOString(),tags:['GBP','BOE'],impact:'med',currency:'GBP',age:'2h'},
  {id:'n7',title:'Canada CPI 2.9% y/y — BOC cut in June now 78% priced. CAD sold across the board.',date:new Date(Date.now()-9000000).toISOString(),tags:['BOC','CAD'],impact:'high',currency:'CAD',age:'2h30'},
  {id:'n8',title:'Gold breaks $2320 — geopolitical bid combined with falling real yields and CB accumulation.',date:new Date(Date.now()-10800000).toISOString(),tags:['GOLD','USD'],impact:'med',currency:'USD',age:'3h'},
  {id:'n9',title:'PBoC keeps LPR unchanged at 3.45% — no stimulus signal. CNH stable, China data mixed.',date:new Date(Date.now()-12600000).toISOString(),tags:['PBOC','CNY'],impact:'med',currency:'CNY',age:'3h30'},
  {id:'n10',title:'US Retail Sales +0.7% vs +0.4% expected — consumer resilience supports USD bid short-term.',date:new Date(Date.now()-14400000).toISOString(),tags:['USD','RETAIL'],impact:'med',currency:'USD',age:'4h'},
  {id:'n11',title:'Eurozone PMI composite 52.1 vs 51.5 expected — EUR/USD brief bounce to 1.0860 before fading.',date:new Date(Date.now()-18000000).toISOString(),tags:['EUR','PMI'],impact:'med',currency:'EUR',age:'5h'},
  {id:'n12',title:'US 10Y yield pushes to 4.48% — dollar broadly bid, EM currencies under significant pressure.',date:new Date(Date.now()-21600000).toISOString(),tags:['USD','BONDS'],impact:'high',currency:'USD',age:'6h'},
]

// ── Live Clock ────────────────────────────────────────────────────────────────
function LiveClock() {
  const [et,setEt]=useState(''); const [utc,setUtc]=useState('')
  useEffect(()=>{
    const tick=()=>{
      const now=new Date()
      setEt(now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:'America/New_York'}))
      setUtc(now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:'UTC'}))
    }; tick(); const id=setInterval(tick,1000); return()=>clearInterval(id)
  },[])
  return (
    <div style={{display:'flex',alignItems:'center',gap:10}}>
      <div style={{display:'flex',flexDirection:'column' as const,alignItems:'flex-end'}}>
        <span style={{fontFamily:'IBM Plex Mono,monospace',fontSize:13,fontWeight:700,color:'#f0b429',letterSpacing:'1px',lineHeight:1.2}}>{et}</span>
        <span style={{fontFamily:'IBM Plex Mono,monospace',fontSize:8,color:'#2d3f50',letterSpacing:'.5px'}}>ET</span>
      </div>
      <div style={{width:'0.5px',height:22,background:'rgba(255,255,255,.07)'}}/>
      <div style={{display:'flex',flexDirection:'column' as const,alignItems:'flex-start'}}>
        <span style={{fontFamily:'IBM Plex Mono,monospace',fontSize:13,fontWeight:500,color:'#4a5e72',letterSpacing:'1px',lineHeight:1.2}}>{utc}</span>
        <span style={{fontFamily:'IBM Plex Mono,monospace',fontSize:8,color:'#2d3f50',letterSpacing:'.5px'}}>UTC</span>
      </div>
    </div>
  )
}

// ── Next HIGH banner ──────────────────────────────────────────────────────────
function NextHighBanner({ events }: { events: CalEvent[] }) {
  const [info,setInfo]=useState({label:'—',name:'',urgent:false})
  useEffect(()=>{
    const tick=()=>{
      const now=Date.now()
      const up=events.filter(e=>e.impactLevel==='high'&&!e.actual).map(e=>{
        try{
          const d=new Date(e.date); const t=e.time?.toLowerCase().replace(' ','')||''
          const pm=t.includes('pm'),am=t.includes('am'); const cl=t.replace('am','').replace('pm','')
          const[hS,mS]=cl.split(':'); let h=parseInt(hS)||0; const m=parseInt(mS)||0
          if(pm&&h!==12)h+=12; if(am&&h===12)h=0; d.setHours(h,m,0,0); return{e,ts:d.getTime()}
        }catch{return null}
      }).filter((x):x is{e:CalEvent,ts:number}=>x!==null&&x.ts>now).sort((a,b)=>a.ts-b.ts)[0]
      if(!up){setInfo({label:'—',name:'No upcoming HIGH events',urgent:false});return}
      const diff=up.ts-now
      const h=Math.floor(diff/3600000),m=Math.floor((diff%3600000)/60000),s=Math.floor((diff%60000)/1000)
      setInfo({label:h>0?`${h}h ${m.toString().padStart(2,'0')}m`:`${m}m ${s.toString().padStart(2,'0')}s`,name:up.e.title.slice(0,42)+(up.e.title.length>42?'…':''),urgent:diff<900000})
    }; tick(); const id=setInterval(tick,1000); return()=>clearInterval(id)
  },[events])
  return (
    <div style={{display:'flex',alignItems:'center',gap:12,padding:'7px 14px',borderRadius:5,background:info.urgent?'rgba(239,68,68,.07)':'rgba(255,255,255,.02)',border:`1px solid ${info.urgent?'rgba(239,68,68,.22)':'rgba(255,255,255,.06)'}`,transition:'all 300ms'}}>
      <div style={{display:'flex',alignItems:'center',gap:5,flexShrink:0}}>
        <span style={{width:5,height:5,borderRadius:'50%',display:'inline-block',background:info.urgent?'#ef4444':'#f0b429',boxShadow:info.urgent?'0 0 7px rgba(239,68,68,.7)':'0 0 5px rgba(240,180,41,.5)',animation:'t-pulse 2s ease-in-out infinite'}}/>
        <span style={{fontSize:8,fontWeight:700,letterSpacing:'1px',color:'#3d5060',textTransform:'uppercase' as const}}>Next HIGH</span>
      </div>
      <span style={{fontSize:14,fontWeight:800,color:info.urgent?'#ef4444':'#f0b429',fontFamily:'IBM Plex Mono,monospace',letterSpacing:'.5px',minWidth:70}}>{info.label}</span>
      <span style={{fontSize:10,color:'#2d3f50',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const,maxWidth:280}}>— {info.name}</span>
    </div>
  )
}

// ── Impact bar ────────────────────────────────────────────────────────────────
function ImpactBar({ level }: { level: ImpactLevel }) {
  const c={high:'#ef4444',med:'#f0b429',low:'#334155'}[level]
  return (
    <div style={{display:'flex',gap:2,alignItems:'center'}}>
      {[0,1,2].map(i=>(
        <div key={i} style={{width:4,height:i===0?10:i===1?7:5,borderRadius:2,background:(level==='high'||(level==='med'&&i<2)||(level==='low'&&i<1))?c:'rgba(255,255,255,.08)',boxShadow:(level==='high'&&i===0)?`0 0 4px ${c}`:'none'}}/>
      ))}
    </div>
  )
}

// ── Currency badge ────────────────────────────────────────────────────────────
function CurrencyBadge({ code }: { code: string }) {
  const cfg=CCY_COLORS[code]||{bg:'rgba(255,255,255,.06)',color:'#6b7280'}
  return (
    <div style={{display:'inline-flex',alignItems:'center',gap:4,padding:'2px 6px',borderRadius:4,background:cfg.bg,border:`0.5px solid ${cfg.color}30`,flexShrink:0}}>
      <span style={{fontSize:11,lineHeight:1}}>{FLAGS[code]||'🌐'}</span>
      <span style={{fontSize:9,fontWeight:800,color:cfg.color,fontFamily:'IBM Plex Mono,monospace',letterSpacing:'.3px'}}>{code}</span>
    </div>
  )
}

// ── Surprise badge ────────────────────────────────────────────────────────────
function SurpriseBadge({ actual, forecast }: { actual: string; forecast: string }) {
  const s=getSurprise(actual,forecast); if(!s) return null
  const cfg={beat:{bg:'rgba(34,197,94,.12)',border:'rgba(34,197,94,.3)',color:'#22c55e',icon:'▲',label:'BEAT'},miss:{bg:'rgba(239,68,68,.12)',border:'rgba(239,68,68,.3)',color:'#ef4444',icon:'▼',label:'MISS'},inline:{bg:'rgba(240,180,41,.08)',border:'rgba(240,180,41,.2)',color:'#f0b429',icon:'●',label:'IN LINE'}}[s]
  return <span style={{fontSize:8,fontWeight:800,padding:'2px 6px',borderRadius:3,background:cfg.bg,color:cfg.color,border:`0.5px solid ${cfg.border}`,letterSpacing:'.5px',whiteSpace:'nowrap' as const,flexShrink:0}}>{cfg.icon} {cfg.label}</span>
}

// ── Countdown chip ────────────────────────────────────────────────────────────
function CountdownChip({ dateStr, timeStr }: { dateStr: string; timeStr: string }) {
  const [cd,setCd]=useState({display:'—',urgent:false,passed:false})
  useEffect(()=>{ const tick=()=>setCd(getCountdown(dateStr,timeStr)); tick(); const id=setInterval(tick,1000); return()=>clearInterval(id) },[dateStr,timeStr])
  if(cd.passed) return <span style={{fontSize:8,color:'#1e2c3a',fontFamily:'IBM Plex Mono,monospace'}}>—</span>
  return <span style={{fontSize:8,fontWeight:700,fontFamily:'IBM Plex Mono,monospace',color:cd.urgent?'#ef4444':'#4a5e72',background:cd.urgent?'rgba(239,68,68,.08)':'transparent',padding:cd.urgent?'1px 4px':'0',borderRadius:3,animation:cd.urgent?'t-pulse 1.5s ease-in-out infinite':'none'}}>{cd.display}</span>
}

// ── Mini calendar for date picker ─────────────────────────────────────────────
function MiniCalendar({ selectedStart, selectedEnd, onSelectStart, onSelectEnd }: {
  selectedStart: Date|null; selectedEnd: Date|null;
  onSelectStart: (d:Date)=>void; onSelectEnd: (d:Date)=>void
}) {
  const today = new Date(); today.setHours(0,0,0,0)
  const [viewYear,setViewYear]=useState(today.getFullYear())
  const [viewMonth,setViewMonth]=useState(today.getMonth())
  const [picking,setPicking]=useState<'start'|'end'>('start')
  const days=getDaysInMonth(viewYear,viewMonth)
  const firstDay=getFirstDayOfMonth(viewYear,viewMonth)
  const adjusted=firstDay===0?6:firstDay-1 // Mon-based
  const MN=['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc']
  const DN=['L','M','M','J','V','S','D']
  const cells: (Date|null)[] = Array(adjusted).fill(null)
  for(let d=1;d<=days;d++) cells.push(new Date(viewYear,viewMonth,d))

  const inRange=(d:Date)=>{
    if(!selectedStart||!selectedEnd) return false
    return d>=selectedStart && d<=selectedEnd
  }
  const isStart=(d:Date)=>selectedStart&&isoDate(d)===isoDate(selectedStart)
  const isEnd=(d:Date)=>selectedEnd&&isoDate(d)===isoDate(selectedEnd)
  const isToday=(d:Date)=>isoDate(d)===isoDate(today)

  return (
    <div style={{padding:'12px',minWidth:230}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
        <button onClick={()=>{let m=viewMonth-1,y=viewYear;if(m<0){m=11;y--};setViewMonth(m);setViewYear(y)}} style={{background:'transparent',border:'none',color:'#4a5e72',cursor:'pointer',fontSize:14,padding:'2px 6px',borderRadius:3}}>‹</button>
        <span style={{fontSize:11,fontWeight:700,color:'#c8d6e5',fontFamily:'IBM Plex Mono,monospace'}}>{MN[viewMonth]} {viewYear}</span>
        <button onClick={()=>{let m=viewMonth+1,y=viewYear;if(m>11){m=0;y++};setViewMonth(m);setViewYear(y)}} style={{background:'transparent',border:'none',color:'#4a5e72',cursor:'pointer',fontSize:14,padding:'2px 6px',borderRadius:3}}>›</button>
      </div>
      {/* Picking state */}
      <div style={{display:'flex',gap:4,marginBottom:8}}>
        {(['start','end'] as const).map(p=>(
          <button key={p} onClick={()=>setPicking(p)} style={{flex:1,padding:'4px 0',borderRadius:4,fontSize:9,fontWeight:700,cursor:'pointer',border:`1px solid ${picking===p?'rgba(240,180,41,.4)':'rgba(255,255,255,.07)'}`,background:picking===p?'rgba(240,180,41,.1)':'transparent',color:picking===p?'#f0b429':'#3d5060',transition:'all 100ms',fontFamily:'IBM Plex Mono,monospace',letterSpacing:'.3px'}}>
            {p==='start'?`Début: ${selectedStart?selectedStart.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'}):'--/--'}`:`Fin: ${selectedEnd?selectedEnd.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'}):'--/--'}`}
          </button>
        ))}
      </div>
      {/* Day names */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:1,marginBottom:4}}>
        {DN.map(d=><span key={d} style={{textAlign:'center' as const,fontSize:8,color:'#2d3f50',fontFamily:'IBM Plex Mono,monospace',padding:'2px 0'}}>{d}</span>)}
      </div>
      {/* Cells */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:1}}>
        {cells.map((d,i)=>{
          if(!d) return <div key={i}/>
          const sel=isStart(d)||isEnd(d)
          const rng=inRange(d)
          const tod=isToday(d)
          return (
            <button key={i} onClick={()=>{
              if(picking==='start'){onSelectStart(d);setPicking('end')}
              else{if(d<(selectedStart||d)){onSelectStart(d);setPicking('end')}else{onSelectEnd(d)}}
            }} style={{
              width:'100%',aspectRatio:'1',borderRadius:4,border:'none',cursor:'pointer',fontSize:10,
              fontFamily:'IBM Plex Mono,monospace',fontWeight:sel?700:400,
              background:sel?'#f0b429':rng?'rgba(240,180,41,.12)':'transparent',
              color:sel?'#000':tod?'#f0b429':rng?'#c8d6e5':'#5a7080',
              transition:'all 80ms',
            }}
              onMouseEnter={e=>{if(!sel)(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,.06)'}}
              onMouseLeave={e=>{if(!sel)(e.currentTarget as HTMLElement).style.background=rng?'rgba(240,180,41,.12)':'transparent'}}
            >{d.getDate()}</button>
          )
        })}
      </div>
    </div>
  )
}

// ── Date range selector ───────────────────────────────────────────────────────
function DateRangeSelector({ value, customStart, customEnd, onChange, onCustomChange }: {
  value: DateRange; customStart: Date|null; customEnd: Date|null;
  onChange: (r:DateRange)=>void; onCustomChange: (s:Date,e:Date)=>void
}) {
  const [open,setOpen]=useState(false)
  const [tempStart,setTempStart]=useState<Date|null>(customStart)
  const [tempEnd,setTempEnd]=useState<Date|null>(customEnd)
  const ref=useRef<HTMLDivElement>(null)

  useEffect(()=>{
    const handler=(e:MouseEvent)=>{ if(ref.current&&!ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown',handler); return()=>document.removeEventListener('mousedown',handler)
  },[])

  const SHORTCUTS: {key:DateRange,label:string}[] = [
    {key:'today',label:"Aujourd'hui"},
    {key:'tomorrow',label:'Demain'},
    {key:'this_week',label:'Cette semaine'},
    {key:'next_week',label:'Semaine suivante'},
  ]

  const displayLabel = () => {
    if(value==='custom'&&customStart&&customEnd) return `${customStart.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'})} → ${customEnd.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'})}`
    return SHORTCUTS.find(s=>s.key===value)?.label || 'Cette semaine'
  }

  return (
    <div ref={ref} style={{position:'relative' as const,flexShrink:0}}>
      {/* Shortcuts row */}
      <div style={{display:'flex',gap:3,alignItems:'center'}}>
        {SHORTCUTS.map(s=>(
          <button key={s.key} onClick={()=>onChange(s.key)} style={{
            padding:'4px 10px',borderRadius:4,fontSize:9,fontWeight:600,cursor:'pointer',
            border:`1px solid ${value===s.key?'rgba(240,180,41,.4)':'rgba(255,255,255,.07)'}`,
            background:value===s.key?'rgba(240,180,41,.1)':'transparent',
            color:value===s.key?'#f0b429':'#3d5060',transition:'all 100ms',fontFamily:'inherit',letterSpacing:'.2px',
          }}>{s.label}</button>
        ))}
        {/* Custom picker button */}
        <button onClick={()=>setOpen(!open)} style={{
          display:'flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:4,fontSize:9,fontWeight:600,cursor:'pointer',
          border:`1px solid ${value==='custom'?'rgba(240,180,41,.4)':open?'rgba(255,255,255,.15)':'rgba(255,255,255,.07)'}`,
          background:value==='custom'?'rgba(240,180,41,.1)':open?'rgba(255,255,255,.04)':'transparent',
          color:value==='custom'?'#f0b429':open?'#c8d6e5':'#3d5060',transition:'all 100ms',fontFamily:'inherit',
        }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <rect x="1" y="2" width="8" height="7" rx="1" stroke="currentColor" strokeWidth="1"/>
            <line x1="3" y1="1" x2="3" y2="3" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
            <line x1="7" y1="1" x2="7" y2="3" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
          </svg>
          {value==='custom'&&customStart&&customEnd ? displayLabel() : 'Personnalisé'}
          <span style={{fontSize:8,color:'inherit',opacity:.6}}>{open?'▲':'▼'}</span>
        </button>
      </div>

      {/* Dropdown */}
      {open&&(
        <div style={{
          position:'absolute' as const,top:'calc(100% + 6px)',left:0,zIndex:200,
          background:'#080d18',border:'1px solid rgba(255,255,255,.1)',borderRadius:8,
          boxShadow:'0 16px 48px rgba(0,0,0,.7)',overflow:'hidden',
        }}>
          <MiniCalendar
            selectedStart={tempStart} selectedEnd={tempEnd}
            onSelectStart={d=>{setTempStart(d);setTempEnd(null)}}
            onSelectEnd={d=>setTempEnd(d)}
          />
          <div style={{padding:'0 12px 12px',display:'flex',gap:6}}>
            <button onClick={()=>setOpen(false)} style={{flex:1,padding:'6px 0',borderRadius:5,fontSize:10,fontWeight:600,cursor:'pointer',border:'1px solid rgba(255,255,255,.07)',background:'transparent',color:'#4a5e72',fontFamily:'inherit'}}>Annuler</button>
            <button onClick={()=>{
              if(tempStart&&tempEnd){onCustomChange(tempStart,tempEnd);onChange('custom')}
              else if(tempStart){const e=new Date(tempStart);onCustomChange(tempStart,e);onChange('custom')}
              setOpen(false)
            }} style={{flex:2,padding:'6px 0',borderRadius:5,fontSize:10,fontWeight:700,cursor:'pointer',border:'1px solid rgba(240,180,41,.4)',background:'rgba(240,180,41,.12)',color:'#f0b429',fontFamily:'inherit',letterSpacing:'.3px'}}>
              ✓ Appliquer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
export function CalendarPanel() {
  const [tab,setTab]                   = useState<Tab>('calendar')
  const [events,setEvents]             = useState<CalEvent[]>([])
  const [news,setNews]                 = useState<NewsItem[]>([])
  const [loading,setLoading]           = useState(true)
  const [lastUpdate,setLastUpdate]     = useState('')
  const [refreshing,setRefreshing]     = useState(false)
  const [impactFilter,setImpactFilter] = useState<'all'|ImpactLevel>('all')
  const [highOnly,setHighOnly]         = useState(false)
  const [currencies,setCurrencies]     = useState<Set<string>>(new Set(['ALL']))
  const [newsImpact,setNewsImpact]     = useState<'all'|ImpactLevel>('all')
  const [newsCurrencies,setNewsCurrencies] = useState<Set<string>>(new Set(['ALL']))
  const [layout,setLayout]             = useState<'single'|'split'>('single')
  const [splitLeft,setSplitLeft]       = useState(52)
  const [dateRange,setDateRange]       = useState<DateRange>('this_week')
  const [customStart,setCustomStart]   = useState<Date|null>(null)
  const [customEnd,setCustomEnd]       = useState<Date|null>(null)
  const isDragging                     = useRef(false)
  const containerRef                   = useRef<HTMLDivElement>(null)
  const intervalRef                    = useRef<ReturnType<typeof setInterval>|null>(null)
  // For fast actual refresh — poll every 10s if any HIGH event is within 2h
  const fastPollRef                    = useRef<ReturnType<typeof setInterval>|null>(null)

  const fetchAll = useCallback(async(silent=false)=>{
    if(!silent) setRefreshing(true)
    try {
      const [calRes,newsRes] = await Promise.all([
        fetch('/api/calendar',{cache:'no-store',headers:{'Cache-Control':'no-cache'}}),
        fetch('/api/news',{cache:'no-store',headers:{'Cache-Control':'no-cache'}}),
      ])
      const calJson=await calRes.json(); const newsJson=await newsRes.json()
      setEvents((calJson.ok&&calJson.data?.length>0?calJson.data:FF_FALLBACK).map(enrichEvent))
      if(newsJson.ok&&newsJson.data?.length>0) {
        setNews(newsJson.data.map((n:any,i:number):NewsItem=>({id:`n-${i}`,title:n.title,date:n.date,tags:n.tags||[],impact:detectImpact(n.title),currency:detectCurrency(n.title,n.tags||[]),age:timeAgo(n.date)})))
      } else { setNews(NEWS_FALLBACK) }
      setLastUpdate(new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'}))
    } catch { setEvents(FF_FALLBACK.map(enrichEvent)); setNews(NEWS_FALLBACK) }
    finally { setLoading(false); setRefreshing(false) }
  },[])

  // Main refresh 30s
  useEffect(()=>{
    fetchAll()
    intervalRef.current=setInterval(()=>fetchAll(true),30000)
    return()=>{ if(intervalRef.current) clearInterval(intervalRef.current) }
  },[fetchAll])

  // Fast poll 10s for actuals when HIGH event imminent (within 2h)
  useEffect(()=>{
    const checkFastPoll=()=>{
      const hasImminent=events.some(e=>{
        if(e.impactLevel!=='high'||e.actual) return false
        try {
          const d=new Date(e.date)
          const t=e.time?.toLowerCase().replace(' ','')||''
          const pm=t.includes('pm'),am=t.includes('am')
          const cl=t.replace('am','').replace('pm','')
          const[hS,mS]=cl.split(':'); let h=parseInt(hS)||0; const m=parseInt(mS)||0
          if(pm&&h!==12)h+=12; if(am&&h===12)h=0; d.setHours(h,m,0,0)
          const diff=d.getTime()-Date.now()
          return diff>-600000&&diff<7200000 // within last 10min or next 2h
        }catch{return false}
      })
      if(hasImminent){
        if(!fastPollRef.current) fastPollRef.current=setInterval(()=>fetchAll(true),10000)
      } else {
        if(fastPollRef.current){clearInterval(fastPollRef.current);fastPollRef.current=null}
      }
    }
    checkFastPoll()
    return()=>{ if(fastPollRef.current) clearInterval(fastPollRef.current) }
  },[events,fetchAll])

  const onDragStart=()=>{isDragging.current=true}
  const onDragMove=useCallback((e:MouseEvent)=>{
    if(!isDragging.current||!containerRef.current) return
    const rect=containerRef.current.getBoundingClientRect()
    setSplitLeft(Math.min(75,Math.max(28,((e.clientX-rect.left)/rect.width)*100)))
  },[])
  const onDragEnd=()=>{isDragging.current=false}
  useEffect(()=>{
    window.addEventListener('mousemove',onDragMove); window.addEventListener('mouseup',onDragEnd)
    return()=>{window.removeEventListener('mousemove',onDragMove);window.removeEventListener('mouseup',onDragEnd)}
  },[onDragMove])

  const toggleCcy=(c:string,setter:React.Dispatch<React.SetStateAction<Set<string>>>)=>{
    setter(prev=>{
      const next=new Set(prev)
      if(c==='ALL') return new Set(['ALL'])
      next.delete('ALL')
      if(next.has(c)){next.delete(c);if(next.size===0)return new Set(['ALL'])}else next.add(c)
      return next
    })
  }

  // Apply date range filter
  const { start: rangeStart, end: rangeEnd } = getDateBounds(dateRange, customStart||undefined, customEnd||undefined)

  const activeImpact = highOnly?'high':impactFilter
  const filteredEvents = events.filter(e=>{
    const d=new Date(e.date)
    const inRange=d>=rangeStart&&d<=rangeEnd
    const impOk=activeImpact==='all'||e.impactLevel===activeImpact
    const ccyOk=currencies.has('ALL')||currencies.has(e.country)
    return inRange&&impOk&&ccyOk
  })
  const filteredNews=news.filter(n=>(newsImpact==='all'||n.impact===newsImpact)&&(newsCurrencies.has('ALL')||newsCurrencies.has(n.currency)))
  const grouped=groupByDay(filteredEvents)
  const highCount=events.filter(e=>e.impactLevel==='high').length
  const CURRENCIES=['ALL','USD','EUR','GBP','JPY','CAD','AUD','NZD','CHF']
  const BORDER='rgba(255,255,255,.06)'

  const renderCalendar=(compact=false)=>(
    <div style={{display:'flex',flexDirection:'column' as const,height:'100%',overflow:'hidden'}}>
      {/* Filter + date row */}
      <div style={{padding:compact?'6px 12px':'8px 18px',borderBottom:`1px solid ${BORDER}`,flexShrink:0,background:'rgba(255,255,255,.01)'}}>
        {/* Date range selector */}
        <div style={{marginBottom:7}}>
          <DateRangeSelector
            value={dateRange} customStart={customStart} customEnd={customEnd}
            onChange={r=>setDateRange(r)}
            onCustomChange={(s,e)=>{setCustomStart(s);setCustomEnd(e)}}
          />
        </div>
        {/* Impact + currency filters */}
        <div style={{display:'flex',alignItems:'center',gap:4,flexWrap:'wrap' as const}}>
          <button onClick={()=>setHighOnly(!highOnly)} style={{display:'flex',alignItems:'center',gap:4,padding:'3px 9px',borderRadius:4,background:highOnly?'rgba(239,68,68,.12)':'transparent',border:`1px solid ${highOnly?'rgba(239,68,68,.35)':'rgba(255,255,255,.07)'}`,color:highOnly?'#ef4444':'#4a5e72',fontSize:9,fontWeight:700,cursor:'pointer',letterSpacing:'.4px',transition:'all 120ms',fontFamily:'inherit'}}>
            <ImpactBar level="high"/> HIGH ONLY
          </button>
          <div style={{width:'0.5px',height:14,background:'rgba(255,255,255,.07)',margin:'0 2px'}}/>
          {(['all','high','med','low'] as const).map(i=>{
            const active=!highOnly&&impactFilter===i
            const c=i==='high'?'#ef4444':i==='med'?'#f0b429':i==='low'?'#4a5e72':'#c8d6e5'
            return (
              <button key={i} onClick={()=>{setHighOnly(false);setImpactFilter(i)}} style={{display:'flex',alignItems:'center',gap:4,padding:'3px 9px',borderRadius:4,background:active?`${c}12`:'transparent',border:`1px solid ${active?c+'44':'rgba(255,255,255,.06)'}`,color:active?c:'#2d3f50',fontSize:9,fontWeight:600,cursor:'pointer',letterSpacing:'.4px',transition:'all 120ms',fontFamily:'inherit'}}>
                {i!=='all'&&<ImpactBar level={i as ImpactLevel}/>}{i==='all'?'ALL':i.toUpperCase()}
              </button>
            )
          })}
          <div style={{width:'0.5px',height:14,background:'rgba(255,255,255,.07)',margin:'0 2px'}}/>
          {CURRENCIES.map(c=>{
            const active=currencies.has(c)
            const cfg=CCY_COLORS[c]||{bg:'rgba(255,255,255,.06)',color:'#c8d6e5'}
            return <button key={c} onClick={()=>toggleCcy(c,setCurrencies)} style={{padding:'3px 8px',borderRadius:4,fontSize:9,fontWeight:700,cursor:'pointer',border:`1px solid ${active?cfg.color+'44':'rgba(255,255,255,.06)'}`,background:active?cfg.bg:'transparent',color:active?cfg.color:'#2d3f50',transition:'all 100ms',fontFamily:'IBM Plex Mono,monospace',letterSpacing:'.3px'}}>{c}</button>
          })}
          <div style={{flex:1}}/>
          <span style={{fontSize:8,color:'#1e2c3a',fontFamily:'IBM Plex Mono,monospace'}}>{filteredEvents.length} events</span>
        </div>
      </div>

      {/* Column headers */}
      <div style={{display:'grid',gridTemplateColumns:compact?'28px 58px 70px 1fr 76px 52px 52px 58px':'32px 70px 78px 1fr 136px 62px 62px 70px',padding:compact?'4px 12px':'5px 18px',background:'rgba(0,0,0,.45)',borderBottom:`1px solid ${BORDER}`,flexShrink:0}}>
        {['','TIME ET','CURRENCY','EVENT','FORECAST','PREV','ACTUAL',''].map((h,i)=>(
          <span key={i} style={{fontSize:7,fontWeight:700,color:'#1a2535',letterSpacing:'1.1px',textTransform:'uppercase' as const,textAlign:i>=4&&i<7?'right' as const:'left' as const}}>{h}</span>
        ))}
      </div>

      {/* Events list */}
      <div style={{flex:1,overflowY:'auto'}}>
        {loading?(
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:140,gap:10}}>
            <span style={{width:11,height:11,borderRadius:'50%',border:'2px solid rgba(240,180,41,.3)',borderTopColor:'#f0b429',animation:'t-spin .7s linear infinite',display:'inline-block'}}/>
            <span style={{fontSize:11,color:'#3d5060'}}>Loading market data…</span>
          </div>
        ):grouped.length===0?(
          <div style={{display:'flex',flexDirection:'column' as const,alignItems:'center',justifyContent:'center',height:140,gap:8}}>
            <span style={{fontSize:26}}>📭</span>
            <span style={{fontSize:11,color:'#2d3f50'}}>No events for this period</span>
            <button onClick={()=>setDateRange('this_week')} style={{fontSize:9,color:'#f0b429',background:'transparent',border:'none',cursor:'pointer',textDecoration:'underline',fontFamily:'inherit'}}>View this week</button>
          </div>
        ):grouped.map(([day,dayEvents])=>(
          <div key={day}>
            {/* Day separator */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:compact?'6px 12px':'7px 18px',background:'rgba(240,180,41,.02)',borderTop:`1px solid rgba(240,180,41,.07)`,borderBottom:`0.5px solid rgba(255,255,255,.03)`,position:'sticky' as const,top:0,zIndex:3,backdropFilter:'blur(20px)'}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:9,fontWeight:800,color:'#f0b429',letterSpacing:'1.6px',textTransform:'uppercase' as const}}>{day}</span>
                <div style={{height:'0.5px',width:36,background:'linear-gradient(90deg,rgba(240,180,41,.25),transparent)'}}/>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:7}}>
                {([['high','#ef4444'],['med','#f0b429'],['low','#334155']] as const).map(([lv,c])=>{
                  const cnt=dayEvents.filter(e=>e.impactLevel===lv).length
                  return cnt>0?(
                    <div key={lv} style={{display:'flex',alignItems:'center',gap:2}}>
                      <ImpactBar level={lv as ImpactLevel}/>
                      <span style={{fontSize:8,color:c,fontFamily:'IBM Plex Mono,monospace',fontWeight:700}}>{cnt}</span>
                    </div>
                  ):null
                })}
                <span style={{fontSize:8,color:'#1e2c3a',fontFamily:'IBM Plex Mono,monospace'}}>{dayEvents.length}</span>
              </div>
            </div>

            {/* Rows */}
            {dayEvents.map(ev=>{
              const isHigh=ev.impactLevel==='high', isMed=ev.impactLevel==='med'
              const hasActual=!!ev.actual&&ev.actual!=='—'
              const surprise=hasActual?getSurprise(ev.actual,ev.forecast):null
              const actualColor=surprise==='beat'?'#22c55e':surprise==='miss'?'#ef4444':surprise==='inline'?'#f0b429':'#4a5e72'
              const rowBg=isHigh?'rgba(239,68,68,.015)':isMed?'rgba(240,180,41,.008)':'transparent'
              return (
                <div key={ev.id} style={{display:'grid',gridTemplateColumns:compact?'28px 58px 70px 1fr 76px 52px 52px 58px':'32px 70px 78px 1fr 136px 62px 62px 70px',alignItems:'center',padding:compact?'7px 12px':'9px 18px',borderBottom:`0.5px solid rgba(255,255,255,.025)`,borderLeft:isHigh?'2px solid rgba(239,68,68,.3)':isMed?'2px solid rgba(240,180,41,.18)':'2px solid transparent',background:rowBg,transition:'background 55ms',minHeight:compact?32:38}}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=isHigh?'rgba(239,68,68,.038)':isMed?'rgba(240,180,41,.02)':'rgba(255,255,255,.018)'}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=rowBg}>
                  <div style={{display:'flex',alignItems:'center'}}><ImpactBar level={ev.impactLevel}/></div>
                  <div style={{display:'flex',flexDirection:'column' as const,gap:1}}>
                    <span style={{fontSize:compact?10:11,fontWeight:isHigh?700:500,color:isHigh?'#f0b429':isMed?'#b8cad9':'#4a5e72',fontFamily:'IBM Plex Mono,monospace',letterSpacing:'.3px',lineHeight:1.2}}>{ev.time?.toLowerCase().replace(' ','')||'—'}</span>
                    {!hasActual&&<CountdownChip dateStr={ev.date} timeStr={ev.time}/>}
                  </div>
                  <div><CurrencyBadge code={ev.country}/></div>
                  <span style={{fontSize:compact?11:12,fontWeight:isHigh?700:isMed?600:400,color:isHigh?'#f0f4f8':isMed?'#c8d6e5':'#6a7d8f',lineHeight:1.35,letterSpacing:'-0.1px',paddingRight:8}}>{ev.title}</span>
                  <div style={{display:'flex',flexDirection:'column' as const,gap:1,alignItems:'flex-end'}}>
                    {ev.forecast?<><span style={{fontSize:compact?9:10,fontWeight:600,color:'#c8d6e5',fontFamily:'IBM Plex Mono,monospace'}}>{ev.forecast}</span>
                    {ev.forecastLow&&ev.forecastHigh&&<div style={{display:'flex',gap:2,fontSize:8,fontFamily:'IBM Plex Mono,monospace'}}><span style={{color:'rgba(239,68,68,.45)'}}>{ev.forecastLow}</span><span style={{color:'#1a2535'}}>·</span><span style={{color:'rgba(34,197,94,.45)'}}>{ev.forecastHigh}</span></div>}</>:<span style={{fontSize:8,color:'#1a2535'}}>—</span>}
                  </div>
                  <span style={{fontSize:compact?9:10,color:'#2d3f50',textAlign:'right' as const,fontFamily:'IBM Plex Mono,monospace'}}>{ev.previous||'—'}</span>
                  <div style={{textAlign:'right' as const}}>
                    {hasActual?<span style={{fontSize:compact?11:12,fontWeight:800,color:actualColor,fontFamily:'IBM Plex Mono,monospace',textShadow:surprise==='beat'?'0 0 10px rgba(34,197,94,.35)':surprise==='miss'?'0 0 10px rgba(239,68,68,.35)':'none'}}>{ev.actual}</span>:<span style={{fontSize:9,color:'#131b28',fontFamily:'IBM Plex Mono,monospace'}}>—</span>}
                  </div>
                  <div style={{display:'flex',justifyContent:'flex-end'}}><SurpriseBadge actual={ev.actual} forecast={ev.forecast}/></div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <div style={{padding:compact?'3px 12px':'4px 18px',borderTop:`0.5px solid ${BORDER}`,flexShrink:0,display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(0,0,0,.18)'}}>
        <span style={{fontSize:7,color:'#131b28',fontFamily:'IBM Plex Mono,monospace',letterSpacing:'.5px'}}>FOREX FACTORY · REFRESH {fastPollRef.current?'10S (FAST)':'30S'} · ET</span>
        <span style={{fontSize:7,color:'#131b28',fontFamily:'IBM Plex Mono,monospace'}}>{filteredEvents.length} EVENTS</span>
      </div>
    </div>
  )

  const renderNews=(compact=false)=>(
    <div style={{display:'flex',flexDirection:'column' as const,height:'100%',overflow:'hidden'}}>
      <div style={{padding:compact?'6px 12px':'8px 18px',borderBottom:`1px solid ${BORDER}`,flexShrink:0,display:'flex',alignItems:'center',gap:4,flexWrap:'wrap' as const,background:'rgba(255,255,255,.01)'}}>
        {(['all','high','med'] as const).map(i=>{
          const active=newsImpact===i; const c=i==='high'?'#ef4444':i==='med'?'#f0b429':'#c8d6e5'
          return <button key={i} onClick={()=>setNewsImpact(i)} style={{padding:'3px 9px',borderRadius:4,fontSize:9,fontWeight:600,cursor:'pointer',border:`1px solid ${active?c+'44':'rgba(255,255,255,.06)'}`,background:active?`${c}12`:'transparent',color:active?c:'#2d3f50',transition:'all 120ms',fontFamily:'inherit',letterSpacing:'.4px'}}>{i==='all'?'ALL':i.toUpperCase()}</button>
        })}
        <div style={{width:'0.5px',height:14,background:'rgba(255,255,255,.07)',margin:'0 2px'}}/>
        {CURRENCIES.map(c=>{
          const active=newsCurrencies.has(c); const cfg=CCY_COLORS[c]||{bg:'rgba(255,255,255,.06)',color:'#c8d6e5'}
          return <button key={c} onClick={()=>toggleCcy(c,setNewsCurrencies)} style={{padding:'3px 8px',borderRadius:4,fontSize:9,fontWeight:700,cursor:'pointer',border:`1px solid ${active?cfg.color+'44':'rgba(255,255,255,.06)'}`,background:active?cfg.bg:'transparent',color:active?cfg.color:'#2d3f50',transition:'all 100ms',fontFamily:'IBM Plex Mono,monospace',letterSpacing:'.3px'}}>{c}</button>
        })}
        <div style={{flex:1}}/>
        {refreshing&&<span style={{fontSize:8,color:'#ef4444',fontWeight:700,animation:'t-pulse 1s infinite'}}>● LIVE</span>}
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        {filteredNews.map(item=>{
          const isHigh=item.impact==='high'; const isMed=item.impact==='med'
          const ccyCfg=CCY_COLORS[item.currency]||{bg:'rgba(255,255,255,.04)',color:'#6b7280'}
          const rowBg=isHigh?'rgba(239,68,68,.02)':'transparent'
          return (
            <div key={item.id} style={{display:'flex',gap:10,padding:compact?'8px 12px':'13px 18px',borderBottom:`0.5px solid rgba(255,255,255,.03)`,background:rowBg,borderLeft:isHigh?'2px solid rgba(239,68,68,.4)':isMed?'2px solid rgba(240,180,41,.22)':'2px solid rgba(255,255,255,.03)',transition:'background 55ms',cursor:'pointer'}}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=isHigh?'rgba(239,68,68,.04)':'rgba(255,255,255,.016)'}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=rowBg}>
              <div style={{display:'flex',flexDirection:'column' as const,alignItems:'center',gap:4,flexShrink:0,width:40,paddingTop:2}}>
                <span style={{width:6,height:6,borderRadius:'50%',display:'block',background:isHigh?'#ef4444':isMed?'#f0b429':'#2d3f50',boxShadow:isHigh?'0 0 7px rgba(239,68,68,.6)':'none',animation:isHigh?'t-pulse 2s infinite':'none'}}/>
                {item.currency!=='ALL'&&<div style={{display:'flex',alignItems:'center',justifyContent:'center',width:22,height:13,borderRadius:2,background:ccyCfg.bg}}><span style={{fontSize:8,fontWeight:700,color:ccyCfg.color,fontFamily:'IBM Plex Mono,monospace'}}>{item.currency}</span></div>}
                <span style={{fontSize:8,color:'#1e2c3a',fontFamily:'IBM Plex Mono,monospace'}}>{item.age}</span>
              </div>
              <div style={{flex:1,minWidth:0}}>
                {isHigh&&<div style={{display:'inline-flex',alignItems:'center',gap:3,marginBottom:5,padding:'2px 7px',borderRadius:3,background:'rgba(239,68,68,.1)',border:'0.5px solid rgba(239,68,68,.22)'}}>
                  <span style={{width:3,height:3,borderRadius:'50%',background:'#ef4444',display:'inline-block',animation:'t-pulse 1.5s infinite'}}/><span style={{fontSize:8,fontWeight:800,color:'#ef4444',letterSpacing:'.7px'}}>HIGH IMPACT</span>
                </div>}
                <p style={{fontSize:compact?11:12,fontWeight:isHigh?700:600,color:isHigh?'#f0f4f8':isMed?'#c8d6e5':'#8a9db5',lineHeight:1.5,margin:'0 0 6px',letterSpacing:'-0.1px'}}>{item.title}</p>
                <div style={{display:'flex',gap:3,flexWrap:'wrap' as const}}>
                  {item.tags.slice(0,5).map(t=><span key={t} style={{fontSize:8,fontWeight:600,padding:'1px 5px',borderRadius:3,background:'rgba(255,255,255,.04)',color:'#2d3f50',border:'0.5px solid rgba(255,255,255,.06)',letterSpacing:'.3px',fontFamily:'IBM Plex Mono,monospace'}}>{t}</span>)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div style={{padding:compact?'3px 12px':'4px 18px',borderTop:`0.5px solid ${BORDER}`,flexShrink:0,display:'flex',justifyContent:'space-between',background:'rgba(0,0,0,.18)'}}>
        <span style={{fontSize:7,color:'#131b28',fontFamily:'IBM Plex Mono,monospace',letterSpacing:'.5px'}}>FINANCIAL JUICE · AUTO-REFRESH 30S</span>
        <span style={{fontSize:7,color:'#131b28',fontFamily:'IBM Plex Mono,monospace'}}>{filteredNews.length} NEWS</span>
      </div>
    </div>
  )

  return (
    <div ref={containerRef} style={{height:'100%',display:'flex',flexDirection:'column',background:'#03050a',fontFamily:"'Inter',-apple-system,sans-serif",overflow:'hidden'}}>

      {/* ══ HEADER ══ */}
      <div style={{flexShrink:0,background:'linear-gradient(180deg,rgba(10,15,26,.98) 0%,rgba(3,5,10,.98) 100%)',borderBottom:`1px solid ${BORDER}`}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 22px 10px'}}>
          <div>
            <div style={{fontSize:8,fontWeight:600,letterSpacing:'2.5px',color:'#1e2c3a',textTransform:'uppercase' as const,marginBottom:3,fontFamily:'IBM Plex Mono,monospace'}}>Institutional Trading Desk</div>
            <h1 style={{fontSize:21,fontWeight:800,letterSpacing:'-0.5px',color:'#f0f4f8',margin:0,lineHeight:1,display:'flex',alignItems:'center',gap:9}}>
              Calendrier <span style={{color:'#f0b429',fontWeight:300,fontSize:17}}>&</span> News Macro
              {highCount>0&&<span style={{fontSize:9,fontWeight:800,padding:'3px 8px',borderRadius:4,background:'rgba(239,68,68,.12)',color:'#ef4444',border:'1px solid rgba(239,68,68,.22)',letterSpacing:'.5px'}}>{highCount} HIGH</span>}
            </h1>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <LiveClock/>
            <div style={{width:'0.5px',height:26,background:'rgba(255,255,255,.06)'}}/>
            <div style={{display:'flex',gap:2,padding:'2px',borderRadius:5,background:'rgba(255,255,255,.04)',border:`1px solid rgba(255,255,255,.07)`}}>
              {([['single','□'],['split','⎮⎮']] as const).map(([l,icon])=>(
                <button key={l} onClick={()=>setLayout(l)} style={{width:26,height:22,borderRadius:3,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',border:'none',background:layout===l?'rgba(240,180,41,.18)':'transparent',color:layout===l?'#f0b429':'#2d3f50',fontSize:l==='split'?8:11,transition:'all 100ms'}}>{icon}</button>
              ))}
            </div>
            <button onClick={()=>fetchAll()} style={{display:'flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:4,fontSize:9,fontWeight:700,cursor:'pointer',border:`1px solid rgba(255,255,255,.08)`,background:'rgba(255,255,255,.03)',color:'#5a7080',fontFamily:'IBM Plex Mono,monospace',letterSpacing:'.5px',transition:'all 120ms'}}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color='#c8d6e5'}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color='#5a7080'}>
              <span style={{display:'inline-block',animation:refreshing?'t-spin .7s linear infinite':'none'}}>↻</span>
              {refreshing?'LIVE':'REFRESH'}
            </button>
            {lastUpdate&&<span style={{fontSize:8,color:'#1a2535',fontFamily:'IBM Plex Mono,monospace'}}>{lastUpdate}</span>}
          </div>
        </div>

        {/* Next HIGH banner */}
        <div style={{padding:'0 22px 8px'}}><NextHighBanner events={events}/></div>

        {/* Tabs */}
        {layout==='single'&&(
          <div style={{display:'flex',padding:'0 22px',borderTop:`0.5px solid ${BORDER}`}}>
            {([['calendar','📅  Calendrier Économique'],['news','📰  News Macro Feed']] as [Tab,string][]).map(([t,l])=>(
              <button key={t} onClick={()=>setTab(t as Tab)} style={{padding:'9px 18px',fontSize:11,fontWeight:tab===t?700:400,cursor:'pointer',border:'none',borderBottom:tab===t?'2px solid #f0b429':'2px solid transparent',background:'transparent',color:tab===t?'#f0f4f8':'#2d3f50',transition:'all 120ms',fontFamily:'inherit',marginBottom:-1,letterSpacing:'-0.1px'}}>{l}</button>
            ))}
          </div>
        )}
        {layout==='split'&&(
          <div style={{display:'flex',padding:'0 22px',borderTop:`0.5px solid ${BORDER}`}}>
            <div style={{padding:'7px 18px',fontSize:10,fontWeight:700,color:'#f0b429',borderBottom:'2px solid #f0b429'}}>📅 Calendrier</div>
            <div style={{padding:'7px 18px',fontSize:10,fontWeight:700,color:'#f0b429',borderBottom:'2px solid #f0b429'}}>📰 News Macro</div>
          </div>
        )}
      </div>

      {/* ══ CONTENT ══ */}
      {layout==='single'&&tab==='calendar'&&renderCalendar(false)}
      {layout==='single'&&tab==='news'&&renderNews(false)}
      {layout==='split'&&(
        <div style={{flex:1,display:'flex',minHeight:0,overflow:'hidden'}}>
          <div style={{width:`${splitLeft}%`,flexShrink:0,display:'flex',flexDirection:'column' as const,overflow:'hidden'}}>{renderCalendar(true)}</div>
          <div onMouseDown={onDragStart} style={{width:5,flexShrink:0,cursor:'col-resize',background:'transparent',display:'flex',alignItems:'center',justifyContent:'center',transition:'background 120ms',userSelect:'none' as const}}
            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(240,180,41,.1)'}
            onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
            <div style={{width:'0.5px',height:44,background:'rgba(240,180,41,.2)',borderRadius:1}}/>
          </div>
          <div style={{flex:1,display:'flex',flexDirection:'column' as const,overflow:'hidden',minWidth:0}}>{renderNews(true)}</div>
        </div>
      )}
    </div>
  )
}
