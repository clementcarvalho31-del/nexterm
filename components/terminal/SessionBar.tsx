'use client'
import { TRADING_SESSIONS, TICKER_ITEMS } from '@/lib/data'
import { isSessionActive } from '@/lib/utils'

export function SessionBar() {
  return (
    <div style={{ display:'flex', alignItems:'center', background:'var(--t-surface-base)', borderBottom:'0.5px solid var(--t-border-subtle)', height:28, flexShrink:0, overflow:'hidden' }}>
      {/* Sessions */}
      {TRADING_SESSIONS.map(s => {
        const active = isSessionActive(s.startUTC, s.endUTC)
        return (
          <div key={s.name} style={{ display:'flex', alignItems:'center', gap:5, padding:'0 12px', borderRight:'0.5px solid var(--t-border-subtle)', height:'100%', flexShrink:0 }}>
            <span style={{ width:5, height:5, borderRadius:'50%', background:s.color, display:'inline-block', opacity:active?1:0.35 }} />
            <span style={{ fontSize:10, fontFamily:'var(--t-font-mono)', color:active?'var(--t-text-secondary)':'var(--t-text-disabled)', letterSpacing:'0.3px', fontWeight:active?600:400 }}>
              {s.name}
            </span>
          </div>
        )
      })}

      {/* Ticker */}
      <div style={{ flex:1, overflow:'hidden' }}>
        <div style={{ display:'flex', animation:'t-scroll-x 60s linear infinite', whiteSpace:'nowrap' }}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:6, padding:'0 16px', borderRight:'0.5px solid var(--t-border-subtle)', fontSize:10, fontFamily:'var(--t-font-mono)' }}>
              <span style={{ padding:'1px 5px', borderRadius:3, fontSize:9, fontWeight:600,
                background: item.cls==='th'?'var(--t-impact-high-bg)':item.cls==='tm'?'var(--t-impact-med-bg)':'var(--t-impact-low-bg)',
                color:      item.cls==='th'?'var(--t-impact-high)':item.cls==='tm'?'var(--t-impact-med)':'var(--t-impact-low)',
              }}>{item.tag}</span>
              <span style={{ color:'var(--t-text-muted)' }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
