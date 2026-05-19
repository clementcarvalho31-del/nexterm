'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

type ImpactLevel = 'high' | 'med' | 'low'
type Tab = 'calendar' | 'news'

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

// Currency colors — institutional palette
const CCY_COLORS: Record<string,{bg:string;color:string}> = {
  USD:{ bg:'rgba(34,197,94,.1)',    color:'#22c55e' },
  EUR:{ bg:'rgba(59,130,246,.1)',   color:'#3b82f6' },
  GBP:{ bg:'rgba(139,92,246,.1)',   color:'#8b5cf6' },
  JPY:{ bg:'rgba(239,68,68,.1)',    color:'#ef4444' },
  CAD:{ bg:'rgba(240,180,41,.1)',   color:'#f0b429' },
  AUD:{ bg:'rgba(6,182,212,.1)',    color:'#06b6d4' },
  NZD:{ bg:'rgba(16,185,129,.1)',   color:'#10b981' },
  CHF:{ bg:'rgba(107,114,128,.1)',  color:'#9ca3af' },
  CNY:{ bg:'rgba(249,115,22,.1)',   color:'#f97316' },
}

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

// Compute actual vs forecast direction
function getSurprise(actual: string, forecast: string): 'beat'|'miss'|'inline'|null {
  if (!actual || actual === '—') return null
  const a = parseFloat(actual.replace(/[^0-9.-]/g,''))
  const f = parseFloat(forecast.replace(/[^0-9.-]/g,''))
  if (isNaN(a) || isNaN(f)) return null
  const diff = Math.abs(a - f)
  const threshold = Math.abs(f) * 0.02 || 0.05
  if (diff < threshold) return 'inline'
  return a > f ? 'beat' : 'miss'
}

// Countdown timer
function getCountdown(dateStr: string, timeStr: string): { display: string; urgent: boolean; passed: boolean } {
  try {
    const d = new Date(dateStr)
    const t = timeStr?.toLowerCase().replace(' ','') || ''
    const pm = t.includes('pm'), am = t.includes('am')
    const clean = t.replace('am','').replace('pm','')
    const [hS,mS] = clean.split(':'); let h = parseInt(hS)||0; const m = parseInt(mS)||0
    if (pm && h !== 12) h += 12; if (am && h === 12) h = 0
    d.setHours(h, m, 0, 0)
    const diff = d.getTime() - Date.now()
    if (diff < 0) return { display: 'Passé', urgent: false, passed: true }
    const hrs = Math.floor(diff/3600000)
    const mins = Math.floor((diff%3600000)/60000)
    const secs = Math.floor((diff%60000)/1000)
    if (hrs > 0) return { display: `${hrs}h${mins.toString().padStart(2,'0')}`, urgent: false, passed: false }
    return { display: `${mins}m${secs.toString().padStart(2,'0')}s`, urgent: diff < 900000, passed: false }
  } catch { return { display: '—', urgent: false, passed: false } }
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

// ── Live Clock ET + UTC ───────────────────────────────────────────────────────
function LiveClock() {
  const [et, setEt] = useState('')
  const [utc, setUtc] = useState('')
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setEt(now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:'America/New_York'}))
      setUtc(now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:'UTC'}))
    }
    tick(); const id = setInterval(tick,1000); return()=>clearInterval(id)
  },[])
  return (
    <div style={{display:'flex',alignItems:'center',gap:10}}>
      <div style={{display:'flex',flexDirection:'column' as const,alignItems:'flex-end'}}>
        <span style={{fontFamily:'IBM Plex Mono,monospace',fontSize:13,fontWeight:700,color:'#f0b429',letterSpacing:'1px',lineHeight:1.2}}>{et}</span>
        <span style={{fontFamily:'IBM Plex Mono,monospace',fontSize:9,color:'#3d5060',letterSpacing:'.5px'}}>ET</span>
      </div>
      <div style={{width:'0.5px',height:24,background:'rgba(255,255,255,.08)'}}/>
      <div style={{display:'flex',flexDirection:'column' as const,alignItems:'flex-start'}}>
        <span style={{fontFamily:'IBM Plex Mono,monospace',fontSize:13,fontWeight:500,color:'#5a7080',letterSpacing:'1px',lineHeight:1.2}}>{utc}</span>
        <span style={{fontFamily:'IBM Plex Mono,monospace',fontSize:9,color:'#2d3f50',letterSpacing:'.5px'}}>UTC</span>
      </div>
    </div>
  )
}

