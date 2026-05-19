'use client'
import { BANK_RESEARCH, SENTIMENT_DATA, PROP_INDICATORS, PAIR_BIASES } from '@/lib/data'

function Block({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <div style={{ flexShrink: 0 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 10px', height: 28, flexShrink: 0,
        background: 'var(--t-surface-elevated)',
        borderBottom: '0.5px solid var(--t-border-default)',
        borderTop: '0.5px solid var(--t-border-default)',
      }}>
        <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '1.2px', color: 'var(--t-text-muted)', fontFamily: 'var(--t-font-mono)', textTransform: 'uppercase' }}>
          {title}
        </span>
        {count !== undefined && (
          <span style={{ fontSize: 7, color: 'var(--t-text-disabled)', fontFamily: 'var(--t-font-mono)' }}>{count}</span>
        )}
      </div>
      {children}
    </div>
  )
}

export function RightSidebar() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--t-surface-base)', overflowY: 'auto' }}>

      {/* ── Retail Sentiment ── */}
      <Block title="Retail Sentiment" count={SENTIMENT_DATA.length}>
        <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 7 }}>
          {SENTIMENT_DATA.map(d => (
            <div key={d.pair}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--t-text-secondary)', fontFamily: 'var(--t-font-mono)' }}>{d.pair}</span>
                <div style={{ display: 'flex', gap: 5 }}>
                  <span style={{ fontSize: 8, fontWeight: 600, color: 'var(--t-market-up)', fontFamily: 'var(--t-font-mono)' }}>{d.longPct}%L</span>
                  <span style={{ fontSize: 8, fontWeight: 600, color: 'var(--t-market-down)', fontFamily: 'var(--t-font-mono)' }}>{d.shortPct}%S</span>
                </div>
              </div>
              <div style={{ height: 3, borderRadius: 2, background: 'var(--t-surface-hover)', overflow: 'hidden', position: 'relative' }}>
                <div style={{ height: '100%', width: `${d.longPct}%`, background: 'var(--t-market-up)', opacity: 0.5, borderRadius: '2px 0 0 2px', transition: 'width 500ms' }}/>
                <div style={{ position: 'absolute', top: 0, right: 0, height: '100%', width: `${d.shortPct}%`, background: 'var(--t-market-down)', opacity: 0.5, borderRadius: '0 2px 2px 0' }}/>
              </div>
            </div>
          ))}
          <div style={{ paddingTop: 5, borderTop: '0.5px solid var(--t-border-subtle)', fontSize: 7, color: 'var(--t-text-disabled)', fontFamily: 'var(--t-font-mono)' }}>
            IG · OANDA · Myfxbook · 15m delay
          </div>
        </div>
      </Block>

      {/* ── Prop Indicators ── */}
      <Block title="Prop. Indicators">
        <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          {PROP_INDICATORS.map(ind => (
            <div key={ind.name} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 8, color: 'var(--t-text-muted)', flex: 1, fontFamily: 'var(--t-font-sans)' }}>{ind.name}</span>
              <div style={{ width: 46, height: 3, borderRadius: 2, background: 'var(--t-surface-active)', overflow: 'hidden', flexShrink: 0 }}>
                <div style={{ height: '100%', width: `${(ind.value / ind.max) * 100}%`, background: ind.color, borderRadius: 2, transition: 'width 500ms' }}/>
              </div>
              <span style={{ fontSize: 8, fontWeight: 700, color: ind.color, fontFamily: 'var(--t-font-mono)', width: 18, textAlign: 'right', flexShrink: 0 }}>{ind.value}</span>
            </div>
          ))}
        </div>
      </Block>

      {/* ── Pair Bias ── */}
      <Block title="Directional Bias">
        <div style={{ padding: '7px 10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
          {PAIR_BIASES.map(b => {
            const c = b.direction === 'Bullish' ? 'var(--t-market-up)' : b.direction === 'Bearish' ? 'var(--t-market-down)' : 'var(--t-accent-primary)'
            const rawC = b.direction === 'Bullish' ? '#22c55e' : b.direction === 'Bearish' ? '#ef4444' : '#f0b429'
            const arrow = b.direction === 'Bullish' ? '▲' : b.direction === 'Bearish' ? '▼' : '→'
            return (
              <div key={b.pair} style={{
                padding: '6px 7px', borderRadius: 5,
                background: `${rawC}08`,
                border: `0.5px solid ${rawC}20`,
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--t-text-secondary)', fontFamily: 'var(--t-font-mono)', marginBottom: 3 }}>{b.pair}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 10, color: c }}>{arrow}</span>
                  <span style={{ fontSize: 8, fontWeight: 600, color: c }}>{b.confidence}%</span>
                </div>
              </div>
            )
          })}
        </div>
      </Block>

      {/* ── Bank Research ── */}
      <Block title="Bank Research" count={BANK_RESEARCH.length}>
        <div>
          {BANK_RESEARCH.map((b, i) => {
            const dc = b.direction === 'BUY' ? '#22c55e' : b.direction === 'SELL' ? '#ef4444' : '#f0b429'
            return (
              <div key={i}
                style={{
                  padding: '7px 10px', borderBottom: '0.5px solid var(--t-border-subtle)',
                  cursor: 'pointer', transition: 'background 80ms',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--t-surface-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 8, fontWeight: 700, color: 'var(--t-accent-primary)', fontFamily: 'var(--t-font-mono)' }}>{b.bank}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 8, color: 'var(--t-text-disabled)', fontFamily: 'var(--t-font-mono)' }}>{b.pair}</span>
                    <span style={{ fontSize: 7, fontWeight: 700, padding: '1px 4px', borderRadius: 2, background: `${dc}12`, color: dc, border: `0.5px solid ${dc}28`, fontFamily: 'var(--t-font-mono)' }}>{b.direction}</span>
                  </div>
                </div>
                <p style={{ fontSize: 8, color: 'var(--t-text-muted)', lineHeight: 1.55, fontFamily: 'var(--t-font-sans)' }}>{b.view}</p>
              </div>
            )
          })}
        </div>
      </Block>
    </div>
  )
}
