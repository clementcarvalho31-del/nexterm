'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

type ImpactLevel = 'high' | 'med' | 'low'
type Tab = 'calendar' | 'news'
type DateRange = 'today' | 'tomorrow' | 'week' | 'nextweek' | 'custom'

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
  USD:{ bg:'rgba(34,197,94,.1)',   color:'#22c55e' },
  EUR:{ bg:'rgba(59,130,246,.1)',  color:'#3b82f6' },
  GBP:{ bg:'rgba(139,92,246,.1)', color:'#8b5cf6' },
  JPY:{ bg:'rgba(239,68,68,.1)',   color:'#ef4444' },
  CAD:{ bg:'rgba(240,180,41,.1)', color:'#f0b429' },
  AUD:{ bg:'rgba(6,182,212,.1)',   color:'#06b6d4' },
  NZD:{ bg:'rgba(16,185,129,.1)', color:'#10b981' },
  CHF:{ bg:'rgba(107,114,128,.1)',color:'#9ca3af' },
  CNY:{ bg:'rgba(249,115,22,.1)', color:'#f97316' },
}

// ── Date range helpers ────────────────────────────────────────────────────────
function getDateRangeBounds(range: DateRange, customFrom?: string, customTo?: string): { from: Date; to: Date } {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dayMs = 86400000
  switch (range) {
    case 'today':    return { from: today, to: new Date(today.getTime() + dayMs - 1) }
    case 'tomorrow': return { from: new Date(today.getTime() + dayMs), to: new Date(today.getTime() + 2*dayMs - 1) }
    case 'week': {
      const dow = today.getDay() || 7 // Mon=1
      const mon = new Date(today.getTime() - (dow-1)*dayMs)
      const sun = new Date(mon.getTime() + 6*dayMs + dayMs - 1)
      return { from: mon, to: sun }
    }
    case 'nextweek': {
      const dow = today.getDay() || 7
      const nextMon = new Date(today.getTime() + (8-dow)*dayMs)
      const nextSun = new Date(nextMon.getTime() + 6*dayMs + dayMs - 1)
      return { from: nextMon, to: nextSun }
    }
    case 'custom': {
      if (customFrom && customTo) {
        return { from: new Date(customFrom), to: new Date(customTo + 'T23:59:59') }
      }
      return { from: today, to: new Date(today.getTime() + 7*dayMs) }
    }
    default: return { from: today, to: new Date(today.getTime() + 7*dayMs) }
  }
}

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

// ── Utils ─────────────────────────────────────────────────────────────────────
function getImpactLevel(impact: string): ImpactLevel {
  if (!impact) return 'low'
  const i = impact.toLowerCase()
  if (i.includes('high')) return 'high'
  if (i.includes('medium') || i.includes('moderate')) return 'med'
  return 'low'
}
function forecastRange(forecast: string) {
  if (!forecast) return null
  const val = parseFloat(forecast.replace(/[^0-9.-]/g,''))
  if (isNaN(val)) return null
  const unit = forecast.replace(/[\d.-]/g,'').trim()
  const d = Math.abs(val)>100?val*0.08:Math.abs(val)>10?val*0.12:Math.abs(val)>1?val*0.15:0.1
  return { low:(Math.round((val-d)*100)/100)+unit, high:(Math.round((val+d)*100)/100)+unit }
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
  if (!actual || actual==='—') return null
  const a = parseFloat(actual.replace(/[^0-9.-]/g,''))
  const f = parseFloat(forecast.replace(/[^0-9.-]/g,''))
  if (isNaN(a)||isNaN(f)) return null
  const diff = Math.abs(a-f); const threshold = Math.abs(f)*0.02||0.05
  if (diff < threshold) return 'inline'
  return a > f ? 'beat' : 'miss'
}
function getCountdown(dateStr: string, timeStr: string) {
  try {
    const d = new Date(dateStr)
    const t = timeStr?.toLowerCase().replace(' ','') || ''
    const pm = t.includes('pm'), am = t.includes('am')
    const clean = t.replace('am','').replace('pm','')
    const [hS,mS] = clean.split(':'); let h = parseInt(hS)||0; const m = parseInt(mS)||0
    if (pm && h!==12) h+=12; if (am && h===12) h=0
    d.setHours(h,m,0,0)
    const diff = d.getTime()-Date.now()
    if (diff < 0) return { display:'passed', urgent:false, passed:true }
    const hrs = Math.floor(diff/3600000), mins = Math.floor((diff%3600000)/60000), secs = Math.floor((diff%60000)/1000)
    return { display:hrs>0?`${hrs}h${mins.toString().padStart(2,'0')}`:`${mins}m${secs.toString().padStart(2,'0')}s`, urgent:diff<900000, passed:false }
  } catch { return { display:'—', urgent:false, passed:false } }
}
function timeAgo(dateStr: string): string {
  const diff = Date.now()-new Date(dateStr).getTime()
  const m = Math.floor(diff/60000)
  if (m<1) return 'now'; if (m<60) return `${m}m`
  const h = Math.floor(m/60); if (h<24) return `${h}h`
  return `${Math.floor(h/24)}d`
}
function detectCurrency(title: string, tags: string[]): string {
  const all = [title,...tags].join(' ').toUpperCase()
  for (const c of ['USD','EUR','GBP','JPY','CAD','AUD','NZD','CHF','CNY']) if (all.includes(c)) return c
  return 'ALL'
}
function detectImpact(title: string): ImpactLevel {
  const t = title.toLowerCase()
  if (['fed','fomc','cpi','nfp','payroll','gdp','ecb','boe','boj','inflation','rate decision'].some(w=>t.includes(w))) return 'high'
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
  {title:'Non-Farm Payrolls',country:'USD',date:new Date(Date.now()+259200000).toISOString(),time:'08:30am',impact:'High Impact Expected',forecast:'175K',previous:'151K',actual:''},
  {title:'Unemployment Rate',country:'USD',date:new Date(Date.now()+259200000).toISOString(),time:'08:30am',impact:'High Impact Expected',forecast:'4.0%',previous:'4.1%',actual:''},
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
]

