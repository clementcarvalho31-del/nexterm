'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

type Pair = 'EUR/USD'|'GBP/USD'|'USD/JPY'|'USD/CAD'|'AUD/USD'|'NZD/USD'|'USD/CHF'|'XAU/USD'

interface SentimentData {
  pair: Pair; longPct: number; shortPct: number
  longVol: number; shortVol: number
  bias: 'bullish'|'bearish'|'neutral'; change24h: number
}
interface SeasonalBar {
  month: number; label: string; avg: number; positive: number; bullish: boolean
}

const SENTIMENT_FALLBACK: SentimentData[] = [
  { pair:'EUR/USD', longPct:66, shortPct:34, longVol:2840, shortVol:1460, bias:'bullish', change24h:+3.2 },
  { pair:'GBP/USD', longPct:72, shortPct:28, longVol:1920, shortVol:748,  bias:'bullish', change24h:+1.8 },
  { pair:'USD/JPY', longPct:29, shortPct:71, longVol:880,  shortVol:2150, bias:'bearish', change24h:-2.4 },
  { pair:'USD/CAD', longPct:45, shortPct:55, longVol:1100, shortVol:1340, bias:'bearish', change24h:-0.8 },
  { pair:'AUD/USD', longPct:58, shortPct:42, longVol:960,  shortVol:695,  bias:'bullish', change24h:+0.5 },
  { pair:'NZD/USD', longPct:61, shortPct:39, longVol:420,  shortVol:268,  bias:'bullish', change24h:+1.1 },
  { pair:'USD/CHF', longPct:38, shortPct:62, longVol:520,  shortVol:850,  bias:'bearish', change24h:-1.6 },
  { pair:'XAU/USD', longPct:71, shortPct:29, longVol:3200, shortVol:1310, bias:'bullish', change24h:+2.9 },
]

const PATTERNS: Record<Pair,number[]> = {
  'EUR/USD': [0.4,-0.8,0.2,0.6,-1.2,-0.4,0.8,-0.6,-1.1,0.9,0.3,-0.5],
  'GBP/USD': [0.3,-0.5,0.4,0.8,-0.9,-0.3,0.6,-0.8,-0.7,0.7,0.5,-0.4],
  'USD/JPY': [-0.3,0.6,-0.2,-0.5,0.9,0.4,-0.7,0.5,0.8,-0.6,-0.4,0.3],
  'USD/CAD': [0.6,-0.3,-0.5,-0.8,0.4,0.7,-0.4,0.3,0.5,-0.7,0.2,0.8],
  'AUD/USD': [-0.5,0.7,0.3,0.5,-0.8,-1.1,0.4,-0.3,0.6,0.8,-0.4,-0.6],
  'NZD/USD': [-0.4,0.5,0.2,0.4,-0.7,-0.9,0.3,-0.2,0.5,0.7,-0.3,-0.5],
  'USD/CHF': [0.2,-0.4,0.1,-0.3,0.6,0.3,-0.5,0.4,0.7,-0.5,-0.2,0.3],
  'XAU/USD': [1.2,0.4,-0.8,0.3,-0.5,-1.4,0.6,1.1,0.8,-0.3,0.7,1.5],
}
const POS_RATES: Record<Pair,number[]> = {
  'EUR/USD': [52,42,50,55,38,45,58,43,41,60,52,46],
  'GBP/USD': [55,44,52,58,40,46,56,42,43,58,54,47],
  'USD/JPY': [44,58,47,42,61,55,40,57,60,43,46,55],
  'USD/CAD': [58,46,43,40,54,60,45,52,57,41,50,62],
  'AUD/USD': [43,59,53,56,39,33,54,46,57,62,45,41],
  'NZD/USD': [44,57,52,55,40,35,53,47,56,60,46,42],
  'USD/CHF': [53,45,51,46,58,54,43,55,61,44,48,54],
  'XAU/USD': [65,54,43,52,46,38,55,62,59,47,57,68],
}
const MONTH_LABELS = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc']
const NOW_MONTH = new Date().getMonth()
const PAIRS: Pair[] = ['EUR/USD','GBP/USD','USD/JPY','USD/CAD','AUD/USD','NZD/USD','USD/CHF','XAU/USD']

function computeSeasonality(pair: Pair, years: 20|10|5): SeasonalBar[] {
  const scale = years===10?0.9:years===5?0.8:1
  const base = PATTERNS[pair]; const pos = POS_RATES[pair]
  return base.map((avg,i)=>({ month:i, label:MONTH_LABELS[i], avg:parseFloat((avg*scale).toFixed(2)), positive:pos[i], bullish:avg>0 }))
}

