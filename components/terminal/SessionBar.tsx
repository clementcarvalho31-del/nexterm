'use client'
import { TRADING_SESSIONS, TICKER_ITEMS } from '@/lib/data'
import { isSessionActive } from '@/lib/utils'

function SessionPill({ name, startUTC, endUTC, color }: { name: string; startUTC: number; endUTC: number; color: string }) {
  const active = isSessionActive(startUTC, endUTC)
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', height: '100%',
      borderRight: '1px solid rgba(255,255,255,.04)', flexShrink: 0,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: active ? color : '#1e2c3a',
        display: 'inline-block', flexShrink: 0,
        boxShadow: active ? `0 0 6px ${color}88` : 'none',
        transition: 'all 300ms',
      }} />
      <span style={{
        fontSize: 9, fontWeight: active ? 600 : 400, fontFamily: 'var(--font-mono)',
        color: active ? '#c8d6e5' : '#2d3f50', letterSpacing: '0.3px',
        transition: 'color 300ms',
      }}>{name}</span>
      <span style={{ fontSize: 8, color: '#1e2c3a', fontFamily: 'var(--font-mono)' }}>
        {startUTC}–{endUTC}
      </span>
    </div>
  )
}

export function SessionBar() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', height: 24, flexShrink: 0,
      background: '#04070f',
      borderBottom: '1px solid rgba(255,255,255,.04)',
    }}>
      {TRADING_SESSIONS.map(s => <SessionPill key={s.name} {...s} />)}

      {/* Next event */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px',
        borderRight: '1px solid rgba(255,255,255,.04)', height: '100%', flexShrink: 0,
      }}>
        <span style={{ fontSize: 8, color: '#1e2c3a', fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}>NEXT</span>
        <span style={{ fontSize: 8, color: '#f0b429', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>NFP 14:30 UTC</span>
        <span style={{
          fontSize: 8, color: '#ef4444', fontFamily: 'var(--font-mono)',
          background: 'rgba(239,68,68,.08)', padding: '1px 4px', borderRadius: 2,
        }}>2h 14m</span>
      </div>

      {/* Ticker tape */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div style={{ display: 'flex', animation: 'ticker-scroll 90s linear infinite', whiteSpace: 'nowrap' }}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0 14px', borderRight: '1px solid rgba(255,255,255,.03)',
              fontSize: 8, flexShrink: 0,
            }}>
              <span style={{
                fontSize: 7, fontWeight: 700, letterSpacing: '0.5px',
                padding: '1px 4px', borderRadius: 2, fontFamily: 'var(--font-mono)',
              }} className={`tag-${item.cls}`}>{item.tag}</span>
              <span style={{ color: '#3d5060', fontFamily: 'var(--font-mono)' }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
