'use client'
import { useState, useMemo } from 'react'
import { useTerminalStore } from '@/store/terminal'
import { NEWS_FEED } from '@/lib/data'
import { PanelShell, TagBadge } from '@/components/ui'
import { SessionPrepPanel } from '@/modules/sessionprep/SessionPrepPanel'
import type { NewsImpact } from '@/types'

function SquawkBar() {
  const squawkEnabled = useTerminalStore(s => s.squawkEnabled)
  const toggleSquawk  = useTerminalStore(s => s.toggleSquawk)
  return (
    <button
      onClick={toggleSquawk}
      style={{
        display:'flex', alignItems:'center', gap:6, background:'#131821',
        borderBottom:'0.5px solid #1e2530', padding:'4px 8px', cursor:'pointer',
        width:'100%', fontFamily:'inherit', border:'none',
        
      }}
    >
      <span style={{ color:'#f0b429', fontSize:12 }}>{squawkEnabled ? '🔊' : '🔇'}</span>
      <span style={{ fontSize:9, color:'#8a9ab0', flex:1, textAlign:'left' }}>
        {squawkEnabled ? 'Squawk ON — live' : 'Audio squawk off'}
      </span>
      <span style={{ fontSize:8, fontWeight:700, color: squawkEnabled ? '#22c55e' : '#5a6373' }}>
        {squawkEnabled ? 'LIVE' : 'OFF'}
      </span>
    </button>
  )
}

type Filter = 'all' | 'high' | 'med'

export function NewsFeedPanel() {
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = useMemo(() =>
    filter === 'all' ? NEWS_FEED : NEWS_FEED.filter(n => n.impact === filter),
    [filter]
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      {/* News section — takes ~60% */}
      <div style={{ flex:'0 0 60%', display:'flex', flexDirection:'column', borderBottom:'1px solid #1e2530', overflow:'hidden' }}>
        <div style={{ background:'#0f1520', borderBottom:'1px solid #1e2530', padding:'4px 8px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <span style={{ fontSize:9, color:'#5a6373', letterSpacing:'0.8px' }}>MACRO NEWS</span>
          <div style={{ display:'flex', gap:6 }}>
            {(['all','high','med'] as Filter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{ fontSize:8, color:filter===f?'#f0b429':'#5a6373', background:'transparent', border:'none', cursor:'pointer', fontFamily:'inherit', padding:0 }}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <SquawkBar />
        <div style={{ overflowY:'auto', flex:1 }}>
          {filtered.map(item => {
            const cls = item.impact==='high' ? 'tag-high' : item.impact==='med' ? 'tag-med' : 'tag-info'
            return (
              <div
                key={item.id}
                style={{ padding:'5px 8px', borderBottom:'0.5px solid #1e2530', cursor:'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background='#131821')}
                onMouseLeave={e => (e.currentTarget.style.background='transparent')}
              >
                <div style={{ display:'flex', alignItems:'center', gap:3, marginBottom:2 }}>
                  <TagBadge tag={item.tag} cls={cls} />
                  <span style={{ fontSize:8, color:'#5a6373' }}>{item.source}</span>
                  <span style={{ fontSize:8, color:'#5a6373', marginLeft:'auto' }}>{item.time}</span>
                </div>
                <div style={{ fontSize:10, color:'#e2e8f0', lineHeight:1.3 }}>{item.title}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Session prep — takes ~40% */}
      <div style={{ flex:'0 0 40%', overflow:'hidden' }}>
        <SessionPrepPanel />
      </div>
    </div>
  )
}
