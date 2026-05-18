'use client'
import { useState, useEffect } from 'react'

type Impact = 'high' | 'med' | 'low'
type Direction = 'bullish' | 'bearish' | 'neutral'

interface CalEvent {
  id: string; date: string; time: string; flag: string; country: string
  event: string; impact: Impact; previous: string; forecast: string; actual: string
  consensus?: string; whisper?: string; description?: string
  scenarios?: {
    bull: { label: string; condition: string; assets: { name: string; dir: Direction }[] }
    bear: { label: string; condition: string; assets: { name: string; dir: Direction }[] }
    base: { label: string; condition: string; assets: { name: string; dir: Direction }[] }
  }
}

const EVENTS: CalEvent[] = [
  { id:'e1', date:'MON', time:'10:00 ET', flag:'🇺🇸', country:'USD', event:'ISM Manufacturing PMI', impact:'med', previous:'50.3', forecast:'50.8', actual:'', description:'Mesure l\'activité manufacturière US. > 50 = expansion.', scenarios:{ bull:{label:'Beat > 51.5',condition:'Print au-dessus du whisper',assets:[{name:'DXY',dir:'bullish'},{name:'USD/JPY',dir:'bullish'},{name:'Gold',dir:'bearish'}]}, bear:{label:'Miss < 49.5',condition:'Contraction confirmée',assets:[{name:'DXY',dir:'bearish'},{name:'EUR/USD',dir:'bullish'},{name:'Gold',dir:'bullish'}]}, base:{label:'In-line 50-51',condition:'Pas de mouvement fort',assets:[{name:'DXY',dir:'neutral'},{name:'EUR/USD',dir:'neutral'}]} } },
  { id:'e2', date:'TUE', time:'08:30 ET', flag:'🇺🇸', country:'USD', event:'JOLTS Job Openings', impact:'med', previous:'7.74M', forecast:'7.65M', actual:'', description:'Offres d\'emploi ouvertes — indicateur clé marché travail pour la Fed.' },
  { id:'e3', date:'WED', time:'08:15 ET', flag:'🇺🇸', country:'USD', event:'ADP Non-Farm Employment', impact:'med', previous:'155K', forecast:'160K', actual:'', description:'Preview officieux du NFP. Corrélation imparfaite mais surveillé par les desks.' },
  { id:'e4', date:'WED', time:'14:00 ET', flag:'🇺🇸', country:'USD', event:'FOMC Minutes', impact:'high', previous:'', forecast:'', actual:'', consensus:'Hawkish tone attendu', whisper:'Membres divisés sur timing cut', description:'Compte-rendu FOMC. Scrute "several" vs "some" pour le ton.', scenarios:{ bull:{label:'Dovish surprise',condition:'"Several" membres veulent couper',assets:[{name:'EUR/USD',dir:'bullish'},{name:'GBP/USD',dir:'bullish'},{name:'Gold',dir:'bullish'},{name:'DXY',dir:'bearish'}]}, bear:{label:'Très hawkish',condition:'Cuts repoussés à 2026',assets:[{name:'DXY',dir:'bullish'},{name:'USD/JPY',dir:'bullish'},{name:'EUR/USD',dir:'bearish'},{name:'Gold',dir:'bearish'}]}, base:{label:'Data-dependent',condition:'Ton neutre, attente données',assets:[{name:'DXY',dir:'neutral'},{name:'EUR/USD',dir:'neutral'}]} } },
  { id:'e5', date:'THU', time:'08:30 ET', flag:'🇺🇸', country:'USD', event:'Initial Jobless Claims', impact:'med', previous:'225K', forecast:'218K', actual:'', description:'Nouvelles demandes chômage. > 250K = signal de détérioration.' },
  { id:'e6', date:'THU', time:'12:45 ET', flag:'🇪🇺', country:'EUR', event:'ECB Interest Rate Decision', impact:'high', previous:'4.25%', forecast:'4.00%', actual:'', consensus:'Cut 25bp très probable', whisper:'Forward guidance cruciale sur le rythme', description:'Décision BCE. Attendu -25bp. Ce qui compte c\'est le message de Lagarde.', scenarios:{ bull:{label:'Cut + Dovish signal',condition:'-25bp + signal coupes futures',assets:[{name:'EUR/USD',dir:'bearish'},{name:'EUR/GBP',dir:'bearish'},{name:'DAX',dir:'bullish'}]}, bear:{label:'Pause surprise',condition:'Pas de cut, inflation concern',assets:[{name:'EUR/USD',dir:'bullish'},{name:'EUR/GBP',dir:'bullish'},{name:'DAX',dir:'bearish'}]}, base:{label:'Cut + Neutre',condition:'-25bp, Lagarde data-dependent',assets:[{name:'EUR/USD',dir:'neutral'},{name:'EUR/GBP',dir:'neutral'}]} } },
  { id:'e7', date:'FRI', time:'08:30 ET', flag:'🇺🇸', country:'USD', event:'Non-Farm Payrolls (NFP)', impact:'high', previous:'151K', forecast:'175K', actual:'', consensus:'175K', whisper:'185K — marché short USD si miss', description:'Le print macro le plus important du mois. Miss > 30K = fort mouvement.', scenarios:{ bull:{label:'Beat > 200K',condition:'Marché travail fort, Fed hawkish',assets:[{name:'DXY',dir:'bullish'},{name:'USD/JPY',dir:'bullish'},{name:'EUR/USD',dir:'bearish'},{name:'Gold',dir:'bearish'},{name:'S&P 500',dir:'bearish'}]}, bear:{label:'Miss < 120K',condition:'Ralentissement, cuts juin repriced',assets:[{name:'DXY',dir:'bearish'},{name:'EUR/USD',dir:'bullish'},{name:'GBP/USD',dir:'bullish'},{name:'Gold',dir:'bullish'},{name:'S&P 500',dir:'bullish'}]}, base:{label:'In-line 160-185K',condition:'Pas de repricing Fed',assets:[{name:'DXY',dir:'neutral'},{name:'EUR/USD',dir:'neutral'}]} } },
  { id:'e8', date:'FRI', time:'08:30 ET', flag:'🇺🇸', country:'USD', event:'Unemployment Rate', impact:'high', previous:'4.1%', forecast:'4.0%', actual:'', description:'Taux chômage US. Surveiller règle de Sahm : +0.5% sur 3 mois = récession.' },
  { id:'e9', date:'FRI', time:'08:30 ET', flag:'🇺🇸', country:'USD', event:'Avg Hourly Earnings m/m', impact:'high', previous:'0.3%', forecast:'0.3%', actual:'', description:'Inflation salariale — composante clé pour la Fed. > 0.4% = hawkish fort.' },
]

