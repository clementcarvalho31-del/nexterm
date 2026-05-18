'use client'
import { useState, useEffect, useCallback } from 'react'

type Impact = 'High Impact Expected' | 'Medium Impact Expected' | 'Low Impact Expected' | 'Non-Economic'
type Direction = 'bullish' | 'bearish' | 'neutral'

interface FFEvent {
  title: string
  country: string
  date: string
  time: string
  impact: Impact
  forecast: string
  previous: string
  actual: string
}

interface EnrichedEvent extends FFEvent {
  id: string
  flag: string
  impactLevel: 'high' | 'med' | 'low'
  forecastMin?: string
  forecastMax?: string
  scenarios?: {
    bull: { label: string; condition: string; assets: { name: string; dir: Direction }[] }
    bear: { label: string; condition: string; assets: { name: string; dir: Direction }[] }
    base: { label: string; condition: string; assets: { name: string; dir: Direction }[] }
  }
}

const FLAG_MAP: Record<string, string> = {
  USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵', CAD: '🇨🇦',
  AUD: '🇦🇺', NZD: '🇳🇿', CHF: '🇨🇭', CNY: '🇨🇳', SEK: '🇸🇪',
  NOK: '🇳🇴', SGD: '🇸🇬', HKD: '🇭🇰', KRW: '🇰🇷', MXN: '🇲🇽',
}

const IMPACT_MAP: Record<string, 'high'|'med'|'low'> = {
  'High Impact Expected': 'high',
  'Medium Impact Expected': 'med',
  'Low Impact Expected': 'low',
  'Non-Economic': 'low',
}

// Scenarios pour les events clés
const SCENARIO_MAP: Record<string, EnrichedEvent['scenarios']> = {
  'CPI': {
    bull: { label: 'Beat (chaud)', condition: 'CPI > forecast → Fed hawkish, moins de cuts', assets: [{name:'DXY',dir:'bullish'},{name:'USD/JPY',dir:'bullish'},{name:'EUR/USD',dir:'bearish'},{name:'Gold',dir:'bearish'}] },
    bear: { label: 'Miss (froid)', condition: 'CPI < forecast → cuts anticipés, USD vendu', assets: [{name:'DXY',dir:'bearish'},{name:'EUR/USD',dir:'bullish'},{name:'Gold',dir:'bullish'},{name:'S&P 500',dir:'bullish'}] },
    base: { label: 'In-line', condition: 'Pas de surprise, mouvement limité', assets: [{name:'DXY',dir:'neutral'},{name:'EUR/USD',dir:'neutral'}] },
  },
  'NFP': {
    bull: { label: 'Beat > +30K', condition: 'Marché travail fort → Fed hawkish', assets: [{name:'DXY',dir:'bullish'},{name:'USD/JPY',dir:'bullish'},{name:'EUR/USD',dir:'bearish'},{name:'Gold',dir:'bearish'},{name:'S&P500',dir:'bearish'}] },
    bear: { label: 'Miss > -30K', condition: 'Ralentissement → cuts repriced', assets: [{name:'DXY',dir:'bearish'},{name:'EUR/USD',dir:'bullish'},{name:'Gold',dir:'bullish'},{name:'S&P500',dir:'bullish'}] },
    base: { label: 'In-line', condition: 'Pas de repricing Fed', assets: [{name:'DXY',dir:'neutral'},{name:'EUR/USD',dir:'neutral'}] },
  },
  'FOMC': {
    bull: { label: 'Dovish', condition: 'Signal de cuts proches → USD vendu', assets: [{name:'EUR/USD',dir:'bullish'},{name:'GBP/USD',dir:'bullish'},{name:'Gold',dir:'bullish'},{name:'DXY',dir:'bearish'}] },
    bear: { label: 'Hawkish', condition: 'Cuts repoussés → USD bid fort', assets: [{name:'DXY',dir:'bullish'},{name:'USD/JPY',dir:'bullish'},{name:'EUR/USD',dir:'bearish'},{name:'Gold',dir:'bearish'}] },
    base: { label: 'Neutre', condition: 'Data-dependent, pas de surprise', assets: [{name:'DXY',dir:'neutral'},{name:'EUR/USD',dir:'neutral'}] },
  },
  'GDP': {
    bull: { label: 'Beat', condition: 'Croissance forte → devise bid', assets: [{name:'DXY',dir:'bullish'},{name:'USD/JPY',dir:'bullish'}] },
    bear: { label: 'Miss', condition: 'Croissance faible → récession fear', assets: [{name:'DXY',dir:'bearish'},{name:'Gold',dir:'bullish'}] },
    base: { label: 'In-line', condition: 'Pas de surprise', assets: [{name:'DXY',dir:'neutral'}] },
  },
  'Retail Sales': {
    bull: { label: 'Beat', condition: 'Consommation forte → USD bid', assets: [{name:'DXY',dir:'bullish'},{name:'EUR/USD',dir:'bearish'}] },
    bear: { label: 'Miss', condition: 'Consommation faible → récession signal', assets: [{name:'DXY',dir:'bearish'},{name:'Gold',dir:'bullish'}] },
    base: { label: 'In-line', condition: 'Neutre', assets: [{name:'DXY',dir:'neutral'}] },
  },
}

