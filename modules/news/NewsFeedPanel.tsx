'use client'
import { useTerminalStore } from '@/store/terminal'
import { NEWS_FEED } from '@/lib/data'

const IMPACT_CFG = {
  high: { dot: '#ef4444', bg: 'rgba(239,68,68,.06)', label: 'HIGH' },
  med:  { dot: '#f0b429', bg: 'rgba(240,180,41,.04)', label: 'MED' },
  low:  { dot: '#3b82f6', bg: 'transparent', label: 'LOW' },
}

export function NewsFeedPanel() {
  const squawkEnabled = useTerminalStore(s => s.squawkEnabled)
  const toggleSquawk  = useTerminalStore(s => s.toggleSquawk)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#04070f' }}>

      {/* Header */}
      <div style={{
        padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        background: 'rgba(255,255,255,.01)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{
            fontSize: 7, fontWeight: 700, letterSpacing: '1.5px', color: '#2d3f50',
            fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
          }}>Macro Feed</span>
          <span style={{
            width: 4, height: 4, borderRadius: '50%', background: '#ef4444',
            display: 'inline-block', animation: 'pulse-live 2s ease-in-out infinite',
          }} />
        </div>
        <span style={{ fontSize: 7, color: '#1e2c3a', fontFamily: 'var(--font-mono)' }}>
          {NEWS_FEED.length} items
        </span>
      </div>

      {/* Squawk bar */}
      <button onClick={toggleSquawk} style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px',
        borderBottom: '1px solid rgba(255,255,255,.04)',
        background: squawkEnabled ? 'rgba(240,180,41,.04)' : 'transparent',
        cursor: 'pointer', border: 'none', width: '100%', textAlign: 'left',
        transition: 'background 150ms', flexShrink: 0,
      }}>
        <span style={{ fontSize: 11 }}>{squawkEnabled ? '🔊' : '🔇'}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 8, color: squawkEnabled ? '#f0b429' : '#2d3f50', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
            {squawkEnabled ? 'SQUAWK ACTIVE' : 'SQUAWK OFF'}
          </div>
          <div style={{ fontSize: 7, color: '#1e2c3a', fontFamily: 'var(--font-mono)' }}>
            {squawkEnabled ? 'Audio alerts on' : 'Click to enable'}
          </div>
        </div>
      </button>

      {/* News list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {NEWS_FEED.map(item => {
          const cfg = IMPACT_CFG[item.impact as keyof typeof IMPACT_CFG] || IMPACT_CFG.low
          return (
            <div key={item.id} style={{
              padding: '7px 10px', borderBottom: '1px solid rgba(255,255,255,.03)',
              background: cfg.bg, cursor: 'pointer', transition: 'background 80ms',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.03)'}
              onMouseLeave={e => e.currentTarget.style.background = cfg.bg}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: cfg.dot, display: 'inline-block', flexShrink: 0 }} />
                <span style={{
                  fontSize: 7, fontWeight: 700, color: cfg.dot,
                  fontFamily: 'var(--font-mono)', letterSpacing: '0.5px',
                }}>{item.tag}</span>
                <span style={{ fontSize: 7, color: '#1e2c3a', fontFamily: 'var(--font-mono)', marginLeft: 'auto' }}>{item.time}</span>
              </div>
              <p style={{
                fontSize: 9, color: '#8a9db5', lineHeight: 1.5,
                fontFamily: 'var(--font-sans)',
              }}>{item.title}</p>
              <div style={{ fontSize: 7, color: '#1e2c3a', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{item.source}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
