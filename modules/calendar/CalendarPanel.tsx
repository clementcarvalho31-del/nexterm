'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────
type ImpactLevel = 'high' | 'med' | 'low' // v2
type Direction   = 'bullish' | 'bearish' | 'neutral'
type Tab         = 'calendar' | 'news'
type SortKey     = 'time' | 'impact' | 'country'

interface RawFFEvent {
  title: string; country: string; date: string; time: string
  impact: string; forecast: string; previous: string; actual: string
}
interface CalEvent extends RawFFEvent {
  id: string; flag: string; impactLevel: ImpactLevel
  forecastLow?: string; forecastHigh?: string
  whisper?: string; scenarios?: Record<'bull'|'bear'|'base',{label:string;condition:string;assets:{name:string;dir:Direction}[]}>
}
interface NewsItem {
  id: string; title: string; date: string; link: string; tags: string[]
  impact: 'high'|'med'|'low'; currency: string; isBreaking: boolean; age: string
}

// ── Constants ─────────────────────────────────────────────────────────────────
const FLAGS: Record<string,string> = { USD:'🇺🇸',EUR:'🇪🇺',GBP:'🇬🇧',JPY:'🇯🇵',CAD:'🇨🇦',AUD:'🇦🇺',NZD:'🇳🇿',CHF:'🇨🇭',CNY:'🇨🇳',SEK:'🇸🇪',NOK:'🇳🇴',All:'🌐' }
const IMPACT_MAP: Record<string,ImpactLevel> = { 'High Impact Expected':'high','Medium Impact Expected':'med','Low Impact Expected':'low','Non-Economic':'low' }
const IS = {
  high:{ bg:'rgba(239,68,68,.12)', c:'#ef4444', b:'rgba(239,68,68,.3)',  d:'#ef4444', g:'0 0 6px rgba(239,68,68,.5)',  stars:'★★★' },
  med: { bg:'rgba(240,180,41,.1)', c:'#f0b429', b:'rgba(240,180,41,.3)', d:'#f0b429', g:'0 0 5px rgba(240,180,41,.4)', stars:'★★☆' },
  low: { bg:'rgba(60,70,85,.2)',   c:'#4a5e72', b:'rgba(60,70,85,.3)',   d:'#374151', g:'none',                        stars:'★☆☆' },
}
const DS: Record<Direction,{c:string;i:string;bg:string}> = {
  bullish:{c:'#22c55e',i:'▲',bg:'rgba(34,197,94,.1)'},
  bearish:{c:'#ef4444',i:'▼',bg:'rgba(239,68,68,.1)'},
  neutral:{c:'#64748b',i:'→',bg:'rgba(100,116,139,.1)'},
}
const CURRENCIES = ['ALL','USD','EUR','GBP','JPY','CAD','AUD','NZD','CHF','CNY']

