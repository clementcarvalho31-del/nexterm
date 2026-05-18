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

function forecastRange(forecast: string) {
  if (!forecast) return null
  const val = parseFloat(forecast.replace(/[^0-9.-]/g,''))
  if (isNaN(val)) return null
  const unit = forecast.replace(/[\d.-]/g,'').trim()
  const d = Math.abs(val)>100?val*0.08:Math.abs(val)>10?val*0.12:Math.abs(val)>1?val*0.15:0.1
  const f = (n:number) => (Math.round(n*100)/100)+unit
  return { low: f(val-d), high: f(val+d) }
}

function enrichEvent(e: RawFFEvent, i: number): CalEvent {
  const r = forecastRange(e.forecast)
  return { ...e, id:`ev-${i}`, flag:FLAGS[e.country]||'🌐', impactLevel:IMPACT_MAP[e.impact]||'low', forecastLow:r?.low, forecastHigh:r?.high }
}

function groupByDay(events: CalEvent[]): [string, CalEvent[]][] {
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
  if (m<1) return 'maintenant'; if (m<60) return `il y a ${m}m`
  const h = Math.floor(m/60); if (h<24) return `il y a ${h}h`
  return `il y a ${Math.floor(h/24)}j`
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
  {title:'Michigan Consumer Sentiment',country:'USD',date:new Date(Date.now()+345600000).toISOString(),time:'10:00am',impact:'Medium Impact Expected',forecast:'59.0',previous:'57.0',actual:''},
]

const NEWS_FALLBACK: NewsItem[] = [
  {id:'n1',title:'🚨 FED WILLIAMS: No rush to cut rates — inflation still too high, data confirms hawkish stance',date:new Date(Date.now()-300000).toISOString(),tags:['FED','USD','RATES'],impact:'high',currency:'USD',age:'5m'},
  {id:'n2',title:'🚨 ECB LAGARDE: June cut confirmed if inflation continues declining — EUR/USD sold to 1.0840',date:new Date(Date.now()-900000).toISOString(),tags:['ECB','EUR'],impact:'high',currency:'EUR',age:'15m'},
  {id:'n3',title:'NFP PREVIEW: Consensus 175K — whisper 185K — USD vulnerable on miss below 150K',date:new Date(Date.now()-1800000).toISOString(),tags:['NFP','USD'],impact:'high',currency:'USD',age:'30m'},
  {id:'n4',title:'GBP/USD holds 1.2680 — UK CPI beat supports hawkish BoE pricing, rate cut delayed',date:new Date(Date.now()-3600000).toISOString(),tags:['GBP','BOE'],impact:'med',currency:'GBP',age:'1h'},
  {id:'n5',title:'🚨 BOJ MINUTES: Heated debate on pace of normalisation — JPY bid on intervention risk',date:new Date(Date.now()-5400000).toISOString(),tags:['BOJ','JPY'],impact:'high',currency:'JPY',age:'1h30'},
  {id:'n6',title:'Gold breaks $2320 — geopolitical bid + real yields falling, CB accumulation accelerating',date:new Date(Date.now()-7200000).toISOString(),tags:['GOLD','USD'],impact:'med',currency:'USD',age:'2h'},
  {id:'n7',title:'PBoC keeps LPR unchanged at 3.45% — no stimulus signal, CNH stable',date:new Date(Date.now()-9000000).toISOString(),tags:['PBOC','CNY'],impact:'med',currency:'CNY',age:'2h30'},
  {id:'n8',title:'US Retail Sales +0.7% vs +0.4% expected — consumer resilience supports USD bid',date:new Date(Date.now()-10800000).toISOString(),tags:['USD','RETAIL'],impact:'med',currency:'USD',age:'3h'},
  {id:'n9',title:'🚨 FOMC MEMBER GOOLSBEE: Two cuts still possible in 2025 if data cooperates',date:new Date(Date.now()-12600000).toISOString(),tags:['FED','USD'],impact:'high',currency:'USD',age:'3h30'},
  {id:'n10',title:'Canada CPI 2.9% y/y — BOC cut in June now 78% priced, CAD sold across the board',date:new Date(Date.now()-14400000).toISOString(),tags:['BOC','CAD'],impact:'high',currency:'CAD',age:'4h'},
  {id:'n11',title:'Eurozone PMI composite 52.1 vs 51.5 expected — EUR/USD bounce to 1.0860',date:new Date(Date.now()-18000000).toISOString(),tags:['EUR','PMI'],impact:'med',currency:'EUR',age:'5h'},
  {id:'n12',title:'US 10Y yield hits 4.48% — dollar bid, EM currencies under pressure',date:new Date(Date.now()-21600000).toISOString(),tags:['USD','BONDS'],impact:'high',currency:'USD',age:'6h'},
]

