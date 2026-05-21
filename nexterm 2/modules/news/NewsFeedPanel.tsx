'use client'
import { useTerminalStore } from '@/store/terminal'
import { NEWS_FEED } from '@/lib/data'

const IMPACT: Record<string, { dot: string; label: string; lineBg: string }> = {
  high: { dot: '#ef4444', label: 'HIGH', lineBg: 'rgba(239,68,68,.06)' },
  med:  { dot: '#f0b429', label: 'MED',  lineBg: 'rgba(240,180,41,.03)' },
  low:  { dot: '#3b82f6', label: 'LOW',  lineBg: 'transparent' },
}

export function NewsFeedPanel() {
  const squawkEnabled = useTerminalStore(s => s.squawkEnabled)
  const toggleSquawk  = useTerminalStore(s => s.toggleSquawk)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--t-surface-base)' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 10px', height: 32, flexShrink: 0,
        background: 'var(--t-surface-elevated)',
        borderBottom: '0.5px solid var(--t-border-default)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '1.3px', color: 'var(--t-text-muted)', fontFamily: 'var(--t-font-mono)', textTransform: 'uppercase' }}>News Feed</span>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 't-pulse 2s ease-in-out infinite', boxShadow: '0 0 5px rgba(239,68,68,.6)' }}/>
        </div>
        <span style={{ fontSize: 8, color: 'var(--t-text-disabled)', fontFamily: 'var(--t-font-mono)' }}>{NEWS_FEED.length}</span>
      </div>

      {/* Squawk toggle */}
      <button onClick={toggleSquawk} style={{
        display: 'flex', alignItems: 'center', gap: 7, padding: '5px 10px',
        borderBottom: '0.5px solid var(--t-border-default)', flexShrink: 0,
        background: squawkEnabled ? 'rgba(240,180,41,.04)' : 'transparent',
        border: 'none', width: '100%', cursor: 'pointer', transition: 'background 150ms',
        textAlign: 'left',
      }}>
        <span style={{ fontSize: 11 }}>{squawkEnabled ? '🔊' : '🔇'}</span>
        <div>
          <div style={{ fontSize: 8, fontWeight: 600, fontFamily: 'var(--t-font-mono)', letterSpacing: '0.5px', color: squawkEnabled ? 'var(--t-accent-primary)' : 'var(--t-text-disabled)' }}>
            {squawkEnabled ? 'SQUAWK LIVE' : 'SQUAWK OFF'}
          </div>
          <div style={{ fontSize: 7, color: 'var(--t-text-disabled)', fontFamily: 'var(--t-font-mono)' }}>
            {squawkEnabled ? 'Audio alerts active' : 'Click to enable audio'}
          </div>
        </div>
      </button>

      {/* News list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {NEWS_FEED.map((item, i) => {
          const cfg = IMPACT[item.impact] ?? IMPACT.low
          const isHigh = item.impact === 'high'
          return (
            <div key={item.id}
              style={{
                padding: '7px 10px', borderBottom: '0.5px solid var(--t-border-subtle)',
                background: cfg.lineBg, cursor: 'pointer', transition: 'background 80ms',
                borderLeft: `2px solid ${isHigh ? '#ef444430' : 'transparent'}`,
                animation: i < 2 ? `t-fade-in ${0.15 + i * 0.05}s ease-out both` : 'none',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--t-surface-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = cfg.lineBg}
            >
              {/* Meta row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: cfg.dot, display: 'inline-block', flexShrink: 0, boxShadow: isHigh ? `0 0 4px ${cfg.dot}99` : 'none' }}/>
                <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.5px', color: cfg.dot, fontFamily: 'var(--t-font-mono)' }}>{item.tag}</span>
                <span style={{ fontSize: 7, color: 'var(--t-text-disabled)', fontFamily: 'var(--t-font-mono)', marginLeft: 'auto', flexShrink: 0 }}>{item.time}</span>
              </div>
              {/* Title */}
              <p style={{ fontSize: 9, lineHeight: 1.55, color: isHigh ? 'var(--t-text-secondary)' : 'var(--t-text-muted)', fontFamily: 'var(--t-font-sans)' }}>
                {item.title}
              </p>
              {/* Source */}
              <div style={{ fontSize: 7, color: 'var(--t-text-disabled)', marginTop: 2, fontFamily: 'var(--t-font-mono)' }}>{item.source}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