// ── Next HIGH countdown ───────────────────────────────────────────────────────
function NextHighBanner({ events }: { events: CalEvent[] }) {
  const [info, setInfo] = useState({ label:'—', name:'', urgent:false, timeLeft:'' })
  useEffect(() => {
    const tick = () => {
      const now = Date.now()
      const upcoming = events
        .filter(e => e.impactLevel === 'high' && !e.actual)
        .map(e => {
          try {
            const d = new Date(e.date)
            const t = e.time?.toLowerCase().replace(' ','') || ''
            const pm = t.includes('pm'), am = t.includes('am')
            const clean = t.replace('am','').replace('pm','')
            const [hS,mS] = clean.split(':'); let h = parseInt(hS)||0; const m = parseInt(mS)||0
            if (pm && h !== 12) h += 12; if (am && h === 12) h = 0
            d.setHours(h,m,0,0); return { e, ts: d.getTime() }
          } catch { return null }
        })
        .filter((x): x is {e:CalEvent,ts:number} => x !== null && x.ts > now)
        .sort((a,b) => a.ts - b.ts)[0]

      if (!upcoming) { setInfo({ label:'—', name:'Aucun événement HIGH à venir', urgent:false, timeLeft:'' }); return }
      const diff = upcoming.ts - now
      const h = Math.floor(diff/3600000), m = Math.floor((diff%3600000)/60000), s = Math.floor((diff%60000)/1000)
      const timeLeft = h > 0 ? `${h}h ${m.toString().padStart(2,'0')}m` : `${m}m ${s.toString().padStart(2,'0')}s`
      setInfo({ label: timeLeft, name: upcoming.e.title.slice(0,40)+(upcoming.e.title.length>40?'…':''), urgent: diff < 900000, timeLeft })
    }
    tick(); const id = setInterval(tick,1000); return()=>clearInterval(id)
  }, [events])

  return (
    <div style={{
      display:'flex', alignItems:'center', gap:12, padding:'8px 16px',
      borderRadius:6, background: info.urgent ? 'rgba(239,68,68,.07)' : 'rgba(255,255,255,.025)',
      border: `1px solid ${info.urgent ? 'rgba(239,68,68,.25)' : 'rgba(255,255,255,.07)'}`,
      transition:'all 300ms',
    }}>
      <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
        <span style={{
          width:6, height:6, borderRadius:'50%', display:'inline-block',
          background: info.urgent ? '#ef4444' : '#f0b429',
          boxShadow: info.urgent ? '0 0 8px rgba(239,68,68,.7)' : '0 0 6px rgba(240,180,41,.5)',
          animation:'t-pulse 2s ease-in-out infinite',
        }}/>
        <span style={{fontSize:9,fontWeight:700,letterSpacing:'1px',color:'#4a5e72',textTransform:'uppercase' as const}}>Next HIGH</span>
      </div>
      <span style={{
        fontSize:15, fontWeight:800, color: info.urgent ? '#ef4444' : '#f0b429',
        fontFamily:'IBM Plex Mono,monospace', letterSpacing:'1px', minWidth:80,
      }}>{info.label}</span>
      <span style={{fontSize:10,color:'#3d5060',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const,maxWidth:300}}>
        {info.name}
      </span>
    </div>
  )
}

// ── Impact bar component ──────────────────────────────────────────────────────
function ImpactBar({ level }: { level: ImpactLevel }) {
  const colors = { high:'#ef4444', med:'#f0b429', low:'#334155' }
  const c = colors[level]
  return (
    <div style={{display:'flex',gap:2,alignItems:'center'}}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          width:4, height: i===0?10:i===1?7:5, borderRadius:2,
          background: (level==='high'||(level==='med'&&i<2)||(level==='low'&&i<1)) ? c : 'rgba(255,255,255,.08)',
          boxShadow: (level==='high'&&i===0) ? `0 0 4px ${c}` : 'none',
        }}/>
      ))}
    </div>
  )
}

// ── Currency badge ────────────────────────────────────────────────────────────
function CurrencyBadge({ code }: { code: string }) {
  const cfg = CCY_COLORS[code] || { bg:'rgba(255,255,255,.06)', color:'#6b7280' }
  const flag = FLAGS[code] || '🌐'
  return (
    <div style={{
      display:'inline-flex', alignItems:'center', gap:4, padding:'2px 7px',
      borderRadius:4, background:cfg.bg, border:`0.5px solid ${cfg.color}30`,
      flexShrink:0,
    }}>
      <span style={{fontSize:11,lineHeight:1}}>{flag}</span>
      <span style={{fontSize:9,fontWeight:800,color:cfg.color,fontFamily:'IBM Plex Mono,monospace',letterSpacing:'.3px'}}>{code}</span>
    </div>
  )
}