// Forecast range estimates (±variation)
function getForecastRange(event: FFEvent): { min: string; max: string } | null {
  const f = parseFloat(event.forecast?.replace('%','').replace('K','').replace('M','').replace('B',''))
  if (isNaN(f) || !event.forecast) return null
  const unit = event.forecast.includes('%') ? '%' : event.forecast.includes('K') ? 'K' : event.forecast.includes('M') ? 'M' : ''
  const variance = Math.abs(f) * 0.15 || 0.1
  return {
    min: (f - variance).toFixed(1) + unit,
    max: (f + variance).toFixed(1) + unit,
  }
}

function getScenario(title: string): EnrichedEvent['scenarios'] | undefined {
  for (const key of Object.keys(SCENARIO_MAP)) {
    if (title.toLowerCase().includes(key.toLowerCase())) return SCENARIO_MAP[key]
  }
  return undefined
}

function enrichEvent(e: FFEvent, idx: number): EnrichedEvent {
  const range = getForecastRange(e)
  return {
    ...e,
    id: `ev-${idx}`,
    flag: FLAG_MAP[e.country] || '🌐',
    impactLevel: IMPACT_MAP[e.impact] || 'low',
    forecastMin: range?.min,
    forecastMax: range?.max,
    scenarios: getScenario(e.title),
  }
}

// Fallback data si l'API échoue
const FALLBACK: FFEvent[] = [
  { title:'US CPI m/m', country:'USD', date: new Date().toISOString(), time:'08:30am', impact:'High Impact Expected', forecast:'0.3%', previous:'0.2%', actual:'' },
  { title:'US Core CPI m/m', country:'USD', date: new Date().toISOString(), time:'08:30am', impact:'High Impact Expected', forecast:'0.3%', previous:'0.3%', actual:'' },
  { title:'Initial Jobless Claims', country:'USD', date: new Date().toISOString(), time:'08:30am', impact:'Medium Impact Expected', forecast:'215K', previous:'222K', actual:'' },
  { title:'FOMC Meeting Minutes', country:'USD', date: new Date().toISOString(), time:'02:00pm', impact:'High Impact Expected', forecast:'', previous:'', actual:'' },
  { title:'Non-Farm Payrolls', country:'USD', date: new Date().toISOString(), time:'08:30am', impact:'High Impact Expected', forecast:'175K', previous:'151K', actual:'' },
  { title:'Unemployment Rate', country:'USD', date: new Date().toISOString(), time:'08:30am', impact:'High Impact Expected', forecast:'4.0%', previous:'4.1%', actual:'' },
  { title:'ECB Interest Rate Decision', country:'EUR', date: new Date().toISOString(), time:'08:15am', impact:'High Impact Expected', forecast:'4.00%', previous:'4.25%', actual:'' },
  { title:'UK CPI y/y', country:'GBP', date: new Date().toISOString(), time:'04:00am', impact:'High Impact Expected', forecast:'3.1%', previous:'3.4%', actual:'' },
]

