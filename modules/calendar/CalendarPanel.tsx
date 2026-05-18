'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────
type ImpactLevel = 'high' | 'med' | 'low'
type Direction   = 'bullish' | 'bearish' | 'neutral'

interface RawFFEvent {
  title: string; country: string; date: string; time: string
  impact: string; forecast: string; previous: string; actual: string
}

interface CalEvent extends RawFFEvent {
  id: string; flag: string; impactLevel: ImpactLevel
  forecastLow?: string; forecastMid?: string; forecastHigh?: string
  whisper?: string; description?: string
  scenarios?: Record<'bull'|'bear'|'base', { label:string; condition:string; assets:{name:string;dir:Direction}[] }>
}

// ── Constants ─────────────────────────────────────────────────────────────────
const FLAGS: Record<string,string> = { USD:'🇺🇸',EUR:'🇪🇺',GBP:'🇬🇧',JPY:'🇯🇵',CAD:'🇨🇦',AUD:'🇦🇺',NZD:'🇳🇿',CHF:'🇨🇭',CNY:'🇨🇳',SEK:'🇸🇪',NOK:'🇳🇴',DKK:'🇩🇰',SGD:'🇸🇬',HKD:'🇭🇰',KRW:'🇰🇷',MXN:'🇲🇽',BRL:'🇧🇷',INR:'🇮🇳',ZAR:'🇿🇦',TRY:'🇹🇷',PLN:'🇵🇱',CZK:'🇨🇿',HUF:'🇭🇺',RUB:'🇷🇺',All:'🌐' }
const IMPACT_MAP: Record<string,ImpactLevel> = { 'High Impact Expected':'high','Medium Impact Expected':'med','Low Impact Expected':'low','Non-Economic':'low' }
const I = { high:{bg:'rgba(239,68,68,.12)',c:'#ef4444',b:'rgba(239,68,68,.3)',d:'#ef4444',g:'0 0 6px rgba(239,68,68,.5)'}, med:{bg:'rgba(240,180,41,.1)',c:'#f0b429',b:'rgba(240,180,41,.3)',d:'#f0b429',g:'0 0 5px rgba(240,180,41,.4)'}, low:{bg:'rgba(100,116,139,.1)',c:'#64748b',b:'rgba(100,116,139,.2)',d:'#374151',g:'none'} }
const D: Record<Direction,{c:string;i:string;bg:string}> = { bullish:{c:'#22c55e',i:'▲',bg:'rgba(34,197,94,.1)'}, bearish:{c:'#ef4444',i:'▼',bg:'rgba(239,68,68,.1)'}, neutral:{c:'#64748b',i:'→',bg:'rgba(100,116,139,.1)'} }