// ── Scenarios ─────────────────────────────────────────────────────────────────
const SCEN: Record<string,CalEvent['scenarios']> = {
  CPI:{ bull:{label:'Chaud > forecast',condition:'Fed hawkish, moins de cuts',assets:[{name:'DXY',dir:'bullish'},{name:'USD/JPY',dir:'bullish'},{name:'Gold',dir:'bearish'},{name:'Bonds',dir:'bearish'}]}, bear:{label:'Froid < forecast',condition:'Cuts anticipés, USD vendu',assets:[{name:'DXY',dir:'bearish'},{name:'Gold',dir:'bullish'},{name:'S&P500',dir:'bullish'},{name:'Bonds',dir:'bullish'}]}, base:{label:'In-line',condition:'Mouvement limité',assets:[{name:'DXY',dir:'neutral'}]} },
  NFP:{ bull:{label:'Beat +30K',condition:'Marché travail fort, Fed hawkish',assets:[{name:'DXY',dir:'bullish'},{name:'USD/JPY',dir:'bullish'},{name:'Gold',dir:'bearish'},{name:'S&P500',dir:'bearish'}]}, bear:{label:'Miss -30K',condition:'Récession fear, cuts repriced',assets:[{name:'DXY',dir:'bearish'},{name:'Gold',dir:'bullish'},{name:'S&P500',dir:'bullish'}]}, base:{label:'In-line',condition:'Pas de repricing',assets:[{name:'DXY',dir:'neutral'}]} },
  FOMC:{ bull:{label:'Dovish',condition:'Signal cuts proches, USD vendu',assets:[{name:'EUR/USD',dir:'bullish'},{name:'Gold',dir:'bullish'},{name:'DXY',dir:'bearish'}]}, bear:{label:'Hawkish',condition:'Cuts repoussés, USD fort',assets:[{name:'DXY',dir:'bullish'},{name:'USD/JPY',dir:'bullish'},{name:'Gold',dir:'bearish'}]}, base:{label:'Neutre',condition:'Data-dependent',assets:[{name:'DXY',dir:'neutral'}]} },
  'Interest Rate':{ bull:{label:'Hawkish/Hike',condition:'Devise bid, taux en hausse',assets:[{name:'GBP/USD',dir:'bullish'},{name:'EUR/USD',dir:'bullish'}]}, bear:{label:'Dovish/Cut',condition:'Devise sold, taux en baisse',assets:[{name:'EUR/USD',dir:'bearish'},{name:'GBP/USD',dir:'bearish'}]}, base:{label:'On hold',condition:'Status quo',assets:[{name:'EUR/USD',dir:'neutral'}]} },
  GDP:{ bull:{label:'Beat',condition:'Croissance forte, risk-on',assets:[{name:'DXY',dir:'bullish'},{name:'Gold',dir:'bearish'}]}, bear:{label:'Miss/Négatif',condition:'Récession fear',assets:[{name:'Gold',dir:'bullish'},{name:'JPY',dir:'bullish'},{name:'DXY',dir:'bearish'}]}, base:{label:'In-line',condition:'Pas de surprise',assets:[{name:'DXY',dir:'neutral'}]} },
  PMI:{ bull:{label:'> 52',condition:'Expansion forte, risk-on',assets:[{name:'EUR/USD',dir:'bullish'},{name:'Gold',dir:'bearish'}]}, bear:{label:'< 48',condition:'Contraction, récession',assets:[{name:'EUR/USD',dir:'bearish'},{name:'Gold',dir:'bullish'}]}, base:{label:'50-52',condition:'Expansion modérée',assets:[{name:'EUR/USD',dir:'neutral'}]} },
}
function getScenario(title:string) { for(const[k,v] of Object.entries(SCEN)) if(title.toLowerCase().includes(k.toLowerCase())) return v }
function getWhisper(title:string,forecast:string) {
  const t=title.toLowerCase()
  if(t.includes('nfp')||t.includes('non-farm')) return `Whisper: ${forecast?(parseInt(forecast.replace('K',''))+20)+'K':'185K'} — USD vulnérable si miss`
  if(t.includes('cpi')) return 'Surveillance: core vs headline — surprise sur core = reaction forte'
  if(t.includes('fomc')||t.includes('fed')) return '"Several" vs "some" — surveiller le tone sur l\'inflation'
  if(t.includes('ecb')||t.includes('boe')||t.includes('boj')) return 'Forward guidance post-décision = driver principal du move'
  return undefined
}
function forecastRange(forecast:string) {
  if(!forecast) return null
  const val = parseFloat(forecast.replace(/[^0-9.-]/g,''))
  if(isNaN(val)) return null
  const unit = forecast.replace(/[\d.-]/g,'').trim()
  const d = Math.abs(val)>100?val*0.08:Math.abs(val)>10?val*0.12:Math.abs(val)>1?val*0.15:0.1
  const f=(n:number)=>(Math.round(n*100)/100)+unit
  return { low:f(val-d), high:f(val+d) }
}
function enrichEvent(e:RawFFEvent,i:number):CalEvent {
  const r=forecastRange(e.forecast)
  return { ...e, id:`ev-${i}`, flag:FLAGS[e.country]||'🌐', impactLevel:IMPACT_MAP[e.impact]||'low', forecastLow:r?.low, forecastHigh:r?.high, whisper:getWhisper(e.title,e.forecast), scenarios:getScenario(e.title) }
}
function parseTime(e:CalEvent):Date|null {
  try {
    const d=new Date(e.date); const t=e.time?.toLowerCase().replace(' ','')
    const pm=t.includes('pm'), am=t.includes('am')
    const clean=t.replace('am','').replace('pm','')
    const [hS,mS]=clean.split(':'); let h=parseInt(hS)||0; const m=parseInt(mS)||0
    if(pm&&h!==12)h+=12; if(am&&h===12)h=0
    d.setHours(h,m,0,0); return d
  } catch{return null}
}
function groupByDay(events:CalEvent[]):[string,CalEvent[]][] {
  const map=new Map<string,CalEvent[]>()
  events.forEach(e=>{
    const d=new Date(e.date)
    const key=d.toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'}).toUpperCase()
    if(!map.has(key))map.set(key,[])
    map.get(key)!.push(e)
  })
  return Array.from(map.entries())
}
function timeAgo(dateStr:string):string {
  const diff=Date.now()-new Date(dateStr).getTime()
  const m=Math.floor(diff/60000)
  if(m<1)return 'now'; if(m<60)return `${m}m`
  const h=Math.floor(m/60); if(h<24)return `${h}h`
  return `${Math.floor(h/24)}j`
}
function detectCurrency(title:string,tags:string[]):string {
  const all=[title,...tags].join(' ').toUpperCase()
  for(const c of ['USD','EUR','GBP','JPY','CAD','AUD','NZD','CHF','CNY']) if(all.includes(c)) return c
  return 'ALL'
}
function detectNewsImpact(title:string):'high'|'med'|'low' {
  const t=title.toLowerCase()
  const highWords=['fed','fomc','cpi','nfp','payroll','gdp','ecb','boe','boj','inflation','rate decision','emergency','crash','crisis','war','recession']
  const medWords=['pmi','retail','housing','jobless','ism','sentiment','budget','trade','output']
  if(highWords.some(w=>t.includes(w)))return 'high'
  if(medWords.some(w=>t.includes(w)))return 'med'
  return 'low'
}

