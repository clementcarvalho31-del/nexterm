'use client'
import { useTerminalStore } from '@/store/terminal'
import { WORKSPACE_TABS } from '@/lib/data'
import type { TabId } from '@/types'

const ICONS: Record<string, string> = {
  dashboard:   '◈',
  cot:         '⟁',
  calendar:    '◷',
  newsplay:    '◎',
  seasonality: '∿',
  worldbook:   '◉',
  liquidity:   '≋',
}

export function WorkspaceTabs() {
  const activeTab    = useTerminalStore(s => s.activeTab)
  const setActiveTab = useTerminalStore(s => s.setActiveTab)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', height: 32, flexShrink: 0,
      background: '#050810', borderBottom: '1px solid rgba(255,255,255,.05)',
      padding: '0 8px', gap: 2,
    }}>
      {WORKSPACE_TABS.map(tab => {
        const isActive = activeTab === tab.id
        return (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as TabId)} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 4,
            background: isActive ? 'rgba(240,180,41,.07)' : 'transparent',
            border: `0.5px solid ${isActive ? 'rgba(240,180,41,.2)' : 'transparent'}`,
            color: isActive ? '#f0b429' : '#2d3f50',
            fontSize: 9, fontWeight: isActive ? 600 : 400,
            fontFamily: 'var(--font-mono)', letterSpacing: '0.5px',
            cursor: 'pointer', transition: 'all 120ms', whiteSpace: 'nowrap',
          }}
            onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color='#6a7d8f'; e.currentTarget.style.background='rgba(255,255,255,.025)' } }}
            onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color='#2d3f50'; e.currentTarget.style.background='transparent' } }}
          >
            <span style={{ fontSize: 10, opacity: 0.7 }}>{ICONS[tab.id] || '○'}</span>
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
