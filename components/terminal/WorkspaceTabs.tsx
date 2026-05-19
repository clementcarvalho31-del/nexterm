'use client'
import { motion } from 'framer-motion'
import { useTerminalStore } from '@/store/terminal'
import { WORKSPACE_TABS } from '@/lib/data'
import type { TabId } from '@/src/types'

export function WorkspaceTabs() {
  const activeTab    = useTerminalStore(s => s.activeTab)
  const setActiveTab = useTerminalStore(s => s.setActiveTab)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', height: 34, flexShrink: 0,
      background: 'var(--t-surface-panel)',
      borderBottom: '0.5px solid var(--t-border-default)',
      padding: '0 10px', gap: 2, overflowX: 'auto',
    }}>
      {WORKSPACE_TABS.map(tab => {
        const isActive = tab.id === activeTab
        return (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as TabId)}
            style={{
              position: 'relative', display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 11px', borderRadius: 5, flexShrink: 0,
              background:   isActive ? 'var(--t-surface-hover)' : 'transparent',
              border:       isActive ? '0.5px solid var(--t-border-default)' : '0.5px solid transparent',
              color:        isActive ? 'var(--t-text-heading)'  : 'var(--t-text-muted)',
              fontSize:     11, fontWeight: isActive ? 600 : 400,
              fontFamily:   'var(--t-font-sans)', cursor: 'pointer',
              transition:   'all 100ms', whiteSpace: 'nowrap',
              letterSpacing: '-0.1px',
            }}
            onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = 'var(--t-text-secondary)'; e.currentTarget.style.background = 'var(--t-surface-hover)'; } }}
            onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = 'var(--t-text-muted)';     e.currentTarget.style.background = 'transparent'; } }}
          >
            {tab.label}
            {isActive && (
              <motion.div
                layoutId="tab-bar"
                style={{
                  position: 'absolute', bottom: -1, left: 8, right: 8,
                  height: 1.5, background: 'var(--t-accent-primary)', borderRadius: 1,
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