// ── FALLBACK DATA ─────────────────────────────────────────────────────────────
const FF_FALLBACK:RawFFEvent[] = [
  {title:'US CPI m/m',country:'USD',date:new Date(Date.now()+86400000).toISOString(),time:'08:30am',impact:'High Impact Expected',forecast:'0.3%',previous:'0.2%',actual:''},
  {title:'US Core CPI m/m',country:'USD',date:new Date(Date.now()+86400000).toISOString(),time:'08:30am',impact:'High Impact Expected',forecast:'0.3%',previous:'0.3%',actual:''},
  {title:'UK CPI y/y',country:'GBP',date:new Date(Date.now()+86400000).toISOString(),time:'04:00am',impact:'High Impact Expected',forecast:'3.1%',previous:'3.4%',actual:''},
  {title:'Initial Jobless Claims',country:'USD',date:new Date(Date.now()+172800000).toISOString(),time:'08:30am',impact:'Medium Impact Expected',forecast:'215K',previous:'222K',actual:''},
  {title:'FOMC Meeting Minutes',country:'USD',date:new Date(Date.now()+172800000).toISOString(),time:'02:00pm',impact:'High Impact Expected',forecast:'',previous:'',actual:''},
  {title:'ECB Interest Rate Decision',country:'EUR',date:new Date(Date.now()+172800000).toISOString(),time:'08:15am',impact:'High Impact Expected',forecast:'4.00%',previous:'4.25%',actual:''},
  {title:'ECB Press Conference',country:'EUR',date:new Date(Date.now()+172800000).toISOString(),time:'08:45am',impact:'High Impact Expected',forecast:'',previous:'',actual:''},
  {title:'Non-Farm Payrolls',country:'USD',date:new Date(Date.now()+259200000).toISOString(),time:'08:30am',impact:'High Impact Expected',forecast:'175K',previous:'151K',actual:''},
  {title:'Unemployment Rate',country:'USD',date:new Date(Date.now()+259200000).toISOString(),time:'08:30am',impact:'High Impact Expected',forecast:'4.0%',previous:'4.1%',actual:''},
  {title:'Average Hourly Earnings m/m',country:'USD',date:new Date(Date.now()+259200000).toISOString(),time:'08:30am',impact:'High Impact Expected',forecast:'0.3%',previous:'0.3%',actual:''},
  {title:'Canada Employment Change',country:'CAD',date:new Date(Date.now()+259200000).toISOString(),time:'08:30am',impact:'High Impact Expected',forecast:'20K',previous:'32K',actual:''},
  {title:'ISM Manufacturing PMI',country:'USD',date:new Date(Date.now()+345600000).toISOString(),time:'10:00am',impact:'Medium Impact Expected',forecast:'50.8',previous:'50.3',actual:''},
  {title:'Michigan Consumer Sentiment',country:'USD',date:new Date(Date.now()+345600000).toISOString(),time:'10:00am',impact:'Medium Impact Expected',forecast:'59.0',previous:'57.0',actual:''},
  {title:'German CPI m/m',country:'EUR',date:new Date(Date.now()+86400000).toISOString(),time:'02:00am',impact:'Medium Impact Expected',forecast:'0.3%',previous:'0.4%',actual:''},
  {title:'BOJ Policy Rate',country:'JPY',date:new Date(Date.now()+345600000).toISOString(),time:'11:00pm',impact:'High Impact Expected',forecast:'0.5%',previous:'0.5%',actual:''},
]

const NEWS_FALLBACK = [
  {id:'n1',title:'Fed Williams: inflation still too high — no cuts before Q3 confirmed',date:new Date(Date.now()-900000).toISOString(),link:'#',tags:['USD','FED'],impact:'high' as const,currency:'USD',isBreaking:false,age:'15m'},
  {id:'n2',title:'ECB Lagarde: June cut possible if data confirms — EUR/USD sold to 1.0840',date:new Date(Date.now()-1800000).toISOString(),link:'#',tags:['EUR','ECB'],impact:'high' as const,currency:'EUR',isBreaking:false,age:'30m'},
  {id:'n3',title:'NFP Preview: Consensus 175K, whisper 185K — USD vulnerable on miss',date:new Date(Date.now()-2700000).toISOString(),link:'#',tags:['USD','NFP'],impact:'high' as const,currency:'USD',isBreaking:false,age:'45m'},
  {id:'n4',title:'GBP/USD holds 1.2680 — UK CPI beat supports hawkish BoE pricing',date:new Date(Date.now()-3600000).toISOString(),link:'#',tags:['GBP','BoE'],impact:'med' as const,currency:'GBP',isBreaking:false,age:'1h'},
  {id:'n5',title:'PBoC keeps LPR unchanged at 3.45% — no stimulus signal, CNH stable',date:new Date(Date.now()-5400000).toISOString(),link:'#',tags:['CNY','PBOC'],impact:'med' as const,currency:'CNY',isBreaking:false,age:'1h30'},
  {id:'n6',title:'Gold breaks $2320 — geopolitical bid + real yields falling, CB accumulation',date:new Date(Date.now()-7200000).toISOString(),link:'#',tags:['GOLD','USD'],impact:'med' as const,currency:'USD',isBreaking:false,age:'2h'},
  {id:'n7',title:'BoJ minutes: heated debate on pace of normalisation — JPY bid on intervention risk',date:new Date(Date.now()-9000000).toISOString(),link:'#',tags:['JPY','BOJ'],impact:'high' as const,currency:'JPY',isBreaking:false,age:'2h30'},
  {id:'n8',title:'US Retail Sales beat: +0.7% vs +0.4% expected — consumer resilient',date:new Date(Date.now()-10800000).toISOString(),link:'#',tags:['USD'],impact:'med' as const,currency:'USD',isBreaking:false,age:'3h'},
  {id:'n9',title:'Eurozone PMI composite: 52.1 vs 51.5 expected — EUR/USD bounce to 1.0860',date:new Date(Date.now()-12600000).toISOString(),link:'#',tags:['EUR'],impact:'med' as const,currency:'EUR',isBreaking:false,age:'3h30'},
  {id:'n10',title:'Canada CPI: 2.9% y/y — BOC cut in June now 78% priced, CAD sold',date:new Date(Date.now()-14400000).toISOString(),link:'#',tags:['CAD','BOC'],impact:'high' as const,currency:'CAD',isBreaking:false,age:'4h'},
]