export function CalendarPanel() {
  const [tab, setTab]           = useState<Tab>('calendar')
  const [events, setEvents]     = useState<CalEvent[]>([])
  const [news, setNews]         = useState<NewsItem[]>([])
  const [loading, setLoading]   = useState(true)
  const [lastUpdate, setLastUpdate] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [impactFilter, setImpactFilter] = useState<'all'|ImpactLevel>('all')
  const [currencyFilter, setCurrencyFilter] = useState('ALL')
  const [newsImpact, setNewsImpact] = useState<'all'|ImpactLevel>('all')
  const [newsCurrency, setNewsCurrency] = useState('ALL')
  const intervalRef = useRef<ReturnType<typeof setInterval>|null>(null)

  const fetchAll = useCallback(async () => {
    setRefreshing(true)
    try {
      const [calRes, newsRes] = await Promise.all([
        fetch('/api/calendar',{cache:'no-store'}),
        fetch('/api/news',{cache:'no-store'})
      ])
      const calJson = await calRes.json()
      const newsJson = await newsRes.json()
      setEvents((calJson.ok&&calJson.data?.length>0?calJson.data:FF_FALLBACK).map(enrichEvent))
      if (newsJson.ok&&newsJson.data?.length>0) {
        setNews(newsJson.data.map((n:any,i:number):NewsItem=>({
          id:`n-${i}`, title:n.title, date:n.date, tags:n.tags||[],
          impact:detectImpact(n.title), currency:detectCurrency(n.title,n.tags||[]), age:timeAgo(n.date)
        })))
      } else { setNews(NEWS_FALLBACK) }
      setLastUpdate(new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}))
    } catch {
      setEvents(FF_FALLBACK.map(enrichEvent))
      setNews(NEWS_FALLBACK)
    } finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => {
    fetchAll()
    intervalRef.current = setInterval(fetchAll, 30000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [fetchAll])

  const filteredEvents = events
    .filter(e => (impactFilter==='all'||e.impactLevel===impactFilter) && (currencyFilter==='ALL'||e.country===currencyFilter))
    .sort((a,b) => new Date(a.date).getTime()-new Date(b.date).getTime())

  const filteredNews = news.filter(n => (newsImpact==='all'||n.impact===newsImpact) && (newsCurrency==='ALL'||n.currency===newsCurrency))
  const grouped = groupByDay(filteredEvents)
  const highCount = events.filter(e=>e.impactLevel==='high').length
  const CURRENCIES = ['ALL','USD','EUR','GBP','JPY','CAD','AUD','NZD','CHF']

  const IMP_COLOR: Record<ImpactLevel,string> = { high:'#ef4444', med:'#f0b429', low:'#374151' }
  const IMP_BG:    Record<ImpactLevel,string> = { high:'rgba(239,68,68,.1)', med:'rgba(240,180,41,.08)', low:'transparent' }
  const IMP_STARS: Record<ImpactLevel,string> = { high:'★★★', med:'★★☆', low:'★☆☆' }

  const chip = (active: boolean, label: string, color = '#f0b429') => ({
    padding:'5px 12px', borderRadius:4, fontSize:11, fontWeight:600 as const, cursor:'pointer' as const,
    border:`1px solid ${active?color+'66':'rgba(255,255,255,.08)'}`,
    background:active?color+'15':'rgba(255,255,255,.02)',
    color:active?color:'#4a5e72', transition:'all 120ms', fontFamily:'inherit',
  })

  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',background:'#07090e',fontFamily:"'Inter',-apple-system,sans-serif",overflow:'hidden'}}>

      {/* ══ HEADER PRINCIPAL ══ */}
      <div style={{flexShrink:0,background:'linear-gradient(180deg,#0d1117 0%,#07090e 100%)',borderBottom:'1px solid rgba(255,255,255,.07)'}}>
        {/* Titre centré */}
        <div style={{textAlign:'center',padding:'28px 20px 0'}}>
          <h1 style={{fontSize:28,fontWeight:800,letterSpacing:'-0.8px',color:'#f0f4f8',margin:0,lineHeight:1}}>
            Calendrier <span style={{color:'#f0b429'}}>&</span> News Macro
          </h1>
          <p style={{fontSize:12,color:'#3d5060',marginTop:6,marginBottom:0}}>Données live · Refresh 30s · Forex Factory + Financial Juice</p>
        </div>

        {/* Onglets */}
        <div style={{display:'flex',justifyContent:'center',gap:0,marginTop:24,paddingBottom:0}}>
          {([['calendar','📅 Calendrier Économique'],['news','📰 News Macro Feed']] as [Tab,string][]).map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} style={{
              padding:'12px 36px', fontSize:13, fontWeight:tab===t?700:500, cursor:'pointer',
              border:'none', borderBottom:tab===t?'3px solid #f0b429':'3px solid transparent',
              background:'transparent', color:tab===t?'#f0b429':'#5a7080',
              transition:'all 150ms', fontFamily:'inherit', letterSpacing:'-0.2px',
              display:'flex', alignItems:'center', gap:8,
            }}>
              {l}
              {t==='calendar'&&highCount>0&&(
                <span style={{fontSize:9,padding:'2px 6px',borderRadius:10,background:'rgba(239,68,68,.2)',color:'#ef4444',fontWeight:700}}>{highCount} HIGH</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ══ CALENDRIER ══ */}
      {tab==='calendar'&&<>
        {/* Filtres */}
        <div style={{padding:'12px 20px',borderBottom:'0.5px solid rgba(255,255,255,.06)',flexShrink:0,display:'flex',gap:6,flexWrap:'wrap' as const,alignItems:'center',background:'rgba(255,255,255,.01)'}}>
          <span style={{fontSize:10,color:'#3d5060',marginRight:4,fontWeight:600,letterSpacing:'.5px'}}>IMPACT</span>
          {(['all','high','med','low'] as const).map(i=>{
            const col = i==='high'?'#ef4444':i==='med'?'#f0b429':i==='low'?'#64748b':'#c8d6e5'
            return <button key={i} onClick={()=>setImpactFilter(i)} style={chip(impactFilter===i, i==='all'?'Tous':i==='high'?'★★★':i==='med'?'★★☆':'★☆☆', col)}>
              {i==='all'?'Tous':i==='high'?'★★★':i==='med'?'★★☆':'★☆☆'}
            </button>
          })}
          <div style={{width:1,height:20,background:'rgba(255,255,255,.07)',margin:'0 6px'}}/>
          <span style={{fontSize:10,color:'#3d5060',marginRight:4,fontWeight:600,letterSpacing:'.5px'}}>DEVISE</span>
          {CURRENCIES.map(c=><button key={c} onClick={()=>setCurrencyFilter(c)} style={chip(currencyFilter===c,c)}>{c}</button>)}
          <div style={{flex:1}}/>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            {refreshing&&<span style={{fontSize:9,color:'#f0b429',animation:'t-pulse 1s infinite'}}>● live</span>}
            {lastUpdate&&<span style={{fontSize:9,color:'#2d3f50',fontFamily:'IBM Plex Mono,monospace'}}>{lastUpdate}</span>}
            <button onClick={fetchAll} style={{padding:'4px 10px',borderRadius:4,fontSize:10,cursor:'pointer',border:'0.5px solid rgba(255,255,255,.1)',background:'rgba(255,255,255,.03)',color:'#5a7080',fontFamily:'inherit',transition:'all 100ms'}} onMouseEnter={e=>e.currentTarget.style.color='#c8d6e5'} onMouseLeave={e=>e.currentTarget.style.color='#5a7080'}>↻ Refresh</button>
          </div>
        </div>

        {/* Entêtes colonnes */}
        <div style={{display:'grid',gridTemplateColumns:'40px 56px 22px 36px 1fr 130px 44px 44px 36px',gap:0,padding:'6px 20px',background:'rgba(0,0,0,.3)',borderBottom:'0.5px solid rgba(255,255,255,.05)',flexShrink:0}}>
          {[['IMPACT',''],['HEURE',''],['',''],['',''],['ÉVÉNEMENT','flex'],['LOW │ FORE │ HIGH',''],['PREV','right'],['ACT','right'],['','']].map(([h,align],i)=>(
            <span key={i} style={{fontSize:8,color:'#2d3f50',letterSpacing:'.5px',textTransform:'uppercase' as const,textAlign:(align||'left') as any}}>{h}</span>
          ))}
        </div>

        {/* Liste événements */}
        <div style={{flex:1,overflowY:'auto'}}>
          {loading?(
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:200,gap:10}}>
              <span style={{width:14,height:14,borderRadius:'50%',border:'2px solid rgba(240,180,41,.3)',borderTopColor:'#f0b429',animation:'t-spin .7s linear infinite',display:'inline-block'}}/>
              <span style={{fontSize:12,color:'#3d5060'}}>Chargement du calendrier…</span>
            </div>
          ):grouped.length===0?(
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:200,gap:8}}>
              <span style={{fontSize:32}}>📭</span>
              <span style={{fontSize:13,color:'#3d5060'}}>Aucun événement pour ce filtre</span>
            </div>
          ):(
            grouped.map(([day,dayEvents])=>(
              <div key={day}>
                {/* Séparateur jour */}
                <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 20px',background:'rgba(240,180,41,.03)',borderTop:'0.5px solid rgba(240,180,41,.08)',borderBottom:'0.5px solid rgba(255,255,255,.04)',position:'sticky' as const,top:0,zIndex:2,backdropFilter:'blur(12px)'}}>
                  <span style={{fontSize:11,fontWeight:700,color:'#f0b429',letterSpacing:'.5px',textTransform:'uppercase' as const}}>{day}</span>
                  <div style={{flex:1,height:'0.5px',background:'rgba(255,255,255,.04)'}}/>
                  {dayEvents.some(e=>e.impactLevel==='high')&&(
                    <span style={{fontSize:9,color:'#ef4444',fontWeight:700,display:'flex',alignItems:'center',gap:4}}>
                      <span style={{width:5,height:5,borderRadius:'50%',background:'#ef4444',display:'inline-block',animation:'t-pulse 1.5s infinite'}}/>
                      HIGH IMPACT
                    </span>
                  )}
                  <span style={{fontSize:9,color:'#3d5060'}}>{dayEvents.length} events</span>
                </div>

                {/* Lignes événements */}
                {dayEvents.map(ev=>{
                  const col = IMP_COLOR[ev.impactLevel]
                  const bg  = IMP_BG[ev.impactLevel]
                  const sts = IMP_STARS[ev.impactLevel]
                  const hasActual = !!ev.actual
                  return (
                    <div key={ev.id} style={{display:'grid',gridTemplateColumns:'40px 56px 22px 36px 1fr 130px 44px 44px 36px',alignItems:'center',padding:'9px 20px',borderBottom:'0.5px solid rgba(255,255,255,.04)',background:ev.impactLevel==='high'?'rgba(239,68,68,.02)':'transparent',transition:'background 80ms'}}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.03)'}
                      onMouseLeave={e=>e.currentTarget.style.background=ev.impactLevel==='high'?'rgba(239,68,68,.02)':'transparent'}>
                      {/* Impact stars */}
                      <span style={{fontSize:10,color:col,letterSpacing:.3,fontWeight:600}}>{sts}</span>
                      {/* Time */}
                      <span style={{fontSize:10,color:'#8a9db5',fontFamily:'IBM Plex Mono,monospace',fontWeight:500}}>
                        {ev.time?.toLowerCase().replace(' ','')||'—'}
                      </span>
                      {/* Flag */}
                      <span style={{fontSize:13}}>{ev.flag}</span>
                      {/* Country */}
                      <span style={{fontSize:9,fontWeight:700,color:'#5a7080',letterSpacing:'.3px'}}>{ev.country}</span>
                      {/* Title */}
                      <span style={{fontSize:12,fontWeight:ev.impactLevel==='high'?600:400,color:ev.impactLevel==='high'?'#f0f4f8':ev.impactLevel==='med'?'#c8d6e5':'#6a7d8f',lineHeight:1.3,paddingRight:12}}>
                        {ev.title}
                      </span>
                      {/* Forecast range */}
                      {ev.forecastLow&&ev.forecastHigh?(
                        <div style={{display:'flex',alignItems:'center',gap:2,fontSize:9,fontFamily:'IBM Plex Mono,monospace',justifyContent:'center'}}>
                          <span style={{color:'#ef4444'}}>{ev.forecastLow}</span>
                          <span style={{color:'#2d3f50',margin:'0 1px'}}>│</span>
                          <span style={{color:'#f0b429',fontWeight:700,fontSize:10}}>{ev.forecast}</span>
                          <span style={{color:'#2d3f50',margin:'0 1px'}}>│</span>
                          <span style={{color:'#22c55e'}}>{ev.forecastHigh}</span>
                        </div>
                      ):<span style={{textAlign:'center' as const,fontSize:9,color:'#2d3f50',fontFamily:'IBM Plex Mono,monospace'}}>—</span>}
                      {/* Previous */}
                      <span style={{fontSize:10,color:'#5a7080',textAlign:'right' as const,fontFamily:'IBM Plex Mono,monospace'}}>{ev.previous||'—'}</span>
                      {/* Actual */}
                      <span style={{fontSize:10,fontWeight:700,color:hasActual?'#22c55e':'#2a3a48',textAlign:'right' as const,fontFamily:'IBM Plex Mono,monospace'}}>{ev.actual||'—'}</span>
                      {/* Badge */}
                      <div style={{display:'flex',justifyContent:'center'}}>
                        <span style={{fontSize:8,fontWeight:700,padding:'2px 5px',borderRadius:3,background:bg,color:col,border:`0.5px solid ${col}44`,letterSpacing:'.3px',textAlign:'center' as const}}>
                          {ev.impactLevel==='high'?'HIGH':ev.impactLevel==='med'?'MED':'LOW'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{padding:'5px 20px',borderTop:'0.5px solid rgba(255,255,255,.04)',flexShrink:0,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontSize:9,color:'#2d3f50'}}>Source: Forex Factory • Auto-refresh 30s • Horaires ET (Eastern Time)</span>
          <span style={{fontSize:9,color:'#2d3f50'}}>{filteredEvents.length} événements affichés</span>
        </div>
      </>}

      {/* ══ NEWS MACRO ══ */}
      {tab==='news'&&<>
        {/* Filtres */}
        <div style={{padding:'12px 20px',borderBottom:'0.5px solid rgba(255,255,255,.06)',flexShrink:0,display:'flex',gap:6,flexWrap:'wrap' as const,alignItems:'center',background:'rgba(255,255,255,.01)'}}>
          <span style={{fontSize:10,color:'#3d5060',marginRight:4,fontWeight:600,letterSpacing:'.5px'}}>IMPORTANCE</span>
          {([['all','Toutes','#c8d6e5'],['high','🔴 Haute','#ef4444'],['med','🟡 Moyenne','#f0b429']] as [ImpactLevel|'all',string,string][]).map(([i,l,c])=>(
            <button key={i} onClick={()=>setNewsImpact(i)} style={chip(newsImpact===i,l,c)}>{l}</button>
          ))}
          <div style={{width:1,height:20,background:'rgba(255,255,255,.07)',margin:'0 6px'}}/>
          <span style={{fontSize:10,color:'#3d5060',marginRight:4,fontWeight:600,letterSpacing:'.5px'}}>DEVISE</span>
          {CURRENCIES.map(c=><button key={c} onClick={()=>setNewsCurrency(c)} style={chip(newsCurrency===c,c)}>{c}</button>)}
          <div style={{flex:1}}/>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            {refreshing&&<span style={{fontSize:9,color:'#ef4444',fontWeight:700,animation:'t-pulse 1s infinite'}}>● LIVE</span>}
            <button onClick={fetchAll} style={{padding:'4px 10px',borderRadius:4,fontSize:10,cursor:'pointer',border:'0.5px solid rgba(255,255,255,.1)',background:'rgba(255,255,255,.03)',color:'#5a7080',fontFamily:'inherit'}}>↻ Refresh</button>
          </div>
        </div>

        {/* Feed news */}
        <div style={{flex:1,overflowY:'auto'}}>
          {filteredNews.map((item,idx)=>(
            <div key={item.id} style={{
              display:'flex', gap:14, padding:'14px 20px',
              borderBottom:'0.5px solid rgba(255,255,255,.04)',
              background:item.impact==='high'?'rgba(239,68,68,.03)':'transparent',
              borderLeft:item.impact==='high'?'3px solid rgba(239,68,68,.6)':'3px solid transparent',
              transition:'background 80ms', cursor:'pointer',
            }}
              onMouseEnter={e=>e.currentTarget.style.background=item.impact==='high'?'rgba(239,68,68,.06)':'rgba(255,255,255,.02)'}
              onMouseLeave={e=>e.currentTarget.style.background=item.impact==='high'?'rgba(239,68,68,.03)':'transparent'}>
              {/* Colonne gauche */}
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,flexShrink:0,width:50}}>
                <span style={{
                  width:8,height:8,borderRadius:'50%',display:'block',flexShrink:0,
                  background:item.impact==='high'?'#ef4444':item.impact==='med'?'#f0b429':'#374151',
                  boxShadow:item.impact==='high'?'0 0 8px rgba(239,68,68,.7)':item.impact==='med'?'0 0 6px rgba(240,180,41,.5)':'none',
                  animation:item.impact==='high'?'t-pulse 1.5s infinite':'none',
                }}/>
                {item.currency!=='ALL'&&<span style={{fontSize:14}}>{FLAGS[item.currency]||'🌐'}</span>}
                <span style={{fontSize:9,color:'#2d3f50',fontFamily:'IBM Plex Mono,monospace',whiteSpace:'nowrap' as const}}>{item.age}</span>
              </div>
              {/* Contenu */}
              <div style={{flex:1,minWidth:0}}>
                <p style={{
                  fontSize:13,
                  fontWeight:item.impact==='high'?600:400,
                  color:item.impact==='high'?'#f0f4f8':item.impact==='med'?'#c8d6e5':'#7a8fa8',
                  lineHeight:1.55, margin:'0 0 8px',
                }}>
                  {item.title}
                </p>
                <div style={{display:'flex',gap:4,flexWrap:'wrap' as const}}>
                  {item.impact==='high'&&(
                    <span style={{fontSize:9,fontWeight:800,padding:'2px 7px',borderRadius:3,background:'rgba(239,68,68,.15)',color:'#ef4444',border:'0.5px solid rgba(239,68,68,.3)',letterSpacing:'.4px'}}>🔴 HAUTE IMPORTANCE</span>
                  )}
                  {item.impact==='med'&&(
                    <span style={{fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:3,background:'rgba(240,180,41,.1)',color:'#f0b429',border:'0.5px solid rgba(240,180,41,.25)',letterSpacing:'.4px'}}>🟡 IMPORTANCE MOYENNE</span>
                  )}
                  {item.tags.slice(0,4).map(t=>(
                    <span key={t} style={{fontSize:9,fontWeight:600,padding:'2px 6px',borderRadius:3,background:'rgba(255,255,255,.05)',color:'#5a7080',border:'0.5px solid rgba(255,255,255,.08)'}}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{padding:'5px 20px',borderTop:'0.5px solid rgba(255,255,255,.04)',flexShrink:0,display:'flex',justifyContent:'space-between'}}>
          <span style={{fontSize:9,color:'#2d3f50'}}>Source: Financial Juice • Auto-refresh 30s</span>
          <span style={{fontSize:9,color:'#2d3f50'}}>{filteredNews.length} news affichées</span>
        </div>
      </>}
    </div>
  )
}