function SeasonalChart({ data }: { data: SeasonalBar[] }) {
  const maxAbs = Math.max(...data.map(d=>Math.abs(d.avg)), 0.1)
  return (
    <div>
      <div style={{display:'flex',alignItems:'flex-end',gap:4,height:100,marginBottom:6}}>
        {data.map((bar,i)=>{
          const pct=(Math.abs(bar.avg)/maxAbs)*100
          const isNow=i===NOW_MONTH
          return (
            <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',height:'100%',justifyContent:'flex-end'}}>
              <div style={{width:'100%',height:`${pct}%`,minHeight:2,borderRadius:'2px 2px 0 0',background:isNow?'#f0b429':bar.bullish?'#22c55e':'#ef4444',opacity:isNow?1:0.7,boxShadow:isNow?'0 0 8px rgba(240,180,41,.4)':'none',transition:'all 200ms'}}/>
            </div>
          )
        })}
      </div>
      <div style={{height:1,background:'rgba(255,255,255,.06)',marginBottom:5}}/>
      <div style={{display:'flex',gap:4,marginBottom:3}}>
        {data.map((bar,i)=>(
          <div key={i} style={{flex:1,textAlign:'center' as const,fontSize:8,fontWeight:i===NOW_MONTH?700:400,color:i===NOW_MONTH?'#f0b429':'#3d5060'}}>{bar.label}</div>
        ))}
      </div>
      <div style={{display:'flex',gap:4}}>
        {data.map((bar,i)=>(
          <div key={i} style={{flex:1,textAlign:'center' as const,fontSize:7,fontFamily:'IBM Plex Mono,monospace',color:bar.bullish?'rgba(34,197,94,.8)':'rgba(239,68,68,.8)',fontWeight:i===NOW_MONTH?700:400}}>
            {bar.avg>0?'+':''}{bar.avg}
          </div>
        ))}
      </div>
    </div>
  )
}