const IMP_STYLE = {
  high: { bg:'rgba(239,68,68,.12)', color:'#ef4444', border:'rgba(239,68,68,.3)', dot:'#ef4444', glow:'0 0 6px rgba(239,68,68,.4)' },
  med:  { bg:'rgba(240,180,41,.1)',  color:'#f0b429', border:'rgba(240,180,41,.3)', dot:'#f0b429', glow:'0 0 6px rgba(240,180,41,.3)' },
  low:  { bg:'rgba(100,116,139,.1)', color:'#64748b', border:'rgba(100,116,139,.25)', dot:'#64748b', glow:'none' },
}

const DIR_STYLE: Record<Direction,{color:string;icon:string;bg:string}> = {
  bullish: { color:'#22c55e', icon:'▲', bg:'rgba(34,197,94,.1)' },
  bearish: { color:'#ef4444', icon:'▼', bg:'rgba(239,68,68,.1)' },
  neutral: { color:'#64748b', icon:'→', bg:'rgba(100,116,139,.1)' },
}

function Countdown({ events }: { events: EnrichedEvent[] }) {
  const [timeStr, setTimeStr] = useState('')
  const [nextEvent, setNextEvent] = useState('')

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const upcoming = events
        .filter(e => e.impactLevel === 'high' && !e.actual)
        .map(e => {
          try {
            const d = new Date(e.date)
            const [time, ampm] = e.time.split(/(?=[ap]m)/i)
            const [h, m] = time.split(':').map(Number)
            const hour = ampm?.toLowerCase() === 'pm' && h !== 12 ? h + 12 : (ampm?.toLowerCase() === 'am' && h === 12 ? 0 : h)
            d.setHours(hour, m || 0, 0, 0)
            return { event: e, ts: d.getTime() }
          } catch { return null }
        })
        .filter(Boolean)
        .filter(x => x!.ts > now.getTime())
        .sort((a, b) => a!.ts - b!.ts)[0]

      if (!upcoming) { setTimeStr('—'); setNextEvent('No high impact'); return }
      const diff = upcoming.ts - now.getTime()
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeStr(h > 0 ? `${h}h ${m.toString().padStart(2,'0')}m` : `${m}m ${s.toString().padStart(2,'0')}s`)
      setNextEvent(upcoming.event.title.length > 25 ? upcoming.event.title.slice(0,25)+'…' : upcoming.event.title)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [events])

  return (
    <div style={{display:'flex',alignItems:'center',gap:6,padding:'5px 10px',background:'rgba(240,180,41,.06)',border:'0.5px solid rgba(240,180,41,.2)',borderRadius:5,flexShrink:0}}>
      <span style={{width:5,height:5,borderRadius:'50%',background:'#f0b429',animation:'t-pulse 1s ease-in-out infinite',display:'inline-block'}}/>
      <span style={{fontSize:9,color:'#8a9db5'}}>Next HIGH:</span>
      <span style={{fontSize:11,fontWeight:700,color:'#f0b429',fontVariantNumeric:'tabular-nums',fontFamily:'IBM Plex Mono,monospace'}}>{timeStr}</span>
      <span style={{fontSize:9,color:'#5a7080',maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>→ {nextEvent}</span>
    </div>
  )
}

function ForecastBar({ forecast, min, max, actual, previous }: { forecast: string; min?: string; max?: string; actual?: string; previous?: string }) {
  if (!forecast || !min || !max) return null
  const fv = parseFloat(forecast)
  const minv = parseFloat(min)
  const maxv = parseFloat(max)
  const av = actual ? parseFloat(actual) : null
  const range = maxv - minv || 1
  const fPct = ((fv - minv) / range) * 100
  const aPct = av !== null ? ((av - minv) / range) * 100 : null
  const unit = forecast.replace(/[\d.-]/g,'').trim()

  return (
    <div style={{marginTop:10,padding:'10px 12px',background:'rgba(255,255,255,.02)',border:'0.5px solid rgba(255,255,255,.06)',borderRadius:6}}>
      <div style={{fontSize:9,fontWeight:600,color:'#5a7080',letterSpacing:'0.5px',marginBottom:8,textTransform:'uppercase'}}>Forecast Range</div>
      <div style={{position:'relative',height:6,background:'rgba(255,255,255,.06)',borderRadius:3,marginBottom:6}}>
        <div style={{position:'absolute',left:0,right:0,top:0,bottom:0,background:'linear-gradient(90deg,rgba(239,68,68,.2),rgba(240,180,41,.3),rgba(34,197,94,.2))',borderRadius:3}}/>
        {/* Forecast marker */}
        <div style={{position:'absolute',top:-3,width:2,height:12,background:'#f0b429',borderRadius:1,left:`${Math.max(0,Math.min(100,fPct))}%`,transform:'translateX(-50%)'}} title={`Forecast: ${forecast}`}/>
        {/* Actual marker */}
        {aPct !== null && <div style={{position:'absolute',top:-3,width:2,height:12,background:'#22c55e',borderRadius:1,left:`${Math.max(0,Math.min(100,aPct))}%`,transform:'translateX(-50%)'}} title={`Actual: ${actual}`}/>}
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:8,color:'#3d5060',letterSpacing:'0.3px'}}>LOW</div>
          <div style={{fontSize:10,fontWeight:600,color:'#ef4444',fontFamily:'IBM Plex Mono,monospace'}}>{min}</div>
        </div>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:8,color:'#3d5060',letterSpacing:'0.3px'}}>FORECAST</div>
          <div style={{fontSize:11,fontWeight:700,color:'#f0b429',fontFamily:'IBM Plex Mono,monospace'}}>{forecast}</div>
        </div>
        {actual && (
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:8,color:'#3d5060',letterSpacing:'0.3px'}}>ACTUAL</div>
            <div style={{fontSize:11,fontWeight:700,color:'#22c55e',fontFamily:'IBM Plex Mono,monospace'}}>{actual}</div>
          </div>
        )}
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:8,color:'#3d5060',letterSpacing:'0.3px'}}>HIGH</div>
          <div style={{fontSize:10,fontWeight:600,color:'#22c55e',fontFamily:'IBM Plex Mono,monospace'}}>{max}</div>
        </div>
      </div>
      {previous && (
        <div style={{marginTop:6,fontSize:9,color:'#3d5060'}}>Previous: <span style={{color:'#5a7080',fontFamily:'IBM Plex Mono,monospace'}}>{previous}</span></div>
      )}
    </div>
  )
}

