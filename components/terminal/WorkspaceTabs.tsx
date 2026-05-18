'use client'
import { motion } from 'framer-motion'
import { useTerminalStore } from '@/store/terminal'
import { WORKSPACE_TABS } from '@/lib/data'
import type { TabId } from '@/types'

export function WorkspaceTabs() {
  const activeTab    = useTerminalStore(s => s.activeTab)
  const setActiveTab = useTerminalStore(s => s.setActiveTab)
  return (
    <div style={{ display:'flex', alignItems:'center', gap:1, padding:'0 12px', background:'var(--t-surface-panel)', borderBottom:'0.5px solid var(--t-border-default)', height:36, flexShrink:0, overflowX:'auto' }}>
      {WORKSPACE_TABS.map(tab => {
        const isActive = tab.id === activeTab
        return (
          <button key={tab.id} onClick={()=>setActiveTab(tab.id as TabId)} style={{ position:'relative', padding:'4px 12px', borderRadius:5, fontSize:12, fontFamily:'var(--t-font-sans)', fontWeight:isActive?600:400, color:isActive?'var(--t-text-heading)':'var(--t-text-muted)', background:isActive?'var(--t-surface-hover)':'transparent', border:'none', cursor:'pointer', transition:'all 100ms', whiteSpace:'nowrap', flexShrink:0, letterSpacing:'-0.1px' }}
            onMouseEnter={e=>{ if(!isActive) e.currentTarget.style.color='var(--t-text-secondary)' }}
            onMouseLeave={e=>{ if(!isActive) e.currentTarget.style.color='var(--t-text-muted)' }}>
            {tab.label}
            {isActive && (
              <motion.div layoutId="tab-bar" style={{ position:'absolute', bottom:-1, left:8, right:8, height:2, background:'var(--t-accent-primary)', borderRadius:1 }} />
            )}
          </button>
        )
      })}
    </div>
  )
}
