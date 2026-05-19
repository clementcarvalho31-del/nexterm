'use client'
import { useTerminalStore } from '@/store/terminal'
import { formatPrice } from '@/lib/utils'
import { PAIRS } from '@/lib/data'

export function WatchlistBar() {
  const pairs          = useTerminalStore(s => s.pairs)
  const selectedIdx    = useTerminalStore(s => s.selectedPairIndex)
  const selectPair     = useTerminalStore(s => s.selectPair)

  return (
    <div style={{
      display: 'flex', alignItems: 'stretch', height: 34, flexShrink: 0,
      background: 'linear-gradient(180deg, #060a14 0%, #050810 100%)',
      borderBottom: '1px solid rgba(255,255,255,.05)',
      overflowX: 'auto', overflowY: 'hidden',
    }}>
      {pairs.map((pair, i) => {
        const isUp  = pair.changePct >= 0
        const isSel = i === selectedIdx
        const pip   = PAIRS[i].pip
        const color = isUp ? '#22c55e' : '#ef4444'

        return (
          <button key={pair.name} onClick={() => selectPair(i)} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px',
            borderRight: '1px solid rgba(255,255,255,.04)',
            borderBottom: isSel ? '1.5px solid #f0b429' : '1.5px solid transparent',
            background: isSel ? 'rgba(240,180,41,.04)' : 'transparent',
            cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 120ms',
            flexShrink: 0,
          }}
            onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'rgba(255,255,255,.025)' }}
            onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent' }}
          >
            {/* Pair name */}
            <span style={{
              fontSize: 10, fontWeight: 700, color: isSel ? '#f0f4f8' : '#8a9db5',
              fontFamily: 'var(--font-mono)', letterSpacing: '0.2px',
            }}>{pair.name}</span>

            {/* Price */}
            <span style={{
              fontSize: 11, fontWeight: 600, color: color,
              fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums',
              transition: 'color 300ms',
            }}>{formatPrice(pair.price, pip)}</span>

            {/* Change */}
            <span style={{
              fontSize: 9, color: color, fontFamily: 'var(--font-mono)',
              fontVariantNumeric: 'tabular-nums',
            }}>{isUp ? '+' : ''}{pair.changePct.toFixed(2)}%</span>

            {/* Mini indicator */}
            <span style={{
              width: 3, height: 3, borderRadius: '50%', background: color,
              display: 'inline-block', opacity: 0.7,
            }} />
          </button>
        )
      })}

      {/* Add pair button */}
      <button style={{
        padding: '0 12px', color: '#2d3f50', fontSize: 14,
        background: 'transparent', border: 'none', cursor: 'pointer',
        borderLeft: '1px solid rgba(255,255,255,.04)', flexShrink: 0,
        transition: 'color 150ms',
      }}
        onMouseEnter={e => e.currentTarget.style.color = '#5a7080'}
        onMouseLeave={e => e.currentTarget.style.color = '#2d3f50'}
      >+</button>
    </div>
  )
}
