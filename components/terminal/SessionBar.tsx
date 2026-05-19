'use client'
import { TRADING_SESSIONS, TICKER_ITEMS } from '@/lib/data'
import { isSessionActive } from '@/lib/utils'

export function SessionBar() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', height: 26, flexShrink: 0,
      background: 'var(--t-surface-base)',
      borderBottom: '0.5px solid var(--t-border-subtle)',
      overflow: 'hidden',
    }}>

      {/* ── Sessions ── */}
      {TRADING_SESSIONS.map(s => {
        const active = isSessionActive(s.startUTC, s.endUTC)
        return (
          <div key={s.name} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '0 10px', height: '100%', flexShrink: 0,
            borderRight: '0.5px solid var(--t-border-subtle)',
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              background: active ? s.color : 'rgba(255,255,255,.1)',
              display: 'inline-block', flexShrink: 0,
              boxShadow: active ? `0 0 7px ${s.color}88` : 'none',
              transition: 'all 300ms',
              animation: active ? 't-pulse 3s ease-in-out infinite' : 'none',
            }}/>
            <span style={{
              fontSize: 9, fontFamily: 'var(--t-font-mono)',
              color: active ? 'var(--t-text-secondary)' : 'var(--t-text-disabled)',
              fontWeight: active ? 600 : 400, letterSpacing: '0.3px',
              transition: 'color 300ms',
            }}>{s.name}</span>
            <span style={{ fontSize: 8, color: 'var(--t-text-disabled)', fontFamily: 'var(--t-font-mono)' }}>
              {s.startUTC}–{s.endUTC}
            </span>
          </div>
        )
      })}

      {/* ── Next event ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px',
        borderRight: '0.5px solid var(--t-border-subtle)', height: '100%', flexShrink: 0,
      }}>
        <span style={{ fontSize: 8, color: 'var(--t-text-disabled)', fontFamily: 'var(--t-font-mono)', letterSpacing: '0.5px' }}>NEXT</span>
        <span style={{ fontSize: 9, color: 'var(--t-accent-primary)', fontFamily: 'var(--t-font-mono)', fontWeight: 600 }}>NFP 14:30 UTC</span>
        <span style={{
          fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
          background: 'rgba(239,68,68,.1)', color: 'var(--t-status-danger)',
          fontFamily: 'var(--t-font-mono)', border: '0.5px solid rgba(239,68,68,.2)',
          animation: 't-pulse 2s ease-in-out infinite',
        }}>2h 14m</span>
      </div>

      {/* ── Ticker tape ── */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div style={{ display: 'flex', animation: 't-scroll-x 60s linear infinite', whiteSpace: 'nowrap' }}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0 14px', borderRight: '0.5px solid var(--t-border-subtle)',
              fontSize: 9, fontFamily: 'var(--t-font-mono)', flexShrink: 0,
            }}>
              <span style={{
                fontSize: 7, fontWeight: 700, padding: '1px 4px', borderRadius: 2, letterSpacing: '0.4px',
                background: item.cls === 'th' ? 'var(--t-impact-high-bg)' : item.cls === 'tm' ? 'var(--t-impact-med-bg)' : 'var(--t-impact-low-bg)',
                color:      item.cls === 'th' ? 'var(--t-impact-high)'    : item.cls === 'tm' ? 'var(--t-impact-med)'    : 'var(--t-impact-low)',
              }}>{item.tag}</span>
              <span style={{ color: 'var(--t-text-muted)' }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