const IMP = { high:{bg:'rgba(239,68,68,.12)',color:'#ef4444',border:'rgba(239,68,68,.3)',dot:'#ef4444'}, med:{bg:'rgba(240,180,41,.1)',color:'#f0b429',border:'rgba(240,180,41,.3)',dot:'#f0b429'}, low:{bg:'rgba(100,116,139,.1)',color:'#64748b',border:'rgba(100,116,139,.25)',dot:'#64748b'} }
const DIR: Record<Direction,{color:string;icon:string}> = { bullish:{color:'#22c55e',icon:'▲'}, bearish:{color:'#ef4444',icon:'▼'}, neutral:{color:'#64748b',icon:'→'} }
const DAYS = ['MON','TUE','WED','THU','FRI']

function Countdown() {
  const [t, setT] = useState('')
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const target = new Date()
      target.setHours(14,30,0,0)
      if (now > target) target.setDate(target.getDate()+1)
      const diff = target.getTime()-now.getTime()
      const h = Math.floor(diff/3600000)
      const m = Math.floor((diff%3600000)/60000)
      const s = Math.floor((diff%60000)/1000)
      setT(`${h}h ${m.toString().padStart(2,'0')}m ${s.toString().padStart(2,'0')}s`)
    }
    tick(); const id = setInterval(tick,1000); return ()=>clearInterval(id)
  },[])
  return (
    <div style={{display:'flex',alignItems:'center',gap:6,padding:'5px 10px',background:'rgba(240,180,41,.06)',border:'0.5px solid rgba(240,180,41,.2)',borderRadius:5}}>
      <span style={{width:5,height:5,borderRadius:'50%',background:'#f0b429',animation:'t-pulse 1s ease-in-out infinite',display:'inline-block'}}/>
      <span style={{fontSize:9,color:'#8a9db5'}}>Next HIGH:</span>
      <span style={{fontSize:10,fontWeight:700,color:'#f0b429',fontVariantNumeric:'tabular-nums',fontFamily:'IBM Plex Mono,monospace'}}>{t}</span>
      <span style={{fontSize:9,color:'#5a7080'}}>NFP</span>
    </div>
  )
}