// ── Mini components ───────────────────────────────────────────────────────────
function LiveClock() {
  const [et,setEt]=useState(''); const [utc,setUtc]=useState('')
  useEffect(()=>{
    const tick=()=>{
      const n=new Date()
      setEt(n.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:'America/New_York'}))
      setUtc(n.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:'UTC'}))
    }
    tick(); const id=setInterval(tick,1000); return()=>clearInterval(id)
  },[])
  return (
    <div style={{display:'flex',alignItems:'center',gap:8}}>
      <div style={{textAlign:'right' as const}}>
        <div style={{fontFamily:'IBM Plex Mono,monospace',fontSize:13,fontWeight:700,color:'#f0b429',letterSpacing:'.8px',lineHeight:1.1}}>{et}</div>
        <div style={{fontFamily:'IBM Plex Mono,monospace',fontSize:8,color:'#2d3f50',letterSpacing:'.5px'}}>ET</div>
      </div>
      <div style={{width:'0.5px',height:22,background:'rgba(255,255,255,.08)'}}/>
      <div>
        <div style={{fontFamily:'IBM Plex Mono,monospace',fontSize:13,fontWeight:500,color:'#4a5e72',letterSpacing:'.8px',lineHeight:1.1}}>{utc}</div>
        <div style={{fontFamily:'IBM Plex Mono,monospace',fontSize:8,color:'#2d3f50',letterSpacing:'.5px'}}>UTC</div>
      </div>
    </div>
  )
}

function ImpactBar({ level }: { level: ImpactLevel }) {
  const c = level==='high'?'#ef4444':level==='med'?'#f0b429':'#334155'
  return (
    <div style={{display:'flex',gap:2,alignItems:'flex-end'}}>
      {[0,1,2].map(i=>(
        <div key={i} style={{width:3,height:i===0?10:i===1?7:4,borderRadius:1,background:(level==='high'||(level==='med'&&i<2)||(level==='low'&&i<1))?c:'rgba(255,255,255,.08)'}}/>
      ))}
    </div>
  )
}

function CurrencyBadge({ code }: { code: string }) {
  const cfg=CCY_COLORS[code]||{bg:'rgba(255,255,255,.06)',color:'#6b7280'}
  return (
    <div style={{display:'inline-flex',alignItems:'center',gap:3,padding:'2px 6px',borderRadius:3,background:cfg.bg,border:`0.5px solid ${cfg.color}28`,flexShrink:0}}>
      <span style={{fontSize:10,lineHeight:1}}>{FLAGS[code]||'🌐'}</span>
      <span style={{fontSize:8,fontWeight:800,color:cfg.color,fontFamily:'IBM Plex Mono,monospace',letterSpacing:'.2px'}}>{code}</span>
    </div>
  )
}

function SurpriseBadge({ actual, forecast }: { actual: string; forecast: string }) {
  const s=getSurprise(actual,forecast); if(!s) return null
  const cfg={beat:{bg:'rgba(34,197,94,.12)',border:'rgba(34,197,94,.3)',color:'#22c55e',icon:'▲',label:'BEAT'},miss:{bg:'rgba(239,68,68,.12)',border:'rgba(239,68,68,.3)',color:'#ef4444',icon:'▼',label:'MISS'},inline:{bg:'rgba(240,180,41,.08)',border:'rgba(240,180,41,.2)',color:'#f0b429',icon:'●',label:'IN LINE'}}[s]
  return <span style={{fontSize:7,fontWeight:800,padding:'2px 5px',borderRadius:2,background:cfg.bg,color:cfg.color,border:`0.5px solid ${cfg.border}`,letterSpacing:'.5px',whiteSpace:'nowrap' as const}}>{cfg.icon} {cfg.label}</span>
}

function CountdownChip({ dateStr, timeStr }: { dateStr: string; timeStr: string }) {
  const [cd,setCd]=useState({display:'—',urgent:false,passed:false})
  useEffect(()=>{ const tick=()=>setCd(getCountdown(dateStr,timeStr)); tick(); const id=setInterval(tick,1000); return()=>clearInterval(id) },[dateStr,timeStr])
  if (cd.passed) return null
  return <span style={{fontSize:8,fontWeight:700,fontFamily:'IBM Plex Mono,monospace',color:cd.urgent?'#ef4444':'#3d5060',background:cd.urgent?'rgba(239,68,68,.08)':'transparent',padding:cd.urgent?'1px 4px':'0',borderRadius:2,animation:cd.urgent?'t-pulse 1.5s infinite':'none'}}>{cd.display}</span>
}

