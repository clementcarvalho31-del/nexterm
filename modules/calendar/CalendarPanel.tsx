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
const IMPACT_MAP: Record<string,ImpactLevel> = { 'High Impact Expected':'high','Medium Impact Expected':'med','Low Impact Expected':'low','Non-Economic':'low' }

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
function timeAgo(dateStr: string): string {
  const diff = Date.now()-new Date(dateStr).getTime()
  const m = Math.floor(diff/60000)
  if (m<1) return 'maintenant'; if (m<60) return `${m}m`
  const h = Math.floor(m/60); if (h<24) return `${h}h`
  return `${Math.floor(h/24)}j`
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

// ── Live clock ──────────────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:'America/New_York'}) + ' ET')
    tick(); const id = setInterval(tick,1000); return()=>clearInterval(id)
  },[])
  return <span style={{fontFamily:'IBM Plex Mono,monospace',fontSize:11,color:'#4a5e72',letterSpacing:'.5px'}}>{time}</span>
}

// ── Countdown ───────────────────────────────────────────────────────────────
function NextEventCountdown({events}:{events:CalEvent[]}) {
  const [display, setDisplay] = useState({time:'—',name:'',urgent:false})
  useEffect(()=>{
    const tick=()=>{
      const now=Date.now()
      const upcoming = events
        .filter(e=>e.impactLevel==='high'&&!e.actual)
        .map(e=>{
          try {
            const d=new Date(e.date)
            const t=e.time?.toLowerCase().replace(' ','')
            const pm=t.includes('pm'),am=t.includes('am')
            const clean=t.replace('am','').replace('pm','')
            const[hS,mS]=clean.split(':'); let h=parseInt(hS)||0; const m=parseInt(mS)||0
            if(pm&&h!==12)h+=12; if(am&&h===12)h=0
            d.setHours(h,m,0,0); return{e,ts:d.getTime()}
          } catch{return null}
        })
        .filter((x):x is {e:CalEvent,ts:number}=>x!==null&&x.ts>now)
        .sort((a,b)=>a.ts-b.ts)[0]
      if(!upcoming){setDisplay({time:'—',name:'Aucun HIGH à venir',urgent:false});return}
      const diff=upcoming.ts-now
      const h=Math.floor(diff/3600000),m=Math.floor((diff%3600000)/60000),s=Math.floor((diff%60000)/1000)
      setDisplay({
        time:h>0?`${h}h ${m.toString().padStart(2,'0')}m`:`${m}m ${s.toString().padStart(2,'0')}s`,
        name:upcoming.e.title.slice(0,35)+(upcoming.e.title.length>35?'…':''),
        urgent:diff<3600000
      })
    }
    tick(); const id=setInterval(tick,1000); return()=>clearInterval(id)
  },[events])

  return (
    <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 14px',borderRadius:6,background:display.urgent?'rgba(239,68,68,.08)':'rgba(255,255,255,.03)',border:`1px solid ${display.urgent?'rgba(239,68,68,.25)':'rgba(255,255,255,.07)'}`,transition:'all 300ms'}}>
      <span style={{width:6,height:6,borderRadius:'50%',background:display.urgent?'#ef4444':'#f0b429',display:'inline-block',animation:'t-pulse 2s ease-in-out infinite',boxShadow:display.urgent?'0 0 8px rgba(239,68,68,.6)':'0 0 6px rgba(240,180,41,.4)'}}/>
      <span style={{fontSize:10,color:'#5a7080',fontWeight:500}}>Prochain HIGH</span>
      <span style={{fontSize:12,fontWeight:700,color:display.urgent?'#ef4444':'#f0b429',fontFamily:'IBM Plex Mono,monospace',fontVariantNumeric:'tabular-nums'}}>{display.time}</span>
      <span style={{fontSize:10,color:'#3d5060',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>— {display.name}</span>
    </div>
  )
}

export function CalendarPanel() {
  const [tab,setTab]                 = useState<Tab>('calendar')
  const [events,setEvents]           = useState<CalEvent[]>([])
  const [news,setNews]               = useState<NewsItem[]>([])
  const [loading,setLoading]         = useState(true)
  const [lastUpdate,setLastUpdate]   = useState('')
  const [refreshing,setRefreshing]   = useState(false)
  const [impactFilter,setImpactFilter] = useState<'all'|ImpactLevel>('all')
  const [currencies,setCurrencies]     = useState<Set<string>>(new Set(['ALL']))
  const [newsImpact,setNewsImpact]     = useState<'all'|ImpactLevel>('all')
  const [newsCurrencies,setNewsCurrencies] = useState<Set<string>>(new Set(['ALL']))
  const intervalRef = useRef<ReturnType<typeof setInterval>|null>(null)

  const fetchAll = useCallback(async()=>{
    setRefreshing(true)
    try {
      const[calRes,newsRes]=await Promise.all([fetch('/api/calendar',{cache:'no-store'}),fetch('/api/news',{cache:'no-store'})])
      const calJson=await calRes.json(); const newsJson=await newsRes.json()
      setEvents((calJson.ok&&calJson.data?.length>0?calJson.data:FF_FALLBACK).map(enrichEvent))
      if(newsJson.ok&&newsJson.data?.length>0){
        setNews(newsJson.data.map((n:any,i:number):NewsItem=>({id:`n-${i}`,title:n.title,date:n.date,tags:n.tags||[],impact:detectImpact(n.title),currency:detectCurrency(n.title,n.tags||[]),age:timeAgo(n.date)})))
      } else { setNews(NEWS_FALLBACK) }
      setLastUpdate(new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}))
    } catch { setEvents(FF_FALLBACK.map(enrichEvent)); setNews(NEWS_FALLBACK) }
    finally { setLoading(false); setRefreshing(false) }
  },[])

  useEffect(()=>{ fetchAll(); intervalRef.current=setInterval(fetchAll,30000); return()=>{if(intervalRef.current)clearInterval(intervalRef.current)} },[fetchAll])

  const toggleCurrency = (c: string) => {
    setCurrencies(prev => {
      const next = new Set(prev)
      if (c === 'ALL') return new Set(['ALL'])
      next.delete('ALL')
      if (next.has(c)) { next.delete(c); if (next.size === 0) return new Set(['ALL']) }
      else next.add(c)
      return next
    })
  }
  const toggleNewsCurrency = (c: string) => {
    setNewsCurrencies(prev => {
      const next = new Set(prev)
      if (c === 'ALL') return new Set(['ALL'])
      next.delete('ALL')
      if (next.has(c)) { next.delete(c); if (next.size === 0) return new Set(['ALL']) }
      else next.add(c)
      return next
    })
  }

  const filteredEvents = events.filter(e =>
    (impactFilter==='all'||e.impactLevel===impactFilter) &&
    (currencies.has('ALL')||currencies.has(e.country))
  )
  const filteredNews = news.filter(n =>
    (newsImpact==='all'||n.impact===newsImpact) &&
    (newsCurrencies.has('ALL')||newsCurrencies.has(n.currency))
  )
  const grouped        = groupByDay(filteredEvents)
  const highCount      = events.filter(e=>e.impactLevel==='high').length
  const CURRENCIES     = ['ALL','USD','EUR','GBP','JPY','CAD','AUD','NZD','CHF']

  // Impact config
  const IC = {
    high:{ color:'#ef4444', dim:'rgba(239,68,68,.5)', bg:'rgba(239,68,68,.08)', border:'rgba(239,68,68,.2)', stars:'★★★', label:'HIGH' },
    med: { color:'#f0b429', dim:'rgba(240,180,41,.5)', bg:'rgba(240,180,41,.06)', border:'rgba(240,180,41,.2)', stars:'★★☆', label:'MED'  },
    low: { color:'#2d3d4d', dim:'#1e2a35',           bg:'transparent',          border:'transparent',        stars:'★☆☆', label:'LOW'  },
  }

  // Pill style
  const pill = (active:boolean, color='#f0b429') => ({
    padding:'5px 14px', borderRadius:20, fontSize:11, fontWeight:600 as const, cursor:'pointer' as const,
    border:`1px solid ${active?color+'55':'rgba(255,255,255,.07)'}`,
    background:active?color+'12':'transparent',
    color:active?color:'#3d5060', transition:'all 150ms', fontFamily:'inherit',
  })

  const [layout, setLayout] = useState<'single'|'split'>('single')

  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',background:'#06080d',fontFamily:"'Inter',-apple-system,sans-serif",overflow:'hidden'}}>

      {/* ══ HEADER PREMIUM ══ */}
      <div style={{flexShrink:0,background:'linear-gradient(180deg,rgba(13,18,28,.95) 0%,rgba(6,8,13,.95) 100%)',borderBottom:'1px solid rgba(255,255,255,.06)',padding:'28px 48px 0'}}>
        
        {/* Top row */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
          {/* Titre + heure inline */}
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <div>
              <div style={{fontSize:11,fontWeight:600,letterSpacing:'2px',color:'#3d5060',textTransform:'uppercase' as const,marginBottom:2}}>Institutional Trading Desk</div>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <h1 style={{fontSize:28,fontWeight:800,letterSpacing:'-0.8px',color:'#f0f4f8',margin:0,lineHeight:1.1}}>
                  Calendrier <span style={{color:'#f0b429'}}>&</span> News Macro
                </h1>
                {/* Heure à côté du titre */}
                <div style={{display:'flex',alignItems:'center',gap:6,padding:'4px 10px',borderRadius:5,background:'rgba(240,180,41,.06)',border:'1px solid rgba(240,180,41,.12)'}}>
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="#f0b429" strokeWidth="1.2"/><path d="M6 3v3l2 1.5" stroke="#f0b429" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  <LiveClock/>
                </div>
              </div>
            </div>
          </div>

          {/* Right: layout toggle + refresh */}
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            {/* Layout buttons */}
            <div style={{display:'flex',gap:3,padding:'3px',borderRadius:6,background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.07)'}}>
              {/* Single view */}
              <button onClick={()=>setLayout('single')} title="Vue unique" style={{width:28,height:28,borderRadius:4,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',border:'none',background:layout==='single'?'rgba(240,180,41,.15)':'transparent',transition:'all 120ms'}}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="2" width="12" height="12" rx="2" stroke={layout==='single'?'#f0b429':'#4a5e72'} strokeWidth="1.5"/>
                </svg>
              </button>
              {/* Split view */}
              <button onClick={()=>setLayout('split')} title="Vue côte à côte" style={{width:28,height:28,borderRadius:4,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',border:'none',background:layout==='split'?'rgba(240,180,41,.15)':'transparent',transition:'all 120ms'}}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="2" width="5" height="12" rx="1.5" stroke={layout==='split'?'#f0b429':'#4a5e72'} strokeWidth="1.5"/>
                  <rect x="9" y="2" width="5" height="12" rx="1.5" stroke={layout==='split'?'#f0b429':'#4a5e72'} strokeWidth="1.5"/>
                </svg>
              </button>
            </div>

            <div style={{width:1,height:20,background:'rgba(255,255,255,.07)'}}/>
            {refreshing
              ? <span style={{fontSize:10,color:'#f0b429',fontWeight:600,letterSpacing:'.5px',animation:'t-pulse 1s infinite'}}>● LIVE</span>
              : <span style={{fontSize:10,color:'#2d3f50',letterSpacing:'.5px'}}>{lastUpdate&&`Mis à jour ${lastUpdate}`}</span>
            }
            <button onClick={fetchAll} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:5,fontSize:10,fontWeight:600,cursor:'pointer',border:'1px solid rgba(255,255,255,.1)',background:'rgba(255,255,255,.04)',color:'#8a9db5',fontFamily:'inherit',letterSpacing:'.4px',transition:'all 150ms'}} onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,.08)';e.currentTarget.style.color='#c8d6e5'}} onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,.04)';e.currentTarget.style.color='#8a9db5'}}>
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Tabs — cachés en mode split */}
        {layout==='single'&&(
        <div style={{display:'flex',gap:0,borderBottom:'1px solid rgba(255,255,255,.06)',marginBottom:0}}>
          {([['calendar','📅  Calendrier Économique'],['news','📰  News Macro Feed']] as [Tab,string][]).map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t as Tab)} style={{
              padding:'14px 32px', fontSize:13, fontWeight:tab===t?700:400,
              cursor:'pointer', border:'none', letterSpacing:'-0.2px',
              borderBottom:tab===t?'2px solid #f0b429':'2px solid transparent',
              background:'transparent', color:tab===t?'#f0f4f8':'#4a5e72',
              transition:'all 150ms', fontFamily:'inherit',
              display:'flex', alignItems:'center', gap:8, marginBottom:-1,
            }}>
              {l}
              {t==='calendar'&&highCount>0&&(
                <span style={{fontSize:9,padding:'2px 7px',borderRadius:10,background:'rgba(239,68,68,.15)',color:'#ef4444',fontWeight:700,border:'1px solid rgba(239,68,68,.3)'}}>{highCount} HIGH</span>
              )}
            </button>
          ))}
        </div>
        )}
        {layout==='split'&&(
          <div style={{display:'flex',gap:0,borderBottom:'1px solid rgba(255,255,255,.06)'}}>
            <div style={{padding:'10px 32px',fontSize:12,fontWeight:700,color:'#f0b429',borderBottom:'2px solid #f0b429',letterSpacing:'-0.2px'}}>📅 Calendrier</div>
            <div style={{padding:'10px 32px',fontSize:12,fontWeight:700,color:'#f0b429',borderBottom:'2px solid #f0b429',letterSpacing:'-0.2px'}}>📰 News Macro</div>
          </div>
        )}
      </div>

      {/* ══ CALENDAR TAB ══ */}
      {tab==='calendar'&&<>

        {/* Filter bar */}
        <div style={{padding:'12px 48px',borderBottom:'1px solid rgba(255,255,255,.05)',flexShrink:0,display:'flex',alignItems:'center',gap:6,flexWrap:'wrap' as const,background:'rgba(255,255,255,.015)'}}>
          <span style={{fontSize:9,fontWeight:700,letterSpacing:'1.5px',color:'#2d3f50',marginRight:4,textTransform:'uppercase' as const}}>IMPACT</span>
          {(['all','high','med','low'] as const).map(i=>{
            const c=i==='high'?'#ef4444':i==='med'?'#f0b429':i==='low'?'#4a5e72':'#c8d6e5'
            return <button key={i} onClick={()=>setImpactFilter(i)} style={pill(impactFilter===i,c)}>
              {i==='all'?'Tous':IC[i as ImpactLevel]?.stars}
            </button>
          })}
          <div style={{width:1,height:20,background:'rgba(255,255,255,.07)',margin:'0 8px'}}/>
          <span style={{fontSize:9,fontWeight:700,letterSpacing:'1.5px',color:'#2d3f50',marginRight:4,textTransform:'uppercase' as const}}>DEVISE</span>
          {CURRENCIES.map(c=>{
            const active = currencies.has(c)
            return <button key={c} onClick={()=>toggleCurrency(c)} style={{
              padding:'5px 14px', borderRadius:20, fontSize:11, fontWeight:600, cursor:'pointer',
              border:`1px solid ${active?'rgba(240,180,41,.55)':'rgba(255,255,255,.07)'}`,
              background:active?'rgba(240,180,41,.12)':'transparent',
              color:active?'#f0b429':'#3d5060', transition:'all 150ms', fontFamily:'inherit',
              boxShadow:active?'0 0 8px rgba(240,180,41,.15)':'none',
            }}>{c}</button>
          })}
          <div style={{flex:1}}/>
          <span style={{fontSize:10,color:'#2d3f50'}}>{filteredEvents.length} événements</span>
        </div>

        {/* Column headers */}
        <div style={{display:'grid',gridTemplateColumns:'56px 64px 24px 40px 1fr 150px 52px 52px 48px',padding:'8px 48px',background:'rgba(0,0,0,.35)',borderBottom:'1px solid rgba(255,255,255,.04)',flexShrink:0}}>
          {[['IMPACT','left'],['HEURE ET','left'],['','left'],['','left'],['ÉVÉNEMENT','left'],['LOW │ FORE │ HIGH','center'],['PREV','right'],['ACT','right'],['','right']].map(([h,a],i)=>(
            <span key={i} style={{fontSize:8,fontWeight:700,color:'#2d3f50',letterSpacing:'1.2px',textTransform:'uppercase' as const,textAlign:a as any}}>{h}</span>
          ))}
        </div>

        {/* Events */}
        <div style={{flex:1,overflowY:'auto'}}>
          {loading?(
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:200,gap:12}}>
              <span style={{width:14,height:14,borderRadius:'50%',border:'2px solid rgba(240,180,41,.3)',borderTopColor:'#f0b429',animation:'t-spin .7s linear infinite',display:'inline-block'}}/>
              <span style={{fontSize:13,color:'#3d5060',fontWeight:500}}>Chargement des données de marché…</span>
            </div>
          ):grouped.length===0?(
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:200,gap:10}}>
              <span style={{fontSize:36}}>📭</span>
              <span style={{fontSize:13,color:'#3d5060'}}>Aucun événement pour ce filtre</span>
            </div>
          ):(
            grouped.map(([day,dayEvents])=>(
              <div key={day}>
                {/* Day separator */}
                <div style={{display:'flex',alignItems:'center',gap:14,padding:'10px 48px',background:'rgba(240,180,41,.02)',borderTop:'1px solid rgba(240,180,41,.06)',borderBottom:'1px solid rgba(255,255,255,.03)',position:'sticky' as const,top:0,zIndex:3,backdropFilter:'blur(16px)'}}>
                  <span style={{fontSize:10,fontWeight:800,color:'#f0b429',letterSpacing:'1.5px',textTransform:'uppercase' as const}}>{day}</span>
                  <div style={{flex:1,height:'0.5px',background:'linear-gradient(90deg,rgba(240,180,41,.2),transparent)'}}/>
                  {dayEvents.some(e=>e.impactLevel==='high')&&(
                    <div style={{display:'flex',alignItems:'center',gap:5,padding:'3px 10px',borderRadius:4,background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.2)'}}>
                      <span style={{width:4,height:4,borderRadius:'50%',background:'#ef4444',display:'inline-block',animation:'t-pulse 1.5s infinite'}}/>
                      <span style={{fontSize:9,color:'#ef4444',fontWeight:700,letterSpacing:'.5px'}}>HIGH IMPACT</span>
                    </div>
                  )}
                  <span style={{fontSize:9,color:'#2d3f50',fontWeight:500}}>{dayEvents.length} events</span>
                </div>

                {/* Rows */}
                {dayEvents.map((ev,idx)=>{
                  const ic = IC[ev.impactLevel]
                  const hasActual = !!ev.actual
                  const isHigh = ev.impactLevel==='high'
                  return (
                    <div key={ev.id} style={{
                      display:'grid',gridTemplateColumns:'56px 64px 24px 40px 1fr 150px 52px 52px 48px',
                      alignItems:'center',padding:'11px 48px',
                      borderBottom:'1px solid rgba(255,255,255,.03)',
                      background:isHigh?'rgba(239,68,68,.018)':'transparent',
                      borderLeft:isHigh?'3px solid rgba(239,68,68,.4)':'3px solid transparent',
                      transition:'background 80ms',
                    }}
                      onMouseEnter={e=>e.currentTarget.style.background=isHigh?'rgba(239,68,68,.04)':'rgba(255,255,255,.025)'}
                      onMouseLeave={e=>e.currentTarget.style.background=isHigh?'rgba(239,68,68,.018)':'transparent'}>

                      {/* Impact stars */}
                      <div style={{display:'flex',alignItems:'center',gap:4}}>
                        <span style={{fontSize:10,color:ic.color,letterSpacing:.5,fontWeight:700}}>{ic.stars}</span>
                      </div>

                      {/* Time */}
                      <span style={{fontSize:11,color:isHigh?'#c8d6e5':'#5a7080',fontFamily:'IBM Plex Mono,monospace',fontWeight:isHigh?600:400,letterSpacing:'.3px'}}>
                        {ev.time?.toLowerCase().replace(' ','')||'—'}
                      </span>

                      {/* Flag */}
                      <span style={{fontSize:14,lineHeight:1}}>{ev.flag}</span>

                      {/* Country */}
                      <span style={{fontSize:11,fontWeight:800,color:'#4a5e72',letterSpacing:'.5px'}}>{ev.country}</span>

                      {/* Title */}
                      <span style={{
                        fontSize:13, fontWeight:700,
                        color:isHigh?'#f0f4f8':ev.impactLevel==='med'?'#b8cad9':'#8a9db5',
                        lineHeight:1.4, paddingRight:16, letterSpacing:'-0.2px',
                      }}>
                        {ev.title}
                      </span>

                      {/* Forecast range */}
                      {ev.forecastLow&&ev.forecastHigh?(
                        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:3,fontSize:10,fontFamily:'IBM Plex Mono,monospace'}}>
                          <span style={{color:'rgba(239,68,68,.7)'}}>{ev.forecastLow}</span>
                          <span style={{color:'rgba(255,255,255,.12)'}}>│</span>
                          <span style={{color:'#f0b429',fontWeight:700,fontSize:11}}>{ev.forecast}</span>
                          <span style={{color:'rgba(255,255,255,.12)'}}>│</span>
                          <span style={{color:'rgba(34,197,94,.7)'}}>{ev.forecastHigh}</span>
                        </div>
                      ):<span style={{textAlign:'center' as const,fontSize:10,color:'#1e2a35',fontFamily:'IBM Plex Mono,monospace'}}>—</span>}

                      {/* Previous */}
                      <span style={{fontSize:10,color:'#4a5e72',textAlign:'right' as const,fontFamily:'IBM Plex Mono,monospace'}}>{ev.previous||'—'}</span>

                      {/* Actual */}
                      <span style={{fontSize:11,fontWeight:hasActual?700:400,color:hasActual?'#22c55e':'#1e2a35',textAlign:'right' as const,fontFamily:'IBM Plex Mono,monospace'}}>
                        {ev.actual||'—'}
                      </span>

                      {/* Badge */}
                      <div style={{display:'flex',justifyContent:'flex-end'}}>
                        <span style={{
                          fontSize:8,fontWeight:800,padding:'3px 6px',borderRadius:3,
                          background:ic.bg,color:ic.color,
                          border:`1px solid ${ic.border}`,
                          letterSpacing:'.8px',textTransform:'uppercase' as const,
                        }}>{ic.label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>

        <div style={{padding:'6px 48px',borderTop:'1px solid rgba(255,255,255,.04)',flexShrink:0,display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(0,0,0,.2)'}}>
          <span style={{fontSize:9,color:'#1e2a35',letterSpacing:'.4px'}}>SOURCE: FOREX FACTORY  •  AUTO-REFRESH 30S  •  HORAIRES ET (EASTERN TIME)</span>
          <span style={{fontSize:9,color:'#1e2a35',letterSpacing:'.4px'}}>{filteredEvents.length} ÉVÉNEMENTS AFFICHÉS</span>
        </div>
      </>}

      {/* ══ NEWS TAB ══ */}
      {tab==='news'&&<>

        {/* Filter bar */}
        <div style={{padding:'12px 48px',borderBottom:'1px solid rgba(255,255,255,.05)',flexShrink:0,display:'flex',alignItems:'center',gap:6,flexWrap:'wrap' as const,background:'rgba(255,255,255,.015)'}}>
          <span style={{fontSize:9,fontWeight:700,letterSpacing:'1.5px',color:'#2d3f50',marginRight:4,textTransform:'uppercase' as const}}>IMPORTANCE</span>
          {([['all','Toutes','#c8d6e5'],['high','Haute','#ef4444'],['med','Moyenne','#f0b429']] as const).map(([i,l,c])=>(
            <button key={i} onClick={()=>setNewsImpact(i as any)} style={pill(newsImpact===i,c)}>{l}</button>
          ))}
          <div style={{width:1,height:20,background:'rgba(255,255,255,.07)',margin:'0 8px'}}/>
          <span style={{fontSize:9,fontWeight:700,letterSpacing:'1.5px',color:'#2d3f50',marginRight:4,textTransform:'uppercase' as const}}>DEVISE</span>
          {CURRENCIES.map(c=>{
            const active = newsCurrencies.has(c)
            return <button key={c} onClick={()=>toggleNewsCurrency(c)} style={{
              padding:'5px 14px', borderRadius:20, fontSize:11, fontWeight:600, cursor:'pointer',
              border:`1px solid ${active?'rgba(240,180,41,.55)':'rgba(255,255,255,.07)'}`,
              background:active?'rgba(240,180,41,.12)':'transparent',
              color:active?'#f0b429':'#3d5060', transition:'all 150ms', fontFamily:'inherit',
              boxShadow:active?'0 0 8px rgba(240,180,41,.15)':'none',
            }}>{c}</button>
          })}
          <div style={{flex:1}}/>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            {refreshing&&<span style={{fontSize:10,color:'#ef4444',fontWeight:700,letterSpacing:'.5px',animation:'t-pulse 1s infinite'}}>● LIVE</span>}
            <button onClick={fetchAll} style={{padding:'5px 12px',borderRadius:5,fontSize:10,fontWeight:600,cursor:'pointer',border:'1px solid rgba(255,255,255,.1)',background:'rgba(255,255,255,.04)',color:'#8a9db5',fontFamily:'inherit',transition:'all 150ms'}} onMouseEnter={e=>e.currentTarget.style.color='#c8d6e5'} onMouseLeave={e=>e.currentTarget.style.color='#8a9db5'}>↻ Refresh</button>
          </div>
        </div>

        {/* News feed */}
        <div style={{flex:1,overflowY:'auto'}}>
          {filteredNews.map((item,idx)=>{
            const isHigh = item.impact==='high'
            const isMed  = item.impact==='med'
            return (
              <div key={item.id} style={{
                display:'flex',gap:20,padding:'18px 48px',
                borderBottom:'1px solid rgba(255,255,255,.035)',
                background:isHigh?'rgba(239,68,68,.025)':'transparent',
                borderLeft:isHigh?'3px solid rgba(239,68,68,.5)':isMed?'3px solid rgba(240,180,41,.3)':'3px solid rgba(255,255,255,.04)',
                transition:'background 80ms',cursor:'pointer',
              }}
                onMouseEnter={e=>e.currentTarget.style.background=isHigh?'rgba(239,68,68,.05)':'rgba(255,255,255,.02)'}
                onMouseLeave={e=>e.currentTarget.style.background=isHigh?'rgba(239,68,68,.025)':'transparent'}>

                {/* Left column */}
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,flexShrink:0,width:60,paddingTop:3}}>
                  <span style={{
                    width:8,height:8,borderRadius:'50%',display:'block',
                    background:isHigh?'#ef4444':isMed?'#f0b429':'#2d3f50',
                    boxShadow:isHigh?'0 0 10px rgba(239,68,68,.6)':isMed?'0 0 8px rgba(240,180,41,.4)':'none',
                    animation:isHigh?'t-pulse 2s infinite':'none',flexShrink:0,
                  }}/>
                  {item.currency!=='ALL'&&<span style={{fontSize:16}}>{FLAGS[item.currency]||'🌐'}</span>}
                  <span style={{fontSize:9,color:'#2d3f50',fontFamily:'IBM Plex Mono,monospace',textAlign:'center' as const,lineHeight:1.3}}>{item.age}</span>
                </div>

                {/* Content */}
                <div style={{flex:1,minWidth:0}}>
                  {/* Badge */}
                  {isHigh&&(
                    <div style={{display:'inline-flex',alignItems:'center',gap:5,marginBottom:8,padding:'3px 10px',borderRadius:3,background:'rgba(239,68,68,.12)',border:'1px solid rgba(239,68,68,.25)'}}>
                      <span style={{width:4,height:4,borderRadius:'50%',background:'#ef4444',display:'inline-block',animation:'t-pulse 1.5s infinite'}}/>
                      <span style={{fontSize:9,fontWeight:800,color:'#ef4444',letterSpacing:'1px'}}>HAUTE IMPORTANCE</span>
                    </div>
                  )}
                  {isMed&&(
                    <div style={{display:'inline-flex',alignItems:'center',gap:5,marginBottom:8,padding:'3px 10px',borderRadius:3,background:'rgba(240,180,41,.08)',border:'1px solid rgba(240,180,41,.2)'}}>
                      <span style={{fontSize:9,fontWeight:700,color:'#f0b429',letterSpacing:'1px'}}>IMPORTANCE MOYENNE</span>
                    </div>
                  )}

                  <p style={{
                    fontSize:isHigh?14:13, fontWeight:700,
                    color:isHigh?'#f0f4f8':isMed?'#c8d6e5':'#8a9db5',
                    lineHeight:1.6, margin:'0 0 10px', letterSpacing:'-0.2px',
                  }}>
                    {item.title}
                  </p>

                  <div style={{display:'flex',gap:5,flexWrap:'wrap' as const}}>
                    {item.tags.slice(0,5).map(t=>(
                      <span key={t} style={{fontSize:9,fontWeight:600,padding:'2px 8px',borderRadius:3,background:'rgba(255,255,255,.04)',color:'#4a5e72',border:'1px solid rgba(255,255,255,.07)',letterSpacing:'.4px'}}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{padding:'6px 48px',borderTop:'1px solid rgba(255,255,255,.04)',flexShrink:0,display:'flex',justifyContent:'space-between',background:'rgba(0,0,0,.2)'}}>
          <span style={{fontSize:9,color:'#1e2a35',letterSpacing:'.4px'}}>SOURCE: FINANCIAL JUICE  •  AUTO-REFRESH 30S</span>
          <span style={{fontSize:9,color:'#1e2a35',letterSpacing:'.4px'}}>{filteredNews.length} NEWS AFFICHÉES</span>
        </div>
      </>}

      {/* ══ SPLIT LAYOUT ══ */}
      {layout==='split'&&(
        <div style={{flex:1,display:'flex',minHeight:0,overflow:'hidden'}}>
          {/* Left: Calendar */}
          <div style={{flex:1,display:'flex',flexDirection:'column',borderRight:'1px solid rgba(255,255,255,.06)',overflow:'hidden'}}>
            {/* Filter bar calendar */}
            <div style={{padding:'8px 20px',borderBottom:'1px solid rgba(255,255,255,.05)',flexShrink:0,display:'flex',alignItems:'center',gap:4,flexWrap:'wrap' as const,background:'rgba(255,255,255,.01)'}}>
              {(['all','high','med','low'] as const).map(i=>{
                const c=i==='high'?'#ef4444':i==='med'?'#f0b429':i==='low'?'#4a5e72':'#c8d6e5'
                return <button key={i} onClick={()=>setImpactFilter(i)} style={pill(impactFilter===i,c)}>
                  {i==='all'?'Tous':IC[i as ImpactLevel]?.stars}
                </button>
              })}
              <div style={{width:1,height:14,background:'rgba(255,255,255,.07)',margin:'0 4px'}}/>
              {CURRENCIES.map(c=>{
                const active=currencies.has(c)
                return <button key={c} onClick={()=>toggleCurrency(c)} style={{padding:'3px 8px',borderRadius:10,fontSize:9,fontWeight:600,cursor:'pointer',border:`1px solid ${active?'rgba(240,180,41,.4)':'rgba(255,255,255,.06)'}`,background:active?'rgba(240,180,41,.1)':'transparent',color:active?'#f0b429':'#3d5060',transition:'all 100ms',fontFamily:'inherit'}}>{c}</button>
              })}
            </div>
            <div style={{flex:1,overflowY:'auto' as const}}>
              {groupByDay(filteredEvents).map(([day,dayEvents])=>(
                <div key={day}>
                  <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 20px',background:'rgba(240,180,41,.02)',borderBottom:'0.5px solid rgba(255,255,255,.04)',position:'sticky' as const,top:0,zIndex:2,backdropFilter:'blur(12px)'}}>
                    <span style={{fontSize:9,fontWeight:700,color:'#f0b429',letterSpacing:'.5px'}}>{day}</span>
                    <div style={{flex:1,height:'0.5px',background:'rgba(255,255,255,.04)'}}/>
                    {dayEvents.some(e=>e.impactLevel==='high')&&<span style={{fontSize:8,color:'#ef4444',fontWeight:700}}>● HIGH</span>}
                    <span style={{fontSize:8,color:'#3d5060'}}>{dayEvents.length}</span>
                  </div>
                  {dayEvents.map(ev=>{
                    const ic=IC[ev.impactLevel]; const hasActual=!!ev.actual
                    return (
                      <div key={ev.id} style={{display:'grid',gridTemplateColumns:'36px 44px 18px 30px 1fr 90px 36px 36px',alignItems:'center',padding:'8px 20px',borderBottom:'0.5px solid rgba(255,255,255,.03)',background:ev.impactLevel==='high'?'rgba(239,68,68,.018)':'transparent',borderLeft:ev.impactLevel==='high'?'2px solid rgba(239,68,68,.4)':'2px solid transparent'}}
                        onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.025)'}
                        onMouseLeave={e=>e.currentTarget.style.background=ev.impactLevel==='high'?'rgba(239,68,68,.018)':'transparent'}>
                        <span style={{fontSize:9,color:ic.color}}>{ic.stars}</span>
                        <span style={{fontSize:9,color:'#5a7080',fontFamily:'IBM Plex Mono,monospace'}}>{ev.time?.toLowerCase().replace(' ','')||'—'}</span>
                        <span style={{fontSize:11}}>{ev.flag}</span>
                        <span style={{fontSize:9,fontWeight:800,color:'#4a5e72'}}>{ev.country}</span>
                        <span style={{fontSize:11,fontWeight:700,color:ev.impactLevel==='high'?'#f0f4f8':ev.impactLevel==='med'?'#b8cad9':'#8a9db5',paddingRight:8,lineHeight:1.3}}>{ev.title}</span>
                        {ev.forecastLow&&ev.forecastHigh?(
                          <div style={{display:'flex',alignItems:'center',gap:1,fontSize:8,fontFamily:'IBM Plex Mono,monospace',justifyContent:'center'}}>
                            <span style={{color:'rgba(239,68,68,.7)'}}>{ev.forecastLow}</span><span style={{color:'rgba(255,255,255,.1)'}}>│</span>
                            <span style={{color:'#f0b429',fontWeight:700}}>{ev.forecast}</span><span style={{color:'rgba(255,255,255,.1)'}}>│</span>
                            <span style={{color:'rgba(34,197,94,.7)'}}>{ev.forecastHigh}</span>
                          </div>
                        ):<span style={{textAlign:'center' as const,fontSize:8,color:'#1e2a35'}}>—</span>}
                        <span style={{fontSize:9,color:'#4a5e72',textAlign:'right' as const,fontFamily:'IBM Plex Mono,monospace'}}>{ev.previous||'—'}</span>
                        <span style={{fontSize:9,fontWeight:hasActual?700:400,color:hasActual?'#22c55e':'#1e2a35',textAlign:'right' as const,fontFamily:'IBM Plex Mono,monospace'}}>{ev.actual||'—'}</span>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Right: News */}
          <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
            {/* Filter bar news */}
            <div style={{padding:'8px 20px',borderBottom:'1px solid rgba(255,255,255,.05)',flexShrink:0,display:'flex',alignItems:'center',gap:4,flexWrap:'wrap' as const,background:'rgba(255,255,255,.01)'}}>
              {(['all','high','med'] as const).map(i=>{
                const c=i==='high'?'#ef4444':i==='med'?'#f0b429':'#c8d6e5'
                return <button key={i} onClick={()=>setNewsImpact(i)} style={pill(newsImpact===i,c)}>{i==='all'?'Tous':i==='high'?'Haute':'Moy.'}</button>
              })}
              <div style={{width:1,height:14,background:'rgba(255,255,255,.07)',margin:'0 4px'}}/>
              {CURRENCIES.map(c=>{
                const active=newsCurrencies.has(c)
                return <button key={c} onClick={()=>toggleNewsCurrency(c)} style={{padding:'3px 8px',borderRadius:10,fontSize:9,fontWeight:600,cursor:'pointer',border:`1px solid ${active?'rgba(240,180,41,.4)':'rgba(255,255,255,.06)'}`,background:active?'rgba(240,180,41,.1)':'transparent',color:active?'#f0b429':'#3d5060',transition:'all 100ms',fontFamily:'inherit'}}>{c}</button>
              })}
            </div>
            <div style={{flex:1,overflowY:'auto' as const}}>
              {filteredNews.map(item=>{
                const isHigh=item.impact==='high'; const isMed=item.impact==='med'
                return (
                  <div key={item.id} style={{display:'flex',gap:12,padding:'12px 20px',borderBottom:'0.5px solid rgba(255,255,255,.03)',background:isHigh?'rgba(239,68,68,.02)':'transparent',borderLeft:isHigh?'2px solid rgba(239,68,68,.5)':isMed?'2px solid rgba(240,180,41,.3)':'2px solid transparent'}}
                    onMouseEnter={e=>e.currentTarget.style.background=isHigh?'rgba(239,68,68,.04)':'rgba(255,255,255,.015)'}
                    onMouseLeave={e=>e.currentTarget.style.background=isHigh?'rgba(239,68,68,.02)':'transparent'}>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,flexShrink:0,width:40,paddingTop:2}}>
                      <span style={{width:6,height:6,borderRadius:'50%',display:'block',background:isHigh?'#ef4444':isMed?'#f0b429':'#2d3f50',boxShadow:isHigh?'0 0 8px rgba(239,68,68,.6)':'none',animation:isHigh?'t-pulse 2s infinite':'none'}}/>
                      {item.currency!=='ALL'&&<span style={{fontSize:12}}>{FLAGS[item.currency]||'🌐'}</span>}
                      <span style={{fontSize:8,color:'#2d3f50',fontFamily:'IBM Plex Mono,monospace'}}>{item.age}</span>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      {isHigh&&<div style={{display:'inline-flex',alignItems:'center',gap:4,marginBottom:5,padding:'2px 7px',borderRadius:3,background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.2)'}}>
                        <span style={{width:3,height:3,borderRadius:'50%',background:'#ef4444',display:'inline-block',animation:'t-pulse 1.5s infinite'}}/>
                        <span style={{fontSize:8,fontWeight:800,color:'#ef4444',letterSpacing:'.8px'}}>HAUTE IMPORTANCE</span>
                      </div>}
                      <p style={{fontSize:12,fontWeight:700,color:isHigh?'#f0f4f8':isMed?'#c8d6e5':'#8a9db5',lineHeight:1.5,margin:'0 0 6px'}}>{item.title}</p>
                      <div style={{display:'flex',gap:3,flexWrap:'wrap' as const}}>
                        {item.tags.slice(0,4).map(t=><span key={t} style={{fontSize:8,fontWeight:600,padding:'1px 5px',borderRadius:2,background:'rgba(255,255,255,.04)',color:'#4a5e72',border:'0.5px solid rgba(255,255,255,.06)'}}>{t}</span>)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
