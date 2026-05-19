'use client'
import { useTerminalStore } from '@/store/terminal'
import { ThemeSwitcher }    from '@/src/design-system/themes/ThemeSwitcher'
import type { TabId }       from '@/src/types'

const NAV: { id: TabId; label: string; pulse?: string }[] = [
  { id: 'dashboard',   label: 'Trading' },
  { id: 'calendar',    label: 'Calendar',   pulse: '#ef4444' },
  { id: 'cot',         label: 'Sentiment',  pulse: '#a78bfa' },
  { id: 'worldbook',   label: 'Research' },
  { id: 'newsplay',    label: 'Event Trades' },
  { id: 'trackrecord', label: 'Track Record', pulse: '#FF6B00' },
]

export function TopBar() {
  const utcTime        = useTerminalStore(s => s.utcTime)
  const status         = useTerminalStore(s => s.status)
  const setCommandOpen = useTerminalStore(s => s.setCommandOpen)
  const activeTab      = useTerminalStore(s => s.activeTab)
  const setActiveTab   = useTerminalStore(s => s.setActiveTab)
  const isLive         = status === 'connected'

  return (
    <header style={{
      display: 'flex', alignItems: 'center', height: 46, padding: '0 20px',
      flexShrink: 0, gap: 0,
      background: 'linear-gradient(180deg, var(--t-surface-elevated) 0%, var(--t-surface-panel) 100%)',
      borderBottom: '1px solid var(--t-border-default)',
      position: 'relative',
    }}>

      {/* ── Logo ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 28, flexShrink: 0 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 7, flexShrink: 0,
          background: 'linear-gradient(145deg, #f0b429 0%, #c97d10 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 800, color: '#000',
          fontFamily: 'var(--t-font-sans)',
          boxShadow: '0 2px 12px rgba(240,180,41,.28), inset 0 1px 0 rgba(255,255,255,.35)',
        }}>N</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t-text-heading)', letterSpacing: '-0.4px', lineHeight: 1.1, fontFamily: 'var(--t-font-sans)' }}>
            Nexterm
          </div>
          <div style={{ fontSize: 8, fontWeight: 600, color: 'rgba(240,180,41,.5)', letterSpacing: '1.8px', fontFamily: 'var(--t-font-mono)' }}>
            INSTITUTIONAL FX
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav style={{ display: 'flex', alignItems: 'stretch', height: '100%', flex: 1, gap: 2 }}>

        {/* Home button */}
        <button
          onClick={() => { if (typeof window !== 'undefined') window.location.reload() }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px',
            background: 'transparent', border: 'none', borderBottom: '2px solid transparent',
            color: 'var(--t-text-muted)', fontSize: 12, fontFamily: 'var(--t-font-sans)',
            cursor: 'pointer', transition: 'all 140ms', letterSpacing: '-0.1px', flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--t-text-secondary)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--t-text-muted)' }}
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M1 6.5L7 1.5L13 6.5V12.5H9V9H5V12.5H1V6.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
          </svg>
          Accueil
        </button>

        {NAV.map(item => {
          const isActive = activeTab === item.id
          const accentColor = item.id === 'cot' ? '#a78bfa' : item.id === 'calendar' ? 'var(--t-accent-primary)' : 'var(--t-accent-primary)'
          return (
            <button key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '0 13px',
                background: isActive ? 'rgba(240,180,41,.04)' : 'transparent',
                border: 'none',
                borderBottom: isActive ? `2px solid ${accentColor}` : '2px solid transparent',
                color: isActive ? 'var(--t-text-heading)' : 'var(--t-text-muted)',
                fontSize: 12, fontWeight: isActive ? 600 : 400,
                fontFamily: 'var(--t-font-sans)', cursor: 'pointer',
                transition: 'all 140ms', letterSpacing: '-0.1px', flexShrink: 0,
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'var(--t-text-secondary)' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'var(--t-text-muted)' }}
            >
              {item.pulse && (
                <span style={{
                  width: 5, height: 5, borderRadius: '50%', background: item.pulse,
                  display: 'inline-block', flexShrink: 0,
                  boxShadow: `0 0 6px ${item.pulse}99`,
                  animation: 't-pulse 2s ease-in-out infinite',
                }}/>
              )}
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* ── Right ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>

        {/* Search */}
        <button
          onClick={() => setCommandOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px',
            borderRadius: 6, background: 'var(--t-surface-hover)',
            border: '0.5px solid var(--t-border-default)',
            color: 'var(--t-text-muted)', fontSize: 12, fontFamily: 'var(--t-font-sans)',
            cursor: 'pointer', transition: 'all 140ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--t-border-strong)'; e.currentTarget.style.color = 'var(--t-text-secondary)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--t-border-default)'; e.currentTarget.style.color = 'var(--t-text-muted)'; }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="5.5" cy="5.5" r="3.8" stroke="currentColor" strokeWidth="1.2"/>
            <line x1="8.5" y1="8.5" x2="11" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          Search
          <kbd style={{ fontSize: 9, padding: '1px 5px', background: 'var(--t-surface-active)', borderRadius: 3, color: 'var(--t-text-disabled)', fontFamily: 'var(--t-font-mono)', letterSpacing: '0' }}>⌘K</kbd>
        </button>

        {/* Live status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
          borderRadius: 5, background: isLive ? 'rgba(34,197,94,.06)' : 'var(--t-surface-hover)',
          border: `0.5px solid ${isLive ? 'rgba(34,197,94,.2)' : 'var(--t-border-default)'}`,
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: '50%', display: 'inline-block',
            background: isLive ? 'var(--t-status-live)' : 'var(--t-status-danger)',
            animation: isLive ? 't-pulse-dot 2s ease-in-out infinite' : 'none',
          }}/>
          <span style={{ fontSize: 9, fontFamily: 'var(--t-font-mono)', fontWeight: 600, letterSpacing: '0.5px', color: isLive ? 'var(--t-status-live)' : 'var(--t-text-muted)' }}>
            {isLive ? 'LIVE' : 'OFF'}
          </span>
        </div>

        {/* UTC time */}
        <span style={{ fontSize: 11, fontFamily: 'var(--t-font-mono)', color: 'var(--t-text-muted)', letterSpacing: '0.4px', fontVariantNumeric: 'tabular-nums', minWidth: 82 }}>
          {utcTime}
        </span>

        {/* Theme switcher */}
        <ThemeSwitcher compact />

        {/* Pro CTA */}
        <button style={{
          padding: '5px 14px', borderRadius: 6, fontSize: 11, fontWeight: 700,
          background: 'linear-gradient(135deg, #f0b429 0%, #c97d10 100%)',
          color: '#000', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--t-font-sans)', letterSpacing: '0.1px',
          boxShadow: '0 1px 10px rgba(240,180,41,.22), inset 0 1px 0 rgba(255,255,255,.25)',
          transition: 'opacity 140ms, transform 140ms',
        }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '.88'; e.currentTarget.style.transform = 'translateY(-0.5px)'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1';   e.currentTarget.style.transform = 'translateY(0)'; }}
        >Pro — $49/mo</button>

        {/* Avatar */}
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: '#fff',
          border: '1.5px solid var(--t-border-default)', transition: 'border-color 140ms',
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--t-border-focus)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--t-border-default)'}
        >C</div>
      </div>
    </header>
  )
}