function EventRow({event,selected,onSelect}:{event:CalEvent;selected:boolean;onSelect:()=>void}) {
  const imp = IMP[event.impact]
  const hasActual = event.actual !== ''
  return (
    <div>
      <div onClick={onSelect} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 12px',cursor:'pointer',borderBottom:'0.5px solid rgba(255,255,255,.04)',background:selected?'rgba(240,180,41,.04)':'transparent',borderLeft:selected?'2px solid #f0b429':'2px solid transparent',transition:'all 100ms'}} onMouseEnter={e=>{if(!selected)(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,.02)'}} onMouseLeave={e=>{if(!selected)(e.currentTarget as HTMLElement).style.background='transparent'}}>
        <span style={{width:6,height:6,borderRadius:'50%',background:imp.dot,display:'inline-block',flexShrink:0,boxShadow:`0 0 4px ${imp.dot}`}}/>
        <span style={{fontSize:9,color:'#3d5060',width:32,flexShrink:0,fontFamily:'IBM Plex Mono,monospace'}}>{event.time.split(' ')[0]}</span>
        <span style={{fontSize:12,width:20,flexShrink:0}}>{event.flag}</span>
        <span style={{fontSize:10,fontWeight:500,color:'#c8d6e5',flex:1}}>{event.event}</span>
        {event.consensus && !hasActual && <span style={{fontSize:9,color:'#5a7080',fontStyle:'italic',flexShrink:0,maxWidth:90,textAlign:'right',lineHeight:1.2}}>{event.consensus}</span>}
        <div style={{display:'flex',gap:8,flexShrink:0}}>
          {[['PREV',event.previous||'—','#5a7080'],['FORE',event.forecast||'—','#f0b429'],['ACT',event.actual||'—',hasActual?'#22c55e':'#2d3f50']].map(([l,v,c])=>(
            <div key={l as string} style={{textAlign:'right',minWidth:30}}>
              <div style={{fontSize:8,color:'#2d3f50',letterSpacing:'0.3px'}}>{l}</div>
              <div style={{fontSize:10,fontWeight:l==='ACT'?700:400,color:c as string,fontFamily:'IBM Plex Mono,monospace'}}>{v}</div>
            </div>
          ))}
        </div>
        <span style={{fontSize:9,fontWeight:700,padding:'2px 5px',borderRadius:3,background:imp.bg,color:imp.color,border:`0.5px solid ${imp.border}`,letterSpacing:'0.3px',flexShrink:0}}>{event.impact.toUpperCase()}</span>
        <span style={{fontSize:9,color:'#3d5060',transition:'transform 150ms',transform:selected?'rotate(180deg)':'none',flexShrink:0}}>▾</span>
      </div>

      {selected && (
        <div style={{padding:'10px 14px 12px 22px',background:'rgba(0,0,0,.2)',borderBottom:'0.5px solid rgba(255,255,255,.06)'}}>
          {event.description && <p style={{fontSize:11,color:'#7a8fa8',lineHeight:1.6,marginBottom:8}}>{event.description}</p>}
          {event.whisper && (
            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10,padding:'5px 8px',background:'rgba(240,180,41,.06)',border:'0.5px solid rgba(240,180,41,.15)',borderRadius:4}}>
              <span style={{fontSize:10}}>💬</span>
              <span style={{fontSize:10,color:'#f0b429',fontWeight:600}}>Whisper :</span>
              <span style={{fontSize:10,color:'#c8d6e5'}}>{event.whisper}</span>
            </div>
          )}
          {event.scenarios && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6}}>
              {([['bull','🟢 BULLISH','rgba(34,197,94,.05)','rgba(34,197,94,.2)'],['bear','🔴 BEARISH','rgba(239,68,68,.05)','rgba(239,68,68,.2)'],['base','🟡 BASE CASE','rgba(240,180,41,.05)','rgba(240,180,41,.2)']] as const).map(([k,lbl,bg,border])=>{
                const s = event.scenarios![k as 'bull'|'bear'|'base']
                return (
                  <div key={k} style={{padding:8,borderRadius:5,background:bg,border:`0.5px solid ${border}`}}>
                    <div style={{fontSize:9,fontWeight:700,color:'#8a9db5',marginBottom:3,letterSpacing:'0.4px'}}>{lbl}</div>
                    <div style={{fontSize:10,fontWeight:600,color:'#c8d6e5',marginBottom:3}}>{s.label}</div>
                    <div style={{fontSize:9,color:'#5a7080',marginBottom:6,lineHeight:1.4}}>{s.condition}</div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:3}}>
                      {s.assets.map(a=>(
                        <span key={a.name} style={{display:'inline-flex',alignItems:'center',gap:2,fontSize:9,fontWeight:600,padding:'2px 5px',borderRadius:3,background:a.dir==='bullish'?'rgba(34,197,94,.1)':a.dir==='bearish'?'rgba(239,68,68,.1)':'rgba(100,116,139,.1)',color:DIR[a.dir].color,border:`0.5px solid ${DIR[a.dir].color}33`}}>
                          {DIR[a.dir].icon} {a.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function CalendarPanel() {
  const [selectedId, setSelectedId] = useState<string|null>('e4')
  const [filterImpact, setFilterImpact] = useState<Impact|'all'>('all')
  const [activeDay, setActiveDay] = useState('ALL')

  const filtered = EVENTS.filter(e => {
    if (filterImpact !== 'all' && e.impact !== filterImpact) return false
    if (activeDay !== 'ALL' && e.date !== activeDay) return false
    return true
  })

  const highCount = EVENTS.filter(e=>e.impact==='high').length

  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',background:'var(--t-surface-base)',fontFamily:"'Inter',-apple-system,sans-serif"}}>
      {/* Header */}
      <div style={{padding:'8px 12px',borderBottom:'0.5px solid rgba(255,255,255,.06)',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:10,fontWeight:700,letterSpacing:'0.8px',color:'#8a9db5',textTransform:'uppercase'}}>Economic Calendar</span>
            <span style={{fontSize:9,padding:'1px 5px',borderRadius:3,background:'rgba(239,68,68,.12)',color:'#ef4444',border:'0.5px solid rgba(239,68,68,.3)',fontWeight:700}}>{highCount} HIGH IMPACT</span>
          </div>
          <Countdown />
        </div>
        {/* Filters */}
        <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
          {['ALL',...DAYS].map(d=>(
            <button key={d} onClick={()=>setActiveDay(d)} style={{padding:'3px 7px',borderRadius:3,fontSize:9,fontWeight:600,letterSpacing:'0.4px',cursor:'pointer',border:'0.5px solid',transition:'all 100ms',background:activeDay===d?'rgba(240,180,41,.12)':'transparent',borderColor:activeDay===d?'rgba(240,180,41,.35)':'rgba(255,255,255,.07)',color:activeDay===d?'#f0b429':'#5a7080'}}>{d}</button>
          ))}
          <div style={{flex:1}}/>
          {(['all','high','med','low'] as const).map(i=>(
            <button key={i} onClick={()=>setFilterImpact(i)} style={{padding:'3px 7px',borderRadius:3,fontSize:9,fontWeight:600,letterSpacing:'0.4px',cursor:'pointer',border:'0.5px solid',transition:'all 100ms',background:filterImpact===i?(i==='high'?'rgba(239,68,68,.12)':i==='med'?'rgba(240,180,41,.1)':i==='low'?'rgba(100,116,139,.1)':'rgba(255,255,255,.06)'):'transparent',borderColor:filterImpact===i?(i==='high'?'rgba(239,68,68,.3)':i==='med'?'rgba(240,180,41,.3)':i==='low'?'rgba(100,116,139,.25)':'rgba(255,255,255,.15)'):'rgba(255,255,255,.06)',color:filterImpact===i?(i==='high'?'#ef4444':i==='med'?'#f0b429':i==='low'?'#64748b':'#c8d6e5'):'#3d5060'}}>{i==='all'?'ALL':i.toUpperCase()}</button>
          ))}
        </div>
      </div>

      {/* List */}
      <div style={{flex:1,overflowY:'auto'}}>
        {DAYS.filter(d=>activeDay==='ALL'||d===activeDay).map(day=>{
          const dayEvents = filtered.filter(e=>e.date===day)
          if (!dayEvents.length) return null
          return (
            <div key={day}>
              <div style={{display:'flex',alignItems:'center',gap:8,padding:'4px 12px',background:'rgba(255,255,255,.015)',borderBottom:'0.5px solid rgba(255,255,255,.04)',borderTop:'0.5px solid rgba(255,255,255,.04)'}}>
                <span style={{fontSize:9,fontWeight:700,color:'#f0b429',letterSpacing:'0.6px'}}>{day}</span>
                <div style={{flex:1,height:'0.5px',background:'rgba(255,255,255,.04)'}}/>
                {dayEvents.some(e=>e.impact==='high') && <span style={{fontSize:9,color:'#ef4444',fontWeight:600}}>● HIGH IMPACT</span>}
                <span style={{fontSize:9,color:'#3d5060'}}>{dayEvents.length} events</span>
              </div>
              {dayEvents.map(event=>(
                <EventRow key={event.id} event={event} selected={selectedId===event.id} onSelect={()=>setSelectedId(selectedId===event.id?null:event.id)}/>
              ))}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{padding:'5px 12px',borderTop:'0.5px solid rgba(255,255,255,.04)',flexShrink:0}}>
        <span style={{fontSize:9,color:'#2d3f50'}}>Horaires en ET (Eastern Time) • Cliquez sur un event pour les scénarios de trading</span>
      </div>
    </div>
  )
}