// ── Sub-components ─────────────────────────────────────────────────────────────
function Countdown({events}:{events:CalEvent[]}) {
  const [s,setS]=useState({time:'—',name:'',urgent:false})
  useEffect(()=>{
    const tick=()=>{
      const now=Date.now()
      const next=events.filter(e=>e.impactLevel==='high'&&!e.actual)
        .map(e=>({e,ts:parseTime(e)?.getTime()||0}))
        .filter(x=>x.ts>now).sort((a,b)=>a.ts-b.ts)[0]
      if(!next){setS({time:'—',name:'No upcoming HIGH',urgent:false});return}
      const diff=next.ts-now
      const h=Math.floor(diff/3600000),m=Math.floor((diff%3600000)/60000),sec=Math.floor((diff%60000)/1000)
      setS({time:h>0?`${h}h ${m.toString().padStart(2,'0')}m`:`${m}m ${sec.toString().padStart(2,'0')}s`,name:next.e.title.slice(0,30),urgent:diff<3600000})
    }
    tick(); const id=setInterval(tick,1000); return()=>clearInterval(id)
  },[events])
  return (
    <div style={{display:'flex',alignItems:'center',gap:6,padding:'4px 10px',background:s.urgent?'rgba(239,68,68,.08)':'rgba(240,180,41,.05)',border:`0.5px solid ${s.urgent?'rgba(239,68,68,.3)':'rgba(240,180,41,.2)'}`,borderRadius:5,flexShrink:0}}>
      <span style={{width:5,height:5,borderRadius:'50%',background:s.urgent?'#ef4444':'#f0b429',animation:'t-pulse 1s ease-in-out infinite',display:'inline-block'}}/>
      <span style={{fontSize:9,color:'#8a9db5'}}>HIGH:</span>
      <span style={{fontSize:10,fontWeight:700,color:s.urgent?'#ef4444':'#f0b429',fontVariantNumeric:'tabular-nums',fontFamily:'IBM Plex Mono,monospace'}}>{s.time}</span>
      <span style={{fontSize:9,color:'#4a5e72',maxWidth:100,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>→ {s.name}</span>
    </div>
  )
}

function CurrencyHeatmap({events}:{events:CalEvent[]}) {
  const impacts: Record<string,number> = {}
  events.filter(e=>!e.actual).forEach(e=>{
    const score = e.impactLevel==='high'?3:e.impactLevel==='med'?1:0
    impacts[e.country]=(impacts[e.country]||0)+score
  })
  const max=Math.max(...Object.values(impacts),1)
  return (
    <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
      {Object.entries(impacts).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([cur,score])=>{
        const pct=score/max; const col=pct>0.6?'#ef4444':pct>0.3?'#f0b429':'#4a5e72'
        return (
          <div key={cur} style={{display:'flex',alignItems:'center',gap:3,padding:'2px 6px',borderRadius:3,background:`${col}18`,border:`0.5px solid ${col}44`}}>
            <span style={{fontSize:9}}>{FLAGS[cur]||'🌐'}</span>
            <span style={{fontSize:8,fontWeight:700,color:col,fontFamily:'IBM Plex Mono,monospace'}}>{cur}</span>
          </div>
        )
      })}
    </div>
  )
}

function EventRow({event,selected,onSelect}:{event:CalEvent;selected:boolean;onSelect:()=>void}) {
  const imp=IS[event.impactLevel]
  const hasActual=!!event.actual
  const isSoon=(()=>{const ts=parseTime(event)?.getTime();return ts&&!hasActual&&ts-Date.now()<3600000&&ts>Date.now()})()
  return (
    <div style={{borderBottom:'0.5px solid rgba(255,255,255,.03)'}}>
      <div onClick={onSelect} style={{display:'flex',alignItems:'center',gap:7,padding:'6px 12px',cursor:'pointer',background:selected?'rgba(240,180,41,.04)':isSoon?'rgba(239,68,68,.03)':'transparent',borderLeft:selected?'2px solid #f0b429':isSoon?'2px solid rgba(239,68,68,.5)':'2px solid transparent',transition:'background 80ms'}}
        onMouseEnter={e=>{if(!selected)(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,.025)'}}
        onMouseLeave={e=>{if(!selected)(e.currentTarget as HTMLElement).style.background=isSoon?'rgba(239,68,68,.03)':'transparent'}}>
        {/* Stars */}
        <span style={{fontSize:9,letterSpacing:.5,width:28,flexShrink:0,color:imp.c}}>{imp.stars}</span>
        {/* Time */}
        <span style={{fontSize:9,color:isSoon?'#f0b429':'#5a7080',width:42,flexShrink:0,fontFamily:'IBM Plex Mono,monospace',fontWeight:isSoon?700:400}}>
          {event.time?.toLowerCase().replace(' ','')||'—'}
        </span>
        {/* Flag + country */}
        <span style={{fontSize:11,flexShrink:0}}>{event.flag}</span>
        <span style={{fontSize:8,fontWeight:600,color:'#3d5060',width:26,flexShrink:0}}>{event.country}</span>
        {/* Title */}
        <span style={{fontSize:10,fontWeight:500,color:isSoon?'#e2e8f0':'#b8cad9',flex:1,lineHeight:1.3}}>
          {event.title}
          {isSoon&&<span style={{marginLeft:5,fontSize:7,fontWeight:800,color:'#ef4444',letterSpacing:'.5px',animation:'t-pulse 1s infinite'}}> ●SOON</span>}
        </span>
        {/* Forecast range */}
        {event.forecastLow&&event.forecastHigh?(
          <div style={{display:'flex',alignItems:'center',gap:2,fontSize:8,fontFamily:'IBM Plex Mono,monospace',flexShrink:0}}>
            <span style={{color:'#ef4444'}}>{event.forecastLow}</span>
            <span style={{color:'#2d3f50'}}>│</span>
            <span style={{color:'#f0b429',fontWeight:700,fontSize:9}}>{event.forecast}</span>
            <span style={{color:'#2d3f50'}}>│</span>
            <span style={{color:'#22c55e'}}>{event.forecastHigh}</span>
          </div>
        ):(
          <span style={{width:80,textAlign:'center',fontSize:8,color:'#2d3f50',fontFamily:'IBM Plex Mono,monospace'}}>—</span>
        )}
        {/* Prev / Act */}
        <div style={{display:'flex',gap:6,flexShrink:0}}>
          {[['P',event.previous||'—','#4a5e72'],['A',event.actual||'—',hasActual?'#22c55e':'#2a3a48']].map(([l,v,c])=>(
            <div key={l as string} style={{textAlign:'right',minWidth:28}}>
              <div style={{fontSize:6,color:'#2d3f50',letterSpacing:'.3px'}}>{l}</div>
              <div style={{fontSize:9,fontWeight:l==='A'?700:400,color:c as string,fontFamily:'IBM Plex Mono,monospace'}}>{v}</div>
            </div>
          ))}
        </div>
        <span style={{fontSize:7,fontWeight:700,padding:'1px 5px',borderRadius:2,background:imp.bg,color:imp.c,border:`0.5px solid ${imp.b}`,letterSpacing:'.3px',flexShrink:0,minWidth:24,textAlign:'center'}}>
          {event.impactLevel==='high'?'H':event.impactLevel==='med'?'M':'L'}
        </span>
        <span style={{fontSize:8,color:'#2d3f50',transform:selected?'rotate(180deg)':'none',transition:'transform 150ms',flexShrink:0}}>▾</span>
      </div>
      {selected&&(
        <div style={{padding:'10px 14px 12px 26px',background:'rgba(0,0,0,.2)',borderBottom:'0.5px solid rgba(255,255,255,.04)'}}>
          {/* Forecast bar */}
          {event.forecastLow&&event.forecastHigh&&(
            <div style={{marginBottom:10,padding:'8px 10px',background:'rgba(255,255,255,.02)',borderRadius:5,border:'0.5px solid rgba(255,255,255,.05)'}}>
              <div style={{fontSize:8,color:'#4a5e72',letterSpacing:'.5px',marginBottom:6,textTransform:'uppercase'}}>📊 Forecast Range</div>
              <div style={{position:'relative',height:6,background:'rgba(255,255,255,.06)',borderRadius:3,marginBottom:6}}>
                <div style={{position:'absolute',inset:0,background:'linear-gradient(90deg,rgba(239,68,68,.3),rgba(240,180,41,.4),rgba(34,197,94,.3))',borderRadius:3}}/>
                <div style={{position:'absolute',top:-3,width:2,height:12,background:'#f0b429',borderRadius:1,left:'50%',transform:'translateX(-50%)',boxShadow:'0 0 4px rgba(240,180,41,.6)'}}/>
                {event.actual&&<div style={{position:'absolute',top:-3,width:2,height:12,background:'#22c55e',borderRadius:1,left:'70%',transform:'translateX(-50%)',boxShadow:'0 0 4px rgba(34,197,94,.6)'}}/>}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:4}}>
                {[['LOW',event.forecastLow,'#ef4444'],['FORE',event.forecast||'—','#f0b429'],['HIGH',event.forecastHigh,'#22c55e']].map(([l,v,c])=>(
                  <div key={l} style={{textAlign:'center',padding:'4px',background:'rgba(255,255,255,.02)',borderRadius:3}}>
                    <div style={{fontSize:7,color:'#3d5060',marginBottom:2}}>{l}</div>
                    <div style={{fontSize:10,fontWeight:700,color:c,fontFamily:'IBM Plex Mono,monospace'}}>{v}</div>
                  </div>
                ))}
              </div>
              {event.previous&&<div style={{marginTop:4,fontSize:8,color:'#3d5060'}}>Previous: <span style={{color:'#5a7080',fontFamily:'IBM Plex Mono,monospace'}}>{event.previous}</span></div>}
            </div>
          )}
          {/* Whisper */}
          {event.whisper&&(
            <div style={{display:'flex',gap:6,marginBottom:8,padding:'5px 8px',background:'rgba(240,180,41,.05)',border:'0.5px solid rgba(240,180,41,.15)',borderRadius:4}}>
              <span style={{fontSize:10}}>💬</span>
              <span style={{fontSize:9,color:'#c8d6e5'}}><strong style={{color:'#f0b429'}}>Desk:</strong> {event.whisper}</span>
            </div>
          )}
          {/* Scenarios */}
          {event.scenarios&&(
            <div>
              <div style={{fontSize:8,fontWeight:700,color:'#4a5e72',letterSpacing:'.5px',marginBottom:5,textTransform:'uppercase'}}>🎯 Trading Scenarios</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:5}}>
                {(['bull','bear','base'] as const).map(k=>{
                  const sc=event.scenarios![k]
                  const cfg={bull:{bg:'rgba(34,197,94,.05)',b:'rgba(34,197,94,.2)',l:'🟢 BULL'},bear:{bg:'rgba(239,68,68,.05)',b:'rgba(239,68,68,.2)',l:'🔴 BEAR'},base:{bg:'rgba(240,180,41,.05)',b:'rgba(240,180,41,.2)',l:'🟡 BASE'}}[k]
                  return(
                    <div key={k} style={{padding:7,borderRadius:4,background:cfg.bg,border:`0.5px solid ${cfg.b}`}}>
                      <div style={{fontSize:7,fontWeight:700,color:'#8a9db5',marginBottom:2,letterSpacing:'.4px'}}>{cfg.l}</div>
                      <div style={{fontSize:9,fontWeight:600,color:'#c8d6e5',marginBottom:2}}>{sc.label}</div>
                      <div style={{fontSize:8,color:'#4a5e72',marginBottom:4,lineHeight:1.4}}>{sc.condition}</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:2}}>
                        {sc.assets.map(a=>(
                          <span key={a.name} style={{display:'inline-flex',alignItems:'center',gap:1,fontSize:8,fontWeight:600,padding:'1px 4px',borderRadius:2,background:DS[a.dir].bg,color:DS[a.dir].c,border:`0.5px solid ${DS[a.dir].c}33`}}>{DS[a.dir].i}{a.name}</span>
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

function NewsRow({item}:{item:NewsItem}) {
  const imp=IS[item.impact]
  return (
    <div style={{display:'flex',gap:8,padding:'7px 12px',borderBottom:'0.5px solid rgba(255,255,255,.03)',transition:'background 80ms',cursor:'pointer'}}
      onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,.02)')}
      onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,flexShrink:0,marginTop:2}}>
        <span style={{width:5,height:5,borderRadius:'50%',background:imp.d,display:'block',boxShadow:imp.g,flexShrink:0}}/>
        <span style={{fontSize:8,color:'#2d3f50',fontFamily:'IBM Plex Mono,monospace',whiteSpace:'nowrap'}}>{item.age}</span>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'flex-start',gap:5,marginBottom:3}}>
          {item.currency!=='ALL'&&<span style={{fontSize:9,flexShrink:0}}>{FLAGS[item.currency]||'🌐'}</span>}
          <span style={{fontSize:10,fontWeight:500,color:item.impact==='high'?'#e2e8f0':'#a8b8c8',lineHeight:1.4}}>{item.title}</span>
        </div>
        <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
          {item.tags.slice(0,4).map(t=>(
            <span key={t} style={{fontSize:7,fontWeight:600,padding:'1px 4px',borderRadius:2,background:'rgba(255,255,255,.04)',color:'#4a5e72',border:'0.5px solid rgba(255,255,255,.06)'}}>{t}</span>
          ))}
          {item.impact==='high'&&<span style={{fontSize:7,fontWeight:700,padding:'1px 4px',borderRadius:2,background:'rgba(239,68,68,.12)',color:'#ef4444',border:'0.5px solid rgba(239,68,68,.25)'}}>HIGH</span>}
        </div>
      </div>
    </div>
  )
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export function CalendarPanel() {
  const [tab,setTab]             = useState<Tab>('calendar')
  const [events,setEvents]       = useState<CalEvent[]>([])
  const [news,setNews]           = useState<NewsItem[]>([])
  const [loading,setLoading]     = useState(true)
  const [selectedId,setSelectedId] = useState<string|null>(null)
  const [stars,setStars]         = useState<Set<ImpactLevel>>(new Set(['high','med','low']))
  const [currency,setCurrency]   = useState('ALL')
  const [search,setSearch]       = useState('')
  const [range,setRange]         = useState<'today'|'week'>('week')
  const [sortKey,setSortKey]     = useState<SortKey>('time')
  const [newsCurrency,setNewsCurrency] = useState('ALL')
  const [newsImpact,setNewsImpact]     = useState<'all'|ImpactLevel>('all')
  const [lastUpdate,setLastUpdate]     = useState('')
  const [refreshing,setRefreshing]     = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval>|null>(null)

  const fetchAll = useCallback(async () => {
    setRefreshing(true)
    try {
      // Calendar
      const calRes = await fetch('/api/calendar',{cache:'no-store'})
      const calJson = await calRes.json()
      const rawCal:RawFFEvent[] = calJson.ok&&calJson.data?.length>0?calJson.data:FF_FALLBACK
      setEvents(rawCal.map(enrichEvent))
      // News
      const newsRes = await fetch('/api/news',{cache:'no-store'})
      const newsJson = await newsRes.json()
      if(newsJson.ok&&newsJson.data?.length>0) {
        const enriched:NewsItem[] = newsJson.data.map((n:any,i:number)=>({
          id:`n-${i}`, title:n.title, date:n.date, link:n.link, tags:n.tags||[],
          impact:detectNewsImpact(n.title), currency:detectCurrency(n.title,n.tags||[]),
          isBreaking:false, age:timeAgo(n.date)
        }))
        setNews(enriched)
      } else { setNews(NEWS_FALLBACK) }
      setLastUpdate(new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}))
    } catch {
      setEvents(FF_FALLBACK.map(enrichEvent))
      setNews(NEWS_FALLBACK)
    } finally { setLoading(false); setRefreshing(false) }
  },[])

  useEffect(()=>{
    fetchAll()
    intervalRef.current=setInterval(fetchAll,30000) // 30s refresh
    return()=>{ if(intervalRef.current)clearInterval(intervalRef.current) }
  },[fetchAll])

  // Filtered + sorted events
  const filteredEvents = events
    .filter(e=>{
      if(!stars.has(e.impactLevel))return false
      if(currency!=='ALL'&&e.country!==currency)return false
      if(search&&!e.title.toLowerCase().includes(search.toLowerCase())&&!e.country.toLowerCase().includes(search.toLowerCase()))return false
      if(range==='today'){const t=new Date();const ev=new Date(e.date);if(ev.toDateString()!==t.toDateString())return false}
      return true
    })
    .sort((a,b)=>{
      if(sortKey==='impact'){const o={high:0,med:1,low:2};return o[a.impactLevel]-o[b.impactLevel]}
      if(sortKey==='country')return a.country.localeCompare(b.country)
      return (parseTime(a)?.getTime()||0)-(parseTime(b)?.getTime()||0)
    })

  const filteredNews = news.filter(n=>{
    if(newsImpact!=='all'&&n.impact!==newsImpact)return false
    if(newsCurrency!=='ALL'&&n.currency!==newsCurrency)return false
    return true
  })

  const highCount = events.filter(e=>e.impactLevel==='high').length
  const grouped = groupByDay(filteredEvents)

  const btnStyle = (active:boolean,color='rgba(240,180,41,1)')=>({
    padding:'3px 7px',borderRadius:3,fontSize:9,fontWeight:600 as const,letterSpacing:'.3px',cursor:'pointer' as const,
    border:`0.5px solid ${active?color.replace('1)','0.35)'):'rgba(255,255,255,.06)'}`,
    background:active?color.replace('1)','0.1)'):'transparent',
    color:active?color:'#3d5060',transition:'all 100ms',fontFamily:'inherit',
  })

  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',background:'#080c12',fontFamily:"'Inter',-apple-system,sans-serif",overflow:'hidden'}}>

      {/* ── TAB BAR ── */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 12px',height:38,borderBottom:'0.5px solid rgba(255,255,255,.07)',flexShrink:0,background:'rgba(255,255,255,.02)'}}>
        <div style={{display:'flex',gap:1}}>
          {([['calendar','📅 Calendar'],['news','📰 News Macro']] as [Tab,string][]).map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:'4px 12px',borderRadius:4,fontSize:10,fontWeight:tab===t?700:500,cursor:'pointer',border:'none',background:tab===t?'rgba(240,180,41,.1)':'transparent',color:tab===t?'#f0b429':'#5a7080',transition:'all 120ms',fontFamily:'inherit',borderBottom:tab===t?'1.5px solid #f0b429':'1.5px solid transparent'}}>
              {l} {t==='calendar'&&highCount>0&&<span style={{fontSize:8,padding:'1px 4px',borderRadius:2,background:'rgba(239,68,68,.2)',color:'#ef4444',marginLeft:3,fontWeight:700}}>{highCount}</span>}
            </button>
          ))}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          {refreshing&&<span style={{fontSize:9,color:'#f0b429',animation:'t-pulse 1s infinite'}}>↻ live</span>}
          {lastUpdate&&<span style={{fontSize:8,color:'#2d3f50',fontFamily:'IBM Plex Mono,monospace'}}>{lastUpdate}</span>}
          <button onClick={fetchAll} style={{padding:'2px 7px',borderRadius:3,fontSize:9,cursor:'pointer',border:'0.5px solid rgba(255,255,255,.07)',background:'transparent',color:'#3d5060',fontFamily:'inherit'}} onMouseEnter={e=>e.currentTarget.style.color='#8a9db5'} onMouseLeave={e=>e.currentTarget.style.color='#3d5060'}>↻</button>
        </div>
      </div>

      {/* ── CALENDAR TAB ── */}
      {tab==='calendar'&&(
        <>
          {/* Filters */}
          <div style={{padding:'7px 12px',borderBottom:'0.5px solid rgba(255,255,255,.05)',flexShrink:0,display:'flex',flexDirection:'column',gap:5}}>
            {/* Row 1: countdown + range + search */}
            <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
              <Countdown events={events}/>
              <div style={{flex:1}}/>
              {(['today','week'] as const).map(r=>(
                <button key={r} onClick={()=>setRange(r)} style={btnStyle(range===r)}>{r==='today'?'TODAY':'SEMAINE'}</button>
              ))}
              {/* Sort */}
              <select value={sortKey} onChange={e=>setSortKey(e.target.value as SortKey)} style={{padding:'3px 6px',borderRadius:3,fontSize:9,cursor:'pointer',border:'0.5px solid rgba(255,255,255,.07)',background:'rgba(255,255,255,.04)',color:'#5a7080',outline:'none',fontFamily:'inherit'}}>
                <option value="time">↕ Heure</option>
                <option value="impact">↕ Impact</option>
                <option value="country">↕ Devise</option>
              </select>
              {/* Search */}
              <div style={{position:'relative',display:'flex',alignItems:'center'}}>
                <svg style={{position:'absolute',left:6,pointerEvents:'none'}} width="9" height="9" viewBox="0 0 12 12" fill="none"><circle cx="5.5" cy="5.5" r="3.8" stroke="#3d5060" strokeWidth="1.3"/><line x1="8.5" y1="8.5" x2="11" y2="11" stroke="#3d5060" strokeWidth="1.3" strokeLinecap="round"/></svg>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher…" style={{paddingLeft:20,paddingRight:6,paddingTop:3,paddingBottom:3,borderRadius:3,background:'rgba(255,255,255,.04)',border:'0.5px solid rgba(255,255,255,.07)',color:'#c8d6e5',fontSize:9,outline:'none',width:110,fontFamily:'inherit'}} onFocus={e=>e.currentTarget.style.borderColor='rgba(240,180,41,.3)'} onBlur={e=>e.currentTarget.style.borderColor='rgba(255,255,255,.07)'}/>
              </div>
            </div>
            {/* Row 2: star checkboxes + currency */}
            <div style={{display:'flex',gap:4,flexWrap:'wrap',alignItems:'center'}}>
              {([{l:'high' as ImpactLevel,s:'★★★',c:'#ef4444',bg:'rgba(239,68,68,.12)',b:'rgba(239,68,68,.35)'},{l:'med' as ImpactLevel,s:'★★☆',c:'#f0b429',bg:'rgba(240,180,41,.1)',b:'rgba(240,180,41,.35)'},{l:'low' as ImpactLevel,s:'★☆☆',c:'#64748b',bg:'rgba(100,116,139,.1)',b:'rgba(100,116,139,.3)'}]).map(({l,s,c,bg,b})=>{
                const checked=stars.has(l)
                return(
                  <div key={l} onClick={()=>{const n=new Set(stars);if(checked)n.delete(l);else n.add(l);setStars(n)}} style={{display:'flex',alignItems:'center',gap:4,padding:'3px 8px',borderRadius:3,cursor:'pointer',background:checked?bg:'transparent',border:`0.5px solid ${checked?b:'rgba(255,255,255,.06)'}`,transition:'all 100ms',userSelect:'none' as const}}>
                    <div style={{width:11,height:11,borderRadius:2,border:`1.5px solid ${checked?c:'rgba(255,255,255,.2)'}`,background:checked?c:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      {checked&&<span style={{fontSize:7,color:'#000',fontWeight:900}}>✓</span>}
                    </div>
                    <span style={{fontSize:9,letterSpacing:.5,color:checked?c:'#3d5060'}}>{s}</span>
                  </div>
                )
              })}
              <div style={{width:'0.5px',height:14,background:'rgba(255,255,255,.07)',margin:'0 2px'}}/>
              {CURRENCIES.slice(0,8).map(c=>(
                <button key={c} onClick={()=>setCurrency(c)} style={btnStyle(currency===c)}>{c}</button>
              ))}
              <div style={{flex:1}}/>
              {/* Heatmap */}
              <CurrencyHeatmap events={events}/>
            </div>
          </div>

          {/* Column headers */}
          <div style={{display:'flex',alignItems:'center',gap:7,padding:'3px 12px',background:'rgba(0,0,0,.2)',borderBottom:'0.5px solid rgba(255,255,255,.04)',flexShrink:0}}>
            {[['',28],['TIME',42],['',11],['',26],['EVENT','flex'],['LOW│FORE│HIGH',80],['P',28],['A',28],['',30],['',14]].map(([l,w],i)=>(
              <span key={i} style={{fontSize:7,color:'#2d3f50',letterSpacing:'.4px',textTransform:'uppercase' as const,width:typeof w==='number'?w:undefined,flex:l==='EVENT'?1:undefined,flexShrink:0,textAlign:i>5?'right' as const:'left' as const}}>{l}</span>
            ))}
          </div>

          {/* Events list */}
          <div style={{flex:1,overflowY:'auto'}}>
            {loading?(
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:120,gap:8}}>
                <span style={{width:12,height:12,borderRadius:'50%',border:'2px solid rgba(240,180,41,.3)',borderTopColor:'#f0b429',animation:'t-spin .7s linear infinite',display:'inline-block'}}/>
                <span style={{fontSize:11,color:'#3d5060'}}>Chargement des données…</span>
              </div>
            ):grouped.length===0?(
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:120,gap:6}}>
                <span style={{fontSize:20}}>📭</span>
                <span style={{fontSize:11,color:'#3d5060'}}>Aucun événement pour ce filtre</span>
              </div>
            ):(
              grouped.map(([day,dayEvents])=>(
                <div key={day}>
                  <div style={{display:'flex',alignItems:'center',gap:8,padding:'4px 12px',background:'rgba(255,255,255,.015)',borderTop:'0.5px solid rgba(255,255,255,.04)',borderBottom:'0.5px solid rgba(255,255,255,.04)',position:'sticky',top:0,zIndex:2,backdropFilter:'blur(8px)'}}>
                    <span style={{fontSize:8,fontWeight:700,color:'#f0b429',letterSpacing:'.7px'}}>{day}</span>
                    <div style={{flex:1,height:'0.5px',background:'rgba(255,255,255,.04)'}}/>
                    {dayEvents.some(e=>e.impactLevel==='high')&&<span style={{fontSize:7,color:'#ef4444',fontWeight:700,display:'flex',alignItems:'center',gap:2}}><span style={{width:3,height:3,borderRadius:'50%',background:'#ef4444',display:'inline-block',animation:'t-pulse 1.5s infinite'}}/>HIGH IMPACT</span>}
                    <span style={{fontSize:7,color:'#3d5060'}}>{dayEvents.length} events</span>
                  </div>
                  {dayEvents.map(ev=>(
                    <EventRow key={ev.id} event={ev} selected={selectedId===ev.id} onSelect={()=>setSelectedId(selectedId===ev.id?null:ev.id)}/>
                  ))}
                </div>
              ))
            )}
          </div>
          {/* Footer */}
          <div style={{padding:'3px 12px',borderTop:'0.5px solid rgba(255,255,255,.04)',display:'flex',justifyContent:'space-between',flexShrink:0}}>
            <span style={{fontSize:8,color:'#2d3f50'}}>Source: Forex Factory • Auto-refresh 30s • ET</span>
            <span style={{fontSize:8,color:'#2d3f50'}}>{filteredEvents.length} events • Cliquez pour les scénarios</span>
          </div>
        </>
      )}

      {/* ── NEWS TAB ── */}
      {tab==='news'&&(
        <>
          {/* News filters */}
          <div style={{padding:'6px 12px',borderBottom:'0.5px solid rgba(255,255,255,.05)',flexShrink:0,display:'flex',gap:4,flexWrap:'wrap',alignItems:'center'}}>
            {(['all','high','med'] as const).map(i=>{
              const col=i==='high'?'rgba(239,68,68,1)':i==='med'?'rgba(240,180,41,1)':'rgba(200,214,229,1)'
              return <button key={i} onClick={()=>setNewsImpact(i)} style={btnStyle(newsImpact===i,col)}>{i==='all'?'ALL':i.toUpperCase()}</button>
            })}
            <div style={{width:'0.5px',height:14,background:'rgba(255,255,255,.07)',margin:'0 2px'}}/>
            {CURRENCIES.slice(0,7).map(c=>(
              <button key={c} onClick={()=>setNewsCurrency(c)} style={btnStyle(newsCurrency===c)}>{c}</button>
            ))}
            <div style={{flex:1}}/>
            <span style={{fontSize:8,color:'#2d3f50'}}>{filteredNews.length} news</span>
          </div>

          {/* News list */}
          <div style={{flex:1,overflowY:'auto'}}>
            {filteredNews.length===0?(
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:120}}>
                <span style={{fontSize:11,color:'#3d5060'}}>Aucune news pour ce filtre</span>
              </div>
            ):(
              filteredNews.map(item=><NewsRow key={item.id} item={item}/>)
            )}
          </div>
          <div style={{padding:'3px 12px',borderTop:'0.5px solid rgba(255,255,255,.04)',flexShrink:0}}>
            <span style={{fontSize:8,color:'#2d3f50'}}>Sources: Financial Juice • Refresh 30s</span>
          </div>
        </>
      )}
    </div>
  )
}