// ── Surprise badge ────────────────────────────────────────────────────────────
function SurpriseBadge({ actual, forecast }: { actual: string; forecast: string }) {
  const s = getSurprise(actual, forecast)
  if (!s) return null
  const cfg = {
    beat:  { bg:'rgba(34,197,94,.12)',  border:'rgba(34,197,94,.3)',  color:'#22c55e', icon:'▲', label:'BEAT' },
    miss:  { bg:'rgba(239,68,68,.12)',  border:'rgba(239,68,68,.3)',  color:'#ef4444', icon:'▼', label:'MISS' },
    inline:{ bg:'rgba(240,180,41,.08)', border:'rgba(240,180,41,.2)', color:'#f0b429', icon:'●', label:'IN LINE' },
  }[s]
  return (
    <span style={{
      fontSize:8, fontWeight:800, padding:'2px 6px', borderRadius:3,
      background:cfg.bg, color:cfg.color, border:`0.5px solid ${cfg.border}`,
      letterSpacing:'.6px', whiteSpace:'nowrap' as const, flexShrink:0,
    }}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

// ── Countdown chip ─────────────────────────────────────────────────────────────
function CountdownChip({ dateStr, timeStr, passed }: { dateStr: string; timeStr: string; passed: boolean }) {
  const [cd, setCd] = useState({ display:'—', urgent:false, passed:false })
  useEffect(() => {
    const tick = () => setCd(getCountdown(dateStr, timeStr))
    tick(); const id = setInterval(tick,1000); return()=>clearInterval(id)
  }, [dateStr, timeStr])
  if (cd.passed || passed) return <span style={{fontSize:8,color:'#2d3f50',fontFamily:'IBM Plex Mono,monospace'}}>—</span>
  return (
    <span style={{
      fontSize:8, fontWeight:700, fontFamily:'IBM Plex Mono,monospace',
      color: cd.urgent ? '#ef4444' : '#5a7080',
      background: cd.urgent ? 'rgba(239,68,68,.08)' : 'transparent',
      padding: cd.urgent ? '1px 5px' : '0',
      borderRadius:3,
      animation: cd.urgent ? 't-pulse 1.5s ease-in-out infinite' : 'none',
    }}>{cd.display}</span>
  )
}

// ── Main CalendarPanel ────────────────────────────────────────────────────────
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
  const isDragging                     = useRef(false)
  const containerRef                   = useRef<HTMLDivElement>(null)
  const intervalRef                    = useRef<ReturnType<typeof setInterval>|null>(null)

  const fetchAll = useCallback(async()=>{
    setRefreshing(true)
    try {
      const [calRes,newsRes] = await Promise.all([fetch('/api/calendar',{cache:'no-store'}),fetch('/api/news',{cache:'no-store'})])
      const calJson = await calRes.json(); const newsJson = await newsRes.json()
      setEvents((calJson.ok&&calJson.data?.length>0?calJson.data:FF_FALLBACK).map(enrichEvent))
      if(newsJson.ok&&newsJson.data?.length>0) {
        setNews(newsJson.data.map((n:any,i:number):NewsItem=>({id:`n-${i}`,title:n.title,date:n.date,tags:n.tags||[],impact:detectImpact(n.title),currency:detectCurrency(n.title,n.tags||[]),age:timeAgo(n.date)})))
      } else { setNews(NEWS_FALLBACK) }
      setLastUpdate(new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'}))
    } catch { setEvents(FF_FALLBACK.map(enrichEvent)); setNews(NEWS_FALLBACK) }
    finally { setLoading(false); setRefreshing(false) }
  },[])

  useEffect(()=>{ fetchAll(); intervalRef.current=setInterval(fetchAll,30000); return()=>{if(intervalRef.current)clearInterval(intervalRef.current)} },[fetchAll])

  const onDragStart = () => { isDragging.current = true }
  const onDragMove  = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setSplitLeft(Math.min(75, Math.max(28, ((e.clientX-rect.left)/rect.width)*100)))
  },[])
  const onDragEnd = () => { isDragging.current = false }
  useEffect(()=>{
    window.addEventListener('mousemove',onDragMove); window.addEventListener('mouseup',onDragEnd)
    return()=>{ window.removeEventListener('mousemove',onDragMove); window.removeEventListener('mouseup',onDragEnd) }
  },[onDragMove])

  const toggleCcy = (c:string,setter:React.Dispatch<React.SetStateAction<Set<string>>>) => {
    setter(prev=>{
      const next=new Set(prev)
      if(c==='ALL') return new Set(['ALL'])
      next.delete('ALL')
      if(next.has(c)){next.delete(c);if(next.size===0)return new Set(['ALL'])}else next.add(c)
      return next
    })
  }

  const activeImpact = highOnly ? 'high' : impactFilter
  const filteredEvents = events.filter(e =>
    (activeImpact==='all'||e.impactLevel===activeImpact) &&
    (currencies.has('ALL')||currencies.has(e.country))
  )
  const filteredNews = news.filter(n =>
    (newsImpact==='all'||n.impact===newsImpact) &&
    (newsCurrencies.has('ALL')||newsCurrencies.has(n.currency))
  )
  const grouped    = groupByDay(filteredEvents)
  const highCount  = events.filter(e=>e.impactLevel==='high').length
  const CURRENCIES = ['ALL','USD','EUR','GBP','JPY','CAD','AUD','NZD','CHF']

  const BG = '#03050a'
  const SURFACE = '#06090f'
  const BORDER = 'rgba(255,255,255,.06)'

  // Shared calendar content renderer
  const renderCalendar = (compact=false) => (
    <div style={{display:'flex',flexDirection:'column' as const,height:'100%',overflow:'hidden'}}>
      {/* Filter bar */}
      <div style={{padding:compact?'7px 14px':'10px 20px',borderBottom:`1px solid ${BORDER}`,flexShrink:0,display:'flex',alignItems:'center',gap:5,flexWrap:'wrap' as const,background:'rgba(255,255,255,.01)'}}>
        {/* HIGH ONLY toggle */}
        <button onClick={()=>setHighOnly(!highOnly)} style={{
          display:'flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:4,
          background:highOnly?'rgba(239,68,68,.12)':'transparent',
          border:`1px solid ${highOnly?'rgba(239,68,68,.35)':'rgba(255,255,255,.08)'}`,
          color:highOnly?'#ef4444':'#4a5e72',fontSize:9,fontWeight:700,cursor:'pointer',
          letterSpacing:'.5px',transition:'all 120ms',fontFamily:'inherit',
        }}>
          <ImpactBar level="high"/>
          HIGH ONLY
        </button>
        <div style={{width:'0.5px',height:16,background:'rgba(255,255,255,.08)',margin:'0 2px'}}/>
        {/* Impact filters */}
        {(['all','high','med','low'] as const).map(i=>{
          const active = !highOnly && impactFilter===i
          const c = i==='high'?'#ef4444':i==='med'?'#f0b429':i==='low'?'#4a5e72':'#c8d6e5'
          return (
            <button key={i} onClick={()=>{setHighOnly(false);setImpactFilter(i)}} style={{
              display:'flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:4,
              background:active?`${c}12`:'transparent',
              border:`1px solid ${active?c+'44':'rgba(255,255,255,.06)'}`,
              color:active?c:'#3d5060',fontSize:9,fontWeight:600,cursor:'pointer',
              letterSpacing:'.5px',transition:'all 120ms',fontFamily:'inherit',
            }}>
              {i!=='all'&&<ImpactBar level={i as ImpactLevel}/>}
              {i==='all'?'ALL':i.toUpperCase()}
            </button>
          )
        })}
        <div style={{width:'0.5px',height:16,background:'rgba(255,255,255,.08)',margin:'0 2px'}}/>
        {/* Currency chips */}
        {CURRENCIES.map(c=>{
          const active=currencies.has(c)
          const cfg=CCY_COLORS[c]||{bg:'rgba(255,255,255,.06)',color:'#c8d6e5'}
          return (
            <button key={c} onClick={()=>toggleCcy(c,setCurrencies)} style={{
              padding:'3px 9px',borderRadius:4,fontSize:9,fontWeight:700,cursor:'pointer',
              border:`1px solid ${active?cfg.color+'44':'rgba(255,255,255,.06)'}`,
              background:active?cfg.bg:'transparent',
              color:active?cfg.color:'#2d3f50',transition:'all 100ms',fontFamily:'IBM Plex Mono,monospace',letterSpacing:'.3px',
            }}>{c}</button>
          )
        })}
        <div style={{flex:1}}/>
        <span style={{fontSize:8,color:'#1e2c3a',fontFamily:'IBM Plex Mono,monospace',letterSpacing:'.5px'}}>{filteredEvents.length} events</span>
      </div>

      {/* Sticky column headers */}
      <div style={{
        display:'grid',
        gridTemplateColumns: compact
          ? '28px 60px 70px 1fr 80px 52px 52px 60px'
          : '32px 72px 80px 1fr 140px 64px 64px 72px',
        padding: compact ? '5px 14px' : '6px 20px',
        background:'rgba(0,0,0,.5)',
        borderBottom:`1px solid ${BORDER}`,
        flexShrink:0,position:'sticky' as const,top:0,zIndex:4,
      }}>
        {['','TIME ET','CURRENCY','EVENT','FORE · RANGE','PREV','ACTUAL',''].map((h,i)=>(
          <span key={i} style={{
            fontSize:7,fontWeight:700,color:'#1e2c3a',letterSpacing:'1.2px',
            textTransform:'uppercase' as const,
            textAlign: i>=4&&i<7 ? 'right' as const : 'left' as const,
          }}>{h}</span>
        ))}
      </div>

      {/* Events */}
      <div style={{flex:1,overflowY:'auto'}}>
        {loading ? (
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:160,gap:10}}>
            <span style={{width:12,height:12,borderRadius:'50%',border:'2px solid rgba(240,180,41,.3)',borderTopColor:'#f0b429',animation:'t-spin .7s linear infinite',display:'inline-block'}}/>
            <span style={{fontSize:11,color:'#3d5060'}}>Loading market data…</span>
          </div>
        ) : grouped.length===0 ? (
          <div style={{display:'flex',flexDirection:'column' as const,alignItems:'center',justifyContent:'center',height:160,gap:8}}>
            <span style={{fontSize:28}}>📭</span>
            <span style={{fontSize:12,color:'#2d3f50'}}>No events for this filter</span>
          </div>
        ) : (
          grouped.map(([day,dayEvents])=>(
            <div key={day}>
              {/* Day separator — premium block style */}
              <div style={{
                display:'flex',alignItems:'center',justifyContent:'space-between',
                padding: compact ? '7px 14px' : '8px 20px',
                background:'rgba(240,180,41,.025)',
                borderTop:`1px solid rgba(240,180,41,.08)`,
                borderBottom:`0.5px solid rgba(255,255,255,.04)`,
                position:'sticky' as const,top:compact?32:30,zIndex:3,
                backdropFilter:'blur(20px)',
              }}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:9,fontWeight:800,color:'#f0b429',letterSpacing:'1.8px',textTransform:'uppercase' as const}}>{day}</span>
                  <div style={{height:'0.5px',width:40,background:'linear-gradient(90deg,rgba(240,180,41,.3),transparent)'}}/>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  {[
                    {level:'high' as ImpactLevel,count:dayEvents.filter(e=>e.impactLevel==='high').length},
                    {level:'med' as ImpactLevel,count:dayEvents.filter(e=>e.impactLevel==='med').length},
                    {level:'low' as ImpactLevel,count:dayEvents.filter(e=>e.impactLevel==='low').length},
                  ].filter(x=>x.count>0).map(({level,count})=>{
                    const c=level==='high'?'#ef4444':level==='med'?'#f0b429':'#334155'
                    return (
                      <div key={level} style={{display:'flex',alignItems:'center',gap:3}}>
                        <ImpactBar level={level}/>
                        <span style={{fontSize:8,color:c,fontFamily:'IBM Plex Mono,monospace',fontWeight:700}}>{count}</span>
                      </div>
                    )
                  })}
                  <span style={{fontSize:8,color:'#2d3f50',fontFamily:'IBM Plex Mono,monospace'}}>{dayEvents.length} total</span>
                </div>
              </div>

              {/* Rows */}
              {dayEvents.map((ev)=>{
                const isHigh = ev.impactLevel==='high'
                const isMed  = ev.impactLevel==='med'
                const hasActual = !!ev.actual && ev.actual !== '—'
                const surprise = hasActual ? getSurprise(ev.actual, ev.forecast) : null
                const actualColor = surprise==='beat'?'#22c55e':surprise==='miss'?'#ef4444':surprise==='inline'?'#f0b429':'#4a5e72'
                const rowBg = isHigh?'rgba(239,68,68,.015)':isMed?'rgba(240,180,41,.008)':'transparent'
                const rowBorder = isHigh?'2px solid rgba(239,68,68,.35)':isMed?'2px solid rgba(240,180,41,.2)':'2px solid transparent'
                const rh = compact ? '7px 14px' : '10px 20px'

                return (
                  <div key={ev.id} style={{
                    display:'grid',
                    gridTemplateColumns: compact
                      ? '28px 60px 70px 1fr 80px 52px 52px 60px'
                      : '32px 72px 80px 1fr 140px 64px 64px 72px',
                    alignItems:'center',padding:rh,
                    borderBottom:`0.5px solid rgba(255,255,255,.03)`,
                    borderLeft:rowBorder,
                    background:rowBg,
                    transition:'background 60ms',
                    minHeight: compact ? 34 : 40,
                  }}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=isHigh?'rgba(239,68,68,.04)':isMed?'rgba(240,180,41,.025)':'rgba(255,255,255,.02)'}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=rowBg}
                  >
                    {/* Impact bars */}
                    <div style={{display:'flex',alignItems:'center'}}>
                      <ImpactBar level={ev.impactLevel}/>
                    </div>

                    {/* Time + countdown */}
                    <div style={{display:'flex',flexDirection:'column' as const,gap:1}}>
                      <span style={{
                        fontSize: compact?10:11, fontWeight:isHigh?700:500,
                        color:isHigh?'#f0b429':isMed?'#c8d6e5':'#5a7080',
                        fontFamily:'IBM Plex Mono,monospace',letterSpacing:'.3px',lineHeight:1.2,
                      }}>{ev.time?.toLowerCase().replace(' ','')||'—'}</span>
                      {!hasActual&&<CountdownChip dateStr={ev.date} timeStr={ev.time} passed={false}/>}
                    </div>

                    {/* Currency badge */}
                    <div><CurrencyBadge code={ev.country}/></div>

                    {/* Event name */}
                    <div style={{paddingRight:8,display:'flex',flexDirection:'column' as const,gap:2}}>
                      <span style={{
                        fontSize: compact?11:12, fontWeight:isHigh?700:isMed?600:400,
                        color:isHigh?'#f0f4f8':isMed?'#c8d6e5':'#6a7d8f',
                        lineHeight:1.35,letterSpacing:'-0.1px',
                      }}>{ev.title}</span>
                    </div>

                    {/* Forecast range — visual bar */}
                    <div style={{display:'flex',flexDirection:'column' as const,gap:2,alignItems:'flex-end'}}>
                      {ev.forecast ? (
                        <>
                          <span style={{fontSize: compact?9:10,fontWeight:600,color:'#c8d6e5',fontFamily:'IBM Plex Mono,monospace'}}>{ev.forecast}</span>
                          {ev.forecastLow && ev.forecastHigh && (
                            <div style={{display:'flex',alignItems:'center',gap:2,fontSize:8,color:'#2d3f50',fontFamily:'IBM Plex Mono,monospace'}}>
                              <span style={{color:'rgba(239,68,68,.5)'}}>{ev.forecastLow}</span>
                              <span style={{color:'#1e2c3a'}}>·</span>
                              <span style={{color:'rgba(34,197,94,.5)'}}>{ev.forecastHigh}</span>
                            </div>
                          )}
                        </>
                      ) : <span style={{fontSize:9,color:'#1e2c3a'}}>—</span>}
                    </div>

                    {/* Previous */}
                    <span style={{
                      fontSize: compact?9:10, color:'#3d5060',
                      textAlign:'right' as const,fontFamily:'IBM Plex Mono,monospace',
                    }}>{ev.previous||'—'}</span>

                    {/* Actual — the star of the show */}
                    <div style={{textAlign:'right' as const}}>
                      {hasActual ? (
                        <span style={{
                          fontSize: compact?11:12, fontWeight:800,
                          color:actualColor,fontFamily:'IBM Plex Mono,monospace',
                          textShadow:surprise==='beat'?'0 0 12px rgba(34,197,94,.4)':surprise==='miss'?'0 0 12px rgba(239,68,68,.4)':'none',
                        }}>{ev.actual}</span>
                      ) : (
                        <span style={{fontSize:9,color:'#1a2535',fontFamily:'IBM Plex Mono,monospace'}}>—</span>
                      )}
                    </div>

                    {/* Surprise badge */}
                    <div style={{display:'flex',justifyContent:'flex-end'}}>
                      <SurpriseBadge actual={ev.actual} forecast={ev.forecast}/>
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{padding:compact?'4px 14px':'5px 20px',borderTop:`0.5px solid ${BORDER}`,flexShrink:0,display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(0,0,0,.2)'}}>
        <span style={{fontSize:7,color:'#1a2535',fontFamily:'IBM Plex Mono,monospace',letterSpacing:'.5px'}}>FOREX FACTORY · AUTO-REFRESH 30S · HORAIRES ET</span>
        <span style={{fontSize:7,color:'#1a2535',fontFamily:'IBM Plex Mono,monospace'}}>{filteredEvents.length} EVENTS</span>
      </div>
    </div>
  )

  // Shared news content renderer
  const renderNews = (compact=false) => (
    <div style={{display:'flex',flexDirection:'column' as const,height:'100%',overflow:'hidden'}}>
      {/* Filter bar */}
      <div style={{padding:compact?'7px 14px':'10px 20px',borderBottom:`1px solid ${BORDER}`,flexShrink:0,display:'flex',alignItems:'center',gap:5,flexWrap:'wrap' as const,background:'rgba(255,255,255,.01)'}}>
        {(['all','high','med'] as const).map(i=>{
          const active=newsImpact===i
          const c=i==='high'?'#ef4444':i==='med'?'#f0b429':'#c8d6e5'
          return (
            <button key={i} onClick={()=>setNewsImpact(i)} style={{
              padding:'4px 10px',borderRadius:4,fontSize:9,fontWeight:600,cursor:'pointer',
              border:`1px solid ${active?c+'44':'rgba(255,255,255,.06)'}`,
              background:active?`${c}12`:'transparent',
              color:active?c:'#3d5060',transition:'all 120ms',fontFamily:'inherit',letterSpacing:'.5px',
            }}>{i==='all'?'ALL':i.toUpperCase()}</button>
          )
        })}
        <div style={{width:'0.5px',height:14,background:'rgba(255,255,255,.08)',margin:'0 2px'}}/>
        {CURRENCIES.map(c=>{
          const active=newsCurrencies.has(c)
          const cfg=CCY_COLORS[c]||{bg:'rgba(255,255,255,.06)',color:'#c8d6e5'}
          return (
            <button key={c} onClick={()=>toggleCcy(c,setNewsCurrencies)} style={{
              padding:'3px 9px',borderRadius:4,fontSize:9,fontWeight:700,cursor:'pointer',
              border:`1px solid ${active?cfg.color+'44':'rgba(255,255,255,.06)'}`,
              background:active?cfg.bg:'transparent',
              color:active?cfg.color:'#2d3f50',transition:'all 100ms',fontFamily:'IBM Plex Mono,monospace',letterSpacing:'.3px',
            }}>{c}</button>
          )
        })}
        <div style={{flex:1}}/>
        {refreshing&&<span style={{fontSize:8,color:'#ef4444',fontWeight:700,letterSpacing:'.5px',animation:'t-pulse 1s infinite'}}>● LIVE</span>}
        <span style={{fontSize:8,color:'#1e2c3a',fontFamily:'IBM Plex Mono,monospace'}}>{filteredNews.length} items</span>
      </div>

      {/* News list */}
      <div style={{flex:1,overflowY:'auto'}}>
        {filteredNews.map((item)=>{
          const isHigh=item.impact==='high'; const isMed=item.impact==='med'
          const ccyCfg = CCY_COLORS[item.currency]||{bg:'rgba(255,255,255,.04)',color:'#6b7280'}
          const rowBg = isHigh?'rgba(239,68,68,.02)':'transparent'
          const lBorder = isHigh?'2px solid rgba(239,68,68,.45)':isMed?'2px solid rgba(240,180,41,.25)':'2px solid rgba(255,255,255,.04)'
          return (
            <div key={item.id} style={{
              display:'flex',gap:12,padding:compact?'9px 14px':'14px 20px',
              borderBottom:`0.5px solid rgba(255,255,255,.035)`,
              background:rowBg,borderLeft:lBorder,transition:'background 60ms',cursor:'pointer',
            }}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=isHigh?'rgba(239,68,68,.04)':'rgba(255,255,255,.018)'}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=rowBg}
            >
              {/* Left column */}
              <div style={{display:'flex',flexDirection:'column' as const,alignItems:'center',gap:4,flexShrink:0,width:44,paddingTop:2}}>
                <span style={{
                  width:7,height:7,borderRadius:'50%',display:'block',flexShrink:0,
                  background:isHigh?'#ef4444':isMed?'#f0b429':'#2d3f50',
                  boxShadow:isHigh?'0 0 8px rgba(239,68,68,.6)':isMed?'0 0 6px rgba(240,180,41,.4)':'none',
                  animation:isHigh?'t-pulse 2s infinite':'none',
                }}/>
                {item.currency!=='ALL'&&(
                  <div style={{display:'flex',alignItems:'center',justifyContent:'center',width:24,height:14,borderRadius:2,background:ccyCfg.bg}}>
                    <span style={{fontSize:8,fontWeight:700,color:ccyCfg.color,fontFamily:'IBM Plex Mono,monospace',letterSpacing:'.2px'}}>{item.currency}</span>
                  </div>
                )}
                <span style={{fontSize:8,color:'#2d3f50',fontFamily:'IBM Plex Mono,monospace',letterSpacing:'.3px'}}>{item.age}</span>
              </div>

              {/* Content */}
              <div style={{flex:1,minWidth:0}}>
                {isHigh&&(
                  <div style={{display:'inline-flex',alignItems:'center',gap:4,marginBottom:6,padding:'2px 8px',borderRadius:3,background:'rgba(239,68,68,.1)',border:'0.5px solid rgba(239,68,68,.25)'}}>
                    <span style={{width:3,height:3,borderRadius:'50%',background:'#ef4444',display:'inline-block',animation:'t-pulse 1.5s infinite'}}/>
                    <span style={{fontSize:8,fontWeight:800,color:'#ef4444',letterSpacing:'.8px'}}>HIGH IMPACT</span>
                  </div>
                )}
                <p style={{
                  fontSize:compact?11:12,fontWeight:isHigh?700:600,
                  color:isHigh?'#f0f4f8':isMed?'#c8d6e5':'#8a9db5',
                  lineHeight:1.55,margin:'0 0 7px',letterSpacing:'-0.1px',
                }}>{item.title}</p>
                <div style={{display:'flex',gap:4,flexWrap:'wrap' as const}}>
                  {item.tags.slice(0,5).map(t=>(
                    <span key={t} style={{fontSize:8,fontWeight:600,padding:'2px 6px',borderRadius:3,background:'rgba(255,255,255,.04)',color:'#3d5060',border:'0.5px solid rgba(255,255,255,.07)',letterSpacing:'.3px',fontFamily:'IBM Plex Mono,monospace'}}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{padding:compact?'4px 14px':'5px 20px',borderTop:`0.5px solid ${BORDER}`,flexShrink:0,display:'flex',justifyContent:'space-between',background:'rgba(0,0,0,.2)'}}>
        <span style={{fontSize:7,color:'#1a2535',fontFamily:'IBM Plex Mono,monospace',letterSpacing:'.5px'}}>FINANCIAL JUICE · AUTO-REFRESH 30S</span>
        <span style={{fontSize:7,color:'#1a2535',fontFamily:'IBM Plex Mono,monospace'}}>{filteredNews.length} NEWS</span>
      </div>
    </div>
  )

  return (
    <div ref={containerRef} style={{height:'100%',display:'flex',flexDirection:'column',background:BG,fontFamily:"'Inter',-apple-system,sans-serif",overflow:'hidden'}}>

      {/* ══ HEADER ══ */}
      <div style={{flexShrink:0,background:`linear-gradient(180deg,rgba(10,15,26,.98) 0%,rgba(3,5,10,.98) 100%)`,borderBottom:`1px solid ${BORDER}`}}>

        {/* Top bar */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 24px 12px'}}>
          {/* Left: title */}
          <div>
            <div style={{fontSize:9,fontWeight:600,letterSpacing:'2.5px',color:'#2d3f50',textTransform:'uppercase' as const,marginBottom:4,fontFamily:'IBM Plex Mono,monospace'}}>Institutional Trading Desk</div>
            <h1 style={{fontSize:22,fontWeight:800,letterSpacing:'-0.5px',color:'#f0f4f8',margin:0,lineHeight:1,display:'flex',alignItems:'center',gap:10}}>
              Calendrier <span style={{color:'#f0b429',fontWeight:300,fontSize:18}}>&</span> News Macro
              {highCount>0&&(
                <span style={{fontSize:9,fontWeight:800,padding:'3px 9px',borderRadius:4,background:'rgba(239,68,68,.12)',color:'#ef4444',border:'1px solid rgba(239,68,68,.25)',letterSpacing:'.6px',marginLeft:4}}>
                  {highCount} HIGH
                </span>
              )}
            </h1>
          </div>

          {/* Right: clock + controls */}
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <LiveClock/>
            <div style={{width:'0.5px',height:28,background:'rgba(255,255,255,.07)'}}/>

            {/* Layout toggle */}
            <div style={{display:'flex',gap:2,padding:'3px',borderRadius:5,background:'rgba(255,255,255,.04)',border:`1px solid rgba(255,255,255,.08)`}}>
              {([['single','□'],['split','⎮⎮']] as const).map(([l,icon])=>(
                <button key={l} onClick={()=>setLayout(l)} style={{
                  width:28,height:24,borderRadius:3,display:'flex',alignItems:'center',justifyContent:'center',
                  cursor:'pointer',border:'none',
                  background:layout===l?'rgba(240,180,41,.18)':'transparent',
                  color:layout===l?'#f0b429':'#3d5060',
                  fontSize:l==='split'?9:12,transition:'all 100ms',
                }}>{icon}</button>
              ))}
            </div>

            {/* Refresh */}
            <button onClick={fetchAll} style={{
              display:'flex',alignItems:'center',gap:5,padding:'5px 11px',borderRadius:5,
              fontSize:9,fontWeight:700,cursor:'pointer',
              border:`1px solid rgba(255,255,255,.09)`,background:'rgba(255,255,255,.04)',
              color:'#6a7d8f',fontFamily:'IBM Plex Mono,monospace',letterSpacing:'.5px',transition:'all 120ms',
            }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.color='#c8d6e5'}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.color='#6a7d8f'}}
            >
              <span style={{display:'inline-block',animation:refreshing?'t-spin .7s linear infinite':'none'}}>↻</span>
              {refreshing?'LIVE':'REFRESH'}
            </button>

            {lastUpdate&&<span style={{fontSize:8,color:'#1e2c3a',fontFamily:'IBM Plex Mono,monospace'}}>{lastUpdate}</span>}
          </div>
        </div>

        {/* Next HIGH banner */}
        <div style={{padding:'0 24px 10px'}}>
          <NextHighBanner events={events}/>
        </div>

        {/* Tabs — single mode only */}
        {layout==='single'&&(
          <div style={{display:'flex',padding:'0 24px',borderTop:`0.5px solid ${BORDER}`,gap:0}}>
            {([['calendar','📅  Calendrier Économique'],['news','📰  News Macro Feed']] as [Tab,string][]).map(([t,l])=>(
              <button key={t} onClick={()=>setTab(t)} style={{
                padding:'11px 20px',fontSize:12,fontWeight:tab===t?700:400,
                cursor:'pointer',border:'none',
                borderBottom:tab===t?'2px solid #f0b429':'2px solid transparent',
                background:'transparent',color:tab===t?'#f0f4f8':'#3d5060',
                transition:'all 120ms',fontFamily:'inherit',marginBottom:-1,letterSpacing:'-0.1px',
                display:'flex',alignItems:'center',gap:7,
              }}>
                {l}
              </button>
            ))}
          </div>
        )}
        {layout==='split'&&(
          <div style={{display:'flex',padding:'0 24px',borderTop:`0.5px solid ${BORDER}`,gap:0}}>
            <div style={{padding:'8px 20px',fontSize:11,fontWeight:700,color:'#f0b429',borderBottom:'2px solid #f0b429',letterSpacing:'-0.1px'}}>📅 Calendrier</div>
            <div style={{padding:'8px 20px',fontSize:11,fontWeight:700,color:'#f0b429',borderBottom:'2px solid #f0b429',letterSpacing:'-0.1px'}}>📰 News Macro</div>
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

          {/* Draggable divider */}
          <div onMouseDown={onDragStart}
            style={{width:5,flexShrink:0,cursor:'col-resize',background:'transparent',display:'flex',alignItems:'center',justifyContent:'center',transition:'background 120ms',userSelect:'none' as const}}
            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(240,180,41,.12)'}
            onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
            <div style={{width:'0.5px',height:48,background:'rgba(240,180,41,.25)',borderRadius:1}}/>
          </div>

          <div style={{flex:1,display:'flex',flexDirection:'column' as const,overflow:'hidden',minWidth:0}}>
            {renderNews(true)}
          </div>
        </div>
      )}
    </div>
  )
}