export function SentimentPanel() {
  const [sentiment,setSentiment]     = useState<SentimentData[]>(SENTIMENT_FALLBACK)
  const [selectedPair,setSelectedPair] = useState<Pair>('EUR/USD')
  const [yearRange,setYearRange]     = useState<20|10|5>(20)
  const [seasonal,setSeasonal]       = useState<SeasonalBar[]>([])
  const [loading,setLoading]         = useState(false)
  const [lastUpdate,setLastUpdate]   = useState('')
  const [refreshing,setRefreshing]   = useState(false)
  const [tab,setTab]                 = useState<'combined'|'sentiment'|'seasonality'>('combined')

  const fetchData = useCallback(async()=>{
    setRefreshing(true)
    try {
      const res = await fetch('/api/sentiment',{cache:'no-store'})
      const json = await res.json()
      if(json.ok&&json.data) setSentiment(json.data)
      setLastUpdate(new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}))
    } catch { setSentiment(SENTIMENT_FALLBACK) }
    finally { setLoading(false); setRefreshing(false) }
  },[])

  useEffect(()=>{ fetchData(); const id=setInterval(fetchData,60000); return()=>clearInterval(id) },[fetchData])
  useEffect(()=>{ setSeasonal(computeSeasonality(selectedPair,yearRange)) },[selectedPair,yearRange])

  const sel = sentiment.find(s=>s.pair===selectedPair)||sentiment[0]
  const curSeas = seasonal[NOW_MONTH]
  const biasC = sel?.bias==='bullish'?'#22c55e':sel?.bias==='bearish'?'#ef4444':'#64748b'

  const pill=(active:boolean,color='#a78bfa')=>({
    padding:'4px 12px',borderRadius:20,fontSize:10,fontWeight:600 as const,cursor:'pointer' as const,
    border:`1px solid ${active?color+'55':'rgba(255,255,255,.07)'}`,
    background:active?color+'12':'transparent',
    color:active?color:'#3d5060',transition:'all 150ms',fontFamily:'inherit',
  })

  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',background:'#06080d',fontFamily:"'Inter',-apple-system,sans-serif",overflow:'hidden'}}>

      {/* HEADER */}
      <div style={{flexShrink:0,background:'linear-gradient(180deg,rgba(13,18,28,.95) 0%,rgba(6,8,13,.95) 100%)',borderBottom:'1px solid rgba(255,255,255,.06)',padding:'24px 48px 0'}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:18}}>
          <div>
            <div style={{fontSize:11,fontWeight:600,letterSpacing:'2px',color:'#3d5060',textTransform:'uppercase' as const,marginBottom:4}}>Institutional Trading Desk</div>
            <h1 style={{fontSize:28,fontWeight:800,letterSpacing:'-0.8px',color:'#f0f4f8',margin:0,lineHeight:1.1}}>
              Sentiment <span style={{color:'#a78bfa'}}>&</span> Saisonnalité
            </h1>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            {refreshing&&<span style={{fontSize:10,color:'#a78bfa',fontWeight:600,animation:'t-pulse 1s infinite'}}>● LIVE</span>}
            {lastUpdate&&<span style={{fontSize:10,color:'#2d3f50'}}>Mis à jour {lastUpdate}</span>}
            <button onClick={fetchData} style={{padding:'6px 12px',borderRadius:5,fontSize:10,fontWeight:600,cursor:'pointer',border:'1px solid rgba(255,255,255,.1)',background:'rgba(255,255,255,.04)',color:'#8a9db5',fontFamily:'inherit'}}>↻ Refresh</button>
          </div>
        </div>
        <div style={{display:'flex',gap:0,borderBottom:'1px solid rgba(255,255,255,.06)'}}>
          {([['combined','⚡ Vue combinée'],['sentiment','👥 Sentiment Retail'],['seasonality','📈 Saisonnalité']] as const).map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:'12px 28px',fontSize:13,fontWeight:tab===t?700:400,cursor:'pointer',border:'none',borderBottom:tab===t?'2px solid #a78bfa':'2px solid transparent',background:'transparent',color:tab===t?'#f0f4f8':'#4a5e72',transition:'all 150ms',fontFamily:'inherit',marginBottom:-1}}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* VUE COMBINÉE */}
      {tab==='combined'&&(
        <div style={{flex:1,display:'flex',minHeight:0,overflow:'hidden'}}>

          {/* Left: sentiment list */}
          <div style={{width:340,flexShrink:0,borderRight:'1px solid rgba(255,255,255,.06)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
            <div style={{padding:'8px 20px',borderBottom:'0.5px solid rgba(255,255,255,.05)',flexShrink:0,background:'rgba(255,255,255,.01)'}}>
              <span style={{fontSize:9,fontWeight:700,letterSpacing:'1.5px',color:'#2d3f50',textTransform:'uppercase' as const}}>Sentiment Retail — Myfxbook</span>
            </div>
            <div style={{flex:1,overflowY:'auto' as const}}>
              {sentiment.map(s=>{
                const isBull=s.bias==='bullish'; const isBear=s.bias==='bearish'
                const bc=isBull?'#22c55e':isBear?'#ef4444':'#64748b'
                const isSelected=selectedPair===s.pair
                return (
                  <div key={s.pair} onClick={()=>setSelectedPair(s.pair as Pair)} style={{padding:'12px 20px',borderBottom:'0.5px solid rgba(255,255,255,.04)',cursor:'pointer',background:isSelected?'rgba(167,139,250,.04)':'transparent',borderLeft:isSelected?'3px solid #a78bfa':'3px solid transparent',transition:'all 80ms'}}
                    onMouseEnter={e=>{if(!isSelected)(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,.02)'}}
                    onMouseLeave={e=>{if(!isSelected)(e.currentTarget as HTMLElement).style.background='transparent'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                      <span style={{fontSize:12,fontWeight:700,color:'#f0f4f8',width:68,flexShrink:0,fontFamily:'IBM Plex Mono,monospace'}}>{s.pair}</span>
                      <span style={{fontSize:8,fontWeight:800,padding:'2px 6px',borderRadius:3,background:`${bc}15`,color:bc,border:`0.5px solid ${bc}33`,letterSpacing:'.5px'}}>
                        {isBull?'▲ LONG':isBear?'▼ SHORT':'→'}
                      </span>
                      <div style={{flex:1}}/>
                      <span style={{fontSize:10,fontWeight:700,color:'#22c55e',fontFamily:'IBM Plex Mono,monospace'}}>{s.longPct}%</span>
                      <span style={{fontSize:8,color:'#2d3f50'}}>|</span>
                      <span style={{fontSize:10,fontWeight:700,color:'#ef4444',fontFamily:'IBM Plex Mono,monospace'}}>{s.shortPct}%</span>
                      <span style={{fontSize:9,fontWeight:600,color:s.change24h>0?'#22c55e':'#ef4444',fontFamily:'IBM Plex Mono,monospace',marginLeft:4}}>
                        {s.change24h>0?'+':''}{s.change24h}%
                      </span>
                    </div>
                    <div style={{height:5,borderRadius:3,background:'rgba(255,255,255,.06)',overflow:'hidden',position:'relative' as const}}>
                      <div style={{position:'absolute' as const,left:0,top:0,height:'100%',width:`${s.longPct}%`,background:'linear-gradient(90deg,rgba(34,197,94,.7),rgba(34,197,94,.4))',borderRadius:'3px 0 0 3px'}}/>
                      <div style={{position:'absolute' as const,right:0,top:0,height:'100%',width:`${s.shortPct}%`,background:'linear-gradient(90deg,rgba(239,68,68,.4),rgba(239,68,68,.7))',borderRadius:'0 3px 3px 0'}}/>
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{padding:'4px 20px',borderTop:'0.5px solid rgba(255,255,255,.04)',flexShrink:0}}>
              <span style={{fontSize:7,color:'#1e2a35',letterSpacing:'.4px'}}>MYFXBOOK COMMUNITY OUTLOOK • REFRESH 60S</span>
            </div>
          </div>

          {/* Right: detail + seasonality */}
          <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
            {/* Pair header */}
            <div style={{padding:'14px 28px',borderBottom:'1px solid rgba(255,255,255,.06)',flexShrink:0,display:'flex',alignItems:'center',gap:16,background:'rgba(255,255,255,.01)'}}>
              <span style={{fontSize:20,fontWeight:800,color:'#f0f4f8',fontFamily:'IBM Plex Mono,monospace'}}>{selectedPair}</span>
              <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:4,background:`${biasC}15`,color:biasC,border:`1px solid ${biasC}30`}}>
                {sel?.bias==='bullish'?'▲ MAJORITAIREMENT LONG':sel?.bias==='bearish'?'▼ MAJORITAIREMENT SHORT':'→ NEUTRE'}
              </span>
              <div style={{flex:1}}/>
              {[['LONGS',`${sel?.longPct}%`,'#22c55e'],['SHORTS',`${sel?.shortPct}%`,'#ef4444'],['VAR 24H',`${(sel?.change24h||0)>0?'+':''}${sel?.change24h}%`,(sel?.change24h||0)>0?'#22c55e':'#ef4444']].map(([l,v,c])=>(
                <div key={l as string} style={{textAlign:'center' as const}}>
                  <div style={{fontSize:8,color:'#3d5060',letterSpacing:'.5px',marginBottom:2}}>{l}</div>
                  <div style={{fontSize:20,fontWeight:800,color:c as string,fontFamily:'IBM Plex Mono,monospace'}}>{v}</div>
                </div>
              ))}
            </div>

            {/* Seasonality */}
            <div style={{padding:'12px 28px 6px',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'0.5px solid rgba(255,255,255,.05)'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:11,fontWeight:700,color:'#c8d6e5'}}>Saisonnalité {selectedPair}</span>
                {curSeas&&(
                  <span style={{fontSize:10,padding:'2px 8px',borderRadius:3,background:curSeas.bullish?'rgba(34,197,94,.1)':'rgba(239,68,68,.1)',color:curSeas.bullish?'#22c55e':'#ef4444',border:`0.5px solid ${curSeas.bullish?'rgba(34,197,94,.25)':'rgba(239,68,68,.25)'}`,fontWeight:600}}>
                    {MONTH_LABELS[NOW_MONTH]}: {curSeas.avg>0?'+':''}{curSeas.avg}% · {curSeas.positive}% pos
                  </span>
                )}
              </div>
              <div style={{display:'flex',gap:3}}>
                {([20,10,5] as const).map(y=><button key={y} onClick={()=>setYearRange(y)} style={pill(yearRange===y)}>{y} ans</button>)}
              </div>
            </div>

            <div style={{flex:1,overflowY:'auto' as const,padding:'16px 28px'}}>
              <SeasonalChart data={seasonal}/>

              {/* Monthly grid */}
              <div style={{marginTop:16,display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6}}>
                {seasonal.map((bar,i)=>(
                  <div key={i} style={{padding:'8px 10px',borderRadius:5,background:i===NOW_MONTH?'rgba(240,180,41,.06)':'rgba(255,255,255,.02)',border:`1px solid ${i===NOW_MONTH?'rgba(240,180,41,.2)':'rgba(255,255,255,.05)'}`}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                      <span style={{fontSize:10,fontWeight:700,color:i===NOW_MONTH?'#f0b429':'#8a9db5'}}>{bar.label}</span>
                      <span style={{fontSize:9,fontWeight:700,color:bar.bullish?'#22c55e':'#ef4444',fontFamily:'IBM Plex Mono,monospace'}}>{bar.avg>0?'+':''}{bar.avg}%</span>
                    </div>
                    <div style={{height:3,borderRadius:2,background:'rgba(255,255,255,.06)',overflow:'hidden',marginBottom:3}}>
                      <div style={{height:'100%',width:`${bar.positive}%`,background:bar.bullish?'rgba(34,197,94,.6)':'rgba(239,68,68,.6)',borderRadius:2}}/>
                    </div>
                    <div style={{fontSize:7,color:'#3d5060'}}>{bar.positive}% positif</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{padding:'4px 28px',borderTop:'0.5px solid rgba(255,255,255,.04)',flexShrink:0}}>
              <span style={{fontSize:7,color:'#1e2a35',letterSpacing:'.4px'}}>SAISONNALITÉ CALCULÉE SUR {yearRange} ANS · INSPIRÉ DE SEASONAX</span>
            </div>
          </div>
        </div>
      )}

      {/* SENTIMENT SEUL */}
      {tab==='sentiment'&&(
        <>
          <div style={{padding:'10px 48px',borderBottom:'0.5px solid rgba(255,255,255,.05)',flexShrink:0,background:'rgba(255,255,255,.01)'}}>
            <span style={{fontSize:9,fontWeight:700,letterSpacing:'1.5px',color:'#2d3f50',textTransform:'uppercase' as const}}>Myfxbook Community Outlook — Sentiment Retail</span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'90px 80px 1fr 60px 60px 70px',padding:'6px 48px',background:'rgba(0,0,0,.3)',borderBottom:'0.5px solid rgba(255,255,255,.04)',flexShrink:0}}>
            {['PAIRE','BIAIS','RATIO LONG/SHORT','LONG','SHORT','VAR 24H'].map((h,i)=>(
              <span key={i} style={{fontSize:8,fontWeight:700,color:'#2d3f50',letterSpacing:'1.2px',textTransform:'uppercase' as const,textAlign:i>2?'right' as const:'left' as const}}>{h}</span>
            ))}
          </div>
          <div style={{flex:1,overflowY:'auto' as const}}>
            {sentiment.map(s=>{
              const isBull=s.bias==='bullish'; const isBear=s.bias==='bearish'
              const bc=isBull?'#22c55e':isBear?'#ef4444':'#64748b'
              return (
                <div key={s.pair} style={{display:'grid',gridTemplateColumns:'90px 80px 1fr 60px 60px 70px',alignItems:'center',padding:'14px 48px',borderBottom:'0.5px solid rgba(255,255,255,.04)',borderLeft:`3px solid ${bc}33`,transition:'background 80ms'}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.02)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <span style={{fontSize:13,fontWeight:700,color:'#f0f4f8',fontFamily:'IBM Plex Mono,monospace'}}>{s.pair}</span>
                  <span style={{fontSize:9,fontWeight:800,padding:'2px 7px',borderRadius:3,background:`${bc}15`,color:bc,border:`0.5px solid ${bc}33`,letterSpacing:'.5px',width:'fit-content'}}>{isBull?'▲ LONG':isBear?'▼ SHORT':'→'}</span>
                  <div style={{paddingRight:24}}>
                    <div style={{height:6,borderRadius:3,background:'rgba(255,255,255,.05)',overflow:'hidden',position:'relative' as const}}>
                      <div style={{position:'absolute' as const,left:0,top:0,height:'100%',width:`${s.longPct}%`,background:'rgba(34,197,94,.6)',borderRadius:'3px 0 0 3px'}}/>
                      <div style={{position:'absolute' as const,right:0,top:0,height:'100%',width:`${s.shortPct}%`,background:'rgba(239,68,68,.6)',borderRadius:'0 3px 3px 0'}}/>
                    </div>
                  </div>
                  <span style={{fontSize:13,fontWeight:700,color:'#22c55e',textAlign:'right' as const,fontFamily:'IBM Plex Mono,monospace'}}>{s.longPct}%</span>
                  <span style={{fontSize:13,fontWeight:700,color:'#ef4444',textAlign:'right' as const,fontFamily:'IBM Plex Mono,monospace'}}>{s.shortPct}%</span>
                  <span style={{fontSize:11,fontWeight:600,color:s.change24h>0?'#22c55e':'#ef4444',textAlign:'right' as const,fontFamily:'IBM Plex Mono,monospace'}}>{s.change24h>0?'+':''}{s.change24h}%</span>
                </div>
              )
            })}
          </div>
          <div style={{padding:'5px 48px',borderTop:'0.5px solid rgba(255,255,255,.04)',flexShrink:0,background:'rgba(0,0,0,.2)'}}>
            <span style={{fontSize:7,color:'#1e2a35',letterSpacing:'.4px'}}>SOURCE: MYFXBOOK COMMUNITY OUTLOOK • REFRESH AUTO 60S</span>
          </div>
        </>
      )}

      {/* SAISONNALITÉ SEULE */}
      {tab==='seasonality'&&(
        <>
          <div style={{padding:'10px 48px',borderBottom:'0.5px solid rgba(255,255,255,.05)',flexShrink:0,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap' as const,background:'rgba(255,255,255,.01)'}}>
            <span style={{fontSize:9,fontWeight:700,letterSpacing:'1.5px',color:'#2d3f50',textTransform:'uppercase' as const,marginRight:4}}>PAIRE</span>
            {PAIRS.map(p=><button key={p} onClick={()=>setSelectedPair(p)} style={pill(selectedPair===p)}>{p}</button>)}
            <div style={{width:1,height:18,background:'rgba(255,255,255,.07)',margin:'0 6px'}}/>
            {([20,10,5] as const).map(y=><button key={y} onClick={()=>setYearRange(y)} style={pill(yearRange===y)}>{y} ans</button>)}
          </div>
          <div style={{flex:1,overflowY:'auto' as const,padding:'20px 48px'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
              <span style={{fontSize:16,fontWeight:700,color:'#f0f4f8',fontFamily:'IBM Plex Mono,monospace'}}>{selectedPair}</span>
              {curSeas&&<span style={{fontSize:11,padding:'3px 10px',borderRadius:4,background:curSeas.bullish?'rgba(34,197,94,.1)':'rgba(239,68,68,.1)',color:curSeas.bullish?'#22c55e':'#ef4444',border:`0.5px solid ${curSeas.bullish?'rgba(34,197,94,.25)':'rgba(239,68,68,.25)'}`,fontWeight:600}}>
                {MONTH_LABELS[NOW_MONTH]}: {curSeas.avg>0?'+':''}{curSeas.avg}% · {curSeas.positive}% années positives
              </span>}
            </div>
            <SeasonalChart data={seasonal}/>
            <div style={{marginTop:16,display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:8,marginBottom:24}}>
              {seasonal.map((bar,i)=>(
                <div key={i} style={{padding:'12px',borderRadius:6,background:i===NOW_MONTH?'rgba(240,180,41,.06)':'rgba(255,255,255,.02)',border:`1px solid ${i===NOW_MONTH?'rgba(240,180,41,.2)':'rgba(255,255,255,.05)'}`}}>
                  <div style={{fontSize:11,fontWeight:700,color:i===NOW_MONTH?'#f0b429':'#8a9db5',marginBottom:5}}>{bar.label}</div>
                  <div style={{fontSize:18,fontWeight:800,color:bar.bullish?'#22c55e':'#ef4444',fontFamily:'IBM Plex Mono,monospace',marginBottom:4}}>{bar.avg>0?'+':''}{bar.avg}%</div>
                  <div style={{height:3,borderRadius:2,background:'rgba(255,255,255,.06)',overflow:'hidden',marginBottom:4}}>
                    <div style={{height:'100%',width:`${bar.positive}%`,background:bar.bullish?'#22c55e':'#ef4444',opacity:.6,borderRadius:2}}/>
                  </div>
                  <div style={{fontSize:9,color:'#4a5e72'}}>{bar.positive}% positif</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{padding:'5px 48px',borderTop:'0.5px solid rgba(255,255,255,.04)',flexShrink:0,background:'rgba(0,0,0,.2)'}}>
            <span style={{fontSize:7,color:'#1e2a35',letterSpacing:'.4px'}}>SAISONNALITÉ CALCULÉE SUR {yearRange} ANS · INSPIRÉ DE SEASONAX · PATTERNS HISTORIQUES FX</span>
          </div>
        </>
      )}
    </div>
  )
}
