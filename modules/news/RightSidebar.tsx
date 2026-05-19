'use client'
import { BANK_RESEARCH, SENTIMENT_DATA, PROP_INDICATORS, PAIR_BIASES } from '@/lib/data'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ flexShrink: 0 }}>
      <div style={{
        padding: '4px 10px', borderBottom: '1px solid rgba(255,255,255,.04)',
        display: 'flex', alignItems: 'center', gap: 5,
        background: 'rgba(255,255,255,.01)',
      }}>
        <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: '1.5px', color: '#2d3f50', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

export function RightSidebar() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#04070f', overflowY: 'auto' }}>

      {/* Retail Sentiment */}
      <Section title="Retail Sentiment">
        <div style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {SENTIMENT_DATA.map(d => {
            const isLong = d.longPct > 50
            return (
              <div key={d.pair}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 9, fontWeight: 600, color: '#c8d6e5', fontFamily: 'var(--font-mono)' }}>{d.pair}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <span style={{ fontSize: 8, color: '#22c55e', fontFamily: 'var(--font-mono)' }}>{d.longPct}%L</span>
                    <span style={{ fontSize: 8, color: '#ef4444', fontFamily: 'var(--font-mono)' }}>{d.shortPct}%S</span>
                  </div>
                </div>
                <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,.05)', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ height: '100%', width: `${d.longPct}%`, background: 'rgba(34,197,94,.5)', borderRadius: '2px 0 0 2px', transition: 'width 500ms' }} />
                  <div style={{ position: 'absolute', top: 0, right: 0, height: '100%', width: `${d.shortPct}%`, background: 'rgba(239,68,68,.5)', borderRadius: '0 2px 2px 0' }} />
                </div>
              </div>
            )
          })}
          <div style={{ paddingTop: 4, borderTop: '1px solid rgba(255,255,255,.04)', fontSize: 7, color: '#1e2c3a', fontFamily: 'var(--font-mono)' }}>
            IG · OANDA · Myfxbook · Live 15m
          </div>
        </div>
      </Section>

      {/* Prop Indicators */}
      <Section title="Prop. Indicators">
        <div style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          {PROP_INDICATORS.map(ind => (
            <div key={ind.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 8, color: '#5a7080', flex: 1, fontFamily: 'var(--font-sans)' }}>{ind.name}</span>
              <div style={{ width: 44, height: 3, borderRadius: 2, background: 'rgba(255,255,255,.05)', overflow: 'hidden', flexShrink: 0 }}>
                <div style={{ height: '100%', width: `${(ind.value/ind.max)*100}%`, background: ind.color, borderRadius: 2, transition: 'width 500ms' }} />
              </div>
              <span style={{ fontSize: 8, fontWeight: 700, color: ind.color, fontFamily: 'var(--font-mono)', width: 20, textAlign: 'right' }}>{ind.value}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Directional Bias */}
      <Section title="Pair Bias">
        <div style={{ padding: '6px 10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
          {PAIR_BIASES.map(b => {
            const c = b.direction === 'Bullish' ? '#22c55e' : b.direction === 'Bearish' ? '#ef4444' : '#f0b429'
            const arrow = b.direction === 'Bullish' ? '▲' : b.direction === 'Bearish' ? '▼' : '→'
            return (
              <div key={b.pair} style={{
                padding: '5px 6px', borderRadius: 4,
                background: 'rgba(255,255,255,.02)', border: '0.5px solid rgba(255,255,255,.05)',
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#c8d6e5', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>{b.pair}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span style={{ fontSize: 9, color: c }}>{arrow}</span>
                  <span style={{ fontSize: 8, color: c }}>{b.confidence}%</span>
                </div>
              </div>
            )
          })}
        </div>
      </Section>

      {/* Bank Research */}
      <Section title="Bank Research">
        <div>
          {BANK_RESEARCH.map((b, i) => {
            const dc = b.direction === 'BUY' ? '#22c55e' : b.direction === 'SELL' ? '#ef4444' : '#f0b429'
            return (
              <div key={i} style={{
                padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,.03)',
                cursor: 'pointer', transition: 'background 80ms',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.025)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 8, fontWeight: 700, color: '#f0b429', fontFamily: 'var(--font-mono)' }}>{b.bank}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 8, color: '#3d5060', fontFamily: 'var(--font-mono)' }}>{b.pair}</span>
                    <span style={{
                      fontSize: 7, fontWeight: 700, color: dc, padding: '1px 4px',
                      background: `${dc}15`, border: `0.5px solid ${dc}30`, borderRadius: 2,
                      fontFamily: 'var(--font-mono)',
                    }}>{b.direction}</span>
                  </div>
                </div>
                <p style={{ fontSize: 8, color: '#5a7080', lineHeight: 1.5, fontFamily: 'var(--font-sans)' }}>{b.view}</p>
              </div>
            )
          })}
        </div>
      </Section>
    </div>
  )
}