// ── Scenarios DB ──────────────────────────────────────────────────────────────
const SCENARIOS: Record<string, CalEvent['scenarios']> = {
  CPI: { bull:{label:'Print chaud',condition:'CPI > forecast → Fed hawkish, moins de cuts',assets:[{name:'DXY',dir:'bullish'},{name:'USD/JPY',dir:'bullish'},{name:'EUR/USD',dir:'bearish'},{name:'Gold',dir:'bearish'},{name:'Bonds',dir:'bearish'}]}, bear:{label:'Print froid',condition:'CPI < forecast → cuts anticipés, USD vendu',assets:[{name:'DXY',dir:'bearish'},{name:'EUR/USD',dir:'bullish'},{name:'Gold',dir:'bullish'},{name:'S&P500',dir:'bullish'},{name:'Bonds',dir:'bullish'}]}, base:{label:'In-line',condition:'Pas de surprise, mouvement limité',assets:[{name:'DXY',dir:'neutral'},{name:'EUR/USD',dir:'neutral'}]} },
  NFP: { bull:{label:'Beat > +30K',condition:'Marché travail fort → Fed hawkish, no cut soon',assets:[{name:'DXY',dir:'bullish'},{name:'USD/JPY',dir:'bullish'},{name:'EUR/USD',dir:'bearish'},{name:'Gold',dir:'bearish'},{name:'S&P500',dir:'bearish'}]}, bear:{label:'Miss > -30K',condition:'Ralentissement → cuts repriced, récession fear',assets:[{name:'DXY',dir:'bearish'},{name:'EUR/USD',dir:'bullish'},{name:'Gold',dir:'bullish'},{name:'S&P500',dir:'bullish'}]}, base:{label:'In-line',condition:'Pas de repricing Fed, vol limitée',assets:[{name:'DXY',dir:'neutral'},{name:'EUR/USD',dir:'neutral'}]} },
  FOMC: { bull:{label:'Dovish surprise',condition:'"Several" membres veulent couper → USD vendu',assets:[{name:'EUR/USD',dir:'bullish'},{name:'GBP/USD',dir:'bullish'},{name:'Gold',dir:'bullish'},{name:'DXY',dir:'bearish'},{name:'S&P500',dir:'bullish'}]}, bear:{label:'Très hawkish',condition:'Cuts repoussés 2026 → USD fort, risk-off',assets:[{name:'DXY',dir:'bullish'},{name:'USD/JPY',dir:'bullish'},{name:'EUR/USD',dir:'bearish'},{name:'Gold',dir:'bearish'}]}, base:{label:'Data-dependent',condition:'Ton neutre, pas de surprise claire',assets:[{name:'DXY',dir:'neutral'},{name:'EUR/USD',dir:'neutral'}]} },
  'Interest Rate': { bull:{label:'Hawkish / Hike',condition:'Taux augmentés ou signal hawkish → devise bid',assets:[{name:'EUR/USD',dir:'bullish'},{name:'GBP/USD',dir:'bullish'},{name:'DXY',dir:'neutral'}]}, bear:{label:'Dovish / Cut',condition:'Taux baissés ou signal dovish → devise sold',assets:[{name:'EUR/USD',dir:'bearish'},{name:'GBP/USD',dir:'bearish'}]}, base:{label:'On hold',condition:'Status quo, guidance key',assets:[{name:'EUR/USD',dir:'neutral'}]} },
  GDP: { bull:{label:'Beat',condition:'Croissance forte → devise bid, risk-on',assets:[{name:'DXY',dir:'bullish'},{name:'USD/JPY',dir:'bullish'},{name:'Gold',dir:'bearish'}]}, bear:{label:'Miss / Négatif',condition:'Récession risk → devise vendue',assets:[{name:'DXY',dir:'bearish'},{name:'Gold',dir:'bullish'},{name:'JPY',dir:'bullish'}]}, base:{label:'In-line',condition:'Pas de surprise',assets:[{name:'DXY',dir:'neutral'}]} },
  PMI: { bull:{label:'> 52',condition:'Expansion forte → risk-on, devise bid',assets:[{name:'EUR/USD',dir:'bullish'},{name:'GBP/USD',dir:'bullish'},{name:'Gold',dir:'bearish'}]}, bear:{label:'< 48',condition:'Contraction → récession fear',assets:[{name:'EUR/USD',dir:'bearish'},{name:'Gold',dir:'bullish'}]}, base:{label:'50-52',condition:'Expansion modérée',assets:[{name:'EUR/USD',dir:'neutral'}]} },
  'Retail Sales': { bull:{label:'Beat',condition:'Consommation forte → USD/devise bid',assets:[{name:'DXY',dir:'bullish'},{name:'EUR/USD',dir:'bearish'}]}, bear:{label:'Miss',condition:'Consommation faible → récession signal',assets:[{name:'DXY',dir:'bearish'},{name:'Gold',dir:'bullish'}]}, base:{label:'In-line',condition:'Neutre',assets:[{name:'DXY',dir:'neutral'}]} },
}

function getScenario(title: string): CalEvent['scenarios'] | undefined {
  for (const [k,v] of Object.entries(SCENARIOS)) {
    if (title.toLowerCase().includes(k.toLowerCase())) return v
  }
  return undefined
}

function getWhisper(title: string, forecast: string): string | undefined {
  const t = title.toLowerCase()
  if (t.includes('nfp') || t.includes('non-farm')) return `Whisper: ${forecast ? (parseInt(forecast)+20)+'K' : '185K'} — USD vulnérable si miss`
  if (t.includes('cpi')) return `Whisper consensus banques: légèrement au-dessus du forecast officiel`
  if (t.includes('fomc') || t.includes('fed')) return `Surveiller: "several" vs "some" pour calibrer le ton`
  if (t.includes('ecb') || t.includes('boe') || t.includes('boj')) return `Forward guidance post-décision = driver principal`
  return undefined
}

function computeForecastRange(forecast: string): {low:string;mid:string;high:string} | null {
  if (!forecast) return null
  const raw = forecast.replace('%','').replace('K','').replace('M','').replace('B','').replace('T','').trim()
  const val = parseFloat(raw)
  if (isNaN(val)) return null
  const unit = forecast.replace(/[\d.-]/g,'').trim()
  const v = Math.abs(val)
  const delta = v > 100 ? v*0.08 : v > 10 ? v*0.12 : v > 1 ? v*0.15 : 0.1
  const fmt = (n: number) => (Math.round(n*100)/100).toString() + unit
  return { low: fmt(val - delta), mid: forecast, high: fmt(val + delta) }
}

function enrichEvent(e: RawFFEvent, idx: number): CalEvent {
  const range = computeForecastRange(e.forecast)
  return {
    ...e,
    id: `ev-${idx}-${e.title.slice(0,8)}`,
    flag: FLAGS[e.country] || '🌐',
    impactLevel: IMPACT_MAP[e.impact] || 'low',
    forecastLow:  range?.low,
    forecastMid:  range?.mid,
    forecastHigh: range?.high,
    whisper: getWhisper(e.title, e.forecast),
    scenarios: getScenario(e.title),
  }
}

