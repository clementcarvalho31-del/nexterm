'use client'
import { useTerminalStore } from '@/store/terminal'
import { PAIRS } from '@/lib/data'

export function WatchlistBar() {
  const ticks = useTerminalStore(s => s.ticks)
  const selectedSymbol = useTerminalStore(s => s.selectedSymbol)
  const setSymbol = useTerminalStore(s => s.setSelectedSymbol)

  return (
    <div style={{ display:'flex', alignItems:'center', background:'var(--t-surface-panel)', borderBottom:'0.5px solid var(--t-border-default)', height:38, overflowX:'auto', flexShrink:0, padding:'0 4px', gap:1 }}>
      {PAIRS.map(pair => {
        const tick = ticks[pair.name]
        const price = tick?.price ?? pair.price
        const changePct = tick?.changePct ?? pair.changePct
        const isUp = changePct >= 0
        const isSelected = pair.name === selectedSymbol
        const dec = pair.pip < 0.001 ? 3 : 5

        return (
          <button key={pair.name} onClick={() => setSymbol(pair.name)}
            style={{
              display:'flex', alignItems:'center', gap:8, padding:'0 10px',
              height:30, cursor:'pointer', borderRadius:5,
              background:   isSelected ? 'var(--t-surface-hover)' : 'transparent',
              border:       isSelected ? '0.5px solid var(--t-border-default)' : '0.5px solid transparent',
              fontFamily:   'var(--t-font-mono)', whiteSpace:'nowrap',
              transition:   'all 120ms',
            }}
            onMouseEnter={e=>{ if(!isSelected) e.currentTarget.style.background='var(--t-surface-hover)' }}
            onMouseLeave={e=>{ if(!isSelected) e.currentTarget.style.background='transparent' }}
          >
            <span style={{ fontSize:11, fontWeight:600, color: isSelected ? 'var(--t-text-heading)' : 'var(--t-text-secondary)', letterSpacing:'0.2px' }}>
              {pair.name}
            </span>
            <span style={{ fontSize:11, fontVariantNumeric:'tabular-nums', color: isUp ? 'var(--t-market-up)' : 'var(--t-market-down)', fontWeight: isSelected ? 600 : 400 }}>
              {price.toFixed(dec)}
            </span>
            <span style={{ fontSize:10, color: isUp ? 'var(--t-market-up)' : 'var(--t-market-down)', opacity:0.8 }}>
              {isUp?'+':''}{changePct.toFixed(2)}%
            </span>
          </button>
        )
      })}
    </div>
  )
}
