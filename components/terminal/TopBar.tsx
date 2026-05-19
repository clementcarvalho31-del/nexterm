'use client'
import { useTerminalStore } from '@/store/terminal'
import { useState } from 'react'

const NAV = [
  { id: 'dashboard',   label: 'Trading' },
  { id: 'calendar',    label: 'Calendar',   dot: 'red' },
  { id: 'cot',         label: 'Research' },
  { id: 'worldbook',   label: 'Worldbook' },
  { id: 'newsplay',    label: 'Event Trades' },
] as const

export function TopBar() {
  const utcTime    = useTerminalStore(s => s.utcTime)
  const activeTab  = useTerminalStore(s => s.activeTab)
  const setTab     = useTerminalStore(s => s.setActiveTab)
  const [hover, setHover] = useState<string|null>(null)

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: 40, padding: '0 16px', flexShrink: 0,
      background: 'linear-gradient(180deg, #070b15 0%, #060912 100%)',
      borderBottom: '1px solid rgba(255,255,255,.055)',
      position: 'relative', zIndex: 100,
    }}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 26, height: 26,
            background: 'linear-gradient(135deg, #f0b429 0%, #c97d10 100%)',
            borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 800, color: '#000',
            boxShadow: '0 2px 12px rgba(240,180,41,.25), inset 0 1px 0 rgba(255,255,255,.3)',
            fontFamily: 'var(--font-sans)',
          }}>N</div>
          <span style={{
            fontSize: 13, fontWeight: 700, color: '#f0f4f8',
            letterSpacing: '-0.3px', fontFamily: 'var(--font-sans)',
          }}>Nexterm</span>
          <span style={{
            fontSize: 8, fontWeight: 600, color: 'rgba(240,180,41,.6)',
            letterSpacing: '1.5px', fontFamily: 'var(--font-mono)',
            padding: '1px 5px', background: 'rgba(240,180,41,.06)',
            border: '0.5px solid rgba(240,180,41,.15)', borderRadius: 2,
          }}>INSTITUTIONAL FX</span>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', gap: 1 }}>
          {NAV.map(item => {
            const isActive = activeTab === item.id
            const isHover  = hover === item.id
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id as any)}
                onMouseEnter={() => setHover(item.id)}
                onMouseLeave={() => setHover(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '0 12px', height: 40,
                  background: 'transparent', border: 'none',
                  borderBottom: isActive ? '1.5px solid #f0b429' : '1.5px solid transparent',
                  color: isActive ? '#f0f4f8' : isHover ? '#c8d6e5' : '#4a5e72',
                  fontSize: 11, fontWeight: isActive ? 600 : 400,
                  fontFamily: 'var(--font-sans)', cursor: 'pointer',
                  transition: 'all 150ms ease', letterSpacing: '-0.1px',
                }}
              >
                {('dot' in item) && (
                  <span style={{
                    width: 4, height: 4, borderRadius: '50%', background: '#ef4444',
                    display: 'inline-block', boxShadow: '0 0 5px rgba(239,68,68,.7)',
                    animation: 'pulse-live 2s ease-in-out infinite',
                  }} />
                )}
                {item.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,.04)', border: '0.5px solid rgba(255,255,255,.08)',
          borderRadius: 5, padding: '4px 10px', cursor: 'pointer',
          transition: 'all 150ms',
        }}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <circle cx="5" cy="5" r="3.5" stroke="#3d5060" strokeWidth="1.2"/>
            <line x1="7.5" y1="7.5" x2="10" y2="10" stroke="#3d5060" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: 10, color: '#2d3f50', fontFamily: 'var(--font-sans)' }}>Search</span>
          <kbd style={{
            fontSize: 8, color: '#1e2c3a', fontFamily: 'var(--font-mono)',
            background: 'rgba(255,255,255,.04)', padding: '1px 4px', borderRadius: 3,
          }}>⌘K</kbd>
        </div>

        {/* Status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '3px 8px', borderRadius: 4,
          background: 'rgba(34,197,94,.05)', border: '0.5px solid rgba(34,197,94,.15)',
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: '50%', background: '#22c55e',
            display: 'inline-block', animation: 'pulse-live 2s ease-in-out infinite',
          }} />
          <span style={{ fontSize: 9, color: '#22c55e', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>LIVE</span>
        </div>

        {/* Time */}
        <span style={{
          fontSize: 10, color: '#3d5060', fontFamily: 'var(--font-mono)',
          letterSpacing: '0.3px', fontVariantNumeric: 'tabular-nums', minWidth: 78,
        }}>{utcTime}</span>

        {/* Subscribe */}
        <button style={{
          padding: '5px 12px', borderRadius: 5, fontSize: 10, fontWeight: 700,
          background: 'linear-gradient(135deg, #f0b429 0%, #c97d10 100%)',
          color: '#000', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)',
          letterSpacing: '0.2px', boxShadow: '0 1px 8px rgba(240,180,41,.2)',
          transition: 'opacity 150ms',
        }}
          onMouseEnter={e => e.currentTarget.style.opacity='0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity='1'}
        >Pro — $49/mo</button>

        {/* Avatar */}
        <div style={{
          width: 26, height: 26, borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 700, color: '#fff', cursor: 'pointer',
          border: '1px solid rgba(255,255,255,.12)',
        }}>C</div>
      </div>
    </header>
  )
}