// ── Fallback static data ───────────────────────────────────────────────────────
const FALLBACK: RawFFEvent[] = [
  {title:'NAHB Housing Market Index',country:'USD',date:new Date().toISOString(),time:'10:00am',impact:'Medium Impact Expected',forecast:'40',previous:'40',actual:''},
  {title:'US CPI m/m',country:'USD',date:new Date(Date.now()+86400000).toISOString(),time:'08:30am',impact:'High Impact Expected',forecast:'0.3%',previous:'0.2%',actual:''},
  {title:'US Core CPI m/m',country:'USD',date:new Date(Date.now()+86400000).toISOString(),time:'08:30am',impact:'High Impact Expected',forecast:'0.3%',previous:'0.3%',actual:''},
  {title:'UK CPI y/y',country:'GBP',date:new Date(Date.now()+86400000).toISOString(),time:'04:00am',impact:'High Impact Expected',forecast:'3.1%',previous:'3.4%',actual:''},
  {title:'ECB Interest Rate Decision',country:'EUR',date:new Date(Date.now()+172800000).toISOString(),time:'08:15am',impact:'High Impact Expected',forecast:'4.00%',previous:'4.25%',actual:''},
  {title:'ECB Press Conference',country:'EUR',date:new Date(Date.now()+172800000).toISOString(),time:'08:45am',impact:'High Impact Expected',forecast:'',previous:'',actual:''},
  {title:'Initial Jobless Claims',country:'USD',date:new Date(Date.now()+172800000).toISOString(),time:'08:30am',impact:'Medium Impact Expected',forecast:'215K',previous:'222K',actual:''},
  {title:'FOMC Meeting Minutes',country:'USD',date:new Date(Date.now()+172800000).toISOString(),time:'02:00pm',impact:'High Impact Expected',forecast:'',previous:'',actual:''},
  {title:'Non-Farm Payrolls',country:'USD',date:new Date(Date.now()+259200000).toISOString(),time:'08:30am',impact:'High Impact Expected',forecast:'175K',previous:'151K',actual:''},
  {title:'Unemployment Rate',country:'USD',date:new Date(Date.now()+259200000).toISOString(),time:'08:30am',impact:'High Impact Expected',forecast:'4.0%',previous:'4.1%',actual:''},
  {title:'Average Hourly Earnings m/m',country:'USD',date:new Date(Date.now()+259200000).toISOString(),time:'08:30am',impact:'High Impact Expected',forecast:'0.3%',previous:'0.3%',actual:''},
  {title:'Canada Employment Change',country:'CAD',date:new Date(Date.now()+259200000).toISOString(),time:'08:30am',impact:'High Impact Expected',forecast:'20K',previous:'32K',actual:''},
  {title:'Michigan Consumer Sentiment',country:'USD',date:new Date(Date.now()+259200000).toISOString(),time:'10:00am',impact:'Medium Impact Expected',forecast:'59.0',previous:'57.0',actual:''},
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseEventTime(e: CalEvent): Date | null {
  try {
    const base = new Date(e.date)
    const t = e.time?.toLowerCase().replace(' ','') || ''
    const isPM = t.includes('pm')
    const isAM = t.includes('am')
    const clean = t.replace('am','').replace('pm','').trim()
    const [hStr, mStr] = clean.split(':')
    let h = parseInt(hStr) || 0
    const m = parseInt(mStr) || 0
    if (isPM && h !== 12) h += 12
    if (isAM && h === 12) h = 0
    base.setHours(h, m, 0, 0)
    return base
  } catch { return null }
}

function groupByDay(events: CalEvent[]): [string, CalEvent[]][] {
  const map = new Map<string, CalEvent[]>()
  events.forEach(e => {
    const d = new Date(e.date)
    const key = d.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' }).toUpperCase()
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(e)
  })
  return Array.from(map.entries())
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{padding:'8px 12px',borderBottom:'0.5px solid rgba(255,255,255,.04)'}}>
      {[1,2,3,4,5].map(i => (
        <div key={i} style={{display:'flex',gap:8,alignItems:'center',padding:'7px 0',borderBottom:'0.5px solid rgba(255,255,255,.03)'}}>
          <div style={{width:6,height:6,borderRadius:'50%',background:'rgba(255,255,255,.06)',flexShrink:0}}/>
          <div style={{width:32,height:8,borderRadius:2,background:'rgba(255,255,255,.05)'}}/>
          <div style={{width:16,height:16,borderRadius:2,background:'rgba(255,255,255,.05)'}}/>
          <div style={{width:24,height:8,borderRadius:2,background:'rgba(255,255,255,.05)'}}/>
          <div style={{flex:1,height:8,borderRadius:2,background:'rgba(255,255,255,.06)',maxWidth:200}}/>
          <div style={{width:80,height:8,borderRadius:2,background:'rgba(255,255,255,.04)'}}/>
          <div style={{width:24,height:14,borderRadius:2,background:'rgba(255,255,255,.05)'}}/>
        </div>
      ))}
    </div>
  )
}