function EventRow({ event, selected, onSelect }: { event: EnrichedEvent; selected: boolean; onSelect: () => void }) {
  const imp = IMP_STYLE[event.impactLevel]
  const hasActual = !!event.actual

  // Format time
  const timeStr = event.time?.replace('am','').replace('pm','').trim() || '—'

  return (
    <div>
      <div onClick={onSelect} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 12px',cursor:'pointer',borderBottom:'0.5px solid rgba(255,255,255,.03)',background:selected?'rgba(240,180,41,.04)':'transparent',borderLeft:selected?'2px solid #f0b429':'2px solid transparent',transition:'all 80ms'}}
        onMouseEnter={e=>{if(!selected)(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,.02)'}}
        onMouseLeave={e=>{if(!selected)(e.currentTarget as HTMLElement).style.background='transparent'}}>

        <span style={{width:6,height:6,borderRadius:'50%',background:imp.dot,display:'inline-block',flexShrink:0,boxShadow:imp.glow}}/>
        <span style={{fontSize:9,color:'#3d5060',width:36,flexShrink:0,fontFamily:'IBM Plex Mono,monospace'}}>{timeStr}</span>
        <span style={{fontSize:12,width:18,flexShrink:0}}>{event.flag}</span>
        <span style={{fontSize:9,fontWeight:600,color:'#5a7080',width:28,flexShrink:0}}>{event.country}</span>
        <span style={{fontSize:10,fontWeight:500,color:'#c8d6e5',flex:1,lineHeight:1.3}}>{event.title}</span>

        <div style={{display:'flex',gap:10,flexShrink:0,alignItems:'center'}}>
          {/* Forecast range mini */}
          {event.forecast && event.forecastMin && (
            <div style={{display:'flex',alignItems:'center',gap:3,fontSize:9,color:'#5a7080',fontFamily:'IBM Plex Mono,monospace'}}>
              <span style={{color:'#ef4444'}}>{event.forecastMin}</span>
              <span style={{color:'#3d5060'}}>│</span>
              <span style={{color:'#f0b429',fontWeight:700}}>{event.forecast}</span>
              <span style={{color:'#3d5060'}}>│</span>
              <span style={{color:'#22c55e'}}>{event.forecastMax}</span>
            </div>
          )}
          {!event.forecast && <span style={{fontSize:9,color:'#2d3f50',fontFamily:'IBM Plex Mono,monospace',width:80,textAlign:'center'}}>—</span>}

          <div style={{display:'flex',gap:6}}>
            <div style={{textAlign:'right',minWidth:28}}>
              <div style={{fontSize:7,color:'#2d3f50',letterSpacing:'0.3px'}}>PREV</div>
              <div style={{fontSize:9,color:'#5a7080',fontFamily:'IBM Plex Mono,monospace'}}>{event.previous||'—'}</div>
            </div>
            <div style={{textAlign:'right',minWidth:28}}>
              <div style={{fontSize:7,color:'#2d3f50',letterSpacing:'0.3px'}}>ACT</div>
              <div style={{fontSize:10,fontWeight:700,color:hasActual?'#22c55e':'#2d3f50',fontFamily:'IBM Plex Mono,monospace'}}>{event.actual||'—'}</div>
            </div>
          </div>
        </div>

        <span style={{fontSize:8,fontWeight:700,padding:'2px 5px',borderRadius:3,background:imp.bg,color:imp.color,border:`0.5px solid ${imp.border}`,letterSpacing:'0.3px',flexShrink:0,minWidth:28,textAlign:'center'}}>
          {event.impactLevel === 'high' ? 'H' : event.impactLevel === 'med' ? 'M' : 'L'}
        </span>
        <span style={{fontSize:9,color:'#3d5060',transform:selected?'rotate(180deg)':'none',transition:'transform 150ms',flexShrink:0}}>▾</span>
      </div>

      {selected && (
        <div style={{padding:'10px 14px 12px 24px',background:'rgba(0,0,0,.18)',borderBottom:'0.5px solid rgba(255,255,255,.05)'}}>
          <ForecastBar forecast={event.forecast} min={event.forecastMin} max={event.forecastMax} actual={event.actual} previous={event.previous} />

          {event.scenarios && (
            <div style={{marginTop:10}}>
              <div style={{fontSize:9,fontWeight:700,color:'#5a7080',letterSpacing:'0.5px',marginBottom:6,textTransform:'uppercase'}}>Trading Scenarios</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6}}>
                {(['bull','bear','base'] as const).map(k => {
                  const s = event.scenarios![k]
                  const colors = { bull:{bg:'rgba(34,197,94,.05)',border:'rgba(34,197,94,.2)',lbl:'🟢 BULLISH'}, bear:{bg:'rgba(239,68,68,.05)',border:'rgba(239,68,68,.2)',lbl:'🔴 BEARISH'}, base:{bg:'rgba(240,180,41,.05)',border:'rgba(240,180,41,.2)',lbl:'🟡 BASE'} }[k]
                  return (
                    <div key={k} style={{padding:8,borderRadius:5,background:colors.bg,border:`0.5px solid ${colors.border}`}}>
                      <div style={{fontSize:8,fontWeight:700,color:'#8a9db5',marginBottom:3,letterSpacing:'0.4px'}}>{colors.lbl}</div>
                      <div style={{fontSize:10,fontWeight:600,color:'#c8d6e5',marginBottom:3}}>{s.label}</div>
                      <div style={{fontSize:9,color:'#5a7080',marginBottom:6,lineHeight:1.4}}>{s.condition}</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:3}}>
                        {s.assets.map(a => (
                          <span key={a.name} style={{display:'inline-flex',alignItems:'center',gap:2,fontSize:9,fontWeight:600,padding:'2px 5px',borderRadius:3,background:DIR_STYLE[a.dir].bg,color:DIR_STYLE[a.dir].color,border:`0.5px solid ${DIR_STYLE[a.dir].color}33`}}>
                            {DIR_STYLE[a.dir].icon} {a.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Group events by day
function groupByDay(events: EnrichedEvent[]): Record<string, EnrichedEvent[]> {
  const groups: Record<string, EnrichedEvent[]> = {}
  events.forEach(e => {
    const d = new Date(e.date)
    const key = d.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' }).toUpperCase()
    if (!groups[key]) groups[key] = []
    groups[key].push(e)
  })
  return groups
}

export function CalendarPanel() {
  const [events, setEvents] = useState<EnrichedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string|null>(null)
  const [filterImpact, setFilterImpact] = useState<'all'|'high'|'med'|'low'>('all')
  const [lastUpdate, setLastUpdate] = useState('')

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/calendar')
      const json = await res.json()
      const raw: FFEvent[] = json.ok && json.data.length > 0 ? json.data : FALLBACK
      const enriched = raw.map(enrichEvent)
      setEvents(enriched)
      setLastUpdate(new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }))
    } catch {
      setEvents(FALLBACK.map(enrichEvent))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
    const id = setInterval(fetchEvents, 5 * 60 * 1000) // refresh every 5 min
    return () => clearInterval(id)
  }, [fetchEvents])

  const filtered = events.filter(e => filterImpact === 'all' || e.impactLevel === filterImpact)
  const grouped = groupByDay(filtered)
  const highCount = events.filter(e => e.impactLevel === 'high').length

  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',background:'var(--t-surface-base)',fontFamily:"'Inter',-apple-system,sans-serif"}}>

      {/* Header */}
      <div style={{padding:'8px 12px',borderBottom:'0.5px solid rgba(255,255,255,.06)',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8,gap:8,flexWrap:'wrap'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:10,fontWeight:700,letterSpacing:'0.8px',color:'#8a9db5',textTransform:'uppercase'}}>Economic Calendar</span>
            <span style={{fontSize:9,padding:'1px 5px',borderRadius:3,background:'rgba(239,68,68,.12)',color:'#ef4444',border:'0.5px solid rgba(239,68,68,.3)',fontWeight:700}}>{highCount} HIGH</span>
            {lastUpdate && <span style={{fontSize:9,color:'#2d3f50'}}>Updated {lastUpdate}</span>}
          </div>
          <Countdown events={events} />
        </div>

        {/* Impact filter */}
        <div style={{display:'flex',gap:3}}>
          {(['all','high','med','low'] as const).map(i => {
            const active = filterImpact === i
            const col = i==='high'?'#ef4444':i==='med'?'#f0b429':i==='low'?'#64748b':'#c8d6e5'
            const bg = i==='high'?'rgba(239,68,68,.12)':i==='med'?'rgba(240,180,41,.1)':i==='low'?'rgba(100,116,139,.1)':'rgba(255,255,255,.06)'
            return (
              <button key={i} onClick={()=>setFilterImpact(i)} style={{padding:'3px 8px',borderRadius:3,fontSize:9,fontWeight:600,letterSpacing:'0.4px',cursor:'pointer',border:`0.5px solid ${active?(i==='high'?'rgba(239,68,68,.4)':i==='med'?'rgba(240,180,41,.35)':i==='low'?'rgba(100,116,139,.3)':'rgba(255,255,255,.2)'):'rgba(255,255,255,.06)'}`,background:active?bg:'transparent',color:active?col:'#3d5060',transition:'all 100ms'}}>
                {i.toUpperCase()}
              </button>
            )
          })}
          <div style={{flex:1}}/>
          <button onClick={fetchEvents} style={{padding:'3px 8px',borderRadius:3,fontSize:9,cursor:'pointer',border:'0.5px solid rgba(255,255,255,.08)',background:'transparent',color:'#3d5060',transition:'all 100ms'}} onMouseEnter={e=>(e.currentTarget.style.color='#8a9db5')} onMouseLeave={e=>(e.currentTarget.style.color='#3d5060')}>
            ↻ Refresh
          </button>
        </div>

        {/* Column headers */}
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'4px 12px 0',paddingLeft:20,marginTop:4}}>
          <span style={{width:6,flexShrink:0}}/>
          <span style={{fontSize:7,color:'#2d3f50',width:36,letterSpacing:'0.4px'}}>TIME ET</span>
          <span style={{width:18,flexShrink:0}}/>
          <span style={{width:28,flexShrink:0}}/>
          <span style={{fontSize:7,color:'#2d3f50',flex:1,letterSpacing:'0.4px'}}>EVENT</span>
          <span style={{fontSize:7,color:'#ef4444',letterSpacing:'0.3px',marginRight:4}}>LOW</span>
          <span style={{fontSize:7,color:'#2d3f50',letterSpacing:'0.3px'}}>│</span>
          <span style={{fontSize:7,color:'#f0b429',fontWeight:700,letterSpacing:'0.3px'}}>FORE</span>
          <span style={{fontSize:7,color:'#2d3f50',letterSpacing:'0.3px'}}>│</span>
          <span style={{fontSize:7,color:'#22c55e',letterSpacing:'0.3px',marginRight:8}}>HIGH</span>
          <span style={{fontSize:7,color:'#2d3f50',width:28,textAlign:'right',letterSpacing:'0.3px'}}>PREV</span>
          <span style={{fontSize:7,color:'#2d3f50',width:28,textAlign:'right',letterSpacing:'0.3px',marginLeft:6}}>ACT</span>
          <span style={{width:28,flexShrink:0}}/>
          <span style={{width:12,flexShrink:0}}/>
        </div>
      </div>

      {/* Events */}
      <div style={{flex:1,overflowY:'auto'}}>
        {loading ? (
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:200,gap:8}}>
            <span style={{width:12,height:12,borderRadius:'50%',border:'2px solid rgba(240,180,41,.3)',borderTopColor:'#f0b429',animation:'t-spin .7s linear infinite',display:'inline-block'}}/>
            <span style={{fontSize:11,color:'#3d5060'}}>Loading calendar data…</span>
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:200}}>
            <span style={{fontSize:11,color:'#3d5060'}}>No events for selected filter</span>
          </div>
        ) : (
          Object.entries(grouped).map(([day, dayEvents]) => (
            <div key={day}>
              <div style={{display:'flex',alignItems:'center',gap:8,padding:'5px 12px',background:'rgba(255,255,255,.015)',borderBottom:'0.5px solid rgba(255,255,255,.04)',borderTop:'0.5px solid rgba(255,255,255,.04)',position:'sticky',top:0,zIndex:2}}>
                <span style={{fontSize:9,fontWeight:700,color:'#f0b429',letterSpacing:'0.6px'}}>{day}</span>
                <div style={{flex:1,height:'0.5px',background:'rgba(255,255,255,.04)'}}/>
                {dayEvents.some(e=>e.impactLevel==='high') && <span style={{fontSize:8,color:'#ef4444',fontWeight:700}}>● HIGH IMPACT</span>}
                <span style={{fontSize:8,color:'#3d5060'}}>{dayEvents.length} events</span>
              </div>
              {dayEvents.map(event => (
                <EventRow key={event.id} event={event} selected={selectedId===event.id} onSelect={()=>setSelectedId(selectedId===event.id?null:event.id)}/>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{padding:'5px 12px',borderTop:'0.5px solid rgba(255,255,255,.04)',display:'flex',justifyContent:'space-between',flexShrink:0}}>
        <span style={{fontSize:9,color:'#2d3f50'}}>Source: Forex Factory • Refresh auto toutes les 5 min</span>
        <span style={{fontSize:9,color:'#2d3f50'}}>Cliquez sur un event pour les scénarios</span>
      </div>
    </div>
  )
}
