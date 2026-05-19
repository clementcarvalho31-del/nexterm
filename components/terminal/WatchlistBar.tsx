'use client'
import { useTerminalStore } from '@/store/terminal'
import { PAIRS } from '@/lib/data'

export function WatchlistBar() {
  const ticks         = useTerminalStore(s => s.ticks)
  const selectedSym   = useTerminalStore(s => s.selectedSymbol)
  const setSymbol     = useTerminalStore(s => s.setSelectedSymbol)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', height: 36, flexShrink: 0,
      background: 'var(--t-surface-panel)',
      borderBottom: '0.5px solid var(--t-border-default)',
      overflowX: 'auto', overflowY: 'hidden', padding: '0 6px', gap: 1,
    }}>
      {PAIRS.map(pair => {
        const tick      = ticks[pair.name]
        const price     = tick?.price     ?? pair.price
        const changePct = tick?.changePct ?? pair.changePct
        const isUp      = changePct >= 0
        const isSel     = pair.name === selectedSym
        const dec       = pair.pip < 0.001 ? 3 : 5
        const upColor   = 'var(--t-market-up)'
        const dnColor   = 'var(--t-market-down)'
        const priceColor = isUp ? upColor : dnColor

        return (
          <button key={pair.name} onClick={() => setSymbol(pair.name)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '0 11px',
              height: 28, cursor: 'pointer', borderRadius: 5, flexShrink: 0,
              fontFamily: 'var(--t-font-mono)',
              background:   isSel ? 'var(--t-surface-active)'  : 'transparent',
              border:       isSel ? '0.5px solid var(--t-border-strong)' : '0.5px solid transparent',
              transition:   'all 100ms',
              borderBottom: isSel ? '1.5px solid var(--t-accent-primary)' : '1.5px solid transparent',
            }}
            onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'var(--t-surface-hover)' }}
            onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent' }}
          >
            {/* Symbol */}
            <span style={{ fontSize: 10, fontWeight: isSel ? 700 : 600, letterSpacing: '0.3px', color: isSel ? 'var(--t-text-heading)' : 'var(--t-text-secondary)' }}>
              {pair.name}
            </span>

            {/* Price */}
            <span style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums', color: priceColor, fontWeight: isSel ? 600 : 400, transition: 'color 300ms' }}>
              {price.toFixed(dec)}
            </span>

            {/* Change % */}
            <span style={{ fontSize: 9, color: priceColor, opacity: 0.8, fontVariantNumeric: 'tabular-nums' }}>
              {isUp ? '+' : ''}{changePct.toFixed(2)}%
            </span>

            {/* Direction dot */}
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: priceColor, display: 'inline-block', opacity: 0.7, flexShrink: 0 }}/>
          </button>
        )
      })}

      {/* Add pair */}
      <button style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 28, height: 28, borderRadius: 5, flexShrink: 0,
        background: 'transparent', border: '0.5px solid transparent',
        color: 'var(--t-text-muted)', fontSize: 16, cursor: 'pointer',
        marginLeft: 4, transition: 'all 120ms',
      }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--t-surface-hover)'; e.currentTarget.style.color = 'var(--t-text-secondary)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t-text-muted)'; }}
      >+</button>
    </div>
  )
}