function Countdown({ events }: { events: CalEvent[] }) {
  const [display, setDisplay] = useState({ time:'—', name:'', urgent:false })

  useEffect(() => {
    const tick = () => {
      const now = Date.now()
      const next = events
        .filter(e => e.impactLevel==='high' && !e.actual)
        .map(e => ({ e, ts: parseEventTime(e)?.getTime() || 0 }))
        .filter(x => x.ts > now)
        .sort((a,b) => a.ts-b.ts)[0]

      if (!next) { setDisplay({ time:'—', name:'No upcoming high impact', urgent:false }); return }
      const diff = next.ts - now
      const h = Math.floor(diff/3600000)
      const m = Math.floor((diff%3600000)/60000)
      const s = Math.floor((diff%60000)/1000)
      const urgent = diff < 3600000
      setDisplay({
        time: h > 0 ? `${h}h ${m.toString().padStart(2,'0')}m` : `${m}m ${s.toString().padStart(2,'0')}s`,
        name: next.e.title.length > 28 ? next.e.title.slice(0,28)+'…' : next.e.title,
        urgent,
      })
    }
    tick(); const id = setInterval(tick,1000); return ()=>clearInterval(id)
  }, [events])

  return (
    <div style={{display:'flex',alignItems:'center',gap:6,padding:'5px 10px',background:display.urgent?'rgba(239,68,68,.08)':'rgba(240,180,41,.05)',border:`0.5px solid ${display.urgent?'rgba(239,68,68,.25)':'rgba(240,180,41,.2)'}`,borderRadius:5,flexShrink:0}}>
      <span style={{width:5,height:5,borderRadius:'50%',background:display.urgent?'#ef4444':'#f0b429',animation:'t-pulse 1s ease-in-out infinite',display:'inline-block'}}/>
      <span style={{fontSize:9,color:'#8a9db5'}}>Next HIGH:</span>
      <span style={{fontSize:11,fontWeight:700,color:display.urgent?'#ef4444':'#f0b429',fontVariantNumeric:'tabular-nums',fontFamily:'IBM Plex Mono,monospace'}}>{display.time}</span>
      {display.name && <span style={{fontSize:9,color:'#5a7080',maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>→ {display.name}</span>}
    </div>
  )
}

function ForecastBar({ low, mid, high, actual, previous }: { low?:string; mid?:string; high?:string; actual?:string; previous?:string }) {
  if (!low || !mid || !high) return null
  const lv = parseFloat(low), mv = parseFloat(mid), hv = parseFloat(high), av = actual ? parseFloat(actual) : null
  const range = hv - lv || 1
  const mp = ((mv-lv)/range)*100
  const ap = av !== null ? Math.max(0,Math.min(100,((av-lv)/range)*100)) : null

  return (
    <div style={{padding:'10px 12px',background:'rgba(255,255,255,.02)',border:'0.5px solid rgba(255,255,255,.06)',borderRadius:6,marginTop:8}}>
      <div style={{fontSize:9,fontWeight:700,color:'#5a7080',letterSpacing:'0.6px',marginBottom:8,textTransform:'uppercase'}}>📊 Forecast Range</div>
      <div style={{position:'relative',height:8,background:'rgba(255,255,255,.06)',borderRadius:4,marginBottom:8}}>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(90deg,rgba(239,68,68,.25),rgba(240,180,41,.35),rgba(34,197,94,.25))',borderRadius:4}}/>
        <div style={{position:'absolute',top:-4,width:3,height:16,background:'#f0b429',borderRadius:2,left:`${Math.max(0,Math.min(97,mp))}%`,transform:'translateX(-50%)',boxShadow:'0 0 4px rgba(240,180,41,.6)'}} title={`Forecast: ${mid}`}/>
        {ap !== null && <div style={{position:'absolute',top:-4,width:3,height:16,background:'#22c55e',borderRadius:2,left:`${ap}%`,transform:'translateX(-50%)',boxShadow:'0 0 4px rgba(34,197,94,.6)'}} title={`Actual: ${actual}`}/>}
      </div>
      <div style={{display:'grid',gridTemplateColumns:actual?'1fr 1fr 1fr 1fr':'1fr 1fr 1fr',gap:6}}>
        {([['LOW',low,'#ef4444'],['FORE',mid,'#f0b429'],actual?['ACTUAL',actual,'#22c55e']:null,['HIGH',high,'#22c55e']] as (string[]|null)[]).filter((x): x is string[] => x !== null).map(([l,v,c])=>(
          <div key={l as string} style={{textAlign:'center',padding:'5px 6px',background:'rgba(255,255,255,.02)',borderRadius:4,border:'0.5px solid rgba(255,255,255,.04)'}}>
            <div style={{fontSize:8,color:'#3d5060',letterSpacing:'0.4px',marginBottom:2}}>{l}</div>
            <div style={{fontSize:11,fontWeight:700,color:c as string,fontFamily:'IBM Plex Mono,monospace'}}>{v}</div>
          </div>
        ))}
      </div>
      {previous && <div style={{marginTop:6,fontSize:9,color:'#3d5060'}}>Previous: <span style={{color:'#5a7080',fontFamily:'IBM Plex Mono,monospace',fontWeight:600}}>{previous}</span></div>}
    </div>
  )
}

function ScenarioBlock({ s }: { s: NonNullable<CalEvent['scenarios']> }) {
  return (
    <div style={{marginTop:10}}>
      <div style={{fontSize:9,fontWeight:700,color:'#5a7080',letterSpacing:'0.6px',marginBottom:6,textTransform:'uppercase'}}>🎯 Trading Scenarios</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6}}>
        {(['bull','bear','base'] as const).map(k => {
          const scenario = s[k]
          const cfg = { bull:{bg:'rgba(34,197,94,.05)',b:'rgba(34,197,94,.2)',lbl:'🟢 BULLISH'}, bear:{bg:'rgba(239,68,68,.05)',b:'rgba(239,68,68,.2)',lbl:'🔴 BEARISH'}, base:{bg:'rgba(240,180,41,.05)',b:'rgba(240,180,41,.2)',lbl:'🟡 BASE'} }[k]
          return (
            <div key={k} style={{padding:8,borderRadius:5,background:cfg.bg,border:`0.5px solid ${cfg.b}`}}>
              <div style={{fontSize:8,fontWeight:700,color:'#8a9db5',marginBottom:3,letterSpacing:'0.4px'}}>{cfg.lbl}</div>
              <div style={{fontSize:10,fontWeight:600,color:'#c8d6e5',marginBottom:3,lineHeight:1.3}}>{scenario.label}</div>
              <div style={{fontSize:9,color:'#5a7080',marginBottom:6,lineHeight:1.5}}>{scenario.condition}</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:3}}>
                {scenario.assets.map(a=>(
                  <span key={a.name} style={{display:'inline-flex',alignItems:'center',gap:2,fontSize:9,fontWeight:600,padding:'2px 5px',borderRadius:3,background:D[a.dir].bg,color:D[a.dir].c,border:`0.5px solid ${D[a.dir].c}33`}}>
                    {D[a.dir].i} {a.name}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EventRow({ event, selected, onSelect }: { event:CalEvent; selected:boolean; onSelect:()=>void }) {
  const imp = I[event.impactLevel]
  const hasActual = !!event.actual
  const timeLabel = event.time?.replace(/\s/g,'').replace('am','').replace('pm','') || '—'
  const isSoon = (() => {
    const ts = parseEventTime(event)?.getTime()
    if (!ts || hasActual) return false
    return ts - Date.now() < 3600000 && ts > Date.now()
  })()

  return (
    <div style={{borderBottom:'0.5px solid rgba(255,255,255,.03)'}}>
      <div
        onClick={onSelect}
        style={{display:'flex',alignItems:'center',gap:8,padding:'7px 14px',cursor:'pointer',background:selected?'rgba(240,180,41,.04)':isSoon?'rgba(239,68,68,.02)':'transparent',borderLeft:selected?'2px solid #f0b429':isSoon?'2px solid rgba(239,68,68,.4)':'2px solid transparent',transition:'background 80ms'}}
        onMouseEnter={e=>{if(!selected)(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,.02)'}}
        onMouseLeave={e=>{if(!selected)(e.currentTarget as HTMLElement).style.background=isSoon?'rgba(239,68,68,.02)':'transparent'}}>

        {/* Stars */}
        <span style={{fontSize:10,letterSpacing:1,width:32,flexShrink:0,color:event.impactLevel==='high'?'#ef4444':event.impactLevel==='med'?'#f0b429':'#374151'}}>{event.impactLevel==='high'?'★★★':event.impactLevel==='med'?'★★☆':'★☆☆'}</span>

        {/* Time */}
        <span style={{fontSize:10,color:isSoon?'#f0b429':'#8a9db5',width:44,flexShrink:0,fontFamily:'IBM Plex Mono,monospace',fontWeight:isSoon?700:500}}>{event.time?.toLowerCase().replace(' ','') || '—'}</span>

        {/* Flag */}
        <span style={{fontSize:13,width:20,flexShrink:0,lineHeight:1}}>{event.flag}</span>

        {/* Country */}
        <span style={{fontSize:9,fontWeight:600,color:'#4a5e72',width:30,flexShrink:0}}>{event.country}</span>

        {/* Title */}
        <span style={{fontSize:11,fontWeight:500,color:isSoon?'#e2e8f0':'#c8d6e5',flex:1,lineHeight:1.3}}>
          {event.title}
          {isSoon && <span style={{marginLeft:6,fontSize:8,fontWeight:700,color:'#ef4444',letterSpacing:'0.4px',animation:'t-pulse 1s ease-in-out infinite'}}>SOON</span>}
        </span>

        {/* Forecast range inline */}
        {event.forecastLow && event.forecastMid && event.forecastHigh ? (
          <div style={{display:'flex',alignItems:'center',gap:3,fontSize:9,fontFamily:'IBM Plex Mono,monospace',flexShrink:0}}>
            <span style={{color:'#ef4444'}}>{event.forecastLow}</span>
            <span style={{color:'#2d3f50',fontSize:8}}>│</span>
            <span style={{color:'#f0b429',fontWeight:700,fontSize:10}}>{event.forecastMid}</span>
            <span style={{color:'#2d3f50',fontSize:8}}>│</span>
            <span style={{color:'#22c55e'}}>{event.forecastHigh}</span>
          </div>
        ) : (
          <span style={{width:100,fontSize:9,color:'#2d3f50',textAlign:'center',fontFamily:'IBM Plex Mono,monospace'}}>—</span>
        )}

        {/* Prev / Act */}
        <div style={{display:'flex',gap:8,flexShrink:0,marginLeft:4}}>
          <div style={{textAlign:'right',minWidth:32}}>
            <div style={{fontSize:7,color:'#2d3f50',letterSpacing:'0.3px'}}>PREV</div>
            <div style={{fontSize:10,color:'#5a7080',fontFamily:'IBM Plex Mono,monospace'}}>{event.previous||'—'}</div>
          </div>
          <div style={{textAlign:'right',minWidth:32}}>
            <div style={{fontSize:7,color:'#2d3f50',letterSpacing:'0.3px'}}>ACT</div>
            <div style={{fontSize:10,fontWeight:700,color:hasActual?'#22c55e':'#2d3f50',fontFamily:'IBM Plex Mono,monospace'}}>{event.actual||'—'}</div>
          </div>
        </div>

        {/* Impact badge */}
        <span style={{fontSize:8,fontWeight:700,padding:'2px 6px',borderRadius:3,background:imp.bg,color:imp.c,border:`0.5px solid ${imp.b}`,letterSpacing:'0.3px',flexShrink:0,minWidth:26,textAlign:'center'}}>
          {event.impactLevel==='high'?'HIGH':event.impactLevel==='med'?'MED':'LOW'}
        </span>

        <span style={{fontSize:9,color:'#3d5060',transform:selected?'rotate(180deg)':'none',transition:'transform 150ms',flexShrink:0}}>▾</span>
      </div>

      {/* Expanded */}
      {selected && (
        <div style={{padding:'12px 16px 14px 28px',background:'rgba(0,0,0,.2)',borderBottom:'0.5px solid rgba(255,255,255,.04)'}}>
          {event.whisper && (
            <div style={{display:'flex',alignItems:'flex-start',gap:6,marginBottom:8,padding:'6px 10px',background:'rgba(240,180,41,.06)',border:'0.5px solid rgba(240,180,41,.15)',borderRadius:5}}>
              <span style={{fontSize:11,flexShrink:0}}>💬</span>
              <div>
                <span style={{fontSize:9,fontWeight:700,color:'#f0b429',letterSpacing:'0.3px'}}>DESK NOTE  </span>
                <span style={{fontSize:10,color:'#c8d6e5'}}>{event.whisper}</span>
              </div>
            </div>
          )}
          <ForecastBar low={event.forecastLow} mid={event.forecastMid} high={event.forecastHigh} actual={event.actual} previous={event.previous}/>
          {event.scenarios && <ScenarioBlock s={event.scenarios}/>}
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function CalendarPanel() {
  const [events, setEvents]           = useState<CalEvent[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(false)
  const [selectedId, setSelectedId]   = useState<string|null>(null)
  const [impact, setImpact]           = useState<'all'|ImpactLevel>('all')
  const [currency, setCurrency]       = useState('ALL')
  const [search, setSearch]           = useState('')
  const [range, setRange]             = useState<'today'|'week'>('week')
  const [lastUpdate, setLastUpdate]   = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval>|null>(null)

  const CURRENCIES = ['ALL','USD','EUR','GBP','JPY','CAD','AUD','NZD','CHF','CNY']

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/calendar', { cache:'no-store' })
      const json = await res.json()
      const raw: RawFFEvent[] = json.ok && json.data?.length > 0 ? json.data : FALLBACK
      setEvents(raw.map(enrichEvent))
      setLastUpdate(new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}))
      setError(false)
    } catch {
      setEvents(FALLBACK.map(enrichEvent))
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    intervalRef.current = setInterval(fetchData, 5*60*1000)
    return () => { if(intervalRef.current) clearInterval(intervalRef.current) }
  }, [fetchData])

  const filtered = events.filter(e => {
    if (impact !== 'all' && e.impactLevel !== impact) return false
    if (currency !== 'ALL' && e.country !== currency) return false
    if (search && !e.title.toLowerCase().includes(search.toLowerCase()) && !e.country.toLowerCase().includes(search.toLowerCase())) return false
    if (range === 'today') {
      const today = new Date(); const evDate = new Date(e.date)
      if (evDate.toDateString() !== today.toDateString()) return false
    }
    return true
  })

  const highCount = events.filter(e=>e.impactLevel==='high').length
  const grouped = groupByDay(filtered)

  const btnStyle = (active: boolean, color?: string) => ({
    padding:'3px 8px', borderRadius:3, fontSize:9, fontWeight:600 as const, letterSpacing:'0.4px', cursor:'pointer' as const,
    border:`0.5px solid ${active?(color||'rgba(240,180,41,.35)'):'rgba(255,255,255,.06)'}`,
    background:active?(color?color.replace('rgba(','rgba(').replace(',.',',0.').replace(/,[\d.]+\)$/,',0.12)'):'rgba(240,180,41,.1)'):'transparent',
    color:active?(color?color:'#f0b429'):'#3d5060', transition:'all 100ms',
  })

  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',background:'var(--t-surface-base)',fontFamily:"'Inter',-apple-system,sans-serif",overflow:'hidden'}}>

      {/* ── Header ── */}
      <div style={{padding:'10px 14px 8px',borderBottom:'0.5px solid rgba(255,255,255,.06)',flexShrink:0}}>

        {/* Row 1: title + countdown */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8,gap:8}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:11,fontWeight:700,letterSpacing:'0.8px',color:'#8a9db5',textTransform:'uppercase'}}>Economic Calendar</span>
            <span style={{fontSize:9,padding:'2px 6px',borderRadius:3,background:'rgba(239,68,68,.12)',color:'#ef4444',border:'0.5px solid rgba(239,68,68,.3)',fontWeight:700}}>{highCount} HIGH IMPACT</span>
            {lastUpdate && <span style={{fontSize:9,color:'#2d3f50'}}>Updated {lastUpdate}</span>}
            {error && <span style={{fontSize:9,color:'#f0b429'}}>⚠ Using cached data</span>}
          </div>
          <Countdown events={events}/>
        </div>

        {/* Row 2: range + search */}
        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
          {(['today','week'] as const).map(r=>(
            <button key={r} onClick={()=>setRange(r)} style={btnStyle(range===r)}>
              {r==='today'?'TODAY':'THIS WEEK'}
            </button>
          ))}
          <div style={{flex:1}}/>
          <div style={{position:'relative',display:'flex',alignItems:'center'}}>
            <svg style={{position:'absolute',left:7,pointerEvents:'none'}} width="10" height="10" viewBox="0 0 12 12" fill="none"><circle cx="5.5" cy="5.5" r="3.8" stroke="#3d5060" strokeWidth="1.2"/><line x1="8.5" y1="8.5" x2="11" y2="11" stroke="#3d5060" strokeWidth="1.2" strokeLinecap="round"/></svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search events…" style={{paddingLeft:22,paddingRight:8,paddingTop:4,paddingBottom:4,borderRadius:4,background:'rgba(255,255,255,.04)',border:'0.5px solid rgba(255,255,255,.08)',color:'#c8d6e5',fontSize:10,outline:'none',width:140,fontFamily:'inherit'}} onFocus={e=>e.currentTarget.style.borderColor='rgba(240,180,41,.3)'} onBlur={e=>e.currentTarget.style.borderColor='rgba(255,255,255,.08)'}/>
          </div>
          <button onClick={fetchData} style={{padding:'3px 8px',borderRadius:3,fontSize:10,cursor:'pointer',border:'0.5px solid rgba(255,255,255,.07)',background:'transparent',color:'#3d5060',transition:'color 100ms'}} onMouseEnter={e=>e.currentTarget.style.color='#8a9db5'} onMouseLeave={e=>e.currentTarget.style.color='#3d5060'}>↻</button>
        </div>

        {/* Row 3: impact + currency filters */}
        <div style={{display:'flex',gap:3,flexWrap:'wrap',alignItems:'center'}}>
          {(['all','high','med','low'] as const).map(i=>{
            const col = i==='high'?'rgba(239,68,68,1)':i==='med'?'rgba(240,180,41,1)':i==='low'?'rgba(100,116,139,1)':'rgba(200,214,229,1)'
            return <button key={i} onClick={()=>setImpact(i)} style={btnStyle(impact===i,col)}>{i.toUpperCase()}</button>
          })}
          <div style={{width:'0.5px',height:14,background:'rgba(255,255,255,.08)',margin:'0 4px'}}/>
          {CURRENCIES.map(c=>(
            <button key={c} onClick={()=>setCurrency(c)} style={btnStyle(currency===c)}>{c}</button>
          ))}
        </div>

        {/* Column headers */}
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'5px 14px 0',paddingLeft:22,marginTop:6,borderTop:'0.5px solid rgba(255,255,255,.04)'}}>
          <span style={{width:6,flexShrink:0}}/>
          <span style={{fontSize:7,color:'#2d3f50',width:36,letterSpacing:'0.4px',textTransform:'uppercase'}}>Time ET</span>
          <span style={{width:20,flexShrink:0}}/>
          <span style={{width:30,flexShrink:0}}/>
          <span style={{fontSize:7,color:'#2d3f50',flex:1,letterSpacing:'0.4px',textTransform:'uppercase'}}>Event</span>
          <span style={{fontSize:7,color:'#ef4444',letterSpacing:'0.3px',textTransform:'uppercase'}}>Low</span>
          <span style={{fontSize:7,color:'#2d3f50',margin:'0 2px'}}>│</span>
          <span style={{fontSize:7,color:'#f0b429',fontWeight:700,letterSpacing:'0.3px',textTransform:'uppercase'}}>Forecast</span>
          <span style={{fontSize:7,color:'#2d3f50',margin:'0 2px'}}>│</span>
          <span style={{fontSize:7,color:'#22c55e',letterSpacing:'0.3px',textTransform:'uppercase',marginRight:12}}>High</span>
          <span style={{fontSize:7,color:'#2d3f50',width:32,textAlign:'right',letterSpacing:'0.3px',textTransform:'uppercase'}}>Prev</span>
          <span style={{fontSize:7,color:'#2d3f50',width:32,textAlign:'right',letterSpacing:'0.3px',marginLeft:8,textTransform:'uppercase'}}>Act</span>
          <span style={{width:42,flexShrink:0}}/>
          <span style={{width:12,flexShrink:0}}/>
        </div>
      </div>

      {/* ── Events list ── */}
      <div style={{flex:1,overflowY:'auto'}}>
        {loading ? (
          <Skeleton/>
        ) : grouped.length === 0 ? (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:200,gap:8}}>
            <span style={{fontSize:24}}>📭</span>
            <span style={{fontSize:12,color:'#3d5060'}}>No events for this filter</span>
          </div>
        ) : (
          grouped.map(([day, dayEvents]) => (
            <div key={day}>
              {/* Day header */}
              <div style={{display:'flex',alignItems:'center',gap:8,padding:'5px 14px',background:'rgba(255,255,255,.015)',borderBottom:'0.5px solid rgba(255,255,255,.04)',borderTop:'0.5px solid rgba(255,255,255,.04)',position:'sticky',top:0,zIndex:2,backdropFilter:'blur(8px)'}}>
                <span style={{fontSize:9,fontWeight:700,color:'#f0b429',letterSpacing:'0.7px'}}>{day}</span>
                <div style={{flex:1,height:'0.5px',background:'rgba(255,255,255,.04)'}}/>
                {dayEvents.some(e=>e.impactLevel==='high') && (
                  <span style={{fontSize:8,color:'#ef4444',fontWeight:700,display:'flex',alignItems:'center',gap:3}}>
                    <span style={{width:4,height:4,borderRadius:'50%',background:'#ef4444',display:'inline-block',animation:'t-pulse 1.5s ease-in-out infinite'}}/>
                    HIGH IMPACT
                  </span>
                )}
                <span style={{fontSize:8,color:'#3d5060'}}>{dayEvents.length} events</span>
              </div>
              {dayEvents.map(ev=>(
                <EventRow key={ev.id} event={ev} selected={selectedId===ev.id} onSelect={()=>setSelectedId(selectedId===ev.id?null:ev.id)}/>
              ))}
            </div>
          ))
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{padding:'5px 14px',borderTop:'0.5px solid rgba(255,255,255,.04)',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
        <span style={{fontSize:9,color:'#2d3f50'}}>Source: Forex Factory • Auto-refresh 5 min • Horaires ET</span>
        <span style={{fontSize:9,color:'#2d3f50'}}>Cliquez sur un event pour les scénarios de trading</span>
      </div>
    </div>
  )
}
