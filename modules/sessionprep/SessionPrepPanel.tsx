'use client'
import { useState } from 'react'
import { SESSION_PREP, TRADING_SESSIONS } from '@/lib/data'
import { isSessionActive } from '@/lib/utils'

type SessionKey = 'LONDON' | 'NY' | 'ASIA'
const SESSION_KEYS: SessionKey[] = ['LONDON','NY','ASIA']
const SESSION_COLORS: Record<SessionKey,string> = { LONDON:'#378add', NY:'#22c55e', ASIA:'#7f77dd' }
const SESSION_UTCS: Record<SessionKey,[number,number]> = { LONDON:[7,16], NY:[13,22], ASIA:[0,9] }
const SESSION_LABELS: Record<SessionKey,string> = { LONDON:'LONDON', NY:'NEW YORK', ASIA:'ASIA' }

export function SessionPrepPanel() {
  const [active, setActive] = useState<SessionKey>('LONDON')
  const data = SESSION_PREP[active]
  if (!data) return null

  const bias  = (data as any).bias ?? (data as any).biases ?? []
  const levels = ((data as any).levels ?? []).map((l: any) =>
    Array.isArray(l) ? { label: l[0], value: l[1] } : l
  )

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      <div style={{display:'flex',background:'#0d1117',borderBottom:'1px solid #1e2530',flexShrink:0}}>
        {SESSION_KEYS.map(key => {
          const [start,end] = SESSION_UTCS[key]
          const isLive = isSessionActive(start, end)
          const isActive = active === key
          const color = SESSION_COLORS[key]
          return (
            <button key={key} onClick={() => setActive(key)} style={{
              flex:1, padding:'6px 4px', fontSize:9, fontFamily:'inherit',
              background:isActive?'#131821':'transparent',
              border:'none', borderBottom:`2px solid ${isActive?color:'transparent'}`,
              color:isActive?color:'#5a6373', cursor:'pointer', transition:'all .1s',
              display:'flex', alignItems:'center', justifyContent:'center', gap:4,
            }}>
              {isLive && <span style={{width:5,height:5,borderRadius:'50%',background:color}}/>}
              {key}
            </button>
          )
        })}
      </div>
      <div style={{flex:1,overflowY:'auto',padding:8}}>
        <div style={{marginBottom:8,padding:'5px 8px',background:'#131821',borderRadius:2,border:'0.5px solid #1e2530'}}>
          <div style={{fontSize:8,color:'#5a6373',letterSpacing:'.5px',marginBottom:2}}>FOCUS</div>
          <div style={{fontSize:9,color:'#f0b429'}}>{data.focus}</div>
        </div>
        <div style={{marginBottom:8}}>
          <div style={{fontSize:8,color:'#5a6373',letterSpacing:'.8px',marginBottom:4}}>SESSION BIAS</div>
          {bias.map((b: any) => {
            const col = b.direction==='Bullish'?'#22c55e':b.direction==='Bearish'?'#ef4444':'#f0b429'
            return (
              <div key={b.pair} style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                <span style={{fontSize:9,color:'#8a9ab0',width:56}}>{b.pair}</span>
                <div style={{flex:1,height:3,background:'#131821',borderRadius:1,overflow:'hidden',margin:'0 6px'}}>
                  <div style={{width:`${b.confidence}%`,height:'100%',background:col,borderRadius:1}}/>
                </div>
                <span style={{fontSize:9,fontWeight:700,color:col,width:46,textAlign:'right'}}>{b.direction}</span>
              </div>
            )
          })}
        </div>
        <div>
          <div style={{fontSize:8,color:'#5a6373',letterSpacing:'.8px',marginBottom:4}}>KEY LEVELS</div>
          {levels.map((l: any) => (
            <div key={l.label} style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
              <span style={{fontSize:9,color:'#5a6373'}}>{l.label}</span>
              <span style={{fontSize:9,color:'#f0b429',fontVariantNumeric:'tabular-nums'}}>{l.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