function NextHighBanner({ events }: { events: CalEvent[] }) {
  const [info,setInfo]=useState({label:'—',name:'',urgent:false})
  useEffect(()=>{
    const tick=()=>{
      const now=Date.now()
      const upcoming=events.filter(e=>e.impactLevel==='high'&&!e.actual).map(e=>{
        try {
          const d=new Date(e.date); const t=e.time?.toLowerCase().replace(' ','')||''
          const pm=t.includes('pm'),am=t.includes('am'); const clean=t.replace('am','').replace('pm','')
          const[hS,mS]=clean.split(':'); let h=parseInt(hS)||0; const m=parseInt(mS)||0
          if(pm&&h!==12)h+=12; if(am&&h===12)h=0
          d.setHours(h,m,0,0); return{e,ts:d.getTime()}
        } catch{return null}
      }).filter((x):x is{e:CalEvent,ts:number}=>x!==null&&x.ts>now).sort((a,b)=>a.ts-b.ts)[0]
      if(!upcoming){setInfo({label:'—',name:'No HIGH upcoming',urgent:false});return}
      const diff=upcoming.ts-now; const h=Math.floor(diff/3600000),m=Math.floor((diff%3600000)/60000),s=Math.floor((diff%60000)/1000)
      setInfo({label:h>0?`${h}h ${m.toString().padStart(2,'0')}m`:`${m}m ${s.toString().padStart(2,'0')}s`,name:upcoming.e.title.slice(0,42)+(upcoming.e.title.length>42?'…':''),urgent:diff<900000})
    }
    tick(); const id=setInterval(tick,1000); return()=>clearInterval(id)
  },[events])
  return (
    <div style={{display:'flex',alignItems:'center',gap:10,padding:'6px 14px',borderRadius:5,background:info.urgent?'rgba(239,68,68,.06)':'rgba(255,255,255,.02)',border:`1px solid ${info.urgent?'rgba(239,68,68,.2)':'rgba(255,255,255,.06)'}`,transition:'all 300ms'}}>
      <span style={{width:5,height:5,borderRadius:'50%',display:'inline-block',background:info.urgent?'#ef4444':'#f0b429',boxShadow:info.urgent?'0 0 7px rgba(239,68,68,.7)':'0 0 5px rgba(240,180,41,.5)',animation:'t-pulse 2s infinite',flexShrink:0}}/>
      <span style={{fontSize:8,fontWeight:700,letterSpacing:'1px',color:'#3d5060',textTransform:'uppercase' as const,flexShrink:0}}>Next HIGH</span>
      <span style={{fontSize:14,fontWeight:800,color:info.urgent?'#ef4444':'#f0b429',fontFamily:'IBM Plex Mono,monospace',letterSpacing:'.8px',minWidth:72}}>{info.label}</span>
      <span style={{fontSize:10,color:'#2d3f50',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>— {info.name}</span>
    </div>
  )
}

// ── Date Picker Component ─────────────────────────────────────────────────────
function DatePicker({ range, customFrom, customTo, onRange, onCustom, onApply }: {
  range: DateRange; customFrom: string; customTo: string
  onRange: (r: DateRange) => void
  onCustom: (from: string, to: string) => void
  onApply: () => void
}) {
  const [showPicker, setShowPicker] = useState(false)
  const [pickerMonth, setPickerMonth] = useState(() => new Date())
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowPicker(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const SHORTCUTS: { key: DateRange; label: string }[] = [
    { key:'today',    label:"Aujourd'hui" },
    { key:'tomorrow', label:'Demain' },
    { key:'week',     label:'Cette semaine' },
    { key:'nextweek', label:'Semaine prochaine' },
  ]

  // Mini calendar
  const firstDay = new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), 1)
  const lastDay  = new Date(pickerMonth.getFullYear(), pickerMonth.getMonth()+1, 0)
  const startDow = (firstDay.getDay()+6)%7 // Mon=0
  const days: (Date|null)[] = Array(startDow).fill(null)
  for (let d=1; d<=lastDay.getDate(); d++) days.push(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), d))
  while (days.length%7 !== 0) days.push(null)

  const inRange = (d: Date) => {
    if (!customFrom || !customTo) return false
    const from = new Date(customFrom), to = new Date(customTo+'T23:59:59')
    return d >= from && d <= to
  }
  const isFrom = (d: Date) => customFrom && isoDate(d) === customFrom
  const isTo   = (d: Date) => customTo   && isoDate(d) === customTo

  const handleDayClick = (d: Date) => {
    const iso = isoDate(d)
    if (!customFrom || (customFrom && customTo)) {
      onCustom(iso, '')
    } else if (iso < customFrom) {
      onCustom(iso, customFrom)
    } else {
      onCustom(customFrom, iso)
    }
  }

  const rangeLabel = () => {
    if (range === 'custom' && customFrom && customTo) return `${customFrom} → ${customTo}`
    if (range === 'custom' && customFrom) return `${customFrom} → ?`
    return SHORTCUTS.find(s=>s.key===range)?.label || 'Période'
  }

  const BORDER = 'rgba(255,255,255,.06)'

  return (
    <div style={{position:'relative',display:'flex',alignItems:'center',gap:6,flexWrap:'wrap' as const}} ref={pickerRef}>
      {/* Shortcut buttons */}
      {SHORTCUTS.map(s => (
        <button key={s.key} onClick={()=>{ onRange(s.key); setShowPicker(false) }} style={{
          padding:'4px 10px', borderRadius:4, fontSize:9, fontWeight:600, cursor:'pointer',
          fontFamily:'inherit', transition:'all 100ms', letterSpacing:'.3px',
          border:`1px solid ${range===s.key?'rgba(240,180,41,.4)':'rgba(255,255,255,.07)'}`,
          background:range===s.key?'rgba(240,180,41,.1)':'transparent',
          color:range===s.key?'#f0b429':'#3d5060',
        }}>{s.label}</button>
      ))}

      <div style={{width:'0.5px',height:14,background:'rgba(255,255,255,.07)'}}/>

      {/* Custom date range trigger */}
      <button onClick={()=>setShowPicker(!showPicker)} style={{
        display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:4,
        fontSize:9, fontWeight:600, cursor:'pointer', fontFamily:'IBM Plex Mono,monospace',
        border:`1px solid ${range==='custom'?'rgba(240,180,41,.4)':showPicker?'rgba(255,255,255,.15)':'rgba(255,255,255,.07)'}`,
        background:range==='custom'?'rgba(240,180,41,.1)':showPicker?'rgba(255,255,255,.06)':'transparent',
        color:range==='custom'?'#f0b429':showPicker?'#c8d6e5':'#3d5060',
        transition:'all 100ms', letterSpacing:'.3px',
      }}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <rect x="1" y="2" width="8" height="7" rx="1" stroke="currentColor" strokeWidth="1"/>
          <path d="M3 1v2M7 1v2M1 5h8" stroke="currentColor" strokeWidth="1"/>
        </svg>
        {range==='custom' ? rangeLabel() : 'Personnalisé'}
        <span style={{fontSize:8,opacity:.5}}>{showPicker?'▲':'▼'}</span>
      </button>

      {/* Dropdown picker */}
      {showPicker && (
        <div style={{
          position:'absolute' as const, top:'calc(100% + 6px)', left:0, zIndex:200,
          background:'#080d18', border:`1px solid ${BORDER}`,
          borderRadius:8, boxShadow:'0 16px 48px rgba(0,0,0,.7)',
          padding:16, minWidth:260,
        }}>
          {/* Month nav */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
            <button onClick={()=>setPickerMonth(d=>new Date(d.getFullYear(),d.getMonth()-1,1))} style={{background:'transparent',border:'none',color:'#4a5e72',cursor:'pointer',fontSize:14,padding:'2px 6px',borderRadius:3}}>‹</button>
            <span style={{fontSize:11,fontWeight:700,color:'#c8d6e5',fontFamily:'IBM Plex Mono,monospace',letterSpacing:'.5px'}}>
              {pickerMonth.toLocaleDateString('fr-FR',{month:'long',year:'numeric'}).toUpperCase()}
            </span>
            <button onClick={()=>setPickerMonth(d=>new Date(d.getFullYear(),d.getMonth()+1,1))} style={{background:'transparent',border:'none',color:'#4a5e72',cursor:'pointer',fontSize:14,padding:'2px 6px',borderRadius:3}}>›</button>
          </div>

          {/* Day headers */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2,marginBottom:4}}>
            {['L','M','M','J','V','S','D'].map((d,i)=>(
              <div key={i} style={{textAlign:'center' as const,fontSize:8,color:'#2d3f50',fontFamily:'IBM Plex Mono,monospace',padding:'2px 0'}}>{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2}}>
            {days.map((d,i)=>{
              if (!d) return <div key={i}/>
              const inR = inRange(d), isF = isFrom(d), isT = isTo(d)
              const isToday = isoDate(d) === isoDate(new Date())
              return (
                <button key={i} onClick={()=>handleDayClick(d)} style={{
                  padding:'5px 2px', borderRadius:4, border:'none', cursor:'pointer',
                  fontSize:9, fontFamily:'IBM Plex Mono,monospace', textAlign:'center' as const,
                  background: isF||isT ? '#f0b429' : inR ? 'rgba(240,180,41,.12)' : 'transparent',
                  color: isF||isT ? '#000' : inR ? '#f0b429' : isToday ? '#f0b429' : '#8a9db5',
                  fontWeight: isF||isT||isToday ? 700 : 400,
                  outline: isToday && !isF && !isT ? '1px solid rgba(240,180,41,.3)' : 'none',
                  transition:'all 80ms',
                }}>{d.getDate()}</button>
              )
            })}
          </div>

          {/* Range display + apply */}
          <div style={{marginTop:12,paddingTop:10,borderTop:`1px solid ${BORDER}`}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
              <div style={{display:'flex',gap:8}}>
                <div>
                  <div style={{fontSize:7,color:'#2d3f50',letterSpacing:'.5px',marginBottom:2}}>FROM</div>
                  <div style={{fontSize:9,fontFamily:'IBM Plex Mono,monospace',color:customFrom?'#f0b429':'#2d3f50'}}>{customFrom||'—'}</div>
                </div>
                <div style={{fontSize:9,color:'#2d3f50',alignSelf:'flex-end'}}>→</div>
                <div>
                  <div style={{fontSize:7,color:'#2d3f50',letterSpacing:'.5px',marginBottom:2}}>TO</div>
                  <div style={{fontSize:9,fontFamily:'IBM Plex Mono,monospace',color:customTo?'#f0b429':'#2d3f50'}}>{customTo||'—'}</div>
                </div>
              </div>
              <button onClick={()=>{ if(customFrom&&customTo){ onRange('custom'); onApply(); setShowPicker(false) } }} style={{
                padding:'5px 12px',borderRadius:4,fontSize:9,fontWeight:700,cursor:'pointer',
                background:customFrom&&customTo?'linear-gradient(135deg,#f0b429,#d4780a)':'rgba(255,255,255,.04)',
                color:customFrom&&customTo?'#000':'#3d5060',
                border:'none',fontFamily:'inherit',letterSpacing:'.3px',transition:'all 120ms',
                opacity:customFrom&&customTo?1:.4,
              }}>Appliquer</button>
            </div>
            {/* Quick input fields */}
            <div style={{display:'flex',gap:6}}>
              <input type="date" value={customFrom} onChange={e=>onCustom(e.target.value, customTo)} style={{
                flex:1,background:'rgba(255,255,255,.04)',border:`1px solid ${BORDER}`,borderRadius:4,
                color:'#c8d6e5',fontSize:9,padding:'4px 6px',fontFamily:'IBM Plex Mono,monospace',
                outline:'none',cursor:'pointer',
              }}/>
              <input type="date" value={customTo} onChange={e=>onCustom(customFrom, e.target.value)} style={{
                flex:1,background:'rgba(255,255,255,.04)',border:`1px solid ${BORDER}`,borderRadius:4,
                color:'#c8d6e5',fontSize:9,padding:'4px 6px',fontFamily:'IBM Plex Mono,monospace',
                outline:'none',cursor:'pointer',
              }}/>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function CalendarPanel() {
  const [tab,setTab]                   = useState<Tab>('calendar')
  const [allEvents,setAllEvents]       = useState<CalEvent[]>([])
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
  // Date range
  const [dateRange,setDateRange]       = useState<DateRange>('week')
  const [customFrom,setCustomFrom]     = useState('')
  const [customTo,setCustomTo]         = useState('')
  const [appliedRange,setAppliedRange] = useState<DateRange>('week')
  const [appliedFrom,setAppliedFrom]   = useState('')
  const [appliedTo,setAppliedTo]       = useState('')

  const isDragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const intervalRef  = useRef<ReturnType<typeof setInterval>|null>(null)
  const actualIntervalRef = useRef<ReturnType<typeof setInterval>|null>(null)

  const BORDER = 'rgba(255,255,255,.06)'
  const CURRENCIES = ['ALL','USD','EUR','GBP','JPY','CAD','AUD','NZD','CHF']

  // Full fetch (30s)
  const fetchAll = useCallback(async(silent=false)=>{
    if (!silent) setRefreshing(true)
    try {
      const [calRes,newsRes] = await Promise.all([
        fetch('/api/calendar',{cache:'no-store'}),
        fetch('/api/news',{cache:'no-store'})
      ])
      const calJson=await calRes.json(); const newsJson=await newsRes.json()
      setAllEvents((calJson.ok&&calJson.data?.length>0?calJson.data:FF_FALLBACK).map(enrichEvent))
      if(newsJson.ok&&newsJson.data?.length>0) {
        setNews(newsJson.data.map((n:any,i:number):NewsItem=>({id:`n-${i}`,title:n.title,date:n.date,tags:n.tags||[],impact:detectImpact(n.title),currency:detectCurrency(n.title,n.tags||[]),age:timeAgo(n.date)})))
      } else { setNews(NEWS_FALLBACK) }
      setLastUpdate(new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'}))
    } catch { setAllEvents(FF_FALLBACK.map(enrichEvent)); setNews(NEWS_FALLBACK) }
    finally { setLoading(false); setRefreshing(false) }
  },[])

  // Fast actual-only refresh (10s) — just updates actual values
  const fetchActuals = useCallback(async()=>{
    try {
      const res = await fetch('/api/calendar',{cache:'no-store'})
      const json = await res.json()
      if (!json.ok || !json.data?.length) return
      const fresh: RawFFEvent[] = json.data
      setAllEvents(prev => prev.map((ev,i) => {
        const match = fresh[i]
        if (!match) return ev
        if (match.actual && match.actual !== ev.actual) {
          return enrichEvent(match, i)
        }
        return ev
      }))
    } catch {}
  },[])

  useEffect(()=>{
    fetchAll()
    intervalRef.current = setInterval(()=>fetchAll(true), 30000)
    actualIntervalRef.current = setInterval(fetchActuals, 10000)
    return()=>{
      if(intervalRef.current) clearInterval(intervalRef.current)
      if(actualIntervalRef.current) clearInterval(actualIntervalRef.current)
    }
  },[fetchAll, fetchActuals])

  // Drag
  const onDragStart=()=>{ isDragging.current=true }
  const onDragMove=useCallback((e:MouseEvent)=>{
    if(!isDragging.current||!containerRef.current) return
    const rect=containerRef.current.getBoundingClientRect()
    setSplitLeft(Math.min(75,Math.max(28,((e.clientX-rect.left)/rect.width)*100)))
  },[])
  const onDragEnd=()=>{ isDragging.current=false }
  useEffect(()=>{
    window.addEventListener('mousemove',onDragMove); window.addEventListener('mouseup',onDragEnd)
    return()=>{ window.removeEventListener('mousemove',onDragMove); window.removeEventListener('mouseup',onDragEnd) }
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

  const applyDateRange=()=>{ setAppliedRange(dateRange); setAppliedFrom(customFrom); setAppliedTo(customTo) }

  // Filter events by date range + impact + currency
  const { from: rangeFrom, to: rangeTo } = getDateRangeBounds(appliedRange, appliedFrom, appliedTo)
  const activeImpact = highOnly ? 'high' : impactFilter
  const events = allEvents.filter(e => {
    const d = new Date(e.date)
    return d >= rangeFrom && d <= rangeTo &&
      (activeImpact==='all'||e.impactLevel===activeImpact) &&
      (currencies.has('ALL')||currencies.has(e.country))
  })
  const filteredNews = news.filter(n =>
    (newsImpact==='all'||n.impact===newsImpact) &&
    (newsCurrencies.has('ALL')||newsCurrencies.has(n.currency))
  )
  const grouped   = groupByDay(events)
  const highCount = allEvents.filter(e=>e.impactLevel==='high').length

  const renderCalendar=(compact=false)=>(
    <div style={{display:'flex',flexDirection:'column' as const,height:'100%',overflow:'hidden'}}>
      {/* Filter bar */}
      <div style={{padding:compact?'6px 12px':'8px 18px',borderBottom:`1px solid ${BORDER}`,flexShrink:0,display:'flex',alignItems:'center',gap:4,flexWrap:'wrap' as const,background:'rgba(255,255,255,.008)'}}>
        {/* HIGH ONLY */}
        <button onClick={()=>setHighOnly(!highOnly)} style={{display:'flex',alignItems:'center',gap:4,padding:'3px 9px',borderRadius:3,background:highOnly?'rgba(239,68,68,.1)':'transparent',border:`1px solid ${highOnly?'rgba(239,68,68,.3)':'rgba(255,255,255,.07)'}`,color:highOnly?'#ef4444':'#3d5060',fontSize:9,fontWeight:700,cursor:'pointer',letterSpacing:'.5px',transition:'all 100ms',fontFamily:'inherit'}}>
          <ImpactBar level="high"/> HIGH ONLY
        </button>
        <div style={{width:'0.5px',height:14,background:'rgba(255,255,255,.07)'}}/>
        {(['all','high','med','low'] as const).map(i=>{
          const active=!highOnly&&impactFilter===i
          const c=i==='high'?'#ef4444':i==='med'?'#f0b429':i==='low'?'#4a5e72':'#c8d6e5'
          return (
            <button key={i} onClick={()=>{setHighOnly(false);setImpactFilter(i)}} style={{display:'flex',alignItems:'center',gap:4,padding:'3px 9px',borderRadius:3,background:active?`${c}10`:'transparent',border:`1px solid ${active?c+'44':'rgba(255,255,255,.06)'}`,color:active?c:'#2d3f50',fontSize:9,fontWeight:600,cursor:'pointer',letterSpacing:'.4px',transition:'all 100ms',fontFamily:'inherit'}}>
              {i!=='all'&&<ImpactBar level={i as ImpactLevel}/>}
              {i==='all'?'ALL':i.toUpperCase()}
            </button>
          )
        })}
        <div style={{width:'0.5px',height:14,background:'rgba(255,255,255,.07)'}}/>
        {CURRENCIES.map(c=>{
          const active=currencies.has(c)
          const cfg=CCY_COLORS[c]||{bg:'rgba(255,255,255,.06)',color:'#c8d6e5'}
          return <button key={c} onClick={()=>toggleCcy(c,setCurrencies)} style={{padding:'3px 8px',borderRadius:3,fontSize:8,fontWeight:700,cursor:'pointer',border:`1px solid ${active?cfg.color+'44':'rgba(255,255,255,.05)'}`,background:active?cfg.bg:'transparent',color:active?cfg.color:'#2d3f50',transition:'all 80ms',fontFamily:'IBM Plex Mono,monospace',letterSpacing:'.2px'}}>{c}</button>
        })}
        <div style={{flex:1}}/>
        <span style={{fontSize:7,color:'#1a2535',fontFamily:'IBM Plex Mono,monospace'}}>{events.length} events</span>
      </div>

      {/* Column headers */}
      <div style={{display:'grid',gridTemplateColumns:compact?'24px 56px 68px 1fr 90px 56px 56px 58px':'28px 68px 76px 1fr 130px 62px 62px 68px',padding:compact?'4px 12px':'5px 18px',background:'rgba(0,0,0,.45)',borderBottom:`1px solid ${BORDER}`,flexShrink:0}}>
        {['','TIME ET','CURRENCY','EVENT','FORECAST · RANGE','PREV','ACTUAL',''].map((h,i)=>(
          <span key={i} style={{fontSize:7,fontWeight:700,color:'#1a2535',letterSpacing:'1px',textTransform:'uppercase' as const,textAlign:i>=4&&i<7?'right' as const:'left' as const}}>{h}</span>
        ))}
      </div>

      {/* Events list */}
      <div style={{flex:1,overflowY:'auto'}}>
        {loading?(
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:120,gap:8}}>
            <span style={{width:10,height:10,borderRadius:'50%',border:'2px solid rgba(240,180,41,.3)',borderTopColor:'#f0b429',animation:'t-spin .7s linear infinite',display:'inline-block'}}/>
            <span style={{fontSize:10,color:'#2d3f50'}}>Loading…</span>
          </div>
        ):grouped.length===0?(
          <div style={{display:'flex',flexDirection:'column' as const,alignItems:'center',justifyContent:'center',height:140,gap:8}}>
            <span style={{fontSize:24}}>📭</span>
            <span style={{fontSize:11,color:'#2d3f50'}}>Aucun événement sur cette période</span>
          </div>
        ):grouped.map(([day,dayEvents])=>(
          <div key={day}>
            {/* Day header */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:compact?'6px 12px':'7px 18px',background:'rgba(240,180,41,.02)',borderTop:'1px solid rgba(240,180,41,.07)',borderBottom:`0.5px solid rgba(255,255,255,.04)`,position:'sticky' as const,top:0,zIndex:3,backdropFilter:'blur(20px)'}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:9,fontWeight:800,color:'#f0b429',letterSpacing:'1.6px',textTransform:'uppercase' as const}}>{day}</span>
                <div style={{height:'0.5px',width:32,background:'linear-gradient(90deg,rgba(240,180,41,.25),transparent)'}}/>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                {(['high','med','low'] as ImpactLevel[]).map(lvl=>{
                  const cnt=dayEvents.filter(e=>e.impactLevel===lvl).length; if(!cnt) return null
                  const c=lvl==='high'?'#ef4444':lvl==='med'?'#f0b429':'#2d3f50'
                  return <span key={lvl} style={{fontSize:8,color:c,fontFamily:'IBM Plex Mono,monospace',fontWeight:700,display:'flex',alignItems:'center',gap:2}}><ImpactBar level={lvl}/>{cnt}</span>
                })}
                <span style={{fontSize:7,color:'#1a2535',fontFamily:'IBM Plex Mono,monospace'}}>{dayEvents.length}</span>
              </div>
            </div>

            {/* Event rows */}
            {dayEvents.map(ev=>{
              const isH=ev.impactLevel==='high', isM=ev.impactLevel==='med'
              const hasA=!!ev.actual&&ev.actual!=='—'
              const surp=hasA?getSurprise(ev.actual,ev.forecast):null
              const aC=surp==='beat'?'#22c55e':surp==='miss'?'#ef4444':surp==='inline'?'#f0b429':'#4a5e72'
              const rBg=isH?'rgba(239,68,68,.014)':isM?'rgba(240,180,41,.007)':'transparent'
              const rB=isH?'2px solid rgba(239,68,68,.3)':isM?'2px solid rgba(240,180,41,.18)':'2px solid transparent'
              return (
                <div key={ev.id} style={{display:'grid',gridTemplateColumns:compact?'24px 56px 68px 1fr 90px 56px 56px 58px':'28px 68px 76px 1fr 130px 62px 62px 68px',alignItems:'center',padding:compact?'7px 12px':'9px 18px',borderBottom:`0.5px solid rgba(255,255,255,.025)`,borderLeft:rB,background:rBg,transition:'background 60ms',minHeight:compact?32:38}}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=isH?'rgba(239,68,68,.035)':isM?'rgba(240,180,41,.02)':'rgba(255,255,255,.018)'}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=rBg}>
                  <ImpactBar level={ev.impactLevel}/>
                  <div style={{display:'flex',flexDirection:'column' as const,gap:1}}>
                    <span style={{fontSize:compact?10:11,fontWeight:isH?700:500,color:isH?'#f0b429':isM?'#c8d6e5':'#4a5e72',fontFamily:'IBM Plex Mono,monospace',letterSpacing:'.3px',lineHeight:1.1}}>{ev.time?.toLowerCase().replace(' ','')||'—'}</span>
                    {!hasA&&<CountdownChip dateStr={ev.date} timeStr={ev.time}/>}
                  </div>
                  <CurrencyBadge code={ev.country}/>
                  <span style={{fontSize:compact?11:12,fontWeight:isH?700:isM?500:400,color:isH?'#f0f4f8':isM?'#c8d6e5':'#5a7080',lineHeight:1.3,letterSpacing:'-0.1px',paddingRight:6}}>{ev.title}</span>
                  <div style={{display:'flex',flexDirection:'column' as const,gap:1,alignItems:'flex-end'}}>
                    {ev.forecast?<span style={{fontSize:compact?9:10,fontWeight:600,color:'#b8cad9',fontFamily:'IBM Plex Mono,monospace'}}>{ev.forecast}</span>:<span style={{fontSize:8,color:'#1a2535'}}>—</span>}
                    {ev.forecastLow&&ev.forecastHigh&&<div style={{display:'flex',gap:2,fontSize:7,fontFamily:'IBM Plex Mono,monospace'}}>
                      <span style={{color:'rgba(239,68,68,.45)'}}>{ev.forecastLow}</span>
                      <span style={{color:'#1e2c3a'}}>·</span>
                      <span style={{color:'rgba(34,197,94,.45)'}}>{ev.forecastHigh}</span>
                    </div>}
                  </div>
                  <span style={{fontSize:compact?9:10,color:'#2d3f50',textAlign:'right' as const,fontFamily:'IBM Plex Mono,monospace'}}>{ev.previous||'—'}</span>
                  <div style={{textAlign:'right' as const}}>
                    {hasA?(
                      <span style={{fontSize:compact?11:13,fontWeight:800,color:aC,fontFamily:'IBM Plex Mono,monospace',textShadow:surp==='beat'?'0 0 10px rgba(34,197,94,.35)':surp==='miss'?'0 0 10px rgba(239,68,68,.35)':'none'}}>{ev.actual}</span>
                    ):<span style={{fontSize:9,color:'#1a2535',fontFamily:'IBM Plex Mono,monospace'}}>—</span>}
                  </div>
                  <div style={{display:'flex',justifyContent:'flex-end'}}>
                    <SurpriseBadge actual={ev.actual} forecast={ev.forecast}/>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <div style={{padding:compact?'3px 12px':'4px 18px',borderTop:`0.5px solid ${BORDER}`,flexShrink:0,display:'flex',justifyContent:'space-between',background:'rgba(0,0,0,.2)'}}>
        <span style={{fontSize:7,color:'#1a2535',fontFamily:'IBM Plex Mono,monospace',letterSpacing:'.4px'}}>FOREX FACTORY · REFRESH 30S FULL · 10S ACTUALS · ET</span>
        <span style={{fontSize:7,color:'#1a2535',fontFamily:'IBM Plex Mono,monospace'}}>{events.length} EVENTS</span>
      </div>
    </div>
  )

  const renderNews=(compact=false)=>(
    <div style={{display:'flex',flexDirection:'column' as const,height:'100%',overflow:'hidden'}}>
      <div style={{padding:compact?'6px 12px':'8px 18px',borderBottom:`1px solid ${BORDER}`,flexShrink:0,display:'flex',alignItems:'center',gap:4,flexWrap:'wrap' as const,background:'rgba(255,255,255,.008)'}}>
        {(['all','high','med'] as const).map(i=>{
          const active=newsImpact===i; const c=i==='high'?'#ef4444':i==='med'?'#f0b429':'#c8d6e5'
          return <button key={i} onClick={()=>setNewsImpact(i)} style={{padding:'3px 9px',borderRadius:3,fontSize:9,fontWeight:600,cursor:'pointer',border:`1px solid ${active?c+'44':'rgba(255,255,255,.06)'}`,background:active?`${c}10`:'transparent',color:active?c:'#2d3f50',transition:'all 100ms',fontFamily:'inherit',letterSpacing:'.4px'}}>{i==='all'?'ALL':i.toUpperCase()}</button>
        })}
        <div style={{width:'0.5px',height:14,background:'rgba(255,255,255,.07)'}}/>
        {CURRENCIES.map(c=>{
          const active=newsCurrencies.has(c); const cfg=CCY_COLORS[c]||{bg:'rgba(255,255,255,.06)',color:'#c8d6e5'}
          return <button key={c} onClick={()=>toggleCcy(c,setNewsCurrencies)} style={{padding:'3px 8px',borderRadius:3,fontSize:8,fontWeight:700,cursor:'pointer',border:`1px solid ${active?cfg.color+'44':'rgba(255,255,255,.05)'}`,background:active?cfg.bg:'transparent',color:active?cfg.color:'#2d3f50',transition:'all 80ms',fontFamily:'IBM Plex Mono,monospace',letterSpacing:'.2px'}}>{c}</button>
        })}
        <div style={{flex:1}}/>
        {refreshing&&<span style={{fontSize:7,color:'#ef4444',fontWeight:700,animation:'t-pulse 1s infinite'}}>● LIVE</span>}
        <span style={{fontSize:7,color:'#1a2535',fontFamily:'IBM Plex Mono,monospace'}}>{filteredNews.length}</span>
      </div>
      <div style={{flex:1,overflowY:'auto'}}>
        {filteredNews.map(item=>{
          const isH=item.impact==='high', isM=item.impact==='med'
          const ccyCfg=CCY_COLORS[item.currency]||{bg:'rgba(255,255,255,.04)',color:'#6b7280'}
          const rBg=isH?'rgba(239,68,68,.02)':'transparent'
          return (
            <div key={item.id} style={{display:'flex',gap:10,padding:compact?'8px 12px':'12px 18px',borderBottom:`0.5px solid rgba(255,255,255,.03)`,background:rBg,borderLeft:isH?'2px solid rgba(239,68,68,.4)':isM?'2px solid rgba(240,180,41,.22)':'2px solid rgba(255,255,255,.04)',transition:'background 60ms',cursor:'pointer'}}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=isH?'rgba(239,68,68,.04)':'rgba(255,255,255,.015)'}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=rBg}>
              <div style={{display:'flex',flexDirection:'column' as const,alignItems:'center',gap:3,flexShrink:0,width:38,paddingTop:2}}>
                <span style={{width:6,height:6,borderRadius:'50%',display:'block',background:isH?'#ef4444':isM?'#f0b429':'#2d3f50',boxShadow:isH?'0 0 7px rgba(239,68,68,.6)':isM?'0 0 5px rgba(240,180,41,.4)':'none',animation:isH?'t-pulse 2s infinite':'none'}}/>
                {item.currency!=='ALL'&&<div style={{width:22,height:13,borderRadius:2,background:ccyCfg.bg,display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontSize:7,fontWeight:700,color:ccyCfg.color,fontFamily:'IBM Plex Mono,monospace'}}>{item.currency}</span></div>}
                <span style={{fontSize:7,color:'#1e2c3a',fontFamily:'IBM Plex Mono,monospace'}}>{item.age}</span>
              </div>
              <div style={{flex:1,minWidth:0}}>
                {isH&&<div style={{display:'inline-flex',alignItems:'center',gap:3,marginBottom:5,padding:'2px 7px',borderRadius:2,background:'rgba(239,68,68,.09)',border:'0.5px solid rgba(239,68,68,.22)'}}>
                  <span style={{width:3,height:3,borderRadius:'50%',background:'#ef4444',display:'inline-block',animation:'t-pulse 1.5s infinite'}}/>
                  <span style={{fontSize:7,fontWeight:800,color:'#ef4444',letterSpacing:'.7px'}}>HIGH IMPACT</span>
                </div>}
                <p style={{fontSize:compact?11:12,fontWeight:isH?700:600,color:isH?'#f0f4f8':isM?'#c8d6e5':'#7a8fa8',lineHeight:1.5,margin:'0 0 6px',letterSpacing:'-0.1px'}}>{item.title}</p>
                <div style={{display:'flex',gap:3,flexWrap:'wrap' as const}}>
                  {item.tags.slice(0,5).map(t=><span key={t} style={{fontSize:7,fontWeight:600,padding:'1px 5px',borderRadius:2,background:'rgba(255,255,255,.04)',color:'#2d3f50',border:'0.5px solid rgba(255,255,255,.06)',fontFamily:'IBM Plex Mono,monospace',letterSpacing:'.3px'}}>{t}</span>)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div style={{padding:compact?'3px 12px':'4px 18px',borderTop:`0.5px solid ${BORDER}`,flexShrink:0,display:'flex',justifyContent:'space-between',background:'rgba(0,0,0,.2)'}}>
        <span style={{fontSize:7,color:'#1a2535',fontFamily:'IBM Plex Mono,monospace',letterSpacing:'.4px'}}>FINANCIAL JUICE · AUTO-REFRESH 30S</span>
        <span style={{fontSize:7,color:'#1a2535',fontFamily:'IBM Plex Mono,monospace'}}>{filteredNews.length} NEWS</span>
      </div>
    </div>
  )

  return (
    <div ref={containerRef} style={{height:'100%',display:'flex',flexDirection:'column',background:'#03050a',fontFamily:"'Inter',-apple-system,sans-serif",overflow:'hidden'}}>

      {/* ══ HEADER ══ */}
      <div style={{flexShrink:0,background:'linear-gradient(180deg,rgba(8,13,24,.99) 0%,rgba(3,5,10,.99) 100%)',borderBottom:`1px solid ${BORDER}`}}>

        {/* Top bar */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 20px 10px'}}>
          <div>
            <div style={{fontSize:8,fontWeight:600,letterSpacing:'2.5px',color:'#1e2c3a',textTransform:'uppercase' as const,marginBottom:3,fontFamily:'IBM Plex Mono,monospace'}}>Institutional Trading Desk</div>
            <h1 style={{fontSize:20,fontWeight:800,letterSpacing:'-0.5px',color:'#f0f4f8',margin:0,lineHeight:1,display:'flex',alignItems:'center',gap:8}}>
              Calendrier <span style={{color:'#f0b429',fontWeight:300,fontSize:17}}>&</span> News Macro
              {highCount>0&&<span style={{fontSize:8,fontWeight:800,padding:'3px 8px',borderRadius:3,background:'rgba(239,68,68,.1)',color:'#ef4444',border:'1px solid rgba(239,68,68,.22)',letterSpacing:'.5px'}}>{highCount} HIGH</span>}
            </h1>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <LiveClock/>
            <div style={{width:'0.5px',height:26,background:'rgba(255,255,255,.07)'}}/>
            <div style={{display:'flex',gap:2,padding:'3px',borderRadius:4,background:'rgba(255,255,255,.04)',border:`1px solid rgba(255,255,255,.07)`}}>
              {([['single','□'],['split','⎮⎮']] as const).map(([l,icon])=>(
                <button key={l} onClick={()=>setLayout(l)} style={{width:26,height:22,borderRadius:3,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',border:'none',background:layout===l?'rgba(240,180,41,.18)':'transparent',color:layout===l?'#f0b429':'#2d3f50',fontSize:l==='split'?8:11,transition:'all 100ms'}}>{icon}</button>
              ))}
            </div>
            <button onClick={()=>fetchAll(false)} style={{display:'flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:4,fontSize:8,fontWeight:700,cursor:'pointer',border:`1px solid rgba(255,255,255,.08)`,background:'rgba(255,255,255,.04)',color:'#5a7080',fontFamily:'IBM Plex Mono,monospace',letterSpacing:'.4px',transition:'all 100ms'}}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color='#c8d6e5'}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color='#5a7080'}>
              <span style={{display:'inline-block',animation:refreshing?'t-spin .7s linear infinite':'none'}}>↻</span>
              {refreshing?'LIVE':'REFRESH'}
            </button>
            {lastUpdate&&<span style={{fontSize:7,color:'#1a2535',fontFamily:'IBM Plex Mono,monospace'}}>{lastUpdate}</span>}
          </div>
        </div>

        {/* ── Date range bar ── */}
        <div style={{padding:'0 20px 10px',display:'flex',alignItems:'center',gap:8,flexWrap:'wrap' as const}}>
          <NextHighBanner events={allEvents}/>
          <div style={{flex:1}}/>
          <DatePicker
            range={dateRange} customFrom={customFrom} customTo={customTo}
            onRange={r=>{ setDateRange(r); if(r!=='custom'){ setAppliedRange(r); setAppliedFrom(''); setAppliedTo('') } }}
            onCustom={(f,t)=>{ setCustomFrom(f); setCustomTo(t) }}
            onApply={applyDateRange}
          />
        </div>

        {/* Tabs */}
        {layout==='single'&&(
          <div style={{display:'flex',padding:'0 20px',borderTop:`0.5px solid ${BORDER}`,gap:0}}>
            {([['calendar','📅  Calendrier Économique'],['news','📰  News Macro Feed']] as [Tab,string][]).map(([t,l])=>(
              <button key={t} onClick={()=>setTab(t)} style={{padding:'10px 18px',fontSize:11,fontWeight:tab===t?700:400,cursor:'pointer',border:'none',borderBottom:tab===t?'2px solid #f0b429':'2px solid transparent',background:'transparent',color:tab===t?'#f0f4f8':'#2d3f50',transition:'all 100ms',fontFamily:'inherit',marginBottom:-1,letterSpacing:'-0.1px',display:'flex',alignItems:'center',gap:6}}>
                {l}
              </button>
            ))}
          </div>
        )}
        {layout==='split'&&(
          <div style={{display:'flex',padding:'0 20px',borderTop:`0.5px solid ${BORDER}`}}>
            <div style={{padding:'7px 18px',fontSize:11,fontWeight:700,color:'#f0b429',borderBottom:'2px solid #f0b429'}}>📅 Calendrier</div>
            <div style={{padding:'7px 18px',fontSize:11,fontWeight:700,color:'#f0b429',borderBottom:'2px solid #f0b429'}}>📰 News Macro</div>
          </div>
        )}
      </div>

      {/* ══ CONTENT ══ */}
      {layout==='single'&&tab==='calendar'&&renderCalendar(false)}
      {layout==='single'&&tab==='news'&&renderNews(false)}
      {layout==='split'&&(
        <div style={{flex:1,display:'flex',minHeight:0,overflow:'hidden'}}>
          <div style={{width:`${splitLeft}%`,flexShrink:0,display:'flex',flexDirection:'column' as const,overflow:'hidden'}}>
            {renderCalendar(true)}
          </div>
          <div onMouseDown={onDragStart} style={{width:5,flexShrink:0,cursor:'col-resize',background:'transparent',display:'flex',alignItems:'center',justifyContent:'center',transition:'background 100ms',userSelect:'none' as const}}
            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(240,180,41,.1)'}
            onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
            <div style={{width:'0.5px',height:40,background:'rgba(240,180,41,.2)',borderRadius:1}}/>
          </div>
          <div style={{flex:1,display:'flex',flexDirection:'column' as const,overflow:'hidden',minWidth:0}}>
            {renderNews(true)}
          </div>
        </div>
      )}
    </div>
  )
}
